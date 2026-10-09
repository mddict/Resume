
(() => {
  const key = 'personal-space-theme';
  const root = document.documentElement;
  let saved;
  try { saved = localStorage.getItem(key); } catch {}
  root.dataset.theme = saved === 'light' ? 'light' : 'dark';

  function updateButton() {
    const button = document.querySelector('.theme-toggle');
    if (!button) return;
    const light = root.dataset.theme === 'light';
    button.textContent = light ? '☾ Dark mode' : '☀ Light mode';
    button.setAttribute('aria-label', light ? 'Switch to dark mode' : 'Switch to light mode');
    button.setAttribute('aria-pressed', String(light));
  }

  function apply(theme, save) {
    root.dataset.theme = theme === 'light' ? 'light' : 'dark';
    if (save) {
      try { localStorage.setItem(key, root.dataset.theme); } catch {}
    }
    updateButton();
    document.dispatchEvent(new Event('theme-change'));
  }

  let switching = false;

  async function transitionTheme(theme, button) {
    if (switching) return;
    switching = true;
    const box = button.getBoundingClientRect();
    const x = box.left + box.width / 2;
    const y = box.top + box.height / 2;
    const radius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );
    button.disabled = true;
    let animation;
    let transition;
    try {
      if (!document.startViewTransition) {
        apply(theme, true);
        return;
      }
      transition = document.startViewTransition(() => apply(theme, true));
      await transition.ready;
      animation = root.animate({
        clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`]
      }, {
        duration: 850,
        easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
        pseudoElement: '::view-transition-new(root)',
        fill: 'both'
      });
      await animation.finished;
      await transition.finished;
    } catch {
      transition?.skipTransition();
      apply(theme, true);
    } finally {
      animation?.cancel();
      button.disabled = false;
      switching = false;
    }
  }

  document.addEventListener('DOMContentLoaded', () => {

    if (window.self !== window.top) return;
    const button = document.createElement('button');
    button.className = 'theme-toggle';
    button.type = 'button';
    button.addEventListener('click', () => {
      transitionTheme(root.dataset.theme === 'light' ? 'dark' : 'light', button);
    });
    document.body.append(button);
    updateButton();
  });

  window.addEventListener('storage', event => {
    if (event.key === key) apply(event.newValue, false);
  });
})();
