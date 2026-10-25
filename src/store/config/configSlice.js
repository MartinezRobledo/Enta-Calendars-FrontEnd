import { createSlice } from '@reduxjs/toolkit';
import { isSameDay } from 'date-fns';

export const configSlice = createSlice({
    name: 'config',
    initialState: {
        titleStore: '',
        añosStore: [{
            año: null,
            capasStore: [],
            capaActualStore: 0,
            aditionalDaysToAdd: [],
            aditionalDaysToRemove: [],
            diasActivosStore: [],
        }],
        indexAñoStore: 0,
        fechaActualizacion: null,
    },
    reducers: {
        onInitializeCapa: (state, { payload }) => {
            state.titleStore = '';
            state.indexAñoStore = 0;
            state.añosStore = [...payload.map(año => {
                return ({
                    año: año,
                    capasStore: [{
                        id: 1,
                        title: 'Capa 1',
                        data: {
                          initCalendar: new Date(año, 0, 1),
                          finishCalendar: new Date(año, 11, 31),
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
                })    
            })];
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
            console.log("payload capas", payload);  
            const index = state.añosStore.findIndex(config => config.año === payload.año);
            console.log("seteando por index", index);
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
        onChangeIndexAño: (state, { payload }) => {
            state.indexAñoStore = payload;
        },
        onChangeAñosStore: (state, { payload }) => {
            state.añosStore = payload;
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
    onInitializeCapa,
    onChangeIndexAño,
    onChangeAñosStore,
} = configSlice.actions;
