import { NavLink, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuthStore } from '../../store/auth-store';

interface NavItem {
  to: string;
  icon: string;
  label: string;
}

const NAV_ITEMS: NavItem[] = [
  { to: '/dashboard',  icon: 'bi-grid-1x2-fill',        label: 'Dashboard'              },
  { to: '/cx',         icon: 'bi-headset',               label: 'CX - Customer Experience' },
  { to: '/pmo',        icon: 'bi-building',              label: 'PMO - Implantação'      },
  { to: '/gestao',     icon: 'bi-graph-up-arrow',        label: 'Gestão'                 },
  { to: '/configuracoes', icon: 'bi-gear-fill',          label: 'Configurações'          },
];

export default function Sidebar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.info('Sessão encerrada');
    navigate('/login');
  };

  const initials = user?.name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase() ?? 'U';

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <img src="/logo-ccm-white.png" alt="CCM Tecnologia" />
      </div>

      <nav className="sidebar-nav">
        <div className="sidebar-section-label">Menu Principal</div>
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <i className={`bi ${item.icon}`} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user mb-2">
          <div className="sidebar-avatar">{initials}</div>
          <div>
            <div className="sidebar-user-name">{user?.name}</div>
            <div className="sidebar-user-role">{user?.role}</div>
          </div>
        </div>
        <button
          className="btn btn-sm w-100 mt-1"
          style={{ background: 'rgba(255,255,255,.07)', color: '#9BA4AB', fontSize: 11, fontWeight: 700 }}
          onClick={handleLogout}
        >
          <i className="bi bi-box-arrow-right me-1" /> Sair
        </button>
      </div>
    </aside>
  );
}
