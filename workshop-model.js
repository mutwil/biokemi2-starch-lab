/* Qualitative Section A scenarios. Display values are not measured or calibrated. */
(function (root, factory) {
  const model = factory();
  if (typeof module === 'object' && module.exports) module.exports = model;
  else root.StarchLab = model;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const substrates = [
    { id: 'glycogen', name: 'Glycogen', short: 'Glycogen', source: 'Mussel glycogen', structure: 'Highly branched α-glucan; relatively accessible in this preparation.', heat: 'Little change in accessibility is assumed for this glycogen preparation.' },
    { id: 'potato', name: 'Potato starch', short: 'Potato starch', source: 'Storage starch from potato tuber', structure: 'Amylose and branched amylopectin packed into semi-crystalline granules.', heat: 'Partial improvement in accessibility is assumed. Heating at 60°C for 5 min is not a guarantee of complete gelatinization.' },
    { id: 'amylose', name: '“Pure amylose” starch', short: 'Amylose starch', source: 'Transgenic barley preparation in the manual', structure: 'Amylose-rich material, idealized here as unbranched α(1→4) chains. Linear does not necessarily mean accessible.', heat: 'Limited accessibility is retained after this mild heat treatment. Actual behaviour depends on the preparation.' }
  ];
  const treatments = [
    { id: 'control-native', name: 'Tris · untreated', short: 'Tris / untreated', enzyme: 'none', heated: false },
    { id: 'control-heated', name: 'Tris · heat-treated', short: 'Tris / heated', enzyme: 'none', heated: true },
    { id: 'saliva-native', name: 'Saliva · untreated', short: 'Saliva / untreated', enzyme: 'alpha', heated: false },
    { id: 'saliva-heated', name: 'Saliva · heat-treated', short: 'Saliva / heated', enzyme: 'alpha', heated: true },
    { id: 'iso-heated', name: 'Isoamylase · heat-treated', short: 'Isoamylase / heated', enzyme: 'iso', heated: true }
  ];
  const samples = treatments.flatMap((t, ti) => substrates.map((s, si) => ({ id: ti * 3 + si + 1, substrate: s.id, treatment: t.id })));
  const standards = [
    { name: 'Glucose', dp: 1, rf: .83 }, { name: 'Maltose', dp: 2, rf: .68 },
    { name: 'Maltotetraose', dp: 4, rf: .44 }, { name: 'Maltoheptaose', dp: 7, rf: .20 }
  ];
  function sample(id) {
    const row = samples.find(s => s.id === Number(id));
    if (!row) throw new RangeError('Unknown sample');
    return { ...row, substrateInfo: substrates.find(s => s.id === row.substrate), treatmentInfo: treatments.find(t => t.id === row.treatment) };
  }
  const band = (rf, strength, kind = 'small', iodine = 0) => ({ rf, strength, kind, iodine });
  function result(id) {
    const s = sample(id), key = s.substrate, t = s.treatmentInfo;
    const nativeColour = key === 'glycogen' ? '#995b37' : key === 'potato' ? '#414c88' : '#203d87';
    let iodine = { colour: nativeColour, strength: t.heated || key === 'glycogen' ? .85 : .48,
      name: key === 'glycogen' ? 'Brown complex' : key === 'potato' ? 'Blue / violet complex' : 'Blue complex',
      note: 'Long iodine-binding stretches remain. Accessibility also affects the signal.' };
    let bands = [band(.025, .95, 'origin', .85)];
    let outcome = 'Polymer remains; no enzyme-dependent hydrolysis in this control.';
    let explanation = t.heated
      ? 'This sample contains Tris buffer without added enzyme. The heat pretreatment can change chain accessibility while leaving the glycosidic bonds intact.'
      : 'This sample contains substrate and Tris buffer without added enzyme. It provides the baseline for detecting enzyme-dependent cleavage.';
    let extent = 'none';
    if (t.enzyme === 'alpha') {
      const accessible = key === 'glycogen' || (key === 'potato' && t.heated);
      extent = accessible ? 'more' : 'limited';
      bands = accessible
        ? [band(.025, .35, 'origin', .32), band(.095, .6, 'dextrins', .22), band(.20, .4), band(.44, .7), band(.55, .75), band(.68, .9)]
        : [band(.025, .9, 'origin', .8), band(.095, .35, 'dextrins', .18), band(.44, .18), band(.55, .22), band(.68, .25)];
      iodine = { colour: accessible ? (key === 'glycogen' ? '#c78b40' : '#946248') : nativeColour,
        strength: accessible ? .35 : (t.heated ? .7 : .45),
        name: accessible ? 'Weaker brown / amber signal' : 'Substantial blue signal remains',
        note: accessible ? 'Shorter products bind iodine poorly; residual longer fragments can still stain. This is not a glucose assay.' : 'Long chains remain in this limited-accessibility scenario. A retained signal does not exclude some hydrolysis.' };
      outcome = accessible ? 'More mobile small products, with residual larger dextrins.' : 'Limited hydrolysis: faint mobile products alongside retained polymer.';
      explanation = 'Salivary α-amylase cleaves internal α(1→4) bonds, producing maltose, other maltooligosaccharides and, for branched substrates, branched limit dextrins. It does not remove α(1→6) junctions.';
    }
    if (t.enzyme === 'iso' && key !== 'amylose') {
      extent = 'debranch';
      bands = key === 'glycogen'
        ? [band(.025, .45, 'origin', .25), band(.085, .85, 'dextrins', .25), band(.14, .5, 'dextrins', .12), band(.20, .3)]
        : [band(.025, .85, 'origin', .85), band(.07, .75, 'dextrins', .55), band(.13, .4, 'dextrins', .22), band(.20, .15)];
      iodine = { colour: key === 'glycogen' ? '#ab7541' : '#34438e', strength: key === 'glycogen' ? .45 : .85,
        name: key === 'glycogen' ? 'Weak brown / amber complex' : 'Blue / violet signal retained',
        note: 'Debranching releases linear chains of different lengths. Long chains can still bind iodine; debranching need not erase the colour.' };
      outcome = 'Debranched chains: mostly low-mobility material, with a distribution of chain lengths.';
      explanation = key === 'glycogen'
        ? 'Isoamylase hydrolyses the α(1→6) junctions in glycogen. The released linear chains retain their α(1→4) linkages.'
        : 'Isoamylase hydrolyses the α(1→6) junctions in amylopectin. The released linear chains and the amylose already present in potato starch can still bind iodine if they are sufficiently long.';
    } else if (t.enzyme === 'iso') {
      outcome = 'No change from the heated control in the idealized unbranched substrate.';
      explanation = 'An unbranched α(1→4) chain has no α(1→6) target for isoamylase. Small effects in a real amylose-rich preparation could reflect residual branches or impurities.';
    }
    return { ...s, iodine, bands, outcome, explanation, extent };
  }
  // A small linkage sketch, separate from the qualitative analytical scenarios.
  function molecule(id, reacted = false) {
    const r = result(id), nodes = [], bonds = [];
    const add = (x, y) => { const id = nodes.length; nodes.push({ id, x, y }); return id; };
    const join = (from, to, type) => bonds.push({ from, to, type, cut: false });
    const main = Array.from({ length: 8 }, (_, i) => add(95 + i * 66, 207));
    for (let i = 0; i < main.length - 1; i++) join(main[i], main[i + 1], '14');
    const branches = r.substrate === 'glycogen' ? [2, 5] : r.substrate === 'potato' ? [4] : [];
    branches.forEach((p) => {
      const branch = Array.from({ length: 3 }, (_, i) => add(nodes[p].x - 175 + i * 66, 90));
      join(branch[0], branch[1], '14'); join(branch[1], branch[2], '14'); join(branch[2], main[p], '16');
    });
    if (reacted && r.extent === 'debranch') bonds.filter(b => b.type === '16').forEach(b => b.cut = true);
    if (reacted && (r.extent === 'limited' || r.extent === 'more')) {
      const junctions = new Set(bonds.filter(b => b.type === '16').flatMap(b => [b.from, b.to]));
      const candidates = bonds.filter(b => b.type === '14' && !junctions.has(b.from) && !junctions.has(b.to)
        && bonds.some(e => e.to === b.from && e.type === '14') && bonds.some(e => e.from === b.to && e.type === '14'));
      const used = new Set();
      let count = 0;
      for (const b of candidates) {
        if (count >= (r.extent === 'more' ? 2 : 1)) break;
        if (used.has(b.from) || used.has(b.to)) continue;
        b.cut = true; used.add(b.from); used.add(b.to); count++;
      }
    }
    nodes.forEach(n => {
      n.reducing = !bonds.some(b => !b.cut && b.from === n.id);
      n.nonreducing = !bonds.some(b => !b.cut && b.to === n.id);
    });
    return { nodes, bonds };
  }
  return { substrates, treatments, samples, standards, sample, result, molecule };
});
