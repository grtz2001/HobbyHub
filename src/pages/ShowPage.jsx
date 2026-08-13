import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getShowBySlug } from '../api/shows';
import { getPostsByShow } from '../api/posts';
import RatingSquares from '../components/RatingSquares';
import PostCard from '../components/PostCard';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import './ShowPage.css';

export default function ShowPage() {
  const { slug } = useParams();
  const [show, setShow] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const showData = await getShowBySlug(slug);
      if (cancelled) return;
      setShow(showData);
      if (showData) {
        const postData = await getPostsByShow(showData.id);
        if (!cancelled) setPosts(postData);
      }
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (loading) return <Loader />;
  if (!show) {
    return (
      <div className="page show-page">
        <EmptyState
          bordered
          title="This show has closed."
          action={<Link to="/">&larr; Back to the feed</Link>}
        />
      </div>
    );
  }

  return (
    <div className="page show-page">
      <Link to="/shows" className="show-page__back">
        &larr; All shows
      </Link>

      <div className="show-page__header">
        {show.poster_url ? (
          <img src={show.poster_url} alt={`${show.title} poster`} className="show-page__poster" />
        ) : (
          <span className="show-page__poster show-page__poster--fallback">
            <span>{show.title}</span>
          </span>
        )}

        <div className="show-page__details">
          <h2>{show.title}</h2>
          <p className="meta">
            {[
              show.opening_year,
              `Seen by ${show.viewer_count} ${show.viewer_count === 1 ? 'person' : 'people'}`,
              `${show.log_count} ${show.log_count === 1 ? 'log' : 'logs'}`,
            ]
              .filter(Boolean)
              .join(' · ')}
          </p>

          <div className="show-page__rating">
            {show.avg_rating ? (
              <>
                <span className="show-page__avg">{show.avg_rating}</span>
                <RatingSquares value={Math.round(show.avg_rating)} size="md" />
                <span className="meta">From {show.rating_count} ratings</span>
              </>
            ) : (
              <span className="meta">Not yet rated</span>
            )}
          </div>

          <div className="show-page__buttons">
            <Link to={`/log?show=${show.slug}`} className="btn">
              Log a watch
            </Link>
            <Link to={`/new?show=${show.slug}`} className="btn">
              Start a discussion
            </Link>
          </div>
        </div>
      </div>

      <hr className="rule show-page__rule" />
      <h3 className="show-page__discussion-heading">Discussion ({posts.length})</h3>

      {posts.length === 0 ? (
        <EmptyState title="Nothing posted about this show yet." />
      ) : (
        <div className="show-page__rows">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
