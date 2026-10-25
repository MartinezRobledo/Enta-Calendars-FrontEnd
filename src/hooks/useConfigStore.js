import { useCallback } from "react"
import { useDispatch, useSelector } from "react-redux"
import { 
        onChangeAñosStore,
        onChangeDiasActivos, 
        onChangeIndexAño, 
        onChangeTitle,
        onInitializeCapa,
    } from "../store/config/configSlice";

export const useConfigStore = ()=> {

    const dispatch = useDispatch();

    const {
        titleStore,
        añosStore,
        indexAñoStore,
    } = useSelector( state => state.config ); // Accede a configSlice

    const changeTitle = (value) => {
        dispatch( onChangeTitle(value) );
    }

    const changeDiasActivos = (days, año) => {
        dispatch(onChangeDiasActivos({año, data: days}));
    }

    const changeIndexAño = (año) => {
        dispatch(onChangeIndexAño(año));
    }

    const changeAñosStore = (años) => {
        dispatch(onChangeAñosStore(años));
    }

    const initializeConfig = useCallback((years) => {
        dispatch(onInitializeCapa(years));
    }, [dispatch]);

    return {
        //* Propiedades
        titleStore,
        añosStore,
        indexAñoStore,

        //* Métodos
        changeTitle,
        changeDiasActivos,
        changeIndexAño,
        changeAñosStore,
        initializeConfig,
    }
}
