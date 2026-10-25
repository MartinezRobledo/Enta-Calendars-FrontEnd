import { Grid, Typography, Drawer, Fab, useMediaQuery, useTheme } from "@mui/material";
import { Navbar } from "../../components";
import NestedList from "../../components/list/NestedList";
import { useRef, useState } from "react";
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import CalendariosMonitor from "./CalendariosMonitor";

export const MonitorPage = () => {
  const [selectedOption, setSelectedOption] = useState("calendarios");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("lg")); // Detectar pantallas menores a 1100px
  
  const components = {
    calendarios: <CalendariosMonitor />,
    // recursos: <Recursos />,
    // mapasCalor: <MapasCalor />,
    // schedules: <Schedules />,
  };
  //Para evitar errores al cerrar el drawer, que pierde la referencia de a que hacer focus cuando se oculta.
  const focusElementRef = useRef(null); // Referencia al elemento al que queremos mover el foco, por defecto null evita el error.
  
  const toggleDrawer = () => {
    setIsDrawerOpen(!isDrawerOpen);
  };

  const handleDrawerClose = () => {
    setIsDrawerOpen(false);
    if (focusElementRef.current) {
      focusElementRef.current.focus(); // Devolver el enfoque al elemento
    }
  };

  return (
    <>
      <Navbar />
      <Grid container sx={{  }}>
        {/* Drawer para pantallas menores a 1100px */}
        {isSmallScreen && (
          <Drawer
            variant="temporary"
            open={isDrawerOpen}
            onClose={handleDrawerClose}
            ModalProps={{
              keepMounted: true, // Mejora el rendimiento en pantallas móviles
            }}
            sx={{
              display: { xs: "block", lg: "none" }, // Visible solo en pantallas menores a 1100px
              "& .MuiDrawer-paper": { width: "240px" },
            }}
          >
            <NestedList
              onSelect={(value) => {
                setSelectedOption(value);
                toggleDrawer(); // Cerrar el Drawer al seleccionar una opción
              }}
            />
          </Drawer>
        )}

        {/* Lista fija para pantallas mayores a 1100px */}
        {!isSmallScreen && (
          <Grid
            item
            xs={12}
            lg={3}
            xl={2}
            sx={{
              display: { xs: "none", lg: "block" }, // Oculta la lista para pantallas menores a 1100px
              borderRight: "1px solid #ddd",
            }}
          >
            <NestedList onSelect={setSelectedOption} />
          </Grid>
        )}

        {/* Contenido principal */}
        <Grid
          item
          xs={12}
          lg={9}
          xl={10}
          sx={{
            overflow: "auto",
            padding: 2,
          }}
        >
          {components[selectedOption] || <Typography>Seleccione una opción</Typography>}
        </Grid>
      </Grid>

      {/* Botón flotante para abrir el Drawer en pantallas menores a 1100px */}
      {isSmallScreen && !isDrawerOpen && (
        <Fab
          color="primary"
          aria-label="menu"
          onClick={toggleDrawer}
          sx={{
            position: "fixed",
            left: 0,
            top: "50%",
            transform: "translate(-50%, -50%)", // Coloca el botón medio visible
            zIndex: 1201, // Asegura que esté sobre el contenido principal
            display: { xs: "flex", lg: "none" }, // Solo visible en pantallas menores a 1100px
          }}
        >
          <ArrowForwardIosIcon sx={{marginLeft:'1rem'}}/>
        </Fab>
      )}
    </>
  );
};
