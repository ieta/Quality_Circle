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

  // 1. 제안 실적 엑셀 처리
  const handleProposalFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg(null);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rows = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1 });

        if (rows.length < 2) {
          setErrorMsg('제안실적 엑셀 데이터 내용이 부족합니다.');
          return;
        }

        // 헤더 행 찾기 ('분임조' 또는 '분임조명' 이 들어있는 행)
        let headerIdx = -1;
        for (let i = 0; i < Math.min(5, rows.length); i++) {
          const rowStr = JSON.stringify(rows[i] || []);
          if (rowStr.includes('분임조')) {
            headerIdx = i;
            break;
          }
        }

        if (headerIdx === -1) {
          setErrorMsg('엑셀에서 [분임조] 열을 찾을 수 없습니다.');
          return;
        }

        const headers: string[] = rows[headerIdx].map((h: any) => String(h || '').trim());
        const circleCol = headers.findIndex(h => h.includes('분임조'));
        const proposalCol = headers.findIndex(h => h.includes('총 제안건수') || h.includes('제안건수'));
        const unreachCol = headers.findIndex(h => h.includes('불합리') || h.includes('적출'));

        if (circleCol === -1) {
          setErrorMsg('엑셀 내에서 [분임조] 열 위치를 지정할 수 없습니다.');
          return;
        }

        const resultMap: Record<CircleName, { proposals: number; unreasonables: number }> = {
          '금메달': { proposals: 0, unreasonables: 0 },
          '한마음': { proposals: 0, unreasonables: 0 },
          '독수리': { proposals: 0, unreasonables: 0 },
          '아리울': { proposals: 0, unreasonables: 0 },
          '새만금': { proposals: 0, unreasonables: 0 }
        };

        let processedRows = 0;
        for (let i = headerIdx + 1; i < rows.length; i++) {
          const row = rows[i];
          if (!row || row.length === 0) continue;

          const rawCircleName = String(row[circleCol] || '').trim();
          const targetCircle = (['금메달', '한마음', '독수리', '아리울', '새만금'] as CircleName[]).find(
            name => rawCircleName.includes(name)
          );

          if (targetCircle) {
            const pVal = proposalCol !== -1 ? Number(row[proposalCol]) || 0 : 0;
            const uVal = unreachCol !== -1 ? Number(row[unreachCol]) || 0 : 0;

            resultMap[targetCircle].proposals += pVal;
            resultMap[targetCircle].unreasonables += uVal;
            processedRows++;
          }
        }

        onImportProposalData(resultMap);
        setProposalStatus(`제안실적 파싱 완료 (${processedRows}개 행 집계)`);
      } catch (err: any) {
        setErrorMsg('제안실적 엑셀 처리 중 오류가 발생했습니다: ' + err.message);
      }
    };
    reader.readAsBinaryString(file);
  };

  // 2. 회의록 엑셀 처리
  const handleMeetingFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg(null);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rows = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1 });

        if (rows.length < 2) {
          setErrorMsg('회의록 엑셀 데이터 내용이 부족합니다.');
          return;
        }

        // 헤더 행 찾기 ('분임조', '회합일자', '현재단계')
        let headerIdx = -1;
        for (let i = 0; i < Math.min(5, rows.length); i++) {
          const rowStr = JSON.stringify(rows[i] || []);
          if (rowStr.includes('분임조') && (rowStr.includes('회합일자') || rowStr.includes('현재단계'))) {
            headerIdx = i;
            break;
          }
        }

        if (headerIdx === -1) {
          setErrorMsg('회의록 엑셀에서 [분임조], [회합일자], [현재단계] 열을 찾을 수 없습니다.');
          return;
        }

        const headers: string[] = rows[headerIdx].map((h: any) => String(h || '').trim());
        const circleCol = headers.findIndex(h => h.includes('분임조'));
        const dateCol = headers.findIndex(h => h.includes('회합일자') || h.includes('일자'));
        const stepCol = headers.findIndex(h => h.includes('현재단계') || h.includes('단계'));

        const circleData: Record<CircleName, { meetingCount: number; latestDate: string; latestStep?: ThemeStep }> = {
          '금메달': { meetingCount: 0, latestDate: '' },
          '한마음': { meetingCount: 0, latestDate: '' },
          '독수리': { meetingCount: 0, latestDate: '' },
          '아리울': { meetingCount: 0, latestDate: '' },
          '새만금': { meetingCount: 0, latestDate: '' }
        };

        let processedRows = 0;
        for (let i = headerIdx + 1; i < rows.length; i++) {
          const row = rows[i];
          if (!row || row.length === 0) continue;

          const rawCircleName = String(row[circleCol] || '').trim();
          const targetCircle = (['금메달', '한마음', '독수리', '아리울', '새만금'] as CircleName[]).find(
            name => rawCircleName.includes(name)
          );

          if (targetCircle) {
            const rawDate = String(row[dateCol] || '').trim();
            // 해당 평가월(targetYearMonth: YYYY-MM) 과 매칭되는지 체크
            const isMatchMonth = rawDate.includes(targetYearMonth);

            if (isMatchMonth) {
              circleData[targetCircle].meetingCount += 1;
            }

            // 단계 파싱 (가장 최근 날짜의 단계 추출)
            const rawStepStr = String(row[stepCol] || '').trim();
            const matchedStep = THEME_STEPS.find(s => rawStepStr.includes(s) || s.includes(rawStepStr));

            if (matchedStep && rawDate >= circleData[targetCircle].latestDate) {
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
        setMeetingStatus(`회의록 파싱 완료 (${targetYearMonth}월 회합 및 최신 단계 자동 파싱)`);
      } catch (err: any) {
        setErrorMsg('회의록 엑셀 처리 중 오류가 발생했습니다: ' + err.message);
      }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl mb-8">
      <div className="flex items-center space-x-3 mb-4">
        <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg">
          <FileSpreadsheet className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-100">엑셀 데이터 자동 파싱 ({targetYearMonth} 평가 기준)</h3>
          <p className="text-sm text-slate-400">제안실적 및 회의록 엑셀(.xlsx)을 업로드하면 5개 분임조의 실적이 자동 계산됩니다.</p>
        </div>
      </div>

      {errorMsg && (
        <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg flex items-center space-x-2 text-rose-400 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 1. 제안실적 엑셀 업로드 */}
        <div className="border-2 border-dashed border-slate-700 hover:border-indigo-500/50 transition-colors rounded-xl p-4 bg-slate-950/40 text-center">
          <label className="cursor-pointer block">
            <Upload className="w-8 h-8 text-indigo-400 mx-auto mb-2" />
            <span className="text-sm font-semibold text-slate-200 block">1. 제안실적 엑셀 업로드</span>
            <span className="text-xs text-slate-500 mt-1 block">개인별 제안건수 및 불합리 적출 자동 반영</span>
            <input
              type="file"
              accept=".xlsx, .xls, .csv"
              onChange={handleProposalFileUpload}
              className="hidden"
            />
          </label>
          {proposalStatus && (
            <div className="mt-3 flex items-center justify-center space-x-1.5 text-emerald-400 text-xs font-medium">
              <CheckCircle2 className="w-4 h-4" />
              <span>{proposalStatus}</span>
            </div>
          )}
        </div>

        {/* 2. 회의록 엑셀 업로드 */}
        <div className="border-2 border-dashed border-slate-700 hover:border-indigo-500/50 transition-colors rounded-xl p-4 bg-slate-950/40 text-center">
          <label className="cursor-pointer block">
            <Upload className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
            <span className="text-sm font-semibold text-slate-200 block">2. 회의록 엑셀 업로드</span>
            <span className="text-xs text-slate-500 mt-1 block">당월 회합 횟수 및 최신 테마 진행단계 자동 추출</span>
            <input
              type="file"
              accept=".xlsx, .xls, .csv"
              onChange={handleMeetingFileUpload}
              className="hidden"
            />
          </label>
          {meetingStatus && (
            <div className="mt-3 flex items-center justify-center space-x-1.5 text-cyan-400 text-xs font-medium">
              <CheckCircle2 className="w-4 h-4" />
              <span>{meetingStatus}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
