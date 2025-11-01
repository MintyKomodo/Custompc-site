// nav-auth.js — single init + auth-ready + qty-aware cloud cart helpers.
import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore.js";

/* Firebase project */
const firebaseConfig = {
  apiKey: "AIzaSyANB6z6rM3lb2GZc3wTO5767fO1jB-PUjM",
  authDomain: "custompc-website.firebaseapp.com",
  projectId: "custompc-website",
  storageBucket: "custompc-website.firebasestorage.app",
  messagingSenderId: "1043646914253",
  appId: "1:1043646914253:web:aa1479531bc12745e65384",
  measurementId: "G-80H4HHCKE5"
};

/* Init once */
const app  = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

/* Auth-ready promise */
let resolveAuthReady;
window.__authReady = new Promise(res => { resolveAuthReady = res; });

/* ------------ Qty helpers ------------ */
function toQty(items = []) {
  // Accepts either [{name,price}] or [{name,price,qty}]
  const map = new Map();
  for (const it of items) {
    const name = it.name;
    const price = Number(it.price);
    const qty = Number(it.qty || 1);
    if (!name || isNaN(price) || isNaN(qty)) continue;
    const key = `${name}::${price}`;
    map.set(key, (map.get(key) || 0) + qty);
  }
  const out = [];
  for (const [k, q] of map.entries()) {
    const [name, price] = k.split("::");
    out.push({ name, price: Number(price), qty: q });
  }
  return out;
}
function mergeCartsQty(a = [], b = []) { return toQty([...a, ...b]); }

/* ------------ Cloud cart (doc path: /carts/{uid}) ------------ */
async function getCloudCart(uid) {
  const ref = doc(db, "carts", uid);              // <— correct path
  const snap = await getDoc(ref);
  const items = snap.exists() ? (snap.data().items || []) : [];
  return toQty(items);
}

async function setCloudCart(uid, items) {
  const ref = doc(db, "carts", uid);
  await setDoc(ref, { items: toQty(items), updatedAt: serverTimestamp() }, { merge: true });
}

async function addItemToCloud(uid, item) {
  const current = await getCloudCart(uid);
  const merged = mergeCartsQty(current, [item]);
  await setCloudCart(uid, merged);
  return merged;
}

/* Expose */
window.__cartAPI = { db, auth, getCloudCart, setCloudCart, addItemToCloud, mergeCarts: mergeCartsQty };

/* Nav links */
const loginLink  = document.getElementById("nav-login");
const signupLink = document.getElementById("nav-signup");
const logoutLink = document.getElementById("nav-logout");
const userBadge  = document.getElementById("nav-user");

/* Auth state + merge local->cloud */
onAuthStateChanged(auth, async (user) => {
  if (resolveAuthReady) { resolveAuthReady(); resolveAuthReady = null; }

  if (user) {
    const name = user.displayName || user.email || "Account";
    userBadge?.classList.remove("hidden");
    if (userBadge) userBadge.textContent = `Hi, ${name}`;
    loginLink?.classList.add("hidden");
    signupLink?.classList.add("hidden");
    logoutLink?.classList.remove("hidden");
    window.isLoggedIn = true;
    window.currentUser = user;

    try {
      const local = JSON.parse(localStorage.getItem("cart") || "[]");
      if (local.length) {
        const cloud  = await getCloudCart(user.uid);
        const merged = mergeCartsQty(cloud, local);
        await setCloudCart(user.uid, merged);
        localStorage.removeItem("cart");
        console.log("[cart] merged local -> cloud");
      }
    } catch (e) { console.warn("[cart] merge local->cloud failed:", e); }

  } else {
    userBadge?.classList.add("hidden");
    loginLink?.classList.remove("hidden");
    signupLink?.classList.remove("hidden");
    logoutLink?.classList.add("hidden");
    window.isLoggedIn = false;
    window.currentUser = null;
  }
});

/* Logout */
logoutLink?.addEventListener("click", async () => {
  try { await signOut(auth); window.location.href = "index.html"; }
  catch (e) { alert("Could not log out. Try again."); }
});
