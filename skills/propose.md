# /propose — Plan structuré avant implémentation, avec "go" explicite

Quand l'utilisateur propose une amélioration, un nouveau champ, une nouvelle section ou tout changement non trivial, suivre ce processus **avant d'écrire une seule ligne de code ou de modifier un fichier**.

---

## Étapes obligatoires

### 1. Clarifier l'ambiguïté

Si la demande est ambiguë (montant source, comportement d'un bouton, formule, ce qui doit rester vs changer), poser des questions de clarification ciblées avant de planifier. Ne pas deviner une interprétation arbitraire sur un point structurant.

### 2. Cartographier l'impact

Pour tout changement touchant un champ, une formule ou une section existante : identifier les fichiers et fonctions concernés (`index.html`, `style.css`, `app.js`, et si la formule ou les exigences changent : `CLAUDE.md`). Voir `/impact` pour la méthode détaillée de cartographie des dépendances.

### 3. Présenter un plan structuré et concis

Résumer avant de coder :
- **Ce qui va changer** (2-4 points, pas un roman)
- **Fichiers touchés**
- **Impacts** sur les fonctionnalités existantes (formules, persistance localStorage, graphique, comparaison mensuelle, etc.) et comment ils sont gérés

### 4. Attendre un "go" explicite

Terminer la présentation du plan par une demande claire de confirmation. **Ne modifier aucun fichier avant d'avoir reçu un accord explicite** ("go", "oui", "vas-y", ou équivalent sans ambiguïté). Une question ouverte de l'utilisateur, un simple acquiescement vague, ou l'absence de réponse ne valent pas "go".

### 5. Implémenter puis vérifier

Une fois le "go" reçu :
- Implémenter le changement
- Vérifier avec un test (Playwright ou équivalent) : calculs, persistance après reload, absence d'erreur console
- Mettre à jour `CHECKPOINT.md` (journal + recette) et `CLAUDE.md` si une règle de calcul ou une exigence a changé

---

## Règles

- Le plan doit rester court : pas de pavé, juste assez pour que l'utilisateur sache exactement ce qui va se passer.
- Pour un changement trivial et sans ambiguïté (ex: renommer un libellé), le plan peut être une seule phrase — mais la confirmation reste obligatoire avant de toucher au code.
- Si le changement touche une formule de calcul "impérative" (`CLAUDE.md`), le signaler explicitement dans le plan avant le "go".
