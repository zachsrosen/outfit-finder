// Outfit Finder front end. All server data is rendered with textContent /
// element properties (never innerHTML) so product titles can't inject markup.
(() => {
    const RECENTS_KEY = 'outfit-finder-recents';
    const BUDGET_KEY = 'outfit-finder-budget';
    const MAX_RECENTS = 5;

    const form = document.getElementById('outfit-form');
    const input = document.getElementById('outfit-description');
    const button = document.getElementById('find-outfits');
    const statusEl = document.getElementById('status');
    const resultsEl = document.getElementById('results');
    const summaryEl = document.getElementById('summary');
    const noticeEl = document.getElementById('notice');
    const piecesEl = document.getElementById('pieces');
    const recentsEl = document.getElementById('recents');

    function el(tag, className, text) {
        const node = document.createElement(tag);
        if (className) node.className = className;
        if (text != null) node.textContent = text;
        return node;
    }

    function safeUrl(url) {
        return typeof url === 'string' && /^https?:\/\//i.test(url) ? url : null;
    }

    function externalLink(url, className, text) {
        const a = el('a', className, text);
        a.href = safeUrl(url) || '#';
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        return a;
    }

    const money = n => `$${Number(n).toFixed(2).replace(/\.00$/, '')}`;

    // ---- storage (may be unavailable in private mode) ----
    function load(key, fallback) {
        try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
    }
    function save(key, value) {
        try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* ignore */ }
    }

    function getBudget() {
        return form.elements.budget.value || 'mid';
    }

    function renderRecents() {
        const recents = load(RECENTS_KEY, []);
        recentsEl.querySelectorAll('.chip').forEach(chip => chip.remove());
        recentsEl.classList.toggle('hidden', recents.length === 0);
        for (const text of recents) {
            const chip = el('button', 'chip chip-recent', text.length > 40 ? `${text.slice(0, 40)}…` : text);
            chip.type = 'button';
            chip.title = text;
            chip.addEventListener('click', () => { input.value = text; findOutfit(); });
            recentsEl.appendChild(chip);
        }
    }

    function rememberSearch(text) {
        const recents = load(RECENTS_KEY, []).filter(r => r.toLowerCase() !== text.toLowerCase());
        save(RECENTS_KEY, [text, ...recents].slice(0, MAX_RECENTS));
        renderRecents();
    }

    // ---- status ----
    function setBusy(busy) {
        button.disabled = busy;
        button.textContent = busy ? 'Finding…' : 'Find My Outfit';
    }

    function showStatus(message, isError = false) {
        statusEl.replaceChildren();
        if (!isError) statusEl.appendChild(el('div', 'spinner'));
        statusEl.appendChild(el('p', isError ? 'error-text' : '', message));
        statusEl.classList.remove('hidden');
    }

    async function postJson(url, body) {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        let data = null;
        try { data = await response.json(); } catch { /* non-JSON error page */ }
        if (!response.ok) throw new Error(data?.error || 'Something went wrong. Please try again.');
        return data;
    }

    // ---- rendering ----
    function productCard(product) {
        const card = externalLink(product.link, 'product-card');
        if (safeUrl(product.image)) {
            const img = el('img', 'product-image');
            img.src = product.image;
            img.alt = '';
            img.loading = 'lazy';
            img.addEventListener('error', () => img.remove());
            card.appendChild(img);
        }
        const info = el('div', 'product-info');
        info.appendChild(el('div', 'product-store', product.source));
        info.appendChild(el('div', 'product-title', product.title));
        const price = el('div', 'product-price');
        price.appendChild(el('span', 'current-price', product.price != null ? money(product.price) : 'See price'));
        if (product.price != null && product.originalPrice > product.price) {
            price.appendChild(el('span', 'original-price', money(product.originalPrice)));
        }
        info.appendChild(price);
        if (product.rating) {
            const reviews = product.reviews ? ` (${product.reviews.toLocaleString()})` : '';
            info.appendChild(el('div', 'product-rating', `★ ${product.rating}${reviews}`));
        }
        card.appendChild(info);
        return card;
    }

    function pieceCard(piece) {
        const card = el('article', 'piece');

        const header = el('div', 'piece-header');
        header.appendChild(el('span', 'piece-icon', piece.icon));
        const titles = el('div', 'piece-titles');
        titles.appendChild(el('h3', 'piece-name', piece.name));
        titles.appendChild(el('p', 'piece-query', `Searching for “${piece.searchQuery}”`));
        header.appendChild(titles);
        card.appendChild(header);

        if (piece.why) card.appendChild(el('p', 'piece-why', piece.why));

        if (piece.products.length) {
            const grid = el('div', 'products');
            piece.products.forEach(p => grid.appendChild(productCard(p)));
            card.appendChild(grid);
        }

        const stores = el('div', 'stores');
        stores.appendChild(el('span', 'stores-label', piece.products.length ? 'More places to shop it' : 'Shop it at'));
        const list = el('div', 'store-list');
        for (const store of piece.stores) {
            list.appendChild(externalLink(store.url, store.compare ? 'store-link store-compare' : 'store-link', `${store.name} ↗`));
        }
        stores.appendChild(list);
        card.appendChild(stores);
        return card;
    }

    function group(title, pieces) {
        const section = el('section', 'piece-group');
        section.appendChild(el('h3', 'group-title', title));
        pieces.forEach(p => section.appendChild(pieceCard(p)));
        return section;
    }

    function renderResults(plan, result) {
        summaryEl.textContent = plan.summary || '';

        const notes = [];
        if (plan.source === 'basic') notes.push('Showing a simple keyword breakdown (the AI stylist is not connected).');
        if (!result.liveProducts) notes.push('Tap a store to see matching items there.');
        noticeEl.textContent = notes.join(' ');
        noticeEl.classList.toggle('hidden', notes.length === 0);

        const requested = result.pieces.filter(p => p.requested);
        const extras = result.pieces.filter(p => !p.requested);
        piecesEl.replaceChildren();
        if (requested.length) piecesEl.appendChild(group('What you asked for', requested));
        if (extras.length) piecesEl.appendChild(group('To complete the look', extras));
    }

    // ---- main flow ----
    async function findOutfit() {
        const description = input.value.trim();
        if (!description) {
            resultsEl.classList.add('hidden');
            showStatus('Describe the outfit you have in mind first!', true);
            input.focus();
            return;
        }

        const budget = getBudget();
        setBusy(true);
        resultsEl.classList.add('hidden');
        showStatus('Styling your outfit…');

        try {
            const plan = await postJson('/api/analyze', { description, budget });
            showStatus('Finding where to order each piece…');
            const result = await postJson('/api/search', { pieces: plan.pieces, budget });

            renderResults(plan, result);
            statusEl.classList.add('hidden');
            resultsEl.classList.remove('hidden');
            rememberSearch(description);
            resultsEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } catch (error) {
            console.error(error);
            const offline = error instanceof TypeError;
            showStatus(offline ? "Couldn't reach the server. Check your connection and try again." : error.message, true);
        } finally {
            setBusy(false);
        }
    }

    form.addEventListener('submit', event => { event.preventDefault(); findOutfit(); });
    input.addEventListener('keydown', event => {
        if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); findOutfit(); }
    });
    document.querySelectorAll('.chip[data-style]').forEach(chip => {
        chip.addEventListener('click', () => { input.value = chip.dataset.style; findOutfit(); });
    });
    form.addEventListener('change', event => {
        if (event.target.name === 'budget') save(BUDGET_KEY, event.target.value);
    });

    const savedBudget = load(BUDGET_KEY, 'mid');
    const radio = form.querySelector(`input[name="budget"][value="${CSS.escape(String(savedBudget))}"]`);
    if (radio) radio.checked = true;
    renderRecents();
})();
