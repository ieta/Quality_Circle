import React, { useState } from 'react';
import type { CircleName, MonthlyCircleEvaluation, AwardStatus } from '../types';
import { Trophy, Award, Medal, ChevronRight, BarChart3, PieChart as PieChartIcon } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, 
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar 
} from 'recharts';

interface DashboardProps {
  evaluations: Record<CircleName, MonthlyCircleEvaluation>;
  targetYearMonth: string;
}

export const Dashboard: React.FC<DashboardProps> = ({ evaluations, targetYearMonth }) => {
  const [selectedDetailCircle, setSelectedDetailCircle] = useState<CircleName | null>(null);

  // 5개 분임조의 순위 및 포상 집계
  const evalList = Object.values(evaluations).filter(e => e.yearMonth === targetYearMonth);
  
  // 점수 내림차순 정렬
  const sortedEvals = [...evalList].sort((a, b) => b.scores.totalScore - a.scores.totalScore);

  // 1위 & 2위 포상 판단 로직
  // 1등: 70점 이상 중 최고점
  // 2등: 80점 이상인 2위 분임조
  const awardStatuses: AwardStatus[] = sortedEvals.map((e, idx) => {
    const rank = (idx + 1) as 1 | 2 | 3 | 4 | 5;
    const score = e.scores.totalScore;
    let isFirstPlaceAward = false;
    let isSecondPlaceAward = false;
    let awardText = '해당없음';

    if (rank === 1 && score >= 70) {
      isFirstPlaceAward = true;
      awardText = '🥇 1등 포상 대상 (최우수 분임조)';
    } else if (rank === 2 && score >= 80) {
      isSecondPlaceAward = true;
      awardText = '🥈 2등 포상 대상 (7만원 수령)';
    }

    return {
      circleName: e.circleName,
      rank,
      score,
      isFirstPlaceAward,
      isSecondPlaceAward,
      awardText
    };
  });

  // Recharts 차트용 데이터 구성
  const barChartData = sortedEvals.map(e => ({
    name: e.circleName,
    '3정5S': e.scores.maintScore,
    '분임조': (
      e.scores.meetingScore + 
      e.scores.themeProgressScore + 
      e.scores.planAchievementScore + 
      e.scores.themeGradeScore + 
      e.scores.themeCumulativeScore
    ),
    '제안': (
      e.scores.proposalScore + 
      e.scores.unreasonableCountScore + 
      e.scores.unreasonableResolveScore
    ),
    totalScore: e.scores.totalScore
  }));

  // 선택된 상세 분임조 데이터
  const detailEval = selectedDetailCircle ? evaluations[selectedDetailCircle] : null;
  const detailRadarData = detailEval ? [
    { subject: '3정5S (20)', score: detailEval.scores.maintScore, fullMark: 20 },
    { subject: '분임조 회합 (5)', score: detailEval.scores.meetingScore, fullMark: 5 },
    { subject: '테마진행 (20)', score: detailEval.scores.themeProgressScore, fullMark: 20 },
    { subject: '계획달성 (5)', score: detailEval.scores.planAchievementScore, fullMark: 5 },
    { subject: '테마완료 (10)', score: detailEval.scores.themeGradeScore + detailEval.scores.themeCumulativeScore, fullMark: 10 },
    { subject: '제안활동 (25)', score: detailEval.scores.proposalScore, fullMark: 25 },
    { subject: '불합리적출 (20)', score: detailEval.scores.unreasonableCountScore + detailEval.scores.unreasonableResolveScore, fullMark: 20 },
  ] : [];

  return (
    <div className="space-y-8">
      {/* 1. 포상 하이라이트 카세트 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1등 포상 카드 */}
        {awardStatuses.find(a => a.rank === 1) ? (
          (() => {
            const first = awardStatuses.find(a => a.rank === 1)!;
            return (
              <div className={`relative overflow-hidden rounded-2xl p-6 border transition-all ${
                first.isFirstPlaceAward 
                  ? 'bg-gradient-to-br from-amber-950/40 via-amber-900/20 to-slate-900 border-amber-500/50 shadow-2xl shadow-amber-500/10 ring-1 ring-amber-500/30'
                  : 'bg-slate-900 border-slate-800'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 bg-amber-500/20 text-amber-400 rounded-2xl border border-amber-500/30">
                      <Trophy className="w-8 h-8 animate-bounce" />
                    </div>
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-amber-400">1등 당월 최고 실적</span>
                      <h3 className="text-2xl font-extrabold text-slate-100">[{first.circleName}] 분임조</h3>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-black text-amber-400">{first.score}점</div>
                    <span className="text-xs text-slate-400">100점 만점</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-amber-500/20 flex items-center justify-between text-xs">
                  <span className="font-semibold text-amber-300">{first.awardText}</span>
                  {first.isFirstPlaceAward && (
                    <span className="bg-amber-500/20 text-amber-300 px-2.5 py-1 rounded-full border border-amber-500/30 font-bold">
                      🏆 최우수 포상 확정 (70점 이상)
                    </span>
                  )}
                </div>
              </div>
            );
          })()
        ) : null}

        {/* 2등 포상 카드 */}
        {awardStatuses.find(a => a.rank === 2) ? (
          (() => {
            const second = awardStatuses.find(a => a.rank === 2)!;
            return (
              <div className={`relative overflow-hidden rounded-2xl p-6 border transition-all ${
                second.isSecondPlaceAward 
                  ? 'bg-gradient-to-br from-slate-800/80 via-slate-900 to-cyan-950/30 border-cyan-500/50 shadow-2xl shadow-cyan-500/10 ring-1 ring-cyan-500/30'
                  : 'bg-slate-900 border-slate-800'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 bg-cyan-500/20 text-cyan-400 rounded-2xl border border-cyan-500/30">
                      <Medal className="w-8 h-8" />
                    </div>
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">2등 우수 실적</span>
                      <h3 className="text-2xl font-extrabold text-slate-100">[{second.circleName}] 분임조</h3>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-black text-cyan-400">{second.score}점</div>
                    <span className="text-xs text-slate-400">100점 만점</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-cyan-500/20 flex items-center justify-between text-xs">
                  <span className="font-semibold text-cyan-300">{second.awardText}</span>
                  {second.isSecondPlaceAward ? (
                    <span className="bg-cyan-500/20 text-cyan-300 px-2.5 py-1 rounded-full border border-cyan-500/30 font-bold">
                      🎁 7만원 포상 지급 대상 (80점 이상)
                    </span>
                  ) : (
                    <span className="text-slate-500">80점 미만으로 2등 포상 미지급</span>
                  )}
                </div>
              </div>
            );
          })()
        ) : null}
      </div>

      {/* 2. 대시보드 비교 차트 & 종합 랭킹 리스트 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 분임조 점수 비교 바 차트 */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-indigo-400" />
              <h3 className="text-lg font-bold text-slate-100">분임조별 평가 분야 점수 비교</h3>
            </div>
            <span className="text-xs text-slate-400">단위: 점수(점)</span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', color: '#f8fafc' }} 
                />
                <Bar dataKey="3정5S" stackId="a" fill="#f59e0b" radius={[0, 0, 0, 0]} />
                <Bar dataKey="분임조" stackId="a" fill="#06b6d4" radius={[0, 0, 0, 0]} />
                <Bar dataKey="제안" stackId="a" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-center space-x-6 mt-4 text-xs font-semibold">
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-sm bg-amber-500 inline-block" />
              <span className="text-slate-300">3정 5S (20점)</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-sm bg-cyan-500 inline-block" />
              <span className="text-slate-300">분임조 (40점)</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block" />
              <span className="text-slate-300">제안 (40점)</span>
            </div>
          </div>
        </div>

        {/* 종합 랭킹 목록 */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-100 mb-4 flex items-center space-x-2">
              <Award className="w-5 h-5 text-amber-400" />
              <span>{targetYearMonth} 최종 집계 순위</span>
            </h3>

            <div className="space-y-3">
              {awardStatuses.map((item) => (
                <div
                  key={item.circleName}
                  onClick={() => setSelectedDetailCircle(item.circleName)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                    selectedDetailCircle === item.circleName 
                      ? 'bg-indigo-600/20 border-indigo-500 text-white' 
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                      item.rank === 1 ? 'bg-amber-500 text-slate-950' :
                      item.rank === 2 ? 'bg-cyan-400 text-slate-950' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {item.rank}
                    </span>
                    <span className="font-bold">{item.circleName}</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="font-extrabold text-indigo-400 text-lg">{item.score}점</span>
                    <ChevronRight className="w-4 h-4 text-slate-500" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs text-slate-500 mt-4 text-center">
            분임조를 클릭하면 아래에서 레이더 차트 및 세부 평가 항목을 확인하실 수 있습니다.
          </p>
        </div>
      </div>

      {/* 3. 클릭 시 분임조별 세부 현황 상세 분석 (Modal/Section) */}
      {selectedDetailCircle && detailEval && (
        <div className="bg-slate-900 border border-indigo-500/30 rounded-2xl p-6 shadow-2xl animate-fade-in">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
            <div>
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">세부 평가 분석</span>
              <h3 className="text-2xl font-bold text-slate-100">[{selectedDetailCircle}] 분임조 세부 리포트</h3>
            </div>
            <button
              onClick={() => setSelectedDetailCircle(null)}
              className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg"
            >
              닫기
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            {/* 레이더 차트 */}
            <div className="h-80 w-full flex items-center justify-center bg-slate-950/40 rounded-xl p-4 border border-slate-800">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={detailRadarData}>
                  <PolarGrid stroke="#334155" />
                  <PolarAngleAxis dataKey="subject" stroke="#94a3b8" fontSize={11} />
                  <PolarRadiusAxis angle={30} domain={[0, 25]} stroke="#475569" fontSize={10} />
                  <Radar name={selectedDetailCircle} dataKey="score" stroke="#818cf8" fill="#6366f1" fillOpacity={0.5} />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* 항목별 텍스트 스펙 테이블 */}
            <div className="space-y-4 text-sm">
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                <h4 className="font-bold text-amber-400 mb-2">1. 3정 5S (획득: {detailEval.scores.maintScore}점)</h4>
                <p className="text-xs text-slate-400">관할구역 불합리 발견: {detailEval.scores.maintDefectCount}건 (20 - {detailEval.scores.maintDefectCount}점)</p>
              </div>

              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                <h4 className="font-bold text-cyan-400 mb-2">2. 분임조 (획득: {
                  detailEval.scores.meetingScore + 
                  detailEval.scores.themeProgressScore + 
                  detailEval.scores.planAchievementScore + 
                  detailEval.scores.themeGradeScore + 
                  detailEval.scores.themeCumulativeScore
                }점)</h4>
                <ul className="text-xs text-slate-400 space-y-1">
                  <li>• 회합 횟수: {detailEval.scores.meetingCount}회 ({detailEval.scores.meetingScore}점)</li>
                  <li>• 테마 진행: {detailEval.scores.prevThemeStep} → {detailEval.scores.currThemeStep} ({detailEval.scores.themeProgressSteps}단계 전진, {detailEval.scores.themeProgressScore}점)</li>
                  <li>• 계획 달성률: {detailEval.scores.planAchievementRate}% ({detailEval.scores.planAchievementScore}점)</li>
                  <li>• 테마 완료 등급 & 누적: {detailEval.scores.themeGrade} ({detailEval.scores.themeGradeScore}점), 누적 {detailEval.scores.themeCumulativeCount}건 ({detailEval.scores.themeCumulativeScore}점)</li>
                </ul>
              </div>

              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                <h4 className="font-bold text-emerald-400 mb-2">3. 제안 (획득: {
                  detailEval.scores.proposalScore + 
                  detailEval.scores.unreasonableCountScore + 
                  detailEval.scores.unreasonableResolveScore
                }점)</h4>
                <ul className="text-xs text-slate-400 space-y-1">
                  <li>• 제안 건수: 총 {detailEval.scores.totalProposalCount}건 (인당 {detailEval.scores.proposalPerPerson}건 → {detailEval.scores.proposalScore}점)</li>
                  <li>• 불합리 적출: 총 {detailEval.scores.totalUnreasonableCount}건 (인당 {detailEval.scores.unreasonablePerPerson}건 → {detailEval.scores.unreasonableCountScore}점)</li>
                  <li>• 불합리 해결률: {detailEval.scores.unreasonableResolveRate}% ({detailEval.scores.unreasonableResolveScore}점)</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
