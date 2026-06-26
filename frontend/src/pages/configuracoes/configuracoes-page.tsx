import { useState } from 'react';
import UsuariosPage from './usuarios-page';

type SubPage = null | 'usuarios';

export default function ConfiguracoesPage() {
  const [subPage, setSubPage] = useState<SubPage>(null);

  if (subPage === 'usuarios') {
    return <UsuariosPage onBack={() => setSubPage(null)} />;
  }

  return (
    <div>
      <div className="section-eyebrow mb-1">Sistema</div>
      <div className="section-title mb-4">Configurações</div>

      <div className="row g-3">
        {/* Card Gestão de Usuários */}
        <div className="col-12 col-md-4 col-lg-3">
          <div
            onClick={() => setSubPage('usuarios')}
            style={{
              background: '#fff',
              border: '1px solid var(--ccm-line)',
              borderTop: '3px solid var(--ccm-blue)',
              borderRadius: 6,
              padding: '20px 22px',
              cursor: 'pointer',
              transition: 'box-shadow .15s, transform .15s',
              boxShadow: '0 1px 4px rgba(12,25,33,.07)',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 16px rgba(32,66,148,.18)';
              (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLDivElement).style.boxShadow = '0 1px 4px rgba(12,25,33,.07)';
              (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
              <div style={{ width: 40, height: 40, borderRadius: 8, background: '#E8EDF7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className="bi bi-people-fill" style={{ fontSize: 20, color: 'var(--ccm-blue)' }} />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ccm-ink)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Gestão de Usuários</div>
              </div>
            </div>
            <div style={{ fontSize: 12, color: 'var(--ccm-gray-dark)', lineHeight: 1.5 }}>
              Cadastrar, editar, inativar e definir níveis de acesso dos usuários do sistema.
            </div>
            <div style={{ marginTop: 12, fontSize: 11, fontWeight: 700, color: 'var(--ccm-blue)', textTransform: 'uppercase', letterSpacing: '.1em' }}>
              Acessar <i className="bi bi-arrow-right" />
            </div>
          </div>
        </div>

        {/* Placeholder para futuros cards */}
        <div className="col-12 col-md-4 col-lg-3">
          <div style={{
            background: '#F7F8FA',
            border: '1px dashed var(--ccm-line)',
            borderRadius: 6,
            padding: '20px 22px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 120,
            color: 'var(--ccm-gray-medium)',
            fontSize: 12,
            letterSpacing: '.08em',
          }}>
            <i className="bi bi-plus-circle me-2" />Em breve
          </div>
        </div>
      </div>
    </div>
  );
}
