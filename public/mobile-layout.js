(() => {
  'use strict';
  const menu = document.querySelector('.mobile-menu');
  if (menu) {
    const trigger = menu.querySelector('summary');
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && menu.open) { menu.open = false; trigger.focus(); }
    });
    document.addEventListener('click', event => {
      if (menu.open && !menu.contains(event.target)) menu.open = false;
    });
    menu.querySelectorAll('a').forEach(link => link.addEventListener('click', () => { menu.open = false; }));
    const mobile = matchMedia('(max-width: 650px)');
    const close = () => { menu.open = false; };
    mobile.addEventListener('change', close);
  }
  const bar = document.querySelector('.contact-dock');
  if (bar) {
    const measure = () => document.documentElement.style.setProperty('--contactbar-height', `${Math.ceil(bar.getBoundingClientRect().height)}px`);
    measure();
    if ('ResizeObserver' in window) new ResizeObserver(measure).observe(bar);
    else window.addEventListener('resize', measure, { passive: true });
  }
})();
