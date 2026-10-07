import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Session } from '../components/Session';
import { QUESTIONS } from '../data';
import { dueQuestions } from '../lib/select';
import { getProgress, useProgress } from '../lib/store';
import { shuffle } from '../lib/random';
import { INTERVALS } from '../lib/srs';
import type { Question } from '../types';

export function Review() {
  const progress = useProgress();
  const navigate = useNavigate();
  const [session, setSession] = useState<Question[] | null>(null);

  if (session) {
    return <Session title="今日の復習" questions={session} mode="review" onExit={() => { setSession(null); navigate('/'); }} />;
  }

  const due = dueQuestions(progress);
  const waiting = QUESTIONS.filter((q) => progress.review[q.id]);
  const upcoming = waiting
    .filter((q) => !due.includes(q))
    .reduce<Record<string, number>>((acc, q) => {
      const d = progress.review[q.id].due;
      acc[d] = (acc[d] ?? 0) + 1;
      return acc;
    }, {});

  return (
    <div className="page">
      <h1>復習</h1>
      <section className="card">
        <div className="big-score">
          {due.length}
          <small>今日の復習</small>
        </div>
        <p className="muted">
          間違えた問題・自信がなかった問題を {INTERVALS.map((d) => `${d}日後`).join(' → ')} に出題します。
          3 回続けて正解すると卒業です。途中で間違えると最初からやり直しになります。
        </p>
        <button
          type="button"
          className="btn btn-primary btn-block"
          disabled={due.length === 0}
          onClick={() => setSession(shuffle(dueQuestions(getProgress())))}
        >
          {due.length === 0 ? '今日の復習はありません 🎉' : `復習を始める（${due.length} 問）`}
        </button>
      </section>

      <section className="card">
        <h2>復習待ちの問題：{waiting.length} 問</h2>
        {Object.keys(upcoming).length === 0 ? (
          <p className="muted">
            今後の予定はありません。<Link to="/practice">分野別テスト</Link>で問題を解くと、間違えた問題がここに入ります。
          </p>
        ) : (
          <ul className="schedule">
            {Object.entries(upcoming)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([d, n]) => (
                <li key={d}>
                  <span>{d.slice(5).replace('-', '/')}</span>
                  <span>{n} 問</span>
                </li>
              ))}
          </ul>
        )}
      </section>
    </div>
  );
}
