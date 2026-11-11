'use client';

import { useState, useEffect } from 'react';
import faultTree from '../src/data/fault-tree.json';
import { STORAGE_KEY, codes, fleetEquipments } from '../src/constants';
import { formatCA, getFleetSummary } from '../src/utils/formatters';
import { generateWhatsAppReport } from '../src/utils/reportGenerator';
import { downloadCsv } from '../src/utils/exportCsv';

import Field from '../src/components/common/Field';
import ShiftDataSection from '../src/components/sections/ShiftDataSection';
import AppointmentsSection from '../src/components/sections/AppointmentsSection';
import StoppedSection from '../src/components/sections/StoppedSection';
import OperatingSection from '../src/components/sections/OperatingSection';
import FleetSummarySection from '../src/components/sections/FleetSummarySection';
import WhatsAppPreview from '../src/components/preview/WhatsAppPreview';
import PdfReportModal from '../src/components/modal/PdfReportModal';

export default function Page() {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [shift, setShift] = useState('06:00 às 18:00');
  const [team, setTeam] = useState('');
  const [supervisor, setSupervisor] = useState('');
  const [executors, setExecutors] = useState('');
  const [workshop, setWorkshop] = useState('Oficina N4WN');
  const [conclusion, setConclusion] = useState('');
  const [appointments, setAppointments] = useState([]);
  const [stopped, setStopped] = useState([
    {
      asset: '',
      code: codes[0],
      subCode: 'EXEC MANUT',
      startTime: '',
      reason: '',
    },
  ]);
  const [report, setReport] = useState('');
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Caminhões em manutenção (parados ou com atendimento não liberado)
  const maintTrucks = new Set([
    ...stopped
      .map((item) => formatCA(item.asset))
      .filter((tag) => tag.length > 2),
    ...appointments
      .filter((a) => {
        const eff =
          a.endTime && a.endTime.trim() && a.status === 'Aguardando recurso'
            ? 'Liberado'
            : a.status || 'Em manutenção';
        return eff !== 'Liberado';
      })
      .map((a) => formatCA(a.asset))
      .filter((tag) => tag.length > 2),
  ]);

  // Frota operando autônomo calculada dinamicamente: todos os 23 caminhões exceto quem está em manutenção
  const operating = fleetEquipments
    .filter((asset) => !maintTrucks.has(asset))
    .map((asset) => ({ asset }));

  // Carrega rascunho persistido ao abrir ou recarregar a página
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        if (data.date !== undefined) setDate(data.date);
        if (data.shift !== undefined) setShift(data.shift);
        if (data.team !== undefined) setTeam(data.team);
        if (data.supervisor !== undefined) setSupervisor(data.supervisor);
        if (data.executors !== undefined) setExecutors(data.executors);
        if (data.workshop !== undefined) setWorkshop(data.workshop);
        if (data.conclusion !== undefined) setConclusion(data.conclusion);
        if (Array.isArray(data.appointments)) {
          const sanitizedAppointments = data.appointments.map((a) => {
            const updated = { ...a };
            if (updated.status !== 'Liberado') {
              updated.endTime = '';
              if (Array.isArray(updated.delays) && updated.delays.length > 0) {
                const lastIdx = updated.delays.length - 1;
                updated.delays[lastIdx] = {
                  ...updated.delays[lastIdx],
                  endTime: '',
                };
              }
            } else if (Array.isArray(a.delays) && a.delays.length > 0) {
              const lastDelay = a.delays[a.delays.length - 1];
              if (lastDelay?.endTime && lastDelay.endTime.trim()) {
                updated.endTime = lastDelay.endTime;
              }
            }
            if (
              updated.endTime &&
              updated.endTime.trim() &&
              updated.status === 'Aguardando recurso'
            ) {
              updated.status = 'Liberado';
            }

            // Valida e sanitiza a Classe de Falha contra a taxonomia oficial:
            if (updated.system) {
              const sys = faultTree[updated.system];
              if (sys && updated.component) {
                const comp = sys[updated.component];
                if (comp && updated.subcomponent) {
                  const sub = comp[updated.subcomponent];
                  if (sub && updated.cause) {
                    const sols = sub[updated.cause] || [];
                    if (!sols.includes(updated.faultSolution)) {
                      updated.faultSolution = sols.length === 1 ? sols[0] : '';
                    }
                  } else if (sub) {
                    updated.cause = '';
                    updated.faultSolution = '';
                  }
                } else if (comp) {
                  updated.subcomponent = '';
                  updated.cause = '';
                  updated.faultSolution = '';
                }
              } else if (sys) {
                updated.component = '';
                updated.subcomponent = '';
                updated.cause = '';
                updated.faultSolution = '';
              }
            }

            return updated;
          });
          setAppointments(sanitizedAppointments);
        }
        if (Array.isArray(data.stopped)) {
          const sanitizedStopped = data.stopped.map((s) => ({
            asset: s.asset || '',
            code: s.code || codes[0],
            subCode: s.subCode || 'EXEC MANUT',
            startTime: s.startTime || s.stoppedAt || '',
            reason: s.reason || s.discipline || '',
          }));
          setStopped(sanitizedStopped);
        }
        if (data.report !== undefined) {
          if (
            data.report.includes('🚫 EQUIPAMENTOS PARADOS') ||
            data.report.includes('🚚 🔴') ||
            data.report.includes('🚚 🟢') ||
            !data.report.includes('%')
          ) {
            setReport('');
          } else {
            setReport(data.report);
          }
        }
      }
    } catch (err) {
      console.error('Erro ao recuperar rascunho do relatório:', err);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Salva automaticamente qualquer alteração no localStorage
  useEffect(() => {
    if (!isLoaded) return;
    try {
      const draft = {
        date,
        shift,
        team,
        supervisor,
        executors,
        workshop,
        conclusion,
        appointments,
        stopped,
        operating,
        report,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    } catch (err) {
      console.error('Erro ao salvar rascunho do relatório:', err);
    }
  }, [
    date,
    shift,
    team,
    supervisor,
    executors,
    workshop,
    conclusion,
    appointments,
    stopped,
    operating,
    report,
    isLoaded,
  ]);

  const updateAppointment = (index, changes) =>
    setAppointments((items) =>
      items.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...changes } : item,
      ),
    );

  const dateText = date
    ? new Intl.DateTimeFormat('pt-BR').format(new Date(`${date}T12:00:00`))
    : '-';

  const fleetSummary = getFleetSummary(stopped, operating, appointments);

  const makeReport = () => {
    return generateWhatsAppReport({
      dateText,
      shift,
      team,
      supervisor,
      executors,
      workshop,
      conclusion,
      appointments,
      stopped,
      operating,
    });
  };

  // Se o relatório de WhatsApp já estiver aberto, mantém o texto sincronizado em tempo real com as alterações
  useEffect(() => {
    if (isLoaded && report) {
      setReport(makeReport());
    }
  }, [
    appointments,
    stopped,
    operating,
    date,
    shift,
    team,
    supervisor,
    executors,
    workshop,
    conclusion,
  ]);

  const handleClear = () => {
    if (
      window.confirm(
        'Tem certeza que deseja limpar todo o relatório do turno? Esta ação apagará as informações salvas no navegador.',
      )
    ) {
      setDate(new Date().toISOString().slice(0, 10));
      setShift('06:00 às 18:00');
      setTeam('');
      setSupervisor('');
      setExecutors('');
      setWorkshop('Oficina N4WN');
      setConclusion('');
      setAppointments([]);
      setStopped([
        {
          asset: '',
          code: codes[0],
          subCode: 'EXEC MANUT',
          startTime: '',
          reason: '',
        },
      ]);
      setReport('');
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (err) {
        console.error('Erro ao limpar rascunho:', err);
      }
    }
  };

  const handleDownloadCsv = () => {
    downloadCsv({
      date,
      dateText,
      shift,
      team,
      workshop,
      supervisor,
      executors,
      appointments,
      stopped,
    });
  };

  return (
    <main className="page">
      <header className="hero">
        <div>
          <p className="eyebrow">Manutenção corretiva</p>
          <h1>Relatório de Turno</h1>
          <p className="subtitle">
            Preencha os atendimentos e gere WhatsApp ou ficha PDF.
          </p>
        </div>
        <div className="brand-container">
          <img src="/logo-sotreq.png" alt="Sotreq CAT" className="brand-logo" />
        </div>
      </header>

      <form
        className="card"
        onSubmit={(event) => {
          event.preventDefault();
          setReport(makeReport());
        }}
      >
        <ShiftDataSection
          date={date}
          setDate={setDate}
          shift={shift}
          setShift={setShift}
          team={team}
          setTeam={setTeam}
          workshop={workshop}
          setWorkshop={setWorkshop}
          supervisor={supervisor}
          setSupervisor={setSupervisor}
          executors={executors}
          setExecutors={setExecutors}
        />

        <AppointmentsSection
          appointments={appointments}
          setAppointments={setAppointments}
          updateAppointment={updateAppointment}
        />

        <section>
          <h2>Observações / conclusão</h2>
          <Field
            label="Informações adicionais"
            type="textarea"
            value={conclusion}
            onChange={setConclusion}
            placeholder="Observações gerais do turno"
          />
        </section>

        <StoppedSection stopped={stopped} setStopped={setStopped} />

        <OperatingSection operating={operating} />

        <FleetSummarySection fleetSummary={fleetSummary} />

        <div className="actions">
          <span className="auto-save-pill">💾 Rascunho salvo</span>
          <div className="btn-group">
            <button type="button" className="secondary" onClick={handleClear}>
              Limpar
            </button>
            <button
              type="button"
              className="outline"
              onClick={handleDownloadCsv}
            >
              Baixar CSV
            </button>
            <button
              type="button"
              className="outline"
              onClick={() => setShowPdfModal(true)}
            >
              📄 Gerar Ficha PDF
            </button>
            <button type="submit" className="primary">
              Gerar WhatsApp
            </button>
          </div>
        </div>
      </form>

      {/* Pré-visualização da Mensagem para WhatsApp */}
      <WhatsAppPreview
        report={report}
        onClose={() => setReport('')}
        onDownloadCsv={handleDownloadCsv}
      />

      {/* Modal e Impressão da Ficha Oficial em PDF */}
      <PdfReportModal
        isOpen={showPdfModal}
        onClose={() => setShowPdfModal(false)}
        dateText={dateText}
        shift={shift}
        team={team}
        workshop={workshop}
        supervisor={supervisor}
        executors={executors}
        conclusion={conclusion}
        appointments={appointments}
        stopped={stopped}
        operating={operating}
        fleetSummary={fleetSummary}
      />
    </main>
  );
}
