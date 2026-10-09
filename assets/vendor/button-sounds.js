
(() => {
  const scriptUrl = document.currentScript.src;
  function soundPool(file) {
    return Array.from({ length: 4 }, () => {
      const sound = new Audio(new URL(`../${file}`, scriptUrl).href);
      sound.preload = 'auto';
      sound.volume = 0.4;
      return sound;
    });
  }
  const clickSounds = soundPool('button-click.mp3');
  const closeSounds = soundPool('button-close.mp3');
  let nextClick = 0;
  let nextClose = 0;

  document.addEventListener('click', event => {
    const button = event.target.closest('button, input[type="button"], input[type="submit"], input[type="reset"], [role="button"], [data-assignment], [data-image-preview]');
    if (!button || button.disabled || button.getAttribute('aria-disabled') === 'true') return;
    const isClose = button.matches('.desktop-window-close, .popup-close, .close-image, [data-close-sound]') ||
      (button.dataset.open && window.isPortfolioSectionOpen?.(button.dataset.open));
    const sound = isClose ? closeSounds[nextClose] : clickSounds[nextClick];
    if (isClose) nextClose = (nextClose + 1) % closeSounds.length;
    else nextClick = (nextClick + 1) % clickSounds.length;
    sound.currentTime = 0;
    const playback = sound.play();
    if (playback) playback.catch(() => {});
  }, { capture: true });
})();
