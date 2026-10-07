import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Session } from '../components/Session';
import { CATEGORIES } from '../data/categories';
import { filterQuestions, prioritize } from '../lib/select';
import { getProgress, useProgress } from '../lib/store';
import { categoryAccuracy, percent } from '../lib/stats';
import type { CategoryId, Question } from '../types';

const COUNTS = [10, 20, 0] as const; // 0 = 全問

export function Practice() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const progress = useProgress();

  const initialTags = params.get('tags')?.split(',').filter(Boolean) ?? [];
  const initialCats = (params.get('categories')?.split(',').map(Number) ?? []) as CategoryId[];
  const [categories, setCategories] = useState<CategoryId[]>(initialCats);
  const [tags, setTags] = useState<string[]>(initialTags);
  const [count, setCount] = useState<number>(Number(params.get('count') ?? 10));
  const [session, setSession] = useState<Question[] | null>(() =>
    params.get('start') ? build(initialCats, initialTags, Number(params.get('count') ?? 0)) : null,
  );

  // タグだけ指定されたときは、そのタグの分野を範囲に含める
  const effectiveCats = useMemo<CategoryId[]>(() => {
    const fromTags = CATEGORIES.filter((c) => c.tags.some((t) => tags.includes(t.id))).map((c) => c.id);
    return [...new Set([...categories, ...fromTags])];
  }, [categories, tags]);
  const pool = filterQuestions(effectiveCats, tags);

  if (session) {
    return (
      <Session
        title="分野別テスト"
        questions={session}
        mode="practice"
        onExit={() => {
          setSession(null);
          navigate('/practice', { replace: true });
        }}
      />
    );
  }

  const toggleCat = (id: CategoryId) => {
    if (categories.includes(id)) {
      setCategories(categories.filter((c) => c !== id));
      const catTags = CATEGORIES.find((c) => c.id === id)!.tags.map((t) => t.id);
      setTags(tags.filter((t) => !catTags.includes(t)));
    } else setCategories([...categories, id]);
  };
  const toggleTag = (id: string) =>
    setTags(tags.includes(id) ? tags.filter((t) => t !== id) : [...tags, id]);

  return (
    <div className="page">
      <h1>分野別テスト</h1>
      <p className="muted">
        1 問ごとに答え合わせをします。まだ解いていない問題 → 正答率が低い問題 の順に出題します。
      </p>

      <section className="card">
        <div className="section-head">
          <h2>1. 分野を選ぶ</h2>
          <div className="inline-actions">
            <button type="button" className="btn btn-ghost btn-small" onClick={() => setCategories(CATEGORIES.map((c) => c.id))}>
              すべて
            </button>
            <button type="button" className="btn btn-ghost btn-small" onClick={() => { setCategories([]); setTags([]); }}>
              クリア
            </button>
          </div>
        </div>
        <div className="cat-grid">
          {CATEGORIES.map((c) => {
            const acc = categoryAccuracy(progress, c.id);
            const n = filterQuestions([c.id], []).length;
            return (
              <button
                type="button"
                key={c.id}
                className={`cat-option ${effectiveCats.includes(c.id) ? 'selected' : ''}`}
                onClick={() => toggleCat(c.id)}
              >
                <span className="cat-num">{c.id}</span>
                <span className="cat-name">{c.name}</span>
                <span className="cat-sub">
                  {n} 問 ・ 正答率 {percent(acc.rate)}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {effectiveCats.length > 0 && (
        <section className="card">
          <h2>2. 小項目で絞り込む（任意）</h2>
          {CATEGORIES.filter((c) => effectiveCats.includes(c.id)).map((c) => (
            <div key={c.id} className="tag-group">
              <div className="tag-group-name">{c.name}</div>
              <div className="tag-list">
                {c.tags.map((t) => (
                  <button
                    type="button"
                    key={t.id}
                    className={`tag-option ${tags.includes(t.id) ? 'selected' : ''}`}
                    onClick={() => toggleTag(t.id)}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </section>
      )}

      {effectiveCats.length > 0 && (
        <section className="card">
          <h2>3. 問題数</h2>
          <div className="segmented">
            {COUNTS.map((c) => (
              <button type="button" key={c} className={count === c ? 'selected' : ''} onClick={() => setCount(c)}>
                {c === 0 ? `全問（${pool.length}）` : `${c} 問`}
              </button>
            ))}
          </div>
        </section>
      )}

      <div className="sticky-actions">
        <button
          type="button"
          className="btn btn-primary btn-block"
          disabled={pool.length === 0}
          onClick={() => setSession(build(effectiveCats, tags, count))}
        >
          {pool.length === 0 ? '分野を選んでください' : `開始する（${count === 0 ? pool.length : Math.min(count, pool.length)} 問）`}
        </button>
      </div>
    </div>
  );
}

function build(categories: CategoryId[], tags: string[], count: number): Question[] {
  const cats = categories.length
    ? categories
    : CATEGORIES.filter((c) => c.tags.some((t) => tags.includes(t.id))).map((c) => c.id);
  const ordered = prioritize(getProgress(), filterQuestions(cats, tags));
  return count > 0 ? ordered.slice(0, count) : ordered;
}
