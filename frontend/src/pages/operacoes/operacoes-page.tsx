import { useState } from 'react';
import DailyPendencias from './daily-pendencias';

type SubPage = null | 'daily';

export default function OperacoesPage() {
  const [subPage, setSubPage] = useState<SubPage>(null);

  if (subPage === 'daily') {
    return <DailyPendencias onBack={() => setSubPage(null)} />;
  }

  return (
    <div>
      <div className="section-eyebrow mb-1">Operações</div>
      <div className="section-title mb-4">Operações</div>

      <div className="row g-3">
        {/* Card Daily Pendências */}
        <div className="col-12 col-md-4 col-lg-3">
          <div
            onClick={() => setSubPage('daily')}
            style={{ background: '#fff', border: '1px solid var(--ccm-line)', borderTop: '3px solid #F9E000', borderRadius: 6, padding: '20px 22px', cursor: 'pointer', transition: 'box-shadow .15s, transform .15s', boxShadow: '0 1px 4px rgba(12,25,33,.07)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 16px rgba(32,66,148,.18)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 1px 4px rgba(12,25,33,.07)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'; }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
              <div style={{ width: 40, height: 40, borderRadius: 8, background: '#FFF8CC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className="bi bi-exclamation-triangle-fill" style={{ fontSize: 20, color: '#D4A000' }} />
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ccm-ink)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Daily — Pendências</div>
            </div>
            <div style={{ fontSize: 12, color: 'var(--ccm-gray-dark)', lineHeight: 1.5 }}>
              Registrar e acompanhar pendências e impedimentos diários da equipe.
            </div>
            <div style={{ marginTop: 12, fontSize: 11, fontWeight: 700, color: '#D4A000', textTransform: 'uppercase', letterSpacing: '.1em' }}>
              Acessar <i className="bi bi-arrow-right" />
            </div>
          </div>
        </div>

        {/* Card API Whatsapp */}
        <div className="col-12 col-md-4 col-lg-3">
          <div
            onClick={() => window.open('https://api.ccmcloud.com.br/app/login', '_blank')}
            style={{ background: '#fff', border: '1px solid var(--ccm-line)', borderTop: '3px solid #25D366', borderRadius: 6, padding: '20px 22px', cursor: 'pointer', transition: 'box-shadow .15s, transform .15s', boxShadow: '0 1px 4px rgba(12,25,33,.07)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 16px rgba(37,211,102,.25)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 1px 4px rgba(12,25,33,.07)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'; }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
              <div style={{ width: 40, height: 40, borderRadius: 8, background: '#E8FBF0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className="bi bi-whatsapp" style={{ fontSize: 20, color: '#25D366' }} />
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ccm-ink)', textTransform: 'uppercase', letterSpacing: '.06em' }}>API — Whatsapp</div>
            </div>
            <div style={{ fontSize: 12, color: 'var(--ccm-gray-dark)', lineHeight: 1.5 }}>
              Acessar o painel da API de Whatsapp CCM Cloud.
            </div>
            <div style={{ marginTop: 12, fontSize: 11, fontWeight: 700, color: '#25D366', textTransform: 'uppercase', letterSpacing: '.1em' }}>
              Abrir <i className="bi bi-box-arrow-up-right ms-1" />
            </div>
          </div>
        </div>

        {/* Placeholder */}
        <div className="col-12 col-md-4 col-lg-3">
          <div style={{ background: '#F7F8FA', border: '1px dashed var(--ccm-line)', borderRadius: 6, padding: '20px 22px', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 120, color: 'var(--ccm-gray-medium)', fontSize: 12, letterSpacing: '.08em' }}>
            <i className="bi bi-plus-circle me-2" />Em breve
          </div>
        </div>
      </div>
    </div>
  );
}
