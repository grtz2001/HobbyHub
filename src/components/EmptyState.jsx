import './EmptyState.css';

// Also doubles as the error/404 panel — pass `bordered` for the hard-edged
// panel treatment used by "Something went wrong backstage." and 404.
export default function EmptyState({ title, subtitle, action, bordered = false }) {
  return (
    <div className={bordered ? 'empty-state empty-state--bordered' : 'empty-state'}>
      <h3>{title}</h3>
      {subtitle && <p className="empty-state__subtitle">{subtitle}</p>}
      {action}
    </div>
  );
}
