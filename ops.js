// Opérations quotidiennes : prise de commande/encaissement (serveur) et stock + billard + chambres (gérant)
import { db, DEPTS, $, esc, usd, today, toast, collection, doc, onSnapshot, writeBatch, updateDoc, setDoc, increment, serverTimestamp } from "./firebase.js";
import { roomsPanel } from "./setup.js";

export function pos(el, { user, profile }) {
  let P = [], cart = {}, dept = DEPTS[0], cat = "Tout";
  const un = onSnapshot(collection(db, "products"), s => { P = s.docs.map(d => ({ id: d.id, ...d.data() })); draw(); });
  const total = () => Object.entries(cart).reduce((t, [id, q]) => t + (P.find(p => p.id === id)?.price || 0) * q, 0);
  function draw() {
    const cats = ["Tout", ...new Set(P.map(p => p.cat))], list = P.filter(p => cat === "Tout" || p.cat === cat);
    el.innerHTML = `<div class="pos"><div><div class="chips">${DEPTS.map(d => `<button class="${d === dept ? "on" : ""}" data-d="${esc(d)}">${esc(d)}</button>`).join("")}</div>
      <div class="chips s">${cats.map(c => `<button class="${c === cat ? "on" : ""}" data-c="${esc(c)}">${esc(c)}</button>`).join("")}</div>
      <div class="grid">${list.map(p => `<button class="tile" data-p="${p.id}" ${p.stock <= 0 ? "disabled" : ""}>${p.image ? `<img src="${p.image}" alt="">` : "<span>🍾</span>"}<b>${esc(p.name)}</b><small>${esc(p.brand || p.cat)}</small><em>${usd(p.price)}</em><i class="${p.stock <= (p.min ?? 5) ? "low" : ""}">${p.stock} en stock</i></button>`).join("")}</div></div>
      <aside class="cart"><h3>Commande · ${esc(dept)}</h3>${Object.entries(cart).map(([id, q]) => { const p = P.find(x => x.id === id); return `<div class="ln"><span>${esc(p.name)}</span><span><button data-m="${id}">−</button> ${q} <button data-a="${id}">+</button></span><b>${usd(p.price * q)}</b></div>`; }).join("") || "<p class='mut'>Touchez un article pour l'ajouter.</p>"}
      <div class="tot"><span>Total</span><b>${usd(total())}</b></div><button class="big" id="pay" ${total() ? "" : "disabled"}>Encaisser</button></aside></div>`;
  }
  el.onclick = e => { const t = e.target.closest("button"); if (!t) return; const d = t.dataset;
    if (d.d) dept = d.d; else if (d.c) cat = d.c;
    else if (d.p || d.a) { const id = d.p || d.a, p = P.find(x => x.id === id); if ((cart[id] || 0) < p.stock) cart[id] = (cart[id] || 0) + 1; }
    else if (d.m) { if (--cart[d.m] <= 0) delete cart[d.m]; }
    else if (t.id === "pay") return pay();
    draw(); };
  function pay() { // Vente + décrément atomique du stock (fonctionne hors ligne, synchronisé ensuite)
    const items = Object.entries(cart).map(([id, q]) => { const p = P.find(x => x.id === id); return { id, name: p.name, cat: p.cat, price: p.price, qty: q }; });
    const b = writeBatch(db); b.set(doc(collection(db, "sales")), { serverId: user.uid, serverName: profile.name, dept, items, total: total(), day: today(), at: serverTimestamp() });
    items.forEach(i => b.update(doc(db, "products", i.id), { stock: increment(-i.qty) }));
    b.commit().catch(e => toast("Vente refusée : " + e.code, 8000)); cart = {};
    toast(navigator.onLine ? "✓ Vente enregistrée" : "✓ Enregistrée hors ligne — synchronisation automatique au retour du réseau"); draw(); }
  return [un];
}

export function stock(el) {
  let P = [], T = 0;
  el.innerHTML = `<div class="cols"><section class="card"><h3>Entrées de stock</h3><div id="sl"></div></section><div><section class="card"><h3>Billard · jetons du jour</h3><p class="mut">Total encaissé aujourd'hui (USD)</p><div class="row"><input id="tk" type="number" step="any" min="0"><button class="big" id="tks">Enregistrer</button></div></section><section class="card"><h3>Chambres</h3><div id="rm"></div></section></div></div>`;
  const draw = () => { $("#sl", el).innerHTML = P.map(p => `<div class="ln"><span>${esc(p.name)}<small class="${p.stock <= (p.min ?? 5) ? "low" : ""}"> ${p.stock} en stock</small></span><span class="row"><input type="number" min="1" placeholder="+ qté" data-i="${p.id}"><button data-add="${p.id}">Ajouter</button></span></div>`).join(""); };
  el.onclick = e => { const id = e.target.dataset.add; if (id) { const n = +$(`[data-i="${id}"]`, el).value; if (n > 0) updateDoc(doc(db, "products", id), { stock: increment(n) }).then(() => toast("✓ Stock mis à jour")).catch(x => toast(x.code)); } if (e.target.id === "tks") setDoc(doc(db, "tokens", today()), { amount: +$("#tk", el).value, by: "gerant", day: today() }, { merge: true }).then(() => toast("✓ Billard enregistré")).catch(x => toast(x.code)); };
  return [onSnapshot(collection(db, "products"), s => { P = s.docs.map(d => ({ id: d.id, ...d.data() })); draw(); }), onSnapshot(doc(db, "tokens", today()), s => { T = s.exists() ? s.data().amount : ""; $("#tk", el).value = T; }), roomsPanel($("#rm", el), { edit: true })];
}
