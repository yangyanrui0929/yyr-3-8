import React from 'react';
import { useGameStore } from '../store/useGameStore';
import { ANNOUNCEMENT_COOLDOWN } from '../utils/constants';
import { Shield, AlertTriangle, Megaphone, Clock, Wind, MapPin, Wrench } from 'lucide-react';

export const RumorPanel: React.FC = () => {
  const {
    trust,
    complaints,
    announcementCooldown,
    issueAnnouncement,
    getAverageRumorLevel,
    focusComplaintLocation,
    getDissipationProgress,
    clearHighlight,
  } = useGameStore();

  const avgRumor = getAverageRumorLevel();
  const dissipationProgress = getDissipationProgress();
  const cooldownPercent = (announcementCooldown / ANNOUNCEMENT_COOLDOWN) * 100;
  const avgDissipation = dissipationProgress.length > 0
    ? dissipationProgress.reduce((sum, d) => sum + d.progress, 0) / dissipationProgress.length
    : 0;

  const getTrustIcon = () => {
    if (trust >= 70) return <Shield className="w-5 h-5 text-green-500" />;
    if (trust >= 40) return <Shield className="w-5 h-5 text-yellow-500" />;
    return <Shield className="w-5 h-5 text-red-500" />;
  };

  const getTrustText = () => {
    if (trust >= 80) return '非常信任';
    if (trust >= 60) return '比较信任';
    if (trust >= 40) return '一般';
    if (trust >= 20) return '不太信任';
    return '非常不信任';
  };

  const getSeverityColor = (severity: number) => {
    if (severity >= 70) return 'text-red-600 bg-red-50 border-red-200';
    if (severity >= 40) return 'text-yellow-700 bg-yellow-50 border-yellow-200';
    return 'text-orange-600 bg-orange-50 border-orange-200';
  };

  const sortedComplaints = [...complaints].sort((a, b) => b.severity - a.severity);

  const handleComplaintClick = (x: number, y: number) => {
    focusComplaintLocation(x, y);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="bg-white/90 backdrop-blur-md rounded-2xl p-4 shadow-xl border border-white/50">
        <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
          🛡️ 居民信任度
        </h3>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center">
            {getTrustIcon()}
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-gray-700">{getTrustText()}</p>
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mt-1">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${trust}%`,
                  background:
                    trust >= 60
                      ? 'linear-gradient(90deg, #34D399, #10B981)'
                      : trust >= 30
                      ? 'linear-gradient(90deg, #FBBF24, #F59E0B)'
                      : 'linear-gradient(90deg, #F87171, #EF4444)',
                }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">{Math.round(trust)}%</p>
          </div>
        </div>
      </div>

      <div className="bg-white/90 backdrop-blur-md rounded-2xl p-4 shadow-xl border border-white/50">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
            <Megaphone className="w-4 h-4" />
            安抚公告
          </h3>
        </div>
        <button
          onClick={issueAnnouncement}
          disabled={announcementCooldown > 0}
          className={`w-full py-2 px-3 rounded-xl font-semibold text-sm transition-all duration-200 ${
            announcementCooldown > 0
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-md hover:scale-[1.02]'
          }`}
        >
          {announcementCooldown > 0 ? (
            <span className="flex items-center justify-center gap-2">
              <Clock className="w-4 h-4" />
              冷却中 ({Math.ceil(announcementCooldown / 10)})
            </span>
          ) : (
            '📢 发布安抚公告'
          )}
        </button>
        {announcementCooldown > 0 && (
          <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden mt-2">
            <div
              className="h-full bg-blue-400 rounded-full transition-all duration-300"
              style={{ width: `${100 - cooldownPercent}%` }}
            />
          </div>
        )}
        <p className="text-xs text-gray-500 mt-2">
          立即降低所有区域 25% 传闻，提升 5 点信任度
        </p>
      </div>

      <div className="bg-white/90 backdrop-blur-md rounded-2xl p-4 shadow-xl border border-white/50">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
            <Wind className="w-4 h-4 text-teal-500" />
            传闻消散进度
          </h3>
          {dissipationProgress.length > 0 && (
            <span className="text-xs text-teal-600 font-semibold">
              平均 {Math.round(avgDissipation)}%
            </span>
          )}
        </div>
        {dissipationProgress.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-3">
            暂无消散中的传闻 ✓
          </p>
        ) : (
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {dissipationProgress.slice(0, 6).map((item) => (
              <div
                key={`${item.x}-${item.y}`}
                className="p-2 rounded-lg bg-teal-50 border border-teal-100"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-600 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    ({item.x}, {item.y})
                  </span>
                  <span className="text-xs font-semibold text-teal-600">
                    {Math.round(item.progress)}%
                  </span>
                </div>
                <div className="w-full h-1.5 bg-teal-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${item.progress}%`,
                      background: 'linear-gradient(90deg, #5EEAD4, #14B8A6)',
                    }}
                  />
                </div>
                <p className="text-[10px] text-gray-500 mt-1">
                  剩余: {Math.round(item.rumorLevel)} / 峰值: {Math.round(item.peakRumor)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white/90 backdrop-blur-md rounded-2xl p-4 shadow-xl border border-white/50">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-orange-500" />
            高投诉区域（点击定位）
          </h3>
          <span className="text-xs text-gray-400">{sortedComplaints.length} 条</span>
        </div>
        <div className="space-y-2 max-h-52 overflow-y-auto">
          {sortedComplaints.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-4">暂无投诉 😊</p>
          ) : (
            sortedComplaints.map((complaint, idx) => (
              <button
                key={complaint.id}
                onClick={() => handleComplaintClick(complaint.x, complaint.y)}
                className={`w-full text-left p-2 rounded-lg border transition-all duration-200 hover:shadow-md hover:scale-[1.01] active:scale-95 ${getSeverityColor(
                  complaint.severity
                )}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-1 mb-1">
                      {idx === 0 && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-red-100 text-red-700 text-[10px] font-bold">
                          🔥 优先
                        </span>
                      )}
                      <span className="text-xs font-semibold text-gray-700">
                        {complaint.message}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-gray-500">
                      <span className="inline-flex items-center gap-0.5">
                        <MapPin className="w-3 h-3" />
                        ({complaint.x}, {complaint.y})
                      </span>
                      <span className="inline-flex items-center gap-0.5">
                        <Wrench className="w-3 h-3" />
                        点击优先修复
                      </span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="text-xs font-bold block">
                      {Math.round(complaint.severity)}
                    </span>
                    <span className="text-[10px] opacity-70">严重度</span>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
        {dissipationProgress.length > 0 && (
          <button
            onClick={clearHighlight}
            className="w-full mt-2 text-xs text-gray-400 hover:text-gray-600 py-1"
          >
            清除高亮
          </button>
        )}
      </div>

      <div className="bg-white/90 backdrop-blur-md rounded-2xl p-4 shadow-xl border border-white/50">
        <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
          📊 传闻概况
        </h3>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500">平均传闻强度</span>
            <span className="text-sm font-semibold text-orange-600">
              {Math.round(avgRumor)}%
            </span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${avgRumor}%`,
                background:
                  avgRumor >= 50
                    ? 'linear-gradient(90deg, #F87171, #EF4444)'
                    : 'linear-gradient(90deg, #FBBF24, #F59E0B)',
              }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-1">
            {avgRumor > 30
              ? '⚠️ 传闻较严重，建议优先修复断电区域'
              : avgRumor > 10
              ? '有少量传闻，注意维护电网稳定'
              : '✓ 传闻水平较低，居民情绪稳定'}
          </p>
        </div>
      </div>
    </div>
  );
};
