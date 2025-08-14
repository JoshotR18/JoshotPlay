import { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Song, Playlist } from '../types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { PlusCircle, Pencil, GripVertical, Trash2, MoreVertical, Play } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import AddSongsToPlaylistDialog from '@/components/AddSongsToPlaylistDialog';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';
import PlaylistImageUploader from '@/components/PlaylistImageUploader';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { showError, showSuccess } from '@/utils/toast';
import DeletePlaylistAlert from '@/components/DeletePlaylistAlert';
import { useTranslation } from 'react-i18next';
import PlayingIndicator from '@/components/PlayingIndicator';
import { cn } from '@/lib/utils';

const PlaylistSongRow = ({ song, index, isOwner, onRemove, onPlay }: { song: Song, index: number, isOwner: boolean, onRemove: () => void, onPlay: () => void }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: song.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  const { t } = useTranslation();
  const { currentSong, isPlaying, togglePlayPause } = useMusicPlayer();
  const isCurrentSong = song.id === currentSong?.id;

  const handlePlayAction = () => {
    if (isCurrentSong) {
      togglePlayPause();
    } else {
      onPlay();
    }
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center p-2 rounded-md hover:bg-accent group" >
      <div className="flex items-center flex-grow gap-4 cursor-pointer" onClick={handlePlayAction}>
        <div className="w-8 text-center text-muted-foreground flex items-center justify-center">
          {isCurrentSong && isPlaying ? (
            <PlayingIndicator />
          ) : (
            <>
              <span className="group-hover:hidden">{index + 1}</span>
              <Play className="h-4 w-4 hidden group-hover:block" />
            </>
          )}
        </div>
        <img src={song.cover_art_url || '/placeholder.svg'} alt={song.title} className="h-10 w-10 object-cover rounded" />
        <div>
          <p className={cn("font-semibold", isCurrentSong && "text-primary")}>{song.title}</p>
          {song.artist ? (
            <Link to={`/artist/${encodeURIComponent(song.artist)}`} className="text-sm text-muted-foreground hover:underline" onClick={(e) => e.stopPropagation()}>
              {song.artist}
            </Link>
          ) : (
            <p className="text-sm text-muted-foreground">{t('unknown_artist')}</p>
          )}
        </div>
      </div>
      {isOwner && (
        <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={onRemove} className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                {t('remove_from_playlist')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <div {...attributes} {...listeners} className="cursor-grab p-2 opacity-0 group-hover:opacity-100">
            <GripVertical className="h-5 w-5 text-muted-foreground" />
          </div>
        </div>
      )}
    </div>
  );
};

const PlaylistPage = () => {
  const { playlistId } = useParams<{ playlistId: string }>();
  const { user } = useAuth();
  const { playPlaylist } = useMusicPlayer();
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddSongDialogOpen, setIsAddSongDialogOpen] = useState(false);
  const [isImageUploadOpen, setIsImageUploadOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const fetchPlaylistData = useCallback(async () => {
    if (!playlistId) return;
    setLoading(true);
    
    const { data: playlistData, error: playlistError } = await supabase.from('playlists').select('*').eq('id', playlistId).single();
    if (playlistError) {
      setError(playlistError.message);
      setLoading(false);
      return;
    }
    setPlaylist(playlistData);

    const { data: songsData, error: songsError } = await supabase
      .from('playlist_songs')
      .select('position, songs(*)')
      .eq('playlist_id', playlistId)
      .order('position', { ascending: true });

    if (songsError) {
      setError(songsError.message);
    } else {
      const fetchedSongs = songsData.map((item: any) => ({ ...item.songs, position: item.position })).filter(s => s.id) as Song[];
      setSongs(fetchedSongs);
    }
    
    setLoading(false);
  }, [playlistId]);

  useEffect(() => {
    fetchPlaylistData();
  }, [fetchPlaylistData]);

  useEffect(() => {
    if (!playlistId) return;

    const playlistChannel = supabase
      .channel(`playlist-${playlistId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'playlists', filter: `id=eq.${playlistId}` }, 
        (payload) => setPlaylist(payload.new as Playlist)
      )
      .subscribe();

    const playlistSongsChannel = supabase
      .channel(`playlist-songs-${playlistId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'playlist_songs', filter: `playlist_id=eq.${playlistId}` }, 
        () => fetchPlaylistData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(playlistChannel);
      supabase.removeChannel(playlistSongsChannel);
    };
  }, [playlistId, fetchPlaylistData]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      const oldIndex = songs.findIndex((s) => s.id === active.id);
      const newIndex = songs.findIndex((s) => s.id === over.id);
      const reorderedSongs = arrayMove(songs, oldIndex, newIndex);
      setSongs(reorderedSongs);

      try {
        const { error } = await supabase.functions.invoke('reorder-playlist-songs', {
          body: {
            playlist_id: playlistId,
            song_id: active.id,
            old_position: songs[oldIndex].position,
            new_position: songs[newIndex].position,
          },
        });
        if (error) throw error;
      } catch (err: any) {
        showError('Failed to save new order. Please refresh.');
        setSongs(songs); // Revert on error
      }
    }
  };

  const handleRemoveSong = async (songToRemove: Song) => {
    const originalSongs = [...songs];
    setSongs(songs.filter(s => s.id !== songToRemove.id));
    try {
      const { error } = await supabase.functions.invoke('remove-song-from-playlist', {
        body: { playlist_id: playlistId, song_id: songToRemove.id },
      });
      if (error) throw error;
      showSuccess('Song removed from playlist.');
      fetchPlaylistData(); // refetch to ensure positions are correct
    } catch (err: any) {
      showError('Failed to remove song.');
      setSongs(originalSongs);
    }
  };

  const onPlaylistDeleted = () => {
    showSuccess(t('playlist_deleted_successfully'));
    navigate('/');
  };

  const isOwner = user?.id === playlist?.user_id;

  if (loading) return <div>Loading...</div>;
  if (error || !playlist) return <div>Error: {error || 'Playlist not found'}</div>;

  return (
    <>
      <div className="flex flex-col md:flex-row justify-between md:items-center mb-6 gap-4">
        <div>
          <p className="text-sm font-bold uppercase text-muted-foreground">{t('playlist')}</p>
          <h1 className="text-3xl font-bold">{playlist.name}</h1>
          <p className="text-muted-foreground mt-1">{playlist.description}</p>
        </div>
        {isOwner && (
          <div className="flex items-center gap-2 shrink-0">
            <Button onClick={() => playPlaylist(songs, 0)} disabled={songs.length === 0}>
              <Play className="mr-2 h-4 w-4" /> {t('play')}
            </Button>
            <Button variant="outline" onClick={() => setIsAddSongDialogOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" /> {t('add_songs')}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-5 w-5" />
                  <span className="sr-only">{t('more_options')}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setIsImageUploadOpen(true)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  {t('change_cover')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setIsDeleteDialogOpen(true)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                  <Trash2 className="mr-2 h-4 w-4" />
                  {t('delete_playlist')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      <Card>
        <CardContent className="p-2">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={songs.map(s => s.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-1">
                {songs.length > 0 ? (
                  songs.map((song, index) => (
                    <PlaylistSongRow
                      key={song.id}
                      song={song}
                      index={index}
                      isOwner={isOwner}
                      onPlay={() => playPlaylist(songs, index)}
                      onRemove={() => handleRemoveSong(song)}
                    />
                  ))
                ) : (
                  <p className="text-center text-muted-foreground p-4">{t('no_songs_in_playlist')}</p>
                )}
              </div>
            </SortableContext>
          </DndContext>
        </CardContent>
      </Card>
      
      {playlistId && (
        <AddSongsToPlaylistDialog
          playlistId={playlistId}
          open={isAddSongDialogOpen}
          onOpenChange={setIsAddSongDialogOpen}
          onSongsAdded={fetchPlaylistData}
        />
      )}

      {playlistId && isOwner && (
        <PlaylistImageUploader
          playlistId={playlistId}
          currentCoverUrl={playlist.cover_art_url}
          open={isImageUploadOpen}
          onOpenChange={setIsImageUploadOpen}
          onImageUploaded={fetchPlaylistData}
        />
      )}

      {playlistId && isOwner && playlist && (
        <DeletePlaylistAlert
          playlist={playlist}
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          onPlaylistDeleted={onPlaylistDeleted}
        />
      )}
    </>
  );
};

export default PlaylistPage;