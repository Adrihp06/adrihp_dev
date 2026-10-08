// Static PNG cards: crawlers can fetch these without executing JavaScript.
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
const escape = s => s.replaceAll('&', '&amp;').replaceAll('<', '&lt;');
const cards = [
  ['portfolio', ['Adrián Hernández', 'Padrón'], 'AI/ML Engineer & Data Scientist', 'Projects and notes from the work.'],
  ['jev-travel-ruter-context-cache-agent-efficiency', ['Making a travel agent', 'do less work'], 'Context selection with JEV', 'Travel Ruter · Agent architecture and evaluation'],
  ['mnemosyne-bug-bounty-duplicate-detection', ['Building an agentic system', 'for duplicate detection'], 'Mnemosyne', 'Hybrid retrieval · Re-ranking · AI agents'],
];
await mkdir('public/social', { recursive: true });
for (const [slug, lines, subtitle, detail] of cards) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#f3f1ec"/>
  <rect x="64" y="68" width="48" height="5" fill="#365b47"/>
  <text x="64" y="121" font-family="Arial" font-size="22" fill="#505e55">adrihp.pages.dev</text>
  <g fill="none" stroke="#bbc7bb" stroke-width="2" opacity=".6"><ellipse cx="1060" cy="230" rx="95" ry="180" transform="rotate(25 1060 230)"/><ellipse cx="1060" cy="230" rx="95" ry="180" transform="rotate(85 1060 230)"/><ellipse cx="1060" cy="230" rx="95" ry="180" transform="rotate(145 1060 230)"/></g>
  ${lines.map((line,i)=>`<text x="64" y="${260+i*76}" font-family="Arial" font-weight="bold" font-size="${slug === 'portfolio' ? 68 : 58}" letter-spacing="-2" fill="#2f3437">${escape(line)}</text>`).join('')}
  <text x="64" y="411" font-family="Arial" font-size="30" fill="#365b47">${escape(subtitle)}</text>
  <line x1="64" x2="1136" y1="490" y2="490" stroke="#bbc7bb"/>
  <text x="64" y="548" font-family="Arial" font-size="23" fill="#505e55">${escape(detail)}</text>
  </svg>`;
  await sharp(Buffer.from(svg), { density: 144 }).png().toFile(`public/social/${slug}.png`);
}
