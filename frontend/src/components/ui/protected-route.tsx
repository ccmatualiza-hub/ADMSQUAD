import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth-store';

// Mapeamento de rota → roles permitidos
const ROUTE_ROLES: Record<string, string[]> = {
  '/dashboard':     ['admin', 'gestor', 'operador_cx', 'operador_pmo', 'trcx', 'prcx', 'user'],
  '/cx':            ['admin', 'gestor', 'operador_cx', 'trcx', 'prcx'],
  '/pmo':           ['admin', 'gestor', 'operador_pmo'],
  '/operacoes':     ['admin', 'gestor', 'operador_cx', 'operador_pmo', 'trcx', 'prcx'],
  '/gestao':        ['admin', 'gestor'],
  '/configuracoes': ['admin'],
};

interface Props {
  children: React.ReactNode;
  requiredRoles?: string[];
}

export default function ProtectedRoute({ children, requiredRoles }: Props) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());
  const role = useAuthStore((s) => s.user?.role ?? '');

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (requiredRoles && requiredRoles.length > 0) {
    if (!requiredRoles.includes(role)) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <>{children}</>;
}
