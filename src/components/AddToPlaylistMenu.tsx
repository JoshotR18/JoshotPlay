import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Song, Playlist } from '@/types';
import { Button } from './ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator } from './ui/dropdown-menu';
import { Plus, Loader2 } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
import { useTranslation } from 'react-i18next';

interface AddToPlaylistMenuProps {
  song: Song;
}

const fetchUserPlaylists = async (userId: string): Promise<Playlist[]> => {
  const { data, error } = await supabase
    .from('playlists')
    .select('*')
    .eq('user_id', userId);
  if (error) throw new Error(error.message);
  return data || [];
};

const AddToPlaylistMenu = ({ song }: AddToPlaylistMenuProps) => {
  const { user } = useAuth();
  const [isAdding, setIsAdding] = useState(false);
  const { t } = useTranslation();

  const { data: playlists, isLoading } = useQuery<Playlist[], Error>({
    queryKey: ['user-playlists', user?.id],
    queryFn: () => fetchUserPlaylists(user!.id),
    enabled: !!user,
  });

  const handleAddSong = async (playlistId: string) => {
    setIsAdding(true);
    try {
      const { count, error: countError } = await supabase
        .from('playlist_songs')
        .select('*', { count: 'exact', head: true })
        .eq('playlist_id', playlistId);

      if (countError) throw countError;
      const position = count || 0;

      const { error } = await supabase
        .from('playlist_songs')
        .insert({ playlist_id: playlistId, song_id: song.id, position });

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          showError(t('song_already_in_playlist', { title: song.title }));
        } else {
          throw error;
        }
      } else {
        showSuccess(t('song_added_to_playlist', { title: song.title }));
      }
    } catch (error: any) {
      showError(error.message || t('failed_to_add_song'));
    } finally {
      setIsAdding(false);
    }
  };

  if (!user) return null;

  if (isLoading) {
    return (
      <Button variant="ghost" size="icon" disabled>
        <Loader2 className="h-4 w-4 animate-spin" />
      </Button>
    );
  }

  if (playlists && playlists.length === 1) {
    return (
      <Button variant="ghost" size="icon" onClick={() => handleAddSong(playlists[0].id)} disabled={isAdding}>
        {isAdding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Plus className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>{t('add_to_playlist')}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {playlists && playlists.length > 0 ? (
          playlists.map((playlist) => (
            <DropdownMenuItem key={playlist.id} onSelect={() => handleAddSong(playlist.id)}>
              {playlist.name}
            </DropdownMenuItem>
          ))
        ) : (
          <DropdownMenuItem asChild>
            <Link to="/create-playlist">{t('create_new_playlist_link')}</Link>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default AddToPlaylistMenu;