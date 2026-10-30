import { CircularProgress, Grid, TextField, Toolbar, Checkbox, ButtonGroup, Button, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { SimplePaper } from '../../components';
import { useAuthStore, useBD, useCalendarStore, useConfigEditStore } from '../../hooks';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2/dist/sweetalert2.js';
import 'sweetalert2/dist/sweetalert2.min.css';
import { CALENDAR_EXPORT_FORMATS, createCalendarExport } from '../../components/form/functions/calendarExports';
import { calendarApi } from '../../api';
import { convertDatesToObjects } from '../../store/calendar/calendarSlice';

const downloadBlob = (blob, filename) => {
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
};

const registerCalendarExport = (calendarIds, extension) =>
    calendarApi.post('/audit/export', { calendarIds, extension });

const CalendariosMonitor = () => {
    const { calendars, status, loadingMore, loadMoreError, error, total, hasMore, deleteCalendar } = useCalendarStore();
    const { getCalendars, deleteCalendarFetch } = useBD();
    const { user } = useAuthStore();
    const { changeOnInitializeCapaEdit } = useConfigEditStore();
    const [search, setSearch] = useState(""); // Estado para el input de búsqueda
    const [selectedCalendars, setSelectedCalendars] = useState([]); // Calendarios seleccionados
    const [selectAll, setSelectAll] = useState(false);
    const [extension, setExtension] = useState(() => {
        const requestedFormat = new URLSearchParams(window.location.search).get('format');
        return CALENDAR_EXPORT_FORMATS.some(({ extension: format }) => format === requestedFormat)
            ? requestedFormat
            : '.bprelease';
    });
    // const [selectedIds, setSelectedIds] = useState([])
    const navigate = useNavigate();

    const loadCalendarDetails = async (calendarId) => {
        const { data } = await calendarApi.get(`/calendars/${user.name}/${calendarId}`);
        return convertDatesToObjects([data.calendar])[0];
    };

    const verCalendar = async (calendar) => {
        try {
            const fullCalendar = await loadCalendarDetails(calendar._id);
            changeOnInitializeCapaEdit(fullCalendar);
            navigate('/editar');
        } catch (error) {
            Swal.fire('No se pudo abrir el calendario', error.response?.data?.msg || 'Inténtelo nuevamente.', 'error');
        }
    }

    const handleSearchChange = (event) => {
        setSearch(event.target.value);
    };

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            setSelectedCalendars([]);
            setSelectAll(false);
            getCalendars({ search: search.trim(), skip: 0 });
        }, search ? 300 : 0);

        return () => window.clearTimeout(timeoutId);
    }, [getCalendars, search]);

    const handleSelectAll = (event) => {
        if (event.target.checked) {
            setSelectedCalendars((selected) => [...new Set([...selected, ...calendars.map(calendar => calendar._id)])]);
            setSelectAll(true);
        } else {
            const loadedIds = new Set(calendars.map((calendar) => calendar._id));
            setSelectedCalendars((selected) => selected.filter((id) => !loadedIds.has(id)));
            setSelectAll(false);
        }
    };

    const handleExtensionChange = (ext) => {
        setExtension(ext);
    };

    const handleDownloadSelected = async () => {
        if (selectedCalendars.length === 0) return;

        if (selectedCalendars.length === 1) {
            const calendar = calendars.find(c => c._id === selectedCalendars[0]);
            if (calendar) descargarCalendar(calendar, extension);
            return;
        }

        const selected = selectedCalendars.map(calendarId => calendars.find(c => c._id === calendarId)).filter(Boolean);
        const files = (await Promise.all(selected.map(async (summary) => {
            try {
                const calendar = await loadCalendarDetails(summary._id);
                return { ...createCalendarExport(calendar, extension, user.name), calendarId: calendar._id };
            } catch (error) {
                console.error('Error generating file for calendar', summary._id, error);
                return null;
            }
        }))).filter(Boolean);

        if (files.length === 0) {
            alert('No se pudieron generar los archivos para descargar');
            return;
        }

        try {
            const JSZipModule = await import('jszip');
            const JSZip = JSZipModule.default || JSZipModule;
            const zip = new JSZip();
            files.forEach(({ filename, blob }) => zip.file(filename, blob));

            const zipBlob = await zip.generateAsync({ type: 'blob' });
            try {
                await registerCalendarExport(files.map(file => file.calendarId), extension);
            } catch (error) {
                Swal.fire('No se pudo registrar la exportación', error.response?.data?.msg || 'No se descargaron los archivos.', 'error');
                return;
            }
            downloadBlob(zipBlob, 'calendars.zip');
        } catch (error) {
            console.error('JSZip not available or error during zipping', error);
            const downloadIndividually = confirm(
                'No se pudo generar el ZIP automáticamente. ¿Desea descargar los archivos individualmente en su lugar?'
            );

            if (downloadIndividually) {
                try {
                    await registerCalendarExport(files.map(file => file.calendarId), extension);
                } catch (auditError) {
                    Swal.fire('No se pudo registrar la exportación', auditError.response?.data?.msg || 'No se descargaron los archivos.', 'error');
                    return;
                }
                files.forEach(({ filename, blob }) => downloadBlob(blob, filename));
            }
        }
    };

    const descargarCalendar = async (calendar, ext) => {
        try {
            const fullCalendar = await loadCalendarDetails(calendar._id);
            const file = createCalendarExport(fullCalendar, ext, user.name);
            await registerCalendarExport([calendar._id], ext);
            downloadBlob(file.blob, file.filename);
        } catch (error) {
            Swal.fire('No se pudo exportar', error.response?.data?.msg || error.message || 'No se descargó el archivo.', 'error');
        }
    };

    const eliminarCalendar = (calendar) => {
        // Mostrar SweetAlert con los botones y personalización
        Swal.fire({
          icon: 'warning', // Ícono de advertencia (puedes cambiarlo a 'error' si prefieres)
          title: '¿Seguro desea eliminar el calendario?',
          text: `¿Está seguro de que desea eliminar el calendario: ${calendar.titleStore}?`, // Personaliza el texto
          showCancelButton: true, // Muestra el botón de cancelar
          confirmButtonText: 'Eliminar', // Texto del botón de confirmación
          cancelButtonText: 'Cancelar', // Texto del botón de cancelación
          confirmButtonColor: '#ff8a00', // Color del botón de confirmación
          cancelButtonColor: '#d33', // Color del botón de cancelación
          buttonsStyling: true, // Permite personalizar el estilo de los botones
          reverseButtons: true,
        }).then(async (result) => {
          // Si el usuario confirma la acción (clic en "Eliminar")
          if (result.isConfirmed) {
            // Llamamos a la función para eliminar el calendario
            // deleteCalendar(calendar._id);
            const { error } = await deleteCalendarFetch(calendar._id);
      
            if (error) {
              console.error(error);
              Swal.fire(
                'No se pudo eliminar',
                error.response?.data?.msg || 'El calendario sigue disponible. Inténtelo nuevamente.',
                'error'
              );
              return;
            }

            Swal.fire(
              'Eliminado',
              'El calendario se eliminó y puede restaurarse desde Auditoría.',
              'success'
            );
            deleteCalendar(calendar._id);
          }
        });
      };

    const allLoadedSelected = calendars.length > 0 && calendars.every((calendar) => selectedCalendars.includes(calendar._id));

    if (status === 'loading') {
        return (
            <Grid container justifyContent="center" alignItems="center" sx={{ height: '100%' }}>
                <CircularProgress />
            </Grid>
        );
    }

    if (status === 'failed') {
        return <div>Error al cargar los calendarios: {error}</div>;
    }

    return (
        <Grid container sx={{display:'flex', justifyContent:'center'}}>
            <Grid item sx={{width: '100%', marginBottom:'2px' }}>
                <TextField
                    label="Buscar calendario..."
                    variant="outlined"
                    fullWidth
                    value={search}
                    onChange={handleSearchChange}
                />
            </Grid>

            {/* Barra de herramientas */}
            <Grid item sx={{ width: '100%', backgroundColor: 'background.paper', color: 'text.primary' }}>
                <Toolbar sx={{ flexWrap: 'wrap', gap: 1 }}>
                    {/* Selección de los calendarios ya cargados */}
                    <Checkbox
                        checked={allLoadedSelected}
                        onChange={handleSelectAll}
                        inputProps={{ 'aria-label': 'Seleccionar los calendarios cargados' }}
                    />
                    Seleccionar cargados ({calendars.length} de {total})

                    {/* Grupo de botones para extensión */}
                    <ButtonGroup variant="contained" size="small" sx={{ ml: { xs: 0, sm: 2 } }}>
                        {CALENDAR_EXPORT_FORMATS.map(({ extension: format, label }) => (
                            <Button
                                key={format}
                                onClick={() => handleExtensionChange(format)}
                                sx={{
                                    color: extension === format ? 'primary.contrastText' : 'text.primary',
                                    backgroundColor: extension === format ? 'primary.main' : 'background.paper',
                                    '&:hover': {
                                        backgroundColor: extension === format ? 'primary.dark' : 'action.hover',
                                    },
                                }}
                            >
                                {label}
                            </Button>
                        ))}
                    </ButtonGroup>

                    {/* Botón para descargar seleccionados */}
                    <Button
                        variant="contained"
                        color="secondary"
                        sx={{ ml: 2 }}
                        onClick={handleDownloadSelected}
                        disabled={selectedCalendars.length === 0}
                    >
                        Descargar seleccionados
                    </Button>
                </Toolbar>
            </Grid>
            <Grid item sx={{ width: '100%' }}>
                <SimplePaper
                    papers={calendars}
                    handleClick={(calendar) => verCalendar(calendar)}
                    handleDelete={(calendar) => eliminarCalendar(calendar)}
                    handleDownload={(calendar) => descargarCalendar(calendar, extension)}
                    selectedIds={selectedCalendars}
                    setSelectedIds={setSelectedCalendars}
                    selectAll={selectAll}
                    setSelectAll={(check) => setSelectAll(check)}
                />
                {calendars.length === 0 && status === 'succeeded' && (
                    <Grid container justifyContent="center" sx={{ py: 3 }}>
                        <Typography>No se encontraron calendarios.</Typography>
                    </Grid>
                )}
                {hasMore && (
                    <Grid container justifyContent="center" sx={{ py: 2 }}>
                        <Button disabled={loadingMore} onClick={() => getCalendars({ search: search.trim(), skip: calendars.length })}>
                            {loadingMore ? <CircularProgress size={20} /> : 'Cargar más calendarios'}
                        </Button>
                    </Grid>
                )}
                {loadMoreError && <Typography color="error" align="center">No se pudieron cargar más calendarios: {loadMoreError}</Typography>}
            </Grid>
        </Grid>
    );
};

export default CalendariosMonitor;
