import { createSlice } from '@reduxjs/toolkit';
import { isSameDay } from 'date-fns';

export const configEditSlice = createSlice({
    name: 'configEdit',
    initialState: {
        titleStore: '',
        isDisabled: true,
        añosStore: [{
            año: null,
            capasStore: [{
                id: 1,
                title: 'Capa 1',
                data: {
                    initCalendar: new Date(),
                    finishCalendar: new Date(),
                    byWeekday: {},
                    byMonthday: [],
                    byMonthdayStr: '',
                    allDays: false,
                    agrupar: false,
                    withHolidays: true,
                },
                dependienteDe: null,
                esPadre: [],
                dias: [],
            }],
            capaActualStore: 0,
            aditionalDaysToAdd: [],
            aditionalDaysToRemove: [],
            diasActivosStore: [],
        }],
        indexAñoStore: 0,
        cliente: '',
        fechaActualizacion: null,
        _id: null
    },
    reducers: {
        onInitializeCapaEdit: (state, { payload }) => {
            state.añosStore = payload.añosStore;
            state.titleStore = payload.titleStore;
            state.isDisabled = false;
            state._id = payload._id;
            state.cliente = payload.cliente || '';
        },
        onChangeTitle: (state, { payload }) => {
            state.titleStore = payload;
        },      
        onChangeAditionalDaysToAdd: (state, { payload }) => {
            const index = state.añosStore.findIndex(config => config.año === payload.año);
            if (index !== -1) {
                // Añado el día de la lista de días a añadir
                state.añosStore[index].aditionalDaysToAdd = [...state.añosStore[index].aditionalDaysToAdd, payload.date];
                // Elimino el día de la lista de días a excluir
                state.añosStore[index].aditionalDaysToRemove = state.añosStore[index].aditionalDaysToRemove.filter(
                    (day) => !isSameDay(day, payload.date)
                );
            }
        },
        onChangeAditionalDaysToRemove: (state, { payload }) => {
            const index = state.añosStore.findIndex(config => config.año === payload.año);
            if (index !== -1) {
                // Añado el día de la lista de días a excluir
                state.añosStore[index].aditionalDaysToRemove = [...state.añosStore[index].aditionalDaysToRemove, payload.date];
                // Elimino el día de la lista de días a añadir
                state.añosStore[index].aditionalDaysToAdd = state.añosStore[index].aditionalDaysToAdd.filter(
                    (day) => !isSameDay(day, payload.date)
                );
            }
        },
        onChangeDiasActivos: (state, { payload }) => {
            const index = state.añosStore.findIndex(config => config.año === payload.año);
            if (index !== -1) {
                state.añosStore[index].diasActivosStore = payload.data;
            }
        },
        onChangeCapas: (state, { payload }) => {
            const index = state.añosStore.findIndex(config => config.año === payload.año);
            if (index !== -1) {
                state.añosStore[index].capasStore = payload.data;
            }
        },
        onChangeCapaActual: (state, { payload }) => {
            const index = state.añosStore.findIndex(config => config.año === payload.año);
            if (index !== -1) {
                state.añosStore[index].capaActualStore = payload.data;
            }
        },
        onChangeIndexAñoEdit: (state, { payload }) => {
            state.indexAñoStore = payload;
        },
        onChangeAñosStoreEdit: (state, { payload }) => {
            state.añosStore = payload;
        },
        onChange_id: (state, { payload }) => {
            state._id = payload
        },
    },
});

// Exporta las acciones
export const {
    onChangeTitle,
    onChangeAditionalDaysToAdd,
    onChangeAditionalDaysToRemove,
    onChangeDiasActivos,
    onChangeCapas,
    onChangeCapaActual,
    onInitializeCapaEdit,
    onChangeIndexAñoEdit,
    onChangeAñosStoreEdit,
    onChange_id,
} = configEditSlice.actions;
