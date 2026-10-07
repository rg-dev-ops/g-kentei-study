import { Link } from 'react-router-dom';
import { CATEGORY_BY_ID } from '../data/categories';
import { QUESTIONS } from '../data';
import { MOCK_SPECS, PASS_LINE, dueQuestions } from '../lib/select';
import { useProgress } from '../lib/store';
import { answeredCount, percent, weakTags } from '../lib/stats';
import { WeakTagList } from './Analysis';
import { confirmDiscardMock } from './Mock';

export function Home() {
  const progress = useProgress();
  const due = dueQuestions(progress).length;
  const lastMock = progress.mocks[progress.mocks.length - 1];
  const weak = weakTags(progress).slice(0, 3);
  const answered = answeredCount(progress);

  return (
    <div className="page">
      <section className="card hero">
        <div className="hero-main">
          <div className="hero-label">今日の復習</div>
          <div className="hero-number">
            {due}
            <small> 問</small>
          </div>
        </div>
        <Link to="/review" className={`btn ${due > 0 ? 'btn-primary' : 'btn-outline'}`}>
          {due > 0 ? '復習を始める' : '復習を見る'}
        </Link>
      </section>

      <div className="stat-row">
        <div className="stat">
          <span className="stat-label">解いた問題</span>
          <span className="stat-value">
            {answered}
            <small> / {QUESTIONS.length}</small>
          </span>
        </div>
        <div className="stat">
          <span className="stat-label">直近の模試</span>
          {lastMock ? (
            <Link to={`/mock/result/${lastMock.id}`} className="stat-value">
              <span className={lastMock.correct / lastMock.total >= PASS_LINE ? 'mark-ok' : 'mark-ng'}>
                {percent(lastMock.correct / lastMock.total)}
              </span>
              <small> {MOCK_SPECS[lastMock.kind].label}</small>
            </Link>
          ) : (
            <span className="stat-value muted">未受験</span>
          )}
        </div>
      </div>

      {progress.activeMock && (
        <section className="card card-accent">
          <div className="section-head">
            <span>受験中の模試があります</span>
            <div className="inline-actions">
              <Link to="/mock/exam" className="btn btn-primary btn-small">
                再開
              </Link>
              <button type="button" className="btn btn-outline btn-small" onClick={confirmDiscardMock}>
                破棄
              </button>
            </div>
          </div>
        </section>
      )}

      <nav className="menu-grid">
        <Link to="/mock" className="menu-item">
          <span className="menu-icon">📝</span>
          <span className="menu-title">模擬テスト</span>
          <span className="menu-desc">本番形式 145問・100分 / ミニ 50問・35分</span>
        </Link>
        <Link to="/practice" className="menu-item">
          <span className="menu-icon">🎯</span>
          <span className="menu-title">分野別テスト</span>
          <span className="menu-desc">分野・小項目を選んで 1 問ずつ演習</span>
        </Link>
        <Link to="/analysis" className="menu-item">
          <span className="menu-icon">📊</span>
          <span className="menu-title">苦手分析</span>
          <span className="menu-desc">分野別の正答率と苦手な小項目</span>
        </Link>
        <Link to="/notes" className="menu-item">
          <span className="menu-icon">📘</span>
          <span className="menu-title">要点ノート</span>
          <span className="menu-desc">小項目ごとの要点・用語・ひっかけ</span>
        </Link>
      </nav>

      <section className="card">
        <h2>苦手な小項目 TOP3</h2>
        {weak.length === 0 ? (
          <p className="muted">
            まだ判定できるだけの解答がありません。<Link to="/practice">分野別テスト</Link>
            で問題を解くと、ここに苦手な小項目が表示されます。
          </p>
        ) : (
          <WeakTagList items={weak} />
        )}
        {weak.length > 0 && (
          <p className="muted small">
            {CATEGORY_BY_ID[weak[0].category].name} › {weak[0].name} から取り組むのがおすすめです。
          </p>
        )}
      </section>
    </div>
  );
}
