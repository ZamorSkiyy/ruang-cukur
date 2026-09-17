const { createClient } = window.supabase;

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);

const $ = (id) => document.getElementById(id);

let currentProfile = null;
let services = [];
let barbers = [];

// =========================
// FORMAT RUPIAH
// =========================

function rupiah(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0
  }).format(Number(value || 0));
}

// =========================
// LOGIN VIEW
// =========================

function showLogin() {
  $("loginView").hidden = false;
  $("appView").hidden = true;
}

function showApp() {
  $("loginView").hidden = true;
  $("appView").hidden = false;

  $("userLabel").textContent =
    `${currentProfile.name || currentProfile.email} • ${currentProfile.role}`;

  // Barber tidak perlu menu Layanan
  if (currentProfile.role === "barber") {
    $("servicesNav").hidden = true;
  } else {
    $("servicesNav").hidden = false;
  }
}

// =========================
// LOAD PROFILE
// =========================

async function loadProfile(user) {
  const { data, error } = await supabase
    .from("profiles")
    .select("id,name,email,role,status")
    .eq("id", user.id)
    .single();

  if (error) {
    throw error;
  }

  if (data.status !== "active") {
    throw new Error("Akun sedang tidak aktif.");
  }

  currentProfile = data;
}

// =========================
// LOAD SERVICES
// =========================

async function loadServices() {
  const { data, error } = await supabase
    .from("services")
    .select("id,code,name,price,status")
    .eq("status", "active")
    .order("price");

  if (error) {
    throw error;
  }

  services = data || [];

  const serviceSelect = $("serviceSelect");

  serviceSelect.innerHTML = services
    .map(
      (service) => `
        <option value="${service.id}">
          ${service.name} — ${rupiah(service.price)}
        </option>
      `
    )
    .join("");

  $("serviceList").innerHTML = services
    .map(
      (service) => `
        <div class="row">
          <span>
            ${service.name}
            <small>${service.code}</small>
          </span>
          <strong>${rupiah(service.price)}</strong>
        </div>
      `
    )
    .join("");
}

// =========================
// LOAD BARBERS
// =========================

async function loadBarbers() {
  if (currentProfile.role === "barber") {
    barbers = [currentProfile];
  } else {
    const { data, error } = await supabase
      .from("profiles")
      .select("id,name,email,role")
      .eq("role", "barber")
      .eq("status", "active")
      .order("name");

    if (error) {
      throw error;
    }

    barbers = data || [];
  }

  $("barberSelect").innerHTML = barbers
    .map(
      (barber) => `
        <option value="${barber.id}">
          ${barber.name || barber.email}
        </option>
      `
    )
    .join("");

  if (currentProfile.role === "barber") {
    $("barberSelect").disabled = true;
  }
}

// =========================
// LOAD TRANSACTIONS
// =========================

async function loadTransactions() {
  const { data, error } = await supabase
    .from("transactions")
    .select(`
      id,
      transaction_date,
      price_snapshot,
      barber_share,
      owner_share,
      payment_method,
      barber:profiles!transactions_barber_id_fkey(name),
      service:services!transactions_service_id_fkey(name)
    `)
    .order("transaction_date", {
      ascending: false
    })
    .limit(100);

  if (error) {
    throw error;
  }

  const transactions = data || [];

  // =========================
  // RIWAYAT
  // =========================

  if (transactions.length === 0) {
    $("transactionList").innerHTML =
      "Belum ada transaksi.";
  } else {
    $("transactionList").innerHTML =
      transactions
        .map(
          (transaction) => `
            <div class="transaction">

              <div>
                <strong>
                  ${transaction.service?.name || "-"}
                </strong>

                <small>
                  ${transaction.barber?.name || "-"}
                </small>

                <small>
                  ${new Date(
                    transaction.transaction_date
                  ).toLocaleString("id-ID")}
                </small>
              </div>

              <div class="right">
                <strong>
                  ${rupiah(transaction.price_snapshot)}
                </strong>

                <small>
                  ${String(
                    transaction.payment_method
                  ).toUpperCase()}
                </small>
              </div>

            </div>
          `
        )
        .join("");
  }

  // =========================
  // TRANSAKSI HARI INI
  // =========================

  const now = new Date();

  const startOfDay = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );

  const todayTransactions =
    transactions.filter(
      (transaction) =>
        new Date(transaction.transaction_date) >=
        startOfDay
    );

  const omzet = todayTransactions.reduce(
    (total, transaction) =>
      total + Number(transaction.price_snapshot || 0),
    0
  );

  const barberShare =
    todayTransactions.reduce(
      (total, transaction) =>
        total + Number(transaction.barber_share || 0),
      0
    );

  const ownerShare =
    todayTransactions.reduce(
      (total, transaction) =>
        total + Number(transaction.owner_share || 0),
      0
    );

  $("statOmzet").textContent = rupiah(omzet);

  $("statBarber").textContent =
    rupiah(barberShare);

  $("statOwner").textContent =
    rupiah(ownerShare);

  $("statCount").textContent =
    todayTransactions.length;

  // =========================
  // TRANSAKSI TERBARU
  // =========================

  if (todayTransactions.length === 0) {
    $("recent").textContent =
      "Belum ada transaksi hari ini.";
  } else {
    $("recent").innerHTML =
      todayTransactions
        .slice(0, 8)
        .map(
          (transaction) => `
            <div class="row">
              <span>
                ${transaction.service?.name || "-"}
                <small>
                  ${transaction.barber?.name || "-"}
                </small>
              </span>

              <strong>
                ${rupiah(transaction.price_snapshot)}
              </strong>
            </div>
          `
        )
        .join("");
  }
}

// =========================
// REFRESH DATA
// =========================

async function refreshData() {
  await loadServices();
  await loadBarbers();
  await loadTransactions();
}

// =========================
// LOGIN
// =========================

$("loginForm").addEventListener(
  "submit",
  async (event) => {
    event.preventDefault();

    $("loginError").textContent = "";

    const email =
      $("email").value.trim();

    const password =
      $("password").value;

    const { data, error } =
      await supabase.auth.signInWithPassword({
        email,
        password
      });

    if (error) {
      $("loginError").textContent =
        error.message;

      return;
    }

    try {
      await loadProfile(data.user);

      showApp();

      await refreshData();

    } catch (error) {
      await supabase.auth.signOut();

      $("loginError").textContent =
        error.message;
    }
  }
);

// =========================
// LOGOUT
// =========================

$("logoutBtn").addEventListener(
  "click",
  async () => {
    await supabase.auth.signOut();

    currentProfile = null;

    showLogin();
  }
);

// =========================
// SIMPAN TRANSAKSI
// =========================

$("transactionForm").addEventListener(
  "submit",
  async (event) => {
    event.preventDefault();

    $("transactionMessage").textContent =
      "Menyimpan transaksi...";

    $("transactionMessage").className =
      "message";

    const barberId =
      $("barberSelect").value;

    const serviceId =
      $("serviceSelect").value;

    const paymentMethod =
      $("paymentSelect").value;

    const { error } =
      await supabase
        .from("transactions")
        .insert({
          barber_id: barberId,
          service_id: serviceId,
          payment_method: paymentMethod
        });

    if (error) {
      $("transactionMessage").textContent =
        error.message;

      $("transactionMessage").className =
        "error";

      return;
    }

    $("transactionMessage").textContent =
      "Transaksi berhasil disimpan.";

    $("transactionMessage").className =
      "message success";

    await loadTransactions();
  }
);

// =========================
// NAVIGASI
// =========================

document
  .querySelectorAll("[data-page]")
  .forEach((button) => {

    button.addEventListener(
      "click",
      () => {

        document
          .querySelectorAll(".page")
          .forEach(
            (page) => {
              page.hidden = true;
            }
          );

        document
          .querySelectorAll("[data-page]")
          .forEach(
            (btn) => {
              btn.classList.remove(
                "active"
              );
            }
          );

        const page =
          $(`page-${button.dataset.page}`);

        if (page) {
          page.hidden = false;
        }

        button.classList.add("active");
      }
    );
  });

// =========================
// CEK SESSION SAAT APLIKASI DIBUKA
// =========================

async function initializeApp() {

  const {
    data,
    error
  } = await supabase.auth.getSession();

  if (error) {
    console.error(error);
    showLogin();
    return;
  }

  if (!data.session) {
    showLogin();
    return;
  }

  try {

    await loadProfile(
      data.session.user
    );

    showApp();

    await refreshData();

  } catch (error) {

    console.error(error);

    await supabase.auth.signOut();

    showLogin();

    $("loginError").textContent =
      error.message;
  }
}

initializeApp();

// =========================
// AUTH STATE
// =========================

supabase.auth.onAuthStateChange(
  (_event, session) => {

    if (!session) {

      currentProfile = null;

      showLogin();
    }
  }
);