// Point d'entrée : connexion, rôle, message de bienvenue, navigation par rôle, initialisation auto
import { auth, db, DEV_EMAIL, ROLES, SEED, ROOMS, $, esc, toast, doc, getDoc, collection, writeBatch, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "./firebase.js";
import { pos, stock } from "./ops.js"; import { dash } from "./dash.js"; import { team, catalog, rooms } from "./setup.js";
const TABS = { serveur: [["Commande", pos]], gerant: [["Commande", pos], ["Stock & billard", stock]], admin: [["Direction", dash]],
  superadmin: [["Direction", dash], ["Commande", pos], ["Stock & billard", stock], ["Équipe", team], ["Catalogue", catalog], ["Chambres", rooms]] };
let cleanup = [];
if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js");
const net = () => { $("#net").textContent = navigator.onLine ? "● En ligne" : "● Hors ligne"; $("#net").className = navigator.onLine ? "on" : "off"; };
addEventListener("online", net); addEventListener("offline", net);

$("#lf").onsubmit = async e => { e.preventDefault(); $("#le").textContent = "";
  try { await signInWithEmailAndPassword(auth, $("#em").value.trim(), $("#pw").value); } catch { $("#le").textContent = "E-mail ou mot de passe incorrect (ou pas de connexion)."; } };
$("#out").onclick = () => signOut(auth);

/** Initialisation automatique : le Super Admin crée la structure au tout premier lancement. */
async function init(u) {
  const ref = doc(db, "config", "init"); if ((await getDoc(ref)).exists()) return;
  const b = writeBatch(db); b.set(ref, { done: true }); b.set(doc(db, "config", "billiard"), { price: 1 });
  b.set(doc(db, "users", u.uid), { title: "M.", name: "Gabriel Umba", role: "superadmin", email: DEV_EMAIL });
  SEED.forEach(p => b.set(doc(collection(db, "products")), p)); ROOMS.forEach(r => b.set(doc(collection(db, "rooms")), r));
  await b.commit(); toast("✓ Base initialisée (catalogue et chambres d'exemple).", 6000);
}
onAuthStateChanged(auth, async u => {
  cleanup.forEach(f => f()); cleanup = []; $("#app").hidden = true; $("#splash").hidden = true; $("#login").hidden = !!u; if (!u) return;
  let p;
  try { if (u.email === DEV_EMAIL) { await init(u); p = { title: "M.", name: "Gabriel Umba", role: "superadmin" }; } else { const s = await getDoc(doc(db, "users", u.uid)); p = s.exists() ? s.data() : null; } } catch { p = null; }
  if (!p) { $("#login").hidden = false; $("#le").textContent = "Compte sans rôle ou données indisponibles."; return signOut(auth); }
  $("#login").hidden = true; $("#splash").hidden = false;
  $("#splash").innerHTML = `<div><h1>Bienvenue ${esc(p.title)} ${esc(p.name)}</h1><p>${ROLES[p.role]}</p></div>`;
  setTimeout(() => { $("#splash").hidden = true; start(u, p); }, 1800);
});
function start(u, p) {
  $("#app").hidden = false; $("#who").textContent = `${p.title} ${p.name} · ${ROLES[p.role]}`; net();
  const tabs = TABS[p.role] || []; $("#tabs").innerHTML = tabs.map((t, i) => `<button data-i="${i}">${t[0]}</button>`).join("");
  const open = i => { cleanup.forEach(f => f()); $("#view").innerHTML = ""; document.querySelectorAll("#tabs button").forEach((b, k) => b.classList.toggle("on", k === i)); cleanup = tabs[i][1]($("#view"), { user: u, profile: p }) || []; };
  $("#tabs").onclick = e => { const b = e.target.closest("[data-i]"); if (b) open(+b.dataset.i); }; if (tabs.length) open(0);
}
