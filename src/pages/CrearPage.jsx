import { useEffect, useState } from 'react';
import { Alert, Box, Grid } from "@mui/material"
import { Navbar, CalendarForm } from "../components"
import { useBD, useConfigStore, useUiStore } from "../hooks"
import { SpinModal } from "../components/spinner/spinModal";
import 'sweetalert2/dist/sweetalert2.min.css';

export const CrearPage = () => {

  const {
    titleStore,
    añosStore,
    indexAñoStore,
    changeTitle,
    changeAñosStore,
    changeIndexAño,
    initializeConfig,
  } = useConfigStore();
  const { holidays } = useBD();
  const [configReady, setConfigReady] = useState(false);

  useEffect(() => {
    if (holidays.length < 2 || holidays.some((holiday) => !holiday || !Number(holiday.año))) return;
    initializeConfig(holidays.map((holiday) => holiday.año));
    setConfigReady(true);
  }, [holidays, initializeConfig]);
 
  const {isSpinActive} = useUiStore();
  const acciones = ['Crear', 'Exportar'];

  if (!configReady) {
    return <Box sx={{ maxWidth: 600, mx: 'auto', mt: 8, p: 3 }}>
      <Alert severity="warning">Los datos para crear un calendario todavía no están disponibles. Vuelve a cargar la aplicación e inténtalo de nuevo.</Alert>
    </Box>;
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
