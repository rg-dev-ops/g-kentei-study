import { HashRouter, NavLink, Route, Routes, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { ConfirmHost } from './components/ConfirmDialog';
import { Home } from './pages/Home';
import { MockExam, MockResultPage, MockSetup } from './pages/Mock';
import { Practice } from './pages/Practice';
import { Review } from './pages/Review';
import { Analysis } from './pages/Analysis';
import { NoteDetail, NotesIndex } from './pages/Notes';
import { Settings } from './pages/Settings';
import { dueQuestions } from './lib/select';
import { useProgress } from './lib/store';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [pathname]);
  return null;
}

function Header() {
  const due = dueQuestions(useProgress()).length;
  const { pathname } = useLocation();
  // 模試の受験中は誤操作を防ぐためナビゲーションを隠す
  if (pathname === '/mock/exam') return null;
  const items: [string, string, string][] = [
    ['/', '🏠', 'ホーム'],
    ['/mock', '📝', '模試'],
    ['/practice', '🎯', '分野別'],
    ['/review', '🔁', '復習'],
    ['/analysis', '📊', '分析'],
    ['/notes', '📘', 'ノート'],
  ];
  return (
    <header className="header">
      <div className="header-inner">
        <NavLink to="/" className="brand">
          G検定 学習
        </NavLink>
        <nav className="nav">
          {items.map(([to, icon, label]) => (
            <NavLink key={to} to={to} end={to === '/'} className="nav-item">
              <span className="nav-icon">{icon}</span>
              <span className="nav-label">{label}</span>
              {to === '/review' && due > 0 && <span className="badge">{due}</span>}
            </NavLink>
          ))}
        </nav>
        <NavLink to="/settings" className="settings-link" aria-label="設定">
          ⚙
        </NavLink>
      </div>
    </header>
  );
}

export default function App() {
  return (
    <HashRouter>
      <ScrollToTop />
      <Header />
      <main className="main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/mock" element={<MockSetup />} />
          <Route path="/mock/exam" element={<MockExam />} />
          <Route path="/mock/result/:id" element={<MockResultPage />} />
          <Route path="/practice" element={<Practice />} />
          <Route path="/review" element={<Review />} />
          <Route path="/analysis" element={<Analysis />} />
          <Route path="/notes" element={<NotesIndex />} />
          <Route path="/notes/:tagId" element={<NoteDetail />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </main>
      <ConfirmHost />
    </HashRouter>
  );
}
