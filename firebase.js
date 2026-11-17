// Initialisation Firebase + utilitaires partagés. Mode hors ligne : cache Firestore persistant.
import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
export * from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
export * from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
export * from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

export const cfg = { apiKey: "AIzaSyAxGzWQXb8m_hcPTGeD-ue__P5Ski3DBis", authDomain: "gest-fact-espace-sep.firebaseapp.com", projectId: "gest-fact-espace-sep", storageBucket: "gest-fact-espace-sep.firebasestorage.app", messagingSenderId: "853855643466", appId: "1:853855643466:web:8ea48dcc7b8a2ca7f1c3b3" };
export const app = getApps()[0] || initializeApp(cfg);
// Lectures et écritures fonctionnent sans Internet et se synchronisent au retour du réseau
export const db = initializeFirestore(app, { localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }) });
export const auth = getAuth(app);

export const DEV_EMAIL = "gabbyumba344@gmail.com"; // Super Admin (même adresse dans firestore.rules)
export const ROLES = { superadmin: "Super Administrateur", admin: "Administrateur", gerant: "Gérant", serveur: "Serveur" };
export const DEPTS = ["Terrasse", "Bar", "Boîte de nuit"];
// Données créées automatiquement au premier lancement (modifiables ensuite par le Super Admin)
export const SEED = [
  { name: "Primus 72cl", cat: "Bières", brand: "Bralima", price: 3, stock: 48, min: 12, image: "" },
  { name: "Skol 50cl", cat: "Bières", brand: "Bralima", price: 2.5, stock: 48, min: 12, image: "" },
  { name: "Simba 72cl", cat: "Bières", brand: "Brasimba", price: 3, stock: 36, min: 12, image: "" },
  { name: "Jus d'orange", cat: "Jus", brand: "", price: 2, stock: 30, min: 8, image: "" },
  { name: "Vin rouge", cat: "Vins", brand: "", price: 15, stock: 12, min: 3, image: "" },
  { name: "Whisky 75cl", cat: "Whiskies", brand: "", price: 35, stock: 8, min: 2, image: "" }];
export const ROOMS = [{ name: "Chambre 1", type: "Standard", price: 30, status: "disponible" }, { name: "Chambre 2", type: "Standard", price: 30, status: "disponible" }, { name: "Suite 1", type: "VIP", price: 60, status: "disponible" }];

export const $ = (s, r = document) => r.querySelector(s);
export const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
export const today = () => new Date().toLocaleDateString("sv");
export const usd = n => "$" + (+n || 0).toFixed(2);
export function toast(t, ms = 4000) { const e = $("#toast"); e.textContent = t; e.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(() => e.hidden = true, ms); }
/** Photo → JPEG réduit en base64 (stockée dans le document, sans Storage). */
export const shrink = f => new Promise(r => { const i = new Image(); i.onload = () => { const k = Math.min(1, 360 / Math.max(i.width, i.height)), c = document.createElement("canvas"); c.width = i.width * k; c.height = i.height * k; c.getContext("2d").drawImage(i, 0, 0, c.width, c.height); r(c.toDataURL("image/jpeg", .7)); }; i.src = URL.createObjectURL(f); });
