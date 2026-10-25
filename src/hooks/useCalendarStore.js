import { useDispatch, useSelector } from "react-redux";
import { onDeleteCalendar } from "../store/calendar/calendarSlice";

export const useCalendarStore = () => {
  
    const dispatch = useDispatch();

    const {
        calendars,
        status, // 'idle' | 'loading' | 'succeeded' | 'failed'
        loadingMore,
        error,
        loadMoreError,
        total,
        hasMore,
    } = useSelector( state => state.calendar );

    const deleteCalendar = async(id) => {
        dispatch(onDeleteCalendar(id));
    }

    return {
        //*Propiedades
        calendars,
        status, // 'idle' | 'loading' | 'succeeded' | 'failed'
        loadingMore,
        error,
        loadMoreError,
        total,
        hasMore,

        //*Metodos
        deleteCalendar,
    }
}

