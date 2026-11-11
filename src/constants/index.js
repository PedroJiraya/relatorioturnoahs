import faultTree from '../data/fault-tree.json';

export const STORAGE_KEY = 'relatorio_turno_ahs_draft_v1';

export const codes = ['HMC – 9200', 'MPS – 9600', 'MPNS – 9100', 'HAC – 9700'];

export const statuses = ['Liberado', 'Em manutenção'];

export const teams = ['A', 'B', 'C', 'D', 'ADM'];

export const stoppedPreInfo = [
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

export const delayJustifications = [
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
  'AG FILA CALLPAD',
  'AG O.M SAP',
  'AG PTS',
];

export const systems = Object.keys(faultTree);

export const fleetEquipments = [
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
  'CA5536',
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

export const emoji = {
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
