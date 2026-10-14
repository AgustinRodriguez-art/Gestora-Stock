import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyAyxPDyIX2u9N5IjibocSidzNh-rNKNMZ0",
    authDomain: "gestorastock.firebaseapp.com",
    projectId: "gestorastock",
    appId: "1:204105885594:web:69caa050cebdf71f9a7c23"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

window.obtenerTokenFirebase = async () => {
  const usuario = auth.currentUser;
  return usuario ? await usuario.getIdToken() : null;
};

// Dejamos estas operaciones disponibles para conectarlas
// con los formularios de la página en el paso siguiente.
window.firebaseAuth = {
    registrar: (email, password) =>
        createUserWithEmailAndPassword(auth, email, password),

    ingresar: (email, password) =>
        signInWithEmailAndPassword(auth, email, password),

    salir: () => signOut(auth),

    observarSesion: (funcion) =>
        onAuthStateChanged(auth, funcion)
};

console.log("Firebase listo");

const panelRegistro = document.querySelector("#panel-registro");
const panelLogin = document.querySelector("#panel-login");
const pantallaLogin = document.querySelector("#pantalla-login");
const aplicacion = document.querySelector("#aplicacion");

document.querySelector("#mostrar-login").addEventListener("click", () => {
    panelRegistro.hidden = true;
    panelLogin.hidden = false;
});

document.querySelector("#mostrar-registro").addEventListener("click", () => {
    panelLogin.hidden = true;
    panelRegistro.hidden = false;
});

function mensajeDeError(error) {
    const mensajes = {
        "auth/email-already-in-use": "Ese email ya tiene una cuenta. Elegí «Ya tengo cuenta».",
        "auth/invalid-email": "El email no parece válido.",
        "auth/weak-password": "La contraseña es demasiado débil.",
        "auth/invalid-credential": "El email o la contraseña no coinciden.",
        "auth/unauthorized-domain": "Firebase todavía no tiene autorizado localhost.",
        "auth/too-many-requests": "Hubo muchos intentos. Esperá un momento y probá otra vez."
    };

    return mensajes[error.code] || "No se pudo completar la operación. Revisá los datos e intentá otra vez.";
}

document.querySelector("#form-registro").addEventListener("submit", async (evento) => {
    evento.preventDefault();

    const email = document.querySelector("#registro-email").value.trim();
    const password = document.querySelector("#registro-password").value;
    const confirmar = document.querySelector("#registro-confirmar").value;
    const mensaje = document.querySelector("#registro-mensaje");

    if (password !== confirmar) {
        mensaje.textContent = "Las contraseñas no coinciden.";
        return;
    }

    try {
        mensaje.textContent = "Creando cuenta…";
        await window.firebaseAuth.registrar(email, password);
        mensaje.textContent = "";
    } catch (error) {
        mensaje.textContent = mensajeDeError(error);
        console.error(error);
    }
});

document.querySelector("#form-login").addEventListener("submit", async (evento) => {
    evento.preventDefault();

    const email = document.querySelector("#login-email").value.trim();
    const password = document.querySelector("#login-password").value;
    const mensaje = document.querySelector("#login-mensaje");

    try {
        mensaje.textContent = "Verificando…";
        await window.firebaseAuth.ingresar(email, password);
        mensaje.textContent = "";
    } catch (error) {
        mensaje.textContent = mensajeDeError(error);
        console.error(error);
    }
});

document.querySelector("#boton-salir").addEventListener("click", async () => {
    await window.firebaseAuth.salir();
});

window.firebaseAuth.observarSesion((usuario) => {
    const haySesionFirebase = usuario !== null;

    pantallaLogin.hidden = haySesionFirebase;
    aplicacion.hidden = !haySesionFirebase;
});