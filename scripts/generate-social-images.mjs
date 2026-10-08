// Static PNG cards: crawlers can fetch these without executing JavaScript.
import sharp from 'sharp';
import { ORBITS, orbitState } from '../src/lib/orbit-learning.js';
import { mkdir } from 'node:fs/promises';
const escape = s => s.replaceAll('&', '&amp;').replaceAll('<', '&lt;');
const cards = [
  ['portfolio', ['Adrián Hernández', 'Padrón'], 'AI/ML Engineer & Data Scientist', 'Projects and notes from the work.'],
  ['jev-travel-ruter-context-cache-agent-efficiency', ['Making a travel agent', 'do less work'], 'Context selection with JEV', 'Travel Ruter · Agent architecture and evaluation'],
  ['mnemosyne-bug-bounty-duplicate-detection', ['Building an agentic system', 'for duplicate detection'], 'Mnemosyne', 'Hybrid retrieval · Re-ranking · AI agents'],
];
function planets(cx, cy, scale, radius) {
  // The same Keplerian paths, phases and palette as the live homepage.
  const point = p => [cx + p.x * scale, cy + p.y * scale];
  const paths = ORBITS.map(orbit => {
    const period = 2 * Math.PI * Math.sqrt(orbit.a ** 3 / orbit.mu);
    const points = Array.from({ length: 241 }, (_, i) => point(orbitState(orbit, period * i / 240)));
    return `<path d="M${points.map(p => p.join(',')).join(' L')} Z" fill="none" stroke="${orbit.color}" stroke-opacity=".65" stroke-width="2" stroke-dasharray="5 7"/>`;
  }).join('');
  const bodies = ORBITS.map((orbit, i) => {
    const [x,y] = point(orbitState(orbit, 15));
    const dx = cx-x, dy=cy-y, distance=Math.hypot(dx,dy);
    return `<defs><radialGradient id="planet-${i}" gradientUnits="userSpaceOnUse" cx="${x+dx/distance*radius*.38}" cy="${y+dy/distance*radius*.38}" r="${radius}" fx="${x+dx/distance*radius*.38}" fy="${y+dy/distance*radius*.38}"><stop stop-color="${orbit.light}"/><stop offset="1" stop-color="${orbit.color}"/></radialGradient></defs><circle cx="${x}" cy="${y}" r="${radius}" fill="url(#planet-${i})"/>`;
  }).join('');
  return `${paths}<circle cx="${cx}" cy="${cy}" r="${radius*1.6}" fill="none" stroke="#a98752" stroke-opacity=".3" stroke-width="2"/><circle cx="${cx}" cy="${cy}" r="${radius*.8}" fill="#a98752"/>${bodies}`;
}
function portfolioPlanets() {
  const points = ORBITS.flatMap(orbit => Array.from({ length: 241 }, (_, i) =>
    orbitState(orbit, 2 * Math.PI * Math.sqrt(orbit.a ** 3 / orbit.mu) * i / 240)));
  const minX = Math.min(...points.map(p => p.x)), maxX = Math.max(...points.map(p => p.x));
  const minY = Math.min(...points.map(p => p.y)), maxY = Math.max(...points.map(p => p.y));
  const scale = Math.min(1000 / (maxX-minX), 490 / (maxY-minY));
  return planets(600 - (minX+maxX)*scale/2, 315 - (minY+maxY)*scale/2, scale, 14);
}
await mkdir('public/social', { recursive: true });
for (const [slug, lines, subtitle, detail] of cards) {
  const content = slug === 'portfolio'
    ? portfolioPlanets()
    : `${planets(1050, 230, 75, 7)}
    ${lines.map((line,i)=>`<text x="64" y="${260+i*76}" font-family="Arial" font-weight="bold" font-size="58" letter-spacing="-2" fill="#2f3437">${escape(line)}</text>`).join('')}
    <text x="64" y="411" font-family="Arial" font-size="30" fill="#365b47">${escape(subtitle)}</text>
    <line x1="64" x2="1136" y1="490" y2="490" stroke="#bbc7bb"/>
    <text x="64" y="548" font-family="Arial" font-size="23" fill="#505e55">${escape(detail)}</text>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630"><rect width="1200" height="630" fill="#f3f1ec"/>${content}</svg>`;
  await sharp(Buffer.from(svg), { density: 144 }).png().toFile(`public/social/${slug}.png`);
}
