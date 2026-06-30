import { useEffect, useState } from 'react';
import { http } from '../../lib/http-client';

interface ConsultaItem {
  cod: number; razao: string | null; cliente: string | null;
  sistema: string | null; versao: string | null;
  qtdusers: number | null; serverbd: string | null;
  codigoc: string | null; grupo: string | null;
  dt_atualiza: string | null;
}

export default function TarefasPage({ onBack }: { onBack: () => void }) {
  const [clientes, setClientes] = useState<ConsultaItem[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');

  const fetchClientes = async (q = '') => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.set('q', q);
      const data = await http.get<ConsultaItem[]>(`/api/operacoes/tarefas?${params}`);
      setClientes(data);
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchClientes(); }, []);

  const handleSearch = () => fetchClientes(search);
  const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === 'Enter') handleSearch(); };

  const th = { color: '#fff', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '.05em', padding: '10px 12px', textAlign: 'left' as const, fontSize: 10, whiteSpace: 'nowrap' as const };
  const td = { padding: '9px 12px', fontSize: 12, whiteSpace: 'nowrap' as const };

  return (
    <div>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--ccm-blue)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em' }}>
          <i className="bi bi-arrow-left me-1" />Operações
        </button>
        <span style={{ color: 'var(--ccm-gray-medium)', fontSize: 12 }}>/</span>
        <span style={{ color: 'var(--ccm-gray-dark)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em' }}>Tarefas</span>
      </div>
      <div className="section-title mb-4" style={{ textAlign: 'center' }}>Tarefas</div>

      <div className="table-card">
        <div style={{ background: 'var(--ccm-ink)', padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: '6px 6px 0 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <i className="bi bi-search" style={{ color: '#F9A825', fontSize: 16 }} />
            <span style={{ color: '#fff', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.12em' }}>
              {loading ? 'Carregando...' : `${clientes.length} clientes`}
            </span>
          </div>
        </div>

        <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--ccm-line)', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <input type="text" className="form-control" placeholder="Buscar por razão, cliente ou sistema..."
            value={search} onChange={e => setSearch(e.target.value)} onKeyDown={handleKeyDown}
            style={{ maxWidth: 340, fontSize: 13 }} />
          <button className="btn btn-ccm-primary btn-sm" onClick={handleSearch} style={{ padding: '7px 18px' }}>
            <i className="bi bi-search me-1" />Buscar
          </button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          {loading ? (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--ccm-gray-dark)' }}>
              <span className="spinner-border spinner-border-sm me-2" />Carregando...
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--ccm-blue)' }}>
                  <th style={th}>Razão Social</th>
                  <th style={th}>Cliente</th>
                  <th style={th}>Sistema</th>
                  <th style={th}>Versão</th>
                  <th style={{ ...th, textAlign: 'center' }}>Users</th>
                  <th style={th}>Server BD</th>
                  <th style={th}>Código-C</th>
                  <th style={th}>Grupo</th>
                  <th style={th}>Última Atualização</th>
                </tr>
              </thead>
              <tbody>
                {clientes.length === 0 ? (
                  <tr><td colSpan={9} style={{ padding: 32, textAlign: 'center', color: 'var(--ccm-gray-dark)' }}>Nenhum cliente encontrado</td></tr>
                ) : clientes.map((c, i) => (
                  <tr key={c.cod} style={{ background: i % 2 === 0 ? '#fff' : '#F7F8FA', borderBottom: '1px solid var(--ccm-line)' }}>
                    <td style={{ ...td, fontWeight: 600, color: 'var(--ccm-ink)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.razao || '—'}</td>
                    <td style={{ ...td, color: 'var(--ccm-gray-dark)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.cliente || '—'}</td>
                    <td style={{ ...td, color: 'var(--ccm-blue)', fontWeight: 600 }}>{c.sistema || '—'}</td>
                    <td style={td}>{c.versao || '—'}</td>
                    <td style={{ ...td, textAlign: 'center', fontWeight: 600 }}>{c.qtdusers ?? '—'}</td>
                    <td style={td}>{c.serverbd || '—'}</td>
                    <td style={td}>{c.codigoc || '—'}</td>
                    <td style={td}>{c.grupo || '—'}</td>
                    <td style={td}>{c.dt_atualiza || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
