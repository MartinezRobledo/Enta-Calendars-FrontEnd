import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Box, Button, Chip, MenuItem, Paper, Stack, TextField, Typography } from '@mui/material';
import { Navbar } from '../components';
import { calendarApi } from '../api';
import Calendar from '../components/calendar/Calendar';

const currentYear = new Date().getFullYear();
const asDate = (value) => {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
};
const asDateOnly = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

export const HolidayAdminPage = () => {
  const [countries, setCountries] = useState([]);
  const [countryCode, setCountryCode] = useState('');
  const [year, setYear] = useState(currentYear);
  const [dates, setDates] = useState([]);
  const [newCountry, setNewCountry] = useState({ name: '' });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const loadRequest = useRef(0);

  const loadCountries = useCallback(async () => {
    try {
      const { data } = await calendarApi.get('/holidays/countries');
      setCountries(data.countries || []);
      if (data.countries?.length) setCountryCode((current) => current || data.countries[0].countryCode);
      setError('');
    } catch (e) { setError(e.response?.data?.msg || 'No se pudieron cargar los países.'); }
  }, []);

  const loadDates = useCallback(async () => {
    if (!countryCode) { loadRequest.current += 1; setDates([]); setLoading(false); return; }
    const requestId = ++loadRequest.current;
    setLoading(true);
    try {
      const { data } = await calendarApi.get(`/holidays/country/${countryCode}/${year}`);
      if (requestId !== loadRequest.current) return;
      setDates((data.holiday?.dates || []).map(asDate));
      setError('');
    } catch (e) {
      if (requestId !== loadRequest.current) return;
      if (e.response?.status === 404) setDates([]);
      else setError(e.response?.data?.msg || 'No se pudieron cargar los feriados.');
    } finally { if (requestId === loadRequest.current) setLoading(false); }
  }, [countryCode, year]);

  useEffect(() => { loadCountries(); }, [loadCountries]);
  useEffect(() => { loadDates(); }, [loadDates]);

  const toggleDate = (date) => {
    const target = asDateOnly(date);
    setDates((current) => current.some((item) => asDateOnly(item) === target)
      ? current.filter((item) => asDateOnly(item) !== target)
      : [...current, date]);
    setMessage('');
  };

  const save = async () => {
    setLoading(true); setError(''); setMessage('');
    try {
      await calendarApi.put(`/holidays/country/${countryCode}/${year}`, { dates: dates.map(asDateOnly) });
      setMessage(`Feriados de ${countries.find((item) => item.countryCode === countryCode)?.name || countryCode} para ${year} guardados.`);
      await loadCountries();
    } catch (e) { setError(e.response?.data?.msg || 'No se pudieron guardar los feriados.'); }
    finally { setLoading(false); }
  };

  const addCountry = async (event) => {
    event.preventDefault(); setError(''); setMessage('');
    try {
      const { data } = await calendarApi.post('/holidays/countries', newCountry);
      setCountries((current) => [...current, { ...data.country, updatedThisYear: false }].sort((a, b) => a.name.localeCompare(b.name)));
      setCountryCode(data.country.countryCode);
      setNewCountry({ name: '' });
      setMessage(`País ${data.country.name} creado. Marca sus feriados y guarda.`);
    } catch (e) { setError(e.response?.data?.msg || 'No se pudo crear el país.'); }
  };

  return <><Navbar /><Box sx={{ maxWidth: 1450, mx: 'auto', p: { xs: 2, md: 4 } }}>
    <Typography variant="h4" sx={{ mb: 3 }}>Administración de feriados</Typography>
    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}{message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}

    <Paper component="form" onSubmit={addCountry} sx={{ p: 2, mb: 3 }}>
      <Typography variant="h6" sx={{ mb: 1 }}>Agregar país</Typography>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <TextField label="Nombre del país" value={newCountry.name} onChange={(e) => setNewCountry({ ...newCountry, name: e.target.value })} required fullWidth />
        <Button type="submit" variant="outlined">Crear país</Button>
      </Stack>
    </Paper>

    <Paper sx={{ p: 2, mb: 3 }}>
      <Typography variant="h6" sx={{ mb: 1 }}>Países cargados</Typography>
      {countries.length === 0 ? <Typography color="text.secondary">Todavía no hay países configurados.</Typography> : <Stack direction="row" flexWrap="wrap" gap={1}>
        {countries.map((country) => <Chip key={country.countryCode} label={`${country.name} · ${country.lastModified ? new Date(country.lastModified).toLocaleDateString() : 'sin modificaciones'}`} color={country.updatedThisYear ? 'success' : 'warning'} variant={countryCode === country.countryCode ? 'filled' : 'outlined'} onClick={() => setCountryCode(country.countryCode)} />)}
      </Stack>}
      <Typography variant="caption" display="block" sx={{ mt: 1 }}>Verde: editado durante {currentYear}. Amarillo: pendiente de actualizar este año.</Typography>
    </Paper>

    {countryCode && <>
      <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ sm: 'center' }} spacing={2} sx={{ mb: 2 }}>
        <Typography variant="h6" sx={{ flex: 1 }}>Feriados · {countries.find((item) => item.countryCode === countryCode)?.name || countryCode}</Typography>
        <TextField select label="Año" size="small" value={year} onChange={(e) => setYear(Number(e.target.value))} sx={{ minWidth: 140 }}>
          {Array.from({ length: 11 }, (_, index) => currentYear - 5 + index).map((value) => <MenuItem key={value} value={value}>{value}</MenuItem>)}
        </TextField>
        <Button variant="contained" onClick={save} disabled={loading}>Guardar feriados</Button>
      </Stack>
      <Typography color="text.secondary" sx={{ mb: 1 }}>Haz clic en los días para marcar o desmarcar feriados. Los cambios se guardan al presionar Guardar.</Typography>
      <Box sx={{ pointerEvents: loading ? 'none' : 'auto', opacity: loading ? 0.6 : 1 }}>
        <Calendar anio={year} diasActivos={dates} aditionalDaysToAdd={[]} aditionalDaysToRemove={[]} onDayClick={toggleDate} />
      </Box>
    </>}
  </Box></>;
};
