import { useState } from 'react';
import { getShowOptions, findOrCreateShow } from '../api/shows';
import showTitles from '../data/showTitles.json';
import './ShowPicker.css';

// Shared by PostForm and WatchLogForm. `value` is { id, title } or null.
// Selecting a suggestion that isn't in the catalog yet calls
// findOrCreateShow so a brand-new show is minted on the spot.
export default function ShowPicker({ value, onChange, required = false }) {
  const [query, setQuery] = useState('');
  const [adding, setAdding] = useState(false);

  const options = getShowOptions();
  const q = query.trim().toLowerCase();

  const matchingShows = q
    ? options.filter((s) => s.title.toLowerCase().includes(q)).slice(0, 6)
    : [];

  const existingTitles = new Set(options.map((s) => s.title.toLowerCase()));
  const matchingTitles = q
    ? showTitles
        .filter((t) => t.toLowerCase().includes(q) && !existingTitles.has(t.toLowerCase()))
        .slice(0, 4)
    : [];

  async function handlePick(title) {
    setAdding(true);
    try {
      const show = await findOrCreateShow(title);
      onChange({ id: show.id, title: show.title });
      setQuery('');
    } finally {
      setAdding(false);
    }
  }

  if (value) {
    return (
      <div className="show-picker__selected">
        <span>{value.title}</span>
        <button
          type="button"
          className="btn-outline"
          onClick={() => onChange(null)}
          aria-label="Change show"
        >
          {required ? 'Change' : 'Clear ×'}
        </button>
      </div>
    );
  }

  return (
    <div className="show-picker">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search shows"
        aria-label="Search shows"
        disabled={adding}
      />
      {q && (
        <div className="show-picker__results">
          {matchingShows.map((s) => (
            <button type="button" key={s.id} onClick={() => handlePick(s.title)}>
              {s.title}
            </button>
          ))}
          {matchingTitles.map((title) => (
            <button type="button" key={title} onClick={() => handlePick(title)}>
              {title}
            </button>
          ))}
          <button
            type="button"
            className="show-picker__add"
            onClick={() => handlePick(query)}
            disabled={adding}
          >
            + Add &ldquo;{query}&rdquo; as a new show
          </button>
        </div>
      )}
    </div>
  );
}
