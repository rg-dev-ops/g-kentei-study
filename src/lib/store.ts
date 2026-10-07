import { useSyncExternalStore } from 'react';
import type { ActiveMock, AnswerMode, MockResult, Progress } from '../types';
import { nextReviewState, type Outcome } from './srs';

const STORAGE_KEY = 'gkentei-progress-v1';

function emptyProgress(): Progress {
  return { version: 1, history: {}, review: {}, mocks: [], activeMock: null };
}

function load(): Progress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyProgress();
    const parsed = JSON.parse(raw) as Progress;
    return { ...emptyProgress(), ...parsed };
  } catch {
    return emptyProgress();
  }
}

function save(p: Progress) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
  } catch {
    // 保存できない環境（プライベートモード等）では、メモリ上だけで動かす
  }
}

let state: Progress = load();
const listeners = new Set<() => void>();

function update(fn: (p: Progress) => Progress) {
  state = fn(state);
  save(state);
  listeners.forEach((l) => l());
}

export function useProgress(): Progress {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => state,
  );
}

export function getProgress(): Progress {
  return state;
}

function applyOutcome(p: Progress, qid: string, outcome: Outcome, mode: AnswerMode): Progress {
  const next = nextReviewState(p.review[qid], outcome, mode);
  if (next === p.review[qid]) return p;
  const review = { ...p.review };
  if (next) review[qid] = next;
  else delete review[qid];
  return { ...p, review };
}

/** 1 問の解答を記録し、復習スケジュールを更新する */
export function recordAnswer(qid: string, correct: boolean, mode: AnswerMode) {
  update((p) => {
    const records = [...(p.history[qid] ?? []), { t: Date.now(), correct, mode }];
    const withHistory = { ...p, history: { ...p.history, [qid]: records } };
    return applyOutcome(withHistory, qid, correct ? 'correct' : 'wrong', mode);
  });
}

/** 正解した直後に「自信がなかった」を押したとき。直前の記録に印を付け、復習待ちに入れる */
export function markUnsure(qid: string, mode: AnswerMode) {
  update((p) => {
    const records = (p.history[qid] ?? []).slice();
    const last = records[records.length - 1];
    if (last) records[records.length - 1] = { ...last, unsure: true };
    const withHistory = { ...p, history: { ...p.history, [qid]: records } };
    return applyOutcome(withHistory, qid, 'unsure', mode);
  });
}

export function setActiveMock(mock: ActiveMock | null) {
  update((p) => ({ ...p, activeMock: mock }));
}

/** 模試を採点結果として保存し、全問の解答を履歴と復習に反映する */
export function finishMock(result: MockResult, outcomes: { qid: string; outcome: Outcome }[]) {
  update((p) => {
    let next: Progress = { ...p, mocks: [...p.mocks, result], activeMock: null };
    const history = { ...next.history };
    for (const { qid, outcome } of outcomes) {
      history[qid] = [
        ...(history[qid] ?? []),
        {
          t: result.finishedAt,
          correct: outcome !== 'wrong',
          unsure: outcome === 'unsure' || undefined,
          mode: 'mock',
        },
      ];
    }
    next = { ...next, history };
    for (const { qid, outcome } of outcomes) next = applyOutcome(next, qid, outcome, 'mock');
    return next;
  });
}

export function resetProgress() {
  update(() => emptyProgress());
}
