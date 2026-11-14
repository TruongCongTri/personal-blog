"use client";

/**
 * What the site header should show while a folder is open. The folder page
 * writes it (its title, and whether the reader has scrolled past the title
 * into the content); the header, which lives in the layout, subscribes.
 */
export type FolderHeader = { title: string; active: boolean };

const EMPTY: FolderHeader = { title: "", active: false };
let state: FolderHeader = EMPTY;
const listeners = new Set<() => void>();

export function setFolderHeader(next: Partial<FolderHeader>) {
  const merged = { ...state, ...next };
  if (merged.title === state.title && merged.active === state.active) return;
  state = merged;
  listeners.forEach((fn) => fn());
}

export const subscribeFolderHeader = (fn: () => void) => {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
};

export const getFolderHeader = () => state;
export const getServerFolderHeader = () => EMPTY;
