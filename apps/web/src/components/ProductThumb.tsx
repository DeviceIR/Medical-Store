"use client";

import { useState } from "react";
import { CategoryIcon, categoryTone } from "./CategoryIcon";

export function ProductThumb({
  src,
  alt,
  slug,
  className = "aspect-[4/3]",
  compact = false,
}: {
  src?: string;
  alt: string;
  slug: string;
  className?: string;
  compact?: boolean;
}) {
  const [failed, setFailed] = useState(!src);
  const tone = categoryTone(slug);

  return (
    <div className={`relative overflow-hidden bg-gradient-to-br ${tone} ${className}`} style={{ perspective: 720 }}>
      <span className="thumb-orb" />
      <div className="absolute inset-0 grid place-items-center text-white/90">
        <span className={`thumb-3d ${compact ? "thumb-3d-sm" : ""}`}>
          <CategoryIcon slug={slug} className={compact ? "size-6" : "size-12"} />
        </span>
      </div>
      {!failed && src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          className="relative h-full w-full object-cover transition duration-500 group-hover:scale-105"
          onError={() => setFailed(true)}
        />
      ) : null}
    </div>
  );
}
