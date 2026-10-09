import React, { useEffect, useState } from './assets/vendor/react.js';
import { createRoot } from './assets/vendor/react-dom-client.js';
import Wave from './assets/vendor/react-wavify.js';

function Water() {
  const [paused, setPaused] = useState(false);
  const [light, setLight] = useState(document.documentElement.dataset.theme === 'light');

  useEffect(() => {
    function update() {
      setPaused(document.body.classList.contains('water-paused'));
      setLight(document.documentElement.dataset.theme === 'light');
    }

    update();
    document.addEventListener('water-toggle', update);
    document.addEventListener('theme-change', update);

    return () => {
      document.removeEventListener('water-toggle', update);
      document.removeEventListener('theme-change', update);
    };
  }, []);

  return React.createElement(Wave, {
    fill: light ? '#a9d3e8' : '#0b1d32',
    paused,
    className: 'wave',
    style: { height: '100%', display: 'block' },
    options: {
      height: 16,
      amplitude: 14,
      speed: 0.18,
      points: 4
    }
  });
}

createRoot(document.querySelector('#wave-root')).render(
  React.createElement(Water)
);
