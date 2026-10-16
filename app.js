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
const menuToggle = $("menuToggle");
const menuToggleLabel = $("menuToggleLabel");
const currentPageLabel = $("currentPageLabel");
const nav = $("nav");
const navButtons = document.querySelectorAll("[data-page]");
const statOmzet = $("statOmzet");
const statCount = $("statCount");
const recent = $("recent");
const barberSelect = $("barberSelect");
const serviceSelect = $("serviceSelect");
const paymentSelect = $("paymentSelect");
const transactionForm = $("transactionForm");
const transactionMessage = $("transactionMessage");
const transactionList = $("transactionList");

// Delegated click handler: remains active when the scrollable history is rerendered.
if (transactionList && !transactionList.dataset.printHandlerBound) {
  transactionList.dataset.printHandlerBound = "true";
  transactionList.addEventListener("click", event => {
    const button = event.target.closest("button.history-print-service, button.history-print-product");
    if (!button) return;
    event.preventDefault();
    event.stopPropagation();
    const task = button.classList.contains("history-print-service")
      ? printServiceTransaction(button.dataset.id)
      : printProductSale(button.dataset.id);
    Promise.resolve(task).catch(error => {
      console.error("Cetak nota gagal:", error);
      alert("Cetak nota gagal: " + (error?.message || "Terjadi kesalahan. Muat ulang aplikasi dan coba lagi."));
    });
  });
}
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
const attendanceDate = $("attendanceDate");
const attendanceBarber = $("attendanceBarber");
const attendancePresent = $("attendancePresent");
const attendanceNotes = $("attendanceNotes");
const attendanceList = $("attendanceList");
const attendanceMessage = $("attendanceMessage");
const financePayrollTotal = $("financePayrollTotal");
const barberManagerList = $("barberManagerList");
const barberForm = $("barberForm");
const barberMessage = $("barberMessage");
const barberManagerNav = $("barbersNav");
const productsNav = $("productsNav");
const productSalesNav = $("productSalesNav");
const expenseForm = $("expenseForm");
const expenseMessage = $("expenseMessage");
const expenseList = $("expenseList");
const expenseDate = $("expenseDate");
const expenseCategory = $("expenseCategory");
const expenseDescription = $("expenseDescription");
const expenseAmount = $("expenseAmount");
const expensePayment = $("expensePayment");
const barberReportNav = $("barberReportNav");
const barberReportPeriod = $("barberReportPeriod");
const barberReportDate = $("barberReportDate");
const barberReportBarber = $("barberReportBarber");
const barberReportRange = $("barberReportRange");
const barberReportMessage = $("barberReportMessage");
const barberReportTotal = $("barberReportTotal");
const barberReportCount = $("barberReportCount");
const barberReportList = $("barberReportList");
const refreshBarberReportBtn = $("refreshBarberReportBtn");
const financeReportNav = $("financeReportNav");
const financeReportPeriod = $("financeReportPeriod");
const financeReportDate = $("financeReportDate");
const financeReportRange = $("financeReportRange");
const financeReportMessage = $("financeReportMessage");
const financeServiceTotal = $("financeServiceTotal");
const financeProductTotal = $("financeProductTotal");
const financeIncomeTotal = $("financeIncomeTotal");
const financeExpenseTotal = $("financeExpenseTotal");
const financeProfitTotal = $("financeProfitTotal");
const financeBreakdown = $("financeBreakdown");
const financeExpenseCategories = $("financeExpenseCategories");
const refreshFinanceReportBtn = $("refreshFinanceReportBtn");
const combinedProductSelect = $("combinedProductSelect");
const combinedProductQuantity = $("combinedProductQuantity");
const combinedSalePreview = $("combinedSalePreview");
const cashierReportDate = $("cashierReportDate");
const cashierReportMessage = $("cashierReportMessage");
const cashierReportOutput = $("cashierReportOutput");
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
function isCashier() { return currentProfile?.role === "kasir"; }
function canAccessPage(page) {
  const role = currentProfile?.role;
  if (["owner", "admin"].includes(role)) return true;
  if (role === "kasir") return ["dashboard", "transactions", "products", "product-sales", "expenses", "cashier-report"].includes(page);
  if (role === "barber") return !["payroll-settings", "barbers", "barber-report", "finance-report", "payroll", "cashier-report"].includes(page);
  return false;
}
function setMessage(el, message, error = false) { el.textContent = message || ""; el.classList.toggle("error", error); el.classList.toggle("success", !error && !!message); }
function showLogin() { loginView.hidden = false; appView.hidden = true; }
function showApp() { loginView.hidden = true; appView.hidden = false; }

function showPage(page) {
  if (!canAccessPage(page)) page = "dashboard";
  document.querySelectorAll(".page").forEach(s => s.hidden = true);
  const target = $(`page-${page}`);
  if (target) target.hidden = false;
  navButtons.forEach(b => b.classList.toggle("active", b.dataset.page === page));
  const activeButton = [...navButtons].find(b => b.dataset.page === page);
  if (currentPageLabel && activeButton) currentPageLabel.textContent = activeButton.textContent.trim();
  if (menuToggleLabel) menuToggleLabel.textContent = "Menu";
  if (menuToggle) menuToggle.setAttribute("aria-expanded", "false");
  if (nav) nav.hidden = true;
  window.scrollTo({ top: 0, behavior: "auto" });
  if (page === "dashboard") loadDashboard();
  if (page === "transactions") loadTransactions();
  if (page === "services") renderServices();
  if (page === "payroll") { populatePayrollPeriods(); loadPayroll(); }
  if (page === "payroll-settings") loadPayrollSettings();
  if (page === "attendance") { initAttendance(); loadAttendance(); }
  if (page === "barbers") loadBarberManagement();
  if (page === "products") loadProducts();
  if (page === "product-sales") { loadProductsForSale(); loadProductSales(); }
  if (page === "expenses") loadExpenses();
  if (page === "cashier-report") { if (cashierReportDate && !cashierReportDate.value) cashierReportDate.value = todayLocalISO(); loadCashierReport(); }
  if (page === "barber-report") { populateBarberReportBarbers(); loadBarberReport(); }
  if (page === "finance-report") loadFinanceReport();
}
if (menuToggle && nav) {
  menuToggle.addEventListener("click", () => {
    const willOpen = nav.hidden;
    nav.hidden = !willOpen;
    menuToggle.setAttribute("aria-expanded", String(willOpen));
  });
}
navButtons.forEach(button => button.addEventListener("click", () => {
  if (!canAccessPage(button.dataset.page)) return;
  showPage(button.dataset.page);
}));

loginForm.addEventListener("submit", async event => {
  event.preventDefault(); loginError.style.display = "none";
  try {
    const { data, error } = await supabaseClient.auth.signInWithPassword({ email: $("email").value.trim(), password: $("password").value });
    if (error) throw error;
    if (!data.session) throw new Error("Login berhasil tetapi session tidak terbentuk.");
    currentUser = data.user;
    resetExpenseForm();
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
  barberReportNav.hidden = !isAdmin();
  financeReportNav.hidden = !isAdmin();
  // Kasir dapat membuka Dashboard, Transaksi Jasa, Penjualan Produk, dan Pengeluaran.
  document.querySelectorAll("#nav [data-page]").forEach(button => {
    button.hidden = !canAccessPage(button.dataset.page);
  });
  productsNav.hidden = !isAdmin() && !["barber", "kasir"].includes(data.role);
  $("productManagerCard").hidden = !isAdmin();
  $("productSalesNav").hidden = !isAdmin() && !["barber", "kasir"].includes(data.role);
  $("expensesNav").hidden = !isAdmin() && !["barber", "kasir"].includes(data.role);
  $("attendanceNav").hidden = data.role !== "barber" && !isAdmin();
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
    const { data, error } = await supabaseClient.rpc("owner_set_barber_status", {
      p_barber_id: barberId,
      p_status: isDeactivate ? "inactive" : "active"
    });
    if (error) throw error;
    if (data?.success === false) throw new Error(data.error || "Operasi gagal.");
    setMessage(barberMessage, data?.message || (isDeactivate ? "Barber dinonaktifkan." : "Barber berhasil diaktifkan kembali."));
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
  const stockActions = isCashier();
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
          <button class="ghost product-edit-btn" type="button" data-id="${esc(p.id)}">Edit Produk</button>
          <button class="${p.status === "active" ? "danger" : "ghost"} product-status-btn" type="button" data-id="${esc(p.id)}">${p.status === "active" ? "Nonaktifkan" : "Aktifkan"}</button>
        </div>` : stockActions ? `<div class="button-row">
          <button class="ghost product-stock-btn" type="button" data-id="${esc(p.id)}">Ubah Stok</button>
        </div>` : ""}
      </div>
    </div>`).join("");

  productList.querySelectorAll(".product-edit-btn").forEach(btn => btn.addEventListener("click", () => startEditProduct(btn.dataset.id)));
  productList.querySelectorAll(".product-status-btn").forEach(btn => btn.addEventListener("click", () => toggleProductStatus(btn.dataset.id)));
  productList.querySelectorAll(".product-stock-btn").forEach(btn => btn.addEventListener("click", () => updateProductStock(btn.dataset.id)));
}

async function updateProductStock(id) {
  if (!isCashier()) return;
  const product = products.find(p => p.id === id);
  if (!product) return;
  const answer = prompt(`Stok baru untuk ${product.name}:`, String(Number(product.stock || 0)));
  if (answer === null) return;
  const nextStock = Number(answer);
  if (!Number.isInteger(nextStock) || nextStock < 0) {
    alert("Stok harus berupa bilangan bulat 0 atau lebih.");
    return;
  }
  try {
    const { error } = await supabaseClient.rpc("cashier_update_product_stock", {
      p_product_id: id,
      p_stock: nextStock
    });
    if (error) throw error;
    setMessage(productMessage, `Stok ${product.name} berhasil diperbarui menjadi ${nextStock}.`);
    await loadProducts();
    await loadProductsForSale();
  } catch (error) {
    console.error(error);
    setMessage(productMessage, `Gagal mengubah stok: ${error.message || "Terjadi kesalahan."}`, true);
  }
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
    if (combinedProductSelect) {
      const previous = combinedProductSelect.value;
      combinedProductSelect.innerHTML = `<option value="">Tidak ada produk</option>` + saleProducts.map(p => `<option value="${esc(p.id)}">${esc(p.name)} — ${rupiah(p.sell_price)} (stok ${Number(p.stock || 0)})</option>`).join("");
      if (saleProducts.some(p => p.id === previous)) combinedProductSelect.value = previous;
      updateCombinedSalePreview(saleProducts);
    }
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

function todayLocalISO() {
  const d = new Date();
  const offset = d.getTimezoneOffset();
  return new Date(d.getTime() - offset * 60000).toISOString().slice(0, 10);
}

function resetExpenseForm() {
  expenseForm.reset();
  expenseDate.value = todayLocalISO();
  expenseCategory.value = "Operasional";
  expensePayment.value = "cash";
  setMessage(expenseMessage, "");
}

async function loadExpenses() {
  expenseList.innerHTML = "Memuat...";
  try {
    const { data, error } = await supabaseClient
      .from("expenses")
      .select("id, expense_date, category, description, amount, payment_method, created_by, profiles:created_by(name, email)")
      .order("expense_date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw error;
    const rows = data || [];
    expenseList.innerHTML = rows.length ? rows.map(e => `
      <div class="list-row">
        <div>
          <strong>${esc(e.description)}</strong>
          <div class="muted">${esc(e.expense_date)} • ${esc(e.category)} • ${esc(String(e.payment_method || "").toUpperCase())}</div>
          <div class="muted">${esc(e.profiles?.name || e.profiles?.email || "Pengguna")}</div>
        </div>
        <strong>${rupiah(e.amount)}</strong>
      </div>`).join("") : `<p class="muted">Belum ada pengeluaran.</p>`;
  } catch (error) {
    console.error(error);
    expenseList.innerHTML = `<p class="error">Gagal memuat pengeluaran: ${esc(error.message || "Terjadi kesalahan.")}</p>`;
  }
}

expenseForm.addEventListener("submit", async event => {
  event.preventDefault();
  const date = expenseDate.value;
  const category = expenseCategory.value;
  const description = expenseDescription.value.trim();
  const amount = Number(expenseAmount.value);
  const paymentMethod = expensePayment.value;

  if (!date || !category || !description || !Number.isFinite(amount) || amount < 0) {
    setMessage(expenseMessage, "Tanggal, kategori, keterangan, dan nominal harus diisi dengan benar.", true);
    return;
  }

  setMessage(expenseMessage, "Menyimpan pengeluaran...");
  try {
    const { error } = await supabaseClient.from("expenses").insert({
      expense_date: date,
      category,
      description,
      amount,
      payment_method: paymentMethod,
      created_by: currentUser.id
    });
    if (error) throw error;
    setMessage(expenseMessage, "Pengeluaran berhasil disimpan.");
    expenseDescription.value = "";
    expenseAmount.value = "";
    await loadExpenses();
  } catch (error) {
    console.error(error);
    setMessage(expenseMessage, `Gagal: ${error.message || "Terjadi kesalahan."}`, true);
  }
});

$("refreshExpensesBtn").addEventListener("click", loadExpenses);

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
  const options = currentProfile?.role === "barber"
    ? barbers.filter(b => b.id === currentUser?.id)
    : barbers;
  barberSelect.innerHTML = options.length ? options.map(b => `<option value="${esc(b.id)}">${esc(b.name || b.email || "Barber")}</option>`).join("") : `<option value="">Belum ada barber aktif</option>`;
  // Barber hanya dapat mencatat transaksi untuk dirinya sendiri. Kasir dan Owner/Admin bisa memilih semua barber.
  barberSelect.disabled = currentProfile?.role === "barber";
}

transactionForm.addEventListener("submit", async event => {
  event.preventDefault(); setMessage(transactionMessage, "Menyimpan transaksi...");
  let serviceSaved = false;
  try {
    if (!canAccessPage("transactions")) throw new Error("Akun ini tidak memiliki izin mencatat transaksi.");
    if (!barberSelect.value) throw new Error("Pilih barber terlebih dahulu.");
    if (currentProfile?.role === "barber" && barberSelect.value !== currentUser.id) throw new Error("Akun barber hanya dapat mencatat transaksi untuk dirinya sendiri.");
    if (!serviceSelect.value) throw new Error("Pilih layanan terlebih dahulu.");
    const productId = combinedProductSelect?.value || "";
    const quantity = Number(combinedProductQuantity?.value || 1);
    if (productId && (!Number.isInteger(quantity) || quantity < 1)) throw new Error("Jumlah produk harus minimal 1.");
    const service = services.find(x => x.id === serviceSelect.value);
    const barber = barbers.find(x => x.id === barberSelect.value);
    const { data: txData, error } = await supabaseClient.from("transactions").insert({ barber_id: barberSelect.value, service_id: serviceSelect.value, payment_method: paymentSelect.value, created_by: currentUser.id }).select("id, transaction_date, price_snapshot").single();
    if (error) throw error;
    serviceSaved = true;
    let productLine = null;
    if (productId) {
      const { data: beforeProduct, error: beforeProductError } = await supabaseClient.from("products").select("id,name,sell_price,stock,status").eq("id", productId).maybeSingle();
      if (beforeProductError) throw beforeProductError;
      if (!beforeProduct || beforeProduct.status !== "active" || Number(beforeProduct.stock || 0) < quantity) throw new Error("Produk tidak tersedia atau stok tidak mencukupi.");
      const { data, error: productError } = await supabaseClient.rpc("sell_product", { p_product_id: productId, p_quantity: quantity, p_payment_method: paymentSelect.value });
      if (productError) throw new Error(`Transaksi jasa tersimpan, tetapi penjualan produk gagal: ${productError.message}. Jangan ulangi transaksi jasa; catat produk melalui menu Penjualan Produk.`);
      if (data?.success === false) throw new Error(`Transaksi jasa tersimpan, tetapi penjualan produk gagal: ${data.message || "gagal"}. Catat produk melalui menu Penjualan Produk.`);
      productLine = { name: beforeProduct.name || "Produk", quantity, unit_price: Number(beforeProduct.sell_price || 0), total: Number(beforeProduct.sell_price || 0) * quantity };
    }
    const receiptLines = [{ name: service?.name || "Layanan", detail: barber?.name || barber?.email || "Barber", quantity: 1, total: Number(txData?.price_snapshot ?? service?.price ?? 0) }];
    if (productLine) receiptLines.push({ name: productLine.name, detail: `${productLine.quantity} × ${rupiah(productLine.unit_price)}`, quantity: productLine.quantity, total: productLine.total });
    setMessage(transactionMessage, "Transaksi berhasil disimpan.");
    printReceipt({ title: "NOTA TRANSAKSI", date: txData?.transaction_date || new Date().toISOString(), payment: paymentSelect.value, lines: receiptLines, total: receiptLines.reduce((sum, x) => sum + x.total, 0) });
    if (combinedProductSelect) combinedProductSelect.value = "";
    if (combinedProductQuantity) combinedProductQuantity.value = "1";
    await Promise.all([loadTransactions(), loadDashboard(), loadProductsForSale(), loadProductSales(), loadProducts()]);
  } catch (error) {
    console.error(error);
    setMessage(transactionMessage, `Gagal: ${error.message || "Terjadi kesalahan."}`, true);
    if (serviceSaved && combinedProductSelect?.value) setMessage(transactionMessage, `PERHATIAN: jasa sudah tersimpan, tetapi produk mungkin belum. ${error.message || "Periksa penjualan produk sebelum mengulang."}`, true);
  }
});
if (combinedProductSelect) combinedProductSelect.addEventListener("change", async () => {
  const { data } = await supabaseClient.from("products").select("id,name,sell_price,stock,status").eq("status", "active").gt("stock", 0).order("name");
  updateCombinedSalePreview(data || []);
});
if (combinedProductQuantity) combinedProductQuantity.addEventListener("input", async () => {
  const { data } = await supabaseClient.from("products").select("id,name,sell_price,stock,status").eq("status", "active").gt("stock", 0).order("name");
  updateCombinedSalePreview(data || []);
});
function updateCombinedSalePreview(items) {
  if (!combinedSalePreview) return;
  const p = (items || []).find(x => x.id === combinedProductSelect?.value);
  combinedSalePreview.textContent = p ? `Tambahan: ${p.name} × ${Math.max(1, Number(combinedProductQuantity?.value || 1))} = ${rupiah(Number(p.sell_price || 0) * Math.max(1, Number(combinedProductQuantity?.value || 1)))} • Stok ${p.stock}` : "Produk opsional: pilih jika pelanggan juga membeli produk.";
}
function printReceipt(receipt) {
  const target = $("printReceipt");
  if (!target) return;
  const lines = receipt.lines || [];
  target.innerHTML = `<div class="receipt"><h2>RUANG CUKUR</h2><p>${esc(receipt.title || "NOTA")}</p><p>${esc(new Date(receipt.date).toLocaleString("id-ID"))}</p><hr>${lines.map(l => `<div class="receipt-line"><div><strong>${esc(l.name)}</strong><small>${esc(l.detail || "")}</small></div><strong>${rupiah(l.total)}</strong></div>`).join("")}<hr><div class="receipt-total"><strong>TOTAL</strong><strong>${rupiah(receipt.total || 0)}</strong></div><p>Pembayaran: ${esc(String(receipt.payment || "").toUpperCase())}</p><p>Terima kasih 🙏</p></div>`;
  document.body.classList.remove("printing-report"); document.body.classList.add("printing-receipt");
  window.onafterprint = () => document.body.classList.remove("printing-receipt");
  window.print();
}


async function getTransactions() {
  const { data, error } = await supabaseClient.from("transactions").select("id, transaction_date, created_at, price_snapshot, barber_share, owner_share, payment_method, barber_id, service_id").order("transaction_date", { ascending: false });
  if (error) throw error; return data || [];
}
async function loadTransactions() {
  try {
    // Riwayat menggabungkan transaksi jasa dan penjualan produk.
    // Penjualan produk disimpan pada product_sales, bukan di transactions.
    const [transactions, productResult] = await Promise.all([
      getTransactions(),
      supabaseClient.from("product_sales")
        .select("id, sale_date, quantity, unit_price, total_amount, payment_method, product_id, products:product_id(name), profiles:sold_by(name,email)")
        .order("sale_date", { ascending: false })
        .limit(100)
    ]);
    if (productResult.error) throw productResult.error;
    const serviceItems = (transactions || []).map(t => {
      const barber = barbers.find(x => x.id === t.barber_id);
      const service = services.find(x => x.id === t.service_id);
      return {
        kind: "service",
        timestamp: t.transaction_date || t.created_at,
        html: `<div class="list-row"><div><strong>${esc(service?.name || "Layanan")}</strong><div class="muted">${esc(barber?.name || barber?.email || "Barber")} • ${new Date(t.transaction_date || t.created_at).toLocaleString("id-ID")}</div><div class="muted">${esc(String(t.payment_method || "").toUpperCase())}</div><div class="history-actions"><button class="ghost history-edit-service" data-id="${esc(t.id)}" type="button">Edit</button><button class="danger history-delete-service" data-id="${esc(t.id)}" type="button">Hapus</button><button class="ghost history-print-service" data-id="${esc(t.id)}" type="button">Cetak Nota</button></div></div><div class="right"><strong>${rupiah(t.price_snapshot)}</strong><div class="muted">Barber ${rupiah(t.barber_share)}</div></div></div>`
      };
    });
    const productItems = (productResult.data || []).map(s => ({
      kind: "product",
      timestamp: s.sale_date,
      html: `<div class="list-row"><div><strong>Produk: ${esc(s.products?.name || "Produk")}</strong><div class="muted">${Number(s.quantity || 0)} × ${rupiah(s.unit_price)} • ${new Date(s.sale_date).toLocaleString("id-ID")}</div><div class="muted">${esc(String(s.payment_method || "").toUpperCase())}${s.profiles?.name ? ` • Kasir ${esc(s.profiles.name)}` : ""}</div><div class="history-actions"><button class="ghost history-edit-product" data-id="${esc(s.id)}" type="button">Edit</button><button class="danger history-delete-product" data-id="${esc(s.id)}" type="button">Hapus</button><button class="ghost history-print-product" data-id="${esc(s.id)}" type="button">Cetak Nota</button></div></div><div class="right"><strong>${rupiah(s.total_amount ?? Number(s.unit_price || 0) * Number(s.quantity || 0))}</strong><div class="muted">Penjualan produk</div></div></div>`
    }));
    const allItems = [...serviceItems, ...productItems]
      .sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime())
      .slice(0, 100);
    transactionList.innerHTML = allItems.length
      ? allItems.map(item => item.html).join("")
      : `<p class="muted">Belum ada transaksi.</p>`;
    const canEdit = ["owner", "kasir", "barber"].includes(currentProfile?.role);
    transactionList.querySelectorAll(".history-edit-service, .history-delete-service, .history-edit-product, .history-delete-product").forEach(b => b.hidden = !canEdit);
    transactionList.querySelectorAll(".history-edit-service").forEach(b => b.addEventListener("click", () => editServiceTransaction(b.dataset.id)));
    transactionList.querySelectorAll(".history-delete-service").forEach(b => b.addEventListener("click", () => deleteHistoryItem("transactions", b.dataset.id)));
    transactionList.querySelectorAll(".history-edit-product").forEach(b => b.addEventListener("click", () => editProductSale(b.dataset.id)));
    transactionList.querySelectorAll(".history-delete-product").forEach(b => b.addEventListener("click", () => deleteHistoryItem("product_sales", b.dataset.id)));
    const resetBtn = $("resetTransactionsBtn");
    if (resetBtn) resetBtn.hidden = currentProfile?.role !== "owner";
  } catch (error) {
    transactionList.innerHTML = `<p class="error">Gagal memuat riwayat transaksi: ${esc(error.message || "Terjadi kesalahan")}</p>`;
  }
}


function openReceiptWindow() {
  // Open synchronously from the tap handler so iOS Safari does not block it.
  let win = null;
  try {
    win = window.open("about:blank", "_blank");
  } catch (error) {
    console.error("Tidak dapat membuka jendela nota:", error);
  }
  if (!win) {
    alert("Safari tidak membuka halaman nota. Pastikan tombol ditekan langsung, lalu izinkan pop-up untuk ruang-cukur.vercel.app di Pengaturan Safari.");
    return null;
  }
  win.document.open();
  win.document.write(`<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Nota Ruang Cukur</title>
  <style>
  *{box-sizing:border-box}body{font:14px -apple-system,BlinkMacSystemFont,Arial,sans-serif;color:#111;margin:0;padding:12px}
  .receipt{width:72mm;max-width:100%;margin:0 auto}.center{text-align:center}hr{border:0;border-top:1px dashed #777;margin:10px 0}
  .line{display:flex;justify-content:space-between;gap:8px;margin:8px 0}.small{font-size:12px;color:#444}.total{font-weight:700;font-size:16px}
  .actions{display:flex;gap:8px;justify-content:center;margin:16px auto}.actions button{padding:10px 16px;border:0;border-radius:8px;background:#111;color:#fff;font-size:16px}
  @media print{.actions{display:none}body{padding:0}@page{size:auto;margin:5mm}}
  </style></head><body><main id="receipt" class="receipt"><p>Memuat nota...</p></main>
  <div class="actions"><button onclick="window.print()">Cetak Nota</button><button onclick="window.close()">Tutup</button></div>
  </body></html>`);
  win.document.close();
  return win;
}
function fillReceiptWindow(win, receipt) {
  const lines = receipt.lines || [];
  const root = win.document.getElementById("receipt");
  if (!root) return;
  root.innerHTML = `<div class="center"><h2>RUANG CUKUR</h2><strong>${esc(receipt.title || "NOTA TRANSAKSI")}</strong><p>${esc(new Date(receipt.date || Date.now()).toLocaleString("id-ID"))}</p></div><hr>
    ${lines.map(l => `<div class="line"><div><strong>${esc(l.name || "")}</strong><div class="small">${esc(l.detail || "")}</div></div><strong>${rupiah(l.total || 0)}</strong></div>`).join("")}
    <hr><div class="line total"><span>TOTAL</span><span>${rupiah(receipt.total || 0)}</span></div><p>Pembayaran: ${esc(String(receipt.payment || "").toUpperCase())}</p><hr><p class="center">Terima kasih telah berkunjung 🙏</p>`;
}
async function printServiceTransaction(id) {
  const printWindow = openReceiptWindow();
  if (!printWindow) return;
  const { data: row, error } = await supabaseClient.from("transactions")
    .select("id, transaction_date, created_at, price_snapshot, payment_method, barber_id, service_id")
    .eq("id", id).single();
  if (error) {
    printWindow.close();
    alert("Gagal memuat nota: " + error.message);
    return;
  }
  const service = services.find(x => x.id === row.service_id);
  const barber = barbers.find(x => x.id === row.barber_id);
  fillReceiptWindow(printWindow, {
    title: "NOTA TRANSAKSI JASA",
    date: row.transaction_date || row.created_at,
    payment: row.payment_method,
    lines: [{ name: service?.name || "Layanan", detail: `Barber: ${barber?.name || barber?.email || "Barber"}`, total: Number(row.price_snapshot || 0) }],
    total: Number(row.price_snapshot || 0)
  });
  printWindow.focus();
}
async function printProductSale(id) {
  const printWindow = openReceiptWindow();
  if (!printWindow) return;
  const { data: row, error } = await supabaseClient.from("product_sales")
    .select("id, sale_date, quantity, unit_price, total_amount, payment_method, products(name)")
    .eq("id", id).single();
  if (error) {
    printWindow.close();
    alert("Gagal memuat nota produk: " + error.message);
    return;
  }
  const total = Number(row.total_amount ?? Number(row.unit_price || 0) * Number(row.quantity || 0));
  fillReceiptWindow(printWindow, {
    title: "NOTA PENJUALAN PRODUK",
    date: row.sale_date,
    payment: row.payment_method,
    lines: [{ name: row.products?.name || "Produk", detail: `${Number(row.quantity || 0)} × ${rupiah(row.unit_price)}`, total }],
    total
  });
  printWindow.focus();
}

function canCorrectTransactions() { return ["owner", "kasir", "barber"].includes(currentProfile?.role); }
async function editServiceTransaction(id) {
  if (!canCorrectTransactions()) return;
  const { data: row, error } = await supabaseClient.from("transactions").select("id, service_id, barber_id, payment_method").eq("id", id).single();
  if (error) { alert("Gagal membaca transaksi: " + error.message); return; }
  const currentService = services.find(x => x.id === row.service_id);
  const serviceName = prompt("Nama layanan baru (ketik persis):\n" + services.map(x => x.name).join("\n"), currentService?.name || "");
  if (serviceName === null) return;
  const service = services.find(x => x.name.toLowerCase() === serviceName.trim().toLowerCase());
  if (!service) { alert("Nama layanan tidak cocok dengan daftar layanan."); return; }
  let barber = barbers.find(x => x.id === row.barber_id);
  if (currentProfile?.role === "owner") {
    const barberName = prompt("Nama barber baru (ketik persis):\n" + barbers.map(x => x.name || x.email).join("\n"), barber?.name || barber?.email || "");
    if (barberName === null) return;
    barber = barbers.find(x => (x.name || x.email || "").toLowerCase() === barberName.trim().toLowerCase());
    if (!barber) { alert("Nama barber tidak cocok."); return; }
  }
  const payment = prompt("Metode pembayaran: cash, qris, atau transfer", row.payment_method || "cash");
  if (payment === null) return;
  if (!["cash", "qris", "transfer"].includes(payment.trim().toLowerCase())) { alert("Metode pembayaran tidak valid."); return; }
  const { error: updateError } = await supabaseClient.from("transactions").update({ service_id: service.id, barber_id: barber.id, payment_method: payment.trim().toLowerCase() }).eq("id", id);
  if (updateError) { alert("Gagal mengedit transaksi: " + updateError.message); return; }
  alert("Transaksi diperbarui. Periksa nilai harga dan pembagian barber/owner sebelum menutup laporan.");
  await Promise.all([loadTransactions(), loadDashboard()]);
}
async function editProductSale(id) {
  if (!canCorrectTransactions()) return;
  const { data: row, error } = await supabaseClient.from("product_sales").select("id, quantity, unit_price, payment_method").eq("id", id).single();
  if (error) { alert("Gagal membaca penjualan produk: " + error.message); return; }
  const q = prompt("Jumlah produk baru:", String(row.quantity));
  if (q === null) return;
  const quantity = Number(q);
  if (!Number.isInteger(quantity) || quantity < 1) { alert("Jumlah harus bilangan bulat minimal 1."); return; }
  const payment = prompt("Metode pembayaran: cash, qris, atau transfer", row.payment_method || "cash");
  if (payment === null) return;
  if (!["cash", "qris", "transfer"].includes(payment.trim().toLowerCase())) { alert("Metode pembayaran tidak valid."); return; }
  const { error: updateError } = await supabaseClient.from("product_sales").update({ quantity, total_amount: quantity * Number(row.unit_price), payment_method: payment.trim().toLowerCase() }).eq("id", id);
  if (updateError) { alert("Gagal mengedit penjualan produk: " + updateError.message); return; }
  alert("Penjualan produk diperbarui. Periksa stok barang setelah koreksi.");
  await Promise.all([loadTransactions(), loadDashboard(), loadProducts()]);
}
async function deleteHistoryItem(table, id) {
  if (!canCorrectTransactions()) return;
  if (!confirm("Yakin menghapus transaksi ini? Stok produk perlu diperiksa setelah menghapus penjualan.")) return;
  const { error } = await supabaseClient.from(table).delete().eq("id", id);
  if (error) { alert("Gagal menghapus transaksi: " + error.message); return; }
  await Promise.all([loadTransactions(), loadDashboard(), loadProducts(), loadProductSales()]);
}
async function resetAllTransactions() {
  if (currentProfile?.role !== "owner") return;
  const confirmation = prompt('RESET SEMUA TRANSAKSI akan menghapus transaksi jasa dan penjualan produk. Layanan, produk, akun, pengeluaran dan payroll tidak dihapus. Ketik RESET untuk melanjutkan.');
  if (confirmation !== "RESET") return;
  const { error } = await supabaseClient.rpc("owner_reset_transactions");
  if (error) { alert("Reset gagal: " + error.message); return; }
  alert("Transaksi jasa dan penjualan produk berhasil direset.");
  await Promise.all([loadTransactions(), loadDashboard(), loadProductSales(), loadProducts()]);
}

// Manajemen akun kasir menggunakan Edge Function dengan validasi role Owner/Admin di server.
const ownerCashierTools = $("ownerCashierTools");
const addCashierBtn = $("addCashierBtn");
const cashierForm = $("cashierForm");
const cashierMessage = $("cashierMessage");
if (addCashierBtn) addCashierBtn.addEventListener("click", () => { cashierForm.hidden = !cashierForm.hidden; });
if ($("cancelCashierBtn")) $("cancelCashierBtn").addEventListener("click", () => { cashierForm.reset(); cashierForm.hidden = true; setMessage(cashierMessage, ""); });
if (cashierForm) cashierForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  setMessage(cashierMessage, "Membuat akun kasir...");
  const { data: sessionData } = await supabaseClient.auth.getSession();
  const token = sessionData?.session?.access_token;
  if (!token) { setMessage(cashierMessage, "Sesi login tidak ditemukan. Silakan login ulang.", true); return; }
  try {
    const { data, error } = await supabaseClient.functions.invoke("create-cashier", {
      body: { name: $("cashierName").value.trim(), email: $("cashierEmail").value.trim(), password: $("cashierPassword").value },
      headers: { Authorization: `Bearer ${token}` }
    });
    if (error) throw error;
    if (!data?.success) throw new Error(data?.error || "Akun kasir gagal dibuat.");
    cashierForm.reset(); cashierForm.hidden = true;
    setMessage(cashierMessage, `Akun kasir ${data.email} berhasil dibuat.`);
  } catch (error) {
    setMessage(cashierMessage, `Gagal membuat kasir: ${error.message}. Pastikan Edge Function create-cashier sudah dipasang.`, true);
  }
});

async function loadCashierReport() {
  if (!cashierReportDate?.value) return;
  setMessage(cashierReportMessage, "Memuat laporan...");
  cashierReportOutput.innerHTML = "Memuat...";
  try {
    const date = cashierReportDate.value;
    const [{ data: tx, error: txErr }, { data: ps, error: psErr }, { data: ex, error: exErr }] = await Promise.all([
      supabaseClient.from("transactions").select("id,transaction_date,price_snapshot,payment_method,barber_id,service_id").gte("transaction_date", `${date}T00:00:00`).lt("transaction_date", `${date}T23:59:59.999`).order("transaction_date"),
      supabaseClient.from("product_sales").select("id,sale_date,quantity,unit_price,total_amount,payment_method,product_id,products:product_id(name)").gte("sale_date", `${date}T00:00:00`).lt("sale_date", `${date}T23:59:59.999`).order("sale_date"),
      supabaseClient.from("expenses").select("id,expense_date,category,description,amount,payment_method").eq("expense_date", date).order("created_at")
    ]);
    if (txErr) throw txErr; if (psErr) throw psErr; if (exErr) throw exErr;
    const servicesTotal = (tx || []).reduce((a,x)=>a+Number(x.price_snapshot||0),0);
    const productsTotal = (ps || []).reduce((a,x)=>a+Number(x.total_amount||Number(x.unit_price||0)*Number(x.quantity||0)),0);
    const expensesTotal = (ex || []).reduce((a,x)=>a+Number(x.amount||0),0);
    const salesCount = (tx||[]).length + (ps||[]).length;
    const serviceRows = (tx||[]).map(x=>{const b=barbers.find(y=>y.id===x.barber_id), v=services.find(y=>y.id===x.service_id); return `<div class="list-row"><div><strong>Jasa: ${esc(v?.name||"Layanan")}</strong><div class="muted">${esc(b?.name||b?.email||"Barber")} • ${new Date(x.transaction_date).toLocaleTimeString("id-ID",{hour:"2-digit",minute:"2-digit"})} • ${esc(String(x.payment_method||"").toUpperCase())}</div></div><strong>${rupiah(x.price_snapshot)}</strong></div>`;});
    const productRows = (ps||[]).map(x=>{const prod=products.find(y=>y.id===x.product_id); return `<div class="list-row"><div><strong>Produk: ${esc(x.products?.name||prod?.name||"Produk")}</strong><div class="muted">${Number(x.quantity||0)} × ${rupiah(x.unit_price)} • ${new Date(x.sale_date).toLocaleTimeString("id-ID",{hour:"2-digit",minute:"2-digit"})} • ${esc(String(x.payment_method||"").toUpperCase())}</div></div><strong>${rupiah(x.total_amount||Number(x.unit_price||0)*Number(x.quantity||0))}</strong></div>`;});
    const expenseRows = (ex||[]).map(x=>`<div class="list-row"><div><strong>${esc(x.category)}</strong><div class="muted">${esc(x.description||"")} • ${esc(String(x.payment_method||"").toUpperCase())}</div></div><strong>− ${rupiah(x.amount)}</strong></div>`);
    cashierReportOutput.innerHTML = `<div class="report-print-header"><h2>RUANG CUKUR — LAPORAN TUTUP TOKO</h2><p>Tanggal: ${esc(date)}</p></div><div class="stats"><div class="stat"><span>Omzet jasa</span><b>${rupiah(servicesTotal)}</b></div><div class="stat"><span>Penjualan produk</span><b>${rupiah(productsTotal)}</b></div><div class="stat"><span>Total penjualan</span><b>${rupiah(servicesTotal+productsTotal)}</b></div><div class="stat"><span>Pengeluaran</span><b>${rupiah(expensesTotal)}</b></div></div><h3>Transaksi Jasa (${(tx||[]).length})</h3>${serviceRows.join("")||'<p class="muted">Tidak ada transaksi jasa.</p>'}<h3>Penjualan Produk (${(ps||[]).length})</h3>${productRows.join("")||'<p class="muted">Tidak ada penjualan produk.</p>'}<h3>Pengeluaran (${(ex||[]).length})</h3>${expenseRows.join("")||'<p class="muted">Tidak ada pengeluaran.</p>'}<hr><div class="list-row"><strong>Penjualan bersih setelah pengeluaran (sebelum biaya lain)</strong><strong>${rupiah(servicesTotal+productsTotal-expensesTotal)}</strong></div><p class="muted">Jumlah catatan penjualan: ${salesCount}. Laporan ini menggabungkan catatan jasa, produk, dan pengeluaran yang tersimpan pada tanggal tersebut.</p>`;
    setMessage(cashierReportMessage, `Laporan ${date} berhasil dimuat.`);
  } catch(error) { cashierReportOutput.innerHTML = `<p class="error">Gagal memuat laporan: ${esc(error.message||"Terjadi kesalahan")}</p>`; setMessage(cashierReportMessage, "Periksa izin SELECT untuk transactions, product_sales, dan expenses.", true); }
}
$("loadCashierReportBtn")?.addEventListener("click", loadCashierReport);
$("printCashierReportBtn")?.addEventListener("click", () => { if (!cashierReportOutput?.textContent.trim() || cashierReportOutput.textContent.includes("Memuat")) { setMessage(cashierReportMessage,"Tampilkan laporan terlebih dahulu.",true); return; } document.body.classList.remove("printing-receipt"); document.body.classList.add("printing-report"); window.onafterprint = () => document.body.classList.remove("printing-report"); window.print(); });

async function loadDashboard() {
  if (ownerCashierTools) ownerCashierTools.hidden = !isAdmin();
  try {
    const transactions = await getTransactions(); const now = new Date();
    const today = transactions.filter(t => { const d = new Date(t.transaction_date); return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate(); });
    const omzet = today.reduce((a,t) => a + Number(t.price_snapshot || 0), 0);
    const barber = today.reduce((a,t) => a + Number(t.barber_share || 0), 0);
    const owner = today.reduce((a,t) => a + Number(t.owner_share || 0), 0);
    statOmzet.textContent = rupiah(omzet); statCount.textContent = today.length;
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
    const methodLabel = method === "profit_share_50_50" ? "Bagi hasil 50:50" : method === "daily_plus_commission" ? "Gaji harian + komisi" : "Gaji pokok + bonus";
    payrollSummary.innerHTML = `<div class="stat"><span>Omzet jasa</span><b>${rupiah(turnover)}</b></div><div class="stat"><span>Total payroll</span><b>${rupiah(total)}</b></div><div class="stat"><span>Metode</span><b>${methodLabel}</b></div><div class="stat"><span>Barber</span><b>${data.length}</b></div>`;
    payrollList.innerHTML = data.map(p => { const detail = p.payroll_method === "daily_plus_commission" ? `${Number(p.attendance_days||0)} hari hadir × ${rupiah(p.daily_rate)} • ${Number(p.commission_heads||0)} pelanggan × ${rupiah(p.commission_rate)}` : p.payroll_method === "profit_share_50_50" ? `Bagi hasil ${rupiah(p.share_amount)}` : `Bonus ${rupiah(p.bonus_amount)}`; const action = p.status === "draft" ? `<button type="button" class="ghost" data-payroll-status="approved" data-payroll-id="${p.id}">Setujui</button>` : p.status === "approved" ? `<button type="button" class="ghost" data-payroll-status="paid" data-payroll-id="${p.id}">Tandai dibayar</button>` : ""; return `<div class="list-row"><div><strong>${esc(p.profiles?.name || p.profiles?.email || "Barber")}</strong><div class="muted">${esc(p.status.toUpperCase())} • ${detail}</div></div><div class="right"><strong>${rupiah(p.total_salary)}</strong><div>${action}</div></div></div>`; }).join("");
  } catch (error) { payrollList.innerHTML = `<p class="error">Gagal memuat payroll: ${esc(error.message)}</p>`; }
}

payrollList.addEventListener("click", async event => {
  const button = event.target.closest("[data-payroll-status]"); if (!button || !isAdmin()) return;
  const nextStatus = button.dataset.payrollStatus;
  const promptText = nextStatus === "approved" ? "Setujui payroll ini? Pastikan nominal sudah diperiksa." : "Tandai payroll ini sudah dibayar?";
  if (!confirm(promptText)) return;
  try {
    const { error } = await supabaseClient.from("payroll").update({ status: nextStatus, updated_at: new Date().toISOString() }).eq("id", button.dataset.payrollId).eq("status", nextStatus === "approved" ? "draft" : "approved");
    if (error) throw error; await loadPayroll();
  } catch (error) { setMessage(payrollMessage, `Gagal memperbarui status: ${error.message}`, true); }
});

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
    settingsList.innerHTML = payrollSettings.length ? payrollSettings.map(s => `<div class="list-row"><div><strong>${esc(s.name)}</strong><div class="muted">${s.effective_from} ${s.effective_to ? `s/d ${s.effective_to}` : "→ sekarang"}</div><div class="muted">${s.method === "profit_share_50_50" ? `Bagi hasil ${(Number(s.barber_share_rate)*100).toFixed(1)}% / ${(Number(s.owner_share_rate)*100).toFixed(1)}%` : s.method === "daily_plus_commission" ? `Gaji ${rupiah(s.daily_rate)}/hari + ${rupiah(s.commission_rate)}/pelanggan` : `Gaji ${rupiah(s.base_salary)} • threshold ${rupiah(s.turnover_threshold)} • bonus ${(Number(s.bonus_rate)*100).toFixed(1)}%`}</div></div><span class="badge">${esc(s.status)}</span></div>`).join("") : `<p class="muted">Belum ada aturan.</p>`;
  } catch (error) { settingsList.innerHTML = `<p class="error">Gagal memuat aturan: ${esc(error.message)}</p>`; }
}

function toggleSettingFields() {
  const method = $("settingMethod").value;
  $("bonusFields").hidden = method !== "base_plus_turnover_bonus";
  $("shareFields").hidden = method !== "profit_share_50_50";
  $("dailyFields").hidden = method !== "daily_plus_commission";
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
      barber_share_rate: method === "profit_share_50_50" ? barberRate : (method === "daily_plus_commission" ? 0 : 0.5),
      owner_share_rate: method === "profit_share_50_50" ? ownerRate : (method === "daily_plus_commission" ? 0 : 0.5),
      daily_rate: method === "daily_plus_commission" ? Number($("settingDailyRate").value || 60000) : 60000,
      commission_rate: method === "daily_plus_commission" ? Number($("settingCommissionRate").value || 8000) : 8000,
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


// ======================================================
// ABSENSI BARBER MANUAL
// ======================================================
async function initAttendance() {
  if (!currentProfile) return;
  const isBarber = currentProfile.role === "barber";
  const ownName = currentProfile.full_name || currentProfile.name || currentUser.email || "Akun barber";
  if (isBarber) {
    attendanceDate.value = todayLocalISO();
    attendanceDate.max = todayLocalISO();
    attendanceDate.min = todayLocalISO();
    attendanceBarber.innerHTML = `<option value="${currentUser.id}">${esc(ownName)}</option>`;
    attendanceBarber.value = currentUser.id;
    attendanceBarber.closest("label").hidden = true;
    attendancePresent.closest("label").hidden = true;
    attendancePresent.value = "true";
    if (attendanceNotes) attendanceNotes.placeholder = "Catatan opsional";
    const submitBtn = document.querySelector('#attendanceForm button[type="submit"]');
    if (submitBtn) submitBtn.textContent = "Absen Hadir Hari Ini";
  } else if (isAdmin()) {
    if (!attendanceDate.value) attendanceDate.value = todayLocalISO();
    attendanceDate.removeAttribute("min"); attendanceDate.removeAttribute("max");
    attendanceBarber.closest("label").hidden = false;
    attendancePresent.closest("label").hidden = false;
    attendanceBarber.innerHTML = (barbers || []).map(b => `<option value="${b.id}">${esc(b.name || b.email || "Barber")}</option>`).join("");
  }
}
async function loadAttendance() {
  if ((!isAdmin() && currentProfile?.role !== "barber") || !attendanceDate.value) return;
  attendanceList.textContent = "Memuat...";
  try {
    let query = supabaseClient.from("barber_attendance").select("id, barber_id, attendance_date, present, notes").eq("attendance_date", attendanceDate.value);
    if (!isAdmin()) query = query.eq("barber_id", currentUser.id);
    const { data, error } = await query.order("created_at");
    if (error) throw error;
    const rows = data || [];
    attendanceList.innerHTML = rows.length ? rows.map(a => { const b = barbers.find(x => x.id === a.barber_id); const label = isAdmin() ? (b?.name || b?.email || "Barber") : "Absensi saya"; return `<div class="list-row"><div><strong>${esc(label)}</strong><div class="muted">${a.present ? "HADIR" : "TIDAK HADIR"}${a.notes ? ` • ${esc(a.notes)}` : ""}</div></div>${isAdmin() ? `<button type="button" class="ghost" data-attendance-delete="${a.id}">Hapus</button>` : ""}</div>`; }).join("") : `<p class="muted">Belum ada absensi pada tanggal ini.</p>`;
  } catch (error) { attendanceList.innerHTML = `<p class="error">Gagal memuat absensi: ${esc(error.message)}</p>`; }
}
attendanceDate?.addEventListener("change", loadAttendance);
$("refreshAttendanceBtn")?.addEventListener("click", loadAttendance);
$("attendanceForm")?.addEventListener("submit", async event => {
  event.preventDefault(); if (!isAdmin() && currentProfile?.role !== "barber") return;
  try {
    const isBarber = currentProfile.role === "barber";
    if (isBarber && attendanceDate.value !== todayLocalISO()) throw new Error("Barber hanya dapat absen untuk tanggal hari ini.");
    const payload = { barber_id: isBarber ? currentUser.id : attendanceBarber.value, attendance_date: attendanceDate.value, present: isBarber ? true : attendancePresent.value === "true", notes: attendanceNotes.value.trim() || null, recorded_by: currentUser.id };
    const { error } = await supabaseClient.from("barber_attendance").upsert(payload, { onConflict: "barber_id,attendance_date" });
    if (error) throw error;
    setMessage(attendanceMessage, "Absensi berhasil disimpan."); attendanceNotes.value = ""; await loadAttendance();
  } catch (error) { setMessage(attendanceMessage, `Gagal menyimpan: ${error.message}`, true); }
});
attendanceList?.addEventListener("click", async event => {
  const btn = event.target.closest("[data-attendance-delete]"); if (!btn || !isAdmin()) return;
  if (!confirm("Hapus catatan absensi ini?")) return;
  try { const { error } = await supabaseClient.from("barber_attendance").delete().eq("id", btn.dataset.attendanceDelete); if (error) throw error; await loadAttendance(); }
  catch (error) { attendanceList.insertAdjacentHTML("afterbegin", `<p class="error">Gagal menghapus: ${esc(error.message)}</p>`); }
});

// ======================================================
// LAPORAN KEUANGAN
// ======================================================
async function loadFinanceReport() {
  if (!isAdmin()) return;
  if (!financeReportDate.value) financeReportDate.value = todayLocalISO();

  setMessage(financeReportMessage, "Memuat laporan...");
  financeBreakdown.innerHTML = "Memuat...";
  financeExpenseCategories.innerHTML = "Memuat...";

  try {
    const period = financeReportPeriod.value || "month";
    const range = getReportRange(period, financeReportDate.value);

    const [{ data: txRows, error: txError }, { data: productRows, error: productError }, { data: expenseRows, error: expenseError }, { data: payrollRows, error: payrollError }] = await Promise.all([
      supabaseClient.from("transactions").select("id, transaction_date, price_snapshot"),
      supabaseClient.from("product_sales").select("id, sale_date, total_amount, quantity"),
      supabaseClient.from("expenses").select("id, expense_date, category, description, amount"),
      supabaseClient.from("payroll").select("id, period_month, total_salary, status").in("status", ["approved", "paid"])
    ]);

    if (txError) throw txError;
    if (productError) throw productError;
    if (expenseError) throw expenseError;
    if (payrollError) throw payrollError;

    const transactions = (txRows || []).filter(t => {
      const d = new Date(t.transaction_date);
      return d >= range.start && d < range.end;
    });

    const productSales = (productRows || []).filter(s => {
      const d = new Date(s.sale_date);
      return d >= range.start && d < range.end;
    });

    const expenses = (expenseRows || []).filter(e => {
      const d = parseLocalDate(String(e.expense_date).slice(0, 10));
      return d >= range.start && d < range.end;
    });

    const serviceTotal = transactions.reduce((sum, t) => sum + Number(t.price_snapshot || 0), 0);
    const productTotal = productSales.reduce((sum, s) => sum + Number(s.total_amount || 0), 0);
    const expenseTotal = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
    // Payroll dicatat sebagai biaya pada bulan payroll dan hanya dihitung setelah approved/paid.
    const payroll = (payrollRows || []).filter(p => { const d = parseLocalDate(String(p.period_month).slice(0, 10)); return d >= range.start && d < range.end; });
    const payrollTotal = payroll.reduce((sum, p) => sum + Number(p.total_salary || 0), 0);
    const incomeTotal = serviceTotal + productTotal;
    const operatingProfit = incomeTotal - expenseTotal;
    const profit = operatingProfit - payrollTotal;

    financeServiceTotal.textContent = rupiah(serviceTotal);
    financeProductTotal.textContent = rupiah(productTotal);
    financeIncomeTotal.textContent = rupiah(incomeTotal);
    financeExpenseTotal.textContent = rupiah(expenseTotal);
    financePayrollTotal.textContent = rupiah(payrollTotal);
    financeProfitTotal.textContent = rupiah(profit);
    financeReportRange.textContent = `Periode: ${formatReportRange(period, range)}`;

    financeBreakdown.innerHTML = `
      <div class="list-row"><div><strong>Transaksi jasa</strong><div class="muted">${transactions.length} transaksi</div></div><strong>${rupiah(serviceTotal)}</strong></div>
      <div class="list-row"><div><strong>Penjualan produk</strong><div class="muted">${productSales.length} transaksi</div></div><strong>${rupiah(productTotal)}</strong></div>
      <div class="list-row"><div><strong>Total pemasukan</strong></div><strong>${rupiah(incomeTotal)}</strong></div>
      <div class="list-row"><div><strong>Total pengeluaran</strong><div class="muted">${expenses.length} transaksi</div></div><strong>${rupiah(expenseTotal)}</strong></div>
      <div class="list-row"><div><strong>Laba operasional</strong><div class="muted">Pemasukan − pengeluaran operasional</div></div><strong>${rupiah(operatingProfit)}</strong></div>
      <div class="list-row"><div><strong>Biaya payroll</strong><div class="muted">Hanya payroll approved/paid (${payroll.length} baris)</div></div><strong>${rupiah(payrollTotal)}</strong></div>
      <div class="list-row"><div><strong>Laba setelah payroll</strong><div class="muted">Laba operasional − biaya payroll</div></div><strong>${rupiah(profit)}</strong></div>
    `;

    const byCategory = new Map();
    expenses.forEach(e => {
      const key = e.category || "Lainnya";
      byCategory.set(key, (byCategory.get(key) || 0) + Number(e.amount || 0));
    });
    const categoryRows = [...byCategory.entries()].sort((a, b) => b[1] - a[1]);
    financeExpenseCategories.innerHTML = categoryRows.length
      ? categoryRows.map(([category, amount]) => `<div class="list-row"><strong>${esc(category)}</strong><strong>${rupiah(amount)}</strong></div>`).join("")
      : `<p class="muted">Belum ada pengeluaran pada periode ini.</p>`;

    setMessage(financeReportMessage, "");
  } catch (error) {
    console.error(error);
    financeServiceTotal.textContent = rupiah(0);
    financeProductTotal.textContent = rupiah(0);
    financeIncomeTotal.textContent = rupiah(0);
    financeExpenseTotal.textContent = rupiah(0);
    financePayrollTotal.textContent = rupiah(0);
    financeProfitTotal.textContent = rupiah(0);
    financeBreakdown.innerHTML = `<p class="error">Gagal memuat laporan: ${esc(error.message || "Terjadi kesalahan.")}</p>`;
    financeExpenseCategories.innerHTML = "";
    setMessage(financeReportMessage, "", true);
  }
}

// ======================================================
// LAPORAN OMZET BARBER
// ======================================================
function localDateValue(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parseLocalDate(value) {
  const [y, m, d] = String(value || "").split("-").map(Number);
  if (!y || !m || !d) return new Date();
  return new Date(y, m - 1, d);
}

function startOfLocalDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function endOfLocalDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
}

function getReportRange(period, dateValue) {
  const selected = parseLocalDate(dateValue);
  let start;
  let end;

  if (period === "day") {
    start = startOfLocalDay(selected);
    end = endOfLocalDay(selected);
  } else if (period === "week") {
    // Senin = awal minggu, Minggu = akhir minggu.
    const day = selected.getDay(); // Minggu=0 ... Sabtu=6
    const daysFromMonday = day === 0 ? 6 : day - 1;
    start = new Date(selected.getFullYear(), selected.getMonth(), selected.getDate() - daysFromMonday);
    end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 7);
  } else if (period === "month") {
    start = new Date(selected.getFullYear(), selected.getMonth(), 1);
    end = new Date(selected.getFullYear(), selected.getMonth() + 1, 1);
  } else {
    start = new Date(selected.getFullYear(), 0, 1);
    end = new Date(selected.getFullYear() + 1, 0, 1);
  }

  return { start, end };
}

function formatReportDate(date) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(date);
}

function formatReportRange(period, range) {
  if (period === "day") {
    return formatReportDate(range.start);
  }
  if (period === "week") {
    const lastDay = new Date(range.end.getFullYear(), range.end.getMonth(), range.end.getDate() - 1);
    return `${formatReportDate(range.start)} – ${formatReportDate(lastDay)}`;
  }
  if (period === "month") {
    return new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric" }).format(range.start);
  }
  return String(range.start.getFullYear());
}

function populateBarberReportBarbers() {
  if (!barberReportBarber) return;
  const previous = barberReportBarber.value;
  barberReportBarber.innerHTML =
    `<option value="">Semua Barber</option>` +
    barbers.map(b => `<option value="${esc(b.id)}">${esc(b.name || b.email || "Barber")}</option>`).join("");

  if (previous && barbers.some(b => b.id === previous)) {
    barberReportBarber.value = previous;
  }
}

async function loadBarberReport() {
  if (!isAdmin()) return;
  if (!barberReportDate.value) barberReportDate.value = localDateValue();

  setMessage(barberReportMessage, "Memuat laporan...");
  barberReportList.innerHTML = "Memuat...";
  try {
    const period = barberReportPeriod.value || "month";
    const range = getReportRange(period, barberReportDate.value);
    const selectedBarberId = barberReportBarber.value || "";

    const transactions = await getTransactions();
    const filtered = transactions.filter(t => {
      const d = new Date(t.transaction_date);
      const inRange = d >= range.start && d < range.end;
      const barberMatch = !selectedBarberId || t.barber_id === selectedBarberId;
      return inRange && barberMatch;
    });

    const grouped = new Map();
    barbers.forEach(b => grouped.set(b.id, {
      id: b.id,
      name: b.name || b.email || "Barber",
      count: 0,
      omzet: 0
    }));

    filtered.forEach(t => {
      if (!grouped.has(t.barber_id)) {
        grouped.set(t.barber_id, {
          id: t.barber_id,
          name: "Barber",
          count: 0,
          omzet: 0
        });
      }
      const item = grouped.get(t.barber_id);
      item.count += 1;
      item.omzet += Number(t.price_snapshot || 0);
    });

    const rows = [...grouped.values()]
      .filter(row => !selectedBarberId || row.id === selectedBarberId)
      .sort((a, b) => b.omzet - a.omzet);

    const total = filtered.reduce((sum, t) => sum + Number(t.price_snapshot || 0), 0);

    barberReportTotal.textContent = rupiah(total);
    barberReportCount.textContent = filtered.length;
    barberReportRange.textContent = `Periode: ${formatReportRange(period, range)}`;

    barberReportList.innerHTML = rows.length
      ? rows.map(row => `
          <div class="list-row report-row">
            <div>
              <strong>${esc(row.name)}</strong>
              <div class="muted">${row.count} transaksi</div>
            </div>
            <div class="right">
              <strong>${rupiah(row.omzet)}</strong>
            </div>
          </div>
        `).join("")
      : `<p class="muted">Belum ada transaksi jasa pada periode ini.</p>`;

    setMessage(barberReportMessage, "");
  } catch (error) {
    console.error(error);
    barberReportTotal.textContent = rupiah(0);
    barberReportCount.textContent = "0";
    barberReportList.innerHTML = `<p class="error">Gagal memuat laporan: ${esc(error.message || "Terjadi kesalahan.")}</p>`;
    setMessage(barberReportMessage, "", true);
  }
}



barberReportPeriod.addEventListener("change", loadBarberReport);
barberReportDate.addEventListener("change", loadBarberReport);
barberReportBarber.addEventListener("change", loadBarberReport);
refreshBarberReportBtn.addEventListener("click", loadBarberReport);

financeReportPeriod.addEventListener("change", loadFinanceReport);
financeReportDate.addEventListener("change", loadFinanceReport);
refreshFinanceReportBtn.addEventListener("click", loadFinanceReport);

async function init() {
  try {
    const { data: { session }, error } = await supabaseClient.auth.getSession(); if (error) throw error;
    if (!session) { showLogin(); return; }
    currentUser = session.user; await loadProfile(); await loadServices(); await loadBarbers(); showApp(); showPage("dashboard");
  } catch (error) { console.error(error); loginError.textContent = `ERROR INIT: ${error.message || error}`; loginError.style.display = "block"; }
}

toggleSettingFields(); init();
