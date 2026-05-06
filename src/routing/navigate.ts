import { useEffect, useState } from 'react';

export type Route = '/' | '/stability' | '/failures';

function readRoute(): Route {
  const hash = window.location.hash.replace(/^#/, '');
  if (hash === '/stability' || hash.startsWith('/stability')) return '/stability';
  if (hash === '/failures' || hash.startsWith('/failures')) return '/failures';
  return '/';
}

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(() => readRoute());
  useEffect(() => {
    const onChange = () => setRoute(readRoute());
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return route;
}

export function navigate(path: Route): void {
  window.location.hash = path === '/' ? '' : path;
  // hash didn't change → still trigger a re-render
  window.dispatchEvent(new HashChangeEvent('hashchange'));
}
