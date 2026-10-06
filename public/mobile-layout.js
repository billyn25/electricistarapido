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
  document.querySelectorAll('[data-whatsapp-form]').forEach(form => {
    form.addEventListener('submit', event => {
      event.preventDefault();
      const data = new FormData(form);
      const town = String(data.get('town') || '').trim();
      const problem = String(data.get('problem') || '').trim();
      if (!town || !problem) { form.reportValidity(); return; }
      const name = String(data.get('name') || '').trim();
      const detail = String(data.get('message') || '').trim();
      const area = String(data.get('area') || '').trim();
      const province = String(form.dataset.province || '').trim();
      const parts = [
        'Hola, contacto desde Electricista Rápido.',
        name ? `Me llamo ${name}.` : '',
        `Estoy en ${town}.`,
        province ? `Provincia: ${province}.` : '',
        area ? `Barrio o núcleo: ${area}.` : '',
        `Avería: ${problem}.`,
        detail ? `Detalle: ${detail}` : '',
        '¿Podéis indicarme disponibilidad?'
      ].filter(Boolean);
      const phone = String(form.dataset.phone || '').replace(/\D/g, '');
      if (!phone) return;
      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(parts.join('\n'))}`, '_blank', 'noopener,noreferrer');
    });
  });

  document.querySelectorAll('[data-intake-service]').forEach(link => {
    link.addEventListener('click', () => {
      const field = document.querySelector('[data-whatsapp-form] [name=problem]');
      if (field && [...field.options].some(option => option.value === link.dataset.intakeService)) {
        field.value = link.dataset.intakeService;
        field.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
  });

  const bar = document.querySelector('.contact-dock');
  if (bar) {
    const measure = () => document.documentElement.style.setProperty('--contactbar-height', `${Math.ceil(bar.getBoundingClientRect().height)}px`);
    measure();
    if ('ResizeObserver' in window) new ResizeObserver(measure).observe(bar);
    else window.addEventListener('resize', measure, { passive: true });
  }
})();
