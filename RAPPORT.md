# Rapport technique — Espace Sep (à transmettre au développeur n°2)

**Contexte** : application de gestion pour le complexe Espace Sep (Kolwezi) : terrasse, bar, boîte de nuit, hôtel. Client : M. Michka (Administrateur). Développeur / Super Admin : Gabriel Umba.
**Stack imposée** : HTML, CSS, JS vanilla (modules ES), Firebase Auth (e-mail/mot de passe) + Firestore. Hébergement : GitHub → Vercel. Projet Firebase : `gest-fact-espace-sep`.

## Architecture
| Fichier | Rôle |
|---|---|
| `firebase.js` | Initialisation, cache hors ligne, constantes (DEV_EMAIL, ROLES, DEPTS, SEED), utilitaires |
| `app.js` | Connexion, résolution du rôle, message « Bienvenue M. X — Rôle », onglets par rôle, **initialisation automatique** |
| `ops.js` | `pos` (commande/encaissement, serveur) et `stock` (entrées, billard, statut chambres, gérant) |
| `dash.js` | Direction : ventes du jour temps réel par département / serveur / catégorie, alertes stock, billard, édition des prix |
| `setup.js` | Super Admin : création des comptes, catalogue, chambres |
| `sw.js`, `manifest.json` | Mode hors ligne (coquille applicative) / installable |
| `firestore.rules` | Sécurité côté serveur (RBAC) |

## Modèle de données (Firestore)
`users/{uid}` {title,name,email,role} · `products/{id}` {name,cat,brand,price,stock,min,image} · `rooms/{id}` {name,type,price,status} · `sales/{id}` {serverId,serverName,dept,items[],total,day,at} · `tokens/{YYYY-MM-DD}` {amount} · `config/init`, `config/billiard` {price}.

## Décisions clés
1. **Rôles** : Super Admin identifié par e-mail dans les règles ; les autres par `users/{uid}.role`. Les règles sont l'autorité, l'interface n'est qu'un confort.
2. **Création de comptes** : 2e instance Firebase (`"sec"`) pour ne pas déconnecter le Super Admin. Désactiver = supprimer `users/{uid}` (le compte Auth reste mais n'a plus de rôle).
3. **Hors ligne** : `persistentLocalCache` (multi-onglets) ; ventes via `writeBatch` non bloquantes ; stock par `increment()` (atomique, fusion correcte au retour du réseau) ; service worker réseau-d'abord pour l'app et le SDK.
4. **Stock** : le serveur/gérant ne peut que décrémenter, le gérant que incrémenter, l'admin que modifier `price` (règles `affectedKeys`).
5. **Ventes immuables** (pas de update/delete). Clé `day` locale (YYYY-MM-DD) pour interroger sans index composite.
6. **Images** : URL ou JPEG base64 réduit (sans Firebase Storage).

## Limites connues / à améliorer (propositions bienvenues)
- Pas de réservations de chambres (calendrier, check-in/out, nuitées) : seulement chambres + statuts.
- Pas d'impression de ticket ni d'ouverture/fermeture de caisse ; pas de rapports mensuels ni d'export.
- Pas d'inventaire (écart théorique/réel) ; tarifs VIP/boîte de nuit non différenciés.
- **Écart avec le cahier des charges signé** : celui-ci prévoit C#/.NET Blazor + SQL Server local + imprimante ESC/POS ; cette version est web/Firebase (hors ligne via cache navigateur).
- Risques : conflits de stock hors ligne (deux appareils vendent le dernier article) ; pas de tests automatisés ; icônes PWA absentes.

## Points à vérifier en priorité
Règles Firestore (cas limites), cohérence hors ligne des décréments, accessibilité tactile, performance avec beaucoup d'articles.
