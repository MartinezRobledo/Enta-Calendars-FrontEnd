import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { calendarApi } from '../../api';

// Función para convertir las fechas en formato ISO a objetos Date
export const convertDatesToObjects = (calendars) => {
  return calendars.map(calendar => {
    if (!Array.isArray(calendar.añosStore)) {
      return {
        ...calendar,
        fechaActualizacion: calendar.fechaActualizacion ? new Date(calendar.fechaActualizacion) : null,
      };
    }

    calendar.añosStore.forEach(año => {
      if (año.capasStore) {
        año.capasStore.forEach(capa => {
          if (capa.dias) {
            capa.dias = capa.dias.map(fecha => new Date(fecha));
          }
          if (capa.data) {
            capa.data.initCalendar = new Date(capa.data.initCalendar);
            capa.data.finishCalendar = new Date(capa.data.finishCalendar);
          }
        });
      }
      if (año.diasActivosStore) {
        año.diasActivosStore = año.diasActivosStore.map(fecha => new Date(fecha));
      }
    })
    calendar.fechaActualizacion = new Date(calendar.fechaActualizacion);
    return calendar;
  });
};

export const CALENDARS_PAGE_SIZE = 48;

export const fetchCalendars = createAsyncThunk('calendars/fetchCalendars', async ({ client, skip = 0, search = '' }, { rejectWithValue }) => {
  try {
    const response = await calendarApi.get('/calendars/' + encodeURIComponent(client || ''), {
      params: { skip, limit: CALENDARS_PAGE_SIZE, search },
    });
    if (!Array.isArray(response.data.calendars)) {
      throw new Error('El formato de datos del API no es válido');
    }
    return {
      calendars: response.data.calendars,
      pagination: response.data.pagination || {
        skip,
        limit: CALENDARS_PAGE_SIZE,
        total: response.data.calendars.length,
        hasMore: false,
      },
    };
  } catch (error) {
    console.error(error);
    return rejectWithValue(error.response?.data || 'Error desconocido');
  }
});

export const calendarSlice = createSlice({
    name: 'calendars',
    initialState: {
    calendars: [],
    status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
    loadingMore: false,
    error: null,
    loadMoreError: null,
    total: 0,
    hasMore: false,
    currentRequestId: null,
  },
  reducers: {
    onDeleteCalendar: (state, {payload}) => {
      state.calendars = state.calendars.filter(calendar => calendar._id != payload);
      state.total = Math.max(0, state.total - 1);
      state.hasMore = state.calendars.length < state.total;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCalendars.pending, (state, action) => {
        state.currentRequestId = action.meta.requestId;
        state.error = null;
        state.loadMoreError = null;
        if (action.meta.arg.skip === 0) {
          state.status = 'loading';
          state.calendars = [];
          state.total = 0;
          state.hasMore = false;
        } else {
          state.loadingMore = true;
        }
      })
      .addCase(fetchCalendars.fulfilled, (state, action) => {
        if (state.currentRequestId !== action.meta.requestId) return;
        const { skip, total, hasMore } = action.payload.pagination;
        state.status = 'succeeded';
        state.loadingMore = false;
        state.total = total;
        state.hasMore = hasMore;
        if (skip === 0) {
          state.calendars = action.payload.calendars;
        } else {
          const existingIds = new Set(state.calendars.map(calendar => calendar._id));
          state.calendars.push(...action.payload.calendars.filter(calendar => !existingIds.has(calendar._id)));
        }
      })
      .addCase(fetchCalendars.rejected, (state, action) => {
        if (state.currentRequestId !== action.meta.requestId) return;
        state.loadingMore = false;
        if (action.meta.arg.skip === 0) {
          state.status = 'failed';
          state.error = typeof action.payload === 'string' ? action.payload : action.payload?.msg || action.error.message;
        } else {
          state.loadMoreError = typeof action.payload === 'string' ? action.payload : action.payload?.msg || action.error.message;
        }
      });
  },
});

// Action creators are generated for each case reducer function
export const { 
  onDeleteCalendar,
} = calendarSlice.actions;
