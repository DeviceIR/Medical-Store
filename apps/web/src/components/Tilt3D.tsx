"use client";

import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring } from "framer-motion";

export function Tilt3D({
  children,
  className,
  intensity = 14,
}: {
  children: ReactNode;
  className?: string;
  intensity?: number;
}) {
  const reduce = useReducedMotion();
  const [live, setLive] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const rotateX = useSpring(rx, { stiffness: 220, damping: 20, mass: 0.4 });
  const rotateY = useSpring(ry, { stiffness: 220, damping: 20, mass: 0.4 });

  useEffect(() => {
    setLive(true);
  }, []);

  function onMove(e: MouseEvent) {
    if (reduce || !ref.current) return;
    const box = ref.current.getBoundingClientRect();
    const px = (e.clientX - box.left) / box.width - 0.5;
    const py = (e.clientY - box.top) / box.height - 0.5;
    rx.set(py * -intensity);
    ry.set(px * intensity);
  }

  function onLeave() {
    rx.set(0);
    ry.set(0);
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      style={live && !reduce ? { rotateX, rotateY, transformPerspective: 920, transformStyle: "preserve-3d" } : undefined}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
    >
      {children}
    </motion.div>
  );
}
