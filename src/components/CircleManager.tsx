import React, { useState } from 'react';
import type { CircleInfo } from '../types';
import { Users, Save, Info } from 'lucide-react';

interface CircleManagerProps {
  circles: CircleInfo[];
  onUpdateCircles: (updated: CircleInfo[]) => void;
}

export const CircleManager: React.FC<CircleManagerProps> = ({ circles, onUpdateCircles }) => {
  const [list, setList] = useState<CircleInfo[]>(circles);
  const [savedMsg, setSavedMsg] = useState(false);

  const handleMemberCountChange = (id: string, count: number) => {
    const val = Math.max(1, count);
    const updated = list.map(c => c.id === id ? { ...c, membersCount: val } : c);
    setList(updated);
    onUpdateCircles(updated);
  };

  const handleLeaderChange = (id: string, leaderName: string) => {
    const updated = list.map(c => c.id === id ? { ...c, leaderName } : c);
    setList(updated);
    onUpdateCircles(updated);
  };

  const handleNoteChange = (id: string, note: string) => {
    const updated = list.map(c => c.id === id ? { ...c, note } : c);
    setList(updated);
    onUpdateCircles(updated);
  };

  const handleSave = () => {
    onUpdateCircles(list);
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 3000);
  };

  return (
    <div className="glass-card rounded-2xl p-6 shadow-xl max-w-4xl mx-auto animate-fade-in-up">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-100">분임조 정보 관리</h2>
            <p className="text-sm text-slate-400">5개 분임조의 인원수 및 기본 정보 설정 (제안 및 불합리 적출 인당 건수 계산 기준)</p>
          </div>
        </div>

        <button
          onClick={handleSave}
          className="flex items-center space-x-2 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400 text-white font-medium px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-indigo-500/25 active:scale-95 cursor-pointer transform hover:-translate-y-0.5"
        >
          <Save className="w-4 h-4" />
          <span>설정 저장하기</span>
        </button>
      </div>

      {savedMsg && (
        <div className="mb-6 p-4 bg-emerald-500/20 border border-emerald-500/50 backdrop-blur-sm shadow-[0_0_15px_rgba(16,185,129,0.2)] rounded-xl text-emerald-300 text-sm flex items-center space-x-2">
          <Info className="w-4 h-4" />
          <span>분임조 인원수 정보가 성공적으로 저장되었습니다. 대시보드 점수 산출에 적용됩니다.</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {list.map((circle) => (
          <div 
            key={circle.id}
            className="bg-white/5 border border-white/5 hover:border-white/10 rounded-xl p-5 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 group hover:shadow-[0_0_15px_rgba(255,255,255,0.05)] transform hover:scale-[1.01]"
          >
            <div className="flex items-center space-x-4 min-w-[160px]">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center font-bold text-slate-200 border border-white/10 shadow-sm group-hover:bg-indigo-500/20 group-hover:text-indigo-300 group-hover:border-indigo-400/50 transition-colors">
                {circle.name[0]}
              </div>
              <div>
                <h4 className="font-bold text-slate-200 text-lg">{circle.name} 분임조</h4>
                <span className="text-xs text-indigo-400 font-medium">기본 지정 분임조</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 flex-1">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">조원 인원수 (명)</label>
                <input
                  type="number"
                  min="1"
                  value={circle.membersCount}
                  onChange={(e) => handleMemberCountChange(circle.id, parseInt(e.target.value) || 1)}
                  className="w-full bg-black/20 backdrop-blur-sm border border-white/10 rounded-lg px-3 py-2 text-slate-100 font-semibold focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 text-center shadow-inner transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">분임조장 성명</label>
                <input
                  type="text"
                  value={circle.leaderName}
                  onChange={(e) => handleLeaderChange(circle.id, e.target.value)}
                  placeholder="조장 이름"
                  className="w-full bg-black/20 backdrop-blur-sm border border-white/10 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 shadow-inner transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">비고 / 관할 구역</label>
                <input
                  type="text"
                  value={circle.note || ''}
                  onChange={(e) => handleNoteChange(circle.id, e.target.value)}
                  placeholder="예: 보전동, 현장공사 등"
                  className="w-full bg-black/20 backdrop-blur-sm border border-white/10 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 shadow-inner transition-all"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
