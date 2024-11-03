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

// Obtener nombre y correo del docente desde localStorage
const nombreUsuario = localStorage.getItem('nombreUsuario');
const correoUsuario = localStorage.getItem('correoUsuario');

// Función para mostrar el modal de carga
function mostrarCarga() {
    document.getElementById('modal-carga').style.display = 'flex';
}

// Función para ocultar el modal de carga
function ocultarCarga() {
    document.getElementById('modal-carga').style.display = 'none';
}

// Función para cargar estudiantes registrados por clase y su estado
async function cargarEstudiantesPorClase() {
    const clasesContainer = document.getElementById('clases-container');

    mostrarCarga(); // Mostrar modal de carga

    try {
        // Obtener todas las clases del docente actual
        const clasesQuery = query(collection(db, "clases"), where("docente.correo", "==", correoUsuario));
        const clasesSnapshot = await getDocs(clasesQuery);

        if (clasesSnapshot.empty) {
            clasesContainer.innerHTML = '<p>No se encontraron clases para el docente actual.</p>';
            ocultarCarga(); // Ocultar modal de carga si no hay clases
            return;
        }

        // Iterar sobre cada clase
        for (const claseDoc of clasesSnapshot.docs) {
            const claseData = claseDoc.data();
            const claseId = claseDoc.id;

            // Crear un contenedor para la clase
            const claseContainer = document.createElement('div');
            claseContainer.classList.add('clase-container');
            claseContainer.innerHTML = `<h2>${claseData.nombre} - Grupo: ${claseData.grupo}</h2>`;

            // Crear una tabla para mostrar los estudiantes
            const tabla = document.createElement('table');
            tabla.innerHTML = `
                <thead>
                    <tr>
                        <th>Nombre</th>
                        <th>Correo</th>
                        <th>Fecha de Registro</th>
                        <th>Estado</th>
                        <th>Actividad</th>
                    </tr>
                </thead>
                <tbody id="tbody-${claseId}">
                    <tr><td colspan="5">Cargando...</td></tr>
                </tbody>
            `;
            claseContainer.appendChild(tabla);
            clasesContainer.appendChild(claseContainer);

            // Obtener estudiantes vinculados a la clase
            const estudiantesQuery = query(collection(db, "clase-alumno"), where("claseId", "==", claseId));
            const estudiantesSnapshot = await getDocs(estudiantesQuery);

            const tbody = document.getElementById(`tbody-${claseId}`);
            tbody.innerHTML = ''; // Limpiar el contenido cargando

            if (estudiantesSnapshot.empty) {
                tbody.innerHTML = '<tr><td colspan="5">No hay estudiantes registrados en esta clase.</td></tr>';
            } else {
                for (const estDoc of estudiantesSnapshot.docs) {
                    const estData = estDoc.data();

                    // Consulta para obtener el estado del usuario utilizando el correo
                    const usuariosQuery = query(collection(db, "usuarios"), where("correo", "==", estData.alumnoCorreo));
                    const usuariosSnapshot = await getDocs(usuariosQuery);

                    let estado = 'Desconocido';
                    if (!usuariosSnapshot.empty) {
                        usuariosSnapshot.forEach((usuarioDoc) => {
                            estado = usuarioDoc.data().estado || 'Desconocido';
                        });
                    }

                    const fila = `
                        <tr>
                            <td>${estData.alumnoNombre}</td>
                            <td>${estData.alumnoCorreo}</td>
                            <td>${new Date(estData.fechaRegistro.seconds * 1000).toLocaleDateString()}</td>
                            <td>${estado}</td>
                            <td><button onclick="verActividad('${estData.alumnoCorreo}', '${claseData.clave}')">Ver Actividad</button></td>
                        </tr>
                    `;
                    tbody.innerHTML += fila;
                }
            }
        }
        ocultarCarga(); // Ocultar modal de carga después de completar la carga de datos
    } catch (error) {
        console.error("Error al cargar los estudiantes:", error);
        alert("Ocurrió un error al cargar los estudiantes.");
        ocultarCarga(); // Ocultar modal de carga en caso de error
    }
}

// Hacer que la función esté disponible en el ámbito global
window.verActividad = function(correo, claseClave) {
    // Redirigir a reportes2.html pasando el correo del estudiante y la clave de la clase como parámetros
    window.location.href = `reportes2.html?correo=${correo}&claseClave=${claseClave}`;
};

// Cargar los estudiantes al cargar la página
document.addEventListener('DOMContentLoaded', cargarEstudiantesPorClase);

