export function StatusDot({
  color = "#9CA3AF",
  size = 8,
  className = "",
}: {
  color?: string;
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={`inline-block shrink-0 rounded-full ${className}`}
      style={{ width: size, height: size, backgroundColor: color }}
    />
  );
}
