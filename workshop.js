'use strict';
const $ = id => document.getElementById(id);
const M = StarchLab;
const KEY = 'biokemi2-starch-lab-v2';
// Keep the storage key so existing lab answers survive the full-day expansion.
const answerFields = Array.from(document.querySelectorAll('[data-save]'));
const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const blank = () => ({ selected: 1, plate: 'glycogen', detector: 'char', answers: {}, records: Object.fromEntries(M.samples.map(s => [s.id, { prediction: '', observation: '', revealed: false, source: '' }])) });
let state = blank(), after = false;
try {
  const saved = JSON.parse(localStorage.getItem(KEY));
  if (saved && typeof saved === 'object') {
    if (M.samples.some(s => s.id === saved.selected)) state.selected = saved.selected;
    if (['all', ...M.substrates.map(s => s.id)].includes(saved.plate)) state.plate = saved.plate;
    if (['char', 'iodine'].includes(saved.detector)) state.detector = saved.detector;
    // Preserve completed TLC prep from earlier workbooks in the student's download.
    for (const [key, value] of Object.entries(saved.answers || {})) {
      if (/^theory-6(?:-[a-d](?:-mcq)?)?$/.test(key) && typeof value === 'string' && value) {
        state.answers[key] = value;
      }
    }
    for (const key of answerFields.map(field => field.dataset.save)) {
      const value = saved.answers?.[key];
      if (typeof value !== 'string') continue;
      if (key.startsWith('theory-4-') && value === 'ISA1 / ISA2 complex') {
        state.answers[key] = 'Isoamylase / pullulanase-type debrancher';
      } else {
        state.answers[key] = value;
      }
    }
    for (const s of M.samples) {
      const r = saved.records?.[s.id];
      if (r && typeof r.prediction === 'string' && typeof r.observation === 'string') {
        state.records[s.id] = { prediction: r.prediction, observation: r.observation, revealed: r.revealed === true, source: r.source === 'class' ? 'class' : 'individual' };
      }
    }
  }
} catch (_) { /* Offline/file URL storage may be unavailable. Export still works. */ }
after = state.records[state.selected].revealed;
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); $('save-status').textContent = 'Saved in this browser only. Download your notebook before leaving.'; }
  catch (_) { $('save-status').textContent = 'Browser storage is unavailable. Keep this tab open and download your notebook to retain your answers.'; }
}
function restoreAnswer(input, value) {
  if (input.tagName === 'FIELDSET') {
    for (const radio of input.querySelectorAll('input[type=radio]')) {
      radio.checked = radio.value === value;
    }
  } else {
    input.value = value;
  }
}
answerFields.forEach(input => {
  restoreAnswer(input, state.answers[input.dataset.save] || '');
  const oldResponse = input.closest('[data-legacy-response]');
  if (oldResponse) oldResponse.hidden = !input.value;
  input.addEventListener('input', event => { state.answers[input.dataset.save] = event.target.value; save(); });
});
function selectSample(id) {
  state.selected = Number(id);
  after = state.records[state.selected].revealed;
  if (state.plate !== 'all') state.plate = M.sample(id).substrate;
  $('run-message').textContent = '';
  save(); render();
  const field = after ? $('observation') : $('prediction');
  $('sample-number').scrollIntoView({ block: 'start' });
  field.focus({ preventScroll: true });
}
function renderMatrix() {
  $('matrix-body').innerHTML = M.substrates.map(s => `<tr><th scope="row">${esc(s.short)}</th>${M.treatments.map(t => {
    const sample = M.samples.find(x => x.substrate === s.id && x.treatment === t.id), r = state.records[sample.id];
    const status = r.revealed ? 'Revealed' : r.prediction.trim() ? 'Prediction saved' : 'Predict';
    return `<td><button class="sample-button ${r.revealed ? 'revealed' : ''}" data-sample="${sample.id}" aria-pressed="${sample.id === state.selected}" aria-label="Sample ${sample.id}: ${esc(s.short)}, ${esc(t.name)}, ${status}">${sample.id}<span>${status}</span></button></td>`;
  }).join('')}</tr>`).join('');
  $('matrix-body').querySelectorAll('[data-sample]').forEach(b => b.addEventListener('click', () => selectSample(b.dataset.sample)));
  const count = M.samples.filter(s => state.records[s.id].revealed).length;
  const group = M.sample(state.selected).substrateInfo;
  const groupCount = M.samples.filter(s => s.substrate === group.id && state.records[s.id].revealed).length;
  $('progress').textContent = `${group.short}: ${groupCount} / 5 revealed · Class: ${count} / 15`;
  $('reveal-all').disabled = count === 15;
}
const nextBenchStep = document.createElement('button');
nextBenchStep.type = 'button';
nextBenchStep.className = 'secondary';
$('observation').closest('label').after(nextBenchStep);
function updateNextStep() {
  const selected = M.sample(state.selected);
  const group = M.samples.filter(s => s.substrate === selected.substrate);
  const remaining = group.filter(s => !state.records[s.id].revealed);
  const nextPrediction = remaining.find(s => !state.records[s.id].prediction);
  const next = nextPrediction || remaining[0];
  nextBenchStep.hidden = next?.id === selected.id;
  if (next) {
    nextBenchStep.textContent = `Open sample ${next.id} to ${nextPrediction ? 'predict' : 'run'}`;
    nextBenchStep.onclick = () => selectSample(next.id);
  } else {
    nextBenchStep.textContent = `Read the ${selected.substrateInfo.short.toLowerCase()} TLC plate`;
    nextBenchStep.onclick = () => {
      state.plate = selected.substrate;
      save(); renderPlate();
      $('tlc').scrollIntoView();
      $('plate-substrate').focus({ preventScroll: true });
    };
  }
}
function renderBench() {
  const r = M.result(state.selected), record = state.records[r.id], t = r.treatmentInfo;
  $('sample-number').textContent = `Sample ${r.id}`;
  $('sample-title').textContent = `${r.substrateInfo.name} · ${t.name}`;
  $('sample-description').textContent = r.substrateInfo.structure;
  $('sample-protocol').textContent = `${t.heated ? 'Pretreatment: 60°C, 5 min.' : 'No heat pretreatment.'} 100 µl substrate + 100 µl ${t.enzyme === 'none' ? 'Tris' : t.enzyme === 'alpha' ? 'diluted saliva' : 'isoamylase'}. Incubation: 37°C, 30 min; then ice.`;
  const prediction = $('prediction');
  prediction.querySelector('[data-legacy]')?.remove();
  if (record.prediction && ![...prediction.options].some(option => option.value === record.prediction)) {
    const old = new Option(record.prediction, record.prediction);
    old.dataset.legacy = '';
    prediction.add(old);
  }
  prediction.value = record.prediction;
  prediction.disabled = record.revealed;
  $('prediction-note').textContent = record.revealed
    ? (record.prediction ? 'Your earlier prediction is saved with this sample.' : 'The class reveal opened this sample before a prediction was recorded.')
    : 'Choose an outcome for each of the five samples in your substrate row. Then return to run them.';
  if (record.revealed && record.prediction && !prediction.selectedOptions[0]?.hasAttribute('data-legacy')) {
    const outcome = {none: 'No enzymatic cleavage', more: 'Internal backbone cleavage',
      limited: 'Internal backbone cleavage', debranch: 'Branch-point cleavage'}[r.extent];
    const verdict = record.prediction === outcome ? 'Correct.' : 'The expected outcome is ' + outcome.toLowerCase() + '.';
    $('prediction-note').textContent = verdict + ' ' + r.explanation;
  }
  $('observation').value = record.observation;
  $('observation').disabled = !record.revealed;
  $('run-sample').disabled = record.revealed;
  $('run-sample').textContent = record.revealed ? 'Result revealed' : 'Run virtual sample';
  updateNextStep();
  $('structure-after').disabled = !record.revealed;
  if (record.revealed) {
    const colour = r.iodine.colour;
    $('iodine-readout').innerHTML = `<div class="iodine-result"><svg viewBox="0 0 100 150" role="img" aria-label="${esc(r.iodine.name)}"><path d="M25 15 L25 115 Q25 140 50 140 Q75 140 75 115 L75 15" fill="#f8fafb" stroke="#8aa5ac" stroke-width="2"/><path d="M28 55 L28 115 Q28 137 50 137 Q72 137 72 115 L72 55Z" fill="#f6f7fb"/><path d="M28 55 L28 115 Q28 137 50 137 Q72 137 72 115 L72 55Z" fill="${colour}" opacity="${r.iodine.strength}"/><ellipse cx="50" cy="55" rx="22" ry="5" fill="${colour}" opacity="${r.iodine.strength}"/><path d="M22 15H78" stroke="#8aa5ac" stroke-width="3"/><path d="M34 64V111" stroke="white" stroke-opacity=".45" stroke-width="4" stroke-linecap="round"/></svg><div><h4>${esc(r.iodine.name)}</h4><p>${esc(r.iodine.note)}</p><p class="small">Illustrative bulk iodine colour; no absorbance or concentration scale.</p></div></div>`;
    $('mechanism').innerHTML = `<p><strong>${esc(r.outcome)}</strong></p><p class="small">${esc(r.substrateInfo.heat)}</p>`;
    if (!record.prediction || prediction.selectedOptions[0]?.hasAttribute('data-legacy')) {
      const explanation = document.createElement('p');
      explanation.textContent = r.explanation;
      $('mechanism').append(explanation);
    }
    showMatchedComparison(r);
  } else {
    $('iodine-readout').innerHTML = '<div class="placeholder">Record a prediction and run this sample to reveal the iodine readout.</div>';
    $('mechanism').innerHTML = '<p class="small">Start with the structure below. Which linkages are targets for this treatment?</p>';
  }
  renderMolecule();
}
function showMatchedComparison(result) {
  const targets = {
    'control-native': 'saliva-native',
    'control-heated': 'control-native',
    'saliva-native': 'control-native',
    'saliva-heated': 'control-heated',
    'iso-heated': 'control-heated'
  };
  const target = M.samples.find(s => s.substrate === result.substrate && s.treatment === targets[result.treatment]);
  const other = M.result(target.id);
  const heatComparison = result.treatment === 'control-heated';
  const text = document.createElement('p');
  text.textContent = heatComparison
    ? `Compare samples ${result.id} and ${other.id} to isolate heat pretreatment. Both contain Tris.`
    : `Compare samples ${result.id} and ${other.id} to isolate enzyme action. The substrate and pretreatment match.`;
  if (state.records[other.id].revealed) {
    text.textContent += ` Sample ${other.id} (${other.treatmentInfo.short}): ${other.iodine.name.toLowerCase()}. ${other.outcome}`;
  }
  const open = document.createElement('button');
  open.type = 'button';
  open.className = 'secondary';
  open.textContent = `Open sample ${other.id} · ${other.treatmentInfo.short}`;
  open.addEventListener('click', () => selectSample(other.id));
  $('mechanism').append(text, open);
}
function renderMolecule() {
  const graph = M.molecule(state.selected, after && state.records[state.selected].revealed);
  const lines = graph.bonds.map(b => {
    const a = graph.nodes[b.from], c = graph.nodes[b.to];
    const x1 = a.x + 16, y1 = a.y, x2 = c.x - (b.type === '14' ? 16 : 8), y2 = c.y - (b.type === '14' ? 0 : 36);
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
    const colour = b.type === '14' ? '#438578' : '#9865b5';
    return `<g><title>α(1→${b.type === '14' ? '4' : '6'})${b.cut ? ' cleaved' : ' intact'}</title><path d="M${x1} ${y1}L${x2} ${y2}" stroke="${colour}" stroke-width="3" ${b.cut ? 'stroke-opacity=".2" stroke-dasharray="3 5"' : b.type === '16' ? 'stroke-dasharray="5 3"' : ''}/>${b.cut ? `<path d="M${mx-5} ${my-5}l10 10m0-10l-10 10" stroke="#bb514c" stroke-width="2.5"/>` : `<text x="${mx + (b.type === '16' ? 15 : 0)}" y="${my-8}" text-anchor="middle" font-size="11" fill="${colour}">${b.type === '14' ? 'α1–4' : 'α1–6'}</text>`}</g>`;
  }).join('');
  const residues = graph.nodes.map(n => `<g transform="translate(${n.x},${n.y})"><title>Glucose residue ${n.id + 1}${n.reducing ? ', reducing end: free anomeric C1' : ''}${n.nonreducing ? ', nonreducing end' : ''}</title><path d="M16 0L8 14H-8L-16 0L-8-14H8Z" fill="#e5f1e9" stroke="#517565" stroke-width="1.6"/><path d="M-8-14V-33" stroke="#517565" stroke-width="1.6"/><circle cx="8" cy="-14" r="7" fill="#f7fafb"/><g font-size="10" text-anchor="middle" fill="#32544b"><text x="8" y="-10">O</text><text x="10" y="4">1</text><text x="-10" y="4">4</text><text x="-8" y="-36">6</text></g>${n.reducing ? '<circle cx="21" cy="26" r="10" fill="#315eae"/><text x="21" y="30" font-size="11" text-anchor="middle" fill="white">R</text>' : ''}${n.nonreducing ? '<circle cx="-21" cy="26" r="10" fill="#1b7555"/><text x="-21" y="30" font-size="11" text-anchor="middle" fill="white">N</text>' : ''}</g>`).join('');
  $('molecule').innerHTML = `<svg viewBox="0 0 650 285" role="img" aria-label="${after ? 'After representative cleavage' : 'Before reaction'}: ${graph.nodes.filter(n => n.reducing).length} reducing ends, ${graph.nodes.filter(n => n.nonreducing).length} nonreducing ends; ${graph.bonds.filter(b => b.cut).length} bonds cleaved in this schematic"><text x="20" y="26" font-size="13" fill="#4f6969">${after ? 'After representative cleavage · × marks a cut' : 'Before reaction · schematic fragment'}</text>${lines}${residues}</svg>`;
  $('structure-before').setAttribute('aria-pressed', String(!after));
  $('structure-after').setAttribute('aria-pressed', String(after));
}
function bandDescription(b, detector = state.detector) {
  const standard = M.standards.find(s => Math.abs(s.rf - b.rf) < .001);
  const location = b.kind === 'origin' ? 'material near the origin' : b.kind === 'dextrins' ? 'unresolved low-mobility material' : standard ? `band co-migrating with ${standard.name.toLowerCase()} (DP${standard.dp})` : 'unassigned band between standards';
  return `${location} at illustrative Rf ${b.rf.toFixed(2)}${detector === 'iodine' ? ' (iodine-positive)' : ''}`;
}
function visibleBands(r, detector = state.detector) { return r.bands.filter(b => detector === 'char' ? b.strength > 0 : b.iodine > 0); }
function renderPlate() {
  $('plate-substrate').value = state.plate;
  const rows = M.samples.filter(s => state.plate === 'all' || s.substrate === state.plate);
  const lanes = [null, ...rows, null], width = state.plate === 'all' ? 1200 : 850;
  const x = i => 90 + i * (width - 245) / (lanes.length - 1), y = rf => 350 - 280 * rf;
  const iodine = state.detector === 'iodine';
  let svg = `<svg viewBox="0 0 ${width} 445" role="img" aria-label="Simulated TLC, ${iodine ? 'iodine vapour' : 'sugar staining'}, samples ${rows.map(s => s.id).join(', ')}. Text description is available below."><rect width="${width}" height="445" fill="${iodine ? '#fbf5e7' : '#f5f7fb'}"/><text x="24" y="28" font-size="15" fill="#334c5a">${iodine ? 'IODINE VAPOUR' : 'SUGAR STAINING / CHARRING'} · SIMULATED</text><path d="M45 70H${width - 145}" stroke="#95a8b5" stroke-dasharray="6 5"/><text x="${width - 135}" y="75" font-size="12" fill="#546975">Solvent front</text><path d="M45 350H${width - 145}" stroke="#7a8f9d"/><text x="${width - 135}" y="355" font-size="12" fill="#546975">Origin</text>`;
  M.standards.forEach(s => {
    svg += `<path d="M45 ${y(s.rf)}H${width - 145}" stroke="#cbd6df" stroke-dasharray="2 6"/><text x="${width - 135}" y="${y(s.rf) - 2}" font-size="12" fill="#334c5a">${esc(s.name)} · DP${s.dp}</text><text x="${width - 135}" y="${y(s.rf) + 12}" font-size="11" fill="#536977">Rf ${s.rf.toFixed(2)}</text>`;
  });
  lanes.forEach((s, i) => {
    const cx = x(i);
    svg += `<text x="${cx}" y="379" text-anchor="middle" font-size="15" font-weight="700" fill="#2c4957">${s ? s.id : 'S'}</text>`;
    if (!s) {
      if (!iodine) M.standards.forEach(ref => { svg += `<ellipse cx="${cx}" cy="${y(ref.rf)}" rx="11" ry="4.5" fill="#483d4d" opacity=".8"><title>${ref.name}, DP${ref.dp}, illustrative Rf ${ref.rf}</title></ellipse>`; });
      svg += `<text x="${cx}" y="401" text-anchor="middle" font-size="11" fill="#526976">Standards</text>`;
    } else {
      const r = M.result(s.id), record = state.records[s.id];
      const treatment = r.treatmentInfo;
      svg += `<text x="${cx}" y="400" text-anchor="middle" font-size="11" fill="#526976">${treatment.enzyme === 'none' ? 'Tris' : treatment.enzyme === 'alpha' ? 'Saliva' : 'Iso'}</text><text x="${cx}" y="416" text-anchor="middle" font-size="11" fill="#526976">${treatment.heated ? 'heated' : 'untreated'}</text>`;
      if (!record.revealed) svg += `<rect x="${cx-18}" y="85" width="36" height="255" rx="10" fill="#e0e7ec"/><text x="${cx}" y="215" text-anchor="middle" font-size="20" fill="#697f8e">?</text>`;
      else visibleBands(r).forEach(b => {
        const opacity = iodine ? b.iodine : b.strength;
        const fill = iodine ? r.iodine.colour : '#483d4d';
        svg += `<ellipse cx="${cx}" cy="${y(b.rf)}" rx="${b.kind === 'origin' ? 14 : 11}" ry="${b.kind === 'dextrins' ? 8 : 4.5}" fill="${fill}" opacity="${opacity}"><title>Sample ${s.id}: ${esc(bandDescription(b))}</title></ellipse>`;
      });
    }
  });
  svg += '</svg>';
  $('tlc-plate').classList.toggle('all', state.plate === 'all');
  $('tlc-plate').innerHTML = svg;
  $('detect-iodine').setAttribute('aria-pressed', String(iodine));
  $('detect-char').setAttribute('aria-pressed', String(!iodine));
  $('detect-iodine').classList.toggle('secondary', !iodine);
  $('detect-char').classList.toggle('secondary', iodine);
  $('plate-status').textContent = `${rows.filter(s => state.records[s.id].revealed).length} / ${rows.length} displayed samples revealed. Grey lanes marked ? are hidden results. ${iodine ? 'Short standards are invisible with iodine; dotted lines mark their reference positions only.' : 'Dotted lines mark the mixed-standard reference positions.'}`;
  $('plate-description').innerHTML = `<p>${iodine ? 'No visible short-standard spots with iodine in this illustration.' : M.standards.map(s => `${s.name} DP${s.dp}, Rf ${s.rf.toFixed(2)}`).join('; ') + '.'}</p><ul>${rows.map(s => `<li><strong>Sample ${s.id}:</strong> ${state.records[s.id].revealed ? visibleBands(M.result(s.id)).map(b => esc(bandDescription(b))).join('; ') : 'Result not yet revealed.'}</li>`).join('')}</ul>`;
}
function renderResults() {
  $('results-body').innerHTML = M.samples.map(s => {
    const r = M.result(s.id), record = state.records[s.id];
    return `<tr><td><span class="print-sample">Sample ${s.id}</span><button class="secondary" data-edit="${s.id}">Sample ${s.id}</button><p>${esc(r.substrateInfo.short)}<br>${esc(r.treatmentInfo.name)}</p></td><td>${esc(record.prediction || (record.revealed ? 'No prediction recorded before reveal.' : 'Not yet recorded.'))}</td><td>${record.revealed ? `${esc(r.iodine.name)}. ${esc(r.outcome)}${record.source === 'class' ? '<br><em>Revealed for class comparison.</em>' : ''}` : 'Not revealed.'}</td><td>${esc(record.observation || '—')}</td></tr>`;
  }).join('');
  $('results-body').querySelectorAll('[data-edit]').forEach(b => b.addEventListener('click', () => selectSample(b.dataset.edit)));
}
function render() { renderMatrix(); renderBench(); renderPlate(); renderResults(); }
$('prediction').addEventListener('input', () => {
  if (state.records[state.selected].revealed) return;
  state.records[state.selected].prediction = $('prediction').value;
  $('prediction').setCustomValidity(''); save(); renderMatrix(); renderResults(); updateNextStep();
});
$('observation').addEventListener('input', () => { state.records[state.selected].observation = $('observation').value; save(); renderResults(); });
$('run-sample').addEventListener('click', () => {
  const record = state.records[state.selected];
  if (record.revealed) return;
  if (!record.prediction.trim()) {
    $('run-message').textContent = 'Record a prediction before revealing this sample.';
    $('prediction').focus(); return;
  }
  record.revealed = true; record.source = 'individual'; after = true;
  save(); render();
  $('run-message').textContent = 'Virtual endpoint revealed: 30 min at 37°C. Incubation time is skipped; this is an illustrative endpoint, not a kinetic simulation.';
});
$('structure-before').addEventListener('click', () => { after = false; renderMolecule(); });
$('structure-after').addEventListener('click', () => { after = true; renderMolecule(); });
$('plate-substrate').addEventListener('change', () => { state.plate = $('plate-substrate').value; save(); renderPlate(); });
['iodine','char'].forEach(mode => $('detect-' + mode).addEventListener('click', () => { state.detector = mode; save(); renderPlate(); }));
$('reveal-all').addEventListener('click', () => {
  if (!window.confirm('Reveal all remaining samples for class comparison? Existing predictions will be kept and locked. Missing predictions will be labelled as not recorded.')) return;
  for (const record of Object.values(state.records)) if (!record.revealed) { record.revealed = true; record.source = 'class'; }
  state.plate = 'all'; save(); render();
});
function answerText(field) {
  if (field.tagName === 'FIELDSET') return field.querySelector(':checked')?.value || '';
  if (field.tagName === 'SELECT' && field.value) {
    return field.selectedOptions[0].textContent;
  }
  return field.value;
}

function report() {
  const lines = ['BIOKEMI 2 — STARCH AND GLYCOGEN DAY WORKBOOK', '09:00–17:00 · lectures, theory, brewing, virtual lab and exam-style assignment', `Group / initials: ${state.answers.group || '(not entered)'}`, `Exported: ${new Date().toISOString()}`, ''];
  function writtenSection(section, title) {
    lines.push(title, '');
    answerFields.filter(field => field.dataset.section === section).forEach(field => {
      if (field.closest('[data-legacy-response]') && !field.value) return;
      lines.push(field.dataset.prompt || field.dataset.save, answerText(field) || '(not recorded)', '');
    });
  }
  writtenSection('lectures', '09:00–10:45 — LECTURE NOTES');
  writtenSection('theory', '11:00–12:00 — THEORETICAL EXERCISE');
  for (const [key, value] of Object.entries(state.answers)) {
    if (key === 'theory-6' || key.startsWith('theory-6-')) {
      const part = key.split('-')[2] || '';
      lines.push('Earlier TLC preparation · Q6' + part, value, '');
    }
  }
  writtenSection('industry', '13:00–13:45 — STARCH AND BREWING');
  lines.push('14:00–15:45 — VIRTUAL STARCH LAB', '',
    'PROVENANCE: LabManual_2023-2024_Danish.docx, Section A. All displayed results are authored, qualitative teaching scenarios, not experimental measurements. Colours, Rf values and darkness are illustrative; no quantitative yields can be inferred.',
    'PROTOCOL: 60°C for 5 min where heated; 100 µl substrate + 100 µl diluted saliva / isoamylase / Tris; all reactions 37°C for 30 min, then ice.',
    'TLC standards (illustrative Rf): ' + M.standards.map(s => `${s.name} DP${s.dp} ${s.rf.toFixed(2)}`).join('; '), '');
  for (const s of M.samples) {
    const r = M.result(s.id), record = state.records[s.id];
    lines.push(`SAMPLE ${s.id}: ${r.substrateInfo.name}; ${r.treatmentInfo.name}`, `Prediction: ${record.prediction || '(not recorded)'}`);
    if (record.revealed) lines.push(`Reveal: ${record.source === 'class' ? 'class comparison' : 'individual prediction first'}`, `Iodine: ${r.iodine.name}. ${r.iodine.note}`, `Products: ${r.outcome}`, `TLC / sugar staining: ${visibleBands(r, 'char').map(b => bandDescription(b, 'char')).join('; ')}`, `TLC / iodine: ${visibleBands(r, 'iodine').map(b => bandDescription(b, 'iodine')).join('; ')}`);
    else lines.push('Result: not revealed.');
    lines.push(`Your interpretation: ${record.observation || '(not recorded)'}`, '');
  }
  const prompts = { 'tlc-answer': 'TLC assignments and uncertainty', 'iodine-answer': 'Iodine versus sugar staining', controls: 'Controls and heat treatment', conclusion: 'Conclusion', transfer: 'Transfer to brewing / resistant starch' };
  Object.entries(prompts).filter(([key]) => state.answers[key]).forEach(([key, title]) => lines.push(title.toUpperCase(), state.answers[key] || '(not recorded)', ''));
  writtenSection('lab', 'VIRTUAL LAB — INTERPRETATION QUESTIONS');
  writtenSection('exam', '16:00–17:00 — EXAM-STYLE ASSIGNMENT');
  lines.push('Exam context: the source assignment gives β-amylolytic limits of approximately 46% for potato starch and 43% for maize starch. These are supplied question values, not outputs of the virtual lab.', 'Sources: theoretical exercise slides and worksheet; LabManual_2023-2024_Danish.docx Section A; eksamenslignende opgave uge 49.pdf and supplied answer materials. See SOURCES.md in the workbook repository.');
  return lines.join('\n');
}
function download() {
  const url = URL.createObjectURL(new Blob([report()], { type: 'text/plain;charset=utf-8' }));
  const a = document.createElement('a'); a.href = url; a.download = 'biokemi2-day-notebook.txt'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
document.querySelectorAll('#export, #export-bottom, [data-action="export"]').forEach(button => button.addEventListener('click', download));
document.querySelectorAll('#print, #print-bottom, [data-action="print"]').forEach(button => button.addEventListener('click', () => window.print()));
window.addEventListener('beforeprint', () => {
  document.querySelectorAll('.print-answer').forEach(el => el.remove());
  document.querySelectorAll('textarea, select[data-save]').forEach(input => { const text = document.createElement('div'); text.className = 'print-answer'; text.textContent = answerText(input) || 'Answer: __________________________________________________________'; input.after(text); });
});
window.addEventListener('afterprint', () => document.querySelectorAll('.print-answer').forEach(el => el.remove()));
$('reset').addEventListener('click', () => {
  if (!window.confirm('Clear ALL workbook answers, including lecture notes, theory, lab predictions and exam answers? Download your day notebook first.')) return;
  state = blank(); after = false;
  answerFields.forEach(input => restoreAnswer(input, ''));
  document.querySelectorAll('[data-legacy-response]').forEach(label => label.hidden = true);
  document.querySelectorAll('.selection-feedback, .check-summary').forEach(note => note.textContent = '');
  $('run-message').textContent = ''; save(); render();
});
render(); save();

// Each hint points students to the observation that distinguishes the choices.
const synthesis = 'Synthesis';
const breakdown = 'Breakdown / product metabolism';
const selectionChecks = {
  'glucan-pair': ['A: amylose, B: amylopectin', 'Trace each chain from its reducing end. Which figure has a side chain attached through carbon 6?'],
  'theory-3-agpase': [synthesis, 'Follow the ADP-glucose made by this enzyme. What uses it as a glucose donor?'],
  'theory-3-alpha': [breakdown, 'Trace what happens to chain length when an internal α(1→4) bond is hydrolysed.'],
  'theory-3-beta': [breakdown, 'Consider where the maltose comes from when this enzyme acts at a nonreducing end.'],
  'theory-3-dpe1': [breakdown, 'Follow the maltotriose left after amylase action. What stage of starch turnover supplies it?'],
  'theory-3-dpe2': [breakdown, 'Trace the source of the maltose that reaches this enzyme in the cytosol.'],
  'theory-3-gbss': [synthesis, 'Does transferring glucose from ADP-glucose onto amylose lengthen or shorten the chain?'],
  'theory-3-isa': ['Context dependent', 'Consider what removing branches does when a starch granule is forming and when stored starch is being broken down.'],
  'theory-3-pul': ['Context dependent', 'Removing branches helps break down limit dextrins. What does the same reaction do to growing amylopectin in the synthesis diagram?'],
  'theory-3-sbe': [synthesis, 'Does this reaction create an α(1→6) branch point or remove one?'],
  'theory-3-sss': [synthesis, 'Trace a glucose unit from ADP-glucose to the end of an amylopectin chain.'],
  'theory-4-s1': ['AGPase', 'Look at the product before any glucan chain appears. Which enzyme activates glucose 1-phosphate using ATP?'],
  'theory-4-s2': ['Starch synthases (SSS / GBSS)', 'Compare the chains above and below this box. One glucose from ADP-glucose has joined the chain.'],
  'theory-4-s3': ['SBE', 'Look for the new α(1→6) attachment in the product. Which activity creates it?'],
  'theory-4-s4': ['Isoamylase / pullulanase-type debrancher', 'Follow the branch that is trimmed as amylopectin becomes ordered in the growing granule.'],
  'theory-4-d1': ['Isoamylase / pullulanase-type debrancher', 'The released chain remains intact. Which linkage held it to the parent glucan?'],
  'theory-4-d2': ['α-Amylase', 'The cut occurs inside an α(1→4) chain. Look for an enzyme that can act away from a chain end.'],
  'theory-4-d3': ['β-Amylase', 'The arrow starts at a nonreducing end and releases two glucose residues together as maltose.'],
  'theory-4-d4': ['DPE1', 'Count the residues on both sides. Two three-residue chains become a five-residue chain and one glucose. Which transfer uses maltotriose?'],
  'theory-4-d5': ['DPE2', 'Here the donor is maltose. One glucose joins an acceptor glucan and the other is released.']
};

const explanations = {
  'glucan-pair': 'A shows a linear glucose chain. The side chain attached through C6 in B identifies amylopectin.',
  'theory-3-agpase': 'AGPase produces ADP-glucose, the activated donor used to build starch.',
  'theory-3-alpha': 'α-Amylase hydrolyses internal α(1→4) bonds, yielding shorter glucans.',
  'theory-3-beta': 'β-Amylase releases maltose from nonreducing chain ends until it encounters a barrier.',
  'theory-3-dpe1': 'In the chloroplast, DPE1 redistributes residues from maltotriose produced during starch breakdown.',
  'theory-3-dpe2': 'Cytosolic DPE2 uses maltose exported during starch breakdown and transfers a glucosyl unit to an acceptor.',
  'theory-3-gbss': 'Granule-bound starch synthase extends amylose with glucose from ADP-glucose.',
  'theory-3-isa': 'Isoamylases trim branches during amylopectin assembly and remove branches during starch mobilization.',
  'theory-3-pul': 'Pullulanase can trim branch points as amylopectin forms and remove branches from limit dextrins during starch breakdown.',
  'theory-3-sbe': 'Starch branching enzyme transfers a chain segment to form a new α(1→6) junction.',
  'theory-3-sss': 'Soluble starch synthases use ADP-glucose to elongate the chains of amylopectin.',
  'theory-4-s1': 'AGPase uses ATP to convert glucose 1-phosphate to ADP-glucose and pyrophosphate.',
  'theory-4-s2': 'Soluble starch synthases use ADP-glucose to extend the amylopectin chains shown here. Granule-bound starch synthase extends amylose.',
  'theory-4-s3': 'SBE transfers an existing chain segment to C6, creating the branch shown in the product.',
  'theory-4-s4': 'Isoamylase and pullulanase trim α(1→6) branches on growing amylopectin. The remaining chains can pack into ordered regions of the starch granule.',
  'theory-4-d1': 'Debranching hydrolyses the α(1→6) junction and releases the attached chain intact.',
  'theory-4-d2': 'α-Amylase cuts internal α(1→4) bonds and produces shorter oligosaccharides.',
  'theory-4-d3': 'β-Amylase removes two glucose residues together as maltose from a nonreducing end.',
  'theory-4-d4': 'DPE1 transfers two residues between maltotriose molecules, yielding maltopentaose and glucose.',
  'theory-4-d5': 'DPE2 transfers one glucosyl unit from maltose to an acceptor and releases the other as glucose.'
};

const mapReactions = new Map(Object.entries(selectionChecks)
  .filter(([id]) => id.startsWith('theory-4-'))
  .map(([id, [enzyme]]) => [enzyme, explanations[id]]));

for (const exercise of document.querySelectorAll('.selection-exercise')) {
  const summary = exercise.querySelector('.check-summary');
  const fields = [...exercise.querySelectorAll('[data-save]')];
  const items = fields.map(field => {
    const note = document.createElement('p');
    note.className = 'selection-feedback';
    note.id = 'feedback-' + field.dataset.save;
    const anchor = field.closest('.reaction-step label') || field;
    anchor.after(note);
    field.setAttribute('aria-describedby', note.id);
    function clear() {
      note.textContent = '';
      delete note.dataset.result;
      summary.textContent = '';
    }
    field.addEventListener('input', clear);
    return {field, note};
  });
  exercise.querySelector('.check-controls').hidden = false;
  exercise.querySelector('button').addEventListener('click', () => {
    let correct = 0;
    let missing = 0;
    for (const {field, note} of items) {
      const id = field.dataset.save;
      const selected = field.querySelector(':checked');
      const choice = field.matches('fieldset') ? selected?.value : field.value;
      const [accepted, hint] = selectionChecks[id] || [];
      const feedback = selected?.dataset.feedback;
      if (!choice) {
        missing++;
        note.textContent = 'Choose an answer first.';
        note.dataset.result = 'empty';
      } else if (selected?.hasAttribute('data-correct') || [].concat(accepted).includes(choice)) {
        correct++;
        note.textContent = 'Correct. ' + (feedback || explanations[id]);
        note.dataset.result = 'correct';
      } else {
        const reaction = id.startsWith('theory-4-') && mapReactions.get(choice);
        note.textContent = 'Try again. ' + (feedback || [reaction, hint].filter(Boolean).join(' '));
        note.dataset.result = 'retry';
      }
    }
    summary.textContent = correct + ' of ' + items.length + ' correct.' +
      (missing ? ' Unanswered: ' + missing + '.' : '');
  });
}
