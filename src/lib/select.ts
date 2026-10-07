import { CATEGORIES } from '../data/categories';
import { QUESTIONS } from '../data';
import type { CategoryId, MockKind, Progress, Question } from '../types';
import { shuffle } from './random';
import { isDue } from './srs';
import { questionAccuracy } from './stats';

export const MOCK_SPECS: Record<MockKind, { label: string; count: number; limitSec: number }> = {
  full: { label: '本番形式', count: 145, limitSec: 100 * 60 },
  mini: { label: 'ミニ模試', count: 50, limitSec: 35 * 60 },
};

export const PASS_LINE = 0.7;

export function filterQuestions(categories: CategoryId[], tags: string[]): Question[] {
  return QUESTIONS.filter(
    (q) =>
      categories.includes(q.category) &&
      (tags.length === 0 || q.tags.some((t) => tags.includes(t))),
  );
}

/**
 * 演習用に並べる。未出題 → 正答率が低い順（同率はランダム）。
 * 先にシャッフルしてから安定ソートすることで、同じ優先度の中はランダムになる。
 */
export function prioritize(progress: Progress, pool: Question[]): Question[] {
  const unseen = shuffle(pool.filter((q) => !progress.history[q.id]?.length));
  const seen = shuffle(pool.filter((q) => progress.history[q.id]?.length)).sort(
    (a, b) =>
      (questionAccuracy(progress, a.id).rate ?? 0) - (questionAccuracy(progress, b.id).rate ?? 0),
  );
  return [...unseen, ...seen];
}

/**
 * 問題数を分野の比率で配分する（最大剰余方式）。
 * 単純に四捨五入すると合計が count を超え、後ろの分野が削られてしまうため。
 */
function allocate(count: number): Map<CategoryId, number> {
  const raw = CATEGORIES.map((c) => ({ id: c.id, exact: count * c.weight }));
  const result = new Map(raw.map((r) => [r.id, Math.floor(r.exact)]));
  let left = count - [...result.values()].reduce((a, b) => a + b, 0);
  for (const r of [...raw].sort((a, b) => (b.exact % 1) - (a.exact % 1))) {
    if (left-- <= 0) break;
    result.set(r.id, result.get(r.id)! + 1);
  }
  return result;
}

/** 本番の出題比率に近い配分で模試の問題を選ぶ。未出題の問題を優先する */
export function composeMock(progress: Progress, kind: MockKind): Question[] {
  const { count } = MOCK_SPECS[kind];
  const quota = allocate(count);
  const picked: Question[] = [];
  const rest: Question[] = [];
  for (const c of CATEGORIES) {
    const ordered = prioritize(
      progress,
      QUESTIONS.filter((q) => q.category === c.id),
    );
    const n = quota.get(c.id) ?? 0;
    picked.push(...ordered.slice(0, n));
    rest.push(...ordered.slice(n));
  }
  // 問題が足りない分野があれば、ほかの分野から補う
  if (picked.length < count) picked.push(...prioritize(progress, rest).slice(0, count - picked.length));
  // 本番と同じく分野順に並べる
  return picked.slice(0, count).sort((a, b) => a.category - b.category);
}

export function dueQuestions(progress: Progress): Question[] {
  return QUESTIONS.filter((q) => {
    const r = progress.review[q.id];
    return r && isDue(r);
  });
}
