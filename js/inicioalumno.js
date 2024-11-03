document.addEventListener('DOMContentLoaded', () => {
    const frases = [
        "El único lugar donde el éxito viene antes que el trabajo es en el diccionario.",
        "La educación es el primer paso hacia el cambio que quieres ver en el mundo.",
        "Cada error es una lección. No temas equivocarte, ¡aprende de ello!",
        "El esfuerzo de hoy será tu éxito de mañana.",
        "No importa lo lento que vayas, siempre y cuando no te detengas.",
        "La clave para el éxito es la constancia en los estudios.",
        "El conocimiento es poder; no te conformes, aprende más cada día.",
        "La educación es la puerta que abre oportunidades.",
        "La disciplina es el puente entre metas y logros.",
        "Lo único imposible es aquello que no intentas.",
        "Cree en ti mismo. Eres capaz de lograr cosas increíbles.",
        "Tu único límite es tu mente. Piensa en grande y esfuérzate.",
        "Estudia no para saber más, sino para ser mejor cada día.",
        "El éxito no llega por casualidad, llega por esfuerzo y dedicación.",
        "Recuerda que todo esfuerzo tendrá su recompensa."
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
});

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

// Variables del usuario
const nombreUsuario = localStorage.getItem('nombreUsuario');
const correoUsuario = localStorage.getItem('correoUsuario');

// Función para actualizar el estado del usuario a "activo" al iniciar sesión
async function activarUsuario() {
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
            usuarioSnapshot.forEach(async (docSnap) => {
                const docRef = doc(db, "usuarios", docSnap.id);
                await updateDoc(docRef, { estado: "activo" });
                console.log("El estado del usuario se ha actualizado a 'activo'.");
            });
        } else {
            console.log("No se encontró el usuario estudiante en la base de datos.");
        }
    } catch (error) {
        console.error("Error al actualizar el estado del usuario:", error);
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

// Llamar a `activarUsuario()` al cargar la página para establecer el estado en "activo"
document.addEventListener('DOMContentLoaded', activarUsuario);

// Vincular la función `desactivarUsuario()` a un evento de cierre de sesión
document.getElementById('logout-btn').addEventListener('click', async () => {
    await desactivarUsuario();
});


