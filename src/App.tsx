import React, { useState, useEffect } from 'react';
import type { CircleInfo, CircleName, MonthlyCircleEvaluation } from './types';
import { calculateTotalScore } from './utils/calculator';
import { Dashboard } from './components/Dashboard';
import { EvaluatorForm } from './components/EvaluatorForm';
import { CircleManager } from './components/CircleManager';
import { ExcelImporter } from './components/ExcelImporter';
import { LayoutDashboard, Edit3, UserCog, Download, Upload, Calendar } from 'lucide-react';

const DEFAULT_CIRCLES: CircleInfo[] = [
  { id: '1', name: '금메달', membersCount: 4, leaderName: '박성욱' },
  { id: '2', name: '한마음', membersCount: 4, leaderName: '박민규' },
  { id: '3', name: '독수리', membersCount: 4, leaderName: '임인관' },
  { id: '4', name: '아리울', membersCount: 4, leaderName: '이대호' },
  { id: '5', name: '새만금', membersCount: 10, leaderName: '김기홍', note: '보전동, 현장공사 집계' },
];

export function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'input' | 'manage'>('dashboard');
  const [targetYearMonth, setTargetYearMonth] = useState<string>('2026-06');

  // 1. 분임조 기본정보 상태
  const [circles, setCircles] = useState<CircleInfo[]>(() => {
    const saved = localStorage.getItem('qc_circles');
    return saved ? JSON.parse(saved) : DEFAULT_CIRCLES;
  });

  // 2. 월별 평가 데이터 상태
  const [evaluations, setEvaluations] = useState<Record<string, Record<CircleName, MonthlyCircleEvaluation>>>(() => {
    const saved = localStorage.getItem('qc_evaluations');
    if (saved) return JSON.parse(saved);

    // 기본 가상 초기 8월 평가 데이터 생성
    const defaultAug: Record<CircleName, MonthlyCircleEvaluation> = {
      '금메달': {
        circleName: '금메달',
        yearMonth: '2026-08',
        scores: calculateTotalScore({
          maintDefectCount: 1,
          meetingCount: 4,
          prevThemeStep: '7단계 - 결과분석',
          currThemeStep: '9단계 - 표준화',
          planAchievementRate: 95,
          themeGrade: '2급',
          themeCumulativeCount: 3,
          totalProposalCount: 32,
          totalUnreasonableCount: 22,
          unreasonableResolveRate: 85
        }, 10)
      },
      '한마음': {
        circleName: '한마음',
        yearMonth: '2026-08',
        scores: calculateTotalScore({
          maintDefectCount: 2,
          meetingCount: 3,
          prevThemeStep: '3단계 - 원인분석',
          currThemeStep: '4단계 - 목표설정',
          planAchievementRate: 80,
          themeGrade: '미완료',
          themeCumulativeCount: 1,
          totalProposalCount: 15,
          totalUnreasonableCount: 12,
          unreasonableResolveRate: 70
        }, 10)
      },
      '독수리': {
        circleName: '독수리',
        yearMonth: '2026-08',
        scores: calculateTotalScore({
          maintDefectCount: 0,
          meetingCount: 5,
          prevThemeStep: '9단계 - 표준화',
          currThemeStep: '1단계 - 테마주제선정', // 2단계 전진 (순환)
          planAchievementRate: 100,
          themeGrade: '1급',
          themeCumulativeCount: 4,
          totalProposalCount: 35,
          totalUnreasonableCount: 25,
          unreasonableResolveRate: 90
        }, 10)
      },
      '아리울': {
        circleName: '아리울',
        yearMonth: '2026-08',
        scores: calculateTotalScore({
          maintDefectCount: 3,
          meetingCount: 2,
          prevThemeStep: '2단계 - 현상파악',
          currThemeStep: '3단계 - 원인분석',
          planAchievementRate: 75,
          themeGrade: '미완료',
          themeCumulativeCount: 1,
          totalProposalCount: 12,
          totalUnreasonableCount: 8,
          unreasonableResolveRate: 60
        }, 10)
      },
      '새만금': {
        circleName: '새만금',
        yearMonth: '2026-08',
        scores: calculateTotalScore({
          maintDefectCount: 4,
          meetingCount: 3,
          prevThemeStep: '4단계 - 목표설정',
          currThemeStep: '6단계 - 대책실시',
          planAchievementRate: 85,
          themeGrade: '3급',
          themeCumulativeCount: 2,
          totalProposalCount: 20,
          totalUnreasonableCount: 15,
          unreasonableResolveRate: 75
        }, 10)
      }
    };

    return { '2026-08': defaultAug };
  });

  // LocalStorage 저장 동기화
  useEffect(() => {
    localStorage.setItem('qc_circles', JSON.stringify(circles));
  }, [circles]);

  useEffect(() => {
    localStorage.setItem('qc_evaluations', JSON.stringify(evaluations));
  }, [evaluations]);

  // 해당 월 평가 데이터 가져오기 (없으면 기본 구조 생성)
  const currentMonthEvals: Record<CircleName, MonthlyCircleEvaluation> = evaluations[targetYearMonth] || {
    '금메달': { circleName: '금메달', yearMonth: targetYearMonth, scores: calculateTotalScore({ maintDefectCount: 0, meetingCount: 0, prevThemeStep: '1단계 - 테마주제선정', currThemeStep: '1단계 - 테마주제선정', planAchievementRate: 100, themeGrade: '미완료', themeCumulativeCount: 0, totalProposalCount: 0, totalUnreasonableCount: 0, unreasonableResolveRate: 100 }, 10) },
    '한마음': { circleName: '한마음', yearMonth: targetYearMonth, scores: calculateTotalScore({ maintDefectCount: 0, meetingCount: 0, prevThemeStep: '1단계 - 테마주제선정', currThemeStep: '1단계 - 테마주제선정', planAchievementRate: 100, themeGrade: '미완료', themeCumulativeCount: 0, totalProposalCount: 0, totalUnreasonableCount: 0, unreasonableResolveRate: 100 }, 10) },
    '독수리': { circleName: '독수리', yearMonth: targetYearMonth, scores: calculateTotalScore({ maintDefectCount: 0, meetingCount: 0, prevThemeStep: '1단계 - 테마주제선정', currThemeStep: '1단계 - 테마주제선정', planAchievementRate: 100, themeGrade: '미완료', themeCumulativeCount: 0, totalProposalCount: 0, totalUnreasonableCount: 0, unreasonableResolveRate: 100 }, 10) },
    '아리울': { circleName: '아리울', yearMonth: targetYearMonth, scores: calculateTotalScore({ maintDefectCount: 0, meetingCount: 0, prevThemeStep: '1단계 - 테마주제선정', currThemeStep: '1단계 - 테마주제선정', planAchievementRate: 100, themeGrade: '미완료', themeCumulativeCount: 0, totalProposalCount: 0, totalUnreasonableCount: 0, unreasonableResolveRate: 100 }, 10) },
    '새만금': { circleName: '새만금', yearMonth: targetYearMonth, scores: calculateTotalScore({ maintDefectCount: 0, meetingCount: 0, prevThemeStep: '1단계 - 테마주제선정', currThemeStep: '1단계 - 테마주제선정', planAchievementRate: 100, themeGrade: '미완료', themeCumulativeCount: 0, totalProposalCount: 0, totalUnreasonableCount: 0, unreasonableResolveRate: 100 }, 10) },
  };

  // 평가 저장 핸들러
  const handleSaveEvaluations = (updated: Record<CircleName, MonthlyCircleEvaluation>) => {
    setEvaluations(prev => ({
      ...prev,
      [targetYearMonth]: updated
    }));
  };

  // 엑셀 파싱 데이터 반영 (제안실적)
  const handleImportProposalData = (data: Record<CircleName, { proposals: number; unreasonables: number }>) => {
    const updatedEvals = { ...currentMonthEvals };

    (Object.keys(data) as CircleName[]).forEach(name => {
      const circleInfo = circles.find(c => c.name === name) || { membersCount: 10 };
      const current = updatedEvals[name];

      const recalculated = calculateTotalScore({
        ...current.scores,
        totalProposalCount: data[name].proposals,
        totalUnreasonableCount: data[name].unreasonables
      }, circleInfo.membersCount);

      updatedEvals[name] = {
        ...current,
        scores: recalculated
      };
    });

    handleSaveEvaluations(updatedEvals);
  };

  // 엑셀 파싱 데이터 반영 (회의록)
  const handleImportMeetingData = (data: Record<CircleName, { meetingCount: number; earliestStep?: any; latestStep?: any }>) => {
    const updatedEvals = { ...currentMonthEvals };

    (Object.keys(data) as CircleName[]).forEach(name => {
      const circleInfo = circles.find(c => c.name === name) || { membersCount: 10 };
      const current = updatedEvals[name];

      const recalculated = calculateTotalScore({
        ...current.scores,
        meetingCount: data[name].meetingCount,
        prevThemeStep: data[name].earliestStep || current.scores.prevThemeStep,
        currThemeStep: data[name].latestStep || current.scores.currThemeStep
      }, circleInfo.membersCount);

      updatedEvals[name] = {
        ...current,
        scores: recalculated
      };
    });

    handleSaveEvaluations(updatedEvals);
  };

  // 백업 JSON 내보내기/불러오기
  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ circles, evaluations }));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `Quality_Circle_Backup_${targetYearMonth}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const parsed = JSON.parse(evt.target?.result as string);
        if (parsed.circles) setCircles(parsed.circles);
        if (parsed.evaluations) setEvaluations(parsed.evaluations);
        alert('백업 데이터가 성공적으로 복구되었습니다.');
      } catch (err) {
        alert('올바른 백업 JSON 파일이 아닙니다.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen text-slate-100 flex flex-col font-sans bg-[var(--bg-gradient)] selection:bg-indigo-500/30">
      {/* 헤더 바 */}
      <header className="glass-panel border-b-0 border-white/5 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent drop-shadow-sm">분임조 평가 및 집계 시스템</h1>
          </div>

          {/* 연월 선택 및 액션 버튼 */}
          <div className="flex items-center space-x-3 relative z-10">
            <div className="flex items-center bg-white/5 border border-white/10 hover:border-indigo-400/50 rounded-xl px-3 py-1.5 space-x-2 text-xs transition-all duration-300 shadow-sm backdrop-blur-sm group">
              <Calendar className="w-4 h-4 text-indigo-400 shrink-0 group-hover:text-indigo-300 transition-colors" />
              <input
                type="month"
                value={targetYearMonth}
                onChange={(e) => setTargetYearMonth(e.target.value)}
                className="bg-transparent text-slate-100 font-medium focus:outline-none cursor-pointer scheme-dark"
              />
            </div>

            <button
              onClick={handleExportJSON}
              title="데이터 백업 내보내기"
              className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white rounded-xl transition-all duration-300 shadow-sm cursor-pointer hover:shadow-indigo-500/20"
            >
              <Download className="w-4 h-4" />
            </button>

            <label
              title="백업 복구 불러오기"
              className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white rounded-xl transition-all duration-300 shadow-sm cursor-pointer hover:shadow-indigo-500/20"
            >
              <Upload className="w-4 h-4" />
              <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
            </label>
          </div>
        </div>
      </header>

      {/* 서브 내비게이션 바 */}
      <nav className="glass-panel border-t-0 border-b border-white/10 z-40 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex space-x-2 py-3">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 cursor-pointer ${
              activeTab === 'dashboard'
                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/25 border border-indigo-400/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>평가 대시보드</span>
          </button>

          <button
            onClick={() => setActiveTab('input')}
            className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 cursor-pointer ${
              activeTab === 'input'
                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/25 border border-indigo-400/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
            }`}
          >
            <Edit3 className="w-4 h-4" />
            <span>평가 점수 입력 & 엑셀파싱</span>
          </button>

          <button
            onClick={() => setActiveTab('manage')}
            className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 cursor-pointer ${
              activeTab === 'manage'
                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/25 border border-indigo-400/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
            }`}
          >
            <UserCog className="w-4 h-4" />
            <span>분임조 정보 관리</span>
          </button>
        </div>
      </nav>

      {/* 본문 콘텐츠 영역 */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in-up">
        {activeTab === 'dashboard' && (
          <Dashboard
            evaluations={currentMonthEvals}
            targetYearMonth={targetYearMonth}
          />
        )}

        {activeTab === 'input' && (
          <div className="space-y-6">
            <ExcelImporter
              targetYearMonth={targetYearMonth}
              onImportProposalData={handleImportProposalData}
              onImportMeetingData={handleImportMeetingData}
            />

            <EvaluatorForm
              circles={circles}
              targetYearMonth={targetYearMonth}
              evaluations={currentMonthEvals}
              onSaveEvaluations={handleSaveEvaluations}
            />
          </div>
        )}

        {activeTab === 'manage' && (
          <CircleManager
            circles={circles}
            onUpdateCircles={(updated) => setCircles(updated)}
          />
        )}
      </main>

      <footer className="mt-auto py-8 text-center text-xs text-slate-500/70 border-t border-white/5 glass-panel border-b-0">
        Quality Circle Evaluation Dashboard &copy; 2026. All rights reserved.
      </footer>
    </div>
  );
}

export default App;
