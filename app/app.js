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
const VIZ = window.FROMM_VIZ || {};
const PEOPLE = D.people || [];
const EVENTS = D.events || [];
const CONCEPTS = D.concepts || [];
const VIZ_IN = { overview: ['timeline'], ch2: ['individuation'], ch4: ['timeline'], ch5: ['mechanisms', 'authority'], appendix: ['loop'] };
const PAGES = ['overview', 'glossary', 'visuals', 'pantheon', 'chronicle', 'ideas'];
let pendingTerm = null;

function vizBlock(key, level){
  const v = VIZ[key]; if (!v) return '';
  const H = level || 'h2';
  return `<section class="viz" id="viz-${key}"><${H} class="viz-title">${esc(v.title)} <span class="cnt">схема</span></${H}><p class="viz-lead">${esc(v.lead)}</p><div class="viz-body" data-viz="${key}"></div></section>`;
}
function vizFor(id){ return (VIZ_IN[id] || []).map(k => vizBlock(k)).join(''); }

function toc(active){
  const items = [`<li><a href="#overview" class="${active==='overview'?'on':''}"><span class="num">·</span><span class="t">Вся книга</span><span></span></a></li>`];
  order.forEach((o,i) => {
    if (o.id === 'appendix' || o.id === 'ch1') items.push('<li class="sep" aria-hidden="true"></li>');
    items.push(`<li><a href="#${o.id}" class="${active===o.id?'on':''}"><span class="num">${esc(o.num)}</span><span class="t">${esc(o.short)}</span><span class="done">${read[o.id]?'✓':''}</span></a></li>`);
  });
  items.push('<li class="sep" aria-hidden="true"></li>');
  items.push(`<li><a href="#glossary" class="${active==='glossary'?'on':''}"><span class="num">Аа</span><span class="t">Словарь терминов</span><span></span></a></li>`);
  items.push(`<li><a href="#visuals" class="${active==='visuals'?'on':''}"><span class="num">◇</span><span class="t">Схемы</span><span></span></a></li>`);
  if (PEOPLE.length) items.push(`<li><a href="#pantheon" class="${active==='pantheon'?'on':''}"><span class="num">☰</span><span class="t">Пантеон</span><span></span></a></li>`);
  if (CONCEPTS.length) items.push(`<li><a href="#ideas" class="${active==='ideas'?'on':''}"><span class="num">¶</span><span class="t">Идеи и учения</span><span></span></a></li>`);
  if (EVENTS.length) items.push(`<li><a href="#chronicle" class="${active==='chronicle'?'on':''}"><span class="num">⌛</span><span class="t">Хроника</span><span></span></a></li>`);
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
  ${vizFor('overview')}
  <h2>Главные идеи <span class="cnt">${B.key_ideas.length}</span></h2>
  <div class="ideas">${B.key_ideas.map((k,i)=>`<div class="idea"><div class="k">${String(i+1).padStart(2,'0')}</div><div><h3>${esc(k.idea)}</h3><p>${esc(k.explain)}</p></div></div>`).join('')}</div>
  <h2>Главы</h2>
  <div class="chmap">${cards}</div>
  <h2>Схемы и справочники</h2>
  <div class="chmap">${Object.entries(VIZ).map(([k,v]) => `<a class="chcard" href="#visuals" data-goto="viz-${k}"><span class="num">${esc(v.where)}</span><b>${esc(v.title)}</b></a>`).join('')}${CONCEPTS.length ? `<a class="chcard" href="#ideas"><span class="num">${CONCEPTS.length} концепций</span><b>Идеи и учения</b><span>С какими чужими идеями Фромм спорит и что берёт</span></a>` : ''}${EVENTS.length ? `<a class="chcard" href="#chronicle"><span class="num">${EVENTS.length} событий</span><b>Хроника</b><span>События и эпохи, о которых пишет Фромм</span></a>` : ''}${PEOPLE.length ? `<a class="chcard" href="#pantheon"><span class="num">${PEOPLE.length} записей</span><b>Пантеон</b><span>Все люди, которых упоминает Фромм</span></a>` : ''}</div>
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
  ${vizFor(id)}
  <h2>Ключевые идеи <span class="cnt">${c.key_ideas.length}</span></h2>
  <div class="ideas">${c.key_ideas.map((k,j)=>`<div class="idea"><div class="k">${String(j+1).padStart(2,'0')}</div><div><h3>${esc(k.idea)}</h3><p>${esc(k.explain)}</p></div></div>`).join('')}</div>
  ${c.terms?.length ? `<h2>Термины</h2><dl class="terms">${c.terms.map(t=>`<dt>${esc(t.term)}</dt><dd>${esc(t.definition)}</dd>`).join('')}</dl>` : ''}
  ${c.quotes?.length ? `<h2>Цитаты</h2>${c.quotes.map(q=>`<blockquote><q>${esc(q.text)}</q><footer>${esc(q.note)}</footer></blockquote>`).join('')}` : ''}
  ${peopleIn(id)}
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

function visuals(){
  return `<div class="eyebrow">Наглядно</div><h1>Схемы</h1>
  <p>Интерактивные схемы ключевых идей книги. Они показывают связи между понятиями, а не данные: у Фромма нет измерений.</p>
  <nav class="viz-index">${Object.entries(VIZ).map(([k,v]) => `<a href="#visuals" data-goto="viz-${k}">${esc(v.title)}</a>`).join('')}</nav>
  ${Object.keys(VIZ).map(k => vizBlock(k)).join('')}`;
}

const KIND = { thinker:'Философы', psychology:'Психология и психоанализ', history:'Историки и социологи', religion:'Религия и богословие', politics:'Политика', literature:'Литература', art:'Искусство', science:'Наука', character:'Персонажи' };
const STANCE = { subject:'Предмет анализа', opponent:'Фромм спорит', ally:'Фромм опирается', example:'Пример, цитата', neutral:'Упоминание' };
const chName = id => { const o = order.find(x => x.id === id); return o ? (o.num === '—' ? o.short : 'Гл. ' + o.num) : id; };

function personCard(p, maxM){
  return `<article class="pc" data-origin="${esc(p.origin || 'main')}" data-kind="${esc(p.kind)}" data-stance="${esc(p.stance)}" data-s="${esc((p.name+' '+p.original+' '+p.who+' '+p.role).toLowerCase())}">
    <header><h3>${esc(p.name)}${originChip(p.origin)}</h3><div class="pc-meta">${esc([p.original, p.years].filter(Boolean).join(' · '))}</div></header>
    ${p.who ? `<div class="pc-who">${esc(p.who)}</div>` : ''}
    <div class="pc-tags"><span class="chip">${esc(KIND[p.kind] || p.kind)}</span><span class="chip st-${esc(p.stance)}">${esc(STANCE[p.stance] || p.stance)}</span></div>
    <p class="pc-role">${esc(p.role)}</p>
    ${p.quote ? `<blockquote class="pc-q"><q>${esc(p.quote)}</q></blockquote>` : ''}
    <footer class="pc-foot"><span class="pc-ch">${(p.chapters||[]).map(c => `<a href="#${c}">${esc(chName(c))}</a>`).join(' · ')}</span>
    <span class="pc-m" title="Упоминаний в книге"><i style="width:${Math.max(6, 100*(p.mentions||0)/maxM)}%"></i><b>${p.mentions||0}</b></span></footer>
  </article>`;
}

/* ---- shared time scale with zoom presets ---- */
const ZOOMS = {
  all:    { label: 'Вся история', from: -600, to: 2000, brk: 1100, brkAt: 14, ticks: [1200,1300,1400,1500,1600,1700,1800,1900,2000], grid: [-500,0,500] },
  modern: { label: 'С 1450 года', from: 1450, to: 1970, ticks: [1500,1550,1600,1650,1700,1750,1800,1850,1900,1950] },
  c20:    { label: 'С 1870 года', from: 1870, to: 1970, ticks: [1880,1890,1900,1910,1920,1930,1940,1950,1960,1970] }
};
function scaleOf(z){
  const Z = ZOOMS[z];
  if (!Z.brk) return y => (Math.min(Math.max(y, Z.from), Z.to) - Z.from) / (Z.to - Z.from) * 100;
  return y => y < Z.brk ? (Math.max(y, Z.from) - Z.from) / (Z.brk - Z.from) * Z.brkAt : Z.brkAt + (Math.min(y, Z.to) - Z.brk) / (Z.to - Z.brk) * (100 - Z.brkAt);
}
function zoomBar(id, cur){
  return `<div class="seg tx-zoom" role="group" aria-label="Масштаб шкалы">${Object.entries(ZOOMS).map(([k,v]) => `<button type="button" class="vbtn" data-zoom="${k}" data-tl="${id}" aria-pressed="${k === cur}">${esc(v.label)}</button>`).join('')}</div>`;
}
function tlAxis(z){
  const Z = ZOOMS[z], x = scaleOf(z);
  return `<div class="tx-axis" aria-hidden="true">${Z.brk ? `<div class="tx-zone" style="width:${Z.brkAt}%"><span>до ${Z.brk}, сжато</span></div>` : ''}${Z.ticks.map(y => `<span class="tx-tick" style="left:${x(y)}%">${y}</span>`).join('')}</div>`;
}
function tlGrid(z){
  const Z = ZOOMS[z], x = scaleOf(z);
  return `<div class="tx-grid" aria-hidden="true">${Z.brk ? `<div class="tx-zone" style="width:${Z.brkAt}%"></div>` : ''}${[...(Z.grid || []), ...Z.ticks].filter(y => y < Z.to).map(y => `<i style="left:${x(y)}%"></i>`).join('')}<b class="tx-1941" style="left:${x(1941)}%"><span>1941 · книга</span></b><b class="tx-1941 tx-p2" style="left:${x(1965)}%"><span>ок. 1965 · предисловие II</span></b></div>`;
}
/* rows: [{from, to, html(barStyle) }] ; returns the inside of .tx-wrap */
function tlInner(rows, z){
  const Z = ZOOMS[z], x = scaleOf(z);
  const vis = rows.filter(r => r.to >= Z.from && r.from <= Z.to);
  const hidden = rows.length - vis.length;
  return `${tlAxis(z)}<div class="tx-body">${tlGrid(z)}${vis.map(r => r.html(`left:${x(r.from)}%;width:${r.point ? 0 : Math.max(0.6, x(r.to) - x(r.from))}%`, r.from < Z.from)).join('')}</div>${tlAxis(z)}
    ${hidden ? `<p class="viz-note tx-hidden">Вне выбранного периода: ${hidden}. Переключите масштаб на «Вся история», чтобы увидеть всё.</p>` : ''}`;
}
const TL = {};   // id -> {rows, zoom}
function tlBlock(id, rows, zoom){
  TL[id] = { rows, zoom };
  return `${zoomBar(id, zoom)}<div class="tx-wrap" data-tlw="${id}">${tlInner(rows, zoom)}</div>`;
}
function tlZoom(id, z){
  const T = TL[id]; if (!T) return; T.zoom = z;
  const w = document.querySelector(`[data-tlw="${id}"]`); if (w) w.innerHTML = tlInner(T.rows, z);
  document.querySelectorAll(`[data-zoom][data-tl="${id}"]`).forEach(b => b.setAttribute('aria-pressed', b.dataset.zoom === z));
  if (id === 'events') chApply();
}
function parseYears(s){
  if (!s) return null;
  const parts = String(s).split(/\s*[–—-]\s*/);
  if (parts.length < 2) return null;
  const bc = parts.map(x => /до\s*н\.?\s*э/.test(x));
  const num = parts.map(x => { const m = x.match(/\d+/); return m ? +m[0] : NaN; });
  if (num.some(isNaN)) return null;
  if (bc[1] && !bc[0] && num[0] > num[1]) bc[0] = true;   // "470–399 до н. э."
  const from = bc[0] ? -num[0] : num[0], to = bc[1] ? -num[1] : num[1];
  return { from, to, approx: /ок\./.test(s) };
}
const ORIGIN = { preface1: { mark: 'П¹', label: 'только в предисловии 1941 года' }, preface2: { mark: 'П²', label: 'только в предисловии 1960-х' } };
const originMark = o => ORIGIN[o] ? `<i class="p-dot ${o}" title="Упомянут ${ORIGIN[o].label}">${ORIGIN[o].mark}</i> ` : '';
const originChip = o => ORIGIN[o] ? ` <span class="chip p-chip ${o}">${ORIGIN[o].label}</span>` : '';
let hidePref = store.get('hidePref', false);
function prefToggle(n){
  if (!n) return '';
  return `<label class="pref-toggle" for="pref-hide"><input type="checkbox" id="pref-hide" ${hidePref ? 'checked' : ''}> Скрыть упомянутое только в предисловиях (${n}) <span class="pref-key">${originMark('preface1')}1941 · ${originMark('preface2')}1960-е</span></label>`;
}
const STANCE_CLASS = { subject:'s-subject', opponent:'s-opp', ally:'s-ally', example:'s-ex', neutral:'s-neu' };

function lifespans(){
  const rows = PEOPLE.filter(p => p.kind !== 'character').map(p => ({ p, y: parseYears(p.years) })).filter(r => r.y).sort((a,b) => a.y.from - b.y.from);
  const missing = PEOPLE.filter(p => p.kind !== 'character' && !parseYears(p.years)).length;
  return `<h2>Кто когда жил <span class="cnt">${rows.length}</span></h2>
  <p class="tx-lead">Годы жизни людей, которых упоминает Фромм. В масштабе «Вся история» время до 1100 года сжато, иначе Сократ и Будда растянули бы шкалу. Цвет показывает отношение Фромма. Сплошная линия — 1941 год, когда вышла книга, пунктир — второе предисловие (около 1965 года). Значки П¹ и П² отмечают тех, кто упомянут только в одном из предисловий. Нажмите на имя, чтобы открыть карточку.</p>
  <div class="tx-legend">${Object.entries(STANCE).filter(([k]) => rows.some(r => r.p.stance === k)).map(([k,v]) => `<span><i class="${STANCE_CLASS[k]}"></i>${esc(v)}</span>`).join('')}<span><i class="approx"></i>даты приблизительны</span></div>
  ${tlBlock('people', rows.map(({p,y}) => ({ from: y.from, to: y.to, html: (st, cut) => `<button type="button" class="tx-row" data-origin="${esc(p.origin || 'main')}" data-pick="${esc(p.name)}" title="${esc(p.name + ' · ' + p.years + (p.who ? ' · ' + p.who : ''))}">
      <span class="tx-name">${originMark(p.origin)}${esc(p.name)} <em>${esc(p.years)}</em></span>
      <span class="tx-track"><span class="tx-bar ${STANCE_CLASS[p.stance] || 's-neu'} ${y.approx ? 'approx' : ''} ${cut ? 'cut' : ''}" style="${st}"></span></span>
    </button>` })), 'all')}
  ${missing ? `<p class="viz-note">Ещё ${missing} человек без надёжных дат на шкалу не попали.</p>` : ''}`;
}

const EKIND = { era:'Эпохи и процессы', economy:'Экономика', war:'Войны', politics:'Политика', religion:'Религия', culture:'Культура' };
const EKIND_CLASS = { era:'k-era', economy:'k-eco', war:'k-war', politics:'k-pol', religion:'k-rel', culture:'k-cul' };
const chState = { kind: '' };
const DOMAIN = { philosophy:'Философия', theology:'Богословие', psychology:'Психология и психоанализ', society:'Общество и история' };
const CSTANCE = { accepts:'Принимает', reinterprets:'Переосмысляет', analyzes:'Разбирает как симптом', rejects:'Отвергает' };
const CSTANCE_CLASS = { accepts:'cs-acc', reinterprets:'cs-re', analyzes:'cs-an', rejects:'cs-rej' };
const idState = { stance: '', domain: '' };

function ideas(){
  const domains = Object.keys(DOMAIN).filter(d => CONCEPTS.some(c => c.domain === d));
  const stances = Object.keys(CSTANCE).filter(s => CONCEPTS.some(c => c.stance === s));
  const names = new Set(PEOPLE.map(p => p.name));
  const terms = new Set(D.chapters.flatMap(c => (c.terms || []).map(t => t.term.toLowerCase())));
  const matrix = `<div class="id-matrix" role="table" aria-label="Концепции по областям и позиции Фромма">
    <div class="idm-row idm-head" role="row"><span role="columnheader"></span>${stances.map(s => `<span role="columnheader" class="${CSTANCE_CLASS[s]}-t">${esc(CSTANCE[s])}</span>`).join('')}</div>
    ${domains.map(d => `<div class="idm-row" role="row"><span role="rowheader">${esc(DOMAIN[d])}</span>${stances.map(s => { const n = CONCEPTS.filter(c => c.domain === d && c.stance === s).length; return `<button type="button" class="idm-cell ${n ? CSTANCE_CLASS[s] : ''}" data-cell="${d}|${s}" style="--n:${n}" ${n ? '' : 'disabled'} aria-label="${esc(DOMAIN[d] + ', ' + CSTANCE[s] + ': ' + n)}">${n || '·'}</button>`; }).join('')}</div>`).join('')}
  </div>`;
  const card = c => `<article class="idc" data-origin="${esc(c.origin || 'main')}" data-domain="${esc(c.domain)}" data-stance="${esc(c.stance)}">
    <header><h3>${esc(c.name)}${originChip(c.origin)}</h3><span class="chip ${CSTANCE_CLASS[c.stance] || ''}">${esc(CSTANCE[c.stance] || c.stance)}</span></header>
    <div class="pc-who">${esc(c.source)}</div>
    <p class="idc-idea">${esc(c.idea)}</p>
    <p class="ev-role"><b>Фромм.</b> ${esc(c.fromm)}</p>
    ${c.quote ? `<blockquote class="pc-q"><q>${esc(c.quote)}</q></blockquote>` : ''}
    <div class="ev-foot">${(c.chapters||[]).map(x => `<a href="#${x}">${esc(chName(x))}</a>`).join(' · ')}
      ${(c.people||[]).length ? `<span class="ev-ppl">${c.people.map(n => names.has(n) ? `<a class="chip" href="#pantheon" data-person="${esc(n)}">${esc(n)}</a>` : `<span class="chip">${esc(n)}</span>`).join('')}</span>` : ''}
      ${(c.related||[]).length ? `<span class="ev-ppl idc-rel">→ ${c.related.map(r => terms.has(r.toLowerCase()) ? `<a class="chip" href="#glossary" data-term="${esc(r)}">${esc(r)}</a>` : `<span class="chip">${esc(r)}</span>`).join('')}</span>` : ''}
    </div>
  </article>`;
  return `<div class="eyebrow">Справочник</div><h1>Идеи и учения</h1>
  <p>Чужие концепции, с которыми работает Фромм: ${CONCEPTS.length}. Его собственные понятия собраны в <a href="#glossary">словаре</a>. Суть каждой концепции изложена кратко, а позиция Фромма взята из текста книги.</p>
  ${prefToggle(CONCEPTS.filter(c => c.origin && c.origin !== 'main').length)}
  <h2>Карта позиций</h2>
  <p class="tx-lead">Строки — области, столбцы — как Фромм обходится с идеей. Нажмите на клетку, чтобы оставить только эти концепции.</p>
  ${matrix}
  <div class="pt-chips id-filters" role="group" aria-label="Позиция Фромма"><button type="button" class="vbtn" data-is="" aria-pressed="true">Все</button>${stances.map(s => `<button type="button" class="vbtn" data-is="${s}" aria-pressed="false">${esc(CSTANCE[s])}</button>`).join('')}</div>
  <p class="pt-count" id="id-count"></p>
  ${domains.map(d => `<section class="id-group" data-group="${d}"><h2>${esc(DOMAIN[d])} <span class="cnt">${CONCEPTS.filter(c => c.domain === d).length}</span></h2><div class="idc-list">${CONCEPTS.filter(c => c.domain === d).map(card).join('')}</div></section>`).join('')}`;
}
function idApply(){
  let n = 0;
  document.querySelectorAll('.idc').forEach(el => { const ok = (!idState.stance || el.dataset.stance === idState.stance) && (!idState.domain || el.dataset.domain === idState.domain); el.hidden = !ok; if (ok) n++; });
  document.querySelectorAll('.id-group').forEach(g => g.hidden = ![...g.querySelectorAll('.idc')].some(x => !x.hidden));
  document.querySelectorAll('.idm-cell').forEach(c => c.setAttribute('aria-pressed', c.dataset.cell === idState.domain + '|' + idState.stance));
  document.querySelectorAll('[data-is]').forEach(b => b.setAttribute('aria-pressed', b.dataset.is === idState.stance && !idState.domain));
  const el = document.getElementById('id-count'); if (el) el.textContent = n === CONCEPTS.length ? '' : `Показано ${n} из ${CONCEPTS.length}`;
}

function chronicle(){
  const ev = EVENTS.slice().sort((a,b) => a.start - b.start || a.end - b.end);
  const kinds = Object.keys(EKIND).filter(k => ev.some(e => e.kind === k));
  const names = new Set(PEOPLE.map(p => p.name));
  return `<div class="eyebrow">Справочник</div><h1>Хроника</h1>
  <p>События, эпохи и процессы, о которых говорит Фромм: ${ev.length}. Что Фромм о них пишет, взято из текста книги. Даты и строка «что это» — общие сведения.</p>
  <p class="tx-lead">Книга вышла в 1941 году. Примерно через четверть века Фромм написал к ней второе предисловие и упомянул там события, которых в основном тексте быть не могло: от ядерной гонки до Карибского кризиса. Всё, что встречается только в одном из предисловий, помечено.</p>
  ${prefToggle(ev.filter(e => e.origin && e.origin !== 'main').length)}
  <div class="pt-chips" role="group" aria-label="Тип события"><button type="button" class="vbtn" data-ek="" aria-pressed="true">Все</button>${kinds.map(k => `<button type="button" class="vbtn" data-ek="${k}" aria-pressed="false">${esc(EKIND[k])}</button>`).join('')}</div>
  <h2>На шкале времени</h2>
  <div class="tx-legend">${kinds.map(k => `<span><i class="${EKIND_CLASS[k]}"></i>${esc(EKIND[k])}</span>`).join('')}<span><i class="approx"></i>условные даты</span></div>
  ${tlBlock('events', ev.map((e,i) => ({ from: e.start, to: e.end, point: e.end === e.start, html: (st, cut) => ` <a class="tx-row ev-row" href="#chronicle" data-origin="${esc(e.origin || 'main')}" data-ev="${i}" data-kind="${esc(e.kind)}" title="${esc(e.name + ' · ' + e.when)}">
      <span class="tx-name">${originMark(e.origin)}${esc(e.name)} <em>${esc(e.when)}</em></span>
      <span class="tx-track"><span class="tx-bar ${EKIND_CLASS[e.kind] || 'k-era'} ${e.approx ? 'approx' : ''} ${e.end === e.start ? 'point' : ''} ${cut ? 'cut' : ''}" style="${st}"></span></span>
    </a>` })), 'modern')}
  <h2>Все события</h2>
  <div class="ev-list">${ev.map((e,i) => `<article class="ev" id="ev-${i}" data-origin="${esc(e.origin || 'main')}" data-kind="${esc(e.kind)}">
    <div class="ev-when ${EKIND_CLASS[e.kind] || ''}-t">${esc(e.when)}</div>
    <div class="ev-main">
      <h3>${esc(e.name)}${originChip(e.origin)}</h3>
      <div class="pc-meta">${esc([EKIND[e.kind], e.where].filter(Boolean).join(' · '))}</div>
      ${e.what ? `<p class="ev-what">${esc(e.what)}</p>` : ''}
      <p class="ev-role"><b>У Фромма.</b> ${esc(e.role)}</p>
      ${e.quote ? `<blockquote class="pc-q"><q>${esc(e.quote)}</q></blockquote>` : ''}
      <div class="ev-foot">${(e.chapters||[]).map(c => `<a href="#${c}">${esc(chName(c))}</a>`).join(' · ')}${(e.people||[]).length ? `<span class="ev-ppl">${e.people.map(n => names.has(n) ? `<a class="chip" href="#pantheon" data-person="${esc(n)}">${esc(n)}</a>` : `<span class="chip">${esc(n)}</span>`).join('')}</span>` : ''}</div>
    </div>
  </article>`).join('')}</div>`;
}
function chApply(){
  document.querySelectorAll('.ev-row,.ev').forEach(el => el.hidden = chState.kind && el.dataset.kind !== chState.kind);
}

function pantheon(){
  const maxM = Math.max(1, ...PEOPLE.map(p => p.mentions || 0));
  const kinds = [...new Set(PEOPLE.map(p => p.kind))].sort((a,b) => Object.keys(KIND).indexOf(a) - Object.keys(KIND).indexOf(b));
  const top = PEOPLE.filter(p => p.kind !== 'character').sort((a,b) => (b.mentions||0) - (a.mentions||0)).slice(0, 8);
  return `<div class="eyebrow">Справочник</div><h1>Пантеон</h1>
  <p>Все люди, которых упоминает Фромм: ${PEOPLE.filter(p => p.kind !== 'character').length} реальных людей и ${PEOPLE.filter(p => p.kind === 'character').length} персонажей. Роль каждого в книге описана по тексту, а годы жизни и «кто это» — общие сведения.</p>
  ${prefToggle(PEOPLE.filter(p => p.origin && p.origin !== 'main').length)}
  <h2>Чаще всего</h2>
  <div class="pt-top">${top.map(p => `<div class="pt-row"><span class="pt-n">${esc(p.name)}</span><span class="pt-bar"><i style="width:${100*(p.mentions||0)/maxM}%"></i></span><span class="pt-c">${p.mentions||0}</span></div>`).join('')}</div>
  ${lifespans()}
  <h2 id="pt-all">Все имена</h2>
  <div class="pt-filters">
    <input class="gl-filter" id="pt-q" type="search" placeholder="Найти имя или тему" aria-label="Найти имя или тему">
    <div class="pt-chips" role="group" aria-label="Область"><button type="button" class="vbtn" data-pk="" aria-pressed="true">Все</button>${kinds.map(k => `<button type="button" class="vbtn" data-pk="${esc(k)}" aria-pressed="false">${esc(KIND[k] || k)}</button>`).join('')}</div>
    <div class="pt-chips" role="group" aria-label="Отношение Фромма"><button type="button" class="vbtn" data-ps="" aria-pressed="true">Любое отношение</button>${Object.entries(STANCE).filter(([k]) => PEOPLE.some(p => p.stance === k)).map(([k,v]) => `<button type="button" class="vbtn" data-ps="${k}" aria-pressed="false">${esc(v)}</button>`).join('')}</div>
    <label class="pt-sort" for="pt-sort">Порядок <select id="pt-sort"><option value="m">по упоминаниям</option><option value="a">по алфавиту</option></select></label>
  </div>
  <p class="pt-count" id="pt-count"></p>
  <div class="pt-grid" id="pt-grid">${PEOPLE.map(p => personCard(p, maxM)).join('')}</div>`;
}

function peopleIn(id){
  const ps = PEOPLE.filter(p => (p.chapters||[]).includes(id) && p.kind !== 'character').sort((a,b) => (b.mentions||0) - (a.mentions||0));
  if (!ps.length) return '';
  return `<h2>Люди в главе <span class="cnt">${ps.length}</span></h2><div class="ppl">${ps.map(p => `<a href="#pantheon" data-person="${esc(p.name)}" class="chip" title="${esc(p.who)}">${originMark(p.origin)}${esc(p.name)}</a>`).join('')}</div>`;
}

const ptState = { kind: '', stance: '', q: '', sort: 'm' };
function ptApply(){
  const grid = document.getElementById('pt-grid'); if (!grid) return;
  const cards = [...grid.children];
  cards.sort((a,b) => {
    if (ptState.sort === 'a') return a.querySelector('h3').textContent.localeCompare(b.querySelector('h3').textContent, 'ru');
    return (+b.querySelector('.pc-m').textContent) - (+a.querySelector('.pc-m').textContent);
  }).forEach(c => grid.appendChild(c));
  let n = 0;
  cards.forEach(c => {
    const ok = (!ptState.kind || c.dataset.kind === ptState.kind) && (!ptState.stance || c.dataset.stance === ptState.stance) && (!ptState.q || c.dataset.s.includes(ptState.q));
    c.hidden = !ok; if (ok) n++;
  });
  document.getElementById('pt-count').textContent = n === cards.length ? '' : `Показано ${n} из ${cards.length}`;
}

function render(){
  let h = (location.hash || '#overview').slice(1);
  if (!(PAGES.includes(h) || order.some(o => o.id === h))) h = 'overview';
  if (h === 'pantheon' && !PEOPLE.length) h = 'overview';
  const v = document.getElementById('view');
  if (h === 'chronicle' && !EVENTS.length) h = 'overview';
  if (h === 'ideas' && !CONCEPTS.length) h = 'overview';
  v.innerHTML = h === 'overview' ? overview() : h === 'glossary' ? glossary() : h === 'visuals' ? visuals() : h === 'pantheon' ? pantheon() : h === 'chronicle' ? chronicle() : h === 'ideas' ? ideas() : chapter(h);
  v.classList.toggle('hide-pref', hidePref);
  v.querySelectorAll('[data-viz]').forEach(el => { try { VIZ[el.dataset.viz]?.mount(el); } catch (err) { console.error(err); } });
  toc(h);
  window.scrollTo(0,0);
  store.set('last', h);
  if (h === 'glossary' && pendingTerm) { const q = document.getElementById('gl-q'); q.value = pendingTerm; q.dispatchEvent(new Event('input', { bubbles: true })); }
  if (h === 'chronicle') { chState.kind = ''; }
  if (h === 'ideas') { idState.stance = ''; idState.domain = ''; idApply(); }
  if (h === 'pantheon') { Object.assign(ptState, { kind: '', stance: '', q: '', sort: 'm' }); if (pendingTerm) { const q = document.getElementById('pt-q'); q.value = pendingTerm; ptState.q = pendingTerm.toLowerCase(); } ptApply(); }
  if (pendingGoto) { const t = document.getElementById(pendingGoto); if (t) t.scrollIntoView(); }
  pendingTerm = null; pendingGoto = null;
}
let pendingGoto = null;
document.addEventListener('change', e => {
  if (e.target.id === 'pref-hide') { hidePref = e.target.checked; store.set('hidePref', hidePref); document.getElementById('view').classList.toggle('hide-pref', hidePref); return; }
  if (e.target.id === 'pt-sort') { ptState.sort = e.target.value; ptApply(); return; }
  const k = e.target.dataset?.q; if (!k) return;
  qdone[k] = e.target.checked; store.set('q', qdone);
});
document.addEventListener('click', e => {
  const term = e.target.closest('[data-term],[data-person]');
  if (term) pendingTerm = term.dataset.term || term.dataset.person;
  const go = e.target.closest('[data-goto]');
  if (go) {
    pendingGoto = go.dataset.goto;
    if (location.hash === '#visuals') { e.preventDefault(); const t = document.getElementById(pendingGoto); if (t) t.scrollIntoView({ behavior: 'smooth' }); pendingGoto = null; }
  }
  const evr = e.target.closest('[data-ev]');
  if (evr) { e.preventDefault(); const t = document.getElementById('ev-' + evr.dataset.ev); if (t) { t.scrollIntoView({ behavior: 'smooth', block: 'center' }); t.classList.remove('flash'); void t.offsetWidth; t.classList.add('flash'); } }
  const zb = e.target.closest('[data-zoom]');
  if (zb) tlZoom(zb.dataset.tl, zb.dataset.zoom);
  const cell = e.target.closest('[data-cell]');
  if (cell) { const [d, s] = cell.dataset.cell.split('|'); const same = idState.domain === d && idState.stance === s; idState.domain = same ? '' : d; idState.stance = same ? '' : s; idApply(); }
  const is = e.target.closest('[data-is]');
  if (is) { idState.stance = is.dataset.is; idState.domain = ''; idApply(); }
  const ek = e.target.closest('[data-ek]');
  if (ek) { chState.kind = ek.dataset.ek; ek.parentElement.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', b === ek)); chApply(); }
  const pick = e.target.closest('[data-pick]');
  if (pick) {
    const q = document.getElementById('pt-q');
    if (q) { q.value = pick.dataset.pick; ptState.q = pick.dataset.pick.toLowerCase(); ptApply(); document.getElementById('pt-all').scrollIntoView({ behavior: 'smooth' }); }
  }
  const pk = e.target.closest('[data-pk],[data-ps]');
  if (pk) {
    const attr = pk.dataset.pk !== undefined ? 'pk' : 'ps';
    ptState[attr === 'pk' ? 'kind' : 'stance'] = pk.dataset[attr];
    pk.parentElement.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', b === pk));
    ptApply();
  }
  const m = e.target.closest('#mark'); if (!m) return;
  const id = m.dataset.id; read[id] = !read[id]; store.set('read', read);
  m.classList.toggle('is', read[id]); m.textContent = read[id] ? '✓ Глава прочитана' : 'Отметить главу прочитанной';
  toc(id);
});
document.addEventListener('input', e => {
  if (e.target.id === 'pt-q') { ptState.q = e.target.value.trim().toLowerCase(); ptApply(); return; }
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
