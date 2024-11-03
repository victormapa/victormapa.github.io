// Import Firebase and Firestore
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, where, doc, updateDoc, deleteDoc, getDoc } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

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

// Usa estas variables para vincular las clases del usuario actual
console.log("Nombre:", nombreUsuario);
console.log("Correo:", correoUsuario);

let editingClave = null; // Para almacenar el ID del documento de la clase que se está editando

// Función para generar una clave única de 5 caracteres
function generarClave() {
    const caracteres = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let clave = "";
    for (let i = 0; i < 5; i++) {
        clave += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
    }
    return clave;
}

// Función para verificar si una clave ya existe en la base de datos
async function verificarClaveUnica(clave) {
    const q = query(collection(db, "clases"), where("clave", "==", clave));
    const querySnapshot = await getDocs(q);
    return querySnapshot.empty; // Retorna true si la clave es única
}

// Función para generar una clave única asegurando que no exista en la base de datos
async function generarClaveUnica() {
    let clave;
    let esUnica = false;
    while (!esUnica) {
        clave = generarClave();
        esUnica = await verificarClaveUnica(clave);
    }
    return clave;
}

// Modificación en la función agregarMateria para incluir la funcionalidad de copiarTexto
function agregarMateria(nombre, clave, grupo, status, id) {
    const materiasContainer = document.getElementById('materias-container');
    const card = document.createElement('div');
    card.className = 'card';

    // Agregar atributo data-id para identificar el documento en Firestore
    card.setAttribute('data-id', id);

    card.innerHTML = `
        <h3>${nombre}</h3>
        <p>Clave: ${clave} <button class="copy-btn"><i class="fas fa-copy"></i></button></p>
        <p>Grupo: ${grupo}</p>
        <p><span class="status">${status}</span></p>
        <div class="actions">
            <button class="edit-btn"><i class="fas fa-pencil-alt"></i></button>
            <button class="delete-btn"><i class="fas fa-trash"></i></button>
        </div>
    `;

    materiasContainer.appendChild(card);

    // Evento click para redirigir a la página de cuestionarios
    card.addEventListener('click', () => {
        window.location.href = `cuestionario.html?clave=${clave}`;
    });

    // Evento click para copiar la clave al portapapeles
    const copyBtn = card.querySelector('.copy-btn');
    copyBtn.addEventListener('click', (event) => copiarTexto(clave, event));

    // Agregar eventos a los botones de edición y eliminación
    card.querySelector('.edit-btn').addEventListener('click', (event) => {
        event.stopPropagation();
        abrirModalEdicion(nombre, clave, grupo, id);
    });

    card.querySelector('.delete-btn').addEventListener('click', (event) => {
        event.stopPropagation();
        eliminarClase(id);
    });
}

// Función para copiar texto al portapapeles
function copiarTexto(texto, event) {
    event.stopPropagation(); // Detener la propagación para evitar que active el clic en la tarjeta
    navigator.clipboard.writeText(texto).then(() => {
        mostrarNotificacion("Clave copiada exitosamente");
    }).catch((error) => {
        console.error("Error al copiar al portapapeles: ", error);
    });
}

// Función para mostrar una notificación de éxito
function mostrarNotificacion(mensaje) {
    const notificacion = document.createElement('div');
    notificacion.className = 'notificacion visible';
    notificacion.innerHTML = `<i class="fas fa-check-circle"></i> ${mensaje}`;
    document.body.appendChild(notificacion);

    // Ocultar la notificación después de 2 segundos
    setTimeout(() => {
        notificacion.classList.remove('visible');
        setTimeout(() => {
            document.body.removeChild(notificacion);
        }, 300);
    }, 2000);
}

// Función para abrir el modal de edición con los datos de la clase (sin edición de clave)
function abrirModalEdicion(nombre, clave, grupo, id) {
    editingClave = id; // Guardamos el ID del documento que se está editando
    const modalEdit = document.getElementById('modal-edit');
    modalEdit.classList.add('show'); // Mostrar el modal de edición

    // Rellenar el formulario con los datos de la clase
    document.getElementById('edit-nombre').value = nombre;
    document.getElementById('edit-grupo').value = grupo;
    document.getElementById('edit-clave').textContent = clave; // Mostrar clave sin edición
}

// Función para guardar una clase en Firestore y vincularla al usuario actual
async function guardarClase(nombre, clave, grupo) {
    mostrarCarga();
    try {
        const docRef = await addDoc(collection(db, "clases"), {
            nombre: nombre,
            clave: clave,
            grupo: grupo,
            fechaCreacion: new Date(),
            docente: {
                nombre: nombreUsuario,
                correo: correoUsuario
            }
        });
        console.log("Clase guardada exitosamente", docRef.id);

        // Eliminar el mensaje si existe
        const mensaje = document.querySelector('#materias-container p');
        if (mensaje && mensaje.textContent.includes("No existen clases")) {
            mensaje.remove();
        }

        // Agregar la clase a la interfaz
        agregarMateria(nombre, clave, grupo, "Setup in Progress", docRef.id);
    } catch (e) {
        console.error("Error al guardar la clase: ", e);
        alert("Error al guardar la clase.");
    } finally {
        ocultarCarga();
    }
}

// Función para cargar las clases desde Firestore solo si coinciden con el nombre y correo del usuario
async function cargarClases() {
    const materiasContainer = document.getElementById('materias-container');
    materiasContainer.innerHTML = ''; // Limpiar el contenedor

    mostrarCarga();

    try {

        const q = query(collection(db, "clases"),
            where("docente.nombre", "==", nombreUsuario),
            where("docente.correo", "==", correoUsuario));

        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            console.log("No se encontraron clases.");
            materiasContainer.innerHTML = '<p>No existen clases, agrega clases a tu menú.</p>';
        } else {
            querySnapshot.forEach((docSnap) => {
                const data = docSnap.data();
                const id = docSnap.id; // Obtener el ID del documento
                agregarMateria(data.nombre, data.clave, data.grupo, "<br>CLIC PARA VER EXÁMENES", id);  // Pasar el ID del documento
            });
        }
    } catch (error) {
        console.error("error al cargar las clases", error);
    } finally {
        ocultarCarga();
    }
}

// Función para eliminar una clase de Firestore y de la interfaz, junto con sus cuestionarios relacionados
async function eliminarClase(id) {
    if (confirm("¿Estás seguro de que deseas eliminar esta clase y todos sus cuestionarios relacionados?")) {
        mostrarCarga();
        try {
            // Obtener la clase para acceder a su clave antes de eliminarla
            const claseRef = doc(db, "clases", id);
            const claseSnap = await getDoc(claseRef);

            if (claseSnap.exists()) {
                const claseData = claseSnap.data();
                const claseClave = claseData.clave;

                // Eliminar cuestionarios relacionados con la clase clave
                const cuestionariosRef = collection(db, "cuestionarios");
                const cuestionarioQuery = query(cuestionariosRef, where("claseClave", "==", claseClave));
                const cuestionarioSnapshot = await getDocs(cuestionarioQuery);

                // Eliminar cada cuestionario relacionado
                const deletePromises = [];
                cuestionarioSnapshot.forEach((docSnap) => {
                    deletePromises.push(deleteDoc(doc(db, "cuestionarios", docSnap.id)));
                });

                // Esperar a que todos los cuestionarios se eliminen
                await Promise.all(deletePromises);
                console.log(`Todos los cuestionarios relacionados con la clase ${claseClave} han sido eliminados.`);

                // Eliminar la clase después de eliminar los cuestionarios relacionados
                await deleteDoc(claseRef);
                console.log(`Clase con ID ${id} y clave ${claseClave} eliminada.`);

                // Eliminar la tarjeta de la interfaz
                const cardToRemove = document.querySelector(`[data-id="${id}"]`);
                if (cardToRemove) {
                    cardToRemove.remove();
                }
            } else {
                console.error("La clase no existe en Firestore.");
            }
        } catch (error) {
            console.error("Error al eliminar la clase y sus cuestionarios: ", error);
            alert("Hubo un error al intentar eliminar la clase y sus cuestionarios.");
        } finally {
            ocultarCarga();
        }
    }
}


// Evento que se ejecuta cuando el DOM está listo
document.addEventListener('DOMContentLoaded', async () => {
    const modal = document.getElementById('modal');
    const modalEdit = document.getElementById('modal-edit');
    const closeModal = document.querySelector('.close');
    const closeModalEdit = document.querySelector('.close-edit');
    const saveBtn = document.getElementById('save-btn');
    const editSaveBtn = document.getElementById('edit-save-btn');
    const cancelBtn = document.getElementById('cancel-btn');
    const editCancelBtn = document.getElementById('edit-cancel-btn');
    const form = document.getElementById('form');
    const editForm = document.getElementById('edit-form');
    const generarBtn = document.getElementById('generar-clave-btn'); // Botón para regenerar la clave
    // Función para generar y mostrar una nueva clave en el campo (sin edición)
    async function asignarClaveGenerada() {
        const claveGenerada = await generarClaveUnica();
        document.getElementById('clave').value = claveGenerada;
    }

    // Evento para regenerar la clave al hacer clic en el botón de regeneración
    generarBtn.onclick = async () => {
        await asignarClaveGenerada(); // Generar y mostrar una nueva clave única
    };

    // Mostrar el modal para crear nueva clase
    document.getElementById('new-test-btn').onclick = async () => {
        await asignarClaveGenerada(); // Generar y mostrar una clave única al abrir el modal
        document.getElementById('clave').readOnly = true; // Campo de clave no editable
        modal.classList.add('show'); // Mostrar el modal
        form.reset(); // Limpiar el formulario
    };

    // Cerrar el modal de creación
    closeModal.onclick = () => {
        modal.classList.remove('show');
    };

    // Cerrar el modal de edición
    closeModalEdit.onclick = () => {
        modalEdit.classList.remove('show');
    };

    // Cancelar y cerrar el modal de creación
    cancelBtn.onclick = () => {
        modal.classList.remove('show');
        form.reset();
    };

    // Cancelar y cerrar el modal de edición
    editCancelBtn.onclick = () => {
        modalEdit.classList.remove('show');
        editForm.reset();
    };

    // Función para guardar los cambios en el modal de edición
    editSaveBtn.onclick = async () => {
        const nombreEditado = document.getElementById('edit-nombre').value;
        const grupoEditado = document.getElementById('edit-grupo').value;

        if (nombreEditado && grupoEditado) {
            try {
                // Referencia al documento en Firestore usando el ID almacenado en editingClave
                const claseRef = doc(db, "clases", editingClave);

                // Actualizar los datos en Firestore
                await updateDoc(claseRef, {
                    nombre: nombreEditado,
                    grupo: grupoEditado
                });

                // Actualizar la interfaz: buscar el elemento de la tarjeta correspondiente y actualizar su contenido
                const card = document.querySelector(`[data-id="${editingClave}"]`);
                if (card) {
                    card.querySelector('h3').textContent = nombreEditado;
                    card.querySelector('p:nth-child(3)').textContent = `Grupo: ${grupoEditado}`;
                }

                // Cerrar el modal de edición
                modalEdit.classList.remove('show');
                editForm.reset();

                console.log("Cambios guardados exitosamente en Firestore");
            } catch (error) {
                console.error("Error al guardar cambios: ", error);
                alert("Hubo un error al guardar los cambios.");
            }
        } else {
            alert('Por favor, completa todos los campos.');
        }
    };


    // Guardar la nueva clase
    saveBtn.onclick = async () => {
        const nombre = document.getElementById('nombre').value;
        const clave = document.getElementById('clave').value;
        const grupo = document.getElementById('grupo').value;

        if (nombre && clave && grupo) {
            try {
                await guardarClase(nombre, clave, grupo);
                modal.classList.remove('show'); // Cerrar el modal
                form.reset();
            } catch (error) {
                console.error("Error al guardar la clase: ", error);
            }
        } else {
            alert('Por favor, completa todos los campos.');
        }
    };

    // Regenerar la clave al hacer clic en el botón de regeneración
    generarBtn.onclick = async () => {
        await asignarClaveGenerada(); // Generar y mostrar una nueva clave única
    };

    // Cargar clases al cargar la página
    cargarClases();

    // Cerrar el modal si se hace clic fuera de él
    window.onclick = function (event) {
        if (event.target == modal) {
            modal.classList.remove('show');
        }
        if (event.target == modalEdit) {
            modalEdit.classList.remove('show');
        }
    };
});

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

