import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { Dashboard } from './pages/Dashboard';
import { Predictions } from './pages/Predictions';
import { Leagues } from './pages/Leagues';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="predictions" element={<Predictions />} />
          <Route path="leagues" element={<Leagues />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
