/* A contextual contact bar: no cookies, storage, analytics or dependencies. */
(() => {
  'use strict';
  const bar = document.querySelector('.mobile-bar');
  const primary = document.querySelector('.hero .actions') || document.querySelector('main .service .actions') || document.querySelector('main .actions');
  if (!bar || !primary) return;
  const header = document.querySelector('header');
  const otherContacts = [...document.querySelectorAll('main .actions, main .final-actions, main .coverage-call')].filter(el => el !== primary);
  const mobile = window.matchMedia('(max-width:650px)');
  let pending = false;
  function update() {
    pending = false;
    if (!mobile.matches) { bar.hidden = true; return; }
    const top = Math.max(0, header ? header.getBoundingClientRect().bottom : 0);
    // Use a constant bottom inset so showing/hiding the bar cannot cause oscillation.
    const bottom = window.innerHeight - 80;
    const alternativeVisible = otherContacts.some(el => {
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0 && Math.min(r.bottom, bottom) - Math.max(r.top, top) >= Math.min(r.height, 44);
    });
    const show = primary.getBoundingClientRect().bottom <= top && !alternativeVisible;
    // Do not remove a keyboard-focused link while the user is using it.
    if (!show && bar.contains(document.activeElement)) return;
    bar.hidden = !show;
  }
  function schedule() {
    if (pending) return;
    pending = true;
    window.requestAnimationFrame(update);
  }
  window.addEventListener('scroll', schedule, {passive:true});
  window.addEventListener('resize', schedule, {passive:true});
  window.addEventListener('pageshow', schedule);
  bar.addEventListener('focusout', schedule);
  if (mobile.addEventListener) mobile.addEventListener('change', schedule);
  else mobile.addListener(schedule);
  if ('ResizeObserver' in window) {
    const observer = new ResizeObserver(schedule);
    observer.observe(primary);
    if (header) observer.observe(header);
  }
  if (document.fonts) document.fonts.ready.then(schedule);
  update();
  document.documentElement.dataset.mobileContactReady = '1';
})();
