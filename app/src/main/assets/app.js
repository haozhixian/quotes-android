var EFFECTS = [["1","✨","星辰闪烁","Starlight shimmer"],["2","🌠","流星雨","Meteor shower"],["3","💡","萤火虫","Glowing fireflies"],["4","🌌","北极极光","Aurora borealis"],["5","🌸","花瓣雨","Falling petals"],["6","🌐","数字矩阵","Matrix rain"],["7","💫","梦幻光斑","Dreamy bokeh"],["8","✨","万象星河","All combined"]];

(async function(){
var sel = document.getElementById('effectSelect');
EFFECTS.forEach(function(e){var o=document.createElement('option');o.value=e[0];o.textContent=e[1]+' '+e[2]+' '+e[3];sel.appendChild(o)});

var INIT_QUOTES = window.INIT_QUOTES;
var API = window.location.protocol === 'file:' ? null : window.location.origin;

var userQuotes = [];
if(API){
  try{
    var r = await fetch('/api/quotes');
    if(r.ok) userQuotes = await r.json();
  }catch(e){}
}
var saved = JSON.parse(localStorage.getItem('mq_data') || 'null');
var quotes = saved || INIT_QUOTES.concat(userQuotes);
var nextId = parseInt(localStorage.getItem('mq_nextId') || '0');
if(!saved && !nextId) nextId = quotes.length + 1;

quotes.forEach(function(q,i){if(!q._id)q._id='q_'+i});
var maxId = nextId;
quotes.forEach(function(q){var m=parseInt(q._id.replace('q_',''));if(m>=maxId)maxId=m+1});
if(maxId>nextId)nextId=maxId;

function save(){
  localStorage.setItem('mq_data',JSON.stringify(quotes));
  localStorage.setItem('mq_nextId',String(nextId));
}

function exportQuotes(){
  var csv = '\ufeff\u7f16\u53f7,English,\u4e2d\u6587\n';
  for(var i=0;i<quotes.length;i++){
    var en = '"' + quotes[i].en.replace(/"/g,'""') + '"';
    var cn = '"' + quotes[i].cn.replace(/"/g,'""') + '"';
    csv += quotes[i].num + ',' + en + ',' + cn + '\n';
  }
  var fileName = 'all_quotes_' + new Date().toISOString().slice(0,10) + '.csv';
  if(window.AndroidBridge){
    window.AndroidBridge.downloadCSV(csv, fileName);
    return;
  }
  var blob = new Blob([csv], {type:'text/csv;charset=utf-8'});
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = fileName;
  a.click();
}

function escHtml(s){return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}

var likes = JSON.parse(localStorage.getItem('mq_likes') || '{}');
var likeCnt = JSON.parse(localStorage.getItem('mq_likeCnt') || '{}');

var searchTerm = '';
var pageSize = 20;
var currentPage = 1;

// ===== RENDER =====
function render(){
  var c=document.getElementById('cards');

  var filtered = quotes;
  if(searchTerm){
    var st = searchTerm.toLowerCase();
    filtered = quotes.filter(function(q){
      return (q.en && q.en.toLowerCase().indexOf(st) !== -1) ||
             (q.cn && q.cn.toLowerCase().indexOf(st) !== -1);
    });
  }

  var totalPages = Math.ceil(filtered.length / pageSize) || 1;
  if(currentPage > totalPages) currentPage = totalPages;
  var start = (currentPage - 1) * pageSize;
  var pageItems = filtered.slice(start, start + pageSize);

  var html='<div class="add-section" style="margin-bottom:20px">';
  html+='<button id="addToggleBtn" style="width:100%;background:rgba(255,255,255,.05);border:1px dashed rgba(255,255,255,.2);border-radius:20px;color:rgba(255,255,255,.5);font-family:inherit;font-size:.95rem;padding:14px;cursor:pointer;transition:all .3s">+ &#x6DFB;&#x52A0;&#x65B0;&#x7684;&#x52B1;&#x5FD7;&#x8BED;&#x5F55;</button>';
  html+='<div id="addForm" style="display:none;margin-top:16px;background:rgba(255,255,255,.05);backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,.1);border-radius:20px;padding:28px">';
  html+='<h3 style="color:#fff;font-size:1.1rem;margin-bottom:16px;font-weight:400" id="formTitle">&#x65B0;&#x589E;&#x8BED;&#x5F55;</h3>';
  html+='<input id="addEn" placeholder="English quote" style="width:100%;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:10px;padding:10px 14px;color:#fff;font-family:inherit;font-size:.9rem;margin-bottom:10px;outline:none">';
  html+='<textarea id="addCn" placeholder="&#x4E2D;&#x6587;&#x7FFB;&#x8BD1;" style="width:100%;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:10px;padding:10px 14px;color:#fff;font-family:inherit;font-size:.9rem;margin-bottom:12px;outline:none;resize:vertical;min-height:50px"></textarea>';
  html+='<div id="matchList" style="font-size:.8rem;margin-bottom:8px;display:none"></div>';
  html+='<div id="dupWarning" style="font-size:.8rem;color:#ffcc66;margin-bottom:8px;display:none">&#x26A0; &#x8FD9;&#x53E5;&#x8BDD;&#x5DF2;&#x5B58;&#x5728;&#xFF0C;&#x70B9;&#x201C;&#x4FDD;&#x5B58;&#x201D;&#x4F1A;&#x65B0;&#x589E;&#x4E00;&#x6761;&#x91CD;&#x590D;&#x7684;</div>';
  html+='<div style="display:flex;gap:10px">';
  html+='<button id="addSubmit" style="flex:1;background:linear-gradient(135deg,rgba(200,150,255,.3),rgba(150,200,255,.3));border:1px solid rgba(255,255,255,.15);border-radius:10px;color:#fff;font-family:inherit;font-size:.9rem;padding:10px;cursor:pointer;transition:all .3s">&#x4FDD;&#x5B58;</button>';
  html+='<button id="addCancel" style="flex:0 0 auto;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:10px;color:rgba(255,255,255,.5);font-family:inherit;font-size:.9rem;padding:10px 16px;cursor:pointer;transition:all .3s">&#x53D6;&#x6D88;</button>';
  html+='<button id="addReset" style="flex:0 0 auto;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:10px;color:rgba(255,255,255,.5);font-family:inherit;font-size:.9rem;padding:10px 16px;cursor:pointer;transition:all .3s">&#x91CD;&#x7F6E;</button>';
  html+='</div><div id="formStatus" style="font-size:.8rem;margin-top:8px;color:rgba(255,255,255,.5);text-align:center"></div></div></div>';

  if(pageItems.length === 0){
    html += '<div style="text-align:center;padding:60px 20px;color:rgba(255,255,255,.3);font-size:.9rem">' + (searchTerm ? '&#x6CA1;&#x6709;&#x5339;&#x914D;&#x7684;&#x8BED;&#x5F55;' : '&#x6682;&#x65E0;&#x8BED;&#x5F55;') + '</div>';
  } else {
    html += pageItems.map(function(q,i){
      var liked=likes[q._id]?'liked':'';
      return '<div class="quote-card" data-id="'+q._id+'" style="background:rgba(255,255,255,.05);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,.1);border-radius:20px;padding:32px 36px;margin-bottom:24px;transition:all .6s cubic-bezier(.23,1,.32,1);opacity:0;transform:translateY(40px) scale(.97);position:relative;cursor:default">'+
      '<div style="font-size:.8rem;color:rgba(255,255,255,.25);letter-spacing:2px;margin-bottom:12px;display:flex;justify-content:space-between;align-items:center">'+
        '<span>'+q.num+'</span>'+
        '<div style="display:flex;gap:4px">'+
          '<button class="like-btn" data-id="'+q._id+'" style="display:inline-flex;align-items:center;gap:4px;color:'+(liked?'#ff6b8a':'rgba(255,255,255,.25)')+';font-size:.8rem;cursor:pointer;transition:all .3s ease;background:none;border:none;font-family:inherit;padding:3px 8px;border-radius:16px">'+
            '<span>'+(liked?'\u2764':'\u2661')+'</span> <span class="lc">'+(likeCnt[q._id]||0)+'</span>'+
          '</button>'+
          '<button class="edit-btn" data-id="'+q._id+'" style="color:rgba(255,255,255,.25);font-size:.75rem;cursor:pointer;transition:all .3s;background:none;border:none;font-family:inherit;padding:3px 8px;border-radius:16px">&#x270E;</button>'+
          '<button class="del-btn" data-id="'+q._id+'" style="color:rgba(255,255,255,.25);font-size:.75rem;cursor:pointer;transition:all .3s;background:none;border:none;font-family:inherit;padding:3px 8px;border-radius:16px">&#x2716;</button>'+
        '</div>'+
      '</div>'+
      '<div class="quote-en" style="font-size:1.4rem;font-style:italic;color:#f0e6ff;line-height:1.7;margin-bottom:14px">'+q.en+'</div>'+
      '<div class="quote-cn" style="font-size:1.1rem;color:rgba(255,255,255,.6);line-height:1.8;border-top:1px solid rgba(255,255,255,.08);padding-top:14px">'+q.cn+'</div>'+
      '</div>';
    }).join('');
  }

  // Pagination nav
  if(totalPages > 1){
    html += '<div class="pagination" style="display:flex;justify-content:center;align-items:center;gap:6px;padding:20px 0 40px;flex-wrap:wrap">';
    html += '<button class="page-btn" onclick="goToPage(1)" '+(currentPage<=1?'disabled':'')+' style="background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:10px;color:'+(currentPage<=1?'rgba(255,255,255,.2)':'rgba(255,255,255,.6)')+';font-family:inherit;font-size:.75rem;padding:8px 12px;cursor:'+(currentPage<=1?'default':'pointer')+'">&#x300A;&#x300A;</button>';
    html += '<button class="page-btn" onclick="goToPage('+(currentPage-1)+')" '+(currentPage<=1?'disabled':'')+' style="background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:10px;color:'+(currentPage<=1?'rgba(255,255,255,.2)':'rgba(255,255,255,.6)')+';font-family:inherit;font-size:.75rem;padding:8px 12px;cursor:'+(currentPage<=1?'default':'pointer')+'">&#x300A;</button>';
    var pStart = Math.max(1, currentPage - 2);
    var pEnd = Math.min(totalPages, currentPage + 2);
    if(pStart > 1){html += '<span class="page-dot" style="color:rgba(255,255,255,.3);padding:0 4px;font-size:.8rem">...</span>'}
    for(var p=pStart;p<=pEnd;p++){
      html += '<button class="page-btn'+(p===currentPage?' active':'')+'" onclick="goToPage('+p+')" style="background:'+(p===currentPage?'rgba(200,150,255,.25)':'rgba(255,255,255,.04)')+';border:1px solid '+(p===currentPage?'rgba(200,150,255,.4)':'rgba(255,255,255,.08)')+';border-radius:8px;color:'+(p===currentPage?'#fff':'rgba(255,255,255,.5)')+';font-family:inherit;font-size:.75rem;padding:8px 12px;cursor:pointer;min-width:36px;transition:all .2s">'+p+'</button>';
    }
    if(pEnd < totalPages){html += '<span class="page-dot" style="color:rgba(255,255,255,.3);padding:0 4px;font-size:.8rem">...</span><button onclick="goToPage('+totalPages+')" style="background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:8px;color:rgba(255,255,255,.5);font-family:inherit;font-size:.75rem;padding:8px 12px;cursor:pointer;min-width:36px;transition:all .2s">'+totalPages+'</button>'}
    html += '<button class="page-btn" onclick="goToPage('+(currentPage+1)+')" '+(currentPage>=totalPages?'disabled':'')+' style="background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:10px;color:'+(currentPage>=totalPages?'rgba(255,255,255,.2)':'rgba(255,255,255,.6)')+';font-family:inherit;font-size:.75rem;padding:8px 12px;cursor:'+(currentPage>=totalPages?'default':'pointer')+'">&#x300B;</button>';
    html += '<button class="page-btn" onclick="goToPage('+totalPages+')" '+(currentPage>=totalPages?'disabled':'')+' style="background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:10px;color:'+(currentPage>=totalPages?'rgba(255,255,255,.2)':'rgba(255,255,255,.6)')+';font-family:inherit;font-size:.75rem;padding:8px 12px;cursor:'+(currentPage>=totalPages?'default':'pointer')+'">&#x300B;&#x300B;</button>';
    html += '</div>';
  }

  c.innerHTML = html;
  bindUI();
}

function goToPage(p){
  var filtered = searchTerm ? quotes.filter(function(q){var st=searchTerm.toLowerCase();return (q.en&&q.en.toLowerCase().indexOf(st)!==-1)||(q.cn&&q.cn.toLowerCase().indexOf(st)!==-1)}) : quotes;
  var totalPages = Math.ceil(filtered.length / pageSize) || 1;
  if(p<1||p>totalPages) return;
  currentPage = p;
  render();
  window.scrollTo({top:0,behavior:'smooth'});
}

// ===== UI BINDINGS =====
function bindUI(){
  var atb = document.getElementById('addToggleBtn');
  if(atb) atb.addEventListener('click',function(){
    var f=document.getElementById('addForm');
    if(f.style.display==='block'){f.style.display='none';return}
    f.style.display='block';
    document.getElementById('formTitle').textContent='\u65B0\u589E\u8BED\u5F55';
    document.getElementById('addEn').value='';
    document.getElementById('addCn').value='';
    document.getElementById('formStatus').textContent='';
    document.getElementById('matchList').style.display='none';
    document.getElementById('dupWarning').style.display='none';
  });

  var as = document.getElementById('addSubmit');
  if(as) as.addEventListener('click',function(){
    var en = document.getElementById('addEn').value.trim();
    var cn = document.getElementById('addCn').value.trim();
    if(!en||!cn){document.getElementById('formStatus').textContent='\u8BF7\u586B\u5199\u82F1\u6587\u548C\u4E2D\u6587';return}
    var exists = quotes.some(function(q){return q.en===en || (q.cn===cn && cn)});
    if(exists && !confirm('\u8FD9\u53E5\u8BDD\u5DF2\u5B58\u5728\uFF0C\u786E\u5B9A\u8981\u65B0\u589E\u5417\uFF1F')) return;
    var newQ = {_id:'q_'+(nextId++), num:'NO.'+(quotes.length+1), en:en, cn:cn};
    quotes.push(newQ);
    save();
    if(API) fetch('/api/quotes',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(newQ)}).catch(function(){});
    currentPage = Math.ceil(quotes.length / pageSize);
    render();
    document.getElementById('addForm').style.display='none';
  });

  var ac = document.getElementById('addCancel');
  if(ac) ac.addEventListener('click',function(){
    document.getElementById('addForm').style.display='none';
  });

  var ar = document.getElementById('addReset');
  if(ar) ar.addEventListener('click',function(){
    document.getElementById('addEn').value='';
    document.getElementById('addCn').value='';
    document.getElementById('formStatus').textContent='';
    document.getElementById('matchList').style.display='none';
    document.getElementById('dupWarning').style.display='none';
    document.getElementById('formTitle').textContent='\u65B0\u589E\u8BED\u5F55';
  });

  document.querySelectorAll('.edit-btn').forEach(function(b){
    b.addEventListener('click',function(){
      var id = this.dataset.id;
      var q = quotes.find(function(x){return x._id===id});
      if(!q)return;
      var card = this.closest('.quote-card');
      card.innerHTML = '<div class="edit-inline" style="padding:28px;background:rgba(255,255,255,.05);backdrop-filter:blur(20px);border-radius:20px">'+
        '<div style="font-size:.8rem;color:rgba(255,255,255,.25);margin-bottom:12px">'+escHtml(q.num)+' &#x270E; &#x7F16;&#x8F91;</div>'+
        '<input class="edit-en-input" value="'+escHtml(q.en)+'" placeholder="English quote" style="width:100%;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:10px;padding:10px 14px;color:#fff;font-family:inherit;font-size:.9rem;margin-bottom:10px;outline:none">'+
        '<textarea class="edit-cn-input" placeholder="&#x4E2D;&#x6587;&#x7FFB;&#x8BD1;" style="width:100%;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:10px;padding:10px 14px;color:#fff;font-family:inherit;font-size:.9rem;margin-bottom:12px;outline:none;resize:vertical;min-height:50px">'+escHtml(q.cn)+'</textarea>'+
        '<div style="display:flex;gap:10px">'+
        '<button class="save-inline" data-id="'+id+'" style="flex:1;background:linear-gradient(135deg,rgba(200,150,255,.3),rgba(150,200,255,.3));border:1px solid rgba(255,255,255,.15);border-radius:10px;color:#fff;font-family:inherit;font-size:.9rem;padding:10px;cursor:pointer;transition:all .3s">&#x4FDD;&#x5B58;</button>'+
        '<button class="cancel-inline" data-id="'+id+'" style="background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:10px;color:rgba(255,255,255,.5);font-family:inherit;font-size:.9rem;padding:10px 16px;cursor:pointer;transition:all .3s">&#x53D6;&#x6D88;</button>'+
        '</div></div>';
    });
  });
  var cardsEl = document.getElementById('cards');
  cardsEl.addEventListener('click', function(e){
    var btn = e.target.closest('.save-inline');
    if(btn){
      var id = btn.dataset.id;
      var q = quotes.find(function(x){return x._id===id});
      if(!q)return;
      var card = btn.closest('.quote-card');
      var en = card.querySelector('.edit-en-input').value.trim();
      var cn = card.querySelector('.edit-cn-input').value.trim();
      if(!en||!cn) return;
      q.en = en;
      q.cn = cn;
      save();
      render();
      return;
    }
    btn = e.target.closest('.cancel-inline');
    if(btn){
      render();
      return;
    }
  });

  document.querySelectorAll('.del-btn').forEach(function(b){
    b.addEventListener('click',function(){
      if(!confirm('\u786E\u5B9A\u5220\u9664\u8FD9\u6761\u8BED\u5F55\u5417\uFF1F'))return;
      var id = this.dataset.id;
      quotes = quotes.filter(function(q){return q._id!==id});
      quotes.forEach(function(q,i){q.num='NO.'+(i+1)});
      save();
      var filtered = searchTerm ? quotes.filter(function(q){var st=searchTerm.toLowerCase();return (q.en&&q.en.toLowerCase().indexOf(st)!==-1)||(q.cn&&q.cn.toLowerCase().indexOf(st)!==-1)}) : quotes;
      var totalPages = Math.ceil(filtered.length / pageSize) || 1;
      if(currentPage > totalPages) currentPage = totalPages;
      render();
    });
  });

  document.querySelectorAll('.like-btn').forEach(function(b){
    b.addEventListener('click',function(){
      var id = this.dataset.id;
      if(likes[id]){delete likes[id];this.style.color='rgba(255,255,255,.25)';this.querySelector('span').innerHTML='\u2661'}
      else{likes[id]=true;likeCnt[id]=(likeCnt[id]||0)+1;this.style.color='#ff6b8a';this.querySelector('span').innerHTML='\u2764'}
      localStorage.setItem('mq_likes',JSON.stringify(likes));
      localStorage.setItem('mq_likeCnt',JSON.stringify(likeCnt));
      this.querySelector('.lc').textContent=likeCnt[id]||0;
    });
  });

  var addEnInput = document.getElementById('addEn');
  if(addEnInput) addEnInput.addEventListener('input',function(){matchQuotes();});
  var addCnInput = document.getElementById('addCn');
  if(addCnInput) addCnInput.addEventListener('input',function(){matchQuotes();});

  var ml = document.getElementById('matchList');
  if(ml) ml.addEventListener('click',function(e){
    var item = e.target.closest('.match-item');
    if(!item) return;
    var id = item.dataset.id;
    var q = quotes.find(function(x){return x._id===id});
    if(!q) return;
    var idx = quotes.indexOf(q);
    currentPage = Math.floor(idx / pageSize) + 1;
    render();
    setTimeout(function(){
      var card = document.querySelector('.quote-card[data-id="'+id+'"]');
      if(card){
        card.scrollIntoView({behavior:'smooth',block:'center'});
        card.style.transition='none';
        card.style.boxShadow='0 0 40px rgba(200,150,255,.5)';
        setTimeout(function(){card.style.transition='';card.style.boxShadow='';},2000);
      }
    },50);
    document.getElementById('matchList').style.display='none';
  });

  var obs=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting)e.target.classList.add('visible');e.target.style.opacity='1';e.target.style.transform='translateY(0) scale(1)'})},{threshold:.1});
  document.querySelectorAll('.quote-card').forEach(function(el){obs.observe(el)});
}

function matchQuotes(){
  var en = (document.getElementById('addEn').value||'').trim().toLowerCase();
  var cn = (document.getElementById('addCn').value||'').trim().toLowerCase();
  var ml = document.getElementById('matchList');
  if(!en && !cn){ml.style.display='none';return}
  var matches = [];
  for(var i=0;i<quotes.length;i++){
    var q = quotes[i];
    var score = 0;
    if(en && q.en){
      if(q.en.toLowerCase() === en) score += 3;
      else if(q.en.toLowerCase().indexOf(en) !== -1) score += 1;
    }
    if(cn && q.cn){
      if(q.cn.toLowerCase() === cn) score += 2;
      else if(q.cn.toLowerCase().indexOf(cn) !== -1) score += 1;
    }
    if(score > 0) matches.push({q:q, score:score});
  }
  if(matches.length === 0){ml.style.display='none';return}
  matches.sort(function(a,b){return b.score - a.score});
  var show = matches.slice(0, 6);
  var dw = document.getElementById('dupWarning');
  var hasExact = matches.some(function(m){return m.score >= 3});
  if(hasExact){
    dw.style.display='block';
    dw.innerHTML = '\u26A0 \u5B8C\u5168\u5339\u914D\uFF0C\u70B9\u201C\u4FDD\u5B58\u201D\u4F1A\u65B0\u589E\u4E00\u6761\u91CD\u590D\u7684';
  } else {
    dw.style.display='none';
  }
  ml.style.display='block';
  var cnt = matches.length;
  ml.innerHTML = '<div style="font-size:.75rem;color:rgba(255,255,255,.4);margin-bottom:6px;display:flex;justify-content:space-between"><span>\u5339\u914D\u5230 ' + cnt + ' \u6761\u76F8\u4F3C\u8BED\u5F55\uFF1A</span><span style="color:rgba(255,200,100,.4);font-size:.7rem">\u70B9\u51FB\u8DF3\u8F6C</span></div>';
  show.forEach(function(m){
    ml.innerHTML += '<div class="match-item" data-id="'+m.q._id+'" style="padding:5px 10px;margin-bottom:3px;cursor:pointer;border-radius:8px;background:rgba(255,255,255,.04);transition:background .15s;font-size:.78rem;color:rgba(255,255,255,.65);display:flex;align-items:center;gap:8px">'+
      '<span style="color:rgba(255,200,100,.5);flex-shrink:0;font-size:.7rem">'+escHtml(m.q.num)+'</span> '+
      '<span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+escHtml(m.q.en.slice(0,60))+(m.q.en.length>60?'...':'')+'</span></div>';
  });
}

// ===== LITTLE PRINCE =====
var princeMsgs = ['\u613F\u4F60\u4ECA\u5929\u5145\u6EE1\u529B\u91CF \u2728','\u4F60\u6BD4\u60F3\u8C61\u4E2D\u66F4\u52C7\u6562 \u2728','\u575A\u6301\u4E0B\u53BB\uFF0C\u5149\u5728\u524D\u65B9 \u2600\uFE0F','\u4F60\u5C31\u662F\u81EA\u5DF1\u7684\u82F1\u96C4 \uD83E\uDDB8','\u6BCF\u4E00\u5929\u90FD\u662F\u65B0\u7684\u5F00\u59CB \uD83C\uDF05','\u505A\u6700\u771F\u5B9E\u7684\u81EA\u5DF1 \uD83C\uDF38','\u4E16\u754C\u56E0\u4F60\u800C\u7F8E\u597D \uD83C\uDF0D','\u76F8\u4FE1\u81EA\u5DF1\uFF0C\u4F60\u53EF\u4EE5\u7684 \uD83D\uDCAA','\u672A\u6765\u53EF\u671F \uD83D\uDE80','\u4F60\u7684\u5149\u8292\u65E0\u4EBA\u80FD\u6321 \u2728'];
document.getElementById('littlePrince').addEventListener('click',function(){
  var q=quotes[Math.floor(Math.random()*quotes.length)];
  var qIdx = quotes.indexOf(q);
  var targetPage = Math.floor(qIdx / pageSize) + 1;
  if(targetPage !== currentPage){
    currentPage = targetPage;
    render();
  }
  setTimeout(function(){
    var card=document.querySelector('.quote-card[data-id="'+q._id+'"]');
    if(card){
      card.scrollIntoView({behavior:'smooth',block:'center'});
      card.style.transition='none';
      card.style.boxShadow='0 0 50px rgba(200,150,255,.6)';
      setTimeout(function(){card.style.transition='';card.style.boxShadow='';},2000);
    }
  },50);
  var bubble=document.getElementById('princeBubble');
  bubble.textContent=princeMsgs[Math.floor(Math.random()*princeMsgs.length)];
  bubble.style.opacity='1';
  setTimeout(function(){bubble.style.opacity='0';setTimeout(function(){bubble.textContent='\u70B9\u6211\u83B7\u53D6\u6E29\u6696 \u2728'},400)},3000);
});

// ===== CURSOR =====
var dot=document.getElementById('cursorDot'),ring=document.getElementById('cursorRing');
document.addEventListener('mousemove',function(e){
  dot.style.left=e.clientX+'px';dot.style.top=e.clientY+'px';
  ring.style.left=(e.clientX-20)+'px';ring.style.top=(e.clientY-20)+'px';
});

// ===== EFFECTS =====
var curEff=1, effInt=[], effEls=[];

function clearEff(){
  effInt.forEach(function(x){clearInterval(x);clearTimeout(x)});effInt=[];
  document.querySelectorAll('.effects>*:not(.m):not(.st-base)').forEach(function(e){e.remove()});
  document.getElementById('moonEl')&&(document.getElementById('moonEl').style.display='none');
  document.getElementById('auroraO').style.display='none';
  effEls.forEach(function(e){try{e.remove()}catch(_){}});effEls=[];
}

function startEff(n){
  clearEff();curEff=n;
  var fx=document.getElementById('effects');
  var all=n==8;

  if(n==1||all){
    fx.innerHTML='<div class="m" id="moonEl" style="display:block"></div>';
    createStars(300);
  }
  if(n==2||all) shootStars(12);
  if(n==3||all) fireflies(35);
  if(n==4||all){
    document.getElementById('auroraO').style.display='block';
    createStars(150);
  }
  if(n==5||all) fallingPetals(120);
  if(n==6||all) matrixRain(60);
  if(n==7||all) dreamyBokeh(25);
}

function createStars(c){
  var fx=document.getElementById('effects');
  for(var i=0;i<c;i++){
    var s=document.createElement('div');s.className='st';
    s.style.left=Math.random()*100+'%';s.style.top=Math.random()*100+'%';
    s.style.setProperty('--d',(1.5+Math.random()*4)+'s');
    s.style.animationDelay=Math.random()*6+'s';
    var sz=1+Math.random()*2.5;
    s.style.width=sz+'px';s.style.height=sz+'px';
    if(Math.random()>.8){s.style.boxShadow='0 0 4px rgba(255,255,255,.4),0 0 8px rgba(255,255,255,.1)'}
    fx.appendChild(s);
  }
}

function shootStars(c){
  var fx=document.getElementById('effects');
  for(var i=0;i<c;i++){
    var s=document.createElement('div');s.className='ss';
    s.style.left=Math.random()*90+'%';s.style.top=Math.random()*30+'%';
    s.style.animation='shootC '+(2+Math.random()*2)+'s linear '+(Math.random()*8)+'s infinite';
    s.style.boxShadow='0 0 6px rgba(255,255,255,.6),0 0 12px rgba(255,255,255,.2)';
    fx.appendChild(s);
  }
  setInterval(function(){
    if(curEff!=2&&curEff!=8)return;
    var sp=document.createElement('div');sp.className='st';
    sp.style.left=(Math.random()*80+10)+'%';sp.style.top=(Math.random()*25+5)+'%';
    sp.style.width='3px';sp.style.height='3px';
    sp.style.boxShadow='0 0 8px rgba(255,255,200,.8)';
    sp.style.animation='twinkle .6s ease-out forwards';
    sp.style.setProperty('--d','.6s');
    fx.appendChild(sp);
    setTimeout(function(){sp.remove()},600);
  },400);
}

function fireflies(c){
  var fx=document.getElementById('effects');
  for(var i=0;i<c;i++){
    var f=document.createElement('div');f.className='ff';
    f.style.left=Math.random()*100+'%';f.style.top=Math.random()*100+'%';
    f.style.setProperty('--d',(3+Math.random()*6)+'s');
    f.style.setProperty('--x',(Math.random()-0.5)*300+'px');
    f.style.setProperty('--y',(Math.random()-0.5)*300+'px');
    f.style.animationDelay=Math.random()*5+'s';
    var sz=3+Math.random()*5;
    f.style.width=sz+'px';f.style.height=sz+'px';
    f.style.boxShadow='0 0 12px rgba(170,255,170,.6),0 0 24px rgba(100,255,100,.3),0 0 40px rgba(50,255,50,.1)';
    fx.appendChild(f);
  }
}

function fallingPetals(c){
  var fx=document.getElementById('effects');
  for(var i=0;i<c;i++){
    var p=document.createElement('div');p.className='petal';
    p.style.left=Math.random()*100+'%';p.style.top='-10%';
    p.style.setProperty('--sw',(30+Math.random()*60)+'px');
    p.style.setProperty('--d',(6+Math.random()*8)+'s');
    p.style.animationDelay=Math.random()*10+'s';
    var sz=8+Math.random()*14;
    p.style.width=sz+'px';p.style.height=sz*.7+'px';
    p.style.background='hsl('+(330+Math.floor(Math.random()*40))+',80%,'+(70+Math.floor(Math.random()*20))+'%)';
    p.style.borderRadius='50% 0 50% 0';
    p.style.opacity=.5+Math.random()*.4;
    p.style.transform='rotate('+Math.random()*360+'deg)';
    p.style.boxShadow='0 0 10px rgba(255,180,200,.3)';
    fx.appendChild(p);
  }
}

function matrixRain(c){
  var fx=document.getElementById('effects');
  var chars='アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワン0123456789<>/{}[]|_';
  for(var col=0;col<c;col++){
    var d=document.createElement('div');d.className='mr';
    d.style.position='fixed';
    d.style.top='0';
    d.style.left=(col*(100/c))+'%';
    d.style.fontSize=(12+Math.random()*8)+'px';
    d.style.color='hsl('+(100+Math.floor(Math.random()*30))+',80%,'+(50+Math.floor(Math.random()*30))+'%)';
    d.style.textShadow='0 0 8px currentColor';
    d.style.animation='matrixFall '+(2+Math.random()*4)+'s linear '+(Math.random()*5)+'s infinite';
    d.style.zIndex='0';
    d.style.pointerEvents='none';
    d.style.willChange='transform';
    fx.appendChild(d);
    var update=function(){
      if(curEff!=6&&curEff!=8){clearInterval(timer);return}
      var len=5+Math.floor(Math.random()*15);
      var txt='';
      for(var j=0;j<len;j++) txt+=chars[Math.floor(Math.random()*chars.length)];
      txt=txt.slice(0,Math.floor(Math.random()*len)+1);
      d.textContent=txt;
    };
    update();
    var timer=setInterval(update,200+Math.random()*300);
    effInt.push(timer);
  }
}

function dreamyBokeh(c){
  var fx=document.getElementById('effects');
  for(var i=0;i<c;i++){
    var b=document.createElement('div');b.className='bk';
    b.style.position='fixed';
    b.style.left=(Math.random()*90)+'%';
    b.style.top=(Math.random()*90)+'%';
    var sz=40+Math.random()*100;
    b.style.width=sz+'px';b.style.height=sz+'px';
    var hue=Math.floor(Math.random()*360);
    b.style.background='radial-gradient(circle,hsl('+hue+',80%,70%),transparent 70%)';
    b.style.filter='blur(8px)';
    b.style.opacity=.15+Math.random()*.25;
    b.style.animation='bokehFloat '+(8+Math.random()*12)+'s ease-in-out infinite alternate';
    b.style.animationDelay=Math.random()*8+'s';
    b.style.pointerEvents='none';
    b.style.zIndex='0';
    fx.appendChild(b);
  }
}
// ===== EFFECT SELECT =====
document.getElementById('effectSelect').addEventListener('change',function(){
  startEff(parseInt(this.value));
});
// ===== SEARCH =====
function doSearch(){
  var input = document.getElementById('searchInput');
  searchTerm = input.value.trim();
  currentPage = 1;
  render();
  if(searchTerm){
    var cards = document.getElementById('cards');
    if(cards.querySelector('.quote-card')){
      cards.querySelector('.quote-card').scrollIntoView({behavior:'smooth',block:'center'});
    }
  }
}
document.getElementById('searchBtn').addEventListener('click',doSearch);
document.getElementById('searchInput').addEventListener('keydown',function(e){
  if(e.key === 'Enter') doSearch();
});
document.getElementById('searchInput').addEventListener('input',function(){
  searchTerm = this.value.trim();
  currentPage = 1;
  render();
});
startEff(1);

render();
window.goToPage = goToPage;
window.exportQuotes = exportQuotes;
})();
