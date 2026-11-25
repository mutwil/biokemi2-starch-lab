'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const M = require('./workshop-model.js');

function components(graph) {
  const seen = new Set(), groups = [];
  for (const n of graph.nodes) {
    if (seen.has(n.id)) continue;
    const group = [], queue = [n.id]; seen.add(n.id);
    while (queue.length) {
      const id = queue.pop(); group.push(id);
      for (const b of graph.bonds.filter(b => !b.cut && (b.from === id || b.to === id))) {
        const other = b.from === id ? b.to : b.from;
        if (!seen.has(other)) { seen.add(other); queue.push(other); }
      }
    }
    groups.push(group);
  }
  return groups;
}
test('all 15 conditions retain the manual’s sample numbering and no extra treatment', () => {
  assert.equal(M.samples.length, 15);
  assert.deepEqual(M.samples.map(s => s.id), Array.from({length:15}, (_,i) => i+1));
  for (const [index, substrate] of M.substrates.entries()) {
    assert.deepEqual(M.samples.filter(s => s.substrate === substrate.id).map(s => s.id), [1,4,7,10,13].map(id => id + index));
    assert.deepEqual(M.samples.filter(s => s.substrate === substrate.id).map(s => s.treatment), M.treatments.map(t => t.id));
  }
  assert.throws(() => M.result(16), RangeError);
});
test('heat controls do not hydrolyse polymer; isoamylase cannot act on an unbranched substrate', () => {
  for (const id of [1,2,3,4,5,6,15]) assert.equal(M.molecule(id, true).bonds.filter(b => b.cut).length, 0);
  assert.deepEqual(M.result(15).bands, M.result(6).bands);
  assert.deepEqual(M.result(15).iodine, M.result(6).iodine);
});
test('cleavage specificity, residue conservation and one reducing end per component hold for every sketch', () => {
  for (const s of M.samples) {
    const before = M.molecule(s.id), after = M.molecule(s.id, true);
    assert.deepEqual(before.nodes.map(n => n.id), after.nodes.map(n => n.id));
    const groups = components(after), enzyme = M.sample(s.id).treatmentInfo.enzyme;
    assert.equal(groups.reduce((sum,g) => sum + g.length, 0), before.nodes.length);
    assert.equal(groups.length, 1 + after.bonds.filter(b => b.cut).length);
    assert.equal(after.nodes.filter(n => n.reducing).length, groups.length);
    for (const group of groups) assert.equal(group.filter(id => after.nodes[id].reducing).length, 1);
    for (const b of after.bonds.filter(b => b.cut)) assert.equal(b.type, enzyme === 'alpha' ? '14' : '16');
    if (enzyme === 'alpha') assert.ok(groups.every(g => g.length >= 2), 'sketch should not imply amylase makes free glucose');
  }
});
test('isoamylase removes branch linkages without cutting the released chains', () => {
  for (const id of [13,14]) {
    const graph = M.molecule(id, true);
    assert.ok(graph.bonds.some(b => b.type === '16'));
    assert.ok(graph.bonds.filter(b => b.type === '16').every(b => b.cut));
    assert.ok(graph.bonds.filter(b => b.type === '14').every(b => !b.cut));
    assert.ok(components(graph).every(c => c.length >= 3));
  }
});
test('nonreducing labels follow remaining connectivity, not just where a branch was removed', () => {
  for (const id of [13,14]) {
    const graph = M.molecule(id,true);
    for (const b of graph.bonds.filter(b => b.type === '16')) {
      assert.equal(graph.nodes[b.from].reducing,true);
      assert.equal(graph.nodes[b.to].nonreducing,false);
    }
  }
});
test('standards and qualitative spots stay within plate bounds; short products do not stain with iodine', () => {
  assert.deepEqual(M.standards.map(s => s.dp), [1,2,4,7]);
  for (const s of M.samples) {
    const r = M.result(s.id);
    for (const b of r.bands) {
      assert.ok(b.rf >= 0 && b.rf <= 1 && b.strength > 0 && b.strength <= 1);
      assert.ok(b.iodine >= 0 && b.iodine <= 1);
      if (b.kind === 'small') assert.equal(b.iodine,0);
    }
    assert.equal(r.bands.some(b => b.rf === M.standards[0].rf), false, 'no complete glucose conversion scenario');
  }
});
test('scenario comparisons expose accessibility and preserve debranched iodine-positive chains', () => {
  assert.deepEqual(M.result(7).bands,M.result(10).bands);
  assert.equal(M.result(8).extent,'limited'); assert.equal(M.result(11).extent,'more');
  assert.equal(M.result(9).extent,'limited'); assert.equal(M.result(12).extent,'limited');
  assert.ok(M.result(14).bands.some(b => b.iodine > 0));
  assert.ok(M.result(14).iodine.strength > 0);
});
