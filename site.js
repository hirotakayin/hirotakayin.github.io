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
