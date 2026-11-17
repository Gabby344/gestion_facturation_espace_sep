// Direction (Administrateur) : ventes du jour en temps réel, par département / serveur / catégorie, stocks, billard, prix
import { db, $, esc, usd, today, toast, collection, doc, query, where, onSnapshot, updateDoc, setDoc } from "./firebase.js";
const bars = (rows) => { const m = Math.max(1, ...rows.map(r => r[1])); return rows.map(([k, v]) => `<div class="br"><span>${esc(k)}</span><i style="--w:${v * 100 / m}%"></i><b>${usd(v)}</b></div>`).join("") || "<p class='mut'>Aucune vente pour l'instant.</p>"; };
const sum = a => Object.entries(a.reduce((m, [k, v]) => (m[k] = (m[k] || 0) + v, m), {})).sort((x, y) => y[1] - x[1]);
export function dash(el) {
  let S = [], P = [], T = 0, TP = 1;
  el.innerHTML = `<div id="kpi"></div><details class="card"><summary>Modifier les prix</summary><div id="pr"></div></details>`;
  function draw() {
    const tot = S.reduce((t, s) => t + s.total, 0), low = P.filter(p => p.stock <= (p.min ?? 5));
    $("#kpi", el).innerHTML = `<div class="kpis"><div><small>Ventes du jour</small><b>${usd(tot)}</b></div><div><small>Tickets</small><b>${S.length}</b></div><div><small>Billard</small><b>${usd(T)}</b><small>${TP ? Math.round(T / TP) : 0} jetons</small></div><div><small>Total général</small><b>${usd(tot + T)}</b></div></div>
    <div class="cols"><section class="card"><h3>Par département</h3>${bars(sum(S.map(s => [s.dept, s.total])))}</section><section class="card"><h3>Par serveur</h3>${bars(sum(S.map(s => [s.serverName, s.total])))}</section>
    <section class="card"><h3>Par catégorie</h3>${bars(sum(S.flatMap(s => s.items.map(i => [i.cat, i.price * i.qty]))))}</section><section class="card"><h3>Alertes de stock</h3>${low.map(p => `<div class="ln"><span>${esc(p.name)}</span><b class="low">${p.stock}</b></div>`).join("") || "<p class='mut'>Aucun stock bas.</p>"}</section></div>`; }
  const drawP = () => { $("#pr", el).innerHTML = `<div class="ln"><span>Prix d'un jeton de billard</span><input type="number" step="any" id="tp" value="${TP}"></div>` + P.map(p => `<div class="ln"><span>${esc(p.name)}</span><input type="number" step="any" data-pid="${p.id}" value="${p.price}"></div>`).join(""); };
  el.onchange = e => { const t = e.target; if (t.dataset.pid) updateDoc(doc(db, "products", t.dataset.pid), { price: +t.value }).then(() => toast("✓ Prix modifié")).catch(x => toast(x.code)); if (t.id === "tp") setDoc(doc(db, "config", "billiard"), { price: +t.value }, { merge: true }).then(() => toast("✓ Prix du jeton modifié")); };
  return [onSnapshot(query(collection(db, "sales"), where("day", "==", today())), s => { S = s.docs.map(d => d.data()); draw(); }),
    onSnapshot(collection(db, "products"), s => { P = s.docs.map(d => ({ id: d.id, ...d.data() })); draw(); drawP(); }),
    onSnapshot(doc(db, "tokens", today()), s => { T = s.exists() ? s.data().amount : 0; draw(); }),
    onSnapshot(doc(db, "config", "billiard"), s => { TP = s.exists() ? s.data().price : 1; draw(); })];
}
