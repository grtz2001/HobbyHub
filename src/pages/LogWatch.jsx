import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { createWatchLog } from '../api/watchLogs';
import { getShowBySlug } from '../api/shows';
import WatchLogForm from '../components/WatchLogForm';
import Loader from '../components/Loader';
import './PostFormPage.css';

export default function LogWatch({ currentUser }) {
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

  async function handleSubmit({ showId, watchedOn, venue, rating, note }) {
    await createWatchLog({ userId: currentUser.id, showId, watchedOn, venue, rating, note });
    navigate(`/user/${currentUser.id}`);
  }

  if (!ready) return <Loader />;

  return (
    <div className="page post-form-page">
      <h2>Log a watch</h2>
      <p className="meta">Ticket stub &middot; goes to your diary only</p>
      <WatchLogForm initialValues={{ show: preset }} onSubmit={handleSubmit} />
    </div>
  );
}
