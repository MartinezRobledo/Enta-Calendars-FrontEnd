import { Grid } from "@mui/material"
import { Navbar, CalendarForm } from "../components"
import { useBD, useConfigEditStore, useUiStore } from "../hooks"
import { SpinModal } from "../components/spinner/spinModal";
import 'sweetalert2/dist/sweetalert2.min.css';
import { Navigate } from 'react-router-dom';

export const EditarPage = () => {
 
  const { 
    titleStore,
    añosStore,
    indexAñoStore,
    changeTitle,
    changeAñosStore,
    changeIndexAño,
    isDisabled,
    _id
  } = useConfigEditStore();

  const {isSpinActive} = useUiStore();
  const { holidays } = useBD();
  const acciones = ['Guardar', 'Exportar'];
  const editDataIsValid = _id
    && holidays.length >= 2
    && Array.isArray(añosStore)
    && añosStore.length > 0
    && Number.isInteger(indexAñoStore)
    && indexAñoStore >= 0
    && indexAñoStore < añosStore.length
    && añosStore.every((year) => year
      && Number(year.año)
      && Array.isArray(year.capasStore)
      && year.capasStore.length > 0
      && year.capasStore.every((layer) => layer?.data && Array.isArray(layer.dias) && Array.isArray(layer.esPadre))
      && Array.isArray(year.diasActivosStore)
      && Array.isArray(year.aditionalDaysToAdd)
      && Array.isArray(year.aditionalDaysToRemove));

  if (!isSpinActive && !editDataIsValid) {
    return <Navigate to="/monitor" replace />;
  }

  if(!isSpinActive)
    return (
      <Grid container direction="column">
        <Grid item sx={{ width: '100%' }}>
          <Navbar />
        </Grid>
        <Grid item xs={12} sx={{ width: '100%', minWidth: 0 }}>
          <CalendarForm
            titleStore={titleStore}
            añosStore={añosStore}
            indexAñoStore={indexAñoStore}
            changeTitle={changeTitle}
            changeAñosStore={changeAñosStore}
            changeIndexAño={changeIndexAño}
            accionesActivas={acciones}
            disabled={isDisabled}
            _id={_id}
          />
        </Grid>
      </Grid>
    )

    return(
      <div style={{display: isSpinActive ? 'flex' : 'none', position:'absolute'}}>
            <SpinModal></SpinModal>
      </div>
    )
    
}
