
const DEFAULTS = {
  pixelRatio: 2,
  speed: 1,
  opacity: 1,
  reducedMotion: undefined
};

function hashSeed(seed) {
  if (typeof seed === "number" && Number.isFinite(seed)) return seed >>> 0;
  const text = String(seed ?? `${Date.now()}-${Math.random()}`);
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function seededRandom(seed) {
  let state = hashSeed(seed);
  return () => {
    state += 0x6D2B79F5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

const range = (random, min, max) => min + (max - min) * random();

function polygon(random, cx, cy, rx, ry, sides) {
  const points = [];
  const count = Math.max(6, Math.round(sides));
  for (let index = 0; index < count; index += 1) {
    const angle = -Math.PI / 2 + (index / count) * Math.PI * 2;
    const jitter = range(random, 0.9, 1.08);
    points.push({ x: cx + Math.cos(angle) * rx * jitter, y: cy + Math.sin(angle) * ry * jitter });
  }
  return points;
}

export function createCloudShape(random, width, height, depth = 1) {
  const puffs = [];
  const facets = [];
  const addPuffs = (count, position, radii, sides) => {
    for (let index = 0; index < count; index += 1) {
      const progress = index / Math.max(1, count - 1);
      const [cx, cy] = position(progress);
      puffs.push(polygon(random, cx, cy, ...radii(), range(random, ...sides)));
    }
  };

  addPuffs(Math.floor(range(random, 14, 22)), progress => [
    width * (-0.02 + progress * 1.04) + range(random, -width * 0.035, width * 0.035),
    height * range(random, 0.54, 0.75)
  ], () => [width / 18 * range(random, 1.5, 2.6), height * range(random, 0.13, 0.25)], [10, 15]);
  addPuffs(Math.floor(range(random, 10, 16)), progress => {
    const lift = Math.sin(progress * Math.PI);
    return [width * (0.16 + progress * 0.68) + range(random, -width * 0.055, width * 0.055), height * range(random, 0.28, 0.52) - lift * height * range(random, 0.08, 0.22)];
  }, () => [width * range(random, 0.055, 0.12), height * range(random, 0.13, 0.25)], [10, 16]);
  addPuffs(Math.floor(range(random, 8, 13)), progress => [
    width * (0.14 + progress * 0.72) + range(random, -width * 0.06, width * 0.06), height * range(random, 0.08, 0.25)
  ], () => [width * range(random, 0.07, 0.15), height * range(random, 0.07, 0.15)], [10, 15]);
  addPuffs(Math.floor(range(random, 8, 13)), progress => [
    width * (0.04 + progress * 0.92) + range(random, -width * 0.04, width * 0.04), height * range(random, 0.7, 0.86)
  ], () => [width * range(random, 0.065, 0.14), height * range(random, 0.07, 0.13)], [9, 14]);
  addPuffs(Math.floor(range(random, 10, 18)), () => [
    width * random() + (random() > 0.5 ? -1 : 1) * range(random, 0, width * 0.045), height * range(random, 0.18, 0.88)
  ], () => [width * range(random, 0.035, 0.08), height * range(random, 0.045, 0.1)], [8, 13]);

  const facetCount = Math.round(range(random, 36, 62) * (0.68 + depth * 0.28));
  for (let index = 0; index < facetCount; index += 1) {
    const cx = range(random, -width * 0.04, width * 1.04);
    const cy = range(random, height * 0.02, height * 0.96);
    const sides = random() > 0.82 ? 4 : 3;
    const points = [];
    for (let side = 0; side < sides; side += 1) {
      const angle = range(random, 0, Math.PI * 2) + (side / sides) * Math.PI * 2;
      points.push({ x: cx + Math.cos(angle) * range(random, width * 0.025, width * 0.09), y: cy + Math.sin(angle) * range(random, height * 0.035, height * 0.12) });
    }
    facets.push({ points, shade: cy / height, cool: cy > height * range(random, 0.52, 0.72), hueOffset: range(random, -7, 8), lightOffset: range(random, -4, 5), alpha: range(random, 0.08, 0.24), strokeAlpha: range(random, 0.001, 0.008) });
  }
  return { puffs, facets };
}

function tracePolygon(ctx, points, offsetX, offsetY) {
  if (!points.length) return;
  ctx.moveTo(offsetX + points[0].x, offsetY + points[0].y);
  for (let index = 1; index < points.length; index += 1) ctx.lineTo(offsetX + points[index].x, offsetY + points[index].y);
  ctx.closePath();
}

function traceCloud(ctx, cloud, x, y) {
  ctx.beginPath();
  cloud.puffs.forEach(puff => tracePolygon(ctx, puff, x, y));
}

function drawCloud(ctx, cloud, x, y, opacity) {
  const gradient = ctx.createLinearGradient(x, y, x, y + cloud.height);
  gradient.addColorStop(0, `hsla(${cloud.hue}, 28%, 98%, ${cloud.opacity * opacity})`);
  gradient.addColorStop(0.42, `hsla(${cloud.hue - 2}, 25%, 94%, ${cloud.opacity * opacity})`);
  gradient.addColorStop(1, `hsla(${cloud.hue - 12}, 24%, 83%, ${cloud.opacity * opacity})`);
  ctx.save();
  if ("filter" in ctx) ctx.filter = `blur(${7 + cloud.depth * 6}px)`;
  traceCloud(ctx, cloud, x, y); ctx.fillStyle = `rgba(245, 251, 255, ${0.18 + cloud.depth * 0.08})`; ctx.fill(); ctx.restore();
  ctx.save();
  ctx.shadowColor = `rgba(88, 126, 151, ${0.05 + cloud.depth * 0.06})`; ctx.shadowBlur = 10 + cloud.depth * 14; ctx.shadowOffsetY = 6 + cloud.depth * 8;
  traceCloud(ctx, cloud, x, y); ctx.fillStyle = gradient; ctx.fill(); ctx.clip(); ctx.shadowColor = "transparent"; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
  cloud.facets.forEach(facet => {
    const shade = Math.min(1, Math.max(0, facet.shade));
    const lightness = Math.max(54, Math.min(96, 96 - shade * 14 + facet.lightOffset));
    const saturation = facet.cool ? 14 + cloud.depth * 5 : 15 + cloud.depth * 6;
    const hue = facet.cool ? 210 + facet.hueOffset : cloud.hue + facet.hueOffset;
    ctx.beginPath(); tracePolygon(ctx, facet.points, x, y); ctx.fillStyle = `hsla(${hue}, ${saturation}%, ${lightness}%, ${facet.alpha})`; ctx.fill(); ctx.strokeStyle = `rgba(105, 138, 157, ${facet.strokeAlpha * cloud.depth})`; ctx.lineWidth = 0.6; ctx.stroke();
  });
  const underbelly = ctx.createLinearGradient(x, y + cloud.height * 0.48, x, y + cloud.height); underbelly.addColorStop(0, "rgba(120, 151, 170, 0)"); underbelly.addColorStop(1, `rgba(117, 151, 172, ${0.08 + cloud.depth * 0.08})`); ctx.fillStyle = underbelly; ctx.fillRect(x - cloud.width * 0.08, y + cloud.height * 0.44, cloud.width * 1.16, cloud.height * 0.62);
  const veil = ctx.createLinearGradient(x, y, x, y + cloud.height); veil.addColorStop(0, "rgba(250, 253, 255, 0.18)"); veil.addColorStop(0.6, "rgba(239, 248, 255, 0.1)"); veil.addColorStop(1, "rgba(226, 240, 249, 0.04)"); ctx.fillStyle = veil; ctx.fillRect(x - cloud.width * 0.08, y - cloud.height * 0.08, cloud.width * 1.16, cloud.height * 1.16); ctx.restore();
  ctx.save(); traceCloud(ctx, cloud, x, y); ctx.strokeStyle = `rgba(241, 249, 255, ${0.012 + cloud.depth * 0.01})`; ctx.lineWidth = 0.45; ctx.stroke(); ctx.restore();
}

function renderTexture(cloud, width) {
  const margin = Math.ceil(Math.max(96, cloud.height * 0.34));
  const scale = Math.max(0.34, Math.min(width < 720 ? 0.5 : 0.58, 1600 / (cloud.width + margin * 2)));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.ceil((cloud.width + margin * 2) * scale)); canvas.height = Math.max(1, Math.ceil((cloud.height + margin * 2) * scale));
  const ctx = canvas.getContext("2d"); ctx.setTransform(scale, 0, 0, scale, 0, 0); drawCloud(ctx, cloud, margin, margin, 1);
  return { canvas, margin, width: cloud.width + margin * 2, height: cloud.height + margin * 2 };
}

export class CloudBackground {
  constructor(options = {}) {
    if (!options.canvas || typeof options.canvas.getContext !== "function") throw new TypeError("background-clouds requires a canvas element");
    this.canvas = options.canvas; this.ctx = this.canvas.getContext("2d");
    if (!this.ctx) throw new Error("background-clouds could not get a 2D canvas context");
    this.options = { ...DEFAULTS, ...options }; if (this.options.seed == null) this.options.seed = Math.random();
    this.running = false; this.frame = 0; this.clouds = [];
    this.motionQuery = typeof window !== "undefined" && window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;
    this.resizeObserver = typeof ResizeObserver !== "undefined" ? new ResizeObserver(() => this.resize()) : null;
    this.resize(); this.resizeObserver?.observe(this.canvas); this.start();
  }

  get reducedMotion() { return this.options.reducedMotion ?? this.motionQuery?.matches ?? false; }

  resize() {
    const viewport = typeof window === "undefined" ? { innerWidth: 1, innerHeight: 1, devicePixelRatio: 1 } : window;
    const width = this.canvas.clientWidth || viewport.innerWidth; const height = this.canvas.clientHeight || viewport.innerHeight;
    this.width = width; this.height = height; const dpr = Math.min(viewport.devicePixelRatio || 1, this.options.pixelRatio);
    this.canvas.width = Math.max(1, Math.floor(width * dpr)); this.canvas.height = Math.max(1, Math.floor(height * dpr)); this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0); this.seed(); this.draw(performance.now());
  }

  seed() {
    const random = seededRandom(this.options.seed); const layers = [{ depth: 0.35, width: [0.3, 0.48], y: [0.02, 0.34], speed: [4, 8], count: 4 }, { depth: 0.6, width: [0.4, 0.6], y: [0.2, 0.58], speed: [6, 10], count: 4 }, { depth: 0.85, width: [0.45, 0.7], y: [0.42, 0.78], speed: [8, 12], count: 4 }];
    this.clouds = layers.flatMap((layer, layerIndex) => Array.from({ length: Math.ceil(this.width / (800 - layerIndex * 30)) + layer.count }, (_, index) => {
      const width = Math.min(this.width * 1.32 + 240, Math.max(180, this.width * range(random, ...layer.width))); const height = width * range(random, 0.18, 0.31); const progress = index / Math.max(1, Math.ceil(this.width / (800 - layerIndex * 30)) + layer.count - 1);
      const cloud = { ...createCloudShape(random, width, height, layer.depth), baseX: -width * 0.78 + progress * (this.width + width * 1.46) + range(random, -width * 0.18, width * 0.18), y: this.height * range(random, ...layer.y) - height * range(random, 0.08, 0.2), width, height, depth: layer.depth, direction: (index + layerIndex) % 2 === 0 ? 1 : -1, speed: range(random, ...layer.speed), opacity: (this.options.opacity ?? 1) * range(random, 0.84, 1.08), hue: range(random, 205, 215), phase: range(random, 0, Math.PI * 2), floatAmplitude: range(random, 2, 9) * layer.depth, floatSpeed: range(random, 0.55, 1.25), gap: width * range(random, 0.02, 0.16) };
      cloud.texture = renderTexture(cloud, this.width); return cloud;
    })).sort((a, b) => a.depth - b.depth);
  }

  draw(time) {
    this.ctx.clearRect(0, 0, this.width, this.height);
    this.clouds.forEach(cloud => { const motion = this.reducedMotion ? 0 : time * 0.001 * cloud.speed * cloud.direction * this.options.speed; const span = this.width + cloud.width + cloud.gap; const x = ((cloud.baseX + motion + cloud.width) % span + span) % span - cloud.width; const bob = this.reducedMotion ? 0 : Math.sin(time * 0.00032 * cloud.floatSpeed + cloud.phase) * cloud.floatAmplitude; const positions = [x]; if (x > 0) positions.push(x - span); if (x + cloud.width < this.width) positions.push(x + span); positions.forEach(position => { if (position > this.width + cloud.width * 0.2 || position + cloud.width < -cloud.width * 0.2) return; this.ctx.drawImage(cloud.texture.canvas, position - cloud.texture.margin, cloud.y + bob - cloud.texture.margin, cloud.texture.width, cloud.texture.height); }); });
  }

  start() { if (this.running) return this; this.running = true; const tick = time => { if (!this.running) return; this.draw(time); this.frame = requestAnimationFrame(tick); }; if (typeof requestAnimationFrame === "function" && !this.reducedMotion) this.frame = requestAnimationFrame(tick); return this; }
  stop() { this.running = false; if (this.frame && typeof cancelAnimationFrame === "function") cancelAnimationFrame(this.frame); this.frame = 0; return this; }
  setSeed(seed) { this.options.seed = seed; this.seed(); this.draw(performance.now()); return this; }
  destroy() { this.stop(); this.resizeObserver?.disconnect(); this.ctx.clearRect(0, 0, this.width, this.height); return this; }
}

export function createCloudBackground(options) { return new CloudBackground(options); }
