"use client";

import { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
  index?: number;
}

export function Card({ className, hoverable = false, index: _index, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-card",
        hoverable && "transition-colors duration-150 hover:bg-hover motion-reduce:transition-none",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
