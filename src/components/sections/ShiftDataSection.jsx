'use client';

import Field from '../common/Field';
import SelectField from '../common/SelectField';
import { teams } from '../../constants';

export default function ShiftDataSection({
  date,
  setDate,
  shift,
  setShift,
  team,
  setTeam,
  workshop,
  setWorkshop,
  supervisor,
  setSupervisor,
  executors,
  setExecutors,
}) {
  return (
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
          placeholder="Lista de técnicos do turno"
        />
      </div>
    </section>
  );
}
