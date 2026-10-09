

import React from './react.js';
import { motion } from './motion-react.js';

export function Button({ hoverScale = 1.05, tapScale = 0.95, ...props }) {
  return React.createElement(motion.button, {
    whileTap: { scale: tapScale },
    whileHover: { scale: hoverScale },
    ...props
  });
}
