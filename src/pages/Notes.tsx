import { Link, Navigate, useParams } from 'react-router-dom';
import { RichText } from '../components/RichText';
import { CATEGORIES, CATEGORY_BY_ID, TAG_BY_ID } from '../data/categories';
import { NOTE_BY_ID, QUESTIONS } from '../data';
import { useProgress } from '../lib/store';
import { percent, tagAccuracy } from '../lib/stats';

export function NotesIndex() {
  const progress = useProgress();
  return (
    <div className="page">
      <h1>要点ノート</h1>
      <p className="muted">小項目ごとの要点・重要用語・ひっかけポイントをまとめています。</p>
      {CATEGORIES.map((c) => (
        <section key={c.id} className="card">
          <h2>
            {c.id}. {c.name}
          </h2>
          <ul className="note-index">
            {c.tags.map((t) => {
              const acc = tagAccuracy(progress, t.id);
              const has = Boolean(NOTE_BY_ID[t.id]);
              return (
                <li key={t.id}>
                  {has ? <Link to={`/notes/${t.id}`}>{t.name}</Link> : <span className="muted">{t.name}（準備中）</span>}
                  {acc.enough && <span className="small muted">正答率 {percent(acc.rate)}</span>}
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}

export function NoteDetail() {
  const { tagId = '' } = useParams();
  const progress = useProgress();
  const tag = TAG_BY_ID[tagId];
  const note = NOTE_BY_ID[tagId];
  if (!tag || !note) return <Navigate to="/notes" replace />;

  const acc = tagAccuracy(progress, tagId);
  const count = QUESTIONS.filter((q) => q.tags.includes(tagId)).length;
  const siblings = CATEGORY_BY_ID[tag.category].tags.filter((t) => NOTE_BY_ID[t.id]);
  const idx = siblings.findIndex((t) => t.id === tagId);

  return (
    <div className="page">
      <div className="breadcrumb">
        <Link to="/notes">要点ノート</Link> › {CATEGORY_BY_ID[tag.category].name}
      </div>
      <h1>{tag.name}</h1>
      {acc.answers > 0 && (
        <p className="muted small">
          あなたの正答率 {acc.enough ? percent(acc.rate) : '（判定材料が不足）'}・解答 {acc.answers} 回
        </p>
      )}

      <section className="card">
        <h2>要点</h2>
        <RichText text={note.body} />
      </section>

      {note.keyTerms.length > 0 && (
        <section className="card">
          <h2>重要用語</h2>
          <dl className="terms">
            {note.keyTerms.map((k) => (
              <div key={k.term}>
                <dt>{k.term}</dt>
                <dd>
                  <RichText text={k.desc} />
                </dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {note.pitfalls.length > 0 && (
        <section className="card card-warn">
          <h2>⚠ ひっかけポイント・覚え方</h2>
          <ul>
            {note.pitfalls.map((p, i) => (
              <li key={i}>
                <RichText text={p} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="sticky-actions">
        {count > 0 ? (
          <Link to={`/practice?tags=${tagId}&start=1`} className="btn btn-primary btn-block">
            この小項目の問題を解く（{count} 問）
          </Link>
        ) : (
          <span className="muted">この小項目の問題は準備中です</span>
        )}
      </div>

      <div className="pager">
        {idx > 0 ? <Link to={`/notes/${siblings[idx - 1].id}`}>← {siblings[idx - 1].name}</Link> : <span />}
        {idx < siblings.length - 1 && <Link to={`/notes/${siblings[idx + 1].id}`}>{siblings[idx + 1].name} →</Link>}
      </div>
    </div>
  );
}
