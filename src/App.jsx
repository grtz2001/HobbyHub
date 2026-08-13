import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { readLocalUser } from './identity';
import Marquee from './components/Marquee';
import NameGate from './components/NameGate';
import HomeFeed from './pages/HomeFeed';
import PostPage from './pages/PostPage';
import CreatePost from './pages/CreatePost';
import EditPost from './pages/EditPost';
import ShowsDirectory from './pages/ShowsDirectory';
import ShowPage from './pages/ShowPage';
import LogWatch from './pages/LogWatch';
import ProfilePage from './pages/ProfilePage';
import NotFound from './pages/NotFound';
import './App.css';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [checkedUser, setCheckedUser] = useState(false);
  const [search, setSearch] = useState('');
  const [theme, setTheme] = useState('day');

  useEffect(() => {
    setCurrentUser(readLocalUser());
    setCheckedUser(true);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme === 'night' ? 'night' : '';
  }, [theme]);

  function toggleTheme() {
    setTheme((t) => (t === 'night' ? 'day' : 'night'));
  }

  if (!checkedUser) return null;

  if (!currentUser) {
    return <NameGate onCreated={setCurrentUser} />;
  }

  return (
    <BrowserRouter>
      <Marquee
        currentUser={currentUser}
        search={search}
        setSearch={setSearch}
        toggleTheme={toggleTheme}
      />
      <Routes>
        <Route path="/" element={<HomeFeed search={search} />} />
        <Route path="/post/:id" element={<PostPage currentUser={currentUser} />} />
        <Route path="/new" element={<CreatePost currentUser={currentUser} />} />
        <Route path="/post/:id/edit" element={<EditPost currentUser={currentUser} />} />
        <Route path="/shows" element={<ShowsDirectory />} />
        <Route path="/show/:slug" element={<ShowPage />} />
        <Route path="/log" element={<LogWatch currentUser={currentUser} />} />
        <Route path="/user/:id" element={<ProfilePage currentUser={currentUser} />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
