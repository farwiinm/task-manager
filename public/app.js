const API_BASE = "http://127.0.0.1:8000/api";

let currentPage = 1;
let showingTrashed = false;

function getToken() {
    return localStorage.getItem("token");
}

function authHeaders() {
    return {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: "Bearer " + getToken(),
    };
}

function showTasksSection() {
    document.getElementById("auth-section").style.display = "none";
    document.getElementById("tasks-section").style.display = "block";
}

function showAuthSection() {
    document.getElementById("auth-section").style.display = "block";
    document.getElementById("tasks-section").style.display = "none";
}

function showRegister() {
    document.getElementById("login-form").style.display = "none";
    document.getElementById("register-form").style.display = "block";
}

function showLogin() {
    document.getElementById("register-form").style.display = "none";
    document.getElementById("login-form").style.display = "block";
}

async function login() {
    const email = document.getElementById("login-email").value;
    const password = document.getElementById("login-password").value;
    const errorEl = document.getElementById("login-error");
    errorEl.textContent = "";

    try {
        const response = await fetch(API_BASE + "/login", {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (!response.ok) {
            errorEl.textContent = data.message || "Login failed";
            return;
        }

        localStorage.setItem("token", data.token);

        showTasksSection();
        loadTasks();
    } catch (error) {
        errorEl.textContent = "Could not connect to server";
    }
}

async function register() {
    const name = document.getElementById("reg-name").value;
    const email = document.getElementById("reg-email").value;
    const password = document.getElementById("reg-password").value;
    const confirm = document.getElementById("reg-confirm").value;
    const errorEl = document.getElementById("register-error");
    errorEl.textContent = "";

    try {
        const response = await fetch(API_BASE + "/register", {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                name,
                email,
                password,
                password_confirmation: confirm,
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            if (data.errors) {
                const firstError = Object.values(data.errors)[0][0];
                errorEl.textContent = firstError;
            } else {
                errorEl.textContent = data.message || "Registration failed";
            }
            return;
        }

        localStorage.setItem("token", data.token);
        showTasksSection();
        loadTasks();
    } catch (error) {
        errorEl.textContent = "Could not connect to server";
    }
}

async function logout() {
    try {
        await fetch(API_BASE + "/logout", {
            method: "POST",
            headers: authHeaders(),
        });
    } catch (error) {}

    localStorage.removeItem("token");
    showAuthSection();
}

async function loadTasks(page = 1) {
    currentPage = page;

    const status = document.getElementById("filter-status").value;
    const search = document.getElementById("search-input").value;

    let url = API_BASE + "/tasks?page=" + page;
    if (status) url += "&status=" + status;
    if (search) url += "&search=" + encodeURIComponent(search);

    try {
        const response = await fetch(url, {
            method: "GET",
            headers: authHeaders(),
        });

        if (response.status === 401) {
            localStorage.removeItem("token");
            showAuthSection();
            return;
        }

        const data = await response.json();
        renderTasks(data.data);
        renderPagination(data);
    } catch (error) {
        document.getElementById("task-list").innerHTML =
            "<p>Failed to load tasks</p>";
    }
}

async function createTask() {
    const title = document.getElementById("task-title").value;
    const description = document.getElementById("task-description").value;
    const status = document.getElementById("task-status").value;
    const due_date = document.getElementById("task-due-date").value;
    const errorEl = document.getElementById("create-error");
    errorEl.textContent = "";

    if (!title.trim()) {
        errorEl.textContent = "Title is required";
        return;
    }

    try {
        const response = await fetch(API_BASE + "/tasks", {
            method: "POST",
            headers: authHeaders(),
            body: JSON.stringify({
                title,
                description,
                status,
                due_date,
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            errorEl.textContent = data.message || "Failed to create task";
            return;
        }

        document.getElementById("task-title").value = "";
        document.getElementById("task-description").value = "";
        document.getElementById("task-status").value = "pending";
        document.getElementById("task-due-date").value = "";

        loadTasks(currentPage);
    } catch (error) {
        errorEl.textContent = "Could not connect to server";
    }
}

async function updateStatus(id, newStatus) {
    try {
        await fetch(API_BASE + "/tasks/" + id, {
            method: "PUT",
            headers: authHeaders(),
            body: JSON.stringify({ status: newStatus }),
        });

        loadTasks(currentPage);
    } catch (error) {
        alert("Failed to update task");
    }
}

async function deleteTask(id) {
    if (!confirm("Delete this task?")) return;

    try {
        await fetch(API_BASE + "/tasks/" + id, {
            method: "DELETE",
            headers: authHeaders(),
        });

        loadTasks(currentPage);
    } catch (error) {
        alert("Failed to delete task");
    }
}

async function loadTrashed() {
    try {
        const response = await fetch(API_BASE + "/tasks/trashed", {
            method: "GET",
            headers: authHeaders(),
        });

        const data = await response.json();
        renderTrashedTasks(data.data);
    } catch (error) {
        document.getElementById("trashed-list").innerHTML =
            "<p>Failed to load deleted tasks</p>";
    }
}

async function restoreTask(id) {
    try {
        await fetch(API_BASE + "/tasks/" + id + "/restore", {
            method: "POST",
            headers: authHeaders(),
        });

        loadTasks(currentPage);
        loadTrashed();
    } catch (error) {
        alert("Failed to restore task");
    }
}

function toggleTrashed() {
    showingTrashed = !showingTrashed;
    const trashedEl = document.getElementById("trashed-list");

    if (showingTrashed) {
        trashedEl.style.display = "block";
        loadTrashed();
    } else {
        trashedEl.style.display = "none";
    }
}

function renderTasks(tasks) {
    const container = document.getElementById("task-list");

    if (!tasks || tasks.length === 0) {
        container.innerHTML =
            '<p style="color:#999; margin-top:12px;">No tasks found.</p>';
        return;
    }

    container.innerHTML = tasks
        .map(
            (task) => `
          <div class="task-card">
              <h3>${escapeHtml(task.title)}</h3>
              <p>${task.description ? escapeHtml(task.description) : "<em>No description</em>"}</p>
              <p>Due: ${task.due_date ? task.due_date : "No due date"}</p>
              <span class="status-badge status-${task.status}">${task.status}</span>
              <div class="task-actions">
                  ${
                      task.status !== "completed"
                          ? `
                      <button class="btn-success" onclick="updateStatus(${task.id}, 'completed')">
                          Mark Complete
                      </button>
                  `
                          : ""
                  }
                  ${
                      task.status !== "in-progress"
                          ? `
                      <button class="btn-warning" onclick="updateStatus(${task.id}, 'in-progress')">
                          In Progress
                      </button>
                  `
                          : ""
                  }
                  <button class="btn-danger" onclick="deleteTask(${task.id})">Delete</button>
              </div>
          </div>
      `,
        )
        .join("");
}

function renderTrashedTasks(tasks) {
    const container = document.getElementById("trashed-list");

    if (!tasks || tasks.length === 0) {
        container.innerHTML = '<p style="color:#999;">No deleted tasks.</p>';
        return;
    }

    container.innerHTML =
        '<h3 style="margin-bottom:12px;">Deleted Tasks</h3>' +
        tasks
            .map(
                (task) => `
              <div class="task-card" style="border-color:#fca5a5; background:#fff5f5;">
                  <h3>${escapeHtml(task.title)}</h3>
                  <p style="color:#ef4444;">Deleted: ${new Date(task.deleted_at).toLocaleDateString()}</p>
                  <div class="task-actions">
                      <button class="btn-success" onclick="restoreTask(${task.id})">Restore</button>
                  </div>
              </div>
          `,
            )
            .join("");
}

function renderPagination(data) {
    const container = document.getElementById("pagination");

    if (data.last_page <= 1) {
        container.innerHTML = "";
        return;
    }

    let html = "";
    for (let i = 1; i <= data.last_page; i++) {
        html += `
              <button
                  class="${i === data.current_page ? "active" : ""}"
                  onclick="loadTasks(${i})"
              >${i}</button>
          `;
    }

    container.innerHTML = html;
}

function escapeHtml(str) {
    if (!str) return "";
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

(function init() {
    const token = getToken();

    if (token) {
        showTasksSection();
        loadTasks();
    } else {
        showAuthSection();
    }
})();
