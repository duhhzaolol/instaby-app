export function IconTile({
  color = "#E63946",
  size = "sm",
  className = "",
  children,
}: {
  color?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  children: React.ReactNode;
}) {
  const tamanho = size === "lg" ? "h-11 w-11" : size === "md" ? "h-8 w-8" : "h-7 w-7";
  const raio = size === "lg" ? "rounded-xl" : "rounded-lg";
  return (
    <div
      className={`flex shrink-0 items-center justify-center ${tamanho} ${raio} ${className}`}
      style={{ backgroundColor: `${color}1A`, color }}
    >
      {children}
    </div>
  );
}
