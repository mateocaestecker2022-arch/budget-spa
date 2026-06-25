# Gestionnaire de Budget Personnel — CLAUDE.md

## Vue d'ensemble
Application web monopage (SPA) de suivi budgétaire mensuel, 100 % côté client (pas de backend en v1.0).

## Stack technique
| Composant | Technologie |
|---|---|
| Structure | HTML5 |
| Logique | JavaScript vanilla |
| Graphiques | Chart.js |
| Stockage | localStorage (navigateur) |

## Règles de calcul (impératives)
```
Total charges        = Loyer + Nourriture + Assurance + Essence + Factures + Autres + Abonnements
Charges ponctuelles  = cumul mensuel des remboursements ponctuels de dette + répartitions appliquées
Reste à vivre        = Salaire − Total charges − Charges ponctuelles
Alerte               = si Reste à vivre < 0
```

## Exigences fonctionnelles v1.0
| Code | Exigence | Priorité |
|---|---|---|
| EF-01 | Saisir le salaire mensuel net | Haute |
| EF-02 | Saisir les charges fixes (loyer, nourriture, assurance, essence, factures, autres) | Haute |
| EF-04 | Calculer le total des charges en temps réel | Haute |
| EF-05 | Calculer le reste à vivre | Haute |
| EF-06 | Afficher la répartition en graphique (Chart.js) | Haute |
| EF-08 | Alerter si le reste à vivre est négatif | Haute |
| EF-09 | Sauvegarder les données (localStorage) | Moyenne |
| EF-10 | Réinitialiser les données | Basse |

> EF-03 (cible d'épargne mensuelle) et EF-07 (barre de progression épargne) ont été retirées : le suivi de l'épargne se fait désormais via Sous de côté, Objectif d'épargne long terme, Dette et Répartition du reste à vivre.

## Exigences non fonctionnelles
- Recalcul instantané < 100 ms à chaque saisie
- Saisie complète en < 2 minutes sans formation
- Responsive desktop + mobile
- Accessibilité : contrastes suffisants, navigation clavier
- Compatibilité : Chrome, Firefox, Safari, Edge récents

## Hors périmètre v1.0 (évolutions futures)
- Historique multi-mois
- Sources de revenus multiples
- Dépenses variables
- Export CSV / Excel / PDF
- Synchronisation bancaire
- Comptes utilisateurs

## Structure de fichiers prévue
```
gestionnaire de budgety/
├── index.html       # Structure et layout
├── style.css        # Styles et responsive
├── app.js           # Logique, calculs, Chart.js, localStorage
└── CHECKPOINT.md    # Journal de progression
```

## Critères de recette
- Les indicateurs se mettent à jour instantanément à chaque modification
- Le reste à vivre correspond exactement à la formule définie
- L'alerte s'affiche quand le solde est négatif
- Le graphique reflète fidèlement la répartition saisie
- Affichage correct sur mobile et desktop
