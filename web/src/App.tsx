import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { Home } from './pages/Home';
import { Quotes } from './pages/Quotes';
import { News } from './pages/News';
import { AIInsights } from './pages/AIInsights';
import { Watchlist } from './pages/Watchlist';
import { Signals } from './pages/Signals';
import { Settings } from './pages/Settings';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="quotes" element={<Quotes />} />
          <Route path="news" element={<News />} />
          <Route path="ai-insights" element={<AIInsights />} />
          <Route path="watchlist" element={<Watchlist />} />
          <Route path="signals" element={<Signals />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<div className="p-8 text-center text-text-muted">开发中...</div>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
