(function(){
'use strict';

const PER_PAGE = 20;
let quotes = [];
let searchTerm = '';
let currentPage = 1;

const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);

function init(){
  const stored = localStorage.getItem('quotes_data');
  if(stored){
    try{quotes=JSON.parse(stored);}catch(e){quotes=[];}
  }
  if(!quotes||!quotes.length){
    quotes = (typeof INIT_QUOTES !== 'undefined' && Array.isArray(INIT_QUOTES))
      ? INIT_QUOTES.map((q,i)=>({...q,id:i+1}))
      : [];
    saveQuotes();
  }
  // Ensure IDs
  quotes.forEach((q,i)=>{if(!q.id)q.id=i+1;});

  listen();
  applyEffect('none');
  goToPage(1);
}

function saveQuotes(){
  localStorage.setItem('quotes_data',JSON.stringify(quotes));
}

function getFiltered(){
  if(!searchTerm) return quotes;
  const t = searchTerm.toLowerCase();
  return quotes.filter(q =>
    q.en.toLowerCase().includes(t) || q.zh.includes(searchTerm)
  );
}

function goToPage(p){
  const filtered = getFiltered();
  const total = Math.ceil(filtered.length / PER_PAGE) || 1;
  if(p<1) p=1;
  if(p>total) p=total;
  currentPage = p;
  renderQuotes(filtered, p);
  renderPagination(filtered, total, p);
  window.scrollTo({top:0,behavior:'smooth'});
}
window.goToPage = goToPage;

function renderQuotes(filtered, page){
  const container = $('#quoteContainer');
  const start = (page-1)*PER_PAGE;
  const end = Math.min(start+PER_PAGE, filtered.length);
  const pageItems = filtered.slice(start, end);

  if(!pageItems.length){
    container.innerHTML = '<div style="text-align:center;color:var(--dim);padding:40px 0;">No quotes found ✨</div>';
    return;
  }

  container.innerHTML = pageItems.map((q,i)=>{
    const globalIdx = quotes.indexOf(q)+1;
    return `<div class="card card-enter" data-id="${q.id}">
      <div class="idx">#${globalIdx}</div>
      <div class="en-display"><div class="en">${escHtml(q.en)}</div></div>
      <div class="zh-display"><div class="zh">${escHtml(q.zh)}</div></div>
      <div class="edit-area">
        <textarea class="edit-en">${escHtml(q.en)}</textarea>
        <input class="edit-zh" value="${escHtml(q.zh)}">
        <div class="edit-actions">
          <button class="save-btn" data-id="${q.id}">✓ Save</button>
          <button class="cancel-btn">✕ Cancel</button>
          <button class="delete-btn" data-id="${q.id}">🗑 Delete</button>
        </div>
      </div>
      <div class="actions">
        <button class="like-btn" data-id="${q.id}">${q.liked?'❤️':'🤍'} ${q.liked||''}</button>
        <button class="edit-btn" data-id="${q.id}">✏️ Edit</button>
        <button class="match-btn" data-id="${q.id}">🔍 Match</button>
      </div>
    </div>`;
  }).join('');

  // Entrance animation via IntersectionObserver
  const observer = new IntersectionObserver((entries)=>{
    entries.forEach(e=>{
      if(e.isIntersecting){e.target.classList.add('visible');observer.unobserve(e.target);}
    });
  },{threshold:0.08});
  container.querySelectorAll('.card-enter').forEach(el=>observer.observe(el));
}

function renderPagination(filtered, total, page){
  const p = $('#pagination');
  if(total<=1){p.innerHTML='';return;}

  let html = '';

  // First page
  html += `<button class="page-nav" data-page="1" ${page===1?'disabled':''}>《《</button>`;
  // Prev
  html += `<button class="page-nav" data-page="${page-1}" ${page===1?'disabled':''}>《</button>`;

  // Page numbers
  const range = 2;
  let startP = Math.max(1, page-range);
  let endP = Math.min(total, page+range);

  if(startP>1){
    html += `<button class="page-num" data-page="1">1</button>`;
    if(startP>2) html += `<span class="page-ellipsis">…</span>`;
  }
  for(let i=startP;i<=endP;i++){
    html += `<button class="page-num ${i===page?'active':''}" data-page="${i}">${i}</button>`;
  }
  if(endP<total){
    if(endP<total-1) html += `<span class="page-ellipsis">…</span>`;
    html += `<button class="page-num" data-page="${total}">${total}</button>`;
  }

  // Next
  html += `<button class="page-nav" data-page="${page+1}" ${page===total?'disabled':''}>》</button>`;
  // Last
  html += `<button class="page-nav" data-page="${total}" ${page===total?'disabled':''}>》》</button>`;

  p.innerHTML = html;

  p.querySelectorAll('button').forEach(btn=>{
    btn.addEventListener('click',()=>{
      const pg = parseInt(btn.dataset.page);
      if(!isNaN(pg)) goToPage(pg);
    });
  });
}

function escHtml(s){
  const d=document.createElement('div');
  d.textContent=s;
  return d.innerHTML;
}

// --- Search ---
function searchQuotes(){
  searchTerm = $('#searchInput').value.trim();
  currentPage = 1;
  goToPage(1);
}

// --- Match ---
function matchQuotes(id){
  const q = quotes.find(x=>x.id===id);
  if(!q) return;
  const t = q.en.toLowerCase();
  const scores = quotes.map(other=>{
    if(other.id===q.id) return null;
    const words = t.split(/\s+/).filter(w=>w.length>2);
    let score = 0;
    const ot = other.en.toLowerCase();
    words.forEach(w=>{if(ot.includes(w))score+=1;});
    // exact match bonus
    if(ot===t) score+=10;
    // partial overlap
    const common = [...new Set(t.split(/\s+/))].filter(w=>ot.includes(w)).length;
    const ratio = common / Math.max(t.split(/\s+/).length, ot.split(/\s+/).length);
    score += ratio * 5;
    return {other,score};
  }).filter(Boolean).sort((a,b)=>b.score-a.score).slice(0,6);

  const panel = $('#matchPanel');
  if(!scores.length||scores[0].score<0.5){
    panel.classList.remove('visible');
    panel.innerHTML='';
    return;
  }

  const exactMatch = scores.find(s=>s.score>=10);
  panel.innerHTML = `<h4>${exactMatch?'⚠️ Exact duplicate!':'📎 Similar quotes'}</h4>
    ${scores.map(s=>{
      const oidx = quotes.indexOf(s.other)+1;
      return `<div class="match-item ${s.score>=10?'match-duplicate':''}" data-id="${s.other.id}">
        <div><div class="match-en">${escHtml(s.other.en)}</div><div class="match-zh">${escHtml(s.other.zh)}</div></div>
        <div class="match-score">#${oidx} · ${Math.round(s.score)}</div>
      </div>`;
    }).join('')}
  `;
  panel.classList.add('visible');

  panel.querySelectorAll('.match-item').forEach(el=>{
    el.addEventListener('click',()=>{
      const mid = parseInt(el.dataset.id);
      if(!mid) return;
      // Find which page this quote is on
      const filtered = getFiltered();
      const idx = filtered.findIndex(q=>q.id===mid);
      if(idx<0) return;
      const pg = Math.floor(idx/PER_PAGE)+1;
      goToPage(pg);
      // Highlight after render
      setTimeout(()=>{
        const card = document.querySelector(`.card[data-id="${mid}"]`);
        if(card){card.classList.remove('highlight');void card.offsetWidth;card.classList.add('highlight');card.scrollIntoView({behavior:'smooth',block:'center'});}
      },100);
    });
  });
}

// --- Like ---
function toggleLike(id){
  const q = quotes.find(x=>x.id===id);
  if(!q) return;
  q.liked = q.liked ? 0 : 1;
  saveQuotes();
  goToPage(currentPage);
}

// --- Edit ---
function editQuote(id){
  const card = document.querySelector(`.card[data-id="${id}"]`);
  if(card) card.classList.add('editing');
}

function saveEdit(id){
  const card = document.querySelector(`.card[data-id="${id}"]`);
  if(!card) return;
  const en = card.querySelector('.edit-en').value.trim();
  const zh = card.querySelector('.edit-zh').value.trim();
  if(!en||!zh) return;
  const q = quotes.find(x=>x.id===id);
  if(!q) return;
  q.en = en;
  q.zh = zh;
  saveQuotes();
  card.classList.remove('editing');
  goToPage(currentPage);
  // Re-run match
  matchQuotes(id);
}

function cancelEdit(id){
  const card = document.querySelector(`.card[data-id="${id}"]`);
  if(card) card.classList.remove('editing');
}

function deleteQuote(id){
  if(!confirm('Delete this quote?')) return;
  quotes = quotes.filter(q=>q.id!==id);
  saveQuotes();
  const panel = $('#matchPanel');
  panel.classList.remove('visible');
  goToPage(currentPage);
}

// --- Export CSV ---
function exportCSV(){
  const data = quotes.map((q,i)=>[i+1,`"${q.en.replace(/"/g,'""')}"`,`"${q.zh.replace(/"/g,'""')}"`]);
  data.unshift(['编号','English','中文']);
  const bom = '\uFEFF';
  const csv = bom + data.map(r=>r.join(',')).join('\r\n');
  const blob = new Blob([csv],{type:'text/csv;charset=utf-8;'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'quotes.csv';
  a.click();
  URL.revokeObjectURL(url);
}
window.exportCSV = exportCSV;

// --- Little Prince: random jump ---
function littlePrince(){
  const filtered = getFiltered();
  if(!filtered.length) return;
  const rand = filtered[Math.floor(Math.random()*filtered.length)];
  const idx = filtered.findIndex(q=>q.id===rand.id);
  const pg = Math.floor(idx/PER_PAGE)+1;
  goToPage(pg);
  setTimeout(()=>{
    const card = document.querySelector(`.card[data-id="${rand.id}"]`);
    if(card){
      card.classList.remove('highlight');
      void card.offsetWidth;
      card.classList.add('highlight');
      card.scrollIntoView({behavior:'smooth',block:'center'});
    }
  },100);
}

// --- Effects ---
let effectInterval = null;

function applyEffect(name){
  const c = $('#effectContainer');
  c.innerHTML = '';
  if(effectInterval){clearInterval(effectInterval);effectInterval=null;}

  if(name==='none'||!name) return;

  const isAll = name==='all';

  if(isAll||name==='starlight') spawnStars(c);
  if(isAll||name==='meteor') spawnMeteors(c);
  if(isAll||name==='fireflies') spawnFireflies(c);
  if(isAll||name==='aurora') spawnAurora(c);
  if(isAll||name==='petals') spawnPetals(c);
  if(isAll||name==='matrix') spawnMatrix(c);
  if(isAll||name==='bokeh') spawnBokeh(c);
}

function spawnStars(c){
  for(let i=0;i<80;i++){
    const el = document.createElement('div');
    el.className='starlight-particle';
    el.style.left=Math.random()*100+'%';
    el.style.top=Math.random()*100+'%';
    el.style.setProperty('--dur',(2+Math.random()*3)+'s');
    el.style.setProperty('--delay',(Math.random()*4)+'s');
    el.style.width=(1.5+Math.random()*2.5)+'px';
    el.style.height=el.style.width;
    c.appendChild(el);
  }
}

function spawnMeteors(c){
  for(let i=0;i<12;i++){
    const el = document.createElement('div');
    el.className='meteor-particle';
    el.style.left=(5+Math.random()*85)+'%';
    el.style.top=(Math.random()*40)+'%';
    el.style.setProperty('--dur',(0.8+Math.random()*1.2)+'s');
    el.style.setProperty('--delay',(Math.random()*8)+'s');
    el.style.setProperty('--dx',(-200-Math.random()*200)+'px');
    el.style.setProperty('--dy',(150+Math.random()*200)+'px');
    c.appendChild(el);
  }
}

function spawnFireflies(c){
  for(let i=0;i<25;i++){
    const el=document.createElement('div');
    el.className='firefly-particle';
    el.style.left=Math.random()*100+'%';el.style.top=Math.random()*100+'%';
    el.style.setProperty('--dur',(4+Math.random()*4)+'s');
    el.style.setProperty('--delay',(Math.random()*5)+'s');
    const d=()=>(Math.random()-0.5)*80;
    el.style.setProperty('--dx1',d()+'px');el.style.setProperty('--dy1',d()+'px');
    el.style.setProperty('--dx2',d()+'px');el.style.setProperty('--dy2',d()+'px');
    el.style.setProperty('--dx3',d()+'px');el.style.setProperty('--dy3',d()+'px');
    c.appendChild(el);
  }
}
function spawnAurora(c){
  for(let i=0;i<3;i++){
    const el=document.createElement('div');
    el.className='aurora-layer';
    const hues=[['100,200,255','0,255,150'],['255,100,200','200,100,255'],['100,255,200','255,200,100']];
    el.style.setProperty('--ac1',hues[i][0]);el.style.setProperty('--ac2',hues[i][1]);
    el.style.setProperty('--dur',(7+Math.random()*4)+'s');
    el.style.setProperty('--delay',(i*2)+'s');
    c.appendChild(el);
  }
}
function spawnPetals(c){
  const colors=['#ffb7c5','#ffd1dc','#ffc0cb','#f0c0e0','#ffe4e1'];
  for(let i=0;i<30;i++){
    const el=document.createElement('div');
    el.className='petal-particle';
    el.style.left=Math.random()*100+'%';el.style.top='-10%';
    el.style.setProperty('--petal-color',colors[i%colors.length]);
    el.style.setProperty('--dur',(5+Math.random()*4)+'s');
    el.style.setProperty('--delay',(Math.random()*6)+'s');
    el.style.width=(8+Math.random()*8)+'px';el.style.height=(6+Math.random()*6)+'px';
    c.appendChild(el);
  }
}
function spawnMatrix(c){
  const chars='アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン';
  for(let i=0;i<50;i++){
    const el=document.createElement('div');
    el.className='matrix-drop';
    el.style.left=Math.random()*100+'%';el.textContent=chars[Math.floor(Math.random()*chars.length)];
    el.style.setProperty('--dur',(2+Math.random()*3)+'s');
    el.style.setProperty('--delay',(Math.random()*4)+'s');
    el.style.fontSize=(12+Math.random()*8)+'px';
    el.style.opacity=0.3+Math.random()*0.5;
    c.appendChild(el);
  }
}
function spawnBokeh(c){
  for(let i=0;i<15;i++){
    const el=document.createElement('div');
    el.className='bokeh-particle';
    el.style.left=Math.random()*100+'%';el.style.top=Math.random()*100+'%';
    const s=30+Math.random()*80;el.style.setProperty('--size',s+'px');
    const r=Math.floor(100+Math.random()*155),g=Math.floor(100+Math.random()*155),b=Math.floor(150+Math.random()*105);
    el.style.setProperty('--bc',r+','+g+','+b);
    el.style.setProperty('--dur',(8+Math.random()*6)+'s');
    el.style.setProperty('--delay',(Math.random()*5)+'s');
    const dd=()=>(Math.random()-0.5)*60;
    el.style.setProperty('--bx1',dd()+'px');el.style.setProperty('--by1',dd()+'px');
    el.style.setProperty('--bx2',dd()+'px');el.style.setProperty('--by2',dd()+'px');
    c.appendChild(el);
  }
}

// --- Event Listeners ---
function listen(){
  // Search
  $('#searchBtn').addEventListener('click', searchQuotes);
  $('#searchInput').addEventListener('keydown', e=>{if(e.key==='Enter')searchQuotes();});

  // Quote container delegation
  $('#quoteContainer').addEventListener('click', e=>{
    const btn = e.target.closest('button');
    if(!btn) return;
    const id = parseInt(btn.dataset.id);
    if(!id) return;

    if(btn.classList.contains('like-btn')) toggleLike(id);
    else if(btn.classList.contains('edit-btn')) editQuote(id);
    else if(btn.classList.contains('match-btn')) matchQuotes(id);
    else if(btn.classList.contains('save-btn')) saveEdit(id);
    else if(btn.classList.contains('cancel-btn')) cancelEdit(id);
    else if(btn.classList.contains('delete-btn')) deleteQuote(id);
  });

  // Effects
  $('#effectSelect').addEventListener('change', e=>applyEffect(e.target.value));

  // Export
  $('#exportBtn').addEventListener('click', exportCSV);

  // Little Prince
  $('#littlePrinceBtn').addEventListener('click', littlePrince);

  // Scroll buttons
  $('#scrollUp').addEventListener('click',()=>window.scrollTo({top:0,behavior:'smooth'}));
  $('#scrollDown').addEventListener('click',()=>window.scrollTo({top:document.body.scrollHeight,behavior:'smooth'}));
}

init();

})();
