import {
  createCalendarAutomation,
  createCalendarbp,
} from './calendarsFunctions';
import { eachDayOfInterval } from 'date-fns';

export const CALENDAR_EXPORT_FORMATS = [
  { extension: '.bprelease', label: 'Blue Prism' },
  { extension: '.csv', label: 'UiPath' },
  { extension: '.txt', label: 'Automation Anywhere' },
];

const formatDateKey = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const createBpreleaseBlob = (calendarTemplate) => {
  const content =
    `${calendarTemplate.header}\n` +
    `${calendarTemplate.name}\n` +
    `${calendarTemplate.notes}\n` +
    `${calendarTemplate.created}\n` +
    `${calendarTemplate.id}\n` +
    `${calendarTemplate.package_name}\n` +
    `${calendarTemplate.created_by}\n` +
    `${calendarTemplate.contents}\n` +
    `${calendarTemplate.calendar}\n` +
    `${calendarTemplate.schedule_calendar}\n` +
    `${calendarTemplate.other_holidays}\n` +
    `${calendarTemplate.close_tickets}\n`;

  return new Blob([content], { type: '' });
};

const getActiveDates = (years) => {
  const removedDateKeys = new Set(
    years.flatMap(year => year.aditionalDaysToRemove || [])
      .map(formatDateKey)
      .filter(Boolean)
  );
  const activeDates = new Map();

  years.flatMap(year => [
    ...(year.diasActivosStore || []),
    ...(year.aditionalDaysToAdd || []),
  ]).forEach(date => {
    const dateKey = formatDateKey(date);
    if (dateKey && !removedDateKeys.has(dateKey)) activeDates.set(dateKey, new Date(date));
  });

  return [...activeDates.values()].sort((left, right) => left - right);
};

const getCalendarBounds = (years, title) => {
  const ranges = years.flatMap(year =>
    (year.capasStore || []).map(layer => layer.data || {})
  );
  const starts = ranges.map(range => Date.parse(range.initCalendar)).filter(Number.isFinite);
  const finishes = ranges.map(range => Date.parse(range.finishCalendar)).filter(Number.isFinite);

  if (starts.length === 0 || finishes.length === 0) {
    throw new Error(`El calendario "${title}" no tiene un rango de fechas válido`);
  }

  return {
    start: new Date(Math.min(...starts)),
    finish: new Date(Math.max(...finishes)),
  };
};

/** Creates the same export payload used for individual calendar downloads. */
export const createCalendarExport = (calendar, extension, userName) => {
  const years = calendar.añosStore;
  const dates = getActiveDates(years);

  if (extension === '.bprelease') {
    const { start, finish } = getCalendarBounds(years, calendar.titleStore);
    const template = createCalendarbp(
      dates,
      calendar.titleStore,
      userName,
      start,
      finish
    );

    return {
      blob: createBpreleaseBlob(template),
      filename: `${calendar.titleStore}.bprelease`,
    };
  }

  if (extension === '.csv') {
    const { start, finish } = getCalendarBounds(years, calendar.titleStore);
    const activeDateKeys = new Set(dates.map(formatDateKey));
    const excludedDates = eachDayOfInterval({ start, end: finish })
      .map(formatDateKey)
      .filter(date => !activeDateKeys.has(date));
    const csvContent = ['ExcludedDate', ...excludedDates].join('\r\n') + '\r\n';

    return {
      blob: new Blob([csvContent], { type: 'text/csv;charset=utf-8;' }),
      filename: `${calendar.titleStore}.csv`,
    };
  }

  if (extension === '.txt') {
    const txtContent = createCalendarAutomation(dates).join('\r\n');

    return {
      blob: new Blob([txtContent], { type: 'text/plain;charset=utf-8;' }),
      filename: `${calendar.titleStore}.txt`,
    };
  }

  throw new Error(`Formato de exportación no soportado: ${extension}`);
};
