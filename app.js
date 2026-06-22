const STORAGE_KEY    = 'budgetData';
const HISTORY_KEY    = 'budgetHistory';
const SUBS_KEY       = 'budgetSubscriptions';
const GOAL_KEY       = 'budgetGoal';
const RESET_DAY_KEY  = 'budgetResetDay';

// ── Supabase ────────────────────────────────────────────────────
const SUPABASE_URL = 'https://pgocmfqnatzsxyihkjra.supabase.co';
const SUPABASE_KEY = 'sb_publishable_ps_okVLusVNEmopxXA8s1A_DUFutwlH';
const _sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
let currentUser = null;

let subs = [];
let goals = [];
let resetDay = 1;

const ids = ['salaire', 'loyer', 'nourriture', 'assurance', 'dette', 'facture', 'autres', 'sousDecote', 'detteRestante', 'detteRemboursementExtra', 'prime', 'primeMontantEpargne', 'primeMontantSousDecote', 'primeMontantReste', 'primeMontantDette', 'dispatchPctSousDecote', 'dispatchPctDette'];

const el = {
  salaire:              () => document.getElementById('salaire'),
  loyer:                () => document.getElementById('loyer'),
  nourriture:           () => document.getElementById('nourriture'),
  assurance:            () => document.getElementById('assurance'),
  dette:                () => document.getElementById('dette'),
  facture:              () => document.getElementById('facture'),
  autres:               () => document.getElementById('autres'),
  sousDecote:           () => document.getElementById('sousDecote'),
  detteRestante:        () => document.getElementById('detteRestante'),
  detteRemboursementExtra: () => document.getElementById('detteRemboursementExtra'),
  detteRestanteDisplay: () => document.getElementById('detteRestanteDisplay'),
  btnAppliquerDette:    () => document.getElementById('btnAppliquerDette'),
  dispatchTotalCharges: () => document.getElementById('dispatchTotalCharges'),
  dispatchReste:        () => document.getElementById('dispatchReste'),
  dispatchPctTotal:     () => document.getElementById('dispatchPctTotal'),
  dispatchAmtSousDecote: () => document.getElementById('dispatchAmtSousDecote'),
  dispatchAmtDette:     () => document.getElementById('dispatchAmtDette'),
  btnAppliquerDispatch: () => document.getElementById('btnAppliquerDispatch'),
  subsList:             () => document.getElementById('subsList'),
  subsTotal:            () => document.getElementById('subsTotal'),
  btnAddSub:            () => document.getElementById('btnAddSub'),
  goalsList:            () => document.getElementById('goalsList'),
  btnAddGoal:           () => document.getElementById('btnAddGoal'),
  capaciteEpargne:      () => document.getElementById('capaciteEpargne'),
  primeMontantTotal:    () => document.getElementById('primeMontantTotal'),
  btnAppliquerPrime:    () => document.getElementById('btnAppliquerPrime'),
  totalCharges:         () => document.getElementById('totalCharges'),
  resteAVivre:          () => document.getElementById('resteAVivre'),
  alert:                () => document.getElementById('alert'),
  sousDecoteDisplay:    () => document.getElementById('sousDecoteDisplay'),
  detteRestanteResult:  () => document.getElementById('detteRestanteResult'),
  btnReset:             () => document.getElementById('btnReset'),
  headerMonth:          () => document.getElementById('headerMonth'),
  compareSection:       () => document.getElementById('compareSection'),
  compareMonthLabel:    () => document.getElementById('compareMonthLabel'),
  conseilsList:         () => document.getElementById('conseilsList'),
};

let chart = null;

// ── Période de réinitialisation ────────────────────────────────
function currentPeriodKey(day) {
  const now = new Date();
  const y = now.getFullYear(), m = now.getMonth(), d = now.getDate();
  const start = d >= day ? new Date(y, m, day) : new Date(y, m - 1, day);
  return `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function periodLabel(key) {
  const parts = key.split('-');
  if (parts.length === 2) {
    // ancien format YYYY-MM
    return new Date(parts[0], parts[1] - 1, 1).toLocaleString('fr-FR', { month: 'long', year: 'numeric' });
  }
  const [year, month, day] = parts;
  const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  const d = parseInt(day);
  const monthStr = date.toLocaleString('fr-FR', { month: 'long' });
  return d === 1 ? `${monthStr} ${year}` : `du ${d} ${monthStr} ${year}`;
}

function loadResetDay() {
  try { return Math.max(1, Math.min(28, parseInt(localStorage.getItem(RESET_DAY_KEY)) || 1)); } catch { return 1; }
}

function saveResetDay() {
  localStorage.setItem(RESET_DAY_KEY, String(resetDay));
  syncToCloud(RESET_DAY_KEY, resetDay);
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
  syncToCloud(SUBS_KEY, subs);
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

// ── Objectifs d'épargne ──────────────────────────────────────────
function genGoalId() {
  return Date.now() + Math.random().toString(36).slice(2);
}

function loadGoals() {
  try {
    const parsed = JSON.parse(localStorage.getItem(GOAL_KEY));
    if (!parsed) return [];
    // Migration ancien format objet → tableau
    if (!Array.isArray(parsed)) {
      if (parsed.nom || parsed.montant) return [{ id: genGoalId(), nom: parsed.nom || '', montant: parsed.montant || '' }];
      return [];
    }
    return parsed;
  } catch { return []; }
}

function saveGoals() {
  localStorage.setItem(GOAL_KEY, JSON.stringify(goals));
  syncToCloud(GOAL_KEY, goals);
}

function addGoal() {
  goals.push({ id: genGoalId(), nom: '', montant: '' });
  saveGoals();
  refresh();
  el.goalsList().querySelector('.goal-item:last-child .goal-name')?.focus();
}

function renderGoals(sousDecote, capaciteEpargne) {
  const list = el.goalsList();
  list.innerHTML = '';

  if (goals.length === 0) {
    const p = document.createElement('p');
    p.className = 'goals-empty';
    p.textContent = 'Aucun objectif — ajoute-en un ci-dessous.';
    list.appendChild(p);
    return;
  }

  let remaining = sousDecote;

  goals.forEach((g, idx) => {
    const target = Math.max(0, parseFloat(g.montant) || 0);
    const filled = Math.min(remaining, target);
    const pct    = target > 0 ? Math.min(100, (filled / target) * 100) : 0;
    const left   = Math.max(0, target - filled);
    const months = capaciteEpargne > 0 && left > 0 ? Math.ceil(left / capaciteEpargne) : null;
    remaining = Math.max(0, remaining - filled);

    const item = document.createElement('div');
    item.className = 'goal-item';

    // ─ Header : badge + nom + montant + boutons
    const header = document.createElement('div');
    header.className = 'goal-item-header';

    const badge = document.createElement('span');
    badge.className = 'goal-priority';
    badge.textContent = idx + 1;

    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.className = 'goal-name';
    nameInput.placeholder = 'ex: Voyage au Japon';
    nameInput.value = g.nom;
    nameInput.setAttribute('aria-label', 'Nom de l\'objectif');
    nameInput.addEventListener('input', () => { g.nom = nameInput.value; saveGoals(); });

    const targetInput = document.createElement('input');
    targetInput.type = 'number';
    targetInput.className = 'goal-target';
    targetInput.min = '0';
    targetInput.step = '1';
    targetInput.placeholder = 'ex: 10000';
    targetInput.value = g.montant;
    targetInput.setAttribute('aria-label', 'Montant cible (€)');
    targetInput.addEventListener('input', () => { g.montant = targetInput.value; saveGoals(); refresh(); });

    const actions = document.createElement('div');
    actions.className = 'goal-actions';

    const upBtn = document.createElement('button');
    upBtn.type = 'button';
    upBtn.className = 'goal-btn goal-btn--move';
    upBtn.textContent = '↑';
    upBtn.setAttribute('aria-label', 'Priorité plus haute');
    upBtn.disabled = idx === 0;
    upBtn.addEventListener('click', () => {
      [goals[idx - 1], goals[idx]] = [goals[idx], goals[idx - 1]];
      saveGoals(); refresh();
    });

    const downBtn = document.createElement('button');
    downBtn.type = 'button';
    downBtn.className = 'goal-btn goal-btn--move';
    downBtn.textContent = '↓';
    downBtn.setAttribute('aria-label', 'Priorité plus basse');
    downBtn.disabled = idx === goals.length - 1;
    downBtn.addEventListener('click', () => {
      [goals[idx], goals[idx + 1]] = [goals[idx + 1], goals[idx]];
      saveGoals(); refresh();
    });

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'goal-btn goal-btn--remove';
    removeBtn.textContent = '×';
    removeBtn.setAttribute('aria-label', 'Supprimer cet objectif');
    removeBtn.addEventListener('click', () => {
      goals = goals.filter(og => og.id !== g.id);
      saveGoals(); refresh();
    });

    actions.append(upBtn, downBtn, removeBtn);
    header.append(badge, nameInput, targetInput, actions);

    // ─ Barre de progression
    const progressSection = document.createElement('div');
    progressSection.className = 'goal-progress';

    const progressHeader = document.createElement('div');
    progressHeader.className = 'progress-header';
    const labelLeft = document.createElement('span');
    labelLeft.textContent = `${fmt(filled)} / ${fmt(target)}`;
    const labelRight = document.createElement('span');
    labelRight.textContent = Math.round(pct) + ' %';
    progressHeader.append(labelLeft, labelRight);

    const progressBar = document.createElement('div');
    progressBar.className = 'progress-bar';
    progressBar.setAttribute('role', 'progressbar');
    progressBar.setAttribute('aria-valuemin', '0');
    progressBar.setAttribute('aria-valuemax', '100');
    progressBar.setAttribute('aria-valuenow', Math.round(pct));
    const progressFill = document.createElement('div');
    progressFill.className = 'progress-fill';
    progressFill.style.width = pct + '%';
    progressBar.appendChild(progressFill);

    const estimation = document.createElement('p');
    estimation.className = 'goal-estimation';
    if (target <= 0) {
      estimation.textContent = 'Définis un montant cible';
    } else if (filled >= target) {
      estimation.textContent = '✓ Objectif atteint !';
    } else if (months === null) {
      estimation.textContent = 'Pas d\'estimation possible';
    } else {
      estimation.textContent = `Encore ${months} mois à ce rythme`;
    }

    progressSection.append(progressHeader, progressBar, estimation);
    item.append(header, progressSection);
    list.appendChild(item);
  });
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

  const capaciteEpargne = salaire - totalCharges;

  return {
    salaire, loyer, nourriture, assurance, dette, facture, autres, sousDecote, detteRestante, abonnements,
    totalCharges, resteAVivre,
    prime, primeMontantEpargne, primeMontantSousDecote, primeMontantReste, primeMontantDette, primeMontantTotal,
    capaciteEpargne,
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

  el.sousDecoteDisplay().textContent    = fmt(sousDecote);
  el.detteRestanteResult().textContent  = fmt(data.detteRestante);
  el.subsTotal().textContent            = fmt(data.abonnements);
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
  el.dispatchReste().textContent        = fmt(dispatchBase);

  const totalEl = el.dispatchPctTotal();
  totalEl.textContent = `Répartition totale : ${dispatchPctTotal} %`;
  totalEl.classList.toggle('warning', dispatchBase > 0 && dispatchPctTotal !== 100);

  el.dispatchAmtSousDecote().textContent = fmt(dispatchAmtSousDecote);
  el.dispatchAmtDette().textContent      = fmt(dispatchAmtDette);
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

// ── Répartition prime ──────────────────────────────────────────
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

// ── Objectifs d'épargne ──────────────────────────────────────────
function updateGoal(data) {
  el.capaciteEpargne().textContent = fmt(data.capaciteEpargne);
  renderGoals(data.sousDecote, data.capaciteEpargne);
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

// ── Conseils ─────────────────────────────────────────────────────
function computeConseils(data) {
  const { salaire, loyer, totalCharges, sousDecote, detteRestante, dette, abonnements, capaciteEpargne, dispatchPctTotal } = data;
  const conseils = [];

  if (salaire > 0 && loyer > salaire * 0.33) {
    conseils.push({ type: 'warning', text: `Ton loyer représente ${Math.round(loyer / salaire * 100)} % de ton salaire — la recommandation est de rester sous 33 %.` });
  }

  if (totalCharges > 0 && sousDecote < totalCharges * 3) {
    conseils.push({ type: 'warning', text: `Ton matelas de sécurité (Sous de côté : ${fmt(sousDecote)}) couvre moins de 3 mois de charges (${fmt(totalCharges * 3)}) — vise au moins ce montant.` });
  }

  if (detteRestante > 0) {
    if (dette > 0) {
      const moisRestants = Math.ceil(detteRestante / dette);
      if (moisRestants > 24) {
        conseils.push({ type: 'warning', text: `Au rythme actuel (${fmt(dette)}/mois), il te faudra encore ${moisRestants} mois pour rembourser ta dette — augmente le remboursement mensuel ou fais un remboursement ponctuel.` });
      }
    } else {
      conseils.push({ type: 'warning', text: `Tu as une dette restante de ${fmt(detteRestante)} mais aucun remboursement mensuel défini.` });
    }
  }

  if (salaire > 0 && abonnements > salaire * 0.1) {
    conseils.push({ type: 'info', text: `Tes abonnements représentent ${fmt(abonnements)}/mois (${Math.round(abonnements / salaire * 100)} % du salaire) — vérifie si tu utilises tout.` });
  }

  if (capaciteEpargne > 0 && dispatchPctTotal === 0) {
    conseils.push({ type: 'info', text: `Tu as une capacité d'épargne de ${fmt(capaciteEpargne)} ce mois — pense à la répartir vers Sous de côté / Dette dans "Répartition du reste à vivre".` });
  }

  if (goals.length === 0 && capaciteEpargne > 0) {
    conseils.push({ type: 'info', text: `Tu as une capacité d'épargne positive mais aucun objectif d'épargne défini — pense à en créer un.` });
  }

  if (conseils.length === 0) {
    conseils.push({ type: 'success', text: 'Ton budget est équilibré, continue comme ça !' });
  }

  return conseils;
}

function updateConseils(data) {
  const list = el.conseilsList();
  list.innerHTML = '';
  computeConseils(data).forEach(({ type, text }) => {
    const li = document.createElement('li');
    li.className = `conseil-item conseil-item--${type}`;
    li.textContent = text;
    list.appendChild(li);
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
  el.compareMonthLabel().textContent = periodLabel(lastKey);

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
  syncToCloud(HISTORY_KEY, history);
}

function save(computed) {
  const fields = {};
  ids.forEach(id => { fields[id] = document.getElementById(id).value; });
  const entry = { period: currentPeriodKey(resetDay), fields, ...computed };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entry));
  syncToCloud(STORAGE_KEY, entry);
}

function archiveAndReset() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;
  try {
    const stored = JSON.parse(raw);
    const currentKey = currentPeriodKey(resetDay);
    const storedKey  = stored.period || stored.month; // compat ancien format
    if (!storedKey || storedKey === currentKey) return;

    const sousDecoteReportee    = stored.sousDecote    ?? 0;
    const detteRestanteReportee = stored.detteRestante ?? 0;

    const history = loadHistory();
    history[storedKey] = {
      totalCharges:  stored.totalCharges  ?? 0,
      resteAVivre:   stored.resteAVivre   ?? 0,
      sousDecote:    sousDecoteReportee,
      detteRestante: detteRestanteReportee,
    };
    saveHistory(history);

    localStorage.removeItem(STORAGE_KEY);
    document.getElementById('sousDecote').value    = sousDecoteReportee    || '';
    document.getElementById('detteRestante').value = detteRestanteReportee || '';
  } catch {}
}

function restore() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;
  try {
    const stored = JSON.parse(raw);
    const storedKey = stored.period || stored.month;
    if (storedKey !== currentPeriodKey(resetDay)) return;
    ids.forEach(id => {
      if (stored.fields?.[id] !== undefined) document.getElementById(id).value = stored.fields[id];
    });
  } catch {}
}

// ── Réinitialisation du mois ───────────────────────────────────
function reset() {
  const sousDecote    = val('sousDecote');
  const detteRestante = val('detteRestante');
  ids.forEach(id => { document.getElementById(id).value = ''; });
  document.getElementById('sousDecote').value    = sousDecote    || '';
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
  updateConseils(data);
  save(data);
}

// ── Formatage monétaire ────────────────────────────────────────
function fmt(n) {
  return n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
}

// ── Auth ────────────────────────────────────────────────────────
let authMode = 'login';

function showApp() {
  document.getElementById('authOverlay').hidden = true;
  document.getElementById('mainContent').hidden = false;
}

function showAuth() {
  document.getElementById('mainContent').hidden = true;
  document.getElementById('authOverlay').hidden = false;
  document.getElementById('authLoading').hidden = true;
  document.getElementById('authCard').hidden    = false;
}

function setAuthMode(mode) {
  authMode = mode;
  document.getElementById('tabLogin').classList.toggle('active', mode === 'login');
  document.getElementById('tabSignup').classList.toggle('active', mode === 'signup');
  document.getElementById('btnAuth').textContent = mode === 'login' ? 'Se connecter' : 'Créer un compte';
  document.getElementById('authError').hidden = true;
}

function showAuthMsg(msg, isError = true) {
  const errEl = document.getElementById('authError');
  errEl.textContent = msg;
  errEl.className   = isError ? 'is-error' : 'is-success';
  errEl.hidden      = false;
}

function translateAuthError(msg) {
  if (msg.includes('Invalid login credentials'))   return 'Email ou mot de passe incorrect.';
  if (msg.includes('Email not confirmed'))         return 'Confirme ton email avant de te connecter.';
  if (msg.includes('User already registered'))     return 'Ce compte existe déjà — connecte-toi à la place.';
  if (msg.includes('Password should be at least')) return 'Le mot de passe doit faire au moins 6 caractères.';
  return msg;
}

async function handleAuth() {
  const email    = document.getElementById('authEmail').value.trim();
  const password = document.getElementById('authPassword').value;
  const btn      = document.getElementById('btnAuth');

  if (!email || !password) { showAuthMsg('Email et mot de passe requis.'); return; }

  btn.disabled    = true;
  btn.textContent = authMode === 'login' ? 'Connexion…' : 'Création…';
  document.getElementById('authError').hidden = true;

  const { data, error } = authMode === 'login'
    ? await _sb.auth.signInWithPassword({ email, password })
    : await _sb.auth.signUp({ email, password });

  btn.disabled    = false;
  btn.textContent = authMode === 'login' ? 'Se connecter' : 'Créer un compte';

  if (error) { showAuthMsg(translateAuthError(error.message)); return; }

  if (authMode === 'signup' && !data.session) {
    showAuthMsg('Compte créé ! Vérifie ta boîte mail pour confirmer ton inscription.', false);
  }
}

// ── Cloud sync ──────────────────────────────────────────────────
async function syncToCloud(key, value) {
  if (!currentUser) return;
  try {
    await _sb.from('budget_data').upsert(
      { user_id: currentUser.id, key, value, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,key' }
    );
  } catch {}
}

async function loadFromCloud() {
  if (!currentUser) return;
  try {
    const { data } = await _sb
      .from('budget_data')
      .select('key, value')
      .eq('user_id', currentUser.id);

    if (!data || data.length === 0) {
      await migrateLocalToCloud();
      return;
    }
    data.forEach(({ key, value }) => {
      localStorage.setItem(key, JSON.stringify(value));
    });
  } catch {}
}

async function migrateLocalToCloud() {
  for (const key of [STORAGE_KEY, HISTORY_KEY, SUBS_KEY, GOAL_KEY, RESET_DAY_KEY]) {
    const raw = localStorage.getItem(key);
    if (raw) {
      try { await syncToCloud(key, JSON.parse(raw)); } catch {}
    }
  }
}

// ── Init données app ───────────────────────────────────────────
function initAppData() {
  resetDay = loadResetDay();
  const rdInput = document.getElementById('resetDay');
  if (rdInput) rdInput.value = resetDay;

  subs = loadSubs();
  renderSubs();

  goals = loadGoals();

  archiveAndReset();
  restore();

  el.headerMonth().textContent = periodLabel(currentPeriodKey(resetDay));
  refresh();
}

function clearAppData() {
  ids.forEach(id => { const domEl = document.getElementById(id); if (domEl) domEl.value = ''; });
  subs = [];
  renderSubs();
  goals = [];
  if (chart) { chart.destroy(); chart = null; }
}

// ── Init ───────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Auth UI
  document.getElementById('tabLogin').addEventListener('click',  () => setAuthMode('login'));
  document.getElementById('tabSignup').addEventListener('click', () => setAuthMode('signup'));
  document.getElementById('btnAuth').addEventListener('click',   handleAuth);
  document.getElementById('authPassword').addEventListener('keydown', e => { if (e.key === 'Enter') handleAuth(); });
  document.getElementById('btnLogout').addEventListener('click', () => _sb.auth.signOut());

  // App inputs
  el.btnAddGoal().addEventListener('click', addGoal);
  ids.forEach(id => { document.getElementById(id).addEventListener('input', refresh); });
  document.getElementById('resetDay').addEventListener('change', () => {
    const v = Math.max(1, Math.min(28, parseInt(document.getElementById('resetDay').value) || 1));
    document.getElementById('resetDay').value = v;
    resetDay = v;
    saveResetDay();
    el.headerMonth().textContent = periodLabel(currentPeriodKey(resetDay));
  });
  el.btnReset().addEventListener('click',             reset);
  el.btnAddSub().addEventListener('click',            addSub);
  el.btnAppliquerDette().addEventListener('click',    applyDebtPayment);
  el.btnAppliquerDispatch().addEventListener('click', applyDispatch);
  el.btnAppliquerPrime().addEventListener('click',    applyPrime);

  // Auth state
  _sb.auth.onAuthStateChange(async (event, session) => {
    if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN') {
      currentUser = session?.user ?? null;
      if (currentUser) {
        document.getElementById('headerUserEmail').textContent = currentUser.email;
        document.getElementById('headerUser').hidden = false;
        await loadFromCloud();
        showApp();
        initAppData();
      } else {
        // Pas de session au démarrage
        showAuth();
      }
    } else if (event === 'SIGNED_OUT') {
      currentUser = null;
      document.getElementById('headerUser').hidden = true;
      clearAppData();
      showAuth();
    }
  });
});
