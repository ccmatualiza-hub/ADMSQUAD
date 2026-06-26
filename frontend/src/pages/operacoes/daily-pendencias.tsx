import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { http } from '../../lib/http-client';

interface Pendencia {
  id: number;
  cliente: string;
  ticket: string;
  descritivo: string;
  status: string;
  data: string;
  dias: number | null;
}

const STATUS_INFO: Record<string, { label: string; color: string; bg: string }> = {
  aberto:       { label: 'Aberto',        color: '#fff',    bg: '#204294' },
  em_andamento: { label: 'Em Andamento',  color: '#fff',    bg: '#0F6E56' },
  impedimento:  { label: 'Impedimento',   color: '#fff',    bg: '#E74C3C' },
  resolvido:    { label: 'Resolvido',     color: '#fff',    bg: '#888780' },
};

const STATUS_OPTIONS = [
  { value: 'aberto',       label: 'Aberto'        },
  { value: 'em_andamento', label: 'Em Andamento'  },
  { value: 'impedimento',  label: 'Impedimento'   },
  { value: 'resolvido',    label: 'Resolvido'     },
];

const emptyForm = {
  cliente: '', ticket: '', descritivo: '',
  status: 'aberto', data: new Date().toISOString().split('T')[0],
};

interface Props { onBack: () => void; }

export default function DailyPendencias({ onBack }: Props) {
  const [pendencias, setPendencias] = useState<Pendencia[]>([]);
  const [loading, setLoading]       = useState(true);
  const [showModal, setShowModal]   = useState(false);
  const [editItem, setEditItem]     = useState<Pendencia | null>(null);
  const [form, setForm]             = useState(emptyForm);
  const [saving, setSaving]         = useState(false);
  const [search, setSearch]         = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await http.get<Pendencia[]>('/api/pendencias/');
      setPendencias(data);
    } catch { toast.error('Erro ao carregar pendências'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const openCreate = () => { setEditItem(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = (p: Pendencia) => {
    setEditItem(p);
    setForm({ cliente: p.cliente, ticket: p.ticket, descritivo: p.descritivo, status: p.status, data: p.data });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.cliente || !form.ticket || !form.descritivo || !form.data) {
      toast.error('Preencha todos os campos obrigatórios'); return;
    }
    setSaving(true);
    try {
      if (editItem) {
        await http.put(`/api/pendencias/${editItem.id}`, form);
        toast.success('Pendência atualizada!');
      } else {
        await http.post('/api/pendencias/', form);
        toast.success('Pendência registrada!');
      }
      setShowModal(false);
      fetchData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Deseja excluir esta pendência?')) return;
    try {
      await http.del(`/api/pendencias/${id}`);
      toast.success('Pendência excluída');
      fetchData();
    } catch { toast.error('Erro ao excluir'); }
  };

  const filtered = pendencias.filter(p => {
    const matchSearch = [p.cliente, p.ticket, p.descritivo].some(v =>
      v.toLowerCase().includes(search.toLowerCase()));
    const matchStatus = filterStatus ? p.status === filterStatus : true;
    return matchSearch && matchStatus;
  });

  const diasColor = (dias: number | null) => {
    if (dias === null) return 'var(--ccm-gray-dark)';
    if (dias <= 1) return '#0F6E56';
    if (dias <= 3) return '#D4A000';
    return '#E74C3C';
  };

  return (
    <div>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--ccm-blue)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em' }}>
          <i className="bi bi-arrow-left me-1" />Operações
        </button>
        <span style={{ color: 'var(--ccm-gray-medium)', fontSize: 12 }}>/</span>
        <span style={{ color: 'var(--ccm-gray-dark)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em' }}>Daily — Pendências</span>
      </div>
      <div className="section-title mb-4" style={{ textAlign: 'center' }}>Daily — Pendências</div>

      {/* Tabela */}
      <div className="table-card">
        <div style={{ background: 'var(--ccm-ink)', padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: '6px 6px 0 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <i className="bi bi-exclamation-triangle-fill" style={{ color: '#F9E000', fontSize: 16 }} />
            <span style={{ color: '#fff', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.12em' }}>
              {filtered.length} pendências
            </span>
          </div>
          <button className="btn btn-ccm-primary btn-sm" onClick={openCreate}>
            <i className="bi bi-plus-lg me-1" />Nova Pendência
          </button>
        </div>

        {/* Filtros */}
        <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--ccm-line)', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <input type="text" className="form-control" placeholder="Buscar cliente, ticket ou descritivo..."
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ maxWidth: 320, fontSize: 13 }} />
          <select className="form-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            style={{ maxWidth: 180, fontSize: 13 }}>
            <option value="">Todos os status</option>
            {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>

        <div style={{ overflowX: 'auto' }}>
          {loading ? (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--ccm-gray-dark)' }}>
              <span className="spinner-border spinner-border-sm me-2" />Carregando...
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'var(--ccm-blue)' }}>
                  {['Cliente', 'Ticket', 'Descritivo', 'Status', 'Data', 'Dias', 'Ações'].map(h => (
                    <th key={h} style={{ color: '#fff', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', padding: '10px 14px', textAlign: 'left', fontSize: 11, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} style={{ padding: 32, textAlign: 'center', color: 'var(--ccm-gray-dark)' }}>Nenhuma pendência encontrada</td></tr>
                ) : filtered.map((p, i) => {
                  const si = STATUS_INFO[p.status] ?? { label: p.status, color: '#fff', bg: '#888' };
                  return (
                    <tr key={p.id} style={{ background: i % 2 === 0 ? '#fff' : '#F7F8FA', borderBottom: '1px solid var(--ccm-line)' }}>
                      <td style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--ccm-ink)', whiteSpace: 'nowrap' }}>{p.cliente}</td>
                      <td style={{ padding: '10px 14px', color: 'var(--ccm-blue)', fontWeight: 600, whiteSpace: 'nowrap' }}>{p.ticket}</td>
                      <td style={{ padding: '10px 14px', color: 'var(--ccm-ink)', maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={p.descritivo}>{p.descritivo}</td>
                      <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                        <span style={{ background: si.bg, color: si.color, borderRadius: 99, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>{si.label}</span>
                      </td>
                      <td style={{ padding: '10px 14px', color: 'var(--ccm-gray-dark)', whiteSpace: 'nowrap' }}>
                        {new Date(p.data + 'T12:00:00').toLocaleDateString('pt-BR')}
                      </td>
                      <td style={{ padding: '10px 14px', fontWeight: 700, color: diasColor(p.dias), whiteSpace: 'nowrap' }}>
                        {p.dias !== null ? `${p.dias}d` : '—'}
                      </td>
                      <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-sm" style={{ background: 'var(--ccm-blue)', color: '#fff', fontSize: 11, padding: '4px 10px' }} onClick={() => openEdit(p)}>
                            <i className="bi bi-pencil-fill me-1" />Editar
                          </button>
                          <button className="btn btn-sm" style={{ background: '#E74C3C', color: '#fff', fontSize: 11, padding: '4px 10px' }} onClick={() => handleDelete(p.id)}>
                            <i className="bi bi-trash me-1" />Excluir
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
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: '#132230', border: '1px solid #1a3a6e', borderTop: '3px solid #F9E000', borderRadius: 8, padding: '32px 36px', width: '100%', maxWidth: 520, boxShadow: '0 8px 32px rgba(0,0,0,.4)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <div>
                <div style={{ color: '#F9E000', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.18em' }}>Daily — Operações</div>
                <div style={{ color: '#fff', fontWeight: 900, fontSize: 16, textTransform: 'uppercase' }}>{editItem ? 'Editar Pendência' : 'Nova Pendência'}</div>
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: 'transparent', border: 'none', color: '#9BA4AB', fontSize: 22, cursor: 'pointer', lineHeight: 1 }}>×</button>
            </div>

            <div className="row g-3">
              <div className="col-12 col-md-6">
                <label style={{ color: '#9BA4AB', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.14em' }}>Cliente *</label>
                <input type="text" className="form-control mt-1" style={{ background: 'var(--ccm-ink)', border: '1px solid #1a3a6e', color: '#fff', fontSize: 13 }}
                  value={form.cliente} onChange={e => setForm(f => ({ ...f, cliente: e.target.value }))} placeholder="Nome do cliente" />
              </div>
              <div className="col-12 col-md-6">
                <label style={{ color: '#9BA4AB', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.14em' }}>Ticket *</label>
                <input type="text" className="form-control mt-1" style={{ background: 'var(--ccm-ink)', border: '1px solid #1a3a6e', color: '#fff', fontSize: 13 }}
                  value={form.ticket} onChange={e => setForm(f => ({ ...f, ticket: e.target.value }))} placeholder="Nº do ticket" />
              </div>
              <div className="col-12">
                <label style={{ color: '#9BA4AB', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.14em' }}>Descritivo *</label>
                <textarea className="form-control mt-1" rows={3} style={{ background: 'var(--ccm-ink)', border: '1px solid #1a3a6e', color: '#fff', fontSize: 13, resize: 'vertical' }}
                  value={form.descritivo} onChange={e => setForm(f => ({ ...f, descritivo: e.target.value }))} placeholder="Descreva a pendência ou impedimento..." />
              </div>
              <div className="col-12 col-md-6">
                <label style={{ color: '#9BA4AB', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.14em' }}>Status *</label>
                <select className="form-select mt-1" style={{ background: 'var(--ccm-ink)', border: '1px solid #1a3a6e', color: '#fff', fontSize: 13 }}
                  value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                  {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
              <div className="col-12 col-md-6">
                <label style={{ color: '#9BA4AB', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.14em' }}>Data *</label>
                <input type="date" className="form-control mt-1" style={{ background: 'var(--ccm-ink)', border: '1px solid #1a3a6e', color: '#fff', fontSize: 13 }}
                  value={form.data} onChange={e => setForm(f => ({ ...f, data: e.target.value }))} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 24 }}>
              <button className="btn btn-sm" style={{ background: 'rgba(255,255,255,.07)', color: '#9BA4AB', fontSize: 12, padding: '8px 20px' }} onClick={() => setShowModal(false)}>
                Cancelar
              </button>
              <button className="btn btn-sm" style={{ background: '#F9E000', color: '#5a4000', fontSize: 12, padding: '8px 24px', fontWeight: 700 }} onClick={handleSave} disabled={saving}>
                {saving ? <><span className="spinner-border spinner-border-sm me-1" />Salvando…</> : <><i className="bi bi-check-lg me-1" />{editItem ? 'Salvar Alterações' : 'Registrar'}</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
