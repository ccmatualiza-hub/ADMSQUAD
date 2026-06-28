import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { http } from '../../lib/http-client';

interface LinkItem {
  cod: number;
  acesso: string | null;
  grupo: string | null;
  link: string | null;
}

const emptyForm = { acesso: '', grupo: '', link: '' };
const inputStyle = { background: 'var(--ccm-ink)', border: '1px solid #1a3a6e', color: '#fff', fontSize: 13 };
const labelStyle = { color: '#9BA4AB', fontSize: 10, fontWeight: 700 as const, textTransform: 'uppercase' as const, letterSpacing: '.14em' };

export default function LinksUteisPage({ onBack }: { onBack: () => void }) {
  const [links, setLinks]         = useState<LinkItem[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editCod, setEditCod]     = useState<number | null>(null);
  const [form, setForm]           = useState(emptyForm);
  const [saving, setSaving]       = useState(false);

  const fetchData = async (q = '') => {
    setLoading(true);
    try {
      const params = q ? `?q=${encodeURIComponent(q)}` : '';
      const data = await http.get<LinkItem[]>(`/api/gestao/links${params}`);
      setLinks(data);
    } catch { toast.error('Erro ao carregar links'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const openCreate = () => { setEditCod(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = (l: LinkItem) => {
    setEditCod(l.cod);
    setForm({ acesso: l.acesso ?? '', grupo: l.grupo ?? '', link: l.link ?? '' });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.acesso || !form.link) { toast.error('Nome e Link são obrigatórios'); return; }
    setSaving(true);
    try {
      if (editCod !== null) {
        await http.put(`/api/gestao/links/${editCod}`, form);
        toast.success('Link atualizado!');
      } else {
        await http.post('/api/gestao/links', form);
        toast.success('Link cadastrado!');
      }
      setShowModal(false);
      fetchData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar');
    } finally { setSaving(false); }
  };

  const handleDelete = async (cod: number) => {
    if (!confirm('Deseja excluir este link?')) return;
    try {
      await http.del(`/api/gestao/links/${cod}`);
      toast.success('Link excluído');
      fetchData();
    } catch { toast.error('Erro ao excluir'); }
  };

  // Group by grupo
  const filtered = links.filter(l =>
    [l.acesso, l.grupo, l.link].some(v => (v ?? '').toLowerCase().includes(search.toLowerCase()))
  );
  const grupos = Array.from(new Set(filtered.map(l => l.grupo || 'Outros'))).sort();

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--ccm-blue)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em' }}>
          <i className="bi bi-arrow-left me-1" />Gestão
        </button>
        <span style={{ color: 'var(--ccm-gray-medium)', fontSize: 12 }}>/</span>
        <span style={{ color: 'var(--ccm-gray-dark)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em' }}>Links Úteis</span>
      </div>
      <div className="section-title mb-4" style={{ textAlign: 'center' }}>Links Úteis</div>

      {/* Header card */}
      <div className="table-card">
        <div style={{ background: 'var(--ccm-ink)', padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: '6px 6px 0 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <i className="bi bi-link-45deg" style={{ color: '#7F77DD', fontSize: 18 }} />
            <span style={{ color: '#fff', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.12em' }}>
              {loading ? 'Carregando...' : `${filtered.length} links`}
            </span>
          </div>
          <button className="btn btn-ccm-primary btn-sm" onClick={openCreate}>
            <i className="bi bi-plus-lg me-1" />Novo Acesso
          </button>
        </div>

        <div style={{ padding: '10px 20px', borderBottom: '1px solid var(--ccm-line)' }}>
          <input type="text" className="form-control" placeholder="Buscar por nome, grupo ou link..."
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ maxWidth: 360, fontSize: 13 }} />
        </div>

        <div style={{ padding: '16px 20px' }}>
          {loading ? (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--ccm-gray-dark)' }}>
              <span className="spinner-border spinner-border-sm me-2" />Carregando...
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--ccm-gray-dark)' }}>Nenhum link encontrado</div>
          ) : (
            grupos.map(grupo => {
              const grupoLinks = filtered.filter(l => (l.grupo || 'Outros') === grupo);
              return (
                <div key={grupo} style={{ marginBottom: 24 }}>
                  {/* Grupo header */}
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.15em', color: '#7F77DD', borderBottom: '2px solid #7F77DD', paddingBottom: 6, marginBottom: 12 }}>
                    <i className="bi bi-folder2 me-2" />{grupo}
                  </div>

                  {/* Links grid */}
                  <div className="row g-2">
                    {grupoLinks.map(l => (
                      <div key={l.cod} className="col-12 col-md-6 col-lg-4">
                        <div style={{ background: '#F7F8FA', border: '1px solid var(--ccm-line)', borderRadius: 6, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--ccm-ink)', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.acesso || '—'}</div>
                            <a href={l.link ?? '#'} target="_blank" rel="noopener noreferrer"
                              style={{ fontSize: 11, color: '#7F77DD', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block', textDecoration: 'none' }}
                              onClick={e => e.stopPropagation()}>
                              <i className="bi bi-box-arrow-up-right me-1" />
                              {l.link || '—'}
                            </a>
                          </div>
                          <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                            <button className="btn btn-sm" style={{ background: 'var(--ccm-blue)', color: '#fff', fontSize: 10, padding: '3px 8px' }} onClick={() => openEdit(l)}>
                              <i className="bi bi-pencil-fill" />
                            </button>
                            <button className="btn btn-sm" style={{ background: '#E74C3C', color: '#fff', fontSize: 10, padding: '3px 8px' }} onClick={() => handleDelete(l.cod)}>
                              <i className="bi bi-trash" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 16 }}>
          <div style={{ background: '#132230', border: '1px solid #1a3a6e', borderTop: '3px solid #7F77DD', borderRadius: 8, padding: '28px 32px', width: '100%', maxWidth: 460, boxShadow: '0 8px 32px rgba(0,0,0,.4)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <div style={{ color: '#7F77DD', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.18em' }}>Gestão — Links</div>
                <div style={{ color: '#fff', fontWeight: 900, fontSize: 15, textTransform: 'uppercase' }}>{editCod !== null ? 'Editar Link' : 'Novo Acesso'}</div>
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: 'transparent', border: 'none', color: '#9BA4AB', fontSize: 22, cursor: 'pointer' }}>×</button>
            </div>

            <div className="mb-3">
              <label style={labelStyle}>Nome do Acesso *</label>
              <input type="text" className="form-control mt-1" style={inputStyle}
                value={form.acesso} onChange={e => setForm(f => ({ ...f, acesso: e.target.value }))} placeholder="Ex: Portal CCM, Jira, Slack..." />
            </div>
            <div className="mb-3">
              <label style={labelStyle}>Grupo</label>
              <input type="text" className="form-control mt-1" style={inputStyle}
                value={form.grupo} onChange={e => setForm(f => ({ ...f, grupo: e.target.value }))} placeholder="Ex: Sistemas, Comunicação, Gestão..." />
            </div>
            <div className="mb-4">
              <label style={labelStyle}>Link / URL *</label>
              <input type="url" className="form-control mt-1" style={inputStyle}
                value={form.link} onChange={e => setForm(f => ({ ...f, link: e.target.value }))} placeholder="https://..." />
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-sm" style={{ background: 'rgba(255,255,255,.07)', color: '#9BA4AB', fontSize: 12, padding: '8px 20px' }} onClick={() => setShowModal(false)}>
                Cancelar
              </button>
              <button className="btn btn-sm" style={{ background: '#7F77DD', color: '#fff', fontSize: 12, padding: '8px 24px', fontWeight: 700 }} onClick={handleSave} disabled={saving}>
                {saving ? <><span className="spinner-border spinner-border-sm me-1" />Salvando…</> : <><i className="bi bi-check-lg me-1" />{editCod !== null ? 'Salvar' : 'Cadastrar'}</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
