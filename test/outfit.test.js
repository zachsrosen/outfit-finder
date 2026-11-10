import test from 'node:test';
import assert from 'node:assert/strict';
import { basicOutfitPlan } from '../lib/fallback.js';
import { buildStoreLinks } from '../lib/stores.js';
import analyze from '../api/analyze.js';
import search from '../api/search.js';

function call(handler, body, method = 'POST') {
    return new Promise(resolve => {
        const res = {
            code: 200,
            status(code) { this.code = code; return this; },
            json(data) { resolve({ status: this.code, data }); }
        };
        handler({ method, body }, res);
    });
}

test('keyword breakdown splits named pieces and adds what is missing', () => {
    const plan = basicOutfitPlan('Oversized cream sweater, high-waisted jeans and brown ankle boots');
    const requested = plan.pieces.filter(p => p.requested);
    assert.deepEqual(requested.map(p => p.kind), ['top', 'bottom', 'shoes']);
    assert.equal(requested[0].searchQuery, "women's oversized cream sweater");
    // Shoes were named, so only bag + jewelry are suggested.
    assert.deepEqual(plan.pieces.filter(p => !p.requested).map(p => p.kind), ['bag', 'jewelry']);
});

test('multi-word garments use the last garment word', () => {
    const [piece] = basicOutfitPlan('denim jacket').pieces;
    assert.equal(piece.kind, 'outerwear');
});

test('vague descriptions still produce a shoppable piece', () => {
    const plan = basicOutfitPlan('something cute for date night');
    assert.equal(plan.pieces[0].kind, 'other');
    assert.match(plan.pieces.at(-1).searchQuery, /date night/);
});

test('store links are encoded, tiered, and lead with Google Shopping', () => {
    const links = buildStoreLinks("women's black & gold heels", 'shoes', 'splurge');
    assert.equal(links[0].name, 'Google Shopping');
    assert.equal(links[1].name, 'Zappos');
    assert.ok(links.every(l => l.url.startsWith('https://') && !l.url.includes(' ') && !l.url.includes('& ')));
    const names = links.map(l => l.name);
    assert.ok(names.includes('Revolve') && !names.includes('Target'));
    assert.ok(buildStoreLinks('tee', 'top', 'budget').some(l => l.name === 'Target'));
});

test('analyze validates input and works without an API key', async () => {
    delete process.env.ANTHROPIC_API_KEY;
    assert.equal((await call(analyze, {})).status, 400);
    assert.equal((await call(analyze, { description: 'x'.repeat(1001) })).status, 400);
    assert.equal((await call(analyze, {}, 'GET')).status, 405);
    const ok = await call(analyze, { description: 'black midi dress with heels' });
    assert.equal(ok.status, 200);
    assert.equal(ok.data.source, 'basic');
});

test('search returns store links per piece and sanitizes input', async () => {
    delete process.env.SERPAPI_KEY;
    assert.equal((await call(search, { pieces: [] })).status, 400);
    const { status, data } = await call(search, {
        budget: 'nonsense',
        pieces: [{ name: 'Dress', kind: 'bogus', searchQuery: "women's black midi dress" }, { name: '', searchQuery: '' }]
    });
    assert.equal(status, 200);
    assert.equal(data.liveProducts, false);
    assert.equal(data.pieces.length, 1);
    assert.equal(data.pieces[0].kind, 'other');
    assert.deepEqual(data.pieces[0].products, []);
    assert.ok(data.pieces[0].stores.length >= 4);
});
