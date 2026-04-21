export function TabStrip({ title }: { title: string }) {
  return (
    <div className="tabStrip">
      <div className="tab activeTab">{title}</div>
    </div>
  );
}
