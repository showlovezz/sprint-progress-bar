import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { SprintListPage } from './pages/SprintListPage';
import { SprintDetailPage } from './pages/SprintDetailPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SprintListPage />} />
        <Route path="/sprint/:sprintId" element={<SprintDetailPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
