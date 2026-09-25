import { supabase } from "./supabase.js";


// =====================================================
// CONFIGURACIÓN
// =====================================================

let contestSettings = null;
let participants = [];


// =====================================================
// INICIO
// =====================================================

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        await loadContest();

        await loadParticipants();

        setupRegistrationForm();

    }
);


// =====================================================
// CONFIGURACIÓN DEL CONCURSO
// =====================================================

async function loadContest() {

    const {
        data,
        error
    } = await supabase

        .from("contest_settings")

        .select("*")

        .eq("id", 1)

        .single();


    if (error) {

        console.error(
            "Error cargando configuración:",
            error
        );

        return;

    }


    contestSettings = data;


    startCountdown(
        contestSettings.end_date
    );

}


// =====================================================
// PARTICIPANTES
// =====================================================

async function loadParticipants() {

    const {
        data,
        error
    } = await supabase

        .from("public_participants")

        .select("*")

        .order(
            "likes",
            {
                ascending: false
            }
        );


    if (error) {

        console.error(
            "Error cargando participantes:",
            error
        );

        showParticipantsError();

        return;

    }


    participants = data || [];


    renderTopThree();

    renderParticipants();

    updateLastUpdate();

}


// =====================================================
// TOP 3
// =====================================================

function renderTopThree() {

    const container =
        document.getElementById(
            "top-three"
        );


    const top =
        participants.slice(0, 3);


    if (!top.length) {

        container.innerHTML = `

            <div class="empty-state">

                Todavía no hay participantes
                aprobados.

            </div>

        `;

        return;

    }


    container.innerHTML = "";


    top.forEach(
        (participant, index) => {

            container.innerHTML +=
                createTopCard(
                    participant,
                    index + 1
                );

        }
    );

}


// =====================================================
// TARJETA TOP
// =====================================================

function createTopCard(
    participant,
    position
) {

    const medal = {

        1: "🥇",

        2: "🥈",

        3: "🥉"

    }[position];


    return `

        <article class="top-card">

            <div class="position">

                ${medal} #${position}

            </div>


            <div class="tiktok-container">

                ${createTikTok(
                    participant
                )}

            </div>


            <div class="participant-content">

                <h3>
                    @${escapeHTML(
                        cleanUsername(
                            participant.tiktok_username
                        )
                    )}
                </h3>


                <p class="city">

                    📍 ${escapeHTML(
                        participant.city
                    )}

                </p>


                <div class="likes">

                    ❤️
                    ${formatNumber(
                        participant.likes
                    )}
                    likes

                </div>


                <a
                    href="${escapeAttribute(
                        participant.tiktok_url
                    )}"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="vote-button"
                >

                    VOTAR EN TIKTOK

                </a>

            </div>

        </article>

    `;

}


// =====================================================
// TODOS LOS PARTICIPANTES
// =====================================================

function renderParticipants() {

    const container =
        document.getElementById(
            "participants-grid"
        );


    if (!participants.length) {

        container.innerHTML = `

            <div class="empty-state">

                Todavía no hay participantes
                aprobados.

            </div>

        `;

        return;

    }


    container.innerHTML = "";


    participants.forEach(
        participant => {

            container.innerHTML +=
                createParticipantCard(
                    participant
                );

        }
    );

}


// =====================================================
// TARJETA PARTICIPANTE
// =====================================================

function createParticipantCard(
    participant
) {

    return `

        <article class="participant-card">


            <div class="tiktok-container">

                ${createTikTok(
                    participant
                )}

            </div>


            <div class="participant-content">

                <h3>

                    @${escapeHTML(
                        cleanUsername(
                            participant.tiktok_username
                        )
                    )}

                </h3>


                <p class="city">

                    📍 ${escapeHTML(
                        participant.city
                    )}

                </p>


                <div class="likes">

                    ❤️
                    ${formatNumber(
                        participant.likes
                    )}

                </div>


                <a
                    href="${escapeAttribute(
                        participant.tiktok_url
                    )}"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="vote-button"
                >

                    VOTAR

                </a>

            </div>

        </article>

    `;

}


// =====================================================
// TIKTOK
// =====================================================

function createTikTok(
    participant
) {

    if (
        participant.tiktok_video_id
    ) {

        return `

            <iframe

                src="https://www.tiktok.com/player/v1/${encodeURIComponent(
                    participant.tiktok_video_id
                )}?description=1&music_info=1"

                loading="lazy"

                allow="fullscreen"

                title="TikTok de @${escapeAttribute(
                    participant.tiktok_username
                )}"

            ></iframe>

        `;

    }


    if (
        participant.thumbnail_url
    ) {

        return `

            <a
                href="${escapeAttribute(
                    participant.tiktok_url
                )}"
                target="_blank"
                rel="noopener noreferrer"
                class="thumbnail-link"
            >

                <img
                    src="${escapeAttribute(
                        participant.thumbnail_url
                    )}"
                    alt="Vídeo de TikTok"
                    loading="lazy"
                >

                <span class="play-icon">
                    ▶
                </span>

            </a>

        `;

    }


    return `

        <a
            href="${escapeAttribute(
                participant.tiktok_url
            )}"
            target="_blank"
            rel="noopener noreferrer"
            class="thumbnail-fallback"
        >

            <span>
                ▶
            </span>

            <small>
                VER VÍDEO EN TIKTOK
            </small>

        </a>

    `;

}


// =====================================================
// FORMULARIO
// =====================================================

function setupRegistrationForm() {

    const form =
        document.getElementById(
            "registration-form"
        );


    if (!form) return;


    form.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            const message =
                document.getElementById(
                    "form-message"
                );


            const submitButton =
                form.querySelector(
                    "button[type='submit']"
                );


            submitButton.disabled = true;

            submitButton.textContent =
                "ENVIANDO...";


            const fullName =
                document
                    .getElementById(
                        "full_name"
                    )
                    .value
                    .trim();


            const tiktokUsername =
                document
                    .getElementById(
                        "tiktok_username"
                    )
                    .value
                    .trim();


            const instagram =
                document
                    .getElementById(
                        "instagram_username"
                    )
                    .value
                    .trim();


            const city =
                document
                    .getElementById(
                        "city"
                    )
                    .value
                    .trim();


            const tiktokUrl =
                document
                    .getElementById(
                        "tiktok_url"
                    )
                    .value
                    .trim();


            try {

                const videoId =
                    extractTikTokVideoId(
                        tiktokUrl
                    );


                const {
                    error
                } = await supabase

                    .from("participants")

                    .insert({

                        full_name:
                            fullName,

                        tiktok_username:
                            tiktokUsername,

                        instagram_username:
                            instagram || null,

                        city:
                            city,

                        tiktok_url:
                            tiktokUrl,

                        tiktok_video_id:
                            videoId,

                        status:
                            "pending",

                        likes:
                            0

                    });


                if (error) {

                    throw error;

                }


                message.className =
                    "form-message success";


                message.textContent =
                    "¡Participación enviada! Será revisada por la organización.";


                form.reset();


            } catch (error) {

                console.error(
                    error
                );


                message.className =
                    "form-message error";


                message.textContent =
                    "No se pudo enviar la participación. Revisa los datos e inténtalo nuevamente.";

            }


            submitButton.disabled = false;

            submitButton.textContent =
                "ENVIAR PARTICIPACIÓN";

        }
    );

}


// =====================================================
// EXTRAER ID DE TIKTOK
// =====================================================

function extractTikTokVideoId(
    url
) {

    const match =
        url.match(
            /\/video\/(\d+)/
        );


    if (
        match &&
        match[1]
    ) {

        return match[1];

    }


    return null;

}


// =====================================================
// COUNTDOWN
// =====================================================

function startCountdown(
    endDate
) {

    const target =
        new Date(
            endDate
        ).getTime();


    function update() {

        const now =
            Date.now();


        let difference =
            target - now;


        if (
            difference < 0
        ) {

            difference = 0;

        }


        const days =
            Math.floor(
                difference /
                (1000 * 60 * 60 * 24)
            );


        const hours =
            Math.floor(
                (difference %
                    (1000 * 60 * 60 * 24))
                /
                (1000 * 60 * 60)
            );


        const minutes =
            Math.floor(
                (difference %
                    (1000 * 60 * 60))
                /
                (1000 * 60)
            );


        const seconds =
            Math.floor(
                (difference %
                    (1000 * 60))
                /
                1000
            );


        setText(
            "days",
            pad(days)
        );


        setText(
            "hours",
            pad(hours)
        );


        setText(
            "minutes",
            pad(minutes)
        );


        setText(
            "seconds",
            pad(seconds)
        );

    }


    update();


    setInterval(
        update,
        1000
    );

}


// =====================================================
// ÚLTIMA ACTUALIZACIÓN
// =====================================================

function updateLastUpdate() {

    const now =
        new Date();


    const time =
        now.toLocaleTimeString(
            "es-PE",
            {
                hour:
                    "2-digit",

                minute:
                    "2-digit"
            }
        );


    const text =
        `Última actualización: ${time}`;


    setText(
        "last-update",
        text
    );


    setText(
        "footer-update",
        time
    );

}


// =====================================================
// UTILIDADES
// =====================================================

function cleanUsername(
    username
) {

    return username
        .replace(
            /^@/,
            ""
        );

}


function formatNumber(
    number
) {

    return Number(
        number || 0
    ).toLocaleString(
        "es-PE"
    );

}


function pad(
    number
) {

    return String(
        number
    ).padStart(
        2,
        "0"
    );

}


function setText(
    id,
    text
) {

    const element =
        document.getElementById(
            id
        );


    if (element) {

        element.textContent =
            text;

    }

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


function showParticipantsError() {

    document.getElementById(
        "top-three"
    ).innerHTML = `

        <div class="empty-state">

            No se pudieron cargar
            los participantes.

        </div>

    `;


    document.getElementById(
        "participants-grid"
    ).innerHTML = `

        <div class="empty-state">

            No se pudieron cargar
            los participantes.

        </div>

    `;

}
