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
