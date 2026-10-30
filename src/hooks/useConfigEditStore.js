import { useDispatch, useSelector } from "react-redux"
import { 
        onChange_id, 
        onChangeAñosStoreEdit, 
        onChangeDiasActivos, 
        onChangeIndexAñoEdit, 
        onChangeTitle,
        onInitializeCapaEdit 
} from "../store/config/configEditSlice";

export const useConfigEditStore = ()=> {

    const dispatch = useDispatch();

    const {
        titleStore,
        añosStore,
        indexAñoStore,
        cliente,
        _id,
        isDisabled,
    } = useSelector( state => state.configEdit ); // Accede a configSlice de edicion

    const changeTitle = (value) => {
        dispatch( onChangeTitle(value) );
    }

    const changeDiasActivos = (days) => {
        dispatch(onChangeDiasActivos(days));
    }

    const changeOnInitializeCapaEdit = (capa) => {
        dispatch(onInitializeCapaEdit(capa));
    }

    const change_id = (id) => {
        dispatch(onChange_id(id));
    }

    const changeIndexAño = (año) => {
        dispatch(onChangeIndexAñoEdit(año));
    }

    const changeAñosStore = (años) => {
        dispatch(onChangeAñosStoreEdit(años));
    }

    return {
        //* Propiedades
        titleStore,
        añosStore,
        indexAñoStore,
        cliente,
        _id,
        isDisabled,

        //* Métodos
        changeTitle,
        changeDiasActivos,
        changeOnInitializeCapaEdit,
        change_id,
        changeAñosStore,
        changeIndexAño,
    }
}
