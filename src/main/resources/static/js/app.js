const state = {
    email: null,
    password: null,
    calendar: null,
    selectedDate: null,
    resourceId: 1,
    resources: []
};

function restoreCredentials() {
    try {
        const e = sessionStorage.getItem("email");
        const p = sessionStorage.getItem("password");
        if (e && p) {
            state.email = e;
            state.password = p;
        }
    } catch (_) {}
}

function buildAuthHeaders() {
    if (!state.email || !state.password) {
        return {};
    }
    const token = btoa(state.email + ":" + state.password);
    return { Authorization: "Basic " + token };
}

async function loadBookings() {
    if (!state.calendar) {
        return;
    }
    try {
        const response = await fetch("/api/bookings/me", {
            method: "GET",
            headers: {
                ...buildAuthHeaders()
            }
        });
        if (!response.ok) {
            alert("No se pudieron cargar las reservas");
            return;
        }
        const data = await response.json();
        const events = data.map(function (b) {
            const start = b.fechaReserva ? (b.fechaReserva + "T09:00:00") : null;
            const end = b.fechaReserva ? (b.fechaReserva + "T10:00:00") : null;
            return { id: b.id, title: "Reserva", start, end };
        });
        state.calendar.removeAllEvents();
        state.calendar.addEventSource(events);
    } catch (e) {
        alert("Error de red al obtener reservas");
    }
}

async function loadResources() {
    try {
        const resp = await fetch("/api/clases", { method: "GET", headers: { ...buildAuthHeaders() } });
        if (resp.ok) {
            const resources = await resp.json();
            state.resources = Array.isArray(resources) ? resources : [];
            if (state.resources.length > 0) {
                state.resourceId = state.resources[0].id;
            }
            renderClassCards();
        }
    } catch (_) {
        // sin bloqueo si falla
    }
}

function mapClassToResourceId(classKey) {
    const match = state.resources.find(r => {
        const n = (r.nombre || "").toLowerCase();
        return n.includes(classKey);
    });
    return match ? match.id : (state.resources[0]?.id || state.resourceId);
}

function showModal(date) {
    const backdrop = document.getElementById("modal-backdrop");
    const dateInput = document.getElementById("booking-date");
    state.selectedDate = date;
    const d = date instanceof Date ? date : new Date();
    const onlyDate = d.toISOString().split("T")[0];
    dateInput.value = onlyDate;
    backdrop.classList.remove("hidden");
}

function hideModal() {
    const backdrop = document.getElementById("modal-backdrop");
    backdrop.classList.add("hidden");
}

function showPanelMessage(text, timeoutMs = 5000) {
    const backdrop = document.getElementById("panel-message-backdrop");
    const label = document.getElementById("panel-message-text");
    if (!backdrop || !label) return;
    label.innerText = text || "";
    backdrop.classList.remove("hidden");
    setTimeout(() => {
        backdrop.classList.add("hidden");
    }, timeoutMs);
}
function renderClassCards() {
    const container = document.getElementById("class-cards");
    if (!container) return;
    if (!Array.isArray(state.resources) || state.resources.length === 0) {
        container.innerHTML = "<p>No hay clases disponibles.</p>";
        return;
    }
    const html = state.resources.map(r => {
        const desc = r.descripcion ? r.descripcion : "";
        const hora = r.horaClase ? String(r.horaClase).substring(0,5) : null;
        const capacidad = (r.capacidad != null ? r.capacidad : "-");
        return `<div class="card">
            <h3>${r.nombre}</h3>
            <p>${desc}</p>
            ${hora ? `<div class="hint">Hora: ${hora}</div>` : `<div class="hint">Hora no definida</div>`}
            <div class="hint">Capacidad: ${capacidad}</div>
            <button class="btn primary reserve-btn" data-resource-id="${r.id}" ${hora ? "" : "disabled"}>${hora ? "Reservar" : "No disponible"}</button>
        </div>`;
    }).join("");
    container.innerHTML = html;
}

async function openMyProfileModal() {
    const backdrop = document.getElementById("my-profile-backdrop");
    const form = document.getElementById("my-profile-form");
    const cancelBtn = document.getElementById("my-profile-cancel");
    const userEl = document.getElementById("my-username");
    const emailEl = document.getElementById("my-email");
    const passEl = document.getElementById("my-password");
    const roleEl = document.getElementById("my-role");
    if (!backdrop) return;
    backdrop.classList.remove("hidden");
    try {
        const res = await fetch("/api/me", { headers: { ...buildAuthHeaders() } });
        if (res.ok) {
            const me = await res.json();
            userEl && (userEl.value = me.username || "");
            emailEl && (emailEl.value = me.email || "");
            roleEl && (roleEl.value = me.role || "");
            if (passEl) passEl.value = "";
        }
    } catch (_) {}
    function close() {
        backdrop.classList.add("hidden");
        form && form.removeEventListener("submit", onSubmit);
        cancelBtn && cancelBtn.removeEventListener("click", close);
        backdrop.removeEventListener("click", onBackdrop);
    }
    async function onSubmit(e) {
        e.preventDefault();
        const body = {
            username: userEl ? userEl.value : "",
            email: emailEl ? emailEl.value : "",
            password: passEl ? passEl.value : ""
        };
        try {
            const res = await fetch("/api/me", {
                method: "PUT",
                headers: { "Content-Type": "application/json", ...buildAuthHeaders() },
                body: JSON.stringify(body)
            });
            if (res.ok) {
                const updated = await res.json();
                try {
                    if (updated.email) sessionStorage.setItem("email", updated.email);
                    if (passEl && passEl.value) sessionStorage.setItem("password", passEl.value);
                } catch (_) {}
                showPanelMessage("Perfil actualizado", 3000);
                close();
            } else {
                let text = "";
                try { text = await res.text(); } catch (_) {}
                alert(text || "No se pudo actualizar el perfil");
            }
        } catch (_) {
            alert("Error de red al actualizar perfil");
        }
    }
    function onBackdrop(e) {
        if (e.target === backdrop) {
            close();
        }
    }
    form && form.addEventListener("submit", onSubmit);
    cancelBtn && cancelBtn.addEventListener("click", close);
    backdrop.addEventListener("click", onBackdrop);
}

function attachAuthFormHandlers() {
    const form = document.getElementById("login-form");
    if (!form) {
        return;
    }
    form.addEventListener("submit", async function (event) {
        event.preventDefault();
        const emailInput = document.getElementById("email");
        const passwordInput = document.getElementById("password");
        state.email = emailInput.value;
        state.password = passwordInput.value;
        try {
            const response = await fetch("/api/auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email: state.email,
                    password: state.password
                })
            });
            if (!response.ok) {
                alert("Credenciales inválidas");
                return;
            }
            const result = await response.json();
            if (!result.authenticated) {
                alert("No se pudo iniciar sesión");
                return;
            }
            try {
                sessionStorage.setItem("email", state.email);
                sessionStorage.setItem("password", state.password);
                if (result.role) {
                    sessionStorage.setItem("role", result.role);
                }
            } catch (_) {}
            const role = (result.role || "USER").toUpperCase();
            if (role === "ADMIN") {
                window.location.href = "/admin.html";
            } else {
                window.location.href = "/panel.html";
            }
        } catch (e) {
            alert("Error de red al iniciar sesión");
        }
    });
}

async function registerUser(email, password) {
    const body = {
        username: document.getElementById("reg-username")?.value || "",
        email: email,
        password: password,
        role: "USER"
    };
    const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
    });
    return response;
}

function attachRegisterFormHandlers() {
    const form = document.getElementById("register-form");
    if (!form) {
        return;
    }
    form.addEventListener("submit", async function (event) {
        event.preventDefault();
        const emailInput = document.getElementById("reg-email");
        const usernameInput = document.getElementById("reg-username");
        const passwordInput = document.getElementById("reg-password");
        const email = emailInput.value;
        const username = usernameInput ? usernameInput.value : "";
        const password = passwordInput.value;
        if (!email || !password) {
            alert("Completa email y contraseña");
            return;
        }
        try {
            const body = { email, password, role: "USER", username };
            const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            });
            if (!res.ok) {
                let text = "";
                try { text = await res.text(); } catch (_) {}
                alert(text || "No se pudo crear la cuenta");
                return;
            }
            showPanelMessage("Registro exitoso, puedes iniciar sesion", 3000);
            setTimeout(() => {
                window.location.href = "/login.html";
            }, 3000);
        } catch (e) {
            alert("Error de red al registrar");
        }
    });
}

function attachModalHandlers() {
    const bookingForm = document.getElementById("booking-form");
    const cancelButton = document.getElementById("booking-cancel");
    const backdrop = document.getElementById("modal-backdrop");
    const closeArea = document.getElementById("modal-close-area");
    if (!bookingForm) {
        return;
    }
    bookingForm.addEventListener("submit", async function (event) {
        event.preventDefault();
        const dateInput = document.getElementById("booking-date");
        const instrSelect = document.getElementById("booking-instructor");
        const fecha = dateInput.value;
        const conInstructor = instrSelect && instrSelect.value === "si";
        if (!fecha) {
            alert("Selecciona una fecha");
            return;
        }
        try {
            const res = await fetch("/api/bookings", {
                method: "POST",
                headers: { "Content-Type": "application/json", ...buildAuthHeaders() },
                body: JSON.stringify({ resourceId: state.resourceId, fecha, conInstructor })
            });
            if (res.ok) {
                hideModal();
                showPanelMessage("Reserva exitosa", 5000);
                await renderMyBookings("my-bookings-list");
            } else {
                let text = "";
                try { text = await res.text(); } catch (_) {}
                alert(text || "No se pudo crear la reserva");
            }
        } catch (_) {
            alert("Error de red al crear reserva");
        }
    });
    cancelButton.addEventListener("click", function () {
        hideModal();
    });
    backdrop.addEventListener("click", function (event) {
        if (event.target === backdrop || event.target === closeArea) {
            hideModal();
        }
    });
}

function initClassCards() {
    const container = document.getElementById("class-cards");
    if (!container) return;
    container.addEventListener("click", function (e) {
        const btn = e.target.closest(".reserve-btn");
        if (!btn) return;
        const rid = btn.getAttribute("data-resource-id");
        if (rid) {
            state.resourceId = parseInt(rid, 10);
        }
        const resource = state.resources.find(r => String(r.id) === String(state.resourceId));
        if (!resource || !resource.horaClase) {
            alert("La clase no tiene una hora definida");
            return;
        }
        if (!state.email || !state.password) {
            alert("Inicia sesión antes de crear una reserva");
            return;
        }
        showModal(new Date());
    });
}

async function renderMyBookings(targetId) {
    const list = document.getElementById(targetId || "my-bookings");
    if (!list) return;
    try {
        const response = await fetch("/api/bookings/me", {
            method: "GET",
            headers: {
                ...buildAuthHeaders()
            }
        });
        if (!response.ok) {
            list.innerHTML = "<p>No se pudieron cargar tus reservas</p>";
            return;
        }
        const data = await response.json();
        if (!Array.isArray(data) || data.length === 0) {
            list.innerHTML = "<p>No tienes reservas aún.</p>";
            return;
        }
        const items = data.map(b => {
            const nombre = b.resource?.nombre || "Clase";
            const fecha = b.fechaReserva;
            const instructor = b.conInstructor ? `<div class="hint">Instructor: ${b.instructorNombre || "Asignado"}</div>` : "";
            return `<div class="panel" style="margin-bottom:0.75rem"><strong>${nombre}</strong><div>Fecha: ${fecha}</div>${instructor}</div>`;
        }).join("");
        list.innerHTML = items;
    } catch (_) {
        list.innerHTML = "<p>Error de red</p>";
    }
}

async function openMyBookingsModal() {
    const backdrop = document.getElementById("my-bookings-backdrop");
    const closeBtn = document.getElementById("my-bookings-close");
    backdrop.classList.remove("hidden");
    await renderMyBookings("my-bookings-list");
    function close() {
        backdrop.classList.add("hidden");
        closeBtn.removeEventListener("click", close);
        backdrop.removeEventListener("click", onBackdrop);
    }
    function onBackdrop(e) {
        if (e.target === backdrop) {
            close();
        }
    }
    closeBtn.addEventListener("click", close);
    backdrop.addEventListener("click", onBackdrop);
}

function logout() {
    try {
        sessionStorage.removeItem("email");
        sessionStorage.removeItem("password");
    } catch (_) {}
    state.email = null;
    state.password = null;
    window.location.href = "/";
}

function attachLogoutHandler() {
    const btn = document.getElementById("logout-btn");
    if (!btn) {
        return;
    }
    btn.addEventListener("click", function (e) {
        e.preventDefault();
        logout();
    });
}

function attachMyBookingsButton() {
    const btn = document.getElementById("my-bookings-btn");
    if (!btn) return;
    btn.addEventListener("click", async function (e) {
        e.preventDefault();
        await openMyBookingsModal();
    });
}

function attachMyProfileButton() {
    const btn = document.getElementById("my-profile-btn");
    if (!btn) return;
    btn.addEventListener("click", async function (e) {
        e.preventDefault();
        await openMyProfileModal();
    });
}
async function verifySession() {
    try {
        const resp = await fetch("/api/bookings/me", {
            method: "GET",
            headers: {
                ...buildAuthHeaders()
            }
        });
        if (resp.status === 401 || resp.status === 403) {
            return false;
        }
        return true;
    } catch (_) {
        return false;
    }
}

async function requireAuthOnPanel() {
    const isPanel = window.location.pathname.endsWith("/panel.html");
    if (!isPanel) {
        return;
    }
    if (!state.email || !state.password) {
        window.location.href = "/login.html";
        return;
    }
    const ok = await verifySession();
    if (!ok) {
        window.location.href = "/login.html";
        return;
    }
    await loadBookings();
}

function updateUserAvatar() {
    const email = sessionStorage.getItem("email");
    const initial = email ? email.charAt(0).toUpperCase() : "U";
    
    const userAvatar = document.getElementById("user-avatar-initial");
    if (userAvatar) {
        userAvatar.textContent = initial;
    }
    
    const adminAvatar = document.getElementById("admin-avatar-initial");
    if (adminAvatar) {
        adminAvatar.textContent = initial;
    }
}

document.addEventListener("DOMContentLoaded", function () {
    restoreCredentials();
    updateUserAvatar();
    loadResources().then(() => {
        renderClassCards();
        initClassCards();
        renderMyBookings();
    });
    attachAuthFormHandlers();
    attachRegisterFormHandlers();
    attachModalHandlers();
    attachLogoutHandler();
    attachMyBookingsButton();
    attachMyProfileButton();
    requireAuthOnPanel();
    const toggleReg = document.getElementById("toggle-reg-password");
    if (toggleReg) {
        toggleReg.addEventListener("click", function () {
            const inp = document.getElementById("reg-password");
            if (!inp) return;
            const isPass = inp.type === "password";
            inp.type = isPass ? "text" : "password";
            toggleReg.innerHTML = isPass ? getEyeOpen() : getEyeClosed();
            toggleReg.classList.toggle("active", isPass);
        });
    }
    const toggleLogin = document.getElementById("toggle-login-password");
    if (toggleLogin) {
        toggleLogin.addEventListener("click", function () {
            const inp = document.getElementById("password");
            if (!inp) return;
            const isPass = inp.type === "password";
            inp.type = isPass ? "text" : "password";
            toggleLogin.innerHTML = isPass ? getEyeOpen() : getEyeClosed();
            toggleLogin.classList.toggle("active", isPass);
        });
    }
});

function getEyeOpen() {
    return '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M12 5c-7 0-10 7-10 7s3 7 10 7 10-7 10-7-3-7-10-7zm0 12a5 5 0 110-10 5 5 0 010 10z"></path></svg>';
}
function getEyeClosed() {
    return '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M2 12s3 7 10 7c2.3 0 4.2-.7 5.7-1.7L5.7 4.3C3.7 5.8 2 8.6 2 12zm20 0s-3-7-10-7c-.9 0-1.8.1-2.6.3l10.3 10.3c1-1.3 2.3-3.4 2.3-3.6z"></path><path d="M3 3l18 18" stroke="currentColor" stroke-width="2"></path></svg>';
}
