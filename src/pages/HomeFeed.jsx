import { useEffect, useState } from 'react';
import { getPosts } from '../api/posts';
import PostCard from '../components/PostCard';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import './HomeFeed.css';

export default function HomeFeed({ search }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [orderBy, setOrderBy] = useState('created_at');

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const data = await getPosts({ orderBy });
        if (!cancelled) setPosts(data);
      } catch (err) {
        console.error(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [orderBy]);

  const q = search.trim().toLowerCase();
  const visible = q ? posts.filter((p) => p.title.toLowerCase().includes(q)) : posts;

  return (
    <div className="home-feed page">
      <div className="home-feed__controls">
        <span className="meta">Sort:</span>
        <select
          aria-label="Sort posts"
          value={orderBy}
          onChange={(e) => setOrderBy(e.target.value)}
        >
          <option value="created_at">Newest</option>
          <option value="upvotes">Most bravos</option>
        </select>
      </div>

      {loading ? (
        <Loader />
      ) : visible.length === 0 ? (
        <EmptyState
          title={q ? 'No posts match that title.' : 'Nothing posted yet.'}
          subtitle={q ? null : 'Raise the curtain.'}
        />
      ) : (
        <div className="home-feed__rows">
          {visible.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
