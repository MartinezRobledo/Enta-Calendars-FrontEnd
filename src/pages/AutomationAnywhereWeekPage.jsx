import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
  FormControlLabel,
  MenuItem,
} from '@mui/material';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import BalanceRoundedIcon from '@mui/icons-material/BalanceRounded';
import ScheduleRoundedIcon from '@mui/icons-material/ScheduleRounded';
import ScienceRoundedIcon from '@mui/icons-material/ScienceRounded';
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded';
import { createAutomationAnywhereTestScenario } from './automationAnywhereTestScenario';
import { calendarApi } from '../api';
import { useAuthStore } from '../hooks/useAuthStore';
import { getSelectedCalendarClient } from '../helpers/calendarClient';

const DAY_KEYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
const DAY_LABELS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const MONTH_KEYS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
const EMPTY_LIST = [];
const HOUR_HEIGHT_PX = 68;

const parseDate = (value) => {
  if (!value) return null;
  const [year, month, day] = String(value).slice(0, 10).split('-').map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day, 12);
};

const dateKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

const fetchAllCalendarSummaries = async (client) => {
  const pageSize = 100;
  const calendars = [];
  let skip = 0;
  let hasMore = true;

  while (hasMore) {
    const { data } = await calendarApi.get(`/calendars/${encodeURIComponent(client)}`, {
      params: { skip, limit: pageSize },
    });
    if (!Array.isArray(data.calendars)) throw new Error('La respuesta no contiene una lista de calendarios.');
    calendars.push(...data.calendars);
    hasMore = data.pagination?.hasMore ?? data.calendars.length === pageSize;
    if (!data.calendars.length) break;
    skip += data.calendars.length;
  }

  return calendars;
};

const startOfWeek = (date) => {
  const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  return monday;
};

const daysBetween = (from, to) => Math.round((startOfWeek(to) - startOfWeek(from)) / 86400000);

const dayToken = (date) => DAY_KEYS[(date.getDay() + 6) % 7];

const isOccurrenceOn = (schedule, date) => {
  if (schedule.status !== 'ACTIVE') return false;
  const start = parseDate(schedule.startDate);
  const end = parseDate(schedule.endDate);
  if (start && date < start) return false;
  if (end && date > end) return false;

  if (schedule.scheduleType === 'DAILY' && schedule.dailyRecurrence) {
    const interval = Math.max(1, Number(schedule.dailyRecurrence.interval || 1));
    return Math.round((date - start) / 86400000) % interval === 0;
  }

  if (schedule.scheduleType === 'WEEKLY' && schedule.weeklyRecurrence) {
    const interval = Math.max(1, Number(schedule.weeklyRecurrence.interval || 1));
    const selectedDays = schedule.weeklyRecurrence.daysOfWeek || [];
    const weekNumber = start ? Math.floor(daysBetween(start, date) / 7) : 0;
    return weekNumber % interval === 0 && selectedDays.includes(dayToken(date));
  }

  if (schedule.scheduleType === 'MONTHLY' && schedule.monthlyDateRecurrence) {
    const recurrence = schedule.monthlyDateRecurrence;
    const months = recurrence.monthsOfYear || MONTH_KEYS;
    return date.getDate() === Number(recurrence.dateOfMonth) && months.includes(MONTH_KEYS[date.getMonth()]);
  }

  // The API returns other recurrence shapes (for example monthly weekday rules).
  // Until those shapes are mapped, use the authoritative next-run instant when it falls in this week.
  if (schedule.nextRun) {
    const nextRun = new Date(schedule.nextRun);
    return !Number.isNaN(nextRun.getTime()) && dateKey(nextRun) === dateKey(date);
  }

  return false;
};

const getDurationBySchedule = (activities) => {
  const durationSamples = new Map();
  activities.forEach((activity) => {
    if (activity.status !== 'COMPLETED' || !activity.automationId) return;
    const start = Date.parse(activity.startDateTime);
    const end = Date.parse(activity.endDateTime);
    if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return;
    const samples = durationSamples.get(activity.automationId) || [];
    samples.push((end - start) / 60000);
    durationSamples.set(activity.automationId, samples);
  });

  return new Map([...durationSamples.entries()].map(([id, samples]) => {
    const sorted = [...samples].sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);
    const median = sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
    return [id, { median, count: samples.length }];
  }));
};

const getResourceIds = (schedule, activities, devices) => {
  if (Array.isArray(schedule.previewResourceIds)) return schedule.previewResourceIds;
  const deviceByUserId = new Map();
  devices.forEach((device) => {
    (device.defaultUsers || []).forEach((user) => deviceByUserId.set(String(user.id), String(device.id)));
  });

  const runAsDeviceIds = (schedule.runAsUserIds || [])
    .map((userId) => deviceByUserId.get(String(userId)))
    .filter(Boolean);
  if (runAsDeviceIds.length) return [...new Set(runAsDeviceIds)];

  const executionDeviceCounts = new Map();
  activities.filter((activity) => activity.automationId === schedule.id && activity.deviceId && activity.deviceId !== '-1')
    .forEach((activity) => executionDeviceCounts.set(activity.deviceId, (executionDeviceCounts.get(activity.deviceId) || 0) + 1));
  if (!executionDeviceCounts.size) return ['unassigned'];
  const maxCount = Math.max(...executionDeviceCounts.values());
  return [...executionDeviceCounts.entries()].filter(([, count]) => count === maxCount).map(([id]) => id);
};

const getWeekDays = (weekStart) => Array.from({ length: 7 }, (_, index) => {
  const date = new Date(weekStart);
  date.setDate(date.getDate() + index);
  return date;
});

const timeToMinutes = (value) => {
  const [hours, minutes] = String(value || '00:00').split(':').map(Number);
  return (hours || 0) * 60 + (minutes || 0);
};
const minuteToTime = (minutes) => `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;

const overlapsExcludedTime = (startMinute, durationMinutes, excludedRanges) => excludedRanges.some((range) => (
  startMinute < timeToMinutes(range.end) && startMinute + durationMinutes > timeToMinutes(range.start)
));

const overlapsExcludedDateRange = (start, end, excludedRanges) => {
  if (!excludedRanges.length) return false;
  const day = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const lastDay = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  for (; day <= lastDay; day.setDate(day.getDate() + 1)) {
    if (excludedRanges.some((range) => {
      const [fromHour, fromMinute] = range.start.split(':').map(Number);
      const [toHour, toMinute] = range.end.split(':').map(Number);
      const blockedStart = new Date(day);
      blockedStart.setHours(fromHour, fromMinute, 0, 0);
      const blockedEnd = new Date(day);
      blockedEnd.setHours(toHour, toMinute, 0, 0);
      return start < blockedEnd && end > blockedStart;
    })) return true;
  }
  return false;
};

const ExcludedTimeRanges = ({ ranges, onChange }) => {
  const [start, setStart] = useState('08:00');
  const [end, setEnd] = useState('09:00');
  const [error, setError] = useState('');

  const addRange = () => {
    if (!start || !end || timeToMinutes(start) >= timeToMinutes(end)) {
      setError('El horario de fin debe ser posterior al inicio.');
      return;
    }
    if (ranges.some((range) => range.start === start && range.end === end)) {
      setError('Ese rango ya está agregado.');
      return;
    }
    onChange([...ranges, { start, end }].sort((a, b) => timeToMinutes(a.start) - timeToMinutes(b.start)));
    setError('');
  };

  return (
    <Box>
      <Typography sx={{ mb: 0.5, fontWeight: 600 }}>Horarios que no sirven</Typography>
      <Typography sx={{ mb: 1, color: 'text.secondary', fontSize: 12 }}>La búsqueda evita estos rangos todos los días.</Typography>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }}>
        <TextField size="small" type="time" label="Desde" value={start} onChange={(event) => setStart(event.target.value)} InputLabelProps={{ shrink: true }} />
        <TextField size="small" type="time" label="Hasta" value={end} onChange={(event) => setEnd(event.target.value)} InputLabelProps={{ shrink: true }} />
        <Button size="small" variant="outlined" onClick={addRange}>Agregar rango</Button>
      </Stack>
      {error && <Typography role="alert" sx={{ mt: 0.5, color: 'error.main', fontSize: 12 }}>{error}</Typography>}
      {ranges.length > 0 && (
        <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap" sx={{ mt: 1 }}>
          {ranges.map((range) => (
            <Chip key={`${range.start}-${range.end}`} size="small" label={`${range.start}–${range.end}`} onDelete={() => onChange(ranges.filter((item) => item !== range))} />
          ))}
        </Stack>
      )}
    </Box>
  );
};

const buildBalanceSuggestions = ({ schedules, occurrences, fixedScheduleIds, resources }) => {
  const candidates = resources.filter((resource) => /^CONNECTED/.test(resource.status) && resource.defaultUsers?.length);
  const projectedLoad = new Map(candidates.map((resource) => [String(resource.id), 0]));
  const occupied = new Map(candidates.map((resource) => [String(resource.id), []]));

  fixedScheduleIds.forEach((id) => {
    occurrences.filter((item) => item.id === id).forEach((item) => {
      const deviceId = item.resourceIds.find((resourceId) => projectedLoad.has(resourceId));
      if (!deviceId || !item.duration) return;
      projectedLoad.set(deviceId, projectedLoad.get(deviceId) + item.duration.median);
      const start = parseDate(item.dateKey);
      const startMinute = timeToMinutes(item.startTime);
      start.setHours(Math.floor(startMinute / 60), startMinute % 60, 0, 0);
      occupied.get(deviceId).push({ start, end: new Date(start.getTime() + item.duration.median * 60000) });
    });
  });

  const movable = schedules
    .filter((schedule) => schedule.status === 'ACTIVE' && !fixedScheduleIds.includes(schedule.id))
    .map((schedule) => {
      const items = occurrences.filter((item) => item.id === schedule.id);
      const duration = items[0]?.duration?.median;
      const source = items[0]?.resourceIds[0] || 'unassigned';
      return { schedule, items, duration, source, weeklyMinutes: (duration || 0) * items.length };
    })
    .filter((item) => item.items.length && item.duration > 0)
    .sort((a, b) => b.weeklyMinutes - a.weeklyMinutes);

  const suggestions = [];
  const assignments = [];
  const spreadOf = (loads) => loads.length ? Math.max(...loads) - Math.min(...loads) : 0;
  movable.forEach(({ schedule, items, duration, source }) => {
    const feasible = candidates.filter((resource) => {
      const deviceId = String(resource.id);
      return items.every((item) => occupied.get(deviceId).every((entry) => {
        const start = parseDate(item.dateKey);
        const startMinute = timeToMinutes(item.startTime);
        start.setHours(Math.floor(startMinute / 60), startMinute % 60, 0, 0);
        const end = new Date(start.getTime() + duration * 60000);
        return end <= entry.start || entry.end <= start;
      }));
    });

    if (!feasible.length) return;
    const beforeLoads = [...projectedLoad.values()];
    const baselineSpread = spreadOf(beforeLoads);
    const scored = feasible.map((resource) => {
      const deviceId = String(resource.id);
      const loads = [...projectedLoad.entries()].map(([id, load]) => load + (id === deviceId ? duration * items.length : 0));
      const spread = spreadOf(loads);
      return { resource, spread };
    }).sort((a, b) => a.spread - b.spread);
    const target = scored[0].resource;
    const targetId = String(target.id);
    assignments.push({ scheduleId: schedule.id, resourceId: targetId, resourceName: target.name });
    projectedLoad.set(targetId, projectedLoad.get(targetId) + duration * items.length);
    items.forEach((item) => {
      const start = parseDate(item.dateKey);
      const startMinute = timeToMinutes(item.startTime);
      start.setHours(Math.floor(startMinute / 60), startMinute % 60, 0, 0);
      occupied.get(targetId).push({ start, end: new Date(start.getTime() + duration * 60000) });
    });

    if (targetId !== source && scored[0].spread < baselineSpread) {
      suggestions.push({
        scheduleId: schedule.id,
        targetId,
        name: schedule.activityName,
        source: resources.find((resource) => String(resource.id) === source)?.name || 'Recurso actual',
        target: target.name,
        startTime: items[0]?.startTime || schedule.startTime,
        duration,
        weeklyMinutes: duration * items.length,
        targetRunAsUser: target.defaultUsers[0]?.username || '',
      });
    }
  });

  return { suggestions, assignments, eligibleResourceCount: candidates.length, movableCount: movable.length };
};

const findNextFreeSlot = ({ schedules, activities, devices, durationMinutes, excludedRanges = [] }) => {
  const resources = devices.filter((device) => /^CONNECTED/.test(device.status) && device.defaultUsers?.length);
  if (!resources.length) return { slot: null, unknownDurationCount: 0 };

  const durations = getDurationBySchedule(activities);
  const now = new Date();
  const intervalMs = 15 * 60000;
  const firstSlot = new Date(Math.ceil(now.getTime() / intervalMs) * intervalMs);
  const horizonEnd = new Date(firstSlot.getTime() + 7 * 86400000);
  const firstDay = new Date(firstSlot.getFullYear(), firstSlot.getMonth(), firstSlot.getDate(), 12);
  const eventsByResource = new Map(resources.map((resource) => [String(resource.id), []]));
  const scheduledDays = Array.from({ length: 8 }, (_, index) => {
    const date = new Date(firstDay);
    date.setDate(date.getDate() + index);
    return date;
  });
  let unknownDurationCount = 0;

  scheduledDays.forEach((date) => {
    schedules.filter((schedule) => isOccurrenceOn(schedule, date)).forEach((schedule) => {
      const duration = durations.get(schedule.id)?.median;
      const time = timeToMinutes(schedule.startTime);
      const startsAt = new Date(date.getFullYear(), date.getMonth(), date.getDate(), Math.floor(time / 60), time % 60);
      const resourceIds = getResourceIds(schedule, activities, devices);
      if (!duration) {
        unknownDurationCount += 1;
        return;
      }
      resourceIds.forEach((id) => {
        if (eventsByResource.has(id)) eventsByResource.get(id).push({ start: startsAt, end: new Date(startsAt.getTime() + duration * 60000) });
      });
    });
  });

  const candidates = [];
  for (let start = firstSlot; start < horizonEnd; start = new Date(start.getTime() + intervalMs)) {
    const end = new Date(start.getTime() + durationMinutes * 60000);
    if (end > horizonEnd) break;
    if (overlapsExcludedDateRange(start, end, excludedRanges)) continue;
    resources.forEach((resource) => {
      const busy = eventsByResource.get(String(resource.id)).some((event) => start < event.end && end > event.start);
      if (!busy) candidates.push({ resource, start, end });
    });
    if (candidates.length) break;
  }

  return { slot: candidates[0] || null, unknownDurationCount };
};

const findRecurringFreeSlot = ({ occurrences, selectedDayKeys, durationMinutes, devices, days, excludedRanges = [] }) => {
  const resources = devices.filter((device) => /^CONNECTED/.test(device.status) && device.defaultUsers?.length);
  const selectedDays = days.filter((date) => selectedDayKeys.includes(dayToken(date)));
  if (!resources.length || !selectedDays.length) return null;

  for (let startMinute = 0; startMinute <= 1440 - durationMinutes; startMinute += 15) {
    if (overlapsExcludedTime(startMinute, durationMinutes, excludedRanges)) continue;
    for (const resource of resources) {
      const resourceId = String(resource.id);
      const fitsEveryDay = selectedDays.every((date) => occurrences
        .filter((item) => item.dateKey === dateKey(date) && item.resourceIds.includes(resourceId))
        .every((item) => {
          const occupiedStart = timeToMinutes(item.startTime);
          const occupiedDuration = item.duration?.median || 60;
          return startMinute + durationMinutes <= occupiedStart
            || occupiedStart + occupiedDuration <= startMinute;
        }) && (() => {
          const previousDate = new Date(date);
          previousDate.setDate(previousDate.getDate() - 1);
          return occurrences
            .filter((item) => item.dateKey === dateKey(previousDate) && item.resourceIds.includes(resourceId))
            .every((item) => {
              const occupiedStart = timeToMinutes(item.startTime);
              const occupiedDuration = item.duration?.median || 60;
              const endIntoToday = occupiedStart + occupiedDuration - 1440;
              return endIntoToday <= 0 || startMinute >= endIntoToday;
            });
        })());

      if (fitsEveryDay) {
        return {
          resource,
          startTime: `${String(Math.floor(startMinute / 60)).padStart(2, '0')}:${String(startMinute % 60).padStart(2, '0')}`,
          dateKeys: selectedDays.map(dateKey),
          dayKeys: selectedDayKeys,
          durationMinutes,
        };
      }
    }
  }
  return null;
};

const findSeriesRelocations = ({ schedule, occurrences, devices }) => {
  const items = occurrences.filter((item) => item.id === schedule.id);
  const duration = items[0]?.duration?.median;
  if (!items.length || !duration) return { suggestions: [], reason: 'No hay duración histórica suficiente para evaluar esta serie.' };

  const resources = devices.filter((device) => /^CONNECTED/.test(device.status) && device.defaultUsers?.length);
    const originalStart = timeToMinutes(items[0]?.startTime || schedule.startTime);
  const suggestions = [];

  resources.forEach((resource) => {
    const deviceId = String(resource.id);
    for (let startMinute = 0; startMinute < 1440; startMinute += 15) {
      if (items.every((item) => item.resourceIds.includes(deviceId) && startMinute === originalStart)) continue;
      const fitsEveryOccurrence = items.every((item) => {
        const date = parseDate(item.dateKey);
        date.setHours(Math.floor(startMinute / 60), startMinute % 60, 0, 0);
        const end = new Date(date.getTime() + duration * 60000);
        const occupied = occurrences.filter((other) => other.id !== schedule.id && other.dateKey === item.dateKey && other.resourceIds.includes(deviceId));
        return occupied.every((other) => {
          if (!other.duration) return false;
          const otherDate = parseDate(other.dateKey);
          const otherStartMinute = timeToMinutes(other.startTime);
          otherDate.setHours(Math.floor(otherStartMinute / 60), otherStartMinute % 60, 0, 0);
          const otherEnd = new Date(otherDate.getTime() + other.duration.median * 60000);
          return end <= otherDate || otherEnd <= date;
        });
      });

      if (fitsEveryOccurrence) {
        suggestions.push({
          resource,
          startTime: `${String(Math.floor(startMinute / 60)).padStart(2, '0')}:${String(startMinute % 60).padStart(2, '0')}`,
          deltaMinutes: Math.abs(startMinute - originalStart),
          duration,
          runAsUser: resource.defaultUsers[0]?.username || '',
        });
      }
    }
  });

  return {
    reason: suggestions.length ? '' : 'No se encontró un horario común libre en los recursos conectados para todas las ocurrencias de esta semana.',
    suggestions: suggestions.sort((a, b) => a.deltaMinutes - b.deltaMinutes || a.resource.name.localeCompare(b.resource.name)).slice(0, 5),
  };
};

export const AutomationAnywhereWeekPage = ({ snapshot, fixedScheduleIds, onFixedChange, onBack, onRefresh }) => {
  const [selectedResource, setSelectedResource] = useState(0);
  const [viewedWeekStart, setViewedWeekStart] = useState(() => startOfWeek(new Date()));
  const [highlightedSlot, setHighlightedSlot] = useState(null);
  const [testSnapshot, setTestSnapshot] = useState(null);
  const [testFixedScheduleIds, setTestFixedScheduleIds] = useState([]);
  const [savingFixed, setSavingFixed] = useState(false);
  const [fixedError, setFixedError] = useState('');
  const [balancePlan, setBalancePlan] = useState(null);
  const [balancePreview, setBalancePreview] = useState(false);
  const [calendarRefTarget, setCalendarRefTarget] = useState(null);
  const [reexecutionOpen, setReexecutionOpen] = useState(false);
  const [reexecutionDuration, setReexecutionDuration] = useState('');
  const [reexecutionResult, setReexecutionResult] = useState(null);
  const [relocationSchedule, setRelocationSchedule] = useState(null);
  const [relocationPlan, setRelocationPlan] = useState(null);
  const [newScheduleOpen, setNewScheduleOpen] = useState(false);
  const [newScheduleName, setNewScheduleName] = useState('Nuevo proceso');
  const [newScheduleDuration, setNewScheduleDuration] = useState('60');
  const [newScheduleDays, setNewScheduleDays] = useState(['MON', 'TUE', 'WED', 'THU', 'FRI']);
  const [newScheduleResult, setNewScheduleResult] = useState(null);
  const [newScheduleProposal, setNewScheduleProposal] = useState(null);
  const [excludedTimeRanges, setExcludedTimeRanges] = useState([]);
  const [manualScheduleTimes, setManualScheduleTimes] = useState({});
  const [manualScheduleResources, setManualScheduleResources] = useState({});
  const [manualEdit, setManualEdit] = useState(null);
  const [draggingScheduleId, setDraggingScheduleId] = useState('');
  const [fixedSearch, setFixedSearch] = useState('');
  const [storedCalendars, setStoredCalendars] = useState([]);
  const [selectedCalendarId, setSelectedCalendarId] = useState('');
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [calendarError, setCalendarError] = useState('');
  const slotHighlightRef = useRef(null);
  const calendarRef = useRef(null);
  const hourGridStartRef = useRef(null);
  const { user } = useAuthStore();
  const calendarClient = getSelectedCalendarClient() || user.name;
  const currentSnapshot = testSnapshot || snapshot;
  const isTestScenario = Boolean(currentSnapshot.isTestScenario);
  const effectiveFixedScheduleIds = currentSnapshot.isTestScenario ? testFixedScheduleIds : fixedScheduleIds;
  const days = useMemo(() => getWeekDays(viewedWeekStart), [viewedWeekStart]);
  const devices = useMemo(() => currentSnapshot.devices?.items || EMPTY_LIST, [currentSnapshot.devices?.items]);
  const schedules = useMemo(() => currentSnapshot.schedules?.items || EMPTY_LIST, [currentSnapshot.schedules?.items]);
  const activities = useMemo(() => currentSnapshot.activity?.items || EMPTY_LIST, [currentSnapshot.activity?.items]);
  const pools = currentSnapshot.pools?.items || EMPTY_LIST;
  const calendarOptions = storedCalendars;

  useEffect(() => {
    if (!newScheduleOpen) return undefined;
    setCalendarError('');
    setNewScheduleResult(null);
    if (!user.name) {
      setCalendarError('No se pudo identificar al usuario autenticado para cargar sus calendarios.');
      return undefined;
    }

    let cancelled = false;
    setCalendarLoading(true);
    fetchAllCalendarSummaries(calendarClient)
      .then((calendars) => {
        if (!cancelled) {
          setStoredCalendars(calendars);
          setSelectedCalendarId('');
          setNewScheduleDays([]);
        }
      })
      .catch((error) => {
        if (!cancelled) setCalendarError(error.response?.data?.msg || 'No se pudieron cargar los calendarios de Enta Calendars.');
      })
      .finally(() => {
        if (!cancelled) setCalendarLoading(false);
      });

    return () => { cancelled = true; };
  }, [newScheduleOpen, user.name, calendarClient]);

  const durations = useMemo(() => getDurationBySchedule(activities), [activities]);
  const scheduleResources = useMemo(() => new Map(schedules.map((schedule) => [schedule.id, getResourceIds(schedule, activities, devices)])), [schedules, activities, devices]);
  const resources = useMemo(() => {
    const known = [...devices];
    const hasUnassigned = [...scheduleResources.values()].some((ids) => ids.includes('unassigned'));
    if (hasUnassigned) known.push({ id: 'unassigned', name: 'Sin dispositivo asignado', status: 'UNKNOWN', type: '' });
    return known;
  }, [devices, scheduleResources]);
  const unavailablePoolCount = pools.filter((pool) => {
    const poolDevices = pool.deviceIds.map((id) => devices.find((device) => String(device.id) === String(id)));
    return !poolDevices.some((device) => device && /^CONNECTED/.test(device.status));
  }).length;

  const occurrences = useMemo(() => days.flatMap((date) => schedules
    .filter((schedule) => isOccurrenceOn(schedule, date))
    .map((schedule) => {
      const startTime = manualScheduleTimes[schedule.id] || schedule.startTime;
      return {
        ...schedule,
        startTime,
        hour: Number(String(startTime || '00:00').slice(0, 2)),
        manuallyMoved: Boolean(manualScheduleTimes[schedule.id] || manualScheduleResources[schedule.id]),
        dateKey: dateKey(date),
        duration: durations.get(schedule.id) || null,
        resourceIds: manualScheduleResources[schedule.id]
          ? [manualScheduleResources[schedule.id]]
          : scheduleResources.get(schedule.id) || ['unassigned'],
      };
    })), [days, schedules, durations, scheduleResources, manualScheduleTimes, manualScheduleResources]);
  const assignmentsBySchedule = useMemo(() => new Map((balancePlan?.assignments || []).map((assignment) => [assignment.scheduleId, assignment])), [balancePlan]);
  const displayedOccurrences = useMemo(() => balancePreview
    ? occurrences.map((item) => {
      const assignment = assignmentsBySchedule.get(item.id);
      return assignment ? { ...item, resourceIds: [assignment.resourceId], balanceMoved: assignment.resourceId !== item.resourceIds[0], proposedResourceName: assignment.resourceName } : item;
    })
    : occurrences, [occurrences, balancePreview, assignmentsBySchedule]);
  const laneLayouts = useMemo(() => {
    const layouts = new Map();
    days.forEach((date) => {
      const currentDateKey = dateKey(date);
      resources.forEach((resource) => {
        const resourceId = String(resource.id);
        const items = displayedOccurrences
          .filter((item) => item.dateKey === currentDateKey && item.resourceIds.includes(resourceId))
          .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
        let overlapGroup = [];
        let groupEnd = -1;
        const placeOverlapGroup = () => {
          if (!overlapGroup.length) return;
          const laneEnds = [];
          const groupLayouts = [];
          overlapGroup.forEach((item) => {
            const start = timeToMinutes(item.startTime);
            const duration = Math.max(1, item.duration?.median || 15);
            let lane = laneEnds.findIndex((end) => end <= start);
            if (lane < 0) lane = laneEnds.length;
            laneEnds[lane] = start + duration;
            groupLayouts.push({ item, lane });
          });
          const laneCount = Math.max(1, laneEnds.length);
          groupLayouts.forEach(({ item, lane }) => {
            layouts.set(`${resourceId}:${currentDateKey}:${item.id}`, { lane, laneCount });
          });
          overlapGroup = [];
          groupEnd = -1;
        };

        items.forEach((item) => {
          const start = timeToMinutes(item.startTime);
          const end = start + Math.max(1, item.duration?.median || 15);
          if (overlapGroup.length && start >= groupEnd) placeOverlapGroup();
          overlapGroup.push(item);
          groupEnd = Math.max(groupEnd, end);
        });
        placeOverlapGroup();
      });
    });
    return layouts;
  }, [days, resources, displayedOccurrences]);

  const activeResource = resources[selectedResource] || resources[0];
  const activeResourceId = String(activeResource?.id || 'unassigned');
  const formattedWeek = `${days[0].toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })} – ${days[6].toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })}`;

  useEffect(() => {
    if (highlightedSlot) slotHighlightRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
    else if (calendarRefTarget) calendarRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [highlightedSlot, viewedWeekStart, calendarRefTarget]);

  const showSlotOnCalendar = (slot) => {
    setBalancePreview(false);
    setNewScheduleProposal(null);
    setCalendarRefTarget(null);
    setViewedWeekStart(startOfWeek(slot.start));
    const resourceIndex = resources.findIndex((resource) => String(resource.id) === String(slot.resource.id));
    if (resourceIndex >= 0) setSelectedResource(resourceIndex);
    setHighlightedSlot(slot);
  };

  const showBalanceOnCalendar = () => {
    setHighlightedSlot(null);
    setNewScheduleProposal(null);
    setBalancePreview(true);
    setCalendarRefTarget((current) => current + 1);
    const firstMove = balancePlan?.suggestions[0];
    const targetIndex = resources.findIndex((resource) => String(resource.id) === String(firstMove?.targetId));
    if (targetIndex >= 0) setSelectedResource(targetIndex);
  };

  const showNewScheduleOnCalendar = (proposal) => {
    setBalancePreview(false);
    setHighlightedSlot(null);
    setNewScheduleProposal({ ...proposal, name: newScheduleName.trim() || 'Nuevo proceso' });
    setCalendarRefTarget((current) => current + 1);
    const resourceIndex = resources.findIndex((resource) => String(resource.id) === String(proposal.resource.id));
    if (resourceIndex >= 0) setSelectedResource(resourceIndex);
    setNewScheduleOpen(false);
  };

  const handleCalendarChange = async (calendarId) => {
    setSelectedCalendarId(calendarId);
    setNewScheduleDays([]);
    setNewScheduleResult(null);
    setCalendarError('');
    if (!calendarId) return;

    setCalendarLoading(true);
    try {
      const client = storedCalendars.find((calendar) => calendar._id === calendarId)?.cliente || calendarClient;
      const { data } = await calendarApi.get(`/calendars/${encodeURIComponent(client)}/${encodeURIComponent(calendarId)}`);
      const selectedCalendar = data.calendar;
      const yearConfig = selectedCalendar?.añosStore?.find((year) => Number(year.año) === days[0].getFullYear());
      if (!yearConfig) {
        setCalendarError(`El calendario no tiene configuración para ${days[0].getFullYear()}.`);
        return;
      }
      const activeDateKeys = new Set((yearConfig.diasActivosStore || []).map((value) => (
        typeof value === 'string' ? value.slice(0, 10) : dateKey(new Date(value))
      )));
      const daysForCalendar = days.filter((date) => activeDateKeys.has(dateKey(date))).map(dayToken);
      setNewScheduleDays(daysForCalendar);
      if (!daysForCalendar.length) setCalendarError('El calendario no tiene días activos en la semana visible.');
    } catch (error) {
      setCalendarError(error.response?.data?.msg || 'No se pudo leer la configuración del calendario seleccionado.');
    } finally {
      setCalendarLoading(false);
    }
  };

  const refreshCalendars = async () => {
    if (!user.name) return;
    setCalendarLoading(true);
    setCalendarError('');
    try {
      const calendars = await fetchAllCalendarSummaries(calendarClient);
      setStoredCalendars(calendars);
    } catch (error) {
      setCalendarError(error.response?.data?.msg || 'No se pudo actualizar la lista de calendarios de Enta Calendars.');
    } finally {
      setCalendarLoading(false);
    }
  };

  const openCalendarCreator = () => {
    window.open('/crear', '_blank', 'noopener,noreferrer');
  };

  const handleScheduleDrop = (event) => {
    event.preventDefault();
    const scheduleId = event.dataTransfer.getData('text/plain');
    if (!scheduleId) return;
    const firstHourBounds = hourGridStartRef.current?.getBoundingClientRect();
    if (!firstHourBounds) return;
    const elapsedHours = Math.max(0, Math.min(23.99, (event.clientY - firstHourBounds.top) / HOUR_HEIGHT_PX));
    const targetStartTime = minuteToTime(Math.floor((elapsedHours * 60) / 15) * 15);
    const currentStartTime = manualScheduleTimes[scheduleId] || schedules.find((schedule) => schedule.id === scheduleId)?.startTime;
    setDraggingScheduleId('');
    if (!currentStartTime || currentStartTime === targetStartTime) return;
    setManualScheduleTimes((current) => ({ ...current, [scheduleId]: targetStartTime }));
    setBalancePlan(null);
    setBalancePreview(false);
    setHighlightedSlot(null);
    setNewScheduleProposal(null);
  };

  const openManualScheduleEditor = (item) => {
    const resourceId = manualScheduleResources[item.id]
      || (item.resourceIds.includes(activeResourceId) ? activeResourceId : item.resourceIds[0] || 'unassigned');
    setManualEdit({ id: item.id, name: item.activityName, startTime: item.startTime, resourceId });
  };

  const saveManualEdit = () => {
    if (!manualEdit) return;
    const schedule = schedules.find((item) => item.id === manualEdit.id);
    const originalResourceIds = scheduleResources.get(manualEdit.id) || ['unassigned'];

    setManualScheduleTimes((current) => {
      const next = { ...current };
      if (manualEdit.startTime === schedule?.startTime) delete next[manualEdit.id];
      else next[manualEdit.id] = manualEdit.startTime;
      return next;
    });
    setManualScheduleResources((current) => {
      const next = { ...current };
      if (originalResourceIds.length === 1 && originalResourceIds[0] === manualEdit.resourceId) delete next[manualEdit.id];
      else next[manualEdit.id] = manualEdit.resourceId;
      return next;
    });
    setManualEdit(null);
    setBalancePlan(null);
    setBalancePreview(false);
    setHighlightedSlot(null);
    setNewScheduleProposal(null);
  };

  const handleFixedChange = async (scheduleId, checked) => {
    const next = checked
      ? [...new Set([...effectiveFixedScheduleIds, scheduleId])]
      : effectiveFixedScheduleIds.filter((id) => id !== scheduleId);
    if (isTestScenario) {
      setTestFixedScheduleIds(next);
      return;
    }
    setSavingFixed(true);
    setFixedError('');
    try {
      await onFixedChange(next);
    } catch (error) {
      setFixedError(error.response?.data?.msg || 'No se pudo guardar la preferencia.');
    } finally {
      setSavingFixed(false);
    }
  };

  const filteredFixedSchedules = schedules.filter((schedule) => (
    String(schedule.activityName || '').toLowerCase().includes(fixedSearch.trim().toLowerCase())
  ));
  const manualMoveCount = new Set([...Object.keys(manualScheduleTimes), ...Object.keys(manualScheduleResources)]).size;
  const connectedManualResources = resources.filter((resource) => /^CONNECTED/.test(resource.status) && resource.defaultUsers?.length);
  const currentEditResource = manualEdit && resources.find((resource) => String(resource.id) === String(manualEdit.resourceId));
  const manualEditResources = currentEditResource && !connectedManualResources.some((resource) => String(resource.id) === String(currentEditResource.id))
    ? [currentEditResource, ...connectedManualResources]
    : connectedManualResources;

  return (
    <Box component="main" sx={{ minHeight: '100dvh', bgcolor: '#0b1018', color: '#f7f9fc', p: { xs: 2, md: 3 }, '@supports not (min-height: 100dvh)': { minHeight: '100vh' } }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }} justifyContent="space-between" sx={{ mb: 2 }}>
        <Box>
          <Typography sx={{ color: '#ff8051', fontSize: 12, letterSpacing: '.14em', fontWeight: 700 }}>AUTOMATION ANYWHERE · PLANIFICADOR</Typography>
          <Typography component="h1" sx={{ fontSize: { xs: 24, md: 30 }, fontWeight: 700 }}>Schedules de la semana</Typography>
          <Typography sx={{ color: 'rgba(255,255,255,.62)' }}>{formattedWeek} · {schedules.length} schedules</Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          {!snapshot.isTestScenario && <Button startIcon={<ScienceRoundedIcon />} onClick={() => {
            if (testSnapshot) {
              setTestSnapshot(null);
              setTestFixedScheduleIds([]);
              setHighlightedSlot(null);
            } else {
              setTestFixedScheduleIds([]);
              setTestSnapshot(createAutomationAnywhereTestScenario());
            }
            setBalancePlan(null);
            setBalancePreview(false);
            setManualScheduleTimes({});
            setManualScheduleResources({});
            setManualEdit(null);
            setNewScheduleProposal(null);
            setReexecutionResult(null);
          }} sx={{ color: testSnapshot ? '#85e5b2' : '#fff' }}>
            {testSnapshot ? 'Salir de datos de prueba' : 'Cargar datos de prueba'}
          </Button>}
          <Button startIcon={<ScheduleRoundedIcon />} onClick={() => { setNewScheduleResult(null); setNewScheduleOpen(true); }} sx={{ color: '#b9d7ff' }}>Agregar nuevo schedule</Button>
          <Button startIcon={<BalanceRoundedIcon />} onClick={() => { setBalancePreview(false); setBalancePlan(buildBalanceSuggestions({ schedules, occurrences, fixedScheduleIds: effectiveFixedScheduleIds, resources: devices })); }} sx={{ color: '#ffb79d' }}>Sugerir balance</Button>
          <Button startIcon={<ScheduleRoundedIcon />} onClick={() => setReexecutionOpen(true)} sx={{ color: '#fff' }}>Buscar hueco de reejecución</Button>
          <Button startIcon={<RefreshRoundedIcon />} onClick={onRefresh} sx={{ color: '#fff' }}>Actualizar datos</Button>
          <Button startIcon={<ArrowBackRoundedIcon />} onClick={onBack} sx={{ color: '#fff' }}>Volver</Button>
        </Stack>
      </Stack>

      {isTestScenario && <Alert severity="info" sx={{ mb: 2 }}>Escenario local: 10 dispositivos, 30 usuarios y 98 schedules con carga densa. Las preferencias solo viven en esta pantalla; no se modifica Automation Anywhere ni la base de datos.</Alert>}

      {reexecutionResult && (
        <Alert
          severity={reexecutionResult.slot ? 'success' : 'warning'}
          onClick={reexecutionResult.slot ? () => showSlotOnCalendar(reexecutionResult.slot) : undefined}
          action={reexecutionResult.slot && <Button color="inherit" size="small" onClick={() => showSlotOnCalendar(reexecutionResult.slot)}>Ver en calendario</Button>}
          sx={{ mb: 2, cursor: reexecutionResult.slot ? 'pointer' : 'default', '&:hover': reexecutionResult.slot ? { filter: 'brightness(1.08)' } : undefined }}
        >
          {reexecutionResult.slot
            ? `Próximo hueco estimado: ${reexecutionResult.slot.start.toLocaleString('es-AR', { weekday: 'long', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })} en ${reexecutionResult.slot.resource.name} (${reexecutionResult.durationMinutes} min).`
            : `No se encontró un hueco libre durante los próximos 7 días para una ejecución de ${reexecutionResult.durationMinutes} min en los dispositivos conectados.`}
          {reexecutionResult.unknownDurationCount > 0 && (
            <Typography sx={{ mt: 0.5, fontSize: 12 }}>La búsqueda no pudo descontar {reexecutionResult.unknownDurationCount} ocurrencias sin duración histórica; el resultado es aproximado.</Typography>
          )}
        </Alert>
      )}

      {balancePlan && (
        <Alert
          severity={balancePlan.suggestions.length ? 'success' : 'info'}
          onClick={balancePlan.suggestions.length ? showBalanceOnCalendar : undefined}
          action={balancePlan.suggestions.length > 0 && <Button color="inherit" size="small" onClick={showBalanceOnCalendar}>Ver en calendario</Button>}
          sx={{ mb: 2, cursor: balancePlan.suggestions.length ? 'pointer' : 'default', '&:hover': balancePlan.suggestions.length ? { filter: 'brightness(1.08)' } : undefined }}
        >
          <Typography sx={{ fontWeight: 700, mb: 0.5 }}>Propuesta de balance · solo simulación</Typography>
          {balancePlan.suggestions.length ? (
            <Stack spacing={0.35}>
              {balancePlan.suggestions.slice(0, 8).map((item) => (
                <Typography key={item.scheduleId} sx={{ fontSize: 13 }}>
                  {item.name}: {item.source} → {item.target} · conserva {item.startTime} · ~{item.duration.toFixed(1)} min por ejecución
                </Typography>
              ))}
              {balancePlan.suggestions.length > 8 && <Typography sx={{ fontSize: 12 }}>y {balancePlan.suggestions.length - 8} movimientos más en la diagramación.</Typography>}
            </Stack>
          ) : (
            <Typography sx={{ fontSize: 13 }}>
              No hay una reasignación que reduzca la diferencia de carga con los recursos conectados disponibles. Recursos aptos: {balancePlan.eligibleResourceCount}; schedules con duración histórica: {balancePlan.movableCount}.
            </Typography>
          )}
          <Typography sx={{ mt: 0.75, fontSize: 12, color: 'text.secondary' }}>La propuesta conserva los horarios y las recurrencias actuales. No se modifica Automation Anywhere.</Typography>
        </Alert>
      )}

      {balancePreview && <Alert severity="info" action={<Button color="inherit" size="small" onClick={() => setBalancePreview(false)}>Volver a distribución actual</Button>} sx={{ mb: 2 }}>Vista completa del balance propuesto. Revisa todos los recursos en sus solapas; no se aplicó ningún cambio en Control Room.</Alert>}

      {newScheduleProposal && (
        <Alert severity="success" onClick={() => { setCalendarRefTarget((current) => current + 1); }} action={<Button color="inherit" size="small" onClick={() => setCalendarRefTarget((current) => current + 1)}>Ver en calendario</Button>} sx={{ mb: 2, cursor: 'pointer' }}>
          Propuesta para {newScheduleProposal.name}: {newScheduleProposal.dayKeys.map((key) => DAY_LABELS[DAY_KEYS.indexOf(key)]).join(', ')} a las {newScheduleProposal.startTime} en {newScheduleProposal.resource.name} · {newScheduleProposal.durationMinutes} min. Solo simulación; no se crea en Control Room.
        </Alert>
      )}

      {manualMoveCount > 0 && (
        <Alert severity="info" action={<Button color="inherit" size="small" onClick={() => { setManualScheduleTimes({}); setManualScheduleResources({}); }}>Descartar movimientos</Button>} sx={{ mb: 2 }}>
          Propuesta manual: cambiaste hora o recurso de {manualMoveCount} {manualMoveCount === 1 ? 'serie' : 'series'}. El cambio afecta todas sus ocurrencias y solo se muestra como simulación; no se aplica en Automation Anywhere.
        </Alert>
      )}

      <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mb: 2 }}>
        <Chip size="small" label={currentSnapshot.isTestScenario ? `${schedules.length} schedules de ejemplo` : `${currentSnapshot.schedules?.page?.total ?? schedules.length} schedules en Control Room`} sx={{ color: '#fff', bgcolor: 'rgba(255,255,255,.1)' }} />
        <Chip size="small" label={`${currentSnapshot.activity?.page?.total ?? 0} ejecuciones en historial`} sx={{ color: '#fff', bgcolor: 'rgba(255,255,255,.1)' }} />
        <Chip size="small" label={`${devices.length} dispositivos`} sx={{ color: '#fff', bgcolor: 'rgba(255,255,255,.1)' }} />
        <Chip size="small" label={`${pools.length} pools`} sx={{ color: '#fff', bgcolor: 'rgba(255,255,255,.1)' }} />
      </Stack>

      <Accordion disableGutters sx={{ mb: 2, bgcolor: 'rgba(255,255,255,.045)', color: '#fff', border: '1px solid rgba(255,255,255,.12)', '&:before': { display: 'none' } }}>
        <AccordionSummary expandIcon={<ExpandMoreRoundedIcon sx={{ color: 'rgba(255,255,255,.7)' }} />}>
          <Typography sx={{ fontWeight: 600 }}>Schedules inamovibles ({effectiveFixedScheduleIds.length})</Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ pt: 0 }}>
          <Typography sx={{ mb: 1.5, color: 'rgba(255,255,255,.58)', fontSize: 13 }}>
            Se mantienen en el recurso y horario actuales al generar una sugerencia de balance. Esta preferencia queda guardada en tu usuario.
          </Typography>
          {fixedError && <Alert severity="error" sx={{ mb: 1.5 }}>{fixedError}</Alert>}
          <TextField
            size="small"
            fullWidth
            label="Buscar schedule por nombre"
            value={fixedSearch}
            onChange={(event) => setFixedSearch(event.target.value)}
            sx={{ mb: 1.5, maxWidth: 520 }}
          />
          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
            {filteredFixedSchedules.map((schedule) => (
              <Stack key={schedule.id} direction="row" spacing={0.5} alignItems="center" sx={{ border: '1px solid rgba(255,255,255,.1)', borderRadius: 1, pr: 0.5 }}>
                <FormControlLabel
                  sx={{ ml: 0.5, mr: 0 }}
                  disabled={savingFixed}
                  control={<Checkbox checked={effectiveFixedScheduleIds.includes(schedule.id)} onChange={(event) => handleFixedChange(schedule.id, event.target.checked)} sx={{ color: 'rgba(255,255,255,.5)', '&.Mui-checked': { color: '#ff8051' } }} />}
                  label={<Typography sx={{ fontSize: 13 }}>{schedule.activityName}</Typography>}
                />
                <Button
                  size="small"
                  disabled={effectiveFixedScheduleIds.includes(schedule.id) || schedule.status !== 'ACTIVE'}
                  onClick={() => {
                    setRelocationSchedule(schedule);
                    setRelocationPlan(findSeriesRelocations({ schedule, occurrences, devices }));
                  }}
                  sx={{ whiteSpace: 'nowrap', fontSize: 11, color: '#ffb79d' }}
                >
                  Reubicar serie
                </Button>
              </Stack>
            ))}
            {filteredFixedSchedules.length === 0 && (
              <Typography sx={{ color: 'rgba(255,255,255,.55)', fontSize: 13 }}>
                {fixedSearch ? 'No hay schedules que coincidan con la búsqueda.' : 'No hay schedules disponibles.'}
              </Typography>
            )}
          </Stack>
        </AccordionDetails>
      </Accordion>

      {!currentSnapshot.activity?.available && <Alert severity="warning" sx={{ mb: 2 }}>No se pudo consultar el historial. Se muestran los schedules sin duración histórica.</Alert>}
      {!currentSnapshot.devices?.available && <Alert severity="warning" sx={{ mb: 2 }}>No se pudo consultar la lista de dispositivos. La asignación de recursos puede estar incompleta.</Alert>}
      {unavailablePoolCount > 0 && <Alert severity="info" sx={{ mb: 2 }}>{unavailablePoolCount} pools no tienen dispositivos conectados; la carga se muestra por dispositivo según el historial y el usuario de ejecución.</Alert>}
      {[currentSnapshot.schedules, currentSnapshot.devices, currentSnapshot.pools, currentSnapshot.activity].some((section) => section?.truncated) && (
        <Alert severity="warning" sx={{ mb: 2 }}>La API devolvió más resultados que el límite de lectura de esta vista; la matriz puede estar incompleta.</Alert>
      )}
      {occurrences.length === 0 && <Alert severity="info" sx={{ mb: 2 }}>No se encontraron ocurrencias activas para la semana actual con las recurrencias recibidas por la API.</Alert>}

      <Typography sx={{ mb: 1, color: 'rgba(255,255,255,.55)', fontSize: 12 }}>
        Arrastra una caja para cambiar la hora de toda la serie. Haz doble clic para editar hora y recurso con el teclado. Los cambios son propuestas; usa el botón de descartar para volver a la distribución original.
      </Typography>
      <Box ref={calendarRef} sx={{ border: '1px solid rgba(255,255,255,.14)', borderRadius: 2, bgcolor: 'rgba(255,255,255,.035)', overflow: 'hidden', scrollMarginTop: 24 }}>
        <Box sx={{ borderBottom: '1px solid rgba(255,255,255,.12)', px: 1.5 }}>
          <Tabs
            value={Math.min(selectedResource, Math.max(0, resources.length - 1))}
            onChange={(_, value) => setSelectedResource(value)}
            variant="scrollable"
            scrollButtons="auto"
            aria-label="Recursos"
            sx={{ '& .MuiTab-root': { color: 'rgba(255,255,255,.58)', minHeight: 52 }, '& .Mui-selected': { color: '#ff8051 !important' }, '& .MuiTabs-indicator': { bgcolor: '#ff8051' } }}
          >
            {resources.map((resource) => (
              <Tab
                key={resource.id}
                label={resource.name}
                icon={<Box component="span" sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: /^CONNECTED/.test(resource.status) ? '#56d69a' : '#8993a4', display: 'inline-block' }} />}
                iconPosition="start"
              />
            ))}
          </Tabs>
        </Box>

        <Box sx={{ px: { xs: 1, md: 2 }, py: 1, overflowX: 'auto' }}>
          <Box sx={{ minWidth: 940, display: 'grid', gridTemplateColumns: '64px repeat(7, minmax(110px, 1fr))' }}>
            <Box sx={{ p: 1, borderBottom: '1px solid rgba(255,255,255,.13)' }} />
            {days.map((date, index) => (
              <Box key={dateKey(date)} sx={{ p: 1, textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,.13)', borderLeft: '1px solid rgba(255,255,255,.08)' }}>
                <Typography sx={{ fontSize: 12, color: 'rgba(255,255,255,.58)' }}>{DAY_LABELS[index]}</Typography>
                <Typography sx={{ fontWeight: 700 }}>{date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })}</Typography>
              </Box>
            ))}

            {Array.from({ length: 24 }, (_, hour) => (
              <Box key={hour} sx={{ display: 'contents' }}>
                <Box sx={{ height: HOUR_HEIGHT_PX, display: 'flex', justifyContent: 'flex-end', pr: 1, pt: 0.5, borderBottom: '1px solid rgba(255,255,255,.08)' }}>
                  <Typography sx={{ fontSize: 11, color: 'rgba(255,255,255,.48)' }}>{String(hour).padStart(2, '0')}:00</Typography>
                </Box>
                {days.map((date, dayIndex) => {
                  const currentDateKey = dateKey(date);
                  const cellItems = displayedOccurrences.filter((item) => item.dateKey === currentDateKey && item.hour === hour && item.resourceIds.includes(activeResourceId));
                  const slotMatchesCell = highlightedSlot
                    && String(highlightedSlot.resource.id) === activeResourceId
                    && dateKey(highlightedSlot.start) === currentDateKey
                    && highlightedSlot.start.getHours() === hour;
                  const newScheduleMatchesCell = newScheduleProposal
                    && String(newScheduleProposal.resource.id) === activeResourceId
                    && newScheduleProposal.dateKeys.includes(currentDateKey)
                    && Number(newScheduleProposal.startTime.slice(0, 2)) === hour;
                  return (
                    <Box
                      key={`${currentDateKey}-${hour}`}
                      ref={dayIndex === 0 && hour === 0 ? hourGridStartRef : undefined}
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={handleScheduleDrop}
                      sx={{ position: 'relative', minWidth: 0, height: HOUR_HEIGHT_PX, p: 0, overflow: 'visible', borderLeft: '1px solid rgba(255,255,255,.08)', borderBottom: '1px solid rgba(255,255,255,.08)', bgcolor: hour % 2 ? 'rgba(255,255,255,.012)' : 'transparent', '&:has([draggable="true"]:active)': { bgcolor: 'rgba(80,188,255,.12)' } }}
                    >
                        {slotMatchesCell && (
                          <Box ref={slotHighlightRef} sx={{ position: 'absolute', top: `${(highlightedSlot.start.getMinutes() / 60) * HOUR_HEIGHT_PX}px`, left: '2%', width: '96%', height: `${((highlightedSlot.end - highlightedSlot.start) / 60000 / 60) * HOUR_HEIGHT_PX}px`, boxSizing: 'border-box', zIndex: 5, borderLeft: '3px solid #45e38c', borderRadius: 0.7, bgcolor: 'rgba(31,190,104,.35)', outline: '1px solid rgba(69,227,140,.7)', px: 0.6, py: 0.3, overflow: 'hidden', animation: 'slot-pulse 1.6s ease-in-out 3', '@keyframes slot-pulse': { '50%': { backgroundColor: 'rgba(31,190,104,.62)' } } }}>
                            <Typography noWrap sx={{ fontSize: 10, fontWeight: 700, color: '#a8ffcc' }}>Reejecución · {highlightedSlot.start.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</Typography>
                            <Typography noWrap sx={{ fontSize: 9, color: '#d7ffe7' }}>{reexecutionResult?.durationMinutes || Math.round((highlightedSlot.end - highlightedSlot.start) / 60000)} min estimados</Typography>
                          </Box>
                        )}
                        {newScheduleMatchesCell && (
                          <Box ref={slotHighlightRef} sx={{ position: 'absolute', top: `${(Number(newScheduleProposal.startTime.slice(3, 5)) / 60) * HOUR_HEIGHT_PX}px`, left: '2%', width: '96%', height: `${(newScheduleProposal.durationMinutes / 60) * HOUR_HEIGHT_PX}px`, boxSizing: 'border-box', zIndex: 5, borderLeft: '3px solid #45e38c', borderRadius: 0.7, bgcolor: 'rgba(31,190,104,.35)', outline: '1px solid rgba(69,227,140,.7)', px: 0.6, py: 0.3, overflow: 'hidden', animation: 'slot-pulse 1.6s ease-in-out 3', '@keyframes slot-pulse': { '50%': { backgroundColor: 'rgba(31,190,104,.62)' } } }}>
                            <Typography noWrap sx={{ fontSize: 10, fontWeight: 700, color: '#a8ffcc' }}>{newScheduleProposal.startTime} · {newScheduleProposal.name}</Typography>
                            <Typography noWrap sx={{ fontSize: 9, color: '#d7ffe7' }}>{newScheduleProposal.durationMinutes} min · nuevo schedule</Typography>
                          </Box>
                        )}
                        {cellItems.map((item) => (
                          <Tooltip
                            key={`${item.id}-${item.dateKey}`}
                            title={`${item.activityName} · ${item.startTime || 'hora sin dato'} · ${item.duration ? `duración mediana ${item.duration.median.toFixed(1)} min (${item.duration.count} ejecuciones)` : 'sin duración histórica; se representa con una marca mínima'} · ${item.scheduleType}${item.balanceMoved ? ` · propuesto en ${item.proposedResourceName}` : ''} · doble clic para editar hora y recurso`}
                            placement="top"
                          >
                            <Box
                              draggable={!balancePreview}
                              onDragStart={(event) => {
                                event.dataTransfer.setData('text/plain', item.id);
                                event.dataTransfer.effectAllowed = 'move';
                                setDraggingScheduleId(item.id);
                              }}
                              onDragEnd={() => setDraggingScheduleId('')}
                              onDoubleClick={(event) => {
                                event.stopPropagation();
                                openManualScheduleEditor(item);
                              }}
                              sx={{ position: 'absolute', top: `${((timeToMinutes(item.startTime) % 60) / 60) * HOUR_HEIGHT_PX}px`, left: `calc(${(laneLayouts.get(`${activeResourceId}:${currentDateKey}:${item.id}`)?.lane || 0) * 100 / (laneLayouts.get(`${activeResourceId}:${currentDateKey}:${item.id}`)?.laneCount || 1)}% + 2px)`, width: `calc(${100 / (laneLayouts.get(`${activeResourceId}:${currentDateKey}:${item.id}`)?.laneCount || 1)}% - 4px)`, height: `${((item.duration?.median || 15) / 60) * HOUR_HEIGHT_PX}px`, boxSizing: 'border-box', zIndex: item.balanceMoved ? 4 : 3, borderLeft: `3px solid ${item.balanceMoved ? '#50bcff' : item.manuallyMoved ? '#50bcff' : '#ff8051'}`, borderRadius: 0.7, bgcolor: item.balanceMoved || item.manuallyMoved ? 'rgba(45,152,220,.34)' : 'rgba(255,128,81,.22)', px: 0.6, py: 0.3, overflow: 'hidden', cursor: balancePreview ? 'default' : 'grab', opacity: draggingScheduleId === item.id ? 0.45 : 1, '&:active': { cursor: 'grabbing' } }}
                            >
                              <Typography noWrap sx={{ fontSize: 10, fontWeight: 700, color: '#fff' }}>{item.startTime} · {item.activityName}</Typography>
                              <Typography noWrap sx={{ fontSize: 9, color: 'rgba(255,255,255,.72)' }}>{item.duration ? `~${item.duration.median.toFixed(0)} min` : 'duración s/d'}</Typography>
                            </Box>
                          </Tooltip>
                        ))}
                    </Box>
                  );
                })}
              </Box>
            ))}
          </Box>
        </Box>
      </Box>

      <Typography sx={{ mt: 1.5, color: 'rgba(255,255,255,.5)', fontSize: 12 }}>
        Arrastra una caja a otra hora para proponer el cambio de horario de toda la serie. Las duraciones son medianas históricas; los movimientos son simulaciones y no se aplican en Control Room.
      </Typography>

      <Dialog open={Boolean(manualEdit)} onClose={() => setManualEdit(null)} fullWidth maxWidth="xs">
        <DialogTitle>Editar propuesta del schedule</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2, color: 'text.secondary' }}>
            {manualEdit?.name} · el cambio de hora y recurso se aplicará a toda la serie solo en esta simulación.
          </Typography>
          <Stack spacing={2}>
            <TextField
              autoFocus
              fullWidth
              type="time"
              label="Hora de inicio"
              value={manualEdit?.startTime || ''}
              onChange={(event) => setManualEdit((current) => current ? { ...current, startTime: event.target.value } : current)}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              select
              fullWidth
              label="Recurso"
              value={manualEdit?.resourceId || ''}
              onChange={(event) => setManualEdit((current) => current ? { ...current, resourceId: event.target.value } : current)}
              SelectProps={{ MenuProps: { PaperProps: { sx: { maxHeight: 320, bgcolor: '#fff', color: '#171717' } } } }}
            >
              {manualEditResources.map((resource) => (
                <MenuItem key={resource.id} value={String(resource.id)}>
                  {resource.name}{/^CONNECTED/.test(resource.status) ? '' : ' · recurso actual no conectado'}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setManualEdit(null)}>Cancelar</Button>
          <Button variant="contained" disabled={!manualEdit?.startTime || !manualEdit?.resourceId} onClick={saveManualEdit}>
            Guardar propuesta
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={newScheduleOpen} onClose={() => setNewScheduleOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Agregar nuevo schedule</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2, color: 'text.secondary' }}>
            Elige un calendario existente de Enta Calendars para definir los días de recurrencia. Buscaré un horario y recurso libre común para esos días; la propuesta no se crea en Automation Anywhere.
          </Typography>
          <Stack spacing={2}>
            <TextField
              autoFocus
              fullWidth
              label="Nombre del proceso"
              value={newScheduleName}
              onChange={(event) => { setNewScheduleName(event.target.value); setNewScheduleResult(null); }}
            />
            <TextField
              fullWidth
              label="Duración estimada (minutos)"
              type="number"
              value={newScheduleDuration}
              onChange={(event) => { setNewScheduleDuration(event.target.value); setNewScheduleResult(null); }}
              inputProps={{ min: 1, max: 1440 }}
            />
            <ExcludedTimeRanges ranges={excludedTimeRanges} onChange={setExcludedTimeRanges} />
            <TextField
              select
              fullWidth
              label="Calendario de Enta Calendars"
              value={selectedCalendarId}
              disabled={calendarLoading}
              SelectProps={{ MenuProps: { PaperProps: { sx: { maxHeight: 360, bgcolor: '#fff', color: '#171717' } } } }}
              onChange={(event) => handleCalendarChange(event.target.value)}
              helperText={calendarLoading
                ? 'Cargando calendarios…'
                : !calendarOptions.length
                  ? 'No se encontraron calendarios de Enta Calendars.'
                  : newScheduleDays.length
                    ? `${calendarOptions.length} calendarios disponibles · Días activos esta semana: ${newScheduleDays.map((key) => DAY_LABELS[DAY_KEYS.indexOf(key)]).join(', ')}`
                    : `${calendarOptions.length} calendarios disponibles · Selecciona uno con días activos en la semana visible.`}
            >
              {!calendarOptions.length && <MenuItem disabled value="">No hay calendarios disponibles</MenuItem>}
              {calendarOptions.map((calendar) => (
                <MenuItem key={calendar._id} value={calendar._id}>{calendar.titleStore}</MenuItem>
              ))}
            </TextField>
            {calendarError && <Alert severity="warning">{calendarError}</Alert>}
            <Stack direction="row" spacing={1}>
              <Button
                variant="outlined"
                startIcon={<OpenInNewRoundedIcon />}
                onClick={openCalendarCreator}
              >
                Crear en Enta Calendars
              </Button>
              <Button disabled={calendarLoading} startIcon={<RefreshRoundedIcon />} onClick={refreshCalendars}>
                Actualizar lista
              </Button>
            </Stack>
            <Typography sx={{ color: 'text.secondary', fontSize: 12 }}>
              Crear en Enta Calendars abre otra pestaña para conservar esta propuesta. Al volver, actualiza la lista de calendarios.
            </Typography>
            {newScheduleResult && (newScheduleResult.slot ? (
              <Alert severity="success" action={<Button color="inherit" size="small" onClick={() => showNewScheduleOnCalendar(newScheduleResult.slot)}>Ver en calendario</Button>}>
                Espacio común: {newScheduleResult.slot.resource.name} · {newScheduleResult.slot.startTime} · {newScheduleDuration} min.
              </Alert>
            ) : (
              <Alert severity="warning">No se encontró un horario común libre para todos los días elegidos en esta semana.</Alert>
            ))}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewScheduleOpen(false)}>Cancelar</Button>
          <Button
            variant="contained"
            disabled={calendarLoading || !selectedCalendarId || !Number.isFinite(Number(newScheduleDuration)) || Number(newScheduleDuration) <= 0 || Number(newScheduleDuration) > 1440 || !newScheduleDays.length}
            onClick={() => {
              const durationMinutes = Number(newScheduleDuration);
              const slot = findRecurringFreeSlot({ occurrences, selectedDayKeys: newScheduleDays, durationMinutes, devices, days, excludedRanges: excludedTimeRanges });
              setNewScheduleResult({ slot });
            }}
          >
            Buscar espacio
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={reexecutionOpen} onClose={() => setReexecutionOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Buscar hueco para reejecución</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2, color: 'text.secondary' }}>Indica cuánto estimas que durará y buscaré el próximo espacio en los dispositivos conectados durante los próximos 7 días.</Typography>
          <TextField
            autoFocus
            fullWidth
            label="Duración estimada (minutos)"
            type="number"
            value={reexecutionDuration}
            onChange={(event) => setReexecutionDuration(event.target.value)}
            inputProps={{ min: 1, max: 1440 }}
          />
          <Box sx={{ mt: 2 }}>
            <ExcludedTimeRanges ranges={excludedTimeRanges} onChange={setExcludedTimeRanges} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReexecutionOpen(false)}>Cancelar</Button>
          <Button
            variant="contained"
            disabled={!Number.isFinite(Number(reexecutionDuration)) || Number(reexecutionDuration) <= 0 || Number(reexecutionDuration) > 1440}
            onClick={() => {
              const durationMinutes = Number(reexecutionDuration);
              const effectiveSchedules = schedules.map((schedule) => {
                const effectiveSchedule = { ...schedule };
                if (manualScheduleTimes[schedule.id]) effectiveSchedule.startTime = manualScheduleTimes[schedule.id];
                if (manualScheduleResources[schedule.id]) effectiveSchedule.previewResourceIds = [manualScheduleResources[schedule.id]];
                return effectiveSchedule;
              });
              const result = findNextFreeSlot({ schedules: effectiveSchedules, activities, devices, durationMinutes, excludedRanges: excludedTimeRanges });
              setReexecutionResult({ ...result, durationMinutes });
              setReexecutionOpen(false);
            }}
          >
            Buscar
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(relocationSchedule)} onClose={() => setRelocationSchedule(null)} fullWidth maxWidth="sm">
        <DialogTitle>Reubicar serie completa</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 1.5, color: 'text.secondary' }}>
            {relocationSchedule?.activityName} · se conserva la recurrencia y se busca un horario común para todas sus ocurrencias de esta semana. La propuesta no cambia Control Room.
          </Typography>
          {relocationPlan?.suggestions.length ? (
            <Stack spacing={1}>
              {relocationPlan.suggestions.map((item) => (
                <Box key={`${item.resource.id}-${item.startTime}`} sx={{ p: 1.25, borderRadius: 1, bgcolor: 'action.hover' }}>
                  <Typography sx={{ fontWeight: 700 }}>{item.resource.name} · {item.startTime}</Typography>
                  <Typography sx={{ color: 'text.secondary', fontSize: 13 }}>
                    Cambio de horario: {item.deltaMinutes} min · duración mediana: {item.duration.toFixed(1)} min
                    {item.runAsUser ? ` · usuario de ejecución: ${item.runAsUser}` : ''}
                  </Typography>
                </Box>
              ))}
            </Stack>
          ) : (
            <Alert severity="info">{relocationPlan?.reason || 'No hay propuestas disponibles.'}</Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRelocationSchedule(null)}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
