// Retailer search deep links. Each store gets the piece's search query so
// she lands directly on matching results instead of a homepage.
const enc = encodeURIComponent;

export const BUDGETS = ['budget', 'mid', 'splurge'];

export const KIND_ICONS = {
    top: '👚', bottom: '👖', dress: '👗', outerwear: '🧥', shoes: '👠',
    bag: '👜', jewelry: '💍', accessory: '🧣', other: '✨'
};
export const KINDS = Object.keys(KIND_ICONS);

// Order matters: earlier stores are preferred when the list is trimmed.
// `kinds` limits a store to the item types it is actually good for.
const STORES = [
    { name: 'Zappos', tiers: ['budget', 'mid', 'splurge'], kinds: ['shoes'], url: q => `https://www.zappos.com/search?term=${enc(q)}` },
    { name: 'DSW', tiers: ['budget', 'mid'], kinds: ['shoes'], url: q => `https://www.dsw.com/search?q=${enc(q)}` },
    { name: 'Etsy', tiers: ['budget', 'mid', 'splurge'], kinds: ['jewelry', 'accessory', 'bag'], url: q => `https://www.etsy.com/search?q=${enc(q)}` },
    { name: 'Nordstrom', tiers: ['mid', 'splurge'], url: q => `https://www.nordstrom.com/sr?keyword=${enc(q)}` },
    { name: 'Revolve', tiers: ['splurge'], url: q => `https://www.revolve.com/r/Search.jsp?search=${enc(q)}` },
    { name: 'Saks', tiers: ['splurge'], url: q => `https://www.saksfifthavenue.com/search?q=${enc(q)}` },
    { name: 'Aritzia', tiers: ['mid', 'splurge'], kinds: ['top', 'bottom', 'dress', 'outerwear'], url: q => `https://www.aritzia.com/us/en/search?q=${enc(q)}` },
    { name: 'Anthropologie', tiers: ['mid', 'splurge'], url: q => `https://www.anthropologie.com/search?q=${enc(q)}` },
    { name: 'Madewell', tiers: ['mid'], url: q => `https://www.madewell.com/search?q=${enc(q)}` },
    { name: 'Abercrombie', tiers: ['mid'], kinds: ['top', 'bottom', 'dress', 'outerwear'], url: q => `https://www.abercrombie.com/shop/us/search?searchTerm=${enc(q)}` },
    { name: 'Amazon', tiers: ['budget', 'mid'], url: q => `https://www.amazon.com/s?k=${enc(q)}&i=fashion` },
    { name: 'Target', tiers: ['budget'], url: q => `https://www.target.com/s?searchTerm=${enc(q)}` },
    { name: 'ASOS', tiers: ['budget', 'mid'], url: q => `https://www.asos.com/us/search/?q=${enc(q)}` },
    { name: 'H&M', tiers: ['budget'], url: q => `https://www2.hm.com/en_us/search-results.html?q=${enc(q)}` },
    { name: 'Old Navy', tiers: ['budget'], kinds: ['top', 'bottom', 'dress', 'outerwear'], url: q => `https://oldnavy.gap.com/browse/search.do?searchText=${enc(q)}` },
    { name: 'Poshmark', tiers: ['budget', 'splurge'], url: q => `https://poshmark.com/search?query=${enc(q)}` }
];

export function googleShoppingUrl(query) {
    return `https://www.google.com/search?tbm=shop&q=${enc(query)}`;
}

export function buildStoreLinks(query, kind = 'other', budget = 'mid', max = 6) {
    const tier = BUDGETS.includes(budget) ? budget : 'mid';
    const matches = STORES.filter(s => s.tiers.includes(tier) && (!s.kinds || s.kinds.includes(kind)));
    // Specialists (shoe stores for shoes, etc.) go first.
    const ordered = [...matches.filter(s => s.kinds), ...matches.filter(s => !s.kinds)];
    return [
        { name: 'Google Shopping', url: googleShoppingUrl(query), compare: true },
        ...ordered.slice(0, max).map(s => ({ name: s.name, url: s.url(query) }))
    ];
}
