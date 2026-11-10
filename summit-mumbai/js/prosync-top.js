/* Navbar, countdown and "Top 5" panels — ported from the ProSync Mumbai page */
/* 5 Challenges — expanding panels */
function initChallengesX() {
    var section = document.getElementById('challenges');
    if (!section) { return; }

    var title = document.getElementById('cxTitle');
    var panelsEl = document.getElementById('cxPanels');
    var panels = panelsEl ? panelsEl.querySelectorAll('.cx-panel') : [];
    var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* split heading into letters for the stagger pop-in */
      var parts = title.querySelectorAll('.cx-big, .cx-five');
    var idx = 0;
    for (var p = 0; p < parts.length; p++) {
        var txt = parts[p].getAttribute('data-text');
        parts[p].textContent = '';
        parts[p].setAttribute('aria-hidden', 'true');
        for (var c = 0; c < txt.length; c++) {
            var s = document.createElement('span');
            s.className = 'cx-letter';
            s.textContent = txt.charAt(c);
            s.style.transitionDelay = (idx * 0.05) + 's, ' + (idx * 0.05) + 's, 0s, 0s, 0s';
            parts[p].appendChild(s);
            idx++;
        }
    }

    /* panels: hover / focus / tap to open, autoplay when idle */
    var current = 0;
    var timer = null;
    var hovering = false;

    function setActive(i) {
        current = i;
        for (var k = 0; k < panels.length; k++) {
            panels[k].classList.toggle('is-active', k === i);
        }
        /* restart progress animation */
        panelsEl.classList.remove('is-playing');
        void panelsEl.offsetWidth;
        if (!hovering && !reduceMotion) { panelsEl.classList.add('is-playing'); }
    }

    function next() { setActive((current + 1) % panels.length); }

    function startAuto() {
        if (reduceMotion) { return; }
        stopAuto();
        panelsEl.classList.add('is-playing');
        timer = setInterval(next, 4500);
    }

    function stopAuto() {
        clearInterval(timer);
        panelsEl.classList.remove('is-playing');
    }

    for (var i = 0; i < panels.length; i++) {
        (function (n) {
            panels[n].addEventListener('mouseenter', function () {
                if (window.innerWidth > 860) { hovering = true; stopAuto(); setActive(n); }
            });
            panels[n].addEventListener('focus', function () { hovering = true; stopAuto(); setActive(n); });
            panels[n].addEventListener('click', function () { hovering = true; stopAuto(); setActive(n); });
        })(i);
    }

    panelsEl.addEventListener('mouseleave', function () {
        hovering = false;
        startAuto();
    });

    /* reveal + start autoplay once visible */
    var reveals = section.querySelectorAll('.cx-reveal');
    if ('IntersectionObserver' in window) {
        var observer = new IntersectionObserver(function (entries) {
            for (var e = 0; e < entries.length; e++) {
                if (entries[e].isIntersecting) {
                    entries[e].target.classList.add('is-visible');
                    if (entries[e].target === panelsEl) { startAuto(); }
                    observer.unobserve(entries[e].target);
                }
            }
        }, { threshold: 0.2 });
        for (var r = 0; r < reveals.length; r++) { observer.observe(reveals[r]); }
    } else {
        for (var m = 0; m < reveals.length; m++) { reveals[m].classList.add('is-visible'); }
        startAuto();
    }
}
initChallengesX();


document.addEventListener('DOMContentLoaded', function () {
    var navbar = document.getElementById('navbar');
    var toggle = document.getElementById('navToggle');
    var mobileMenu = document.getElementById('navMobile');
    var mobileLinks = mobileMenu.querySelectorAll('a');

    function handleScroll() {
        if (window.scrollY > 40) { navbar.classList.add('scrolled'); }
        else { navbar.classList.remove('scrolled'); }
    }
    window.addEventListener('scroll', handleScroll);
    handleScroll();

    function closeMenu() {
        toggle.classList.remove('open');
        mobileMenu.classList.remove('open');
        document.body.style.overflow = '';
    }
    toggle.addEventListener('click', function () {
        var isOpen = toggle.classList.toggle('open');
        mobileMenu.classList.toggle('open');
        document.body.style.overflow = isOpen ? 'hidden' : '';
    });
    for (var i = 0; i < mobileLinks.length; i++) { mobileLinks[i].addEventListener('click', closeMenu); }

    /* Highlight the nav link of the section in view */
    var links = document.querySelectorAll('.nav-links a');
    if ('IntersectionObserver' in window) {
        var map = new Map();
        links.forEach(function (a) {
            var s = document.querySelector(a.getAttribute('href'));
            if (s) { map.set(s, a); }
        });
        var spy = new IntersectionObserver(function (es) {
            es.forEach(function (e) {
                if (e.isIntersecting) {
                    links.forEach(function (l) { l.classList.remove('active'); });
                    map.get(e.target).classList.add('active');
                }
            });
        }, { rootMargin: '-45% 0px -50% 0px' });
        map.forEach(function (_, s) { spy.observe(s); });
    }

    /* Countdown */
    var el = document.getElementById('countdown');
    if (el) {
        var target = new Date(el.getAttribute('data-target')).getTime();
        var u = {
            d: el.querySelector('[data-unit="days"]'), h: el.querySelector('[data-unit="hours"]'),
            m: el.querySelector('[data-unit="minutes"]'), s: el.querySelector('[data-unit="seconds"]')
        };
        var pad = function (n) { return n < 10 ? '0' + n : '' + n; };
        var tick = function () {
            var diff = Math.max(0, target - Date.now());
            u.d.textContent = pad(Math.floor(diff / 864e5));
            u.h.textContent = pad(Math.floor(diff % 864e5 / 36e5));
            u.m.textContent = pad(Math.floor(diff % 36e5 / 6e4));
            u.s.textContent = pad(Math.floor(diff % 6e4 / 1e3));
        };
        tick();
        setInterval(tick, 1000);
    }
});
