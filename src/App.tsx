import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Playground from './pages/Playground';

function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <div className="w-full min-h-screen bg-background text-foreground animate-in fade-in duration-500 selection:bg-primary/20">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/playground" element={<Playground />} />
          {/* Fallback for legacy /dashboard links or just redirect */}
          <Route path="/dashboard" element={<Playground />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
