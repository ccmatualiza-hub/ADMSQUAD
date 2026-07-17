import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { http } from '../../lib/http-client';

interface Smartbook {
  cod: number; colaborador: string; trilha: string;
  link: string | null; qtdcursos: number; cursosfeitos: number; concluido: string;
}

const emptyForm = { colaborador: '', trilha: '', link: '', qtdcursos: 0, cursosfeitos: 0, concluido: 'Nao' };
const inputStyle = { background: 'var(--ccm-ink)', border: '1px solid #1a3a6e', color: '#fff', fontSize: 13 };
const labelStyle = { color: '#9BA4AB', fontSize: 10, fontWeight: 700 as const, textTransform: 'uppercase' as const, letterSpacing: '.14em' };

function pct(feitos: number, total: number) {
  if (!total) return 0;
  return Math.round((feitos / total) * 100);
}

export default function SmartbooksPage({ onBack }: { onBack: () => void }) {
  const [items, setItems]         = useState<Smartbook[]>([]);
  const [usuarios, setUsuarios]     = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading]     = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editCod, setEditCod]     = useState<number | null>(null);
  const [form, setForm]           = useState(emptyForm);
  const [saving, setSaving]       = useState(false);
  const [filterConc, setFilterConc] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [data, users] = await Promise.all([
        http.get<Smartbook[]>('/api/gestao/smartbooks'),
        http.get<{ id: number; name: string }[]>('/api/user/by-role'),
      ]);
      setItems(data);
      setUsuarios(users);
    } catch { toast.error('Erro ao carregar smartbooks'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const openCreate = () => { setEditCod(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = (s: Smartbook) => {
    setEditCod(s.cod);
    setForm({ colaborador: s.colaborador, trilha: s.trilha, link: s.link ?? '',
              qtdcursos: s.qtdcursos, cursosfeitos: s.cursosfeitos, concluido: s.concluido });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.colaborador || !form.trilha) { toast.error('Colaborador e Trilha são obrigatórios'); return; }
    setSaving(true);
    try {
      if (editCod !== null) {
        await http.put(`/api/gestao/smartbooks/${editCod}`, form);
        toast.success('Registro atualizado!');
      } else {
        await http.post('/api/gestao/smartbooks', form);
        toast.success('Registro cadastrado!');
      }
      setShowModal(false); fetchData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar');
    } finally { setSaving(false); }
  };

  const handleDelete = async (cod: number) => {
    if (!confirm('Deseja excluir este registro?')) return;
    try { await http.del(`/api/gestao/smartbooks/${cod}`); toast.success('Excluído'); fetchData(); }
    catch { toast.error('Erro ao excluir'); }
  };

  const filtered = items.filter(i => filterConc ? i.concluido === filterConc : true);
  const th = { color: '#fff', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '.05em', padding: '10px 12px', textAlign: 'left' as const, fontSize: 10, whiteSpace: 'nowrap' as const };
  const td = { padding: '9px 12px', fontSize: 12, whiteSpace: 'nowrap' as const };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--ccm-blue)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em' }}>
          <i className="bi bi-arrow-left me-1" />Gestão
        </button>
        <span style={{ color: 'var(--ccm-gray-medium)', fontSize: 12 }}>/</span>
        <span style={{ color: 'var(--ccm-gray-dark)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em' }}>Smartbooks</span>
      </div>
      <div className="section-title mb-4" style={{ textAlign: 'center' }}>Smartbooks</div>

      <div className="table-card">
        <div style={{ background: 'var(--ccm-ink)', padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: '6px 6px 0 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <i className="bi bi-book-fill" style={{ color: '#00B0FA', fontSize: 16 }} />
            <span style={{ color: '#fff', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.12em' }}>
              {loading ? 'Carregando...' : `${filtered.length} registro(s)`}
            </span>
          </div>
          <button className="btn btn-ccm-primary btn-sm" onClick={openCreate}>
            <i className="bi bi-plus-lg me-1" />Novo
          </button>
        </div>

        <div style={{ padding: '10px 20px', borderBottom: '1px solid var(--ccm-line)' }}>
          <select className="form-select" value={filterConc} onChange={e => setFilterConc(e.target.value)} style={{ maxWidth: 180, fontSize: 13 }}>
            <option value="">Todos</option>
            <option value="Sim">Concluído</option>
            <option value="Nao">Em Andamento</option>
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
                  <th style={th}>Colaborador</th>
                  <th style={th}>Trilha</th>
                  <th style={th}>Link</th>
                  <th style={{ ...th, textAlign: 'center' }}>Qtd. Cursos</th>
                  <th style={{ ...th, textAlign: 'center' }}>Feitos</th>
                  <th style={{ ...th, textAlign: 'center' }}>Progresso</th>
                  <th style={{ ...th, textAlign: 'center' }}>Concluído</th>
                  <th style={{ ...th, textAlign: 'center' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={8} style={{ padding: 32, textAlign: 'center', color: 'var(--ccm-gray-dark)' }}>Nenhum registro encontrado</td></tr>
                ) : filtered.map((s, i) => {
                  const p = pct(s.cursosfeitos, s.qtdcursos);
                  return (
                    <tr key={s.cod} style={{ background: i % 2 === 0 ? '#fff' : '#F7F8FA', borderBottom: '1px solid var(--ccm-line)' }}>
                      <td style={{ ...td, fontWeight: 600, color: 'var(--ccm-ink)' }}>{s.colaborador}</td>
                      <td style={td}>{s.trilha}</td>
                      <td style={td}>
                        {s.link ? (
                          <a href={s.link.startsWith('http') ? s.link : `https://${s.link}`} target="_blank" rel="noopener noreferrer"
                            style={{ color: '#00B0FA', fontSize: 12, textDecoration: 'none' }}>
                            <i className="bi bi-box-arrow-up-right me-1" />Abrir
                          </a>
                        ) : <span style={{ color: 'var(--ccm-gray-medium)', fontSize: 12 }}>—</span>}
                      </td>
                      <td style={{ ...td, textAlign: 'center', fontWeight: 600 }}>{s.qtdcursos}</td>
                      <td style={{ ...td, textAlign: 'center', fontWeight: 600 }}>{s.cursosfeitos}</td>
                      <td style={{ ...td, textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                          <div style={{ width: 80, height: 8, background: '#E0E0E0', borderRadius: 99, overflow: 'hidden' }}>
                            <div style={{ width: `${p}%`, height: '100%', background: p === 100 ? '#1DB954' : '#00B0FA', borderRadius: 99, transition: 'width .3s' }} />
                          </div>
                          <span style={{ fontSize: 11, fontWeight: 700, color: p === 100 ? '#0E7E3B' : 'var(--ccm-blue)' }}>{p}%</span>
                        </div>
                      </td>
                      <td style={{ ...td, textAlign: 'center' }}>
                        <span style={{ background: s.concluido === 'Sim' ? '#D4F5E2' : '#FFF8CC', color: s.concluido === 'Sim' ? '#0E7E3B' : '#8A6800', borderRadius: 99, padding: '2px 10px', fontSize: 10, fontWeight: 700 }}>
                          {s.concluido === 'Sim' ? 'Concluído' : 'Em Andamento'}
                        </span>
                      </td>
                      <td style={{ ...td, textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                          <button className="btn btn-sm" style={{ background: 'var(--ccm-blue)', color: '#fff', fontSize: 10, padding: '3px 9px' }} onClick={() => openEdit(s)}>
                            <i className="bi bi-pencil-fill me-1" />Editar
                          </button>
                          <button className="btn btn-sm" style={{ background: '#E74C3C', color: '#fff', fontSize: 10, padding: '3px 9px' }} onClick={() => handleDelete(s.cod)}>
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
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 16 }}>
          <div style={{ background: '#132230', border: '1px solid #1a3a6e', borderTop: '3px solid #00B0FA', borderRadius: 8, padding: '28px 32px', width: '100%', maxWidth: 520, boxShadow: '0 8px 32px rgba(0,0,0,.4)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <div style={{ color: '#00B0FA', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.18em' }}>Gestão — Smartbooks</div>
                <div style={{ color: '#fff', fontWeight: 900, fontSize: 15, textTransform: 'uppercase' }}>{editCod !== null ? 'Editar Registro' : 'Novo Registro'}</div>
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: 'transparent', border: 'none', color: '#9BA4AB', fontSize: 22, cursor: 'pointer' }}>×</button>
            </div>

            <div className="row g-3">
              <div className="col-12">
                <label style={labelStyle}>Colaborador *</label>
                <select className="form-select mt-1" style={inputStyle}
                  value={form.colaborador} onChange={e => setForm(f => ({ ...f, colaborador: e.target.value }))}>
                  <option value="">Selecione...</option>
                  {[...usuarios].sort((a, b) => a.name.localeCompare(b.name)).map(u => (
                    <option key={u.id} value={u.name}>{u.name}</option>
                  ))}
                </select>
              </div>
              <div className="col-12">
                <label style={labelStyle}>Trilha *</label>
                <input type="text" className="form-control mt-1" style={inputStyle}
                  value={form.trilha} onChange={e => setForm(f => ({ ...f, trilha: e.target.value }))} placeholder="Nome da trilha" />
              </div>
              <div className="col-12">
                <label style={labelStyle}>Link</label>
                <input type="url" className="form-control mt-1" style={inputStyle}
                  value={form.link} onChange={e => setForm(f => ({ ...f, link: e.target.value }))} placeholder="https://..." />
              </div>
              <div className="col-12 col-md-6">
                <label style={labelStyle}>Qtd. Cursos</label>
                <input type="number" className="form-control mt-1" style={inputStyle}
                  value={form.qtdcursos} onChange={e => setForm(f => ({ ...f, qtdcursos: Number(e.target.value) }))} placeholder="0" />
              </div>
              <div className="col-12 col-md-6">
                <label style={labelStyle}>Cursos Feitos</label>
                <input type="number" className="form-control mt-1" style={inputStyle}
                  value={form.cursosfeitos} onChange={e => setForm(f => ({ ...f, cursosfeitos: Number(e.target.value) }))} placeholder="0" />
              </div>
              <div className="col-12">
                <label style={labelStyle}>Concluído</label>
                <select className="form-select mt-1" style={inputStyle}
                  value={form.concluido} onChange={e => setForm(f => ({ ...f, concluido: e.target.value }))}>
                  <option value="Nao">Em Andamento</option>
                  <option value="Sim">Concluído</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
              <button className="btn btn-sm" style={{ background: 'rgba(255,255,255,.07)', color: '#9BA4AB', fontSize: 12, padding: '8px 20px' }} onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn btn-ccm-primary" style={{ fontSize: 12, padding: '8px 24px' }} onClick={handleSave} disabled={saving}>
                {saving ? <><span className="spinner-border spinner-border-sm me-1" />Salvando…</> : <><i className="bi bi-check-lg me-1" />{editCod !== null ? 'Salvar' : 'Cadastrar'}</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
