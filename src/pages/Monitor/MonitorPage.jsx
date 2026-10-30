import { Grid } from "@mui/material";
import { Navbar } from "../../components";
import CalendariosMonitor from "./CalendariosMonitor";

export const MonitorPage = () => (
  <>
    <Navbar />
    <Grid container sx={{ width: "100%", mx: 0 }}>
      <Grid item xs={12} sx={{ minWidth: 0, overflow: "auto", p: 2 }}>
        <CalendariosMonitor />
      </Grid>
    </Grid>
  </>
);
