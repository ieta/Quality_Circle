import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { THEME_STEPS } from '../types';
import type { CircleName, ThemeStep } from '../types';
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle } from 'lucide-react';

interface ExcelImporterProps {
  onImportProposalData: (data: Record<CircleName, { proposals: number; unreasonables: number }>) => void;
  onImportMeetingData: (data: Record<CircleName, { meetingCount: number; latestStep?: ThemeStep }>, yearMonth: string) => void;
  targetYearMonth: string;
}

export const ExcelImporter: React.FC<ExcelImporterProps> = ({
  onImportProposalData,
  onImportMeetingData,
  targetYearMonth
}) => {
  const [proposalStatus, setProposalStatus] = useState<string | null>(null);
  const [meetingStatus, setMeetingStatus] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [isProposalDragging, setIsProposalDragging] = useState(false);
  const [isMeetingDragging, setIsMeetingDragging] = useState(false);

  // 공통 파일 읽기 함수 (File 객체 직접 받음)
  const processProposalFile = (file: File) => {
    setErrorMsg(null);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = evt.target?.result;
        const wb = XLSX.read(data, { type: 'array' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rows = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1 });

        if (!rows || rows.length < 2) {
          setErrorMsg('제안실적 엑셀 데이터 내용이 부족합니다.');
          return;
        }

        // 헤더 행 찾기 ('분임조' 포함 행)
        let headerIdx = -1;
        for (let i = 0; i < Math.min(10, rows.length); i++) {
          const rowArr = rows[i] || [];
          const rowStr = rowArr.map((c: any) => String(c || '').trim()).join(' ');
          if (rowStr.includes('분임조')) {
            headerIdx = i;
            break;
          }
        }

        if (headerIdx === -1) headerIdx = 1; // 기본 2번째 행 (제안.xlsx 구조)

        const headers: string[] = (rows[headerIdx] || []).map((h: any) => String(h || '').trim());
        const upperHeaders: string[] = headerIdx > 0 ? (rows[headerIdx - 1] || []).map((h: any) => String(h || '').trim()) : [];
        
        // 1. '분임조' 열 위치 (D열 / 인덱스 3)
        let circleCol = headers.findIndex(h => h.includes('분임조'));
        if (circleCol === -1) circleCol = upperHeaders.findIndex(h => h.includes('분임조'));
        if (circleCol === -1) circleCol = 3; // 기본 D열

        // 2. '총 제안건수' 열 위치 (K열 / 인덱스 10)
        let proposalCol = headers.findIndex(h => h.includes('총 제안건수') || h.includes('총제안건수') || h.includes('제안건수'));
        if (proposalCol === -1) proposalCol = upperHeaders.findIndex(h => h.includes('총 제안건수') || h.includes('총제안건수') || h.includes('제안건수'));
        if (proposalCol === -1) proposalCol = headers.findIndex(h => h.includes('제안'));
        if (proposalCol === -1) proposalCol = 10; // 기본 K열 (제안.xlsx 인덱스 10)

        // 3. '불합리' 열 위치
        let unreachCol = headers.findIndex(h => h.includes('불합리') || h.includes('적출'));
        if (unreachCol === -1) unreachCol = upperHeaders.findIndex(h => h.includes('불합리') || h.includes('적출'));

        const resultMap: Record<CircleName, { proposals: number; unreasonables: number }> = {
          '금메달': { proposals: 0, unreasonables: 0 },
          '한마음': { proposals: 0, unreasonables: 0 },
          '독수리': { proposals: 0, unreasonables: 0 },
          '아리울': { proposals: 0, unreasonables: 0 },
          '새만금': { proposals: 0, unreasonables: 0 }
        };

        let processedRows = 0;
        let totalSumProposals = 0;

        for (let i = headerIdx + 1; i < rows.length; i++) {
          const row = rows[i];
          if (!row || row.length === 0) continue;

          const rawCircleName = String(row[circleCol] || '').trim();
          if (!rawCircleName || rawCircleName.includes('합계') || rawCircleName.includes('평균')) continue;

          const targetCircle = (['금메달', '한마음', '독수리', '아리울', '새만금'] as CircleName[]).find(
            name => rawCircleName.includes(name)
          );

          if (targetCircle) {
            const rawP = row[proposalCol];
            const pVal = Number(String(rawP !== undefined && rawP !== null ? rawP : 0).replace(/[^0-9.]/g, '')) || 0;
            
            const rawU = unreachCol !== -1 ? row[unreachCol] : 0;
            const uVal = Number(String(rawU !== undefined && rawU !== null ? rawU : 0).replace(/[^0-9.]/g, '')) || 0;

            resultMap[targetCircle].proposals += pVal;
            resultMap[targetCircle].unreasonables += uVal;
            totalSumProposals += pVal;
            processedRows++;
          }
        }

        const colName = headers[proposalCol] || '총 제안건수';
        onImportProposalData(resultMap);
        setProposalStatus(`제안실적 파싱 완료 (${file.name}, [${colName}] 열 적용, ${processedRows}명 집계, 총 제안 ${totalSumProposals}건)`);
      } catch (err: any) {
        setErrorMsg('제안실적 엑셀 처리 중 오류가 발생했습니다: ' + err.message);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const processMeetingFile = (file: File) => {
    setErrorMsg(null);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = evt.target?.result;
        const wb = XLSX.read(data, { type: 'array' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rows = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1 });

        if (!rows || rows.length < 2) {
          setErrorMsg('회의록 엑셀 데이터 내용이 부족합니다.');
          return;
        }

        // 헤더 행 찾기 ('분임조' 포함 행)
        let headerIdx = -1;
        for (let i = 0; i < Math.min(15, rows.length); i++) {
          const rowArr = rows[i] || [];
          const rowStr = rowArr.map((c: any) => String(c || '').trim()).join(' ');
          if (rowStr.includes('분임조')) {
            headerIdx = i;
            break;
          }
        }

        if (headerIdx === -1) {
          setErrorMsg('회의록 엑셀에서 [분임조] 열 헤더를 찾을 수 없습니다.');
          return;
        }

        const headers: string[] = (rows[headerIdx] || []).map((h: any) => String(h || '').trim());
        let circleCol = headers.findIndex(h => h.includes('분임조'));
        let dateCol = headers.findIndex(h => h.includes('회합일자') || h.includes('일자') || h.includes('일시') || h.includes('날짜'));
        let stepCol = headers.findIndex(h => h.includes('현재단계') || h.includes('단계') || h.includes('진행단계'));

        const circleData: Record<CircleName, { meetingCount: number; latestDate: string; latestStep?: ThemeStep }> = {
          '금메달': { meetingCount: 0, latestDate: '' },
          '한마음': { meetingCount: 0, latestDate: '' },
          '독수리': { meetingCount: 0, latestDate: '' },
          '아리울': { meetingCount: 0, latestDate: '' },
          '새만금': { meetingCount: 0, latestDate: '' }
        };

        const targetParts = targetYearMonth.split('-'); // ["2026", "08"]
        const targetYear = targetParts[0];
        const targetMonthNum = parseInt(targetParts[1] || '0');

        let processedRows = 0;
        let matchedMonthRows = 0;

        for (let i = headerIdx + 1; i < rows.length; i++) {
          const row = rows[i];
          if (!row || row.length === 0) continue;

          const rawCircleName = String(row[circleCol] || '').trim();
          const targetCircle = (['금메달', '한마음', '독수리', '아리울', '새만금'] as CircleName[]).find(
            name => rawCircleName.includes(name)
          );

          if (targetCircle) {
            const rawDate = String(row[dateCol] || '').trim();
            
            // 다양한 회합일자 매칭 (2026-08, 2026.08, 2026/08, 또는 2026-8 등)
            const isMatchMonth = 
              rawDate.includes(targetYearMonth) || 
              rawDate.includes(targetYearMonth.replace('-', '.')) ||
              rawDate.includes(targetYearMonth.replace('-', '/')) ||
              (rawDate.includes(targetYear) && (rawDate.includes(`-${targetMonthNum}-`) || rawDate.includes(`.${targetMonthNum}.`) || rawDate.includes(`/${targetMonthNum}/`)));

            if (isMatchMonth) {
              circleData[targetCircle].meetingCount += 1;
              matchedMonthRows++;
            }

            const rawStepStr = String(row[stepCol] || '').trim();
            const matchedStep = THEME_STEPS.find(s => rawStepStr.includes(s) || s.includes(rawStepStr));

            if (matchedStep && (!circleData[targetCircle].latestDate || rawDate >= circleData[targetCircle].latestDate)) {
              circleData[targetCircle].latestDate = rawDate;
              circleData[targetCircle].latestStep = matchedStep;
            }

            processedRows++;
          }
        }

        const finalResult: Record<CircleName, { meetingCount: number; latestStep?: ThemeStep }> = {
          '금메달': { meetingCount: circleData['금메달'].meetingCount, latestStep: circleData['금메달'].latestStep },
          '한마음': { meetingCount: circleData['한마음'].meetingCount, latestStep: circleData['한마음'].latestStep },
          '독수리': { meetingCount: circleData['독수리'].meetingCount, latestStep: circleData['독수리'].latestStep },
          '아리울': { meetingCount: circleData['아리울'].meetingCount, latestStep: circleData['아리울'].latestStep },
          '새만금': { meetingCount: circleData['새만금'].meetingCount, latestStep: circleData['새만금'].latestStep }
        };

        onImportMeetingData(finalResult, targetYearMonth);
        setMeetingStatus(`회의록 파싱 완료 (${file.name}, 당월 회합 ${matchedMonthRows}건 집계)`);
      } catch (err: any) {
        setErrorMsg('회의록 엑셀 처리 중 오류가 발생했습니다: ' + err.message);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Drag & Drop 핸들러 (제안실적)
  const handleProposalDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsProposalDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processProposalFile(file);
  };

  // Drag & Drop 핸들러 (회의록)
  const handleMeetingDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsMeetingDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processMeetingFile(file);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl mb-8">
      <div className="flex items-center space-x-3 mb-4">
        <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg">
          <FileSpreadsheet className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-100">엑셀 데이터 자동 파싱 ({targetYearMonth} 평가 기준)</h3>
          <p className="text-sm text-slate-400">제안실적 및 회의록 엑셀(.xlsx)을 업로드 또는 드래그하여 분임조 실적을 자동 파싱하세요.</p>
        </div>
      </div>

      {errorMsg && (
        <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg flex items-center space-x-2 text-rose-400 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 1. 제안실적 엑셀 업로드 존 */}
        <div 
          onDragOver={(e) => { e.preventDefault(); setIsProposalDragging(true); }}
          onDragLeave={() => setIsProposalDragging(false)}
          onDrop={handleProposalDrop}
          className={`border-2 border-dashed transition-all rounded-xl p-5 text-center relative ${
            isProposalDragging 
              ? 'border-indigo-400 bg-indigo-500/10 scale-[1.01]' 
              : 'border-slate-700 hover:border-indigo-500/50 bg-slate-950/40'
          }`}
        >
          <input
            id="proposal-file-input"
            type="file"
            accept=".xlsx, .xls, .csv"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) processProposalFile(file);
            }}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          />
          
          <Upload className="w-8 h-8 text-indigo-400 mx-auto mb-2" />
          <span className="text-sm font-semibold text-slate-200 block">1. 제안실적 엑셀 업로드</span>
          <span className="text-xs text-slate-400 mt-1 block">파일 선택 또는 드래그 앤 드롭으로 가져오기</span>

          {proposalStatus && (
            <div className="mt-3 flex items-center justify-center space-x-1.5 text-emerald-400 text-xs font-medium relative z-20">
              <CheckCircle2 className="w-4 h-4" />
              <span>{proposalStatus}</span>
            </div>
          )}
        </div>

        {/* 2. 회의록 엑셀 업로드 존 */}
        <div 
          onDragOver={(e) => { e.preventDefault(); setIsMeetingDragging(true); }}
          onDragLeave={() => setIsMeetingDragging(false)}
          onDrop={handleMeetingDrop}
          className={`border-2 border-dashed transition-all rounded-xl p-5 text-center relative ${
            isMeetingDragging 
              ? 'border-cyan-400 bg-cyan-500/10 scale-[1.01]' 
              : 'border-slate-700 hover:border-indigo-500/50 bg-slate-950/40'
          }`}
        >
          <input
            id="meeting-file-input"
            type="file"
            accept=".xlsx, .xls, .csv"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) processMeetingFile(file);
            }}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          />

          <Upload className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
          <span className="text-sm font-semibold text-slate-200 block">2. 회의록 엑셀 업로드</span>
          <span className="text-xs text-slate-400 mt-1 block">파일 선택 또는 드래그 앤 드롭으로 가져오기</span>

          {meetingStatus && (
            <div className="mt-3 flex items-center justify-center space-x-1.5 text-cyan-400 text-xs font-medium relative z-20">
              <CheckCircle2 className="w-4 h-4" />
              <span>{meetingStatus}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
