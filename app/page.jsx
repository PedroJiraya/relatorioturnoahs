'use client';

import { useState } from 'react';
import faultTree from '../src/data/fault-tree.json';

const codes = ['HMC – 9200', 'MPS – 9600', 'MPNS – 9100', 'HAC – 9700'];
const statuses = ['Liberado', 'Em manutenção', 'Aguardando recurso', 'Aguardando componente'];
const systems = Object.keys(faultTree);
const emoji = {
  clipboard: '📋', calendar: '📅', clock: '⏰', worker: '👷', compass: '🧭',
  mechanic: '👨‍🔧', gear: '⚙️', cross: '❌', tools: '🛠️', check: '✅',
  pin: '📌', noEntry: '🚫',
};

function blankAppointment() {
  return {
    asset: '', code: codes[0], system: '', component: '', subcomponent: '',
    cause: '', faultSolution: '', diagnosis: '', solution: '', status: 'Liberado',
  };
}

function branches(item) {
  const system = faultTree[item.system] || {};
  const component = system[item.component] || {};
  const subcomponent = component[item.subcomponent] || {};
  return {
    components: Object.keys(system),
    subcomponents: Object.keys(component),
    causes: Object.keys(subcomponent),
    solutions: subcomponent[item.cause] || [],
  };
}

function Field({ label, value, onChange, type = 'text', placeholder }) {
  return (
    <label className="field">
      <span>{label}</span>
      {type === 'textarea' ? (
        <textarea value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
      ) : (
        <input type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
      )}
    </label>
  );
}

function SelectField({ label, value, values, onChange, disabled = false }) {
  return (
    <label className="field">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled}>
        <option value="">Selecione</option>
        {values.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  );
}

function Appointment({ item, index, total, update, remove }) {
  const branch = branches(item);
  const change = (key, value) => {
    const resets = {
      system: ['component', 'subcomponent', 'cause', 'faultSolution'],
      component: ['subcomponent', 'cause', 'faultSolution'],
      subcomponent: ['cause', 'faultSolution'],
      cause: ['faultSolution'],
    };
    update(index, { [key]: value, ...Object.fromEntries((resets[key] || []).map((field) => [field, ''])) });
  };
  return (
    <article className="appointment">
      <div className="section-title">
        <h3>Atendimento {index + 1}</h3>
        {total > 1 && <button type="button" className="remove" onClick={() => remove(index)}>Remover</button>}
      </div>
      <div className="grid two">
        <Field label="Ativo / CM" value={item.asset} onChange={(value) => update(index, { asset: value })} placeholder="Ex.: CM5516" />
        <SelectField label="Código de manutenção" value={item.code} values={codes} onChange={(value) => update(index, { code: value })} />
      </div>
      <div className="grid five">
        <SelectField label="1. Sistema" value={item.system} values={systems} onChange={(value) => change('system', value)} />
        <SelectField label="2. Componente" value={item.component} values={branch.components} onChange={(value) => change('component', value)} disabled={!item.system} />
        <SelectField label="3. Subcomponente" value={item.subcomponent} values={branch.subcomponents} onChange={(value) => change('subcomponent', value)} disabled={!item.component} />
        <SelectField label="4. Causa" value={item.cause} values={branch.causes} onChange={(value) => change('cause', value)} disabled={!item.subcomponent} />
        <SelectField label="5. Solução" value={item.faultSolution} values={branch.solutions} onChange={(value) => update(index, { faultSolution: value })} disabled={!item.cause} />
      </div>
      <div className="grid two">
        <Field label="Diagnóstico executado" type="textarea" value={item.diagnosis} onChange={(value) => update(index, { diagnosis: value })} placeholder="Verificações e testes realizados" />
        <Field label="Solução aplicada" type="textarea" value={item.solution} onChange={(value) => update(index, { solution: value })} placeholder="Serviço realizado" />
      </div>
      <div className="status-grid">
        {statuses.map((status) => (
          <label className="status-option" key={status}>
            <input type="radio" name={`status-${index}`} checked={item.status === status} onChange={() => update(index, { status })} />
            <span>{status}</span>
          </label>
        ))}
      </div>
    </article>
  );
}

export default function Page() {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [shift, setShift] = useState('06:00 às 18:00');
  const [team, setTeam] = useState('');
  const [supervisor, setSupervisor] = useState('');
  const [executors, setExecutors] = useState('');
  const [conclusion, setConclusion] = useState('');
  const [appointments, setAppointments] = useState([blankAppointment()]);
  const [stopped, setStopped] = useState([{ asset: '', code: codes[0] }]);
  const [report, setReport] = useState('');

  const updateAppointment = (index, changes) => setAppointments((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, ...changes } : item));
  const dateText = date ? new Intl.DateTimeFormat('pt-BR').format(new Date(`${date}T12:00:00`)) : '-';
  const path = (item) => [item.system, item.component, item.subcomponent, item.cause, item.faultSolution].filter(Boolean).join(' > ') || 'Não informada';
  const makeReport = () => {
    const appointmentText = appointments.map((item) => `${emoji.gear} ${item.asset || 'Ativo não informado'} | Código: ${item.code}\n\n${emoji.cross} CLASSE DA FALHA\n${path(item)}\n\n${emoji.tools} DIAGNÓSTICO EXECUTADO\n${item.diagnosis || 'Não informado'}\n\n${emoji.check} SOLUÇÃO APLICADA\n${item.solution || 'Não informada'}\n\n${emoji.pin} STATUS FINAL: ${item.status}`).join('\n\n____________________________________\n\n');
    const stoppedText = stopped.filter((item) => item.asset.trim()).map((item) => `${emoji.gear} ${item.asset} | Código: ${item.code}`).join('\n') || 'Nenhum equipamento informado';
    return `Boa noite!\n\n${emoji.clipboard} RELATÓRIO DE TURNO – MANUTENÇÃO CORRETIVA\n\n${emoji.calendar} Data: ${dateText}\n${emoji.clock} Turno: ${shift}\n${emoji.worker} Turma: ${team || 'Não informado'}\n${emoji.compass} Supervisor: ${supervisor || 'Não informado'}\n${emoji.mechanic} Executantes:\n${executors || 'Não informado'}\n\n____________________________________\n\nATENDIMENTO DOS ATIVOS EM MANUTENÇÃO\n\n${appointmentText}\n\n${emoji.noEntry} EQUIPAMENTOS PARADOS\n${stoppedText}`;
  };
  const clear = () => {
    setTeam(''); setSupervisor(''); setExecutors(''); setConclusion('');
    setAppointments([blankAppointment()]); setStopped([{ asset: '', code: codes[0] }]); setReport('');
  };

  return (
    <main className="page">
      <header className="hero"><div><p className="eyebrow">Manutenção corretiva</p><h1>Relatório de turno</h1><p className="subtitle">Preencha os atendimentos e gere WhatsApp ou ficha PDF.</p></div><div className="brand">SOTREQ <strong>CAT</strong></div></header>
      <form className="card" onSubmit={(event) => { event.preventDefault(); setReport(makeReport()); }}>
        <section><h2>Dados do turno</h2><div className="grid three"><Field label="Data" type="date" value={date} onChange={setDate} /><SelectField label="Turno" value={shift} values={['06:00 às 18:00', '18:00 às 06:00']} onChange={setShift} /><Field label="Turma" value={team} onChange={setTeam} placeholder="Ex.: B" /></div><div className="grid two"><Field label="Supervisor" value={supervisor} onChange={setSupervisor} placeholder="Nome do supervisor" /><Field label="Executantes" type="textarea" value={executors} onChange={setExecutors} placeholder="Um nome por linha" /></div></section>
        <section><div className="section-title"><h2>Ativos em manutenção</h2><button type="button" className="small primary" onClick={() => setAppointments((items) => [...items, blankAppointment()])}>+ Adicionar atendimento</button></div><p className="hint">Adicione outro atendimento quando houver mais de um equipamento trabalhado no turno.</p>{appointments.map((item, index) => <Appointment key={index} item={item} index={index} total={appointments.length} update={updateAppointment} remove={(removeIndex) => setAppointments((items) => items.filter((_, itemIndex) => itemIndex !== removeIndex))} />)}</section>
        <section><h2>Observações / conclusão</h2><Field label="Informações adicionais" type="textarea" value={conclusion} onChange={setConclusion} placeholder="Observações gerais do turno" /></section>
        <section><div className="section-title"><h2>Equipamentos parados</h2><button type="button" className="small primary" onClick={() => setStopped((items) => [...items, { asset: '', code: codes[0] }])}>+ Adicionar equipamento</button></div>{stopped.map((item, index) => <div className="stopped-row" key={index}><input value={item.asset} onChange={(event) => setStopped((items) => items.map((entry, entryIndex) => entryIndex === index ? { ...entry, asset: event.target.value } : entry))} placeholder="Ex.: CM5516" /><select value={item.code} onChange={(event) => setStopped((items) => items.map((entry, entryIndex) => entryIndex === index ? { ...entry, code: event.target.value } : entry))}>{codes.map((code) => <option key={code}>{code}</option>)}</select><button type="button" className="remove" onClick={() => setStopped((items) => items.filter((_, itemIndex) => itemIndex !== index))}>×</button></div>)}</section>
        <div className="actions"><button type="button" className="secondary" onClick={clear}>Limpar</button><button type="submit" className="primary">Gerar WhatsApp</button></div>
      </form>
      {report && <section className="card preview"><div className="preview-heading"><div><p className="eyebrow">Saída WhatsApp</p><h2>Mensagem do relatório</h2></div><button type="button" className="close" onClick={() => setReport('')}>×</button></div><pre>{report}</pre><div className="preview-actions"><button type="button" className="outline" onClick={() => navigator.clipboard.writeText(report)}>Copiar mensagem</button><button type="button" className="primary" onClick={() => window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(report)}`, '_blank', 'noopener,noreferrer')}>Abrir no WhatsApp</button></div></section>}
    </main>
  );
}
