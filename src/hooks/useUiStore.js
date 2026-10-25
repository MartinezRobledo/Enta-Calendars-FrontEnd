import { useCallback } from "react"
import { useDispatch, useSelector } from "react-redux"
import { onActivateSpin, onCloseDateModal, onDesactivateSpin, onOpenDateModal } from "../store/ui/uiSlice";


export const useUiStore = ()=> {

    const dispatch = useDispatch();

    const {
        isDateModalOpen,
        isSpinActive,
    } = useSelector( state => state.ui );

    const openDateModal = useCallback(() => {
        dispatch( onOpenDateModal() );
    }, [dispatch]);

    const closeDateModal = useCallback(() => {
        dispatch( onCloseDateModal() )
    }, [dispatch]);

    const activateSpin = useCallback(() => {
        dispatch( onActivateSpin() );
    }, [dispatch]);

    const desactivateSpine = useCallback(() => {
        dispatch( onDesactivateSpin() )
    }, [dispatch]);

    return {
        //* Propiedades
        isDateModalOpen,
        isSpinActive,

        //* Métodos
        openDateModal,
        closeDateModal,
        activateSpin,
        desactivateSpine,
    }
}
