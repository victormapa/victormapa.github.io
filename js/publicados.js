// Importar Firebase y Firestore
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getFirestore, collection, getDocs, query, where, updateDoc, doc } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

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

// Función para cargar los cuestionarios publicados
async function cargarCuestionariosPublicados() {
    const publicadosContainer = document.getElementById('publicados-container');
    publicadosContainer.innerHTML = ''; // Limpiar el contenedor

    mostrarCarga();

    try {
        // Paso 1: Consultar las clases asociadas al docente actual
        const clasesRef = collection(db, "clases");
        const clasesQuery = query(
            clasesRef,
            where("docente.nombre", "==", nombreUsuario),
            where("docente.correo", "==", correoUsuario)
        );

        const clasesSnapshot = await getDocs(clasesQuery);

        if (clasesSnapshot.empty) {
            publicadosContainer.innerHTML = '<p>No hay clases registradas para este docente.</p>';
            ocultarCarga();
            return;
        }

        // Obtener las claves de las clases del docente actual
        const clavesClases = [];
        const clasesMap = {}; // Mapeo de clave de clase a nombre para referencia
        clasesSnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            if (data.clave) {
                clavesClases.push(data.clave);
                clasesMap[data.clave] = data.nombre;
            }
        });

        if (clavesClases.length === 0) {
            publicadosContainer.innerHTML = '<p>No se encontraron cuestionarios para las clases de este docente.</p>';
            ocultarCarga();
            return;
        }

        // Obtener la fecha actual en formato YYYY-MM-DD
        const fechaActualTexto = new Date().toISOString().split('T')[0];

        // Paso 2: Consultar los cuestionarios publicados usando las claves de las clases
        const cuestionariosRef = collection(db, "cuestionarios");
        const cuestionariosQuery = query(
            cuestionariosRef,
            where("estado", "==", "publicado"),
            where("claseClave", "in", clavesClases) // Filtrar por las claves de las clases obtenidas
        );

        const cuestionariosSnapshot = await getDocs(cuestionariosQuery);

        if (cuestionariosSnapshot.empty) {
            publicadosContainer.innerHTML = '<p>No hay cuestionarios publicados para estas clases.</p>';
            ocultarCarga();
        } else {
            cuestionariosSnapshot.forEach(async (docSnap) => {
                const data = docSnap.data();

                const docRef = doc(db, "cuestionarios", docSnap.id);
                const fechaFinTexto = data.fechaFin || null;

                // Verificar y actualizar el estado del cuestionario basado en la comparación de cadenas de texto
                if (fechaFinTexto) {
                    if (fechaFinTexto < fechaActualTexto && data.estado !== "cerrado") {
                        await updateDoc(docRef, { estado: "cerrado" });
                        console.log(`Cuestionario ${data.titulo} actualizado a 'cerrado'.`);
                        return; // No mostrar este cuestionario en "publicados"
                    } else if (fechaFinTexto >= fechaActualTexto && data.estado !== "publicado") {
                        await updateDoc(docRef, { estado: "publicado" });
                        console.log(`Cuestionario ${data.titulo} actualizado a 'publicado'.`);
                    }
                }

                // Mostrar el cuestionario en "publicados" si aún está en estado "publicado"
                if (data.estado === "publicado") {
                    const claseNombre = clasesMap[data.claseClave] || 'Clase no especificada';
                    const fechaCreacion = data.fechaCreacion ? new Date(data.fechaCreacion.seconds * 1000).toLocaleDateString() : 'Fecha no disponible';
                    const fechaPublicacion = data.fechaInicio || 'Fecha no disponible';
                    const duracionHoras = data.duracion && data.duracion.horas ? data.duracion.horas : 0;
                    const duracionMinutos = data.duracion && data.duracion.minutos ? data.duracion.minutos : 0;
                    const duracion = `${duracionHoras} horas y ${duracionMinutos} minutos`;

                    const cuestionarioElement = document.createElement('div');
                    cuestionarioElement.className = 'card';
                    cuestionarioElement.innerHTML = `
                        <h3>${data.titulo}</h3>
                        <p><strong>Clase:</strong> ${claseNombre}</p>
                        <p><strong>Descripción:</strong> ${data.descripcion}</p>
                        <p><strong>Fecha de Creación:</strong> ${fechaCreacion}</p>
                        <p><strong>Fecha de Publicación:</strong> ${fechaPublicacion}</p>
                        <p><strong>Fecha de Finalización:</strong> ${fechaFinTexto}</p>
                        <p><strong>Intentos:</strong> ${data.intentos}</p>
                        <p><strong>Duración:</strong> ${duracion}</p>
                    `;
                    publicadosContainer.appendChild(cuestionarioElement);
                }
            });
            ocultarCarga();
        }
    } catch (error) {
        console.error("Error al cargar los cuestionarios publicados:", error);
        ocultarCarga();
    }
}

// Función para mostrar el modal de carga
function mostrarCarga() {
    const modal = document.getElementById('modal-carga');
    if (modal) {
        modal.style.display = 'flex'; // Mostrar el modal
    }
}

// Función para ocultar el modal de carga
function ocultarCarga() {
    const modal = document.getElementById('modal-carga');
    if (modal) {
        modal.style.display = 'none'; // Ocultar el modal
    }
}

// Cargar los cuestionarios publicados al cargar la página
document.addEventListener('DOMContentLoaded', cargarCuestionariosPublicados);
