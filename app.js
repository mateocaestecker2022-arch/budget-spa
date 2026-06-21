const STORAGE_KEY = 'budgetData';
const HISTORY_KEY = 'budgetHistory';
const SUBS_KEY = 'budgetSubscriptions';
const GOAL_KEY = 'budgetGoal';

let subs = [];
let goal = { nom: '', montant: '' };

const ids = ['salaire', 'loyer', 'nourriture', 'assurance', 'dette', 'facture', 'autres', 'epargne', 'sousDecote', 'prime', 'primePctEpargne', 'primePctSousDecote', 'primePctReste', 'primePctDette'];

const el = {
  salaire:           () => document.getElementById('salaire'),
  loyer:             () => document.getElementById('loyer'),
  nourriture:        () => document.getElementById('nourriture'),
  assurance:         () => document.getElementById('assurance'),
  dette:             () => document.getElementById('dette'),
  facture:           () => document.getElementById('facture'),
  autres:            () => document.getElementById('autres'),
  epargne:           () => document.getElementById('epargne'),
  sousDecote:        () => document.getElementById('sousDecote'),
  subsList:          () => document.getElementById('subsList'),
  subsTotal:         () => document.getElementById('subsTotal'),
  btnAddSub:         () => document.getElementById('btnAddSub'),
  goalNom:              () => document.getElementById('goalNom'),
  goalMontant:          () => document.getElementById('goalMontant'),
  goalProgressLabel:    () => document.getElementById('goalProgressLabel'),
  goalProgressPctLabel: () => document.getElementById('goalProgressPctLabel'),
  goalProgressFill:     () => document.getElementById('goalProgressFill'),
  goalProgressBar:      () => document.getElementById('goalProgressBar'),
  capaciteEpargne:      () => document.getElementById('capaciteEpargne'),
  goalEstimation:       () => document.getElementById('goalEstimation'),
  primePctTotal:     () => document.getElementById('primePctTotal'),
  primeAmtEpargne:    () => document.getElementById('primeAmtEpargne'),
  primeAmtSousDecote: () => document.getElementById('primeAmtSousDecote'),
  primeAmtReste:      () => document.getElementById('primeAmtReste'),
  primeAmtDette:      () => document.getElementById('primeAmtDette'),
  totalCharges:      () => document.getElementById('totalCharges'),
  resteAVivre:       () => document.getElementById('resteAVivre'),
  tauxEpargne:       () => document.getElementById('tauxEpargne'),
  alert:             () => document.getElementById('alert'),
  progressFill:      () => document.getElementById('progressFill'),
  progressLabel:     () => document.getElementById('progressLabel'),
  progressBar:       () => document.querySelector('.progress-bar'),
  sousDecoteDisplay: () => document.getElementById('sousDecoteDisplay'),
  btnReset:          () => document.getElementById('btnReset'),
  headerMonth:       () => document.getElementById('headerMonth'),
  compareSection:    () => document.getElementById('compareSection'),
  compareMonthLabel: () => document.getElementById('compareMonthLabel'),
};

let chart = null;

// ── Mois ───────────────────────────────────────────────────────
function currentMonthKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function monthLabel(key) {
  const [year, month] = key.split('-');
  return new Date(year, month - 1, 1).toLocaleString('fr-FR', { month: 'long', year: 'numeric' });
}

// ── Lecture des valeurs ────────────────────────────────────────
function val(id) {
  return Math.max(0, parseFloat(document.getElementById(id).value) || 0);
}

// ── Abonnements ──────────────────────────────────────────────────
function loadSubs() {
  try { return JSON.parse(localStorage.getItem(SUBS_KEY)) || []; } catch { return []; }
}

function saveSubs() {
  localStorage.setItem(SUBS_KEY, JSON.stringify(subs));
}

function subsTotalAmount() {
  return subs.reduce((sum, s) => sum + Math.max(0, parseFloat(s.amount) || 0), 0);
}

function renderSubs() {
  const list = el.subsList();
  list.innerHTML = '';

  if (subs.length === 0) {
    const p = document.createElement('p');
    p.className = 'subs-empty';
    p.textContent = 'Aucun abonnement — ajoute-en un ci-dessous.';
    list.appendChild(p);
    return;
  }

  subs.forEach(sub => {
    const row = document.createElement('div');
    row.className = 'subs-row';

    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.className = 'subs-name';
    nameInput.placeholder = 'ex: Netflix';
    nameInput.value = sub.name;
    nameInput.setAttribute('aria-label', 'Nom de l\'abonnement');
    nameInput.addEventListener('input', () => { sub.name = nameInput.value; saveSubs(); });

    const amountInput = document.createElement('input');
    amountInput.type = 'number';
    amountInput.className = 'subs-amount';
    amountInput.min = '0';
    amountInput.step = '1';
    amountInput.placeholder = 'ex: 15';
    amountInput.value = sub.amount;
    amountInput.setAttribute('aria-label', 'Montant de l\'abonnement (€)');
    amountInput.addEventListener('input', () => { sub.amount = amountInput.value; saveSubs(); refresh(); });

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'subs-remove';
    removeBtn.setAttribute('aria-label', 'Supprimer cet abonnement');
    removeBtn.textContent = '×';
    removeBtn.addEventListener('click', () => {
      subs = subs.filter(s => s.id !== sub.id);
      saveSubs();
      renderSubs();
      refresh();
    });

    row.append(nameInput, amountInput, removeBtn);
    list.appendChild(row);
  });
}

function addSub() {
  subs.push({ id: Date.now() + Math.random().toString(36).slice(2), name: '', amount: '' });
  saveSubs();
  renderSubs();
  refresh();
  el.subsList().querySelector('.subs-row:last-child .subs-name')?.focus();
}

// ── Objectif d'épargne ──────────────────────────────────────────
function loadGoal() {
  try { return JSON.parse(localStorage.getItem(GOAL_KEY)) || { nom: '', montant: '' }; } catch { return { nom: '', montant: '' }; }
}

function saveGoal() {
  localStorage.setItem(GOAL_KEY, JSON.stringify(goal));
}

// ── Calculs ────────────────────────────────────────────────────
function compute() {
  const salaire    = val('salaire');
  const loyer      = val('loyer');
  const nourriture = val('nourriture');
  const assurance  = val('assurance');
  const dette      = val('dette');
  const facture    = val('facture');
  const autres     = val('autres');
  const epargne    = val('epargne');
  const sousDecote = val('sousDecote');
  const abonnements = subsTotalAmount();

  const prime               = val('prime');
  const primePctEpargne     = val('primePctEpargne');
  const primePctSousDecote  = val('primePctSousDecote');
  const primePctReste       = val('primePctReste');
  const primePctDette       = val('primePctDette');
  const primePctTotal       = primePctEpargne + primePctSousDecote + primePctReste + primePctDette;
  const primeAmtEpargne     = prime * primePctEpargne / 100;
  const primeAmtSousDecote  = prime * primePctSousDecote / 100;
  const primeAmtReste       = prime * primePctReste / 100;
  const primeAmtDette       = prime * primePctDette / 100;

  const totalCharges = loyer + nourriture + assurance + dette + facture + autres + abonnements;
  const resteAVivre  = salaire - totalCharges - epargne;
  const tauxEpargne  = salaire > 0 ? (epargne / salaire) * 100 : 0;

  const goalMontant      = Math.max(0, parseFloat(goal.montant) || 0);
  const capaciteEpargne  = salaire - totalCharges;
  const goalProgressPct  = goalMontant > 0 ? Math.min(100, (sousDecote / goalMontant) * 100) : 0;
  const goalRemaining    = Math.max(0, goalMontant - sousDecote);
  const goalMonthsLeft   = capaciteEpargne > 0 ? Math.ceil(goalRemaining / capaciteEpargne) : null;

  return {
    salaire, loyer, nourriture, assurance, dette, facture, autres, epargne, sousDecote, abonnements,
    totalCharges, resteAVivre, tauxEpargne,
    prime, primePctEpargne, primePctSousDecote, primePctReste, primePctDette,
    primePctTotal, primeAmtEpargne, primeAmtSousDecote, primeAmtReste, primeAmtDette,
    goalMontant, capaciteEpargne, goalProgressPct, goalRemaining, goalMonthsLeft,
  };
}

// ── Mise à jour DOM ────────────────────────────────────────────
function updateDOM(data) {
  const { totalCharges, resteAVivre, tauxEpargne, epargne, salaire, sousDecote } = data;

  el.totalCharges().textContent = fmt(totalCharges);

  const resteEl = el.resteAVivre();
  resteEl.textContent = fmt(resteAVivre);
  resteEl.classList.toggle('negative', resteAVivre < 0);

  el.tauxEpargne().textContent = tauxEpargne.toFixed(1) + ' %';
  el.alert().hidden = resteAVivre >= 0;

  const pct = salaire > 0 ? Math.min(100, (epargne / salaire) * 100) : 0;
  el.progressFill().style.width = pct + '%';
  el.progressBar().setAttribute('aria-valuenow', Math.round(pct));
  el.progressLabel().textContent = fmt(epargne) + ' / ' + fmt(salaire);

  el.sousDecoteDisplay().textContent = fmt(sousDecote);
  el.subsTotal().textContent = fmt(data.abonnements);
}

// ── Mise à jour répartition prime ──────────────────────────────
function updatePrime(data) {
  const { prime, primePctTotal, primeAmtEpargne, primeAmtSousDecote, primeAmtReste, primeAmtDette } = data;

  const totalEl = el.primePctTotal();
  totalEl.textContent = `Répartition totale : ${primePctTotal} %`;
  totalEl.classList.toggle('warning', prime > 0 && primePctTotal !== 100);

  el.primeAmtEpargne().textContent = fmt(primeAmtEpargne);
  el.primeAmtSousDecote().textContent = fmt(primeAmtSousDecote);
  el.primeAmtReste().textContent = fmt(primeAmtReste);
  el.primeAmtDette().textContent = fmt(primeAmtDette);
}

// ── Mise à jour objectif d'épargne ──────────────────────────────
function updateGoal(data) {
  const { sousDecote, goalMontant, capaciteEpargne, goalProgressPct, goalMonthsLeft } = data;

  el.capaciteEpargne().textContent = fmt(capaciteEpargne);

  el.goalProgressLabel().textContent = `${fmt(sousDecote)} / ${fmt(goalMontant)}`;
  el.goalProgressPctLabel().textContent = Math.round(goalProgressPct) + ' %';
  el.goalProgressFill().style.width = goalProgressPct + '%';
  el.goalProgressBar().setAttribute('aria-valuenow', Math.round(goalProgressPct));

  const estEl = el.goalEstimation();
  if (goalMontant <= 0) {
    estEl.textContent = 'Définis un montant cible';
  } else if (sousDecote >= goalMontant) {
    estEl.textContent = 'Objectif atteint !';
  } else if (goalMonthsLeft === null) {
    estEl.textContent = 'Pas d\'estimation possible';
  } else {
    estEl.textContent = `Encore ${goalMonthsLeft} mois à ce rythme`;
  }
}

// ── Graphique Chart.js ─────────────────────────────────────────
function updateChart(data) {
  const { loyer, nourriture, assurance, dette, facture, autres, abonnements, epargne, resteAVivre } = data;

  const restePositif = Math.max(0, resteAVivre);
  const labels = ['Loyer', 'Nourriture', 'Assurance', 'Dette', 'Factures', 'Autres', 'Abonnements', 'Épargne', 'Reste à vivre'];
  const values = [loyer, nourriture, assurance, dette, facture, autres, abonnements, epargne, restePositif];
  const colors = ['#4f46e5', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#f43f5e', '#0ea5e9', '#06b6d4', '#a3e635'];

  if (chart) {
    chart.data.labels = labels;
    chart.data.datasets[0].data = values;
    chart.data.datasets[0].backgroundColor = colors;
    chart.update();
    return;
  }

  const ctx = document.getElementById('budgetChart').getContext('2d');
  chart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{ data: values, backgroundColor: colors, borderWidth: 2, borderColor: '#fff', hoverOffset: 6 }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom', labels: { font: { size: 12 }, padding: 12, usePointStyle: true } },
        tooltip: {
          callbacks: {
            label(ctx) {
              const v = ctx.parsed;
              const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
              const pct = total > 0 ? ((v / total) * 100).toFixed(1) : 0;
              return ` ${fmt(v)}  (${pct} %)`;
            },
          },
        },
      },
    },
  });
}

// ── Comparaison mois précédent ─────────────────────────────────
function updateCompare(current) {
  const history = loadHistory();
  const keys = Object.keys(history).sort();
  if (keys.length === 0) { el.compareSection().hidden = true; return; }

  const lastKey = keys[keys.length - 1];
  const prev = history[lastKey];

  el.compareSection().hidden = false;
  el.compareMonthLabel().textContent = monthLabel(lastKey);

  const fields = [
    { id: 'totalCharges', label: 'totalCharges', format: fmt },
    { id: 'resteAVivre',  label: 'resteAVivre',  format: fmt },
    { id: 'tauxEpargne',  label: 'tauxEpargne',  format: v => v.toFixed(1) + ' %' },
    { id: 'sousDecote',   label: 'sousDecote',    format: fmt },
  ];

  fields.forEach(({ id, label, format }) => {
    const prevVal = prev[label] ?? 0;
    const curVal  = current[label] ?? 0;
    const delta   = curVal - prevVal;

    document.getElementById(`cmp-${id}`).textContent = format(prevVal);

    const dltEl = document.getElementById(`dlt-${id}`);
    if (delta === 0) { dltEl.textContent = '='; dltEl.className = 'compare-delta'; return; }
    const sign = delta > 0 ? '+' : '';
    dltEl.textContent = sign + (id === 'tauxEpargne' ? delta.toFixed(1) + ' %' : fmt(delta));
    dltEl.className = 'compare-delta ' + (delta > 0 ? 'delta--up' : 'delta--down');
  });
}

// ── localStorage ───────────────────────────────────────────────
function loadHistory() {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY)) || {}; } catch { return {}; }
}

function saveHistory(history) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

function save(computed) {
  const fields = {};
  ids.forEach(id => { fields[id] = document.getElementById(id).value; });
  const entry = { month: currentMonthKey(), fields, ...computed };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entry));
}

function archiveAndReset() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;
  try {
    const stored = JSON.parse(raw);
    if (!stored.month || stored.month === currentMonthKey()) return;

    // Archiver le mois passé
    const history = loadHistory();
    history[stored.month] = {
      totalCharges: stored.totalCharges ?? 0,
      resteAVivre:  stored.resteAVivre  ?? 0,
      tauxEpargne:  stored.tauxEpargne  ?? 0,
      sousDecote:   stored.sousDecote   ?? 0,
    };
    saveHistory(history);

    // Reporter uniquement les sous de côté
    const sousDecoteReporte = stored.sousDecote ?? 0;
    localStorage.removeItem(STORAGE_KEY);
    document.getElementById('sousDecote').value = sousDecoteReporte || '';

  } catch {}
}

function restore() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;
  try {
    const stored = JSON.parse(raw);
    if (stored.month !== currentMonthKey()) return;
    ids.forEach(id => {
      if (stored.fields?.[id] !== undefined) document.getElementById(id).value = stored.fields[id];
    });
  } catch {}
}

// ── Réinitialisation du mois ───────────────────────────────────
function reset() {
  const sousDecote = val('sousDecote');
  ids.forEach(id => { document.getElementById(id).value = ''; });
  document.getElementById('sousDecote').value = sousDecote || '';
  localStorage.removeItem(STORAGE_KEY);
  refresh();
}

// ── Cycle principal ────────────────────────────────────────────
function refresh() {
  const data = compute();
  updateDOM(data);
  updatePrime(data);
  updateGoal(data);
  updateChart(data);
  updateCompare(data);
  save(data);
}

// ── Formatage monétaire ────────────────────────────────────────
function fmt(n) {
  return n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
}

// ── Init ───────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  el.headerMonth().textContent = monthLabel(currentMonthKey());

  subs = loadSubs();
  renderSubs();

  goal = loadGoal();
  el.goalNom().value = goal.nom || '';
  el.goalMontant().value = goal.montant || '';
  el.goalNom().addEventListener('input', () => { goal.nom = el.goalNom().value; saveGoal(); });
  el.goalMontant().addEventListener('input', () => { goal.montant = el.goalMontant().value; saveGoal(); refresh(); });

  archiveAndReset();
  restore();
  refresh();

  ids.forEach(id => {
    document.getElementById(id).addEventListener('input', refresh);
  });
  el.btnReset().addEventListener('click', reset);
  el.btnAddSub().addEventListener('click', addSub);
});
