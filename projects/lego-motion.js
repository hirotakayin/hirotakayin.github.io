// LEGO page only: pause/play the clips in the "My niche" gallery. Paused, each clip shows a still frame,
// so slower computers skip downloading and playing them. Remembered on this computer; paused by default
// when the computer asks for reduced motion.
(function () {
  const btn = document.querySelector('.motion-toggle');
  if (!btn) return;
  const clips = [...btn.closest('.gallery').querySelectorAll('.slide img')];
  clips.forEach((img) => { img.dataset.live = img.getAttribute('src'); });
  const still = (src) => src.replace(/images\/([^/]+\.gif)$/, 'images/stills/$1.webp');
  let saved = null;
  try { saved = localStorage.getItem('lego-animations'); } catch (e) {}
  let paused = saved ? saved === 'off' : window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const apply = () => {
    clips.forEach((img) => img.setAttribute('src', paused ? still(img.dataset.live) : img.dataset.live));
    btn.textContent = paused ? 'play gifs' : 'pause gifs';
    btn.setAttribute('aria-pressed', String(paused));
  };
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    paused = !paused;
    try { localStorage.setItem('lego-animations', paused ? 'off' : 'on'); } catch (err) {}
    apply();
  });
  apply();
})();
