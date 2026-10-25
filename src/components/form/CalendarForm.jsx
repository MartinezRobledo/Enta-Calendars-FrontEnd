import { useEffect, useRef, useState } from 'react';
import { Alert, Box, Typography, IconButton, Grid, Input, ButtonGroup, Button } from '@mui/material';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import { useAuthStore, useBD } from '../../hooks';
import Swal from 'sweetalert2/dist/sweetalert2.js';
import SaveAsIcon from '@mui/icons-material/SaveAs';
import CancelIcon from '@mui/icons-material/Cancel';
import SaveAltIcon from '@mui/icons-material/SaveAlt';
import EditCalendarIcon from '@mui/icons-material/EditCalendar';
import 'sweetalert2/dist/sweetalert2.min.css';
import Calendar from '../calendar/Calendar';
import { CapasForm } from './CapasForm';
import { ActionButtons } from './components/ActionButtons';
import { crear, guardar } from './functions/calendarsFunctions';
import { CALENDAR_EXPORT_FORMATS, createCalendarExport } from './functions/calendarExports';

export const CalendarForm = ({
  titleStore, 
  añosStore,
  indexAñoStore,
  changeTitle,
  changeAñosStore,
  changeIndexAño,
  accionesActivas,
  disabled,
  _id
}) => {

const downloadCalendarFile = ({ blob, filename }) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
};

const { holidays, getCalendars, saveConfig, updateConfig } = useBD();
const { user } = useAuthStore();

const currentCalendarYear = new Date().getFullYear();
const currentYearIndex = Array.isArray(añosStore)
  ? añosStore.findIndex((year) => Number(year.año) === currentCalendarYear)
  : -1;
const previousYearIndex = Array.isArray(añosStore)
  ? añosStore.findIndex((year) => Number(year.año) === currentCalendarYear - 1)
  : -1;
const initialYearIndex = currentYearIndex >= 0
  ? currentYearIndex
  : previousYearIndex >= 0
    ? previousYearIndex
    : Math.min(indexAñoStore || 0, Math.max((añosStore?.length || 1) - 1, 0));

const [indexaño, setIndexAño] = useState(initialYearIndex);
const [title, setTitle] = useState(titleStore);
const [capaActual, setCapaActual] = useState(añosStore?.[indexaño]?.capaActualStore ?? 0);
const [capas, setCapas] = useState(añosStore?.[indexaño]?.capasStore ?? []);
const [isDisabled, setIsDisabled] = useState(disabled); // Nuevo estado para deshabilitar formulario
const [diasActivos, setDiasActivos] = useState(añosStore?.[indexaño]?.diasActivosStore ?? []);
const [añosActivos, setAñosActivos] = useState(Array.isArray(añosStore) ? añosStore : []);

const titleRef = useRef(""); // Usamos useRef para rastrear el valor actual de `title`
const indexAñoRef = useRef(indexaño);
const añosRef = useRef(añosActivos);

const [showButtons, setShowButtons] = useState(false);

const currentYearConfig = añosActivos[indexaño];
const previousCalendarYearIndex = añosActivos.findIndex((year) =>
  Number(year.año) === Number(currentYearConfig?.año) - 1
  && Number(year.año) >= currentCalendarYear - 1
);
const nextCalendarYearIndex = añosActivos.findIndex((year) =>
  Number(year.año) === Number(currentYearConfig?.año) + 1
  && Number(year.año) <= currentCalendarYear + 1
);
const holidaysForYear = holidays?.find((holiday) => Number(holiday.año) === Number(currentYearConfig?.año))
  || { año: currentYearConfig?.año, holidays: [] };
const formDataIsValid = currentYearConfig
  && Number(currentYearConfig.año)
  && Array.isArray(currentYearConfig.capasStore)
  && currentYearConfig.capasStore.length > 0
  && Array.isArray(currentYearConfig.diasActivosStore)
  && Array.isArray(currentYearConfig.aditionalDaysToAdd)
  && Array.isArray(currentYearConfig.aditionalDaysToRemove)
  && Number.isInteger(capaActual)
  && capaActual >= 0
  && capaActual < currentYearConfig.capasStore.length
  && currentYearConfig.capasStore.every((capa) => capa?.data && Array.isArray(capa.dias) && Array.isArray(capa.esPadre));

const actions = [
  {
    key: 'Crear',
    icon: <EditCalendarIcon />,
    handler: async() => {
      const validado = validarFormulario();
      if(!validado) return;

      const response = await crear(title, añosActivos, user.name, saveConfig);
      if(!response.ok) {
        Swal.fire({
          icon: 'error',
          title: 'No se pudo crear el calendario',
          text: response.msg.response.data.msg,
          confirmButtonText: 'Entendido',
          buttonsStyling: true, // Permite personalizar el estilo del botón
          confirmButtonColor: '#ff8a00'
        });
        return;
      }

      Swal.fire({
        icon: 'success',
        title: 'Se creó exitosamente el calendario',
        text: 'Guardado como: '+title,
        confirmButtonText: 'Entendido',
        buttonsStyling: true, // Permite personalizar el estilo del botón
        confirmButtonColor: '#ff8a00'
      });
      getCalendars(user.name);   //Traigo nuevamente los datos de la base de datos. 
    }
  },
  {
    key: 'Guardar',
    icon: <SaveAsIcon />,
    handler: async() => {
      const validado = validarFormulario();
      if(!validado) return;

      const response = await guardar(_id, title, añosActivos, user.name, updateConfig);
      if(!response.ok) {
        Swal.fire({
          icon: 'error',
          title: 'No se pudo guardar el calendario',
          text: response.msg.response.data.msg,
          confirmButtonText: 'Entendido',
          buttonsStyling: true, // Permite personalizar el estilo del botón
          confirmButtonColor: '#ff8a00'
        });
        return;
      }

      Swal.fire({
        icon: 'success',
        title: response.msg,
        text: 'Guardado como: '+title,
        confirmButtonText: 'Entendido',
        buttonsStyling: true, // Permite personalizar el estilo del botón
        confirmButtonColor: '#ff8a00'
      });
      getCalendars(user.name);   //Traigo nuevamente los datos de la base de datos. 
    }
  },
  {
    key: 'Exportar',
    icon: <SaveAltIcon />,
    handler: () => {
      const validado = validarFormulario();
      if(!validado) return;

      setIsDisabled(true);
      setShowButtons(true);
    }
  },
].filter(action => accionesActivas.includes(action.key));

useEffect(() => {
  // Función de limpieza que se ejecuta al desmontar
  return () => {
    actualizarStore();
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);

const actualizarStore = () => {
  titleRef.current ? changeTitle(titleRef.current) : null; 
  indexAñoRef.current >= 0 ? changeIndexAño(indexAñoRef.current) : null;
  añosRef.current ? changeAñosStore(añosRef.current) : null;
};

const handleYearChange = (direction) => {
    const targetYear = Number(añosActivos[indexaño]?.año) + direction;
    if (targetYear < currentCalendarYear - 1 || targetYear > currentCalendarYear + 1) return;
    const newIndexAño = añosActivos.findIndex((year) => Number(year.año) === targetYear);
    if (newIndexAño < 0 || newIndexAño === indexaño) return;

    indexAñoRef.current = newIndexAño;
    const newAño = añosActivos[newIndexAño];
    setCapas(newAño.capasStore);
    setCapaActual(newAño.capaActualStore);
    setDiasActivos(newAño.diasActivosStore);
    setIndexAño(newIndexAño);
};

const handleBlur = () => {
    titleRef.current = title;
};

const handleDiasAdicionales = (dia) => {
  setAñosActivos((prev) => {
    let newAños = [...prev]; // Copia superficial del array

    const aditionalDays = newAños[indexaño].aditionalDaysToAdd;
    const dayExists = aditionalDays.some(existingDay => 
      new Date(existingDay).getTime() === new Date(dia).getTime()
    );

    newAños[indexaño] = { // Crea un nuevo objeto basado en el existente
      ...newAños[indexaño],
      aditionalDaysToAdd: dayExists
        ? aditionalDays.filter(existingDay => 
            new Date(existingDay).getTime() !== new Date(dia).getTime()
          ) // Si existe, lo elimina
        : [...aditionalDays, dia], // Si no existe, lo agrega
      aditionalDaysToRemove: newAños[indexaño].aditionalDaysToRemove.filter(removedDay =>
        new Date(removedDay).getTime() !== new Date(dia).getTime()
      ), // Siempre lo elimina
    };

    return newAños; // Retorna el nuevo array con los cambios
  });
};

const handleDiasExcluidos = (dia) => {
  setAñosActivos((prev) => {
    let newAños = [...prev]; // Copia superficial del array

    const removalDays = newAños[indexaño].aditionalDaysToRemove;
    const dayExists = removalDays.some(existingDay => 
      new Date(existingDay).getTime() === new Date(dia).getTime()
    );

    newAños[indexaño] = { // Crea un nuevo objeto basado en el existente
      ...newAños[indexaño],
      aditionalDaysToRemove: dayExists
        ? removalDays.filter(existingDay => 
            new Date(existingDay).getTime() !== new Date(dia).getTime()
          ) // Si existe, lo elimina
        : [...removalDays, dia], // Si no existe, lo agrega
      aditionalDaysToAdd: newAños[indexaño].aditionalDaysToAdd.filter(aditionalDay =>
        new Date(aditionalDay).getTime() !== new Date(dia).getTime()
      ), // Siempre lo elimina
    };

    return newAños; // Retorna el nuevo array con los cambios
  });
};

const validarFormulario = () => {
  if(!title) {
    Swal.fire({
      icon: 'error',
      title: 'No definió ningún nombre',
      text: 'No se puede crear un calendario sin nombre',
      confirmButtonText: 'Entendido',
      buttonsStyling: true, // Permite personalizar el estilo del botón
      confirmButtonColor: '#ff8a00'
    });
    return false;
  }

  if(diasActivos.length === 0 && (añosActivos[indexaño].aditionalDaysToAdd || []).length === 0) {
    Swal.fire({
      icon: 'error',
      title: 'No definió ningún día',
      text: 'No se puede crear un calendario sin días',
      confirmButtonText: 'Entendido',
      buttonsStyling: true, // Permite personalizar el estilo del botón
      confirmButtonColor: '#ff8a00'
    });
    return false;
  }
  return true;
}

const exportHandler = (extension) => {
  actualizarStore();
  try {
    const file = createCalendarExport({ titleStore: title, añosStore: añosActivos }, extension, user.name);
    downloadCalendarFile(file);
  } catch (error) {
    Swal.fire('No se pudo exportar', error.message || 'No se generó el archivo.', 'error');
  } finally {
    setIsDisabled(false);
    setShowButtons(false);
  }
}

useEffect(() => {
    setAñosActivos((prev) => {
        let newAños = [...prev]; // Copia superficial del array
        if (!newAños[indexaño]) return prev;
        newAños[indexaño] = { // Crea un nuevo objeto basado en el existente
            ...newAños[indexaño],
            capasStore: capas,
            capaActualStore: capaActual,
            diasActivosStore: diasActivos
        };
        return newAños; // Retorna el nuevo array con los cambios
    });
}, [capas, capaActual, diasActivos, indexaño])

useEffect(() => {
    añosRef.current = añosActivos;
}, [añosActivos])

if (!formDataIsValid) {
  return <Alert severity="warning" sx={{ m: 3 }}>
    No se pudo abrir este calendario porque su configuración está incompleta. Vuelve al monitor y prueba nuevamente.
  </Alert>;
}

  return (
    <Grid container direction="column" sx={{ width: '100%', minWidth: 0 }}>
      <Grid container item sx={{ flex: 1, width: '100%', minWidth: 0, p: { xs: 1, md: 2 } }}>
        <Grid item xs={12} md={6} xl={4} sx={{ minWidth: 0 }}>

        {/*Navegador de años*/}
        <Box 
            display="flex" 
            alignItems="center" 
            justifyContent="space-between" 
            mb={2} 
            sx={{ border: '1px solid', borderColor: 'secondary.extra', borderRadius: 5, p: 1 }}
        >
            <Box>
            { previousCalendarYearIndex >= 0
                ? ( 
                    <IconButton onClick={() => handleYearChange(-1)} disabled={isDisabled}>
                    <ArrowBackIosIcon/>
                    </IconButton>
                )
                : ( 
                    <IconButton style={{ visibility: "hidden" }}>
                    <ArrowBackIosIcon />
                    </IconButton>
                )
            }
            </Box>
            <Typography variant="h6" mx={2}>
            {holidaysForYear.año}
            </Typography>
            <Box>
            { nextCalendarYearIndex >= 0
                ? ( <IconButton onClick={() => handleYearChange(1)} disabled={isDisabled}>
                    <ArrowForwardIosIcon color={'primary.extra'}/>
                    </IconButton>
                )
                : ( <IconButton style={{ visibility: "hidden" }}>
                    <ArrowForwardIosIcon />
                    </IconButton>
                )
            }
            </Box>
        </Box>

        {/*Titulo del calendario*/}
        <Input disabled={isDisabled}
            placeholder="Ingrese nombre del calendario"
            value={title}
            type="text"
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleBlur} // Actualiza la referencia cuando el input pierde el foco
            sx={{
                maxWidth: '500px',
                width: '100%',
                height: '50px',
                fontSize: '1.5rem',
                padding: '10px',
                mb: 1,
            }}
        />

        {/*Formulario*/}
        <CapasForm 
            key={indexaño}
            isDisabled={isDisabled}
            año={currentYearConfig.año}
            holidays={holidaysForYear.holidays}
            capasInicial={currentYearConfig.capasStore}
            capaActualInicial={capaActual}
            actualizarConfig={(capasx, capaActualx, diasActivosx) => {
                setCapas(capasx);
                setCapaActual(capaActualx);
                setDiasActivos(diasActivosx);
            }}
        />

        {/*Botones de exportación*/}
        <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'center', marginTop:'2rem'}}>
            { 
              showButtons
              ? 
              <div className="animate__animated animate__bounceIn"
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', width: 'fit-content', margin: '0 auto' }}
              >
                  {/* Formatos de exportación */}
                  <ButtonGroup sx={{ flexWrap: 'wrap', justifyContent: 'center' }}>
                    {CALENDAR_EXPORT_FORMATS.map(({ extension, label }) => (
                      <Button
                        key={extension}
                        variant="contained"
                        onClick={() => exportHandler(extension)}
                        sx={{
                          color: 'primary.contrastText',
                          backgroundColor: 'primary.main',
                          '&:hover': { backgroundColor: 'primary.dark' },
                        }}
                      >
                        {label}
                      </Button>
                    ))}
                  </ButtonGroup>
                  {/* Contenido del grupo de botones */}
                  <ActionButtons Buttons={[{
                      key:'Cancelar', 
                      icon: <CancelIcon />, 
                      handler: () => {
                        setIsDisabled(false);
                        setShowButtons(false)
                      }
                    }]}
                    bgColor="error.main"
                    hoverBgColor="primary.extra"
                    icon={<CancelIcon />}
                  />
              </div>
              :
              <ButtonGroup>
                <ActionButtons Buttons={actions} isDisabled={isDisabled}/>
              </ButtonGroup>
            }
        </Grid>

        </Grid>
      <Grid item xs={12} md={6} xl={8} sx={{ minWidth: 0 }}>
        <Calendar
            anio={holidaysForYear.año}
            isDisabled={isDisabled}
            diasActivos={diasActivos}
            aditionalDaysToAdd={currentYearConfig.aditionalDaysToAdd || []}
            aditionalDaysToRemove={currentYearConfig.aditionalDaysToRemove || []}
            changeAditionalDaysToAdd={(dia) => handleDiasAdicionales(dia)}
            changeAditionalDaysToRemove={(dia) => handleDiasExcluidos(dia)}
        />
      </Grid>
    </Grid>
  </Grid>
  );
};
