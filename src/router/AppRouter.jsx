import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuthStore, useUiStore, useBD } from '../hooks';
import { Alert, Box, Button, Stack } from '@mui/material';
import { SpinModal } from '../components/spinner/spinModal';
import UiPathLogo from '../assets/images/uipath-logo.svg';
import AutomationAnywhereLogo from '../assets/images/Logo-Automation-Anywhere.webp';
import { ALL_CALENDAR_CLIENTS, getSelectedCalendarClient } from '../helpers/calendarClient';

const LoginPage = lazy(() => import('../auth/pages/LoginPage').then((module) => ({ default: module.LoginPage })));
const CrearPage = lazy(() => import('../pages/CrearPage').then((module) => ({ default: module.CrearPage })));
const MonitorPage = lazy(() => import('../pages/Monitor/MonitorPage').then((module) => ({ default: module.MonitorPage })));
const EditarPage = lazy(() => import('../pages/EditarPage').then((module) => ({ default: module.EditarPage })));
const UserAdminPage = lazy(() => import('../pages/UserAdminPage').then((module) => ({ default: module.UserAdminPage })));
const AuditPage = lazy(() => import('../pages/AuditPage').then((module) => ({ default: module.AuditPage })));
const HolidayAdminPage = lazy(() => import('../pages/HolidayAdminPage').then((module) => ({ default: module.HolidayAdminPage })));
const HelpPage = lazy(() => import('../pages/HelpPage').then((module) => ({ default: module.HelpPage })));
const ToolsHomePage = lazy(() => import('../pages/ToolsHomePage').then((module) => ({ default: module.ToolsHomePage })));
const ControlRoomModulePage = lazy(() => import('../pages/ControlRoomModulePage').then((module) => ({ default: module.ControlRoomModulePage })));
const CalendarClientSelectionPage = lazy(() => import('../pages/CalendarClientSelectionPage').then((module) => ({ default: module.CalendarClientSelectionPage })));

const CalendarWorkspaceRoute = ({ children, needsSpecificClient = false }) => {
  const client = getSelectedCalendarClient();
  if (!client || (needsSpecificClient && client === ALL_CALENDAR_CLIENTS)) {
    return <Navigate to="/calendars" replace />;
  }
  return children;
};

const AppInitializer = ({ onInitialized }) => {
  const {
      startLoadingHolidays,
      startLoadingTemplates,
  } = useBD();
  const { activateSpin, desactivateSpine } = useUiStore();
  const [loadError, setLoadError] = useState('');
  const [retryKey, setRetryKey] = useState(0);
  const attemptedKey = useRef(null);

  useEffect(() => {
      if (attemptedKey.current === retryKey) return;
      attemptedKey.current = retryKey;
      const cargarDatos = async () => {
          activateSpin();
          setLoadError('');
          try {
              await Promise.all([
                  startLoadingHolidays(),
                  startLoadingTemplates(),
              ]);
              onInitialized();
          } catch (error) {
              console.error("Error al cargar los datos:", error);
              setLoadError('No se pudieron cargar los feriados necesarios para Crear y Editar. Revisa la conexión con el servidor e inténtalo de nuevo.');
          } finally {
              desactivateSpine(); // Ocultar spinner cuando los datos estén cargados
          }
      };
      cargarDatos();
  }, [activateSpin, desactivateSpine, startLoadingHolidays, startLoadingTemplates, onInitialized, retryKey]);

  if (loadError) {
      return (
          <Stack sx={{ minHeight: '100vh', alignItems: 'center', justifyContent: 'center', p: 3 }}>
              <Alert severity="error" sx={{ maxWidth: 560, mb: 2 }}>{loadError}</Alert>
              <Button variant="contained" onClick={() => setRetryKey((key) => key + 1)}>Reintentar</Button>
          </Stack>
      );
  }

  return (
      <Box sx={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center' }}>
          <SpinModal />
      </Box>
  );
};

export const AppRouter = () => {
  const { status, checkToken, user } = useAuthStore();
  const [appReady, setAppReady] = useState(false);
  const handleInitialized = useCallback(() => setAppReady(true), []);

  useEffect(() => {
    checkToken();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (status === 'checking') {
    return (
      <Box sx={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center' }}>
        <SpinModal />
      </Box>
    );
  }

  // Espera a que la app esté lista
  if (!appReady && status === 'authenticated') {
    return <AppInitializer onInitialized={handleInitialized} />;
  }

  // Renderiza las rutas dependiendo del estado de autenticación
  return (
    <Suspense fallback={
      <Box sx={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center' }}>
        <SpinModal />
      </Box>
    }>
    <Routes>
      {status === 'no-authenticated' ? (
        <>
          <Route path="/auth/login" element={<LoginPage />} />
          <Route path="/*" element={<Navigate to="/auth/login" />} />
        </>
      ) : (
        <>
          <Route path="/auth/login" element={<Navigate to="/" replace />} />
          <Route path="/" element={<ToolsHomePage />} />
          <Route path="/herramientas" element={<ToolsHomePage />} />
          <Route path="/uipath" element={<ControlRoomModulePage name="UiPath" color="#FA4616" logo={UiPathLogo} provider="uipath" />} />
          <Route path="/automation-anywhere" element={<ControlRoomModulePage name="Automation Anywhere" color="#FF6A2A" logo={AutomationAnywhereLogo} provider="automation-anywhere" />} />
          <Route path="/calendars" element={<CalendarClientSelectionPage />} />
          <Route path="/crear" element={<CalendarWorkspaceRoute needsSpecificClient><CrearPage /></CalendarWorkspaceRoute>} />
          <Route path="/monitor" element={<CalendarWorkspaceRoute><MonitorPage /></CalendarWorkspaceRoute>} />
          <Route path="/editar" element={<CalendarWorkspaceRoute><EditarPage /></CalendarWorkspaceRoute>} />
          <Route path="/usuarios" element={user.roles?.includes('gerente') ? <UserAdminPage /> : <Navigate to="/monitor" replace />} />
          <Route path="/feriados" element={user.roles?.includes('gerente') ? <HolidayAdminPage /> : <Navigate to="/monitor" replace />} />
          <Route path="/auditoria" element={user.roles?.some((role) => ['gerente', 'lider'].includes(role)) ? <AuditPage /> : <Navigate to="/monitor" replace />} />
          <Route path="/ayuda" element={<HelpPage />} />
          <Route path="/*" element={<Navigate to="/" replace />} />
        </>
      )}
    </Routes>
    </Suspense>
  );
};
