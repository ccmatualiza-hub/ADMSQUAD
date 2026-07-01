export default function GeradorCodigoCCM({ onBack }: { onBack: () => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--ccm-blue)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em' }}>
          <i className="bi bi-arrow-left me-1" />Operações
        </button>
        <span style={{ color: 'var(--ccm-gray-medium)', fontSize: 12 }}>/</span>
        <span style={{ color: 'var(--ccm-gray-dark)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em' }}>Gerador de Código CCM</span>
      </div>

      <iframe
        src="https://zbx-n8n.ccmcloud2.com.br/form/cf210b7c-7189-4fe6-a112-d54b12fe0858"
        style={{ flex: 1, width: '100%', border: 'none', borderRadius: 8, boxShadow: '0 2px 12px rgba(12,25,33,.1)' }}
        title="Gerador de Código CCM"
        allow="clipboard-write"
      />
    </div>
  );
}
