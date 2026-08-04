export type CircleName = '금메달' | '한마음' | '독수리' | '아리울' | '새만금';

export interface CircleInfo {
  id: string;
  name: CircleName;
  membersCount: number;
  leaderName: string;
  note?: string;
}

export type ThemeStep = 
  | '1단계 - 테마주제선정'
  | '2단계 - 현상파악'
  | '3단계 - 원인분석'
  | '4단계 - 목표설정'
  | '5단계 - 대책수립'
  | '6단계 - 대책실시'
  | '7단계 - 결과분석'
  | '8단계 - 효과분석'
  | '9단계 - 표준화'
  | '10단계 - 완료보고/판정';

export const THEME_STEPS: ThemeStep[] = [
  '1단계 - 테마주제선정',
  '2단계 - 현상파악',
  '3단계 - 원인분석',
  '4단계 - 목표설정',
  '5단계 - 대책수립',
  '6단계 - 대책실시',
  '7단계 - 결과분석',
  '8단계 - 효과분석',
  '9단계 - 표준화',
  '10단계 - 완료보고/판정'
];

export type ThemeGrade = '미완료' | '1급' | '2급' | '3급' | '4급' | '5급';

export interface EvaluationItemScore {
  maintDefectCount: number;
  maintScore: number;
  meetingCount: number;
  meetingScore: number;
  prevThemeStep: ThemeStep;
  currThemeStep: ThemeStep;
  themeProgressSteps: number;
  themeProgressScore: number;
  planAchievementRate: number;
  planAchievementScore: number;
  themeGrade: ThemeGrade;
  themeGradeScore: number;
  themeCumulativeCount: number;
  themeCumulativeScore: number;
  totalProposalCount: number;
  proposalPerPerson: number;
  proposalScore: number;
  totalUnreasonableCount: number;
  unreasonablePerPerson: number;
  unreasonableCountScore: number;
  unreasonableResolveRate: number;
  unreasonableResolveScore: number;
  totalScore: number;
}

export interface MonthlyCircleEvaluation {
  circleName: CircleName;
  yearMonth: string;
  scores: EvaluationItemScore;
  rawExcelData?: {
    proposalParsed?: boolean;
    meetingParsed?: boolean;
  };
}

export interface AwardStatus {
  circleName: CircleName;
  rank: 1 | 2 | 3 | 4 | 5;
  score: number;
  isFirstPlaceAward: boolean;
  isSecondPlaceAward: boolean;
  awardText: string;
}
