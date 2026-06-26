import { useEffect, useState } from 'react';
import { http } from '../../lib/http-client';

interface Cliente {
  [key: string]: unknown;
}

export default function ClientesPmoLista({ onBack }: { onBack: () => void }) {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [cols, setCols]         = useState<string[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');

  useEffect(() => {
    http.get<{ total: number; clientes: Cliente[] }>('/api/dashboard/clientes-pmo-lista')
      .then(r => {
        setClientes(r.clientes);
        if (r.clientes.length > 0) setCols(Object.keys(r.clientes[0]));
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = clientes.filter(c =>
    Object.values(c).some(v => String(v ?? '').toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--ccm-blue)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em' }}>
          <i className="bi bi-arrow-left me-1" />Dashboard
        </button>
        <span style={{ color: 'var(--ccm-gray-medium)', fontSize: 12 }}>/</span>
        <span style={{ color: 'var(--ccm-gray-dark)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em' }}>Clientes PMO — Implantação</span>
      </div>
      <div className="section-title mb-4">Clientes PMO — Status Implantação</div>

      <div className="table-card">
        <div style={{ background: 'var(--ccm-ink)', padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: '6px 6px 0 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <i className="bi bi-building" style={{ color: '#F9E000', fontSize: 16 }} />
            <span style={{ color: '#fff', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.12em' }}>
              {loading ? 'Carregando...' : `${filtered.length} clientes`}
            </span>
          </div>
        </div>

        <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--ccm-line)' }}>
          <input type="text" className="form-control" placeholder="Buscar..."
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ maxWidth: 360, fontSize: 13 }} />
        </div>

        <div style={{ overflowX: 'auto' }}>
          {loading ? (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--ccm-gray-dark)' }}>
              <span className="spinner-border spinner-border-sm me-2" />Carregando...
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: 'var(--ccm-blue)' }}>
                  {cols.map(c => (
                    <th key={c} style={{ color: '#fff', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', padding: '9px 12px', textAlign: 'left', fontSize: 10, whiteSpace: 'nowrap' }}>{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((row, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#F7F8FA', borderBottom: '1px solid var(--ccm-line)' }}>
                    {cols.map(c => (
                      <td key={c} style={{ padding: '8px 12px', color: 'var(--ccm-ink)', whiteSpace: 'nowrap', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {String(row[c] ?? '—')}
                      </td>
                    ))}
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={cols.length} style={{ padding: 32, textAlign: 'center', color: 'var(--ccm-gray-dark)' }}>Nenhum registro encontrado</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
