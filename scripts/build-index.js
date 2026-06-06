// Quét content/issues/*.json -> tạo content/index.json (danh sách các số).
// Chạy tự động trong GitHub Action mỗi khi có thay đổi.
const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, '..', 'content', 'issues');
const out = path.join(__dirname, '..', 'content', 'index.json');

let list = [];
if (fs.existsSync(dir)) {
  for (const f of fs.readdirSync(dir)) {
    if (!f.endsWith('.json')) continue;
    try {
      const d = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
      const slug = f.replace(/\.json$/, '');
      let hero = d.cover_hero || (d.highlights && d.highlights[0] && d.highlights[0].image) || '';
      if (hero && !/^https?:\/\//.test(hero) && !hero.startsWith('content/')) hero = 'content/' + hero;
      list.push({
        slug,
        number: d.number || '',
        year: d.year || '',
        date: d.date || '',
        title: d.title || ('Số ' + (d.number||'')),
        cover_hero: hero,
        count: (d.articles || []).length
      });
    } catch (e) { console.error('Bỏ qua', f, e.message); }
  }
}
list.sort((a, b) => String(b.date).localeCompare(String(a.date)));
fs.writeFileSync(out, JSON.stringify(list, null, 2), 'utf8');
console.log('Đã tạo index.json với', list.length, 'số bản tin.');
