import { useEffect, useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX } from 'lucide-react';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AddToPlaylistMenu from './AddToPlaylistMenu';

const MusicPlayer = () => {
  const { currentSong, isPlaying, togglePlayPause, playNext, playPrev, setIsPlaying } = useMusicPlayer();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (currentSong) {
      // Set the source only if it's different to avoid re-loading
      if (audio.src !== currentSong.file_url) {
        audio.src = currentSong.file_url;
        setProgress(0);
        setDuration(0);
      }

      // Handle play/pause state
      if (isPlaying) {
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            // AbortError is a common, harmless error when a user quickly changes songs.
            // We can safely ignore it.
            if (error.name !== 'AbortError') {
              console.error("Playback failed:", error);
              setIsPlaying(false);
            }
          });
        }
      } else {
        audio.pause();
      }
    } else {
      // If there's no song, ensure it's paused and reset src
      audio.pause();
      audio.src = '';
    }
  }, [currentSong, isPlaying, setIsPlaying]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setProgress(audioRef.current.currentTime);
      setDuration(audioRef.current.duration);
    }
  };
  
  const handleSongEnd = () => {
    playNext();
  };

  const handleProgressChange = (value: number[]) => {
    if (audioRef.current) {
      audioRef.current.currentTime = value[0];
      setProgress(value[0]);
    }
  };

  const handleVolumeChange = (value: number[]) => {
    if (audioRef.current) {
      const newVolume = value[0];
      audioRef.current.volume = newVolume;
      setVolume(newVolume);
      setIsMuted(newVolume === 0);
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      const newMutedState = !isMuted;
      audioRef.current.muted = newMutedState;
      setIsMuted(newMutedState);
      if (!newMutedState) {
        setVolume(audioRef.current.volume > 0 ? audioRef.current.volume : 0.5);
      }
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time) || time === 0) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!currentSong) return null;

  return (
    <Card className="fixed bottom-0 left-0 right-0 z-50 rounded-t-lg rounded-b-none border-t">
      <CardContent className="p-4 flex items-center gap-4">
        <audio ref={audioRef} onTimeUpdate={handleTimeUpdate} onLoadedMetadata={handleTimeUpdate} onEnded={handleSongEnd} />
        <img src={currentSong.cover_art_url || '/placeholder.svg'} alt={currentSong.title} className="w-16 h-16 rounded-md object-cover" />
        <div className="flex-grow">
          <h3 className="font-semibold">{currentSong.title}</h3>
          {currentSong.artist ? (
            <Link to={`/artist/${encodeURIComponent(currentSong.artist)}`} className="text-sm text-muted-foreground hover:underline">
              {currentSong.artist}
            </Link>
          ) : (
            <p className="text-sm text-muted-foreground">{t('unknown_artist')}</p>
          )}
          <div className="flex items-center gap-2 mt-2">
            <span>{formatTime(progress)}</span>
            <Slider value={[progress]} max={duration || 100} step={1} onValueChange={handleProgressChange} className="flex-grow" />
            <span>{formatTime(duration)}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <AddToPlaylistMenu song={currentSong} />
          <Button variant="ghost" size="icon" onClick={playPrev}> <SkipBack className="h-5 w-5" /> </Button>
          <Button variant="ghost" size="icon" onClick={togglePlayPause}> {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />} </Button>
          <Button variant="ghost" size="icon" onClick={playNext}> <SkipForward className="h-5 w-5" /> </Button>
        </div>
        <div className="flex items-center gap-2 w-32">
          <Button variant="ghost" size="icon" onClick={toggleMute}> {isMuted || volume === 0 ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />} </Button>
          <Slider value={[isMuted ? 0 : volume]} max={1} step={0.01} onValueChange={handleVolumeChange} />
        </div>
      </CardContent>
    </Card>
  );
};

export default MusicPlayer;