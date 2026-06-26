import { useEffect, useState } from 'react';
import { http } from '../../lib/http-client';

interface Cliente {
  cod: number; razao: string | null; cliente: string | null;
  sistema: string | null; versao: string | null;
  qtdusers: number | null; serverbd: string | null; status: string | null;
}

interface ClienteDetalhe {
  cod: number; razao: string | null; cliente: string | null; bandeira: string | null;
  sistema: string | null; versao: string | null; bd: string | null; serverbd: string | null;
  qtdusers: number | null; qtdsistemas: number | null; qtdsrv: string | null; status: string | null;
  contatos: string | null; telefones: string | null; emails: string | null; reg: string | null;
  local: string | null; grupo: string | null; tipo: string | null; pacote: string | null;
  dt_atualiza: string | null; versaoat: string | null; franq: string | null; ufmatriz: string | null;
  integracoes: string | null; infraprod: string | null; infrats: string | null; shape: string | null;
  ocpu: string | null; mem: string | null; tsplus: string | null; detalhes: string | null;
  implat: string | null; datastart: string | null; prxcontat: string | null; cnpj: string | null;
  agtazure: string | null; linxwebver: string | null;
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

function Field({ label, value }: { label: string; value: string | number | null | undefined }) {
  if (!value && value !== 0) return null;
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.12em', color: 'var(--ccm-gray-dark)', marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 13, color: 'var(--ccm-ink)', wordBreak: 'break-word' }}>{String(value)}</div>
    </div>
  );
}

export default function ClientesListPage({ onBack }: { onBack: () => void }) {
  const [clientes, setClientes]       = useState<Cliente[]>([]);
  const [statusOpts, setStatusOpts]   = useState<string[]>([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [detalhe, setDetalhe]         = useState<ClienteDetalhe | null>(null);
  const [loadingDet, setLoadingDet]   = useState(false);

  const fetchClientes = async (q = '', s = '') => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.set('q', q);
      if (s) params.set('status_filter', s);
      const data = await http.get<Cliente[]>(`/api/cx/clientes?${params}`);
      setClientes(data);
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchClientes();
    http.get<string[]>('/api/cx/clientes/status-options').then(setStatusOpts).catch(() => {});
  }, []);

  const handleSearch = () => fetchClientes(search, filterStatus);
  const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === 'Enter') handleSearch(); };

  const openDetalhe = async (cod: number) => {
    setLoadingDet(true);
    try {
      const d = await http.get<ClienteDetalhe>(`/api/cx/clientes/${cod}`);
      setDetalhe(d);
    } catch { /* silent */ }
    finally { setLoadingDet(false); }
  };

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
        <span style={{ color: 'var(--ccm-gray-dark)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em' }}>Clientes</span>
      </div>
      <div className="section-title mb-4" style={{ textAlign: 'center' }}>Clientes Parceria Linx</div>

      <div className="table-card">
        {/* Header */}
        <div style={{ background: 'var(--ccm-ink)', padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: '6px 6px 0 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <i className="bi bi-people-fill" style={{ color: '#00B0FA', fontSize: 16 }} />
            <span style={{ color: '#fff', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.12em' }}>
              {loading ? 'Carregando...' : `${clientes.length} clientes`}
            </span>
          </div>
        </div>

        {/* Filtros */}
        <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--ccm-line)', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <input type="text" className="form-control" placeholder="Buscar por razão, cliente ou sistema..."
            value={search} onChange={e => setSearch(e.target.value)} onKeyDown={handleKeyDown}
            style={{ maxWidth: 340, fontSize: 13 }} />
          <select className="form-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            style={{ maxWidth: 220, fontSize: 13 }}>
            <option value="">Todos os status</option>
            {statusOpts.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <button className="btn btn-ccm-primary btn-sm" onClick={handleSearch} style={{ padding: '7px 18px' }}>
            <i className="bi bi-search me-1" />Buscar
          </button>
        </div>

        {/* Tabela */}
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
                  <th style={{ ...th, textAlign: 'center' }}>Detalhe</th>
                </tr>
              </thead>
              <tbody>
                {clientes.length === 0 ? (
                  <tr><td colSpan={8} style={{ padding: 32, textAlign: 'center', color: 'var(--ccm-gray-dark)' }}>Nenhum cliente encontrado</td></tr>
                ) : clientes.map((c, i) => (
                  <tr key={c.cod} style={{ background: i % 2 === 0 ? '#fff' : '#F7F8FA', borderBottom: '1px solid var(--ccm-line)' }}>
                    <td style={{ ...td, fontWeight: 600, color: 'var(--ccm-ink)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.razao || '—'}</td>
                    <td style={{ ...td, color: 'var(--ccm-gray-dark)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.cliente || '—'}</td>
                    <td style={{ ...td, color: 'var(--ccm-blue)', fontWeight: 600 }}>{c.sistema || '—'}</td>
                    <td style={td}>{c.versao || '—'}</td>
                    <td style={{ ...td, textAlign: 'center', fontWeight: 600 }}>{c.qtdusers ?? '—'}</td>
                    <td style={td}>{c.serverbd || '—'}</td>
                    <td style={td}>{statusBadge(c.status)}</td>
                    <td style={{ ...td, textAlign: 'center' }}>
                      <button className="btn btn-sm" style={{ background: '#00B0FA', color: '#fff', fontSize: 10, padding: '3px 10px' }}
                        onClick={() => openDetalhe(c.cod)}>
                        <i className="bi bi-eye me-1" />Ver
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal Detalhe */}
      {(detalhe || loadingDet) && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 8, borderTop: '3px solid #00B0FA', width: '100%', maxWidth: 700, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 8px 32px rgba(0,0,0,.3)' }}>
            {loadingDet ? (
              <div style={{ padding: 48, textAlign: 'center', color: 'var(--ccm-gray-dark)' }}>
                <span className="spinner-border spinner-border-sm me-2" />Carregando detalhes...
              </div>
            ) : detalhe && (
              <>
                {/* Header do modal */}
                <div style={{ background: 'var(--ccm-ink)', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: '6px 6px 0 0' }}>
                  <div>
                    <div style={{ color: '#00B0FA', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.18em' }}>CX — Detalhe do Cliente</div>
                    <div style={{ color: '#fff', fontWeight: 900, fontSize: 15 }}>{detalhe.razao || detalhe.cliente}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {statusBadge(detalhe.status)}
                    <button onClick={() => setDetalhe(null)} style={{ background: 'transparent', border: 'none', color: '#9BA4AB', fontSize: 22, cursor: 'pointer' }}>×</button>
                  </div>
                </div>

                {/* Conteúdo */}
                <div style={{ padding: '20px 24px' }}>
                  {/* Identificação */}
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.15em', color: '#00B0FA', borderBottom: '1px solid var(--ccm-line)', paddingBottom: 6, marginBottom: 14 }}>Identificação</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0 24px' }}>
                    <Field label="Razão Social" value={detalhe.razao} />
                    <Field label="Cliente (Código)" value={detalhe.cliente} />
                    <Field label="Bandeira" value={detalhe.bandeira} />
                    <Field label="CNPJ" value={detalhe.cnpj} />
                    <Field label="Grupo" value={detalhe.grupo} />
                    <Field label="UF Matriz" value={detalhe.ufmatriz} />
                    <Field label="Franquia" value={detalhe.franq} />
                    <Field label="Região" value={detalhe.reg} />
                    <Field label="Local" value={detalhe.local} />
                    <Field label="Data Start" value={detalhe.datastart} />
                  </div>

                  {/* Sistema */}
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.15em', color: '#00B0FA', borderBottom: '1px solid var(--ccm-line)', paddingBottom: 6, marginBottom: 14, marginTop: 8 }}>Sistema</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0 24px' }}>
                    <Field label="Sistema" value={detalhe.sistema} />
                    <Field label="Versão" value={detalhe.versao} />
                    <Field label="Versão Atual" value={detalhe.versaoat} />
                    <Field label="Pacote" value={detalhe.pacote} />
                    <Field label="Tipo" value={detalhe.tipo} />
                    <Field label="Qtd. Users" value={detalhe.qtdusers} />
                    <Field label="Qtd. Sistemas" value={detalhe.qtdsistemas} />
                    <Field label="Linx Web Ver." value={detalhe.linxwebver} />
                    <Field label="Últ. Atualização" value={detalhe.dt_atualiza} />
                  </div>

                  {/* Infraestrutura */}
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.15em', color: '#00B0FA', borderBottom: '1px solid var(--ccm-line)', paddingBottom: 6, marginBottom: 14, marginTop: 8 }}>Infraestrutura</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0 24px' }}>
                    <Field label="BD" value={detalhe.bd} />
                    <Field label="Server BD" value={detalhe.serverbd} />
                    <Field label="Qtd. Servidores" value={detalhe.qtdsrv} />
                    <Field label="Shape" value={detalhe.shape} />
                    <Field label="oCPU" value={detalhe.ocpu} />
                    <Field label="Memória" value={detalhe.mem} />
                    <Field label="TSPlus" value={detalhe.tsplus} />
                    <Field label="Azure Agent" value={detalhe.agtazure} />
                    <Field label="Infra Prod" value={detalhe.infraprod} />
                    <Field label="Infra TS" value={detalhe.infrats} />
                    <Field label="Integrações" value={detalhe.integracoes} />
                  </div>

                  {/* Contato */}
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.15em', color: '#00B0FA', borderBottom: '1px solid var(--ccm-line)', paddingBottom: 6, marginBottom: 14, marginTop: 8 }}>Contato</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0 24px' }}>
                    <Field label="Contatos" value={detalhe.contatos} />
                    <Field label="Telefones" value={detalhe.telefones} />
                    <Field label="Emails" value={detalhe.emails} />
                    <Field label="Próx. Contato" value={detalhe.prxcontat} />
                  </div>

                  {/* Implantação */}
                  {(detalhe.implat || detalhe.stimplant) && <>
                    <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.15em', color: '#00B0FA', borderBottom: '1px solid var(--ccm-line)', paddingBottom: 6, marginBottom: 14, marginTop: 8 }}>Implantação</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0 24px' }}>
                      <Field label="Implantador" value={detalhe.implat} />
                    </div>
                  </>}

                  {/* Observações */}
                  {detalhe.detalhes && <>
                    <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.15em', color: '#00B0FA', borderBottom: '1px solid var(--ccm-line)', paddingBottom: 6, marginBottom: 14, marginTop: 8 }}>Observações</div>
                    <div style={{ fontSize: 13, color: 'var(--ccm-ink)', lineHeight: 1.6, background: '#F7F8FA', padding: '10px 14px', borderRadius: 4 }}>{detalhe.detalhes}</div>
                  </>}
                </div>

                <div style={{ padding: '12px 24px', borderTop: '1px solid var(--ccm-line)', textAlign: 'right' }}>
                  <button className="btn btn-sm" style={{ background: 'var(--ccm-blue)', color: '#fff', fontSize: 12, padding: '7px 20px' }} onClick={() => setDetalhe(null)}>
                    Fechar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
