/* Design 2026 de l'accueil (09/11) : menu en verre, apparitions douces, vitrine des atouts. Fichier externe : la CSP interdit le JS en ligne. */
document.documentElement.classList.add('js');
addEventListener('DOMContentLoaded',()=>{
  const m=document.querySelector('.menu');addEventListener('scroll',()=>m.classList.toggle('defile',scrollY>8),{passive:true});
  const els=document.querySelectorAll('section h2,section .chapeau,.point,.carte-demo,.etapes li,.tarif,.offre>div:first-child,details');
  els.forEach((e,i)=>{e.classList.add('apparait');e.style.transitionDelay=(i%3)*80+'ms'});
  const o=new IntersectionObserver(es=>es.forEach(x=>{if(x.isIntersecting){x.target.classList.add('vu');o.unobserve(x.target)}}),{rootMargin:'0px 0px -8% 0px'});
  els.forEach(e=>o.observe(e));
});

addEventListener('DOMContentLoaded',()=>{
  const pts=[...document.querySelectorAll('#fonctionnalites .point')],v=document.querySelector('.vitrine');if(!pts.length)return;
  let actuel=-1;
  const montre=i=>{if(i===actuel)return;actuel=i;pts.forEach((p,k)=>p.classList.toggle('actif',k===i));
    if(!v||getComputedStyle(v).display==='none')return;
    v.classList.add('change');
    setTimeout(()=>{const p=pts[i];v.querySelector('.ico').innerHTML=p.querySelector('svg').outerHTML;
      v.querySelector('b').textContent=p.querySelector('b').textContent;v.querySelector('p').textContent=p.querySelector('p').textContent;
      v.querySelector('.num').textContent=String(i+1).padStart(2,'0')+' / '+String(pts.length).padStart(2,'0');
      v.querySelector('.halo').style.transform='translate('+(i%3)*60+'px,'+(i%2)*90+'px)';v.classList.remove('change')},180)};
  const o=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting)montre(pts.indexOf(e.target))}),{rootMargin:'-45% 0px -45% 0px'});
  pts.forEach(p=>o.observe(p));montre(0);
});

/* FAQ qui glisse (v4 « nuage ») : hauteur + texte animés, une seule question ouverte à la fois. */
addEventListener('DOMContentLoaded',()=>{
  const ds=[...document.querySelectorAll('.faq details')],calme=matchMedia('(prefers-reduced-motion:reduce)').matches,doux='cubic-bezier(.22,1,.36,1)';
  ds.forEach(d=>{const c=document.createElement('div');c.className='corps';[...d.children].filter(e=>e.tagName!=='SUMMARY').forEach(e=>c.append(e));d.append(c)});
  const anime=(d,ouvre)=>{
    const c=d.querySelector('.corps');(d._a||[]).forEach(a=>a.cancel());d._ferme=!ouvre;
    if(calme){d.open=ouvre;return}
    d.open=true;const h=c.scrollHeight,t=ouvre?650:450;
    d._a=[c.animate({height:ouvre?['0px',h+'px']:[h+'px','0px']},{duration:t,easing:doux}),
          c.animate({opacity:ouvre?[0,1]:[1,0],transform:ouvre?['translateY(-8px)','none']:['none','translateY(-6px)']},{duration:ouvre?t+150:t*.7,easing:doux,fill:'forwards'})];
    d._a[0].onfinish=()=>{d._a.forEach(a=>a.cancel());d._a=null;if(!ouvre)d.open=false}};
  ds.forEach(d=>d.querySelector('summary').addEventListener('click',e=>{e.preventDefault();
    const ouvre=!d.open||d._ferme;
    if(ouvre)ds.forEach(x=>{if(x!==d&&x.open&&!x._ferme)anime(x,false)});
    anime(d,ouvre)}));
});
