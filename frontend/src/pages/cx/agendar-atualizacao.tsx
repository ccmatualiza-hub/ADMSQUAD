import { useEffect, useState, useRef } from 'react';
import { toast } from 'sonner';
import { http } from '../../lib/http-client';
import { useAuthStore } from '../../store/auth-store';

interface Agendamento {
  cod: number;
  razao: string | null;
  cliente: string | null;
  sistema: string | null;
  bd: string | null;
  versao: string | null;
  dt_atualiza: string | null;
  ticketupdate: string | null;
  formato: string | null;
  tipo: string | null;
  pacote: string | null;
  useragend: string | null;
  concluido: string | number | null;
  status: string | null;
}

interface ClienteOpt { cod: number; cliente: string; razao: string | null; }

const TIPO_OPTS = [
  { label: 'EMERGENCIAL',    value: 'E' },
  { label: 'TROCA DE VERSÃO', value: 'T' },
  { label: 'LINXDMS-WEB',    value: 'L' },
];
const PACOTE_OPTS = [
  { label: 'ESSENCIAL',  value: 'ESS' },
  { label: 'EVOLUTIVO',  value: 'EVO' },
  { label: 'ESPECIAL',   value: 'ESP' },
  { label: 'DMSWEB',     value: 'WEB' },
];

const emptyForm = {
  cod: 0, cliente: '', razao: '', dt_atualiza: new Date().toLocaleDateString('pt-BR').replace(/\//g, '/'),
  ticketupdate: '#', formato: 'M', tipo: 'E', pacote: 'EVO', useragend: '',
};

const inputStyle = { background: 'var(--ccm-ink)', border: '1px solid #1a3a6e', color: '#fff', fontSize: 13 };
const labelStyle = { color: '#9BA4AB', fontSize: 10, fontWeight: 700 as const, textTransform: 'uppercase' as const, letterSpacing: '.14em' };

function concluidoBg(val: string | number | null) {
  const v = String(val ?? '0').trim();
  if (v === '100') return { bg: '#1DB954', color: '#fff' };
  if (v !== '0') return { bg: '#F9E000', color: '#5a4000' };
  return { bg: '#fff', color: '#333', border: '1px solid #ddd' };
}

export default function AgendarAtualizacao({ onBack }: { onBack: () => void }) {
  const user = useAuthStore(s => s.user);
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [loading, setLoading]           = useState(true);
  const [showModal, setShowModal]       = useState(false);
  const [editCod, setEditCod]           = useState<number | null>(null);
  const [form, setForm]                 = useState<typeof emptyForm>({ ...emptyForm, useragend: user?.name ?? '' });
  const [saving, setSaving]             = useState(false);
  const [clienteOpts, setClienteOpts]   = useState<ClienteOpt[]>([]);
  const [showSugs, setShowSugs]         = useState(false);
  const [loadingSugs, setLoadingSugs]   = useState(false);
  const sugsRef = useRef<HTMLDivElement>(null);

  const fetchAgendamentos = async () => {
    setLoading(true);
    try {
      const data = await http.get<Agendamento[]>('/api/cx/agendamentos/hoje');
      setAgendamentos(data);
    } catch { toast.error('Erro ao carregar agendamentos'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAgendamentos(); }, []);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (sugsRef.current && !sugsRef.current.contains(e.target as Node)) setShowSugs(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const handleEmpresaChange = async (val: string) => {
    setForm(f => ({ ...f, cliente: val, razao: '' }));
    if (val.length >= 2) {
      setLoadingSugs(true);
      try {
        const opts = await http.get<ClienteOpt[]>(`/api/cx/agendamentos/clientes-disponiveis?q=${encodeURIComponent(val)}`);
        setClienteOpts(opts);
        setShowSugs(opts.length > 0);
      } catch { setClienteOpts([]); }
      finally { setLoadingSugs(false); }
    } else { setClienteOpts([]); setShowSugs(false); }
  };

  const selectCliente = (opt: ClienteOpt) => {
    setForm(f => ({ ...f, cod: opt.cod, cliente: opt.cliente, razao: opt.razao ?? '' }));
    setShowSugs(false);
  };

  const openCreate = () => {
    setEditCod(null);
    setForm({ ...emptyForm, useragend: user?.name ?? '' });
    setShowModal(true);
  };

  const openEdit = (a: Agendamento) => {
    setEditCod(a.cod);
    setForm({
      cod: a.cod, cliente: a.cliente ?? '', razao: a.razao ?? '',
      dt_atualiza: a.dt_atualiza ?? '',
      ticketupdate: a.ticketupdate ?? '',
      formato: a.formato ?? 'EVO',
      tipo: a.tipo ?? 'E',
      pacote: a.pacote ?? 'EVO',
      useragend: a.useragend ?? user?.name ?? '',
    });
    setShowModal(true);
  };

  const handleCancel = async (a: Agendamento) => {
    if (!confirm(`Cancelar agendamento de "${a.razao}"? Isso zerará a data e marcará como concluído.`)) return;
    try {
      await http.del(`/api/cx/agendamentos/${a.cod}`);
      toast.success('Agendamento cancelado!');
      fetchAgendamentos();
    } catch { toast.error('Erro ao cancelar agendamento'); }
  };

  const handleSave = async () => {
    if (!form.cod || !form.cliente || !form.dt_atualiza) { toast.error('Selecione uma empresa da lista'); return; }
    setSaving(true);
    try {
      const body = { ...form, cod: form.cod, useragend: user?.name ?? form.useragend };
      if (editCod !== null) {
        await http.put(`/api/cx/agendamentos/${editCod}`, body);
        toast.success('Agendamento atualizado!');
      } else {
        const res = await http.post<{ updated: number; cliente: string }>('/api/cx/agendamentos', body);
        toast.success(`Agendamento salvo — ${res.updated} registro(s) atualizados`);
      }
      setShowModal(false);
      fetchAgendamentos();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar');
    } finally { setSaving(false); }
  };

  const today = new Date().toLocaleDateString('pt-BR');
  const th = { color: '#fff', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '.05em', padding: '10px 12px', textAlign: 'left' as const, fontSize: 10, whiteSpace: 'nowrap' as const };
  const td = { padding: '9px 12px', fontSize: 12, whiteSpace: 'nowrap' as const };

  return (
    <div>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--ccm-blue)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em' }}>
          <i className="bi bi-arrow-left me-1" />CX
        </button>
        <span style={{ color: 'var(--ccm-gray-medium)', fontSize: 12 }}>/</span>
        <span style={{ color: 'var(--ccm-gray-dark)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em' }}>Agendar Atualização Linx</span>
      </div>
      <div className="section-title mb-1" style={{ textAlign: 'center' }}>Agendar Atualização Linx</div>
      <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--ccm-gray-dark)', marginBottom: 20 }}>Agendamentos do dia — {today}</div>

      <div className="table-card">
        {/* Header */}
        <div style={{ background: 'var(--ccm-ink)', padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: '6px 6px 0 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <i className="bi bi-calendar-check" style={{ color: '#00B0FA', fontSize: 16 }} />
            <span style={{ color: '#fff', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.12em' }}>
              {loading ? 'Carregando...' : `${agendamentos.length} agendamento(s)`}
            </span>
          </div>
          <button className="btn btn-ccm-primary btn-sm" onClick={openCreate}>
            <i className="bi bi-plus-lg me-1" />Novo Agendamento
          </button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          {loading ? (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--ccm-gray-dark)' }}>
              <span className="spinner-border spinner-border-sm me-2" />Carregando...
            </div>
          ) : agendamentos.length === 0 ? (
            <div style={{ padding: 48, textAlign: 'center', color: 'var(--ccm-gray-dark)' }}>
              <i className="bi bi-calendar-x" style={{ fontSize: 32, display: 'block', marginBottom: 12, color: 'var(--ccm-gray-medium)' }} />
              Nenhum agendamento para hoje
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--ccm-blue)' }}>
                  <th style={th}>Razão Social</th>
                  <th style={th}>Sistema</th>
                  <th style={th}>BD</th>
                  <th style={th}>Versão</th>
                  <th style={th}>Data</th>
                  <th style={th}>Ticket</th>
                  <th style={th}>Tipo</th>
                  <th style={th}>Formato</th>
                  <th style={th}>Pacote</th>
                  <th style={th}>Agendado por</th>
                  <th style={{ ...th, textAlign: 'center' }}>%</th>
                  <th style={{ ...th, textAlign: 'center' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {agendamentos.map((a, i) => {
                  const c = concluidoBg(a.concluido);
                  return (
                    <tr key={a.cod} style={{ background: i % 2 === 0 ? '#fff' : '#F7F8FA', borderBottom: '1px solid var(--ccm-line)' }}>
                      <td style={{ ...td, fontWeight: 600, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.razao || '—'}</td>
                      <td style={{ ...td, color: 'var(--ccm-blue)', fontWeight: 600 }}>{a.sistema || '—'}</td>
                      <td style={td}>{a.bd || '—'}</td>
                      <td style={td}>{a.versao || '—'}</td>
                      <td style={td}>{a.dt_atualiza || '—'}</td>
                      <td style={{ ...td, color: 'var(--ccm-blue)' }}>{a.ticketupdate || '—'}</td>
                      <td style={{ ...td, textAlign: 'center', fontWeight: 700 }}>{a.tipo || '—'}</td>
                      <td style={td}>{a.formato || '—'}</td>
                      <td style={td}>{a.pacote || '—'}</td>
                      <td style={td}>{a.useragend ? a.useragend.toUpperCase() : '—'}</td>
                      <td style={{ ...td, textAlign: 'center' }}>
                        <span style={{ background: c.bg, color: c.color, borderRadius: 4, padding: '2px 8px', fontWeight: 700, fontSize: 11, border: (c as any).border }}>
                          {String(a.concluido ?? '0').trim()}
                        </span>
                      </td>
                      <td style={{ ...td, textAlign: 'center' }}>
                        <button className="btn btn-sm" style={{ background: 'var(--ccm-blue)', color: '#fff', fontSize: 10, padding: '3px 10px' }} onClick={() => openEdit(a)}>
                          <i className="bi bi-pencil-fill me-1" />Editar
                        </button>
                        <button className="btn btn-sm" style={{ background: '#E74C3C', color: '#fff', fontSize: 10, padding: '3px 10px' }} onClick={() => handleCancel(a)}>
                          <i className="bi bi-x-circle me-1" />Cancelar
                        </button>
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
          <div style={{ background: '#132230', border: '1px solid #1a3a6e', borderTop: '3px solid #00B0FA', borderRadius: 8, padding: '28px 32px', width: '100%', maxWidth: 560, boxShadow: '0 8px 32px rgba(0,0,0,.4)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <div style={{ color: '#00B0FA', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.18em' }}>CX — Linx</div>
                <div style={{ color: '#fff', fontWeight: 900, fontSize: 15, textTransform: 'uppercase' }}>
                  {editCod !== null ? 'Editar Agendamento' : 'Novo Agendamento'}
                </div>
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: 'transparent', border: 'none', color: '#9BA4AB', fontSize: 22, cursor: 'pointer' }}>×</button>
            </div>

            <div className="row g-3">
              {/* Empresa autocomplete */}
              <div className="col-12" ref={sugsRef} style={{ position: 'relative' }}>
                <label style={labelStyle}>Empresa *</label>
                <input type="text" className="form-control mt-1" style={inputStyle}
                  value={form.razao || form.cliente}
                  onChange={e => handleEmpresaChange(e.target.value)}
                  placeholder="Digite para buscar empresa..." />
                {loadingSugs && <div style={{ position: 'absolute', top: '100%', left: 0, color: '#9BA4AB', fontSize: 12, padding: 4 }}>Buscando...</div>}
                {showSugs && clienteOpts.length > 0 && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#1a2e3e', border: '1px solid #1a3a6e', borderRadius: 4, zIndex: 100, maxHeight: 200, overflowY: 'auto', marginTop: 2 }}>
                    {clienteOpts.map(opt => (
                      <div key={opt.cliente} onClick={() => selectCliente(opt)}
                        style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid #1a3a6e' }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#204294')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                        <div style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>{opt.razao || opt.cliente}</div>
                        <div style={{ color: '#9BA4AB', fontSize: 11 }}>{opt.cliente}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Data */}
              <div className="col-12 col-md-6">
                <label style={labelStyle}>Data *</label>
                <input type="date" className="form-control mt-1" style={inputStyle}
                  value={form.dt_atualiza
                    ? (() => { const p = form.dt_atualiza.split('/'); return p.length === 3 ? `${p[2]}-${p[1]}-${p[0]}` : form.dt_atualiza; })()
                    : ''}
                  onChange={e => {
                    const [y, m, d] = e.target.value.split('-');
                    setForm(f => ({ ...f, dt_atualiza: `${d}/${m}/${y}` }));
                  }} />
              </div>

              {/* Ticket */}
              <div className="col-12 col-md-6">
                <label style={labelStyle}>Ticket</label>
                <input type="text" className="form-control mt-1" style={inputStyle}
                  value={form.ticketupdate}
                  onChange={e => {
                    const v = e.target.value;
                    setForm(f => ({ ...f, ticketupdate: v.startsWith('#') ? v : '#' + v.replace(/^#+/, '') }));
                  }}
                  placeholder="#000000" />
              </div>

              {/* Formato - fixo CCM */}
              <div className="col-12 col-md-4">
                <label style={labelStyle}>Formato</label>
                <input type="text" className="form-control mt-1" style={{ ...inputStyle, opacity: 0.6 }}
                  value="CCM" readOnly />
              </div>

              {/* Tipo */}
              <div className="col-12 col-md-4">
                <label style={labelStyle}>Tipo</label>
                <select className="form-select mt-1" style={inputStyle}
                  value={form.tipo} onChange={e => {
                    const t = e.target.value;
                    setForm(f => ({
                      ...f,
                      tipo: t,
                      pacote: t === 'L' ? 'WEB' : (f.pacote === 'WEB' ? 'EVO' : f.pacote),
                    }));
                  }}>
                  {TIPO_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>

              {/* Pacote */}
              <div className="col-12 col-md-4">
                <label style={labelStyle}>Pacote</label>
                <select className="form-select mt-1" style={inputStyle}
                  value={form.pacote} disabled={form.tipo === 'L'} onChange={e => setForm(f => ({ ...f, pacote: e.target.value }))}>
                  {PACOTE_OPTS.filter(o => form.tipo === 'L' ? o.value === 'WEB' : o.value !== 'WEB').map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>

              {/* Usuário (somente leitura) */}
              <div className="col-12">
                <label style={labelStyle}>Usuário Agendando</label>
                <input type="text" className="form-control mt-1" style={{ ...inputStyle, opacity: 0.6 }}
                  value={user?.name ?? ''} readOnly />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
              <button className="btn btn-sm" style={{ background: 'rgba(255,255,255,.07)', color: '#9BA4AB', fontSize: 12, padding: '8px 20px' }} onClick={() => setShowModal(false)}>
                Cancelar
              </button>
              <button className="btn btn-ccm-primary" style={{ fontSize: 12, padding: '8px 24px' }} onClick={handleSave} disabled={saving}>
                {saving ? <><span className="spinner-border spinner-border-sm me-1" />Salvando…</> : <><i className="bi bi-check-lg me-1" />Gravar Agendamento</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
