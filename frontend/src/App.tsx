import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage         from './pages/login/login-page';
import DashboardPage     from './pages/dashboard/dashboard-page';
import CxPage            from './pages/cx/cx-page';
import PmoPage           from './pages/pmo/pmo-page';
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
        <Route path="gestao"        element={<PlaceholderPage title="Gestão" eyebrow="Administração" />} />
        <Route path="configuracoes" element={<ConfiguracoesPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

function PlaceholderPage({ title, eyebrow }: { title: string; eyebrow: string }) {
  return (
    <div className="d-flex align-items-center justify-content-center" style={{ minHeight: 300 }}>
      <div className="text-center">
        <div className="section-eyebrow mb-1">{eyebrow}</div>
        <div className="section-title mb-0">{title}</div>
        <p style={{ color: 'var(--ccm-gray-dark)', fontSize: 13, marginTop: 8 }}>Esta seção será desenvolvida na próxima etapa.</p>
      </div>
    </div>
  );
}
