import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getPost } from '../api/posts';
import { getComments } from '../api/comments';
import { timeAgo } from '../utils';
import BravoButton from '../components/BravoButton';
import OwnerActions from '../components/OwnerActions';
import CommentForm from '../components/CommentForm';
import CommentList from '../components/CommentList';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import './PostPage.css';

export default function PostPage({ currentUser }) {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const [postData, commentData] = await Promise.all([getPost(id), getComments(id)]);
        if (cancelled) return;
        setPost(postData);
        setComments(commentData);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) return <Loader />;
  if (!post) {
    return (
      <div className="page post-page">
        <EmptyState
          bordered
          title="This show has closed."
          action={<Link to="/">&larr; Back to the feed</Link>}
        />
      </div>
    );
  }

  const isAuthor = currentUser && post.author_id === currentUser.id;
  const byline = post.shows ? (
    <>
      <Link to={`/show/${post.shows.slug}`}>{post.shows.title}</Link>
      {' · Posted by '}
      <Link to={`/user/${post.author_id}`}>{post.profiles?.display_name ?? 'Deleted user'}</Link>
    </>
  ) : (
    <>
      {'Posted by '}
      <Link to={`/user/${post.author_id}`}>{post.profiles?.display_name ?? 'Deleted user'}</Link>
    </>
  );

  return (
    <div className="page post-page">
      <Link to="/" className="post-page__back">
        &larr; Back
      </Link>

      <p className="meta post-page__byline">{byline}</p>
      <h2>{post.title}</h2>
      <p className="meta post-page__time">{timeAgo(post.created_at)}</p>

      <hr className="rule post-page__rule" />

      {post.image_url && (
        <img src={post.image_url} alt="Post" className="post-page__image" />
      )}

      {post.content && <div className="post-page__body">{post.content}</div>}

      <hr className="rule-hair post-page__rule" />
      <div className="post-page__actions">
        <BravoButton postId={post.id} initialUpvotes={post.upvotes} />
        {isAuthor && <OwnerActions post={post} />}
      </div>
      <hr className="rule-hair" />

      <h3 className="post-page__comments-heading">Comments ({comments.length})</h3>

      {currentUser && (
        <CommentForm
          postId={post.id}
          currentUser={currentUser}
          onCreated={(c) => setComments((cs) => [...cs, c])}
        />
      )}

      <CommentList comments={comments} />
    </div>
  );
}
