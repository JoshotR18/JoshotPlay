export interface Song {
  id: string;
  title: string;
  artist?: string;
  file_url: string;
  cover_art_url?: string;
  position?: number; // Added for playlist ordering
}

export interface Album {
  id: string;
  title: string;
  artist: string;
  cover_art_url: string;
  user_id: string;
}

export interface Playlist {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  cover_art_url?: string;
}