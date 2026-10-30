import { useEffect, useState } from 'react';

export const ALL_CALENDAR_CLIENTS = 'all';
export const CALENDAR_CLIENT_STORAGE_KEY = 'enta-calendars-client';
export const CALENDAR_CLIENT_CHANGED_EVENT = 'enta-calendars-client-changed';

export const getSelectedCalendarClient = () =>
  window.localStorage.getItem(CALENDAR_CLIENT_STORAGE_KEY) || '';

export const setSelectedCalendarClient = (client) => {
  if (client) window.localStorage.setItem(CALENDAR_CLIENT_STORAGE_KEY, client);
  else window.localStorage.removeItem(CALENDAR_CLIENT_STORAGE_KEY);
  window.dispatchEvent(new Event(CALENDAR_CLIENT_CHANGED_EVENT));
};

export const useCalendarClient = (fallback = '') => {
  const [client, setClient] = useState(() => getSelectedCalendarClient() || fallback);

  useEffect(() => {
    const syncClient = () => setClient(getSelectedCalendarClient() || fallback);
    window.addEventListener(CALENDAR_CLIENT_CHANGED_EVENT, syncClient);
    syncClient();
    return () => window.removeEventListener(CALENDAR_CLIENT_CHANGED_EVENT, syncClient);
  }, [fallback]);

  return client;
};
