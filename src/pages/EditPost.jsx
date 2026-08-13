import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getPost, updatePost } from '../api/posts';
import PostForm from '../components/PostForm';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import './PostFormPage.css';

export default function EditPost({ currentUser }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const data = await getPost(id);
      if (!cancelled) {
        setPost(data);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) return <Loader />;
  if (!post) {
    return (
      <div className="page post-form-page">
        <EmptyState title="This show has closed." />
      </div>
    );
  }
  if (!currentUser || post.author_id !== currentUser.id) {
    return (
      <div className="page post-form-page">
        <EmptyState title="You can't edit someone else's post." />
      </div>
    );
  }

  async function handleSubmit({ showId, title, content, imageUrl }) {
    await updatePost(id, {
      show_id: showId,
      title: title.trim(),
      content: content?.trim() || null,
      image_url: imageUrl?.trim() || null,
    });
    navigate(`/post/${id}`);
  }

  return (
    <div className="page post-form-page">
      <h2>Revise</h2>
      <PostForm
        initialValues={{
          show: post.shows ? { id: post.shows.id, title: post.shows.title } : null,
          title: post.title,
          content: post.content ?? '',
          imageUrl: post.image_url ?? '',
        }}
        onSubmit={handleSubmit}
        submitLabel="Save changes"
      />
    </div>
  );
}
