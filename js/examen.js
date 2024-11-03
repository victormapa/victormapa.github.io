// Importar Firebase y Firestore
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getFirestore, collection, getDoc, doc, updateDoc, setDoc, query, where, getDocs } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

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

// Variables del usuario
const nombreUsuario = localStorage.getItem('nombreUsuario');
const correoUsuario = localStorage.getItem('correoUsuario');

// Obtener la clave del cuestionario de la URL
const urlParams = new URLSearchParams(window.location.search);
const quizId = urlParams.get('quizId');

// Variables para el temporizador y las preguntas correctas
let duracionExamen;
let respuestasCorrectas = [];
let intentosDisponibles;

// Función para mostrar las preguntas y cargar los datos del cuestionario
async function cargarPreguntas() {
    if (!quizId) {
        alert("Error: No se ha seleccionado un examen.");
        return;
    }

    try {
        const quizRef = doc(db, "cuestionarios", quizId);
        const quizSnap = await getDoc(quizRef);

        if (quizSnap.exists()) {
            const quizData = quizSnap.data();
            document.getElementById('titulo-examen').textContent = quizData.titulo;
            respuestasCorrectas = quizData.preguntas;
            intentosDisponibles = quizData.intentos;

            // Verificar los intentos previos del usuario
            const resultadosRef = collection(db, "resultados-examen");
            const resultadosQuery = query(resultadosRef, where("quizId", "==", quizId), where("correoUsuario", "==", correoUsuario));
            const resultadosSnapshot = await getDocs(resultadosQuery);

            let intentosRealizados = 0;
            if (!resultadosSnapshot.empty) {
                resultadosSnapshot.forEach((docSnap) => {
                    const data = docSnap.data();
                    intentosRealizados = data.intentos;
                });
            }

            const intentosRestantes = intentosDisponibles - intentosRealizados;
            document.getElementById('intentos').textContent = `Intentos restantes: ${intentosRestantes}`;

            if (intentosRestantes <= 0) {
                alert("Ya no tienes más intentos disponibles para este examen.");

                // Ocultar el botón de enviar examen
                document.getElementById('btn-enviar-examen').style.display = 'none';

                // Crear contenedor para los botones
                const botonesContainer = document.createElement('div');
                botonesContainer.style.display = 'flex';
                botonesContainer.style.justifyContent = 'center';
                botonesContainer.style.gap = '20px'; // Espacio entre los botones
                botonesContainer.style.marginTop = '20px'; // Espacio superior

                // Crear botón de reporte
                const btnVerReporte = document.createElement('button');
                btnVerReporte.id = 'btn-ver-reporte';
                btnVerReporte.classList.add('btn');
                btnVerReporte.innerHTML = '<i class="fas fa-file-alt"></i> Ver Reporte';

                // Crear botón de salir
                const btnSalir = document.createElement('button');
                btnSalir.id = 'btn-salir';
                btnSalir.classList.add('btn');
                btnSalir.innerHTML = '<i class="fas fa-sign-out-alt"></i> Salir';
                btnSalir.addEventListener('click', () => {
                    window.location.href = 'inicioalumno.html';
                });
                // Mostrar los botones de reporte y salir
                botonesContainer.innerHTML = `
                    <button id="btn-salir" class="btn">
                        <i class="fas fa-sign-out-alt"></i> Salir
                    </button>
                `;

                // Añadir el contenedor de botones al cuerpo de la página o a un elemento específico
                
                botonesContainer.appendChild(btnVerReporte);
                document.body.appendChild(botonesContainer);
                
                // Eventos para los nuevos botones
                // Añadir el evento al botón antes de añadirlo al DOM
                btnVerReporte.addEventListener('click', async () => {
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
                
                            // Redirigir a `completoexamen.html` con los datos obtenidos
                            window.location.href = `completoexamen.html?nombreUsuario=${encodeURIComponent(resultado.nombreUsuario)}&puntaje=${resultado.puntaje}&totalPreguntas=${respuestasCorrectas.length}&intentos=${resultado.intentos}&tiempoRestante=${resultado.tiempoRestante}`;
                        } else {
                            alert("No se encontraron resultados para este cuestionario.");
                        }
                    } catch (error) {
                        console.error("Error al obtener los resultados para el reporte:", error);
                        alert("Ocurrió un error al intentar obtener los resultados del reporte.");
                    }
                });

                document.getElementById('btn-salir').addEventListener('click', () => {
                    window.location.href = 'publicadosalumno.html';
                });

                return;
            }

            // Inicializar la duración del examen
            duracionExamen = quizData.duracion.horas * 3600 + quizData.duracion.minutos * 60;
            iniciarTemporizador();

            const preguntasContainer = document.getElementById('preguntas-container');
            quizData.preguntas.forEach((pregunta, index) => {
                const preguntaElement = document.createElement('div');
                preguntaElement.classList.add('pregunta');
                preguntaElement.innerHTML = `
                    <h4>${index + 1}. ${pregunta.texto}</h4>
                    <div class="opciones-container">
                        ${pregunta.opciones.map((opcion, idx) => `
                            <label>
                                <input type="${pregunta.tipo}" name="pregunta-${index}" value="${idx}">
                                ${opcion.texto}
                            </label>
                        `).join('')}
                    </div>
                `;
                preguntasContainer.appendChild(preguntaElement);
            });
        } else {
            console.log("No se encontraron datos del cuestionario.");
        }
    } catch (error) {
        console.error("Error al cargar las preguntas:", error);
    }
}

// Función para iniciar el temporizador
function iniciarTemporizador() {
    const timerElement = document.getElementById('timer');
    const interval = setInterval(() => {
        if (duracionExamen <= 0) {
            clearInterval(interval);
            alert("El tiempo del examen ha terminado.");
            document.getElementById('btn-enviar-examen').click(); // Forzar envío
        } else {
            duracionExamen--;
            const horas = Math.floor(duracionExamen / 3600);
            const minutos = Math.floor((duracionExamen % 3600) / 60);
            const segundos = duracionExamen % 60;
            timerElement.textContent = `${horas}:${minutos}:${segundos}`;
        }
    }, 1000);
}

// Función para enviar el examen
// Función para enviar el examen
document.getElementById('btn-enviar-examen').addEventListener('click', async () => {
    const respuestasUsuario = [];
    const preguntaElements = document.querySelectorAll('.pregunta');

    preguntaElements.forEach((preguntaElement, index) => {
        const opciones = preguntaElement.querySelectorAll('input');
        opciones.forEach((opcion) => {
            if (opcion.checked) {
                respuestasUsuario.push({
                    preguntaIndex: index,
                    respuestaSeleccionada: parseInt(opcion.value)
                });
            }
        });
    });

    // Comparar respuestas del usuario con las correctas
    let puntaje = 0;
    respuestasUsuario.forEach((respuesta) => {
        const respuestaCorrecta = respuestasCorrectas[respuesta.preguntaIndex].opciones.findIndex(op => op.correcta);
        if (respuestaCorrecta === respuesta.respuestaSeleccionada) {
            puntaje++;
        }
    });

    alert(`Examen enviado. Tu puntaje es: ${puntaje}/${respuestasCorrectas.length}`);

    // Guardar o actualizar los resultados en Firestore
    try {
        const resultadosRef = collection(db, "resultados-examen");
        const resultadosQuery = query(resultadosRef, where("quizId", "==", quizId), where("correoUsuario", "==", correoUsuario));
        const resultadosSnapshot = await getDocs(resultadosQuery);

        let intentosRealizados = 0;
        if (!resultadosSnapshot.empty) {
            // Actualizar el registro existente
            const resultadoDoc = resultadosSnapshot.docs[0];
            const resultadoRef = doc(db, "resultados-examen", resultadoDoc.id);
            intentosRealizados = resultadoDoc.data().intentos + 1;
            await updateDoc(resultadoRef, {
                respuestasUsuario: respuestasUsuario,
                puntaje: puntaje,
                tiempoRestante: duracionExamen,
                fechaEnvio: new Date(),
                intentos: intentosRealizados
            });
            console.log("Resultados actualizados exitosamente.");
        } else {
            // Crear un nuevo registro si no existe
            intentosRealizados = 1;
            await setDoc(doc(db, "resultados-examen", `${quizId}-${correoUsuario}`), {
                quizId: quizId,
                nombreUsuario: nombreUsuario,
                correoUsuario: correoUsuario,
                respuestasUsuario: respuestasUsuario,
                puntaje: puntaje,
                tiempoRestante: duracionExamen,
                fechaEnvio: new Date(),
                intentos: intentosRealizados
            });
            console.log("Resultados guardados exitosamente.");
        }

        // Redirigir al usuario a la página de completoexamen con los datos en la URL
        window.location.href = `completoexamen.html?nombreUsuario=${encodeURIComponent(nombreUsuario)}&puntaje=${puntaje}&totalPreguntas=${respuestasCorrectas.length}&intentos=${intentosRealizados}&tiempoRestante=${duracionExamen}`;
    } catch (error) {
        console.error("Error al guardar o actualizar las respuestas:", error);
    }
});

// Cargar preguntas al cargar la página
document.addEventListener('DOMContentLoaded', cargarPreguntas);
botonesContainer.appendChild(btnVerReporte);
document.body.appendChild(botonesContainer);
