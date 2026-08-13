import { Link } from 'react-router-dom';
import RatingSquares from './RatingSquares';
import { formatWatchDate, ordinal } from '../utils';
import './DiaryEntry.css';

// The only place a watch log ever renders. `onDelete` is passed only when
// viewing your own profile — a stranger's diary shows no delete control.
export default function DiaryEntry({ log, onDelete }) {
  const dateVenue = [formatWatchDate(log.watched_on), log.venue].filter(Boolean).join(' · ');

  return (
    <div className="diary-entry">
      {log.shows?.poster_url ? (
        <img src={log.shows.poster_url} alt={log.shows.title} className="diary-entry__poster" />
      ) : (
        <span className="diary-entry__poster diary-entry__poster--fallback">
          <span>{log.shows?.title}</span>
        </span>
      )}

      <div className="diary-entry__title-row">
        <Link to={`/show/${log.shows?.slug}`} className="diary-entry__show">
          {log.shows?.title}
        </Link>
        {log.watchTotal > 1 && (
          <span className="diary-entry__badge meta">{ordinal(log.watchNumber)} watch</span>
        )}
      </div>

      <p className="meta diary-entry__meta">{dateVenue}</p>

      {log.rating != null && <RatingSquares value={log.rating} size="sm" />}

      {log.note && <p className="diary-entry__note">{log.note}</p>}

      {onDelete && (
        <div className="diary-entry__actions">
          <button className="btn-text-danger" onClick={() => onDelete(log.id)}>
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
