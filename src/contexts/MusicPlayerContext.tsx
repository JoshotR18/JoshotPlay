import { createContext, useState, useContext, ReactNode } from 'react';
import { Song } from '../types';

interface MusicPlayerContextType {
  playlist: Song[];
  currentSong: Song | null;
  isPlaying: boolean;
  playPlaylist: (songs: Song[], index: number) => void;
  togglePlayPause: () => void;
  playNext: () => void;
  playPrev: () => void;
  setIsPlaying: (isPlaying: boolean) => void;
}

const MusicPlayerContext = createContext<MusicPlayerContextType | undefined>(undefined);

export const MusicPlayerProvider = ({ children }: { children: ReactNode }) => {
  const [playlist, setPlaylist] = useState<Song[]>([]);
  const [currentSongIndex, setCurrentSongIndex] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const currentSong = currentSongIndex !== null ? playlist[currentSongIndex] : null;

  const playPlaylist = (songs: Song[], index: number) => {
    setPlaylist(songs);
    setCurrentSongIndex(index);
    setIsPlaying(true);
  };

  const togglePlayPause = () => {
    if (currentSong) {
      setIsPlaying(prev => !prev);
    }
  };

  const playNext = () => {
    if (playlist.length > 0) {
      const nextIndex = currentSongIndex === null ? 0 : (currentSongIndex + 1) % playlist.length;
      setCurrentSongIndex(nextIndex);
      setIsPlaying(true);
    }
  };

  const playPrev = () => {
    if (playlist.length > 0) {
      const prevIndex = currentSongIndex === null ? 0 : (currentSongIndex - 1 + playlist.length) % playlist.length;
      setCurrentSongIndex(prevIndex);
      setIsPlaying(true);
    }
  };

  const value = {
    playlist,
    currentSong,
    isPlaying,
    playPlaylist,
    togglePlayPause,
    playNext,
    playPrev,
    setIsPlaying,
  };

  return (
    <MusicPlayerContext.Provider value={value}>
      {children}
    </MusicPlayerContext.Provider>
  );
};

export const useMusicPlayer = () => {
  const context = useContext(MusicPlayerContext);
  if (context === undefined) {
    throw new Error('useMusicPlayer must be used within a MusicPlayerProvider');
  }
  return context;
};