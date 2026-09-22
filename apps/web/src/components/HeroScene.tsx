"use client";

import { FlaskConical, Scan, Scissors, Stethoscope } from "lucide-react";
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";
import { MouseEvent, useEffect, useState } from "react";
import { Plus3D } from "./Plus3D";

type Stat = { value: string; label: string };

export function HeroScene({
  stats,
  labels,
  compact = false,
}: {
  stats?: Stat[];
  labels: { surgical: string; diagnostic: string; laboratory: string; imaging: string };
  compact?: boolean;
}) {
  const reduce = useReducedMotion();
  const [live, setLive] = useState(false);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rotateY = useSpring(useTransform(mx, [-0.5, 0.5], [-16, 16]), { stiffness: 120, damping: 18 });
  const rotateX = useSpring(useTransform(my, [-0.5, 0.5], [10, -10]), { stiffness: 120, damping: 18 });

  useEffect(() => {
    setLive(true);
  }, []);

  function onMove(e: MouseEvent<HTMLDivElement>) {
    if (reduce) return;
    const box = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - box.left) / box.width - 0.5);
    my.set((e.clientY - box.top) / box.height - 0.5);
  }

  const tiles = [
    { icon: Scissors, label: labels.surgical, className: "tile-a" },
    { icon: Stethoscope, label: labels.diagnostic, className: "tile-b" },
    { icon: FlaskConical, label: labels.laboratory, className: "tile-c" },
    { icon: Scan, label: labels.imaging, className: "tile-d" },
  ];

  return (
    <div className={`hero-stage ${compact ? "hero-stage-compact" : ""}`} dir="ltr" onMouseMove={onMove} onMouseLeave={() => { mx.set(0); my.set(0); }}>
      <div className="hero-floor" />
      <motion.div className="hero-rig" style={live && !reduce ? { rotateX, rotateY } : undefined}>
        <span className="orbit orbit-a" />
        <span className="orbit orbit-b" />
        <span className="capsule-3d capsule-left" />
        <span className="capsule-3d capsule-right" />
        <div className="hero-core">
          <Plus3D size={compact ? "md" : "lg"} />
        </div>
        {tiles.map(({ icon: Icon, label, className }) => (
          <div key={label} className={`glass-tile ${className}`}>
            <span className="glass-tile-icon">
              <Icon className="size-5" />
            </span>
            <span>{label}</span>
          </div>
        ))}
        {!compact && stats
          ? stats.map((stat, i) => (
              <div key={stat.label} className={`stat-chip chip-${i}`}>
                <strong>{stat.value}</strong>
                <small>{stat.label}</small>
              </div>
            ))
          : null}
      </motion.div>
    </div>
  );
}
