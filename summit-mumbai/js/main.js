/* The Grand E-Com Summit — Mumbai 2027 | scripts */
/* ===== CONFIG — set these before going live ===== */
const FORM_ENDPOINT = "";   // e.g. your FlexiFunnels / CRM webhook URL (receives JSON POST)
const PAYMENT_URLS = {      // Razorpay / payment page per pass; leave "" to show a confirmation message instead
  Women: "", Men: "", Couple: "", VIP: ""
};

(function(){
  // Sticky mobile CTA
  const sticky=document.getElementById("stickyCta");
  const onScroll=()=>{const y=window.scrollY;
    const reg=document.getElementById("register").getBoundingClientRect();
    sticky.classList.toggle("show",y>window.innerHeight*.8 && !(reg.top<window.innerHeight && reg.bottom>0));};
  window.addEventListener("scroll",onScroll,{passive:true});onScroll();


  // Reveal + counters + bars
  const fmt=n=>n.toLocaleString('en-IN');
  const runCount=el=>{if(el.dataset.done)return;el.dataset.done=1;const to=+el.dataset.count,dur=1600,t0=performance.now();
    const step=t=>{const p=Math.min(1,(t-t0)/dur),e=1-Math.pow(1-p,3);el.textContent=fmt(Math.round(to*e));if(p<1)requestAnimationFrame(step)};requestAnimationFrame(step)};
  const io=new IntersectionObserver(es=>es.forEach(e=>{if(!e.isIntersecting)return;const el=e.target;el.classList.add('in');
    el.querySelectorAll('.count').forEach(runCount);el.querySelectorAll('[data-fill]').forEach(b=>b.style.width=b.dataset.fill+'%');io.unobserve(el)}),{threshold:.15,rootMargin:'0px 0px -40px 0px'});
  document.querySelectorAll('.rv').forEach(el=>io.observe(el));

  // One summit rotator
  const osL=[...document.querySelectorAll('#osText span')],osR=[...document.querySelectorAll('#osMenu .os-row')];let oi=0;
  setInterval(()=>{oi=(oi+1)%osR.length;osR.forEach((r,k)=>r.classList.toggle('on',k===oi));osL.forEach((l,k)=>l.classList.toggle('on',k===oi%osL.length))},2600);

  // Cards carousel
  const cards=document.getElementById('cards');
  const by=()=>cards.querySelector('.card').getBoundingClientRect().width+17;
  document.getElementById('cNext').onclick=()=>{cards.scrollLeft+cards.clientWidth>=cards.scrollWidth-4?cards.scrollTo({left:0,behavior:'smooth'}):cards.scrollBy({left:by(),behavior:'smooth'})};
  document.getElementById('cPrev').onclick=()=>cards.scrollBy({left:-by(),behavior:'smooth'});
  // Highlight the card nearest the centre of the row while it scrolls
  (()=>{const all=[...cards.querySelectorAll(".card")];let raf;
    const mark=()=>{const r=cards.getBoundingClientRect(),mid=r.left+r.width/2;let best=null,bd=1e9;
      all.forEach(c=>{const b=c.getBoundingClientRect(),d=Math.abs(b.left+b.width/2-mid);if(d<bd){bd=d;best=c}});
      all.forEach(c=>c.classList.toggle("is-active",c===best))};
    cards.addEventListener("scroll",()=>{cancelAnimationFrame(raf);raf=requestAnimationFrame(mark)},{passive:true});
    addEventListener("resize",mark);mark();})();
  // Auto-advance the cards (right to left), loop back to card 1 at the end; pauses on hover/touch/focus
  (()=>{if(matchMedia("(prefers-reduced-motion: reduce)").matches)return;
    const next=document.getElementById("cNext");let t,inView=false,paused=false;
    const stop=()=>clearInterval(t),start=()=>{stop();if(inView&&!paused)t=setInterval(()=>next.onclick(),2800)};
    new IntersectionObserver(es=>{inView=es[0].isIntersecting;start()},{threshold:.3}).observe(cards);
    ["mouseenter","touchstart","focusin"].forEach(e=>cards.addEventListener(e,()=>{paused=true;stop()},{passive:true}));
    ["mouseleave","focusout"].forEach(e=>cards.addEventListener(e,()=>{paused=false;start()}));
    cards.addEventListener("touchend",()=>{setTimeout(()=>{paused=false;start()},4000)},{passive:true});
    document.getElementById("cPrev").addEventListener("click",start);next.addEventListener("click",start);
  })();

  // VIP sparks
  const sp=document.getElementById('sparks');
  for(let i=0;i<18;i++){const s=document.createElement('i');s.style.left=Math.random()*100+'%';s.style.top=Math.random()*100+'%';s.style.animationDelay=(Math.random()*3)+'s';sp.appendChild(s)}

  // States
  const states=["Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh","Uttarakhand","West Bengal","Andaman and Nicobar Islands","Chandigarh","Dadra and Nagar Haveli and Daman and Diu","Delhi","Jammu and Kashmir","Ladakh","Lakshadweep","Puducherry","Outside India"];
  const stSel=document.getElementById('state');states.forEach(s=>{const o=document.createElement('option');o.value=o.textContent=s;stSel.appendChild(o)});

  // Pass pre-select
  const passSel=document.getElementById('pass');
  document.querySelectorAll('[data-pass]').forEach(b=>b.addEventListener('click',()=>{passSel.value=b.dataset.pass}));

  // Form
  const form=document.getElementById('regForm'),msg=document.getElementById('formMsg');
  const fail=(id,bad)=>{const f=document.getElementById(id).closest('.fld');f.classList.toggle('bad',bad);return !bad};
  form.addEventListener('submit',async e=>{e.preventDefault();
    const d=Object.fromEntries(new FormData(form));const ph=(d.phone||'').replace(/\D/g,'');
    let ok=fail('name',(d.name||'').trim().length<2);
    ok=fail('email',!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(d.email||''))&&ok;
    ok=fail('phone',d.cc==='+91'?!/^[6-9]\d{9}$/.test(ph):(ph.length<6||ph.length>14))&&ok;
    ok=fail('state',!d.state)&&ok;
    const cf=document.getElementById('commitFld');cf.classList.toggle('bad',!d.commit);ok=!!d.commit&&ok;
    const cn=document.getElementById('consentFld');cn.classList.toggle('bad',!d.consent);ok=!!d.consent&&ok;
    if(!ok){form.querySelector('.bad input,.bad select')?.focus();return}
    d.consent_given=true;d.consent_timestamp=new Date().toISOString();d.consent_notice_version="privacy-policy-2026-11";
    d.phone=d.cc+ph;d.event="Grand E-Com Summit Mumbai 2027";d.page=location.href;
    const btn=form.querySelector('button[type=submit]');btn.disabled=true;btn.style.opacity=.7;
    try{if(FORM_ENDPOINT){await fetch(FORM_ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(d)})}}catch(err){}
    const pay=PAYMENT_URLS[d.pass];
    if(pay){const u=new URL(pay);u.searchParams.set('name',d.name);u.searchParams.set('email',d.email);u.searchParams.set('phone',d.phone);location.href=u.toString();return}
    msg.style.display='block';msg.textContent="Thanks, "+d.name.split(' ')[0]+"! Your details are in. Our team will reach out on "+d.phone+" to complete your booking.";
    btn.disabled=false;btn.style.opacity=1;form.reset();});
  form.querySelectorAll('input,select').forEach(i=>i.addEventListener('input',()=>i.closest('.fld').classList.remove('bad')));

  document.getElementById('yr').textContent=new Date().getFullYear();
})();
