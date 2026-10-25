import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Chip,
  List,
  ListItem,
  ListItemText,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Link } from 'react-router-dom';
import { Navbar } from '../components';
import { useAuthStore } from '../hooks';

const HelpSection = ({ title, children, defaultExpanded = false }) => (
  <Accordion defaultExpanded={defaultExpanded} disableGutters>
    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
      <Typography fontWeight={600}>{title}</Typography>
    </AccordionSummary>
    <AccordionDetails>{children}</AccordionDetails>
  </Accordion>
);

const Steps = ({ items }) => (
  <List dense disablePadding>
    {items.map((item, index) => (
      <ListItem key={item} disableGutters alignItems="flex-start">
        <Chip label={index + 1} size="small" color="primary" sx={{ mr: 1.5, mt: 0.25 }} />
        <ListItemText primary={item} />
      </ListItem>
    ))}
  </List>
);

export const HelpPage = () => {
  const { user } = useAuthStore();
  const canSeeAudit = user.roles?.some((role) => ['gerente', 'lider'].includes(role));
  const isManager = user.roles?.includes('gerente');

  return <>
    <Navbar />
    <Box sx={{ maxWidth: 1100, mx: 'auto', p: { xs: 2, md: 4 } }}>
      <Typography variant="h4" sx={{ mb: 1 }}>Ayuda</Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Guía rápida para crear, revisar y administrar calendarios en Enta Calendars.
      </Typography>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mb: 3 }}>
        <Button component={Link} to="/crear" variant="contained">Crear un calendario</Button>
        <Button component={Link} to="/monitor" variant="outlined">Ir al monitor</Button>
      </Stack>

      <Paper sx={{ overflow: 'hidden' }}>
        <HelpSection title="Crear un calendario" defaultExpanded>
          <Steps items={[
            'Abre Crear, escribe un nombre y elige el año que quieres configurar. La vista muestra los días calculados al instante.',
            'Define el inicio y el fin del calendario. Selecciona los días de la semana o marca Todos los días.',
            'Si hace falta, agrega una Regla de días para elegir fechas específicas del mes.',
            'También puedes ajustar fechas directamente en el calendario: clic izquierdo para forzar un día a incluirse; presiona la ruedita del mouse (clic del medio, sin girarla) para forzarlo a excluirse. Repite la acción para quitar el ajuste manual.',
            'Revisa el resultado en el calendario y presiona Crear para guardarlo. Exportar descarga el calendario en el formato elegido.',
          ]} />
          <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mt: 1 }}>
            <Chip label="Naranja: día calculado por las reglas" color="secondary" />
            <Chip label="Azul: inclusión manual" color="primary" />
            <Chip label="Gris: exclusión manual" />
          </Stack>
        </HelpSection>

        <HelpSection title="Reglas de días y feriados">
          <Typography sx={{ mb: 1 }}>Separa varias reglas con comas. Algunos ejemplos:</Typography>
          <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mb: 2 }}>
            <Chip label="15: día 15" variant="outlined" />
            <Chip label="-2: penúltimo día" variant="outlined" />
            <Chip label="2+: desde el día 2 hasta fin de mes" variant="outlined" />
            <Chip label="2-: desde el inicio hasta el día 2" variant="outlined" />
          </Stack>
          <List dense disablePadding>
            <ListItem disableGutters><ListItemText primary="La opción Feriados incluye o excluye los feriados cargados para el país y año correspondientes." /></ListItem>
            <ListItem disableGutters><ListItemText primary="Exigir semana completa conserva juntos los días seleccionados de cada bloque semanal: si alguno no está disponible, se descartan los demás de ese bloque." /></ListItem>
          </List>
        </HelpSection>

        <HelpSection title="Usar capas para combinar reglas">
          <Typography sx={{ mb: 1 }}>
            Cada capa define un conjunto de días. Agrega otra con el botón + y usa Depende de para hacer que tome como base los días de una capa anterior.
          </Typography>
          <Alert severity="info">
            Una capa dependiente solo puede conservar fechas que ya existan en su capa de origen; luego aplica sus propios días, rango y reglas.
          </Alert>
        </HelpSection>

        <HelpSection title="Buscar, editar, descargar o eliminar calendarios">
          <Steps items={[
            'En Monitor, busca por nombre. Selecciona una tecnología para elegir el formato de descarga.',
            'Abre una tarjeta para revisar o editar el calendario. Los cambios se guardan desde Editar con Guardar.',
            'Usa el ícono de descarga de una tarjeta o selecciona varios calendarios y pulsa Descargar seleccionados. La descarga múltiple llega en un archivo ZIP.',
            'El botón de eliminar realiza una eliminación lógica. Un líder o gerente puede restaurar el calendario desde Auditoría.',
          ]} />
          <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>Formatos disponibles</Typography>
          <Stack direction="row" flexWrap="wrap" gap={1}>
            <Chip label="Blue Prism · .bprelease" />
            <Chip label="UiPath · .csv con fechas a excluir" />
            <Chip label="Automation Anywhere · .txt, una fecha por línea" />
          </Stack>
        </HelpSection>

        {isManager && <HelpSection title="Administrar feriados y usuarios">
          <List dense disablePadding>
            <ListItem disableGutters><ListItemText primary="Feriados: en Feriados selecciona un país y año, marca o desmarca días en el calendario y guarda. Agrega un país escribiendo su nombre." /></ListItem>
            <ListItem disableGutters><ListItemText primary="Usuarios: en Usuarios crea cuentas, asigna o cambia el rol y desactiva usuarios existentes. No hay registro público." /></ListItem>
          </List>
        </HelpSection>}

        {canSeeAudit && <HelpSection title="Auditoría">
          <Typography>
            Auditoría muestra la actividad registrada. Los líderes y gerentes pueden consultarla; desde allí también pueden restaurar calendarios eliminados.
          </Typography>
        </HelpSection>}

        <HelpSection title="Roles y apariencia">
          <List dense disablePadding>
            <ListItem disableGutters><ListItemText primary="Desarrollador: crea, consulta, edita y exporta calendarios." /></ListItem>
            <ListItem disableGutters><ListItemText primary="Líder: tiene las funciones de calendario y acceso a Auditoría." /></ListItem>
            <ListItem disableGutters><ListItemText primary="Gerente: además puede administrar usuarios y feriados." /></ListItem>
          </List>
          <Typography sx={{ mt: 1 }}>
            Para cambiar entre tema claro y oscuro, abre el menú del avatar y activa Modo oscuro. La preferencia queda guardada.
          </Typography>
        </HelpSection>
      </Paper>
    </Box>
  </>;
};
