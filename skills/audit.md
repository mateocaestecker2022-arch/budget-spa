# /audit — Audit complet du gestionnaire de budget

Quand l'utilisateur invoque `/audit`, exécuter TOUTES les vérifications ci-dessous sans exception.
Ne pas déclarer "tout va bien" avant d'avoir vérifié chaque section.

---

## RÈGLES ABSOLUES

1. **Ne jamais conclure ✅ sur un seul test** — vérifier chaque exigence fonctionnelle individuellement
2. **Tester les cas limites** — salaire = 0, charges > salaire, reste à vivre négatif
3. **Valider sur desktop ET mobile** — le responsive est une exigence non fonctionnelle critique
4. **Vérifier les calculs à la main** — ne pas faire confiance au code sans contre-vérification manuelle

---

## 1. Exigences fonctionnelles (EF)

| Code | Exigence | Vérifié | Anomalie |
|------|----------|---------|----------|
| EF-01 | Saisie du salaire mensuel net | ✅/❌ | |
| EF-02 | Saisie des charges fixes (loyer, nourriture, assurance, dette) | ✅/❌ | |
| EF-04 | Calcul du total des charges en temps réel | ✅/❌ | |
| EF-05 | Calcul du reste à vivre | ✅/❌ | |
| EF-06 | Graphique de répartition (Chart.js) | ✅/❌ | |
| EF-08 | Alerte si reste à vivre < 0 | ✅/❌ | |
| EF-09 | Sauvegarde des données en localStorage | ✅/❌ | |
| EF-10 | Réinitialisation des données | ✅/❌ | |

---

## 2. Vérification des formules de calcul

Tester manuellement avec les valeurs suivantes et comparer au résultat affiché :

**Jeu de test nominal :**
```
Salaire      = 2500
Loyer        = 800
Nourriture   = 400
Assurance    = 150
Dette        = 200

Total charges attendu = 800 + 400 + 150 + 200 = 1550
Reste à vivre attendu = 2500 − 1550 = 950
Alerte attendue = NON (950 ≥ 0)
```

**Jeu de test déséquilibre :**
```
Salaire      = 1500
Charges      = 1800

Reste à vivre attendu = 1500 − 1800 = −300
Alerte attendue = OUI (rouge visible)
```

**Jeu de test zéro :**
```
Tous les champs = 0
Reste à vivre = 0, aucune division par zéro, pas de NaN affiché
```

**Checks :**
- Les résultats affichés correspondent exactement aux calculs manuels
- Aucun `NaN`, `Infinity` ou `undefined` visible dans l'interface
- Le recalcul se déclenche à chaque saisie (< 100 ms)

---

## 3. Graphique Chart.js

**Checks :**
- Le graphique s'affiche correctement au chargement
- Les segments correspondent aux catégories (loyer, nourriture, assurance, dette, factures, autres, abonnements, reste à vivre)
- Le graphique se met à jour en temps réel à chaque modification
- Les couleurs sont distinctes et lisibles
- Le graphique ne plante pas si une valeur est 0

---

## 4. Alerte déséquilibre

**Checks :**
- L'alerte apparaît dès que le reste à vivre passe en dessous de 0
- L'alerte disparaît dès que le reste à vivre repasse au-dessus de 0
- L'alerte est visuellement claire (couleur rouge, message explicite)

---

## 5. LocalStorage

**Checks :**
- Après saisie, les valeurs persistent si on recharge la page (F5)
- La réinitialisation vide bien les champs mensuels, en conservant Sous de côté et Dette restante
- Aucune erreur console liée au storage

```javascript
// Vérification manuelle dans la console navigateur
console.log(localStorage.getItem('budgetData'))
// Doit retourner les données saisies en JSON
```

---

## 6. Performance

**Checks :**
- Recalcul < 100 ms à chaque frappe (vérifier avec DevTools → Performance)
- Aucun lag visible sur saisie rapide
- Pas de re-render inutile du graphique à chaque touche

---

## 7. Responsive & compatibilité

**Checks desktop (≥ 1024px) :**
- Tous les champs sont visibles sans scroll horizontal
- Le graphique est correctement dimensionné

**Checks mobile (≤ 768px) :**
- Les champs sont utilisables au touch
- Le graphique s'adapte à la largeur de l'écran
- Aucun élément ne déborde

**Checks navigateurs :**
- Chrome ✅/❌
- Firefox ✅/❌
- Safari ✅/❌
- Edge ✅/❌

---

## 8. Accessibilité

**Checks :**
- Navigation clavier possible (Tab entre les champs)
- Contrastes suffisants (texte lisible sur fond)
- Les labels sont associés aux inputs (`<label for="">`)
- L'alerte est perceptible sans couleur (texte explicite)

---

## 9. Qualité du code

**Checks :**
- Aucune erreur dans la console navigateur (F12 → Console)
- Aucun `console.log` de debug oublié
- Les formules de calcul correspondent exactement à la spec :
  - `Total charges = Loyer + Nourriture + Assurance + Dette + Factures + Autres + Abonnements`
  - `Reste à vivre = Salaire − Total charges`
  - `Alerte = Reste à vivre < 0`

---

## 10. Rapport final

| Section | Statut | Anomalies |
|---------|--------|-----------|
| Exigences fonctionnelles | ✅/⚠️/❌ | |
| Formules de calcul | ✅/⚠️/❌ | |
| Graphique Chart.js | ✅/⚠️/❌ | |
| Alerte déséquilibre | ✅/⚠️/❌ | |
| LocalStorage | ✅/⚠️/❌ | |
| Performance | ✅/⚠️/❌ | |
| Responsive / mobile | ✅/⚠️/❌ | |
| Accessibilité | ✅/⚠️/❌ | |
| Qualité code | ✅/⚠️/❌ | |

**Ne jamais conclure ✅ global si une section est ⚠️ ou ❌.**
