# /account — Gestion sécurisée des comptes MT5

Quand l'utilisateur invoque `/account`, détermine l'opération demandée et exécute le guide correspondant.

---

## Opérations disponibles

- `/account delete <id>` — Supprimer un compte en sauvegardant tout
- `/account add` — Ajouter un nouveau compte (ou en cloner un existant)
- `/account status` — Voir l'état de tous les comptes + vps_service

---

## `/account status`

Affiche l'état complet de tous les comptes :

```sql
SELECT id, login, label, server, status, last_seen, vps_service, api_key
FROM accounts_mt5
ORDER BY id;
```

À exécuter sur Hetzner :
```bash
ssh root@204.168.238.39 "docker exec projet-db-1 psql -U postgres -d projet -c \
\"SELECT id, login, label, server, status, last_seen, vps_service FROM accounts_mt5 ORDER BY id;\""
```

Affiche aussi le watchdog-config actif :
```bash
curl -s -H "X-WATCHDOG-SECRET: $WATCHDOG_SECRET" http://localhost:8000/v1/mt5/watchdog-config
```

---

## `/account delete <id>`

### ⚠️ AVANT de supprimer — sauvegarder OBLIGATOIREMENT

**Étape 1 — Récupérer les paramètres du compte à supprimer :**
```bash
ssh root@204.168.238.39 "docker exec projet-db-1 psql -U postgres -d projet -c \
\"SELECT id, login, server, label, vps_service, api_key FROM accounts_mt5 WHERE id = <id>;\""
```

Sauvegarder dans un bloc :
```
id          = ___
login       = ___
server      = ___
label       = ___
vps_service = ___   ← CRITIQUE — le watchdog utilise ce champ
api_key     = ___   ← l'EA IONOS utilise cette clé, elle va changer
```

**Étape 2 — Vérifier les trades/snapshots liés :**
```bash
ssh root@204.168.238.39 "docker exec projet-db-1 psql -U postgres -d projet -c \
\"SELECT COUNT(*) as trades FROM trades_history WHERE account_id = <id>; \
SELECT COUNT(*) as snapshots FROM account_snapshots WHERE account_id = <id>;\""
```
> Si trades > 0 : les données historiques seront PERDUES définitivement.
> Confirmer avec l'utilisateur avant de continuer.

**Étape 3 — Supprimer via le dashboard** (ou API DELETE /v1/accounts/<id>)

---

### ⚠️ NETTOYAGE OBLIGATOIRE — Supprimer les comptes inactifs

**À faire à chaque changement de compte** : supprimer les anciens comptes `inactive` sans `vps_service` via le dashboard.

```bash
ssh root@204.168.238.39 "docker exec projet-postgres-1 psql -U postgres -d railway -c \
\"SELECT id, login, label, status, vps_service FROM accounts_mt5 WHERE status = 'inactive';\""
```

Supprimer via le dashboard ou `DELETE /v1/accounts/<id>` tout compte `inactive` sans `vps_service`. Garder uniquement les comptes actifs ou avec un service watchdog associé.

---

### APRÈS la suppression — Restaurer immédiatement

**Étape 4 — Créer le nouveau compte** via le dashboard (login, server, label).
Copier la nouvelle `api_key` affichée (une seule fois visible).

**Étape 5 — Restaurer vps_service sur le nouveau compte :**
```bash
ssh root@204.168.238.39 "docker exec projet-db-1 psql -U postgres -d projet -c \
\"UPDATE accounts_mt5 SET vps_service = '<vps_service_sauvegardé>' WHERE login = <login>;\""
```

**Étape 6 — Mettre à jour l'EA sur IONOS avec la nouvelle api_key :**
L'EA utilise la variable `API_KEY` dans ses paramètres. Ouvrir MT5 sur IONOS via noVNC et mettre à jour.
- mt5.service (FTMO) → display :99 → tunnel : `ssh -L 6082:localhost:6081 root@87.106.34.128 -N`
- mt5b.service (Demo) → display :100 → tunnel : `ssh -L 6081:localhost:6080 root@87.106.34.128 -N`

**Étape 7 — Vérifier que le watchdog reprend le compte :**
```bash
ssh root@87.106.34.128 "curl -s http://127.0.0.1:9000/v1/mt5/watchdog-config \
  -H 'X-WATCHDOG-SECRET: <secret>'"
```
Le compte doit réapparaître avec son `vps_service`.

---

## `/account add` — Ajouter un nouveau compte

### Étape 1 — Voir les comptes existants pour cloner la config
```bash
ssh root@204.168.238.39 "docker exec projet-db-1 psql -U postgres -d projet -c \
\"SELECT id, login, label, server, vps_service FROM accounts_mt5 ORDER BY id;\""
```

### Étape 2 — Créer via le dashboard
Champs requis : `login`, `server`, `label`
Copier `api_key` + `api_secret` affichés (une seule fois).

### Étape 3 — Définir vps_service si le compte a un service IONOS associé
```bash
ssh root@204.168.238.39 "docker exec projet-db-1 psql -U postgres -d projet -c \
\"UPDATE accounts_mt5 SET vps_service = 'mt5b.service' WHERE login = <login>;\""
```
> Services disponibles sur IONOS : `mt5.service` (FTMO, display :99) | `mt5b.service` (Demo, display :100)

### Étape 4 — Configurer l'EA sur MT5 IONOS
- Paramètre `API_KEY` = nouvelle api_key
- Paramètre `API_URL` = `http://127.0.0.1:9000` (nginx proxy IONOS → Hetzner)
- Vérifier que le EA se connecte (statut "Connecté" dans le dashboard)

### Étape 5 — Vérifier watchdog
Le watchdog interroge `/v1/mt5/watchdog-config` toutes les 5 min et s'adapte automatiquement si `vps_service` est défini.

---

## Règles critiques

- **Ne jamais supprimer sans sauvegarder `vps_service` et `api_key`** — la suppression est irréversible (cascade trades + snapshots)
- **`vps_service` n'est pas visible dans le dashboard** — toujours passer par SQL pour le lire/écrire
- **La nouvelle `api_key` est différente** — l'EA sur IONOS doit être mis à jour manuellement via noVNC
- **Le watchdog est dynamique** — dès que `vps_service` est défini en DB, le watchdog démarre la surveillance automatiquement (pas besoin de redémarrer)
- **Les trades historiques sont perdus** si le compte est supprimé — à ne faire que si vraiment nécessaire (changement de compte FTMO, etc.)
