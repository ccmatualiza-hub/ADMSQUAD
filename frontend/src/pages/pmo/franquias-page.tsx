import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { http } from '../../lib/http-client';

interface Franquia {
  cod: number;
  nome: string | null;
  contato: string | null;
  celular: string | null;
  email: string | null;
  cidade: string | null;
  modelo: string | null;
  status: string | null;
}

const emptyForm = {
  nome: '', contato: '', celular: '', email: '',
  cidade: '', modelo: 'LINXDMS', status: 'ATIVO',
};

const UF_OPTS = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];
const inputStyle = { background: 'var(--ccm-ink)', border: '1px solid #1a3a6e', color: '#fff', fontSize: 13 };
const labelStyle = { color: '#9BA4AB', fontSize: 10, fontWeight: 700 as const, textTransform: 'uppercase' as const, letterSpacing: '.14em' };

export default function FranquiasPage({ onBack }: { onBack: () => void }) {
  const [franquias, setFranquias] = useState<Franquia[]>([]);
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
      const data = await http.get<Franquia[]>(`/api/pmo/franquias${params}`);
      setFranquias(data);
    } catch { toast.error('Erro ao carregar franquias'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const openCreate = () => { setEditCod(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = (f: Franquia) => {
    setEditCod(f.cod);
    setForm({
      nome: f.nome ?? '', contato: f.contato ?? '',
      celular: f.celular ?? '', email: f.email ?? '',
      cidade: f.cidade ?? '', modelo: f.modelo ?? 'LINXDMS',
      status: f.status ?? 'ATIVO',
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.nome) { toast.error('Nome é obrigatório'); return; }
    setSaving(true);
    try {
      if (editCod !== null) {
        await http.put(`/api/pmo/franquias/${editCod}`, form);
        toast.success('Franquia atualizada!');
      } else {
        await http.post('/api/pmo/franquias', form);
        toast.success('Franquia cadastrada!');
      }
      setShowModal(false);
      fetchData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar');
    } finally { setSaving(false); }
  };

  const th = { color: '#fff', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '.05em', padding: '10px 12px', textAlign: 'left' as const, fontSize: 10, whiteSpace: 'nowrap' as const };
  const td = { padding: '9px 12px', fontSize: 12, whiteSpace: 'nowrap' as const };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--ccm-blue)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em' }}>
          <i className="bi bi-arrow-left me-1" />PMO
        </button>
        <span style={{ color: 'var(--ccm-gray-medium)', fontSize: 12 }}>/</span>
        <span style={{ color: 'var(--ccm-gray-dark)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em' }}>Franquias Linx</span>
      </div>
      <div className="section-title mb-4" style={{ textAlign: 'center' }}>Franquias Linx</div>

      <div className="table-card">
        <div style={{ background: 'var(--ccm-ink)', padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: '6px 6px 0 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <i className="bi bi-shop" style={{ color: '#00B0FA', fontSize: 16 }} />
            <span style={{ color: '#fff', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.12em' }}>
              {loading ? 'Carregando...' : `${franquias.length} franquias`}
            </span>
          </div>
          <button className="btn btn-ccm-primary btn-sm" onClick={openCreate}>
            <i className="bi bi-plus-lg me-1" />Nova Franquia
          </button>
        </div>

        <div style={{ padding: '10px 20px', borderBottom: '1px solid var(--ccm-line)', display: 'flex', gap: 10 }}>
          <input type="text" className="form-control" placeholder="Buscar nome, contato ou cidade..."
            value={search} onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && fetchData(search)}
            style={{ maxWidth: 360, fontSize: 13 }} />
          <button className="btn btn-ccm-primary btn-sm" onClick={() => fetchData(search)}>
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
                  <th style={th}>Nome</th>
                  <th style={th}>Contato</th>
                  <th style={th}>Celular</th>
                  <th style={th}>E-mail</th>
                  <th style={th}>Modelo</th>
                  <th style={th}>Cidade / UF</th>
                  <th style={{ ...th, textAlign: 'center' }}>Status</th>
                  <th style={{ ...th, textAlign: 'center' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {franquias.length === 0 ? (
                  <tr><td colSpan={8} style={{ padding: 32, textAlign: 'center', color: 'var(--ccm-gray-dark)' }}>Nenhuma franquia encontrada</td></tr>
                ) : franquias.map((f, i) => (
                  <tr key={f.cod} style={{ background: i % 2 === 0 ? '#fff' : '#F7F8FA', borderBottom: '1px solid var(--ccm-line)' }}>
                    <td style={{ ...td, fontWeight: 600, color: 'var(--ccm-ink)' }}>{f.nome || '—'}</td>
                    <td style={td}>{f.contato || '—'}</td>
                    <td style={td}>{f.celular || '—'}</td>
                    <td style={{ ...td, color: 'var(--ccm-blue)' }}>{f.email || '—'}</td>
                    <td style={td}>
                      <span style={{ background: f.modelo === 'AUTOSHOP' ? '#E8EDF7' : '#E8F7FF', color: f.modelo === 'AUTOSHOP' ? '#204294' : '#007BB5', borderRadius: 99, padding: '2px 9px', fontSize: 10, fontWeight: 700 }}>
                        {f.modelo || '—'}
                      </span>
                    </td>
                    <td style={td}>{f.cidade || '—'}</td>
                    <td style={{ ...td, textAlign: 'center' }}>
                      <span style={{ background: f.status === 'ATIVO' ? '#D4F5E2' : '#FDDEDE', color: f.status === 'ATIVO' ? '#0E7E3B' : '#9B2020', borderRadius: 99, padding: '2px 9px', fontSize: 10, fontWeight: 700 }}>
                        {f.status || '—'}
                      </span>
                    </td>
                    <td style={{ ...td, textAlign: 'center' }}>
                      <button className="btn btn-sm" style={{ background: 'var(--ccm-blue)', color: '#fff', fontSize: 10, padding: '3px 10px' }} onClick={() => openEdit(f)}>
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
          <div style={{ background: '#132230', border: '1px solid #1a3a6e', borderTop: '3px solid #00B0FA', borderRadius: 8, padding: '28px 32px', width: '100%', maxWidth: 560, boxShadow: '0 8px 32px rgba(0,0,0,.4)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <div style={{ color: '#00B0FA', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.18em' }}>PMO — Franquias</div>
                <div style={{ color: '#fff', fontWeight: 900, fontSize: 15, textTransform: 'uppercase' }}>
                  {editCod !== null ? 'Editar Franquia' : 'Nova Franquia'}
                </div>
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: 'transparent', border: 'none', color: '#9BA4AB', fontSize: 22, cursor: 'pointer' }}>×</button>
            </div>

            <div className="row g-3">
              <div className="col-12">
                <label style={labelStyle}>Nome da Franquia *</label>
                <input type="text" className="form-control mt-1" style={inputStyle}
                  value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} placeholder="Nome da franquia" />
              </div>
              <div className="col-12 col-md-6">
                <label style={labelStyle}>Contato</label>
                <input type="text" className="form-control mt-1" style={inputStyle}
                  value={form.contato} onChange={e => setForm(f => ({ ...f, contato: e.target.value }))} placeholder="Nome do responsável" />
              </div>
              <div className="col-12 col-md-6">
                <label style={labelStyle}>Celular</label>
                <input type="text" className="form-control mt-1" style={inputStyle}
                  value={form.celular} onChange={e => setForm(f => ({ ...f, celular: e.target.value }))} placeholder="(00) 00000-0000" />
              </div>
              <div className="col-12">
                <label style={labelStyle}>E-mail</label>
                <input type="email" className="form-control mt-1" style={inputStyle}
                  value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@franquia.com.br" />
              </div>
              <div className="col-12 col-md-8">
                <label style={labelStyle}>Cidade</label>
                <input type="text" className="form-control mt-1" style={inputStyle}
                  value={form.cidade} onChange={e => setForm(f => ({ ...f, cidade: e.target.value }))} placeholder="Nome da cidade" />
              </div>
              <div className="col-12 col-md-4">
                <label style={labelStyle}>Modelo</label>
                <select className="form-select mt-1" style={inputStyle}
                  value={form.modelo} onChange={e => setForm(f => ({ ...f, modelo: e.target.value }))}>
                  <option value="LINXDMS">LINXDMS</option>
                  <option value="AUTOSHOP">AUTOSHOP</option>
                </select>
              </div>
              <div className="col-12 col-md-4">
                <label style={labelStyle}>Status</label>
                <select className="form-select mt-1" style={inputStyle}
                  value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                  <option value="ATIVO">ATIVO</option>
                  <option value="INATIVO">INATIVO</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
              <button className="btn btn-sm" style={{ background: 'rgba(255,255,255,.07)', color: '#9BA4AB', fontSize: 12, padding: '8px 20px' }} onClick={() => setShowModal(false)}>
                Cancelar
              </button>
              <button className="btn btn-ccm-primary" style={{ fontSize: 12, padding: '8px 24px' }} onClick={handleSave} disabled={saving}>
                {saving ? <><span className="spinner-border spinner-border-sm me-1" />Salvando…</> : <><i className="bi bi-check-lg me-1" />{editCod !== null ? 'Salvar Alterações' : 'Cadastrar Franquia'}</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
