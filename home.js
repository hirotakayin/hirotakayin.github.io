(function () {
  const $ = (s) => document.querySelector(s);
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const smooth = (v) => { v = clamp(v); return v * v * (3 - 2 * v); };
  const STEP_MS = 7, FADE_MS = 120;

  /* ======================================================================
     typing: the old line fades out quickly, then the new one types in, bold and links included
     ====================================================================== */
  function typer(el) {
    el.innerHTML = '<span></span><i class="caret show"></i>';
    const done = el.children[0], caret = el.children[1];
    let timer = null, wait = null, target = null;
    return {
      set(html, instant) {
        if (html === target) return;
        const had = done.textContent;
        target = html;
        clearInterval(timer);
        clearTimeout(wait);
        // take the new line's height now, so the links below it are already in place
        const old = done.innerHTML;
        el.style.minHeight = el.style.height = '';
        done.innerHTML = html;
        const room = Math.ceil(el.getBoundingClientRect().height) + 'px';
        done.innerHTML = old;
        el.style.minHeight = el.style.height = room;
        const finish = () => {
          clearInterval(timer);
          el.classList.remove('fading');
          el.style.height = '';
          done.innerHTML = html;
          caret.classList.remove('busy');
        };
        const type = () => {
          el.classList.remove('fading');
          el.style.height = '';
          done.innerHTML = html;
          const walker = document.createTreeWalker(done, NodeFilter.SHOW_TEXT), parts = [];
          while (walker.nextNode()) parts.push({ node: walker.currentNode, text: walker.currentNode.nodeValue });
          const total = parts.reduce((n, p) => n + p.text.length, 0);
          if (!total) return finish();
          parts.forEach((p) => { p.node.nodeValue = ''; });
          let i = 0;
          caret.classList.add('busy');
          timer = setInterval(() => {
            i++;
            let left = i;
            parts.forEach((p) => { p.node.nodeValue = p.text.slice(0, left); left = Math.max(left - p.text.length, 0); });
            if (i >= total) finish();
          }, STEP_MS);
        };
        if (instant || reduce) return finish();
        if (!had) return type();
        el.classList.add('fading');
        wait = setTimeout(type, FADE_MS);
      },
    };
  }
  const lead = typer($('#lead'));

  /* ======================================================================
     beats: where the page has scrolled to decides the lines and what shows with them
     ====================================================================== */
  const overlay = $('#overlay'), story = [...document.querySelectorAll('.view')];
  const beats = [...document.querySelectorAll('[data-beat]')];
  const sets = [...document.querySelectorAll('.media-set')];
  const cad = $('#cad'), arts = $('#arts'), about = $('#about');
  const appleBeat = $('#apple-beat'), more = $('#more'), shanghai = $('#shanghai');
  let beat = null, closing = 0;

  function currentBeat() {
    const V = window.innerHeight;
    if (about.getBoundingClientRect().top < V * .62 || window.scrollY + V >= document.documentElement.scrollHeight - 2) return about;
    if (arts.getBoundingClientRect().top < V * .33) return arts;
    if (closing > .45) return appleBeat;
    if (cad.getBoundingClientRect().top < V * .2) return cad;
    // a caption changes once its picture has covered half of the one before it
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
    let at = story[0];
    story.forEach((v) => { if (v.getBoundingClientRect().top < 9 * rem + v.offsetHeight / 2) at = v; });
    return at;
  }
  const words = $('.words');
  let cardTimer = null;
  function textFor(next) {
    for (let i = beats.indexOf(next); i >= 0; i--) if (beats[i].dataset.text) return beats[i].dataset.text;
    return '';
  }
  function show(next, instant) {
    overlay.dataset.beat = next ? next.dataset.beat : 'none';
    if (next) lead.set(textFor(next), instant);
  }
  function applyBeat(next, instant) {
    const prev = beat;
    beat = next;
    beats.forEach((b) => b.classList.toggle('on', b === next));
    clearTimeout(cardTimer);
    words.classList.remove('card-out', 'card-from', 'card-in');
    const at = story.indexOf(next);
    if (at > 0) more.setAttribute('href', next.getAttribute('href'));
    if (next && prev && (next === arts || prev === arts) && !reduce && !instant) {
      words.classList.add('card-out');
      cardTimer = setTimeout(() => {
        show(next, true);
        words.classList.remove('card-out');
        words.classList.add('card-from');
        void words.offsetHeight;
        words.classList.replace('card-from', 'card-in');
      }, 220);
      return;
    }
    show(next, instant);
  }

  /* ======================================================================
     gallery: it keeps moving with the scroll while the logo closes around it
     ====================================================================== */
  const win = $('#window'), track = $('#track'), logoEnd = $('#logo-end');
  const CLOSE_VH = 1.5, HOLD_VH = .5, LOGO_ROW = 3, LOGO_LEAD_REM = 22;
  let travel = 0, closeStart = 0, closeEnd = 0, maskOn = false;

  document.documentElement.style.setProperty('--logo', 'url(' + window.LOGO + ')');
  win.style.webkitMaskImage = win.style.maskImage = 'none';

  function place(id, top, height) {
    const el = $(id);
    el.style.top = top + 'px';
    if (height !== undefined) el.style.height = Math.max(height, 0) + 'px';
  }
  function reserveLine() {
    const probe = document.createElement('p');
    probe.className = 'lead';
    probe.style.cssText = 'position:absolute;visibility:hidden;left:0;right:0;min-height:0';
    $('#lead').parentNode.append(probe);
    let tallest = 0;
    [...story, cad, appleBeat].forEach((v) => {
      probe.innerHTML = (v.dataset.text || '') + '<i class="caret show"></i>';
      tallest = Math.max(tallest, Math.ceil(probe.getBoundingClientRect().height));
    });
    probe.remove();
    overlay.style.setProperty('--lead-h', tallest + 'px');
  }
  function layout() {
    const V = window.innerHeight, rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
    const close = CLOSE_VH * V;
    // the cards move slower than the page, so the page below has to wait for them
    const lastCard = story[story.length - 1];
    $('#story').style.paddingBottom = (releaseAt(rem) + LEAVE_REM * rem - lastCard.offsetTop - lastCard.offsetHeight) + 'px';
    travel = Math.max(track.offsetHeight - V, 0);
    // it starts at the same row of the gallery, whatever shape the window is
    const row = track.querySelector('.cols > div > a:nth-of-type(' + LOGO_ROW + ')');
    closeStart = row ? Math.max(row.getBoundingClientRect().top - track.getBoundingClientRect().top - LOGO_LEAD_REM * rem, 0) : 0;
    closeEnd = closeStart + close;
    cad.style.height = (V + closeEnd + HOLD_VH * V) + 'px';
    reserveLine();
    // the music gallery ends where its shortest column does, so the blur has a picture across every column
    const musicCols = [...arts.querySelectorAll('.cols > div')];
    arts.querySelector('.cols').style.height = Math.min(...musicCols.map((c) => { const last = c.lastElementChild; return last ? last.offsetTop + last.offsetHeight : 0; })) + 'px';
    // the tear sits 18rem down its 30rem strip; below the first one, the paper waits behind the gallery
    const tear1 = cad.offsetTop - 12 * rem, tear3 = about.offsetTop - 2 * rem;
    place('#fill-1', 0, tear1 - 18 * rem);
    place('#strip-1', tear1 - 18 * rem);
    place('#fill-2', cad.offsetTop, tear3 - 18 * rem - cad.offsetTop);
    place('#strip-3', tear3 - 18 * rem);
  }
  // only a gallery shorter than the window repeats, so the screen is never left half empty
  function fillTrack() {
    const V = window.innerHeight, cols = [...track.querySelectorAll('.cols > div')];
    const originals = cols.map((c) => [...c.children].filter((t) => t.tagName === 'A' && !t.hasAttribute('aria-hidden')));
    for (let n = 0; n < 6 && track.offsetHeight < V; n++) {
      cols.forEach((c, i) => originals[i].forEach((tile) => {
        const copy = tile.cloneNode(true);
        [copy, ...copy.querySelectorAll('*')].forEach((el) => Object.keys(el.dataset || {}).forEach((k) => delete el.dataset[k]));
        copy.setAttribute('aria-hidden', 'true');
        copy.tabIndex = -1;
        c.append(copy);
      }));
    }
  }
  function updateGallery() {
    const y = clamp(-cad.getBoundingClientRect().top, 0, Infinity);
    track.style.transform = 'translate3d(0,' + -Math.min(y, travel) + 'px,0)';
    // its grid has to line up with the page's while it's pinned
    win.style.backgroundPosition = '0 ' + -(cad.offsetTop + y) + 'px';
    const e = smooth((y - closeStart) / (closeEnd - closeStart));
    closing = e;
    win.classList.toggle('closing', e > .02);
    win.parentNode.classList.toggle('closing', e > 0);
    // gone before the logo is small enough for its shadow to look like a smudge
    win.parentNode.style.setProperty('--shadow', (.32 * (1 - smooth((e - .72) / .14))).toFixed(3));
    logoEnd.style.opacity = smooth((e - .88) / .1);
    win.style.opacity = 1 - smooth((e - .93) / .07);
    if (e <= 0) {
      if (maskOn) { win.style.webkitMaskImage = win.style.maskImage = 'none'; maskOn = false; }
      return;
    }
    if (!maskOn) { win.style.webkitMaskImage = win.style.maskImage = 'url(' + window.LOGO + ')'; maskOn = true; }
    const W = window.innerWidth, r = logoEnd.getBoundingClientRect(), box = win.getBoundingClientRect();
    const end = r.width, start = W * 3.4;
    const size = start * Math.pow(end / start, e);
    const ax = .45 + .05 * e, ay = .6 - .1 * e;
    const px = r.left + r.width / 2 - box.left - size * ax, py = r.top + r.height / 2 - box.top - size * ay;
    win.style.webkitMaskSize = win.style.maskSize = size + 'px ' + size + 'px';
    win.style.webkitMaskPosition = win.style.maskPosition = px + 'px ' + py + 'px';
  }

  /* ======================================================================
     postcards: each slows on approach, drifts just above its spot while the
     next one comes, then the finished stack leaves with the page
     ====================================================================== */
  const EASE_REM = 12, DRIFT_REM = 2.5, HOLD_REM = 26, CARD_SPEED = .5, LEAVE_REM = 68;
  // the scroll where the finished stack starts leaving with the page
  const releaseAt = (rem) => (story[story.length - 1].offsetTop - 9 * rem + HOLD_REM * rem) / CARD_SPEED;
  function updateCards() {
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
    const pin = 9 * rem, drift = DRIFT_REM * rem, nudge = rem, A = EASE_REM * rem, y = window.scrollY;
    const release = releaseAt(rem);
    story.forEach((card, i) => {
      const flow = card.offsetTop - y, d = card.offsetTop - pin - y * CARD_SPEED;
      // the gap between cards is wider than this, so a card lands before the next one reaches it
      const hold = i === 0 ? story[1].offsetTop - card.offsetTop : HOLD_REM * rem;
      let at;
      if (i === 0) {
        at = pin + (drift / hold) * Math.max(d, -hold);
      } else {
        // full speed until just above the card below, slowest as it covers it, then a slow drift to the end of the hold
        const land = drift + (i - 1) * nudge, b = hold - land, a = 2 * A / 3;
        const c = (a - b + Math.sqrt((b - a) * (b - a) + 4 * a * nudge)) / (2 * a), K = a * (1 - c);
        const e = d + K + land;
        if (e >= A) at = pin + d;
        else if (e >= 0) at = pin - land + c * e + (1 - c) * e * e * e / (3 * A * A);
        else at = pin - land + c * Math.max(e, K - b);
      }
      at -= Math.max(y - release, 0);
      card.style.translate = '0 ' + (at - flow).toFixed(1) + 'px';
    });
  }

  /* ======================================================================
     keep it all in step
     ====================================================================== */
  const media = $('.media');

  /* ======================================================================
     postcards: the wheel eases out here, so each card settles at the same pace
     ====================================================================== */
  let goal = null, pos = 0, gliding = false, lastFrame = 0;
  function glide(t) {
    if (goal === null) { gliding = false; return; }
    const rate = pos < cad.offsetTop ? .055 : .14, dt = Math.min(t - lastFrame, 50);
    lastFrame = t;
    pos += (goal - pos) * (1 - Math.pow(1 - rate, dt / 16.67));
    if (Math.abs(goal - pos) < .5) pos = goal;
    window.scrollTo({ top: pos, behavior: 'instant' });
    // now, not on the scroll event a frame later, so the cards never trail the page
    frame();
    if (pos === goal) { goal = null; gliding = false; return; }
    requestAnimationFrame(glide);
  }
  window.addEventListener('wheel', (e) => {
    if (reduce || e.ctrlKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
    // the whole page uses this: the browser's own smooth scroll would still be running when the
    // cards took over, and the two would fight. Only the postcards cap how far one notch goes.
    const from = goal === null ? window.scrollY : goal;
    e.preventDefault();
    if (goal === null) { pos = window.scrollY; lastFrame = performance.now(); }
    const delta = e.deltaY * (e.deltaMode === 1 ? 16 : 1);
    goal = clamp(from + (from < cad.offsetTop ? clamp(delta, -110, 110) * .8 : delta), 0, document.documentElement.scrollHeight - window.innerHeight);
    if (!gliding) { gliding = true; requestAnimationFrame(glide); }
  }, { passive: false });
  ['mousedown', 'keydown', 'touchstart'].forEach((t) => window.addEventListener(t, () => { goal = null; }, { passive: true }));

  /* ======================================================================
     fuurin: sways on its own, a bit more when the page scrolls; the strip trails the bell
     ====================================================================== */
  if (!reduce && $('#fuurin')) {
    const bell = $('#fuurin'), strip = $('#tanzaku');
    let lastY = window.scrollY, vel = 0, prev = 0, windUntil = 0;
    // a click starts a short, random wind; both parts then swing back to rest on springs
    const swings = [{ a: 0, v: 0, k: .0035, d: .035, push: 1 }, { a: 0, v: 0, k: .006, d: .03, push: 2.2 }];
    const blow = () => swings.forEach((s) => { s.v += (Math.random() - .5) * s.push; });
    bell.addEventListener('click', () => { windUntil = performance.now() + 1100; swings.forEach((s) => { s.v += (Math.random() < .5 ? -1 : 1) * s.push * .9; }); });
    (function sway(t) {
      const y = window.scrollY;
      vel = vel * .82 + Math.abs(y - lastY) * .18;
      lastY = y;
      const gust = Math.min(vel * .5, 12);
      const steps = Math.min(Math.round((t - prev) / 8) || 1, 6);
      prev = t;
      if (t < windUntil && Math.random() < .12) blow();
      for (let n = 0; n < steps; n++) swings.forEach((s) => {
        s.v += -s.k * s.a - s.d * s.v;
        s.a = clamp(s.a + s.v, -32, 32);
      });
      bell.style.transform = 'rotate(' + (Math.sin(t * .0011) * 2.5 + Math.sin(t * .0029) * .8 + Math.sin(t * .007) * gust * .4 + swings[0].a).toFixed(2) + 'deg)';
      strip.style.transform = 'rotate(' + (Math.sin(t * .0011 - .8) * 5 + Math.sin(t * .0029 - .6) * 1.6 + Math.sin(t * .007 - .9) * gust + swings[1].a).toFixed(2) + 'deg)';
      requestAnimationFrame(sway);
    })(0);
  }

  /* ======================================================================
     moving pictures: less than half on screen, they hold still and fade toward the screen's edge
     ====================================================================== */
  const moving = new Map(), checked = new Map();
  async function isAnimated(src) {
    if (/\.gif$/i.test(src)) return true;
    // a page opened straight from disk can't read its files, hence the class on the known ones
    if (!/\.webp$/i.test(src)) return false;
    try {
      // an animated webp says so in its first bytes, so only those are needed
      const res = await fetch(src, { headers: { Range: 'bytes=0-31' } });
      const reader = res.body.getReader(), { value } = await reader.read();
      reader.cancel();
      return String.fromCharCode(...value.slice(12, 16)) === 'VP8X' && (value[20] & 2) !== 0;
    } catch (err) { return false; }
  }
  function findMoving() {
    if (reduce) return;
    document.querySelectorAll('img').forEach((img) => {
      if (moving.has(img) || img.closest('.fuurin, .nav, .view')) return;
      if (img.classList.contains('moving')) { moving.set(img, { still: null }); return; }
      const src = img.getAttribute('src') || '';
      if (!checked.has(src)) checked.set(src, isAnimated(src));
      checked.get(src).then((yes) => { if (yes && !moving.has(img)) moving.set(img, { still: null }); });
    });
  }
  function hold(img, s) {
    const still = document.createElement('canvas'), fit = getComputedStyle(img).objectFit;
    still.width = img.naturalWidth;
    still.height = img.naturalHeight;
    still.getContext('2d').drawImage(img, 0, 0);
    still.className = img.className;
    still.style.cssText = 'position:absolute;margin:0;left:' + img.offsetLeft + 'px;top:' + img.offsetTop + 'px;width:' + img.offsetWidth + 'px;height:' + img.offsetHeight + 'px;object-fit:' + fit;
    img.after(still);
    img.style.visibility = 'hidden';
    s.still = still;
  }
  function release(img, s) {
    if (!s.still) return;
    s.still.remove();
    s.still = null;
    img.style.visibility = '';
  }
  function updateMoving() {
    const V = window.innerHeight;
    moving.forEach((s, img) => {
      const r = img.getBoundingClientRect();
      if (!r.height || !img.isConnected) return;
      const seen = clamp((Math.min(r.bottom, V) - Math.max(r.top, 0)) / r.height);
      if (seen >= .5) { release(img, s); return; }
      if (!img.complete || !img.naturalWidth) return;
      if (!s.still) hold(img, s);
      const f = smooth(1 - seen / .5), cut = ((1 - seen) * 100).toFixed(1);
      const fade = 'linear-gradient(' + (r.top < 0 ? 'to bottom' : 'to top') + ', rgba(0,0,0,' + (1 - f).toFixed(3) + ') ' + cut + '%, #000 100%)';
      s.still.style.webkitMaskImage = s.still.style.maskImage = fade;
      s.still.style.opacity = (1 - .6 * f).toFixed(3);
    });
  }

  function frame() {
    updateCards();
    updateGallery();
    updateMoving();
    const next = currentBeat();
    if (next !== beat) applyBeat(next);
    const V = window.innerHeight;
    overlay.classList.toggle('over', beat === arts || (beat === appleBeat && closing < .7) || beat === cad || (beat === about && arts.getBoundingClientRect().bottom > words.getBoundingClientRect().top));
    // the side images leave before the torn edge reaches them
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
    // the photo stays until the next section nears it, then leaves upward just ahead of it
    const lift = Math.min(arts.getBoundingClientRect().top - (shanghai.offsetTop + shanghai.offsetHeight - 8 * rem), 0);
    shanghai.style.translate = '0 ' + (lift - shanghai.parentNode.getBoundingClientRect().top).toFixed(1) + 'px';
    shanghai.classList.toggle('on', closing > .7 && shanghai.offsetTop + shanghai.offsetHeight + lift > 0);
    const clear = cad.getBoundingClientRect().top - 12 * rem > media.getBoundingClientRect().bottom + 4 * rem;
    const at = story.indexOf(beat);
    sets.forEach((s, i) => s.classList.toggle('on', i === at && clear));
  }
  const onScroll = () => frame();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('beats-changed', () => { if (beat) applyBeat(beat); });
  // released first: copies of a held picture would come out blank
  window.addEventListener('resize', () => { moving.forEach((s, img) => release(img, s)); fillTrack(); layout(); findMoving(); frame(); });
  window.addEventListener('load', () => {
    fillTrack();
    layout();
    findMoving();
    frame();
    if (location.hash === '#about') about.scrollIntoView({ behavior: 'auto' });
  });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);
  if (window.ResizeObserver) {
    // pictures that load late change these heights, and the torn edges have to follow
    const resized = new ResizeObserver(() => { layout(); onScroll(); });
    [track, arts, ...arts.querySelectorAll('.tile')].forEach((el) => resized.observe(el));
  }

  layout();
  updateCards();
  updateGallery();
  applyBeat(currentBeat(), true);
})();
