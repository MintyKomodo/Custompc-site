// nav-auth.js
// Single Firebase init + nav state + cloud cart helpers + merge-on-login.

import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-auth.js";
import {
  getFirestore, doc, getDoc, setDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore.js";

/* -------- Firebase config (your project) -------- */
const firebaseConfig = {
  apiKey: "AIzaSyANB6z6rM3lb2GZc3wTO5767fO1jB-PUjM",
  authDomain: "custompc-website.firebaseapp.com",
  projectId: "custompc-website",
  storageBucket: "custompc-website.firebasestorage.app",
  messagingSenderId: "1043646914253",
  appId: "1:1043646914253:web:aa1479531bc12745e65384",
  measurementId: "G-80H4HHCKE5"
};

/* -------- Initialize ONCE -------- */
const app  = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

/* -------- Expose a promise that resolves when auth state is known -------- */
let resolveAuthReady;
window.__authReady = new Promise((res) => { resolveAuthReady = res; });

/* -------- Cloud cart helpers -------- */
async function getCloudCart(uid) {
  const snap = await getDoc(doc(db, "carts", uid));
  return snap.exists() ? (snap.data().items || []) : [];
}

async function setCloudCart(uid, items) {
  await setDoc(
    doc(db, "carts", uid),
    { items, updatedAt: serverTimestamp() },
    { merge: true }
  );
}

// Merge by name+price (simple line-item merge)
function mergeCarts(a, b) {
  const map = new Map();
  [...a, ...b].forEach(it => {
    const key = `${it.name}::${Number(it.price)}`;
    map.set(key, (map.get(key) || 0) + 1);
  });
  const out = [];
  for (const [k, qty] of map.entries()) {
    const [name, price] = k.split("::");
    for (let i = 0; i < qty; i++) out.push({ name, price: Number(price) });
  }
  return out;
}

/* -------- Make helpers available to other pages -------- */
window.__cartAPI = { db, auth, getCloudCart, setCloudCart, mergeCarts };

/* -------- Nav elements -------- */
const loginLink  = document.getElementById("nav-login");
const signupLink = document.getElementById("nav-signup");
const logoutLink = document.getElementById("nav-logout");
const userBadge  = document.getElementById("nav-user");

/* -------- Auth state + merge local->cloud on login -------- */
onAuthStateChanged(auth, async (user) => {
  // Resolve "auth ready" the first time we get any state
  if (resolveAuthReady) { resolveAuthReady(); resolveAuthReady = null; }

  if (user) {
    const name = user.displayName || user.email || "Account";
    if (userBadge) {
      userBadge.textContent = `Hi, ${name}`;
      userBadge.classList.remove("hidden");
    }
    loginLink?.classList.add("hidden");
    signupLink?.classList.add("hidden");
    logoutLink?.classList.remove("hidden");

    window.isLoggedIn = true;
    window.currentUser = user;

    // Merge any local cart into cloud once per session
    try {
      const local = JSON.parse(localStorage.getItem("cart") || "[]");
      if (local.length) {
        const cloud  = await getCloudCart(user.uid);
        const merged = mergeCarts(cloud, local);
        await setCloudCart(user.uid, merged);
        localStorage.removeItem("cart");
        console.log("[cart] merged local -> cloud");
      }
    } catch (e) {
      console.warn("[cart] merge local->cloud failed:", e);
    }
  } else {
    userBadge?.classList.add("hidden");
    loginLink?.classList.remove("hidden");
    signupLink?.classList.remove("hidden");
    logoutLink?.classList.add("hidden");

    window.isLoggedIn = false;
    window.currentUser = null;
  }
});

/* -------- Logout -------- */
logoutLink?.addEventListener("click", async () => {
  try {
    await signOut(auth);
    window.location.href = "index.html";
  } catch (e) {
    alert("Could not log out. Try again.");
  }
});
