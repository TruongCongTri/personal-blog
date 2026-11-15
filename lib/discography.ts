// lib/discography.ts
//
// Soundtracks for the film folders. Each movie is an "album" whose tracks
// play in order and loop while its folder is open. Files live in the R2
// bucket under movies/<id>/ and stream from NEXT_PUBLIC_R2_PUBLIC_URL.

export interface MovieSoundtrack {
  id: string;
  movieTitle: string;
  /** The review this music belongs to (content/reviews/<slug>). */
  postSlug?: string;
  /** Pages outside the folders where this plays. */
  pages?: SitePage[];
  posterUrl: string;
  /** Played in order, then from the top again. */
  tracks: { title: string; audioUrl: string }[];
}

export type SitePage = "home" | "about";

export interface Track {
  id: string;
  title: string;
  url: string;
}

export interface Album {
  id: string;
  title: string;
  artist: string;
  coverUrl: string;
  postSlug?: string;
  pages?: SitePage[];
  tracks: Track[];
}

const CDN_URL = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || "";
const file = (movie: string, name: string) =>
  `${CDN_URL}/movies/${movie}/${name}`;

export const MOVIE_SOUNDTRACKS: MovieSoundtrack[] = [
  {
    id: "warfare",
    movieTitle: "Warfare",
    postSlug: "warfare-2025",
    posterUrl: file("warfare", "poster.webp"),
    tracks: [
      {
        title: "Call On Me (Radio Mix)",
        audioUrl: file("warfare", "call-on-me-radio-mix.m4a"),
      },
    ],
  },
  {
    id: "rose",
    movieTitle: "Rose",
    postSlug: "rose-2026",
    posterUrl: file("rose", "poster.webp"),
    tracks: [
      {
        title: "Und Hab Getan Was Ich Kann",
        audioUrl: file("rose", "und-hab-getan-was-ich-kann.m4a"),
      },
    ],
  },
  {
    // Not filed on the site yet (no review), so it doesn't play anywhere.
    id: "in-the-mood-for-love",
    movieTitle: "In The Mood For Love",
    posterUrl: file("in-the-mood-for-love", "poster.webp"),
    tracks: [
      {
        title: "Yumeji's Theme (Theme From In The Mood For Love)",
        audioUrl: file(
          "in-the-mood-for-love",
          "yumeji-s-theme-theme-from-in-the-mood-for-love.m4a",
        ),
      },
    ],
  },
  {
    id: "merry-christmas-mr-lawrence",
    movieTitle: "Merry Christmas Mr Lawrence",
    // Not a review: the music of the drawer (home) and the About page.
    pages: ["home", "about"],
    posterUrl: file("merry-christmas-mr-lawrence", "poster.webp"),
    tracks: [
      {
        title: "Merry Christmas Mr Lawrence",
        audioUrl: file(
          "merry-christmas-mr-lawrence",
          "merry-christmas-mr-lawrence-trio-ver-ryuichi-sakamoto.m4a",
        ),
      },
    ],
  },
];

export const DISCOGRAPHY: Album[] = MOVIE_SOUNDTRACKS.map((movie) => ({
  id: movie.id,
  title: movie.movieTitle,
  artist: movie.movieTitle,
  coverUrl: movie.posterUrl,
  postSlug: movie.postSlug,
  pages: movie.pages,
  tracks: movie.tracks.map((t, i) => ({
    id: `${movie.id}-${i + 1}`,
    title: t.title,
    url: t.audioUrl,
  })),
}));

/** The soundtrack for a review, if it has one. */
export const albumForPost = (slug: string | undefined) =>
  slug ? DISCOGRAPHY.find((a) => a.postSlug === slug) : undefined;

/**
 * The soundtrack for a URL: a review's own music on /<locale>/posts/<slug>,
 * the drawer's on the home page and About, nothing elsewhere.
 */
export function albumForPath(path: string) {
  const post = path.match(/^\/[a-z]{2}\/posts\/([^/?#]+)/)?.[1];
  if (post) return albumForPost(post);
  const page: SitePage | null = /^\/[a-z]{2}\/?$/.test(path) ? "home" : /^\/[a-z]{2}\/about\/?$/.test(path) ? "about" : null;
  return page ? DISCOGRAPHY.find((a) => a.pages?.includes(page)) : undefined;
}
