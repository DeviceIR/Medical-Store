"use client";

import { motion, useReducedMotion, type HTMLMotionProps } from "framer-motion";
import { Link } from "@/i18n/navigation";
import type { ComponentProps, ReactNode } from "react";

const spring = { type: "spring" as const, stiffness: 520, damping: 24, mass: 0.38 };

function hoverFor(className?: string) {
  if (className?.includes("w-full")) return { y: -2, scale: 1.015 };
  if (className?.includes("size-10")) return { scale: 1.08, rotate: 8 };
  if (className?.includes("px-3 py-1")) return { y: -2, scale: 1.08 };
  return { y: -4, scale: 1.045 };
}

function Shine({ on }: { on: boolean }) {
  if (!on) return null;
  return <span className="btn-shine" aria-hidden />;
}

export function MotionButton({
  children,
  className,
  disabled,
  ...props
}: HTMLMotionProps<"button">) {
  const reduce = useReducedMotion();
  const live = !reduce && !disabled;
  return (
    <motion.button
      {...props}
      className={className}
      disabled={disabled}
      whileHover={live ? hoverFor(className) : undefined}
      whileTap={live ? { scale: 0.98 } : undefined}
      transition={spring}
    >
      <Shine on={!!className?.includes("btn")} />
      {children}
    </motion.button>
  );
}

const FxLink = motion.create(Link);

export function MotionLink({
  children,
  className,
  ...props
}: ComponentProps<typeof Link> & { children?: ReactNode }) {
  const reduce = useReducedMotion();
  return (
    <FxLink
      {...props}
      className={className}
      whileHover={reduce ? undefined : hoverFor(className)}
      transition={spring}
    >
      <Shine on={!!className?.includes("btn")} />
      {children}
    </FxLink>
  );
}
