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

  const formatKoreanTitle = (ym: string) => {
    // "2026-06" -> "2026년 6월"
    const parts = ym.split('-');
    if (parts.length === 2) {
      const year = parts[0];
      const month = parseInt(parts[1], 10);
      return `${year}년 ${month}월`;
    }
    return ym;
  };

  const handleDownloadSummaryPDF = async () => {
    const element = document.getElementById('summary-pdf-template');
    if (!element) {
      alert('PDF 템플릿 요소를 찾을 수 없습니다.');
      return;
    }
    
    setIsSummaryPdfGenerating(true);

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.left = '-9999px';
    iframe.style.top = '-9999px';
    iframe.style.width = '760px';
    iframe.style.height = '1120px';
    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentWindow?.document;
    if (!iframeDoc) {
      document.body.removeChild(iframe);
      setIsSummaryPdfGenerating(false);
      return;
    }

    // Modern Executive Office 스타일 서식 주입
    iframeDoc.open();
    iframeDoc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Apple SD Gothic Neo', 'Malgun Gothic', 'Inter', sans-serif; }
            html, body { width: 760px; overflow: hidden; background: #ffffff; color: #1e293b; line-height: 1.5; }
            
            /* 액자식 모던 문서 프레임 (상단 여백 2배 확장 & 하단 여백 정돈) */
            .doc-container {
              width: 760px;
              border: 2px solid #26247B;
              padding: 56px 36px 28px 36px;
              background: #ffffff;
              box-sizing: border-box;
            }
            
            /* 모던 헤더 디자인 */
            .doc-header {
              border-bottom: 3px solid #26247B;
              padding-bottom: 16px;
              margin-bottom: 24px;
              display: flex;
              justify-content: space-between;
              align-items: flex-end;
            }
            .doc-title {
              font-size: 25px;
              font-weight: 800;
              color: #26247B;
              letter-spacing: -0.8px;
              line-height: 1.2;
            }
            .doc-meta {
              text-align: right;
              font-size: 12px;
              color: #475569;
            }
            .doc-meta-date {
              font-weight: 700;
              color: #0f172a;
              font-size: 13px;
            }

            /* 섹션 타이틀 */
            .section-title {
              font-size: 14.5px;
              font-weight: 700;
              color: #0f172a;
              margin-top: 22px;
              margin-bottom: 12px;
              display: flex;
              align-items: center;
            }
            .section-title-badge {
              width: 4px;
              height: 14px;
              background: #26247B;
              display: inline-block;
              margin-right: 8px;
              border-radius: 2px;
            }

            /* 차트 컨테이너 */
            .chart-wrapper {
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 10px;
              padding: 18px;
              display: flex;
              flex-direction: column;
              align-items: center;
            }

            /* 깔끔한 백그라운드 단일 스타일 데이터 테이블 (하이라이트 제거) */
            .office-table {
              width: 100%;
              table-layout: fixed;
              border-collapse: collapse;
              margin-top: 6px;
              border-radius: 6px;
              overflow: hidden;
              border: 1px solid #cbd5e1;
              font-size: 12px;
            }
            .office-table th {
              background: #26247B;
              color: #ffffff;
              font-weight: 700;
              padding: 9px 4px;
              text-align: center;
              border: 1px solid #1e1b4b;
            }
            .office-table td {
              padding: 9px 4px;
              text-align: center;
              border: 1px solid #cbd5e1;
              color: #334155;
              background: #ffffff;
            }
            .office-table tr:nth-child(even) td {
              background: #f8fafc;
            }
            .total-cell {
              font-weight: 800 !important;
              color: #26247B !important;
              background: #f1f5f9 !important;
              font-size: 12.5px !important;
            }

            /* 포상 결과 카드 */
            .award-card {
              background: #f8fafc;
              border: 1px solid #cbd5e1;
              border-radius: 8px;
              padding: 16px;
              margin-top: 6px;
              font-size: 13px;
              line-height: 1.8;
            }
            .award-badge-first {
              display: inline-block;
              background: #fef3c7;
              color: #92400e;
              border: 1px solid #fde68a;
              font-weight: 700;
              padding: 1px 6px;
              border-radius: 4px;
              font-size: 11.5px;
              margin-right: 6px;
            }
            .award-badge-second {
              display: inline-block;
              background: #cffafe;
              color: #155e75;
              border: 1px solid #a5f3fc;
              font-weight: 700;
              padding: 1px 6px;
              border-radius: 4px;
              font-size: 11.5px;
              margin-right: 6px;
            }

            /* 푸터 */
            .doc-footer {
              margin-top: 32px;
              padding-top: 14px;
              border-top: 1px solid #cbd5e1;
              display: flex;
              justify-content: space-between;
              font-size: 11px;
              color: #64748b;
            }
          </style>
        </head>
        <body>
          ${element.innerHTML}
        </body>
      </html>
    `);
    iframeDoc.close();

    await new Promise(resolve => setTimeout(resolve, 350));

    try {
      const canvas = await html2canvas(iframeDoc.body, { 
        scale: 2, 
        useCORS: true, 
        backgroundColor: '#ffffff',
        logging: false
      });
      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${formatKoreanTitle(targetYearMonth)}_분임조_종합_평가_결과서.pdf`);
    } catch (err: any) {
      console.error('PDF 다운로드 실패:', err);
      alert(`PDF 생성 중 오류가 발생했습니다: ${err?.message || err}`);
    } finally {
      document.body.removeChild(iframe);
      setIsSummaryPdfGenerating(false);
    }
  };

  const handleDownloadPDF = async () => {
    const element = document.getElementById('pdf-report-template');
    if (!element) return;
    
    setIsPdfGenerating(true);

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.left = '-9999px';
    iframe.style.top = '-9999px';
    iframe.style.width = '840px';
    iframe.style.height = '1180px';
    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentWindow?.document;
    if (!iframeDoc) {
      document.body.removeChild(iframe);
      setIsPdfGenerating(false);
      return;
    }

    iframeDoc.open();
    iframeDoc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif; }
            body { background: #ffffff; color: #1e293b; padding: 36px 40px; line-height: 1.6; }
            .doc-container { border: 2px solid #26247B; padding: 32px; min-height: 1050px; background: #ffffff; }
            .doc-header { border-bottom: 3px solid #26247B; padding-bottom: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-end; }
            .doc-title { font-size: 24px; font-weight: 800; color: #26247B; }
          </style>
        </head>
        <body>
          ${element.innerHTML}
        </body>
      </html>
    `);
    iframeDoc.close();

    await new Promise(resolve => setTimeout(resolve, 350));

    try {
      const canvas = await html2canvas(iframeDoc.body, { 
        scale: 2, 
        useCORS: true, 
        backgroundColor: '#ffffff',
        logging: false
      });
      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${formatKoreanTitle(targetYearMonth)}_${selectedDetailCircle}_분임조_세부_평가_보고서.pdf`);
    } catch (err: any) {
      console.error('PDF 다운로드 실패:', err);
      alert(`PDF 생성 중 오류가 발생했습니다: ${err?.message || err}`);
    } finally {
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }
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
                <Bar dataKey="3정5S" stackId="a" fill="#FFB800" radius={[0, 0, 0, 0]} />
                <Bar dataKey="분임조" stackId="a" fill="#1BE7FF" radius={[0, 0, 0, 0]} />
                <Bar dataKey="제안" stackId="a" fill="#6EEB83" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-center space-x-6 mt-4 text-xs font-semibold">
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-sm bg-[#FFB800] inline-block" />
              <span className="text-slate-300">3정 5S (20점)</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-sm bg-[#1BE7FF] inline-block" />
              <span className="text-slate-300">분임조 (40점)</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-sm bg-[#6EEB83] inline-block" />
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

          {/* 세부 평가 팝업 인쇄용 숨김 템플릿 */}
          {detailEval && (
            <div 
              id="pdf-report-template" 
              className="bg-white text-slate-900 p-10 font-sans"
              style={{ position: 'absolute', top: '-9999px', left: '-9999px', width: '794px', minHeight: '1123px' }}
            >
          <div className="border-4 border-slate-900 p-8 h-full">
            {/* 오피스 스타일 헤더 */}
            <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4 mb-6">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-indigo-700 bg-indigo-100 px-2.5 py-1 rounded">SAMYANG INNOCHEM QUALITY CIRCLE</span>
                <h1 className="text-2xl font-black text-slate-900 mt-2 tracking-tight">분임조 세부 평가 결과 보고서</h1>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-500 font-semibold block">평가년월</span>
                <span className="text-lg font-bold text-slate-800">{targetYearMonth}</span>
              </div>
            </div>

            {/* 분임조 요약 카드 */}
            <div className="flex items-center justify-between bg-slate-900 text-white rounded-xl p-6 mb-6 shadow-md">
              <div>
                <div className="text-xs text-indigo-300 font-semibold uppercase tracking-wider">Target Circle</div>
                <h2 className="text-3xl font-black mt-0.5 text-white">{selectedDetailCircle} 분임조</h2>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 font-semibold block">종합 획득 점수</span>
                <span className="text-4xl font-black text-amber-400">{detailEval.scores.totalScore} <span className="text-lg text-white">/ 100점</span></span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-6">
              {/* 레이더 차트 영역 */}
              <div className="bg-slate-100 border border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center">
                <h3 className="text-sm font-bold text-slate-700 mb-2">■ 영역별 밸런스 차트</h3>
                <div className="w-[340px] h-[300px]">
                  <RadarChart width={340} height={300} data={detailRadarData}>
                    <PolarGrid stroke="#cbd5e1" />
                    <PolarAngleAxis dataKey="subject" stroke="#1e293b" fontSize={11} fontWeight="bold" />
                    <PolarRadiusAxis angle={30} domain={[0, 25]} stroke="#94a3b8" fontSize={9} />
                    <Radar name={selectedDetailCircle} dataKey="score" stroke="#4f46e5" fill="#6366f1" fillOpacity={0.45} isAnimationActive={false} />
                  </RadarChart>
                </div>
              </div>

              {/* 세부 점수 테이블 */}
              <div className="space-y-3">
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5">
                  <div className="flex justify-between items-center mb-1">
                    <h4 className="font-bold text-sm text-amber-900">1. 3정 5S</h4>
                    <span className="text-sm font-black text-amber-600">{detailEval.scores.maintScore} / 20점</span>
                  </div>
                  <p className="text-xs text-slate-600">· 관할구역 불합리 발견: <b>{detailEval.scores.maintDefectCount}건</b></p>
                </div>

                <div className="bg-cyan-50 border border-cyan-200 rounded-xl p-3.5">
                  <div className="flex justify-between items-center mb-1">
                    <h4 className="font-bold text-sm text-cyan-900">2. 분임조 활동</h4>
                    <span className="text-sm font-black text-cyan-600">{
                      detailEval.scores.meetingScore + 
                      detailEval.scores.themeProgressScore + 
                      detailEval.scores.planAchievementScore + 
                      detailEval.scores.themeGradeScore + 
                      detailEval.scores.themeCumulativeScore
                    } / 40점</span>
                  </div>
                  <p className="text-xs text-slate-600">· 회합 횟수: <b>{detailEval.scores.meetingCount}회</b> | 계획 달성률: <b>{detailEval.scores.planAchievementRate}%</b></p>
                  <p className="text-xs text-slate-600">· 테마 진행: <b>{detailEval.scores.prevThemeStep} ➔ {detailEval.scores.currThemeStep}</b></p>
                </div>

                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5">
                  <div className="flex justify-between items-center mb-1">
                    <h4 className="font-bold text-sm text-emerald-900">3. 제안 및 개선</h4>
                    <span className="text-sm font-black text-emerald-600">{
                      detailEval.scores.proposalScore + 
                      detailEval.scores.unreasonableCountScore + 
                      detailEval.scores.unreasonableResolveScore
                    } / 40점</span>
                  </div>
                  <p className="text-xs text-slate-600">· 제안 건수: <b>총 {detailEval.scores.totalProposalCount}건</b> (인당 {detailEval.scores.proposalPerPerson}건)</p>
                  <p className="text-xs text-slate-600">· 불합리 적출: <b>{detailEval.scores.totalUnreasonableCount}건</b> | 해결률: <b>{detailEval.scores.unreasonableResolveRate}%</b></p>
                </div>
              </div>
            </div>
            
            <div className="mt-12 pt-4 border-t border-slate-300 flex justify-between items-center text-xs text-slate-400">
              <span>삼양이노켐 품질분임조 평가위원회</span>
              <span>본 보고서는 디지털 집계 시스템에서 검증되어 자동 발행되었습니다.</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )}

      {/* 월간 종합 보고서 (인쇄용 모던 오피스 리뉴얼 템플릿) */}
      <div 
        id="summary-pdf-template" 
        className="bg-white text-slate-900 font-sans"
        style={{ position: 'absolute', top: '-9999px', left: '-9999px', width: '760px' }}
      >
        <div className="doc-container">
          <div>
            {/* 오피스 타이틀 헤더 (요청에 따라 상단 서식 뱃지 제거 및 타이틀 변경) */}
            <div className="doc-header">
              <div>
                <h1 className="doc-title">
                  {formatKoreanTitle(targetYearMonth)} 분임조 종합 평가 결과서
                </h1>
              </div>
              <div className="doc-meta">
                <div>보고서 작성일</div>
                <div className="doc-meta-date">{new Date().toLocaleDateString('ko-KR')}</div>
              </div>
            </div>

            {/* 1. 메인 종합 막대 차트 */}
            <div style={{ marginBottom: '24px' }}>
              <div className="section-title">
                <span className="section-title-badge"></span>
                <span>1. 분임조별 종합 점수 비교 차트</span>
              </div>
              <div className="chart-wrapper">
                <BarChart width={660} height={220} data={barChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="#475569" fontSize={11} tickLine={false} fontWeight="bold" />
                  <YAxis stroke="#475569" fontSize={11} domain={[0, 100]} />
                  <Bar dataKey="3정5S" stackId="a" fill="#FFB800" isAnimationActive={false} />
                  <Bar dataKey="분임조" stackId="a" fill="#1BE7FF" isAnimationActive={false} />
                  <Bar dataKey="제안" stackId="a" fill="#6EEB83" isAnimationActive={false} />
                </BarChart>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px', marginTop: '10px', fontSize: '11px', fontWeight: 'bold', color: '#475569' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: '12px', height: '12px', background: '#FFB800', borderRadius: '2px', display: 'inline-block' }}/><span>3정 5S (20점)</span></div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: '12px', height: '12px', background: '#1BE7FF', borderRadius: '2px', display: 'inline-block' }}/><span>분임조 (40점)</span></div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: '12px', height: '12px', background: '#6EEB83', borderRadius: '2px', display: 'inline-block' }}/><span>제안 (40점)</span></div>
                </div>
              </div>
            </div>

            {/* 2. 종합 평가 점수 표 (테이블 격자 구조 정밀 적용) */}
            <div style={{ marginBottom: '24px' }}>
              <div className="section-title">
                <span className="section-title-badge"></span>
                <span>2. 분임조별 항목별 세부 집계표</span>
              </div>
              <table className="office-table">
                <thead>
                  <tr>
                    <th style={{ width: '6%' }}>순위</th>
                    <th style={{ width: '11%' }}>분임조명</th>
                    <th style={{ width: '10%' }}>3정 5S</th>
                    <th style={{ width: '8%' }}>회합</th>
                    <th style={{ width: '11%' }}>테마진행</th>
                    <th style={{ width: '11%' }}>계획달성</th>
                    <th style={{ width: '11%' }}>테마완료</th>
                    <th style={{ width: '11%' }}>제안활동</th>
                    <th style={{ width: '13%' }}>불합리적출</th>
                    <th style={{ width: '8%', background: '#1e1b4b', color: '#fef08a' }}>총점</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedEvals.map((e, idx) => {
                    return (
                      <tr key={e.circleName}>
                        <td style={{ fontWeight: 'bold' }}>{idx + 1}</td>
                        <td style={{ fontWeight: 'bold' }}>{e.circleName}</td>
                        <td>{e.scores.maintScore}</td>
                        <td>{e.scores.meetingScore}</td>
                        <td>{e.scores.themeProgressScore}</td>
                        <td>{e.scores.planAchievementScore}</td>
                        <td>{e.scores.themeGradeScore + e.scores.themeCumulativeScore}</td>
                        <td>{e.scores.proposalScore}</td>
                        <td>{e.scores.unreasonableCountScore + e.scores.unreasonableResolveScore}</td>
                        <td className="total-cell">{e.scores.totalScore}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* 3. 포상 결의 및 총평 */}
            <div style={{ marginBottom: '24px' }}>
              <div className="section-title">
                <span className="section-title-badge"></span>
                <span>3. 당월 포상 심의 결과</span>
              </div>
              <div className="award-card">
                {awardStatuses.find(a => a.isFirstPlaceAward) ? (
                  <div style={{ marginBottom: '6px' }}>
                    <span className="award-badge-first">[최우수상]</span> 
                    <strong style={{ color: '#0f172a' }}>{awardStatuses.find(a => a.isFirstPlaceAward)?.circleName} 분임조</strong>
                    <span style={{ color: '#64748b', marginLeft: '6px' }}>(70점 이상 당월 최고 득점)</span>
                  </div>
                ) : (
                  <div style={{ marginBottom: '6px' }}>
                    <span style={{ background: '#e2e8f0', color: '#64748b', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', marginRight: '8px' }}>[최우수상]</span> 
                    <span style={{ color: '#64748b' }}>당월 대상 분임조 없음 (기준 점수 미달)</span>
                  </div>
                )}
                {awardStatuses.find(a => a.isSecondPlaceAward) ? (
                  <div>
                    <span className="award-badge-second">[우수상]</span> 
                    <strong style={{ color: '#0f172a' }}>{awardStatuses.find(a => a.isSecondPlaceAward)?.circleName} 분임조</strong>
                    <span style={{ color: '#64748b', marginLeft: '6px' }}>(80점 이상 당월 2위 달성 포상 대상)</span>
                  </div>
                ) : (
                  <div>
                    <span style={{ background: '#e2e8f0', color: '#64748b', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', marginRight: '8px' }}>[우수상]</span> 
                    <span style={{ color: '#64748b' }}>당월 대상 분임조 없음 (기준 점수 미달)</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="doc-footer">
            <span>삼양이노켐 주식회사 환경기술팀</span>
            <span>삼양이노켐 품질분임조 평가 및 집계 시스템 자동 생성 문서</span>
          </div>
        </div>
      </div>
    </div>
  );
};
