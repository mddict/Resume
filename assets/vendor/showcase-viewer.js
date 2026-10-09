
const viewer = document.createElement('dialog');
viewer.className = 'showcase-lightbox';
const close = document.createElement('button');
close.textContent = '[x]';
close.setAttribute('data-close-sound', '');
close.setAttribute('aria-label', 'Close image');
const image = document.createElement('img');
viewer.append(close, image);
document.body.append(viewer);
close.addEventListener('click', () => viewer.close());
document.addEventListener('click', event => {
  const link = event.target.closest('[data-image-preview]');
  if (!link) return;
  event.preventDefault();
  image.src = link.getAttribute('href');
  image.alt = link.dataset.imagePreview;
  viewer.setAttribute('aria-label', link.dataset.imagePreview);
  viewer.showModal();
});
