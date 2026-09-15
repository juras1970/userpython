const API_URL = "/api/users";

const form = document.getElementById("userForm");
const userIdInput = document.getElementById("userId");
const nameInput = document.getElementById("nameInput");
const emailInput = document.getElementById("emailInput");
const submitBtn = document.getElementById("submitBtn");
const cancelBtn = document.getElementById("cancelBtn");
const formLabel = document.getElementById("formLabel");
const alertBox = document.getElementById("alertBox");
const tableWrapper = document.getElementById("tableWrapper");
const emptyState = document.getElementById("emptyState");
const usersTableBody = document.getElementById("usersTableBody");
const totalCount = document.getElementById("totalCount");

function showAlert(message) {
  alertBox.textContent = message;
  alertBox.classList.remove("hidden");
  setTimeout(() => alertBox.classList.add("hidden"), 4000);
}

function formatDate(isoString) {
  if (!isoString) return "—";
  const date = new Date(isoString.replace(" ", "T") + "Z");
  if (isNaN(date.getTime())) return isoString;
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function resetForm() {
  form.reset();
  userIdInput.value = "";
  submitBtn.textContent = "Adicionar";
  formLabel.textContent = "Novo usuário";
  cancelBtn.classList.add("hidden");
}

function enterEditMode(user) {
  userIdInput.value = user.id;
  nameInput.value = user.name;
  emailInput.value = user.email;
  submitBtn.textContent = "Salvar alterações";
  formLabel.textContent = `Editando usuário #${user.id}`;
  cancelBtn.classList.remove("hidden");
  nameInput.focus();
}

function renderUsers(users) {
  totalCount.textContent = users.length;

  if (users.length === 0) {
    tableWrapper.classList.add("hidden");
    emptyState.classList.remove("hidden");
    return;
  }

  emptyState.classList.add("hidden");
  tableWrapper.classList.remove("hidden");

  usersTableBody.innerHTML = users
    .map(
      (user) => `
      <tr>
        <td class="py-3 pr-4" style="color: var(--ink-soft);">${user.id}</td>
        <td class="py-3 pr-4" style="color: var(--ink); font-weight: 500;">${escapeHtml(user.name)}</td>
        <td class="py-3 pr-4" style="color: var(--ink-soft);">${escapeHtml(user.email)}</td>
        <td class="py-3 pr-4" style="color: var(--ink-soft);">${formatDate(user.created_at)}</td>
        <td class="py-3 pl-4 text-right whitespace-nowrap">
          <button
            class="row-btn-edit text-sm font-medium mr-4 transition"
            style="color: var(--accent);"
            data-action="edit"
            data-id="${user.id}"
          >
            Editar
          </button>
          <button
            class="row-btn-delete text-sm font-medium transition"
            style="color: var(--danger);"
            data-action="delete"
            data-id="${user.id}"
          >
            Excluir
          </button>
        </td>
      </tr>
    `
    )
    .join("");
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

async function fetchUsers() {
  try {
    const res = await fetch(API_URL);
    const users = await res.json();
    renderUsers(users);
  } catch (err) {
    showAlert("Não foi possível carregar os usuários. Verifique a conexão.");
  }
}

async function saveUser(event) {
  event.preventDefault();

  const id = userIdInput.value;
  const payload = {
    name: nameInput.value.trim(),
    email: emailInput.value.trim(),
  };

  const isEdit = Boolean(id);
  const url = isEdit ? `${API_URL}/${id}` : API_URL;
  const method = isEdit ? "PUT" : "POST";

  try {
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();

    if (!res.ok) {
      showAlert(data.error || "Ocorreu um erro ao salvar o usuário.");
      return;
    }

    resetForm();
    fetchUsers();
  } catch (err) {
    showAlert("Não foi possível salvar o usuário. Verifique a conexão.");
  }
}

async function deleteUser(id) {
  if (!confirm("Tem certeza que deseja excluir este usuário?")) return;

  try {
    const res = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
    const data = await res.json();

    if (!res.ok) {
      showAlert(data.error || "Ocorreu um erro ao excluir o usuário.");
      return;
    }

    fetchUsers();
  } catch (err) {
    showAlert("Não foi possível excluir o usuário. Verifique a conexão.");
  }
}

async function editUser(id) {
  try {
    const res = await fetch(`${API_URL}/${id}`);
    const data = await res.json();

    if (!res.ok) {
      showAlert(data.error || "Usuário não encontrado.");
      return;
    }

    enterEditMode(data);
  } catch (err) {
    showAlert("Não foi possível carregar os dados do usuário.");
  }
}

usersTableBody.addEventListener("click", (event) => {
  const btn = event.target.closest("button[data-action]");
  if (!btn) return;

  const id = btn.dataset.id;
  if (btn.dataset.action === "edit") editUser(id);
  if (btn.dataset.action === "delete") deleteUser(id);
});

form.addEventListener("submit", saveUser);
cancelBtn.addEventListener("click", resetForm);

fetchUsers();
