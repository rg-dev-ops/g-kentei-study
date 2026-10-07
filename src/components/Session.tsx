import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { TAG_BY_ID } from '../data/categories';
import { NOTE_BY_ID } from '../data';
import { markUnsure, recordAnswer } from '../lib/store';
import { randomOrder } from '../lib/random';
import { percent } from '../lib/stats';
import type { AnswerMode, Question } from '../types';
import { Explanation, QuestionView } from './QuestionView';

type Result = { qid: string; correct: boolean; unsure: boolean };

type Props = {
  title: string;
  questions: Question[];
  mode: Exclude<AnswerMode, 'mock'>;
  onExit: () => void;
};

/** 1 問ごとに答え合わせをする演習（分野別テスト・復習で共通） */
export function Session({ title, questions, mode, onExit }: Props) {
  const orders = useMemo(() => questions.map((q) => randomOrder(q.choices.length)), [questions]);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [results, setResults] = useState<Result[]>([]);
  const [done, setDone] = useState(false);

  if (done) return <SessionSummary title={title} questions={questions} results={results} onExit={onExit} />;

  const q = questions[index];
  const revealed = picked !== null;
  const current = results[index];

  const pick = (ci: number) => {
    if (revealed) return;
    const correct = ci === q.answer;
    setPicked(ci);
    recordAnswer(q.id, correct, mode);
    setResults((r) => [...r, { qid: q.id, correct, unsure: false }]);
  };

  const unsure = () => {
    markUnsure(q.id, mode);
    setResults((r) => r.map((x, i) => (i === index ? { ...x, unsure: true } : x)));
  };

  const next = () => {
    if (index + 1 >= questions.length) setDone(true);
    else {
      setIndex(index + 1);
      setPicked(null);
      window.scrollTo({ top: 0 });
    }
  };

  return (
    <div className="session">
      <div className="session-head">
        <span className="session-title">{title}</span>
        <span className="counter">
          {index + 1} / {questions.length}
        </span>
        <button type="button" className="btn btn-ghost btn-small" onClick={() => setDone(true)}>
          終了
        </button>
      </div>
      <div className="progressbar">
        <div style={{ width: `${(index / questions.length) * 100}%` }} />
      </div>
      <QuestionView question={q} order={orders[index]} picked={picked} revealed={revealed} onPick={pick} />
      {revealed && (
        <>
          {current?.correct && (
            <div className="unsure-row">
              {current.unsure ? (
                <span className="muted">復習リストに追加しました（明日もう一度出題します）</span>
              ) : (
                <button type="button" className="btn btn-outline" onClick={unsure}>
                  🤔 自信がなかった（復習に追加）
                </button>
              )}
            </div>
          )}
          <Explanation question={q} order={orders[index]} picked={picked} />
          <div className="sticky-actions">
            <button type="button" className="btn btn-primary btn-block" onClick={next}>
              {index + 1 >= questions.length ? '結果を見る' : '次の問題へ'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function SessionSummary({
  title,
  questions,
  results,
  onExit,
}: {
  title: string;
  questions: Question[];
  results: Result[];
  onExit: () => void;
}) {
  const correct = results.filter((r) => r.correct).length;
  const missed = results.filter((r) => !r.correct || r.unsure);
  const byId = Object.fromEntries(questions.map((q) => [q.id, q]));
  const noteTags = [...new Set(missed.flatMap((r) => byId[r.qid].tags))].filter((t) => NOTE_BY_ID[t]);

  return (
    <div className="card summary">
      <h2>{title} の結果</h2>
      {results.length === 0 ? (
        <p className="muted">解答した問題はありません。</p>
      ) : (
        <>
          <div className="big-score">
            {percent(correct / results.length)}
            <small>
              {correct} / {results.length} 問正解
            </small>
          </div>
          {missed.length > 0 && (
            <>
              <h3>復習リストに入った問題</h3>
              <ul className="missed-list">
                {missed.map((r) => (
                  <li key={r.qid}>
                    <span className={r.correct ? 'mark-warn' : 'mark-ng'}>{r.correct ? '自信なし' : '不正解'}</span>
                    <span className="missed-stem">{byId[r.qid].stem.split('\n')[0]}</span>
                  </li>
                ))}
              </ul>
              <p className="muted small">明日から 1日後 → 3日後 → 7日後 に復習として出題します。</p>
            </>
          )}
          {noteTags.length > 0 && (
            <>
              <h3>読んでおきたい要点ノート</h3>
              <div className="related">
                {noteTags.map((t) => (
                  <Link key={t} to={`/notes/${t}`} className="chip chip-link">
                    📘 {TAG_BY_ID[t]?.name ?? t}
                  </Link>
                ))}
              </div>
            </>
          )}
        </>
      )}
      <div className="actions">
        <button type="button" className="btn btn-primary" onClick={onExit}>
          戻る
        </button>
      </div>
    </div>
  );
}
