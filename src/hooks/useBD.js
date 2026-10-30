import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { onInitializeCapa, onStartLoadingHolidays, onStartLoadingTemplates } from "../store";
import { calendarApi } from "../api";
import { fetchCalendars } from "../store/calendar/calendarSlice";
import { useAuthStore } from "./useAuthStore";
import { getSelectedCalendarClient } from '../helpers/calendarClient';

export const useBD = () => {

    const mapHolidayDates = useCallback((holiday) => holiday.dates?.length
        ? holiday.dates.map((date) => {
            const [year, month, day] = date.split('-').map(Number);
            return new Date(year, month - 1, day);
        })
        : (holiday.feriados_ar || []).map((day) => new Date(day)), []);

    const dispatch = useDispatch();
    const { user } = useAuthStore();

    const {
        holidays,
        templates,
    } = useSelector((state) => state.start); // Accede a startDataSlice

    const startLoadingTemplates = useCallback(async() => {
        try {
            const { data } = await calendarApi.get('/templates');
            const template = data?.templates?.[0];
            if (template) dispatch(onStartLoadingTemplates(template));
        } catch (error) {
            console.log(error);
        }
    }, [dispatch]);

    //Traigo feridados del backend y los guardo en el store.
    const startLoadingHolidays = useCallback(async () => {
        try {
            const currentYear = new Date().getFullYear();
            const years = [currentYear - 1, currentYear, currentYear + 1];
            const holidaysByYear = await Promise.all(years.map(async (year) => {
                const { data } = await calendarApi.get(`/holidays/${year}`);
                if (!data.feriados || !Array.isArray(data.feriados.feriados_ar)) {
                    throw new Error(`No se pudieron obtener los feriados de ${year}`);
                }
                return { año: year, holidays: mapHolidayDates(data.feriados) };
            }));

            dispatch(onStartLoadingHolidays(holidaysByYear));
            dispatch(onInitializeCapa(years));
        } catch (error) {
            console.error("Error al cargar los feriados:", error);
            throw error; // Propaga el error para manejarlo en el componente
        }
    }, [dispatch, mapHolidayDates]);

    const saveConfig = useCallback(async(calendario) => {
        try{
            await calendarApi.post('/calendars', calendario);
            return null;
        }
        catch (error) {
            return error;
        }
    }, []);

    const updateConfig = useCallback(async(_id, calendario) => {
        try{
            await calendarApi.put('/calendars', {_id, calendario});
            return null;
        }
        catch (error) {
            return error;
        }
    }, []);

    const deleteCalendarFetch = useCallback(async(id) => {
        try {
            const { data } = await calendarApi.delete('/calendars/'+id);
            return { data, error:null };
        } catch(error) {
            return { data:null, error };
        }
    }, []);

    const getCalendars = useCallback(async({ client = getSelectedCalendarClient() || user.name, search = '', skip = 0 } = {}) => {
        dispatch(fetchCalendars({ client, skip, search }));
    }, [dispatch, user.name]);

    return {
        //* Propiedades
        holidays,
        templates,

        //* Métodos
        startLoadingHolidays,
        startLoadingTemplates,
        saveConfig,
        updateConfig,
        getCalendars,
        deleteCalendarFetch,
    }
};
