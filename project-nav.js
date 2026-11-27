// previous / next arrows on the sides of every project page, in the same order as the projects page
(() => {
  const pages = [
    ['apple.html', 'Apple Internship'],
    ['drones.html', 'CMU CERLAB'],
    ['phil-up.html', 'Phil-Up Makerspace Robot'],
    ['manta-ray.html', 'Soft Underwater Actuator'],
    ['kamome.html', 'UW Sun Lab'],
    ['senior-capstone.html', 'Senior Capstone'],
    ['lego.html', 'melty’s LEGO'],
    ['music.html', 'Music & Community'],
    ['graphic-design.html', 'Art and Graphics'],
  ];
  const here = location.pathname.split('/').pop();
  const i = pages.findIndex(([f]) => f === here);
  if (i < 0) return;
  const tri = '<svg viewBox="0 0 10 9" aria-hidden="true"><path d="M0 9 L5 0 L10 9 Z"/></svg>';
  const make = (k, dir) => {
    const [href, name] = pages[(k + pages.length) % pages.length];
    const a = document.createElement('a');
    a.className = 'pnav ' + dir;
    a.href = href;
    a.setAttribute('aria-label', (dir === 'prev' ? 'previous project: ' : 'next project: ') + name);
    a.innerHTML = tri + '<span class="pnav-name">' + name + '</span>';
    document.body.appendChild(a);
  };
  make(i - 1, 'prev');
  make(i + 1, 'next');
})();
