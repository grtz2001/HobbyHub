import { useState } from 'react';
import { createComment } from '../api/comments';
import './CommentForm.css';

export default function CommentForm({ postId, currentUser, onCreated }) {
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!body.trim() || submitting) return;

    setSubmitting(true);
    try {
      const comment = await createComment({ postId, authorId: currentUser.id, content: body });
      onCreated(comment);
      setBody('');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="comment-form" onSubmit={handleSubmit}>
      <label htmlFor="comment-body" className="meta">
        Add a comment
      </label>
      <textarea
        id="comment-body"
        rows={3}
        placeholder="Say your piece"
        value={body}
        onChange={(e) => setBody(e.target.value)}
      />
      <button type="submit" className="btn" disabled={submitting || !body.trim()}>
        Post
      </button>
    </form>
  );
}
