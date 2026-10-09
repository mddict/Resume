

import React from './react.js';
import { motion, useMotionValue, useSpring, useReducedMotion } from './motion-react.js';

export function generateStars(count, starColor) {
  const shadows = [];
  for (let i = 0; i < count; i++) {
    const x = Math.floor(Math.random() * 4000) - 2000;
    const y = Math.floor(Math.random() * 4000) - 2000;
    shadows.push(`${x}px ${y}px ${starColor}`);
  }
  return shadows.join(', ');
}

export function animateNightStar(node) {
  let active = true;
  let animation;
  let x = 0;
  let y = 0;
  let initial = true;

  function nextCycle() {
    if (!active) return;
    const nextX = (Math.random() - 0.5) * 16;
    const nextY = (Math.random() - 0.5) * 16;
    const bendX = (Math.random() - 0.5) * 16;
    const bendY = (Math.random() - 0.5) * 16;
    const duration = 4000 + Math.random() * 4000;
    const previousAnimation = animation;
    animation = node.animate([
      { transform: `translate(${x}px, ${y}px)`, opacity: 0.65, offset: 0 },
      { transform: `translate(${bendX}px, ${bendY}px)`, opacity: 0.08, offset: 0.3 },
      { transform: `translate(${(bendX + nextX) / 2}px, ${(bendY + nextY) / 2}px)`, opacity: 1, offset: 0.65 },
      { transform: `translate(${nextX}px, ${nextY}px)`, opacity: 0.65, offset: 1 }
    ], {
      duration,
      delay: initial ? -Math.random() * duration : 0,
      easing: 'ease-in-out',
      fill: 'forwards'
    });
    if (previousAnimation) previousAnimation.cancel();
    x = nextX;
    y = nextY;
    initial = false;
    animation.onfinish = nextCycle;
  }

  nextCycle();
  return () => {
    active = false;
    if (animation) {
      animation.onfinish = null;
      animation.cancel();
    }
  };
}

export function StarLayer({
  count = 70, size = 1, starColor = '#fff', className = '', transition, ...props
}) {
  const layerRef = React.useRef(null);
  const [stars] = React.useState(() => Array.from({ length: count }, () => ({
    x: Math.random() * 100,
    y: Math.random() * 100,
    duration: 3 + Math.random() * 6,
    delay: -Math.random() * 12,
    brightness: 0.5 + Math.random() * 0.45
  })));

  React.useEffect(() => {
    const stops = [...layerRef.current.querySelectorAll('.night-sky-star')]
      .map(node => animateNightStar(node));
    return () => stops.forEach(stop => stop());
  }, []);

  return React.createElement('div', {
    ref: layerRef,
    'data-slot': 'star-layer',
    className: `animate-star-layer ${className}`,
    ...props
  }, stars.map((star, index) => React.createElement('span', {
    key: index,
    className: 'night-sky-star',
    style: {
      left: `${star.x}%`,
      top: `${star.y}%`,
      width: `${size}px`,
      height: `${size}px`,
      background: starColor,
      '--star-brightness': star.brightness,
      animationDuration: `${star.duration}s`,
      animationDelay: `${star.delay}s`
    }
  })));
}

export function StarsBackground({
  children, className = '', factor = 0.05, speed = 50,
  transition = { stiffness: 50, damping: 20 },
  starColor = '#fff', pointerEvents = true, ...props
}) {
  const reduced = useReducedMotion();
  const offsetX = useMotionValue(1);
  const offsetY = useMotionValue(1);
  const springX = useSpring(offsetX, transition);
  const springY = useSpring(offsetY, transition);
  const handleMouseMove = React.useCallback(event => {
    if (reduced) return;
    offsetX.set(-(event.clientX - window.innerWidth / 2) * factor);
    offsetY.set(-(event.clientY - window.innerHeight / 2) * factor);
  }, [offsetX, offsetY, factor, reduced]);

  React.useEffect(() => {
    window.addEventListener('pointermove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('pointermove', handleMouseMove);
  }, [handleMouseMove]);

  return React.createElement('div', {
    'data-slot': 'stars-background',
    className: `animate-stars-background ${className}`,
    ...props
  },
    React.createElement(motion.div, {
      style: { x: springX, y: springY, pointerEvents: pointerEvents ? 'auto' : 'none' }
    },
      React.createElement(StarLayer, { count: 70, size: 1, transition: { repeat: Infinity, duration: speed, ease: 'linear' }, starColor }),
      React.createElement(StarLayer, { count: 30, size: 2, transition: { repeat: Infinity, duration: speed * 2, ease: 'linear' }, starColor }),
      React.createElement(StarLayer, { count: 12, size: 3, transition: { repeat: Infinity, duration: speed * 3, ease: 'linear' }, starColor })
    ), children
  );
}
