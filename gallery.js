// side-swipe gallery: swipe or scroll sideways, click the arrows or dots, or click a slide to go to the next one
document.querySelectorAll('.gallery').forEach((g) => {
  const track = g.querySelector('.track');
  const slides = [...track.children];
  const dots = g.querySelector('.dots');
  slides.forEach((_, i) => {
    const d = document.createElement('button');
    d.type = 'button';
    d.setAttribute('aria-label', 'slide ' + (i + 1));
    d.addEventListener('click', () => go(i));
    dots.appendChild(d);
  });
  const at = () => Math.round(track.scrollLeft / track.clientWidth);
  // scroll to the slide's own position (not index × width) so rounding never leaves a sliver of the previous slide
  const go = (i) => track.scrollTo({ left: slides[Math.max(0, Math.min(slides.length - 1, i))].offsetLeft - slides[0].offsetLeft, behavior: 'smooth' });
  const mark = () => {
    const i = at();
    [...dots.children].forEach((d, k) => d.classList.toggle('on', k === i));
    g.querySelector('.g-prev').disabled = i === 0;
    g.querySelector('.g-next').disabled = i === slides.length - 1;
    // optional: text that changes with the slide (one child per slide, in a [data-desc-for="<gallery id>"] block)
    if (g.id) document.querySelectorAll('[data-desc-for="' + g.id + '"] > *').forEach((d, k) => { d.hidden = k !== i; });
  };
  g.querySelector('.g-prev').addEventListener('click', () => go(at() - 1));
  g.querySelector('.g-next').addEventListener('click', () => go(at() + 1));
  track.addEventListener('click', () => go(at() + 1 < slides.length ? at() + 1 : 0));
  track.addEventListener('scroll', mark, { passive: true });
  g.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') go(at() - 1);
    if (e.key === 'ArrowRight') go(at() + 1);
  });
  mark();
});

// side pictures cropped at first: the arrow widens the picture column to show the whole thing
document.querySelectorAll('.expand-btn').forEach((b) => {
  b.addEventListener('click', () => {
    const open = b.closest('.split').classList.toggle('open');
    b.setAttribute('aria-expanded', open);
    b.setAttribute('aria-label', open ? 'crop the picture again' : 'show the whole picture');
  });
});
