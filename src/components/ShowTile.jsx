import { Link } from 'react-router-dom';
import RatingSquares from './RatingSquares';
import './ShowTile.css';

// A poster tile for the /shows directory. Handles both null cases
// deliberately: no poster (a show added through the picker) and no rating
// (nobody has logged it yet).
export default function ShowTile({ show }) {
  return (
    <Link to={`/show/${show.slug}`} className="show-tile">
      {show.poster_url ? (
        <img src={show.poster_url} alt={`${show.title} poster`} className="show-tile__poster" />
      ) : (
        <span className="show-tile__poster show-tile__poster--fallback">
          <span>{show.title}</span>
        </span>
      )}
      <span className="show-tile__title">{show.title}</span>
      {show.avg_rating ? (
        <span className="show-tile__rating">
          <span className="show-tile__avg">{show.avg_rating}</span>
          <RatingSquares value={Math.round(show.avg_rating)} size="sm" />
          <span className="meta">&middot; {show.rating_count} ratings</span>
        </span>
      ) : (
        <span className="meta">Not yet rated</span>
      )}
    </Link>
  );
}
