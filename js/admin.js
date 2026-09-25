import { supabase } from "./supabase.js";


// =====================================================
// VARIABLES
// =====================================================

let currentUser = null;

let participants = [];

let currentFilter = "all";


// =====================================================
// INICIO
// =====================================================

document.addEventListener(
    "DOMContentLoaded",
    init
);


async function init() {

    const {
        data: {
            session
        }
    } = await supabase.auth.getSession();


    if (session) {

        await verifyAdmin(
            session.user
        );

    } else {

        showLogin();

    }


    supabase.auth.onAuthStateChange(
        async (
            event,
            session
        ) => {

            if (
                event === "SIGNED_IN" &&
                session
            ) {

                await verifyAdmin(
                    session.user
                );

            }


            if (
                event === "SIGNED_OUT"
            ) {

                showLogin();

            }

        }
    );


    setupLogin();

    setupLogout();

    setupFilters();

    setupModal();

    setupCloseContest();

}


// =====================================================
// LOGIN
// =====================================================

function setupLogin() {

    const form =
        document.getElementById(
            "login-form"
        );


    form.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            const email =
                document
                    .getElementById(
                        "login-email"
                    )
                    .value
                    .trim();


            const password =
                document
                    .getElementById(
                        "login-password"
                    )
                    .value;


            const message =
                document
                    .getElementById(
                        "login-message"
                    );


            message.textContent =
                "Iniciando sesión...";


            const {
                data,
                error
            } = await supabase.auth.signInWithPassword({

                email,

                password

            });


            if (error) {

                message.textContent =
                    "Correo o contraseña incorrectos.";

                return;

            }


            await verifyAdmin(
                data.user
            );

        }
    );

}


// =====================================================
// VERIFICAR ADMIN
// =====================================================

async function verifyAdmin(
    user
) {

    const {
        data,
        error
    } = await supabase

        .from("admin_users")

        .select("user_id")

        .eq(
            "user_id",
            user.id
        )

        .maybeSingle();


    if (
        error ||
        !data
    ) {

        await supabase.auth.signOut();

        showLogin();

        showLoginMessage(
            "Esta cuenta no tiene permisos de administrador."
        );

        return;

    }


    currentUser = user;

    showAdminPanel();

    await loadDashboard();

}


// =====================================================
// PANEL
// =====================================================

function showAdminPanel() {

    document
        .getElementById(
            "login-screen"
        )
        .classList
        .add("hidden");


    document
        .getElementById(
            "admin-panel"
        )
        .classList
        .remove("hidden");


    document
        .getElementById(
            "admin-email"
        )
        .textContent =
            currentUser.email;

}


function showLogin() {

    document
        .getElementById(
            "login-screen"
        )
        .classList
        .remove("hidden");


    document
        .getElementById(
            "admin-panel"
        )
        .classList
        .add("hidden");

}


function showLoginMessage(
    message
) {

    document
        .getElementById(
            "login-message"
        )
        .textContent =
            message;

}


// =====================================================
// LOGOUT
// =====================================================

function setupLogout() {

    document
        .getElementById(
            "logout-button"
        )
        .addEventListener(
            "click",
            async () => {

                await supabase.auth.signOut();

            }
        );

}


// =====================================================
// DASHBOARD
// =====================================================

async function loadDashboard() {

    await loadContestSettings();

    await loadParticipants();

}


// =====================================================
// CONFIGURACIÓN
// =====================================================

async function loadContestSettings() {

    const {
        data,
        error
    } = await supabase

        .from("contest_settings")

        .select("*")

        .eq("id", 1)

        .single();


    if (error) {

        console.error(error);

        return;

    }


    document
        .getElementById(
            "contest-status"
        )
        .textContent =
            data.status === "active"
                ? "ACTIVO"
                : "CERRADO";


    document
        .getElementById(
            "contest-end"
        )
        .textContent =
            formatDate(
                data.end_date
            );


    document
        .getElementById(
            "contest-prize"
        )
        .textContent =
            formatDate(
                data.prize_date
            );


    const closeButton =
        document.getElementById(
            "close-contest-button"
        );


    if (
        data.status === "closed"
    ) {

        closeButton.disabled =
            true;

        closeButton.textContent =
            "CONCURSO CERRADO";

    }

}


// =====================================================
// PARTICIPANTES
// =====================================================

async function loadParticipants() {

    const {
        data,
        error
    } = await supabase

        .from("participants")

        .select("*")

        .order(
            "created_at",
            {
                ascending:
                    false
            }
        );


    if (error) {

        console.error(error);

        showToast(
            "No se pudieron cargar los participantes."
        );

        return;

    }


    participants =
        data || [];


    updateStats();

    renderTable();

}


// =====================================================
// ESTADÍSTICAS
// =====================================================

function updateStats() {

    const total =
        participants.length;


    const pending =
        participants.filter(
            p =>
                p.status ===
                "pending"
        ).length;


    const approved =
        participants.filter(
            p =>
                p.status ===
                "approved"
        ).length;


    const rejected =
        participants.filter(
            p =>
                p.status ===
                "rejected"
        ).length;


    setText(
        "total-count",
        total
    );


    setText(
        "pending-count",
        pending
    );


    setText(
        "approved-count",
        approved
    );


    setText(
        "rejected-count",
        rejected
    );

}


// =====================================================
// TABLA
// =====================================================

function renderTable() {

    const container =
        document.getElementById(
            "participants-table-container"
        );


    let filtered =
        participants;


    if (
        currentFilter !==
        "all"
    ) {

        filtered =
            participants.filter(
                participant =>
                    participant.status ===
                    currentFilter
            );

    }


    if (!filtered.length) {

        container.innerHTML = `

            <div class="loading">

                No hay participantes
                en esta categoría.

            </div>

        `;

        return;

    }


    container.innerHTML = `

        <table>

            <thead>

                <tr>

                    <th>
                        PARTICIPANTE
                    </th>

                    <th>
                        CIUDAD
                    </th>

                    <th>
                        TIKTOK
                    </th>

                    <th>
                        LIKES
                    </th>

                    <th>
                        ESTADO
                    </th>

                    <th>
                        ACCIONES
                    </th>

                </tr>

            </thead>


            <tbody>

                ${filtered
                    .map(
                        createTableRow
                    )
                    .join("")}

            </tbody>

        </table>

    `;


    setupTableActions();

}


// =====================================================
// FILA
// =====================================================

function createTableRow(
    participant
) {

    const username =
        escapeHTML(
            participant.tiktok_username
        );


    const statusText = {

        pending:
            "PENDIENTE",

        approved:
            "APROBADO",

        rejected:
            "RECHAZADO"

    }[participant.status];


    return `

        <tr>

            <td>

                <span class="username-cell">
                    @${username}
                </span>

            </td>


            <td>

                ${escapeHTML(
                    participant.city
                )}

            </td>


            <td>

                <a
                    href="${escapeAttribute(
                        participant.tiktok_url
                    )}"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    VER VÍDEO ↗
                </a>

            </td>


            <td>

                ❤️
                ${Number(
                    participant.likes
                ).toLocaleString("es-PE")}

            </td>


            <td>

                <span
                    class="status status-${participant.status}"
                >
                    ${statusText}
                </span>

            </td>


            <td>

                <div class="table-actions">

                    <button
                        class="action-button view-button"
                        data-action="view"
                        data-id="${participant.id}"
                    >
                        VER
                    </button>


                    ${
                        participant.status !==
                        "approved"

                        ? `

                            <button
                                class="action-button approve-button"
                                data-action="approve"
                                data-id="${participant.id}"
                            >
                                APROBAR
                            </button>

                        `

                        : ""
                    }


                    ${
                        participant.status !==
                        "rejected"

                        ? `

                            <button
                                class="action-button reject-button"
                                data-action="reject"
                                data-id="${participant.id}"
                            >
                                RECHAZAR
                            </button>

                        `

                        : ""
                    }


                    ${
                        participant.status ===
                        "approved"

                        ? `

                            <button
                                class="action-button likes-button"
                                data-action="likes"
                                data-id="${participant.id}"
                            >
                                ❤️ LIKES
                            </button>

                        `

                        : ""
                    }

                </div>

            </td>

        </tr>

    `;

}


// =====================================================
// ACCIONES
// =====================================================

function setupTableActions() {

    document
        .querySelectorAll(
            "[data-action]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    async () => {

                        const action =
                            button.dataset.action;

                        const id =
                            button.dataset.id;


                        if (
                            action ===
                            "view"
                        ) {

                            openParticipant(
                                id
                            );

                        }


                        if (
                            action ===
                            "approve"
                        ) {

                            await updateStatus(
                                id,
                                "approved"
                            );

                        }


                        if (
                            action ===
                            "reject"
                        ) {

                            await updateStatus(
                                id,
                                "rejected"
                            );

                        }


                        if (
                            action ===
                            "likes"
                        ) {

                            await updateLikes(
                                id
                            );

                        }

                    }
                );

            }
        );

}


// =====================================================
// CAMBIAR ESTADO
// =====================================================

async function updateStatus(
    id,
    status
) {

    const participant =
        participants.find(
            p =>
                p.id === id
        );


    if (!participant)
        return;


    const actionText =
        status === "approved"
            ? "aprobar"
            : "rechazar";


    if (
        !confirm(
            `¿Seguro que deseas ${actionText} a @${participant.tiktok_username}?`
        )
    ) {

        return;

    }


    const {
        error
    } = await supabase

        .from("participants")

        .update({
            status
        })

        .eq(
            "id",
            id
        );


    if (error) {

        console.error(error);

        showToast(
            "No se pudo actualizar."
        );

        return;

    }


    showToast(
        status === "approved"
            ? "Participante aprobado."
            : "Participante rechazado."
    );


    await loadParticipants();

}


// =====================================================
// ACTUALIZAR LIKES
// =====================================================

async function updateLikes(
    id
) {

    const participant =
        participants.find(
            p =>
                p.id === id
        );


    if (!participant)
        return;


    const value =
        prompt(
            `Likes actuales: ${participant.likes}\n\nIngresa el nuevo número de likes:`,
            participant.likes
        );


    if (
        value === null
    ) {

        return;

    }


    const likes =
        Number(
            value
        );


    if (
        !Number.isInteger(likes) ||
        likes < 0
    ) {

        alert(
            "Introduce un número válido de likes."
        );

        return;

    }


    const {
        error
    } = await supabase.rpc(
        "set_participant_likes",
        {
            p_participant_id:
                id,

            p_likes:
                likes
        }
    );


    if (error) {

        console.error(error);

        showToast(
            "No se pudieron actualizar los likes."
        );

        return;

    }


    showToast(
        "Likes actualizados correctamente."
    );


    await loadParticipants();

}


// =====================================================
// MODAL
// =====================================================

function setupModal() {

    document
        .getElementById(
            "close-modal"
        )
        .addEventListener(
            "click",
            closeModal
        );


    document
        .querySelector(
            ".modal-overlay"
        )
        .addEventListener(
            "click",
            closeModal
        );

}


function openParticipant(
    id
) {

    const participant =
        participants.find(
            p =>
                p.id === id
        );


    if (!participant)
        return;


    document
        .getElementById(
            "modal-username"
        )
        .textContent =
            "@" +
            participant.tiktok_username;


    document
        .getElementById(
            "modal-content"
        )
        .innerHTML = `

            <div class="detail">

                <strong>
                    NOMBRE COMPLETO
                </strong>

                ${escapeHTML(
                    participant.full_name
                )}

            </div>


            <div class="detail">

                <strong>
                    TIKTOK
                </strong>

                @${escapeHTML(
                    participant.tiktok_username
                )}

            </div>


            <div class="detail">

                <strong>
                    INSTAGRAM
                </strong>

                ${
                    participant.instagram_username
                    ?
                    escapeHTML(
                        participant.instagram_username
                    )
                    :
                    "No registrado"
                }

            </div>


            <div class="detail">

                <strong>
                    CIUDAD / ORIGEN
                </strong>

                ${escapeHTML(
                    participant.city
                )}

            </div>


            <div class="detail">

                <strong>
                    VÍDEO
                </strong>

                <a
                    href="${escapeAttribute(
                        participant.tiktok_url
                    )}"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    Abrir vídeo en TikTok ↗
                </a>

            </div>


            <div class="detail">

                <strong>
                    LIKES
                </strong>

                ❤️
                ${Number(
                    participant.likes
                ).toLocaleString("es-PE")}

            </div>


            <div class="detail">

                <strong>
                    FECHA DE INSCRIPCIÓN
                </strong>

                ${formatDateTime(
                    participant.created_at
                )}

            </div>

        `;


    document
        .getElementById(
            "participant-modal"
        )
        .classList
        .remove("hidden");

}


function closeModal() {

    document
        .getElementById(
            "participant-modal"
        )
        .classList
        .add("hidden");

}


// =====================================================
// FILTROS
// =====================================================

function setupFilters() {

    document
        .querySelectorAll(
            ".filter-button"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        document
                            .querySelectorAll(
                                ".filter-button"
                            )
                            .forEach(
                                b =>
                                    b.classList
                                        .remove(
                                            "active"
                                        )
                            );


                        button.classList.add(
                            "active"
                        );


                        currentFilter =
                            button.dataset.filter;


                        renderTable();

                    }
                );

            }
        );

}


// =====================================================
// CERRAR CONCURSO
// =====================================================

function setupCloseContest() {

    document
        .getElementById(
            "close-contest-button"
        )
        .addEventListener(
            "click",
            async () => {

                if (
                    !confirm(
                        "¿Seguro que deseas cerrar el concurso? Esta acción cambiará el estado a CERRADO."
                    )
                ) {

                    return;

                }


                const {
                    error
                } = await supabase

                    .from(
                        "contest_settings"
                    )

                    .update({
                        status:
                            "closed"
                    })

                    .eq(
                        "id",
                        1
                    );


                if (error) {

                    console.error(error);

                    showToast(
                        "No se pudo cerrar el concurso."
                    );

                    return;

                }


                showToast(
                    "Concurso cerrado."
                );


                await loadContestSettings();

            }
        );

}


// =====================================================
// UTILIDADES
// =====================================================

function setText(
    id,
    value
) {

    const element =
        document.getElementById(
            id
        );


    if (element) {

        element.textContent =
            value;

    }

}


function formatDate(
    value
) {

    return new Date(
        value
    ).toLocaleDateString(
        "es-PE",
        {
            day:
                "2-digit",

            month:
                "long",

            year:
                "numeric"
        }
    );

}


function formatDateTime(
    value
) {

    return new Date(
        value
    ).toLocaleString(
        "es-PE",
        {
            dateStyle:
                "short",

            timeStyle:
                "short"
        }
    );

}


function escapeHTML(
    value
) {

    return String(
        value ?? ""
    )
    .replace(
        /&/g,
        "&amp;"
    )
    .replace(
        /</g,
        "&lt;"
    )
    .replace(
        />/g,
        "&gt;"
    )
    .replace(
        /"/g,
        "&quot;"
    )
    .replace(
        /'/g,
        "&#039;"
    );

}


function escapeAttribute(
    value
) {

    return escapeHTML(
        value
    );

}


function showToast(
    message
) {

    const toast =
        document.getElementById(
            "toast"
        );


    toast.textContent =
        message;


    toast.classList.add(
        "show"
    );


    setTimeout(
        () => {

            toast.classList.remove(
                "show"
            );

        },
        3000
    );

}
