import {
  encontrarDiasCoincidentes,
  filterHolidays,
  recortarDiasPorConfiguracion,
  Rules,
} from './Rules';

export const actualizarCapaYDependientes = (indiceCapa, nuevasCapas, holidays, año) => {
  const capaActual = { ...nuevasCapas[indiceCapa] }; // Crear una copia inmutable de la capa actual

  // Recalcular los días de la capa actual
  capaActual.dias = capaActual.dependienteDe
      ? recortarDiasPorConfiguracion(
          nuevasCapas[capaActual.dependienteDe - 1].dias,
          capaActual
      )
      : Rules(
          capaActual.data.initCalendar,
          capaActual.data.finishCalendar,
          capaActual.data.byMonthday,
          capaActual.data.byWeekday,
          capaActual.data.byMonthdayStr
      );

  if (!capaActual.data.withHolidays) {
      capaActual.dias = filterHolidays(capaActual.dias, holidays);
  }

  if (capaActual.data.agrupar) {
      capaActual.dias = encontrarDiasCoincidentes(
          capaActual.dias,
          Object.keys(capaActual.data.byWeekday).length,
          año
      );
  }

  // Asigna la capa modificada de vuelta al array
  nuevasCapas[indiceCapa] = capaActual;

  // Si la capa tiene hijos, actualízalos recursivamente en el orden configurado
  if (capaActual.esPadre.length > 0) {
      capaActual.esPadre.forEach((idHijo) => {
          actualizarCapaYDependientes(idHijo - 1, nuevasCapas, holidays, año);
      });
  }
};
