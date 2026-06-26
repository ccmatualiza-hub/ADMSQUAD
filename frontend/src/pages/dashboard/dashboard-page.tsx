import { useEffect, useState } from 'react';
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { useAuthStore } from '../../store/auth-store';
import { http } from '../../lib/http-client';
import ClientesPmoLista from './clientes-pmo-lista';

const CCM_COLORS = { blue: '#204294', blueLight: '#00B0FA', teal: '#00C8B4', gray: '#C3C3C3' };

const monthlyData = [
  { mes: 'Jan', acessos: 210, conclusoes: 180 },
  { mes: 'Fev', acessos: 195, conclusoes: 170 },
  { mes: 'Mar', acessos: 230, conclusoes: 210 },
  { mes: 'Abr', acessos: 250, conclusoes: 225 },
  { mes: 'Mai', acessos: 280, conclusoes: 255 },
  { mes: 'Jun', acessos: 310, conclusoes: 290 },
];

const performanceData = [
  { nome: 'Isabela',   valor: 66.7 },
  { nome: 'Ana Paula', valor: 87.6 },
  { nome: 'Higor',     valor: 84.0 },
  { nome: 'Sabrina',   valor: 84.2 },
  { nome: 'Gabriel',   valor: 71.0 },
  { nome: 'Bruna',     valor: 90.5 },
];

function KpiCard({ label, value, sub, borderColor, loading, onClick }: {
  label: string; value: string | number; sub: string; borderColor: string; loading?: boolean; onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        background: '#fff', borderRadius: 6, padding: '20px 22px',
        borderTop: `3px solid ${borderColor}`,
        boxShadow: '0 1px 4px rgba(12,25,33,.07)',
        cursor: onClick ? 'pointer' : 'default',
        transition: onClick ? 'box-shadow .15s, transform .15s' : undefined,
      }}
      onMouseEnter={e => onClick && ((e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 16px rgba(12,25,33,.15)')}
      onMouseLeave={e => onClick && ((e.currentTarget as HTMLDivElement).style.boxShadow = '0 1px 4px rgba(12,25,33,.07)')}
    >
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">
        {loading
          ? <span className="spinner-border spinner-border-sm" style={{ width: 20, height: 20 }} />
          : value}
      </div>
      <div className="kpi-sub">
        {sub}
        {onClick && !loading && <span style={{ marginLeft: 6, fontSize: 10, color: borderColor }}><i className="bi bi-arrow-right" /></span>}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const [subPage, setSubPage] = useState<null | 'pmo-lista'>(null);
  const [clientesAtivos, setClientesAtivos] = useState<number | null>(null);
  const [clientesCx,     setClientesCx]     = useState<number | null>(null);
  const [clientesPmo,    setClientesPmo]    = useState<number | null>(null);
  const [loadingA,   setLoadingA]   = useState(true);
  const [loadingCx,  setLoadingCx]  = useState(true);
  const [loadingPmo, setLoadingPmo] = useState(true);

  useEffect(() => {
    http.get<{ total: number }>('/api/dashboard/clientes-ativos')
      .then(r => setClientesAtivos(r.total)).catch(() => setClientesAtivos(null)).finally(() => setLoadingA(false));
    http.get<{ total: number }>('/api/dashboard/clientes-cx')
      .then(r => setClientesCx(r.total)).catch(() => setClientesCx(null)).finally(() => setLoadingCx(false));
    http.get<{ total: number }>('/api/dashboard/clientes-pmo')
      .then(r => setClientesPmo(r.total)).catch(() => setClientesPmo(null)).finally(() => setLoadingPmo(false));
  }, []);

  if (subPage === 'pmo-lista') {
    return <ClientesPmoLista onBack={() => setSubPage(null)} />;
  }

  return (
    <>
      <div className="mb-4">
        <div className="section-eyebrow">Bem-vindo de volta</div>
        <div className="section-title">{user?.name ?? 'Usuário'}</div>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-xl">
          <KpiCard
            label="Clientes Ativos"
            value={clientesAtivos !== null ? clientesAtivos.toLocaleString('pt-BR') : '—'}
            sub="Ativo, Ativo VPU e Implantação"
            borderColor="#1DB954"
            loading={loadingA}
          />
        </div>
        <div className="col-12 col-sm-6 col-xl">
          <KpiCard
            label="Clientes CX"
            value={clientesCx !== null ? clientesCx.toLocaleString('pt-BR') : '—'}
            sub="Status Ativo e Ativo VPU"
            borderColor="#00B0FA"
            loading={loadingCx}
          />
        </div>
        <div className="col-12 col-sm-6 col-xl">
          <KpiCard
            label="Clientes PMO"
            value={clientesPmo !== null ? clientesPmo.toLocaleString('pt-BR') : '—'}
            sub="Status Implantação — ver lista"
            borderColor="#F9E000"
            loading={loadingPmo}
            onClick={() => setSubPage('pmo-lista')}
          />
        </div>
        <div className="col-12 col-sm-6 col-xl">
          <KpiCard label="Aproveitamento PDI" value="89,5%" sub="Média da equipe" borderColor="#00C8B4" />
        </div>
        <div className="col-12 col-sm-6 col-xl">
          <KpiCard label="KPIs Média" value="90,1%" sub="Média da equipe" borderColor="#C3C3C3" />
        </div>
      </div>

      <div className="row g-3">
        <div className="col-12 col-lg-7">
          <div className="chart-card">
            <div className="chart-card-title">Acessos vs Conclusões — 2026</div>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={monthlyData} margin={{ top: 4, right: 12, bottom: 4, left: 0 }}>
                <CartesianGrid stroke={CCM_COLORS.gray} strokeDasharray="3 3" />
                <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#4A4A4A' }} />
                <YAxis tick={{ fontSize: 11, fill: '#4A4A4A' }} />
                <Tooltip contentStyle={{ background: '#fff', border: '1px solid #C3C3C3', borderRadius: 4, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="acessos"    stroke={CCM_COLORS.blue}     strokeWidth={2} dot={{ r: 3 }} name="Acessos" />
                <Line type="monotone" dataKey="conclusoes" stroke={CCM_COLORS.blueLight} strokeWidth={2} dot={{ r: 3 }} name="Conclusões" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="col-12 col-lg-5">
          <div className="chart-card">
            <div className="chart-card-title">Aproveitamento PDI — Equipe</div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={performanceData} margin={{ top: 4, right: 12, bottom: 4, left: 0 }}>
                <CartesianGrid stroke={CCM_COLORS.gray} strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="nome" tick={{ fontSize: 10, fill: '#4A4A4A' }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#4A4A4A' }} />
                <Tooltip contentStyle={{ background: '#fff', border: '1px solid #C3C3C3', borderRadius: 4, fontSize: 12 }}
                  formatter={(v: number) => [`${v}%`, 'Aproveitamento']} />
                <Bar dataKey="valor" fill={CCM_COLORS.blue} radius={[3, 3, 0, 0]} name="Aproveitamento %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </>
  );
}
