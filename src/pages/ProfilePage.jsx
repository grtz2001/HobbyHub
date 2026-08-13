import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getProfile } from '../api/profiles';
import { getWatchLogsByUser, deleteWatchLog } from '../api/watchLogs';
import { getPostsByAuthor } from '../api/posts';
import DiaryEntry from '../components/DiaryEntry';
import PostCard from '../components/PostCard';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import './ProfilePage.css';

export default function ProfilePage({ currentUser }) {
  const { id } = useParams();
  const [profile, setProfile] = useState(null);
  const [logs, setLogs] = useState([]);
  const [posts, setPosts] = useState([]);
  const [tab, setTab] = useState('diary');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setTab('diary');
    (async () => {
      setLoading(true);
      const profileData = await getProfile(id);
      if (cancelled) return;
      setProfile(profileData);
      if (profileData) {
        const [logData, postData] = await Promise.all([
          getWatchLogsByUser(id),
          getPostsByAuthor(id),
        ]);
        if (!cancelled) {
          setLogs(logData);
          setPosts(postData);
        }
      }
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) return <Loader />;
  if (!profile) {
    return (
      <div className="page profile-page">
        <EmptyState bordered title="This show has closed." />
      </div>
    );
  }

  const isOwnProfile = currentUser && currentUser.id === profile.id;
  const showsSeen = new Set(logs.map((l) => l.show_id)).size;
  const rated = logs.filter((l) => l.rating != null);
  const avgGiven = rated.length
    ? (rated.reduce((sum, l) => sum + l.rating, 0) / rated.length).toFixed(1)
    : null;

  async function handleDeleteLog(logId) {
    if (!window.confirm('Delete this diary entry? This cannot be undone.')) return;
    await deleteWatchLog(logId);
    setLogs((ls) => ls.filter((l) => l.id !== logId));
  }

  return (
    <div className="page profile-page">
      <h2>{profile.display_name}</h2>
      <p className="meta">
        Joined {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
      </p>

      <div className="profile-page__stats">
        <div className="profile-page__stat">
          <span className="profile-page__stat-number">{logs.length}</span>
          <span className="meta">Logs</span>
        </div>
        <div className="profile-page__stat">
          <span className="profile-page__stat-number">{showsSeen}</span>
          <span className="meta">Shows</span>
        </div>
        <div className="profile-page__stat">
          <span className="profile-page__stat-number">{posts.length}</span>
          <span className="meta">Posts</span>
        </div>
        <div className="profile-page__stat">
          <span className="profile-page__stat-number">{avgGiven ?? '—'}</span>
          <span className="meta">Avg given</span>
        </div>
      </div>

      <div className="profile-page__tabs">
        <button
          className={tab === 'diary' ? 'is-active' : ''}
          onClick={() => setTab('diary')}
        >
          Diary
        </button>
        <button
          className={tab === 'posts' ? 'is-active' : ''}
          onClick={() => setTab('posts')}
        >
          Posts
        </button>
      </div>

      {tab === 'diary' ? (
        logs.length === 0 ? (
          <EmptyState title="No watches logged yet." subtitle="Log your first." />
        ) : (
          <div>
            {logs.map((log) => (
              <DiaryEntry
                key={log.id}
                log={log}
                onDelete={isOwnProfile ? handleDeleteLog : null}
              />
            ))}
          </div>
        )
      ) : posts.length === 0 ? (
        <EmptyState title="Nothing posted yet." />
      ) : (
        <div className="profile-page__posts">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
