# CHECKPOINT — Gestionnaire de Budget Personnel

## État actuel : Phase 4 — TERMINÉ ✅

---

## Journal de progression

### 2026-06-18 — Projet v1.0 livré
- [x] Rédaction de la spec complète (CLAUDE.md)
- [x] Création des skills `/audit` et `/impact`
- [x] Initialisation git + dépôt GitHub (budget-spa)
- [x] Phase 1 — Conception UI (index.html + style.css)
- [x] Phase 2 — Saisies et calculs (app.js)
- [x] Phase 3 — Graphiques Chart.js + sessionStorage (intégré Phase 2)
- [x] Phase 4 — Tests et recette Playwright — PASS

### 2026-06-21 — Prime, Abonnements, Objectif d'épargne
- [x] Prime : montant ponctuel réparti en % entre Épargne / Sous de côté / Reste à vivre / Dette, avec avertissement si répartition ≠ 100 %
- [x] Abonnements : liste dynamique (nom + montant, ajout/suppression), total intégré au calcul de Total charges et au graphique
- [x] Objectif d'épargne long terme : nom + montant cible, barre de progression (Sous de côté ÷ cible), estimation du temps restant via la nouvelle métrique "Capacité d'épargne" (Salaire − Total charges)
- [x] Persistance localStorage indépendante du reset mensuel pour Abonnements et Objectif d'épargne (comme Sous de côté)
- [x] Tests Playwright end-to-end en local — PASS (calculs croisés, alerte, reset, reload)
- [x] Déploiement GitHub Pages + tests Playwright end-to-end rejoués sur le site en ligne — PASS, aucune erreur console

### 2026-06-22 — Section Dette dédiée
- [x] Le champ "Dette / Remboursement" est sorti de "Charges fixes" et déplacé dans une nouvelle carte "Dette" (comme Abonnements/Objectif d'épargne)
- [x] Nouveau champ "Dette restante (total)" : solde persistant indépendant du reset mensuel (même comportement que Sous de côté)
- [x] Nouveau champ "Remboursement ponctuel" + bouton "Appliquer au total" pour soustraire un montant supplémentaire de la dette restante à la volée
- [x] Remboursement mensuel fixe inchangé : toujours compté dans le Total charges
- [x] Tests Playwright en local — PASS (un seul input #dette, calcul du total inchangé, remboursement ponctuel réduit le solde et vide le champ, persistance après reload, aucune erreur console)
- [x] Nouvelle section "Répartition du reste à vivre" : recap Total charges + Reste à vivre disponible, répartition en % entre Sous de côté et Dette, bouton "Appliquer" qui ajoute le montant calculé à Sous de côté et le déduit de Dette restante
- [x] Clôture du mois (reset manuel + reset auto au changement de mois) : le montant "Objectif d'épargne mensuelle" est désormais cumulé automatiquement dans "Sous de côté" avant le report, au lieu d'être perdu
- [x] Tests Playwright en local — PASS (dispatch reste à vivre calculé et appliqué correctement, persistance après reload, cumul épargne→sous de côté vérifié au reset, aucune erreur console)
- [x] Suppression du champ "Objectif d'épargne mensuelle" (et du cumul automatique vers Sous de côté introduit juste au-dessus, devenu obsolète) : le suivi de l'épargne se fait désormais uniquement via Sous de côté / Objectif long terme / Répartition du reste à vivre
- [x] Formule mise à jour : `Reste à vivre = Salaire − Total charges` (sans soustraction d'épargne) ; "Taux d'épargne" et la barre de progression épargne associée supprimés (résultats, graphique, comparaison mensuelle)
- [x] `CLAUDE.md` et `skills/audit.md` / `skills/impact.md` mis à jour pour rester cohérents (formules, EF-03/EF-07 retirées, sessionStorage → localStorage)
- [x] Nouveau skill `skills/propose.md` : impose un plan structuré + "go" explicite de l'utilisateur avant toute implémentation de changement non trivial
- [x] Tests Playwright en local — PASS (champs supprimés absents du DOM, formules recalculées correctement, dispatch/dette/reset toujours cohérents, aucune erreur console)
- [x] **Bug fix Prime** : la répartition était en %, donc taper "500" dans chaque colonne avec une prime de 2000€ donnait 2000×500÷100 = 10 000€ par colonne au lieu d'une erreur claire. Remplacé par des montants en € directs (`primeMontantEpargne/SousDecote/Reste/Dette`) avec un total "Réparti : X € / Y €" et avertissement si le total ≠ montant de la prime
- [x] Tests Playwright en local — PASS (reproduction exacte du bug signalé confirmée corrigée, sur-allocation détectée avec avertissement, anciens champs % absents, aucune erreur console)
- [x] **Bug fix mobile — "CSS grid blowout"** : les cartes (`.card`) et `.form-group` n'avaient pas `min-width: 0`, ce qui empêchait les grilles imbriquées (Prime, Dispatch, etc.) de rétrécir correctement sur petit écran → débordement horizontal sur mobile. Corrigé en ajoutant `min-width: 0` sur `.card` et `.form-group` ; retiré aussi un `white-space: nowrap` inutile sur `.btn-apply-debt`
- [x] **Bouton "Appliquer" ajouté sur Prime** (comme Dette et Répartition du reste à vivre) : Épargne + Sous de côté de la prime s'ajoutent ensemble à Sous de côté, Dette se soustrait de Dette restante, Reste à vivre ne touche aucun compteur. Tous les champs Prime se vident après application
- [x] Tests Playwright en local — PASS (zéro élément en débordement sur mobile et desktop, apply Prime calculé et persisté correctement après reload, aucune erreur console)
- [x] **Nouvelle section "Conseils"** : liste de suggestions basées sur des règles calculées à partir des données saisies — loyer > 33% du salaire, Sous de côté < 3 mois de charges, dette restante sans remboursement mensuel ou remboursement > 24 mois, abonnements > 10% du salaire, capacité d'épargne non répartie ce mois, aucun objectif d'épargne défini ; message positif si rien ne se déclenche
- [x] Tests Playwright en local — PASS (chaque règle déclenchée et vérifiée individuellement, cas équilibré → message succès, aucun débordement mobile, aucune erreur console)

---

## Phases

| Phase | Description | Statut |
|-------|-------------|--------|
| 0 | Initialisation, spec, skills | ✅ Terminé |
| 1 | Conception UI | ✅ Terminé |
| 2 | Saisies et calculs | ✅ Terminé |
| 3 | Graphiques + sauvegarde | ✅ Terminé (intégré Phase 2) |
| 4 | Tests et recette | ✅ PASS — Playwright 33/33 |
| + | Champs Autres + Factures + Sous de côté | ✅ Terminé |
| + | Réinitialisation mensuelle auto | ✅ Terminé |
| + | Comparaison mois précédent | ✅ Terminé |
| + | Optimisation mobile | ✅ Terminé |
| + | Déploiement GitHub Pages | ✅ Terminé |
| + | Prime (répartition % par destination) | ✅ Terminé |
| + | Abonnements (liste dynamique) | ✅ Terminé |
| + | Objectif d'épargne long terme + estimation | ✅ Terminé |
| + | Vérification end-to-end sur le site en ligne | ✅ PASS |
| + | Section Dette dédiée (solde restant + remboursement ponctuel) | ✅ Terminé |
| + | Répartition du reste à vivre (dispatch Sous de côté / Dette) | ✅ Terminé |
| + | Suppression Objectif d'épargne mensuelle (Taux d'épargne, barre épargne) | ✅ Terminé |
| + | Skill `/propose` (plan structuré + "go" avant implémentation) | ✅ Terminé |

---

## Décisions techniques

- **Stack** : HTML5 + CSS + JavaScript vanilla + Chart.js
- **Stockage** : sessionStorage (pas de backend en v1.0)
- **Pas de framework** : SPA légère, sans build tool

---

## Résultats recette finale (2026-06-18) — 33/33 PASS

| Test | Résultat |
|------|----------|
| 9 champs présents | ✅ |
| Formules de calcul (1 770 €, 430 €, 12.0 %) | ✅ |
| Alerte solde négatif | ✅ Visible en rouge |
| Graphique Chart.js (8 segments) | ✅ |
| Barre de progression épargne | ✅ |
| Sous de côté affiché | ✅ |
| localStorage sauvegarde/restauration | ✅ |
| Reset mensuel auto + report sous de côté | ✅ |
| Section comparaison mois précédent | ✅ |
| Mobile — inputs touch, bouton pleine largeur | ✅ |
| Aucune erreur console | ✅ |

## Résultats recette — Prime / Abonnements / Objectif d'épargne (2026-06-21)

| Test | Résultat |
|------|----------|
| Total charges inclut les abonnements | ✅ |
| Capacité d'épargne = Salaire − Total charges | ✅ |
| Répartition prime 100 % → pas d'avertissement | ✅ |
| Répartition prime ≠ 100 % → avertissement visible | ✅ |
| Estimation objectif (mois restants) | ✅ |
| Graphique Chart.js — 9 catégories dont Abonnements | ✅ |
| Alerte solde négatif toujours fonctionnelle | ✅ |
| Reset mensuel : Abonnements + Objectif persistent | ✅ |
| Persistance localStorage après reload | ✅ |
| Rejoué à l'identique sur le site en ligne | ✅ |
| Aucune erreur console | ✅ |

## Résultats recette — Section Dette dédiée (2026-06-22)

| Test | Résultat |
|------|----------|
| Un seul champ #dette (pas de doublon après déplacement) | ✅ |
| Total charges inchangé après déplacement du champ dette | ✅ |
| Dette restante affichée correctement | ✅ |
| Remboursement ponctuel réduit la dette restante et vide son champ | ✅ |
| Dette restante persiste après reload (localStorage) | ✅ |
| Remboursement mensuel fixe persiste après reload | ✅ |
| Aucune erreur console | ✅ |

## Résultats recette — Répartition reste à vivre / Cumul épargne (2026-06-22)

| Test | Résultat |
|------|----------|
| Reste à vivre disponible affiché correctement dans le dispatch | ✅ |
| Montants → Sous de côté / → Dette calculés selon les % | ✅ |
| Avertissement si répartition ≠ 100 % | ✅ |
| Application : Sous de côté augmenté, Dette restante réduite | ✅ |
| Champs % vidés après application | ✅ |
| Persistance après reload | ✅ |
| Reset mensuel : épargne mensuelle ajoutée à Sous de côté avant report | ✅ |
| Dette restante inchangée par le reset (hors action explicite) | ✅ |
| Aucune erreur console | ✅ |

## Résultats recette — Suppression Objectif d'épargne mensuelle (2026-06-22)

| Test | Résultat |
|------|----------|
| Champs #epargne, #tauxEpargne, #progressFill, #cmp-tauxEpargne absents du DOM | ✅ |
| Reste à vivre = Salaire − Total charges (sans épargne) | ✅ |
| Capacité d'épargne (objectif long terme) toujours correcte | ✅ |
| Dispatch reste à vivre toujours fonctionnel après le changement de formule | ✅ |
| Reset mensuel : Sous de côté / Dette restante toujours préservés correctement | ✅ |
| Persistance après reload | ✅ |
| Aucune erreur console | ✅ |

## Évolutions futures (hors v1.0)

- Historique multi-mois
- Sources de revenus multiples
- Dépenses variables
- Export CSV / Excel / PDF
- Synchronisation bancaire
- Comptes utilisateurs

## Dépôt GitHub

https://github.com/mateocaestecker2022-arch/budget-spa

## Application en ligne

https://mateocaestecker2022-arch.github.io/budget-spa/
