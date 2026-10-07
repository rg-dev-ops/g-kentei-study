import { CATEGORIES } from '../data/categories';
import { QUESTIONS } from '../data';
import type { AnswerRecord, CategoryId, Progress, Question } from '../types';

/** 1 つ古い解答になるごとに重みを掛ける率 */
const DECAY = 0.8;
/** 計算に使う直近の解答数（これより古いものは重みがほぼ 0） */
const WINDOW = 30;
/** これ未満の解答数では苦手判定しない */
export const MIN_ANSWERS = 3;

export type Accuracy = {
  /** 重み付き正答率（0〜1）。解答がなければ null */
  rate: number | null;
  answers: number;
  enough: boolean;
};

export function weightedAccuracy(records: AnswerRecord[]): Accuracy {
  const recent = records
    .slice()
    .sort((a, b) => b.t - a.t)
    .slice(0, WINDOW);
  let w = 1;
  let sum = 0;
  let total = 0;
  for (const r of recent) {
    total += w;
    if (r.correct) sum += w;
    w *= DECAY;
  }
  return {
    rate: recent.length ? sum / total : null,
    answers: records.length,
    enough: records.length >= MIN_ANSWERS,
  };
}

function recordsOf(progress: Progress, questions: Question[]): AnswerRecord[] {
  return questions.flatMap((q) => progress.history[q.id] ?? []);
}

export function questionAccuracy(progress: Progress, qid: string): Accuracy {
  return weightedAccuracy(progress.history[qid] ?? []);
}

export function categoryAccuracy(progress: Progress, id: CategoryId): Accuracy {
  return weightedAccuracy(recordsOf(progress, QUESTIONS.filter((q) => q.category === id)));
}

export function tagAccuracy(progress: Progress, tagId: string): Accuracy {
  return weightedAccuracy(recordsOf(progress, QUESTIONS.filter((q) => q.tags.includes(tagId))));
}

export type WeakTag = {
  tagId: string;
  name: string;
  category: CategoryId;
  acc: Accuracy;
};

/** 判定材料が揃っている小項目を、正答率の低い順に並べる */
export function weakTags(progress: Progress): WeakTag[] {
  return CATEGORIES.flatMap((c) =>
    c.tags.map((t) => ({
      tagId: t.id,
      name: t.name,
      category: c.id,
      acc: tagAccuracy(progress, t.id),
    })),
  )
    .filter((w) => w.acc.enough && w.acc.rate !== null)
    .sort((a, b) => (a.acc.rate ?? 0) - (b.acc.rate ?? 0));
}

export function answeredCount(progress: Progress): number {
  return Object.keys(progress.history).filter((id) => progress.history[id].length > 0).length;
}

export function percent(rate: number | null): string {
  return rate === null ? '—' : `${Math.round(rate * 100)}%`;
}
