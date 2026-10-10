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
  if (["payrollSettingsNav", "barbersNav", "barberReportNav", "financeReportNav"].includes(button.id) && !isAdmin()) return;
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
  // Barber hanya boleh mencatat transaksi atas namanya sendiri.
  // Owner/admin tetap dapat memilih barber mana pun yang aktif.
  if (currentProfile?.role === "barber") {
    const ownBarber = barbers.find(b => b.id === currentProfile.id);
    const ownName = ownBarber?.name || currentProfile.full_name || currentProfile.name || ownBarber?.email || currentUser?.email || "Akun barber";
    barberSelect.innerHTML = `<option value="${esc(currentProfile.id)}">${esc(ownName)}</option>`;
    barberSelect.value = currentProfile.id;
    barberSelect.disabled = true;
    barberSelect.setAttribute("aria-label", "Barber yang login");
    return;
  }
  barberSelect.disabled = false;
  barberSelect.removeAttribute("aria-label");
  barberSelect.innerHTML = barbers.length ? barbers.map(b => `<option value="${esc(b.id)}">${esc(b.name || b.email || "Barber")}</option>`).join("") : `<option value="">Belum ada barber aktif</option>`;
}

transactionForm.addEventListener("submit", async event => {
  event.preventDefault(); setMessage(transactionMessage, "Menyimpan transaksi...");
  try {
    if (!currentUser || !currentProfile) throw new Error("Sesi login belum siap. Silakan muat ulang halaman.");
    const barberId = currentProfile.role === "barber" ? currentProfile.id : barberSelect.value;
    if (!barberId) throw new Error("Pilih barber terlebih dahulu.");
    if (!serviceSelect.value) throw new Error("Pilih layanan terlebih dahulu.");
    const { error } = await supabaseClient.from("transactions").insert({ barber_id: barberId, service_id: serviceSelect.value, payment_method: paymentSelect.value, created_by: currentUser.id });
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
