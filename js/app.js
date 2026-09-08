/* ═══════════════════════════════════════════════════════════════
   APP CORE

   Tardigrade principle (anhydrobiosis, Boothby et al. 2017):
   the app keeps its entire state on-device and stays fully
   functional when the network vanishes. Nothing it needs to
   work lives on a server.
   ═══════════════════════════════════════════════════════════════ */
'use strict';

const $  = (s,r=document)=>r.querySelector(s);
const $$ = (s,r=document)=>[...r.querySelectorAll(s)];
const uid = ()=>Math.random().toString(36).slice(2,10);

/* ── field schemas: the one small vocabulary ─────────────── */
const PERSONAL_FIELDS = [
  {k:'fullName', l:'f_fullName', full:true},
  {k:'jobTitle', l:'f_jobTitle', full:true},
  {k:'email',    l:'f_email',   type:'email'},
  {k:'phone',    l:'f_phone',   type:'tel'},
  {k:'address',  l:'f_address'},
  {k:'city',     l:'f_city'},
  {k:'country',  l:'f_country'},
  {k:'linkedin', l:'f_linkedin'},
  {k:'website',  l:'f_website'},
  {k:'dob',      l:'f_dob'},
  {k:'nationality', l:'f_nationality'},
  {k:'maritalStatus', l:'f_maritalStatus', type:'select',
    opts:[['','—'],['single','ms_single'],['married','ms_married'],['other','ms_other']]},
  {k:'gender', l:'f_gender', type:'select',
    opts:[['','—'],['male','g_male'],['female','g_female'],['na','g_na']]}
];

const SCHEMA = {
  experience: [
    {k:'position',l:'f_position',full:true},{k:'company',l:'f_company'},{k:'location',l:'f_location'},
    {k:'start',l:'f_start'},{k:'end',l:'f_end'},
    {k:'current',l:'f_current',type:'check',full:true},
    {k:'desc',l:'f_desc',type:'textarea',full:true,ph:'ph_desc'}
  ],
  education: [
    {k:'degree',l:'f_degree',full:true},{k:'school',l:'f_school'},{k:'location',l:'f_location'},
    {k:'start',l:'f_start'},{k:'end',l:'f_end'},{k:'grade',l:'f_grade'},
    {k:'current',l:'f_currently_study',type:'check',full:true},
    {k:'desc',l:'f_desc',type:'textarea',full:true}
  ],
  skills:       [{k:'name',l:'f_skill',full:true},{k:'level',l:'f_level',type:'level',full:true}],
  languages:    [{k:'name',l:'f_language'},{k:'level',l:'f_lang_level',type:'select',
                   opts:[['native','lvl_native'],['fluent','lvl_fluent'],['advanced','lvl_advanced'],
                         ['intermediate','lvl_inter'],['basic','lvl_basic']]}],
  projects:     [{k:'name',l:'f_project',full:true},{k:'role',l:'f_role'},{k:'date',l:'f_date'},
                 {k:'link',l:'f_link',full:true},{k:'desc',l:'f_desc',type:'textarea',full:true}],
  certifications:[{k:'name',l:'f_cert',full:true},{k:'issuer',l:'f_issuer'},{k:'date',l:'f_date'},
                 {k:'credId',l:'f_credId',full:true}],
  awards:       [{k:'name',l:'f_award',full:true},{k:'issuer',l:'f_issuer'},{k:'date',l:'f_date'},
                 {k:'desc',l:'f_desc',type:'textarea',full:true}],
  volunteer:    [{k:'role',l:'f_role',full:true},{k:'org',l:'f_org'},{k:'location',l:'f_location'},
                 {k:'start',l:'f_start'},{k:'end',l:'f_end'},{k:'current',l:'f_current',type:'check',full:true},
                 {k:'desc',l:'f_desc',type:'textarea',full:true}],
  publications: [{k:'name',l:'f_publication',full:true},{k:'issuer',l:'f_issuer'},{k:'date',l:'f_date'},
                 {k:'desc',l:'f_desc',type:'textarea',full:true}],
  references:   [{k:'name',l:'f_refName',full:true},{k:'position',l:'f_position'},{k:'company',l:'f_company'},
                 {k:'email',l:'f_email'},{k:'phone',l:'f_phone'}],
  interests:    [{k:'name',l:'f_interest',full:true}],
  custom:       [{k:'title',l:'f_title',full:true},{k:'subtitle',l:'f_subtitle'},{k:'date',l:'f_date'},
                 {k:'desc',l:'f_desc',type:'textarea',full:true}]
};
const SEC_ICON = {
  experience:'M4 7.5h16v12H4z M9 7.5V5.5h6v2 M4 12.5h16',
  education:'M12 4l9 4.5-9 4.5-9-4.5L12 4z M6.5 10.8V16c0 1.6 2.5 3 5.5 3s5.5-1.4 5.5-3v-5.2',
  skills:'M12 3l2.4 5.6 6.1.5-4.6 4 1.4 6-5.3-3.2L6.7 19l1.4-6-4.6-4 6.1-.5L12 3z',
  languages:'M12 3.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17z M3.5 12h17 M12 3.5c2.2 2.4 3.4 5.3 3.4 8.5s-1.2 6.1-3.4 8.5c-2.2-2.4-3.4-5.3-3.4-8.5S9.8 5.9 12 3.5z',
  projects:'M4 7.5h6l1.6 2H20v10H4z M4 7.5V5h5v2.5',
  certifications:'M12 3.5l6.5 3v5c0 4-2.7 7.4-6.5 9-3.8-1.6-6.5-5-6.5-9v-5l6.5-3z M9.3 12l2 2 3.4-3.6',
  awards:'M12 3.5a4.8 4.8 0 1 0 0 9.6 4.8 4.8 0 0 0 0-9.6z M8.6 12.4L7 20.5l5-2.6 5 2.6-1.6-8.1',
  references:'M12 3.5a3.6 3.6 0 1 0 0 7.2 3.6 3.6 0 0 0 0-7.2z M4.5 20.5c.6-4 3.7-6 7.5-6s6.9 2 7.5 6',
  interests:'M12 20.5S3.8 15 3.8 9.6A4.3 4.3 0 0 1 12 7.4a4.3 4.3 0 0 1 8.2 2.2c0 5.4-8.2 10.9-8.2 10.9z',
  volunteer:'M12 20.5S3.8 15 3.8 9.6A4.3 4.3 0 0 1 12 7.4a4.3 4.3 0 0 1 8.2 2.2c0 5.4-8.2 10.9-8.2 10.9z',
  publications:'M4 5h7a2 2 0 0 1 2 2v12a1.6 1.6 0 0 0-1.6-1.6H4z M20 5h-7a2 2 0 0 0-2 2v12a1.6 1.6 0 0 1 1.6-1.6H20z',
  custom:'M4 6h16M4 12h16M4 18h10'
};
const ORDER_DEFAULT = ['experience','education','skills','languages'];
const ADDABLE = ['experience','education','skills','languages','projects','certifications',
                 'awards','volunteer','publications','interests','references','custom'];

const ACCENTS = ['#2563eb','#7c3aed','#db2777','#e11d48','#ea580c','#ca8a04',
                 '#059669','#0d9488','#0891b2','#4f46e5','#334155','#1e293b','#7f1d1d','#064e3b'];

/* ── state ───────────────────────────────────────────────── */
const KEY = 'cvb.v1';
const blankSection = type => ({
  id:uid(), type, titleKey:'sec_'+type, title:null, visible:true,
  items:[ Object.fromEntries(SCHEMA[type].map(f=>[f.k, f.type==='check'?false:(f.type==='level'?70:(f.type==='select'?(f.opts[0][0]):''))])) ]
});
function defaultState(){
  return {
    lang:'ar', theme:'light', template:'aurora', accent:'#2563eb',
    photo:null, objective:'',
    personal:Object.fromEntries(PERSONAL_FIELDS.map(f=>[f.k,''])),
    sections:ORDER_DEFAULT.map(blankSection),
    settings:{ fontFamily:'cairo', fontSize:10.2, nameSize:26, headingSize:11.6,
      lineHeight:1.55, sectionGap:14, paper:'a4', margin:'normal',
      showPhoto:true, showIcons:true, upper:false, docDir:'auto' }
  };
}
let S = defaultState();
let VIEW = 'home';

function load(){
  try{
    const raw = localStorage.getItem(KEY);
    if(raw){
      const p = JSON.parse(raw);
      S = { ...defaultState(), ...p,
        personal:{ ...defaultState().personal, ...(p.personal||{}) },
        settings:{ ...defaultState().settings, ...(p.settings||{}) } };
      if(!Array.isArray(S.sections)||!S.sections.length) S.sections = ORDER_DEFAULT.map(blankSection);
    }
  }catch(e){ console.warn('load failed',e); }
  LANG = S.lang || 'ar';
}
let saveTimer;
function save(quiet){
  clearTimeout(saveTimer);
  saveTimer = setTimeout(()=>{
    try{ localStorage.setItem(KEY, JSON.stringify(S)); if(!quiet) pill(t('saved')); }
    catch(e){ toast('⚠ ' + e.message); }
  }, 350);
}

/* ── tiny UI utils ───────────────────────────────────────── */
let toastTimer;
function toast(msg){
  const el=$('#toast'); el.textContent=msg; el.classList.add('show');
  clearTimeout(toastTimer); toastTimer=setTimeout(()=>el.classList.remove('show'),2200);
}
let pillTimer;
function pill(msg){
  const el=$('#savePill'); el.textContent=msg; el.classList.add('show');
  clearTimeout(pillTimer); pillTimer=setTimeout(()=>el.classList.remove('show'),1200);
}
const svg = d => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="${d}"/></svg>`;
const secTitle = sc => sc.title || t(sc.titleKey);

/* ═══════ i18n application ═══════ */
function applyLang(){
  const L = I18N[LANG];
  document.documentElement.lang = LANG;
  document.documentElement.dir  = L._dir;
  $('#langLabel').textContent = L._other;
  $$('[data-i18n]').forEach(el=>{ el.innerHTML = t(el.dataset.i18n); });
  $$('[data-ph]').forEach(el=>{ el.placeholder = t(el.dataset.ph); });
  // Arabic-first font default follows the language unless user changed it
  renderAll();
}

/* ═══════ ROUTER ═══════ */
const VIEW_TITLES = {home:['app_name','app_tag'],builder:['nav_builder','tile_builder'],
  templates:['nav_templates','tile_templates'],preview:['nav_preview','tile_preview'],
  settings:['nav_settings','tile_settings']};
function go(v, push=true){
  if(!$('#view-'+v)) return;
  VIEW = v;
  $$('.view').forEach(s=>s.classList.toggle('is-active', s.id==='view-'+v));
  $$('.tab').forEach(b=>b.classList.toggle('is-on', b.dataset.go===v));
  const [a,b] = VIEW_TITLES[v];
  $('#viewTitle').textContent = t(a); $('#viewSub').textContent = t(b);
  $('#btnBack').hidden = (v==='home');
  window.scrollTo({top:0,behavior:'instant'});
  moveInk();
  if(v==='preview') renderPreview();
  if(v==='settings') renderFormatCard(), storageInfo();
  if(push) history.replaceState({v},'','#'+v);
}
function moveInk(){
  const ink=$('#tabInk'), on=$('.tab.is-on'); if(!ink||!on) return;
  const bar=$('#tabbar').getBoundingClientRect(), r=on.getBoundingClientRect();
  ink.style.width = r.width*0.42+'px';
  ink.style.insetInlineStart = (document.documentElement.dir==='rtl'
    ? bar.right - r.right + r.width*0.29 : r.left - bar.left + r.width*0.29)+'px';
}

/* ═══════ SHEET ═══════ */
function sheet(title, html, onMount){
  $('#sheetTitle').textContent = title;
  $('#sheetBody').innerHTML = html;
  $('#sheet').classList.add('show'); $('#sheetScrim').classList.add('show');
  onMount && onMount($('#sheetBody'));
}
function closeSheet(){ $('#sheet').classList.remove('show'); $('#sheetScrim').classList.remove('show'); }

/* ═══════ BUILDER: personal ═══════ */
function fieldHTML(f, val, path){
  const label = t(f.l);
  const cls = f.full ? 'field full' : 'field';
  if(f.type==='check')
    return `<label class="check ${f.full?'full':''}" style="grid-column:${f.full?'1/-1':'auto'}">
      <input type="checkbox" data-bind="${path}" ${val?'checked':''}><span>${label}</span></label>`;
  if(f.type==='textarea')
    return `<div class="${cls}"><label>${label}</label>
      <textarea data-bind="${path}" rows="4" placeholder="${f.ph?t(f.ph).replace(/"/g,'&quot;'):''}">${esc(val||'')}</textarea></div>`;
  if(f.type==='select')
    return `<div class="${cls}"><label>${label}</label><select data-bind="${path}">${
      f.opts.map(([v,k])=>`<option value="${v}" ${val===v?'selected':''}>${k==='—'?'—':t(k)}</option>`).join('')
    }</select></div>`;
  if(f.type==='level'){
    const v = val==null?70:val;
    return `<div class="level-row"><label style="font-size:12px;font-weight:700;color:var(--txt-2);flex:none">${label}</label>
      <input type="range" min="10" max="100" step="5" value="${v}" data-bind="${path}">
      <span class="level-val">${v}%</span></div>`;
  }
  return `<div class="${cls}"><label>${label}</label>
    <input type="${f.type||'text'}" data-bind="${path}" value="${esc(val||'')}" placeholder=""></div>`;
}
function renderPersonal(){
  $('#personalGrid').innerHTML = PERSONAL_FIELDS.map(f=>fieldHTML(f, S.personal[f.k], `personal.${f.k}`)).join('');
  const filled = PERSONAL_FIELDS.filter(f=>String(S.personal[f.k]||'').trim()).length;
  $('#cntPersonal').textContent = filled ? `${filled}/${PERSONAL_FIELDS.length}` : '';
  const img=$('#photoImg');
  if(S.photo){ img.src=S.photo; img.hidden=false; $('#photoBox').querySelector('.photo-ph').style.opacity=0; }
  else { img.hidden=true; img.removeAttribute('src'); $('#photoBox').querySelector('.photo-ph').style.opacity=1; }
}
function renderObjective(){
  const ta=$('#objectiveInput');
  if(ta.value !== (S.objective||'')) ta.value = S.objective||'';
  ta.placeholder = t('ph_objective');
  $('#objCounter').textContent = (S.objective||'').length;
  $('#cntObjective').textContent = (S.objective||'').trim() ? '✓' : '';
  $('#objSuggestions').innerHTML = ['obj_sug_1','obj_sug_2','obj_sug_3']
    .map(k=>`<button class="suggest" data-sug="${k}">${t(k)}</button>`).join('');
}

/* ═══════ BUILDER: dynamic sections ═══════ */
function itemTitle(sec, it){
  const f = SCHEMA[sec.type][0];
  const v = String(it[f.k]||'').trim();
  return v || t('untitled');
}
function itemSub(sec, it){
  const fs = SCHEMA[sec.type];
  const cand = fs.slice(1).filter(f=>!['textarea','check','level'].includes(f.type));
  const parts = cand.map(f=>{
    if(f.type==='select'){ const o=f.opts.find(o=>o[0]===it[f.k]); return o?t(o[1]):''; }
    return String(it[f.k]||'').trim();
  }).filter(Boolean);
  return parts.slice(0,2).join(' · ');
}
function renderSections(){
  const host = $('#dynSections');
  host.innerHTML = S.sections.map((sc,si)=>{
    const openIds = window.__openItems || {};
    const items = (sc.items||[]).map((it,ii)=>{
      const open = openIds[sc.id+':'+ii];
      return `<div class="item ${open?'open':''}" data-item="${si}:${ii}">
        <div class="item-head" data-toggle-item="${si}:${ii}">
          <span class="item-num">${ii+1}</span>
          <span class="ih-txt"><b>${esc(itemTitle(sc,it))}</b><small>${esc(itemSub(sc,it))}</small></span>
          <span class="item-tools">
            <button class="mini-btn" data-dup="${si}:${ii}" title="${t('duplicate')}">${svg('M9 9h10v10H9z M5 15V5h10')}</button>
            <button class="mini-btn del" data-del="${si}:${ii}" title="${t('remove')}">${svg('M5 7h14M9.5 7V5h5v2M7 7l.8 12.2A1 1 0 0 0 8.8 20h6.4a1 1 0 0 0 1-.8L17 7')}</button>
          </span>
        </div>
        ${open?`<div class="item-body">${SCHEMA[sc.type].map(f=>fieldHTML(f,it[f.k],`sections.${si}.items.${ii}.${f.k}`)).join('')}</div>`:''}
      </div>`;
    }).join('');
    return `<details class="panel ${sc.visible?'':'is-hidden'}" data-sec="${si}" ${openIds['sec:'+sc.id]?'open':''} draggable="false">
      <summary>
        <span class="panel-drag" data-drag="${si}" title="${t('move_up')}">${svg('M8 6h.01M8 12h.01M8 18h.01M16 6h.01M16 12h.01M16 18h.01')}</span>
        <span class="p-ic">${svg(SEC_ICON[sc.type]||SEC_ICON.custom)}</span>
        <b>${esc(secTitle(sc))}</b>
        <span class="p-count">${(sc.items||[]).length}</span>
        <button class="p-eye" data-menu="${si}">${svg('M12 5.5c-4 0-6.5 3.2-7.6 5.1a1.8 1.8 0 0 0 0 1.8C5.5 14.3 8 17.5 12 17.5s6.5-3.2 7.6-5.1a1.8 1.8 0 0 0 0-1.8C18.5 8.7 16 5.5 12 5.5z M12 9.8a2.7 2.7 0 1 0 0 5.4 2.7 2.7 0 0 0 0-5.4z')}</button>
        <svg class="chev" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </summary>
      <div class="panel-body">
        <div class="items">${items || `<div class="empty-note">—</div>`}</div>
        <button class="add-item" data-add="${si}">${svg('M12 5v14M5 12h14')}<span>${t('add_item')}</span></button>
      </div>
    </details>`;
  }).join('');
  wireDrag();
}

/* ── binding: any [data-bind] writes into S by path ──────── */
function setPath(path, val){
  const parts = path.split('.'); let o = S;
  for(let i=0;i<parts.length-1;i++) o = o[parts[i]];
  o[parts[parts.length-1]] = val;
}
document.addEventListener('input', e=>{
  const el = e.target.closest('[data-bind]'); if(!el) return;
  let v = el.type==='checkbox' ? el.checked : el.value;
  if(el.type==='range'){ v = +v; const lv=el.parentElement.querySelector('.level-val'); if(lv) lv.textContent=v+'%'; }
  setPath(el.dataset.bind, v);
  save(true);
  // live-update the summaries without nuking focus
  const item = el.closest('[data-item]');
  if(item){
    const [si,ii]=item.dataset.item.split(':').map(Number);
    const sc=S.sections[si], it=sc.items[ii];
    item.querySelector('.ih-txt b').textContent = itemTitle(sc,it);
    item.querySelector('.ih-txt small').textContent = itemSub(sc,it);
  }
  if(el.dataset.bind.startsWith('personal.')) renderProgress();
  if(el.id==='objectiveInput'){ S.objective=el.value; $('#objCounter').textContent=el.value.length;
    $('#cntObjective').textContent = el.value.trim()?'✓':''; renderProgress(); }
  schedulePreview();
});
$('#objectiveInput').addEventListener('input', e=>{ S.objective=e.target.value; save(true); });

/* ── item + section actions ──────────────────────────────── */
window.__openItems = {};
document.addEventListener('click', e=>{
  const T2 = e.target;

  const tog = T2.closest('[data-toggle-item]');
  if(tog && !T2.closest('.item-tools')){
    const k=tog.dataset.toggleItem, sec=S.sections[+k.split(':')[0]];
    const key=sec.id+':'+k.split(':')[1];
    window.__openItems[key] = !window.__openItems[key];
    renderSections(); return;
  }
  const add = T2.closest('[data-add]');
  if(add){
    const si=+add.dataset.add, sc=S.sections[si];
    sc.items.push(Object.fromEntries(SCHEMA[sc.type].map(f=>
      [f.k, f.type==='check'?false:(f.type==='level'?70:(f.type==='select'?f.opts[0][0]:''))])));
    window.__openItems[sc.id+':'+(sc.items.length-1)] = true;
    window.__openItems['sec:'+sc.id] = true;
    save(true); renderSections(); renderProgress(); schedulePreview();
    setTimeout(()=>{ const el=$(`[data-item="${si}:${sc.items.length-1}"] input`); el&&el.focus(); },60);
    return;
  }
  const dup = T2.closest('[data-dup]');
  if(dup){
    const [si,ii]=dup.dataset.dup.split(':').map(Number);
    S.sections[si].items.splice(ii+1,0,{...S.sections[si].items[ii]});
    save(true); renderSections(); schedulePreview(); return;
  }
  const del = T2.closest('[data-del]');
  if(del){
    const [si,ii]=del.dataset.del.split(':').map(Number);
    S.sections[si].items.splice(ii,1);
    if(!S.sections[si].items.length) S.sections[si].items.push(
      Object.fromEntries(SCHEMA[S.sections[si].type].map(f=>[f.k, f.type==='check'?false:(f.type==='level'?70:(f.type==='select'?f.opts[0][0]:''))])));
    save(true); renderSections(); renderProgress(); schedulePreview(); return;
  }
  const menu = T2.closest('[data-menu]');
  if(menu){ e.preventDefault(); e.stopPropagation(); sectionMenu(+menu.dataset.menu); return; }

  const sug = T2.closest('[data-sug]');
  if(sug){ S.objective = t(sug.dataset.sug); $('#objectiveInput').value=S.objective;
    $('#objCounter').textContent=S.objective.length; $('#cntObjective').textContent='✓';
    $('#objSuggestions').hidden=true; save(); renderProgress(); schedulePreview(); return; }

  const goBtn = T2.closest('[data-go]');
  if(goBtn){ go(goBtn.dataset.go); return; }
});
// remember which panels are open
document.addEventListener('toggle', e=>{
  const p = e.target.closest('.panel[data-sec]'); if(!p) return;
  const sc = S.sections[+p.dataset.sec]; if(sc) window.__openItems['sec:'+sc.id] = p.open;
}, true);

function sectionMenu(si){
  const sc = S.sections[si];
  const row=(icon,label,act,cls='')=>`<button class="sheet-item ${cls}" data-act="${act}">
    <span class="si-ic">${svg(icon)}</span><b>${label}</b></button>`;
  sheet(secTitle(sc), `<div class="sheet-list">
    ${row('M12 5v14M5 12h14', t('add_item'),'add')}
    ${row('M4 7h16M4 12h11M4 17h7', t('rename'),'rename')}
    ${sc.visible
      ? row('M3 3l18 18M10.6 10.7a2.7 2.7 0 0 0 3.8 3.8M9.4 5.8A8.5 8.5 0 0 1 12 5.5c4 0 6.5 3.2 7.6 5.1a1.8 1.8 0 0 1 0 1.8 15 15 0 0 1-2 2.7M6.4 7.6A15 15 0 0 0 4.4 10.6a1.8 1.8 0 0 0 0 1.8C5.5 14.3 8 17.5 12 17.5c1 0 1.9-.2 2.7-.5', t('hide_section'),'vis')
      : row('M12 5.5c-4 0-6.5 3.2-7.6 5.1a1.8 1.8 0 0 0 0 1.8C5.5 14.3 8 17.5 12 17.5s6.5-3.2 7.6-5.1a1.8 1.8 0 0 0 0-1.8C18.5 8.7 16 5.5 12 5.5zM12 9.8a2.7 2.7 0 1 0 0 5.4 2.7 2.7 0 0 0 0-5.4z', t('show_section'),'vis')}
    ${si>0 ? row('M12 19V5M6 11l6-6 6 6', t('move_up'),'up'):''}
    ${si<S.sections.length-1 ? row('M12 5v14M6 13l6 6 6-6', t('move_down'),'down'):''}
    ${row('M5 7h14M9.5 7V5h5v2M7 7l.8 12.2A1 1 0 0 0 8.8 20h6.4a1 1 0 0 0 1-.8L17 7', t('delete_section'),'del')}
  </div>`, root=>{
    root.addEventListener('click', ev=>{
      const b=ev.target.closest('[data-act]'); if(!b) return;
      const a=b.dataset.act;
      if(a==='add'){ sc.items.push(Object.fromEntries(SCHEMA[sc.type].map(f=>[f.k,f.type==='check'?false:(f.type==='level'?70:(f.type==='select'?f.opts[0][0]:''))])));
        window.__openItems['sec:'+sc.id]=true; }
      if(a==='vis') sc.visible = !sc.visible;
      if(a==='up'){ S.sections.splice(si-1,0,S.sections.splice(si,1)[0]); }
      if(a==='down'){ S.sections.splice(si+1,0,S.sections.splice(si,1)[0]); }
      if(a==='del'){ if(!confirm(t('confirm_del_section'))) return; S.sections.splice(si,1); }
      if(a==='rename'){
        const n = prompt(t('rename'), secTitle(sc));
        if(n===null) return;
        sc.title = n.trim() || null;
      }
      closeSheet(); save(); renderSections(); renderProgress(); schedulePreview();
    });
  });
}

/* ── drag to reorder (desktop) ───────────────────────────── */
function wireDrag(){
  let dragEl=null;
  $$('.panel[data-sec]').forEach(p=>{
    const handle = p.querySelector('[data-drag]');
    handle.addEventListener('mousedown', ()=>p.setAttribute('draggable','true'));
    p.addEventListener('mouseup', ()=>p.setAttribute('draggable','false'));
    p.addEventListener('dragstart', e=>{ dragEl=p; p.classList.add('dragging'); e.dataTransfer.effectAllowed='move'; });
    p.addEventListener('dragend', ()=>{ p.classList.remove('dragging'); p.setAttribute('draggable','false');
      $$('.panel').forEach(x=>x.classList.remove('drop-target')); });
    p.addEventListener('dragover', e=>{ e.preventDefault(); if(dragEl&&dragEl!==p) p.classList.add('drop-target'); });
    p.addEventListener('dragleave', ()=>p.classList.remove('drop-target'));
    p.addEventListener('drop', e=>{
      e.preventDefault(); p.classList.remove('drop-target');
      if(!dragEl||dragEl===p) return;
      const from=+dragEl.dataset.sec, to=+p.dataset.sec;
      S.sections.splice(to,0,S.sections.splice(from,1)[0]);
      save(); renderSections(); schedulePreview();
    });
  });
}

/* ── add-section sheet ───────────────────────────────────── */
$('#btnAddSection').addEventListener('click', ()=>{
  const used = new Set(S.sections.map(s=>s.type));
  const avail = ADDABLE.filter(x=>x==='custom' || !used.has(x));
  const html = avail.length ? `<div class="sheet-list">${avail.map(type=>`
      <button class="sheet-item" data-new="${type}">
        <span class="si-ic">${svg(SEC_ICON[type]||SEC_ICON.custom)}</span>
        <b>${t('sec_'+type)}</b></button>`).join('')}</div>`
    : `<p class="empty-note">${t('all_sections_added')}</p>`;
  sheet(t('add_more_sections'), html, root=>{
    root.addEventListener('click', ev=>{
      const b=ev.target.closest('[data-new]'); if(!b) return;
      const sc = blankSection(b.dataset.new);
      S.sections.push(sc); window.__openItems['sec:'+sc.id]=true;
      closeSheet(); save(); renderSections(); renderProgress(); schedulePreview();
      setTimeout(()=>$(`[data-sec="${S.sections.length-1}"]`)?.scrollIntoView({behavior:'smooth',block:'center'}),120);
    });
  });
});

/* ═══════ PROGRESS ═══════ */
function renderProgress(){
  const checks = [
    ['sec_personal', !!(S.personal.fullName||'').trim()],
    ['f_email',      !!(S.personal.email||'').trim() || !!(S.personal.phone||'').trim()],
    ['f_jobTitle',   !!(S.personal.jobTitle||'').trim()],
    ['sec_objective',!!(S.objective||'').trim()],
    // A section counts as filled only when its PRIMARY field carries content —
    // a select's default value is not evidence that the user entered anything.
    ...S.sections.map(sc=>{
      const primary = SCHEMA[sc.type][0].k;
      return [sc.titleKey, (sc.items||[]).some(it=>String(it[primary]||'').trim())];
    })
  ];
  const doneN = checks.filter(c=>c[1]).length;
  const pct = Math.round(doneN/checks.length*100);
  $('#ringPct').textContent = pct+'%';
  const C=2*Math.PI*19;
  $('#ringFg').style.strokeDasharray = C;
  $('#ringFg').style.strokeDashoffset = C*(1-pct/100);
  $('#pcHint').textContent = pct<25?t('pc_hint_empty'):pct<60?t('pc_hint_mid'):pct<100?t('pc_hint_good'):t('pc_hint_full');
  $('#pcChips').innerHTML = checks.map(([k,ok])=>
    `<span class="pc-chip ${ok?'done':''}">${ok?'✓ ':''}${t(k)}</span>`).join('');
}

/* ═══════ TEMPLATES VIEW ═══════
   Live micro-previews: each thumbnail is a shadow root holding the real CV,
   scaled down. Shadow DOM rather than 14 iframes — same style isolation at a
   fraction of the cost, and one document instead of fifteen.

   Cards mount only once scrolled into view, and re-paint on a debounce, so
   typing never drives 14 re-renders. With no data entered there is nothing to
   preview, so we keep the abstract wireframe instead of 14 blank white cards. */
const A4_PX = 210*96/25.4;

function paintThumb(thumb){
  const tp = TEMPLATES.find(x=>x.id===thumb.dataset.tplThumb);
  if(!tp) return;
  if(!hasContent()){                       // nothing to show -> wireframe
    if(thumb.shadowRoot) thumb.shadowRoot.replaceChildren();
    thumb.classList.remove('is-live');
    if(!thumb.querySelector('svg')) thumb.innerHTML = templateThumb(tp, S.accent);
    else thumb.innerHTML = templateThumb(tp, S.accent);
    return;
  }
  const root = thumb.shadowRoot || thumb.attachShadow({mode:'open'});
  root.innerHTML = renderCVShadow({...S, docDir:docDir(), objectiveTitle:t('sec_objective')}, tp.id, I18N[LANG]);
  thumb.classList.add('is-live');
  thumb.replaceChildren();                 // drop the wireframe placeholder
  scaleThumb(thumb);
}
function scaleThumb(thumb){
  const scale = thumb.clientWidth / (PAPER[S.settings.paper]?.w ?? 210) * 25.4/96;
  const el = thumb.shadowRoot && thumb.shadowRoot.querySelector('.cv-scale');
  if(el) el.style.transform = `scale(${scale})`;
}
let thumbObserver = null;
function observeThumbs(){
  thumbObserver?.disconnect();
  thumbObserver = new IntersectionObserver((entries,obs)=>{
    entries.forEach(en=>{ if(en.isIntersecting){ paintThumb(en.target); obs.unobserve(en.target); } });
  }, { rootMargin:'240px' });
  $$('[data-tpl-thumb]').forEach(el=>thumbObserver.observe(el));
}
let thumbTimer;
/** Re-paint only the cards already mounted; cheap and debounced. */
function refreshThumbs(){
  clearTimeout(thumbTimer);
  thumbTimer = setTimeout(()=>{
    $$('[data-tpl-thumb]').forEach(el=>{ if(el.shadowRoot || !hasContent()) paintThumb(el); });
  }, 260);
}
addEventListener('resize', ()=> $$('[data-tpl-thumb].is-live').forEach(scaleThumb));

let tplCat = 'all';
function renderTemplates(){
  const list = TEMPLATES.filter(x=>tplCat==='all'||x.cat===tplCat);
  const card = tp=>`<button class="tpl-card ${tp.id===S.template?'is-on':''}" data-tpl="${tp.id}">
      <span class="tpl-check">${svg('M5 12.5l4.5 4.5L19 7.5')}</span>
      <div class="tpl-thumb" data-tpl-thumb="${tp.id}">${templateThumb(tp, S.accent)}</div>
      <div class="tpl-meta"><b>${tp.name[LANG]||tp.name.en}</b><span class="tpl-tag">${t('cat_'+({modern:'modern',professional:'pro',creative:'creative',minimal:'minimal'}[tp.cat])) }</span></div>
    </button>`;
  $('#tplGrid').innerHTML = list.map(card).join('');
  $('#homeRail').innerHTML = TEMPLATES.slice(0,8).map(card).join('');
  observeThumbs();
  $('#swatches').innerHTML = ACCENTS.map(c=>
    `<button class="sw ${c===S.accent?'is-on':''}" data-accent="${c}" style="background:${c};color:${c}"></button>`).join('');
  const cur = TEMPLATES.find(x=>x.id===S.template);
  $('#quickTplName').textContent = cur ? (cur.name[LANG]||cur.name.en) : '—';
}
document.addEventListener('click', e=>{
  const tc = e.target.closest('[data-tpl]');
  if(tc){ S.template = tc.dataset.tpl; save(); renderTemplates();
    toast((TEMPLATES.find(x=>x.id===S.template).name[LANG])); schedulePreview(); return; }
  const sw = e.target.closest('[data-accent]');
  if(sw){ S.accent = sw.dataset.accent; save(); renderTemplates(); schedulePreview(); return; }
  const fc = e.target.closest('.fchip');
  if(fc){ tplCat = fc.dataset.cat; $$('.fchip').forEach(x=>x.classList.toggle('is-on',x===fc)); renderTemplates(); return; }
});

/* ═══════ PREVIEW ═══════ */
let zoom = 1, previewTimer;
function docDir(){ return S.settings.docDir==='auto' ? I18N[LANG]._dir : S.settings.docDir; }
function buildDoc(){
  return renderCV({ ...S, docDir:docDir(), objectiveTitle:t('sec_objective') }, S.template, I18N[LANG]);
}
function schedulePreview(){
  renderProgress();
  if(VIEW==='templates'||VIEW==='home') refreshThumbs();
  if(VIEW!=='preview') return;
  clearTimeout(previewTimer); previewTimer=setTimeout(renderPreview,180);
}
/** Would the rendered CV have anything on it at all?
 *  An empty profile renders a technically-correct blank A4 — which every
 *  user reads as "the app is broken". Detect it and explain instead. */
function hasContent(){
  const p = S.personal;
  if(['fullName','jobTitle','email','phone'].some(k=>String(p[k]||'').trim())) return true;
  if(String(S.objective||'').trim()) return true;
  return S.sections.some(sc => sc.visible &&
    (sc.items||[]).some(it => String(it[SCHEMA[sc.type][0].k]||'').trim()));
}

function renderPreview(){
  const frame=$('#pvFrame'), paper=$('#pvPaper'), stage=$('#pvStage');

  const empty = !hasContent();
  $('#pvEmpty').hidden = !empty;
  paper.hidden = empty;
  $('#btnExport').disabled = empty;
  $('#btnFormat').disabled = empty;
  if(empty){ frame.srcdoc = ''; return; }

  const P = PAPER[S.settings.paper]||PAPER.a4;
  const pxW = P.w*96/25.4, pxH = P.h*96/25.4;
  const avail = stage.clientWidth - 24;
  const fit = Math.min(1, avail/pxW);
  const scale = fit*zoom;
  paper.style.width = pxW+'px'; paper.style.height = pxH+'px';
  paper.style.transform = `scale(${scale})`;
  paper.style.marginBottom = (pxH*scale - pxH) + 'px';
  frame.srcdoc = buildDoc();
  frame.onload = ()=>{
    try{
      const d=frame.contentDocument;
      const h=Math.max(d.body.scrollHeight, d.documentElement.scrollHeight);
      const pages=Math.max(1, Math.ceil((h-4)/pxH));
      const total=pages*pxH;
      paper.style.height=total+'px';
      paper.style.marginBottom=(total*scale-total)+'px';
    }catch(err){}
  };
  $('#zoomVal').textContent = Math.round(zoom*100)+'%';
}
$('#btnZoomIn').onclick = ()=>{ zoom=Math.min(2.2,zoom+0.15); renderPreview(); };
$('#btnZoomOut').onclick= ()=>{ zoom=Math.max(0.4,zoom-0.15); renderPreview(); };
window.addEventListener('resize', ()=>{ moveInk(); if(VIEW==='preview') renderPreview(); });

$('#btnTplQuick').onclick = ()=>{
  sheet(t('choose_template'), `<div class="tpl-grid">${TEMPLATES.map(tp=>`
    <button class="tpl-card ${tp.id===S.template?'is-on':''}" data-tpl="${tp.id}">
      <span class="tpl-check">${svg('M5 12.5l4.5 4.5L19 7.5')}</span>
      <div class="tpl-thumb" data-tpl-thumb="${tp.id}">${templateThumb(tp,S.accent)}</div>
      <div class="tpl-meta"><b>${tp.name[LANG]||tp.name.en}</b></div></button>`).join('')}</div>
    <div class="color-strip" style="margin-top:14px"><span>${t('accent_color')}</span>
      <div class="swatches">${ACCENTS.map(c=>`<button class="sw ${c===S.accent?'is-on':''}" data-accent="${c}" style="background:${c};color:${c}"></button>`).join('')}</div></div>`,
    root=>{
      $$('[data-tpl-thumb]',root).forEach(paintThumb);
      root.addEventListener('click', ()=>setTimeout(()=>{
        $$('[data-tpl]',root).forEach(b=>b.classList.toggle('is-on', b.dataset.tpl===S.template));
        $$('[data-accent]',root).forEach(b=>b.classList.toggle('is-on', b.dataset.accent===S.accent));
        $$('[data-tpl-thumb]',root).forEach(paintThumb);
      },10));
    });
};

/* ═══════ FORMAT ═══════ */
const FONT_OPTS = [['cairo','Cairo'],['tajawal','Tajawal'],['kufi','Noto Kufi'],['amiri','Amiri'],['inter','Inter'],['georgia','Georgia']];
function formatControls(){
  const s=S.settings;
  const sel=(k,label,opts)=>`<div class="field"><label>${label}</label><select data-set="${k}">${
    opts.map(([v,l])=>`<option value="${v}" ${String(s[k])===String(v)?'selected':''}>${l}</option>`).join('')}</select></div>`;
  // class, not id: these controls are rendered twice (settings card + sheet),
  // so an id here would be duplicated and the wrong label would update.
  const rng=(k,label,min,max,step,suffix='')=>`<div class="field" style="grid-column:1/-1">
    <label>${label} <b class="set-lbl" style="color:var(--brand-1)">${s[k]}${suffix}</b></label>
    <input type="range" min="${min}" max="${max}" step="${step}" value="${s[k]}" data-set="${k}" data-num="1" data-suffix="${suffix}"></div>`;
  const chk=(k,label)=>`<label class="check" style="grid-column:1/-1"><input type="checkbox" data-set="${k}" data-bool="1" ${s[k]?'checked':''}><span>${label}</span></label>`;
  return `
    ${sel('fontFamily',t('font_family'),FONT_OPTS)}
    ${sel('paper',t('paper_size'),[['a4','A4'],['letter','Letter'],['legal','Legal']])}
    ${sel('margin',t('margin'),[['narrow',t('m_narrow')],['normal',t('m_normal')],['wide',t('m_wide')]])}
    ${sel('docDir','CV Direction',[['auto','Auto'],['rtl','RTL — عربي'],['ltr','LTR — English']])}
    ${rng('fontSize',t('font_size'),8,14,0.2,'pt')}
    ${rng('nameSize',t('name_size'),16,40,1,'pt')}
    ${rng('headingSize',t('heading_size'),9,18,0.2,'pt')}
    ${rng('lineHeight',t('line_height'),1.15,2.1,0.05,'')}
    ${rng('sectionGap',t('section_spacing'),6,28,1,'')}
    ${chk('showPhoto',t('show_photo'))}
    ${chk('showIcons',t('show_icons'))}
    ${chk('upper',t('uppercase_headings'))}`;
}
function renderFormatCard(){ $('#formatCard').innerHTML = `<div class="fmt-grid">${formatControls()}</div>`; }
$('#btnFormat').onclick = ()=> sheet(t('doc_format'), `<div class="grid-2">${formatControls()}</div>`);
document.addEventListener('input', e=>{
  const el=e.target.closest('[data-set]'); if(!el) return;
  const k=el.dataset.set;
  const val = el.dataset.bool ? el.checked : (el.dataset.num ? +el.value : el.value);
  S.settings[k] = val;
  el.closest('.field')?.querySelector('.set-lbl')
    ?.replaceChildren(el.value + (el.dataset.suffix||''));
  // The same control can exist in both the settings card and the sheet —
  // keep every copy showing the one true value.
  $$(`[data-set="${k}"]`).forEach(other=>{
    if(other===el) return;
    if(other.type==='checkbox') other.checked = val; else other.value = val;
    other.closest('.field')?.querySelector('.set-lbl')
      ?.replaceChildren(String(val) + (other.dataset.suffix||''));
  });
  save(true); clearTimeout(previewTimer); previewTimer=setTimeout(renderPreview,120);
});

/* ═══════ EXPORT ═══════ */
function downloadBlob(blob, filename){
  const url=URL.createObjectURL(blob), a=document.createElement('a');
  a.href=url; a.download=filename; document.body.appendChild(a); a.click();
  setTimeout(()=>{ URL.revokeObjectURL(url); a.remove(); },800);
}
const cvFileName = ext => `${(S.personal.fullName||'CV').replace(/[\\/:*?"<>|]/g,'').trim()||'CV'}.${ext}`;

/* Printing a hidden same-origin iframe is the clean path on desktop browsers.
   iOS Safari is unreliable about it, so fall back to opening the document in a
   new tab, where the user can reach Print / Save to Files from the share sheet. */
function printCV(){
  const html = buildDoc();
  const openInTab = ()=>{
    const url = URL.createObjectURL(new Blob([html],{type:'text/html'}));
    const w = window.open(url,'_blank');
    if(!w){ downloadBlob(new Blob([html],{type:'text/html'}), cvFileName('html')); toast(t('done')); }
    setTimeout(()=>URL.revokeObjectURL(url), 60000);
  };
  if(IS_IOS) return openInTab();

  const f = document.createElement('iframe');
  f.style.cssText='position:fixed;inset:0;width:0;height:0;border:0;opacity:0';
  document.body.appendChild(f);
  f.srcdoc = html;
  f.onload = ()=>{ setTimeout(()=>{
    try{ f.contentWindow.focus(); f.contentWindow.print(); }
    catch(err){ f.remove(); openInTab(); return; }
    setTimeout(()=>f.remove(), 60000);
  }, 450); };
}
$('#btnExport').onclick = ()=>{
  const row=(icon,a,b,act)=>`<button class="sheet-item" data-x="${act}">
    <span class="si-ic">${svg(icon)}</span><span style="flex:1"><b>${a}</b><small>${b}</small></span></button>`;
  sheet(t('export'), `<div class="sheet-list">
    ${row('M12 3v11M8 10.5l4 4 4-4M4.5 17.5V20h15v-2.5', t('export_pdf'), t('export_pdf_sub'),'pdf')}
    ${row('M6.5 9V4h11v5M6.5 17.5H5a1 1 0 0 1-1-1V10a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v6.5a1 1 0 0 1-1 1h-1.5M6.5 14h11v6h-11z', t('print_cv'), t('print_cv_sub'),'print')}
    ${row('M8.5 13.5l7-4M8.5 10.5l7 4M6 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM18 8.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM18 19.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4z', t('share_cv'), t('share_cv_sub'),'share')}
    ${row('M8 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1h-3M9 12l2 2 4-4', t('export_html'), t('export_html_sub'),'html')}
  </div>`, root=>{
    root.addEventListener('click', async ev=>{
      const b=ev.target.closest('[data-x]'); if(!b) return;
      const a=b.dataset.x; closeSheet();
      // called synchronously: iOS only allows window.open inside a user gesture,
      // and a setTimeout here would break that chain and get the tab blocked
      if(a==='pdf'||a==='print'){ printCV(); }
      if(a==='html'){ downloadBlob(new Blob([buildDoc()],{type:'text/html;charset=utf-8'}), cvFileName('html')); toast(t('done')); }
      if(a==='share'){
        const file = new File([buildDoc()], cvFileName('html'), {type:'text/html'});
        try{
          if(navigator.canShare && navigator.canShare({files:[file]})) await navigator.share({files:[file], title:cvFileName('html')});
          else if(navigator.share) await navigator.share({title:S.personal.fullName||'CV', text:(S.objective||'').slice(0,180)});
          else { downloadBlob(new Blob([buildDoc()],{type:'text/html'}), cvFileName('html')); toast(t('done')); }
        }catch(err){}
      }
    });
  });
};

/* ═══════ SETTINGS actions ═══════ */
$('#btnExportJson').onclick = ()=>{
  downloadBlob(new Blob([JSON.stringify(S,null,2)],{type:'application/json'}), cvFileName('json'));
  toast(t('done'));
};
$('#btnImportJson').onclick = ()=> $('#importInput').click();
$('#importInput').addEventListener('change', e=>{
  const f=e.target.files[0]; if(!f) return;
  const r=new FileReader();
  r.onload = ()=>{
    try{
      const p=JSON.parse(r.result);
      if(!p || typeof p!=='object' || !p.personal) throw 0;
      S = { ...defaultState(), ...p,
        personal:{...defaultState().personal, ...(p.personal||{})},
        settings:{...defaultState().settings, ...(p.settings||{})} };
      LANG = S.lang||'ar';
      localStorage.setItem(KEY, JSON.stringify(S));
      applyLang(); applyTheme(); toast(t('imported'));
    }catch(err){ toast(t('import_failed')); }
    e.target.value='';
  };
  r.readAsText(f);
});
$('#btnReset').onclick = ()=>{
  if(!confirm(t('confirm_reset'))) return;
  localStorage.removeItem(KEY); S=defaultState(); LANG=S.lang;
  window.__openItems={}; applyLang(); applyTheme(); toast(t('done')); go('home');
};
$('#btnSample').onclick = ()=>{ loadSample(); toast(t('sample_loaded')); go('preview'); };
$('#btnSampleFromPreview').onclick = ()=>{ loadSample(); toast(t('sample_loaded')); renderPreview(); };

function storageInfo(){
  let bytes=0; try{ bytes=new Blob([localStorage.getItem(KEY)||'']).size; }catch(e){}
  $('#storageVal').textContent = bytes<1024 ? bytes+' B' : (bytes/1024).toFixed(1)+' KB';
  $('#swStatus').textContent = navigator.serviceWorker?.controller ? t('sw_active') : t('sw_none');
}

/* ═══════ PHOTO ═══════ */
$('#btnPhoto').onclick = ()=> $('#photoInput').click();
$('#photoBox').onclick = ()=> $('#photoInput').click();
$('#btnPhotoDel').onclick = ()=>{ S.photo=null; save(); renderPersonal(); schedulePreview(); };
$('#photoInput').addEventListener('change', e=>{
  const f=e.target.files[0]; if(!f) return;
  const r=new FileReader();
  r.onload = ()=>{
    const img=new Image();
    img.onload = ()=>{
      // downscale so the whole CV stays small enough for localStorage
      const max=520, sc=Math.min(1,max/Math.max(img.width,img.height));
      const c=document.createElement('canvas');
      c.width=Math.round(img.width*sc); c.height=Math.round(img.height*sc);
      c.getContext('2d').drawImage(img,0,0,c.width,c.height);
      S.photo = c.toDataURL('image/jpeg',0.82);
      save(); renderPersonal(); schedulePreview();
    };
    img.src=r.result;
  };
  r.readAsDataURL(f); e.target.value='';
});

/* ═══════ THEME / LANG / NAV ═══════ */
function applyTheme(){
  document.documentElement.dataset.theme = S.theme;
  $('meta[name=theme-color]').setAttribute('content', S.theme==='dark' ? '#0b0c16' : '#6d28d9');
}
$('#btnTheme').onclick = ()=>{ S.theme = S.theme==='dark'?'light':'dark'; applyTheme(); save(true); };
$('#btnLang').onclick = ()=>{
  LANG = LANG==='ar' ? 'en' : 'ar';
  S.lang = LANG;
  if(!S.settings._fontTouched) S.settings.fontFamily = LANG==='ar' ? 'cairo' : 'inter';
  save(true); applyLang(); go(VIEW,false);
};
$('#btnBack').onclick = ()=> go('home');
$('#sheetClose').onclick = closeSheet;
$('#sheetScrim').onclick = closeSheet;
document.addEventListener('keydown', e=>{ if(e.key==='Escape') closeSheet(); });
$('#btnObjSuggest').onclick = ()=>{ const s=$('#objSuggestions'); s.hidden=!s.hidden; };
addEventListener('scroll', ()=> $('#topbar').classList.toggle('scrolled', scrollY>6), {passive:true});

/* ═══════ SAMPLE DATA ═══════ */
function loadSample(){
  const ar = LANG==='ar';
  S.personal = { fullName: ar?'ماثيو روبنسون':'Mathew Robinson',
    jobTitle: ar?'مدير مكتب':'Office Manager',
    email:'matrobison@gmail.com', phone:'(123) 456 7895',
    address: ar?'٤٥ شارع بوه بير':'45 Pooh Bear Lane', city: ar?'تشارلستون':'Charleston',
    country: ar?'الولايات المتحدة':'United States',
    linkedin:'linkedin.com/in/mrobinson', website:'mrobinson.dev',
    dob:'1991', nationality: ar?'أمريكي':'American', maritalStatus:'single', gender:'male' };
  S.objective = ar
    ? 'أسعى إلى فرص تتيح لي توظيف مهاراتي بالكامل في خدمة نجاح المؤسسة، مع خبرة تمتد لأكثر من ست سنوات في إدارة العمليات المكتبية وخفض التكاليف التشغيلية.'
    : 'I seek challenging opportunities where I can fully use my skills for the success of the organisation, with 6+ years managing office operations and reducing operating costs.';
  const mk=(type,items)=>({...blankSection(type), items});
  S.sections = [
    mk('experience',[
      { position: ar?'مدير مكتب':'Office Manager', company:'Express Inc.', location: ar?'سان خوسيه':'San Jose, CA',
        start:'2016', end:'', current:true,
        desc: ar?'• أدرت الجداول والعمليات اليومية لمكتب يضم ٥٠ موظفاً\n• خفّضت المصروفات المكتبية بمقدار ٣٥ ألف دولار عبر التفاوض على عقود توريد أرخص\n• طبّقت نظام جرد وأتمتت إجراءات الطلب'
          :'• Managed schedules and daily operations of an office of 50 employees\n• Slashed office expenditures by $35k by negotiating cheaper supply contracts\n• Implemented inventory control and standardised ordering procedures' },
      { position: ar?'مساعد إداري':'Office Assistant', company:'Simple Functions', location: ar?'فريزنو':'Fresno, CA',
        start:'2012', end:'2016', current:false,
        desc: ar?'• أعددت التقارير اليومية والأسبوعية والشهرية\n• حدّثت تقويم المواعيد\n• نفّذت مهام محاسبية أساسية شملت التسويات النقدية'
          :'• Prepared daily, weekly and monthly reports\n• Updated the calendar of appointments\n• Performed basic accounting including cash reconciliations' }
    ]),
    mk('education',[
      { degree: ar?'بكالوريوس إدارة أعمال':'B.S. Business Management', school: ar?'جامعة برينستون':'Princeton University',
        location:'', start:'', end:'2013', grade:'4.0', current:false, desc:'' },
      { degree: ar?'دبلوم محاسبة':'A.A. Accounting', school: ar?'جامعة برينستون':'Princeton University',
        location:'', start:'', end:'2011', grade:'3.5', current:false, desc:'' }
    ]),
    mk('skills',[
      {name: ar?'حزمة أوفيس':'MS Office Suite', level:95},
      {name: ar?'أنظمة إدارة العملاء':'CRM Systems', level:88},
      {name:'MySQL / Photoshop', level:74},
      {name: ar?'التحليل والتقييم':'Analysis & assessment', level:82},
      {name: ar?'إعداد الميزانيات':'Budgeting', level:80}
    ]),
    mk('languages',[
      {name: ar?'العربية':'Arabic', level:'native'},
      {name: ar?'الإنجليزية':'English', level:'fluent'},
      {name: ar?'الفرنسية':'French', level:'intermediate'}
    ]),
    mk('certifications',[
      {name: ar?'مدير مرافق معتمد':'Certified Facility Manager', issuer:'IFMA', date:'2017', credId:'IFMA-2017-8841'}
    ]),
    mk('awards',[
      {name: ar?'موظف الشهر':'Employee of the Month', issuer:'Express Inc.', date: ar?'فبراير ٢٠١٨':'February 2018', desc:''}
    ]),
    mk('references',[
      {name:'Evan Rightworth', position: ar?'مدير العمليات':'Operations Manager', company:'Wal-mart',
       email:'erightworth@walmart.com', phone:'314-999-1234'},
      {name:'George Bailey', position: ar?'مسؤول الموارد البشرية':'HR Officer', company:'CDS Movers',
       email:'gbailey@gmail.com', phone:'123-564-9768'}
    ])
  ];
  window.__openItems={}; save(); renderAll();
}

/* ═══════ BOOT ═══════ */
function renderAll(){
  renderPersonal(); renderObjective(); renderSections();
  renderProgress(); renderTemplates(); renderFormatCard();
  if(VIEW==='preview') renderPreview();
}
function boot(){
  load(); applyTheme();
  applyLang();          // -> renderAll()
  const hash=(location.hash||'').replace('#','');
  go(VIEW_TITLES[hash]?hash:'home', false);
  setTimeout(moveInk,60);
  setTimeout(()=>$('#splash').classList.add('gone'), 620);
  setTimeout(()=>$('#splash').remove(), 1400);
}

/* ── PWA ──
   The cached shell is what makes the app work offline, but it also means a
   new release would sit behind a stale cache forever. So: when a new worker
   finishes installing while an old one is still in control, wave it through
   and reload once. Molt, then carry on. */
if('serviceWorker' in navigator){
  addEventListener('load', ()=>{
    navigator.serviceWorker.register('sw.js').then(reg=>{
      setTimeout(storageInfo,400);
      reg.addEventListener('updatefound', ()=>{
        const w = reg.installing; if(!w) return;
        w.addEventListener('statechange', ()=>{
          if(w.state==='installed' && navigator.serviceWorker.controller) w.postMessage('SKIP_WAITING');
        });
      });
    }).catch(e=>console.warn('SW',e));
    let reloading=false;
    navigator.serviceWorker.addEventListener('controllerchange', ()=>{
      if(reloading) return; reloading=true; location.reload();
    });
  });
}
let deferredPrompt=null;
addEventListener('beforeinstallprompt', e=>{ e.preventDefault(); deferredPrompt=e; $('#btnInstall').hidden=false; });

/* iOS Safari implements neither beforeinstallprompt nor appinstalled, so the
   install button can never appear there. Detect iOS-not-yet-installed and show
   the manual Add-to-Home-Screen route instead. iPadOS reports as "MacIntel",
   hence the touch-points check. */
const IS_IOS = /iphone|ipad|ipod/i.test(navigator.userAgent) ||
               (navigator.platform==='MacIntel' && navigator.maxTouchPoints>1);
const IS_STANDALONE = matchMedia('(display-mode: standalone)').matches || navigator.standalone===true;
if(IS_IOS && !IS_STANDALONE) $('#iosInstall').hidden = false;
$('#btnInstall').onclick = async ()=>{
  if(!deferredPrompt) return;
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  if(outcome==='accepted'){ toast(t('installed')); $('#btnInstall').hidden=true; }
  deferredPrompt=null;
};

boot();
