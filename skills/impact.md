# /impact — Analyse d'impact avant implémentation

Quand l'utilisateur invoque `/impact <description du changement>`, effectuer l'analyse suivante **avant toute ligne de code** :

---

## Étapes obligatoires

### 1. Identifier les composants touchés

Cherche dans le codebase tous les fichiers et fonctions directement concernés par le changement décrit.

Composants principaux du projet :
- `index.html` — structure, inputs, zones d'affichage
- `style.css` — layout, responsive, couleurs, alerte
- `app.js` — calculs, événements, Chart.js, localStorage

### 2. Cartographier les dépendances

Pour chaque composant touché, trouver :
- Les **fonctions** qui lisent ou écrivent les mêmes données (salaire, charges, sous de côté, dette restante, reste à vivre)
- Les **hypothèses implicites** que ces fonctions font (ex : "tous les champs sont des nombres positifs", "le graphique existe déjà dans le DOM", etc.)
- Les **événements** qui déclenchent ces fonctions (`input`, `change`, `DOMContentLoaded`)

### 3. Simuler le changement

Pour chaque hypothèse trouvée, évaluer : est-ce que le changement proposé **casse ou modifie** cette hypothèse ?

Vérifier systématiquement :
- La **fonction de calcul principale** (recalcul en temps réel)
- La **mise à jour du graphique Chart.js** (destroy/recreate ou update)
- La **logique d'alerte** (condition `reste à vivre < 0`)
- La **sauvegarde localStorage** (sérialisation/désérialisation)
- La **réinitialisation** (reset des champs + storage + graphique)
- Le **responsive CSS** (breakpoints affectés par un changement de layout)

### 4. Produire le rapport

Afficher un tableau :

| Feature existante | Fichier:fonction | Hypothèse implicite | Impact |
|---|---|---|---|
| nom de la feature | fichier:ligne | ce qu'elle suppose | ✅ OK / ⚠️ À vérifier / ❌ BREAK |

Puis lister les **actions préventives** pour chaque BREAK ou ⚠️ avant de commencer.

### 5. Demander confirmation

Terminer par :
> Impacts identifiés : X OK, Y à vérifier, Z BREAK.
> Veux-tu que je traite les impacts préventifs dans le même plan, ou on procède quand même ?

---

## Règles

- Ne pas coder avant d'avoir fait cette analyse
- Si le changement touche une **formule de calcul**, vérifier TOUS les endroits où le résultat est utilisé (affichage, graphique, alerte, storage)
- Si le changement touche un **champ de saisie** (ajout, suppression, renommage), vérifier l'HTML, le JS et le CSS associés
- Si le changement touche le **graphique**, vérifier que l'instance Chart.js est correctement détruite avant recréation (éviter les fuites mémoire)
- Si le changement touche le **localStorage**, vérifier la compatibilité avec les données déjà sauvegardées (migration si besoin)
- Si le changement touche le **CSS responsive**, tester sur mobile ET desktop
