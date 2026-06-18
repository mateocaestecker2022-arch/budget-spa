const STORAGE_KEY = 'budgetData';

const ids = ['salaire', 'loyer', 'nourriture', 'assurance', 'dette', 'facture', 'autres', 'epargne', 'sousDecote'];

const el = {
  salaire:      () => document.getElementById('salaire'),
  loyer:        () => document.getElementById('loyer'),
  nourriture:   () => document.getElementById('nourriture'),
  assurance:    () => document.getElementById('assurance'),
  dette:        () => document.getElementById('dette'),
  facture:      () => document.getElementById('facture'),
  autres:       () => document.getElementById('autres'),
  epargne:      () => document.getElementById('epargne'),
  sousDecote:   () => document.getElementById('sousDecote'),
  sousDecoteDisplay: () => document.getElementById('sousDecoteDisplay'),
  totalCharges: () => document.getElementById('totalCharges'),
  resteAVivre:  () => document.getElementById('resteAVivre'),
  tauxEpargne:  () => document.getElementById('tauxEpargne'),
  alert:        () => document.getElementById('alert'),
  progressFill: () => document.getElementById('progressFill'),
  progressLabel:() => document.getElementById('progressLabel'),
  progressBar:  () => document.querySelector('.progress-bar'),
  btnReset:     () => document.getElementById('btnReset'),
};

let chart = null;

// ── Lecture des valeurs ────────────────────────────────────────
function val(id) {
  return Math.max(0, parseFloat(document.getElementById(id).value) || 0);
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

  const totalCharges = loyer + nourriture + assurance + dette + facture + autres;
  const resteAVivre  = salaire - totalCharges - epargne;
  const tauxEpargne  = salaire > 0 ? (epargne / salaire) * 100 : 0;

  return { salaire, loyer, nourriture, assurance, dette, facture, autres, epargne, sousDecote, totalCharges, resteAVivre, tauxEpargne };
}

// ── Mise à jour DOM ────────────────────────────────────────────
function updateDOM(data) {
  const { totalCharges, resteAVivre, tauxEpargne, epargne, salaire, sousDecote } = data;

  el.totalCharges().textContent = fmt(totalCharges);

  const resteEl = el.resteAVivre();
  resteEl.textContent = fmt(resteAVivre);
  resteEl.classList.toggle('negative', resteAVivre < 0);

  el.tauxEpargne().textContent = tauxEpargne.toFixed(1) + ' %';

  // Alerte (EF-08)
  el.alert().hidden = resteAVivre >= 0;

  // Barre de progression (EF-07)
  const pct = salaire > 0 ? Math.min(100, (epargne / salaire) * 100) : 0;
  el.progressFill().style.width = pct + '%';
  el.progressBar().setAttribute('aria-valuenow', Math.round(pct));
  el.progressLabel().textContent = fmt(epargne) + ' / ' + fmt(salaire);

  // Sous de côté
  el.sousDecoteDisplay().textContent = fmt(sousDecote);
}

// ── Graphique Chart.js (EF-06) ─────────────────────────────────
function updateChart(data) {
  const { loyer, nourriture, assurance, dette, facture, autres, epargne, resteAVivre } = data;

  const restePositif = Math.max(0, resteAVivre);
  const labels  = ['Loyer', 'Nourriture', 'Assurance', 'Dette', 'Factures', 'Autres', 'Épargne', 'Reste à vivre'];
  const values  = [loyer, nourriture, assurance, dette, facture, autres, epargne, restePositif];
  const colors  = ['#4f46e5', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#f43f5e', '#06b6d4', '#a3e635'];

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
      datasets: [{
        data: values,
        backgroundColor: colors,
        borderWidth: 2,
        borderColor: '#fff',
        hoverOffset: 6,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            font: { size: 12 },
            padding: 12,
            usePointStyle: true,
          },
        },
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

// ── Sauvegarde sessionStorage (EF-09) ─────────────────────────
function save() {
  const data = {};
  ids.forEach(id => { data[id] = document.getElementById(id).value; });
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function restore() {
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return;
  try {
    const data = JSON.parse(raw);
    ids.forEach(id => {
      if (data[id] !== undefined) document.getElementById(id).value = data[id];
    });
  } catch {}
}

// ── Réinitialisation (EF-10) ───────────────────────────────────
function reset() {
  ids.forEach(id => { document.getElementById(id).value = ''; });
  sessionStorage.removeItem(STORAGE_KEY);
  refresh();
}

// ── Cycle principal ────────────────────────────────────────────
function refresh() {
  const data = compute();
  updateDOM(data);
  updateChart(data);
  save();
}

// ── Formatage monétaire ────────────────────────────────────────
function fmt(n) {
  return n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
}

// ── Init ───────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  restore();
  refresh();
  ids.forEach(id => {
    document.getElementById(id).addEventListener('input', refresh);
  });
  el.btnReset().addEventListener('click', reset);
});
