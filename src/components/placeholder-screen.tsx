type PlaceholderScreenProps = {
  title: string;
  subtitle: string;
};

export function PlaceholderScreen({ title, subtitle }: PlaceholderScreenProps) {
  return (
    <section className="rounded-3xl border border-border bg-surface p-4 shadow-[0_12px_40px_-30px_rgba(0,0,0,0.5)]">
      <h2 className="text-xl font-bold tracking-tight text-foreground">{title}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
    </section>
  );
}
