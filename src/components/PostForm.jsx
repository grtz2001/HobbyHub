import { useState } from 'react';
import ShowPicker from './ShowPicker';
import './PostForm.css';

// Shared by CreatePost and EditPost. No type toggle, no rating field —
// there is one kind of post and it never carries a rating.
export default function PostForm({ initialValues, onSubmit, submitLabel }) {
  const [show, setShow] = useState(initialValues.show ?? null);
  const [title, setTitle] = useState(initialValues.title ?? '');
  const [content, setContent] = useState(initialValues.content ?? '');
  const [imageUrl, setImageUrl] = useState(initialValues.imageUrl ?? '');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({ showId: show?.id ?? null, title, content, imageUrl });
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  }

  return (
    <form className="post-form" onSubmit={handleSubmit}>
      <div className="field">
        <label>Show</label>
        <ShowPicker value={show} onChange={setShow} />
        <span className="help">Optional — tag this to a show</span>
      </div>

      <div className="field">
        <label htmlFor="p-title">Title</label>
        <input
          id="p-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Say it plainly"
          required
        />
      </div>

      <div className="field">
        <label htmlFor="p-body">Body</label>
        <textarea
          id="p-body"
          rows={8}
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <span className="help">Optional — a title on its own is a fine post</span>
      </div>

      <div className="field">
        <label htmlFor="p-img">Image URL</label>
        <input
          id="p-img"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="https://"
        />
        <span className="help">Paste a link to a poster or still</span>
      </div>

      {error && <p className="post-form__error">{error}</p>}

      <button type="submit" className="btn post-form__submit" disabled={submitting || !title.trim()}>
        {submitLabel}
      </button>
    </form>
  );
}
