import { createServer } from 'node:http';
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { readdir, realpath, stat } from 'node:fs/promises';
import { basename, join } from 'node:path';
import { pipeline } from 'node:stream/promises';

const { ARCHIVE_PASSCODE, ARCHIVE_DIR, ARCHIVE_ORIGIN } = process.env;
if (!ARCHIVE_PASSCODE || ARCHIVE_PASSCODE.length < 6 || !ARCHIVE_DIR ||
    !ARCHIVE_ORIGIN || new URL(ARCHIVE_ORIGIN).origin !== ARCHIVE_ORIGIN ||
    !ARCHIVE_ORIGIN.startsWith('https://')) {
  throw new Error('Set ARCHIVE_PASSCODE, ARCHIVE_DIR and an HTTPS ARCHIVE_ORIGIN.');
}
const directory = await realpath(ARCHIVE_DIR);
const port = Number(process.env.PORT || 8788);
const digest = value => createHash('sha256').update(value).digest();
const expected = digest(ARCHIVE_PASSCODE);
const sessions = new Map();
const lifetime = 30 * 60 * 1000;
let failures = 0;
let windowEnd = 0;
const cookieName = '__Host-private-archive';
const escape = value => value.replace(/[&<>"']/g, c => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
})[c]);
const security = {
  'Cache-Control': 'no-store',
  'Content-Security-Policy': "default-src 'none'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'",
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer'
};
function html(res, code, body) {
  res.writeHead(code, { ...security, 'Content-Type': 'text/html; charset=utf-8' });
  res.end('<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Private Files</title><main><h1>Private Files</h1>'+body+'</main></html>');
}
function login(res, code = 200, message = '') {
  html(res, code, '<p>'+escape(message)+'</p><form method="post" action="/login"><label>Access code <input type="password" name="code" required maxlength="256" autocomplete="current-password"></label> <button>Sign in</button></form>');
}
function token(req) {
  return (req.headers.cookie || '').match(/(?:^|;\s*)__Host-private-archive=([a-f0-9]{64})(?:;|$)/)?.[1];
}
function redirect(res) {
  res.writeHead(303, { ...security, Location: '/' });
  res.end();
}
async function fields(req) {
  let body = '';
  for await (const chunk of req) {
    body += chunk.toString('utf8');
    if (body.length > 2048) throw new Error('Request too large');
  }
  return new URLSearchParams(body);
}
async function files() {
  return (await readdir(directory, { withFileTypes: true }))
    .filter(item => item.isFile() && !item.name.startsWith('.'))
    .map(item => item.name)
    .sort((a, b) => a.localeCompare(b));
}
const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, ARCHIVE_ORIGIN);
    const now = Date.now();
    const key = token(req);
    for (const [id, expiry] of sessions) if (expiry <= now) sessions.delete(id);
    const signedIn = sessions.has(key);
    if (req.method === 'POST' && ['/login', '/logout'].includes(url.pathname)) {
      if (req.headers.origin !== ARCHIVE_ORIGIN) return html(res, 403, '<p>Request blocked.</p>');
      if (url.pathname === '/logout') {
        sessions.delete(key);
        res.setHeader('Set-Cookie', cookieName+'=; Secure; HttpOnly; SameSite=Strict; Path=/; Max-Age=0');
        return redirect(res);
      }
      if (now >= windowEnd) { failures = 0; windowEnd = now + 15 * 60 * 1000; }
      if (failures >= 8) return login(res, 429, 'Too many attempts. Try again later.');
      // Reserve the attempt before awaiting the body so concurrent requests are limited.
      failures++;
      const code = (await fields(req)).get('code') || '';
      if (!timingSafeEqual(digest(code), expected)) return login(res, 401, 'Invalid code.');
      failures--;
      if (sessions.size >= 32) sessions.delete(sessions.keys().next().value);
      const id = randomBytes(32).toString('hex');
      sessions.set(id, now + lifetime);
      res.setHeader('Set-Cookie', cookieName+'='+id+'; Secure; HttpOnly; SameSite=Strict; Path=/; Max-Age=1800');
      return redirect(res);
    }
    if (req.method !== 'GET') return html(res, 405, '<p>Method not allowed.</p>');
    if (url.pathname === '/') {
      if (!signedIn) return login(res);
      const list = (await files()).map(name => {
        const id = Buffer.from(name).toString('base64url');
        return '<li><a href="/download?id='+id+'">'+escape(name)+'</a></li>';
      }).join('');
      return html(res, 200, (list ? '<ul>'+list+'</ul>' : '<p>No files have been added.</p>')+
        '<form method="post" action="/logout"><button>Sign out</button></form>');
    }
    if (url.pathname !== '/download') return html(res, 404, '<p>Page not found.</p>');
    if (!signedIn) return login(res, 401, 'Sign in before downloading.');
    const id = url.searchParams.get('id') || '';
    if (!/^[A-Za-z0-9_-]{1,1024}$/.test(id)) return html(res, 404, '<p>File not found.</p>');
    const name = Buffer.from(id, 'base64url').toString('utf8');
    if (name !== basename(name) || !(await files()).includes(name)) {
      return html(res, 404, '<p>File not found.</p>');
    }
    const path = join(directory, name);
    if (await realpath(path) !== path) return html(res, 404, '<p>File not found.</p>');
    const info = await stat(path);
    res.writeHead(200, { ...security, 'Content-Type': 'application/octet-stream',
      'Content-Length': info.size, 'Content-Disposition': "attachment; filename*=UTF-8''"+
      encodeURIComponent(name).replace(/['()*]/g, c => '%'+c.charCodeAt(0).toString(16)) });
    await pipeline(createReadStream(path), res);
  } catch {
    if (!res.headersSent) html(res, 500, '<p>The archive could not complete this request.</p>');
    else res.destroy();
  }
});
server.requestTimeout = 15_000;
server.listen(port, '127.0.0.1', () => console.log('Private archive listening on loopback port '+port));
