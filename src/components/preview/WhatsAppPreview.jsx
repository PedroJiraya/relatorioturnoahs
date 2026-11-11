'use client';

export default function WhatsAppPreview({
  report,
  onClose,
  onDownloadCsv,
}) {
  if (!report) return null;

  const handleCopy = () => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(report);
      alert('Relatório copiado com sucesso para a área de transferência!');
    }
  };

  const handleOpenWhatsApp = () => {
    window.open(
      `https://api.whatsapp.com/send?text=${encodeURIComponent(report)}`,
      '_blank',
      'noopener,noreferrer',
    );
  };

  return (
    <section className="card preview">
      <div className="preview-heading">
        <div>
          <p className="eyebrow">Saída WhatsApp</p>
          <h2>Mensagem do relatório</h2>
        </div>
        <button
          type="button"
          className="close"
          onClick={onClose}
          title="Fechar visualização"
        >
          ×
        </button>
      </div>
      <pre>{report}</pre>
      <div className="preview-actions">
        <button type="button" className="outline" onClick={onDownloadCsv}>
          Baixar CSV
        </button>
        <button type="button" className="outline" onClick={handleCopy}>
          Copiar mensagem
        </button>
        <button
          type="button"
          className="primary"
          onClick={handleOpenWhatsApp}
        >
          Abrir no WhatsApp
        </button>
      </div>
    </section>
  );
}
