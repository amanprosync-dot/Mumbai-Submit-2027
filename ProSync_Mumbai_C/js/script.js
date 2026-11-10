/* Lenis smooth scroll — buttery inertia, ~40% slower than native */
var lenis = new Lenis({
    duration: 1.6,          // higher = slower/heavier scroll (1.2 default ≈ native+, 1.6 ≈ ~40% slower)
    easing: function (t) { return 1 - Math.pow(1 - t, 3); }, // ease-out cubic — smooth deceleration
    wheelMultiplier: 1,     // keep at 1, control feel via `duration` instead
    smoothWheel: true,
    touchMultiplier: 1.5,
    infinite: false
});

function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
}
requestAnimationFrame(raf);

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

/* One Summit. One Day. One Night. */
function initOneSummit() {
    var wrap = document.getElementById('osWrap');
    var stage = document.getElementById('osStage');
    var text = document.getElementById('osText');
    var menu = document.getElementById('osMenu');
    if (!wrap || !stage || !text) { return; }

    var panels = stage.querySelectorAll('.os-panel');
    var rows = menu ? menu.querySelectorAll('.os-menu-row') : [];

    /* Each photo gets its own white copy of the headline, aligned to the stage,
       so letters change colour exactly where they cross an image. */
    function layout() {
        var sw = stage.offsetWidth;
        var sh = stage.offsetHeight;
        stage.style.setProperty('--sw', sw + 'px');

        for (var i = 0; i < panels.length; i++) {
            var p = panels[i];
            var clone = p.querySelector('.os-text-clone');
            if (!clone) {
                clone = text.cloneNode(true);
                clone.removeAttribute('id');
                clone.removeAttribute('aria-label');
                clone.setAttribute('aria-hidden', 'true');
                clone.classList.add('os-text-clone');
                p.appendChild(clone);
            }
            clone.style.width = sw + 'px';
            clone.style.height = sh + 'px';
            clone.style.left = (-p.offsetLeft) + 'px';
            clone.style.top = (-p.offsetTop) + 'px';
        }
    }

    /* Topic <-> photo activation */
    function setActive(index) {
        stage.classList.add('has-active');
        for (var i = 0; i < panels.length; i++) {
            panels[i].classList.toggle('is-active', i === index);
        }
        for (var j = 0; j < rows.length; j++) {
            rows[j].classList.toggle('is-active', j === index);
        }
    }

    function clearActive() {
        stage.classList.remove('has-active');
        for (var i = 0; i < panels.length; i++) { panels[i].classList.remove('is-active'); }
        for (var j = 0; j < rows.length; j++) { rows[j].classList.remove('is-active'); }
    }

    function bind(el) {
        var idx = parseInt(el.getAttribute('data-panel'), 10);
        el.addEventListener('mouseenter', function () { setActive(idx); });
        el.addEventListener('mouseleave', clearActive);
        el.addEventListener('focus', function () { setActive(idx); });
        el.addEventListener('blur', clearActive);
        el.addEventListener('click', function () { setActive(idx); });   /* tap support on mobile */
    }

    for (var r = 0; r < rows.length; r++) { bind(rows[r]); }
    for (var q = 0; q < panels.length; q++) { bind(panels[q]); }

    layout();
    window.addEventListener('resize', layout);
    window.addEventListener('load', layout);

    if ('IntersectionObserver' in window) {
        var observer = new IntersectionObserver(function (entries) {
            for (var i = 0; i < entries.length; i++) {
                if (entries[i].isIntersecting) {
                    entries[i].target.classList.add('is-visible');
                    observer.unobserve(entries[i].target);
                }
            }
        }, { threshold: 0.2 });
        observer.observe(wrap);
    } else {
        wrap.classList.add('is-visible');
    }
}
initOneSummit();

/* That's a wrap — past event stats */
function initWrapUp() {
    var reveals = document.querySelectorAll('.wr-reveal');
    if (!reveals.length) { return; }

    function countUp(el) {
        var target = parseInt(el.getAttribute('data-count'), 10);
        var duration = 1400;
        var start = null;

        function step(ts) {
            if (start === null) { start = ts; }
            var p = Math.min((ts - start) / duration, 1);
            var eased = 1 - Math.pow(1 - p, 3);
            el.textContent = Math.round(target * eased);
            if (p < 1) { requestAnimationFrame(step); }
        }
        requestAnimationFrame(step);
    }

    function play(section) {
        var counts = section.querySelectorAll('.wr-count');
        for (var i = 0; i < counts.length; i++) { countUp(counts[i]); }

        var fills = section.querySelectorAll('.wr-b-fill');
        for (var j = 0; j < fills.length; j++) {
            (function (el) {
                setTimeout(function () {
                    el.style.width = el.getAttribute('data-fill') + '%';
                }, 200);
            })(fills[j]);
        }
    }

    if ('IntersectionObserver' in window) {
        var observer = new IntersectionObserver(function (entries) {
            for (var i = 0; i < entries.length; i++) {
                if (entries[i].isIntersecting) {
                    var t = entries[i].target;
                    t.classList.add('is-visible');
                    if (t.classList.contains('wr-stats') || t.classList.contains('wr-cols')) {
                        play(t);
                    }
                    observer.unobserve(t);
                }
            }
        }, { threshold: 0.25 });

        for (var k = 0; k < reveals.length; k++) { observer.observe(reveals[k]); }
    } else {
        for (var m = 0; m < reveals.length; m++) {
            reveals[m].classList.add('is-visible');
            play(reveals[m]);
        }
    }
}
initWrapUp();

document.addEventListener('DOMContentLoaded', function () {

        /* Route anchor clicks through Lenis */
    document.querySelectorAll('a[href^="#"]').forEach(function (link) {
        link.addEventListener('click', function (e) {
            var hash = this.getAttribute('href');
            if (hash.length > 1 && document.querySelector(hash)) {
                e.preventDefault();
                lenis.scrollTo(hash, { duration: 1.6 });
            }
        });
    });

    var navbar = document.getElementById('navbar');
    var toggle = document.getElementById('navToggle');
    var mobileMenu = document.getElementById('navMobile');
    var mobileLinks = mobileMenu.querySelectorAll('a');

    function handleScroll() {
        if (window.scrollY > 40) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
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

    for (var i = 0; i < mobileLinks.length; i++) {
        mobileLinks[i].addEventListener('click', closeMenu);
    }

    /* Countdown */
    function initCountdown() {
        var el = document.getElementById('countdown');
        if (!el) { return; }

        var target = new Date(el.getAttribute('data-target')).getTime();
        var daysEl = el.querySelector('[data-unit="days"]');
        var hoursEl = el.querySelector('[data-unit="hours"]');
        var minEl = el.querySelector('[data-unit="minutes"]');
        var secEl = el.querySelector('[data-unit="seconds"]');
        var timer;

        function pad(n) {
            return n < 10 ? '0' + n : '' + n;
        }

        function tick() {
            var now = new Date().getTime();
            var diff = target - now;

            if (diff <= 0) {
                daysEl.textContent = '00';
                hoursEl.textContent = '00';
                minEl.textContent = '00';
                secEl.textContent = '00';
                clearInterval(timer);
                return;
            }

            var days = Math.floor(diff / (1000 * 60 * 60 * 24));
            var hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            var minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            var seconds = Math.floor((diff % (1000 * 60)) / 1000);

            daysEl.textContent = pad(days);
            hoursEl.textContent = pad(hours);
            minEl.textContent = pad(minutes);
            secEl.textContent = pad(seconds);
        }

        tick();
        timer = setInterval(tick, 1000);
    }

    initCountdown();

});

/* Past sponsors — seamless logo marquee */
function initPastSponsors() {
    var tracks = document.querySelectorAll('.ps-track');
    var reveals = document.querySelectorAll('.ps-reveal');
    if (!tracks.length) { return; }

    /* Duplicate each track's logos so the -50% loop has no visible jump.
       Repeat the set until one half is wider than the screen. */
    function build(track) {
        var originals = Array.prototype.slice.call(track.children);
        var setWidth = track.scrollWidth;
        var repeats = Math.max(1, Math.ceil((window.innerWidth * 1.2) / Math.max(setWidth, 1)));

        for (var r = 0; r < repeats; r++) {
            for (var i = 0; i < originals.length; i++) {
                track.insertBefore(originals[i].cloneNode(true), null);
            }
        }
        /* second identical half = the loop partner */
        var half = Array.prototype.slice.call(track.children);
        for (var j = 0; j < half.length; j++) {
            var c = half[j].cloneNode(true);
            c.setAttribute('aria-hidden', 'true');
            track.appendChild(c);
        }
    }

    function start() {
        for (var t = 0; t < tracks.length; t++) { build(tracks[t]); }
    }

    /* wait for logos so widths are correct */
    if (document.readyState === 'complete') { start(); }
    else { window.addEventListener('load', start); }

    if ('IntersectionObserver' in window) {
        var observer = new IntersectionObserver(function (entries) {
            for (var i = 0; i < entries.length; i++) {
                if (entries[i].isIntersecting) {
                    entries[i].target.classList.add('is-visible');
                    observer.unobserve(entries[i].target);
                }
            }
        }, { threshold: 0.2 });
        for (var k = 0; k < reveals.length; k++) { observer.observe(reveals[k]); }
    } else {
        for (var m = 0; m < reveals.length; m++) { reveals[m].classList.add('is-visible'); }
    }
}
initPastSponsors();

    /* Overview section */
function initOverview() {
        var eqEl = document.getElementById('statEq');
        if (eqEl) {
            var barCount = 22;
            for (var i = 0; i < barCount; i++) {
                var bar = document.createElement('span');
                bar.setAttribute('data-target', 15 + Math.round(Math.random() * 85));
                eqEl.appendChild(bar);
            }
        }

        var reveals = document.querySelectorAll('.ov-reveal');
        var fillEls = document.querySelectorAll('.stat-fill');
        var eqBars = eqEl ? eqEl.querySelectorAll('span') : [];
        var animated = false;

        function animateStats() {
            if (animated) { return; }
            animated = true;

            for (var i = 0; i < fillEls.length; i++) {
                (function (el) {
                    setTimeout(function () {
                        el.style.width = el.getAttribute('data-fill') + '%';
                    }, 150);
                })(fillEls[i]);
            }

            for (var j = 0; j < eqBars.length; j++) {
                (function (el, delay) {
                    setTimeout(function () {
                        el.style.height = el.getAttribute('data-target') + '%';
                    }, 150 + delay);
                })(eqBars[j], j * 25);
            }
        }

        if ('IntersectionObserver' in window) {
            var observer = new IntersectionObserver(function (entries) {
                for (var i = 0; i < entries.length; i++) {
                    if (entries[i].isIntersecting) {
                        entries[i].target.classList.add('is-visible');
                        if (entries[i].target.classList.contains('overview-left')) {
                            animateStats();
                        }
                        observer.unobserve(entries[i].target);
                    }
                }
            }, { threshold: 0.25 });

            for (var k = 0; k < reveals.length; k++) {
                observer.observe(reveals[k]);
            }
        } else {
            for (var m = 0; m < reveals.length; m++) {
                reveals[m].classList.add('is-visible');
            }
            animateStats();
        }
}

    initOverview();

    /* Cross straps */
function initCrossStraps() {
    var track1 = document.getElementById('strapTrack1');
    var track2 = document.getElementById('strapTrack2');
    if (!track1 || !track2) { return; }

    var half1 = track1.scrollWidth / 2;
    var half2 = track2.scrollWidth / 2;
    var ticking = false;

    function wrapNeg(val, max) {
        val = val % max;
        if (val > 0) { val -= max; }
        return val;
    }
    function wrapPos(val, max) {
        val = val % max;
        if (val < 0) { val += max; }
        return val;
    }

    function update() {
        var scrollY = window.scrollY || window.pageYOffset;

        var offset1 = wrapNeg(scrollY * 0.28, half1);
        var offset2 = wrapPos(scrollY * 0.22, half2) - half2;

        track1.style.transform = 'translateX(' + offset1 + 'px)';
        track2.style.transform = 'translateX(' + offset2 + 'px)';

        ticking = false;
    }

    window.addEventListener('scroll', function () {
        if (!ticking) {
            requestAnimationFrame(update);
            ticking = true;
        }
    }, { passive: true });

    update();
}
initCrossStraps();

/* Team / Speakers teaser */
function initTeamTeaser() {
    var reveals = document.querySelectorAll('.tt-reveal');
    if (!reveals.length) { return; }

    if ('IntersectionObserver' in window) {
        var observer = new IntersectionObserver(function (entries) {
            for (var i = 0; i < entries.length; i++) {
                if (entries[i].isIntersecting) {
                    entries[i].target.classList.add('is-visible');
                    observer.unobserve(entries[i].target);
                }
            }
        }, { threshold: 0.2 });

        for (var k = 0; k < reveals.length; k++) {
            observer.observe(reveals[k]);
        }
    } else {
        for (var m = 0; m < reveals.length; m++) {
            reveals[m].classList.add('is-visible');
        }
    }
}
initTeamTeaser();

/* Why Singapore / AI Market section */
function initWhyMarket() {
    var reveals = document.querySelectorAll('.wm-reveal');
    if (!reveals.length) { return; }

    if ('IntersectionObserver' in window) {
        var observer = new IntersectionObserver(function (entries) {
            for (var i = 0; i < entries.length; i++) {
                if (entries[i].isIntersecting) {
                    entries[i].target.classList.add('is-visible');
                    observer.unobserve(entries[i].target);
                }
            }
        }, { threshold: 0.2 });
        for (var k = 0; k < reveals.length; k++) { observer.observe(reveals[k]); }
    } else {
        for (var m = 0; m < reveals.length; m++) { reveals[m].classList.add('is-visible'); }
    }
}
initWhyMarket();

/* Gallery straps (scroll-linked, image version) */
function initGalleryStraps() {
    var track1 = document.getElementById('galleryTrack1');
    var track2 = document.getElementById('galleryTrack2');
    if (!track1 || !track2) { return; }

    var half1 = track1.scrollWidth / 2;
    var half2 = track2.scrollWidth / 2;
    var ticking = false;

    function wrapNeg(val, max) {
        val = val % max;
        if (val > 0) { val -= max; }
        return val;
    }
    function wrapPos(val, max) {
        val = val % max;
        if (val < 0) { val += max; }
        return val;
    }

    function update() {
        var scrollY = window.scrollY || window.pageYOffset;

        var offset1 = wrapNeg(scrollY * 0.52, half1);
        var offset2 = wrapPos(scrollY * 0.25, half2) - half2;

        track1.style.transform = 'translateX(' + offset1 + 'px)';
        track2.style.transform = 'translateX(' + offset2 + 'px)';

        ticking = false;
    }

    window.addEventListener('scroll', function () {
        if (!ticking) {
            requestAnimationFrame(update);
            ticking = true;
        }
    }, { passive: true });

    update();
}
initGalleryStraps();

function initThemes() {
    var chipsEl = document.getElementById('themesChips');
    if (!chipsEl) { return; }

    var icons = {
        cloud: '<path d="M7 18a4 4 0 1 1 .6-7.96A5 5 0 0 1 17 9a4 4 0 0 1 0 8H7z"/>',
        trendingUp: '<path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
        users: '<circle cx="9" cy="8" r="3"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><circle cx="17" cy="9" r="2.4"/><path d="M15.5 13a5 5 0 0 1 6 4.9"/>',
        cpu: '<rect x="7" y="7" width="10" height="10" rx="1.5"/><path d="M9 3v3M15 3v3M9 18v3M15 18v3M3 9h3M3 15h3M18 9h3M18 15h3"/>',
        landmark: '<path d="M3 21h18M4 21V10M20 21V10M2 10l10-6 10 6M6 10v11M18 10v11M10 10v11M14 10v11"/>',
        link: '<path d="M9 15l6-6"/><path d="M8 12l-1.5 1.5a3 3 0 0 0 4.24 4.24L12.5 16"/><path d="M16 12l1.5-1.5a3 3 0 0 0-4.24-4.24L11.5 8"/>',
        refresh: '<path d="M4 4v6h6"/><path d="M20 20v-6h-6"/><path d="M4.6 15A8 8 0 0 0 19 8.3"/><path d="M19.4 9A8 8 0 0 0 5 15.7"/>',
        sparkle: '<path d="M12 3l1.6 4.6L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.4L12 3z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15z"/>',
        chartLine: '<path d="M3 3v18h18"/><path d="M7 15l4-4 3 3 5-6"/>',
        shieldCheck: '<path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z"/><path d="M9 12l2 2 4-4"/>',
        briefcase: '<rect x="3" y="7" width="18" height="12" rx="1.5"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18"/>',
        heart: '<path d="M12 20s-7-4.35-9.5-8.5C.8 8 2.5 4.5 6 4.5c2 0 3.5 1.2 4 2.8.5-1.6 2-2.8 4-2.8 3.5 0 5.2 3.5 3.5 7C19 15.65 12 20 12 20z"/>',
        leaf: '<path d="M5 21c9 0 14-5 14-14V4h-3C7 4 5 12 5 21z"/><path d="M5 21c0-4 2-7 5-9"/>',
        shield: '<path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z"/>',
        rocket: '<path d="M12 2c3 2 5 6 5 10 0 2-1 4-2 5l-1 3-4-2-4 2-1-3c-1-1-2-3-2-5 0-4 2-8 5-10 1.5 1 3 1 4 0z"/><circle cx="12" cy="10" r="1.6"/>',
        database: '<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5"/><path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>',
        idCard: '<rect x="2" y="5" width="20" height="14" rx="2"/><circle cx="8" cy="12" r="2"/><path d="M13 10h6M13 14h4"/>',
        workflow: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6V21a2 2 0 1 1-4 0v-.2a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.6-1H3a2 2 0 1 1 0-4h.2a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.6V3a2 2 0 1 1 4 0v.2a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.6 1H21a2 2 0 1 1 0 4h-.2a1.7 1.7 0 0 0-1.6 1z"/>',
        lock: '<rect x="4" y="10" width="16" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
        scale: '<path d="M12 3v18M5 7l-3 6a3 3 0 0 0 6 0l-3-6zM19 7l-3 6a3 3 0 0 0 6 0l-3-6zM5 7h14M9 21h6"/>',
        city: '<path d="M3 21h18M5 21V7l6-4v18M11 21V9l8 4v8M8 10h.01M8 14h.01M8 18h.01"/>'
    };

    var themes = [
      {icon:'trendingUp',label:'Amazon Selling Machine'},
      {icon:'sparkle',label:'AI for E-Commerce'},
      {icon:'chartLine',label:'Amazon Ads & Marketplaces'},
      {icon:'briefcase',label:'D2C Brand Building'},
      {icon:'rocket',label:'Private Label Growth'},
      {icon:'users',label:'Reseller Opportunities'},
      {icon:'link',label:'China Sourcing'},
      {icon:'users',label:'Founder Networking'},
      {icon:'workflow',label:'AI Product Research'},
      {icon:'chartLine',label:'Digital Marketing'},
      {icon:'briefcase',label:'Wolf Tank Brand Pitches'},
      {icon:'sparkle',label:'Live Demonstrations'}
    ];

    for (var i = 0; i < themes.length; i++) {
        var chip = document.createElement('span');
        chip.className = 'tc-chip';
        chip.innerHTML =
            '<span class="tc-chip-icon"><svg viewBox="0 0 24 24">' + icons[themes[i].icon] + '</svg></span>' +
            themes[i].label;
        chipsEl.appendChild(chip);
    }

    var reveals = document.querySelectorAll('.tm-reveal');
    if ('IntersectionObserver' in window) {
        var observer = new IntersectionObserver(function (entries) {
            for (var i2 = 0; i2 < entries.length; i2++) {
                if (entries[i2].isIntersecting) {
                    entries[i2].target.classList.add('is-visible');
                    observer.unobserve(entries[i2].target);
                }
            }
        }, { threshold: 0.15 });
        for (var k = 0; k < reveals.length; k++) { observer.observe(reveals[k]); }
    } else {
        for (var m = 0; m < reveals.length; m++) { reveals[m].classList.add('is-visible'); }
    }
}
initThemes();

/* Past Event Recap */
function initRecap() {
    var wrap = document.querySelector('.recap-video-wrap');
    var video = document.getElementById('recapVideo');
    var playBtn = document.getElementById('recapPlayBtn');
    if (!wrap || !video || !playBtn) { return; }

    playBtn.addEventListener('click', function () {
        video.play();
        wrap.classList.add('is-playing');
        video.setAttribute('controls', '');
    });

    video.addEventListener('pause', function () {
        wrap.classList.remove('is-playing');
    });
    video.addEventListener('ended', function () {
        wrap.classList.remove('is-playing');
    });

    var reveals = document.querySelectorAll('.rc-reveal');
    if ('IntersectionObserver' in window) {
        var observer = new IntersectionObserver(function (entries) {
            for (var i = 0; i < entries.length; i++) {
                if (entries[i].isIntersecting) {
                    entries[i].target.classList.add('is-visible');
                    observer.unobserve(entries[i].target);
                }
            }
        }, { threshold: 0.2 });
        for (var k = 0; k < reveals.length; k++) { observer.observe(reveals[k]); }
    } else {
        for (var m = 0; m < reveals.length; m++) { reveals[m].classList.add('is-visible'); }
    }
}
initRecap();

/* Attendee — who will be in the room */
function initAttendee() {
    var reveals = document.querySelectorAll('.att-reveal');
    if (!reveals.length) { return; }

    var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function countUp(el) {
        var target = parseInt(el.getAttribute('data-count'), 10);
        var host = el.closest('.att-stat-num');

        if (reduceMotion) {
            el.textContent = target;
            if (host) { host.style.setProperty('--fill', target + '%'); }
            return;
        }

        var duration = 1600;
        var start = null;

        function step(ts) {
            if (start === null) { start = ts; }
            var p = Math.min((ts - start) / duration, 1);
            var eased = 1 - Math.pow(1 - p, 3);
            el.textContent = Math.round(target * eased);
            if (host) { host.style.setProperty('--fill', (target * eased) + '%'); }
            if (p < 1) { requestAnimationFrame(step); }
        }
        requestAnimationFrame(step);
    }

    function play(section) {
        var counts = section.querySelectorAll('.att-count');
        for (var i = 0; i < counts.length; i++) { countUp(counts[i]); }

        var fills = section.querySelectorAll('.att-bar-fill');
        for (var j = 0; j < fills.length; j++) {
            (function (el) {
                setTimeout(function () {
                    el.style.width = el.getAttribute('data-fill') + '%';
                }, 200);
            })(fills[j]);
        }
    }

    if ('IntersectionObserver' in window) {
        var observer = new IntersectionObserver(function (entries) {
            for (var i = 0; i < entries.length; i++) {
                if (entries[i].isIntersecting) {
                    var t = entries[i].target;
                    t.classList.add('is-visible');
                    play(t);
                    observer.unobserve(t);
                }
            }
        }, { threshold: 0.2 });
        for (var k = 0; k < reveals.length; k++) { observer.observe(reveals[k]); }
    } else {
        for (var m = 0; m < reveals.length; m++) {
            reveals[m].classList.add('is-visible');
            play(reveals[m]);
        }
    }
}
initAttendee();

/* Market Presence */
function initMarketPresence() {
    var reveals = document.querySelectorAll('.mp-reveal');
    if (!reveals.length) { return; }

    if ('IntersectionObserver' in window) {
        var observer = new IntersectionObserver(function (entries) {
            for (var i = 0; i < entries.length; i++) {
                if (entries[i].isIntersecting) {
                    entries[i].target.classList.add('is-visible');
                    observer.unobserve(entries[i].target);
                }
            }
        }, { threshold: 0.2 });
        for (var k = 0; k < reveals.length; k++) { observer.observe(reveals[k]); }
    } else {
        for (var m = 0; m < reveals.length; m++) { reveals[m].classList.add('is-visible'); }
    }

    var track = document.getElementById('mpCards');
    var prevBtn = document.getElementById('mpPrev');
    var nextBtn = document.getElementById('mpNext');
    if (!track || !prevBtn || !nextBtn) { return; }

    function cardWidth() {
        var card = track.querySelector('.mp-card');
        return card ? card.offsetWidth + 22 : 300;
    }

    nextBtn.addEventListener('click', function () {
        track.scrollBy({ left: cardWidth(), behavior: 'smooth' });
    });
    prevBtn.addEventListener('click', function () {
        track.scrollBy({ left: -cardWidth(), behavior: 'smooth' });
    });
}
initMarketPresence();

/* Past Speakers — Owl Carousel */
function initPastSpeakers() {
    var section = document.getElementById('past-speakers');
    if (!section) { return; }

    function pad(n) { return n < 10 ? '0' + n : '' + n; }

    if (window.jQuery && jQuery.fn && jQuery.fn.owlCarousel) {
        var $ = window.jQuery;
        var $carousel = $('#spCarousel');
        var curEl = document.getElementById('spCur');
        var totalEl = document.getElementById('spTotal');

        $carousel.on('initialized.owl.carousel changed.owl.carousel', function (e) {
            if (!e.item) { return; }
            var count = e.item.count;
            var index = e.relatedTarget.relative(e.item.index) + 1;
            if (curEl) { curEl.textContent = pad(index); }
            if (totalEl) { totalEl.textContent = pad(count); }
        });

        $carousel.owlCarousel({
            loop: true,
            center: true,
            items: 3,
            margin: 30,
            nav: false,
            dots: false,
            mouseDrag: true,
            touchDrag: true,
            smartSpeed: 700,
            autoplay: true,
            autoplayTimeout: 4500,
            autoplayHoverPause: true,
            responsive: {
                0:    { items: 1, margin: 10 },
                720:  { items: 2, margin: 20 },
                1024: { items: 3, margin: 30 }
            }
        });

        $('#spNext').on('click', function () { $carousel.trigger('next.owl.carousel', [700]); });
        $('#spPrev').on('click', function () { $carousel.trigger('prev.owl.carousel', [700]); });
    }

    var reveals = section.querySelectorAll('.sp-reveal');
    if ('IntersectionObserver' in window) {
        var observer = new IntersectionObserver(function (entries) {
            for (var i = 0; i < entries.length; i++) {
                if (entries[i].isIntersecting) {
                    entries[i].target.classList.add('is-visible');
                    observer.unobserve(entries[i].target);
                }
            }
        }, { threshold: 0.15 });
        for (var k = 0; k < reveals.length; k++) { observer.observe(reveals[k]); }
    } else {
        for (var m = 0; m < reveals.length; m++) { reveals[m].classList.add('is-visible'); }
    }
}
initPastSpeakers();

/* Agenda — timeline */
function initAgenda() {
    var trackEl = document.getElementById('agendaList');
    if (!trackEl) { return; }

    var speakerIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="8" r="3.4"></circle><path d="M4.5 20a7.5 7.5 0 0 1 15 0"></path></svg>';
    var breakIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"></circle><path d="M12 7v5l3 3"></path></svg>';
var agenda = [
 {time:'09:00 – 10:00',color:'a',num:'01',topic:'REGISTRATION & NETWORKING',speaker:'Connect with founders, sellers and entrepreneurs'},
 {time:'10:00 – 11:30',color:'b',num:'02',topic:'AMAZON SELLING MACHINE',speaker:'Amar Bedi • Amazon selling and practical growth systems'},
 {time:'11:30 – 12:30',color:'c',num:'03',topic:'AMAZON ADS & MARKETPLACE GROWTH',speaker:'Campaigns, marketplace opportunity and scaling'},
 {time:'12:30 – 01:30',color:'a',num:'04',topic:'AI-POWERED BRAND CREATION',speaker:'Practical tools and e-commerce workflows'},
 {isBreak:true,time:'01:30 – 02:30',topic:'Buffet Lunch & Networking'},
 {time:'02:30 – 03:30',color:'b',num:'05',topic:'CHINA SOURCING',speaker:'Product sourcing and importing opportunities'},
 {time:'03:30 – 04:30',color:'c',num:'06',topic:'INSTAGRAM & DIGITAL MARKETING',speaker:'Audience building and e-commerce marketing'},
 {time:'04:30 – 05:15',color:'a',num:'07',topic:'WOLF TANK LIVE BRAND PITCHES',speaker:'Brands, manufacturers and reseller opportunities'},
 {time:'05:15 – 06:00',color:'b',num:'08',topic:'NETWORKING & CLOSING',speaker:'Connect with the ProSync community'}
];
  

    var colorMap = { a: 'var(--time-a)', b: 'var(--time-b)', c: 'var(--time-c)' };
    var sideToggle = 0;

    for (var i = 0; i < agenda.length; i++) {
        var item = agenda[i];

        if (item.isBreak) {
            var cp = document.createElement('div');
            cp.className = 'agn-checkpoint';
            cp.innerHTML =
                '<span class="agn-checkpoint-pill">' + breakIcon + item.topic + ' · ' + item.time + '</span>';
            trackEl.appendChild(cp);
            continue;
        }

        var side = sideToggle % 2 === 0 ? 'side-left' : 'side-right';
        sideToggle++;

        var node = document.createElement('div');
        node.className = 'agn-node ' + side;
        node.style.setProperty('--dot-color', colorMap[item.color]);

        var speakerHtml = item.speaker
            ? '<div class="agn-speaker">' + speakerIcon + '<span>' + item.speaker + '</span></div>'
            : '';

        node.innerHTML =
            '<div class="agn-node-side">' +
                '<div class="agn-card">' +
                    '<span class="agn-ghost-num">' + item.num + '</span>' +
                    '<div class="agn-time">' + item.time + '</div>' +
                    '<div class="agn-topic">' + item.topic + '</div>' +
                    speakerHtml +
                '</div>' +
            '</div>' +
            '<div class="agn-dot" style="border-color:' + colorMap[item.color] + '"></div>';

        trackEl.appendChild(node);
    }

    /* Scroll-linked spine fill */
    var timelineEl = document.querySelector('.agn-timeline');
    var fillEl = document.getElementById('agnSpineFill');
    var headEl = document.getElementById('agnSpineHead');

    function updateSpine() {
        if (!timelineEl || !fillEl) { return; }
        var rect = timelineEl.getBoundingClientRect();
        var vh = window.innerHeight;
        var total = rect.height;
        var visible = vh * 0.6 - rect.top;
        var pct = total > 0 ? Math.max(0, Math.min(100, (visible / total) * 100)) : 0;
        fillEl.style.height = pct + '%';
        if (headEl) { headEl.style.top = pct + '%'; }
    }

    var spineTicking = false;
    window.addEventListener('scroll', function () {
        if (!spineTicking) {
            requestAnimationFrame(function () { updateSpine(); spineTicking = false; });
            spineTicking = true;
        }
    }, { passive: true });
    updateSpine();

    var gateBtn = document.getElementById('agendaGateBtn');
    if (gateBtn) {
        gateBtn.addEventListener('click', function () {
            var target = document.getElementById('tickets') || document.querySelector('.nav-cta');
            if (target && target.scrollIntoView) { target.scrollIntoView({ behavior: 'smooth' }); }
        });
    }

    var reveals = document.querySelectorAll('.ag-reveal, .agn-node, .agn-checkpoint');
    if ('IntersectionObserver' in window) {
        var observer = new IntersectionObserver(function (entries) {
            for (var k = 0; k < entries.length; k++) {
                if (entries[k].isIntersecting) {
                    entries[k].target.classList.add('is-visible');
                    observer.unobserve(entries[k].target);
                }
            }
        }, { threshold: 0.15 });
        for (var j = 0; j < reveals.length; j++) { observer.observe(reveals[j]); }
    } else {
        for (var m = 0; m < reveals.length; m++) { reveals[m].classList.add('is-visible'); }
    }
}
initAgenda();

/* AI27 Leaders Awards & Gala Dinner */
function initGala() {
    var section = document.getElementById('gala');
    if (!section) { return; }

    var reveals = section.querySelectorAll('.gl-reveal');
    var rows = section.querySelectorAll('.gl-row');

    /* cursor-following spotlight inside each row */
    for (var r = 0; r < rows.length; r++) {
        (function (row) {
            row.addEventListener('mousemove', function (e) {
                var rect = row.getBoundingClientRect();
                row.style.setProperty('--mx', (e.clientX - rect.left) + 'px');
                row.style.setProperty('--my', (e.clientY - rect.top) + 'px');
            });
        })(rows[r]);
    }

    if ('IntersectionObserver' in window) {
        var observer = new IntersectionObserver(function (entries) {
            for (var i = 0; i < entries.length; i++) {
                if (entries[i].isIntersecting) {
                    entries[i].target.classList.add('is-visible');
                    observer.unobserve(entries[i].target);
                }
            }
        }, { threshold: 0.15 });
        for (var k = 0; k < reveals.length; k++) { observer.observe(reveals[k]); }
    } else {
        for (var m = 0; m < reveals.length; m++) { reveals[m].classList.add('is-visible'); }
    }
}
initGala();



