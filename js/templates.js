/* ═══════════════════════════════════════════════════════════════
   TEMPLATE ENGINE  —  the chromatophore layer.

   Biomimetic basis: a cuttlefish (Sepia officinalis) keeps one
   unchanging body and repaints a thin, independently-controlled
   surface layer in under a second (Hanlon & Messenger 2018;
   Mäthger et al., J. R. Soc. Interface 2009).

   So: the CV data is the body. A template is a PURE FUNCTION
   data -> appearance. It never owns, stores or mutates content.
   Every layout is assembled from ONE small vocabulary of blocks
   (entry, list, tags, meters) — the weaver-bird principle:
   great structural variety from a single repeated stitch.
   ═══════════════════════════════════════════════════════════════ */

const TEMPLATES = [
  // ── MODERN ────────────────────────────────────────────────
  { id:'aurora',   cat:'modern',       layout:'sidebar',  name:{ar:'أورورا',   en:'Aurora'},
    o:{ sideFill:'solid', photo:'square', head:'in-side', title:'bar',      skills:'meter', accentHead:true } },
  { id:'nova',     cat:'modern',       layout:'band',     name:{ar:'نوفا',     en:'Nova'},
    o:{ photo:'circle', head:'band', title:'pill',     skills:'meter', cols:2 } },
  { id:'vertex',   cat:'modern',       layout:'sidebar',  name:{ar:'فيرتكس',   en:'Vertex'},
    o:{ sideFill:'tint', photo:'circle', head:'top', title:'sideRule', skills:'dots', sideEnd:true } },
  { id:'pulse',    cat:'modern',       layout:'band',     name:{ar:'بَلْس',     en:'Pulse'},
    o:{ photo:'circle', head:'band-split', title:'chip', skills:'tag', cols:2, bandDark:true } },

  // ── PROFESSIONAL ──────────────────────────────────────────
  { id:'meridian', cat:'professional', layout:'stack',    name:{ar:'ميريديان', en:'Meridian'},
    o:{ photo:'none', head:'centered', title:'ruleFull', skills:'text', serif:false } },
  { id:'atlas',    cat:'professional', layout:'stack',    name:{ar:'أطلس',     en:'Atlas'},
    o:{ photo:'right', head:'row', title:'block', skills:'text', dense:true } },
  { id:'summit',   cat:'professional', layout:'split',    name:{ar:'سُميت',    en:'Summit'},
    o:{ photo:'square', head:'row', title:'underline', skills:'meter' } },
  { id:'harbor',   cat:'professional', layout:'sidebar',  name:{ar:'هاربر',    en:'Harbor'},
    o:{ sideFill:'line', photo:'square', head:'top', title:'ruleShort', skills:'text' } },
  { id:'ledger',   cat:'professional', layout:'stack',    name:{ar:'ليدجر',    en:'Ledger'},
    o:{ photo:'none', head:'left-rule', title:'sideRule', skills:'text', serif:true } },

  // ── CREATIVE ──────────────────────────────────────────────
  { id:'ember',    cat:'creative',     layout:'sidebar',  name:{ar:'إمبر',     en:'Ember'},
    o:{ sideFill:'gradient', photo:'circle', head:'in-side', title:'bar', skills:'meter', sideWide:true } },
  { id:'prism',    cat:'creative',     layout:'band',     name:{ar:'بريزم',    en:'Prism'},
    o:{ photo:'square', head:'band-tall', title:'numbered', skills:'tag', cols:2 } },
  { id:'orbit',    cat:'creative',     layout:'timeline', name:{ar:'أوربِت',   en:'Orbit'},
    o:{ photo:'circle', head:'centered', title:'dot', skills:'dots' } },

  // ── MINIMAL ───────────────────────────────────────────────
  { id:'linen',    cat:'minimal',      layout:'stack',    name:{ar:'لينِن',    en:'Linen'},
    o:{ photo:'none', head:'minimal', title:'caps', skills:'inline', airy:true } },
  { id:'quill',    cat:'minimal',      layout:'split',    name:{ar:'كويل',     en:'Quill'},
    o:{ photo:'none', head:'minimal', title:'plain', skills:'inline', serif:true, airy:true } }
];

const FONT_STACKS = {
  cairo:  `'Cairo','Segoe UI',sans-serif`,
  tajawal:`'Tajawal','Segoe UI',sans-serif`,
  kufi:   `'Noto Kufi Arabic','Segoe UI',sans-serif`,
  amiri:  `'Amiri','Times New Roman',serif`,
  inter:  `'Inter','Segoe UI',sans-serif`,
  georgia:`Georgia,'Amiri',serif`
};
const GOOGLE_FONTS = 'https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700;900&family=Tajawal:wght@300;400;500;700;900&family=Noto+Kufi+Arabic:wght@300;400;600;700;900&family=Amiri:wght@400;700&family=Inter:wght@300;400;500;600;700;900&display=swap';

const PAPER = { a4:{w:210,h:297}, letter:{w:216,h:279}, legal:{w:216,h:356} };
const MARGINS = { narrow:10, normal:14, wide:20 };

/* ── helpers ─────────────────────────────────────────────── */
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const has = s => s != null && String(s).trim() !== '';

/** Body text -> bullets or paragraphs. Honeybee principle:
 *  dense, conventionally formatted, scannable at a glance. */
function body(txt){
  if(!has(txt)) return '';
  const rows = String(txt).split('\n').map(l=>l.trim()).filter(Boolean);
  if(!rows.length) return '';
  const bulleted = rows.filter(l=>/^[•\-*–—]/.test(l)).length >= rows.length/2;
  if(bulleted) return `<ul class="bl">${rows.map(l=>`<li>${esc(l.replace(/^[•\-*–—]\s*/,''))}</li>`).join('')}</ul>`;
  return rows.map(l=>`<p class="pp">${esc(l)}</p>`).join('');
}
function dateRange(a,b,current,presentWord){
  const end = current ? presentWord : b;
  if(has(a) && has(end)) return `${esc(a)} — ${esc(end)}`;
  return esc(has(a)?a:(has(end)?end:''));
}
const ICONS = {
  email:'M2.5 5.5h11v8h-11z M2.5 5.5l5.5 4 5.5-4',
  phone:'M4 2.8h2.6l1.2 3-1.6 1.2a8.5 8.5 0 0 0 3.8 3.8l1.2-1.6 3 1.2v2.6c0 .6-.5 1-1.1 1A11.6 11.6 0 0 1 3 4.1c0-.6.4-1.3 1-1.3z',
  loc:'M8 1.8c2.3 0 4 1.8 4 4C12 9 8 14.2 8 14.2S4 9 4 5.8c0-2.2 1.7-4 4-4z M8 4.4a1.6 1.6 0 1 0 0 3.2 1.6 1.6 0 0 0 0-3.2z',
  link:'M6.4 9.6a3 3 0 0 0 4.2 0l2.1-2.1a3 3 0 1 0-4.2-4.2L7.4 4.4 M9.6 6.4a3 3 0 0 0-4.2 0L3.3 8.5a3 3 0 1 0 4.2 4.2l1.1-1.1',
  web:'M8 1.6a6.4 6.4 0 1 0 0 12.8A6.4 6.4 0 0 0 8 1.6z M1.6 8h12.8 M8 1.6c1.7 1.8 2.6 4 2.6 6.4S9.7 12.6 8 14.4C6.3 12.6 5.4 10.4 5.4 8S6.3 3.4 8 1.6z',
  cal:'M3 4h10v9.5H3z M3 6.8h10 M5.6 2.5v2.4 M10.4 2.5v2.4',
  user:'M8 3.2a2.6 2.6 0 1 0 0 5.2 2.6 2.6 0 0 0 0-5.2z M2.8 14c.5-3 2.6-4.4 5.2-4.4S12.7 11 13.2 14'
};
const ic = k => `<svg class="ci" viewBox="0 0 16 16" aria-hidden="true"><path d="${ICONS[k]}"/></svg>`;

/* ── normalize any item type into one generic "entry" ────── */
function toEntry(type, it, T){
  const P = T.present;
  switch(type){
    case 'experience': return { head:it.position, sub:[it.company,it.location].filter(has).join(' · '),
      meta:dateRange(it.start,it.end,it.current,P), desc:it.desc };
    case 'education':  return { head:it.degree, sub:[it.school,it.location].filter(has).join(' · '),
      meta:dateRange(it.start,it.end,it.current,P),
      desc:[has(it.grade)?`${T.f_grade}: ${it.grade}`:'',it.desc].filter(has).join('\n') };
    case 'projects':   return { head:it.name, sub:[it.role,it.link].filter(has).join(' · '), meta:it.date, desc:it.desc };
    case 'certifications': return { head:it.name, sub:it.issuer, meta:it.date,
      desc:[has(it.credId)?`${T.f_credId}: ${it.credId}`:''].filter(has).join('\n') };
    case 'awards':     return { head:it.name, sub:it.issuer, meta:it.date, desc:it.desc };
    case 'volunteer':  return { head:it.role, sub:[it.org,it.location].filter(has).join(' · '),
      meta:dateRange(it.start,it.end,it.current,P), desc:it.desc };
    case 'publications': return { head:it.name, sub:it.issuer, meta:it.date, desc:it.desc };
    case 'references': return { head:it.name, sub:[it.position,it.company].filter(has).join(' · '),
      meta:'', desc:[it.email,it.phone].filter(has).join('\n') };
    default:           return { head:it.title, sub:it.subtitle, meta:it.date, desc:it.desc };
  }
}

/* ── the small block vocabulary ──────────────────────────── */
function blockEntries(sec, T, o){
  const rows = (sec.items||[]).map((it,i)=>{
    const e = toEntry(sec.type,it,T);
    if(![e.head,e.sub,e.meta,e.desc].some(has)) return '';
    const metaTop = o.metaTop;
    return `<div class="en${o.tl?' en-tl':''}">
      ${o.tl?'<i class="tl-dot"></i>':''}
      ${metaTop && has(e.meta) ? `<div class="en-meta t">${esc(e.meta)}</div>`:''}
      <div class="en-top">
        <div class="en-l">
          ${has(e.head)?`<h4 class="en-h">${esc(e.head)}</h4>`:''}
          ${has(e.sub)?`<div class="en-s">${esc(e.sub)}</div>`:''}
        </div>
        ${!metaTop && has(e.meta)?`<div class="en-meta">${esc(e.meta)}</div>`:''}
      </div>
      ${body(e.desc)}
    </div>`;
  }).join('');
  return rows;
}
function blockSkills(sec, style){
  const items = (sec.items||[]).filter(x=>has(x.name));
  if(!items.length) return '';
  switch(style){
    case 'meter': return `<div class="mtrs">${items.map(s=>`
      <div class="mtr"><span class="mtr-n">${esc(s.name)}</span>
      <span class="mtr-t"><i style="width:${Math.max(4,Math.min(100,+s.level||70))}%"></i></span></div>`).join('')}</div>`;
    case 'dots': return `<div class="mtrs">${items.map(s=>{
      const n = Math.round((Math.max(0,Math.min(100,+s.level||70))/100)*5);
      return `<div class="dts"><span class="mtr-n">${esc(s.name)}</span><span class="dts-r">${
        Array.from({length:5},(_,i)=>`<i class="${i<n?'on':''}"></i>`).join('')}</span></div>`;}).join('')}</div>`;
    case 'tag': return `<div class="tags">${items.map(s=>`<span class="tag">${esc(s.name)}</span>`).join('')}</div>`;
    case 'inline': return `<p class="inl">${items.map(s=>esc(s.name)).join(' · ')}</p>`;
    default: return `<ul class="sl">${items.map(s=>`<li>${esc(s.name)}</li>`).join('')}</ul>`;
  }
}
function blockLangs(sec, style){
  const items = (sec.items||[]).filter(x=>has(x.name));
  if(!items.length) return '';
  if(style==='meter'||style==='dots'){
    return `<div class="mtrs">${items.map(l=>{
      const pct = {native:100,fluent:92,advanced:78,intermediate:60,basic:38}[l.level] ?? 70;
      if(style==='dots'){ const n=Math.round(pct/20);
        return `<div class="dts"><span class="mtr-n">${esc(l.name)}</span><span class="dts-r">${
          Array.from({length:5},(_,i)=>`<i class="${i<n?'on':''}"></i>`).join('')}</span></div>`; }
      return `<div class="mtr"><span class="mtr-n">${esc(l.name)}</span><span class="mtr-t"><i style="width:${pct}%"></i></span></div>`;
    }).join('')}</div>`;
  }
  return `<ul class="sl">${items.map(l=>`<li><b>${esc(l.name)}</b>${has(l.levelLabel)?` — <span class="mut">${esc(l.levelLabel)}</span>`:''}</li>`).join('')}</ul>`;
}
function blockTags(sec){
  const items=(sec.items||[]).filter(x=>has(x.name));
  return items.length?`<div class="tags">${items.map(x=>`<span class="tag">${esc(x.name)}</span>`).join('')}</div>`:'';
}
function blockRefs(sec,T){
  const items=(sec.items||[]).filter(x=>has(x.name));
  if(!items.length) return '';
  return `<div class="refs">${items.map(r=>`<div class="ref">
    <b>${esc(r.name)}</b>
    ${has(r.position)||has(r.company)?`<span>${esc([r.position,r.company].filter(has).join(' · '))}</span>`:''}
    ${has(r.email)?`<span class="mut">${esc(r.email)}</span>`:''}
    ${has(r.phone)?`<span class="mut">${esc(r.phone)}</span>`:''}
  </div>`).join('')}</div>`;
}

function sectionInner(sec, T, o){
  switch(sec.type){
    case 'skills':    return blockSkills(sec, o.skills);
    case 'languages': return blockLangs(sec, o.skills==='meter'?'meter':(o.skills==='dots'?'dots':'text'));
    case 'interests': return blockTags(sec);
    case 'references':return blockRefs(sec,T);
    default:          return blockEntries(sec,T,o);
  }
}
/** A section's heading is a custom title if the user renamed it,
 *  otherwise the translation of its key in the CURRENT language. */
const headingOf = (sec, T) => sec.title || T[sec.titleKey] || '';

function sectionHTML(sec, T, o, idx){
  const inner = sectionInner(sec, T, o);
  if(!inner) return '';
  const num = o.title==='numbered' ? `<i class="sn">${String(idx+1).padStart(2,'0')}</i>` : '';
  return `<section class="sec sec-${sec.type}">
    <h3 class="st">${num}<span>${esc(headingOf(sec,T))}</span></h3>
    <div class="sb">${inner}</div>
  </section>`;
}
function sectionIsEmpty(sec){
  if(!sec.visible) return true;
  const items = sec.items||[];
  return !items.some(it => Object.entries(it).some(([k,v]) => k!=='id' && k!=='current' && has(v)));
}

/* ── contact strip ───────────────────────────────────────── */
function contactBits(p, o, stacked){
  const bits=[];
  const add=(k,v)=>{ if(has(v)) bits.push(`<span class="cb">${o.showIcons?ic(k):''}<span>${esc(v)}</span></span>`); };
  add('email',p.email); add('phone',p.phone);
  add('loc',[p.address,p.city,p.country].filter(has).join(', '));
  add('link',p.linkedin); add('web',p.website);
  if(!bits.length) return '';
  return `<div class="cts${stacked?' st':''}">${bits.join('')}</div>`;
}
function extraFacts(p,T){
  const rows=[[T.f_dob,p.dob],[T.f_nationality,p.nationality],[T.f_maritalStatus,p.maritalLabel],[T.f_gender,p.genderLabel]]
    .filter(r=>has(r[1]));
  if(!rows.length) return '';
  return `<div class="facts">${rows.map(r=>`<div class="fact"><b>${esc(r[0])}</b><span>${esc(r[1])}</span></div>`).join('')}</div>`;
}

/* ── CSS generator (one genome, expressed differently) ─────
   `shadow` mode targets a .doc element inside a shadow root instead of a
   whole document: no @import (the host page already carries the fonts),
   no @page, and the body-level rules land on .doc. Same genome, expressed
   into a different container — which is the whole point of the engine. */
function buildCSS(tpl, s, accent, dir, shadow){
  const ROOT = shadow ? '.doc' : ':root';
  const BODY = shadow ? '.doc' : 'body';
  const o = tpl.o, P = PAPER[s.paper]||PAPER.a4, M = MARGINS[s.margin] ?? 14;
  const fs = +s.fontSize||10.2, lh = +s.lineHeight||1.55;
  const nameSz = +s.nameSize||26, headSz = +s.headingSize||11.6;
  const gap = +s.sectionGap||14;
  const font = FONT_STACKS[s.fontFamily] || FONT_STACKS.cairo;
  const dark = o.bandDark;
  const sideW = o.sideWide ? 38 : 34;

  const titleCSS = {
    bar:`.st{background:var(--a);color:#fff;padding:4px 9px;border-radius:3px}`,
    pill:`.st{display:inline-flex;background:color-mix(in srgb,var(--a) 13%,#fff);color:var(--a);padding:4px 12px;border-radius:99px}`,
    chip:`.st{color:var(--a);border-inline-start:4px solid var(--a);padding-inline-start:8px}`,
    underline:`.st{color:var(--a);border-bottom:2px solid var(--a);padding-bottom:3px}`,
    ruleFull:`.st{color:var(--ink);border-bottom:1px solid var(--ln);padding-bottom:4px;letter-spacing:.14em}`,
    ruleShort:`.st{color:var(--a)}.st::after{content:"";display:block;width:34px;height:2.5px;background:var(--a);margin-top:4px;border-radius:2px}`,
    sideRule:`.st{color:var(--ink);border-inline-start:3px solid var(--a);padding-inline-start:8px}`,
    block:`.st{background:color-mix(in srgb,var(--a) 10%,#fff);color:var(--a);padding:4px 8px;border-inline-start:3px solid var(--a)}`,
    caps:`.st{color:var(--mut);letter-spacing:.24em;font-weight:700}`,
    plain:`.st{color:var(--ink)}`,
    dot:`.st{color:var(--a);display:flex;align-items:center;gap:7px}.st::before{content:"";width:7px;height:7px;border-radius:50%;background:var(--a);flex:none}`,
    numbered:`.st{color:var(--ink);display:flex;align-items:baseline;gap:8px}.sn{font-style:normal;color:var(--a);font-size:.86em;font-weight:900;opacity:.8}`
  }[o.title] || `.st{color:var(--a)}`;

  return `
${shadow ? '' : `@import url('${GOOGLE_FONTS}');`}
*{box-sizing:border-box;margin:0;padding:0}
${ROOT}{
  --a:${accent};
  --a-soft:color-mix(in srgb,${accent} 12%,#fff);
  --a-mid:color-mix(in srgb,${accent} 55%,#fff);
  --ink:#16181f; --mut:#5d6270; --ln:#e2e4ec; --pg:#fff;
}
html{-webkit-print-color-adjust:exact;print-color-adjust:exact}
${BODY}{
  font-family:${font};
  font-size:${fs}pt; line-height:${lh}; color:var(--ink);
  background:var(--pg); width:${P.w}mm; min-height:${P.h}mm;
  direction:${dir}; text-align:${dir==='rtl'?'right':'left'};
  overflow-wrap:break-word;
}
${shadow ? '' : `@page{size:${P.w}mm ${P.h}mm;margin:0}`}
.doc{min-height:${P.h}mm;display:flex;flex-direction:column}
.pad{padding:${M}mm}
img{max-width:100%;display:block}
h1,h2,h3,h4{font-weight:800;line-height:1.25}
a{color:inherit;text-decoration:none}

/* ── header ── */
.hd{display:flex;align-items:center;gap:${M*0.7}mm}
.hd-txt{flex:1;min-width:0}
.nm{font-size:${nameSz}pt;font-weight:900;line-height:1.1;letter-spacing:-.01em}
.jt{font-size:${fs*1.18}pt;color:var(--a);font-weight:700;margin-top:2px;letter-spacing:.02em}
.hd-c .nm,.hd-c .jt{text-align:center}
.ph{flex:none;object-fit:cover;background:var(--a-soft)}
.ph-circle{width:26mm;height:26mm;border-radius:50%}
.ph-square{width:26mm;height:30mm;border-radius:2.5mm}
.ph-sm{width:22mm;height:22mm;border-radius:50%}

/* ── contact ── */
.cts{display:flex;flex-wrap:wrap;gap:2.5mm 5mm;margin-top:3mm;font-size:${fs*0.92}pt;color:var(--mut)}
.cts.st{flex-direction:column;gap:2mm}
.cb{display:flex;align-items:center;gap:1.6mm;min-width:0}
.ci{width:${fs*1.02}pt;height:${fs*1.02}pt;flex:none;fill:none;stroke:currentColor;stroke-width:1.35;stroke-linecap:round;stroke-linejoin:round;opacity:.9}
.facts{display:flex;flex-wrap:wrap;gap:2mm 6mm;margin:2.5mm 0 ${gap*0.22}mm;font-size:${fs*0.9}pt}
.fact b{color:var(--mut);font-weight:600}
.fact span{margin-inline-start:1.5mm}
/* in a narrow sidebar the facts must stack, or they run into the next heading */
.side .facts{flex-direction:column;gap:1.3mm;margin-bottom:${gap*0.3}mm}

/* ── sections ── */
.sec{margin-bottom:${gap*0.35}mm;break-inside:avoid-page}
.sec:last-child{margin-bottom:0}
.st{
  font-size:${headSz}pt;font-weight:800;margin-bottom:${gap*0.20}mm;
  ${o.upper?'text-transform:uppercase;':''}letter-spacing:.05em;
}
${titleCSS}
.sb{}
.en{margin-bottom:${gap*0.24}mm;break-inside:avoid}
.en:last-child{margin-bottom:0}
.en-top{display:flex;align-items:baseline;gap:3mm}
.en-l{flex:1;min-width:0}
.en-h{font-size:${fs*1.06}pt;font-weight:800}
.en-s{font-size:${fs*0.97}pt;color:var(--a);font-weight:600;margin-top:.4mm}
.en-meta{font-size:${fs*0.87}pt;color:var(--mut);font-weight:600;white-space:nowrap;flex:none}
.en-meta.t{margin-bottom:.8mm;color:var(--a);opacity:.85}
.pp{font-size:${fs*0.97}pt;color:var(--mut);margin-top:1.1mm}
.bl{margin-top:1.1mm;padding-inline-start:4.2mm;font-size:${fs*0.97}pt;color:var(--mut)}
.bl li{margin-bottom:.7mm}
.bl li::marker{color:var(--a)}
.mut{color:var(--mut)}

/* ── skill blocks ── */
.mtrs{display:flex;flex-direction:column;gap:1.8mm}
.mtr-n{font-size:${fs*0.97}pt;font-weight:600;display:block;margin-bottom:.9mm}
.mtr-t{display:block;height:1.5mm;border-radius:99px;background:color-mix(in srgb,var(--a) 18%,#fff);overflow:hidden}
.mtr-t i{display:block;height:100%;background:var(--a);border-radius:99px}
.dts{display:flex;align-items:center;justify-content:space-between;gap:3mm}
.dts .mtr-n{margin:0}
.dts-r{display:flex;gap:1mm;flex:none}
.dts-r i{width:1.9mm;height:1.9mm;border-radius:50%;background:color-mix(in srgb,var(--a) 22%,#fff)}
.dts-r i.on{background:var(--a)}
.tags{display:flex;flex-wrap:wrap;gap:1.6mm}
.tag{font-size:${fs*0.9}pt;font-weight:600;padding:.9mm 2.6mm;border-radius:99px;background:var(--a-soft);color:var(--a)}
.sl{list-style:none;display:flex;flex-direction:column;gap:1.1mm;font-size:${fs*0.97}pt}
.sl li{display:flex;align-items:baseline;gap:1.8mm}
.sl li::before{content:"";width:1.4mm;height:1.4mm;border-radius:50%;background:var(--a);flex:none;transform:translateY(-.3mm)}
.inl{font-size:${fs*0.97}pt;color:var(--mut);line-height:1.9}
.refs{display:grid;grid-template-columns:1fr 1fr;gap:3mm}
.ref{display:flex;flex-direction:column;gap:.3mm;font-size:${fs*0.93}pt}
.ref b{font-size:${fs*1.02}pt}
.ref span:nth-child(2){color:var(--a);font-weight:600}

/* ── layouts ── */
.row{display:flex;flex:1;min-height:0}
.side{width:${sideW}%;flex:none;padding:${M}mm ${M*0.72}mm}
.main{flex:1;min-width:0;padding:${M}mm}
.side .st{font-size:${headSz*0.95}pt}
.cols{display:grid;grid-template-columns:1fr 1fr;gap:0 ${M*0.8}mm}
.band{padding:${M*0.85}mm ${M}mm;background:var(--a);color:#fff}
.band .jt,.band .cb,.band .ci,.band .cts{color:rgba(255,255,255,.93)}
.band .jt{color:#fff;opacity:.92}
${dark?`.band{background:linear-gradient(115deg,#1c2033,color-mix(in srgb,${accent} 62%,#1c2033))}`:''}
.tl{position:relative;padding-inline-start:6mm}
.tl::before{content:"";position:absolute;inset-block:1.4mm 1mm;inset-inline-start:1.35mm;width:.45mm;background:color-mix(in srgb,var(--a) 30%,#fff)}
.en-tl{position:relative}
.tl-dot{position:absolute;inset-inline-start:-6mm;top:1.4mm;width:3.1mm;height:3.1mm;border-radius:50%;background:var(--a);box-shadow:0 0 0 1.1mm color-mix(in srgb,var(--a) 16%,#fff)}
.divider{height:.35mm;background:var(--ln);margin:${gap*0.3}mm 0}
.obj{font-size:${fs*0.99}pt;color:var(--mut);line-height:${lh+0.1}}
${o.airy?`.sec{margin-bottom:${gap*0.45}mm}.st{margin-bottom:${gap*0.26}mm}`:''}
${o.dense?`.sec{margin-bottom:${gap*0.28}mm}`:''}
`;
}

/* ── the render function: data -> appearance ───────────────
   Returns the pieces (css + markup) so the same paint can be poured into
   a whole document (preview / print / export) or a shadow root (thumbnails). */
function buildCVParts(data, tplId, T, shadow){
  const tpl = TEMPLATES.find(x=>x.id===tplId) || TEMPLATES[0];
  const o = { ...tpl.o, showIcons:data.settings.showIcons, upper:data.settings.upper, title:tpl.o.title, metaTop:false };
  const s = data.settings;
  const dir = data.docDir || 'rtl';
  const accent = data.accent || '#2563eb';
  const p = { ...data.personal };
  p.maritalLabel = p.maritalStatus ? T['ms_'+p.maritalStatus] : '';
  p.genderLabel  = p.gender ? T['g_'+p.gender] : '';

  const showPhoto = s.showPhoto && data.photo && o.photo !== 'none';
  const photoCls  = o.photo==='circle' ? 'ph-circle' : 'ph-square';
  const photoTag  = cls => showPhoto ? `<img class="ph ${cls||photoCls}" src="${data.photo}" alt="">` : '';

  const secs = (data.sections||[]).filter(sc=>!sectionIsEmpty(sc));
  const objSec = has(data.objective)
    ? `<section class="sec"><h3 class="st">${o.title==='numbered'?'<i class="sn">01</i>':''}<span>${esc(data.objectiveTitle||T.sec_objective)}</span></h3><div class="sb"><p class="obj">${esc(data.objective).replace(/\n/g,'<br>')}</p></div></section>`
    : '';

  const SIDE_TYPES = ['skills','languages','interests','certifications','references','awards'];
  const nameBlock = (centered)=>`
    <div class="hd-txt${centered?' hd-c':''}">
      ${has(p.fullName)?`<h1 class="nm">${esc(p.fullName)}</h1>`:''}
      ${has(p.jobTitle)?`<div class="jt">${esc(p.jobTitle)}</div>`:''}
    </div>`;

  let inner = '';

  /* ── SIDEBAR ── */
  if(tpl.layout==='sidebar'){
    const sideSecs = secs.filter(sc=>SIDE_TYPES.includes(sc.type));
    const mainSecs = secs.filter(sc=>!SIDE_TYPES.includes(sc.type));
    const fill = o.sideFill==='solid'
        ? `background:${accent};--ink:#fff;--mut:rgba(255,255,255,.86);--ln:rgba(255,255,255,.25)`
      : o.sideFill==='gradient'
        ? `background:linear-gradient(158deg,color-mix(in srgb,${accent} 88%,#fff) 0%,${accent} 42%,color-mix(in srgb,${accent} 34%,#0c0f20) 100%);--ink:#fff;--mut:rgba(255,255,255,.86);--ln:rgba(255,255,255,.25)`
      : o.sideFill==='tint'
        ? `background:color-mix(in srgb,${accent} 8%,#fff)`
        : `background:#fff;border-inline-end:.4mm solid var(--ln)`;
    const onFill = o.sideFill==='solid'||o.sideFill==='gradient';
    const sideStyle = onFill
      ? `<style>.side .st{background:rgba(255,255,255,.16);color:#fff}.side .st::after{background:#fff}.side .mtr-t{background:rgba(255,255,255,.26)}.side .mtr-t i{background:#fff}.side .dts-r i{background:rgba(255,255,255,.3)}.side .dts-r i.on{background:#fff}.side .tag{background:rgba(255,255,255,.18);color:#fff}.side .sl li::before{background:#fff}.side .en-s,.side .ref span:nth-child(2){color:rgba(255,255,255,.9)}.side .bl li::marker{color:#fff}.side .refs{grid-template-columns:1fr}</style>`
      : `<style>.side .refs{grid-template-columns:1fr}</style>`;

    const sideHead = o.head==='in-side' ? `
      <div style="text-align:center;margin-bottom:${(MARGINS[s.margin]??14)*0.6}mm">
        ${showPhoto?`<img class="ph ${photoCls}" src="${data.photo}" alt="" style="margin:0 auto 3mm">`:''}
        ${has(p.fullName)?`<h1 class="nm" style="font-size:${(+s.nameSize||26)*0.74}pt">${esc(p.fullName)}</h1>`:''}
        ${has(p.jobTitle)?`<div class="jt" style="${onFill?'color:rgba(255,255,255,.9)':''}">${esc(p.jobTitle)}</div>`:''}
      </div>` : '';

    const topHead = o.head==='top' ? `
      <div class="pad" style="padding-bottom:0">
        <div class="hd">
          ${photoTag()}
          ${nameBlock(false)}
        </div>
        ${extraFacts(p,T)}
      </div>` : '';

    inner = `${sideStyle}
      ${topHead}
      <div class="row" ${o.sideEnd?'style="flex-direction:row-reverse"':''}>
        <aside class="side" style="${fill}">
          ${sideHead}
          ${contactBits(p,o,true)?`<section class="sec"><h3 class="st"><span>${esc(T.f_contact||(LANG==='ar'?'التواصل':'Contact'))}</span></h3><div class="sb">${contactBits(p,o,true)}</div></section>`:''}
          ${o.head==='in-side'?extraFacts(p,T):''}
          ${sideSecs.map((sc,i)=>sectionHTML(sc,T,o,i)).join('')}
        </aside>
        <div class="main">
          ${objSec}
          ${mainSecs.map((sc,i)=>sectionHTML(sc,T,o,i+1)).join('')}
        </div>
      </div>`;
  }

  /* ── BAND ── */
  else if(tpl.layout==='band'){
    const tall = o.head==='band-tall';
    const split = o.head==='band-split';
    const bandInner = split ? `
      <div class="hd">
        ${photoTag('ph-sm')}
        ${nameBlock(false)}
        <div style="flex:none;max-width:46%">${contactBits(p,o,true)}</div>
      </div>` : `
      <div class="hd${tall?'':''}" style="${tall?'flex-direction:column;text-align:center;gap:3mm':''}">
        ${photoTag(tall?'ph-circle':'ph-circle')}
        ${nameBlock(tall)}
      </div>
      ${contactBits(p,o,false)}`;
    const colSecs = secs;
    const half = Math.ceil(colSecs.length/2);
    const layoutBody = o.cols===2 ? `
      <div class="cols">
        <div>${objSec}${colSecs.slice(0,half).map((sc,i)=>sectionHTML(sc,T,o,i+1)).join('')}</div>
        <div>${colSecs.slice(half).map((sc,i)=>sectionHTML(sc,T,o,i+half+1)).join('')}</div>
      </div>`
      : `${objSec}${colSecs.map((sc,i)=>sectionHTML(sc,T,o,i+1)).join('')}`;
    inner = `<header class="band" style="${tall?'padding-block:'+((MARGINS[s.margin]??14)*1.3)+'mm':''}">${bandInner}</header>
      <div class="pad">${extraFacts(p,T)}${layoutBody}</div>`;
  }

  /* ── SPLIT (two equal columns) ── */
  else if(tpl.layout==='split'){
    const left = secs.filter(sc=>!SIDE_TYPES.includes(sc.type));
    const right= secs.filter(sc=>SIDE_TYPES.includes(sc.type));
    inner = `<div class="pad">
      <div class="hd">${photoTag()}${nameBlock(o.head==='minimal')}</div>
      ${contactBits(p,o,false)}
      ${extraFacts(p,T)}
      <div class="divider"></div>
      ${objSec}
      <div class="cols">
        <div>${left.map((sc,i)=>sectionHTML(sc,T,o,i+1)).join('')}</div>
        <div>${right.map((sc,i)=>sectionHTML(sc,T,o,i+left.length+1)).join('')}</div>
      </div>
    </div>`;
  }

  /* ── TIMELINE ── */
  else if(tpl.layout==='timeline'){
    const tlTypes=['experience','education','projects','volunteer'];
    inner = `<div class="pad">
      <div class="hd" style="flex-direction:column;text-align:center;gap:3mm">
        ${photoTag()}${nameBlock(true)}
      </div>
      <div style="display:flex;justify-content:center">${contactBits(p,o,false)}</div>
      <div class="divider"></div>
      ${objSec}
      ${secs.map((sc,i)=>{
        const isTl = tlTypes.includes(sc.type);
        const h = sectionHTML(sc,T,{...o,tl:isTl,metaTop:isTl},i+1);
        return isTl ? h.replace('<div class="sb">','<div class="sb tl">') : h;
      }).join('')}
    </div>`;
  }

  /* ── STACK ── */
  else {
    let head;
    if(o.head==='centered'){
      head = `<div style="text-align:center">${nameBlock(true)}</div>
        <div style="display:flex;justify-content:center">${contactBits(p,o,false)}</div>`;
    } else if(o.head==='minimal'){
      head = `${nameBlock(false)}${contactBits(p,o,false)}`;
    } else if(o.head==='left-rule'){
      head = `<div style="border-inline-start:1.1mm solid ${accent};padding-inline-start:4mm">
        ${nameBlock(false)}${contactBits(p,o,false)}</div>`;
    } else {
      head = `<div class="hd">${photoTag(o.photo==='right'?'ph-square':'')}${nameBlock(false)}</div>
        ${contactBits(p,o,false)}`;
    }
    if(o.photo==='right' && o.head==='row'){
      head = `<div class="hd" style="flex-direction:row-reverse">${photoTag('ph-square')}
        <div style="flex:1">${nameBlock(false)}${contactBits(p,o,false)}</div></div>`;
    }
    inner = `<div class="pad">
      ${head}
      ${extraFacts(p,T)}
      <div class="divider"></div>
      ${objSec}
      ${secs.map((sc,i)=>sectionHTML(sc,T,o,i+1)).join('')}
    </div>`;
  }

  return { css: buildCSS(tpl, s, accent, dir, shadow), inner, dir, name: p.fullName || 'CV' };
}

/** Full standalone document — used by preview, print and HTML export. */
function renderCV(data, tplId, T){
  const { css, inner, dir, name } = buildCVParts(data, tplId, T, false);
  return `<!DOCTYPE html><html lang="${LANG}" dir="${dir}"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(name)}</title>
<style>${css}</style></head>
<body><div class="doc">${inner}</div></body></html>`;
}

/** Shadow-root payload — used by the live template thumbnails. */
function renderCVShadow(data, tplId, T){
  const { css, inner, dir } = buildCVParts(data, tplId, T, true);
  return `<style>${css}
    .cv-scale{width:${PAPER[data.settings.paper]?.w ?? 210}mm;
      transform-origin:top ${dir==='rtl'?'right':'left'};will-change:transform}
  </style><div class="cv-scale"><div class="doc">${inner}</div></div>`;
}

/* ── thumbnail: an abstract of the same genome ───────────── */
function templateThumb(tpl, accent){
  const o=tpl.o, A=accent, W=100, H=141;
  const g=(x,y,w,h,f,r=0)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${f}"/>`;
  const L=(x,y,w,c='#d7dae6',h=2.2)=>g(x,y,w,h,c,1);
  let s=`<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">${g(0,0,W,H,'#fff')}`;
  const lines=(x,y,w,n,step=5)=>{let r='';for(let i=0;i<n;i++)r+=L(x,y+i*step,w*(i%3===2?.62:1));return r;};

  if(tpl.layout==='sidebar'){
    const sw=o.sideWide?38:34, sx=o.sideEnd?W-sw:0, mx=o.sideEnd?0:sw;
    const fill=o.sideFill==='solid'?A:o.sideFill==='gradient'?A:o.sideFill==='tint'?`${A}1f`:'#f4f5fa';
    s+=g(sx,0,sw,H,fill);
    if(o.sideFill==='gradient') s+=g(sx,0,sw,H,'#0b0e2033');
    const light=(o.sideFill==='solid'||o.sideFill==='gradient');
    const lc=light?'#ffffffcc':'#c9cddd';
    if(o.head==='in-side'){
      s+= o.photo==='circle'?`<circle cx="${sx+sw/2}" cy="20" r="10" fill="${light?'#ffffff59':A+'55'}"/>`
        : g(sx+sw/2-9,10,18,21,light?'#ffffff59':A+'55',2);
      s+=L(sx+7,36,sw-14,lc,3)+L(sx+11,42,sw-22,lc,2);
      s+=lines(sx+7,52,sw-14,4,4.6).replace(/#d7dae6/g,lc);
      s+=g(sx+7,72,sw-14,3.4,lc,1)+lines(sx+7,80,sw-14,5,4.6).replace(/#d7dae6/g,lc);
      s+=lines(mx+9,12,W-sw-18,3,5)+g(mx+9,32,26,3.4,A,1)+lines(mx+9,40,W-sw-18,5,5)
        +g(mx+9,72,26,3.4,A,1)+lines(mx+9,80,W-sw-18,6,5);
    }else{
      s+=g(0,0,W,26,'#fff');
      if(o.photo!=='none') s+=g(8,6,15,17,A+'40',2);
      s+=L(o.photo!=='none'?27:8,9,40,'#2a2d3c',4)+L(o.photo!=='none'?27:8,16,28,A,2.6);
      s+=g(sx,26,sw,H-26,fill);
      s+=g(sx+6,34,sw-12,3.2,lc,1)+lines(sx+6,42,sw-12,4,4.6).replace(/#d7dae6/g,lc);
      s+=g(sx+6,66,sw-12,3.2,lc,1)+lines(sx+6,74,sw-12,5,4.6).replace(/#d7dae6/g,lc);
      s+=g(mx+8,34,24,3.2,A,1)+lines(mx+8,42,W-sw-16,5,5)+g(mx+8,72,24,3.2,A,1)+lines(mx+8,80,W-sw-16,6,5);
    }
  }
  else if(tpl.layout==='band'){
    const bh=o.head==='band-tall'?46:o.head==='band-split'?30:38;
    s+=g(0,0,W,bh,o.bandDark?'#1c2033':A);
    if(o.bandDark) s+=g(0,0,W,bh,A+'66');
    if(o.head==='band-tall'){s+=`<circle cx="${W/2}" cy="14" r="8" fill="#ffffff59"/>`+L(W/2-20,27,40,'#fff',3.4)+L(W/2-12,34,24,'#ffffffaa',2.4);}
    else if(o.head==='band-split'){s+=`<circle cx="14" cy="15" r="7.5" fill="#ffffff59"/>`+L(26,10,32,'#fff',3.4)+L(26,17,22,'#ffffffaa',2.4)+lines(66,9,26,3,4.5).replace(/#d7dae6/g,'#ffffff88');}
    else{s+=`<circle cx="15" cy="15" r="9" fill="#ffffff59"/>`+L(29,10,38,'#fff',3.6)+L(29,18,26,'#ffffffaa',2.4)+lines(8,28,84,1,4).replace(/#d7dae6/g,'#ffffff88');}
    const y0=bh+8;
    if(o.cols===2){
      s+=g(8,y0,22,3.2,A,1)+lines(8,y0+7,38,5,5)+g(8,y0+38,22,3.2,A,1)+lines(8,y0+45,38,6,5);
      s+=g(54,y0,22,3.2,A,1)+lines(54,y0+7,38,4,5)+g(54,y0+32,22,3.2,A,1)+lines(54,y0+39,38,5,5);
    }else{ s+=g(8,y0,26,3.2,A,1)+lines(8,y0+7,84,6,5)+g(8,y0+44,26,3.2,A,1)+lines(8,y0+51,84,7,5); }
  }
  else if(tpl.layout==='split'){
    if(o.photo!=='none') s+=g(8,8,14,17,A+'40',2);
    const tx=o.photo!=='none'?26:8;
    s+=L(tx,11,38,'#2a2d3c',4)+L(tx,18,26,A,2.6)+lines(8,30,84,1,4);
    s+=L(8,38,84,'#e6e8f0',1);
    s+=g(8,46,22,3,A,1)+lines(8,53,38,6,5)+g(8,88,22,3,A,1)+lines(8,95,38,5,5);
    s+=g(54,46,22,3,A,1)+lines(54,53,38,4,5)+g(54,78,22,3,A,1)+lines(54,85,38,6,5);
  }
  else if(tpl.layout==='timeline'){
    s+=`<circle cx="${W/2}" cy="16" r="9" fill="${A}40"/>`+L(W/2-19,29,38,'#2a2d3c',3.6)+L(W/2-12,36,24,A,2.4);
    s+=L(8,46,84,'#e6e8f0',1);
    s+=g(8,54,24,3.2,A,1);
    s+=g(11,62,1,66,A+'44');
    [64,84,104].forEach(y=>{ s+=`<circle cx="11.5" cy="${y+1}" r="3" fill="${A}"/>`+L(18,y,50)+L(18,y+6,68,'#e2e4ec')+L(18,y+11,60,'#e2e4ec'); });
  }
  else{ /* stack */
    if(o.head==='centered'){ s+=L(W/2-20,12,40,'#2a2d3c',4.2)+L(W/2-13,20,26,A,2.6)+lines(14,29,72,1,4); }
    else if(o.head==='left-rule'){ s+=g(8,9,1.6,18,A)+L(13,11,40,'#2a2d3c',4.2)+L(13,19,26,A,2.6)+lines(13,28,60,1,4); }
    else if(o.photo==='right'){ s+=g(W-24,8,16,19,A+'40',2)+L(8,11,42,'#2a2d3c',4.2)+L(8,19,28,A,2.6)+lines(8,28,52,1,4); }
    else { s+=L(8,11,44,'#2a2d3c',4.2)+L(8,19,28,A,2.6)+lines(8,28,60,1,4); }
    s+=L(8,38,84,'#e6e8f0',1);
    const tc = o.title==='caps'?'#b9bdd0':A;
    s+=g(8,46,26,3,tc,1)+lines(8,53,84,4,5)+g(8,78,26,3,tc,1)+lines(8,85,84,5,5)+g(8,115,26,3,tc,1)+lines(8,122,84,3,5);
  }
  return s+'</svg>';
}
