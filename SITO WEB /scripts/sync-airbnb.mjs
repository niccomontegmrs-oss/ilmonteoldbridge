/* Scarica il calendario iCal di Airbnb e scrive date.json con le notti occupate. */
import { writeFileSync } from 'node:fs';

const URLS = (process.env.AIRBNB_ICAL || '').split(/[\s,]+/).filter(Boolean);
if (!URLS.length) { console.error('Manca il segreto AIRBNB_ICAL'); process.exit(1); }

const pad = n => String(n).padStart(2, '0');
const iso = d => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
const notti = new Set();

for (const url of URLS) {
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  if (!res.ok) { console.error(`Errore ${res.status} su ${url}`); process.exit(1); }
  const testo = (await res.text()).replace(/\r\n[ \t]/g, '');       // unisce le righe spezzate
  for (const blocco of testo.split('BEGIN:VEVENT').slice(1)) {
    const a = blocco.match(/DTSTART[^:]*:(\d{8})/);
    const b = blocco.match(/DTEND[^:]*:(\d{8})/);
    if (!a || !b) continue;
    const d1 = new Date(Date.UTC(+a[1].slice(0, 4), +a[1].slice(4, 6) - 1, +a[1].slice(6, 8)));
    const d2 = new Date(Date.UTC(+b[1].slice(0, 4), +b[1].slice(4, 6) - 1, +b[1].slice(6, 8)));
    for (let d = d1; d < d2; d.setUTCDate(d.getUTCDate() + 1)) notti.add(iso(d));  // DTEND = giorno di check-out, escluso
  }
}

const elenco = [...notti].sort();
writeFileSync('date.json', JSON.stringify(elenco));
console.log(`${elenco.length} notti occupate`);
