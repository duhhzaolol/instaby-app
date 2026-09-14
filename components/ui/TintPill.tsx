export function TintPill({
  color = "#E63946",
  className = "",
  children,
}: {
  color?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${className}`}
      style={{ backgroundColor: `${color}1A`, color }}
    >
      {children}
    </span>
  );
}
