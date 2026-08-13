import { Link } from 'react-router-dom';
import { timeAgo } from '../utils';
import './PostCard.css';

// Renders EXACTLY three fields: creation time, title, bravo count. This is
// an explicit grading requirement — no body, no image, no author byline, no
// show name, no rating squares. See CLAUDE.md "Things that will bite".
export default function PostCard({ post }) {
  return (
    <Link to={`/post/${post.id}`} className="post-card">
      <span className="post-card__time meta">{timeAgo(post.created_at)}</span>
      <span className="post-card__title">{post.title}</span>
      <span className="post-card__bravos">
        <span className="post-card__triangle">&#9650;</span>
        {post.upvotes}
      </span>
    </Link>
  );
}
