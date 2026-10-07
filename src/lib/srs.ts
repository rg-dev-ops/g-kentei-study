import type { AnswerMode, ReviewState } from '../types';
import { addDays, today } from './date';

/** 連続正解数ごとの次回までの日数。stage 0 = 1日後、1 = 3日後、2 = 7日後 */
export const INTERVALS = [1, 3, 7];
export const GRADUATE_STAGE = INTERVALS.length;

export type Outcome = 'correct' | 'wrong' | 'unsure';

/**
 * 解答結果から次の復習状態を決める。
 * - 不正解・自信なし: 復習待ちに入れる（すでに入っていれば最初からやり直し）
 * - 復習モードで正解: 次の段階へ。3 回連続で卒業（null）
 * - 通常演習・模試で正解: 復習スケジュールは変えない
 */
export function nextReviewState(
  prev: ReviewState | undefined,
  outcome: Outcome,
  mode: AnswerMode,
): ReviewState | null | undefined {
  if (outcome !== 'correct') return { stage: 0, due: addDays(INTERVALS[0]) };
  if (mode !== 'review' || !prev) return prev;
  const stage = prev.stage + 1;
  if (stage >= GRADUATE_STAGE) return null;
  return { stage, due: addDays(INTERVALS[stage]) };
}

export function isDue(state: ReviewState, on = today()): boolean {
  return state.due <= on;
}
