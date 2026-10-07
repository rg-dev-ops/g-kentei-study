import { Link } from 'react-router-dom';
import { CATEGORIES, CATEGORY_BY_ID } from '../data/categories';
import { NOTE_BY_ID, QUESTIONS } from '../data';
import { PASS_LINE } from '../lib/select';
import { useProgress } from '../lib/store';
import { categoryAccuracy, MIN_ANSWERS, percent, tagAccuracy, weakTags, type WeakTag } from '../lib/stats';

function rateClass(rate: number | null) {
  if (rate === null) return '';
  return rate >= PASS_LINE ? 'ok' : rate >= 0.5 ? 'mid' : 'ng';
}

export function WeakTagList({ items }: { items: WeakTag[] }) {
  return (
    <ul className="weak-list">
      {items.map((w) => (
        <li key={w.tagId}>
          <div className="weak-info">
            <span className="weak-cat">{CATEGORY_BY_ID[w.category].name}</span>
            <span className="weak-name">{w.name}</span>
          </div>
          <span className={`weak-rate mark-${rateClass(w.acc.rate) === 'ok' ? 'ok' : 'ng'}`}>{percent(w.acc.rate)}</span>
          <div className="weak-actions">
            {NOTE_BY_ID[w.tagId] && (
              <Link to={`/notes/${w.tagId}`} className="btn btn-outline btn-small">
                ノート
              </Link>
            )}
            <Link to={`/practice?tags=${w.tagId}&start=1`} className="btn btn-primary btn-small">
              解く
            </Link>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function Analysis() {
  const progress = useProgress();
  const weak = weakTags(progress).filter((w) => (w.acc.rate ?? 1) < PASS_LINE);

  return (
    <div className="page">
      <h1>苦手分析</h1>
      <p className="muted">
        正答率は直近の解答ほど重く計算しています。解答が {MIN_ANSWERS} 問未満の項目は判定しません。
      </p>

      <section className="card">
        <h2>苦手な小項目</h2>
        {weak.length === 0 ? (
          <p className="muted">
            正答率が {percent(PASS_LINE)} 未満の小項目はありません（または判定材料が足りません）。
          </p>
        ) : (
          <WeakTagList items={weak.slice(0, 10)} />
        )}
      </section>

      <section className="card">
        <h2>分野別の正答率</h2>
        <div className="bars">
          {CATEGORIES.map((c) => {
            const acc = categoryAccuracy(progress, c.id);
            return (
              <div key={c.id} className="bar-row">
                <span className="bar-label">
                  {c.id}. {c.name}
                </span>
                <div className="bar">
                  <div className={rateClass(acc.rate)} style={{ width: `${(acc.rate ?? 0) * 100}%` }} />
                </div>
                <span className="bar-value">
                  {acc.enough ? percent(acc.rate) : <small className="muted">判定不可</small>}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      <section className="card">
        <h2>小項目ごとの詳細</h2>
        {CATEGORIES.map((c) => (
          <details key={c.id} className="tag-detail">
            <summary>
              {c.id}. {c.name}
            </summary>
            <table className="tag-table">
              <thead>
                <tr>
                  <th>小項目</th>
                  <th>問題数</th>
                  <th>解答数</th>
                  <th>正答率</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {c.tags.map((t) => {
                  const acc = tagAccuracy(progress, t.id);
                  const n = QUESTIONS.filter((q) => q.tags.includes(t.id)).length;
                  return (
                    <tr key={t.id}>
                      <td>
                        {NOTE_BY_ID[t.id] ? <Link to={`/notes/${t.id}`}>{t.name}</Link> : t.name}
                      </td>
                      <td>{n}</td>
                      <td>{acc.answers}</td>
                      <td className={`mark-${rateClass(acc.rate)}`}>{acc.enough ? percent(acc.rate) : '—'}</td>
                      <td>
                        {n > 0 && (
                          <Link to={`/practice?tags=${t.id}&start=1`} className="btn btn-ghost btn-small">
                            解く
                          </Link>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </details>
        ))}
      </section>
    </div>
  );
}
