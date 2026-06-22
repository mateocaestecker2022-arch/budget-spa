const STORAGE_KEY = 'budgetData';
const HISTORY_KEY = 'budgetHistory';
const SUBS_KEY = 'budgetSubscriptions';
const GOAL_KEY = 'budgetGoal';

let subs = [];
let goal = { nom: '', montant: '' };

const ids = ['salaire', 'loyer', 'nourriture', 'assurance', 'dette', 'facture', 'autres', 'sousDecote', 'detteRestante', 'detteRemboursementExtra', 'prime', 'primeMontantEpargne', 'primeMontantSousDecote', 'primeMontantReste', 'primeMontantDette', 'dispatchPctSousDecote', 'dispatchPctDette'];

const el = {
  salaire:           () => document.getElementById('salaire'),
  loyer:             () => document.getElementById('loyer'),
  nourriture:        () => document.getElementById('nourriture'),
  assurance:         () => document.getElementById('assurance'),
  dette:             () => document.getElementById('dette'),
  facture:           () => document.getElementById('facture'),
  autres:            () => document.getElementById('autres'),
  sousDecote:        () => document.getElementById('sousDecote'),
  detteRestante:        () => document.getElementById('detteRestante'),
  detteRemboursementExtra: () => document.getElementById('detteRemboursementExtra'),
  detteRestanteDisplay: () => document.getElementById('detteRestanteDisplay'),
  btnAppliquerDette:    () => document.getElementById('btnAppliquerDette'),
  dispatchTotalCharges: () => document.getElementById('dispatchTotalCharges'),
  dispatchReste:        () => document.getElementById('dispatchReste'),
  dispatchPctTotal:     () => document.getElementById('dispatchPctTotal'),
  dispatchAmtSousDecote: () => document.getElementById('dispatchAmtSousDecote'),
  dispatchAmtDette:      () => document.getElementById('dispatchAmtDette'),
  btnAppliquerDispatch:  () => document.getElementById('btnAppliquerDispatch'),
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
  primeMontantTotal: () => document.getElementById('primeMontantTotal'),
  btnAppliquerPrime: () => document.getElementById('btnAppliquerPrime'),
  totalCharges:      () => document.getElementById('totalCharges'),
  resteAVivre:       () => document.getElementById('resteAVivre'),
  alert:             () => document.getElementById('alert'),
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
  const sousDecote = val('sousDecote');
  const detteRestante = val('detteRestante');
  const abonnements = subsTotalAmount();

  const prime                  = val('prime');
  const primeMontantEpargne    = val('primeMontantEpargne');
  const primeMontantSousDecote = val('primeMontantSousDecote');
  const primeMontantReste      = val('primeMontantReste');
  const primeMontantDette      = val('primeMontantDette');
  const primeMontantTotal      = primeMontantEpargne + primeMontantSousDecote + primeMontantReste + primeMontantDette;

  const totalCharges = loyer + nourriture + assurance + dette + facture + autres + abonnements;
  const resteAVivre  = salaire - totalCharges;

  const dispatchPctSousDecote = val('dispatchPctSousDecote');
  const dispatchPctDette      = val('dispatchPctDette');
  const dispatchPctTotal      = dispatchPctSousDecote + dispatchPctDette;
  const dispatchBase          = Math.max(0, resteAVivre);
  const dispatchAmtSousDecote = dispatchBase * dispatchPctSousDecote / 100;
  const dispatchAmtDette      = dispatchBase * dispatchPctDette / 100;

  const goalMontant      = Math.max(0, parseFloat(goal.montant) || 0);
  const capaciteEpargne  = salaire - totalCharges;
  const goalProgressPct  = goalMontant > 0 ? Math.min(100, (sousDecote / goalMontant) * 100) : 0;
  const goalRemaining    = Math.max(0, goalMontant - sousDecote);
  const goalMonthsLeft   = capaciteEpargne > 0 ? Math.ceil(goalRemaining / capaciteEpargne) : null;

  return {
    salaire, loyer, nourriture, assurance, dette, facture, autres, sousDecote, detteRestante, abonnements,
    totalCharges, resteAVivre,
    prime, primeMontantEpargne, primeMontantSousDecote, primeMontantReste, primeMontantDette, primeMontantTotal,
    goalMontant, capaciteEpargne, goalProgressPct, goalRemaining, goalMonthsLeft,
    dispatchBase, dispatchPctSousDecote, dispatchPctDette, dispatchPctTotal, dispatchAmtSousDecote, dispatchAmtDette,
  };
}

// ── Mise à jour DOM ────────────────────────────────────────────
function updateDOM(data) {
  const { totalCharges, resteAVivre, sousDecote } = data;

  el.totalCharges().textContent = fmt(totalCharges);

  const resteEl = el.resteAVivre();
  resteEl.textContent = fmt(resteAVivre);
  resteEl.classList.toggle('negative', resteAVivre < 0);

  el.alert().hidden = resteAVivre >= 0;

  el.sousDecoteDisplay().textContent = fmt(sousDecote);
  el.subsTotal().textContent = fmt(data.abonnements);
  el.detteRestanteDisplay().textContent = fmt(data.detteRestante);
}

// ── Remboursement ponctuel de dette ────────────────────────────
function applyDebtPayment() {
  const extra = val('detteRemboursementExtra');
  if (extra <= 0) return;
  const next = Math.max(0, val('detteRestante') - extra);
  el.detteRestante().value = next || '';
  el.detteRemboursementExtra().value = '';
  refresh();
}

// ── Répartition du reste à vivre ────────────────────────────────
function updateDispatch(data) {
  const { totalCharges, dispatchBase, dispatchPctTotal, dispatchAmtSousDecote, dispatchAmtDette } = data;

  el.dispatchTotalCharges().textContent = fmt(totalCharges);
  el.dispatchReste().textContent = fmt(dispatchBase);

  const totalEl = el.dispatchPctTotal();
  totalEl.textContent = `Répartition totale : ${dispatchPctTotal} %`;
  totalEl.classList.toggle('warning', dispatchBase > 0 && dispatchPctTotal !== 100);

  el.dispatchAmtSousDecote().textContent = fmt(dispatchAmtSousDecote);
  el.dispatchAmtDette().textContent = fmt(dispatchAmtDette);
}

function applyDispatch() {
  const { dispatchAmtSousDecote, dispatchAmtDette } = compute();
  if (dispatchAmtSousDecote <= 0 && dispatchAmtDette <= 0) return;

  const newSousDecote    = val('sousDecote') + dispatchAmtSousDecote;
  const newDetteRestante = Math.max(0, val('detteRestante') - dispatchAmtDette);

  el.sousDecote().value    = newSousDecote || '';
  el.detteRestante().value = newDetteRestante || '';
  document.getElementById('dispatchPctSousDecote').value = '';
  document.getElementById('dispatchPctDette').value = '';
  refresh();
}

// ── Mise à jour répartition prime ──────────────────────────────
function updatePrime(data) {
  const { prime, primeMontantTotal } = data;

  const totalEl = el.primeMontantTotal();
  totalEl.textContent = `Réparti : ${fmt(primeMontantTotal)} / ${fmt(prime)}`;
  totalEl.classList.toggle('warning', prime > 0 && primeMontantTotal !== prime);
}

function applyPrime() {
  const { primeMontantEpargne, primeMontantSousDecote, primeMontantDette } = compute();
  const versSousDecote = primeMontantEpargne + primeMontantSousDecote;
  if (versSousDecote <= 0 && primeMontantDette <= 0) return;

  const newSousDecote    = val('sousDecote') + versSousDecote;
  const newDetteRestante = Math.max(0, val('detteRestante') - primeMontantDette);

  el.sousDecote().value    = newSousDecote || '';
  el.detteRestante().value = newDetteRestante || '';

  document.getElementById('prime').value = '';
  document.getElementById('primeMontantEpargne').value = '';
  document.getElementById('primeMontantSousDecote').value = '';
  document.getElementById('primeMontantReste').value = '';
  document.getElementById('primeMontantDette').value = '';
  refresh();
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
  const { loyer, nourriture, assurance, dette, facture, autres, abonnements, resteAVivre } = data;

  const restePositif = Math.max(0, resteAVivre);
  const labels = ['Loyer', 'Nourriture', 'Assurance', 'Dette', 'Factures', 'Autres', 'Abonnements', 'Reste à vivre'];
  const values = [loyer, nourriture, assurance, dette, facture, autres, abonnements, restePositif];
  const colors = ['#4f46e5', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#f43f5e', '#0ea5e9', '#a3e635'];

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
    dltEl.textContent = sign + fmt(delta);
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

    const sousDecoteReportee = stored.sousDecote ?? 0;
    const detteRestanteReportee = stored.detteRestante ?? 0;

    // Archiver le mois passé
    const history = loadHistory();
    history[stored.month] = {
      totalCharges:  stored.totalCharges  ?? 0,
      resteAVivre:   stored.resteAVivre   ?? 0,
      sousDecote:    sousDecoteReportee,
      detteRestante: detteRestanteReportee,
    };
    saveHistory(history);

    // Reporter le sous de côté et la dette restante (soldes cumulés)
    localStorage.removeItem(STORAGE_KEY);
    document.getElementById('sousDecote').value = sousDecoteReportee || '';
    document.getElementById('detteRestante').value = detteRestanteReportee || '';

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
  const detteRestante = val('detteRestante');
  ids.forEach(id => { document.getElementById(id).value = ''; });
  document.getElementById('sousDecote').value = sousDecote || '';
  document.getElementById('detteRestante').value = detteRestante || '';
  localStorage.removeItem(STORAGE_KEY);
  refresh();
}

// ── Cycle principal ────────────────────────────────────────────
function refresh() {
  const data = compute();
  updateDOM(data);
  updatePrime(data);
  updateGoal(data);
  updateDispatch(data);
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
  el.btnAppliquerDette().addEventListener('click', applyDebtPayment);
  el.btnAppliquerDispatch().addEventListener('click', applyDispatch);
  el.btnAppliquerPrime().addEventListener('click', applyPrime);
});
