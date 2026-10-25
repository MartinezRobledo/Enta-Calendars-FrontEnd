import './Calendar.css';
import { useMemo } from 'react';

const nombresMeses = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

const nombresDias = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
const nombresDiasCortos = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sá", "Do"];
const diasVacios = [];

// Devuelve el día de la semana ajustado para que 0 sea lunes
const obtenerDiaInicio = (anio, mes) => {
  return (new Date(anio, mes, 1).getDay() + 6) % 7 + 1; // Ajuste para lunes como inicio.
};

const obtenerDiasDelMes = (anio, mes) => {
  return new Date(anio, mes + 1, 0).getDate(); // Último día del mes.
};

const claveDiaLocal = (fecha) => {
  const date = new Date(fecha);
  if (Number.isNaN(date.getTime())) return null;
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
};

function Calendar({ anio, isDisabled, diasActivos = diasVacios, aditionalDaysToAdd = diasVacios, aditionalDaysToRemove = diasVacios, changeAditionalDaysToAdd, changeAditionalDaysToRemove, onDayClick }) {
  const diasActivosSet = useMemo(() => new Set(diasActivos.map(claveDiaLocal).filter(Boolean)), [diasActivos]);
  const diasAgregadosSet = useMemo(() => new Set(aditionalDaysToAdd.map(claveDiaLocal).filter(Boolean)), [aditionalDaysToAdd]);
  const diasExcluidosSet = useMemo(() => new Set(aditionalDaysToRemove.map(claveDiaLocal).filter(Boolean)), [aditionalDaysToRemove]);

  const manejarClickDia = (dia, boton, e) => {
    e.preventDefault(); // Prevenir el comportamiento predeterminado del clic con la rueda
    if (onDayClick) return;

    if (boton === 0) {
      // Clic izquierdo
      changeAditionalDaysToAdd(dia);
    } else if (boton === 1) {
      // Clic con rueda
      changeAditionalDaysToRemove(dia);
    }
  };

  return (
    <div className={`calendario-anual ${isDisabled ? 'disabled' : ''}`}>
      {nombresMeses.map((mes, index) => {
        const diasEnMes = obtenerDiasDelMes(anio, index);
        const diaInicio = obtenerDiaInicio(anio, index);

        return (
          <div className="mes" key={mes}>
            <div className="titulo-mes">
              <div>{mes}</div>
              {nombresDias.map((dia, diaIndex) => (
                <div className="encabezado-dia" key={dia} aria-label={dia} title={dia}>
                  {nombresDiasCortos[diaIndex]}
                </div>
              ))}
            </div>
            <div className="dias">
              {Array.from({ length: diasEnMes }, (_, i) => {
                const fechaDia = new Date(anio, index, i + 1);
                const claveFechaDia = claveDiaLocal(fechaDia);
                const isActive = diasActivosSet.has(claveFechaDia);
                const isAdded = diasAgregadosSet.has(claveFechaDia);
                const isExcluded = diasExcluidosSet.has(claveFechaDia);

                return (
                  <div
                    className={`dia 
                      ${isActive ? 'active' : ''} 
                      ${isAdded ? 'add-day' : ''} 
                      ${isExcluded ? 'exclude-day' : ''}`}
                    key={fechaDia.toISOString()}
                    style={i === 0 ? { gridColumn: diaInicio } : {}}
                    onClick={onDayClick ? (e) => { e.preventDefault(); onDayClick(fechaDia); } : undefined}
                    onMouseDown={(e) => manejarClickDia(fechaDia, e.button, e)}
                  >
                    {i + 1}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default Calendar;
