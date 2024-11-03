// Función para obtener los parámetros de la URL
function obtenerParametrosURL() {
    const params = new URLSearchParams(window.location.search);
    return {
        nombreUsuario: params.get('nombreUsuario') || 'Usuario',
        puntaje: parseInt(params.get('puntaje')) || 0,
        totalPreguntas: parseInt(params.get('totalPreguntas')) || 0,
        intentos: parseInt(params.get('intentos')) || 1,
        tiempoRestante: parseInt(params.get('tiempoRestante')) || 0
    };
}

// Función para convertir el tiempo en segundos a un formato legible
function formatearTiempo(tiempoEnSegundos) {
    const horas = Math.floor(tiempoEnSegundos / 3600);
    const minutos = Math.floor((tiempoEnSegundos % 3600) / 60);
    const segundos = tiempoEnSegundos % 60;
    return `${horas}h ${minutos}m ${segundos}s`;
}

// Función para cargar los datos y mostrar la información
function cargarInformacionExamen() {
    const datos = obtenerParametrosURL();

    document.getElementById('nombre-usuario').textContent = `¡Hola ${datos.nombreUsuario}, has terminado!`;
    document.getElementById('puntuacion').textContent = `Obtuviste: ${datos.puntaje}/${datos.totalPreguntas}`;
    document.getElementById('intentos').textContent = `Con: ${datos.intentos} intentos`;
    document.getElementById('tiempo-restante').textContent = `Con un tiempo de: ${formatearTiempo(datos.tiempoRestante)}`;

    // Mostrar la gráfica de pastel por defecto
    cargarGrafica('pie', datos.puntaje, datos.totalPreguntas - datos.puntaje);
}

// Función para cargar la gráfica
function cargarGrafica(tipoGrafica, aciertos, errores) {
    const ctx = document.getElementById('grafica').getContext('2d');

    // Verificar si existe una gráfica y destruirla antes de crear una nueva
    if (window.grafica && typeof window.grafica.destroy === 'function') {
        window.grafica.destroy();
    }

    // Crear una nueva instancia de Chart
    window.grafica = new Chart(ctx, {
        type: tipoGrafica,
        data: {
            labels: ['Aciertos', 'Errores'],
            datasets: [{
                data: [aciertos, errores],
                backgroundColor: ['skyblue', 'crimson']
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top'
                }
            }
        }
    });
}

// Evento para cambiar el tipo de gráfica
document.getElementById('selector-grafica').addEventListener('change', (event) => {
    const tipoGrafica = event.target.value;
    const datos = obtenerParametrosURL();
    cargarGrafica(tipoGrafica, datos.puntaje, datos.totalPreguntas - datos.puntaje);
});

// Cargar la información al cargar la página
document.addEventListener('DOMContentLoaded', cargarInformacionExamen);
