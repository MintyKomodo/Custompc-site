// Initializes Firebase once and controls the nav (login/signup/logout visibility)
import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyANB6z6rM3lb2GZc3wTO5767fO1jB-PUjM",
  authDomain: "custompc-website.firebaseapp.com",
  projectId: "custompc-website",
  storageBucket: "custompc-website.firebasestorage.app",
  messagingSenderId: "1043646914253",
  appId: "1:1043646914253:web:aa1479531bc12745e65384",
  measurementId: "G-80H4HHCKE5"
};

// Avoid duplicate init if script loads twice
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const auth = getAuth(app);

// Nav elements (present on every page)
const loginLink  = document.getElementById("nav-login");
const signupLink = document.getElementById("nav-signup");
const logoutLink = document.getElementById("nav-logout");
const userBadge  = document.getElementById("nav-user");

onAuthStateChanged(auth, (user) => {
  if (user) {
    const name = user.displayName || user.email || "Account";
    if (userBadge) { userBadge.textContent = `Hi, ${name}`; userBadge.classList.remove("hidden"); }
    loginLink?.classList.add("hidden");
    signupLink?.classList.add("hidden");
    logoutLink?.classList.remove("hidden");
    window.isLoggedIn = true;
    window.currentUser = user;
  } else {
    userBadge?.classList.add("hidden");
    loginLink?.classList.remove("hidden");
    signupLink?.classList.remove("hidden");
    logoutLink?.classList.add("hidden");
    window.isLoggedIn = false;
    window.currentUser = null;
  }
});

logoutLink?.addEventListener("click", async () => {
  try {
    await signOut(auth);
    window.location.href = "index.html";
  } catch (e) {
    alert("Could not log out. Try again.");
  }
});
