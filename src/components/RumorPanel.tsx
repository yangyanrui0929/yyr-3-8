import React from 'react';
import { useGameStore } from '../store/useGameStore';
import { ANNOUNCEMENT_COOLDOWN } from '../utils/constants';
import { Shield, AlertTriangle, Megaphone, Clock } from 'lucide-react';

export const RumorPanel: React.FC = () => {
  const {
    trust,
    complaints,
    announcementCooldown,
    issueAnnouncement,
    getAverageRumorLevel,
  } = useGameStore();

  const avgRumor = getAverageRumorLevel();
  const cooldownPercent = (announcementCooldown / ANNOUNCEMENT_COOLDOWN) * 100;

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
    if (severity >= 70) return 'text-red-600 bg-red-50';
    if (severity >= 40) return 'text-yellow-600 bg-yellow-50';
    return 'text-orange-500 bg-orange-50';
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
          立即降低所有区域 {Math.round(25)}% 传闻，提升少量信任度
        </p>
      </div>

      <div className="bg-white/90 backdrop-blur-md rounded-2xl p-4 shadow-xl border border-white/50">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-orange-500" />
            最近投诉
          </h3>
          <span className="text-xs text-gray-400">{complaints.length} 条</span>
        </div>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {complaints.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-4">暂无投诉 😊</p>
          ) : (
            complaints.map((complaint) => (
              <div
                key={complaint.id}
                className="p-2 rounded-lg bg-gray-50 border border-gray-100"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs text-gray-700 flex-1">{complaint.message}</p>
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${getSeverityColor(
                      complaint.severity
                    )}`}
                  >
                    {Math.round(complaint.severity)}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  位置: ({complaint.x}, {complaint.y})
                </p>
              </div>
            ))
          )}
        </div>
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
