import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { http } from '../../lib/http-client';

interface Resultado {
  cod: number;
  resultado: string;
  link: string | null;
  data_cadastro: string | null;
  status: string;
}

const emptyForm = { resultado: '', link: '', status: 'Ativo' };
const inputStyle = { background: 'var(--ccm-ink)', border: '1px solid #1a3a6e', color: '#fff', fontSize: 13 };
const labelStyle = { color: '#9BA4AB', fontSize: 10, fontWeight: 700 as const, textTransform: 'uppercase' as const, letterSpacing: '.14em' };

function fmtDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function ResultadosPage({ onBack }: { onBack: () => void }) {
  const [items, setItems]         = useState<Resultado[]>([]);
  const [loading, setLoading]     = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editCod, setEditCod]     = useState<number | null>(null);
  const [form, setForm]           = useState(emptyForm);
  const [saving, setSaving]       = useState(false);
  const [filterStatus, setFilterStatus] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await http.get<Resultado[]>('/api/gestao/resultados');
      setItems(data);
    } catch { toast.error('Erro ao carregar resultados'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const openCreate = () => { setEditCod(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = (r: Resultado) => {
    setEditCod(r.cod);
    setForm({ resultado: r.resultado, link: r.link ?? '', status: r.status });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.resultado) { toast.error('Resultado é obrigatório'); return; }
    setSaving(true);
    try {
      if (editCod !== null) {
        await http.put(`/api/gestao/resultados/${editCod}`, form);
        toast.success('Resultado atualizado!');
      } else {
        await http.post('/api/gestao/resultados', form);
        toast.success('Resultado cadastrado!');
      }
      setShowModal(false);
      fetchData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar');
    } finally { setSaving(false); }
  };

  const handleDelete = async (cod: number) => {
    if (!confirm('Deseja excluir este resultado?')) return;
    try {
      await http.del(`/api/gestao/resultados/${cod}`);
      toast.success('Resultado excluído');
      fetchData();
    } catch { toast.error('Erro ao excluir'); }
  };

  const filtered = items.filter(i => filterStatus ? i.status === filterStatus : true);
  const th = { color: '#fff', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '.05em', padding: '10px 14px', textAlign: 'left' as const, fontSize: 10, whiteSpace: 'nowrap' as const };
  const td = { padding: '10px 14px', fontSize: 13 };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--ccm-blue)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em' }}>
          <i className="bi bi-arrow-left me-1" />Gestão
        </button>
        <span style={{ color: 'var(--ccm-gray-medium)', fontSize: 12 }}>/</span>
        <span style={{ color: 'var(--ccm-gray-dark)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em' }}>Resultados</span>
      </div>
      <div className="section-title mb-4" style={{ textAlign: 'center' }}>Resultados</div>

      <div className="table-card">
        <div style={{ background: 'var(--ccm-ink)', padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: '6px 6px 0 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <i className="bi bi-bar-chart-fill" style={{ color: '#1DB954', fontSize: 16 }} />
            <span style={{ color: '#fff', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.12em' }}>
              {loading ? 'Carregando...' : `${filtered.length} resultado(s)`}
            </span>
          </div>
          <button className="btn btn-ccm-primary btn-sm" onClick={openCreate}>
            <i className="bi bi-plus-lg me-1" />Novo Resultado
          </button>
        </div>

        <div style={{ padding: '10px 20px', borderBottom: '1px solid var(--ccm-line)' }}>
          <select className="form-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            style={{ maxWidth: 180, fontSize: 13 }}>
            <option value="">Todos</option>
            <option value="Ativo">Ativo</option>
            <option value="Inativo">Inativo</option>
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
                  <th style={th}>Resultado</th>
                  <th style={th}>Link</th>
                  <th style={th}>Data Cadastro</th>
                  <th style={{ ...th, textAlign: 'center' }}>Status</th>
                  <th style={{ ...th, textAlign: 'center' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={5} style={{ padding: 32, textAlign: 'center', color: 'var(--ccm-gray-dark)' }}>Nenhum resultado encontrado</td></tr>
                ) : filtered.map((r, i) => (
                  <tr key={r.cod} style={{ background: i % 2 === 0 ? '#fff' : '#F7F8FA', borderBottom: '1px solid var(--ccm-line)' }}>
                    <td style={{ ...td, fontWeight: 600, color: 'var(--ccm-ink)' }}>{r.resultado}</td>
                    <td style={td}>
                      {r.link ? (
                        <a href={r.link} target="_blank" rel="noopener noreferrer"
                          style={{ color: '#1DB954', fontSize: 12, textDecoration: 'none' }}>
                          <i className="bi bi-box-arrow-up-right me-1" />Abrir
                        </a>
                      ) : <span style={{ color: 'var(--ccm-gray-medium)', fontSize: 12 }}>—</span>}
                    </td>
                    <td style={{ ...td, color: 'var(--ccm-gray-dark)', fontSize: 12 }}>{fmtDate(r.data_cadastro)}</td>
                    <td style={{ ...td, textAlign: 'center' }}>
                      <span style={{ background: r.status === 'Ativo' ? '#D4F5E2' : '#FDDEDE', color: r.status === 'Ativo' ? '#0E7E3B' : '#9B2020', borderRadius: 99, padding: '2px 10px', fontSize: 11, fontWeight: 700 }}>
                        {r.status}
                      </span>
                    </td>
                    <td style={{ ...td, textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: 5, justifyContent: 'center' }}>
                        <button className="btn btn-sm" style={{ background: 'var(--ccm-blue)', color: '#fff', fontSize: 10, padding: '3px 9px' }} onClick={() => openEdit(r)}>
                          <i className="bi bi-pencil-fill me-1" />Editar
                        </button>
                        <button className="btn btn-sm" style={{ background: '#E74C3C', color: '#fff', fontSize: 10, padding: '3px 9px' }} onClick={() => handleDelete(r.cod)}>
                          <i className="bi bi-trash me-1" />Excluir
                        </button>
                      </div>
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
          <div style={{ background: '#132230', border: '1px solid #1a3a6e', borderTop: '3px solid #1DB954', borderRadius: 8, padding: '28px 32px', width: '100%', maxWidth: 460, boxShadow: '0 8px 32px rgba(0,0,0,.4)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <div style={{ color: '#1DB954', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.18em' }}>Gestão — Resultados</div>
                <div style={{ color: '#fff', fontWeight: 900, fontSize: 15, textTransform: 'uppercase' }}>{editCod !== null ? 'Editar Resultado' : 'Novo Resultado'}</div>
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: 'transparent', border: 'none', color: '#9BA4AB', fontSize: 22, cursor: 'pointer' }}>×</button>
            </div>

            <div className="mb-3">
              <label style={labelStyle}>Resultado *</label>
              <input type="text" className="form-control mt-1" style={inputStyle}
                value={form.resultado} onChange={e => setForm(f => ({ ...f, resultado: e.target.value }))}
                placeholder="Ex: Q1 2026 — Resultado da equipe" />
            </div>
            <div className="mb-3">
              <label style={labelStyle}>Link</label>
              <input type="url" className="form-control mt-1" style={inputStyle}
                value={form.link} onChange={e => setForm(f => ({ ...f, link: e.target.value }))}
                placeholder="https://..." />
            </div>
            <div className="mb-4">
              <label style={labelStyle}>Status</label>
              <select className="form-select mt-1" style={inputStyle}
                value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                <option value="Ativo">Ativo</option>
                <option value="Inativo">Inativo</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-sm" style={{ background: 'rgba(255,255,255,.07)', color: '#9BA4AB', fontSize: 12, padding: '8px 20px' }} onClick={() => setShowModal(false)}>
                Cancelar
              </button>
              <button className="btn btn-sm" style={{ background: '#1DB954', color: '#fff', fontSize: 12, padding: '8px 24px', fontWeight: 700 }} onClick={handleSave} disabled={saving}>
                {saving ? <><span className="spinner-border spinner-border-sm me-1" />Salvando…</> : <><i className="bi bi-check-lg me-1" />{editCod !== null ? 'Salvar' : 'Cadastrar'}</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
