import { useState } from 'react';
import { Alert, Box, Button, CircularProgress, Stack, TextField, Typography } from '@mui/material';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import LinkRoundedIcon from '@mui/icons-material/LinkRounded';
import ScienceRoundedIcon from '@mui/icons-material/ScienceRounded';
import { useNavigate } from 'react-router-dom';
import { calendarApi } from '../api';
import { AutomationAnywhereWeekPage } from './AutomationAnywhereWeekPage';
import { createAutomationAnywhereTestScenario } from './automationAnywhereTestScenario';

const initialConnections = {
  uipath: {
    organization: '',
    tenant: '',
    accessToken: '',
  },
  'automation-anywhere': {
    controlRoomUrl: '',
    username: '',
    apiKey: '',
  },
};

const connectionDetails = {
  uipath: {
    endpoint: '/integrations/uipath/connect',
    description: 'Configura el acceso a UiPath Orchestrator con los datos de tu organización.',
  },
  'automation-anywhere': {
    endpoint: '/integrations/automation-anywhere/overview',
    description: 'Consulta schedules, dispositivos e historial de Automation Anywhere Control Room.',
  },
};

export const ControlRoomModulePage = ({ name, color, logo, provider }) => {
  const navigate = useNavigate();
  const [form, setForm] = useState(() => ({ ...initialConnections[provider] }));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [connected, setConnected] = useState(false);
  const [snapshot, setSnapshot] = useState(null);
  const [fixedScheduleIds, setFixedScheduleIds] = useState([]);
  const [info, setInfo] = useState('');
  const { endpoint, description } = connectionDetails[provider];

  const updateField = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
    setError('');
    setConnected(false);
    setSnapshot(null);
    setInfo('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setConnected(false);
    try {
      const { data } = await calendarApi.post(endpoint, form);
      if (provider === 'automation-anywhere') {
        setSnapshot(data.snapshot);
        setFixedScheduleIds(data.snapshot.fixedScheduleIds || []);
      } else {
        setConnected(true);
      }
      setForm((current) => ({ ...current, accessToken: '', apiKey: '' }));
    } catch (requestError) {
      setError(requestError.response?.data?.msg || 'No se pudo validar la conexión. Inténtalo nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  if (provider === 'automation-anywhere' && snapshot) {
    return (
      <AutomationAnywhereWeekPage
        snapshot={snapshot}
        fixedScheduleIds={fixedScheduleIds}
        onFixedChange={async (ids) => {
          const previous = fixedScheduleIds;
          setFixedScheduleIds(ids);
          try {
            await calendarApi.put('/integrations/automation-anywhere/preferences', { fixedScheduleIds: ids });
          } catch (requestError) {
            setFixedScheduleIds(previous);
            throw requestError;
          }
        }}
        onBack={() => setSnapshot(null)}
        onRefresh={() => {
          setSnapshot(null);
          setInfo('Ingresa nuevamente la API Key para actualizar los datos del Control Room.');
        }}
      />
    );
  }

  return (
    <Box
      component="main"
      sx={{
        minHeight: '100dvh',
        '@supports not (min-height: 100dvh)': { minHeight: '100vh' },
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        px: 2,
        py: 5,
        color: '#f7f9fc',
        bgcolor: '#090d14',
        backgroundImage: `radial-gradient(ellipse at 50% 35%, ${color}25 0%, transparent 58%)`,
      }}
    >
      <Box
        sx={{
          width: 'min(100%, 500px)',
          p: { xs: 2.5, sm: 4 },
          borderRadius: 3,
          border: '1px solid rgba(255,255,255,.12)',
          bgcolor: 'rgba(18,23,32,.88)',
          boxShadow: `0 24px 80px ${color}18`,
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2.5 }}>
          <Box sx={{ width: { xs: 200, sm: 240 }, height: { xs: 82, sm: 94 }, display: 'grid', placeItems: 'center', bgcolor: '#fff', borderRadius: 1, overflow: 'hidden' }}>
            <Box
              component="img"
              src={logo}
              alt={`${name} logo`}
              sx={{
                display: 'block',
                width: '100%',
                height: '100%',
                minWidth: 0,
                minHeight: 0,
                objectFit: provider === 'automation-anywhere' ? 'cover' : 'contain',
                objectPosition: 'center',
              }}
            />
          </Box>
        </Box>
        <Typography component="h1" align="center" sx={{ fontSize: 26, fontWeight: 700 }}>{name}</Typography>
        <Typography align="center" sx={{ mt: 1, mb: 3, color: 'rgba(255,255,255,.66)', lineHeight: 1.6 }}>
          {description}
        </Typography>

        <Box component="form" onSubmit={handleSubmit}>
          <Stack spacing={2}>
            {provider === 'uipath' ? (
              <>
                <TextField label="Organización" value={form.organization} onChange={updateField('organization')} required fullWidth autoComplete="organization" />
                <TextField label="Tenant" value={form.tenant} onChange={updateField('tenant')} required fullWidth />
                <TextField label="Personal Access Token" type="password" value={form.accessToken} onChange={updateField('accessToken')} required fullWidth autoComplete="new-password" />
              </>
            ) : (
              <>
                <TextField label="URL del Control Room" value={form.controlRoomUrl} onChange={updateField('controlRoomUrl')} required fullWidth type="url" />
                <TextField label="Usuario" value={form.username} onChange={updateField('username')} required fullWidth autoComplete="username" />
                <TextField label="API Key" type="password" value={form.apiKey} onChange={updateField('apiKey')} required fullWidth autoComplete="new-password" />
              </>
            )}

            {error && <Alert severity="error">{error}</Alert>}
            {info && <Alert severity="info">{info}</Alert>}
            {connected && <Alert severity="success">Conexión validada. Las credenciales no se guardaron.</Alert>}

            <Button
              type="submit"
              variant="contained"
              disabled={loading}
              startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <LinkRoundedIcon />}
              sx={{ py: 1.2, bgcolor: color, '&:hover': { bgcolor: color, filter: 'brightness(.9)' } }}
            >
              {loading ? 'Consultando…' : provider === 'automation-anywhere' ? 'Consultar schedules' : 'Validar conexión'}
            </Button>
            {provider === 'automation-anywhere' && (
              <Button
                variant="outlined"
                startIcon={<ScienceRoundedIcon />}
                onClick={() => {
                  setSnapshot(createAutomationAnywhereTestScenario());
                  setFixedScheduleIds([]);
                  setError('');
                }}
                sx={{ py: 1.1, color: '#ffc09f', borderColor: 'rgba(255,192,159,.55)' }}
              >
                Probar con datos de ejemplo
              </Button>
            )}
          </Stack>
        </Box>
        <Typography align="center" sx={{ mt: 2, color: 'rgba(255,255,255,.46)', fontSize: 12, lineHeight: 1.5 }}>
          Las credenciales se envían al backend para consultar la API durante esta sesión y no se almacenan de forma permanente.
        </Typography>
      </Box>

      <Button
        startIcon={<ArrowBackRoundedIcon />}
        onClick={() => navigate('/')}
        sx={{ mt: 3, color: 'rgba(255,255,255,.72)', '&:hover': { color: '#fff', bgcolor: 'rgba(255,255,255,.08)' } }}
      >
        Volver a módulos
      </Button>
    </Box>
  );
};
