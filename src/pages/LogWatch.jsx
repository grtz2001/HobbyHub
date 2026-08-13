import { useSearchParams, useNavigate } from 'react-router-dom';
import { createWatchLog } from '../api/watchLogs';
import { getShowOptions } from '../api/shows';
import WatchLogForm from '../components/WatchLogForm';
import './PostFormPage.css';

export default function LogWatch({ currentUser }) {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const presetSlug = params.get('show');
  const preset = presetSlug ? getShowOptions().find((s) => s.slug === presetSlug) : null;

  async function handleSubmit({ showId, watchedOn, venue, rating, note }) {
    await createWatchLog({ userId: currentUser.id, showId, watchedOn, venue, rating, note });
    navigate(`/user/${currentUser.id}`);
  }

  return (
    <div className="page post-form-page">
      <h2>Log a watch</h2>
      <p className="meta">Ticket stub &middot; goes to your diary only</p>
      <WatchLogForm
        initialValues={{ show: preset ? { id: preset.id, title: preset.title } : null }}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
