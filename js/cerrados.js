// Importar Firebase y Firestore
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getFirestore, collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

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

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Obtener el nombre y el correo del usuario desde localStorage
const nombreUsuario = localStorage.getItem('nombreUsuario');
const correoUsuario = localStorage.getItem('correoUsuario');

// Función para cargar los cuestionarios cerrados
async function cargarCuestionariosCerrados() {
    const cerradosContainer = document.getElementById('cerrados-container');
    cerradosContainer.innerHTML = ''; // Limpiar el contenedor

    mostrarCarga();

    try {
        // Consultar las clases del docente actual
        const clasesRef = collection(db, "clases");
        const clasesQuery = query(
            clasesRef,
            where("docente.nombre", "==", nombreUsuario),
            where("docente.correo", "==", correoUsuario)
        );

        const clasesSnapshot = await getDocs(clasesQuery);

        if (clasesSnapshot.empty) {
            cerradosContainer.innerHTML = '<p>No hay clases registradas para este docente.</p>';
            ocultarCarga();
            return;
        }

        // Obtener las claves de las clases del docente actual
        const clavesClases = [];
        const clasesMap = {};
        clasesSnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            if (data.clave) {
                clavesClases.push(data.clave);
                clasesMap[data.clave] = data.nombre; // Guardar el nombre de la clase
            }
        });

        if (clavesClases.length === 0) {
            cerradosContainer.innerHTML = '<p>No se encontraron cuestionarios cerrados para las clases de este docente.</p>';
            ocultarCarga();
            return;
        }

        // Consultar los cuestionarios cerrados usando las claves de las clases
        const cuestionariosRef = collection(db, "cuestionarios");
        const cuestionariosQuery = query(
            cuestionariosRef,
            where("estado", "==", "cerrado"),
            where("claseClave", "in", clavesClases)
        );

        const cuestionariosSnapshot = await getDocs(cuestionariosQuery);

        if (cuestionariosSnapshot.empty) {
            cerradosContainer.innerHTML = '<p>No hay cuestionarios cerrados para estas clases.</p>';
        } else {
            cuestionariosSnapshot.forEach((docSnap) => {
                const data = docSnap.data();

                // Convertir fechas a objetos Date si están en formato de texto
                const fechaPublicacion = data.fechaInicio ? new Date(data.fechaInicio).toLocaleDateString() : 'Fecha no disponible';
                const fechaFinalizacion = data.fechaFin ? new Date(data.fechaFin).toLocaleDateString() : 'Fecha no disponible';

                // Obtener el nombre de la clase usando la clave de clase
                const claseNombre = clasesMap[data.claseClave] || 'Clase no especificada';

                // Duración en horas y minutos, verificando que existan
                const duracion = `${data.duracion.horas} horas y ${data.duracion.minutos} minutos`;

                // Crear la tarjeta de cuestionario cerrado
                const cuestionarioElement = document.createElement('div');
                cuestionarioElement.className = 'card';
                cuestionarioElement.innerHTML = `
                    <h3>${data.titulo}</h3>
                    <p><strong>Clase:</strong> ${claseNombre}</p>
                    <p><strong>Fecha de Publicación:</strong> ${fechaPublicacion}</p>
                    <p><strong>Fecha de Finalización:</strong> ${fechaFinalizacion}</p>
                    <p><strong>Intentos:</strong> ${data.intentos}</p>
                    <p><strong>Duración:</strong> ${duracion}</p>
                `;
                cerradosContainer.appendChild(cuestionarioElement);
            });
        }
        ocultarCarga();
    } catch (error) {
        console.error("Error al cargar los cuestionarios cerrados:", error);
        ocultarCarga();
    }
}

// Función para mostrar el modal de carga
function mostrarCarga() {
    const modal = document.getElementById('modal-carga');
    if (modal) {
        modal.style.display = 'flex'; // Mostrar el modal de carga
    }
}

// Función para ocultar el modal de carga
function ocultarCarga() {
    const modal = document.getElementById('modal-carga');
    if (modal) {
        modal.style.display = 'none'; // Ocultar el modal de carga
    }
}

// Cargar los cuestionarios cerrados al cargar la página
document.addEventListener('DOMContentLoaded', cargarCuestionariosCerrados);
