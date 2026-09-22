"use client";

import { motion, useReducedMotion, type HTMLMotionProps } from "framer-motion";
import { usePathname } from "@/i18n/navigation";
import type { ReactNode } from "react";

export const easeOut = [0.22, 1, 0.36, 1] as const;

export function Reveal({
  children,
  className,
  delay = 0,
  y = 22,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y }}
      whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-48px" }}
      transition={{ duration: 0.55, delay, ease: easeOut }}
    >
      {children}
    </motion.div>
  );
}

export function RevealText({
  text,
  className,
  as = "h1",
  delay = 0,
}: {
  text: string;
  className?: string;
  as?: "h1" | "h2" | "h3" | "p";
  delay?: number;
}) {
  const reduce = useReducedMotion();
  const words = text.split(/\s+/).filter(Boolean);
  const Tag = motion[as];
  return (
    <Tag className={className}>
      {words.map((word, i) => (
        <motion.span
          key={`${word}-${i}`}
          className="inline-block"
          style={{ marginInlineEnd: "0.28em" }}
          initial={reduce ? false : { opacity: 0, y: 18, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.5, delay: delay + i * 0.045, ease: easeOut }}
        >
          {word}
        </motion.span>
      ))}
    </Tag>
  );
}

export function Stagger({
  children,
  className,
  delay = 0.07,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-36px" }}
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: reduce ? 0 : delay, delayChildren: 0.05 } },
      }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0, transition: { duration: 0.48, ease: easeOut } },
      }}
    >
      {children}
    </motion.div>
  );
}

export function PageEnter({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const reduce = useReducedMotion();
  return (
    <motion.div
      key={pathname}
      className="overflow-x-clip"
      initial={reduce ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: easeOut }}
    >
      {children}
    </motion.div>
  );
}

export function HoverLift({ children, className, ...props }: HTMLMotionProps<"div">) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      whileHover={reduce ? undefined : { y: -6 }}
      whileTap={reduce ? undefined : { scale: 0.985 }}
      transition={{ type: "spring", stiffness: 380, damping: 24 }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function PageHeader({
  kicker,
  title,
  body,
}: {
  kicker?: string;
  title: string;
  body?: string;
}) {
  return (
    <div className="mb-8">
      {kicker ? (
        <Reveal>
          <p className="section-kicker">{kicker}</p>
        </Reveal>
      ) : null}
      <RevealText text={title} className="text-3xl font-extrabold tracking-tight md:text-4xl" />
      {body ? (
        <Reveal delay={0.12}>
          <p className="mt-3 max-w-2xl text-[var(--muted)]">{body}</p>
        </Reveal>
      ) : null}
    </div>
  );
}
