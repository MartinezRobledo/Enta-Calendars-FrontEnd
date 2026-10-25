import { createSlice } from '@reduxjs/toolkit';

const clearAuthStorage = () => {
    const themeMode = localStorage.getItem('enta-theme-mode');
    localStorage.clear();
    if (themeMode) localStorage.setItem('enta-theme-mode', themeMode);
};

export const authSlice = createSlice({
    name: 'name',
    initialState: {
        status: 'checking',
        errorMessage: undefined,
        user: {},
    },
    reducers: {
        onChecking: ( state ) => {
            state.status = 'checking';
            state.user = {};
            state.errorMessage = undefined;
        },
        onLogin: ( state, { payload } ) => {
            state.status = 'authenticated';
            state.user = payload;
            state.errorMessage = undefined;
        },
        onLogout: ( state, { payload } ) => {
            state.status = 'no-authenticated';
            state.user = {};
            clearAuthStorage();
            state.errorMessage = payload;
        },
        clearErrorMessage: ( state ) => {
            state.errorMessage = undefined;
        }
    }
});

// Action creators are generated for each case reducer function
export const { onChecking, onLogin, onLogout, clearErrorMessage } = authSlice.actions;
