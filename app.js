// ======================================================
// RUANG CUKUR - APP
// ======================================================

const { createClient } = supabase;

const supabaseClient = createClient(
  window.SUPABASE_URL,
  window.SUPABASE_PUBLISHABLE_KEY
);

// ======================================================
// ELEMENT
// ======================================================

const loginView = document.getElementById("loginView");
const appView = document.getElementById("appView");

const loginForm = document.getElementById("loginForm");
const loginError = document.getElementById("loginError");

const userLabel = document.getElementById("userLabel");
const logoutBtn = document.getElementById("logoutBtn");

const navButtons = document.querySelectorAll("[data-page]");

const statOmzet = document.getElementById("statOmzet");
const statBarber = document.getElementById("statBarber");
const statOwner = document.getElementById("statOwner");
const statCount = document.getElementById("statCount");

const recent = document.getElementById("recent");

const barberSelect = document.getElementById("barberSelect");
const serviceSelect = document.getElementById("serviceSelect");
const paymentSelect = document.getElementById("paymentSelect");

const transactionForm = document.getElementById("transactionForm");
const transactionMessage = document.getElementById("transactionMessage");
const transactionList = document.getElementById("transactionList");

const serviceList = document.getElementById("serviceList");

let currentUser = null;
let currentProfile = null;
let services = [];
let barbers = [];

// ======================================================
// FORMAT RUPIAH
// ======================================================

function rupiah(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0
  }).format(Number(value || 0));
}

// ======================================================
// ERROR
// ======================================================

function showLoginError(message) {
  loginError.textContent = message;
  loginError.style.display = "block";
}

function clearLoginError() {
  loginError.textContent = "";
  loginError.style.display = "none";
}

// ======================================================
// VIEW
// ======================================================

function showLogin() {
  loginView.hidden = false;
  appView.hidden = true;
}

function showApp() {
  loginView.hidden = true;
  appView.hidden = false;
}

// ======================================================
// NAVIGASI
// ======================================================

function showPage(page) {
  document.querySelectorAll(".page").forEach(section => {
    section.hidden = true;
  });

  const target = document.getElementById(`page-${page}`);

  if (target) {
    target.hidden = false;
  }

  navButtons.forEach(button => {
    button.classList.toggle(
      "active",
      button.dataset.page === page
    );
  });

  if (page === "dashboard") {
    loadDashboard();
  }

  if (page === "transactions") {
    loadTransactions();
  }

  if (page === "services") {
    renderServices();
  }
}

navButtons.forEach(button => {
  button.addEventListener("click", () => {
    showPage(button.dataset.page);
  });
});

// ======================================================
// LOGIN
// ======================================================

loginForm.addEventListener("submit", async event => {
  event.preventDefault();

  clearLoginError();

  const email = document
    .getElementById("email")
    .value
    .trim();

  const password = document
    .getElementById("password")
    .value;

  try {

    const { data, error } =
      await supabaseClient.auth.signInWithPassword({
        email,
        password
      });

    if (error) {
      throw error;
    }

    if (!data.session) {
      throw new Error(
        "Login berhasil tetapi session tidak terbentuk."
      );
    }

    currentUser = data.user;

    await loadProfile();

    showApp();

    showPage("dashboard");

  } catch (error) {

    console.error(error);

    showLoginError(
      "LOGIN ERROR: " +
      (error.message || "Terjadi kesalahan.")
    );
  }
});

// ======================================================
// PROFILE
// ======================================================

async function loadProfile() {

  const { data, error } = await supabaseClient
    .from("profiles")
    .select("*")
    .eq("id", currentUser.id)
    .single();

  if (error) {
    throw error;
  }

  currentProfile = data;

  userLabel.textContent =
    `${data.email || currentUser.email} • ${data.role}`;

  console.log("Profile:", currentProfile);
}

// ======================================================
// LOGOUT
// ======================================================

logoutBtn.addEventListener("click", async () => {

  await supabaseClient.auth.signOut();

  currentUser = null;
  currentProfile = null;

  showLogin();

});

// ======================================================
// SERVICES
// ======================================================

async function loadServices() {
  const { data, error } = await supabaseClient
    .from("services")
    .select("id, code, name, price, status")
    .order("name");

  if (error) {
    console.error("SERVICES ERROR:", error);
    throw error;
  }

services = data || [];
renderServices();
renderServiceSelect();
}

// ======================================================
// SERVICE SELECT
// ======================================================

function renderServiceSelect() {

  serviceSelect.innerHTML = "";

  if (services.length === 0) {

    serviceSelect.innerHTML =
      `<option value="">Belum ada layanan</option>`;

    return;
  }

  services.forEach(service => {

    const option =
      document.createElement("option");

    option.value = service.id;

    option.textContent =
      `${service.name} — ${rupiah(service.price)}`;

    serviceSelect.appendChild(option);
  });
}

// ======================================================
// SERVICE PAGE
// ======================================================

function renderServices() {

  if (!serviceList) return;

  if (services.length === 0) {

    serviceList.innerHTML =
      `<p class="muted">Belum ada layanan.</p>`;

    return;
  }

  serviceList.innerHTML = services
    .map(service => `
      <div class="list-row">
        <div>
          <strong>${service.name}</strong>
        </div>

        <strong>
          ${rupiah(service.price)}
        </strong>
      </div>
    `)
    .join("");
}

// ======================================================
// BARBERS
// ======================================================

async function loadBarbers() {

  const { data, error } = await supabaseClient
    .from("profiles")
    .select("id,name,email,role,status")
    .eq("role", "barber")
    .eq("status", "active")
    .order("name");

  if (error) {
    throw error;
  }

  barbers = data || [];

  renderBarberSelect();
}

// ======================================================
// BARBER SELECT
// ======================================================

function renderBarberSelect() {

  barberSelect.innerHTML = "";

  if (barbers.length === 0) {

    barberSelect.innerHTML =
      `<option value="">Belum ada barber aktif</option>`;

    return;
  }

  barbers.forEach(barber => {

    const option =
      document.createElement("option");

    option.value = barber.id;

    option.textContent =
      barber.name ||
      barber.email ||
      "Barber";

    barberSelect.appendChild(option);
  });
}

// ======================================================
// TRANSACTION
// ======================================================

transactionForm.addEventListener(
  "submit",
  async event => {

    event.preventDefault();

    transactionMessage.textContent =
      "Menyimpan transaksi...";

    try {

      const barberId =
        barberSelect.value;

      const serviceId =
        serviceSelect.value;

      const paymentMethod =
        paymentSelect.value;

      if (!barberId) {
        throw new Error(
          "Pilih barber terlebih dahulu."
        );
      }

      if (!serviceId) {
        throw new Error(
          "Pilih layanan terlebih dahulu."
        );
      }

      const { error } =
        await supabaseClient
          .from("transactions")
          .insert({
            barber_id: barberId,
            service_id: serviceId,
            payment_method: paymentMethod,
            created_by: currentUser.id
          });

      if (error) {
        throw error;
      }

      transactionMessage.textContent =
        "Transaksi berhasil disimpan.";

      transactionMessage.classList.remove("error");

      await loadTransactions();
      await loadDashboard();

    } catch (error) {

      console.error(error);

      transactionMessage.textContent =
        "Gagal: " +
        (error.message || "Terjadi kesalahan.");

      transactionMessage.classList.add("error");
    }
  }
);

// ======================================================
// TRANSACTIONS
// ======================================================

async function getTransactions() {

  const { data, error } =
    await supabaseClient
      .from("transactions")
      .select(`
        id,
        created_at,
        price_snapshot,
        barber_share,
        owner_share,
        payment_method,
        barber_id,
        service_id
      `)
      .order("created_at", {
        ascending: false
      });

  if (error) {
    throw error;
  }

  return data || [];
}

// ======================================================
// TRANSACTION LIST
// ======================================================

async function loadTransactions() {

  try {

    const transactions =
      await getTransactions();

    if (transactions.length === 0) {

      transactionList.innerHTML =
        `<p class="muted">
          Belum ada transaksi.
        </p>`;

      return;
    }

    transactionList.innerHTML =
      transactions
        .slice(0, 50)
        .map(transaction => {

          const barber =
            barbers.find(
              item =>
                item.id === transaction.barber_id
            );

          const service =
            services.find(
              item =>
                item.id === transaction.service_id
            );

          const date =
            new Date(
              transaction.created_at
            ).toLocaleString("id-ID");

          return `
            <div class="list-row">

              <div>
                <strong>
                  ${service?.name || "Layanan"}
                </strong>

                <div class="muted">
                  ${barber?.name ||
                    barber?.email ||
                    "Barber"}
                  • ${date}
                </div>

                <div class="muted">
                  ${transaction.payment_method.toUpperCase()}
                </div>
              </div>

              <div>
                <strong>
                  ${rupiah(transaction.price_snapshot)}
                </strong>

                <div class="muted">
                  Barber ${rupiah(transaction.barber_share)}
                </div>
              </div>

            </div>
          `;
        })
        .join("");

  } catch (error) {

    console.error(error);

    transactionList.innerHTML =
      `<p class="error">
        Gagal memuat transaksi:
        ${error.message}
      </p>`;
  }
}

// ======================================================
// DASHBOARD
// ======================================================

async function loadDashboard() {

  try {

    const transactions =
      await getTransactions();

    // Tanggal hari ini berdasarkan waktu perangkat
    const now = new Date();

    const startOfDay =
      new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
      );

    const endOfDay =
      new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1
      );

    const today =
      transactions.filter(transaction => {

        const date =
          new Date(transaction.created_at);

        return (
          date >= startOfDay &&
          date < endOfDay
        );
      });

    const omzet =
      today.reduce(
        (total, item) =>
          total +
          Number(item.price_snapshot || 0),
        0
      );

    const barber =
      today.reduce(
        (total, item) =>
          total +
          Number(item.barber_share || 0),
        0
      );

    const owner =
      today.reduce(
        (total, item) =>
          total +
          Number(item.owner_share || 0),
        0
      );

    statOmzet.textContent =
      rupiah(omzet);

    statBarber.textContent =
      rupiah(barber);

    statOwner.textContent =
      rupiah(owner);

    statCount.textContent =
      today.length;

    if (today.length === 0) {

      recent.innerHTML =
        `<p class="muted">
          Belum ada transaksi hari ini.
        </p>`;

      return;
    }

    recent.innerHTML =
      today
        .slice(0, 5)
        .map(transaction => {

          const barberData =
            barbers.find(
              item =>
                item.id === transaction.barber_id
            );

          const serviceData =
            services.find(
              item =>
                item.id === transaction.service_id
            );

          return `
            <div class="list-row">

              <div>
                <strong>
                  ${serviceData?.name || "Layanan"}
                </strong>

                <div class="muted">
                  ${barberData?.name ||
                    barberData?.email ||
                    "Barber"}
                </div>
              </div>

              <strong>
                ${rupiah(transaction.price_snapshot)}
              </strong>

            </div>
          `;
        })
        .join("");

  } catch (error) {

    console.error(error);

    recent.innerHTML =
      `<p class="error">
        Gagal memuat dashboard:
        ${error.message}
      </p>`;
  }
}

// ======================================================
// INITIALIZATION
// ======================================================

async function init() {

  try {

    const {
      data: {
        session
      },
      error
    } =
      await supabaseClient.auth.getSession();

    if (error) {
      throw error;
    }

    if (!session) {

      showLogin();

      return;
    }

    currentUser =
      session.user;

    await loadProfile();

    await loadServices();

    await loadBarbers();

    showApp();

    showPage("dashboard");

  } catch (error) {

    console.error(error);

    showLoginError(
      "ERROR INIT: " +
      (error.message || error)
    );
  }
}

init();