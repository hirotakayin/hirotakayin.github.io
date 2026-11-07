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
  const go = (i) => track.scrollTo({ left: Math.max(0, Math.min(slides.length - 1, i)) * track.clientWidth, behavior: 'smooth' });
  const mark = () => {
    const i = at();
    [...dots.children].forEach((d, k) => d.classList.toggle('on', k === i));
    g.querySelector('.g-prev').disabled = i === 0;
    g.querySelector('.g-next').disabled = i === slides.length - 1;
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
