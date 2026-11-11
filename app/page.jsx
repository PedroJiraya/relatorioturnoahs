'use client';

import { useState, useEffect } from 'react';
import faultTree from '../src/data/fault-tree.json';

const STORAGE_KEY = 'relatorio_turno_ahs_draft_v1';

const codes = [
  'HMC – 9200',
  'MPS – 9600',
  'MPNS – 9100',
  'HAC – 9700',
  'Operando autônomo',
];
const statuses = ['Liberado', 'Em manutenção'];

const teams = ['A', 'B', 'C', 'D', 'ADM'];

const stoppedPreInfo = [
  'MECANICA',
  'ELETRICA',
  'BORRACHARIA',
  'LUBRIFICACAO',
  'ON BRD AUTOMACAO AHS',
  'CALIBRAÇÃO AHS',
  'ON BRD TELECOM',
  'OFF BRD TELECOM/REDES',
  'PREVENTIVA OFICINA',
];

const delayJustifications = [
  'EXEC MANUT',
  'EXEC MECANICA',
  'EXEC ELETRICA',
  'EXEC ELETRONICA/AUTOMACAO',
  'EXEC DIAGNOSTICO TECNICO',
  'EXEC BORRACHARIA',
  'EXEC LAVADOR',
  'EXEC TERCEIROS TRABALHANDO',
  'EXEC LUBRIFICACAO',
  'EXEC MANUT SISTEMA DE COMBUSTIVEL',
  'EXEC REDES E LINHAS',
  'EXEC GARANTIA / ASSIST TECNICA',
  'EXEC CALDERARIA/SOLDA',
  'EXEC ON BRD AUTOMACAO',
  'EXEC CALIBRACAO',
  'EXEC SIST EMBARCADOS/AUTOMACAO',
  'EXEC TELECOM/REDES COM',
  'AG SISTEMAS SEGURANCA',
  'EXEC ON BRD TELECOM',
  'AG MECANICA',
  'AG ELETRICA',
  'AG ELETRONICA/AUTOMACAO',
  'AG APROVACAO',
  'AG AVALIACAO',
  'AG BORRACHARIA',
  'AG LAVADOR',
  'AG BOX',
  'AG COMBOIO',
  'AG CONDICAO SEGURA',
  'AG LOCOMOCAO',
  'AG LUBRIFICACAO',
  'AG PECAS',
  'AG MAO DE OBRA',
  'AG OPERACAO',
  'AG RECURSO/FERRAMENTAL',
  'AG REDES E LINHAS',
  'AG GARANTIA / ASSIST TECNICA',
  'AG CALDERARIA/SOLDA',
  'AG DETONACAO',
  'AG MAU TEMPO',
  'AG ENERGIA',
  'AG LIBERACAO DE ACESSO',
  'AG OFICINA DE COMPONENTES',
  'AG ATENDIMENTO',
  'AG SIST EMBARCADOS/AUTOMACAO',
  'AG CALLPAD',
  'AG PTS',
];

const systems = Object.keys(faultTree);

const fleetEquipments = [
  'CA5516',
  'CA5525',
  'CA5527',
  'CA5528',
  'CA5529',
  'CA5530',
  'CA5531',
  'CA5532',
  'CA5533',
  'CA5534',
  'CA5535',
  'CA5704',
  'CA5706',
  'CA5710',
  'CA5711',
  'CA5714',
  'CA5716',
  'CA5718',
  'CA5719',
  'CA5722',
  'CA5724',
  'CA5725',
  'CA5726',
];

const emoji = {
  clipboard: '📋',
  calendar: '📅',
  clock: '⏰',
  worker: '👷',
  compass: '🧭',
  mechanic: '👨‍🔧',
  cross: '❌',
  tools: '🛠️',
  check: '✅',
  pin: '📌',
  noEntry: '🚫',
};

function getCodeEmoji(code = '') {
  if (code.includes('Operando')) return '🟢';
  if (code.includes('MPNS')) return '🟠';
  if (code.includes('MPS')) return '🟡';
  if (code.includes('HMC') || code.includes('HAC')) return '🔴';
  return '⚙️';
}

function getLocalDatetimeString() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  const local = new Date(now.getTime() - offset);
  return local.toISOString().slice(0, 16);
}

function formatDateTimeWhatsApp(val = '') {
  if (!val) return '';
  if (val.includes('T')) {
    const [datePart, timePart] = val.split('T');
    const parts = datePart.split('-');
    if (parts.length === 3) {
      const [, month, day] = parts;
      return `${day}/${month} às ${timePart.slice(0, 5)}`;
    }
  }
  return val;
}

function formatCA(val = '') {
  if (!val) return '';
  const clean = val.trim().toUpperCase().replace(/\s+/g, '');
  if (!clean) return '';
  const digitsOrSuffix = clean.replace(/^(CA|CM)+/i, '');
  return digitsOrSuffix ? `CA${digitsOrSuffix}` : 'CA';
}

const formatCM = formatCA;

function getTag(asset = '') {
  return String(asset || '')
    .replace(/^(CA|CM)+/i, '')
    .trim();
}

function getDelayTimes(delays = [], dIdx = 0, itemStartTime = '') {
  const delay = delays[dIdx] || {};

  // O primeiro atraso sempre começa no Horário Início MineStar;
  // O segundo atraso em diante SEMPRE começa no término (endTime) do atraso anterior!
  const prevDelay = dIdx > 0 ? delays[dIdx - 1] : null;
  const effectiveStart =
    dIdx === 0
      ? itemStartTime || delay.startTime || ''
      : prevDelay?.endTime || delay.startTime || '';

  const effectiveEnd = delay.endTime || '';

  return { effectiveStart, effectiveEnd };
}

function normalizeAssetInput(raw, prev = '') {
  let val = raw.toUpperCase().replace(/\s+/g, '');
  if ((val === 'CA' || val === 'CM') && prev.length > 2) {
    return '';
  }
  if (/^\d/.test(val)) {
    val = `CA${val}`;
  }
  return val;
}

function getTruckModel(asset = '') {
  const clean = formatCA(asset).toUpperCase();
  if (/^CA55|^CM55|^55/.test(clean)) return '797F';
  if (/^CA57|^CM57|^57/.test(clean)) return '794 AC';
  return 'Outros';
}

function getFleetSummary(stopped = [], operating = [], appointments = []) {
  const maintFromAppointments = appointments
    .filter((a) => {
      const eff =
        a.endTime && a.endTime.trim() && a.status === 'Aguardando recurso'
          ? 'Liberado'
          : a.status || 'Em manutenção';
      return eff !== 'Liberado';
    })
    .map((a) => formatCA(a.asset))
    .filter((tag) => tag.length > 2);

  const maintList = [
    ...stopped
      .map((item) => formatCA(item.asset))
      .filter((tag) => tag.length > 2),
    ...maintFromAppointments,
  ];
  const uniqueMaint = Array.from(new Set(maintList));

  const autoList = operating
    .map((item) => formatCA(item.asset))
    .filter((tag) => tag.length > 2);
  const uniqueAuto = Array.from(new Set(autoList));

  const allTrucks = Array.from(new Set([...uniqueMaint, ...uniqueAuto]));
  const totalTrucks = allTrucks.length;
  const totalMaint = uniqueMaint.length;
  const totalAuto = uniqueAuto.length;

  const count797F_Maint = uniqueMaint.filter(
    (t) => getTruckModel(t) === '797F',
  ).length;
  const count797F_Auto = uniqueAuto.filter(
    (t) => getTruckModel(t) === '797F',
  ).length;
  const total797F = count797F_Maint + count797F_Auto;

  const count794AC_Maint = uniqueMaint.filter(
    (t) => getTruckModel(t) === '794 AC',
  ).length;
  const count794AC_Auto = uniqueAuto.filter(
    (t) => getTruckModel(t) === '794 AC',
  ).length;
  const total794AC = count794AC_Maint + count794AC_Auto;

  const calc = (count, tot) => {
    if (!tot || tot === 0) return { num: 0, text: '0%' };
    const num = (count / tot) * 100;
    const text = `${num % 1 === 0 ? num.toFixed(0) : num.toFixed(1)}%`;
    return { num, text };
  };

  const totalAutoCalc = calc(totalAuto, totalTrucks);
  const totalMaintCalc = calc(totalMaint, totalTrucks);

  const f797AutoCalc = calc(count797F_Auto, total797F);
  const f797MaintCalc = calc(count797F_Maint, total797F);

  const f794AutoCalc = calc(count794AC_Auto, total794AC);
  const f794MaintCalc = calc(count794AC_Maint, total794AC);

  return {
    totalTrucks,
    totalMaint,
    totalAuto,
    percTotalAuto: totalAutoCalc.text,
    percTotalMaint: totalMaintCalc.text,
    numPercTotalAuto: totalAutoCalc.num,
    numPercTotalMaint: totalMaintCalc.num,

    total797F,
    count797F_Maint,
    count797F_Auto,
    perc797F_Auto: f797AutoCalc.text,
    perc797F_Maint: f797MaintCalc.text,
    numPerc797F_Auto: f797AutoCalc.num,
    numPerc797F_Maint: f797MaintCalc.num,

    total794AC,
    count794AC_Maint,
    count794AC_Auto,
    perc794AC_Auto: f794AutoCalc.text,
    perc794AC_Maint: f794MaintCalc.text,
    numPerc794AC_Auto: f794AutoCalc.num,
    numPerc794AC_Maint: f794MaintCalc.num,
  };
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'Bom dia!';
  if (hour >= 12 && hour < 18) return 'Boa tarde!';
  return 'Boa noite!';
}

function blankAppointment() {
  return {
    asset: '',
    code: codes[0],
    startTime: '',
    endTime: '',
    delays: [],
    system: '',
    component: '',
    subcomponent: '',
    cause: '',
    operationalCause: '',
    faultSolution: '',
    diagnosis: '',
    solution: '',
    status: 'Em manutenção',
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

function Field({
  label,
  value,
  onChange,
  onBlur,
  type = 'text',
  placeholder,
  disabled = false,
  title,
  style,
}) {
  return (
    <label className="field">
      <span>{label}</span>
      {type === 'textarea' ? (
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onBlur={onBlur}
          placeholder={placeholder}
          disabled={disabled}
          title={title}
          style={style}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onBlur={onBlur}
          placeholder={placeholder}
          disabled={disabled}
          title={title}
          style={style}
        />
      )}
    </label>
  );
}

function SelectField({
  label,
  value,
  values,
  onChange,
  disabled = false,
  getOptionLabel,
  allowCustom = false,
}) {
  const options =
    allowCustom && value && !values.includes(value)
      ? [value, ...values]
      : values;
  return (
    <label className="field">
      <span>{label}</span>
      <select
        value={options.includes(value) ? value : ''}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
      >
        <option value="">Selecione</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {getOptionLabel ? getOptionLabel(option) : option}
          </option>
        ))}
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

    const nextUpdates = {
      [key]: value,
      ...Object.fromEntries((resets[key] || []).map((field) => [field, ''])),
    };

    // Ao selecionar o Problema (cause), se houver apenas 1 solução associada na taxonomia oficial, já preenche automaticamente:
    if (key === 'cause') {
      const currentSystem = faultTree[item.system] || {};
      const currentComp = currentSystem[item.component] || {};
      const currentSub = currentComp[item.subcomponent] || {};
      const sols = currentSub[value] || [];
      if (sols.length === 1) {
        nextUpdates.faultSolution = sols[0];
      } else {
        nextUpdates.faultSolution = '';
      }
    }

    update(index, nextUpdates);
  };
  return (
    <article className="appointment">
      <div className="section-title">
        <h3>
          {getCodeEmoji(item.code)} Atendimento {index + 1}{' '}
          {item.asset ? `• ${formatCA(item.asset)}` : ''}
        </h3>
        {total > 1 && (
          <button
            type="button"
            className="remove"
            onClick={() => remove(index)}
          >
            Remover
          </button>
        )}
      </div>
      <div className="grid four">
        <SelectField
          label="Ativo / Equipamento"
          value={formatCA(item.asset)}
          values={fleetEquipments}
          onChange={(value) => update(index, { asset: value })}
          getOptionLabel={(eq) => getTag(eq)}
          allowCustom={true}
        />
        <SelectField
          label="Código de manutenção"
          value={item.code}
          values={codes}
          onChange={(value) => update(index, { code: value })}
          getOptionLabel={(code) => `${getCodeEmoji(code)} ${code}`}
        />
        <Field
          label="Horário Início MineStar"
          type="datetime-local"
          value={item.startTime || ''}
          onChange={(value) => {
            const currentDelays = item.delays || [];
            if (currentDelays.length > 0) {
              const updatedDelays = [...currentDelays];
              updatedDelays[0] = {
                ...updatedDelays[0],
                startTime: value,
              };
              update(index, { startTime: value, delays: updatedDelays });
            } else {
              update(index, { startTime: value });
            }
          }}
        />
        <Field
          label="Horário Fim Technician"
          type="datetime-local"
          value={item.endTime || ''}
          disabled={item.status !== 'Liberado'}
          title={
            item.status !== 'Liberado'
              ? "Bloqueado: marque o Status Final como 'Liberado' para preencher o término"
              : 'Horário Fim Technician'
          }
          style={
            item.status !== 'Liberado'
              ? {
                  background: '#f1f5f9',
                  color: '#94a3b8',
                  cursor: 'not-allowed',
                }
              : {}
          }
          onChange={(value) => {
            const changes = { endTime: value };
            // Sincroniza sempre com o término do último atraso (subcódigo filho):
            const currentDelays = item.delays || [];
            if (currentDelays.length > 0) {
              const updatedDelays = [...currentDelays];
              const lastIdx = updatedDelays.length - 1;
              updatedDelays[lastIdx] = {
                ...updatedDelays[lastIdx],
                endTime: value,
              };
              changes.delays = updatedDelays;
            }
            update(index, changes);
          }}
        />
      </div>
      <div
        className="delays-section"
        style={{
          margin: '14px 0',
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '10px',
          padding: '12px 14px',
        }}
      >
        <div className="section-title" style={{ marginBottom: '8px' }}>
          <h4
            style={{
              margin: 0,
              fontSize: '0.9rem',
              color: '#1e293b',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>⏳</span> Justificativas de Atraso / Eventos do Atendimento
          </h4>
          S
          <button
            type="button"
            className="small outline"
            onClick={() => {
              const nowStr = getLocalDatetimeString();
              const current = item.delays || [];
              const isFirst = current.length === 0;
              const nextJustification = isFirst ? 'AG ATENDIMENTO' : '';

              // Se já existia um atraso anterior que estava em aberto,
              // ao criar o novo atraso agora (nowStr), o anterior é encerrado agora:
              const updatedDelays = [...current];
              if (!isFirst) {
                const prevIdx = updatedDelays.length - 1;
                updatedDelays[prevIdx] = {
                  ...updatedDelays[prevIdx],
                  endTime: nowStr,
                };
              }

              // O novo atraso inicia agora (nowStr).
              // Se o equipamento estiver em manutenção (status !== 'Liberado'),
              // o novo atraso fica com horário fim EM BRANCO ('') pois continua em andamento/aberto!
              const nextStart = isFirst ? item.startTime || nowStr : nowStr;
              const nextEnd = item.status === 'Liberado' ? nowStr : '';

              updatedDelays.push({
                justification: nextJustification,
                startTime: nextStart,
                endTime: nextEnd,
              });

              const changes = { delays: updatedDelays };
              if (isFirst && !item.startTime) {
                changes.startTime = nextStart;
              }
              if (item.status === 'Liberado') {
                changes.endTime = nextEnd;
              } else {
                // Em manutenção: horário fim do equipamento permanece em branco
                changes.endTime = '';
              }
              update(index, changes);
            }}
          >
            + Adicionar atraso
          </button>
        </div>
        <p
          className="hint"
          style={{
            marginTop: 0,
            marginBottom: '10px',
            fontSize: '0.78rem',
          }}
        >
          O primeiro atraso é sempre <strong>AG ATENDIMENTO</strong> e inicia
          automaticamente no <em>Horário Início MineStar</em>. O horário de
          término do atraso e o <em>Horário Fim Technician</em> só podem ser
          alterados quando o <strong>Status Final</strong> for <em>Liberado</em>
          .
        </p>
        {!item.delays || item.delays.length === 0 ? (
          <p
            style={{
              color: '#94a3b8',
              fontStyle: 'italic',
              fontSize: '0.82rem',
              margin: '4px 0',
            }}
          >
            Nenhum atraso registrado para este atendimento.
          </p>
        ) : (
          <div
            className="delays-list"
            style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
          >
            {item.delays.map((delay, dIdx) => {
              const inheritedStart =
                dIdx === 0
                  ? item.startTime || delay.startTime || ''
                  : item.delays[dIdx - 1]?.endTime || delay.startTime || '';

              const currentJustification =
                dIdx === 0 ? 'AG ATENDIMENTO' : delay.justification;

              return (
                <div key={dIdx} className="delay-row">
                  <select
                    value={currentJustification}
                    disabled={dIdx === 0}
                    onChange={(e) => {
                      if (dIdx > 0) {
                        const updated = [...item.delays];
                        updated[dIdx] = {
                          ...updated[dIdx],
                          justification: e.target.value,
                        };
                        update(index, { delays: updated });
                      }
                    }}
                    title={
                      dIdx === 0
                        ? 'O primeiro atraso é sempre AG ATENDIMENTO (Aguardando Atendimento)'
                        : 'Selecione a justificativa do atraso'
                    }
                    style={
                      dIdx === 0
                        ? {
                            background: '#f1f5f9',
                            color: '#1e293b',
                            fontWeight: 600,
                            cursor: 'not-allowed',
                          }
                        : {}
                    }
                  >
                    {dIdx === 0 ? (
                      <option value="AG ATENDIMENTO">🕘 AG ATENDIMENTO</option>
                    ) : (
                      <>
                        <option value="">Selecione a justificativa</option>
                        {delayJustifications.map((j) => (
                          <option key={j} value={j}>
                            {j.startsWith('EXEC') ? '🔧 ' : '🕘 '}
                            {j}
                          </option>
                        ))}
                      </>
                    )}
                  </select>
                  <input
                    type="datetime-local"
                    value={inheritedStart}
                    disabled={true}
                    placeholder="Início"
                    title={
                      dIdx === 0
                        ? 'Início automático: Horário Início MineStar'
                        : `Início automático: término do atraso anterior (${item.delays[dIdx - 1]?.endTime || 'aguardando fim'})`
                    }
                    style={{
                      background: '#f1f5f9',
                      color: '#64748b',
                      cursor: 'not-allowed',
                    }}
                  />
                  <input
                    type="datetime-local"
                    value={delay.endTime || ''}
                    disabled={item.status !== 'Liberado'}
                    onChange={(e) => {
                      const newEndTime = e.target.value;
                      const updated = [...item.delays];
                      updated[dIdx] = {
                        ...updated[dIdx],
                        justification:
                          dIdx === 0 ? 'AG ATENDIMENTO' : delay.justification,
                        startTime:
                          dIdx === 0
                            ? item.startTime || ''
                            : updated[dIdx].startTime || '',
                        endTime: newEndTime,
                      };
                      // O próximo atraso sempre começa quando o atual termina:
                      if (dIdx + 1 < updated.length) {
                        updated[dIdx + 1] = {
                          ...updated[dIdx + 1],
                          startTime: newEndTime,
                        };
                      }
                      const changes = { delays: updated };
                      // O Horário Fim Technician sempre acompanha o fim do último subcódigo filho:
                      const isLastDelay = dIdx === updated.length - 1;
                      if (isLastDelay) {
                        changes.endTime = newEndTime;
                      }
                      update(index, changes);
                    }}
                    placeholder="Fim"
                    title={
                      item.status !== 'Liberado'
                        ? "Bloqueado: selecione o Status Final como 'Liberado' para preencher o fim do atraso"
                        : 'Horário Fim do Atraso'
                    }
                    style={
                      item.status !== 'Liberado'
                        ? {
                            background: '#f1f5f9',
                            color: '#94a3b8',
                            cursor: 'not-allowed',
                          }
                        : {}
                    }
                  />
                  <button
                    type="button"
                    className="remove"
                    title="Remover justificativa"
                    onClick={() => {
                      const updated = item.delays.filter((_, i) => i !== dIdx);
                      const changes = { delays: updated };
                      if (updated.length > 0) {
                        // Se removeu o primeiro, o novo primeiro vira AG ATENDIMENTO iniciando no Início MineStar
                        if (dIdx === 0) {
                          updated[0] = {
                            ...updated[0],
                            justification: 'AG ATENDIMENTO',
                            startTime: item.startTime || '',
                          };
                        } else if (dIdx < updated.length) {
                          updated[dIdx] = {
                            ...updated[dIdx],
                            startTime: updated[dIdx - 1]?.endTime || '',
                          };
                        }
                        // Atualiza o Fim Technician com o novo último atraso:
                        const lastDelay = updated[updated.length - 1];
                        if (lastDelay?.endTime) {
                          changes.endTime = lastDelay.endTime;
                          changes.status = 'Liberado';
                        }
                      }
                      update(index, changes);
                    }}
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <div className="grid five">
        <SelectField
          label="1. Sistema"
          value={item.system}
          values={systems}
          onChange={(value) => change('system', value)}
        />
        <SelectField
          label="2. Conjunto"
          value={item.component}
          values={branch.components}
          onChange={(value) => change('component', value)}
          disabled={!item.system}
        />
        <SelectField
          label="3. Item"
          value={item.subcomponent}
          values={branch.subcomponents}
          onChange={(value) => change('subcomponent', value)}
          disabled={!item.component}
        />
        <SelectField
          label="4. Problema"
          value={item.cause}
          values={branch.causes}
          onChange={(value) => change('cause', value)}
          disabled={!item.subcomponent}
        />
        <SelectField
          label="5. Solução"
          value={item.faultSolution}
          values={branch.solutions}
          onChange={(value) => update(index, { faultSolution: value })}
          disabled={!item.cause}
        />
      </div>
      <Field
        label="Causa operacional (detalhes do sintoma / falha)"
        type="textarea"
        value={item.operationalCause || ''}
        onChange={(value) => update(index, { operationalCause: value })}
        placeholder="Ex.: Evento ativo de taxa de atualização anormal do sensor de medição inercial traseiro"
      />
      <div className="grid two">
        <Field
          label="Diagnóstico executado"
          type="textarea"
          value={item.diagnosis}
          onChange={(value) => update(index, { diagnosis: value })}
          placeholder="Verificações e testes realizados"
        />
        <Field
          label="Solução aplicada / Continuação"
          type="textarea"
          value={item.solution}
          onChange={(value) => update(index, { solution: value })}
          placeholder="Serviço realizado"
        />
      </div>
      <div className="status-grid">
        {statuses.map((status) => (
          <label className="status-option" key={status}>
            <input
              type="radio"
              name={`status-${index}`}
              checked={item.status === status}
              onChange={() => {
                const changes = { status };
                const currentDelays = item.delays || [];

                if (status === 'Liberado') {
                  const nowStr = getLocalDatetimeString();
                  const finalTime =
                    item.endTime && item.endTime.trim() ? item.endTime : nowStr;
                  changes.endTime = finalTime;

                  if (currentDelays.length > 0) {
                    const updated = [...currentDelays];
                    const lastIdx = updated.length - 1;
                    if (
                      !updated[lastIdx].endTime ||
                      !updated[lastIdx].endTime.trim()
                    ) {
                      updated[lastIdx] = {
                        ...updated[lastIdx],
                        endTime: finalTime,
                      };
                      changes.delays = updated;
                    }
                  }
                } else {
                  // Regra: se o equipamento estiver com status em manutenção (ou não liberado),
                  // o horário fim do equipamento fica em branco,
                  // e o último atraso também fica em branco pois continua em aberto!
                  changes.endTime = '';
                  if (currentDelays.length > 0) {
                    const updated = [...currentDelays];
                    const lastIdx = updated.length - 1;
                    updated[lastIdx] = {
                      ...updated[lastIdx],
                      endTime: '',
                    };
                    changes.delays = updated;
                  }
                }
                update(index, changes);
              }}
            />
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
  const path = (item) =>
    [
      item.system,
      item.component,
      item.subcomponent,
      item.cause,
      item.faultSolution,
    ]
      .filter(Boolean)
      .join(' > ') || 'Não informada';
  const fleetSummary = getFleetSummary(stopped, operating, appointments);

  const makeReport = () => {
    const greeting = getGreeting();
    const appointmentText = appointments
      .map((item) => {
        const assetFormatted = formatCA(item.asset) || 'Ativo não informado';
        const timeLine =
          item.startTime && item.endTime
            ? `\n⏰ Horário: ${formatDateTimeWhatsApp(item.startTime)} às ${formatDateTimeWhatsApp(item.endTime)}`
            : item.startTime
              ? `\n⏰ Início MineStar: ${formatDateTimeWhatsApp(item.startTime)}`
              : item.endTime
                ? `\n⏰ Fim: ${formatDateTimeWhatsApp(item.endTime)}`
                : '';

        const causeLine = item.operationalCause
          ? `\n\n⚠️ CAUSA\n${item.operationalCause}`
          : '';

        const delaysList = (item.delays || [])
          .map((d, dIdx) => ({
            ...d,
            justification:
              dIdx === 0
                ? d.justification || 'AG ATENDIMENTO'
                : d.justification,
          }))
          .filter((d) => d.justification);
        const delaysBlock =
          delaysList.length > 0
            ? `\n\n⏳ JUSTIFICATIVAS DE ATRASO:\n` +
              delaysList
                .map((d, dIdx) => {
                  const { effectiveStart, effectiveEnd } = getDelayTimes(
                    delaysList,
                    dIdx,
                    item.startTime,
                  );

                  const timeText =
                    effectiveStart && effectiveEnd
                      ? ` (${formatDateTimeWhatsApp(effectiveStart)} às ${formatDateTimeWhatsApp(effectiveEnd)})`
                      : effectiveStart
                        ? ` (Início: ${formatDateTimeWhatsApp(effectiveStart)})`
                        : effectiveEnd
                          ? ` (Fim: ${formatDateTimeWhatsApp(effectiveEnd)})`
                          : '';
                  const icon = d.justification.startsWith('EXEC') ? '🔧' : '🕘';
                  return `${icon} ${d.justification}${timeText}`;
                })
                .join('\n')
            : '';

        const effectiveStatus =
          item.endTime &&
          item.endTime.trim() &&
          item.status === 'Aguardando recurso'
            ? 'Liberado'
            : item.status || 'Liberado';

        return `${getCodeEmoji(item.code)} ${assetFormatted} | ${item.code}${timeLine}${delaysBlock}\n\n${emoji.cross} CLASSE DA FALHA\n${path(item)}${causeLine}\n\n${emoji.tools} DIAGNÓSTICO EXECUTADO\n${item.diagnosis || 'Não informado'}\n\n${emoji.check} SOLUÇÃO APLICADA\n${item.solution || 'Não informada'}\n\n${emoji.pin} STATUS FINAL: ${effectiveStatus}`;
      })
      .join('\n\n____________________________________\n\n');

    const conclusionBlock = conclusion.trim()
      ? `\n\n____________________________________\n\n📝 OBSERVAÇÕES / CONCLUSÃO\n${conclusion.trim()}`
      : '';

    const stoppedList = stopped.filter((item) => item.asset.trim());
    const stoppedText =
      stoppedList.length > 0
        ? stoppedList
            .map((item) => {
              const codeName = (item.code || '').split('–')[0].trim();
              const subCodeText = item.subCode
                ? ` - ${item.subCode}`
                : ' - EXEC MANUT';
              const line1 = `${getCodeEmoji(item.code)} ${formatCA(item.asset)} – ${codeName}${subCodeText}`;
              const timeFormatted = item.startTime
                ? formatDateTimeWhatsApp(item.startTime)
                : 'Não informado';
              const line2 = `INÍCIO: ${timeFormatted}`;
              const reasonText =
                item.reason || item.discipline || 'Não informado';
              const line3 = `MOTIVO: ${reasonText}`;
              return `${line1}\n\n${line2}\n${line3}`;
            })
            .join('\n\n')
        : 'Nenhum equipamento informado';

    const operatingList = operating.filter((item) => item.asset.trim());
    const operatingText =
      operatingList.length > 0
        ? operatingList
            .map((item) => `🟢 ${formatCA(item.asset)} | Operando autônomo`)
            .join('\n')
        : 'Nenhum equipamento informado';

    const summary = getFleetSummary(stopped, operating, appointments);
    const summaryText = `\n\n____________________________________\n\n📊 RESUMO DA FROTA (DISPONIBILIDADE OPERACIONAL)\nTotal da Frota: ${summary.totalTrucks} caminhões\n🟢 Operando Autônomo: ${summary.totalAuto} (${summary.percTotalAuto})\n🔴 Em Manutenção: ${summary.totalMaint} (${summary.percTotalMaint})\n\n🚚 Visão por Frota:\n• CAT 797F : 🔴 ${summary.count797F_Maint} manutenção (${summary.perc797F_Maint})\n• CAT 794 AC : 🔴 ${summary.count794AC_Maint} manutenção (${summary.perc794AC_Maint})`;

    const stoppedSection =
      stoppedList.length > 0
        ? `🚚 EQUIPAMENTOS PARADOS\n\nDESCRIÇÃO EM MANUTENÇÃO\n\n${stoppedText}`
        : `🚚 EQUIPAMENTOS PARADOS\n${stoppedText}`;

    const appointmentsSection = appointmentText
      ? `ATENDIMENTO DOS ATIVOS EM MANUTENÇÃO\n\n${appointmentText}`
      : `ATENDIMENTO DOS ATIVOS EM MANUTENÇÃO\n\nNenhum atendimento registrado no turno`;

    return `${greeting}\n\n${emoji.clipboard} RELATÓRIO DE TURNO – MANUTENÇÃO CORRETIVA\n🏢 Local: ${workshop || 'Oficina N4WN'}\n\n${emoji.calendar} Data: ${dateText}\n${emoji.clock} Turno: ${shift}\n${emoji.worker} Turma: ${team || 'Não informado'}\n${emoji.compass} Supervisor: ${supervisor || 'Não informado'}\n${emoji.mechanic} Executantes:\n${executors || 'Não informado'}\n\n____________________________________\n\n${appointmentsSection}${conclusionBlock}\n\n____________________________________\n\n${stoppedSection}\n\n____________________________________\n\n🚚 EQUIPAMENTOS OPERANDO AUTÔNOMO\n${operatingText}${summaryText}`;
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

  const clear = () => {
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

  const downloadCsv = () => {
    const removeEmojis = (str = '') =>
      String(str || '')
        .replace(
          /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{2300}-\u{23FF}\u{2B50}\u{200D}\u{FE0F}]/gu,
          '',
        )
        .trim();

    const rows = [];

    // 1. DADOS DO TURNO
    rows.push(['DADOS DO TURNO']);
    rows.push([
      'Data',
      'Turno',
      'Turma',
      'Oficina / Local',
      'Supervisor',
      'Executantes',
    ]);
    rows.push([
      dateText,
      shift,
      team || 'Não informado',
      workshop || 'Oficina N4WN',
      supervisor || 'Não informado',
      executors ? executors.replace(/\r?\n/g, ' | ') : 'Não informado',
    ]);
    rows.push([]);

    // 2. ATENDIMENTOS DOS ATIVOS EM MANUTENÇÃO
    rows.push(['ATENDIMENTOS DOS ATIVOS EM MANUTENÇÃO']);
    rows.push([
      'Item',
      'Ativo',
      'Código',
      'Horário Início Atendimento',
      'Horário Fim Atendimento',
      'Tipo de Atraso',
      'Justificativa do Atraso',
      'Horário Início Atraso',
      'Horário Fim Atraso',
      'Sistema',
      'Conjunto',
      'Item (Falha)',
      'Problema',
      'Solução',
      'Causa Operacional',
      'Diagnóstico Executado',
      'Solução Aplicada',
      'Status Final',
    ]);

    appointments.forEach((item, idx) => {
      const effectiveStatus =
        item.endTime &&
        item.endTime.trim() &&
        item.status === 'Aguardando recurso'
          ? 'Liberado'
          : item.status || 'Liberado';

      const delaysList = (item.delays || [])
        .map((d, dIdx) => ({
          ...d,
          justification:
            dIdx === 0 ? d.justification || 'AG ATENDIMENTO' : d.justification,
        }))
        .filter((d) => d.justification);

      if (delaysList.length === 0) {
        rows.push([
          String(idx + 1),
          formatCA(item.asset) || 'Ativo não informado',
          item.code || '',
          item.startTime || '',
          item.endTime || '',
          'Principal (Mãe)',
          'AG ATENDIMENTO',
          item.startTime || '',
          item.endTime || '',
          item.system || '',
          item.component || '',
          item.subcomponent || '',
          item.cause || '',
          item.faultSolution || '',
          item.operationalCause || '',
          item.diagnosis || '',
          item.solution || '',
          effectiveStatus,
        ]);
      } else {
        delaysList.forEach((d, dIdx) => {
          const { effectiveStart, effectiveEnd } = getDelayTimes(
            delaysList,
            dIdx,
            item.startTime,
          );
          const tipoAtraso =
            dIdx === 0 ? 'Principal (Mãe)' : 'Subsequente (Filho)';

          rows.push([
            String(idx + 1),
            formatCA(item.asset) || 'Ativo não informado',
            item.code || '',
            item.startTime || '',
            item.endTime || '',
            tipoAtraso,
            d.justification,
            effectiveStart,
            effectiveEnd,
            item.system || '',
            item.component || '',
            item.subcomponent || '',
            item.cause || '',
            item.faultSolution || '',
            item.operationalCause || '',
            item.diagnosis || '',
            item.solution || '',
            effectiveStatus,
          ]);
        });
      }
    });

    // 3. EQUIPAMENTOS PARADOS
    const stoppedList = stopped.filter((item) => item.asset.trim());
    rows.push([]);
    rows.push(['EQUIPAMENTOS PARADOS (DESCRIÇÃO EM MANUTENÇÃO)']);
    rows.push([
      'Ativo',
      'Código',
      'Subcódigo / Evento',
      'Início da Parada',
      'Motivo / Descrição',
    ]);
    if (stoppedList.length === 0) {
      rows.push(['Nenhum equipamento parado informado']);
    } else {
      stoppedList.forEach((s) => {
        rows.push([
          formatCA(s.asset),
          s.code || '',
          s.subCode || 'EXEC MANUT',
          s.startTime || '',
          s.reason || s.discipline || '',
        ]);
      });
    }

    const csvContent =
      '\uFEFF' +
      rows
        .map((row) =>
          row
            .map((cell) => {
              const cleanCell = removeEmojis(String(cell ?? ''));
              return `"${cleanCell.replace(/"/g, '""')}"`;
            })
            .join(';'),
        )
        .join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const fileDate = date ? date.replace(/-/g, '') : 'turno';
    link.setAttribute('download', `relatorio_turno_ahs_${fileDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <main className="page">
      <header className="hero">
        <div>
          <p className="eyebrow">Manutenção corretiva</p>
          <h1>Relatório de turno</h1>
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
        <section>
          <h2>Dados do turno</h2>
          <div className="grid four">
            <Field label="Data" type="date" value={date} onChange={setDate} />
            <SelectField
              label="Turno"
              value={shift}
              values={['06:00 às 18:00', '18:00 às 06:00']}
              onChange={setShift}
            />
            <SelectField
              label="Turma"
              value={team}
              values={teams}
              onChange={setTeam}
            />
            <Field
              label="Oficina / Local"
              value={workshop}
              onChange={setWorkshop}
              placeholder="Ex.: Oficina N4WN"
            />
          </div>
          <div className="grid two">
            <Field
              label="Supervisor"
              value={supervisor}
              onChange={setSupervisor}
              placeholder="Nome do supervisor"
            />
            <Field
              label="Executantes"
              type="textarea"
              value={executors}
              onChange={setExecutors}
              placeholder="Um nome por linha"
            />
          </div>
        </section>
        <section>
          <div className="section-title">
            <h2>Ativos em manutenção</h2>
            <button
              type="button"
              className="small primary"
              onClick={() =>
                setAppointments((items) => [...items, blankAppointment()])
              }
            >
              + Adicionar atendimento
            </button>
          </div>
          <p className="hint">
            Adicione um atendimento quando houver equipamento trabalhado no
            turno.
          </p>
          {appointments.length === 0 ? (
            <p
              style={{
                color: '#64748b',
                fontStyle: 'italic',
                margin: '14px 0',
                padding: '12px 14px',
                background: '#f8fafc',
                borderRadius: '8px',
                border: '1px dashed #cbd5e1',
              }}
            >
              Nenhum atendimento registrado no momento. Clique no botão acima
              para adicionar um atendimento.
            </p>
          ) : (
            appointments.map((item, index) => (
              <Appointment
                key={index}
                item={item}
                index={index}
                total={appointments.length}
                update={updateAppointment}
                remove={(removeIndex) =>
                  setAppointments((items) =>
                    items.filter((_, itemIndex) => itemIndex !== removeIndex),
                  )
                }
              />
            ))
          )}
        </section>
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
        <section>
          <div className="section-title">
            <h2>🚚 Equipamentos parados</h2>
            <button
              type="button"
              className="small primary"
              onClick={() =>
                setStopped((items) => [
                  ...items,
                  {
                    asset: '',
                    code: codes[0],
                    subCode: 'EXEC MANUT',
                    startTime: '',
                    reason: '',
                  },
                ])
              }
            >
              + Adicionar equipamento
            </button>
          </div>
          {stopped.map((item, index) => (
            <div className="stopped-row" key={index}>
              <select
                value={formatCA(item.asset)}
                onChange={(event) =>
                  setStopped((items) =>
                    items.map((entry, entryIndex) =>
                      entryIndex === index
                        ? { ...entry, asset: event.target.value }
                        : entry,
                    ),
                  )
                }
              >
                <option value="">Selecione o equipamento</option>
                {(item.asset && !fleetEquipments.includes(formatCA(item.asset))
                  ? [formatCA(item.asset), ...fleetEquipments]
                  : fleetEquipments
                ).map((eq) => (
                  <option key={eq} value={eq}>
                    {getTag(eq)}
                  </option>
                ))}
              </select>
              <select
                value={item.code}
                onChange={(event) =>
                  setStopped((items) =>
                    items.map((entry, entryIndex) =>
                      entryIndex === index
                        ? { ...entry, code: event.target.value }
                        : entry,
                    ),
                  )
                }
              >
                {codes.map((code) => (
                  <option key={code} value={code}>
                    {getCodeEmoji(code)} {code}
                  </option>
                ))}
              </select>
              <select
                value={item.subCode || 'EXEC MANUT'}
                onChange={(event) =>
                  setStopped((items) =>
                    items.map((entry, entryIndex) =>
                      entryIndex === index
                        ? { ...entry, subCode: event.target.value }
                        : entry,
                    ),
                  )
                }
                title="Subcódigo / Evento da Manutenção"
              >
                {delayJustifications.map((j) => (
                  <option key={j} value={j}>
                    {j.startsWith('EXEC') ? '🔧 ' : '🕘 '}
                    {j}
                  </option>
                ))}
              </select>
              <input
                type="datetime-local"
                value={item.startTime || ''}
                onChange={(event) =>
                  setStopped((items) =>
                    items.map((entry, entryIndex) =>
                      entryIndex === index
                        ? { ...entry, startTime: event.target.value }
                        : entry,
                    ),
                  )
                }
                title="Data e hora de início da parada"
                placeholder="Início"
              />
              <input
                type="text"
                value={item.reason || item.discipline || ''}
                onChange={(event) =>
                  setStopped((items) =>
                    items.map((entry, entryIndex) =>
                      entryIndex === index
                        ? { ...entry, reason: event.target.value }
                        : entry,
                    ),
                  )
                }
                placeholder="Motivo da parada / breve descrição (Ex.: Falha E1651...)"
                title="Motivo / Breve descrição"
              />
              <button
                type="button"
                className="remove"
                onClick={() =>
                  setStopped((items) =>
                    items.filter((_, itemIndex) => itemIndex !== index),
                  )
                }
              >
                ×
              </button>
            </div>
          ))}
        </section>
        <section>
          <div className="section-title">
            <h2>🚚 Equipamentos operando autônomo</h2>
            <span
              className="auto-save-pill"
              style={{
                background: '#e8f5e9',
                color: '#1b5e20',
                borderColor: '#c8e6c9',
              }}
            >
              🟢 {operating.length} Caminhões Autônomo
            </span>
          </div>
          <p className="hint">
            Todos os 23 caminhões operam em modo autônomo por padrão. Ao incluir
            um caminhão em <strong>Equipamentos parados</strong> ou em
            atendimento com manutenção ativa, ele sai automaticamente da rota
            autônoma e passa para manutenção.
          </p>
          {operating.length > 0 ? (
            <div className="operating-chips-grid">
              {operating.map((item) => (
                <div key={item.asset} className="operating-chip">
                  <span>🟢</span>
                  <strong>{item.asset}</strong>
                </div>
              ))}
            </div>
          ) : (
            <p
              style={{ color: '#888', fontStyle: 'italic', marginTop: '10px' }}
            >
              Nenhum caminhão operando autônomo no momento (toda a frota está em
              manutenção).
            </p>
          )}
        </section>
        <section className="summary-section">
          <h2>📊 Resumo da Frota</h2>
          <div className="summary-cards">
            <div className="summary-card total">
              <span className="summary-label">Total da Frota</span>
              <span className="summary-value">{fleetSummary.totalTrucks}</span>
              <span className="summary-sub">caminhões monitorados</span>
              <div className="summary-split" style={{ marginTop: '10px' }}>
                <div className="fleet-sub-stat" style={{ color: '#4ade80' }}>
                  <span>🟢 {fleetSummary.totalAuto} Operando</span>
                  <strong>{fleetSummary.percTotalAuto}</strong>
                </div>
                <div className="fleet-sub-stat" style={{ color: '#f87171' }}>
                  <span>🔴 {fleetSummary.totalMaint} Manutenção</span>
                  <strong>{fleetSummary.percTotalMaint}</strong>
                </div>
              </div>
              <div className="fleet-progress-bar">
                <div
                  className="fleet-progress-auto"
                  style={{ width: `${fleetSummary.numPercTotalAuto}%` }}
                />
                <div
                  className="fleet-progress-maint"
                  style={{ width: `${fleetSummary.numPercTotalMaint}%` }}
                />
              </div>
            </div>
            <div className="summary-card">
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                }}
              >
                <span className="summary-label">CAT 797F (CA55xx)</span>
                <span
                  style={{
                    fontSize: '0.78rem',
                    color: '#64748b',
                    fontWeight: 700,
                  }}
                >
                  {fleetSummary.total797F} cam.
                </span>
              </div>
              <div className="summary-split">
                <div className="fleet-sub-stat">
                  <span className="auto">
                    🟢 {fleetSummary.count797F_Auto} Operando
                  </span>
                  <strong className="auto">{fleetSummary.perc797F_Auto}</strong>
                </div>
                <div className="fleet-sub-stat">
                  <span className="maint">
                    🔴 {fleetSummary.count797F_Maint} Manutenção
                  </span>
                  <strong className="maint">
                    {fleetSummary.perc797F_Maint}
                  </strong>
                </div>
              </div>
              <div className="fleet-progress-bar">
                <div
                  className="fleet-progress-auto"
                  style={{ width: `${fleetSummary.numPerc797F_Auto}%` }}
                />
                <div
                  className="fleet-progress-maint"
                  style={{ width: `${fleetSummary.numPerc797F_Maint}%` }}
                />
              </div>
            </div>
            <div className="summary-card">
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                }}
              >
                <span className="summary-label">CAT 794 AC (CA57xx)</span>
                <span
                  style={{
                    fontSize: '0.78rem',
                    color: '#64748b',
                    fontWeight: 700,
                  }}
                >
                  {fleetSummary.total794AC} cam.
                </span>
              </div>
              <div className="summary-split">
                <div className="fleet-sub-stat">
                  <span className="auto">
                    🟢 {fleetSummary.count794AC_Auto} Operando
                  </span>
                  <strong className="auto">
                    {fleetSummary.perc794AC_Auto}
                  </strong>
                </div>
                <div className="fleet-sub-stat">
                  <span className="maint">
                    🔴 {fleetSummary.count794AC_Maint} Manutenção
                  </span>
                  <strong className="maint">
                    {fleetSummary.perc794AC_Maint}
                  </strong>
                </div>
              </div>
              <div className="fleet-progress-bar">
                <div
                  className="fleet-progress-auto"
                  style={{ width: `${fleetSummary.numPerc794AC_Auto}%` }}
                />
                <div
                  className="fleet-progress-maint"
                  style={{ width: `${fleetSummary.numPerc794AC_Maint}%` }}
                />
              </div>
            </div>
          </div>
        </section>
        <div className="actions">
          <span className="auto-save-pill">💾 Rascunho salvo</span>
          <div className="btn-group">
            <button type="button" className="secondary" onClick={clear}>
              Limpar
            </button>
            <button type="button" className="outline" onClick={downloadCsv}>
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
      {report && (
        <section className="card preview">
          <div className="preview-heading">
            <div>
              <p className="eyebrow">Saída WhatsApp</p>
              <h2>Mensagem do relatório</h2>
            </div>
            <button
              type="button"
              className="close"
              onClick={() => setReport('')}
            >
              ×
            </button>
          </div>
          <pre>{report}</pre>
          <div className="preview-actions">
            <button type="button" className="outline" onClick={downloadCsv}>
              Baixar CSV
            </button>
            <button
              type="button"
              className="outline"
              onClick={() => navigator.clipboard.writeText(report)}
            >
              Copiar mensagem
            </button>
            <button
              type="button"
              className="primary"
              onClick={() =>
                window.open(
                  `https://api.whatsapp.com/send?text=${encodeURIComponent(report)}`,
                  '_blank',
                  'noopener,noreferrer',
                )
              }
            >
              Abrir no WhatsApp
            </button>
          </div>
        </section>
      )}
      {showPdfModal && (
        <div
          className="modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowPdfModal(false);
          }}
        >
          <div className="modal-container">
            <div className="modal-toolbar no-print">
              <div>
                <h2>Ficha de Turno Oficial Sotreq CAT</h2>
                <p>Layout padronizado para impressão e download em PDF.</p>
              </div>
              <div className="btn-group">
                <button
                  type="button"
                  className="primary"
                  onClick={() => window.print()}
                >
                  🖨️ Imprimir / Salvar em PDF
                </button>
                <button
                  type="button"
                  className="secondary"
                  onClick={() => setShowPdfModal(false)}
                >
                  ✕ Fechar
                </button>
              </div>
            </div>
            <div className="modal-content">
              <article className="pdf-sheet">
                <div className="pdf-border-frame">
                  <header className="pdf-header">
                    <div>
                      <h1 className="pdf-title">
                        RELATÓRIO DE TURNO – MANUTENÇÃO CORRETIVA
                      </h1>
                      <p className="pdf-subtitle">
                        {workshop || 'Oficina N4WN'}
                      </p>
                    </div>
                    <div className="pdf-brand">
                      <img
                        src="/logo-sotreq.png"
                        alt="Sotreq CAT"
                        className="pdf-logo"
                      />
                    </div>
                  </header>

                  <table className="pdf-table shift-table">
                    <tbody>
                      <tr>
                        <td className="pdf-th">📅 Data:</td>
                        <td>
                          <strong>{dateText}</strong>
                        </td>
                        <td className="pdf-th">🕒 Turno:</td>
                        <td>
                          <strong>{shift}</strong>
                        </td>
                      </tr>
                      <tr>
                        <td className="pdf-th">👥 Turma:</td>
                        <td>
                          <strong>{team || 'Não informada'}</strong>
                        </td>
                        <td className="pdf-th">🏢 Oficina / Local:</td>
                        <td>
                          <strong>{workshop || 'Oficina N4WN'}</strong>
                        </td>
                      </tr>
                      <tr>
                        <td className="pdf-th">👤 Supervisor:</td>
                        <td colSpan={3}>
                          <strong>{supervisor || 'Não informado'}</strong>
                        </td>
                      </tr>
                      <tr>
                        <td className="pdf-th">👨‍🔧 Executantes:</td>
                        <td colSpan={3} className="pdf-pre-wrap">
                          {executors || 'Não informado'}
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  <div className="pdf-yellow-bar">
                    ATENDIMENTO DOS ATIVOS EM MANUTENÇÃO
                  </div>

                  {appointments.length === 0 ? (
                    <div
                      style={{
                        padding: '12px 14px',
                        color: '#64748b',
                        fontStyle: 'italic',
                        fontSize: '0.82rem',
                        border: '1px solid #cbd5e1',
                        borderRadius: '4px',
                        marginBottom: '14px',
                        textAlign: 'center',
                      }}
                    >
                      Nenhum atendimento registrado no turno
                    </div>
                  ) : (
                    appointments.map((item, idx) => (
                      <div className="pdf-appointment-box" key={idx}>
                        <div className="pdf-asset-subbar">
                          <div className="pdf-asset-tag">
                            {getCodeEmoji(item.code)}{' '}
                            <strong>
                              {formatCA(item.asset) || 'Ativo não informado'}
                            </strong>
                            {(item.startTime || item.endTime) && (
                              <span className="pdf-time">
                                ⏰{' '}
                                {item.startTime && item.endTime
                                  ? `${formatDateTimeWhatsApp(item.startTime)} às ${formatDateTimeWhatsApp(item.endTime)}`
                                  : item.startTime
                                    ? `Início: ${formatDateTimeWhatsApp(item.startTime)}`
                                    : `Fim: ${formatDateTimeWhatsApp(item.endTime)}`}
                              </span>
                            )}
                          </div>
                          <div className="pdf-asset-code">
                            <span
                              className="pdf-badge"
                              style={{
                                background: '#f8fafc',
                                border: '1px solid #cbd5e1',
                              }}
                            >
                              <strong>{item.code}</strong>
                            </span>
                          </div>
                        </div>

                        {item.delays &&
                          item.delays.filter((d) => d.justification).length >
                            0 && (
                            <div className="pdf-delays-box">
                              <div className="pdf-delays-header">
                                🕘{' '}
                                <strong>
                                  Justificativas de Atraso / Eventos:
                                </strong>
                              </div>
                              <div className="pdf-delays-list">
                                {(() => {
                                  const delaysList = (item.delays || [])
                                    .map((d, dIdx) => ({
                                      ...d,
                                      justification:
                                        dIdx === 0
                                          ? d.justification || 'AG ATENDIMENTO'
                                          : d.justification,
                                    }))
                                    .filter((d) => d.justification);
                                  return delaysList.map((d, dIdx) => {
                                    const { effectiveStart, effectiveEnd } =
                                      getDelayTimes(
                                        delaysList,
                                        dIdx,
                                        item.startTime,
                                      );
                                    const tStr =
                                      effectiveStart && effectiveEnd
                                        ? `${formatDateTimeWhatsApp(effectiveStart)} às ${formatDateTimeWhatsApp(effectiveEnd)}`
                                        : effectiveStart
                                          ? `Início: ${formatDateTimeWhatsApp(effectiveStart)}`
                                          : effectiveEnd
                                            ? `Fim: ${formatDateTimeWhatsApp(effectiveEnd)}`
                                            : '';
                                    const icon = d.justification.startsWith(
                                      'EXEC',
                                    )
                                      ? '🔧'
                                      : '🕘';
                                    return (
                                      <div
                                        key={dIdx}
                                        className="pdf-delay-row-item"
                                      >
                                        <span className="pdf-delay-name">
                                          {icon}{' '}
                                          <strong>{d.justification}</strong>
                                        </span>
                                        {tStr && (
                                          <span className="pdf-delay-time">
                                            ⏰ {tStr}
                                          </span>
                                        )}
                                      </div>
                                    );
                                  });
                                })()}
                              </div>
                            </div>
                          )}

                        <div className="pdf-grid-two">
                          <div className="pdf-box">
                            <div className="pdf-box-header">
                              ❌ CLASSE DA FALHA
                            </div>
                            <div className="pdf-box-content">
                              {[
                                item.system,
                                item.component,
                                item.subcomponent,
                                item.cause,
                                item.faultSolution,
                              ]
                                .filter(Boolean)
                                .map((lvl, lIdx) => (
                                  <div key={lIdx} className="pdf-fault-level">
                                    {lvl}
                                  </div>
                                ))}
                              {![
                                item.system,
                                item.component,
                                item.subcomponent,
                                item.cause,
                                item.faultSolution,
                              ].some(Boolean) && (
                                <span style={{ color: '#888' }}>
                                  Não informada
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="pdf-box">
                            <div className="pdf-box-header">⚠️ CAUSA</div>
                            <div className="pdf-box-content pdf-pre-wrap">
                              {item.operationalCause ||
                                item.cause ||
                                'Não informada'}
                            </div>
                          </div>
                        </div>

                        <div className="pdf-grid-two">
                          <div className="pdf-box">
                            <div className="pdf-box-header">
                              🔍 SOLUÇÃO / DIAGNÓSTICO EXECUTADO
                            </div>
                            <div className="pdf-box-content pdf-pre-wrap">
                              {item.diagnosis || 'Não informado'}
                            </div>
                          </div>
                          <div className="pdf-box">
                            <div className="pdf-box-header">
                              🔧 CONTINUAÇÃO DO DIAGNÓSTICO / SOLUÇÃO APLICADA
                            </div>
                            <div className="pdf-box-content pdf-pre-wrap">
                              {item.solution || 'Não informada'}
                            </div>
                          </div>
                        </div>

                        {(() => {
                          const effectiveStatus =
                            item.endTime &&
                            item.endTime.trim() &&
                            item.status === 'Aguardando recurso'
                              ? 'Liberado'
                              : item.status || 'Liberado';
                          return (
                            <div className="pdf-status-row">
                              <span>
                                📌 <strong>STATUS FINAL:</strong>
                              </span>
                              {statuses.map((st) => {
                                const isChecked = effectiveStatus === st;
                                return (
                                  <span
                                    key={st}
                                    className={`pdf-status-opt ${isChecked ? 'checked' : ''} ${isChecked && st === 'Liberado' ? 'liberado' : ''}`}
                                  >
                                    ({isChecked ? 'X' : ' '}) {st}
                                  </span>
                                );
                              })}
                            </div>
                          );
                        })()}
                      </div>
                    ))
                  )}

                  {conclusion && (
                    <div className="pdf-section-block">
                      <div className="pdf-gray-bar">
                        📄 OBSERVAÇÕES / CONCLUSÃO
                      </div>
                      <div className="pdf-section-content pdf-pre-wrap">
                        {conclusion}
                      </div>
                    </div>
                  )}

                  <div className="pdf-section-block">
                    <div className="pdf-gray-bar">
                      🚚 EQUIPAMENTOS PARADOS (DESCRIÇÃO EM MANUTENÇÃO)
                    </div>
                    <table className="pdf-table simple">
                      <thead>
                        <tr
                          style={{ background: '#f1f5f9', fontSize: '0.74rem' }}
                        >
                          <th
                            style={{
                              padding: '6px 10px',
                              textAlign: 'left',
                              border: '1px solid #cbd5e1',
                              width: '18%',
                            }}
                          >
                            Ativo
                          </th>
                          <th
                            style={{
                              padding: '6px 10px',
                              textAlign: 'left',
                              border: '1px solid #cbd5e1',
                              width: '25%',
                            }}
                          >
                            Código / Evento
                          </th>
                          <th
                            style={{
                              padding: '6px 10px',
                              textAlign: 'left',
                              border: '1px solid #cbd5e1',
                              width: '22%',
                            }}
                          >
                            Início da Parada
                          </th>
                          <th
                            style={{
                              padding: '6px 10px',
                              textAlign: 'left',
                              border: '1px solid #cbd5e1',
                              width: '35%',
                            }}
                          >
                            Motivo / Descrição
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {stopped
                          .filter((s) => s.asset.trim())
                          .map((s, sIdx) => {
                            const codeShort = (s.code || '')
                              .split('–')[0]
                              .trim();
                            const subCode = s.subCode || 'EXEC MANUT';
                            return (
                              <tr key={sIdx}>
                                <td style={{ fontWeight: 800 }}>
                                  {getCodeEmoji(s.code)} {formatCA(s.asset)}
                                </td>
                                <td>
                                  <strong>{codeShort}</strong> - {subCode}
                                </td>
                                <td>
                                  {s.startTime ? (
                                    formatDateTimeWhatsApp(s.startTime)
                                  ) : (
                                    <span style={{ color: '#94a3b8' }}>
                                      Não informado
                                    </span>
                                  )}
                                </td>
                                <td>
                                  {s.reason || s.discipline ? (
                                    s.reason || s.discipline
                                  ) : (
                                    <span style={{ color: '#94a3b8' }}>
                                      Não informado
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        {stopped.filter((s) => s.asset.trim()).length === 0 && (
                          <tr>
                            <td
                              colSpan={4}
                              style={{
                                color: '#888',
                                fontStyle: 'italic',
                                textAlign: 'center',
                              }}
                            >
                              Nenhum equipamento parado informado
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className="pdf-section-block">
                    <div
                      className="pdf-gray-bar"
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <span>🚚 EQUIPAMENTOS OPERANDO AUTÔNOMO</span>
                      <span
                        style={{
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          color: '#166534',
                        }}
                      >
                        🟢 {operating.length} caminhões operando autônomo
                      </span>
                    </div>
                    {operating.filter((o) => o.asset.trim()).length > 0 ? (
                      <div className="pdf-chips-grid">
                        {operating
                          .filter((o) => o.asset.trim())
                          .map((o, oIdx) => (
                            <span key={oIdx} className="pdf-operating-chip">
                              🟢 {formatCA(o.asset)}
                            </span>
                          ))}
                      </div>
                    ) : (
                      <div
                        style={{
                          padding: '8px 10px',
                          color: '#888',
                          fontStyle: 'italic',
                          fontSize: '0.78rem',
                          border: '1px solid #cbd5e1',
                          borderRadius: '4px',
                        }}
                      >
                        Nenhum equipamento operando autônomo (toda a frota está
                        em manutenção)
                      </div>
                    )}
                  </div>

                  <div className="pdf-section-block">
                    <div className="pdf-gray-bar">
                      📊 RESUMO DA FROTA & DISPONIBILIDADE OPERACIONAL
                    </div>
                    <div className="pdf-summary-cards">
                      <div className="pdf-summary-card total">
                        <span className="pdf-summary-card-title">
                          Total da Frota
                        </span>
                        <strong
                          style={{
                            fontSize: '1.15rem',
                            color: '#ffffff',
                            lineHeight: 1,
                          }}
                        >
                          {fleetSummary.totalTrucks} caminhões
                        </strong>
                        <div
                          className="pdf-summary-stat-row"
                          style={{ color: '#4ade80', marginTop: '4px' }}
                        >
                          <span>🟢 Operando:</span>
                          <span>
                            {fleetSummary.totalAuto} (
                            {fleetSummary.percTotalAuto})
                          </span>
                        </div>
                        <div
                          className="pdf-summary-stat-row"
                          style={{ color: '#f87171' }}
                        >
                          <span>🔴 Manutenção:</span>
                          <span>
                            {fleetSummary.totalMaint} (
                            {fleetSummary.percTotalMaint})
                          </span>
                        </div>
                        <div
                          className="fleet-progress-bar"
                          style={{ height: '4px', marginTop: '4px' }}
                        >
                          <div
                            className="fleet-progress-auto"
                            style={{
                              width: `${fleetSummary.numPercTotalAuto}%`,
                            }}
                          />
                          <div
                            className="fleet-progress-maint"
                            style={{
                              width: `${fleetSummary.numPercTotalMaint}%`,
                            }}
                          />
                        </div>
                      </div>

                      <div className="pdf-summary-card">
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'baseline',
                          }}
                        >
                          <span className="pdf-summary-card-title">
                            CAT 797F (CA55xx)
                          </span>
                          <span
                            style={{
                              fontSize: '0.7rem',
                              color: '#64748b',
                              fontWeight: 700,
                            }}
                          >
                            {fleetSummary.total797F} cam.
                          </span>
                        </div>
                        <div
                          className="pdf-summary-stat-row"
                          style={{ color: '#166534', marginTop: '4px' }}
                        >
                          <span>🟢 Operando:</span>
                          <span>
                            {fleetSummary.count797F_Auto} (
                            {fleetSummary.perc797F_Auto})
                          </span>
                        </div>
                        <div
                          className="pdf-summary-stat-row"
                          style={{ color: '#991b1b' }}
                        >
                          <span>🔴 Manutenção:</span>
                          <span>
                            {fleetSummary.count797F_Maint} (
                            {fleetSummary.perc797F_Maint})
                          </span>
                        </div>
                        <div
                          className="fleet-progress-bar"
                          style={{ height: '4px', marginTop: '4px' }}
                        >
                          <div
                            className="fleet-progress-auto"
                            style={{
                              width: `${fleetSummary.numPerc797F_Auto}%`,
                            }}
                          />
                          <div
                            className="fleet-progress-maint"
                            style={{
                              width: `${fleetSummary.numPerc797F_Maint}%`,
                            }}
                          />
                        </div>
                      </div>

                      <div className="pdf-summary-card">
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'baseline',
                          }}
                        >
                          <span className="pdf-summary-card-title">
                            CAT 794 AC (CA57xx)
                          </span>
                          <span
                            style={{
                              fontSize: '0.7rem',
                              color: '#64748b',
                              fontWeight: 700,
                            }}
                          >
                            {fleetSummary.total794AC} cam.
                          </span>
                        </div>
                        <div
                          className="pdf-summary-stat-row"
                          style={{ color: '#166534', marginTop: '4px' }}
                        >
                          <span>🟢 Operando:</span>
                          <span>
                            {fleetSummary.count794AC_Auto} (
                            {fleetSummary.perc794AC_Auto})
                          </span>
                        </div>
                        <div
                          className="pdf-summary-stat-row"
                          style={{ color: '#991b1b' }}
                        >
                          <span>🔴 Manutenção:</span>
                          <span>
                            {fleetSummary.count794AC_Maint} (
                            {fleetSummary.perc794AC_Maint})
                          </span>
                        </div>
                        <div
                          className="fleet-progress-bar"
                          style={{ height: '4px', marginTop: '4px' }}
                        >
                          <div
                            className="fleet-progress-auto"
                            style={{
                              width: `${fleetSummary.numPerc794AC_Auto}%`,
                            }}
                          />
                          <div
                            className="fleet-progress-maint"
                            style={{
                              width: `${fleetSummary.numPerc794AC_Maint}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <footer className="pdf-footer">
                    <div className="pdf-footer-pillars">
                      <div className="pdf-pillar">
                        <div className="pdf-pillar-icon">
                          <svg
                            width="26"
                            height="26"
                            viewBox="0 0 24 24"
                            fill="#ffcd00"
                          >
                            <path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm0 6a2 2 0 1 1 0-4 2 2 0 0 1 0 4z" />
                            <path d="M21.2 10.6l-1.8-.3c-.2-.6-.4-1.2-.7-1.7l1.1-1.5c.3-.4.2-1-.2-1.4l-1.3-1.3c-.4-.4-1-.5-1.4-.2l-1.5 1.1c-.5-.3-1.1-.5-1.7-.7l-.3-1.8C13.3 2.2 12.8 2 12 2s-1.3.2-1.4.8l-.3 1.8c-.6.2-1.2.4-1.7.7L7.1 4.2c-.4-.3-1-.2-1.4.2L4.4 5.7c-.4.4-.5 1-.2 1.4l1.1 1.5c-.3.5-.5 1.1-.7 1.7l-1.8.3C2.2 10.7 2 11.2 2 12s.2 1.3.8 1.4l1.8.3c.2.6.4 1.2.7 1.7l-1.1 1.5c-.3.4-.2 1 .2 1.4l1.3 1.3c.4.4 1 .5 1.4.2l1.5-1.1c.5.3 1.1.5 1.7.7l.3 1.8c.1.6.6.8 1.4.8s1.3-.2 1.4-.8l.3-1.8c.6-.2 1.2-.4 1.7-.7l1.5 1.1c.4.3 1 .2 1.4-.2l1.3-1.3c.4-.4.5-1 .2-1.4l-1.1-1.5c.3-.5.5-1.1.7-1.7l1.8-.3c.6-.1.8-.6.8-1.4s-.2-1.3-.8-1.4zM12 16c-2.2 0-4-1.8-4-4s1.8-4 4-4 4 1.8 4 4-1.8 4-4 4z" />
                          </svg>
                        </div>
                        <div className="pdf-pillar-text">
                          <span className="pdf-pillar-title">DISCIPLINA</span>
                          <span className="pdf-pillar-sub">
                            EM CADA DETALHE
                          </span>
                        </div>
                      </div>

                      <div className="pdf-pillar">
                        <div className="pdf-pillar-icon">
                          <svg
                            width="22"
                            height="22"
                            viewBox="0 0 24 24"
                            fill="#ffcd00"
                          >
                            <rect x="2" y="14" width="5" height="9" rx="0.5" />
                            <rect
                              x="9.5"
                              y="8"
                              width="5"
                              height="15"
                              rx="0.5"
                            />
                            <rect x="17" y="2" width="5" height="21" rx="0.5" />
                          </svg>
                        </div>
                        <div className="pdf-pillar-text">
                          <span className="pdf-pillar-title">
                            CONFIABILIDADE
                          </span>
                          <span className="pdf-pillar-sub">
                            EM CADA OPERAÇÃO
                          </span>
                        </div>
                      </div>

                      <div className="pdf-pillar">
                        <div className="pdf-pillar-icon">
                          <svg
                            width="30"
                            height="24"
                            viewBox="0 0 32 26"
                            fill="#ffcd00"
                          >
                            <circle cx="7" cy="7" r="4.5" />
                            <path d="M1 23c0-4 3.5-7 8-7 1.5 0 2.9.3 4.1 1-.8 1.6-1.1 3.4-1.1 5.5v0.5H1z" />
                            <circle cx="25" cy="7" r="4.5" />
                            <path d="M20 23v-.5c0-2.1-.3-3.9-1.1-5.5 1.2-.7 2.6-1 4.1-1 4.5 0 8 3 8 7H20z" />
                            <circle cx="16" cy="6" r="5" />
                            <path d="M8 24c0-4.5 3.5-8 8-8s8 3.5 8 8H8z" />
                          </svg>
                        </div>
                        <div className="pdf-pillar-text">
                          <span className="pdf-pillar-title">PARCERIA</span>
                          <span className="pdf-pillar-sub">
                            QUE GERA RESULTADOS
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="pdf-footer-brand-cut">
                      <img
                        src="/logo-sotreq.png"
                        alt="Sotreq CAT"
                        className="pdf-footer-logo"
                      />
                    </div>
                  </footer>
                </div>
              </article>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
