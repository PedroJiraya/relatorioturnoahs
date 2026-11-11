import faultTree from '../data/fault-tree.json';

export function getCodeEmoji(code = '') {
  if (code.includes('Operando')) return '🟢';
  if (code.includes('MPNS')) return '🟠';
  if (code.includes('MPS')) return '🟡';
  if (code.includes('HMC') || code.includes('HAC')) return '🔴';
  return '⚙️';
}

export function getLocalDatetimeString() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  const local = new Date(now.getTime() - offset);
  return local.toISOString().slice(0, 16);
}

export function formatDateTimeWhatsApp(val = '') {
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

export function formatCA(val = '') {
  if (!val) return '';
  const clean = val.trim().toUpperCase().replace(/\s+/g, '');
  if (!clean) return '';
  const digitsOrSuffix = clean.replace(/^(CA|CM)+/i, '');
  return digitsOrSuffix ? `CA${digitsOrSuffix}` : 'CA';
}

export const formatCM = formatCA;

export function getTag(asset = '') {
  return String(asset || '')
    .replace(/^(CA|CM)+/i, '')
    .trim();
}

export function getDelayTimes(delays = [], dIdx = 0, itemStartTime = '') {
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

export function normalizeAssetInput(raw, prev = '') {
  let val = raw.toUpperCase().replace(/\s+/g, '');
  if ((val === 'CA' || val === 'CM') && prev.length > 2) {
    return '';
  }
  if (/^\d/.test(val)) {
    val = `CA${val}`;
  }
  return val;
}

export function getTruckModel(asset = '') {
  const clean = formatCA(asset).toUpperCase();
  if (/^CA55|^CM55|^55/.test(clean)) return '797F';
  if (/^CA57|^CM57|^57/.test(clean)) return '794 AC';
  return 'Outros';
}

export function getFleetSummary(stopped = [], operating = [], appointments = []) {
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

export function getGreeting() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'Bom dia!';
  if (hour >= 12 && hour < 18) return 'Boa tarde!';
  return 'Boa noite!';
}

export function branches(item) {
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

export function path(item) {
  return (
    [
      item.system,
      item.component,
      item.subcomponent,
      item.cause,
      item.faultSolution,
    ]
      .filter(Boolean)
      .join(' > ') || 'Não informada'
  );
}
