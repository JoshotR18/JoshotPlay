import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { showSuccess, showError } from '@/utils/toast';
import { Song } from '../types';

interface AddSongsToPlaylistDialogProps {
  playlistId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSongsAdded: () => void;
}

const AddSongsToPlaylistDialog = ({ playlistId, open, onOpenChange, onSongsAdded }: AddSongsToPlaylistDialogProps) => {
  const [allSongs, setAllSongs] = useState<Song[]>([]);
  const [selectedSongs, setSelectedSongs] = useState<Set<string>>(new Set());
  const [existingSongIds, setExistingSongIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      const fetchSongs = async () => {
        setLoading(true);
        const { data: librarySongs, error: songsError } = await supabase.from('songs').select('*');
        if (songsError) showError(songsError.message);
        else setAllSongs(librarySongs || []);

        const { data: playlistSongs, error: playlistSongsError } = await supabase.from('playlist_songs').select('song_id').eq('playlist_id', playlistId);
        if (playlistSongsError) showError(playlistSongsError.message);
        else {
          const songIds = new Set(playlistSongs.map(s => s.song_id));
          setExistingSongIds(songIds);
          setSelectedSongs(songIds);
        }
        setLoading(false);
      };
      fetchSongs();
    }
  }, [open, playlistId]);

  const handleSelectSong = (songId: string, checked: boolean) => {
    setSelectedSongs(prev => {
      const newSet = new Set(prev);
      if (checked) newSet.add(songId);
      else newSet.delete(songId);
      return newSet;
    });
  };

  const handleSaveChanges = async () => {
    setLoading(true);
    const songsToAdd = Array.from(selectedSongs).filter(id => !existingSongIds.has(id));
    const songsToRemove = Array.from(existingSongIds).filter(id => !selectedSongs.has(id));

    if (songsToAdd.length > 0) {
      const { error } = await supabase.from('playlist_songs').insert(songsToAdd.map(song_id => ({ playlist_id: playlistId, song_id })));
      if (error) {
        showError(`Failed to add songs: ${error.message}`);
        setLoading(false);
        return;
      }
    }

    if (songsToRemove.length > 0) {
      const { error } = await supabase.from('playlist_songs').delete().in('song_id', songsToRemove).eq('playlist_id', playlistId);
      if (error) {
        showError(`Failed to remove songs: ${error.message}`);
        setLoading(false);
        return;
      }
    }
    
    showSuccess('Playlist updated successfully!');
    onSongsAdded();
    onOpenChange(false);
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Songs to Playlist</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-72">
          <div className="space-y-4 p-4">
            {loading ? <p>Loading songs...</p> : allSongs.map(song => (
              <div key={song.id} className="flex items-center space-x-2">
                <Checkbox
                  id={song.id}
                  checked={selectedSongs.has(song.id)}
                  onCheckedChange={(checked) => handleSelectSong(song.id, !!checked)}
                />
                <label htmlFor={song.id} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  {song.title} - {song.artist}
                </label>
              </div>
            ))}
          </div>
        </ScrollArea>
        <DialogFooter>
          <Button onClick={handleSaveChanges} disabled={loading}>
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddSongsToPlaylistDialog;