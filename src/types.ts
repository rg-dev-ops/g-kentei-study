export type CategoryId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export type Category = {
  id: CategoryId;
  name: string;
  /** 模試での出題比率（推定値。JDLA は比率を公表していない） */
  weight: number;
  tags: Tag[];
};

export type Tag = {
  /** 例: "c3-metrics"。要点ノートの ID も兼ねる */
  id: string;
  name: string;
};

export type Choice = {
  text: string;
  /** その選択肢が正しい／誤りである理由 */
  explanation: string;
};

export type Question = {
  id: string;
  category: CategoryId;
  tags: string[];
  kind: 'single' | 'combination' | 'calculation';
  stem: string;
  choices: Choice[];
  /** choices の正解インデックス（表示時はシャッフルされる） */
  answer: number;
};

export type Note = {
  /** 対応する Tag の id と同じ */
  id: string;
  body: string;
  keyTerms: { term: string; desc: string }[];
  pitfalls: string[];
};

export type AnswerMode = 'practice' | 'mock' | 'review';

export type AnswerRecord = {
  /** 解答時刻（epoch ms） */
  t: number;
  correct: boolean;
  unsure?: boolean;
  mode: AnswerMode;
};

export type ReviewState = {
  /** 連続正解数（0〜2）。3 回連続で卒業 */
  stage: number;
  /** 次に出題する日（YYYY-MM-DD, ローカル日付） */
  due: string;
};

export type MockKind = 'full' | 'mini';

export type MockResult = {
  id: string;
  kind: MockKind;
  finishedAt: number;
  durationSec: number;
  total: number;
  correct: number;
  byCategory: Partial<Record<CategoryId, { total: number; correct: number }>>;
  /** 結果画面で解説を見直すための解答内容 */
  items: { qid: string; order: number[]; picked: number | null; flagged: boolean }[];
};

/** 受験中の模試（リロードしても続きから再開できるよう保存する） */
export type ActiveMock = {
  id: string;
  kind: MockKind;
  startedAt: number;
  limitSec: number;
  items: { qid: string; order: number[]; picked: number | null; flagged: boolean }[];
  current: number;
};

export type Progress = {
  version: 1;
  history: Record<string, AnswerRecord[]>;
  review: Record<string, ReviewState>;
  mocks: MockResult[];
  activeMock: ActiveMock | null;
};
