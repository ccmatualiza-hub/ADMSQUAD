import { useEffect, useState, useRef } from 'react';
import { toast } from 'sonner';
import { http } from '../../lib/http-client';

interface Atividade {
  cod: number; cliente: string; analista: string;
  tipoatividade: string; data: string;
  horainicio: string | null; horafim: string | null; status: string;
}

const STATUS_INFO: Record<string, { label: string; color: string; bg: string }> = {
  'Nao Iniciado': { label: 'Não Iniciado', color: '#444',    bg: '#F0F0F0' },
  'Em Andamento': { label: 'Em Andamento', color: '#8A6800', bg: '#FFF8CC' },
  'Concluido':    { label: 'Concluído',    color: '#0E7E3B', bg: '#D4F5E2' },
  'Cancelado':    { label: 'Cancelado',    color: '#9B2020', bg: '#FDDEDE' },
};

const emptyForm = {
  cliente: '', analista: '', tipoatividade: '',
  data: new Date().toISOString().split('T')[0],
};

const inputStyle = { background: 'var(--ccm-ink)', border: '1px solid #1a3a6e', color: '#fff', fontSize: 13 };
const labelStyle = { color: '#9BA4AB', fontSize: 10, fontWeight: 700 as const, textTransform: 'uppercase' as const, letterSpacing: '.14em' };

export default function MonitorAtividades({ onBack }: { onBack: () => void }) {
  const [items, setItems]         = useState<Atividade[]>([]);
  const [analistas, setAnalistas] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading]     = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm]           = useState(emptyForm);
  const [saving, setSaving]       = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [clienteSugs, setClienteSugs] = useState<string[]>([]);
  const [showSugs, setShowSugs]   = useState(false);
  const clienteRef                = useRef<HTMLDivElement>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [data, anal] = await Promise.all([
        http.get<Atividade[]>('/api/operacoes/atividades'),
        http.get<{ id: number; name: string }[]>('/api/pendencias/analistas'),
      ]);
      setItems(data);
      setAnalistas(anal);
    } catch { toast.error('Erro ao carregar atividades'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (clienteRef.current && !clienteRef.current.contains(e.target as Node)) setShowSugs(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const handleClienteSearch = async (val: string) => {
    setForm(f => ({ ...f, cliente: val }));
    if (val.length >= 2) {
      try {
        const s = await http.get<string[]>(`/api/pendencias/clientes-autocomplete?q=${encodeURIComponent(val)}`);
        setClienteSugs(s); setShowSugs(s.length > 0);
      } catch { setClienteSugs([]); }
    } else { setClienteSugs([]); setShowSugs(false); }
  };

  const handleSave = async () => {
    if (!form.cliente || !form.analista || !form.tipoatividade || !form.data) {
      toast.error('Preencha todos os campos'); return;
    }
    setSaving(true);
    try {
      await http.post('/api/operacoes/atividades', form);
      toast.success('Atividade registrada!');
      setShowModal(false);
      fetchData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar');
    } finally { setSaving(false); }
  };

  const handleAction = async (cod: number, action: 'iniciar' | 'terminar' | 'cancelar') => {
    try {
      await http.put(`/api/operacoes/atividades/${cod}/${action}`, {});
      const msgs = { iniciar: 'Atividade iniciada!', terminar: 'Atividade concluída!', cancelar: 'Atividade cancelada!' };
      toast.success(msgs[action]);
      fetchData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro');
    }
  };

  const filtered = items.filter(i => filterStatus ? i.status === filterStatus : true);
  const th = { color: '#fff', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '.05em', padding: '10px 12px', textAlign: 'left' as const, fontSize: 10, whiteSpace: 'nowrap' as const };
  const td = { padding: '9px 12px', fontSize: 12, whiteSpace: 'nowrap' as const };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--ccm-blue)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em' }}>
          <i className="bi bi-arrow-left me-1" />Operações
        </button>
        <span style={{ color: 'var(--ccm-gray-medium)', fontSize: 12 }}>/</span>
        <span style={{ color: 'var(--ccm-gray-dark)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em' }}>Monitor de Atividades</span>
      </div>
      <div className="section-title mb-4" style={{ textAlign: 'center' }}>Monitor de Atividades</div>

      <div className="table-card">
        <div style={{ background: 'var(--ccm-ink)', padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: '6px 6px 0 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <i className="bi bi-activity" style={{ color: '#00B0FA', fontSize: 16 }} />
            <span style={{ color: '#fff', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.12em' }}>
              {filtered.length} atividade(s)
            </span>
          </div>
          <button className="btn btn-ccm-primary btn-sm" onClick={() => setShowModal(true)}>
            <i className="bi bi-plus-lg me-1" />Nova Atividade
          </button>
        </div>

        <div style={{ padding: '10px 20px', borderBottom: '1px solid var(--ccm-line)' }}>
          <select className="form-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            style={{ maxWidth: 200, fontSize: 13 }}>
            <option value="">Todos os status</option>
            {Object.entries(STATUS_INFO).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
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
                  <th style={th}>Cliente</th>
                  <th style={th}>Analista</th>
                  <th style={th}>Tipo Atividade</th>
                  <th style={th}>Data</th>
                  <th style={{ ...th, textAlign: 'center' }}>Início</th>
                  <th style={{ ...th, textAlign: 'center' }}>Fim</th>
                  <th style={{ ...th, textAlign: 'center' }}>Status</th>
                  <th style={{ ...th, textAlign: 'center' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={8} style={{ padding: 32, textAlign: 'center', color: 'var(--ccm-gray-dark)' }}>Nenhuma atividade encontrada</td></tr>
                ) : filtered.map((a, i) => {
                  const si = STATUS_INFO[a.status] ?? { label: a.status, color: '#444', bg: '#eee' };
                  return (
                    <tr key={a.cod} style={{ background: i % 2 === 0 ? '#fff' : '#F7F8FA', borderBottom: '1px solid var(--ccm-line)' }}>
                      <td style={{ ...td, fontWeight: 600, color: 'var(--ccm-ink)', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.cliente}</td>
                      <td style={td}>{a.analista}</td>
                      <td style={{ ...td, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.tipoatividade}</td>
                      <td style={td}>{new Date(a.data + 'T12:00:00').toLocaleDateString('pt-BR')}</td>
                      <td style={{ ...td, textAlign: 'center', fontWeight: 600, color: '#0F6E56' }}>{a.horainicio || '—'}</td>
                      <td style={{ ...td, textAlign: 'center', fontWeight: 600, color: '#204294' }}>{a.horafim || '—'}</td>
                      <td style={{ ...td, textAlign: 'center' }}>
                        <span style={{ background: si.bg, color: si.color, borderRadius: 99, padding: '2px 9px', fontSize: 10, fontWeight: 700 }}>{si.label}</span>
                      </td>
                      <td style={{ ...td, textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                          <button className="btn btn-sm" style={{ background: '#0F6E56', color: '#fff', fontSize: 10, padding: '3px 8px' }}
                            disabled={a.status !== 'Nao Iniciado'} onClick={() => handleAction(a.cod, 'iniciar')}>
                            <i className="bi bi-play-fill me-1" />Iniciar
                          </button>
                          <button className="btn btn-sm" style={{ background: '#204294', color: '#fff', fontSize: 10, padding: '3px 8px' }}
                            disabled={a.status !== 'Em Andamento'} onClick={() => handleAction(a.cod, 'terminar')}>
                            <i className="bi bi-stop-fill me-1" />Terminar
                          </button>
                          <button className="btn btn-sm" style={{ background: '#E74C3C', color: '#fff', fontSize: 10, padding: '3px 8px' }}
                            disabled={a.status === 'Concluido' || a.status === 'Cancelado'} onClick={() => handleAction(a.cod, 'cancelar')}>
                            <i className="bi bi-x-lg me-1" />Cancelar
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 16 }}>
          <div style={{ background: '#132230', border: '1px solid #1a3a6e', borderTop: '3px solid #00B0FA', borderRadius: 8, padding: '28px 32px', width: '100%', maxWidth: 520, boxShadow: '0 8px 32px rgba(0,0,0,.4)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <div style={{ color: '#00B0FA', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.18em' }}>Operações</div>
                <div style={{ color: '#fff', fontWeight: 900, fontSize: 15, textTransform: 'uppercase' }}>Nova Atividade</div>
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: 'transparent', border: 'none', color: '#9BA4AB', fontSize: 22, cursor: 'pointer' }}>×</button>
            </div>

            <div className="row g-3">
              {/* Cliente autocomplete */}
              <div className="col-12" ref={clienteRef} style={{ position: 'relative' }}>
                <label style={labelStyle}>Cliente *</label>
                <input type="text" className="form-control mt-1" style={inputStyle}
                  value={form.cliente} onChange={e => handleClienteSearch(e.target.value)}
                  placeholder="Digite para buscar..." />
                {showSugs && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#1a2e3e', border: '1px solid #1a3a6e', borderRadius: 4, zIndex: 100, maxHeight: 180, overflowY: 'auto', marginTop: 2 }}>
                    {clienteSugs.map(s => (
                      <div key={s} onClick={() => { setForm(f => ({ ...f, cliente: s })); setShowSugs(false); }}
                        style={{ padding: '8px 12px', color: '#fff', cursor: 'pointer', fontSize: 13, borderBottom: '1px solid #1a3a6e' }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#204294')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>{s}</div>
                    ))}
                  </div>
                )}
              </div>

              <div className="col-12 col-md-6">
                <label style={labelStyle}>Analista *</label>
                <select className="form-select mt-1" style={inputStyle}
                  value={form.analista} onChange={e => setForm(f => ({ ...f, analista: e.target.value }))}>
                  <option value="">Selecione...</option>
                  {analistas.map(a => <option key={a.id} value={a.name.toUpperCase()}>{a.name}</option>)}
                </select>
              </div>

              <div className="col-12 col-md-6">
                <label style={labelStyle}>Data *</label>
                <input type="date" className="form-control mt-1" style={inputStyle}
                  value={form.data} onChange={e => setForm(f => ({ ...f, data: e.target.value }))} />
              </div>

              <div className="col-12">
                <label style={labelStyle}>Tipo de Atividade *</label>
                <input type="text" className="form-control mt-1" style={inputStyle}
                  value={form.tipoatividade} onChange={e => setForm(f => ({ ...f, tipoatividade: e.target.value }))}
                  placeholder="Ex: Suporte, Treinamento, Implantação..." />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
              <button className="btn btn-sm" style={{ background: 'rgba(255,255,255,.07)', color: '#9BA4AB', fontSize: 12, padding: '8px 20px' }} onClick={() => setShowModal(false)}>
                Cancelar
              </button>
              <button className="btn btn-ccm-primary" style={{ fontSize: 12, padding: '8px 24px' }} onClick={handleSave} disabled={saving}>
                {saving ? <><span className="spinner-border spinner-border-sm me-1" />Salvando…</> : <><i className="bi bi-check-lg me-1" />Registrar</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
