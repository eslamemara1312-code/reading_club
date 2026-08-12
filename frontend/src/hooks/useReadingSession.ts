import { useCallback, useEffect, useRef, useState } from 'react';

export interface ReadingSessionSummary {
  startPage: number;
  currentPage: number;
  maxPageReached: number;
  pagesVisited: number[];
  activeSeconds: number;
}

export const useReadingSession = (sessionKey: string, startPage: number) => {
  const [summary, setSummary] = useState<ReadingSessionSummary>({ startPage, currentPage: startPage, maxPageReached: startPage, pagesVisited: [startPage], activeSeconds: 0 });
  const pagesRef = useRef(new Set<number>([startPage]));
  const lastActivityRef = useRef(Date.now());

  useEffect(() => {
    pagesRef.current = new Set([startPage]);
    lastActivityRef.current = Date.now();
    setSummary({ startPage, currentPage: startPage, maxPageReached: startPage, pagesVisited: [startPage], activeSeconds: 0 });
  }, [sessionKey, startPage]);

  useEffect(() => {
    const registerActivity = () => { lastActivityRef.current = Date.now(); };
    window.addEventListener('pointerdown', registerActivity, { passive: true });
    window.addEventListener('keydown', registerActivity);
    window.addEventListener('scroll', registerActivity, { passive: true, capture: true });
    const timer = window.setInterval(() => {
      if (!document.hidden && Date.now() - lastActivityRef.current < 45_000) {
        setSummary((current) => ({ ...current, activeSeconds: current.activeSeconds + 1 }));
      }
    }, 1000);
    return () => {
      window.removeEventListener('pointerdown', registerActivity);
      window.removeEventListener('keydown', registerActivity);
      window.removeEventListener('scroll', registerActivity, true);
      window.clearInterval(timer);
    };
  }, []);

  const recordPage = useCallback((page: number) => {
    lastActivityRef.current = Date.now();
    pagesRef.current.add(page);
    setSummary((current) => ({
      ...current,
      currentPage: page,
      maxPageReached: Math.max(current.maxPageReached, page),
      pagesVisited: Array.from(pagesRef.current).sort((a, b) => a - b),
    }));
  }, []);

  return { summary, recordPage };
};
