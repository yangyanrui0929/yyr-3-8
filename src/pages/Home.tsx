import { FloatingIsland } from '@/components/FloatingIsland';
import { Toolbar } from '@/components/Toolbar';
import { StatusBar } from '@/components/StatusBar';
import { SettlementModal } from '@/components/SettlementModal';
import { RumorMap } from '@/components/RumorMap';
import { RumorPanel } from '@/components/RumorPanel';
import { useGameLoop } from '@/hooks/useGameLoop';
import { useGameStore } from '@/store/useGameStore';

export default function Home() {
  useGameLoop();
  const dayTime = useGameStore((state) => state.dayTime);
  const isNight = dayTime >= 50;

  return (
    <div
      className="min-h-screen w-full relative overflow-hidden transition-colors duration-1000"
      style={{
        background: isNight
          ? 'linear-gradient(180deg, #0f172a 0%, #1e293b 40%, #334155 100%)'
          : 'linear-gradient(180deg, #87CEEB 0%, #B3E5FC 40%, #E0F7FA 100%)',
      }}
    >
      <Clouds isNight={isNight} />

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-6 flex flex-col gap-6">
        <header className="text-center">
          <h1
            className={`text-4xl font-extrabold mb-2 tracking-tight ${
              isNight ? 'text-white' : 'text-gray-800'
            }`}
            style={{
              textShadow: isNight
                ? '0 2px 20px rgba(99, 102, 241, 0.5)'
                : '0 2px 10px rgba(255,255,255,0.8)',
            }}
          >
            🏝️ 浮岛电网建造
          </h1>
          <p className={`text-sm ${isNight ? 'text-slate-300' : 'text-gray-600'}`}>
            放置风车和建筑，铺设电线，管理传闻，为你的浮岛带来光明！
          </p>
        </header>

        <StatusBar />

        <div className="flex flex-col xl:flex-row gap-6 items-start justify-center">
          <div className="order-2 xl:order-1 xl:w-56 flex flex-col gap-4">
            <Toolbar />
          </div>

          <div className="order-1 xl:order-2 flex justify-center items-center py-4">
            <FloatingIsland />
          </div>

          <div className="order-3 xl:w-64 flex flex-col gap-4">
            <RumorMap />
            <RumorPanel />
          </div>
        </div>

        <footer className="text-center pb-4">
          <p className={`text-xs ${isNight ? 'text-slate-400' : 'text-gray-500'}`}>
            用你的智慧构建一个完美的电力网络 ⚡ 维护居民信任与满意度
          </p>
        </footer>
      </div>

      <SettlementModal />
    </div>
  );
}

function Clouds({ isNight }: { isNight: boolean }) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full opacity-60"
          style={{
            width: `${100 + i * 40}px`,
            height: `${40 + i * 15}px`,
            top: `${5 + i * 18}%`,
            left: `${-10 + i * 22}%`,
            background: isNight
              ? 'radial-gradient(ellipse, rgba(148,163,184,0.3) 0%, transparent 70%)'
              : 'radial-gradient(ellipse, white 0%, rgba(255,255,255,0) 70%)',
            animation: `drift ${25 + i * 8}s linear infinite`,
            animationDelay: `${-i * 5}s`,
          }}
        />
      ))}
      {isNight && (
        <>
          {[...Array(20)].map((_, i) => (
            <div
              key={`star-${i}`}
              className="absolute w-1 h-1 bg-white rounded-full"
              style={{
                top: `${Math.random() * 50}%`,
                left: `${Math.random() * 100}%`,
                opacity: 0.3 + Math.random() * 0.7,
                animation: `twinkle ${2 + Math.random() * 3}s ease-in-out infinite`,
                animationDelay: `${Math.random() * 2}s`,
              }}
            />
          ))}
        </>
      )}
      <style>{`
        @keyframes drift {
          0% { transform: translateX(-100px); }
          100% { transform: translateX(calc(100vw + 100px)); }
        }
        @keyframes twinkle {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
