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
            where("estado", "==", "cerrado"),
            where("claseClave", "in", clavesClasesAlumno)
        );

        const cuestionariosSnapshot = await getDocs(cuestionariosQuery);

        if (cuestionariosSnapshot.empty) {
            cuestionariosContainer.innerHTML = '<p>No hay cuestionarios publicados para tus clases.</p>';
        } else {
            cuestionariosSnapshot.forEach((docSnap) => {
                const data = docSnap.data();
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
                    <button class="btn-visualizar-resultados" data-quiz-id="${docSnap.id}">
                        <i class="fas fa-eye"></i> Visualizar Resultados
                    </button>
                `;
                cuestionariosContainer.appendChild(cuestionarioElement);
            });

            // Añadir el evento a todos los botones de "Visualizar Resultados"
            const botonesResultados = document.querySelectorAll('.btn-visualizar-resultados');
            botonesResultados.forEach((boton) => {
                boton.addEventListener('click', async (event) => {
                    const quizId = event.currentTarget.getAttribute('data-quiz-id'); // Obtener el atributo correctamente
                    try {
                        // Consulta la colección `resultados-examen` para obtener los datos con el `quizId` y `correoUsuario`
                        const resultadosQuery = query(
                            collection(db, "resultados-examen"),
                            where("quizId", "==", quizId),
                            where("correoUsuario", "==", correoUsuario)
                        );
                        const resultadosSnapshot = await getDocs(resultadosQuery);
                        if (!resultadosSnapshot.empty) {
                            // Obtener el primer documento de los resultados
                            const resultado = resultadosSnapshot.docs[0].data();

                            // Intentar obtener el total de preguntas desde el resultado o hacer una nueva consulta al cuestionario
                            let totalPreguntas = resultado.totalPreguntas;
                            if (!totalPreguntas) {
                                // Hacer una consulta adicional para obtener el número de preguntas del cuestionario
                                const quizDoc = await getDoc(doc(db, "cuestionarios", quizId));
                                if (quizDoc.exists()) {
                                    totalPreguntas = quizDoc.data().preguntas.length;
                                } else {
                                    alert("No se pudo obtener el total de preguntas del cuestionario.");
                                    return;
                                }
                            }

                            // Redirigir a `completoexamen.html` con los datos obtenidos
                            window.location.href = `completoexamen.html?nombreUsuario=${encodeURIComponent(resultado.nombreUsuario)}&puntaje=${resultado.puntaje}&totalPreguntas=${totalPreguntas}&intentos=${resultado.intentos}&tiempoRestante=${resultado.tiempoRestante}`;
                        } else {
                            alert("No se encontraron resultados para este cuestionario.");
                        }
                    } catch (error) {
                        console.error("Error al obtener los resultados para el reporte:", error);
                        alert("Ocurrió un error al intentar obtener los resultados del reporte.");
                    }
                });
            });

        }
    } catch (error) {
        console.error("Error al cargar los cuestionarios publicados:", error);
    }
}

// Cargar los cuestionarios publicados al cargar la página
document.addEventListener('DOMContentLoaded', cargarCuestionariosPublicados);

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