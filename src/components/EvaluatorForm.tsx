import React, { useState, useEffect } from 'react';
import { THEME_STEPS } from '../types';
import type { CircleName, MonthlyCircleEvaluation, CircleInfo, ThemeStep, ThemeGrade } from '../types';
import { calculateTotalScore } from '../utils/calculator';
import { Save, CheckCircle, Calculator } from 'lucide-react';

interface EvaluatorFormProps {
  circles: CircleInfo[];
  targetYearMonth: string;
  evaluations: Record<CircleName, MonthlyCircleEvaluation>;
  onSaveEvaluations: (updated: Record<CircleName, MonthlyCircleEvaluation>) => void;
}

export const EvaluatorForm: React.FC<EvaluatorFormProps> = ({
  circles,
  targetYearMonth,
  evaluations,
  onSaveEvaluations
}) => {
  const [selectedCircle, setSelectedCircle] = useState<CircleName>('금메달');
  const [formData, setFormData] = useState<Record<CircleName, MonthlyCircleEvaluation>>(evaluations);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    setFormData(evaluations);
  }, [evaluations, targetYearMonth]);

  const currentCircleInfo = circles.find(c => c.name === selectedCircle) || {
    id: '1', name: selectedCircle, membersCount: 10, leaderName: ''
  };

  const currentEval = formData[selectedCircle] || {
    circleName: selectedCircle,
    yearMonth: targetYearMonth,
    scores: calculateTotalScore({
      maintDefectCount: 0,
      meetingCount: 0,
      prevThemeStep: '1단계 - 테마주제선정',
      currThemeStep: '1단계 - 테마주제선정',
      planAchievementRate: 0,
      themeGrade: '미완료',
      themeCumulativeCount: 0,
      totalProposalCount: 0,
      totalUnreasonableCount: 0,
      unreasonableResolveRate: 0
    }, currentCircleInfo.membersCount)
  };

  const handleInputChange = (field: string, value: any) => {
    const existing = formData[selectedCircle] || currentEval;
    const updatedScoresRaw = {
      ...existing.scores,
      [field]: value
    };

    const recalculated = calculateTotalScore(updatedScoresRaw, currentCircleInfo.membersCount);

    const newFormData = {
      ...formData,
      [selectedCircle]: {
        ...existing,
        yearMonth: targetYearMonth,
        scores: recalculated
      }
    };

    setFormData(newFormData);
    onSaveEvaluations(newFormData);
  };

  const handleSave = () => {
    onSaveEvaluations(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="glass-card rounded-2xl p-6 shadow-xl w-full animate-fade-in-up">
      {/* 분임조 선택 탭 */}
      <div className="flex flex-wrap gap-2 mb-6 pb-4 border-b border-slate-800">
        {circles.map(c => {
          const isSelected = c.name === selectedCircle;
          const score = formData[c.name]?.scores?.totalScore ?? 0;

          return (
            <button
              key={c.name}
              onClick={() => setSelectedCircle(c.name)}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold transition-all duration-300 cursor-pointer ${
                isSelected 
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/30 ring-1 ring-white/20 transform scale-105'
                  : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white border border-white/5'
              }`}
            >
              <span>{c.name} 분임조</span>
              <span className={`text-xs px-2 py-0.5 rounded-full shadow-inner ${isSelected ? 'bg-white/20 text-white' : 'bg-black/20 text-slate-300'}`}>
                {score}점
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center space-x-2">
            <Calculator className="w-5 h-5 text-indigo-400" />
            <span>[{selectedCircle} 분임조] {targetYearMonth} 평가 입력</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            조원 인원수: <span className="text-indigo-400 font-semibold">{currentCircleInfo.membersCount}명</span> | 
            조장: <span className="text-slate-300">{currentCircleInfo.leaderName || '미지정'}</span> |
            특이사항: <span className="text-slate-300">{currentCircleInfo.note || '없음'}</span>
          </p>
        </div>

        <button
          onClick={handleSave}
          className="mt-4 md:mt-0 flex items-center space-x-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-emerald-500/25 active:scale-95 cursor-pointer transform hover:-translate-y-0.5"
        >
          <Save className="w-4 h-4" />
          <span>전체 평가 저장</span>
        </button>
      </div>

      {savedSuccess && (
        <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-sm flex items-center space-x-2">
          <CheckCircle className="w-4 h-4" />
          <span>{targetYearMonth} 월별 평가 데이터가 성공적으로 저장되었습니다!</span>
        </div>
      )}

      {/* 평가 항목 입력 폼 (3 분야 9개 항목) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* 1. 3정 5S */}
        <div className="bg-white/5 border border-white/5 hover:border-white/10 transition-colors rounded-xl p-5">
          <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-2">
            <h3 className="font-bold text-amber-400 text-sm uppercase tracking-wider">1. 3정 5S (20점)</h3>
            <span className="text-xs font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-md">
              {currentEval.scores.maintScore} / 20점
            </span>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                관할구역 불합리 발견 건수 (건)
              </label>
              <input
                type="number"
                min="0"
                value={currentEval.scores.maintDefectCount}
                onChange={(e) => handleInputChange('maintDefectCount', parseInt(e.target.value) || 0)}
                className="w-full bg-black/20 backdrop-blur-sm border border-white/10 rounded-lg px-3 py-2 text-slate-100 font-semibold focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all shadow-inner"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">감점제: 20점 - (불합리 발견 건수 x 1점)</span>
            </div>
          </div>
        </div>

        {/* 2. 분임조 */}
        <div className="bg-white/5 border border-white/5 hover:border-white/10 transition-colors rounded-xl p-5">
          <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-2">
            <h3 className="font-bold text-cyan-400 text-sm uppercase tracking-wider">2. 분임조 (40점)</h3>
            <span className="text-xs font-bold text-cyan-400 bg-cyan-400/10 px-2 py-0.5 rounded-md">
              {(
                currentEval.scores.meetingScore + 
                currentEval.scores.themeProgressScore + 
                currentEval.scores.planAchievementScore + 
                currentEval.scores.themeGradeScore + 
                currentEval.scores.themeCumulativeScore
              )} / 40점
            </span>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                분임조 회합 횟수 (회) — <span className="text-cyan-400">{currentEval.scores.meetingScore}점</span>
              </label>
              <input
                type="number"
                min="0"
                value={currentEval.scores.meetingCount}
                onChange={(e) => handleInputChange('meetingCount', parseInt(e.target.value) || 0)}
                className="w-full bg-black/20 backdrop-blur-sm border border-white/10 rounded-lg px-3 py-2 text-slate-100 font-semibold focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all shadow-inner"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">1점/회, 4회 이상 시 +1점 (최대 5점)</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                개선테마 당월 시작 단계
              </label>
              <select
                value={currentEval.scores.prevThemeStep}
                onChange={(e) => handleInputChange('prevThemeStep', e.target.value as ThemeStep)}
                className="w-full bg-black/20 backdrop-blur-sm border border-white/10 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all text-xs shadow-inner"
              >
                {THEME_STEPS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                개선테마 당월 종료 단계 — <span className="text-cyan-400">{currentEval.scores.themeProgressScore}점 ({currentEval.scores.themeProgressSteps}단계 진행)</span>
              </label>
              <select
                value={currentEval.scores.currThemeStep}
                onChange={(e) => handleInputChange('currThemeStep', e.target.value as ThemeStep)}
                className="w-full bg-black/20 backdrop-blur-sm border border-white/10 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all text-xs shadow-inner"
              >
                {THEME_STEPS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <span className="text-[11px] text-slate-500 mt-1 block">전월 대비 단계 전진 x 5점 (순환 지원)</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                계획 달성률 (%) — <span className="text-cyan-400">{currentEval.scores.planAchievementScore}점</span>
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={currentEval.scores.planAchievementRate}
                onChange={(e) => handleInputChange('planAchievementRate', parseFloat(e.target.value) || 0)}
                className="w-full bg-black/20 backdrop-blur-sm border border-white/10 rounded-lg px-3 py-2 text-slate-100 font-semibold focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all shadow-inner"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  당월 완료 등급
                </label>
                <select
                  value={currentEval.scores.themeGrade}
                  onChange={(e) => handleInputChange('themeGrade', e.target.value as ThemeGrade)}
                  className="w-full bg-black/20 backdrop-blur-sm border border-white/10 rounded-lg px-2 py-2 text-slate-100 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all text-xs shadow-inner"
                >
                  <option value="미완료">미완료 (0점)</option>
                  <option value="1급">1급 (5점)</option>
                  <option value="2급">2급 (4점)</option>
                  <option value="3급">3급 (3점)</option>
                  <option value="4급">4급 (2점)</option>
                  <option value="5급">5급 (1점)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  완료 누적 건수
                </label>
                <input
                  type="number"
                  min="0"
                  value={currentEval.scores.themeCumulativeCount}
                  onChange={(e) => handleInputChange('themeCumulativeCount', parseInt(e.target.value) || 0)}
                  className="w-full bg-black/20 backdrop-blur-sm border border-white/10 rounded-lg px-3 py-2 text-slate-100 font-semibold focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all shadow-inner"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 3. 제안 */}
        <div className="bg-white/5 border border-white/5 hover:border-white/10 transition-colors rounded-xl p-5">
          <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-2">
            <h3 className="font-bold text-emerald-400 text-sm uppercase tracking-wider">3. 제안 (40점)</h3>
            <span className="text-xs font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-md">
              {(
                currentEval.scores.proposalScore + 
                currentEval.scores.unreasonableCountScore + 
                currentEval.scores.unreasonableResolveScore
              )} / 40점
            </span>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                조원 총 제안 건수 (건)
              </label>
              <input
                type="number"
                min="0"
                value={currentEval.scores.totalProposalCount}
                onChange={(e) => handleInputChange('totalProposalCount', parseInt(e.target.value) || 0)}
                className="w-full bg-black/20 backdrop-blur-sm border border-white/10 rounded-lg px-3 py-2 text-slate-100 font-semibold focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition-all shadow-inner"
              />
              <span className="text-[11px] text-emerald-400 mt-1 block">
                인당 제안: {currentEval.scores.proposalPerPerson}건 → <span className="font-bold">{currentEval.scores.proposalScore}점</span>
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                조원 총 불합리 적출 건수 (건)
              </label>
              <input
                type="number"
                min="0"
                value={currentEval.scores.totalUnreasonableCount}
                onChange={(e) => handleInputChange('totalUnreasonableCount', parseInt(e.target.value) || 0)}
                className="w-full bg-black/20 backdrop-blur-sm border border-white/10 rounded-lg px-3 py-2 text-slate-100 font-semibold focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition-all shadow-inner"
              />
              <span className="text-[11px] text-emerald-400 mt-1 block">
                인당 적출: {currentEval.scores.unreasonablePerPerson}건 → <span className="font-bold">{currentEval.scores.unreasonableCountScore}점</span>
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                불합리 해결률 (%) — <span className="text-emerald-400">{currentEval.scores.unreasonableResolveScore}점</span>
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={currentEval.scores.unreasonableResolveRate}
                onChange={(e) => handleInputChange('unreasonableResolveRate', parseFloat(e.target.value) || 0)}
                className="w-full bg-black/20 backdrop-blur-sm border border-white/10 rounded-lg px-3 py-2 text-slate-100 font-semibold focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition-all shadow-inner"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">80% 이상: 10점, 60% 이상: 8점, 40% 이상: 4점</span>
            </div>
          </div>
        </div>

      </div>

      {/* 총점 요약 바 */}
      <div className="mt-8 bg-white/5 border border-white/10 backdrop-blur-md shadow-lg rounded-xl p-5 flex items-center justify-between">
        <div className="text-slate-300 font-semibold text-sm">
          [{selectedCircle} 분임조] {targetYearMonth} 총점 합계
        </div>
        <div className="text-3xl font-extrabold text-indigo-400">
          {currentEval.scores.totalScore} <span className="text-sm font-semibold text-slate-400">/ 100점</span>
        </div>
      </div>
    </div>
  );
};
