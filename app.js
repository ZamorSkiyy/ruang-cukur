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
const payrollPeriodSelect = $("payrollPeriodSelect");
const payrollList = $("payrollList");
const payrollSummary = $("payrollSummary");
const payrollMessage = $("payrollMessage");
const settingsList = $("settingsList");
const settingsMessage = $("settingsMessage");

let currentUser = null;
let currentProfile = null;
let services = [];
let barbers = [];
let payrollSettings = [];

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
}
navButtons.forEach(button => button.addEventListener("click", () => {
  if (button.id === "payrollSettingsNav" && !isAdmin()) return;
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
  userLabel.textContent = `${data.email || currentUser.email} • ${data.role}`;
  $("payrollSettingsNav").hidden = !isAdmin();
}
logoutBtn.addEventListener("click", async () => { await supabaseClient.auth.signOut(); currentUser = null; currentProfile = null; showLogin(); });

async function loadServices() {
  const { data, error } = await supabaseClient.from("services").select("id, code, name, price, status").eq("status", "active").order("name");
  if (error) throw error;
  services = data || []; renderServices(); renderServiceSelect();
}
function renderServiceSelect() {
  serviceSelect.innerHTML = services.length ? services.map(s => `<option value="${esc(s.id)}">${esc(s.name)} — ${rupiah(s.price)}</option>`).join("") : `<option value="">Belum ada layanan</option>`;
}
function renderServices() {
  serviceList.innerHTML = services.length ? services.map(s => `<div class="list-row"><div><strong>${esc(s.name)}</strong><div class="muted">${esc(s.code || "")}</div></div><strong>${rupiah(s.price)}</strong></div>`).join("") : `<p class="muted">Belum ada layanan.</p>`;
}
async function loadBarbers() {
  const { data, error } = await supabaseClient.from("profiles").select("id,name,email,role,status").eq("role", "barber").eq("status", "active").order("name");
  if (error) throw error; barbers = data || []; renderBarberSelect();
}
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
