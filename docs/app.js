const API_BASE = "https://terminadoact9-backend.onrender.com";

const token = localStorage.getItem("token");
if (!token) window.location.href = "index.html";

const who = document.getElementById("who");
const user = JSON.parse(localStorage.getItem("user") || "{}");
who.textContent = user?.nombre ? `👤 ${user.nombre}` : "";

document.getElementById("logout").onclick = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "index.html";
};

const tbody = document.getElementById("tbody");
const tbodyMov = document.getElementById("tbodyMov");
const search = document.getElementById("search");

const modal = new bootstrap.Modal("#modalProd");
const formProd = document.getElementById("formProd");
const msg = document.getElementById("msg");

function showMsg(text, type="danger") {
  msg.className = `alert alert-${type}`;
  msg.textContent = text;
  msg.classList.remove("d-none");
}
function clearMsg(){ msg.classList.add("d-none"); }

async function api(path, options={}) {
  const r = await fetch(API_BASE + path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + token,
      ...(options.headers || {})
    }
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.message || "Error");
  return data;
}

let products = [];

function renderProducts(list) {
  tbody.innerHTML = "";
  list.forEach(p => {
    const low = (p.stock <= p.stock_min);
    const badge = `<span class="badge ${low ? "badge-low" : "badge-ok"}">${p.stock}</span>`;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${p.nombre}</td>
      <td>${p.categoria}</td>
      <td class="text-end">${badge}</td>
      <td class="text-end">$${Number(p.precio).toFixed(2)}</td>
      <td class="text-end">
        <button class="btn btn-outline-primary btn-sm me-1" data-act="edit" data-id="${p.id}">Editar</button>
        <button class="btn btn-outline-danger btn-sm" data-act="del" data-id="${p.id}">Eliminar</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

async function loadProducts() {
  products = await api("/api/products");
  applySearch();
}

function applySearch() {
  const q = search.value.trim().toLowerCase();
  const filtered = products.filter(p =>
    p.nombre.toLowerCase().includes(q) ||
    p.categoria.toLowerCase().includes(q)
  );
  renderProducts(filtered);
}

search.addEventListener("input", applySearch);

document.getElementById("btnNew").onclick = () => openModal();

tbody.addEventListener("click", async (e) => {
  const btn = e.target.closest("button[data-act]");
  if (!btn) return;

  const id = +btn.dataset.id;
  const act = btn.dataset.act;

  if (act === "edit") {
    const p = products.find(x => x.id === id);
    openModal(p);
  }

  if (act === "del") {
    if (!confirm("¿Eliminar producto?")) return;
    await api("/api/products/" + id, { method: "DELETE" });
    await loadProducts();
    await loadMovements();
  }
});

function openModal(p=null) {
  clearMsg();
  document.getElementById("modalTitle").textContent = p ? "Editar producto" : "Nuevo producto";
  document.getElementById("id").value = p?.id || "";
  document.getElementById("nombre").value = p?.nombre || "";
  document.getElementById("categoria").value = p?.categoria || "";
  document.getElementById("stock").value = p?.stock ?? 0;
  document.getElementById("stock_min").value = p?.stock_min ?? 0;
  document.getElementById("precio").value = p?.precio ?? 0;
  modal.show();
}

formProd.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearMsg();

  const id = document.getElementById("id").value;
  const body = {
    nombre: document.getElementById("nombre").value.trim(),
    categoria: document.getElementById("categoria").value.trim(),
    stock: +document.getElementById("stock").value,
    stock_min: +document.getElementById("stock_min").value,
    precio: +document.getElementById("precio").value
  };

  try {
    if (!id) {
      await api("/api/products", { method: "POST", body: JSON.stringify(body) });
    } else {
      await api("/api/products/" + id, { method: "PUT", body: JSON.stringify(body) });
    }
    await loadProducts();
    await loadMovements();
    showMsg("Guardado correctamente", "success");
  } catch (err) {
    showMsg(err.message);
  }
});

// Movimientos
document.getElementById("btnMov").onclick = async () => {
  clearMsg();
  const id = document.getElementById("id").value;
  if (!id) return showMsg("Primero guarda el producto (o edita uno existente).");

  const body = {
    product_id: +id,
    tipo: document.getElementById("movTipo").value,
    cantidad: +document.getElementById("movCantidad").value,
    nota: document.getElementById("movNota").value.trim()
  };

  try {
    await api("/api/movements", { method: "POST", body: JSON.stringify(body) });
    await loadProducts();
    await loadMovements();
    showMsg("Movimiento registrado", "success");
  } catch (err) {
    showMsg(err.message);
  }
};

document.getElementById("btnRefreshMov").onclick = loadMovements;

async function loadMovements() {
  const movs = await api("/api/movements");
  tbodyMov.innerHTML = "";
  movs.forEach(m => {
    const tr = document.createElement("tr");
    const fecha = new Date(m.created_at).toLocaleString();
    tr.innerHTML = `
      <td>${m.producto}</td>
      <td>${m.tipo}</td>
      <td class="text-end">${m.cantidad}</td>
      <td>${fecha}</td>
    `;
    tbodyMov.appendChild(tr);
  });
}

// Init
loadProducts();
loadMovements();
