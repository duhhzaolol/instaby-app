export function BarraCarregamentoDiscreta() {
  return (
    <div className="fixed left-0 top-0 z-[100] h-[3px] w-full overflow-hidden bg-transparent">
      <div className="h-full w-1/3 animate-loading-bar rounded-r-full bg-accent" />
    </div>
  );
}
