import { useState } from 'react';
import { createLocalUser } from '../identity';
import './NameGate.css';

// A full-page gate, rendered instead of <Routes> on first visit. Not a
// modal — no portal, no focus trap, no dimmed backdrop.
export default function NameGate({ onCreated }) {
  const [name, setName] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setError(null);
    try {
      const profile = await createLocalUser(name);
      onCreated(profile);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="name-gate">
      <form className="name-gate__panel" onSubmit={handleSubmit}>
        <h1>Welcome to Encore</h1>
        <p className="name-gate__subtitle">Choose a display name</p>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="ellis_w"
          aria-label="Display name"
          autoFocus
        />
        {error && <p className="name-gate__error">{error}</p>}
        <button type="submit" className="btn" disabled={submitting || !name.trim()}>
          Take your seat
        </button>
      </form>
    </div>
  );
}
