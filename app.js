const STORAGE_KEY='ligaEsteOwned_v2';
const LEGACY_KEY='ligaEsteOwned';
const state={sections:[],owned:{},view:'home',section:null,filter:'all',search:'',pack:[]};
const teams=['Deportivo Alavés','Athletic Club','Atlético de Madrid','FC Barcelona','Real Betis','RC Celta','RC Deportivo de La Coruña','Elche CF','RCD Espanyol','Getafe CF','Levante UD','Real Madrid','Málaga CF','CA Osasuna','Racing de Santander','Rayo Vallecano','Real Sociedad','Sevilla FC','Valencia CF','Villarreal CF'];
const $=s=>document.querySelector(s);
const save=()=>localStorage.setItem(STORAGE_KEY,JSON.stringify(state.owned));
const uid=(section,sticker)=>`${section}::${sticker.number}::${sticker.name}`;
function prepareSections(raw){
  return raw.map(section=>({...section,stickers:section.stickers.map(sticker=>({...sticker,id:uid(section.name,sticker)}))}));
}
function loadOwned(){
  try{
    const raw=JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}');
    if(raw&&typeof raw==='object') state.owned=raw;
  }catch{state.owned={};}
  // The first PWA version used sticker.id even though checklist.json had no id.
  // That made every sticker share the same undefined key. Discard that broken state.
  if(Object.prototype.hasOwnProperty.call(state.owned,'undefined')){
    state.owned={};
    localStorage.removeItem(STORAGE_KEY);
  }
}
function total(){return state.sections.reduce((n,s)=>n+s.stickers.length,0)}
function qty(x){return Number(state.owned[x.id]||0)}
function unique(){return state.sections.reduce((n,s)=>n+s.stickers.filter(x=>qty(x)>0).length,0)}
function reps(){return state.sections.reduce((n,s)=>n+s.stickers.reduce((a,x)=>a+Math.max(0,qty(x)-1),0),0)}
function color(name){let h=0;for(const c of name)h=(h*31+c.charCodeAt(0))%360;return `hsl(${h} 70% 48%)`}
function esc(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]))}
function changeQty(id,delta){const next=Math.max(0,(state.owned[id]||0)+delta);if(next===0)delete state.owned[id];else state.owned[id]=next;save();render()}
function render(){document.title='Liga Este 26/27';let main='';if(state.view==='home')main=home();else if(state.view==='album')main=album();else if(state.view==='pack')main=pack();else main=repeats();document.querySelector('#app').innerHTML=`<div class="app">${main}</div>${nav()}`;bind()}
function hero(){const p=total()?unique()/total():0;return `<div class="hero"><div class="brand">PANINI</div><div class="title">LIGA ESTE</div><div class="season">2026 / 27</div><div class="progressRow"><div><span class="big">${Math.round(p*100)}%</span><div style="font-weight:700;opacity:.8">colección completada</div></div><b>${unique()} / ${total()}</b></div><div class="bar"><i style="width:${p*100}%"></i></div></div>`}
function home(){const byName=new Map(state.sections.map(s=>[s.name,s]));const teamSections=teams.map(name=>byName.get(name)).filter(Boolean);return `${hero()}<div class="content"><div class="stats"><div class="stat"><b>${unique()}</b><span>Cromos diferentes conseguidos</span></div><div class="stat"><b>${total()-unique()}</b><span>Me faltan</span></div><div class="stat"><b>${reps()}</b><span>Unidades repetidas</span></div><div class="stat"><b>${total()}</b><span>Total colección</span></div></div><div class="sectionTitle">Tu álbum</div><div class="teams">${teamSections.map(teamCard).join('')}</div><div class="sectionTitle">Colecciones especiales</div><div class="teams">${state.sections.filter(s=>!teams.includes(s.name)).map(teamCard).join('')}</div></div>`}
function teamCard(s){const u=s.stickers.filter(x=>qty(x)>0).length,p=s.stickers.length?u/s.stickers.length:0;return `<button class="team" data-open="${esc(s.name)}"><div class="crest" style="background:${color(s.name)}">${esc(s.name.split(' ').map(x=>x[0]).slice(0,2).join(''))}</div><div class="teamName">${esc(s.name)}</div><small>${u}/${s.stickers.length} · ${Math.round(p*100)}%</small><div class="mini"><i style="width:${p*100}%"></i></div></button>`}
function album(){const s=state.sections.find(x=>x.name===state.section);if(!s)return home();const arr=s.stickers.filter(x=>(state.search===''||`${x.name} ${x.number} ${x.section}`.toLowerCase().includes(state.search.toLowerCase()))&&(state.filter==='all'||state.filter==='missing'&&qty(x)===0||state.filter==='have'&&qty(x)>0||state.filter==='reps'&&qty(x)>1));const have=s.stickers.filter(x=>qty(x)>0).length;return `<div class="content"><div class="toolbar"><button class="back" data-home>‹</button><input class="search" id="search" value="${esc(state.search)}" placeholder="Jugador, equipo o número"></div><div class="albumHead"><b>${esc(s.name)}</b><div style="color:var(--muted);font-size:12px;margin-top:5px">${have}/${s.stickers.length} cromos · ${Math.round(have/s.stickers.length*100)}%</div></div><div class="filters">${[['all','Todos'],['missing','Me faltan'],['have','Tengo'],['reps','Repes']].map(([k,t])=>`<button class="chip ${state.filter===k?'on':''}" data-filter="${k}">${t}</button>`).join('')}</div><div class="albumGrid" style="margin-top:12px">${arr.map(sticker).join('')}</div></div>`}
function sticker(x){const q=qty(x);return `<article class="sticker ${q?'have':''}" data-card="${esc(x.id)}"><div class="num">${esc(x.number)}</div><div class="face">${esc(x.name.split(' ').map(v=>v[0]).slice(0,2).join(''))}</div><div class="sname">${esc(x.name)}</div><div class="qtyControls"><button class="qtyBtn minus" data-minus="${esc(x.id)}" aria-label="Quitar un cromo">−</button><span class="qtyValue">${q}</span><button class="qtyBtn plusBtn" data-plus="${esc(x.id)}" aria-label="Añadir un cromo">+</button></div></article>`}
function pack(){const q=state.search.toLowerCase();const arr=state.sections.flatMap(s=>s.stickers).filter(x=>!q||`${x.name} ${x.number} ${x.section}`.toLowerCase().includes(q)).slice(0,100);return `<div class="content"><div class="sectionTitle" style="margin-top:4px">Abrir un sobre</div><div class="pack"><b>Introduce los 8 cromos</b><div style="color:var(--muted);font-size:12px;margin-top:3px">Toca un cromo para añadirlo. Puedes repetirlo.</div><div class="packSlots">${Array.from({length:8},(_,i)=>`<button class="slot ${state.pack[i]?'filled':''}" data-remove-pack="${i}">${state.pack[i]?esc(state.pack[i].number+' · '+state.pack[i].name):i+1}</button>`).join('')}</div>${state.pack.length===8?'<button class="primary" id="savePack">Guardar sobre</button>':''}</div><div style="margin-top:14px"><input class="search" id="search" value="${esc(state.search)}" placeholder="Buscar jugador, equipo o número"></div><div class="list">${arr.map(x=>`<button class="row" data-pack="${esc(x.id)}"><div class="numBox">${esc(x.number)}</div><main><b>${esc(x.name)}</b><small>${esc(x.section)}</small></main><span class="plus">+</span></button>`).join('')}</div></div>`}
function repeats(){const arr=state.sections.flatMap(s=>s.stickers).filter(x=>qty(x)>1&&(!state.search||`${x.name} ${x.number} ${x.section}`.toLowerCase().includes(state.search.toLowerCase())));return `<div class="content"><div class="sectionTitle" style="margin-top:4px">Repetidos</div><input class="search" id="search" value="${esc(state.search)}" placeholder="Buscar en tus repetidos"><div class="list" style="margin-top:14px">${arr.length?arr.map(x=>`<div class="row"><div class="numBox">${esc(x.number)}</div><main><b>${esc(x.name)}</b><small>${esc(x.section)}</small></main><div class="repeatControls"><button data-minus="${esc(x.id)}" class="qtyBtn minus">−</button><strong>×${qty(x)}</strong><button data-plus="${esc(x.id)}" class="qtyBtn plusBtn">+</button></div></div>`).join(''):'<div class="empty">Todavía no tienes cromos repetidos.</div>'}</div></div>`}
function nav(){return `<nav class="nav"><button data-view="home" class="${state.view==='home'?'active':''}"><span class="ico">⌂</span>Inicio</button><button data-view="album" class="${state.view==='album'?'active':''}"><span class="ico">▦</span>Álbum</button><button data-view="pack" class="${state.view==='pack'?'active':''}"><span class="ico">▣</span>Sobre</button></nav>`}
function bind(){
 document.querySelectorAll('[data-open]').forEach(b=>b.onclick=()=>{state.section=b.dataset.open;state.view='album';state.search='';state.filter='all';render()});
 document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>{state.view=b.dataset.view;if(state.view==='album'&&!state.section)state.section=teams[0];state.search='';render()});
 document.querySelectorAll('[data-filter]').forEach(b=>b.onclick=()=>{state.filter=b.dataset.filter;render()});
 document.querySelectorAll('[data-plus]').forEach(b=>b.onclick=e=>{e.stopPropagation();changeQty(b.dataset.plus,1)});
 document.querySelectorAll('[data-minus]').forEach(b=>b.onclick=e=>{e.stopPropagation();changeQty(b.dataset.minus,-1)});
 document.querySelectorAll('[data-card]').forEach(b=>b.onclick=()=>changeQty(b.dataset.card,1));
 document.querySelectorAll('[data-pack]').forEach(b=>b.onclick=()=>{const x=state.sections.flatMap(s=>s.stickers).find(x=>x.id===b.dataset.pack);if(x&&state.pack.length<8){state.pack.push(x);render()}});
 document.querySelectorAll('[data-remove-pack]').forEach(b=>b.onclick=()=>{if(state.pack[Number(b.dataset.removePack)]){state.pack.splice(Number(b.dataset.removePack),1);render()}});
 document.querySelector('[data-home]')?.addEventListener('click',()=>{state.view='home';state.section=null;state.search='';render()});
 document.querySelectorAll('#search').forEach(i=>i.oninput=()=>{state.search=i.value;render();const el=$('#search');if(el){el.focus();el.setSelectionRange(state.search.length,state.search.length)}});
 document.querySelector('#savePack')?.addEventListener('click',()=>{state.pack.forEach(x=>state.owned[x.id]=(state.owned[x.id]||0)+1);save();state.pack=[];state.search='';alert('Sobre guardado');render()});
}
loadOwned();
fetch('checklist.json').then(r=>r.json()).then(raw=>{state.sections=prepareSections(raw);render()}).catch(()=>{document.querySelector('#app').innerHTML='<div class="empty">No se ha podido cargar la colección.</div>'});
