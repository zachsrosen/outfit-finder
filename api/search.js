import { BUDGETS, KINDS, KIND_ICONS, buildStoreLinks, googleShoppingUrl } from '../lib/stores.js';

const MAX_PIECES = 10;
const PRODUCTS_PER_PIECE = 4;

const str = (value, max) => (typeof value === 'string' ? value.trim().slice(0, max) : '');
const isHttpUrl = value => typeof value === 'string' && /^https?:\/\//i.test(value);

function parsePrice(value) {
    if (typeof value === 'number') return value;
    if (typeof value !== 'string') return null;
    const n = parseFloat(value.replace(/[^0-9.]/g, ''));
    return Number.isFinite(n) ? n : null;
}

// Real listings from Google Shopping via SerpAPI. Returns [] on any failure;
// the store links still give her somewhere to shop.
async function findProducts(query, apiKey) {
    const url = `https://serpapi.com/search.json?engine=google_shopping&gl=us&hl=en&q=${encodeURIComponent(query)}&api_key=${apiKey}`;
    try {
        const response = await fetch(url, { signal: AbortSignal.timeout(12_000) });
        if (!response.ok) {
            console.warn(`SerpAPI ${response.status} for "${query}"`);
            return [];
        }
        const data = await response.json();
        return (data.shopping_results || [])
            .filter(item => item.title)
            .slice(0, PRODUCTS_PER_PIECE)
            .map(item => {
                const link = [item.product_link, item.link].find(isHttpUrl) || googleShoppingUrl(item.title);
                return {
                    title: item.title,
                    price: parsePrice(item.extracted_price ?? item.price),
                    originalPrice: parsePrice(item.extracted_old_price ?? item.old_price),
                    image: isHttpUrl(item.thumbnail) ? item.thumbnail : null,
                    link,
                    source: item.source || 'Shop',
                    rating: typeof item.rating === 'number' ? item.rating : null,
                    reviews: typeof item.reviews === 'number' ? item.reviews : null
                };
            });
    } catch (error) {
        console.warn(`SerpAPI failed for "${query}":`, error.message);
        return [];
    }
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const input = req.body?.pieces;
    if (!Array.isArray(input) || input.length === 0) {
        return res.status(400).json({ error: 'No outfit pieces to search for.' });
    }
    const budget = BUDGETS.includes(req.body?.budget) ? req.body.budget : 'mid';
    const serpApiKey = process.env.SERPAPI_KEY;

    const pieces = input
        .slice(0, MAX_PIECES)
        .map(p => ({
            name: str(p?.name, 80),
            kind: KINDS.includes(p?.kind) ? p.kind : 'other',
            searchQuery: str(p?.searchQuery, 150),
            why: str(p?.why, 300),
            requested: p?.requested !== false
        }))
        .filter(p => p.name && p.searchQuery);

    const results = await Promise.all(pieces.map(async piece => ({
        ...piece,
        icon: KIND_ICONS[piece.kind],
        stores: buildStoreLinks(piece.searchQuery, piece.kind, budget),
        products: serpApiKey ? await findProducts(piece.searchQuery, serpApiKey) : []
    })));

    return res.status(200).json({ pieces: results, liveProducts: Boolean(serpApiKey) });
}
