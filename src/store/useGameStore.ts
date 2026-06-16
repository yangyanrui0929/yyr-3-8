import { create } from 'zustand';
import {
  GridCell,
  ToolType,
  GRID_SIZE,
  DAY_LENGTH,
  FAULT_CHANCE,
  BUILDING_STATS,
  DAY_THRESHOLD,
  Complaint,
  RUMOR_SPREAD_CHANCE,
  RUMOR_DECAY_RATE,
  RUMOR_UNPOWERED_THRESHOLD,
  RUMOR_PER_UNPOWERED_TICK,
  RUMOR_SPREAD_AMOUNT,
  TRUST_DECAY_FROM_RUMOR,
  TRUST_RECOVERY_RATE,
  ANNOUNCEMENT_RUMOR_REDUCTION,
  ANNOUNCEMENT_COOLDOWN,
  MAX_COMPLAINTS,
  COMPLAINT_MESSAGES,
  DIR_OFFSETS,
} from '../utils/constants';
import { calculatePowerNetwork, countPoweredBuildings } from '../utils/powerCalculator';

const STORAGE_KEY = 'floating-island-grid-game-save';

interface PersistedState {
  grid: GridCell[][];
  dayTime: number;
  storedPower: number;
  satisfaction: number;
  trust: number;
  complaints: Complaint[];
  announcementCooldown: number;
  complaintIdCounter: number;
}

interface GameState {
  grid: GridCell[][];
  dayTime: number;
  storedPower: number;
  maxStorage: number;
  satisfaction: number;
  trust: number;
  selectedTool: ToolType;
  poweredCells: Set<string>;
  totalGeneration: number;
  totalConsumption: number;
  showSettlement: boolean;
  complaints: Complaint[];
  announcementCooldown: number;
  highlightedCell: { x: number; y: number } | null;
  setSelectedTool: (tool: ToolType) => void;
  placeOrRemove: (x: number, y: number) => void;
  rotateCell: (x: number, y: number) => void;
  repairCell: (x: number, y: number) => void;
  tick: () => void;
  resetGame: () => void;
  openSettlement: () => void;
  closeSettlement: () => void;
  issueAnnouncement: () => void;
  getAverageRumorLevel: () => number;
  focusComplaintLocation: (x: number, y: number) => void;
  clearHighlight: () => void;
  getDissipationProgress: () => Array<{ x: number; y: number; progress: number; rumorLevel: number; peakRumor: number }>;
}

function createEmptyGrid(): GridCell[][] {
  const grid: GridCell[][] = [];
  for (let y = 0; y < GRID_SIZE; y++) {
    const row: GridCell[] = [];
    for (let x = 0; x < GRID_SIZE; x++) {
      row.push({
        x,
        y,
        type: 'empty',
        rotation: 0,
        powered: false,
        faulty: false,
        rumorLevel: 0,
        peakRumorLevel: 0,
        unpoweredTicks: 0,
      });
    }
    grid.push(row);
  }
  return grid;
}

function saveToLocalStorage(state: PersistedState): void {
  try {
    const data = JSON.stringify({
      grid: state.grid,
      dayTime: state.dayTime,
      storedPower: state.storedPower,
      satisfaction: state.satisfaction,
      trust: state.trust,
      complaints: state.complaints,
      announcementCooldown: state.announcementCooldown,
      complaintIdCounter: state.complaintIdCounter,
    });
    localStorage.setItem(STORAGE_KEY, data);
  } catch {
    // ignore storage errors
  }
}

function loadFromLocalStorage(): PersistedState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (data && data.grid && Array.isArray(data.grid)) {
      const grid = data.grid.map((row: GridCell[]) =>
        row.map((cell) => ({
          ...cell,
          rumorLevel: cell.rumorLevel ?? 0,
          peakRumorLevel: cell.peakRumorLevel ?? 0,
          unpoweredTicks: cell.unpoweredTicks ?? 0,
        }))
      );
      return {
        grid,
        dayTime: data.dayTime ?? 20,
        storedPower: data.storedPower ?? 10,
        satisfaction: data.satisfaction ?? 50,
        trust: data.trust ?? 100,
        complaints: data.complaints ?? [],
        announcementCooldown: data.announcementCooldown ?? 0,
        complaintIdCounter: data.complaintIdCounter ?? 0,
      };
    }
  } catch {
    // ignore parse errors
  }
  return null;
}

function recalcGrid(grid: GridCell[][], dayTime: number, storedPower: number) {
  const { poweredCells, totalGeneration, totalConsumption, batteryCapacity } =
    calculatePowerNetwork(grid, dayTime, storedPower);

  const newGrid = grid.map((row) => row.map((c) => ({ ...c })));
  for (let yy = 0; yy < GRID_SIZE; yy++) {
    for (let xx = 0; xx < GRID_SIZE; xx++) {
      newGrid[yy][xx].powered = poweredCells.has(`${xx},${yy}`);
    }
  }

  return { newGrid, poweredCells, totalGeneration, totalConsumption, batteryCapacity };
}

function initGame(): Omit<GameState, keyof GameStateActions> {
  const saved = loadFromLocalStorage();
  const grid = saved ? saved.grid : createEmptyGrid();
  const dayTime = saved ? saved.dayTime : 20;
  const storedPower = saved ? saved.storedPower : 10;
  const satisfaction = saved ? saved.satisfaction : 50;
  const trust = saved ? saved.trust : 100;
  const complaints = saved ? saved.complaints : [];
  const announcementCooldown = saved ? saved.announcementCooldown : 0;

  const { newGrid, poweredCells, totalGeneration, totalConsumption, batteryCapacity } =
    recalcGrid(grid, dayTime, storedPower);

  return {
    grid: newGrid,
    dayTime,
    storedPower,
    maxStorage: batteryCapacity,
    satisfaction,
    trust,
    selectedTool: 'windmill',
    poweredCells,
    totalGeneration,
    totalConsumption,
    showSettlement: false,
    complaints,
    announcementCooldown,
    highlightedCell: null,
  };
}

type GameStateActions = Pick<
  GameState,
  | 'setSelectedTool'
  | 'placeOrRemove'
  | 'rotateCell'
  | 'repairCell'
  | 'tick'
  | 'resetGame'
  | 'openSettlement'
  | 'closeSettlement'
  | 'issueAnnouncement'
  | 'getAverageRumorLevel'
  | 'focusComplaintLocation'
  | 'clearHighlight'
  | 'getDissipationProgress'
>;

export const useGameStore = create<GameState>((set, get) => ({
  ...initGame(),

  setSelectedTool: (tool) => set({ selectedTool: tool }),

  placeOrRemove: (x, y) => {
    const state = get();
    const newGrid = state.grid.map((row) => row.map((c) => ({ ...c })));
    const cell = newGrid[y][x];
    const tool = state.selectedTool;

    if (tool === 'remove') {
      if (cell.type !== 'empty') {
        newGrid[y][x] = {
          ...cell,
          type: 'empty',
          rotation: 0,
          powered: false,
          faulty: false,
          rumorLevel: 0,
          peakRumorLevel: 0,
          unpoweredTicks: 0,
        };
      }
    } else {
      newGrid[y][x] = {
        ...cell,
        type: tool,
        rotation: tool === 'wire' ? cell.rotation % 6 : 0,
        powered: false,
        faulty: false,
      };
    }

    const result = recalcGrid(newGrid, state.dayTime, state.storedPower);

    const nextState = {
      grid: result.newGrid,
      poweredCells: result.poweredCells,
      totalGeneration: result.totalGeneration,
      totalConsumption: result.totalConsumption,
      maxStorage: result.batteryCapacity,
    };

    saveToLocalStorage({
      grid: result.newGrid,
      dayTime: state.dayTime,
      storedPower: state.storedPower,
      satisfaction: state.satisfaction,
      trust: state.trust,
      complaints: state.complaints,
      announcementCooldown: state.announcementCooldown,
      complaintIdCounter: state.complaints.length > 0 
        ? Math.max(...state.complaints.map(c => c.id)) + 1 
        : 0,
    });

    set(nextState);
  },

  rotateCell: (x, y) => {
    const state = get();
    const cell = state.grid[y][x];
    if (cell.type !== 'wire') return;

    const newGrid = state.grid.map((row) => row.map((c) => ({ ...c })));
    newGrid[y][x].rotation = (cell.rotation + 1) % 6;

    const result = recalcGrid(newGrid, state.dayTime, state.storedPower);

    const nextState = {
      grid: result.newGrid,
      poweredCells: result.poweredCells,
      totalGeneration: result.totalGeneration,
      totalConsumption: result.totalConsumption,
      maxStorage: result.batteryCapacity,
    };

    saveToLocalStorage({
      grid: result.newGrid,
      dayTime: state.dayTime,
      storedPower: state.storedPower,
      satisfaction: state.satisfaction,
      trust: state.trust,
      complaints: state.complaints,
      announcementCooldown: state.announcementCooldown,
      complaintIdCounter: state.complaints.length > 0 
        ? Math.max(...state.complaints.map(c => c.id)) + 1 
        : 0,
    });

    set(nextState);
  },

  repairCell: (x, y) => {
    const state = get();
    const cell = state.grid[y][x];
    if (!cell.faulty) return;

    const newGrid = state.grid.map((row) => row.map((c) => ({ ...c })));
    newGrid[y][x].faulty = false;

    const result = recalcGrid(newGrid, state.dayTime, state.storedPower);

    const nextState = {
      grid: result.newGrid,
      poweredCells: result.poweredCells,
      totalGeneration: result.totalGeneration,
      totalConsumption: result.totalConsumption,
      maxStorage: result.batteryCapacity,
    };

    saveToLocalStorage({
      grid: result.newGrid,
      dayTime: state.dayTime,
      storedPower: state.storedPower,
      satisfaction: state.satisfaction,
      trust: state.trust,
      complaints: state.complaints,
      announcementCooldown: state.announcementCooldown,
      complaintIdCounter: state.complaints.length > 0 
        ? Math.max(...state.complaints.map(c => c.id)) + 1 
        : 0,
    });

    set(nextState);
  },

  tick: () => {
    const state = get();
    const newGrid = state.grid.map((row) => row.map((c) => ({ ...c })));
    let newComplaints = [...state.complaints];
    let complaintIdCounter = newComplaints.length > 0
      ? Math.max(...newComplaints.map(c => c.id)) + 1
      : 0;
    const newAnnouncementCooldown = Math.max(0, state.announcementCooldown - 1);

    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const cell = newGrid[y][x];
        if (cell.type !== 'empty' && !cell.faulty && Math.random() < FAULT_CHANCE) {
          newGrid[y][x].faulty = true;
        }
      }
    }

    const newDayTime = (state.dayTime + 0.5) % DAY_LENGTH;

    const { poweredCells, totalGeneration, totalConsumption, batteryCapacity } =
      calculatePowerNetwork(newGrid, newDayTime, state.storedPower);

    for (let yy = 0; yy < GRID_SIZE; yy++) {
      for (let xx = 0; xx < GRID_SIZE; xx++) {
        newGrid[yy][xx].powered = poweredCells.has(`${xx},${yy}`);
      }
    }

    let unpoweredHouseCount = 0;
    let totalUnpoweredSeverity = 0;
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const cell = newGrid[y][x];
        if (cell.type === 'house' && !cell.powered) {
          newGrid[y][x].unpoweredTicks = cell.unpoweredTicks + 1;
          unpoweredHouseCount++;
          totalUnpoweredSeverity += newGrid[y][x].unpoweredTicks;
          if (newGrid[y][x].unpoweredTicks >= RUMOR_UNPOWERED_THRESHOLD) {
            const rumorIncrease = RUMOR_PER_UNPOWERED_TICK;
            const newRumor = Math.min(100, cell.rumorLevel + rumorIncrease);
            newGrid[y][x].rumorLevel = newRumor;
            if (newRumor > cell.peakRumorLevel) {
              newGrid[y][x].peakRumorLevel = newRumor;
            }
            if (Math.random() < 0.1) {
              const complaint: Complaint = {
                id: complaintIdCounter++,
                x,
                y,
                severity: Math.min(100, cell.rumorLevel + rumorIncrease),
                timestamp: Date.now(),
                message: COMPLAINT_MESSAGES[Math.floor(Math.random() * COMPLAINT_MESSAGES.length)],
              };
              newComplaints.unshift(complaint);
              if (newComplaints.length > MAX_COMPLAINTS) {
                newComplaints = newComplaints.slice(0, MAX_COMPLAINTS);
              }
            }
          }
        } else if (cell.type === 'house' && cell.powered) {
          newGrid[y][x].unpoweredTicks = Math.max(0, cell.unpoweredTicks - 0.5);
        }
      }
    }

    const rumorSourceGrid = newGrid.map(row => row.map(c => c.rumorLevel));
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        if (rumorSourceGrid[y][x] > 20 && Math.random() < RUMOR_SPREAD_CHANCE) {
          for (const [dx, dy] of DIR_OFFSETS) {
            const nx = x + dx;
            const ny = y + dy;
            if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE) {
              const spreadAmount = rumorSourceGrid[y][x] * RUMOR_SPREAD_AMOUNT;
              const newRumor = Math.min(
                100,
                newGrid[ny][nx].rumorLevel + spreadAmount * 0.3
              );
              newGrid[ny][nx].rumorLevel = newRumor;
              if (newRumor > newGrid[ny][nx].peakRumorLevel) {
                newGrid[ny][nx].peakRumorLevel = newRumor;
              }
            }
          }
        }
      }
    }

    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const cell = newGrid[y][x];
        if (cell.type === 'broadcastTower' && cell.powered) {
          const stats = BUILDING_STATS.broadcastTower;
          const range = stats.rumorRange ?? 2;
          const reduction = stats.rumorReduction ?? 0.3;
          for (let dy = -range; dy <= range; dy++) {
            for (let dx = -range; dx <= range; dx++) {
              const nx = x + dx;
              const ny = y + dy;
              if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE) {
                const distance = Math.abs(dx) + Math.abs(dy);
                if (distance <= range) {
                  const falloff = 1 - distance / (range + 1);
                  newGrid[ny][nx].rumorLevel = Math.max(
                    0,
                    newGrid[ny][nx].rumorLevel - reduction * falloff * 2
                  );
                }
              }
            }
          }
        }
      }
    }

    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const cell = newGrid[y][x];
        if (cell.rumorLevel > 0) {
          const hasHouse = cell.type === 'house';
          const decayRate = hasHouse ? RUMOR_DECAY_RATE * 0.5 : RUMOR_DECAY_RATE;
          newGrid[y][x].rumorLevel = Math.max(0, cell.rumorLevel - decayRate);
        }
        if (newGrid[y][x].rumorLevel <= 0) {
          newGrid[y][x].peakRumorLevel = 0;
        }
      }
    }

    let totalRumor = 0;
    let houseCount = 0;
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        if (newGrid[y][x].type === 'house') {
          houseCount++;
          totalRumor += newGrid[y][x].rumorLevel;
        }
      }
    }
    const avgHouseRumor = houseCount > 0 ? totalRumor / houseCount : 0;

    let newTrust = state.trust;
    if (unpoweredHouseCount > 0) {
      const directTrustLoss = Math.min(2, unpoweredHouseCount * 0.05 + totalUnpoweredSeverity * 0.001);
      newTrust = Math.max(0, newTrust - directTrustLoss);
    }
    if (avgHouseRumor > 10) {
      newTrust = Math.max(0, newTrust - TRUST_DECAY_FROM_RUMOR * (avgHouseRumor / 50));
    } else if (avgHouseRumor < 5 && unpoweredHouseCount === 0) {
      newTrust = Math.min(100, newTrust + TRUST_RECOVERY_RATE);
    }

    const netPower = totalGeneration - totalConsumption;
    let newStoredPower = state.storedPower;
    const isDay = newDayTime < DAY_THRESHOLD;

    if (batteryCapacity > 0) {
      if (netPower > 0) {
        newStoredPower = Math.min(batteryCapacity, state.storedPower + netPower * 0.3);
      } else if (netPower < 0 && !isDay) {
        const deficit = -netPower;
        const discharge = Math.min(state.storedPower, deficit * 0.5);
        newStoredPower = Math.max(0, state.storedPower - discharge);
      }
    }

    const { houses, poweredHouses, factories, poweredFactories } = countPoweredBuildings(
      newGrid,
      poweredCells
    );
    const totalBuildings = houses + factories;
    const totalPowered = poweredHouses + poweredFactories;
    const coverage = totalBuildings > 0 ? totalPowered / totalBuildings : 1;

    const trustFactor = newTrust / 100;
    let newSatisfaction = state.satisfaction;
    if (unpoweredHouseCount > 0) {
      const directSatLoss = Math.min(1.5, unpoweredHouseCount * 0.08 + totalUnpoweredSeverity * 0.002);
      newSatisfaction = Math.max(0, newSatisfaction - directSatLoss);
    }
    if (coverage >= 0.8) {
      newSatisfaction = Math.min(100, newSatisfaction + 0.2 * trustFactor);
    } else if (coverage >= 0.5) {
      newSatisfaction = Math.min(100, newSatisfaction + 0.05 * trustFactor);
    } else {
      const penaltyMultiplier = 1 + (1 - trustFactor) * 0.5;
      newSatisfaction = Math.max(0, newSatisfaction - 0.3 * penaltyMultiplier);
    }

    saveToLocalStorage({
      grid: newGrid,
      dayTime: newDayTime,
      storedPower: newStoredPower,
      satisfaction: newSatisfaction,
      trust: newTrust,
      complaints: newComplaints,
      announcementCooldown: newAnnouncementCooldown,
      complaintIdCounter,
    });

    set({
      grid: newGrid,
      dayTime: newDayTime,
      storedPower: newStoredPower,
      maxStorage: batteryCapacity,
      satisfaction: newSatisfaction,
      trust: newTrust,
      poweredCells,
      totalGeneration,
      totalConsumption,
      complaints: newComplaints,
      announcementCooldown: newAnnouncementCooldown,
    });
  },

  resetGame: () => {
    localStorage.removeItem(STORAGE_KEY);
    const fresh = createEmptyGrid();
    const result = recalcGrid(fresh, 20, 10);
    set({
      grid: result.newGrid,
      dayTime: 20,
      storedPower: 10,
      maxStorage: result.batteryCapacity,
      satisfaction: 50,
      trust: 100,
      selectedTool: 'windmill',
      poweredCells: result.poweredCells,
      totalGeneration: result.totalGeneration,
      totalConsumption: result.totalConsumption,
      showSettlement: false,
      complaints: [],
      announcementCooldown: 0,
      highlightedCell: null,
    });
  },

  openSettlement: () => set({ showSettlement: true }),
  closeSettlement: () => set({ showSettlement: false }),

  issueAnnouncement: () => {
    const state = get();
    if (state.announcementCooldown > 0) return;

    const newGrid = state.grid.map((row) => row.map((c) => ({ ...c })));
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        newGrid[y][x].rumorLevel = Math.max(
          0,
          newGrid[y][x].rumorLevel - ANNOUNCEMENT_RUMOR_REDUCTION
        );
      }
    }

    const newTrust = Math.min(100, state.trust + 5);
    const newAnnouncementCooldown = ANNOUNCEMENT_COOLDOWN;

    saveToLocalStorage({
      grid: newGrid,
      dayTime: state.dayTime,
      storedPower: state.storedPower,
      satisfaction: state.satisfaction,
      trust: newTrust,
      complaints: state.complaints,
      announcementCooldown: newAnnouncementCooldown,
      complaintIdCounter: state.complaints.length > 0
        ? Math.max(...state.complaints.map(c => c.id)) + 1
        : 0,
    });

    set({
      grid: newGrid,
      trust: newTrust,
      announcementCooldown: newAnnouncementCooldown,
    });
  },

  getAverageRumorLevel: () => {
    const state = get();
    let totalRumor = 0;
    let count = 0;
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        if (state.grid[y][x].type === 'house') {
          totalRumor += state.grid[y][x].rumorLevel;
          count++;
        }
      }
    }
    return count > 0 ? totalRumor / count : 0;
  },

  focusComplaintLocation: (x, y) => {
    set({ highlightedCell: { x, y } });
    const cellEl = document.querySelector(`[data-x="${x}"][data-y="${y}"]`);
    if (cellEl) {
      cellEl.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
    }
    setTimeout(() => {
      const s = get();
      if (s.highlightedCell && s.highlightedCell.x === x && s.highlightedCell.y === y) {
        set({ highlightedCell: null });
      }
    }, 4000);
  },

  clearHighlight: () => set({ highlightedCell: null }),

  getDissipationProgress: () => {
    const state = get();
    const result: Array<{ x: number; y: number; progress: number; rumorLevel: number; peakRumor: number }> = [];
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const cell = state.grid[y][x];
        if (cell.peakRumorLevel > 0) {
          const progress = cell.peakRumorLevel > 0
            ? Math.max(0, Math.min(100, ((cell.peakRumorLevel - cell.rumorLevel) / cell.peakRumorLevel) * 100))
            : 0;
          result.push({ x, y, progress, rumorLevel: cell.rumorLevel, peakRumor: cell.peakRumorLevel });
        }
      }
    }
    return result.sort((a, b) => b.progress - a.progress);
  },
}));
