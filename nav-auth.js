// Initializes Firebase once, controls nav state, and handles cloud cart merge-on-login.
import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyANB6z6rM3lb2GZc3wTO5767fO1jB-PUjM",
  authDomain: "custompc-website.firebaseapp.com",
  projectId: "custompc-website",
  storageBucket: "custompc-website.firebasestorage.app",
  messagingSenderId: "1043646914253",
  appId: "1:1043646914253:web:aa1479531bc12745e65384",
  measurementId: "G-80H4HHCKE5"
};
// ... existing imports & firebaseConfig ...

const app  = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

// === Add this: a promise that resolves once we know auth state ===
let _resolveAuthReady;
window.__authReady = new Promise((res) => { _resolveAuthReady = res; });

// ... (cloud cart helpers + window.__cartAPI as you already have) ...

onAuthStateChanged(auth, async (user) => {
  // resolve the ready promise the first time we get a state
  if (_resolveAuthReady) { _resolveAuthReady(); _resolveAuthReady = null; }

  if (user) {
    // ... your existing logged-in UI code ...
    // (merge local→cloud stays the same)
  } else {
    // ... your existing logged-out UI code ...
  }
});


// Avoid duplicate init
const app  = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

// --- Cloud cart helpers ---
async function getCloudCart(uid){
  const snap = await getDoc(doc(db, "carts", uid));
  return snap.exists() ? (snap.data().items || []) : [];
}
async function setCloudCart(uid, items){
  await setDoc(doc(db, "carts", uid), { items, updatedAt: serverTimestamp() }, { merge: true });
}
function mergeCarts(a, b){
  const map = new Map();
  [...a, ...b].forEach(it=>{
    const key = `${it.name}::${Number(it.price)}`;
    map.set(key, (map.get(key)||0)+1);
  });
  const out = [];
  for (const [k, qty] of map.entries()){
    const [name, price] = k.split("::");
    for (let i=0;i<qty;i++) out.push({ name, price: Number(price) });
  }
  return out;
}

// Expose minimal API for other pages
window.__cartAPI = { db, auth, getCloudCart, setCloudCart, mergeCarts };

// --- NAV state ---
const loginLink  = document.getElementById("nav-login");
const signupLink = document.getElementById("nav-signup");
const logoutLink = document.getElementById("nav-logout");
const userBadge  = document.getElementById("nav-user");

onAuthStateChanged(auth, async (user) => {
  if (user) {
    const name = user.displayName || user.email || "Account";
    userBadge?.classList.remove("hidden");
    if (userBadge) userBadge.textContent = `Hi, ${name}`;
    loginLink?.classList.add("hidden");
    signupLink?.classList.add("hidden");
    logoutLink?.classList.remove("hidden");
    window.isLoggedIn = true;
    window.currentUser = user;

    // Merge local cart into cloud on first login of a session
    try {
      const local = JSON.parse(localStorage.getItem('cart')||'[]');
      if (local.length){
        const cloud = await getCloudCart(user.uid);
        const merged = mergeCarts(cloud, local);
        await setCloudCart(user.uid, merged);
        localStorage.removeItem('cart');
      }
    } catch (e) {
      console.warn("Cart merge failed:", e);
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

logoutLink?.addEventListener("click", async () => {
  try { await signOut(auth); window.location.href = "index.html"; }
  catch (e) { alert("Could not log out. Try again."); }
});
