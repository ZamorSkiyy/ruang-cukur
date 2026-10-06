// ======================================================
// RUANG CUKUR - APP V2
// ======================================================
const { createClient } = supabase;
const supabaseClient = createClient(window.SUPABASE_URL, window.SUPABASE_PUBLISHABLE_KEY);

const $ = id => document.getElementById(id);
const loginView = $("loginView");
const appView = $("appView");
const loginForm = $("loginForm");
const loginError = $("loginError");
const userLabel = $("userLabel");
const logoutBtn = $("logoutBtn");
const navButtons = document.querySelectorAll("[data-page]");
const statOmzet = $("statOmzet");
const statBarber = $("statBarber");
const statOwner = $("statOwner");
const statCount = $("statCount");
const recent = $("recent");
const barberSelect = $("barberSelect");
const serviceSelect = $("serviceSelect");
const paymentSelect = $("paymentSelect");
const transactionForm = $("transactionForm");
const transactionMessage = $("transactionMessage");
const transactionList = $("transactionList");
const serviceList = $("serviceList");
const serviceForm = $("serviceForm");
const serviceName = $("serviceName");
const serviceCode = $("serviceCode");
const servicePrice = $("servicePrice");
const serviceMessage = $("serviceMessage");
const serviceFormTitle = $("serviceFormTitle");
const serviceSaveBtn = $("serviceSaveBtn");
const serviceCancelBtn = $("serviceCancelBtn");
const payrollPeriodSelect = $("payrollPeriodSelect");
const payrollList = $("payrollList");
const payrollSummary = $("payrollSummary");
const payrollMessage = $("payrollMessage");
const settingsList = $("settingsList");
const settingsMessage = $("settingsMessage");
const barberManagerList = $("barberManagerList");
const barberForm = $("barberForm");
const barberMessage = $("barberMessage");
const barberManagerNav = $("barbersNav");
const productsNav = $("productsNav");
const productSalesNav = $("productSalesNav");
const saleProductSelect = $("saleProductSelect");
const saleQuantity = $("saleQuantity");
const salePaymentSelect = $("salePaymentSelect");
const salePreview = $("salePreview");
const productSaleForm = $("productSaleForm");
const productSaleMessage = $("productSaleMessage");
const productSalesList = $("productSalesList");
const productList = $("productList");
const productForm = $("productForm");
const productMessage = $("productMessage");
const productFormTitle = $("productFormTitle");
const productSaveBtn = $("productSaveBtn");
const productCancelBtn = $("productCancelBtn");
let products = [];
let editingProductId = null;

let currentUser = null;
let currentProfile = null;
let services = [];
let barbers = [];
let payrollSettings = [];
let editingServiceId = null;

function rupiah(value) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(Number(value || 0));
}
function esc(value) {
  return String(value ?? "").replace(/[&<>'"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]));
}
function isAdmin() { return ["owner", "admin"].includes(currentProfile?.role); }
function setMessage(el, message, error = false) { el.textContent = message || ""; el.classList.toggle("error", error); el.classList.toggle("success", !error && !!message); }
function showLogin() { loginView.hidden = false; appView.hidden = true; }
function showApp() { loginView.hidden = true; appView.hidden = false; }

function showPage(page) {
  document.querySelectorAll(".page").forEach(s => s.hidden = true);
  const target = $(`page-${page}`);
  if (target) target.hidden = false;
  navButtons.forEach(b => b.classList.toggle("active", b.dataset.page === page));
  if (page === "dashboard") loadDashboard();
  if (page === "transactions") loadTransactions();
  if (page === "services") renderServices();
  if (page === "payroll") { populatePayrollPeriods(); loadPayroll(); }
  if (page === "payroll-settings") loadPayrollSettings();
  if (page === "barbers") loadBarberManagement();
  if (page === "products") loadProducts();
  if (page === "product-sales") { loadProductsForSale(); loadProductSales(); }
}
navButtons.forEach(button => button.addEventListener("click", () => {
  if (["payrollSettingsNav", "barbersNav"].includes(button.id) && !isAdmin()) return;
  showPage(button.dataset.page);
}));

loginForm.addEventListener("submit", async event => {
  event.preventDefault(); loginError.style.display = "none";
  try {
    const { data, error } = await supabaseClient.auth.signInWithPassword({ email: $("email").value.trim(), password: $("password").value });
    if (error) throw error;
    if (!data.session) throw new Error("Login berhasil tetapi session tidak terbentuk.");
    currentUser = data.user;
    await loadProfile(); await loadServices(); await loadBarbers();
    showApp(); showPage("dashboard");
  } catch (error) {
    console.error(error); loginError.textContent = `LOGIN ERROR: ${error.message || "Terjadi kesalahan."}`; loginError.style.display = "block";
  }
});

async function loadProfile() {
  const { data, error } = await supabaseClient.from("profiles").select("*").eq("id", currentUser.id).single();
  if (error) throw error;
  currentProfile = data;
  if (data.status === "inactive" && data.role === "barber") {
    await supabaseClient.auth.signOut();
    currentUser = null;
    currentProfile = null;
    throw new Error("Akun barber ini sedang nonaktif. Hubungi Owner/Admin.");
  }
  userLabel.textContent = `${data.email || currentUser.email} • ${data.role}`;
  $("payrollSettingsNav").hidden = !isAdmin();
  barberManagerNav.hidden = !isAdmin();
  productsNav.hidden = false;
}
logoutBtn.addEventListener("click", async () => { await supabaseClient.auth.signOut(); currentUser = null; currentProfile = null; showLogin(); });

async function loadServices() {
  const { data, error } = await supabaseClient
    .from("services")
    .select("id, code, name, price, status")
    .eq("status", "active")
    .order("name");
  if (error) throw error;
  services = data || [];
  renderServices();
  renderServiceSelect();
}

function renderServiceSelect() {
  serviceSelect.innerHTML = services.length
    ? services.map(s => `<option value="${esc(s.id)}">${esc(s.name)} — ${rupiah(s.price)}</option>`).join("")
    : `<option value="">Belum ada layanan</option>`;
}

function resetServiceForm() {
  editingServiceId = null;
  serviceForm.reset();
  serviceFormTitle.textContent = "Tambah Layanan";
  serviceSaveBtn.textContent = "Tambah Layanan";
  serviceCancelBtn.hidden = true;
  setMessage(serviceMessage, "");
}

function startEditService(id) {
  if (!isAdmin()) return;
  const service = services.find(s => s.id === id);
  if (!service) return;

  editingServiceId = id;
  serviceName.value = service.name || "";
  serviceCode.value = service.code || "";
  servicePrice.value = Number(service.price || 0);
  serviceFormTitle.textContent = "Edit Layanan";
  serviceSaveBtn.textContent = "Simpan Perubahan";
  serviceCancelBtn.hidden = false;
  setMessage(serviceMessage, "");
  serviceName.focus();
}

async function deleteService(id) {
  if (!isAdmin()) return;
  const service = services.find(s => s.id === id);
  if (!service) return;

  const ok = confirm(`Hapus layanan "${service.name}"?\n\nLayanan akan dinonaktifkan. Transaksi lama tetap aman.`);
  if (!ok) return;

  setMessage(serviceMessage, "Menghapus layanan...");
  try {
    const { error } = await supabaseClient
      .from("services")
      .update({ status: "inactive" })
      .eq("id", id);

    if (error) throw error;

    if (editingServiceId === id) resetServiceForm();
    setMessage(serviceMessage, `Layanan "${service.name}" berhasil dihapus.`);
    await loadServices();
  } catch (error) {
    console.error(error);
    setMessage(serviceMessage, `Gagal menghapus: ${error.message || "Terjadi kesalahan."}`, true);
  }
}

function renderServices() {
  if (!services.length) {
    serviceList.innerHTML = `<p class="muted">Belum ada layanan aktif.</p>`;
    return;
  }

  const actions = isAdmin();
  serviceList.innerHTML = services.map(s => `
    <div class="list-row service-row">
      <div>
        <strong>${esc(s.name)}</strong>
        <div class="muted">${esc(s.code || "")}</div>
      </div>
      <div class="service-actions">
        <strong>${rupiah(s.price)}</strong>
        ${actions ? `
          <div class="button-row">
            <button class="ghost service-edit-btn" type="button" data-id="${esc(s.id)}">Edit</button>
            <button class="danger service-delete-btn" type="button" data-id="${esc(s.id)}">Hapus</button>
          </div>
        ` : ""}
      </div>
    </div>
  `).join("");

  serviceList.querySelectorAll(".service-edit-btn").forEach(btn => {
    btn.addEventListener("click", () => startEditService(btn.dataset.id));
  });
  serviceList.querySelectorAll(".service-delete-btn").forEach(btn => {
    btn.addEventListener("click", () => deleteService(btn.dataset.id));
  });
}

serviceForm.addEventListener("submit", async event => {
  event.preventDefault();
  if (!isAdmin()) return;

  const name = serviceName.value.trim();
  const code = serviceCode.value.trim().toUpperCase();
  const price = Number(servicePrice.value);

  if (!name || !code || !Number.isFinite(price) || price < 0) {
    setMessage(serviceMessage, "Nama, kode, dan harga layanan wajib diisi dengan benar.", true);
    return;
  }

  setMessage(serviceMessage, editingServiceId ? "Menyimpan perubahan..." : "Menambahkan layanan...");

  try {
    let error;

    if (editingServiceId) {
      ({ error } = await supabaseClient
        .from("services")
        .update({ name, code, price })
        .eq("id", editingServiceId));
    } else {
      ({ error } = await supabaseClient
        .from("services")
        .insert({ name, code, price, status: "active" }));
    }

    if (error) throw error;

    setMessage(serviceMessage, editingServiceId
      ? "Layanan berhasil diperbarui."
      : "Layanan berhasil ditambahkan.");

    resetServiceForm();
    await loadServices();
  } catch (error) {
    console.error(error);
    setMessage(serviceMessage, `Gagal: ${error.message || "Terjadi kesalahan."}`, true);
  }
});

serviceCancelBtn.addEventListener("click", resetServiceForm);
async function loadBarbers() {
  const { data, error } = await supabaseClient.from("profiles").select("id,name,email,role,status").eq("role", "barber").eq("status", "active").order("name");
  if (error) throw error; barbers = data || []; renderBarberSelect();
}

async function loadBarberManagement() {
  if (!isAdmin()) return;
  barberManagerList.innerHTML = "Memuat...";
  try {
    const { data, error } = await supabaseClient
      .from("profiles")
      .select("id,name,email,role,status")
      .eq("role", "barber")
      .order("status", { ascending: true })
      .order("name", { ascending: true });
    if (error) throw error;

    const rows = data || [];
    if (!rows.length) {
      barberManagerList.innerHTML = `<p class="muted">Belum ada barber.</p>`;
      return;
    }

    barberManagerList.innerHTML = rows.map(b => {
      const active = b.status === "active";
      return `<div class="list-row barber-manager-row">
        <div>
          <strong>${esc(b.name || "Tanpa nama")}</strong>
          <div class="muted">${esc(b.email || "")}</div>
          <span class="badge ${active ? "badge-active" : "badge-inactive"}">${active ? "AKTIF" : "NONAKTIF"}</span>
        </div>
        <div class="button-row">
          ${active
            ? `<button class="danger barber-status-btn" type="button" data-action="deactivate" data-id="${esc(b.id)}" data-name="${esc(b.name || b.email || "Barber")}">Nonaktifkan</button>`
            : `<button class="ghost barber-status-btn" type="button" data-action="activate" data-id="${esc(b.id)}" data-name="${esc(b.name || b.email || "Barber")}">Aktifkan</button>`}
        </div>
      </div>`;
    }).join("");

    barberManagerList.querySelectorAll(".barber-status-btn").forEach(btn => {
      btn.addEventListener("click", () => changeBarberStatus(btn.dataset.action, btn.dataset.id, btn.dataset.name));
    });
  } catch (error) {
    console.error(error);
    barberManagerList.innerHTML = `<p class="error">Gagal memuat barber: ${esc(error.message || "Terjadi kesalahan.")}</p>`;
  }
}

async function changeBarberStatus(action, barberId, barberName) {
  if (!isAdmin()) return;
  const isDeactivate = action === "deactivate";
  const ok = confirm(isDeactivate
    ? `Nonaktifkan barber "${barberName}"?\n\nRiwayat transaksi dan payroll tetap aman.`
    : `Aktifkan kembali barber "${barberName}"?`);
  if (!ok) return;

  setMessage(barberMessage, isDeactivate ? "Menonaktifkan barber..." : "Mengaktifkan barber...");
  try {
    const { data, error } = await supabaseClient.functions.invoke("manage-barber", {
      body: { action, barber_id: barberId }
    });
    if (error) throw error;
    if (data?.success === false) throw new Error(data.error || "Operasi gagal.");
    setMessage(barberMessage, data?.message || (isDeactivate ? "Barber dinonaktifkan." : "Barber diaktifkan."));
    await loadBarbers();
    await loadBarberManagement();
  } catch (error) {
    console.error(error);
    setMessage(barberMessage, `Gagal: ${error.message || "Terjadi kesalahan."}`, true);
  }
}

barberForm.addEventListener("submit", async event => {
  event.preventDefault();
  if (!isAdmin()) return;

  const name = $("barberName").value.trim();
  const email = $("barberEmail").value.trim();
  const password = $("barberPassword").value;
  if (!name || !email || password.length < 6) {
    setMessage(barberMessage, "Nama, email, dan password minimal 6 karakter wajib diisi.", true);
    return;
  }

  setMessage(barberMessage, "Membuat akun barber...");
  try {
    const { data, error } = await supabaseClient.functions.invoke("manage-barber", {
      body: { action: "create", name, email, password }
    });
    if (error) throw error;
    if (data?.success === false) throw new Error(data.error || "Gagal membuat barber.");

    barberForm.reset();
    setMessage(barberMessage, data?.message || "Barber berhasil ditambahkan.");
    await loadBarbers();
    await loadBarberManagement();
  } catch (error) {
    console.error(error);
    setMessage(barberMessage, `Gagal: ${error.message || "Terjadi kesalahan."}`, true);
  }
});

$("refreshBarbersBtn").addEventListener("click", async () => {
  await loadBarbers();
  await loadBarberManagement();
});

async function loadProducts() {
  productList.innerHTML = "Memuat...";
  try {
    const { data, error } = await supabaseClient
      .from("products")
      .select("id, code, name, cost_price, sell_price, stock, status")
      .order("status", { ascending: true })
      .order("name", { ascending: true });
    if (error) throw error;
    products = data || [];
    renderProducts();
  } catch (error) {
    console.error(error);
    productList.innerHTML = `<p class="error">Gagal memuat produk: ${esc(error.message || "Terjadi kesalahan.")}</p>`;
  }
}

function resetProductForm() {
  editingProductId = null;
  productForm.reset();
  $("productCost").value = 0;
  $("productSell").value = 0;
  $("productStock").value = 0;
  productFormTitle.textContent = "Tambah Produk";
  productSaveBtn.textContent = "Tambah Produk";
  productCancelBtn.hidden = true;
  setMessage(productMessage, "");
}

function startEditProduct(id) {
  if (!isAdmin()) return;
  const product = products.find(p => p.id === id);
  if (!product) return;
  editingProductId = id;
  $("productName").value = product.name || "";
  $("productCode").value = product.code || "";
  $("productCost").value = Number(product.cost_price || 0);
  $("productSell").value = Number(product.sell_price || 0);
  $("productStock").value = Number(product.stock || 0);
  productFormTitle.textContent = "Edit Produk";
  productSaveBtn.textContent = "Simpan Perubahan";
  productCancelBtn.hidden = false;
  setMessage(productMessage, "");
  $("productName").focus();
}

async function toggleProductStatus(id) {
  if (!isAdmin()) return;
  const product = products.find(p => p.id === id);
  if (!product) return;
  const nextStatus = product.status === "active" ? "inactive" : "active";
  const ok = confirm(`${nextStatus === "inactive" ? "Nonaktifkan" : "Aktifkan"} produk "${product.name}"?`);
  if (!ok) return;
  setMessage(productMessage, "Menyimpan status produk...");
  try {
    const { error } = await supabaseClient.from("products").update({ status: nextStatus, updated_at: new Date().toISOString() }).eq("id", id);
    if (error) throw error;
    setMessage(productMessage, `Produk berhasil ${nextStatus === "active" ? "diaktifkan" : "dinonaktifkan"}.`);
    await loadProducts();
  } catch (error) {
    console.error(error);
    setMessage(productMessage, `Gagal: ${error.message || "Terjadi kesalahan."}`, true);
  }
}

function renderProducts() {
  if (!products.length) {
    productList.innerHTML = `<p class="muted">Belum ada produk.</p>`;
    return;
  }
  const actions = isAdmin();
  productList.innerHTML = products.map(p => `
    <div class="list-row product-row">
      <div>
        <strong>${esc(p.name)}</strong>
        <div class="muted">${esc(p.code || "")}</div>
        <div class="muted">Modal ${rupiah(p.cost_price)} • Stok ${Number(p.stock || 0)}</div>
        <span class="badge ${p.status === "active" ? "badge-active" : "badge-inactive"}">${p.status === "active" ? "AKTIF" : "NONAKTIF"}</span>
      </div>
      <div class="service-actions">
        <strong>${rupiah(p.sell_price)}</strong>
        ${actions ? `<div class="button-row">
          <button class="ghost product-edit-btn" type="button" data-id="${esc(p.id)}">Edit</button>
          <button class="${p.status === "active" ? "danger" : "ghost"} product-status-btn" type="button" data-id="${esc(p.id)}">${p.status === "active" ? "Nonaktifkan" : "Aktifkan"}</button>
        </div>` : ""}
      </div>
    </div>`).join("");

  productList.querySelectorAll(".product-edit-btn").forEach(btn => btn.addEventListener("click", () => startEditProduct(btn.dataset.id)));
  productList.querySelectorAll(".product-status-btn").forEach(btn => btn.addEventListener("click", () => toggleProductStatus(btn.dataset.id)));
}

async function loadProductsForSale() {
  try {
    const { data, error } = await supabaseClient
      .from("products")
      .select("id, code, name, sell_price, stock, status")
      .eq("status", "active")
      .gt("stock", 0)
      .order("name");
    if (error) throw error;
    const saleProducts = data || [];
    saleProductSelect.innerHTML = saleProducts.length
      ? saleProducts.map(p => `<option value="${esc(p.id)}">${esc(p.name)} — ${rupiah(p.sell_price)} (stok ${Number(p.stock || 0)})</option>`).join("")
      : `<option value="">Tidak ada produk aktif dengan stok</option>`;
    updateSalePreview(saleProducts);
  } catch (error) {
    console.error(error);
    saleProductSelect.innerHTML = `<option value="">Gagal memuat produk</option>`;
    salePreview.textContent = `Gagal memuat produk: ${error.message || "Terjadi kesalahan."}`;
  }
}

async function loadProductSales() {
  productSalesList.innerHTML = "Memuat...";
  try {
    const { data, error } = await supabaseClient
      .from("product_sales")
      .select("id, sale_date, quantity, unit_price, total_amount, payment_method, product_id, sold_by, products:product_id(name, code), profiles:sold_by(name, email)")
      .order("sale_date", { ascending: false })
      .limit(100);
    if (error) throw error;
    const rows = data || [];
    productSalesList.innerHTML = rows.length ? rows.map(s => `
      <div class="list-row">
        <div>
          <strong>${esc(s.products?.name || "Produk")}</strong>
          <div class="muted">${new Date(s.sale_date).toLocaleString("id-ID")} • ${esc(s.profiles?.name || s.profiles?.email || "Pengguna")}</div>
          <div class="muted">${Number(s.quantity)} × ${rupiah(s.unit_price)} • ${esc(String(s.payment_method || "").toUpperCase())}</div>
        </div>
        <strong>${rupiah(s.total_amount)}</strong>
      </div>`).join("") : `<p class="muted">Belum ada penjualan produk.</p>`;
  } catch (error) {
    console.error(error);
    productSalesList.innerHTML = `<p class="error">Gagal memuat penjualan: ${esc(error.message || "Terjadi kesalahan.")}</p>`;
  }
}

async function updateSalePreview(saleProducts) {
  const product = (saleProducts || []).find(p => p.id === saleProductSelect.value);
  const qty = Math.max(1, Number(saleQuantity.value || 1));
  if (!product) {
    salePreview.textContent = "Pilih produk.";
    return;
  }
  const total = Number(product.sell_price || 0) * qty;
  salePreview.innerHTML = `Harga ${rupiah(product.sell_price)} × ${qty} = <strong>${rupiah(total)}</strong> • Stok tersedia ${Number(product.stock || 0)}`;
}

saleProductSelect.addEventListener("change", async () => {
  try {
    const { data, error } = await supabaseClient.from("products").select("id, name, sell_price, stock, status").eq("status", "active").gt("stock", 0).order("name");
    if (error) throw error;
    updateSalePreview(data || []);
  } catch (error) {
    salePreview.textContent = error.message || "Gagal memuat produk.";
  }
});
saleQuantity.addEventListener("input", async () => {
  const { data } = await supabaseClient.from("products").select("id, name, sell_price, stock, status").eq("status", "active").gt("stock", 0).order("name");
  updateSalePreview(data || []);
});

productSaleForm.addEventListener("submit", async event => {
  event.preventDefault();
  const productId = saleProductSelect.value;
  const quantity = Number(saleQuantity.value);
  const paymentMethod = salePaymentSelect.value;
  if (!productId) {
    setMessage(productSaleMessage, "Pilih produk terlebih dahulu.", true);
    return;
  }
  if (!Number.isInteger(quantity) || quantity < 1) {
    setMessage(productSaleMessage, "Jumlah harus minimal 1.", true);
    return;
  }
  setMessage(productSaleMessage, "Menyimpan penjualan...");
  try {
    const { data, error } = await supabaseClient.rpc("sell_product", {
      p_product_id: productId,
      p_quantity: quantity,
      p_payment_method: paymentMethod
    });
    if (error) throw error;
    if (data?.success === false) throw new Error(data.message || "Penjualan gagal.");
    setMessage(productSaleMessage, data?.message || "Penjualan produk berhasil disimpan.");
    saleQuantity.value = 1;
    await Promise.all([loadProductsForSale(), loadProductSales(), loadProducts()]);
  } catch (error) {
    console.error(error);
    setMessage(productSaleMessage, `Gagal: ${error.message || "Terjadi kesalahan."}`, true);
  }
});

$("refreshProductSalesBtn").addEventListener("click", async () => {
  await Promise.all([loadProductsForSale(), loadProductSales()]);
});

productForm.addEventListener("submit", async event => {
  event.preventDefault();
  if (!isAdmin()) return;
  const name = $("productName").value.trim();
  const code = $("productCode").value.trim().toUpperCase();
  const costPrice = Number($("productCost").value);
  const sellPrice = Number($("productSell").value);
  const stock = Number($("productStock").value);
  if (!name || !Number.isFinite(costPrice) || costPrice < 0 || !Number.isFinite(sellPrice) || sellPrice < 0 || !Number.isInteger(stock) || stock < 0) {
    setMessage(productMessage, "Nama, harga, dan stok harus diisi dengan benar.", true);
    return;
  }
  setMessage(productMessage, editingProductId ? "Menyimpan perubahan..." : "Menambahkan produk...");
  try {
    let error;
    const payload = { name, code: code || null, cost_price: costPrice, sell_price: sellPrice, stock, status: "active", updated_at: new Date().toISOString() };
    if (editingProductId) {
      ({ error } = await supabaseClient.from("products").update(payload).eq("id", editingProductId));
    } else {
      ({ error } = await supabaseClient.from("products").insert({ ...payload, created_by: currentUser.id }));
    }
    if (error) throw error;
    setMessage(productMessage, editingProductId ? "Produk berhasil diperbarui." : "Produk berhasil ditambahkan.");
    resetProductForm();
    await loadProducts();
  } catch (error) {
    console.error(error);
    setMessage(productMessage, `Gagal: ${error.message || "Terjadi kesalahan."}`, true);
  }
});

productCancelBtn.addEventListener("click", resetProductForm);
$("refreshProductsBtn").addEventListener("click", loadProducts);

function renderBarberSelect() {
  barberSelect.innerHTML = barbers.length ? barbers.map(b => `<option value="${esc(b.id)}">${esc(b.name || b.email || "Barber")}</option>`).join("") : `<option value="">Belum ada barber aktif</option>`;
}

transactionForm.addEventListener("submit", async event => {
  event.preventDefault(); setMessage(transactionMessage, "Menyimpan transaksi...");
  try {
    if (!barberSelect.value) throw new Error("Pilih barber terlebih dahulu.");
    if (!serviceSelect.value) throw new Error("Pilih layanan terlebih dahulu.");
    const { error } = await supabaseClient.from("transactions").insert({ barber_id: barberSelect.value, service_id: serviceSelect.value, payment_method: paymentSelect.value, created_by: currentUser.id });
    if (error) throw error;
    setMessage(transactionMessage, "Transaksi berhasil disimpan.");
    await loadTransactions(); await loadDashboard();
  } catch (error) { console.error(error); setMessage(transactionMessage, `Gagal: ${error.message || "Terjadi kesalahan."}`, true); }
});

async function getTransactions() {
  const { data, error } = await supabaseClient.from("transactions").select("id, transaction_date, created_at, price_snapshot, barber_share, owner_share, payment_method, barber_id, service_id").order("transaction_date", { ascending: false });
  if (error) throw error; return data || [];
}
async function loadTransactions() {
  try {
    const transactions = await getTransactions();
    transactionList.innerHTML = transactions.length ? transactions.slice(0, 100).map(t => {
      const barber = barbers.find(x => x.id === t.barber_id); const service = services.find(x => x.id === t.service_id);
      const date = new Date(t.transaction_date).toLocaleString("id-ID");
      return `<div class="list-row"><div><strong>${esc(service?.name || "Layanan")}</strong><div class="muted">${esc(barber?.name || barber?.email || "Barber")} • ${date}</div><div class="muted">${esc(String(t.payment_method || "").toUpperCase())}</div></div><div class="right"><strong>${rupiah(t.price_snapshot)}</strong><div class="muted">Barber ${rupiah(t.barber_share)}</div></div></div>`;
    }).join("") : `<p class="muted">Belum ada transaksi.</p>`;
  } catch (error) { transactionList.innerHTML = `<p class="error">Gagal memuat transaksi: ${esc(error.message)}</p>`; }
}

async function loadDashboard() {
  try {
    const transactions = await getTransactions(); const now = new Date();
    const today = transactions.filter(t => { const d = new Date(t.transaction_date); return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate(); });
    const omzet = today.reduce((a,t) => a + Number(t.price_snapshot || 0), 0);
    const barber = today.reduce((a,t) => a + Number(t.barber_share || 0), 0);
    const owner = today.reduce((a,t) => a + Number(t.owner_share || 0), 0);
    statOmzet.textContent = rupiah(omzet); statBarber.textContent = rupiah(barber); statOwner.textContent = rupiah(owner); statCount.textContent = today.length;
    recent.innerHTML = today.length ? today.slice(0,5).map(t => { const b=barbers.find(x=>x.id===t.barber_id), s=services.find(x=>x.id===t.service_id); return `<div class="list-row"><div><strong>${esc(s?.name || "Layanan")}</strong><div class="muted">${esc(b?.name || b?.email || "Barber")}</div></div><strong>${rupiah(t.price_snapshot)}</strong></div>`; }).join("") : `<p class="muted">Belum ada transaksi hari ini.</p>`;
  } catch (error) { recent.innerHTML = `<p class="error">Gagal memuat dashboard: ${esc(error.message)}</p>`; }
}

function monthLabel(value) { return new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric" }).format(new Date(`${value}T00:00:00`)); }
function populatePayrollPeriods() {
  const now = new Date(); payrollPeriodSelect.innerHTML = "";
  for (let i=0;i<12;i++) { const d = new Date(now.getFullYear(), now.getMonth()-i,1); const v = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-01`; payrollPeriodSelect.insertAdjacentHTML("beforeend", `<option value="${v}">${monthLabel(v)}</option>`); }
}
async function loadPayroll() {
  if (!payrollPeriodSelect.value) return;
  payrollList.innerHTML = "Memuat..."; payrollSummary.innerHTML = "";
  try {
    const { data, error } = await supabaseClient.from("payroll").select("*, profiles:barber_id(name,email)").eq("period_month", payrollPeriodSelect.value).order("created_at");
    if (error) throw error;
    if (!data?.length) { payrollList.innerHTML = `<p class="muted">Belum ada payroll untuk periode ini.</p>`; return; }
    const total = data.reduce((a,p)=>a+Number(p.total_salary||0),0); const turnover = Number(data[0].service_turnover||0); const method = data[0].payroll_method;
    payrollSummary.innerHTML = `<div class="stat"><span>Omzet jasa</span><b>${rupiah(turnover)}</b></div><div class="stat"><span>Total payroll</span><b>${rupiah(total)}</b></div><div class="stat"><span>Metode</span><b>${method === "profit_share_50_50" ? "50:50" : "Gaji + Bonus"}</b></div><div class="stat"><span>Barber</span><b>${data.length}</b></div>`;
    payrollList.innerHTML = data.map(p => `<div class="list-row"><div><strong>${esc(p.profiles?.name || p.profiles?.email || "Barber")}</strong><div class="muted">${p.status.toUpperCase()} • ${method === "profit_share_50_50" ? `Share ${rupiah(p.share_amount)}` : `Bonus ${rupiah(p.bonus_amount)}`}</div></div><strong>${rupiah(p.total_salary)}</strong></div>`).join("");
  } catch (error) { payrollList.innerHTML = `<p class="error">Gagal memuat payroll: ${esc(error.message)}</p>`; }
}

$("refreshPayrollBtn").addEventListener("click", loadPayroll);
payrollPeriodSelect.addEventListener("change", loadPayroll);
$("generatePayrollBtn").addEventListener("click", async () => {
  if (!isAdmin()) return; setMessage(payrollMessage, "Memproses payroll...");
  try {
    const { data, error } = await supabaseClient.rpc("generate_monthly_payroll", { p_period_month: payrollPeriodSelect.value });
    if (error) throw error;
    setMessage(payrollMessage, `Payroll ${monthLabel(payrollPeriodSelect.value)} siap. ${data?.length || 0} barber diproses.`); await loadPayroll();
  } catch (error) { console.error(error); setMessage(payrollMessage, `Gagal: ${error.message || "Terjadi kesalahan."}`, true); }
});

async function loadPayrollSettings() {
  if (!isAdmin()) return;
  settingsList.innerHTML = "Memuat...";
  try {
    const { data, error } = await supabaseClient.from("payroll_settings").select("*").order("effective_from", { ascending: false });
    if (error) throw error; payrollSettings = data || [];
    settingsList.innerHTML = payrollSettings.length ? payrollSettings.map(s => `<div class="list-row"><div><strong>${esc(s.name)}</strong><div class="muted">${s.effective_from} ${s.effective_to ? `s/d ${s.effective_to}` : "→ sekarang"}</div><div class="muted">${s.method === "profit_share_50_50" ? `Bagi hasil ${(Number(s.barber_share_rate)*100).toFixed(1)}% / ${(Number(s.owner_share_rate)*100).toFixed(1)}%` : `Gaji ${rupiah(s.base_salary)} • threshold ${rupiah(s.turnover_threshold)} • bonus ${(Number(s.bonus_rate)*100).toFixed(1)}%`}</div></div><span class="badge">${esc(s.status)}</span></div>`).join("") : `<p class="muted">Belum ada aturan.</p>`;
  } catch (error) { settingsList.innerHTML = `<p class="error">Gagal memuat aturan: ${esc(error.message)}</p>`; }
}

function toggleSettingFields() {
  const bonus = $("settingMethod").value === "base_plus_turnover_bonus";
  $("bonusFields").hidden = !bonus; $("shareFields").hidden = bonus;
}
$("settingMethod").addEventListener("change", toggleSettingFields);
$("payrollSettingsForm").addEventListener("submit", async event => {
  event.preventDefault(); if (!isAdmin()) return;
  setMessage(settingsMessage, "Menyimpan aturan...");
  try {
    const method = $("settingMethod").value;
    const barberRate = Number($("settingBarberRate").value || 0) / 100;
    const ownerRate = Number($("settingOwnerRate").value || 0) / 100;
    if (method === "profit_share_50_50" && Math.abs(barberRate + ownerRate - 1) > 0.00001) throw new Error("Bagian barber + owner harus 100%.");
    const payload = {
      name: $("settingName").value.trim(), method,
      base_salary: method === "base_plus_turnover_bonus" ? Number($("settingBaseSalary").value || 0) : 0,
      turnover_threshold: method === "base_plus_turnover_bonus" ? Number($("settingThreshold").value || 0) : 0,
      bonus_rate: method === "base_plus_turnover_bonus" ? Number($("settingBonusRate").value || 0) / 100 : 0,
      barber_share_rate: method === "profit_share_50_50" ? barberRate : 0,
      owner_share_rate: method === "profit_share_50_50" ? ownerRate : 0,
      effective_from: $("settingEffectiveFrom").value,
      status: "active",
      notes: $("settingNotes").value.trim() || null,
      created_by: currentUser.id,
      updated_at: new Date().toISOString()
    };
    if (!payload.name || !payload.effective_from) throw new Error("Nama dan tanggal mulai wajib diisi.");
    const { error } = await supabaseClient.from("payroll_settings").insert(payload);
    if (error) throw error;
    setMessage(settingsMessage, "Aturan baru berhasil disimpan."); $("payrollSettingsForm").reset(); toggleSettingFields(); await loadPayrollSettings();
  } catch (error) { console.error(error); setMessage(settingsMessage, `Gagal: ${error.message || "Terjadi kesalahan."}`, true); }
});

async function init() {
  try {
    const { data: { session }, error } = await supabaseClient.auth.getSession(); if (error) throw error;
    if (!session) { showLogin(); return; }
    currentUser = session.user; await loadProfile(); await loadServices(); await loadBarbers(); showApp(); showPage("dashboard");
  } catch (error) { console.error(error); loginError.textContent = `ERROR INIT: ${error.message || error}`; loginError.style.display = "block"; }
}

toggleSettingFields(); init();
