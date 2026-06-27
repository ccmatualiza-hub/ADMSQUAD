import { useState } from 'react';
import ClientesPmoPage from './clientes-pmo-page';

type SubPage = null | 'clientes';

export default function PmoPage() {
  const [subPage, setSubPage] = useState<SubPage>(null);

  if (subPage === 'clientes') return <ClientesPmoPage onBack={() => setSubPage(null)} />;

  return (
    <div>
      <div className="section-eyebrow mb-1">Projetos</div>
      <div className="section-title mb-4">PMO — Implantação</div>

      <div className="row g-3">
        <div className="col-12 col-md-4 col-lg-3">
          <div
            onClick={() => setSubPage('clientes')}
            style={{
              background: '#fff', border: '1px solid var(--ccm-line)',
              borderTop: '3px solid #F9E000', borderRadius: 6,
              padding: '20px 22px', cursor: 'pointer',
              transition: 'box-shadow .15s, transform .15s',
              boxShadow: '0 1px 4px rgba(12,25,33,.07)',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 16px rgba(249,224,0,.25)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 1px 4px rgba(12,25,33,.07)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'; }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
              <div style={{ width: 40, height: 40, borderRadius: 8, background: '#FFF8CC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className="bi bi-building-add" style={{ fontSize: 20, color: '#D4A000' }} />
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ccm-ink)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Novo Cliente</div>
            </div>
            <div style={{ fontSize: 12, color: 'var(--ccm-gray-dark)', lineHeight: 1.5 }}>
              Gerenciar clientes em processo de implantação Linx.
            </div>
            <div style={{ marginTop: 12, fontSize: 11, fontWeight: 700, color: '#D4A000', textTransform: 'uppercase', letterSpacing: '.1em' }}>
              Acessar <i className="bi bi-arrow-right" />
            </div>
          </div>
        </div>

        <div className="col-12 col-md-4 col-lg-3">
          <div style={{ background: '#F7F8FA', border: '1px dashed var(--ccm-line)', borderRadius: 6, padding: '20px 22px', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 120, color: 'var(--ccm-gray-medium)', fontSize: 12, letterSpacing: '.08em' }}>
            <i className="bi bi-plus-circle me-2" />Em breve
          </div>
        </div>
      </div>
    </div>
  );
}
