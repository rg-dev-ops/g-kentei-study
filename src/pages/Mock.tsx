import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { confirmDialog } from '../components/ConfirmDialog';
import { Explanation, QuestionView } from '../components/QuestionView';
import { CATEGORIES } from '../data/categories';
import { QUESTION_BY_ID, QUESTIONS } from '../data';
import { formatDateTime, formatDuration } from '../lib/date';
import { newId, randomOrder } from '../lib/random';
import { composeMock, MOCK_SPECS, PASS_LINE } from '../lib/select';
import type { Outcome } from '../lib/srs';
import { finishMock, getProgress, setActiveMock, useProgress } from '../lib/store';
import { percent } from '../lib/stats';
import type { ActiveMock, CategoryId, MockKind, MockResult } from '../types';

/** 受験中の模試を、採点せずに破棄する（解答は学習記録に残さない） */
export async function confirmDiscardMock() {
  const ok = await confirmDialog('受験中の模試を破棄しますか？解答内容は採点されず、学習記録にも残りません。', {
    okLabel: '破棄する',
    danger: true,
  });
  if (ok) setActiveMock(null);
}

export function MockSetup() {
  const progress = useProgress();
  const navigate = useNavigate();
  const active = progress.activeMock;

  const start = async (kind: MockKind) => {
    if (
      active &&
      !(await confirmDialog('受験中の模試を破棄して、新しく始めますか？', { okLabel: '新しく始める', danger: true }))
    )
      return;
    const qs = composeMock(getProgress(), kind);
    const mock: ActiveMock = {
      id: newId(),
      kind,
      startedAt: Date.now(),
      limitSec: MOCK_SPECS[kind].limitSec,
      items: qs.map((q) => ({ qid: q.id, order: randomOrder(q.choices.length), picked: null, flagged: false })),
      current: 0,
    };
    setActiveMock(mock);
    navigate('/mock/exam');
  };

  const history = [...progress.mocks].reverse();

  return (
    <div className="page">
      <h1>模擬テスト</h1>
      <p className="muted">
        解いている間は正誤を表示しません。最後にまとめて採点し、全問の解説を確認できます。
        間違えた問題と「見直し」を付けた問題は自動で復習に入ります。
      </p>
      {active && (
        <section className="card card-accent">
          <h2>受験中の模試があります</h2>
          <p>
            {MOCK_SPECS[active.kind].label}・{active.items.filter((i) => i.picked !== null).length} / {active.items.length} 問解答済み
          </p>
          <div className="inline-actions">
            <Link to="/mock/exam" className="btn btn-primary">
              続きから再開
            </Link>
            <button type="button" className="btn btn-outline" onClick={confirmDiscardMock}>
              破棄する
            </button>
          </div>
        </section>
      )}
      <div className="mock-options">
        {(Object.keys(MOCK_SPECS) as MockKind[]).map((kind) => {
          const spec = MOCK_SPECS[kind];
          const n = Math.min(spec.count, QUESTIONS.length);
          return (
            <section key={kind} className="card mock-option">
              <h2>{spec.label}</h2>
              <div className="mock-spec">
                <span>{spec.count} 問</span>
                <span>{spec.limitSec / 60} 分</span>
              </div>
              {n < spec.count && <p className="muted small">現在の問題数では {n} 問で実施します。</p>}
              <button type="button" className="btn btn-primary btn-block" onClick={() => start(kind)}>
                開始する
              </button>
            </section>
          );
        })}
      </div>
      <p className="muted small">
        分野ごとの問題数は本番の出題比率の推定値で配分しています。合格の目安は {percent(PASS_LINE)}
        です（G検定は合格ラインを公表していません）。
      </p>

      {history.length > 0 && (
        <section className="card">
          <h2>受験履歴</h2>
          <ul className="history-list">
            {history.map((m) => (
              <li key={m.id}>
                <Link to={`/mock/result/${m.id}`}>
                  <span>{formatDateTime(m.finishedAt)}</span>
                  <span>{MOCK_SPECS[m.kind].label}</span>
                  <span className={m.correct / m.total >= PASS_LINE ? 'mark-ok' : 'mark-ng'}>
                    {percent(m.correct / m.total)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

export function MockExam() {
  const progress = useProgress();
  const mock = progress.activeMock;
  // 採点で activeMock が消えたあと、結果画面へリダイレクトするために ID を覚えておく
  const submittedId = useRef<string | null>(null);
  const [now, setNow] = useState(Date.now());
  const [showGrid, setShowGrid] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const submit = useCallback(() => {
    const m = getProgress().activeMock;
    if (!m) return;
    const outcomes: { qid: string; outcome: Outcome }[] = [];
    const byCategory: MockResult['byCategory'] = {};
    let correct = 0;
    for (const item of m.items) {
      const q = QUESTION_BY_ID[item.qid];
      const ok = item.picked === q.answer;
      if (ok) correct++;
      const c = (byCategory[q.category] ??= { total: 0, correct: 0 });
      c.total++;
      if (ok) c.correct++;
      outcomes.push({ qid: item.qid, outcome: !ok ? 'wrong' : item.flagged ? 'unsure' : 'correct' });
    }
    const finishedAt = Date.now();
    const result: MockResult = {
      id: m.id,
      kind: m.kind,
      finishedAt,
      durationSec: Math.min(m.limitSec, Math.round((finishedAt - m.startedAt) / 1000)),
      total: m.items.length,
      correct,
      byCategory,
      items: m.items,
    };
    submittedId.current = m.id;
    finishMock(result, outcomes);
  }, []);

  const remaining = mock ? mock.limitSec - (now - mock.startedAt) / 1000 : 0;
  useEffect(() => {
    if (mock && remaining <= 0) submit();
  }, [mock, remaining, submit]);

  if (!mock) {
    return <Navigate to={submittedId.current ? `/mock/result/${submittedId.current}` : '/mock'} replace />;
  }

  const item = mock.items[mock.current];
  const q = QUESTION_BY_ID[item.qid];
  const answered = mock.items.filter((i) => i.picked !== null).length;

  const patch = (changes: Partial<ActiveMock>) => setActiveMock({ ...mock, ...changes });
  const patchItem = (changes: Partial<ActiveMock['items'][number]>) =>
    patch({ items: mock.items.map((it, i) => (i === mock.current ? { ...it, ...changes } : it)) });
  const go = (i: number) => {
    patch({ current: Math.max(0, Math.min(mock.items.length - 1, i)) });
    setShowGrid(false);
    window.scrollTo({ top: 0 });
  };

  const confirmSubmit = () => {
    const left = mock.items.length - answered;
    void confirmDialog(left > 0 ? `未解答が ${left} 問あります。採点しますか？` : '採点しますか？', {
      okLabel: '採点する',
    }).then((ok) => ok && submit());
  };

  return (
    <div className="session">
      <div className="session-head exam-head">
        <span className={`timer ${remaining < 300 ? 'warn' : ''}`}>⏱ {formatDuration(remaining)}</span>
        <span className="counter">
          {mock.current + 1} / {mock.items.length}
        </span>
        <button type="button" className="btn btn-ghost btn-small" onClick={() => setShowGrid(!showGrid)}>
          一覧（{answered}）
        </button>
        <button type="button" className="btn btn-primary btn-small" onClick={confirmSubmit}>
          採点
        </button>
      </div>
      <div className="progressbar">
        <div style={{ width: `${(answered / mock.items.length) * 100}%` }} />
      </div>

      {showGrid && (
        <div className="card q-grid-card">
          <div className="q-grid-legend">
            <span className="q-cell answered">解答済</span>
            <span className="q-cell flagged">見直し</span>
            <span className="q-cell">未解答</span>
          </div>
          <div className="q-grid">
            {mock.items.map((it, i) => (
              <button
                type="button"
                key={it.qid}
                className={`q-cell ${it.picked !== null ? 'answered' : ''} ${it.flagged ? 'flagged' : ''} ${i === mock.current ? 'current' : ''}`}
                onClick={() => go(i)}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </div>
      )}

      <QuestionView question={q} order={item.order} picked={item.picked} revealed={false} onPick={(ci) => patchItem({ picked: ci })} />

      <div className="exam-nav sticky-actions">
        <button type="button" className="btn btn-outline" disabled={mock.current === 0} onClick={() => go(mock.current - 1)}>
          ← 前へ
        </button>
        <button
          type="button"
          className={`btn ${item.flagged ? 'btn-warn' : 'btn-outline'}`}
          onClick={() => patchItem({ flagged: !item.flagged })}
        >
          {item.flagged ? '🚩 見直し中' : '🏳 見直し'}
        </button>
        {mock.current + 1 < mock.items.length ? (
          <button type="button" className="btn btn-primary" onClick={() => go(mock.current + 1)}>
            次へ →
          </button>
        ) : (
          <button type="button" className="btn btn-primary" onClick={confirmSubmit}>
            採点する
          </button>
        )}
      </div>
    </div>
  );
}

type Filter = 'all' | 'wrong' | 'flagged';

export function MockResultPage() {
  const { id } = useParams();
  const progress = useProgress();
  const [filter, setFilter] = useState<Filter>('wrong');
  const [open, setOpen] = useState<string | null>(null);
  const result = progress.mocks.find((m) => m.id === id);
  if (!result) return <Navigate to="/mock" replace />;

  const rate = result.correct / result.total;
  const items = result.items
    .map((it, i) => ({ ...it, no: i + 1, q: QUESTION_BY_ID[it.qid] }))
    .filter((it) => it.q)
    .filter((it) =>
      filter === 'wrong' ? it.picked !== it.q.answer : filter === 'flagged' ? it.flagged : true,
    );

  return (
    <div className="page">
      <h1>{MOCK_SPECS[result.kind].label} の結果</h1>
      <section className="card">
        <div className="score-row">
          <div className="big-score">
            {percent(rate)}
            <small>
              {result.correct} / {result.total} 問正解
            </small>
          </div>
          <div className={`pass-badge ${rate >= PASS_LINE ? 'ok' : 'ng'}`}>
            {rate >= PASS_LINE ? '合格目安クリア' : `合格目安（${percent(PASS_LINE)}）まであと ${Math.ceil(PASS_LINE * result.total) - result.correct} 問`}
          </div>
        </div>
        <p className="muted">
          所要時間 {formatDuration(result.durationSec)} / {MOCK_SPECS[result.kind].limitSec / 60} 分 ・{' '}
          {formatDateTime(result.finishedAt)}
        </p>
      </section>

      <section className="card">
        <h2>分野別の正答率</h2>
        <div className="bars">
          {CATEGORIES.map((c) => {
            const s = result.byCategory[c.id as CategoryId];
            if (!s) return null;
            const r = s.correct / s.total;
            return (
              <div key={c.id} className="bar-row">
                <span className="bar-label">
                  {c.id}. {c.name}
                </span>
                <div className="bar">
                  <div className={r >= PASS_LINE ? 'ok' : r >= 0.5 ? 'mid' : 'ng'} style={{ width: `${r * 100}%` }} />
                </div>
                <span className="bar-value">
                  {percent(r)} <small>({s.correct}/{s.total})</small>
                </span>
              </div>
            );
          })}
        </div>
      </section>

      <section className="card">
        <div className="section-head">
          <h2>解説</h2>
          <div className="segmented small">
            {(
              [
                ['wrong', '間違えた問題'],
                ['flagged', '見直し'],
                ['all', 'すべて'],
              ] as [Filter, string][]
            ).map(([f, label]) => (
              <button type="button" key={f} className={filter === f ? 'selected' : ''} onClick={() => setFilter(f)}>
                {label}
              </button>
            ))}
          </div>
        </div>
        {items.length === 0 && <p className="muted">該当する問題はありません。</p>}
        <ul className="result-list">
          {items.map((it) => {
            const ok = it.picked === it.q.answer;
            const key = `${it.qid}-${it.no}`;
            return (
              <li key={key}>
                <button type="button" className="result-item" onClick={() => setOpen(open === key ? null : key)}>
                  <span className="result-no">{it.no}</span>
                  <span className={ok ? 'mark-ok' : 'mark-ng'}>{ok ? '○' : it.picked === null ? '−' : '×'}</span>
                  {it.flagged && <span>🚩</span>}
                  <span className="missed-stem">{it.q.stem.split('\n')[0]}</span>
                </button>
                {open === key && (
                  <div className="result-detail">
                    <QuestionView question={it.q} order={it.order} picked={it.picked} revealed />
                    <Explanation question={it.q} order={it.order} picked={it.picked} />
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </section>
      <div className="actions">
        <Link to="/review" className="btn btn-primary">
          復習へ
        </Link>
        <Link to="/mock" className="btn btn-outline">
          模試トップへ
        </Link>
      </div>
    </div>
  );
}
