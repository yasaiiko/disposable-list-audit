// Checks popular open disposable-email blocklists for false positives:
// mainstream mailbox providers and privacy relays that forward to a real inbox.
// Writes results.json and refreshes the table in README.md.
//   node audit.mjs            (Node 18+, no dependencies)

import { readFile, writeFile } from 'node:fs/promises';

const providers = JSON.parse(await readFile(new URL('./providers.json', import.meta.url), 'utf8'));
const relays = JSON.parse(await readFile(new URL('./relays.json', import.meta.url), 'utf8'));

const LISTS = [
  ['las-nish/disposable-emails', 'https://raw.githubusercontent.com/las-nish/disposable-emails/main/domains.txt'],
  ['ivolo/disposable-email-domains', 'https://raw.githubusercontent.com/ivolo/disposable-email-domains/master/index.json'],
  ['Propaganistas/Laravel-Disposable-Email', 'https://raw.githubusercontent.com/Propaganistas/Laravel-Disposable-Email/master/domains.json'],
  ['FGRibreau/mailchecker', 'https://raw.githubusercontent.com/FGRibreau/mailchecker/master/list.txt'],
  ['wesbos/burner-email-providers', 'https://raw.githubusercontent.com/wesbos/burner-email-providers/master/emails.txt'],
  ['disposable-email-domains/disposable-email-domains', 'https://raw.githubusercontent.com/disposable-email-domains/disposable-email-domains/main/disposable_email_blocklist.conf'],
  ['7c/fakefilter', 'https://raw.githubusercontent.com/7c/fakefilter/main/txt/data.txt'],
];

// Accepts plain text (one domain per line, # comments) or a JSON array/object.
function parse(text) {
  let items;
  try {
    const j = JSON.parse(text);
    items = Array.isArray(j) ? j : Object.keys(j);
  } catch {
    items = text.split(/\r?\n/);
  }
  return new Set(
    items
      .map((x) => String(x).trim().toLowerCase())
      .filter((x) => x && !x.startsWith('#'))
      .flatMap((x) => x.split(/[,|]/)),
  );
}

const results = [];
for (const [name, raw] of LISTS) {
  const res = await fetch(raw, { signal: AbortSignal.timeout(60000) });
  if (!res.ok) throw new Error(`${name}: HTTP ${res.status}`);
  const set = parse(await res.text());
  results.push({
    name,
    repo: `https://github.com/${name}`,
    size: set.size,
    providers: providers.filter((d) => set.has(d)),
    relays: relays.filter((d) => set.has(d)),
  });
}

const testedOn = new Date().toISOString().slice(0, 10);
await writeFile(
  new URL('./results.json', import.meta.url),
  `${JSON.stringify({ testedOn, providers, relays, results }, null, 1)}\n`,
);

const fmt = (n) => n.toLocaleString('en-US');
const cell = (hit) => (hit.length ? `**${hit.length}** (${hit.join(', ')})` : '0');
const table = [
  `Last run: **${testedOn}**. ${providers.length} mainstream providers and ${relays.length} privacy-relay domains checked.`,
  '',
  '| List | Domains | Mainstream providers listed | Privacy relays listed |',
  '|---|---:|---|---|',
  ...results.map((r) => `| [${r.name}](${r.repo}) | ${fmt(r.size)} | ${cell(r.providers)} | ${cell(r.relays)} |`),
].join('\n');

const readmeUrl = new URL('./README.md', import.meta.url);
const readme = await readFile(readmeUrl, 'utf8');
const start = '<!-- results:start -->';
const end = '<!-- results:end -->';
const i = readme.indexOf(start);
const j = readme.indexOf(end);
if (i < 0 || j < 0) throw new Error('README.md is missing the results markers');
await writeFile(readmeUrl, `${readme.slice(0, i + start.length)}\n${table}\n${readme.slice(j)}`);

for (const r of results) console.log(`${r.name}: ${r.size} domains, ${r.providers.length} providers, ${r.relays.length} relays`);
