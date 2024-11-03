// Importar Firebase y Firestore
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getFirestore, collection, query, where, getDocs, addDoc, deleteDoc, doc, updateDoc, getDoc } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

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

// Obtener el nombre y el correo del alumno desde localStorage
const nombreUsuario = localStorage.getItem('nombreUsuario');
const correoUsuario = localStorage.getItem('correoUsuario');
sessionStorage.setItem('nombreUsuario', nombreUsuario); // Almacenar nombreUsuario en sessionStorage para uso futuro

// Referencias al modal y elementos
const modal = document.getElementById('modal-examen');
const modalMensaje = document.getElementById('modal-mensaje');
const btnAceptar = document.getElementById('btn-aceptar');
const btnCancelar = document.getElementById('btn-cancelar');
const mainContent = document.getElementById('main-content');
const sidebar = document.getElementById('sidebar');

// Función para mostrar el modal y aplicar el efecto blur al fondo y la barra de navegación
function mostrarModal(duracion, intentos, quizId) {
    modalMensaje.innerHTML = `<i class="fas fa-exclamation-triangle" style="color: red; animation: pulse 1s infinite;"></i>
    <br><br>Tienes ${duracion} de tiempo disponible y ${intentos} intentos.`;
    modal.style.display = 'block';
    mainContent.classList.add('blurred');
    sidebar.classList.add('blurred');
    
    // Al hacer clic en "Aceptar", redirigir a examen.html con el quizId como parámetro
    btnAceptar.onclick = () => {
        modal.style.display = 'none';
        window.location.href = `examen.html?quizId=${quizId}`;
    };
}

// Función para cerrar el modal y quitar el efecto blur
function cerrarModal() {
    modal.style.display = 'none';
    mainContent.classList.remove('blurred');
    sidebar.classList.remove('blurred');
}

// Función para cargar cuestionarios publicados
async function cargarCuestionariosPublicados() {
    const cuestionariosContainer = document.getElementById('cuestionarios-container');
    cuestionariosContainer.innerHTML = ''; // Limpiar el contenedor

    try {
        // Consultar las clases en las que el alumno está inscrito
        const clasesAlumnoRef = collection(db, "clase-alumno");
        const clasesAlumnoQuery = query(
            clasesAlumnoRef,
            where("alumnoCorreo", "==", correoUsuario)
        );

        const clasesAlumnoSnapshot = await getDocs(clasesAlumnoQuery);

        if (clasesAlumnoSnapshot.empty) {
            cuestionariosContainer.innerHTML = '<p>No estás inscrito en ninguna clase.</p>';
            return;
        }

        // Obtener las claves de las clases en las que el alumno está inscrito
        const clavesClasesAlumno = [];
        const clasesMap = {};
        clasesAlumnoSnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            if (data.claseClave) {
                clavesClasesAlumno.push(data.claseClave);
                clasesMap[data.claseClave] = data.claseNombre;
            }
        });

        if (clavesClasesAlumno.length === 0) {
            cuestionariosContainer.innerHTML = '<p>No se encontraron cuestionarios para las clases en las que estás inscrito.</p>';
            return;
        }

        // Consultar los cuestionarios publicados para las clases en las que el alumno está inscrito
        const cuestionariosRef = collection(db, "cuestionarios");
        const cuestionariosQuery = query(
            cuestionariosRef,
            where("estado", "==", "publicado"),
            where("claseClave", "in", clavesClasesAlumno)
        );

        const cuestionariosSnapshot = await getDocs(cuestionariosQuery);

        if (cuestionariosSnapshot.empty) {
            cuestionariosContainer.innerHTML = '<p>No hay cuestionarios publicados para tus clases.</p>';
        } else {
            cuestionariosSnapshot.forEach((docSnap) => {
                const data = docSnap.data();
                const quizId = docSnap.id; // Obtener el ID del cuestionario
                const claseNombre = clasesMap[data.claseClave] || 'Clase no especificada';

                // Formatear fecha de publicación y fecha de finalización
                const fechaPublicacion = data.fechaInicio
                    ? new Date(data.fechaInicio).toLocaleDateString()
                    : 'Fecha no disponible';
                const fechaFin = data.fechaFin
                    ? new Date(data.fechaFin).toLocaleDateString()
                    : 'Fecha no disponible';

                const duracion = `${data.duracion.horas} horas y ${data.duracion.minutos} minutos`;

                // Crear la tarjeta de cuestionario
                const cuestionarioElement = document.createElement('div');
                cuestionarioElement.className = 'card';
                cuestionarioElement.innerHTML = `
                    <h3>${data.titulo}</h3>
                    <p><strong>Clase:</strong> ${claseNombre}</p>
                    <p><strong>Descripción:</strong> ${data.descripcion}</p>
                    <p><strong>Fecha de Publicación:</strong> ${fechaPublicacion}</p>
                    <p><strong>Fecha de Finalización:</strong> ${fechaFin}</p>
                    <p><strong>Duración:</strong> ${duracion}</p>
                    <p><strong>Intentos:</strong> ${data.intentos}</p>
                    <button class="btn-iniciar-examen" data-duracion="${duracion}" data-intentos="${data.intentos}" data-id="${quizId}">Iniciar Examen</button>
                `;
                cuestionariosContainer.appendChild(cuestionarioElement);
            });

            // Agregar evento a los botones "Iniciar Examen"
            document.querySelectorAll('.btn-iniciar-examen').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const duracion = e.target.getAttribute('data-duracion');
                    const intentos = e.target.getAttribute('data-intentos');
                    const quizId = e.target.getAttribute('data-id');
                    mostrarModal(duracion, intentos, quizId);
                });
            });
        }
    } catch (error) {
        console.error("Error al cargar los cuestionarios publicados:", error);
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
            // Esperar un momento para que la operación de Firestore se complete
            setTimeout(() => {
                window.location.href = "index.html"; // Redirigir a la página de inicio de sesión
            }, 1000); // Ajusta el tiempo si es necesario
        } else {
            console.log("No se encontró el usuario estudiante en la base de datos.");
        }
    } catch (error) {
        console.error("Error al actualizar el estado del usuario:", error);
    }
}

// Evento para cerrar el modal al hacer clic en "Cancelar"
btnCancelar.addEventListener('click', cerrarModal);

// Cargar los cuestionarios publicados al cargar la página
document.addEventListener('DOMContentLoaded', cargarCuestionariosPublicados);

// Vincular la función `desactivarUsuario()` a un evento de cierre de sesión
document.getElementById('logout-btn').addEventListener('click', async () => {
    await desactivarUsuario();
});