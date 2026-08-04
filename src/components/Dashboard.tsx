import React, { useState } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import type { CircleName, MonthlyCircleEvaluation, AwardStatus } from '../types';
import { Trophy, Award, Medal, ChevronRight, BarChart3, FileDown, Loader2 } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar 
} from 'recharts';

interface DashboardProps {
  evaluations: Record<CircleName, MonthlyCircleEvaluation>;
  targetYearMonth: string;
}

export const Dashboard: React.FC<DashboardProps> = ({ evaluations, targetYearMonth }) => {
  const [selectedDetailCircle, setSelectedDetailCircle] = useState<CircleName | null>(null);
  const [isPdfGenerating, setIsPdfGenerating] = useState(false);
  const [isSummaryPdfGenerating, setIsSummaryPdfGenerating] = useState(false);

  const handleDownloadSummaryPDF = async () => {
    const element = document.getElementById('summary-pdf-template');
    if (!element) {
      alert('PDF 템플릿 요소를 찾을 수 없습니다.');
      return;
    }
    
    setIsSummaryPdfGenerating(true);
    // html2canvas의 오프스크린 캡처 버그 방지를 위해 캡처 직전에만 요소를 화면 영역(z-index 후면)으로 이동
    const originalStyle = element.style.cssText;
    element.style.cssText = 'position: fixed; top: 0px; left: 0px; width: 794px; z-index: -100; background: white;';
    
    // 약간의 딜레이를 주어 DOM이 완전히 업데이트되도록 대기
    await new Promise(resolve => setTimeout(resolve, 300));

    try {
      const canvas = await html2canvas(element, { 
        scale: 2, 
        useCORS: true, 
        backgroundColor: '#ffffff',
        scrollY: 0,
        windowY: 0,
        logging: false
      });
      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      if (!canvas.width || !canvas.height) {
        throw new Error("캡처된 캔버스의 크기가 0입니다.");
      }

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`월간_종합_평가_보고서_${targetYearMonth}.pdf`);
    } catch (err: any) {
      console.error('PDF 다운로드 실패:', err);
      alert(`PDF 생성 중 오류가 발생했습니다: ${err?.message || err}`);
    } finally {
      element.style.cssText = originalStyle;
      setIsSummaryPdfGenerating(false);
    }
  };

  const handleDownloadPDF = async () => {
    const element = document.getElementById('pdf-report-template');
    if (!element) return;
    
    setIsPdfGenerating(true);
    const originalStyle = element.style.cssText;
    element.style.cssText = 'position: fixed; top: 0px; left: 0px; width: 794px; z-index: -100; background: white;';
    await new Promise(resolve => setTimeout(resolve, 300));

    try {
      const canvas = await html2canvas(element, { 
        scale: 2, 
        useCORS: true, 
        backgroundColor: '#ffffff',
        scrollY: 0,
        windowY: 0,
        logging: false
      });
      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      if (!canvas.width || !canvas.height) {
        throw new Error("캡처된 캔버스의 크기가 0입니다.");
      }

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`분임조_평가_보고서_${selectedDetailCircle}_${targetYearMonth}.pdf`);
    } catch (err: any) {
      console.error('PDF 다운로드 실패:', err);
      alert(`PDF 생성 중 오류가 발생했습니다: ${err?.message || err}`);
    } finally {
      element.style.cssText = originalStyle;
      setIsPdfGenerating(false);
    }
  };

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
      awardText = '1등 포상 대상 (최우수 분임조)';
    } else if (rank === 2 && score >= 80) {
      isSecondPlaceAward = true;
      awardText = '2등 포상 대상 (7만원 수령)';
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
      {/* 0. 대시보드 헤더 및 종합 다운로드 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between glass-card p-5 rounded-2xl animate-fade-in-up">
        <div>
          <h2 className="text-xl font-bold text-slate-100">{targetYearMonth} 분임조 종합 평가 대시보드</h2>
          <p className="text-xs text-slate-400 mt-1">이번 달 5개 분임조의 실적과 최종 순위, 포상 대상을 확인하세요.</p>
        </div>
        <button
          onClick={handleDownloadSummaryPDF}
          disabled={isSummaryPdfGenerating}
          className="mt-4 sm:mt-0 flex items-center justify-center space-x-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-emerald-500/25 disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5"
        >
          {isSummaryPdfGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileDown className="w-5 h-5" />}
          <span className="text-sm font-semibold">{isSummaryPdfGenerating ? 'PDF 생성 중...' : '품의서용 종합 보고서 다운로드'}</span>
        </button>
      </div>

      {/* 1. 포상 하이라이트 카세트 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1등 포상 카드 */}
        {awardStatuses.find(a => a.rank === 1) ? (
          (() => {
            const first = awardStatuses.find(a => a.rank === 1)!;
            return (
              <div className={`relative overflow-hidden rounded-2xl p-6 transition-all duration-300 ${
                first.isFirstPlaceAward 
                  ? 'bg-gradient-to-br from-amber-950/60 via-amber-900/30 to-transparent border border-amber-500/50 shadow-2xl shadow-amber-500/20 ring-1 ring-amber-500/30 backdrop-blur-xl hover:-translate-y-1'
                  : 'glass-card'
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
                      최우수 포상 확정 (70점 이상)
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
              <div className={`relative overflow-hidden rounded-2xl p-6 transition-all duration-300 ${
                second.isSecondPlaceAward 
                  ? 'bg-gradient-to-br from-cyan-950/60 via-cyan-900/30 to-transparent border border-cyan-500/50 shadow-2xl shadow-cyan-500/20 ring-1 ring-cyan-500/30 backdrop-blur-xl hover:-translate-y-1'
                  : 'glass-card'
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
                      7만원 포상 지급 대상 (80점 이상)
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
        <div className="lg:col-span-2 glass-card rounded-2xl p-6 shadow-xl">
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
                  cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                  contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(12px)', borderColor: 'rgba(255, 255, 255, 0.1)', borderRadius: '0.75rem', color: '#f8fafc', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }} 
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
        <div className="glass-card rounded-2xl p-6 shadow-xl flex flex-col justify-between">
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
                  className={`p-3.5 rounded-xl border transition-all duration-300 cursor-pointer flex items-center justify-between transform hover:scale-[1.02] ${
                    selectedDetailCircle === item.circleName 
                      ? 'bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border-indigo-400 text-white shadow-[0_0_15px_rgba(99,102,241,0.2)]' 
                      : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10 text-slate-200'
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
        <div className="glass-panel border-indigo-500/50 rounded-2xl p-6 shadow-[0_0_30px_rgba(99,102,241,0.15)] animate-fade-in-up mt-8">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
            <div>
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">세부 평가 분석</span>
              <h3 className="text-2xl font-bold text-slate-100">[{selectedDetailCircle}] 분임조 세부 리포트</h3>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleDownloadPDF}
                disabled={isPdfGenerating}
                className="flex items-center space-x-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white px-4 py-2 rounded-xl transition-all shadow-lg shadow-indigo-500/25 disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5"
              >
                {isPdfGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
                <span className="text-sm font-semibold">{isPdfGenerating ? 'PDF 생성 중...' : 'PDF 다운로드'}</span>
              </button>
              <button
                onClick={() => setSelectedDetailCircle(null)}
                className="text-sm bg-white/10 hover:bg-white/20 border border-white/10 text-white px-4 py-2 rounded-xl transition-all hover:shadow-[0_0_10px_rgba(255,255,255,0.1)]"
              >
                닫기
              </button>
            </div>
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
              <div className="bg-white/5 p-4 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                <h4 className="font-bold text-amber-400 mb-2 drop-shadow-sm">1. 3정 5S (획득: {detailEval.scores.maintScore}점)</h4>
                <p className="text-xs text-slate-400">관할구역 불합리 발견: {detailEval.scores.maintDefectCount}건 (20 - {detailEval.scores.maintDefectCount}점)</p>
              </div>

              <div className="bg-white/5 p-4 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                <h4 className="font-bold text-cyan-400 mb-2 drop-shadow-sm">2. 분임조 (획득: {
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

              <div className="bg-white/5 p-4 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                <h4 className="font-bold text-emerald-400 mb-2 drop-shadow-sm">3. 제안 (획득: {
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

          {/* 숨겨진 PDF용 보고서 템플릿 (인쇄에 최적화된 밝은 테마 및 고정 크기) */}
          <div 
            id="pdf-report-template" 
            className="bg-[#ffffff] text-[#000000] px-10 pt-6 pb-12"
            style={{ position: 'absolute', top: '-9999px', left: '-9999px', width: '794px', minHeight: '1123px' }}
          >
            <h1 className="text-3xl font-black text-center mb-6 border-b-2 border-[#000000] pb-4 text-[#000000]">
              분임조 세부 평가 결과 보고서
            </h1>

            <div className="flex items-end justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-[#1e293b]">{selectedDetailCircle} 분임조</h2>
                <p className="text-[#475569] mt-1">{targetYearMonth} 기준 평가 내역</p>
              </div>
              <div className="text-3xl font-black text-[#4338ca]">
                총점: {detailEval.scores.totalScore}점
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8 mb-6">
              {/* 레이더 차트 영역 */}
              <div className="flex justify-center items-center bg-[#f8fafc] border border-[#cbd5e1] rounded-xl p-4">
                <div className="w-[360px] h-[320px]">
                  <RadarChart width={360} height={320} data={detailRadarData}>
                    <PolarGrid stroke="#cbd5e1" />
                    <PolarAngleAxis dataKey="subject" stroke="#334155" fontSize={12} fontWeight="bold" />
                    <PolarRadiusAxis angle={30} domain={[0, 25]} stroke="#94a3b8" fontSize={10} />
                    <Radar name={selectedDetailCircle} dataKey="score" stroke="#4f46e5" fill="#6366f1" fillOpacity={0.4} isAnimationActive={false} />
                  </RadarChart>
                </div>
              </div>

              {/* 점수 요약 */}
              <div className="space-y-4">
                <div className="border border-gray-300 rounded p-4">
                  <h4 className="font-bold text-lg mb-2 text-[#000000]">1. 3정 5S (획득: {detailEval.scores.maintScore}점)</h4>
                  <ul className="list-disc list-inside text-gray-700">
                    <li>관할구역 불합리 발견: {detailEval.scores.maintDefectCount}건</li>
                  </ul>
                </div>
                <div className="border border-gray-300 rounded p-4">
                  <h4 className="font-bold text-lg mb-2 text-[#000000]">2. 분임조 (획득: {
                    detailEval.scores.meetingScore + 
                    detailEval.scores.themeProgressScore + 
                    detailEval.scores.planAchievementScore + 
                    detailEval.scores.themeGradeScore + 
                    detailEval.scores.themeCumulativeScore
                  }점)</h4>
                  <ul className="list-disc list-inside text-gray-700">
                    <li>회합 횟수: {detailEval.scores.meetingCount}회</li>
                    <li>계획 달성률: {detailEval.scores.planAchievementRate}%</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* 항목별 세부 텍스트 */}
            <div className="border border-gray-300 rounded p-4">
              <h4 className="font-bold text-lg mb-2 text-[#000000]">3. 제안 (획득: {
                detailEval.scores.proposalScore + 
                detailEval.scores.unreasonableCountScore + 
                detailEval.scores.unreasonableResolveScore
              }점)</h4>
              <ul className="list-disc list-inside text-gray-700">
                <li>제안 건수: 총 {detailEval.scores.totalProposalCount}건 (인당 {detailEval.scores.proposalPerPerson}건)</li>
                <li>불합리 해결률: {detailEval.scores.unreasonableResolveRate}%</li>
              </ul>
            </div>
            
            <div className="mt-8 pt-4 border-t border-gray-400 text-center text-sm text-gray-500">
              본 문서는 시스템을 통해 자동 생성된 분임조 평가 결과 보고서입니다.
            </div>
          </div>
        </div>
      )}

      {/* 월간 종합 보고서 (인쇄용 숨김 템플릿) */}
      <div 
        id="summary-pdf-template" 
        className="bg-[#ffffff] text-[#000000] px-10 pt-8 pb-12"
        style={{ position: 'absolute', top: '-9999px', left: '-9999px', width: '794px', minHeight: '1123px' }}
      >
        <h1 className="text-3xl font-black text-center mb-6 border-b-2 border-[#000000] pb-4 text-[#000000]">
          {targetYearMonth} 분임조 종합 평가 결과 보고서
        </h1>

        {/* 메인 막대 차트 */}
        <div className="mb-6">
          <h3 className="text-lg font-bold mb-3 text-[#000000]">■ 분임조별 종합 점수 비교</h3>
          <div className="w-full flex justify-center bg-[#f9fafb] border border-[#e5e7eb] p-4 pt-6 rounded">
            <BarChart width={700} height={250} data={barChartData} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="name" stroke="#475569" fontSize={12} tickLine={false} />
              <YAxis stroke="#475569" fontSize={12} domain={[0, 100]} />
              <Bar dataKey="3정5S" stackId="a" fill="#f59e0b" isAnimationActive={false} />
              <Bar dataKey="분임조" stackId="a" fill="#06b6d4" isAnimationActive={false} />
              <Bar dataKey="제안" stackId="a" fill="#10b981" isAnimationActive={false} />
            </BarChart>
          </div>
          <div className="flex items-center justify-center space-x-6 mt-3 text-xs font-semibold text-[#4b5563]">
            <div className="flex items-center space-x-2"><span className="w-3 h-3 bg-[#f59e0b] inline-block"/><span>3정 5S (20점)</span></div>
            <div className="flex items-center space-x-2"><span className="w-3 h-3 bg-[#06b6d4] inline-block"/><span>분임조 (40점)</span></div>
            <div className="flex items-center space-x-2"><span className="w-3 h-3 bg-[#10b981] inline-block"/><span>제안 (40점)</span></div>
          </div>
        </div>

        {/* 종합 평가 점수 표 */}
        <div className="mb-6">
          <h3 className="text-lg font-bold mb-3 text-[#000000]">■ 분임조별 세부 평가 결과</h3>
          <table className="w-full border-collapse border border-[#9ca3af] text-center text-sm">
            <thead>
              <tr className="bg-[#f3f4f6] font-bold text-[#1f2937]">
                <td className="border border-[#9ca3af] py-2">순위</td>
                <td className="border border-[#9ca3af] py-2">분임조명</td>
                <td className="border border-[#9ca3af] py-2">3정 5S</td>
                <td className="border border-[#9ca3af] py-2">회합</td>
                <td className="border border-[#9ca3af] py-2">테마진행</td>
                <td className="border border-[#9ca3af] py-2">계획달성</td>
                <td className="border border-[#9ca3af] py-2">테마완료</td>
                <td className="border border-[#9ca3af] py-2">제안활동</td>
                <td className="border border-[#9ca3af] py-2">불합리적출</td>
                <td className="border border-[#9ca3af] py-2 text-[#4338ca]">총점</td>
              </tr>
            </thead>
            <tbody>
              {sortedEvals.map((e, idx) => {
                const award = awardStatuses.find(a => a.circleName === e.circleName);
                const isFirst = award?.isFirstPlaceAward;
                const isSecond = award?.isSecondPlaceAward;
                return (
                  <tr key={e.circleName} className={isFirst ? "bg-[#fffbeb]" : isSecond ? "bg-[#ecfeff]" : ""}>
                    <td className="border border-[#9ca3af] py-2 font-bold">{idx + 1}</td>
                    <td className="border border-[#9ca3af] py-2 font-bold">{e.circleName}</td>
                    <td className="border border-[#9ca3af] py-2">{e.scores.maintScore}</td>
                    <td className="border border-[#9ca3af] py-2">{e.scores.meetingScore}</td>
                    <td className="border border-[#9ca3af] py-2">{e.scores.themeProgressScore}</td>
                    <td className="border border-[#9ca3af] py-2">{e.scores.planAchievementScore}</td>
                    <td className="border border-[#9ca3af] py-2">{e.scores.themeGradeScore + e.scores.themeCumulativeScore}</td>
                    <td className="border border-[#9ca3af] py-2">{e.scores.proposalScore}</td>
                    <td className="border border-[#9ca3af] py-2">{e.scores.unreasonableCountScore + e.scores.unreasonableResolveScore}</td>
                    <td className="border border-[#9ca3af] py-2 font-black text-[#4338ca]">{e.scores.totalScore}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* 포상 내역 */}
        <div>
          <h3 className="text-lg font-bold mb-4 text-[#000000]">■ 포상 내역 종합</h3>
          <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded p-4 text-sm space-y-2 text-[#1f2937]">
            {awardStatuses.find(a => a.isFirstPlaceAward) ? (
              <div className="flex items-center space-x-2"><span className="font-bold text-[#d97706] w-24">[최우수 포상]</span> <span>{awardStatuses.find(a => a.isFirstPlaceAward)?.circleName} 분임조 (70점 이상 당월 최고점)</span></div>
            ) : (
              <div className="flex items-center space-x-2"><span className="font-bold text-[#6b7280] w-24">[최우수 포상]</span> <span>대상 분임조 없음 (조건 미달)</span></div>
            )}
            {awardStatuses.find(a => a.isSecondPlaceAward) ? (
              <div className="flex items-center space-x-2"><span className="font-bold text-[#0891b2] w-24">[우수 포상]</span> <span>{awardStatuses.find(a => a.isSecondPlaceAward)?.circleName} 분임조 (80점 이상 당월 2등)</span></div>
            ) : (
              <div className="flex items-center space-x-2"><span className="font-bold text-[#6b7280] w-24">[우수 포상]</span> <span>대상 분임조 없음 (조건 미달)</span></div>
            )}
          </div>
        </div>
        
        <div className="mt-8 pt-4 border-t border-[#9ca3af] text-center text-sm text-[#6b7280]">
          본 문서는 품질 분임조 평가 대시보드 시스템을 통해 자동 생성되었습니다.
        </div>
      </div>
    </div>
  );
};
