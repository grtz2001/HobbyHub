import { Link } from 'react-router-dom';
import { timeAgo } from '../utils';
import './CommentList.css';

export default function CommentList({ comments }) {
  if (comments.length === 0) {
    return <p className="meta comment-list__empty">Nobody has answered yet.</p>;
  }

  return (
    <div className="comment-list">
      {comments.map((c) => (
        <div key={c.id} className="comment-list__item">
          <p className="meta">
            <Link to={`/user/${c.author_id}`}>{c.profiles?.display_name ?? 'Deleted user'}</Link>
            {' · '}
            {timeAgo(c.created_at)}
          </p>
          <p className="comment-list__body">{c.content}</p>
        </div>
      ))}
    </div>
  );
}
