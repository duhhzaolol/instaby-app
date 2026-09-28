"use client";

import { HTMLAttributes } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/cn";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
  index?: number;
}

export function Card({ className, hoverable = true, index = 0, children, ...props }: CardProps) {
  return (
    <motion.div
      // Redesign fase 1: cartão sólido, sem blur nem sombra pesada — a entrada
      // ficou mais curta e sem desfoque (o blur animado pesava em tela cheia de cartões).
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.04, ease: [0.16, 1, 0.3, 1] }}
      whileHover={hoverable ? { y: -2 } : undefined}
      className={cn(
        "rounded-2xl border border-border bg-card transition-colors duration-200",
        hoverable && "hover:border-white/10",
        className
      )}
      {...(props as any)}
    >
      {children}
    </motion.div>
  );
}
