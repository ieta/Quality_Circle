import { THEME_STEPS } from '../types';
import type { ThemeStep, ThemeGrade, EvaluationItemScore } from '../types';

/**
 * 1. 3정 5S 관할구역 유지관리 상태
 * 20점 - (불합리 발견 건수 x 1점) (최저 0점)
 */
export function calculateMaintScore(defectCount: number): number {
  return Math.max(0, 20 - defectCount);
}

/**
 * 2. 분임조 회합
 * 1점/회, 4회 이상 등록 시 +1점 (최대 5점)
 */
export function calculateMeetingScore(meetingCount: number): number {
  if (meetingCount <= 0) return 0;
  const bonus = meetingCount >= 4 ? 1 : 0;
  return Math.min(5, meetingCount + bonus);
}

/**
 * 3. 개선테마 진행률
 * 전월 대비 진행 단계 수 x 5점 (최대 20점)
 * 테마 순환 지원: 9단계(표준화) -> 1단계(테마주제선정) 의 경우 (10-9) + 1 = 2단계 전진으로 계산
 */
export function getStepIndex(step: ThemeStep): number {
  const index = THEME_STEPS.indexOf(step);
  return index >= 0 ? index + 1 : 1;
}

export function calculateThemeProgress(prevStep: ThemeStep, currStep: ThemeStep): { stepsAdvanced: number; score: number } {
  const prevIdx = getStepIndex(prevStep);
  const currIdx = getStepIndex(currStep);

  let stepsAdvanced = 0;
  if (currIdx >= prevIdx) {
    stepsAdvanced = currIdx - prevIdx + 1;
  } else {
    // 테마 종료 후 새로 시작된 경우 (순환)
    stepsAdvanced = (10 - prevIdx) + currIdx + 1;
  }

  const score = Math.min(20, stepsAdvanced * 5);
  return { stepsAdvanced, score };
}

/**
 * 4. 계획 달성
 * 100%: 5점, 90% 이상: 4점, 80% 이상: 3점, 70% 이상: 2점, 60% 이상: 1점, 60% 미만: 0점
 */
export function calculatePlanAchievementScore(rate: number): number {
  if (rate >= 100) return 5;
  if (rate >= 90) return 4;
  if (rate >= 80) return 3;
  if (rate >= 70) return 2;
  if (rate >= 60) return 1;
  return 0;
}

/**
 * 5. 테마 완료 - 당월 진행 테마 완료 등급
 * 1급: 5점, 2급: 4점, 3급: 3점, 4급: 2점, 5급: 1점, 미완료: 0점
 */
export function calculateThemeGradeScore(grade: ThemeGrade): number {
  switch (grade) {
    case '1급': return 5;
    case '2급': return 4;
    case '3급': return 3;
    case '4급': return 2;
    case '5급': return 1;
    case '미완료': default: return 0;
  }
}

/**
 * 5. 테마 완료 - 테마 완료 누적 건수
 * 4건 이상: 5점, 3건: 3점, 2건: 2점, 1건: 1점, 0건: 0점
 */
export function calculateThemeCumulativeScore(count: number): number {
  if (count >= 4) return 5;
  if (count === 3) return 3;
  if (count === 2) return 2;
  if (count === 1) return 1;
  return 0;
}

/**
 * 6. 제안활동 - 제안 건수 및 참여율 (인당 제안건수)
 * 3건/인 이상: 25점, 2건/인 이상: 15점, 1건/인 이상: 10점, 미제안: 0점
 */
export function calculateProposalScore(totalProposals: number, memberCount: number): { perPerson: number; score: number } {
  if (memberCount <= 0) return { perPerson: 0, score: 0 };
  const perPerson = Number((totalProposals / memberCount).toFixed(2));
  
  let score = 0;
  if (perPerson >= 3.0) score = 25;
  else if (perPerson >= 2.0) score = 15;
  else if (perPerson >= 1.0) score = 10;
  else score = 0;

  return { perPerson, score };
}

/**
 * 7. 불합리 적출 - 건수 (인당 적출건수)
 * 2건/인 이상: 10점, 1건/인 이상: 5점, 없음: 0점
 */
export function calculateUnreasonableCountScore(totalUnreasonable: number, memberCount: number): { perPerson: number; score: number } {
  if (memberCount <= 0) return { perPerson: 0, score: 0 };
  const perPerson = Number((totalUnreasonable / memberCount).toFixed(2));

  let score = 0;
  if (perPerson >= 2.0) score = 10;
  else if (perPerson >= 1.0) score = 5;
  else score = 0;

  return { perPerson, score };
}

/**
 * 7. 불합리 적출 - 불합리 해결률 (%)
 * 80% 이상: 10점, 60% 이상: 8점, 40% 이상: 4점, 40% 미만: 2점
 */
export function calculateUnreasonableResolveScore(rate: number): number {
  if (rate >= 80) return 10;
  if (rate >= 60) return 8;
  if (rate >= 40) return 4;
  return 2;
}

/**
 * 전체 항목 종합 계산기
 */
export function calculateTotalScore(
  input: Omit<EvaluationItemScore, 'maintScore' | 'meetingScore' | 'themeProgressSteps' | 'themeProgressScore' | 'planAchievementScore' | 'themeGradeScore' | 'themeCumulativeScore' | 'proposalPerPerson' | 'proposalScore' | 'unreasonablePerPerson' | 'unreasonableCountScore' | 'unreasonableResolveScore' | 'totalScore'>,
  memberCount: number
): EvaluationItemScore {
  const maintScore = calculateMaintScore(input.maintDefectCount);
  const meetingScore = calculateMeetingScore(input.meetingCount);
  const { stepsAdvanced, score: themeProgressScore } = calculateThemeProgress(input.prevThemeStep, input.currThemeStep);
  const planAchievementScore = calculatePlanAchievementScore(input.planAchievementRate);
  const themeGradeScore = calculateThemeGradeScore(input.themeGrade);
  const themeCumulativeScore = calculateThemeCumulativeScore(input.themeCumulativeCount);

  const { perPerson: proposalPerPerson, score: proposalScore } = calculateProposalScore(input.totalProposalCount, memberCount);
  const { perPerson: unreasonablePerPerson, score: unreasonableCountScore } = calculateUnreasonableCountScore(input.totalUnreasonableCount, memberCount);
  const unreasonableResolveScore = calculateUnreasonableResolveScore(input.unreasonableResolveRate);

  const totalScore = 
    maintScore +
    meetingScore +
    themeProgressScore +
    planAchievementScore +
    themeGradeScore +
    themeCumulativeScore +
    proposalScore +
    unreasonableCountScore +
    unreasonableResolveScore;

  return {
    maintDefectCount: input.maintDefectCount,
    maintScore,
    meetingCount: input.meetingCount,
    meetingScore,
    prevThemeStep: input.prevThemeStep,
    currThemeStep: input.currThemeStep,
    themeProgressSteps: stepsAdvanced,
    themeProgressScore,
    planAchievementRate: input.planAchievementRate,
    planAchievementScore,
    themeGrade: input.themeGrade,
    themeGradeScore,
    themeCumulativeCount: input.themeCumulativeCount,
    themeCumulativeScore,
    totalProposalCount: input.totalProposalCount,
    proposalPerPerson,
    proposalScore,
    totalUnreasonableCount: input.totalUnreasonableCount,
    unreasonablePerPerson,
    unreasonableCountScore,
    unreasonableResolveRate: input.unreasonableResolveRate,
    unreasonableResolveScore,
    totalScore
  };
}
