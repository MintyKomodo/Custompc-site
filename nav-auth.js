
// nav-auth.js
import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, onSnapshot, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyANB6z6rM3lb2GZc3wTO5767fO1jB-PUjM",
  authDomain: "custompc-website.firebaseapp.com",
  projectId: "custompc-website",
  storageBucket: "custompc-website.firebasestorage.app",
  messagingSenderId: "1043646914253",
  appId: "1:1043646914253:web:aa1479531bc12745e65384",
  measurementId: "G-80H4HHCKE5"

const app  = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

// --- Cart helpers (cloud) ---
async function getCloudCart(uid){
  const snap = await getDoc(doc(db, "carts", uid));
  return snap.exists() ? (snap.data().items || []) : [];
}
async function setCloudCart(uid, items){
  await setDoc(doc(db, "carts", uid), { items, updatedAt: serverTimestamp() }, { merge: true });
}

// Merge arrays of items by name+price (simple strategy)
function mergeCarts(a, b){
  // combine and collapse identical (name+price) lines
  const map = new Map();
  [...a, ...b].forEach(item=>{
    const key = `${item.name}::${item.price}`;
    map.set(key, (map.get(key)||0) + 1);
  });
  const out = [];
  for (const [k, qty] of map.entries()){
    const [name, price] = k.split("::");
    for (let i=0;i<qty;i++) out.push({ name, price: Number(price) });
  }
  return out;
}

// Expose minimal API globally
window.__cartAPI = { db, auth, getCloudCart, setCloudCart, mergeCarts };

// --- NAV state (same as before) ---
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

    // --- Cart: merge local -> cloud once on login ---
    try {
      const local = JSON.parse(localStorage.getItem('cart')||'[]');
      const cloud = await getCloudCart(user.uid);
      const merged = mergeCarts(cloud, local);
      await setCloudCart(user.uid, merged);
      localStorage.removeItem('cart'); // avoid duplicates next time
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
