// nav fades while scrolling down, and returns on scrolling up or with the mouse near the top
(function () {
  const nav = document.querySelector('.nav');
  let lastY = window.scrollY;
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    if (y < 40 || y < lastY - 2) nav.classList.remove('hide');
    else if (y > lastY + 2) nav.classList.add('hide');
    lastY = y;
  }, { passive: true });
  window.addEventListener('mousemove', (e) => {
    if (e.clientY < nav.offsetHeight) nav.classList.remove('hide');
  }, { passive: true });
})();

/* paper previews open in a full-screen reader; phones (whose PDF frames show one page) just open the file */
document.querySelectorAll('a.paper').forEach((link) => link.addEventListener('click', (e) => {
  if (window.matchMedia('(max-width: 760px)').matches) return;
  e.preventDefault();
  const reader = document.createElement('div');
  reader.className = 'reader';
  reader.setAttribute('role', 'dialog');
  reader.setAttribute('aria-modal', 'true');
  reader.innerHTML = '<div class="reader-bar"><span class="title"></span><a target="_blank" rel="noopener">open in new tab</a><button type="button">close ✕</button></div><iframe></iframe>';
  reader.querySelector('.title').textContent = link.dataset.title || '';
  reader.querySelector('a').href = link.href;
  reader.querySelector('iframe').src = link.getAttribute('href') + '#view=FitH';
  reader.querySelector('iframe').title = link.dataset.title || 'paper';
  const close = () => { reader.remove(); document.removeEventListener('keydown', esc); document.body.style.overflow = ''; link.focus(); };
  const esc = (ev) => { if (ev.key === 'Escape') close(); };
  reader.querySelector('button').onclick = close;
  reader.addEventListener('click', (ev) => { if (ev.target === reader) close(); });
  document.addEventListener('keydown', esc);
  document.body.style.overflow = 'hidden';
  document.body.append(reader);
  reader.querySelector('button').focus();
}));

/* animations switch: under "resume" in the top bar. Paused, each moving picture shows a still instead,
   so slower computers don't have to download or play them. Remembered between pages; paused by default
   when the computer asks for reduced motion. */
(function () {
  const ANIMATED = /images\/((?:3-lego-ump|backup-lego-ump|lego-ak12|lego-g36c|lego-scar-h|lego-smg|philup-magnet-test)\.gif|cad-(?:3-lego-ump|4-lego-m4|6-kamome-perovskite)\.webp)$/;
  let saved = null;
  try { saved = localStorage.getItem('animations'); } catch (e) {}
  let paused = saved ? saved === 'off' : window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const swap = (img) => {
    const live = img.dataset.live || img.getAttribute('src') || '';
    const m = live.match(ANIMATED);
    if (!m) return;
    img.dataset.live = live;
    const want = paused ? live.replace(ANIMATED, 'images/stills/' + m[1] + '.webp') : live;
    if (img.getAttribute('src') !== want) img.setAttribute('src', want);
  };
  const swapAll = (root) => (root.querySelectorAll ? root.querySelectorAll('img') : []).forEach(swap);
  swapAll(document);
  // the home page copies gallery pictures as it builds, so catch those too
  new MutationObserver((list) => list.forEach((r) => r.addedNodes.forEach((n) => {
    if (n.tagName === 'IMG') swap(n); else if (n.nodeType === 1) swapAll(n);
  }))).observe(document.body, { childList: true, subtree: true });

  const nav = document.querySelector('.nav');
  if (!nav) return;
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'motion-toggle';
  const label = () => {
    btn.textContent = paused ? 'play animations' : 'pause animations';
    btn.setAttribute('aria-pressed', String(paused));
  };
  label();
  btn.addEventListener('click', () => {
    paused = !paused;
    try { localStorage.setItem('animations', paused ? 'off' : 'on'); } catch (e) {}
    label();
    swapAll(document);
  });
  nav.append(btn);
})();
