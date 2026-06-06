/* ============ Bản tin TRAV — frontend app (vanilla JS) ============ */
const $  = (s,r=document)=>r.querySelector(s);
const $$ = (s,r=document)=>[...r.querySelectorAll(s)];
const cimg = p => !p ? '' : (/^https?:\/\//.test(p)||p.startsWith('content/')) ? p : 'content/'+p;
const esc = s => String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const qs  = new URLSearchParams(location.search);

/* ---------------- tiny Markdown -> HTML ---------------- */
function mdInline(s){
  s = esc(s);
  s = s.replace(/!\[([^\]]*)\]\(([^)]+)\)/g,(m,a,u)=>`<img src="${cimg(u)}" alt="${a}">`);
  s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g,'<a href="$2" target="_blank" rel="noopener">$1</a>');
  s = s.replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>');
  s = s.replace(/(^|[^\w])[*_]([^*_]+)[*_]/g,'$1<em>$2</em>');
  return s;
}
function mdToHtml(md){
  const lines = String(md||'').replace(/\r/g,'').split('\n');
  let html='', i=0;
  const isRow = l => /^\s*\|.*\|\s*$/.test(l);
  while(i<lines.length){
    let l = lines[i];
    if(!l.trim()){ i++; continue; }
    // table
    if(isRow(l) && i+1<lines.length && /^\s*\|?[\s:|-]+\|?\s*$/.test(lines[i+1]) && lines[i+1].includes('-')){
      const head = l.split('|').slice(1,-1).map(c=>c.trim());
      i+=2; const rows=[];
      while(i<lines.length && isRow(lines[i])){ rows.push(lines[i].split('|').slice(1,-1).map(c=>c.trim())); i++; }
      html+='<table><thead><tr>'+head.map(h=>`<th>${mdInline(h)}</th>`).join('')+'</tr></thead><tbody>'+
        rows.map(r=>'<tr>'+r.map(c=>`<td>${mdInline(c)}</td>`).join('')+'</tr>').join('')+'</tbody></table>';
      continue;
    }
    if(/^###\s+/.test(l)){ html+=`<h3>${mdInline(l.replace(/^###\s+/,''))}</h3>`; i++; continue; }
    if(/^##\s+/.test(l)){ html+=`<h2>${mdInline(l.replace(/^##\s+/,''))}</h2>`; i++; continue; }
    if(/^[-*]\s+/.test(l)){ let items=[]; while(i<lines.length&&/^[-*]\s+/.test(lines[i])){items.push(lines[i].replace(/^[-*]\s+/,''));i++;} html+='<ul>'+items.map(t=>`<li>${mdInline(t)}</li>`).join('')+'</ul>'; continue; }
    if(/^\d+\.\s+/.test(l)){ let items=[]; while(i<lines.length&&/^\d+\.\s+/.test(lines[i])){items.push(lines[i].replace(/^\d+\.\s+/,''));i++;} html+='<ol>'+items.map(t=>`<li>${mdInline(t)}</li>`).join('')+'</ol>'; continue; }
    // image-only line
    if(/^!\[[^\]]*\]\([^)]+\)$/.test(l.trim())){ html+=`<p>${mdInline(l.trim())}</p>`; i++; continue; }
    // paragraph (gather until blank)
    let buf=[l]; i++;
    while(i<lines.length && lines[i].trim() && !/^(#{2,3}\s|[-*]\s|\d+\.\s)/.test(lines[i]) && !isRow(lines[i])){ buf.push(lines[i]); i++; }
    html+=`<p>${mdInline(buf.join(' '))}</p>`;
  }
  return html;
}

/* ---------------- data ---------------- */
const DATA = { site:null, index:null, issues:{} };
async function getJSON(u){ const r=await fetch(u,{cache:'no-cache'}); if(!r.ok) throw new Error(u); return r.json(); }
async function loadCore(){
  DATA.site  = await getJSON('content/site.json').catch(()=>({}));
  DATA.index = await getJSON('content/index.json').catch(()=>[]);
  DATA.index.sort((a,b)=>(b.date||'').localeCompare(a.date||''));
}
async function loadIssue(slug){
  if(DATA.issues[slug]) return DATA.issues[slug];
  const d = await getJSON('content/issues/'+slug+'.json'); DATA.issues[slug]=d; return d;
}

/* ---------------- shared chrome ---------------- */
function chrome(){
  const s=DATA.site||{};
  $$('[data-site-name]').forEach(e=>e.textContent=s.name||'BẢN TIN');
  const latest = DATA.index[0];
  if(latest){
    $$('[data-issue-badge]').forEach(e=>e.textContent='SỐ '+latest.number+'.'+latest.year);
    $$('[data-issue-date]').forEach(e=>e.textContent=fmtDate(latest.date));
  }
  // nav active
  const page=document.body.dataset.page;
  $$('.nav a[data-nav]').forEach(a=>{ if(a.dataset.nav===page) a.classList.add('active'); });
  // burger
  const burger=$('.nav .burger'); if(burger) burger.onclick=()=>$('.nav .links').classList.toggle('open');
  // footer contact
  $$('[data-foot-org]').forEach(e=>e.textContent=s.org||'');
  $$('[data-foot-center]').forEach(e=>e.textContent=s.center||'');
  $$('[data-foot-addr]').forEach(e=>e.textContent=s.address||'');
  $$('[data-foot-web]').forEach(e=>{e.textContent=s.web||'';e.href='https://'+(s.web||'')});
  $$('[data-foot-email]').forEach(e=>{e.textContent=s.email||'';e.href='mailto:'+(s.email||'')});
}
function fmtDate(d){ if(!d) return ''; const [y,m,da]=d.split('-'); return `Ngày ${da}/${m}/${y}`; }
const alink=(slug,id)=>`article.html?issue=${slug}&id=${id}`;
function cardThumb(a){
  return a.image ? `<img src="${cimg(a.image)}" alt="">` : `<div class="ph">${esc(a.section||'TRAV')}</div>`;
}

/* ---------------- HOME ---------------- */
async function renderHome(){
  const latest = DATA.index[0]; if(!latest){ $('#home').innerHTML='<p class="loading">Chưa có bản tin.</p>'; return; }
  const issue = await loadIssue(latest.slug);
  const q = (qs.get('q')||'').toLowerCase().trim();
  let arts = issue.articles;
  if(q) arts = arts.filter(a=>(a.title+' '+a.summary).toLowerCase().includes(q));

  // hero: highlight 1 big, highlight 2 + next article as side
  const byId = id => issue.articles.find(a=>a.id===id);
  const h = issue.highlights||[];
  const big = h[0] ? {...byId(h[0].article), title:h[0].title, image:h[0].image} : arts[0];
  const s1  = h[1] ? {...byId(h[1].article), title:h[1].title, image:h[1].image} : arts[1];
  const s2  = arts.find(a=>a.id!==(big&&big.id)&&a.id!==(s1&&s1.id));
  let html='';
  if(!q){
    html += `<section class="hero">
      <a class="feat" href="${alink(latest.slug,big.id)}">
        ${big.image?`<img src="${cimg(big.image)}" alt="">`:''}<div class="scrim"></div>
        <div class="c"><span class="tag">${esc(big.section)}</span><h3>${esc(big.title)}</h3><p>${esc(big.summary)}</p></div></a>
      <div class="feat-side">
        ${[s1,s2].filter(Boolean).map(a=>`<a class="fs" href="${alink(latest.slug,a.id)}">
          ${a.image?`<img src="${cimg(a.image)}" alt="">`:''}<div class="scrim"></div>
          <div class="c"><span class="tag">${esc(a.section)}</span><h4>${esc(a.title)}</h4></div></a>`).join('')}
      </div></section>`;
  } else {
    html += `<div class="section-head"><h2>Kết quả: “${esc(q)}”</h2></div>`;
  }

  // sections
  (DATA.site.sections||[]).forEach(sec=>{
    const list = arts.filter(a=>a.section===sec);
    if(!list.length) return;
    html += `<div class="section-head"><h2>${esc(sec)}</h2></div><div class="grid cards">`;
    html += list.map(a=>`<a class="card2" href="${alink(latest.slug,a.id)}">
      <div class="thumb">${cardThumb(a)}</div>
      <div class="c"><span class="tag">${esc(a.section)}</span><h3>${esc(a.title)}</h3>
      <p>${esc(a.summary)}</p><span class="more">Đọc tiếp →</span></div></a>`).join('');
    html += `</div>`;
  });
  $('#home-main').innerHTML = html;
  $('#home-side').innerHTML = sidebar(issue, latest.slug);
}
function sidebar(issue, slug){
  const issues = DATA.index.slice(0,6).map(it=>`<a class="issue-card" href="issues.html">
      <div class="ic">${it.number}<small>${it.year}</small></div>
      <div class="t">${esc(it.title)}<small>${fmtDate(it.date)} • ${it.count} bài</small></div></a>`).join('');
  const top = issue.articles.slice(0,5).map(a=>`<a href="${alink(slug,a.id)}"><span>${esc(a.title)}</span></a>`).join('');
  return `<div class="box"><h3>Các số gần đây</h3>${issues}</div>
          <div class="box"><h3>Đáng chú ý</h3><div class="rank">${top}</div></div>
          <div class="box"><h3>Đăng ký nhận tin</h3>
            <p style="font-size:13.5px;color:var(--muted)">Bản tin phát hành hàng tuần. Liên hệ <a style="color:var(--red);font-weight:600" data-foot-email></a> để nhận qua email.</p></div>`;
}

/* ---------------- ARTICLE ---------------- */
async function renderArticle(){
  const slug=qs.get('issue'), id=qs.get('id');
  if(!slug||!id){ location.href='index.html'; return; }
  const issue=await loadIssue(slug);
  const a=issue.articles.find(x=>x.id===id);
  if(!a){ $('#article').innerHTML='<p class="loading">Không tìm thấy bài viết.</p>'; return; }
  document.title = a.title+' — Bản tin PVTM & CBS';
  $('#article').innerHTML = `
    <div class="crumb"><a href="index.html">Trang chủ</a> / <a href="issues.html">Số ${issue.number}.${issue.year}</a> / ${esc(a.section)}</div>
    <span class="tag">${esc(a.section)}</span>
    <h1>${esc(a.title)}</h1>
    <div class="meta">${fmtDate(issue.date)} • Trung tâm Thông tin và Cảnh báo (CIEW)</div>
    <div class="prose">${mdToHtml(a.body)}</div>`;
  // related
  const rel=issue.articles.filter(x=>x.section===a.section&&x.id!==a.id).slice(0,3);
  $('#article-side').innerHTML = `<div class="box"><h3>Cùng chuyên mục</h3>${
    (rel.length?rel:issue.articles.filter(x=>x.id!==a.id).slice(0,3)).map(x=>`<a class="issue-card" href="${alink(slug,x.id)}">
      <div class="ic" style="background:var(--blockblue)">▣</div><div class="t">${esc(x.title)}</div></a>`).join('')
  }</div><div class="box"><h3>Tải bản tin</h3><p style="font-size:13.5px;color:var(--muted)">Xem toàn bộ số ${issue.number}.${issue.year} tại trang <a class="more" href="issues.html" style="color:var(--red);font-weight:700">Các số bản tin →</a></p></div>`;
}

/* ---------------- ISSUES ---------------- */
async function renderIssues(){
  const latest=DATA.index[0];
  let html='';
  if(latest){
    html += `<div class="issue-hero"><div class="big">№ ${latest.number}</div>
      <div class="meta"><h2>${esc(latest.title)}</h2><p>${fmtDate(latest.date)} • ${latest.count} bài viết • Năm ${latest.year}</p></div></div>`;
  }
  html += `<div class="section-head"><h2>Tất cả các số</h2></div><div class="grid cards">`;
  html += DATA.index.map(it=>`<a class="card2" href="issues.html#${it.slug}" onclick="event.preventDefault();openIssue('${it.slug}')">
      <div class="thumb">${it.cover_hero?`<img src="${cimg(it.cover_hero)}" alt="">`:`<div class="ph">SỐ ${it.number}</div>`}</div>
      <div class="c"><span class="tag">Số ${it.number}.${it.year}</span><h3>${esc(it.title)}</h3>
      <p>${fmtDate(it.date)} • ${it.count} bài viết</p><span class="more">Mở số này →</span></div></a>`).join('');
  html += `</div><div id="issue-detail"></div>`;
  $('#issues').innerHTML=html;
  if(location.hash) openIssue(location.hash.slice(1));
}
async function openIssue(slug){
  const issue=await loadIssue(slug);
  const secs={};
  issue.articles.forEach(a=>{(secs[a.section]=secs[a.section]||[]).push(a)});
  let html=`<div class="section-head"><h2>Nội dung số ${issue.number}.${issue.year}</h2></div>`;
  Object.keys(secs).forEach(sec=>{
    html+=`<div class="section-head"><h2 style="font-size:18px">${esc(sec)}</h2></div><div class="grid cards">`;
    html+=secs[sec].map(a=>`<a class="card2" href="${alink(slug,a.id)}">
      <div class="thumb">${cardThumb(a)}</div><div class="c"><span class="tag">${esc(a.section)}</span>
      <h3>${esc(a.title)}</h3><p>${esc(a.summary)}</p><span class="more">Đọc tiếp →</span></div></a>`).join('');
    html+=`</div>`;
  });
  $('#issue-detail').innerHTML=html;
  $('#issue-detail').scrollIntoView({behavior:'smooth'});
}
window.openIssue=openIssue;

/* ---------------- boot ---------------- */
(async function(){
  try{ await loadCore(); }catch(e){ console.error(e); }
  chrome();
  const p=document.body.dataset.page;
  try{
    if(p==='home')     await renderHome();
    else if(p==='article') await renderArticle();
    else if(p==='issues')  await renderIssues();
  }catch(e){ console.error(e); }
  chrome(); // re-bind contact links injected late
  // search
  $$('.nav .search input').forEach(inp=>inp.addEventListener('keydown',e=>{
    if(e.key==='Enter'){ location.href='index.html?q='+encodeURIComponent(inp.value); }
  }));
})();
