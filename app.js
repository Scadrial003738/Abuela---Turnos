// ==========================================
// CONEXIÓN CON SUPABASE
// ==========================================

const SUPABASE_URL = "https://zbcmcidpsqyhyenjlbiw.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_fw8QeEIaX-cwWg30s0QJpg_Quti9IqZ";

const clienteSupabase =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );


// ==========================================
// SEMANA ACTUAL
// ==========================================

const hoy = new Date();

const diaSemana = hoy.getDay();

const diferencia =
    diaSemana === 0
        ? -6
        : 1 - diaSemana;

const lunesActual = new Date(hoy);

lunesActual.setHours(0, 0, 0, 0);

lunesActual.setDate(
    hoy.getDate() + diferencia
);


// ==========================================
// SEMANA MOSTRADA
// ==========================================

let desplazamientoSemana = 0;


// ==========================================
// MESES
// ==========================================

const meses = [
    "enero",
    "febrero",
    "marzo",
    "abril",
    "mayo",
    "junio",
    "julio",
    "agosto",
    "septiembre",
    "octubre",
    "noviembre",
    "diciembre"
];


// ==========================================
// IDENTIFICADOR DE SEMANA
// ==========================================

function obtenerIdentificadorSemana() {

    const lunes =
        new Date(lunesActual);

    lunes.setDate(
        lunesActual.getDate() +
        desplazamientoSemana * 7
    );

    const año =
        lunes.getFullYear();

    const mes =
        String(
            lunes.getMonth() + 1
        ).padStart(2, "0");

    const dia =
        String(
            lunes.getDate()
        ).padStart(2, "0");

    return `${año}-${mes}-${dia}`;
}


// ==========================================
// MOSTRAR SEMANA
// ==========================================

async function mostrarSemana() {

    const lunes =
        new Date(lunesActual);

    lunes.setDate(
        lunesActual.getDate() +
        desplazamientoSemana * 7
    );

    const domingo =
        new Date(lunes);

    domingo.setDate(
        lunes.getDate() + 6
    );


    let textoSemana;


    if (
        lunes.getMonth() ===
        domingo.getMonth()
    ) {

        textoSemana =
            `Semana del ${lunes.getDate()} al ${domingo.getDate()} de ${meses[domingo.getMonth()]}`;

    } else {

        textoSemana =
            `Semana del ${lunes.getDate()} de ${meses[lunes.getMonth()]} al ${domingo.getDate()} de ${meses[domingo.getMonth()]}`;

    }


    document.getElementById(
        "semana"
    ).textContent = textoSemana;


    await cargarTurnos();
}


// ==========================================
// SEMANA ANTERIOR
// ==========================================

function semanaAnterior() {

    desplazamientoSemana--;

    mostrarSemana();
}


// ==========================================
// SEMANA SIGUIENTE
// ==========================================

function semanaSiguiente() {

    desplazamientoSemana++;

    mostrarSemana();
}


// ==========================================
// CARGAR TURNOS
// ==========================================

async function cargarTurnos() {

    const semana =
        obtenerIdentificadorSemana();


    const resultado =
        await clienteSupabase
            .from("turnos")
            .select("*")
            .eq("semana", semana);


    if (resultado.error) {

        console.error(
            "Error cargando turnos:",
            resultado.error
        );

        return;
    }


    const turnosGuardados = {};


    resultado.data.forEach(
        turno => {

            turnosGuardados[
                turno.turno
            ] = turno;

        }
    );


    // ==========================================
    // CARGAR COLORES DE LAS PERSONAS
    // ==========================================

    const colores =
        await obtenerColores();


    const turnos =
        document.querySelectorAll(
            ".turno"
        );


    turnos.forEach(
        (turno, indice) => {

            const datos =
                turnosGuardados[indice];

            const span =
                turno.querySelector("span");


            // Limpiamos el color anterior

            turno.style.backgroundColor = "";

             const strong = turno.querySelector("strong");

           if (strong) {
        strong.style.color = "";
}

       span.style.color = "";

           if (!datos) {

    span.textContent = "Libre";

    // Restaurar el color original del texto
    span.style.color = "";

    return;
}


            let texto =
                datos.nombre;


            if (
                datos.hora_inicio &&
                datos.hora_fin
            ) {

                texto +=
                    ` (${datos.hora_inicio.slice(0, 5)} - ${datos.hora_fin.slice(0, 5)})`;

            }


            span.textContent =
                texto;


            // ==========================================
            // APLICAR COLOR DE LA PERSONA
            // ==========================================

            const color =
                colores[datos.nombre];


            if (color) {

                turno.style.backgroundColor =
                    color;
            }

        }
    );
}


// ==========================================
// OBTENER COLORES
// ==========================================

async function obtenerColores() {

    const resultado =
        await clienteSupabase
            .from("colores_personas")
            .select("nombre, color");


    if (resultado.error) {

        console.error(
            "Error cargando colores:",
            resultado.error
        );

        return {};
    }


    const colores = {};


    resultado.data.forEach(
        persona => {

            if (persona.color) {

                colores[persona.nombre] =
                    persona.color;

            }

        }
    );


    return colores;
}


// ==========================================
// SELECCIONAR TURNO
// ==========================================

async function seleccionarTurno(turno) {

    const usuario =
        localStorage.getItem(
            "usuarioActual"
        );


    if (!usuario) {

        alert(
            "Primero tienes que seleccionar quién eres."
        );

        return;
    }


    const todosLosTurnos =
        Array.from(
            document.querySelectorAll(
                ".turno"
            )
        );


    const indice =
        todosLosTurnos.indexOf(
            turno
        );


    const semana =
        obtenerIdentificadorSemana();


    const resultado =
        await clienteSupabase
            .from("turnos")
            .select("*")
            .eq("semana", semana)
            .eq("turno", indice)
            .maybeSingle();


    if (resultado.error) {

        console.error(
            "Error comprobando turno:",
            resultado.error
        );

        alert(
            "No se pudo comprobar el turno."
        );

        return;
    }


    const existente =
        resultado.data;


    // ==========================================
    // TURNO LIBRE
    // ==========================================

    if (!existente) {

        if (
            turno.classList.contains(
                "turno-horario"
            )
        ) {

            abrirVentanaHorario(
                semana,
                indice,
                usuario
            );

        } else {

            await asignarTurno(
                semana,
                indice,
                usuario
            );

        }

        return;
    }


    // ==========================================
    // ES TUYO → LIBERAR
    // ==========================================

    if (
        existente.nombre === usuario
    ) {

        await liberarTurno(
            existente.id
        );

        return;
    }


    // ==========================================
    // ES DE OTRA PERSONA
    // ==========================================

    if (
        turno.classList.contains(
            "turno-horario"
        )
    ) {

        abrirVentanaHorario(
            semana,
            indice,
            usuario,
            existente.id
        );

    } else {

        const confirmar =
            confirm(
                `Este turno pertenece a ${existente.nombre}.\n\n¿Quieres cambiarlo a ${usuario}?`
            );


        if (!confirmar) {

            return;
        }


        await cambiarTurno(
            existente.id,
            usuario
        );

    }
}


// ==========================================
// ABRIR VENTANA DE HORARIO
// ==========================================

function abrirVentanaHorario(
    semana,
    indice,
    usuario,
    idExistente = null
) {

    const anterior =
        document.getElementById(
            "ventanaTurno"
        );


    if (anterior) {

        anterior.remove();

    }


    const ventana =
        document.createElement("div");

    ventana.id =
        "ventanaTurno";


    ventana.innerHTML = `

        <div class="contenido-ventana">

            <h2>🕐 Elegir horario</h2>

            <label for="horaInicio">
                Desde
            </label>

            <select id="horaInicio">
                ${crearOpcionesHoras("16:00")}
            </select>


            <label for="horaFin">
                Hasta
            </label>

            <select id="horaFin">
                ${crearOpcionesHoras("18:00")}
            </select>


            <div class="botones-ventana">

                <button id="cancelarHorario">
                    Cancelar
                </button>

                <button id="guardarHorario">
                    Guardar
                </button>

            </div>

        </div>

    `;


    document.body.appendChild(
        ventana
    );


    document
        .getElementById(
            "cancelarHorario"
        )
        .onclick = function () {

            ventana.remove();

        };


    document
        .getElementById(
            "guardarHorario"
        )
        .onclick = async function () {

            const inicio =
                document.getElementById(
                    "horaInicio"
                ).value;

            const fin =
                document.getElementById(
                    "horaFin"
                ).value;


            if (inicio >= fin) {

                alert(
                    "La hora de fin debe ser posterior a la hora de inicio."
                );

                return;
            }


            ventana.remove();


            if (idExistente) {

                await cambiarTurnoConHorario(
                    idExistente,
                    usuario,
                    inicio,
                    fin
                );

            } else {

                await asignarTurnoConHorario(
                    semana,
                    indice,
                    usuario,
                    inicio,
                    fin
                );

            }

        };

}


// ==========================================
// CREAR HORAS
// ==========================================

function crearOpcionesHoras(
    horaSeleccionada
) {

    let opciones = "";


    for (
        let hora = 0;
        hora < 24;
        hora++
    ) {

        for (
            let minutos = 0;
            minutos < 60;
            minutos += 30
        ) {

            const horaTexto =
                String(hora)
                    .padStart(2, "0");

            const minutoTexto =
                String(minutos)
                    .padStart(2, "0");

            const valor =
                `${horaTexto}:${minutoTexto}`;


            const seleccionado =
                valor === horaSeleccionada
                    ? "selected"
                    : "";


            opciones +=
                `<option value="${valor}" ${seleccionado}>${valor}</option>`;

        }

    }


    return opciones;
}


// ==========================================
// ASIGNAR TURNO NORMAL
// ==========================================

async function asignarTurno(
    semana,
    indice,
    usuario
) {

    const resultado =
        await clienteSupabase
            .from("turnos")
            .insert({

                semana: semana,

                turno: indice,

                nombre: usuario,

                hora_inicio: null,

                hora_fin: null

            });


    if (resultado.error) {

        console.error(
            resultado.error
        );

        alert(
            "No se pudo guardar el turno."
        );

        return;
    }


    await cargarTurnos();
}


// ==========================================
// ASIGNAR TURNO CON HORARIO
// ==========================================

async function asignarTurnoConHorario(
    semana,
    indice,
    usuario,
    inicio,
    fin
) {

    const resultado =
        await clienteSupabase
            .from("turnos")
            .insert({

                semana: semana,

                turno: indice,

                nombre: usuario,

                hora_inicio: inicio,

                hora_fin: fin

            });


    if (resultado.error) {

        console.error(
            resultado.error
        );

        alert(
            "No se pudo guardar el horario."
        );

        return;
    }


    await cargarTurnos();
}


// ==========================================
// LIBERAR TURNO
// ==========================================

async function liberarTurno(id) {

    const resultado =
        await clienteSupabase
            .from("turnos")
            .delete()
            .eq("id", id);


    if (resultado.error) {

        console.error(
            resultado.error
        );

        alert(
            "No se pudo liberar el turno."
        );

        return;
    }


    await cargarTurnos();
}


// ==========================================
// CAMBIAR TURNO
// ==========================================

async function cambiarTurno(
    id,
    usuario
) {

    const resultado =
        await clienteSupabase
            .from("turnos")
            .update({

                nombre: usuario,

                hora_inicio: null,

                hora_fin: null

            })
            .eq("id", id);


    if (resultado.error) {

        console.error(
            resultado.error
        );

        alert(
            "No se pudo cambiar el turno."
        );

        return;
    }


    await cargarTurnos();
}


// ==========================================
// CAMBIAR TURNO CON HORARIO
// ==========================================

async function cambiarTurnoConHorario(
    id,
    usuario,
    inicio,
    fin
) {

    const resultado =
        await clienteSupabase
            .from("turnos")
            .update({

                nombre: usuario,

                hora_inicio: inicio,

                hora_fin: fin

            })
            .eq("id", id);


    if (resultado.error) {

        console.error(
            resultado.error
        );

        alert(
            "No se pudo modificar el horario."
        );

        return;
    }


    await cargarTurnos();
}


// ==========================================
// COMPROBAR COLOR DEL USUARIO
// ==========================================

async function comprobarColor() {

    const usuario =
        localStorage.getItem(
            "usuarioActual"
        );


    if (!usuario) {

        return;

    }


    const resultado =
        await clienteSupabase
            .from("colores_personas")
            .select("color")
            .eq("nombre", usuario)
            .maybeSingle();


    if (resultado.error) {

        console.error(
            "Error comprobando color:",
            resultado.error
        );

        return;
    }


    // Si no tiene color, mostramos la ventana

    if (
        !resultado.data ||
        !resultado.data.color
    ) {

        mostrarVentanaColor();

    }

}


// ==========================================
// MOSTRAR VENTANA DE COLOR
// ==========================================

function mostrarVentanaColor() {

    const ventana =
        document.getElementById(
            "ventanaColor"
        );


    if (!ventana) {

        console.error(
            "No existe #ventanaColor en index.html"
        );

        return;
    }


    ventana.classList.remove(
        "ventana-oculta"
    );


    cargarColoresOcupados();
}


// ==========================================
// CARGAR COLORES OCUPADOS
// ==========================================

async function cargarColoresOcupados() {

    const resultado =
        await clienteSupabase
            .from("colores_personas")
            .select("nombre, color");


    if (resultado.error) {

        console.error(
            "Error cargando colores:",
            resultado.error
        );

        return;
    }


    const usuario =
        localStorage.getItem(
            "usuarioActual"
        );


    const botones =
        document.querySelectorAll(
            ".color-opcion"
        );


    botones.forEach(
        boton => {

            const color =
                boton.dataset.color;


            // De momento todos están disponibles

            boton.disabled = false;

            boton.title =
                "Elegir este color";

            boton.style.opacity =
                "1";


            const persona =
                resultado.data.find(
                    p =>
                        p.color === color &&
                        p.nombre !== usuario
                );


            if (persona) {

                boton.disabled = true;

                boton.title =
                    `Color utilizado por ${persona.nombre}`;

                boton.style.opacity =
                    "0.3";

                boton.style.cursor =
                    "not-allowed";

            }

        }
    );
}


// ==========================================
// ELEGIR COLOR
// ==========================================

async function elegirColor(color) {

    const usuario =
        localStorage.getItem(
            "usuarioActual"
        );


    if (!usuario) {

        return;
    }


    // Comprobar que nadie lo está usando

    const resultado =
        await clienteSupabase
            .from("colores_personas")
            .select("nombre")
            .eq("color", color)
            .neq("nombre", usuario);


    if (resultado.error) {

        console.error(
            resultado.error
        );

        alert(
            "No se pudo comprobar el color."
        );

        return;
    }


    if (
        resultado.data.length > 0
    ) {

        alert(
            `Ese color ya lo está utilizando ${resultado.data[0].nombre}.`
        );

        return;
    }


    // Guardar color

    const actualizacion =
        await clienteSupabase
            .from("colores_personas")
            .update({
                color: color
            })
            .eq("nombre", usuario);


    if (actualizacion.error) {

        console.error(
            actualizacion.error
        );

        alert(
            "No se pudo guardar tu color."
        );

        return;
    }


    // Cerrar ventana

    const ventana =
        document.getElementById(
            "ventanaColor"
        );


    if (ventana) {

        ventana.classList.add(
            "ventana-oculta"
        );

    }


    // Recargar calendario

    await cargarTurnos();
}


// ==========================================
// ENTRAR
// ==========================================

async function entrar() {

    const selector =
        document.getElementById(
            "selectorUsuario"
        );


    const usuario =
        selector.value;

        const color =
    document.getElementById("selectorColor").value;


    if (!usuario) {

        alert(
            "Selecciona tu nombre antes de continuar."
        );

        return;
    }


    localStorage.setItem(
        "usuarioActual",
        usuario
    );

       await guardarColorUsuario(
        usuario,
        color
    );

    actualizarUsuarioMostrado();


    document.getElementById(
        "pantallaUsuario"
    ).style.display =
        "none";


    document.getElementById(
        "aplicacion"
    ).style.display =
        "block";


    await comprobarColor();

    await mostrarSemana();
}


// ==========================================
// COMPROBAR USUARIO
// ==========================================

async function comprobarUsuario() {

    const usuario =
        localStorage.getItem(
            "usuarioActual"
        );


    if (usuario) {

        document.getElementById(
            "pantallaUsuario"
        ).style.display =
            "none";


        document.getElementById(
            "aplicacion"
        ).style.display =
            "block";


        actualizarUsuarioMostrado();

        await comprobarColor();

    }

}


// ==========================================
// MOSTRAR USUARIO ACTUAL
// ==========================================

function actualizarUsuarioMostrado() {

    const usuario =
        localStorage.getItem(
            "usuarioActual"
        );


    const elemento =
        document.getElementById(
            "usuarioMostrado"
        );


    if (
        elemento &&
        usuario
    ) {

        elemento.textContent =
            usuario;

    }
}


// ==========================================
// CAMBIAR DE USUARIO
// ==========================================

function cambiarUsuario() {

    localStorage.removeItem(
        "usuarioActual"
    );


    document.getElementById(
        "aplicacion"
    ).style.display =
        "none";


    document.getElementById(
        "pantallaUsuario"
    ).style.display =
        "flex";


    document.getElementById(
        "selectorUsuario"
    ).value =
        "";
}

// ==========================================
// INICIAR
// ==========================================

comprobarUsuario();

mostrarSemana();

// ==========================================
// GUARDAR COLOR DEL USUARIO
// ==========================================

async function guardarColorUsuario(usuario, color) {

    console.log("Intentando guardar:", usuario, color);

    const resultado =
        await clienteSupabase
            .from("colores_personas")
            .update({
                color: color
            })
            .eq("nombre", usuario)
            .select();

    console.log("Resultado completo:", resultado);

    if (resultado.error) {

        console.error(
            "ERROR DE SUPABASE:",
            resultado.error
        );

        alert(
            "Error guardando color: " +
            resultado.error.message
        );

        return;
    }

    console.log(
        "Filas modificadas:",
        resultado.data
    );
}