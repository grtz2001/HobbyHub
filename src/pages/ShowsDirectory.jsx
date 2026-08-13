import { useEffect, useState } from 'react';
import { getShows } from '../api/shows';
import ShowTile from '../components/ShowTile';
import Loader from '../components/Loader';
import './ShowsDirectory.css';

export default function ShowsDirectory() {
  const [shows, setShows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const data = await getShows();
      if (!cancelled) {
        setShows(data);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="page shows-directory">
      <h2>All shows</h2>
      <p className="meta shows-directory__count">{shows.length} titles in the house</p>

      {loading ? (
        <Loader />
      ) : (
        <div className="shows-directory__grid">
          {shows.map((show) => (
            <ShowTile key={show.id} show={show} />
          ))}
        </div>
      )}
    </div>
  );
}
