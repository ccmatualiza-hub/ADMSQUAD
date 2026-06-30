import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { http } from '../../lib/http-client';

interface ConsultaItem {
  cod: number; razao: string | null; cliente: string | null;
  sistema: string | null; versao: string | null;
  qtdusers: number | null; serverbd: string | null;
  status: string | null; qtdsistemas: number | null;
}

const STATUS_COLORS: Record<string, { color: string; bg: string }> = {
  '6 - ATIVO':             { color: '#0E7E3B', bg: '#D4F5E2' },
  '7 - ATIVO VPU':         { color: '#0E7E3B', bg: '#C8F0D8' },
  '0 - IMPLANTAÇÃO':       { color: '#8A6800', bg: '#FFF8CC' },
  'X - ATIVO COMPLEMENTO': { color: '#204294', bg: '#E8EDF7' },
  '9 - INATIVO':           { color: '#9B2020', bg: '#FDDEDE' },
};

function statusBadge(s: string | null) {
  if (!s) return <span style={{ color: 'var(--ccm-gray-medium)', fontSize: 11 }}>—</span>;
  const c = STATUS_COLORS[s] ?? { color: '#444', bg: '#eee' };
  return <span style={{ background: c.bg, color: c.color, borderRadius: 99, padding: '2px 9px', fontSize: 10, fontWeight: 700, whiteSpace: 'nowrap' }}>{s}</span>;
}

function concluidoBadge(v: number | null) {
  const isYes = v === 1;
  return (
    <span style={{
      background: isYes ? '#D4F5E2' : '#FDDEDE',
      color: isYes ? '#0E7E3B' : '#9B2020',
      borderRadius: 99, padding: '2px 10px', fontSize: 11, fontWeight: 700,
    }}>
      {isYes ? 'SIM' : 'NÃO'}
    </span>
  );
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

  const handleConcluir = async (cod: number) => {
    try {
      await http.put(`/api/operacoes/tarefas/${cod}/concluir`, {});
      toast.success('Tarefa concluída!');
      fetchClientes(search);
    } catch { toast.error('Erro ao concluir tarefa'); }
  };

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
            <i className="bi bi-list-task" style={{ color: '#00B0FA', fontSize: 16 }} />
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
                  <th style={th}>Status</th>
                  <th style={{ ...th, textAlign: 'center' }}>Concluído</th>
                  <th style={{ ...th, textAlign: 'center' }}>Ações</th>
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
                    <td style={td}>{statusBadge(c.status)}</td>
                    <td style={{ ...td, textAlign: 'center' }}>{concluidoBadge(c.qtdsistemas)}</td>
                    <td style={{ ...td, textAlign: 'center' }}>
                      {c.qtdsistemas !== 1 ? (
                        <button className="btn btn-sm" style={{ background: '#1DB954', color: '#fff', fontSize: 10, padding: '3px 10px' }}
                          onClick={() => handleConcluir(c.cod)}>
                          <i className="bi bi-check-lg me-1" />Concluir
                        </button>
                      ) : (
                        <span style={{ color: 'var(--ccm-gray-medium)', fontSize: 11 }}>—</span>
                      )}
                    </td>
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
