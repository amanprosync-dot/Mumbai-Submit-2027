/* The Grand E-Com Summit — Mumbai 2027 | scripts */
/* ===== CONFIG — set these before going live ===== */
const FORM_ENDPOINT = "";   // e.g. your FlexiFunnels / CRM webhook URL (receives JSON POST)
const PAYMENT_URLS = {      // Razorpay / payment page per pass; leave "" to show a confirmation message instead
  Women: "https://rzp.io/rzp/NclhUxo",
  Men: "https://rzp.io/rzp/J5TWbOT",
  Couple: "https://rzp.io/rzp/03ahbKZG",
  VIP: "https://rzp.io/rzp/LXdR7KJk"
};

(function(){
  // Sticky mobile CTA
  const sticky=document.getElementById("stickyCta");
  const onScroll=()=>{const y=window.scrollY;
    const reg=document.getElementById("passes").getBoundingClientRect();
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

  // Registration form -> optional webhook, then payment link for the chosen pass
  (()=>{const f=document.getElementById("regForm");if(!f)return;
    const err=document.getElementById("regError"),btn=document.getElementById("regBtn");
    const show=m=>{err.textContent=m;err.hidden=!m};
    // Pass "Book Now" buttons scroll here with that pass preselected
    document.querySelectorAll("a[data-pass]").forEach(a=>a.addEventListener("click",()=>{document.getElementById("rPass").value=a.dataset.pass}));
    // Phone: digits only, max 10 (also handles paste)
    const ph=document.getElementById("rPhone");
    if(ph)ph.addEventListener("input",()=>{const v=ph.value.replace(/\D/g,"").slice(0,10);if(ph.value!==v)ph.value=v});
    f.addEventListener("submit",async e=>{e.preventDefault();show("");
      const d=Object.fromEntries(new FormData(f).entries());
      f.querySelectorAll("[aria-invalid]").forEach(x=>x.removeAttribute("aria-invalid"));
      const bad=(id,m)=>{const el=document.getElementById(id);if(el){el.setAttribute("aria-invalid","true");el.focus()}show(m)};
      const phone=(d.phone||"").replace(/\D/g,"");
      if(!(d.name||"").trim())return bad("rName","Please enter your full name.");
      if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email||""))return bad("rEmail","Please enter a valid email address.");
      if(phone.length!==10)return bad("rPhone","Please enter a valid 10-digit phone number.");
      if(!d.state)return bad("rState","Please select your state.");
      if(!d.commit)return show("Please tell us if you are committed to attending.");
      if(!d.consent)return bad("rConsent","Please tick the consent box to continue.");
      btn.disabled=true;
      // Open the tab now (inside the click gesture) so popup blockers allow it; point it at payment after the webhook call
      const payWin=PAYMENT_URLS[d.pass]?window.open("","_blank"):null;
      const payload={pass:d.pass,name:d.name.trim(),email:d.email.trim(),phone:d.cc+phone,state:d.state,committed:d.commit,consent:true,consentAt:new Date().toISOString(),source:"mumbai-2027"};
      try{if(FORM_ENDPOINT)await fetch(FORM_ENDPOINT,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload),keepalive:true})}catch(_){}
      const url=PAYMENT_URLS[d.pass];
      if(url){const u=new URL(url);u.searchParams.set("name",payload.name);u.searchParams.set("email",payload.email);u.searchParams.set("contact",payload.phone);
        const href=u.toString();
        if(payWin&&!payWin.closed)payWin.location.href=href;else window.open(href,"_blank")||(location.href=href);
        f.innerHTML='<div class="reg-done"><h3>Thank you, '+payload.name.replace(/[<>&"]/g,"")+'!</h3><p>Your payment page has opened in a new tab. If it did not, <a href="'+href+'" target="_blank" rel="noopener">click here to pay</a>.</p></div>'}
      else{f.innerHTML='<div class="reg-done"><h3>Thank you, '+payload.name.replace(/[<>&"]/g,"")+'!</h3><p>We have received your registration and will be in touch shortly.</p></div>'}
    });
  })();

  document.getElementById('yr').textContent=new Date().getFullYear();
})();
