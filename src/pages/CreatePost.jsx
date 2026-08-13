import { useSearchParams, useNavigate } from 'react-router-dom';
import { createPost } from '../api/posts';
import { getShowOptions } from '../api/shows';
import PostForm from '../components/PostForm';
import './PostFormPage.css';

export default function CreatePost({ currentUser }) {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const presetSlug = params.get('show');
  const preset = presetSlug ? getShowOptions().find((s) => s.slug === presetSlug) : null;

  async function handleSubmit({ showId, title, content, imageUrl }) {
    const post = await createPost({ authorId: currentUser.id, showId, title, content, imageUrl });
    navigate(`/post/${post.id}`);
  }

  return (
    <div className="page post-form-page">
      <h2>Write</h2>
      <PostForm
        initialValues={{ show: preset ? { id: preset.id, title: preset.title } : null }}
        onSubmit={handleSubmit}
        submitLabel="Publish"
      />
    </div>
  );
}
