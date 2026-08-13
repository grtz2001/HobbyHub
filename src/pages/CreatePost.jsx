import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { createPost } from '../api/posts';
import { getShowBySlug } from '../api/shows';
import PostForm from '../components/PostForm';
import Loader from '../components/Loader';
import './PostFormPage.css';

export default function CreatePost({ currentUser }) {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const presetSlug = params.get('show');

  const [preset, setPreset] = useState(null);
  const [ready, setReady] = useState(!presetSlug);

  useEffect(() => {
    if (!presetSlug) return;
    let cancelled = false;
    getShowBySlug(presetSlug).then((show) => {
      if (cancelled) return;
      if (show) setPreset({ id: show.id, title: show.title });
      setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [presetSlug]);

  async function handleSubmit({ showId, title, content, imageUrl }) {
    const post = await createPost({ authorId: currentUser.id, showId, title, content, imageUrl });
    navigate(`/post/${post.id}`);
  }

  if (!ready) return <Loader />;

  return (
    <div className="page post-form-page">
      <h2>Write</h2>
      <PostForm initialValues={{ show: preset }} onSubmit={handleSubmit} submitLabel="Publish" />
    </div>
  );
}
