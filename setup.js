// Super Admin : équipe (création des comptes), catalogue, chambres. Zéro donnée en dur.
import { db, cfg, ROLES, $, esc, usd, toast, shrink, initializeApp, getApps, getAuth, createUserWithEmailAndPassword, signOut, collection, doc, onSnapshot, setDoc, addDoc, updateDoc, deleteDoc } from "./firebase.js";

export function team(el) {
  el.innerHTML = `<div class="cols"><section class="card"><h3>Créer un compte</h3><form id="uf" class="form"><select id="ut"><option>M.</option><option>Mme</option><option>Mlle</option></select><input id="un" placeholder="Nom (ex. Michka)" required><input id="ue" type="email" placeholder="E-mail" required><input id="up" type="text" placeholder="Mot de passe (6+ caractères)" minlength="6" required><select id="ur"><option value="admin">Administrateur</option><option value="gerant">Gérant</option><option value="serveur">Serveur</option></select><button class="big">Créer le compte</button></form><p class="mut">Nécessite une connexion Internet.</p></section><section class="card"><h3>Comptes</h3><div id="ul"></div></section></div>`;
  $("#uf", el).onsubmit = async e => { e.preventDefault(); const b = $("#uf button", el); b.disabled = true;
    try { // 2e instance Firebase : évite de déconnecter le Super Admin pendant la création
      const sec = getApps().find(a => a.name === "sec") || initializeApp(cfg, "sec"), sa = getAuth(sec);
      const c = await createUserWithEmailAndPassword(sa, $("#ue", el).value.trim(), $("#up", el).value); await signOut(sa);
      await setDoc(doc(db, "users", c.user.uid), { title: $("#ut", el).value, name: $("#un", el).value.trim(), email: $("#ue", el).value.trim(), role: $("#ur", el).value });
      toast("✓ Compte créé"); e.target.reset();
    } catch (x) { toast("Échec : " + (x.code === "auth/email-already-in-use" ? "e-mail déjà utilisé" : x.code || x.message), 8000); } b.disabled = false; };
  $("#ul", el).onclick = e => { const id = e.target.dataset.del; if (id && confirm("Désactiver ce compte ?")) deleteDoc(doc(db, "users", id)).then(() => toast("Compte désactivé")); };
  return [onSnapshot(collection(db, "users"), s => { $("#ul", el).innerHTML = s.docs.map(d => { const u = d.data(); return `<div class="ln"><span>${esc(u.title)} ${esc(u.name)}<small> ${esc(u.email || "")}</small></span><span class="tag">${ROLES[u.role]}</span>${u.role === "superadmin" ? "" : `<button data-del="${d.id}">Désactiver</button>`}</div>`; }).join(""); })];
}

export function catalog(el) {
  let P = [], img = "";
  el.innerHTML = `<div class="cols"><section class="card"><h3 id="ct">Ajouter un article</h3><form id="pf" class="form"><input type="hidden" id="pid"><input id="pn" placeholder="Nom" required><input id="pc" list="cl" placeholder="Catégorie (Bières, Jus, Vins, Whiskies…)" required><datalist id="cl"><option>Bières<option>Jus<option>Vins<option>Whiskies<option>Boissons alcoolisées</datalist><input id="pb" list="bl" placeholder="Marque (Bralima, Brasimba…)"><datalist id="bl"><option>Bralima<option>Brasimba</datalist><input id="pp" type="number" step="any" placeholder="Prix (USD)" required><input id="ps" type="number" placeholder="Stock" required><input id="pm" type="number" placeholder="Seuil d'alerte" value="5"><input id="pi" type="url" placeholder="Image : adresse (URL)"><input id="pf2" type="file" accept="image/*"><button class="big">Enregistrer</button></form></section><section class="card"><h3>Articles</h3><div id="pl"></div></section></div>`;
  $("#pf2", el).onchange = async e => { if (e.target.files[0]) { img = await shrink(e.target.files[0]); toast("Photo prête ✓"); } };
  $("#pf", el).onsubmit = async e => { e.preventDefault(); const id = $("#pid", el).value, old = P.find(p => p.id === id);
    const d = { name: $("#pn", el).value.trim(), cat: $("#pc", el).value.trim(), brand: $("#pb", el).value.trim(), price: +$("#pp", el).value, stock: +$("#ps", el).value, min: +$("#pm", el).value, image: img || $("#pi", el).value.trim() || old?.image || "" };
    try { id ? await updateDoc(doc(db, "products", id), d) : await addDoc(collection(db, "products"), d); toast("✓ Enregistré"); e.target.reset(); $("#pid", el).value = img = ""; $("#ct", el).textContent = "Ajouter un article"; } catch (x) { toast(x.code, 8000); } };
  $("#pl", el).onclick = e => { const t = e.target.dataset, p = P.find(x => x.id === (t.e || t.d));
    if (t.d && confirm("Supprimer cet article ?")) deleteDoc(doc(db, "products", t.d));
    if (t.e) { $("#pid", el).value = p.id; $("#pn", el).value = p.name; $("#pc", el).value = p.cat; $("#pb", el).value = p.brand || ""; $("#pp", el).value = p.price; $("#ps", el).value = p.stock; $("#pm", el).value = p.min ?? 5; $("#ct", el).textContent = "Modifier : " + p.name; scrollTo(0, 0); } };
  return [onSnapshot(collection(db, "products"), s => { P = s.docs.map(d => ({ id: d.id, ...d.data() })); $("#pl", el).innerHTML = P.map(p => `<div class="ln"><span>${esc(p.name)}<small> ${esc(p.cat)} · ${usd(p.price)} · stock ${p.stock}</small></span><span><button data-e="${p.id}">Modifier</button> <button data-d="${p.id}">✕</button></span></div>`).join(""); })];
}

/** Liste des chambres avec statut (disponible / occupée / en nettoyage). edit = le gérant peut changer le statut. */
export function roomsPanel(el, { edit, admin } = {}) {
  el.onchange = e => { if (e.target.dataset.s) updateDoc(doc(db, "rooms", e.target.dataset.s), { status: e.target.value }).catch(x => toast(x.code)); };
  el.onclick = e => { if (e.target.dataset.d && confirm("Supprimer cette chambre ?")) deleteDoc(doc(db, "rooms", e.target.dataset.d)); };
  return onSnapshot(collection(db, "rooms"), s => { el.innerHTML = s.docs.map(d => { const r = d.data(); return `<div class="ln"><span>${esc(r.name)}<small> ${esc(r.type)} · ${usd(r.price)}</small></span><span><select data-s="${d.id}" ${edit ? "" : "disabled"}>${["disponible", "occupée", "en nettoyage"].map(x => `<option ${x === r.status ? "selected" : ""}>${x}</option>`).join("")}</select>${admin ? `<button data-d="${d.id}">✕</button>` : ""}</span></div>`; }).join(""); });
}
export function rooms(el) {
  el.innerHTML = `<div class="cols"><section class="card"><h3>Nouvelle chambre</h3><form id="rf" class="form"><input id="rn" placeholder="Nom (ex. Chambre 4)" required><select id="rt"><option>Standard</option><option>VIP</option></select><input id="rp" type="number" step="any" placeholder="Prix par nuit (USD)" required><button class="big">Ajouter</button></form></section><section class="card"><h3>Chambres</h3><div id="rl"></div></section></div>`;
  $("#rf", el).onsubmit = e => { e.preventDefault(); addDoc(collection(db, "rooms"), { name: $("#rn", el).value.trim(), type: $("#rt", el).value, price: +$("#rp", el).value, status: "disponible" }).then(() => { toast("✓ Chambre ajoutée"); e.target.reset(); }).catch(x => toast(x.code)); };
  return [roomsPanel($("#rl", el), { edit: true, admin: true })];
}
