import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage         from './pages/login/login-page';
import DashboardPage     from './pages/dashboard/dashboard-page';
import CxPage            from './pages/cx/cx-page';
import PmoPage           from './pages/pmo/pmo-page';
import GestaoPage        from './pages/gestao/gestao-page';
import ConfiguracoesPage from './pages/configuracoes/configuracoes-page';
import OperacoesPage     from './pages/operacoes/operacoes-page';
import AppLayout         from './components/layout/app-layout';
import ProtectedRoute    from './components/ui/protected-route';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard"     element={<DashboardPage />} />
        <Route path="cx"            element={<CxPage />} />
        <Route path="pmo"           element={<PmoPage />} />
        <Route path="operacoes"     element={<OperacoesPage />} />
        <Route path="gestao"        element={<GestaoPage />} />
        <Route path="configuracoes" element={<ConfiguracoesPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
