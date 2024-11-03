document.addEventListener('DOMContentLoaded', () => {
    const frases = [
        "La educación es el arma más poderosa que puedes usar para cambiar el mundo. - Nelson Mandela",
        "El arte de enseñar es el arte de asistir al descubrimiento. - Mark Van Doren",
        "La enseñanza que deja huella no es la que se hace de cabeza a cabeza, sino de corazón a corazón. - Howard G. Hendricks",
        "La educación no es la preparación para la vida; la educación es la vida misma. - John Dewey",
        "La mejor manera de predecir el futuro es crearlo. - Peter Drucker"
    ];

    // Selección de una frase aleatoria
    function mostrarFraseAleatoria() {
        const frase = frases[Math.floor(Math.random() * frases.length)];
        document.getElementById('frase-motivacional').innerText = frase;
    }

    // Cambia la frase cada 5 segundos
    setInterval(mostrarFraseAleatoria, 5000);

    // Mostrar una frase inicialmente
    mostrarFraseAleatoria();

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

    // Mostrar el modal de carga al hacer clic en el botón de "Cerrar sesión"
    document.querySelector('.logout-btn').addEventListener('click', (event) => {
        event.preventDefault(); // Evita la redirección inmediata
        mostrarCarga();

        // Redirige después de un pequeño retraso
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000); // Cambia el tiempo (en milisegundos) según sea necesario
    });
});
