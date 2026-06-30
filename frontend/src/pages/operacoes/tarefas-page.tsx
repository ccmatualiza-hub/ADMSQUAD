import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { http } from '../../lib/http-client';

interface ConsultaItem {
  cod: number; razao: string | null; cliente: string | null;
  sistema: string | null; versao: string | null;
  qtdusers: number | null; serverbd: string | null;
  status: string | null; qtdsistemas: number | null;
}

interface TarefaAberta {
  cod: number; tarefa: string; descricao: string | null;
  datainicio: string | null; dataconclusao: string | null; status: string;
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
    <span style={{ background: isYes ? '#D4F5E2' : '#FDDEDE', color: isYes ? '#0E7E3B' : '#9B2020', borderRadius: 99, padding: '2px 10px', fontSize: 11, fontWeight: 700 }}>
      {isYes ? 'SIM' : 'NÃO'}
    </span>
  );
}

export default function TarefasPage({ onBack }: { onBack: () => void }) {
  const [clientes, setClientes]   = useState<ConsultaItem[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [stats, setStats]         = useState<{ sim: number; nao: number; pct_sim: number; pct_nao: number; todos_concluidos: boolean } | null>(null);
  const [tarefaAberta, setTarefaAberta] = useState<TarefaAberta | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm]           = useState({ tarefa: '', descricao: '' });
  const [saving, setSaving]       = useState(false);

  const fetchAll = async (q = '') => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.set('q', q);
      const [data, s, t] = await Promise.all([
        http.get<ConsultaItem[]>(`/api/operacoes/tarefas?${params}`),
        http.get<{ sim: number; nao: number; total: number; pct_sim: number; pct_nao: number; todos_concluidos: boolean }>('/api/operacoes/tarefas-stats'),
        http.get<TarefaAberta | null>('/api/operacoes/tarefa-aberta'),
      ]);
      setClientes(data);
      setStats(s);
      setTarefaAberta(t);
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleSearch = () => fetchAll(search);
  const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === 'Enter') handleSearch(); };

  const handleConcluir = async (cod: number) => {
    try {
      await http.put(`/api/operacoes/tarefas/${cod}/concluir`, {});
      toast.success('Tarefa concluída!');
      fetchAll(search);
    } catch { toast.error('Erro ao concluir tarefa'); }
  };

  const handleNovaTarefa = async () => {
    if (!form.tarefa) { toast.error('Nome da tarefa é obrigatório'); return; }
    setSaving(true);
    try {
      await http.post('/api/operacoes/tarefa-aberta', form);
      toast.success('Tarefa aberta!');
      setShowModal(false);
      setForm({ tarefa: '', descricao: '' });
      fetchAll(search);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao abrir tarefa');
    } finally { setSaving(false); }
  };

  const handleEncerrarTarefa = async () => {
    if (!tarefaAberta) return;
    if (!confirm('Deseja encerrar esta tarefa?')) return;
    try {
      await http.put(`/api/operacoes/tarefa-aberta/${tarefaAberta.cod}/concluir`, {});
      toast.success('Tarefa encerrada!');
      fetchAll(search);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao encerrar tarefa');
    }
  };

  const th = { color: '#fff', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '.05em', padding: '10px 12px', textAlign: 'left' as const, fontSize: 10, whiteSpace: 'nowrap' as const };
  const td = { padding: '9px 12px', fontSize: 12, whiteSpace: 'nowrap' as const };
  const inputStyle = { background: 'var(--ccm-ink)', border: '1px solid #1a3a6e', color: '#fff', fontSize: 13 };
  const labelStyle = { color: '#9BA4AB', fontSize: 10, fontWeight: 700 as const, textTransform: 'uppercase' as const, letterSpacing: '.14em' };

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
      <div className="section-title mb-3" style={{ textAlign: 'center' }}>Tarefas</div>

      {/* Tarefa Aberta + Contadores — mesma linha, mesmo tamanho */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-md-4">
          <div style={{ background: '#fff', borderRadius: 6, padding: '16px 18px', borderTop: '3px solid #00B0FA', boxShadow: '0 1px 4px rgba(12,25,33,.07)', textAlign: 'center', height: '100%' }}>
            {tarefaAberta ? (
              <>
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.12em', color: '#00B0FA', marginBottom: 4 }}>Tarefa em Aberto</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--ccm-ink)' }}>{tarefaAberta.tarefa}</div>
                {tarefaAberta.descricao && <div style={{ fontSize: 11, color: 'var(--ccm-gray-dark)', marginTop: 4 }}>{tarefaAberta.descricao}</div>}
                <div style={{ fontSize: 10, color: 'var(--ccm-gray-medium)', marginTop: 6 }}>
                  Início: {tarefaAberta.datainicio ? new Date(tarefaAberta.datainicio).toLocaleDateString('pt-BR') : '—'}
                </div>
                <button className="btn btn-sm mt-2" style={{ background: '#1DB954', color: '#fff', fontSize: 11, fontWeight: 700, padding: '5px 16px' }}
                  onClick={handleEncerrarTarefa} disabled={!stats?.todos_concluidos}>
                  <i className="bi bi-check-circle me-1" />Encerrar Tarefa
                </button>
                {!stats?.todos_concluidos && (
                  <div style={{ fontSize: 10, color: '#9B2020', marginTop: 6 }}>Conclua todos antes de encerrar</div>
                )}
              </>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: 80 }}>
                <button className="btn btn-ccm-primary" onClick={() => setShowModal(true)}>
                  <i className="bi bi-plus-lg me-1" />Nova Tarefa
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="col-6 col-md-4">
          <div style={{ background: '#fff', borderRadius: 6, padding: '16px 18px', borderTop: '3px solid #1DB954', boxShadow: '0 1px 4px rgba(12,25,33,.07)', textAlign: 'center', height: '100%' }}>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.12em', color: 'var(--ccm-gray-dark)' }}>Concluídos</div>
            <div style={{ fontSize: 26, fontWeight: 900, color: '#0E7E3B' }}>{stats?.sim ?? '—'}</div>
            <div style={{ fontSize: 12, color: 'var(--ccm-gray-medium)' }}>{stats ? `${stats.pct_sim}%` : '—'}</div>
          </div>
        </div>
        <div className="col-6 col-md-4">
          <div style={{ background: '#fff', borderRadius: 6, padding: '16px 18px', borderTop: '3px solid #E74C3C', boxShadow: '0 1px 4px rgba(12,25,33,.07)', textAlign: 'center', height: '100%' }}>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.12em', color: 'var(--ccm-gray-dark)' }}>Falta Fazer</div>
            <div style={{ fontSize: 26, fontWeight: 900, color: '#9B2020' }}>{stats?.nao ?? '—'}</div>
            <div style={{ fontSize: 12, color: 'var(--ccm-gray-medium)' }}>{stats ? `${stats.pct_nao}%` : '—'}</div>
          </div>
        </div>
      </div>

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

      {/* Modal Nova Tarefa */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 16 }}>
          <div style={{ background: '#132230', border: '1px solid #1a3a6e', borderTop: '3px solid #00B0FA', borderRadius: 8, padding: '28px 32px', width: '100%', maxWidth: 460, boxShadow: '0 8px 32px rgba(0,0,0,.4)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <div style={{ color: '#00B0FA', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.18em' }}>Operações — Tarefas</div>
                <div style={{ color: '#fff', fontWeight: 900, fontSize: 15, textTransform: 'uppercase' }}>Nova Tarefa</div>
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: 'transparent', border: 'none', color: '#9BA4AB', fontSize: 22, cursor: 'pointer' }}>×</button>
            </div>

            <div className="mb-3">
              <label style={labelStyle}>Tarefa *</label>
              <input type="text" className="form-control mt-1" style={inputStyle}
                value={form.tarefa} onChange={e => setForm(f => ({ ...f, tarefa: e.target.value }))} placeholder="Nome da tarefa" />
            </div>
            <div className="mb-4">
              <label style={labelStyle}>Descrição</label>
              <textarea className="form-control mt-1" rows={3} style={{ ...inputStyle, resize: 'vertical' }}
                value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} placeholder="Detalhes da tarefa..." />
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-sm" style={{ background: 'rgba(255,255,255,.07)', color: '#9BA4AB', fontSize: 12, padding: '8px 20px' }} onClick={() => setShowModal(false)}>
                Cancelar
              </button>
              <button className="btn btn-ccm-primary" style={{ fontSize: 12, padding: '8px 24px' }} onClick={handleNovaTarefa} disabled={saving}>
                {saving ? <><span className="spinner-border spinner-border-sm me-1" />Salvando…</> : <><i className="bi bi-check-lg me-1" />Abrir Tarefa</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
