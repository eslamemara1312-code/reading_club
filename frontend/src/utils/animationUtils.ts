import { Variants, Transition } from 'framer-motion';

/**
 * Standardized Spring Transitions for consistent responsive UI feel
 */
export const springPhysics = {
  bouncy: { type: 'spring', stiffness: 400, damping: 22 } as Transition,
  gentle: { type: 'spring', stiffness: 250, damping: 25 } as Transition,
  snappy: { type: 'spring', stiffness: 500, damping: 30 } as Transition,
  smooth: { duration: 0.35, ease: [0.25, 1, 0.5, 1] } as Transition,
};

/**
 * Page Transition Variants
 */
export const pageVariants: Variants = {
  initial: {
    opacity: 0,
    y: 12,
    scale: 0.99,
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.3,
      ease: [0.22, 1, 0.36, 1],
      when: 'beforeChildren',
      staggerChildren: 0.06,
    },
  },
  exit: {
    opacity: 0,
    y: -8,
    scale: 0.99,
    transition: {
      duration: 0.2,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

/**
 * Stagger Container & Child Variants
 */
export const staggerContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05,
    },
  },
};

export const staggerItemVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: springPhysics.gentle,
  },
};

/**
 * Interactive Tap & Hover presets
 */
export const buttonPressAnimation = {
  whileHover: { scale: 1.03, y: -1 },
  whileTap: { scale: 0.95 },
  transition: springPhysics.bouncy,
};

export const cardHoverAnimation = {
  whileHover: { scale: 1.02, y: -3, transition: springPhysics.gentle },
  whileTap: { scale: 0.98 },
};

/**
 * 3D Book Cover Flip Variants
 */
export const bookFlipVariants: Variants = {
  front: {
    rotateY: 0,
    transition: { duration: 0.6, ease: [0.23, 1, 0.32, 1] },
  },
  back: {
    rotateY: 180,
    transition: { duration: 0.6, ease: [0.23, 1, 0.32, 1] },
  },
};

/**
 * Pulse animation for habit streak / "الحماسة" badge
 */
export const pulseAnimation: Variants = {
  initial: { scale: 1 },
  pulse: {
    scale: [1, 1.12, 1],
    transition: {
      duration: 0.6,
      repeat: Infinity,
      repeatDelay: 3,
      ease: 'easeInOut',
    },
  },
};
