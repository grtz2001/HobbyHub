import './RatingSquares.css';

// Read mode: pass `value`. Edit mode: also pass `onChange` and it renders as
// a keyboard-operable radio group. Rating squares appear in exactly two
// places — diary entries, and a show's average — never on a post.
export default function RatingSquares({ value, onChange, size = 'md', name = 'rating' }) {
  const squares = [1, 2, 3, 4, 5];

  if (onChange) {
    return (
      <div className={`rating-squares rating-squares--${size}`} role="radiogroup" aria-label="Rating">
        {squares.map((n) => (
          <label key={n} className="rating-squares__radio">
            <input
              type="radio"
              name={name}
              value={n}
              checked={value === n}
              onChange={() => onChange(n)}
              aria-label={`Rate ${n} of 5`}
            />
            <span className={n <= value ? 'is-filled' : ''} />
          </label>
        ))}
      </div>
    );
  }

  return (
    <div
      className={`rating-squares rating-squares--${size}`}
      aria-label={`Rated ${value} of 5`}
    >
      {squares.map((n) => (
        <span key={n} className={n <= value ? 'is-filled' : ''} />
      ))}
    </div>
  );
}
