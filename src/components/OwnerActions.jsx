import { useNavigate } from 'react-router-dom';
import { deletePost } from '../api/posts';
import './OwnerActions.css';

// Edit and Delete, shown only when the current user is the post's author.
export default function OwnerActions({ post }) {
  const navigate = useNavigate();

  async function handleDelete() {
    if (!window.confirm('Delete this post? This cannot be undone.')) return;
    await deletePost(post.id);
    navigate('/');
  }

  return (
    <div className="owner-actions">
      <button className="btn-outline" onClick={() => navigate(`/post/${post.id}/edit`)}>
        Edit
      </button>
      <button className="btn-danger" onClick={handleDelete}>
        Delete
      </button>
    </div>
  );
}
