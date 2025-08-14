import { Song } from '@/types';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';
import AddToPlaylistMenu from './AddToPlaylistMenu';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PlayingIndicator from './PlayingIndicator';
import { cn } from '@/lib/utils';

interface SongRowProps {
  song: Song;
  allSongs: Song[];
  index: number;
}

const SongRow = ({ song, allSongs, index }: SongRowProps) => {
  const { currentSong, isPlaying, playPlaylist, togglePlayPause } = useMusicPlayer();
  const { t } = useTranslation();
  const isCurrentSong = song.id === currentSong?.id;

  const handlePlay = () => {
    if (isCurrentSong) {
      togglePlayPause();
    } else {
      playPlaylist(allSongs, index);
    }
  };

  return (
    <div className="flex items-center p-2 rounded-md hover:bg-accent group cursor-pointer" onClick={handlePlay}>
      <img src={song.cover_art_url || '/placeholder.svg'} alt={song.title} className="h-12 w-12 object-cover rounded mr-4" />
      <div className="flex-grow">
        <p className={cn("font-semibold", isCurrentSong && "text-primary")}>{song.title}</p>
        {song.artist ? (
          <Link to={`/artist/${encodeURIComponent(song.artist)}`} className="text-sm text-muted-foreground hover:underline" onClick={(e) => e.stopPropagation()}>
            {song.artist}
          </Link>
        ) : (
          <p className="text-sm text-muted-foreground">{t('unknown_artist')}</p>
        )}
      </div>
      <div className="flex items-center gap-2">
        {isCurrentSong && isPlaying ? (
          <PlayingIndicator />
        ) : (
          <div onClick={(e) => e.stopPropagation()}>
            <AddToPlaylistMenu song={song} />
          </div>
        )}
      </div>
    </div>
  );
};

export default SongRow;