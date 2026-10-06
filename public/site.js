(() => {
 'use strict';
 const root=document.documentElement;
 root.classList.add('js');
 const menu=document.querySelector('#menu-toggle');
 const nav=document.querySelector('#primary-nav');
 if(menu&&nav){
  menu.hidden=false;
  const close=()=>{nav.classList.remove('is-open');menu.setAttribute('aria-expanded','false');};
  menu.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')!=='true';menu.setAttribute('aria-expanded',String(open));nav.classList.toggle('is-open',open);});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&nav.classList.contains('is-open')){close();menu.focus();}});
  nav.addEventListener('click',e=>{if(e.target.closest('a'))close();});
  document.addEventListener('click',e=>{if(!nav.contains(e.target)&&!menu.contains(e.target))close();});
  matchMedia('(min-width: 1001px)').addEventListener('change',close);
 }
 const normal=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
 let townsPromise;
 const getTowns=()=>townsPromise ||= fetch('/assets/municipios.json').then(r=>{if(!r.ok)throw Error('No disponible');return r.json();}).then(items=>items.map(x=>({...x,search:normal(`${x.name} ${x.province}`)}))).catch(e=>{townsPromise=null;throw e;});
 document.querySelectorAll('[data-town-search]').forEach(box=>{
  const input=box.querySelector('input'), results=box.querySelector('[data-results]'), status=box.querySelector('[role=status]');
  let timer,revision=0;
  const run=async()=>{
   const current=++revision, query=normal(input.value); results.replaceChildren();
   if(query.length<2){status.textContent=query?'Escribe al menos dos letras.':'';results.hidden=true;return;}
   results.hidden=false;status.textContent='Buscando municipios…';
   try {
    const all=await getTowns(); if(current!==revision)return;
    const tokens=query.split(' '), matches=all.filter(t=>tokens.every(q=>t.search.includes(q)) && (!box.dataset.province || t.provinceSlug===box.dataset.province));
    matches.sort((a,b)=>Number(normal(b.name)===query)-Number(normal(a.name)===query) || Number(normal(b.name).startsWith(query))-Number(normal(a.name).startsWith(query)) || a.name.localeCompare(b.name,'es'));
    status.textContent=matches.length?`${matches.length} coincidencias${matches.length>12?'. Mostrando las primeras 12; concreta tu búsqueda.':'.'}`:'No encontramos ese municipio. Consulta el directorio provincial o llama al 641 58 93 94.';
    for(const item of matches.slice(0,12)){
     const li=document.createElement('li'),a=document.createElement('a'),small=document.createElement('small');
     a.href=item.path;a.append(document.createTextNode(`Electricista en ${item.name}`));small.textContent=item.province;a.append(small);li.append(a);results.append(li);
    }
   } catch {if(current===revision)status.textContent='El buscador no está disponible. Los enlaces de provincias y municipios siguen funcionando.';}
  };
  input.addEventListener('input',()=>{clearTimeout(timer);++revision;timer=setTimeout(run,180);});
  input.addEventListener('keydown',e=>{if(e.key==='Escape'){clearTimeout(timer);++revision;results.replaceChildren();results.hidden=true;status.textContent='';} if(e.key==='ArrowDown'){const a=results.querySelector('a');if(a){e.preventDefault();a.focus();}}});
  box.addEventListener('submit',e=>{e.preventDefault();clearTimeout(timer);run();});
 });
 document.querySelectorAll('[data-alphabet-filter]').forEach(input=>{
  const container=document.getElementById(input.dataset.alphabetFilter),items=[...container.querySelectorAll('[data-town]')],status=document.querySelector('[data-filter-status]');
  input.addEventListener('input',()=>{const query=normal(input.value);let n=0;items.forEach(item=>{item.hidden=!normal(item.textContent).includes(query);if(!item.hidden)n++;});container.querySelectorAll('[data-letter-group]').forEach(group=>{group.hidden=![...group.querySelectorAll('[data-town]')].some(x=>!x.hidden);});if(status)status.textContent=`${n} municipios encontrados`;});
 });
 // First-party DOM events only: no analytics or personal data are transmitted.
 document.addEventListener('click',e=>{const a=e.target.closest('a[data-contact]');if(a)window.dispatchEvent(new CustomEvent('contact-intent',{detail:{channel:a.dataset.contact,path:location.pathname}}));});
})();
