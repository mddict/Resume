import { createCloudBackground } from './background-clouds.js?v=37';
import React from './react.js';
import { createRoot } from './react-dom-client.js';
import { StarsBackground } from './animate-ui-stars.js?v=21';

const host = document.getElementById('sky');
if (host) {
  createRoot(host).render(React.createElement(StarsBackground, {
    starColor: '#d9e6f2',
    speed: 50,
    factor: 0,
    pointerEvents: false
  }));
}

const cloudCanvas = document.getElementById('day-clouds');
let cloudBackground;
let cloudStopTimer;
function updateDaySky() {
  clearTimeout(cloudStopTimer);
  const light = document.documentElement.dataset.theme === 'light';
  if (!cloudCanvas) return;
  if (light && !cloudBackground) {
    cloudBackground = createCloudBackground({
      canvas: cloudCanvas,
      seed: 'siravich-day-sky',
      speed: 0.85,
      opacity: 0.65,
      reducedMotion: false
    });
  }
  if (!cloudBackground) return;
  if (document.hidden) cloudBackground.stop();
  else if (light) {
    cloudBackground.draw(performance.now());
    cloudBackground.start();
  }
  else cloudStopTimer = setTimeout(() => cloudBackground.stop(), 950);
}
updateDaySky();
document.addEventListener('theme-change', updateDaySky);
document.addEventListener('visibilitychange', updateDaySky);
