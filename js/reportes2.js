// Importar Firebase y Firestore
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getFirestore, collection, getDocs, query, where, doc, getDoc } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

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

let correctasGlobal = 0;
let totalPreguntasGlobal = 0;
let currentChart = null;

// Función para cargar los datos de cuestionarios respondidos por el estudiante
async function cargarCuestionariosRespondidos(correoUsuario) {
    mostrarCarga();
    const contenedorResultados = document.getElementById('contenedor-resultados');
    contenedorResultados.innerHTML = ''; // Limpiar el contenido previo
    try {
        // Consultar los resultados de los exámenes en base al correo del usuario
        const resultadosQuery = query(collection(db, "resultados-examen"), where("correoUsuario", "==", correoUsuario));
        const resultadosSnapshot = await getDocs(resultadosQuery);

        if (resultadosSnapshot.empty) {
            contenedorResultados.innerHTML = '<p>No se encontraron cuestionarios respondidos para este estudiante.</p>';
        }else{

        resultadosSnapshot.forEach(async (resultDoc) => {
            const resultado = resultDoc.data();

            // Obtener datos del cuestionario original
            const quizDocRef = doc(db, "cuestionarios", resultado.quizId);
            const quizDoc = await getDoc(quizDocRef);

            if (quizDoc.exists()) {
                const cuestionario = quizDoc.data();

                // Verificar si el cuestionario tiene preguntas y opciones
                if (!cuestionario.preguntas || cuestionario.preguntas.length === 0) {
                    console.error(`El cuestionario con ID ${resultado.quizId} no tiene preguntas.`);
                    return;
                }

                // Usar la puntuación almacenada en los resultados
                const puntuacion = resultado.puntaje;
                const totalPreguntas = cuestionario.preguntas.length;

                // Crear una fila de la tabla con los detalles del cuestionario
                const fila = document.createElement('tr');
                fila.innerHTML = `
                <td>${cuestionario.descripcion}</td>
                <td>${resultado.nombreUsuario}</td>
                <td>${resultado.correoUsuario}</td>
                <td>${new Date(resultado.fechaEnvio.seconds * 1000).toLocaleString()}</td>
                <td>${resultado.intentos}</td>
                <td>${puntuacion}/${totalPreguntas}</td> <!-- Mostrar la puntuación directamente -->
                <td>${formatearTiempo(resultado.tiempoRestante)}</td>
                <td>
                    <button onclick="verDetalle('${resultado.quizId}', '${resultado.correoUsuario}')">Ver Detalle</button>
                </td>
            `;

                // Agregar la fila a la tabla de resultados
                contenedorResultados.appendChild(fila);
            } else {
                console.error(`No se encontró el cuestionario con ID ${resultado.quizId}.`);
            }
        });
    }
} catch (error) {
    console.error("Error al cargar los cuestionarios respondidos:", error);
} finally {
    ocultarCarga(); // Ocultar modal de carga al finalizar
}
}

// Función para formatear el tiempo en un formato legible
function formatearTiempo(tiempoEnSegundos) {
    const horas = Math.floor(tiempoEnSegundos / 3600);
    const minutos = Math.floor((tiempoEnSegundos % 3600) / 60);
    const segundos = tiempoEnSegundos % 60;
    return `${horas}h ${minutos}m ${segundos}s`;
}

// Función para mostrar detalles del cuestionario en el modal
window.verDetalle = async function (quizId, correoUsuario) {
    const detalleContainer = document.getElementById('detalle-cuestionario');
    detalleContainer.innerHTML = '<p>Cargando detalles...</p>';

    // Obtener el documento del cuestionario
    const quizDocRef = doc(db, "cuestionarios", quizId);
    const quizDoc = await getDoc(quizDocRef);

    if (quizDoc.exists()) {
        const cuestionario = quizDoc.data();
        const resultadoQuery = query(collection(db, "resultados-examen"), where("correoUsuario", "==", correoUsuario), where("quizId", "==", quizId));
        const resultadoSnapshot = await getDocs(resultadoQuery);

        if (!resultadoSnapshot.empty) {
            const resultado = resultadoSnapshot.docs[0].data();

            let detalleHTML = `
                <h3>${cuestionario.descripcion}</h3>
                <p>Nombre: ${resultado.nombreUsuario}</p>
                <p>Correo: ${resultado.correoUsuario}</p>
                <p>Fecha de Envío: ${new Date(resultado.fechaEnvio.seconds * 1000).toLocaleString()}</p>
                <p>Intentos: ${resultado.intentos}</p>
                <p>Puntuación: ${resultado.puntaje}/${cuestionario.preguntas.length}</p>
                <p>Tiempo Restante: ${formatearTiempo(resultado.tiempoRestante)}</p>
                <h4>Respuestas:</h4>
                <ul>
            `;

            resultado.respuestasUsuario.forEach((respuesta, index) => {
                const pregunta = cuestionario.preguntas[respuesta.preguntaIndex]; // Utiliza preguntaIndex para obtener la pregunta correcta
                if (pregunta) {
                    // Mostrar las respuestas correctas
                    const respuestasCorrectas = pregunta.opciones.filter(op => op.correcta).map(op => op.texto).join(', ');

                    // Mostrar las respuestas seleccionadas por el alumno
                    let respuestasSeleccionadas = '';
                    if (Array.isArray(respuesta.respuestaSeleccionada)) {
                        respuestasSeleccionadas = respuesta.respuestaSeleccionada.map(i => {
                            const opcion = pregunta.opciones[i];
                            return opcion ? opcion.texto : 'Respuesta no encontrada';
                        }).join(', ');
                    } else {
                        const opcionSeleccionada = pregunta.opciones[respuesta.respuestaSeleccionada];
                        respuestasSeleccionadas = opcionSeleccionada ? opcionSeleccionada.texto : 'Sin respuesta';
                    }

                    // Evaluar si la respuesta del alumno es correcta o incorrecta
                    const esCorrecta = Array.isArray(respuesta.respuestaSeleccionada)
                        ? respuesta.respuestaSeleccionada.every(i => pregunta.opciones[i] && pregunta.opciones[i].correcta) ? 'Correcta' : 'Incorrecta'
                        : (pregunta.opciones[respuesta.respuestaSeleccionada] && pregunta.opciones[respuesta.respuestaSeleccionada].correcta) ? 'Correcta' : 'Incorrecta';

                    detalleHTML += `
                        <li>
                            <strong>${respuesta.preguntaIndex + 1}. ${pregunta.texto}</strong><br>
                            Respuesta correcta: ${respuestasCorrectas}<br>
                            Respuesta del estudiante: ${respuestasSeleccionadas} (${esCorrecta})
                        </li>
                    `;
                } else {
                    detalleHTML += `
                        <li>
                            <strong>${respuesta.preguntaIndex + 1}. Pregunta no encontrada</strong><br>
                            Respuesta del estudiante: Sin respuesta (Incorrecta)
                        </li>
                    `;
                }
            });

            detalleHTML += '</ul>';
            detalleContainer.innerHTML = detalleHTML;

            const correctas = resultado.puntaje;
            const totalPreguntas = cuestionario.preguntas.length;
            mostrarGraficoInicial(correctas, totalPreguntas);

            // Mostrar el modal
            document.getElementById('modal-analitico').style.display = 'block';
        } else {
            detalleContainer.innerHTML = '<p>No se encontraron detalles del resultado.</p>';
        }
    } else {
        detalleContainer.innerHTML = '<p>No se encontró el cuestionario.</p>';
    }
};

// Función para cambiar el tipo de gráfico
window.cambiarGrafico = function () {
    const tipoGrafica = document.getElementById('chart-type').value;
    // Utilizar los valores globales para cargar la gráfica
    cargarGrafica(tipoGrafica, correctasGlobal, totalPreguntasGlobal);
};

// Función para inicializar la gráfica por defecto
function mostrarGraficoInicial(correctas, totalPreguntas) {
    correctasGlobal = correctas; // Guardar los valores en las variables globales
    totalPreguntasGlobal = totalPreguntas; // Guardar los valores en las variables globales
    cargarGrafica('pie', correctas, totalPreguntas);
}

// Función para cargar la gráfica
function cargarGrafica(tipoGrafica, correctas, totalPreguntas) {
    const incorrectas = totalPreguntas - correctas;
    const ctx = document.getElementById('chartCanvas').getContext('2d');
    const canvas = document.getElementById('chartCanvas');
    canvas.style.backgroundColor = '#ffffff';

    // Verificar si existe una gráfica y destruirla antes de crear una nueva
    if (currentChart && typeof currentChart.destroy === 'function') {
        currentChart.destroy();
    }

    // Crear una nueva instancia de Chart
    currentChart = new Chart(ctx, {
        type: tipoGrafica,
        data: {
            labels: ['Correctas', 'Incorrectas'],
            datasets: [{
                data: [correctas, incorrectas],
                backgroundColor: ['#4CAF50', '#FF4B5C']
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top'
                }
            },
            // Este es un ajuste de estilo adicional si necesitas un fondo blanco en el canvas
            layout: {
                backgroundColor: '#ffffff' // Fondo blanco
            }
        }
    });
}

// Función para cerrar el modal
window.cerrarModal = function () {
    document.getElementById('modal-analitico').style.display = 'none';
};

function mostrarCarga() {
    const modal = document.getElementById('modal-carga');
    if (modal) {
        modal.style.display = 'flex'; // Mostrar el modal centrado
    }
}

function ocultarCarga() {
    const modal = document.getElementById('modal-carga');
    if (modal) {
        modal.style.display = 'none'; // Ocultar el modal
    }
}

// Accede a jsPDF desde el espacio de nombres de `window.jspdf`
const { jsPDF } = window.jspdf;

window.generarPDF = function () {
    const checkbox = document.querySelector('.input');

    // Verificar si el checkbox ya ha sido activado
    if (checkbox.checked) {
        return; // Si ya se ha ejecutado, no hacer nada
    }

    // Marcar el checkbox como activado
    checkbox.checked = true;

    const modalElement = document.getElementById('modal-analitico');
    const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'pt',
        format: 'a4'
    });

    let yOffset = 40; // Espaciado inicial

    // Agregar el título del modal
    const titulo = modalElement.querySelector('h3').textContent;
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text(titulo, 20, yOffset);
    yOffset += 30;

    // Agregar los párrafos de información del modal
    const parrafos = modalElement.querySelectorAll('p');
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    parrafos.forEach(parrafo => {
        pdf.text(parrafo.textContent, 20, yOffset, { maxWidth: 550 });
        yOffset += 20; // Espaciado entre párrafos
    });

    // Agregar las respuestas (formato de lista)
    const respuestasList = modalElement.querySelector('ul');
    if (respuestasList) {
        const respuestasItems = respuestasList.querySelectorAll('li');
        pdf.setFontSize(10);
        respuestasItems.forEach(item => {
            if (yOffset > 700) {
                pdf.addPage();
                yOffset = 40; // Reiniciar el espaciado en la nueva página
            }
            pdf.text(item.textContent, 30, yOffset, { maxWidth: 500 });
            yOffset += 40; // Incrementar el espaciado entre preguntas y respuestas
        });
    }

    // Agregar un margen adicional antes de la gráfica
    yOffset += 30; // Espacio extra para evitar superposición

    // Verificar si hay un canvas para la gráfica y agregarla al PDF
    const canvas = document.getElementById('chartCanvas');
    if (canvas) {
        const imgData = canvas.toDataURL('image/png');
        const imgWidth = 300; // Ancho fijo de la imagen
        const imgHeight = (canvas.height / canvas.width) * imgWidth; // Mantener la proporción de la imagen
        if (yOffset + imgHeight > pdf.internal.pageSize.height) {
            pdf.addPage();
            yOffset = 40; // Reiniciar el espaciado en la nueva página
        }
        pdf.addImage(imgData, 'PNG', 20, yOffset, imgWidth, imgHeight);
    }

    pdf.save('detalle-cuestionario.pdf');

    // Desmarcar el checkbox después de 5 segundos
    setTimeout(() => {
        checkbox.checked = false;
    }, 5000);
};

// Cargar los cuestionarios al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const correoUsuario = urlParams.get('correo');
    const correctasElem = document.getElementById('correctas');
    const totalPreguntasElem = document.getElementById('total-preguntas');

    if (!correctasElem || !totalPreguntasElem) {
        console.error('Error: No se encontraron los elementos correctas o total-preguntas.');
    } else {
        console.log('Elementos correctas y total-preguntas encontrados.');
    }

    if (correoUsuario) {
        cargarCuestionariosRespondidos(correoUsuario);
    } else {
        document.getElementById('contenedor-resultados').innerHTML = '<p>Error: Faltan parámetros de la URL.</p>';
    }
});
