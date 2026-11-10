// Keyword-based outfit breakdown. Used when no Claude API key is configured
// (or the API call fails) so the app still returns shoppable pieces.
const GARMENTS = [
    ['dress', ['dress', 'gown', 'jumpsuit', 'romper', 'sundress']],
    ['outerwear', ['jacket', 'coat', 'blazer', 'trench', 'puffer', 'parka', 'shacket', 'vest']],
    ['top', ['sweater', 'cardigan', 'blouse', 'shirt', 'tee', 't-shirt', 'tank', 'top', 'hoodie', 'sweatshirt', 'bodysuit', 'turtleneck', 'camisole', 'cami', 'pullover', 'crewneck', 'button-down']],
    ['bottom', ['jeans', 'pants', 'trousers', 'skirt', 'shorts', 'leggings', 'joggers', 'slacks', 'chinos', 'sweatpants']],
    ['shoes', ['boots', 'booties', 'heels', 'sneakers', 'sandals', 'flats', 'loafers', 'pumps', 'mules', 'shoes', 'slides', 'wedges', 'clogs', 'espadrilles']],
    ['bag', ['bag', 'purse', 'tote', 'clutch', 'crossbody', 'handbag', 'backpack']],
    ['jewelry', ['necklace', 'earrings', 'bracelet', 'ring', 'hoops', 'jewelry', 'watch', 'anklet']],
    ['accessory', ['scarf', 'hat', 'beanie', 'belt', 'sunglasses', 'gloves', 'tights', 'socks', 'headband']]
];

const VIBES = ['date night', 'wedding guest', 'cocktail', 'brunch', 'work', 'office', 'beach', 'vacation', 'casual', 'cozy', 'fall', 'winter', 'spring', 'summer', 'boho', 'minimalist', 'preppy', 'edgy', 'elegant', 'sporty', 'athleisure', 'western', 'holiday', 'formal'];

const EXTRAS = [
    { kind: 'shoes', name: 'Shoes', item: 'shoes' },
    { kind: 'bag', name: 'Bag', item: 'handbag' },
    { kind: 'jewelry', name: 'Jewelry', item: 'jewelry' }
];

const escapeRe = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const titleCase = s => s.replace(/\b\w/g, c => c.toUpperCase());

function matchGarment(phrase) {
    let best = null;
    for (const [kind, words] of GARMENTS) {
        for (const word of words) {
            const m = phrase.match(new RegExp(`\\b${escapeRe(word)}\\b`, 'i'));
            // Prefer the last garment word in the phrase: "denim jacket" is a jacket.
            if (m && (!best || m.index > best.index)) best = { kind, word, index: m.index };
        }
    }
    return best;
}

export function basicOutfitPlan(description) {
    const text = description.trim().replace(/\s+/g, ' ');
    const phrases = text
        .split(/,|;|\n|\band\b|\bwith\b|\bplus\b|\+|&|\bpaired with\b/i)
        .map(p => p.trim().replace(/^(a|an|the|some|my|cute|outfit|look)\s+/i, '').replace(/[.!?]+$/, ''))
        .filter(Boolean);

    const pieces = [];
    const seen = new Set();
    for (const phrase of phrases) {
        const g = matchGarment(phrase);
        if (!g) continue;
        const query = /\b(women'?s?|ladies)\b/i.test(phrase) ? phrase : `women's ${phrase}`;
        if (seen.has(query.toLowerCase())) continue;
        seen.add(query.toLowerCase());
        pieces.push({
            name: titleCase(g.word),
            kind: g.kind,
            searchQuery: query.toLowerCase(),
            why: '',
            requested: true
        });
    }

    const vibe = VIBES.find(v => new RegExp(`\\b${v}\\b`, 'i').test(text)) || '';

    if (pieces.length === 0) {
        pieces.push({
            name: 'The Look',
            kind: 'other',
            searchQuery: `women's ${text}`.toLowerCase().slice(0, 120),
            why: '',
            requested: true
        });
    }

    const have = new Set(pieces.map(p => p.kind));
    for (const extra of EXTRAS) {
        if (have.has(extra.kind)) continue;
        pieces.push({
            name: extra.name,
            kind: extra.kind,
            searchQuery: `women's ${vibe} ${extra.item}`.replace(/\s+/g, ' '),
            why: 'To finish the look',
            requested: false
        });
    }

    return { summary: titleCase(text.slice(0, 1)) + text.slice(1), pieces: pieces.slice(0, 8), source: 'basic' };
}
