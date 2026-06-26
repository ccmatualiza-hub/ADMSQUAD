import { useEffect, useState } from 'react';
import {
  LineChart, Line,
  BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { useAuthStore } from '../../store/auth-store';
import { http } from '../../lib/http-client';

const CCM_COLORS = {
  blue:      '#204294',
  blueLight: '#00B0FA',
  teal:      '#00C8B4',
  gray:      '#C3C3C3',
};

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

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const [clientesAtivos, setClientesAtivos] = useState<number | null>(null);
  const [loadingClientes, setLoadingClientes] = useState(true);

  useEffect(() => {
    http.get<{ total: number }>('/api/dashboard/clientes-ativos')
      .then(res => setClientesAtivos(res.total))
      .catch(() => setClientesAtivos(null))
      .finally(() => setLoadingClientes(false));
  }, []);

  const kpiData = [
    {
      label: 'Clientes Ativos',
      value: loadingClientes ? '...' : clientesAtivos !== null ? clientesAtivos.toLocaleString('pt-BR') : '—',
      sub: 'Status Ativo e Ativo VPU',
      variant: 'cyan',
    },
    { label: 'Média OKR S',        value: '96,8%', sub: '11 colaboradores',       variant: 'green' },
    { label: 'Média Cursos',       value: '82,2%', sub: 'Média por colaborador',  variant: 'blue'  },
    { label: 'Aproveitamento PDI', value: '89,5%', sub: 'Média da equipe',        variant: ''      },
    { label: 'KPIs Média',         value: '90,1%', sub: 'Média da equipe',        variant: ''      },
  ];

  return (
    <>
      <div className="mb-4">
        <div className="section-eyebrow">Bem-vindo de volta</div>
        <div className="section-title">{user?.name ?? 'Usuário'}</div>
      </div>

      {/* KPI Cards */}
      <div className="row g-3 mb-4">
        {kpiData.map((kpi) => (
          <div key={kpi.label} className="col-12 col-sm-6 col-xl">
            <div className={`kpi-card ${kpi.variant}`}>
              <div className="kpi-label">{kpi.label}</div>
              <div className="kpi-value">
                {kpi.value === '...'
                  ? <span className="spinner-border spinner-border-sm" style={{ width: 20, height: 20 }} />
                  : kpi.value}
              </div>
              <div className="kpi-sub">{kpi.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Gráficos */}
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
                <Line type="monotone" dataKey="acessos"    stroke={CCM_COLORS.blue}      strokeWidth={2} dot={{ r: 3 }} name="Acessos" />
                <Line type="monotone" dataKey="conclusoes" stroke={CCM_COLORS.blueLight}  strokeWidth={2} dot={{ r: 3 }} name="Conclusões" />
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
