import { useState } from 'react';
import ShowPicker from './ShowPicker';
import RatingSquares from './RatingSquares';
import './WatchLogForm.css';

const today = () => new Date().toLocaleDateString('en-CA'); // 'YYYY-MM-DD', local time

// Shared by LogWatch. Show and date are required; venue, rating, and note
// are not. No "also post this" control — logging and posting stay separate.
export default function WatchLogForm({ initialValues, onSubmit }) {
  const [show, setShow] = useState(initialValues.show ?? null);
  const [watchedOn, setWatchedOn] = useState(initialValues.watchedOn ?? today());
  const [venue, setVenue] = useState(initialValues.venue ?? '');
  const [rating, setRating] = useState(initialValues.rating ?? null);
  const [note, setNote] = useState(initialValues.note ?? '');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (submitting || !show) return;

    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({ showId: show.id, watchedOn, venue, rating, note });
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  }

  return (
    <form className="watch-log-form" onSubmit={handleSubmit}>
      <div className="field watch-log-form__row">
        <label>Show &middot; required</label>
        <ShowPicker value={show} onChange={setShow} required />
      </div>

      <div className="field watch-log-form__row">
        <label htmlFor="l-date">Date watched &middot; required</label>
        <input
          id="l-date"
          type="date"
          value={watchedOn}
          onChange={(e) => setWatchedOn(e.target.value)}
          required
        />
      </div>

      <div className="field watch-log-form__row">
        <label htmlFor="l-venue">Venue</label>
        <input
          id="l-venue"
          value={venue}
          onChange={(e) => setVenue(e.target.value)}
          placeholder="Walter Kerr Theatre"
        />
        <span className="help">Theatre, or how you saw it</span>
      </div>

      <fieldset className="watch-log-form__rating watch-log-form__row">
        <legend>Rating</legend>
        <div className="watch-log-form__rating-row">
          <RatingSquares value={rating ?? 0} onChange={setRating} size="lg" />
          {rating != null && (
            <button type="button" className="watch-log-form__clear" onClick={() => setRating(null)}>
              Clear rating
            </button>
          )}
        </div>
        <span className="help">Optional — leave it unrated if you'd rather not score it</span>
      </fieldset>

      <div className="field watch-log-form__row">
        <label htmlFor="l-note">Note</label>
        <textarea id="l-note" rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
        <span className="help">Just for you</span>
      </div>

      {error && <p className="watch-log-form__error">{error}</p>}

      <button type="submit" className="btn watch-log-form__submit" disabled={submitting || !show}>
        Save to diary
      </button>
    </form>
  );
}
