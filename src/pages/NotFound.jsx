import { Link } from 'react-router-dom';
import EmptyState from '../components/EmptyState';
import './NotFound.css';

export default function NotFound() {
  return (
    <div className="page not-found">
      <EmptyState title="This show has closed." action={<Link to="/">&larr; Back to the feed</Link>} />
    </div>
  );
}
