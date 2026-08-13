import { Link, useLocation } from 'react-router-dom';
import './Marquee.css';

// Sibling of <Routes> in App — wordmark, Shows link, search (home only),
// Write, Log, avatar, theme toggle.
export default function Marquee({ currentUser, search, setSearch, toggleTheme }) {
  const { pathname } = useLocation();
  const showSearch = pathname === '/';

  return (
    <header className="marquee">
      <Link to="/" className="marquee__wordmark">
        Encore
      </Link>
      <Link to="/shows" className="marquee__link">
        Shows
      </Link>

      {showSearch && (
        <input
          className="marquee__search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search post titles"
          aria-label="Search posts by title"
        />
      )}

      <div className="marquee__right">
        <Link to="/new" className="marquee__button">
          Write
        </Link>
        <Link to="/log" className="marquee__button">
          Log
        </Link>
        <Link to={`/user/${currentUser.id}`} className="marquee__profile">
          <span className="marquee__avatar">
            {currentUser.display_name.slice(0, 2).toUpperCase()}
          </span>
          <span className="marquee__name">{currentUser.display_name}</span>
        </Link>
        <button
          className="marquee__theme"
          onClick={toggleTheme}
          aria-label="Toggle house lights"
        >
          <span className="marquee__bulb" />
          House lights
        </button>
      </div>
    </header>
  );
}
