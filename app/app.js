const D = window.FROMM_DATA;
const order = D.order;           // [{id, num, short}]
const byId = Object.fromEntries(D.chapters.map(c => [c.id, c]));
const esc = s => String(s ?? '').replace(/[&<>"]/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));
const store = {
  get(k, d){ try { const v = localStorage.getItem('fromm:'+k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v){ try { localStorage.setItem('fromm:'+k, JSON.stringify(v)); } catch {} }
};
let read = store.get('read', {});
let qdone = store.get('q', {});

function toc(active){
  const items = [`<li><a href="#overview" class="${active==='overview'?'on':''}"><span class="num">·</span><span class="t">Вся книга</span><span></span></a></li>`];
  order.forEach((o,i) => {
    if (o.id === 'appendix' || o.id === 'ch1') items.push('<li class="sep" aria-hidden="true"></li>');
    items.push(`<li><a href="#${o.id}" class="${active===o.id?'on':''}"><span class="num">${esc(o.num)}</span><span class="t">${esc(o.short)}</span><span class="done">${read[o.id]?'✓':''}</span></a></li>`);
  });
  items.push('<li class="sep" aria-hidden="true"></li>');
  items.push(`<li><a href="#glossary" class="${active==='glossary'?'on':''}"><span class="num">Аа</span><span class="t">Словарь терминов</span><span></span></a></li>`);
  document.getElementById('toc').innerHTML = items.join('');
  const n = order.filter(o => read[o.id]).length;
  document.getElementById('prog-t').textContent = `Прочитано ${n} из ${order.length}`;
  document.getElementById('prog-b').style.width = (100*n/order.length)+'%';
}

function overview(){
  const B = D.book;
  const cards = order.map(o => { const c = byId[o.id]; return c ? `<a class="chcard" href="#${o.id}"><span class="num">${esc(o.num)}</span><b>${esc(c.title)}</b><span>${esc(c.thesis)}</span></a>` : ''; }).join('');
  return `
  <div class="eyebrow">Эрих Фромм · Escape from Freedom · 1941</div>
  <h1>Бегство от свободы</h1>
  <p class="thesis">${esc(B.thesis)}</p>
  <h2>О чём книга</h2>
  ${B.summary.map(p => `<p>${esc(p)}</p>`).join('')}
  <h2>Логика книги</h2>
  <div class="diagram">${B.diagram}</div>
  <h2>Главные идеи <span class="cnt">${B.key_ideas.length}</span></h2>
  <div class="ideas">${B.key_ideas.map((k,i)=>`<div class="idea"><div class="k">${String(i+1).padStart(2,'0')}</div><div><h3>${esc(k.idea)}</h3><p>${esc(k.explain)}</p></div></div>`).join('')}</div>
  <h2>Главы</h2>
  <div class="chmap">${cards}</div>
  <h2>Как читать</h2>
  ${B.how_to_read.map(p => `<p>${esc(p)}</p>`).join('')}`;
}

function chapter(id){
  const c = byId[id], i = order.findIndex(o => o.id === id), o = order[i];
  if (!c) return `<div class="eyebrow">${esc(o.num)}</div><h1>${esc(o.short)}</h1><p>Конспект этой главы ещё готовится.</p>`;
  const prev = order[i-1], next = order[i+1];
  const qs = c.questions.map((q,j) => { const key = id+':'+j; return `<li><label><input type="checkbox" id="q-${id}-${j}" data-q="${key}" ${qdone[key]?'checked':''}><span>${esc(q)}</span></label></li>`; }).join('');
  return `
  <div class="eyebrow">${esc(o.num === '—' ? '' : 'Глава ' + o.num)}</div>
  <h1>${esc(c.title)}</h1>
  ${c.subsections?.length ? `<div class="subs">${c.subsections.map(s=>`<span class="chip">${esc(s)}</span>`).join('')}</div>` : ''}
  <p class="thesis">${esc(c.thesis)}</p>
  <h2>Пересказ</h2>
  ${c.summary.map(p => `<p>${esc(p)}</p>`).join('')}
  <h2>Ключевые идеи <span class="cnt">${c.key_ideas.length}</span></h2>
  <div class="ideas">${c.key_ideas.map((k,j)=>`<div class="idea"><div class="k">${String(j+1).padStart(2,'0')}</div><div><h3>${esc(k.idea)}</h3><p>${esc(k.explain)}</p></div></div>`).join('')}</div>
  ${c.terms?.length ? `<h2>Термины</h2><dl class="terms">${c.terms.map(t=>`<dt>${esc(t.term)}</dt><dd>${esc(t.definition)}</dd>`).join('')}</dl>` : ''}
  ${c.quotes?.length ? `<h2>Цитаты</h2>${c.quotes.map(q=>`<blockquote><q>${esc(q.text)}</q><footer>${esc(q.note)}</footer></blockquote>`).join('')}` : ''}
  ${c.examples?.length ? `<h2>Примеры и фигуры</h2><ul class="plain">${c.examples.map(e=>`<li>${esc(e)}</li>`).join('')}</ul>` : ''}
  ${c.questions?.length ? `<h2>Вопросы для самопроверки</h2><ol class="qs">${qs}</ol>` : ''}
  ${c.connections ? `<h2>Связь с книгой</h2><div class="conn"><b>Контекст.</b> ${esc(c.connections)}</div>` : ''}
  <button type="button" class="mark ${read[id]?'is':''}" id="mark" data-id="${id}">${read[id]?'✓ Глава прочитана':'Отметить главу прочитанной'}</button>
  <div class="pager">${prev?`<a href="#${prev.id}">← ${esc(prev.short)}</a>`:'<a href="#overview">← Вся книга</a>'}${next?`<a href="#${next.id}">${esc(next.short)} →</a>`:'<a href="#glossary">Словарь →</a>'}</div>`;
}

function glossary(){
  const all = [];
  order.forEach(o => (byId[o.id]?.terms || []).forEach(t => all.push({...t, id:o.id, src:o.num==='—'?o.short:'Гл. '+o.num})));
  all.sort((a,b) => a.term.localeCompare(b.term,'ru'));
  return `<div class="eyebrow">Справочник</div><h1>Словарь терминов</h1>
  <p>Все понятия из конспектов глав в алфавитном порядке. Одно понятие может встречаться в нескольких главах с разными оттенками.</p>
  <input class="gl-filter" id="gl-q" type="search" placeholder="Найти термин" aria-label="Найти термин">
  <div id="gl">${all.map(t=>`<div class="gl-item" data-s="${esc((t.term+' '+t.definition).toLowerCase())}"><h3>${esc(t.term)}</h3><div>${esc(t.definition)}</div><div class="src"><a href="#${t.id}">${esc(t.src)}</a></div></div>`).join('')}</div>`;
}

function render(){
  let h = (location.hash || '#overview').slice(1);
  if (!(h === 'overview' || h === 'glossary' || order.some(o => o.id === h))) h = 'overview';
  const v = document.getElementById('view');
  v.innerHTML = h === 'overview' ? overview() : h === 'glossary' ? glossary() : chapter(h);
  toc(h);
  window.scrollTo(0,0);
  store.set('last', h);
}
document.addEventListener('change', e => {
  const k = e.target.dataset?.q; if (!k) return;
  qdone[k] = e.target.checked; store.set('q', qdone);
});
document.addEventListener('click', e => {
  const m = e.target.closest('#mark'); if (!m) return;
  const id = m.dataset.id; read[id] = !read[id]; store.set('read', read);
  m.classList.toggle('is', read[id]); m.textContent = read[id] ? '✓ Глава прочитана' : 'Отметить главу прочитанной';
  toc(id);
});
document.addEventListener('input', e => {
  if (e.target.id !== 'gl-q') return;
  const q = e.target.value.trim().toLowerCase();
  document.querySelectorAll('.gl-item').forEach(el => el.hidden = q && !el.dataset.s.includes(q));
});
document.getElementById('theme').addEventListener('click', () => {
  const r = document.documentElement;
  const dark = r.dataset.theme ? r.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
  r.dataset.theme = dark ? 'light' : 'dark';
});
window.addEventListener('hashchange', render);
if (!location.hash) { const last = store.get('last', null); if (last && last !== 'overview') history.replaceState(null, '', '#'+last); }
render();
