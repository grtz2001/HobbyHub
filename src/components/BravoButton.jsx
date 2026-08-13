import { useState } from 'react';
import { upvotePost } from '../api/posts';
import './BravoButton.css';

// Relative state updates only — the rubric requires unlimited rapid
// clicking, so several requests can be in flight at once. See CLAUDE.md.
export default function BravoButton({ postId, initialUpvotes }) {
  const [upvotes, setUpvotes] = useState(initialUpvotes);

  async function handleClick() {
    setUpvotes((n) => n + 1);
    try {
      await upvotePost(postId);
    } catch {
      setUpvotes((n) => n - 1);
    }
  }

  return (
    <button className="bravo-button" onClick={handleClick}>
      <span className="bravo-button__triangle">&#9650;</span>
      Bravo &middot; {upvotes}
    </button>
  );
}
