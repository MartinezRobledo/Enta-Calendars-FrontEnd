import { RRule } from 'rrule';
import { addDays, getMonth } from 'date-fns';

const diasHastaFinMes = (actual) => {
  let dias = []
  if (actual < 0) {
    for (let dia = actual; dia <= -1; dia++) dias.push(dia);
    return dias;
  }
  while(actual <= 31) {
    dias.push(actual)
    actual++;
  }

  return dias;
}

const diasDesdeInicioMes = (actual) => {
  let dias = [];
  if (actual < 0) {
    for (let dia = -31; dia <= actual; dia++) dias.push(dia);
    return dias;
  }
  let dia = 1;
  while(dia <= actual) {
    dias.push(dia)
    dia++;
  }

  return dias;
}

const diasDesdeInicioMesDependence = (actual, dias) => {
  if (actual < 0) return diasDesdeInicioMes(actual);

  let inicio = 1;
  let fin = inicio+actual;

  let nuevosDias = [];

  for(inicio; inicio<=fin; inicio++)
    nuevosDias.push(inicio);
  return nuevosDias;
}

const diasHastaFinMesDependence = (actual, dias) => {
  if (actual < 0) return diasHastaFinMes(actual);

  let nuevosDias;
  dias[0] > actual
  ? nuevosDias = dias.map(dia => dia - (dias[0] - actual))
  : nuevosDias = dias.filter(dia => dia >= actual);

  return nuevosDias;
}

export function normalizeByMonthday(byMonthday){
  let nuevosdias = [];
  if(byMonthday.length > 0) 
    byMonthday
      .split(',')
      .map((item) => {
        parseInt(item.trim(), 10);
        item[item.length-1] === '+' 
        ? nuevosdias = [...nuevosdias, ...diasHastaFinMes(Number(item.slice(0,-1)))]
        : item[item.length-1] === '-'
          ? nuevosdias = [...nuevosdias, ...diasDesdeInicioMes(Number(item.slice(0,-1)))]
          : nuevosdias = [...nuevosdias, Number(item)];
      });

  return nuevosdias;
}

export function normalizeByMonthdayDependence(byMonthday, parentbyMonthday) {
  let nuevosdias = [];
  if (byMonthday.length > 0) {
    byMonthday
      .split(',')
      .filter((item) => item.trim() !== '') // Ignorar elementos vacíos
      .forEach((item) => {
        if (item[item.length - 1] === '+') {
          nuevosdias = [
            ...nuevosdias,
            ...diasHastaFinMesDependence(Number(item.slice(0, -1)), parentbyMonthday),
          ];
        } else if (item[item.length - 1] === '-') {
          nuevosdias = [
            ...nuevosdias,
            ...diasDesdeInicioMesDependence(Number(item.slice(0, -1)), parentbyMonthday),
          ];
        } else {
          nuevosdias = [...nuevosdias, Number(item)];
        }
      });
  }
  return nuevosdias;
}

export function encontrarDiasCoincidentes(diasArray, coincidenciasRequeridas, añoActual) {
  if (!Array.isArray(diasArray) || typeof coincidenciasRequeridas !== "number") {
    throw new Error("Parámetros inválidos");
  }

  const diasResultantes = [];
  const primerDiaAño = new Date(añoActual, 0, 1); // Obtiene el 1 de enero del año actual
  const timestampsDias = new Set(diasArray.map((dia) => dia.getTime()));

  // Recorremos los días del año en bloques de 7 días
  for (let i = 0; i < 365; i += 7) {
    const bloque = Array.from({ length: 7 }, (_, j) => addDays(primerDiaAño, i + j)); // Bloque de 7 días

    // Filtramos los días del bloque que estén en diasArray
    const diasCoincidentes = bloque.filter((dia) => timestampsDias.has(dia.getTime()));

    if (diasCoincidentes.length >= coincidenciasRequeridas) {
      diasResultantes.push(...diasCoincidentes); // Agregamos los días coincidentes
    }
  }

  return diasResultantes;
}

export const recortarDiasPorConfiguracion = (diasDependientes, capa) => {
  const { byWeekday, byMonthday } = capa.data;
  let diasFiltrados = getDaysBetween(diasDependientes, capa.data.initCalendar, capa.data.finishCalendar);
  if (byMonthday && byMonthday.length > 0) {
    diasFiltrados = getDaysFromMonths(diasFiltrados, byMonthday);
  }
  if (byWeekday && Object.keys(byWeekday).length > 0) {
    const weekdays = new Set(Object.values(byWeekday));
    diasFiltrados = diasFiltrados.filter(dia => weekdays.has((dia.getDay() + 6) % 7));
  } else {
    diasFiltrados = [];
  }
  return diasFiltrados;
};

export function filterHolidays(days, holidays) {
  const holidayTimestamps = new Set(holidays.map(holiday => new Date(holiday).getTime()));
  return days.filter(day => !holidayTimestamps.has(new Date(day).getTime()));
}

function splitDaysByMonth(days) {
  const months = [];
  let currentMonthDays = [];
  let currentMonth = getMonth(days[0]);

  for (const day of days) {
    if (!day || isNaN(new Date(day))) continue; // Ignorar valores inválidos
    const dayMonth = getMonth(day);
    if (dayMonth !== currentMonth) {
      months.push(currentMonthDays);
      currentMonthDays = [];
      currentMonth = dayMonth;
    }
    currentMonthDays.push(day);
  }

  // Agregar los días del último mes
  if (currentMonthDays.length) months.push(currentMonthDays);

  return months;
}

function getDaysByIndices(monthDays, indices) {
  return indices
    .filter(index => Math.abs(index) <= monthDays.length)
    .map(index =>
      index > 0
        ? monthDays[index - 1] // Índice positivo
        : monthDays[monthDays.length + index] // Índice negativo
    );
}

export function getDaysFromMonths(days, indices) {
  return splitDaysByMonth(days)
    .flatMap(monthDays => getDaysByIndices(monthDays, indices))
    .sort((a, b) => a - b);
}

export function getDaysBetween(days, init, finish) {
  return days.filter(day => day >= init && day <= finish)
}

const getMonthdaySelectors = (ruleText) => ruleText
  .split(',')
  .map((item) => item.trim())
  .filter(Boolean)
  .flatMap((item) => {
    if (item.endsWith('+')) {
      return diasHastaFinMes(Number(item.slice(0, -1)));
    }

    if (item.endsWith('-')) {
      const endDay = Number(item.slice(0, -1));
      if (endDay < 0) {
        // Negative RRule monthdays are relative to each month's actual length.
        const selectors = [];
        for (let day = -31; day <= endDay; day++) selectors.push(day);
        return selectors;
      }
      return diasDesdeInicioMes(endDay);
    }

    return [Number(item)];
  });

const normalizarFecha = (fecha = new Date()) => {
  if (!fecha) {
    console.error("La fecha es inválida:", fecha);
    return null;
  }
  if (!(fecha instanceof Date)) {
    fecha = new Date(fecha); // Convierte strings u otros formatos a Date
  }
  return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
};

export const Rules = (initCalendar, finishCalendar, bymonthday = [], byweekday = {}, byMonthdayStr = '') => {
  if (Object.keys(byweekday).length === 0) return [];

  const monthdaySelectors = byMonthdayStr.trim()
    ? getMonthdaySelectors(byMonthdayStr)
    : bymonthday;

  const rule = new RRule({
    freq: RRule.WEEKLY,
    byweekday: Object.values(byweekday),
    bymonthday: monthdaySelectors,
    dtstart: normalizarFecha(initCalendar),
    until: normalizarFecha(finishCalendar),
  });

  // Lo que voy a retornar
  return rule.all();
}
