export default function BiPage({ onBack }: { onBack: () => void }) {
  const now = new Date();
  const dataFmt = now.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
  const horaFmt = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  const KpiCard = ({ label, value, color }: { label: string; value: string; color: string }) => (
    <div style={{ background: '#fff', border: '1px solid var(--ccm-line)', borderRadius: 6, padding: '14px 16px', textAlign: 'center', boxShadow: '0 1px 4px rgba(12,25,33,.06)' }}>
      <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--ccm-gray-dark)', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 900, color }}>{value}</div>
    </div>
  );

  const ChartBox = ({ title }: { title: string }) => (
    <div style={{ background: '#fff', border: '1px solid var(--ccm-line)', borderRadius: 8, padding: '16px 18px', boxShadow: '0 1px 4px rgba(12,25,33,.06)' }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ccm-ink)', marginBottom: 12 }}>{title}</div>
      <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F7F8FA', borderRadius: 4, border: '1px dashed var(--ccm-line)' }}>
        <span style={{ fontSize: 12, color: 'var(--ccm-gray-medium)' }}>
          <i className="bi bi-bar-chart me-2" />Gráfico em breve
        </span>
      </div>
    </div>
  );

  return (
    <div>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--ccm-blue)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em' }}>
          <i className="bi bi-arrow-left me-1" />Gestão
        </button>
        <span style={{ color: 'var(--ccm-gray-medium)', fontSize: 12 }}>/</span>
        <span style={{ color: 'var(--ccm-gray-dark)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em' }}>B.I. — Estatísticas de Squad</span>
      </div>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div className="section-title" style={{ margin: 0 }}>B.I. — Estatísticas de Squad</div>
        <div style={{ fontSize: 12, color: 'var(--ccm-gray-dark)' }}>{dataFmt}</div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10, marginBottom: 20 }}>
        <KpiCard label="Clientes Ativos"  value="—" color="var(--ccm-blue)"    />
        <KpiCard label="PMO"              value="—" color="#F9A825"             />
        <KpiCard label="Cancelados"       value="—" color="#E74C3C"             />
        <KpiCard label="Serv. LINX VPU"  value="—" color="var(--ccm-blue)"    />
        <KpiCard label="Serv. CCM VPU"   value="—" color="var(--ccm-blue)"    />
        <KpiCard label="Oracle"          value="—" color="var(--ccm-ink)"     />
        <KpiCard label="SQL Server"      value="—" color="var(--ccm-ink)"     />
      </div>

      {/* Charts row 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 14 }}>
        <ChartBox title="Maiores clientes VPU — nº users" />
        <ChartBox title="Nº clientes / marcas" />
        <ChartBox title="Nº clientes / sistemas" />
      </div>

      {/* Charts row 2 */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14 }}>
        <ChartBox title="Grupos de atualização" />

        {/* Footer info card */}
        <div style={{ background: '#fff', border: '1px solid var(--ccm-line)', borderRadius: 8, padding: '16px 18px', boxShadow: '0 1px 4px rgba(12,25,33,.06)', display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--ccm-gray-dark)', marginBottom: 6 }}>Total de Users</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--ccm-blue)' }}>—</div>
            <div style={{ fontSize: 11, color: 'var(--ccm-gray-medium)', marginTop: 4 }}>Atualizado {horaFmt}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--ccm-gray-dark)', marginBottom: 6 }}>Clientes Ativos</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: '#1DB954' }}>—</div>
          </div>
        </div>
      </div>
    </div>
  );
}
