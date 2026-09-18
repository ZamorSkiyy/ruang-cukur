const { createClient } = supabase;

let client;

const loginView = document.getElementById("loginView");
const appView = document.getElementById("appView");
const loginForm = document.getElementById("loginForm");
const loginError = document.getElementById("loginError");

function showError(message) {
  console.error(message);

  if (loginError) {
    loginError.textContent = message;
    loginError.style.display = "block";
  } else {
    alert(message);
  }
}

async function init() {
  try {
    if (!window.SUPABASE_URL) {
      throw new Error("SUPABASE_URL tidak ditemukan.");
    }

    if (!window.SUPABASE_PUBLISHABLE_KEY) {
      throw new Error("SUPABASE_PUBLISHABLE_KEY tidak ditemukan.");
    }

    client = createClient(
      window.SUPABASE_URL,
      window.SUPABASE_PUBLISHABLE_KEY
    );

    const {
      data: { session },
      error
    } = await client.auth.getSession();

    if (error) throw error;

    if (session) {
      showApp(session);
    } else {
      showLogin();
    }

  } catch (err) {
    showError("ERROR INIT: " + (err.message || err));
  }
}

function showLogin() {
  loginView.style.display = "block";
  appView.style.display = "none";
}

function showApp(session) {
  loginView.style.display = "none";
  appView.style.display = "block";

  const userLabel = document.getElementById("userLabel");

  if (userLabel) {
    userLabel.textContent = session.user.email;
  }
}

loginForm.addEventListener("submit", async function (e) {
  e.preventDefault();

  loginError.style.display = "none";
  loginError.textContent = "";

  try {
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    if (!email || !password) {
      throw new Error("Email dan password wajib diisi.");
    }

    const { data, error } = await client.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;

    if (!data.session) {
      throw new Error("Login berhasil tetapi session tidak terbentuk.");
    }

    showApp(data.session);

  } catch (err) {
    showError("LOGIN ERROR: " + (err.message || err));
  }
});

client = null;

init();