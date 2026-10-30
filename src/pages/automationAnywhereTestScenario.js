const DAY_KEYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

const asDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const makeHistory = (scheduleId, index, baseDuration) => Array.from({ length: 4 }, (_, sample) => {
  const start = new Date();
  start.setDate(start.getDate() - (sample + 1) * 3);
  start.setHours(8 + ((index + sample) % 9), (index * 7 + sample * 11) % 60, 0, 0);
  const end = new Date(start.getTime() + (baseDuration + (sample % 3 - 1) * 4) * 60000);
  return {
    automationId: scheduleId,
    status: 'COMPLETED',
    startDateTime: start.toISOString(),
    endDateTime: end.toISOString(),
  };
});

export const createAutomationAnywhereTestScenario = () => {
  const today = new Date();
  const monday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  const startDate = new Date(monday);
  startDate.setDate(startDate.getDate() - 56);
  const devices = Array.from({ length: 10 }, (_, index) => ({
    id: `test-device-${index + 1}`,
    name: `Robot ${String(index + 1).padStart(2, '0')}`,
    type: index % 2 ? 'Bot Runner' : 'Bot Runner (Windows)',
    poolName: `Pool ${index < 5 ? 'A' : 'B'}`,
    status: index === 9 ? 'DISCONNECTED' : 'CONNECTED',
    defaultUsers: Array.from({ length: 3 }, (_, userIndex) => ({
      id: `test-user-${index + 1}-${userIndex + 1}`,
      username: `runner${index + 1}_${userIndex + 1}`,
    })),
  }));

  const schedules = [];
  const activities = [];
  let globalIndex = 0;
  devices.forEach((device, deviceIndex) => {
    const count = deviceIndex === 9 ? 8 : 10;
    Array.from({ length: count }, (_, localIndex) => {
      globalIndex += 1;
      const id = `test-schedule-${String(globalIndex).padStart(3, '0')}`;
      const startMinute = 20 + localIndex * 144 + ((deviceIndex * 13 + localIndex * 7) % 19);
      const hour = Math.floor(startMinute / 60);
      const minute = startMinute % 60;
      const profileBase = deviceIndex < 3 ? 126 : deviceIndex < 6 ? 108 : 91;
      const duration = profileBase + ((globalIndex * 17) % 37);
      const scheduleType = globalIndex % 5 === 0 ? 'WEEKLY' : 'DAILY';
      schedules.push({
        id,
        activityName: `Proceso ${String(globalIndex).padStart(3, '0')}`,
        fileId: `test-file-${String(globalIndex).padStart(3, '0')}`,
        scheduleType,
        taskType: 'RUN_TASK',
        status: globalIndex % 31 === 0 ? 'INACTIVE' : 'ACTIVE',
        startDate: asDate(startDate),
        endDate: '',
        repeatEnabled: true,
        dailyRecurrence: scheduleType === 'DAILY' ? { interval: 1 } : null,
        weeklyRecurrence: scheduleType === 'WEEKLY' ? { interval: 1, daysOfWeek: DAY_KEYS } : null,
        monthlyDateRecurrence: null,
        nextRun: '',
        startTime: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
        runAsUserIds: [device.defaultUsers[(globalIndex + localIndex) % device.defaultUsers.length].id],
      });
      activities.push(...makeHistory(id, globalIndex, duration));
    });
  });

  return {
    isTestScenario: true,
    retrievedAt: new Date().toISOString(),
    fixedScheduleIds: [],
    schedules: { available: true, items: schedules, page: { total: schedules.length }, truncated: false },
    devices: { available: true, items: devices, page: { total: devices.length }, truncated: false },
    pools: {
      available: true,
      items: [
        { id: 'test-pool-a', name: 'Pool A', deviceIds: devices.slice(0, 5).map(({ id }) => id) },
        { id: 'test-pool-b', name: 'Pool B', deviceIds: devices.slice(5).map(({ id }) => id) },
      ],
      page: { total: 2 },
      truncated: false,
    },
    activity: { available: true, items: activities, page: { total: activities.length }, truncated: false },
  };
};
