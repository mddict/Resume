

const lines = [...document.querySelectorAll('[data-scramble]')];
const symbols = '@#!$%&*?+/=[]';
const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
const title = document.querySelector('.title');
let animationFrame = 0;

function restoreTitle() {
  cancelAnimationFrame(animationFrame);

  for (const line of lines) {
    line.textContent = line.dataset.scramble;
  }
}

function scrambleTitle() {
  restoreTitle();

  if (motionPreference.matches || document.hidden) {
    return;
  }

  const started = performance.now();
  const duration = 1100;
  let previousStep = -1;

  function update(now) {
    const progress = Math.min((now - started) / duration, 1);
    const step = Math.floor((now - started) / 65);

    if (step !== previousStep) {
      previousStep = step;

      for (const line of lines) {
        const text = line.dataset.scramble;
        const revealed = Math.floor(progress * text.length);

        line.textContent = [...text].map((letter, index) => {
          if (index < revealed || progress === 1) {
            return letter;
          }

          return symbols[Math.floor(Math.random() * symbols.length)];
        }).join('');
      }
    }

    if (progress < 1) {
      animationFrame = requestAnimationFrame(update);
    } else {
      restoreTitle();
    }
  }

  animationFrame = requestAnimationFrame(update);
}

scrambleTitle();
title.addEventListener('pointerenter', scrambleTitle);
title.addEventListener('click', scrambleTitle);
motionPreference.addEventListener('change', restoreTitle);
document.addEventListener('visibilitychange', restoreTitle);

let windowLayer = document.querySelector('#desktop-windows');

if (!windowLayer) {
  windowLayer = document.createElement('div');
  windowLayer.id = 'desktop-windows';
  document.body.append(windowLayer);
}
const openWindows = new Map();
let windowSequence = 0;
let frontWindow = null;
let topIndex = 20;

function positionWindow(element, left, top) {
  const box = element.getBoundingClientRect();
  const edge = 8;
  element.style.left = `${Math.max(edge, Math.min(left, window.innerWidth - box.width - edge))}px`;
  element.style.top = `${Math.max(edge, Math.min(top, window.innerHeight - box.height - edge))}px`;
}

function bringToFront(element) {
  frontWindow?.classList.remove('window-active');
  frontWindow = element;
  element.classList.add('window-active');
  element.style.zIndex = String(++topIndex);
}

function closeDesktopWindow(key) {
  const entry = openWindows.get(key);
  if (!entry) return;
  entry.finishDrag();
  entry.element.remove();
  openWindows.delete(key);
  document.querySelectorAll('[data-open]').forEach(button => {
    if (button.dataset.open === key) button.setAttribute('aria-expanded', 'false');
  });

  const remaining = [...openWindows.values()].sort((a, b) => {
    return Number(a.element.style.zIndex) - Number(b.element.style.zIndex);
  });
  if (remaining.length) {
    const next = remaining[remaining.length - 1];
    bringToFront(next.element);
    next.header.focus({ preventScroll: true });
  } else {
    frontWindow = null;
    entry.opener?.focus();
  }
}

function createDesktopWindow(key, title, content, opener) {
  if (openWindows.has(key)) {
    const existing = openWindows.get(key);
    bringToFront(existing.element);
    existing.header.focus({ preventScroll: true });
    return existing.element;
  }

  const element = document.createElement('section');
  element.className = 'desktop-window';
  element.dataset.windowKey = key;
  element.setAttribute('role', 'dialog');
  element.setAttribute('aria-modal', 'false');
  const header = document.createElement('header');
  header.className = 'desktop-window-header';
  header.tabIndex = 0;
  header.setAttribute('aria-label', `${title}: drag to move, or use arrow keys`);
  const heading = document.createElement('h2');
  heading.id = `window-heading-${++windowSequence}`;
  heading.textContent = title.toLowerCase();
  element.setAttribute('aria-labelledby', heading.id);
  const close = document.createElement('button');
  close.className = 'desktop-window-close';
  close.textContent = '[x]';
  close.setAttribute('aria-label', `Close ${title}`);
  close.addEventListener('click', () => closeDesktopWindow(key));
  header.append(heading, close);
  const body = document.createElement('div');
  body.className = 'desktop-window-body';
  body.append(content);
  element.append(header, body);
  windowLayer.append(element);

  let drag = null;
  function finishDrag() {
    const pointerId = drag?.pointerId;
    drag = null;
    if (pointerId !== undefined && header.hasPointerCapture(pointerId)) {
      header.releasePointerCapture(pointerId);
    }
    header.classList.remove('dragging');
  }

  header.addEventListener('pointerdown', event => {
    if (event.button !== 0 || event.target.closest('button')) return;
    const box = element.getBoundingClientRect();
    bringToFront(element);
    drag = {
      pointerId: event.pointerId,
      x: event.clientX - box.left,
      y: event.clientY - box.top
    };
    header.setPointerCapture(event.pointerId);
    header.classList.add('dragging');
    header.focus({ preventScroll: true });
    event.preventDefault();
  });
  header.addEventListener('pointermove', event => {
    if (drag && drag.pointerId === event.pointerId) {
      positionWindow(element, event.clientX - drag.x, event.clientY - drag.y);
    }
  });
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(type => {
    header.addEventListener(type, finishDrag);
  });
  header.addEventListener('keydown', event => {
    if (event.target !== header) return;
    const directions = {
      ArrowLeft: [-1, 0], ArrowRight: [1, 0],
      ArrowUp: [0, -1], ArrowDown: [0, 1]
    };
    const direction = directions[event.key];
    if (!direction) return;
    const box = element.getBoundingClientRect();
    const step = event.shiftKey ? 40 : 16;
    positionWindow(element, box.left + direction[0] * step, box.top + direction[1] * step);
    event.preventDefault();
  });
  element.addEventListener('pointerdown', () => bringToFront(element));
  element.addEventListener('focusin', () => bringToFront(element));

  body.addEventListener('click', event => {
    const contactButton = event.target.closest('[data-contact-open]');
    if (contactButton) {
      const template = document.getElementById('contact');
      const menuButton = document.querySelector('.space-menu [data-open="contact"]');
      createDesktopWindow('contact', template.dataset.title,
        template.content.cloneNode(true), menuButton);
      menuButton.setAttribute('aria-expanded', 'true');
      return;
    }
    const picture = event.target.closest('[data-image-preview]');
    if (picture) {
      event.preventDefault();
      const figure = document.createElement('figure');
      figure.className = 'showcase-full-image';
      const image = document.createElement('img');
      image.src = picture.getAttribute('href');
      image.alt = picture.dataset.imagePreview;
      figure.append(image);
      createDesktopWindow(`image:${image.src}`, picture.dataset.imagePreview, figure, picture);
      return;
    }
    const link = event.target.closest('[data-assignment]');
    if (!link) return;
    event.preventDefault();
    const content = document.createDocumentFragment();
    const standalone = document.createElement('a');
    standalone.href = link.getAttribute('href');
    standalone.target = '_blank';
    standalone.rel = 'noopener';
    standalone.textContent = 'Open in a separate tab ↗';
    const frame = document.createElement('iframe');
    frame.className = 'assignment-frame';
    frame.title = link.dataset.assignment;
    frame.src = link.getAttribute('href');
    content.append(standalone, frame);
    const assignment = createDesktopWindow(`assignment:${frame.src}`, frame.title, content, opener);
    frame.addEventListener('load', () => {
      try {
        frame.contentWindow.addEventListener('pointerdown', () => bringToFront(assignment));
      } catch {
      }
    });
  });

  openWindows.set(key, { element, header, opener, finishDrag });
  const box = element.getBoundingClientRect();
  const cascade = ((openWindows.size - 1) % 5) * 18;
  const wideScreen = window.innerWidth >= 1440;
  const rightMargin = wideScreen ? Math.min(180, window.innerWidth * 0.095) : 24;
  const preferredLeft = window.innerWidth >= 900
    ? Math.min(window.innerWidth * 0.485 + cascade,
      window.innerWidth - box.width - rightMargin)
    : (window.innerWidth - box.width) / 2;
  const preferredTop = Math.max(24, Math.min(56, window.innerHeight * 0.062)) + cascade;
  positionWindow(element, preferredLeft, preferredTop);
  bringToFront(element);
  header.focus({ preventScroll: true });
  return element;
}

function openPortfolioSection(button) {
  if (openWindows.has(button.dataset.open)) {
    closeDesktopWindow(button.dataset.open);
    return;
  }
  const template = document.getElementById(button.dataset.open);
  if (!template) return;
  createDesktopWindow(button.dataset.open, template.dataset.title,
    template.content.cloneNode(true), button);
  button.setAttribute('aria-expanded', 'true');
}

window.openPortfolioSection = openPortfolioSection;
window.isPortfolioSectionOpen = key => openWindows.has(key);

document.querySelectorAll('[data-open]').forEach(button => {
  button.addEventListener('click', () => openPortfolioSection(button));
});

document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && frontWindow) {
    closeDesktopWindow(frontWindow.dataset.windowKey);
    event.preventDefault();
  }
});
window.addEventListener('resize', () => {
  openWindows.forEach(({ element }) => {
    const box = element.getBoundingClientRect();
    positionWindow(element, box.left, box.top);
  });
});

const waterToggle = document.querySelector('.motion-toggle');
waterToggle.addEventListener('click', () => {
  const paused = document.body.classList.toggle('water-paused');
  waterToggle.setAttribute('aria-pressed', String(paused));
  waterToggle.textContent = paused ? 'Play water' : 'Pause water';
  document.dispatchEvent(new Event('water-toggle'));
});
