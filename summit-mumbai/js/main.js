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

  document.getElementById('yr').textContent=new Date().getFullYear();
})();
