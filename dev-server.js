// Tiny local server: static files + the /api handlers, no Vercel CLI needed.
// Usage: npm run dev  (reads ANTHROPIC_API_KEY / SERPAPI_KEY from the environment)
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import analyze from './api/analyze.js';
import search from './api/search.js';

const ROUTES = { '/api/analyze': analyze, '/api/search': search };
const TYPES = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript' };
const STATIC = new Set(['/index.html', '/styles.css', '/app.js']);
const port = process.env.PORT || 3000;

createServer(async (req, res) => {
    const path = new URL(req.url, 'http://localhost').pathname;
    res.status = code => { res.statusCode = code; return res; };
    res.json = body => { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(body)); };

    if (ROUTES[path]) {
        let raw = '';
        for await (const chunk of req) raw += chunk;
        try { req.body = raw ? JSON.parse(raw) : {}; } catch { req.body = {}; }
        return ROUTES[path](req, res);
    }

    const file = path === '/' ? '/index.html' : normalize(path);
    if (!STATIC.has(file)) return res.status(404).end('Not found');
    res.setHeader('Content-Type', TYPES[extname(file)]);
    res.end(await readFile(join(import.meta.dirname, file)));
}).listen(port, () => console.log(`Outfit Finder running at http://localhost:${port}`));
