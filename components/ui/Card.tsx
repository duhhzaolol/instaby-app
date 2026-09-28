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
      initial={{ opacity: 0, y: 16, filter: "blur(4px)", scale: 0.98 }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)", scale: 1 }}
      transition={{ duration: 0.5, delay: index * 0.06, ease: [0.16, 1, 0.3, 1] }}
      whileHover={hoverable ? { y: -2, scale: 1.01 } : undefined}
      className={cn(
        // v144: cartão sólido, sem transparência nem blur (pedido do redesign
        // do painel) — antes era bg-card/70 backdrop-blur-xs. Como esse
        // componente só é usado dentro do painel/login (a landing tem os
        // próprios cartões, não importa este arquivo), a mudança não vaza
        // pra lugar nenhum fora do escopo do redesign.
        "rounded-2xl border border-border bg-card shadow-premium transition-shadow duration-200",
        hoverable && "hover:shadow-premium-lg hover:border-white/10",
        className
      )}
      {...(props as any)}
    >
      {children}
    </motion.div>
  );
}
