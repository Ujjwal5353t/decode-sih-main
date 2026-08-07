"use client";

import { cn } from "@/lib/utils";

interface GradientBlobProps {
  className?: string;
  color?: "brand" | "accent" | "sky" | "rose";
  size?: "sm" | "md" | "lg";
  style?: React.CSSProperties;
}

const colorMap = {
  brand: "bg-brand/30",
  accent: "bg-accent/30",
  sky: "bg-sky/30",
  rose: "bg-rose/30",
};

const sizeMap = {
  sm: "w-48 h-48",
  md: "w-72 h-72",
  lg: "w-96 h-96",
};

export function GradientBlob({
  className,
  color = "brand",
  size = "md",
  style,
}: GradientBlobProps) {
  return (
    <div
      className={cn("blob", colorMap[color], sizeMap[size], className)}
      style={style}
      aria-hidden="true"
    />
  );
}
