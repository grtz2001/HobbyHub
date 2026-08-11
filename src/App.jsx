import { useEffect, useState } from 'react';
import { getPosts } from './api/posts';

export default function App() {
  const [posts, setPosts] = useState([]);
  useEffect(() => { getPosts().then(setPosts); }, []);
  return <pre>{JSON.stringify(posts.slice(0, 2), null, 2)}</pre>;
}