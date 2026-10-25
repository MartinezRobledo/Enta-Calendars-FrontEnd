import { Box, Button, Input, Typography } from "@mui/material";
import LoginBackground from "../../assets/images/Login_BG.png";
import EntaLogo from "../../assets/images/logo-enta-horizontal-h100.png";
import { useAuthStore, useForm } from "../../hooks";
import { useEffect } from "react";
import Swal from "sweetalert2/dist/sweetalert2.js";
import "sweetalert2/dist/sweetalert2.min.css";

const loginFormFields = {
  loginEmail: "",
  loginPassword: "",
};

export const LoginPage = () => {
  const { startLogin, errorMessage } = useAuthStore();
  const {
    loginEmail,
    loginPassword,
    onInputChange: onLoginInputChange,
  } = useForm(loginFormFields);

  const onSubmit = async (event) => {
    event.preventDefault();
    await startLogin({ name: loginEmail, password: loginPassword });
  };

  useEffect(() => {
    if (errorMessage !== undefined)
      Swal.fire({
        title: "Error en la autenticación",
        text: errorMessage,
        icon: "error",
        showCancelButton: false,
        confirmButtonText: "Aceptar",
        buttonsStyling: true,
        confirmButtonColor: "#ff8a00",
      });
    else if (errorMessage === "Ocurrió un error durante la carga")
      Swal.fire({
        title: errorMessage,
        text: "Algunas funcionalidades pueden no responder correctamente",
        icon: "error",
        showCancelButton: false,
        confirmButtonText: "Aceptar",
        buttonsStyling: true,
        confirmButtonColor: "#ff8a00",
      });
  }, [errorMessage]);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundImage: `url(${LoginBackground})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        display: "flex",
        alignItems: "stretch",
        justifyContent: "center",
      }}
    >
      <Box sx={{ flex: 1, display: { xs: "none", md: "block" } }} />
      <Box
        sx={{
          width: { xs: "100%", md: "50%" },
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          pr: { md: 8 },
        }}
      >
        <Box
          sx={{
            width: "80%",
            maxWidth: 420,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 3,
          }}
        >
          <Box sx={{ width: "100%", display: "flex", justifyContent: "center" }}>
            <img
              src={EntaLogo}
              alt="Logo Enta"
              style={{ maxWidth: 320, width: "100%", height: "auto" }}
            />
          </Box>
          <Typography variant="h5" fontWeight={700} color="white" sx={{ mt: -2 }}>
            Enta Tools
          </Typography>
          <Box
            component="form"
            onSubmit={onSubmit}
            sx={{
              backgroundColor: "rgba(255,255,255,0.95)",
              p: 4,
              borderRadius: 2,
              minWidth: 280,
              width: "100%",
            }}
          >
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Input
                placeholder="Usuario"
                fullWidth
                sx={{
                  "& .MuiInput-input": { color: "rgba(0,0,0,0.87)" },
                  borderBottom: "1px solid rgba(0,0,0,0.12)",
                }}
                name="loginEmail"
                value={loginEmail}
                onChange={onLoginInputChange}
              />
              <Input
                placeholder="Contraseña"
                fullWidth
                type="password"
                sx={{ "& .MuiInput-input": { color: "rgba(0,0,0,0.87)" } }}
                name="loginPassword"
                value={loginPassword}
                onChange={onLoginInputChange}
              />
              <Button variant="contained" color="secondary" type="submit">
                Ingresar
              </Button>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};
