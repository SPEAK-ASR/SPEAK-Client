import type { Variants, Transition } from "framer-motion";

export const easeOut: Transition["ease"] = [0.16, 1, 0.3, 1];

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.15 } },
  exit: { opacity: 0, transition: { duration: 0.1 } },
};

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.2, ease: easeOut } },
  exit: { opacity: 0, y: -4, transition: { duration: 0.15 } },
};

export const routeFade: Variants = {
  hidden: { opacity: 0, y: 4 },
  show: { opacity: 1, y: 0, transition: { duration: 0.18, ease: easeOut } },
  exit: { opacity: 0, y: -4, transition: { duration: 0.12 } },
};

export const pop: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.18, ease: easeOut } },
  exit: { opacity: 0, scale: 0.97, transition: { duration: 0.12 } },
};

export const stagger = (delay = 0.04): Variants => ({
  hidden: {},
  show: {
    transition: {
      staggerChildren: delay,
    },
  },
});

/** Landing page — springy reveals */
export const landingSpringTransition: Transition = {
  type: "spring",
  stiffness: 200,
  damping: 28,
  mass: 0.85,
};

export const landingFadeUp: Variants = {
  hidden: { opacity: 0, y: 22 },
  show: {
    opacity: 1,
    y: 0,
    transition: landingSpringTransition,
  },
};

export const landingFadeUpBlur: Variants = {
  hidden: { opacity: 0, y: 28, filter: "blur(8px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { ...landingSpringTransition, stiffness: 160, damping: 30 },
  },
};

export const landingScaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.92 },
  show: {
    opacity: 1,
    scale: 1,
    transition: landingSpringTransition,
  },
};
