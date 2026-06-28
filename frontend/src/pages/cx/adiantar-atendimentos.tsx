import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { http } from '../../lib/http-client';

interface Adiantar {
  cod: number;
  cliente: string;
  data: string;
  analista: string;
  ticket_linx: string;
  ticket_ccm: string;
  status: string;
}

const emptyForm = {
  cliente: '', data: new Date().toISOString().split('T')[0],
  analista: '', ticket_linx: '', ticket_ccm: '', status: 'aberto',
};

const inputStyle = { background: 'var(--ccm-ink)', border: '1px solid #1a3a6e', color: '#fff', fontSize: 13 };
const labelStyle = { color: '#9BA4AB', fontSize: 10, fontWeight: 700 as const, textTransform: 'uppercase' as const, letterSpacing: '.14em' };

export default function AdiantarAtendimentos({ onBack }: { onBack: () => void }) {
  const [items, setItems]         = useState<Adiantar[]>([]);
  const [analistas, setAnalistas] = useState<{ id: number; name: string }[]>([]);
  const [clienteSugs, setClienteSugs] = useState<string[]>([]);
  const [showSugs, setShowSugs]   = useState(false);
  const [loading, setLoading]     = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editCod, setEditCod]     = useState<number | null>(null);
  const [form, setForm]           = useState(emptyForm);
  const [saving, setSaving]       = useState(false);
  const [filterStatus, setFilterStatus] = useState('aberto');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [data, anal] = await Promise.all([
        http.get<Adiantar[]>('/api/cx/adiantar'),
        http.get<{ id: number; name: string }[]>('/api/pendencias/analistas'),
      ]);
      setItems(data);
      setAnalistas(anal);
    } catch { toast.error('Erro ao carregar atendimentos'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleClienteSearch = async (val: string) => {
    setForm(f => ({ ...f, cliente: val }));
    if (val.length >= 2) {
      try {
        const s = await http.get<string[]>(`/api/pendencias/clientes-autocomplete?q=${encodeURIComponent(val)}`);
        setClienteSugs(s); setShowSugs(s.length > 0);
      } catch { setClienteSugs([]); }
    } else { setClienteSugs([]); setShowSugs(false); }
  };

  const openCreate = () => { setEditCod(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = (a: Adiantar) => {
    setEditCod(a.cod);
    setForm({ cliente: a.cliente, data: a.data, analista: a.analista, ticket_linx: a.ticket_linx, ticket_ccm: a.ticket_ccm, status: a.status });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.cliente || !form.analista || !form.data) { toast.error('Cliente, Analista e Data são obrigatórios'); return; }
    setSaving(true);
    try {
      if (editCod !== null) {
        await http.put(`/api/cx/adiantar/${editCod}`, form);
        toast.success('Atendimento atualizado!');
      } else {
        await http.post('/api/cx/adiantar', form);
        toast.success('Atendimento registrado!');
      }
      setShowModal(false);
      fetchData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar');
    } finally { setSaving(false); }
  };

  const filtered = items.filter(i => filterStatus ? i.status === filterStatus : true);
  const th = { color: '#fff', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '.05em', padding: '10px 12px', textAlign: 'left' as const, fontSize: 10, whiteSpace: 'nowrap' as const };
  const td = { padding: '9px 12px', fontSize: 12, whiteSpace: 'nowrap' as const };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--ccm-blue)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em' }}>
          <i className="bi bi-arrow-left me-1" />CX
        </button>
        <span style={{ color: 'var(--ccm-gray-medium)', fontSize: 12 }}>/</span>
        <span style={{ color: 'var(--ccm-gray-dark)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em' }}>Adiantar Atendimentos Linx</span>
      </div>
      <div className="section-title mb-4" style={{ textAlign: 'center' }}>Adiantar Atendimentos Linx</div>

      <div className="table-card">
        <div style={{ background: 'var(--ccm-ink)', padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: '6px 6px 0 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <i className="bi bi-ticket-detailed" style={{ color: '#00B0FA', fontSize: 16 }} />
            <span style={{ color: '#fff', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.12em' }}>
              {filtered.length} atendimento(s)
            </span>
          </div>
          <button className="btn btn-ccm-primary btn-sm" onClick={openCreate}>
            <i className="bi bi-plus-lg me-1" />Novo Atendimento
          </button>
        </div>

        <div style={{ padding: '10px 20px', borderBottom: '1px solid var(--ccm-line)', display: 'flex', gap: 10 }}>
          <select className="form-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            style={{ maxWidth: 180, fontSize: 13 }}>
            <option value="">Todos</option>
            <option value="aberto">Aberto</option>
            <option value="concluido">Concluído</option>
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
                  <th style={th}>Data</th>
                  <th style={th}>Analista</th>
                  <th style={th}>Ticket Linx</th>
                  <th style={th}>Ticket CCM</th>
                  <th style={{ ...th, textAlign: 'center' }}>Status</th>
                  <th style={{ ...th, textAlign: 'center' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} style={{ padding: 32, textAlign: 'center', color: 'var(--ccm-gray-dark)' }}>Nenhum atendimento encontrado</td></tr>
                ) : filtered.map((a, i) => (
                  <tr key={a.cod} style={{ background: i % 2 === 0 ? '#fff' : '#F7F8FA', borderBottom: '1px solid var(--ccm-line)' }}>
                    <td style={{ ...td, fontWeight: 600, color: 'var(--ccm-ink)' }}>{a.cliente}</td>
                    <td style={td}>{new Date(a.data + 'T12:00:00').toLocaleDateString('pt-BR')}</td>
                    <td style={td}>{a.analista || '—'}</td>
                    <td style={{ ...td, color: 'var(--ccm-blue)', fontWeight: 600 }}>{a.ticket_linx || '—'}</td>
                    <td style={{ ...td, color: a.ticket_ccm ? '#0F6E56' : 'var(--ccm-gray-medium)', fontWeight: a.ticket_ccm ? 600 : 400 }}>
                      {a.ticket_ccm || <span style={{ fontStyle: 'italic', fontSize: 11 }}>Aguardando...</span>}
                    </td>
                    <td style={{ ...td, textAlign: 'center' }}>
                      <span style={{ background: a.status === 'concluido' ? '#D4F5E2' : '#E8EDF7', color: a.status === 'concluido' ? '#0E7E3B' : '#204294', borderRadius: 99, padding: '2px 9px', fontSize: 10, fontWeight: 700 }}>
                        {a.status === 'concluido' ? 'Concluído' : 'Aberto'}
                      </span>
                    </td>
                    <td style={{ ...td, textAlign: 'center' }}>
                      <button className="btn btn-sm" style={{ background: 'var(--ccm-blue)', color: '#fff', fontSize: 10, padding: '3px 10px' }} onClick={() => openEdit(a)}>
                        <i className="bi bi-pencil-fill me-1" />Editar
                      </button>
                    </td>
                  </tr>
                ))}
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
                <div style={{ color: '#00B0FA', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.18em' }}>CX — Linx</div>
                <div style={{ color: '#fff', fontWeight: 900, fontSize: 15, textTransform: 'uppercase' }}>{editCod !== null ? 'Editar Atendimento' : 'Novo Atendimento'}</div>
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: 'transparent', border: 'none', color: '#9BA4AB', fontSize: 22, cursor: 'pointer' }}>×</button>
            </div>

            <div className="row g-3">
              {/* Cliente com autocomplete */}
              <div className="col-12" style={{ position: 'relative' }}>
                <label style={labelStyle}>Cliente *</label>
                <input type="text" className="form-control mt-1" style={inputStyle}
                  value={form.cliente} onChange={e => handleClienteSearch(e.target.value)}
                  placeholder="Digite para buscar cliente..." />
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
                <label style={labelStyle}>Data *</label>
                <input type="date" className="form-control mt-1" style={inputStyle}
                  value={form.data} onChange={e => setForm(f => ({ ...f, data: e.target.value }))} />
              </div>

              <div className="col-12 col-md-6">
                <label style={labelStyle}>Analista *</label>
                <select className="form-select mt-1" style={inputStyle}
                  value={form.analista} onChange={e => setForm(f => ({ ...f, analista: e.target.value }))}>
                  <option value="">Selecione...</option>
                  {analistas.map(a => <option key={a.id} value={a.name}>{a.name}</option>)}
                </select>
              </div>

              <div className="col-12 col-md-6">
                <label style={labelStyle}>Ticket Linx</label>
                <input type="text" className="form-control mt-1" style={inputStyle}
                  value={form.ticket_linx} onChange={e => setForm(f => ({ ...f, ticket_linx: e.target.value }))}
                  placeholder="Nº ticket Linx" />
              </div>

              <div className="col-12 col-md-6">
                <label style={labelStyle}>Ticket CCM <span style={{ fontSize: 9, opacity: .6 }}>(deixe em branco se pendente)</span></label>
                <input type="text" className="form-control mt-1" style={inputStyle}
                  value={form.ticket_ccm} onChange={e => setForm(f => ({ ...f, ticket_ccm: e.target.value }))}
                  placeholder="Aguardando..." />
              </div>

              <div className="col-12">
                <label style={labelStyle}>Status</label>
                <select className="form-select mt-1" style={inputStyle}
                  value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                  <option value="aberto">Aberto</option>
                  <option value="concluido">Concluído</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
              <button className="btn btn-sm" style={{ background: 'rgba(255,255,255,.07)', color: '#9BA4AB', fontSize: 12, padding: '8px 20px' }} onClick={() => setShowModal(false)}>
                Cancelar
              </button>
              <button className="btn btn-ccm-primary" style={{ fontSize: 12, padding: '8px 24px' }} onClick={handleSave} disabled={saving}>
                {saving ? <><span className="spinner-border spinner-border-sm me-1" />Salvando…</> : <><i className="bi bi-check-lg me-1" />{editCod !== null ? 'Salvar' : 'Registrar'}</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
