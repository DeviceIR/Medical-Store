"use client";

export function Plus3D({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const dim = size === "sm" ? 36 : size === "lg" ? 120 : 88;
  return (
    <div className={`plus-3d plus-3d-${size}`} style={{ width: dim, height: dim }}>
      <span className="plus-3d-arm plus-3d-h" />
      <span className="plus-3d-arm plus-3d-v" />
    </div>
  );
}
