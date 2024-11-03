// Importar Firebase y Firestore
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getFirestore, collection, query, where, getDocs, addDoc, deleteDoc, doc, updateDoc } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// Configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyAAovxe4C6FdMbd38vDs_bBEhdCFs1DJ3g",
    authDomain: "examcreator-635ab.firebaseapp.com",
    projectId: "examcreator-635ab",
    storageBucket: "examcreator-635ab.appspot.com",
    messagingSenderId: "234754721349",
    appId: "1:234754721349:web:2c93cc00514ac39e83452c",
    measurementId: "G-XVLSN9V38X"
};

// Inicializar Firebase y Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Obtener el nombre y el correo del usuario desde localStorage
const nombreUsuario = localStorage.getItem('nombreUsuario');
const correoUsuario = localStorage.getItem('correoUsuario');

// Usa estas variables para vincular las clases del usuario actual
console.log("Nombre:", nombreUsuario);
console.log("Correo:", correoUsuario);

// Obtén los elementos del DOM
const registerClassBtn = document.getElementById('register-class-btn');
const registroClaseInput = document.getElementById('registro-clase');
const materiasContainer = document.getElementById('materias-container');

// Correo y nombre del alumno (estos valores deben venir de tu sistema de autenticación)
const alumnoCorreo = correoUsuario; // Reemplazar con el correo del alumno autenticado 
const alumnoNombre = nombreUsuario;  // Reemplazar con el nombre del alumno autenticado

// Función para registrar la clase
async function registrarClase() {
    const claveClase = registroClaseInput.value.trim();  // Obtener el valor del input
    
    if (!claveClase) {
        alert("Por favor, ingresa una clave o nombre de clase.");
        return;
    }

    try {
        // Intenta buscar la clase por su clave
        const claseQuery = query(collection(db, "clases"), where("clave", "==", claveClase));
        const claseSnapshot = await getDocs(claseQuery);

        if (claseSnapshot.empty) {
            // Si no se encontró la clase por clave, intenta buscar por nombre
            const claseNombreQuery = query(collection(db, "clases"), where("nombre", "==", claveClase));
            const claseNombreSnapshot = await getDocs(claseNombreQuery);

            if (claseNombreSnapshot.empty) {
                alert("No se encontró ninguna clase con esa clave o nombre.");
            } else {
                await agregarClaseAlumno(claseNombreSnapshot, alumnoCorreo, alumnoNombre);
            }
        } else {
            await agregarClaseAlumno(claseSnapshot, alumnoCorreo, alumnoNombre);
        }
    } catch (error) {
        console.error("Error al buscar la clase:", error);
        alert("Ocurrió un error al registrar la clase.");
    }
}

// Función para agregar la clase al registro del alumno
async function agregarClaseAlumno(claseSnapshot, alumnoCorreo, alumnoNombre) {
    try {
        claseSnapshot.forEach(async (docSnap) => {
            const claseData = docSnap.data();

            // Verificar si la clase ya fue registrada por el alumno
            const claseAlumnoQuery = query(collection(db, "clase-alumno"), where("claseId", "==", docSnap.id), where("alumnoCorreo", "==", alumnoCorreo));
            const claseAlumnoSnapshot = await getDocs(claseAlumnoQuery);

            if (!claseAlumnoSnapshot.empty) {
                alert(`Ya estás registrado en la clase ${claseData.nombre}.`);
                return;
            }

            // Guardar la clase en la colección "clase-alumno"
            await addDoc(collection(db, "clase-alumno"), {
                claseId: docSnap.id,
                claseNombre: claseData.nombre,
                claseClave: claseData.clave,
                grupo: claseData.grupo, // Incluye el grupo si está disponible
                alumnoCorreo: alumnoCorreo,
                alumnoNombre: alumnoNombre,
                fechaRegistro: new Date()
            });
            alert(`Clase ${claseData.nombre} registrada exitosamente.`);
            // Limpiar input después de registrar
            registroClaseInput.value = '';
            // Actualizar la vista de las clases
            cargarClasesAlumno();
        });
    } catch (error) {
        console.error("Error al registrar la clase para el alumno:", error);
        alert("Ocurrió un error al registrar la clase.");
    }
}

// Función para cargar las clases registradas del alumno
async function cargarClasesAlumno() {
    materiasContainer.innerHTML = '';  // Limpiar el contenedor de clases

    try {
        // Consulta todas las clases registradas por el alumno
        const clasesAlumnoQuery = query(collection(db, "clase-alumno"), where("alumnoCorreo", "==", alumnoCorreo));
        const clasesAlumnoSnapshot = await getDocs(clasesAlumnoQuery);

        if (clasesAlumnoSnapshot.empty) {
            materiasContainer.innerHTML = '<p>No tienes clases registradas.</p>';
        } else {
            clasesAlumnoSnapshot.forEach((docSnap) => {
                const claseData = docSnap.data();
                crearTarjetaClase(claseData);
            });
        }
    } catch (error) {
        console.error("Error al cargar las clases del alumno:", error);
        alert("Ocurrió un error al cargar las clases.");
    }
}

// Función para crear la tarjeta de clase en el DOM
function crearTarjetaClase(claseData) {
    const tarjeta = document.createElement('div');
    tarjeta.className = 'card';

    tarjeta.innerHTML = `
        <h3>${claseData.claseNombre}</h3>
        <p>Clave: ${claseData.claseClave}</p>
        <p>Grupo: ${claseData.grupo ? claseData.grupo : 'N/A'}</p>
        <button class="btn delete-btn" data-id="${claseData.claseId}">Eliminar</button>
    `;

    // Añadir evento al botón de eliminar
    tarjeta.querySelector('.delete-btn').addEventListener('click', () => eliminarClaseAlumno(claseData.claseId));

    // Añadir la tarjeta al contenedor
    materiasContainer.appendChild(tarjeta);
}

// Función para eliminar una clase registrada por el alumno
async function eliminarClaseAlumno(claseId) {
    if (confirm(`¿Estás seguro de que deseas eliminar esta clase?`)) {
        try {
            // Consulta la clase-alumno por el ID de la clase y el correo del alumno
            const claseAlumnoQuery = query(collection(db, "clase-alumno"), where("claseId", "==", claseId), where("alumnoCorreo", "==", alumnoCorreo));
            const claseAlumnoSnapshot = await getDocs(claseAlumnoQuery);

            if (!claseAlumnoSnapshot.empty) {
                claseAlumnoSnapshot.forEach(async (docSnap) => {
                    await deleteDoc(doc(db, "clase-alumno", docSnap.id));
                    alert("Clase eliminada correctamente.");
                    cargarClasesAlumno();  // Recargar lista de clases
                });
            } else {
                alert("No se encontró la clase registrada para el alumno.");
            }
        } catch (error) {
            console.error("Error al eliminar la clase:", error);
            alert("Ocurrió un error al eliminar la clase.");
        }
    }
}

// Función para actualizar el estado del usuario a "inactivo" al cerrar sesión
async function desactivarUsuario() {
    try {
        // Buscar el documento del usuario en la colección "usuarios"
        const usuariosRef = collection(db, "usuarios");
        const usuarioQuery = query(
            usuariosRef,
            where("correo", "==", correoUsuario),
            where("nombre", "==", nombreUsuario),
            where("tipoUsuario", "==", "estudiante")
        );

        const usuarioSnapshot = await getDocs(usuarioQuery);
        if (!usuarioSnapshot.empty) {
            for (const docSnap of usuarioSnapshot.docs) {
                const docRef = doc(db, "usuarios", docSnap.id);
                await updateDoc(docRef, { estado: "inactivo" });
                console.log("El estado del usuario se ha actualizado a 'inactivo'.");
            }
            // Esperar unos segundos para asegurar que la actualización se complete antes de redirigir
            setTimeout(() => {
                window.location.href = "index.html"; // Redirigir a la página de inicio de sesión
            }, 3000); // Ajusta el tiempo de espera si es necesario
        } else {
            console.log("No se encontró el usuario estudiante en la base de datos.");
            alert("No se encontró el usuario.");
        }
    } catch (error) {
        console.error("Error al actualizar el estado del usuario:", error);
        alert("Ocurrió un error al actualizar el estado del usuario.");
    }
}

// Vincular la función `desactivarUsuario()` a un evento de cierre de sesión
document.getElementById('logout-btn').addEventListener('click', async () => {
    await desactivarUsuario();
});

// Asignar el evento de clic al botón de registrar
registerClassBtn.addEventListener('click', registrarClase);

// Cargar las clases del alumno al cargar la página
document.addEventListener('DOMContentLoaded', cargarClasesAlumno);
