function requireAdmin() {
    const role = (sessionStorage.getItem("role") || "").toUpperCase();
    if (role !== "ADMIN") {
        window.location.href = "/login.html";
        return false;
    }
    return true;
}

async function fetchUsers() {
    const res = await fetch("/api/admin/users", { headers: { ...buildAuthHeaders() } });
    if (!res.ok) {
        return [];
    }
    return await res.json();
}


async function fetchResources() {
    const res = await fetch("/api/clases", { headers: { ...buildAuthHeaders() } });
    if (!res.ok) return [];
    return await res.json();
}

async function renderUsers() {
    const tbody = document.querySelector("#users-table tbody");
    tbody.innerHTML = "";
    const users = await fetchUsers();
    const termInput = document.getElementById("user-search");
    const filterSel = document.getElementById("user-filter-role");
    const term = (termInput && termInput.value ? termInput.value : "").toLowerCase().trim();
    const filterVal = filterSel ? filterSel.value : "TODOS";
    const filtered = users.filter(u => {
        const email = (u.email || "").toLowerCase();
        const username = (u.username || "").toLowerCase();
        const matchTerm = !term || email.includes(term) || username.includes(term);
        const matchRole = filterVal === "TODOS" ||
            (filterVal === "USUARIOS" && String(u.role).toUpperCase() === "USER") ||
            (filterVal === "ADMINS" && String(u.role).toUpperCase() === "ADMIN");
        return matchTerm && matchRole;
    });
    filtered.forEach(u => {
        const tr = document.createElement("tr");
        tr.innerHTML = `<td>${u.id}</td><td>${u.username || ""}</td><td>${u.email}</td><td>${u.role}</td>
        <td class="actions-row">
            <button class="btn" data-action="edituser" data-id="${u.id}">Editar nombre</button>
            <button class="btn" data-action="changepw" data-id="${u.id}">Cambiar contraseña</button>
            <button class="btn" data-action="promote" data-id="${u.id}">Promover</button>
            <button class="btn" data-action="demote" data-id="${u.id}">Degradar</button>
            <button class="btn" data-action="delete" data-id="${u.id}">Eliminar</button>
        </td>`;
        tbody.appendChild(tr);
    });
}


async function createUser(e) {
    e.preventDefault();
    const username = document.getElementById("user-username").value;
    const email = document.getElementById("user-email").value;
    const password = document.getElementById("user-password").value;
    const role = document.getElementById("user-role").value;
    const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...buildAuthHeaders() },
        body: JSON.stringify({ username, email, password, role })
    });
    if (res.ok) {
        await renderUsers();
        e.target.reset();
    } else {
        alert("No se pudo crear el usuario");
    }
}

async function updateUserRole(id, role) {
    const res = await fetch(`/api/admin/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...buildAuthHeaders() },
        body: JSON.stringify({ role })
    });
    if (res.ok) {
        await renderUsers();
    } else {
        alert("No se pudo actualizar el rol");
    }
}

async function deleteUser(id) {
    const res = await fetch(`/api/admin/users/${id}`, {
        method: "DELETE",
        headers: { ...buildAuthHeaders() }
    });
    if (res.ok) {
        await renderUsers();
    } else {
        alert("No se pudo eliminar el usuario");
    }
}

async function updateUsername(id) {
    const backdrop = document.getElementById("edit-user-backdrop");
    const form = document.getElementById("edit-user-form");
    const cancelBtn = document.getElementById("edit-user-cancel");
    const closeArea = document.getElementById("edit-user-close-area");
    if (!backdrop || !form) return;
    const users = await fetchUsers();
    const user = users.find(u => String(u.id) === String(id));
    if (!user) {
        alert("Usuario no encontrado");
        return;
    }
    document.getElementById("edit-user-id").value = id;
    document.getElementById("edit-current-username").innerText = user.username || "";
    document.getElementById("edit-username").value = user.username || "";
    backdrop.classList.remove("hidden");
    async function onSubmit(e) {
        e.preventDefault();
        const username = document.getElementById("edit-username").value;
        const res = await fetch(`/api/admin/users/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json", ...buildAuthHeaders() },
            body: JSON.stringify({ username })
        });
        if (res.ok) {
            backdrop.classList.add("hidden");
            form.removeEventListener("submit", onSubmit);
            cancelBtn.removeEventListener("click", onCancel);
            backdrop.removeEventListener("click", onBackdrop);
            await renderUsers();
        } else {
            let msg = "No se pudo actualizar el usuario";
            try {
                const text = await res.text();
                if (text && text.length < 500) msg = text;
            } catch (_) {}
            alert(msg);
        }
    }
    function onCancel() {
        backdrop.classList.add("hidden");
        form.removeEventListener("submit", onSubmit);
        cancelBtn.removeEventListener("click", onCancel);
        backdrop.removeEventListener("click", onBackdrop);
    }
    function onBackdrop(e) {
        if (e.target === backdrop || e.target === closeArea) {
            onCancel();
        }
    }
    form.addEventListener("submit", onSubmit);
    cancelBtn.addEventListener("click", onCancel);
    backdrop.addEventListener("click", onBackdrop);
}


async function fetchInstructors() {
    const res = await fetch("/api/admin/instructors", { headers: { ...buildAuthHeaders() } });
    if (!res.ok) return [];
    return await res.json();
}

async function renderClasses() {
    const tbody = document.querySelector("#classes-table tbody");
    if (!tbody) return;
    tbody.innerHTML = "";
    const classes = await fetchResources();
    const bookings = await fetchBookings();
    const counts = {};
    bookings.forEach(b => {
        const rid = b?.resource?.id;
        if (rid != null && b.conInstructor) {
            const key = String(rid);
            counts[key] = (counts[key] || 0) + 1;
        }
    });
    classes.forEach(c => {
        const tr = document.createElement("tr");
        const instructor = c.instructorNombre || "Sin instructor";
        const hora = c.horaClase ? String(c.horaClase).substring(0,5) : "-";
        const capacidad = (c.capacidad != null ? c.capacidad : 0);
        const used = counts[String(c.id)] || 0;
        tr.innerHTML = `<td>${c.id}</td><td>${c.nombre}</td><td>${c.descripcion || ""}</td><td>${hora}</td><td class="capacity-cell" data-id="${c.id}" data-capacity="${capacidad}">${used}/${capacidad}</td><td>${instructor}</td>
        <td class="actions-row">
            <button class="btn" data-c-action="edit" data-id="${c.id}">Editar</button>
            <button class="btn" data-c-action="delete" data-id="${c.id}">Eliminar</button>
        </td>`;
        tbody.appendChild(tr);
    });
}

async function updateClassCapacityCounters() {
    const bookings = await fetchBookings();
    const counts = {};
    bookings.forEach(b => {
        const rid = b?.resource?.id;
        if (rid != null && b.conInstructor) {
            const key = String(rid);
            counts[key] = (counts[key] || 0) + 1;
        }
    });
    const cells = document.querySelectorAll(".capacity-cell");
    cells.forEach(cell => {
        const id = cell.getAttribute("data-id");
        const cap = Number(cell.getAttribute("data-capacity")) || 0;
        const used = counts[String(id)] || 0;
        cell.innerText = `${used}/${cap}`;
    });
}

async function fetchBookings() {
    const res = await fetch("/api/admin/bookings", { headers: { ...buildAuthHeaders() } });
    if (!res.ok) return [];
    return await res.json();
}

async function renderBookings() {
    const tbody = document.querySelector("#reservas-table tbody");
    if (!tbody) return;
    tbody.innerHTML = "";
    const bookings = await fetchBookings();
    bookings.forEach(b => {
        const tr = document.createElement("tr");
        const instr = b.conInstructor ? (b.instructorNombre || "Asignado") : "Sin instructor solicitado";
        tr.innerHTML = `<td>${b.id}</td><td>${b.user?.username || b.user?.email || b.user?.id}</td><td>${b.resource?.nombre || b.resource?.id}</td><td>${b.fechaReserva}</td><td>${instr}</td>
        <td class="actions-row">
            <button class="btn" data-b-action="delete" data-id="${b.id}">Eliminar</button>
        </td>`;
        tbody.appendChild(tr);
    });
}

async function createBookingAdmin(e) {
    e.preventDefault();
    const username = document.getElementById("b-username").value;
    const resourceId = document.getElementById("b-resource-id").value;
    const fecha = document.getElementById("b-fecha").value;
    const conInstSel = document.getElementById("b-con-instructor");
    const conInstructor = conInstSel && conInstSel.value === "si";
    if (!username || !resourceId || !fecha) {
        alert("Completa todos los campos");
        return;
    }
    try {
        const users = await fetchUsers();
        const u = users.find(x => String(x.username || "").toLowerCase() === String(username).toLowerCase());
        if (u && String(u.role).toUpperCase() === "ADMIN") {
            showMessageModal("No se puede crear una reserva para un administrador", 5000);
            return;
        }
    } catch (_) {}
    const res = await fetch("/api/admin/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...buildAuthHeaders() },
        body: JSON.stringify({
            username: username,
            resourceId: resourceId,
            fecha: fecha,
            conInstructor: conInstructor
        })
    });
    if (res.ok) {
        await renderBookings();
        await updateClassCapacityCounters();
        e.target.reset();
    } else {
        let msg = "No se pudo crear la reserva";
        let text = "";
        try { text = await res.text(); } catch (_) {}
        let parsedMsg = "";
        try {
            const j = JSON.parse(text);
            if (j && typeof j === "object" && j.message) parsedMsg = j.message;
        } catch (_) {}
        const finalMsg = parsedMsg || (text || "").trim();
        if (res.status === 404 || (finalMsg && finalMsg.includes("Usuario no registrado"))) {
            showMessageModal("Usuario no registrado en la base de datos", 5000);
        } else if (res.status === 400) {
            showMessageModal(finalMsg || "Solicitud inválida", 5000);
        } else {
            if (finalMsg && finalMsg.length < 500) msg = finalMsg;
            alert(msg);
        }
    }
}

async function changeUserPassword(id) {
    const backdrop = document.getElementById("change-pw-backdrop");
    const form = document.getElementById("change-pw-form");
    const cancelBtn = document.getElementById("change-pw-cancel");
    const closeArea = document.getElementById("change-pw-close-area");
    const toggleBtn = document.getElementById("toggle-change-pw");
    if (!backdrop || !form) return;
    const users = await fetchUsers();
    const user = users.find(u => String(u.id) === String(id));
    if (!user) {
        alert("Usuario no encontrado");
        return;
    }
    document.getElementById("change-pw-user-id").value = id;
    document.getElementById("change-pw-username").innerText = user.username || user.email || "";
    document.getElementById("change-pw-input").value = "";
    backdrop.classList.remove("hidden");
    function onToggle() {
        const inp = document.getElementById("change-pw-input");
        if (!inp) return;
        const isPass = inp.type === "password";
        inp.type = isPass ? "text" : "password";
        toggleBtn.innerHTML = isPass ? getEyeOpen() : getEyeClosed();
        toggleBtn.classList.toggle("active", isPass);
    }
    async function onSubmit(e) {
        e.preventDefault();
        const newpw = document.getElementById("change-pw-input").value;
        if (!newpw) {
            alert("Ingresa una nueva contraseña");
            return;
        }
        const res = await fetch(`/api/admin/users/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json", ...buildAuthHeaders() },
            body: JSON.stringify({ password: newpw })
        });
        if (res.ok) {
            backdrop.classList.add("hidden");
            cleanup();
        } else {
            let msg = "No se pudo cambiar la contraseña";
            try {
                const text = await res.text();
                if (text && text.length < 500) msg = text;
            } catch (_) {}
            alert(msg);
        }
    }
    function onCancel() {
        backdrop.classList.add("hidden");
        cleanup();
    }
    function onBackdrop(e) {
        if (e.target === backdrop || e.target === closeArea) {
            onCancel();
        }
    }
    function cleanup() {
        form.removeEventListener("submit", onSubmit);
        cancelBtn.removeEventListener("click", onCancel);
        backdrop.removeEventListener("click", onBackdrop);
        toggleBtn && toggleBtn.removeEventListener("click", onToggle);
    }
    form.addEventListener("submit", onSubmit);
    cancelBtn.addEventListener("click", onCancel);
    backdrop.addEventListener("click", onBackdrop);
    toggleBtn && toggleBtn.addEventListener("click", onToggle);
}
async function deleteBookingAdmin(id) {
    const res = await fetch(`/api/admin/bookings/${id}`, {
        method: "DELETE",
        headers: { ...buildAuthHeaders() }
    });
    if (res.ok) {
        await renderBookings();
        await updateClassCapacityCounters();
    } else {
        alert("No se pudo eliminar la reserva");
    }
}

function showMessageModal(text, timeoutMs = 5000) {
    const backdrop = document.getElementById("message-backdrop");
    const label = document.getElementById("message-text");
    if (!backdrop || !label) return;
    label.innerText = text || "";
    backdrop.classList.remove("hidden");
    setTimeout(() => {
        backdrop.classList.add("hidden");
    }, timeoutMs);
}
async function createClass(e) {
    e.preventDefault();
    const nombre = document.getElementById("c-nombre").value;
    const descripcion = document.getElementById("c-descripcion").value;
    const hora = document.getElementById("c-hora").value;
    const capacidad = document.getElementById("c-capacidad").value;
    const instructorNombre = document.getElementById("c-instructor-nombre").value;
    const res = await fetch("/api/clases", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...buildAuthHeaders() },
        body: JSON.stringify({ nombre, descripcion, instructorNombre, hora, capacidad })
    });
    if (res.ok) {
        await renderClasses();
        e.target.reset();
    } else {
        alert("No se pudo crear la clase");
    }
}

async function updateClass(id) {
    const backdrop = document.getElementById("edit-class-backdrop");
    const form = document.getElementById("edit-class-form");
    const cancelBtn = document.getElementById("edit-class-cancel");
    const closeArea = document.getElementById("edit-class-close-area");
    if (!backdrop || !form) return;
    const resources = await fetchResources();
    const cls = resources.find(r => String(r.id) === String(id));
    if (!cls) {
        alert("Clase no encontrada");
        return;
    }
    document.getElementById("edit-id").value = id;
    document.getElementById("edit-current-nombre").innerText = cls.nombre || "";
    document.getElementById("edit-current-descripcion").innerText = cls.descripcion || "";
    document.getElementById("edit-current-hora").innerText = cls.horaClase ? String(cls.horaClase).substring(0,5) : "-";
    document.getElementById("edit-current-capacidad").innerText = (cls.capacidad != null ? cls.capacidad : 0);
    document.getElementById("edit-current-instructor").innerText = cls.instructorNombre || "";
    document.getElementById("edit-nombre").value = cls.nombre || "";
    document.getElementById("edit-descripcion").value = cls.descripcion || "";
    document.getElementById("edit-hora").value = cls.horaClase ? String(cls.horaClase).substring(0,5) : "";
    document.getElementById("edit-capacidad").value = (cls.capacidad != null ? cls.capacidad : 0);
    document.getElementById("edit-instructor-nombre").value = cls.instructorNombre || "";
    backdrop.classList.remove("hidden");
    async function onSubmit(e) {
        e.preventDefault();
        const nombre = document.getElementById("edit-nombre").value;
        const descripcion = document.getElementById("edit-descripcion").value;
        const hora = document.getElementById("edit-hora").value;
        const capacidad = document.getElementById("edit-capacidad").value;
        const instructorNombre = document.getElementById("edit-instructor-nombre").value;
        const body = {};
        if (nombre) body.nombre = nombre;
        if (descripcion) body.descripcion = descripcion;
        body.instructorNombre = instructorNombre;
        body.hora = hora || "";
        if (capacidad !== null && capacidad !== "") body.capacidad = capacidad;
        const res = await fetch(`/api/clases/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json", ...buildAuthHeaders() },
            body: JSON.stringify(body)
        });
        if (res.ok) {
            backdrop.classList.add("hidden");
            form.removeEventListener("submit", onSubmit);
            cancelBtn.removeEventListener("click", onCancel);
            backdrop.removeEventListener("click", onBackdrop);
            await renderClasses();
        } else {
            let msg = "No se pudo actualizar la clase";
            try {
                const text = await res.text();
                if (text && text.length < 500) msg = text;
            } catch (_) {}
            alert(msg);
        }
    }
    function onCancel() {
        backdrop.classList.add("hidden");
        form.removeEventListener("submit", onSubmit);
        cancelBtn.removeEventListener("click", onCancel);
        backdrop.removeEventListener("click", onBackdrop);
    }
    function onBackdrop(e) {
        if (e.target === backdrop || e.target === closeArea) {
            onCancel();
        }
    }
    form.addEventListener("submit", onSubmit);
    cancelBtn.addEventListener("click", onCancel);
    backdrop.addEventListener("click", onBackdrop);
}

async function deleteClass(id) {
    const res = await fetch(`/api/clases/${id}`, {
        method: "DELETE",
        headers: { ...buildAuthHeaders() }
    });
    if (res.ok) {
        await renderClasses();
    } else {
        alert("No se pudo eliminar la clase");
    }
}
async function renderInstructors() {
    const tbody = document.querySelector("#instructors-table tbody");
    if (!tbody) return;
    tbody.innerHTML = "";
    const instructors = await fetchInstructors();
    instructors.forEach(i => {
        const tr = document.createElement("tr");
        tr.innerHTML = `<td>${i.id}</td><td>${i.nombreCompleto}</td><td>${i.edad}</td><td>${i.claseNombre}</td>
        <td class="actions-row">
            <button class="btn" data-i-action="edit" data-id="${i.id}">Editar</button>
            <button class="btn" data-i-action="delete" data-id="${i.id}">Eliminar</button>
        </td>`;
        tbody.appendChild(tr);
    });
}

async function createInstructor(e) {
    e.preventDefault();
    const nombreCompleto = document.getElementById("i-nombre").value;
    const edad = document.getElementById("i-edad").value;
    const select = document.getElementById("i-clase-select");
    const claseNombre = select && select.selectedIndex > 0 ? select.options[select.selectedIndex].text : "";
    const res = await fetch("/api/admin/instructors", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...buildAuthHeaders() },
        body: JSON.stringify({ nombreCompleto, edad, claseNombre })
    });
    if (res.ok) {
        await renderInstructors();
        e.target.reset();
    } else {
        alert("No se pudo crear el instructor");
    }
}

async function updateInstructor(id) {
    const nombreCompleto = prompt("Nuevo nombre completo:");
    const edad = prompt("Nueva edad:");
    const claseNombre = prompt("Nueva clase (nombre exacto):");
    const body = {};
    if (nombreCompleto) body.nombreCompleto = nombreCompleto;
    if (edad) body.edad = edad;
    if (claseNombre) body.claseNombre = claseNombre;
    const res = await fetch(`/api/admin/instructors/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...buildAuthHeaders() },
        body: JSON.stringify(body)
    });
    if (res.ok) {
        await renderInstructors();
    } else {
        alert("No se pudo actualizar el instructor");
    }
}

async function deleteInstructor(id) {
    const res = await fetch(`/api/admin/instructors/${id}`, {
        method: "DELETE",
        headers: { ...buildAuthHeaders() }
    });
    if (res.ok) {
        await renderInstructors();
    } else {
        alert("No se pudo eliminar el instructor");
    }
}

async function populateClassSelect() {
    const select = document.getElementById("i-clase-select");
    if (!select) return;
    const resources = await fetchResources();
    select.innerHTML = `<option value="">Selecciona una clase</option>`;
    resources.forEach(r => {
        const opt = document.createElement("option");
        opt.value = r.id;
        opt.text = r.nombre;
        select.appendChild(opt);
    });
}

// fin de tablas por clase (reemplazado por CRUD de clases)

document.addEventListener("DOMContentLoaded", async function () {
    restoreCredentials();
    if (!requireAdmin()) {
        return;
    }
    const side = document.querySelector(".side-nav");
    if (side) {
        side.addEventListener("click", function (e) {
            const link = e.target.closest(".side-link");
            if (!link) return;
            e.preventDefault();
            const target = link.getAttribute("data-target");
            document.querySelectorAll(".dash-section").forEach(s => s.classList.add("hidden"));
            const el = document.getElementById(target);
            if (el) el.classList.remove("hidden");
            document.querySelectorAll(".side-link").forEach(a => a.classList.remove("active"));
            link.classList.add("active");
        });
    }
    document.querySelectorAll(".dash-section").forEach(s => s.classList.add("hidden"));
    const first = document.getElementById("users-section");
    if (first) first.classList.remove("hidden");
    document.getElementById("user-form").addEventListener("submit", createUser);
    const termInput = document.getElementById("user-search");
    const filterSel = document.getElementById("user-filter-role");
    if (termInput) termInput.addEventListener("input", renderUsers);
    if (filterSel) filterSel.addEventListener("change", renderUsers);
    document.querySelector("#users-table").addEventListener("click", async function (e) {
        const id = e.target.getAttribute("data-id");
        if (!id) return;
        const action = e.target.getAttribute("data-action");
        if (action === "edituser") {
            await updateUsername(id);
        } else if (action === "changepw") {
            await changeUserPassword(id);
        } else if (action === "promote") {
            await updateUserRole(id, "ADMIN");
        } else if (action === "demote") {
            await updateUserRole(id, "USER");
        } else if (action === "delete") {
            await deleteUser(id);
        }
    });
    const instructorForm = document.getElementById("instructor-form");
    if (instructorForm) {
        instructorForm.addEventListener("submit", createInstructor);
    }
    await populateClassSelect();
    const instructorsTable = document.getElementById("instructors-table");
    if (instructorsTable) {
        instructorsTable.addEventListener("click", async function (e) {
            const id = e.target.getAttribute("data-id");
            if (!id) return;
            const action = e.target.getAttribute("data-i-action");
            if (action === "edit") {
                await updateInstructor(id);
            } else if (action === "delete") {
                await deleteInstructor(id);
            }
        });
    }
    const classForm = document.getElementById("class-form");
    if (classForm) {
        classForm.addEventListener("submit", createClass);
    }
    const classesTable = document.getElementById("classes-table");
    if (classesTable) {
        classesTable.addEventListener("click", async function (e) {
            const id = e.target.getAttribute("data-id");
            if (!id) return;
            const action = e.target.getAttribute("data-c-action");
            if (action === "edit") {
                await updateClass(id);
            } else if (action === "delete") {
                await deleteClass(id);
            }
        });
    }
    const reservaForm = document.getElementById("reserva-form-admin");
    if (reservaForm) reservaForm.addEventListener("submit", createBookingAdmin);
    const reservasTable = document.getElementById("reservas-table");
    if (reservasTable) {
        reservasTable.addEventListener("click", async function (e) {
            const id = e.target.getAttribute("data-id");
            if (!id) return;
            const action = e.target.getAttribute("data-b-action");
            if (action === "delete") {
                await deleteBookingAdmin(id);
            }
        });
    }
    await renderUsers();
    await renderInstructors();
    await renderClasses();
    await renderBookings();
    attachLogoutHandler();
    const profileBtn = document.getElementById("admin-profile-btn");
    if (profileBtn) {
        profileBtn.addEventListener("click", async function (e) {
            e.preventDefault();
            await openAdminProfileModal();
        });
    }
    const toggleAdminPass = document.getElementById("toggle-admin-user-password");
    if (toggleAdminPass) {
        toggleAdminPass.addEventListener("click", function () {
            const inp = document.getElementById("user-password");
            if (!inp) return;
            const isPass = inp.type === "password";
            inp.type = isPass ? "text" : "password";
            toggleAdminPass.innerHTML = isPass ? getEyeOpen() : getEyeClosed();
            toggleAdminPass.classList.toggle("active", isPass);
        });
    }
    setInterval(updateClassCapacityCounters, 3000);
});

async function openAdminProfileModal() {
    const backdrop = document.getElementById("admin-profile-backdrop");
    const content = document.getElementById("admin-profile-content");
    const closeBtn = document.getElementById("admin-profile-close");
    if (!backdrop) return;
    backdrop.classList.remove("hidden");
    try {
        const res = await fetch("/api/me", { headers: { ...buildAuthHeaders() } });
        if (res.ok) {
            const me = await res.json();
            const username = me.username || "";
            const email = me.email || "";
            const role = me.role || "";
            const masked = me.passwordMasked || "********";
            if (content) {
                content.innerHTML = `<div><strong>Nombre de usuario:</strong> ${username}</div>
                <div><strong>Correo electrónico:</strong> ${email}</div>
                <div><strong>Contraseña:</strong> ${masked}</div>
                <div><strong>Rol:</strong> ${role}</div>`;
            }
        }
    } catch (_) {}
    function close() {
        backdrop.classList.add("hidden");
        closeBtn && closeBtn.removeEventListener("click", close);
        backdrop.removeEventListener("click", onBackdrop);
    }
    function onBackdrop(e) {
        if (e.target === backdrop) {
            close();
        }
    }
    closeBtn && closeBtn.addEventListener("click", close);
    backdrop.addEventListener("click", onBackdrop);
}
