import React from './react.js';
import { createRoot } from './react-dom-client.js';
import { useReducedMotion } from './motion-react.js';
import { Button } from './animate-ui-button.js';

function PortfolioButton({ section, content }) {
  const reduced = useReducedMotion();
  return React.createElement(Button, {
    className: 'space-button',
    type: 'button',
    'data-open': section,
    'data-animate-ui': 'button',
    hoverScale: reduced ? 1 : 1.05,
    tapScale: reduced ? 1 : 0.95,
    onClick: event => window.openPortfolioSection(event.currentTarget),
    dangerouslySetInnerHTML: { __html: content }
  });
}

for (const original of document.querySelectorAll('.space-menu [data-open]')) {
  const section = original.dataset.open;
  const content = original.innerHTML;
  const mount = document.createElement('span');
  mount.className = 'animated-menu-control';
  original.replaceWith(mount);
  createRoot(mount).render(React.createElement(PortfolioButton, { section, content }));
}
