import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './sidebar';

const PAGE_TITLES: Record<string, { eyebrow: string; title: string }> = {
  '/dashboard':      { eyebrow: 'Visão Geral', title: 'Dashboard' },
  '/usuarios':       { eyebrow: 'Gestão',      title: 'Usuários'  },
  '/relatorios':     { eyebrow: 'Dados',        title: 'Relatórios'},
  '/configuracoes':  { eyebrow: 'Sistema',      title: 'Configurações'},
};

export default function AppLayout() {
  const { pathname } = useLocation();
  const meta = PAGE_TITLES[pathname] ?? { eyebrow: 'CCM', title: 'Sistema' };

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        {/* Topbar */}
        <header className="topbar">
          <div>
            <div className="topbar-eyebrow">{meta.eyebrow}</div>
            <div className="topbar-title">{meta.title}</div>
          </div>
          <div style={{ fontSize: 12, color: 'var(--ccm-gray-dark)' }}>
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
          </div>
        </header>

        {/* Conteúdo das páginas */}
        <main className="page-body">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
