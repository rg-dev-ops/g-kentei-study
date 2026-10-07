import { confirmDialog } from '../components/ConfirmDialog';
import { QUESTIONS, NOTES } from '../data';
import { CATEGORIES } from '../data/categories';
import { resetProgress, useProgress } from '../lib/store';
import { answeredCount } from '../lib/stats';

export function Settings() {
  const progress = useProgress();
  const reset = async () => {
    const ok = await confirmDialog(
      '学習記録（解答履歴・復習予定・模試の結果）をすべて削除します。元に戻せません。よろしいですか？',
      { okLabel: '削除する', danger: true },
    );
    if (ok) resetProgress();
  };
  const tagCount = CATEGORIES.reduce((n, c) => n + c.tags.length, 0);

  return (
    <div className="page">
      <h1>設定</h1>
      <section className="card">
        <h2>収録データ</h2>
        <ul className="plain">
          <li>問題：{QUESTIONS.length} 問</li>
          <li>
            要点ノート：{NOTES.length} / {tagCount} 項目
          </li>
          <li>出題範囲：G検定シラバス 2024年版（10分野）</li>
        </ul>
      </section>
      <section className="card">
        <h2>学習記録</h2>
        <p className="muted">
          記録はこのブラウザ内にだけ保存されます。別の端末やブラウザとは共有されません。
        </p>
        <ul className="plain">
          <li>解いた問題：{answeredCount(progress)} 問</li>
          <li>復習待ち：{Object.keys(progress.review).length} 問</li>
          <li>模試の受験回数：{progress.mocks.length} 回</li>
        </ul>
        <button type="button" className="btn btn-danger" onClick={reset}>
          学習記録をリセット
        </button>
      </section>
    </div>
  );
}
