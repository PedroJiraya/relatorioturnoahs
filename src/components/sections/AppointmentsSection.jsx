'use client';

import AppointmentItem from './AppointmentItem';
import { codes } from '../../constants';

export default function AppointmentsSection({
  appointments,
  setAppointments,
  updateAppointment,
}) {
  const addAppointment = () => {
    setAppointments((items) => [
      ...items,
      {
        asset: '',
        code: codes[0],
        startTime: '',
        endTime: '',
        delays: [
          {
            justification: 'AG ATENDIMENTO',
            startTime: '',
            endTime: '',
          },
        ],
        system: '',
        component: '',
        subcomponent: '',
        cause: '',
        operationalCause: '',
        faultSolution: '',
        diagnosis: '',
        solution: '',
        status: 'Em manutenção',
      },
    ]);
  };

  const removeAppointment = (removeIndex) => {
    setAppointments((items) =>
      items.filter((_, itemIndex) => itemIndex !== removeIndex),
    );
  };

  return (
    <section>
      <div className="section-title">
        <h2>Ativos em manutenção</h2>
        <button
          type="button"
          className="small primary"
          onClick={addAppointment}
        >
          + Adicionar atendimento
        </button>
      </div>
      {appointments.length === 0 ? (
        <p
          className="hint"
          style={{
            textAlign: 'center',
            padding: '30px 20px',
            background: '#f8fafc',
            borderRadius: '10px',
            border: '1px dashed #cbd5e1',
            margin: '16px 0',
          }}
        >
          Nenhum atendimento registrado no momento. Clique no botão acima para
          adicionar um atendimento.
        </p>
      ) : (
        appointments.map((item, index) => (
          <AppointmentItem
            key={index}
            item={item}
            index={index}
            total={appointments.length}
            update={updateAppointment}
            remove={removeAppointment}
          />
        ))
      )}
    </section>
  );
}
