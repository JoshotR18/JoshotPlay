import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Playlist } from '@/types';
import { showError } from '@/utils/toast';
import { getPathFromUrl } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

interface DeletePlaylistAlertProps {
  playlist: Playlist;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPlaylistDeleted: () => void;
}

const DeletePlaylistAlert = ({ playlist, open, onOpenChange, onPlaylistDeleted }: DeletePlaylistAlertProps) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const { t } = useTranslation();

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      // Delete the playlist record from the database.
      // Thanks to "ON DELETE CASCADE", associated songs in 'playlist_songs' will be deleted automatically.
      const { error: dbError } = await supabase.from('playlists').delete().eq('id', playlist.id);
      if (dbError) throw dbError;

      // If the playlist has a cover art, delete it from storage.
      if (playlist.cover_art_url) {
        const path = getPathFromUrl(playlist.cover_art_url);
        if (path) {
          await supabase.storage.from('musicfiles').remove([path]);
        }
      }

      onPlaylistDeleted();
      onOpenChange(false);
    } catch (error: any) {
      showError(error.message || t('failed_to_delete_playlist'));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('are_you_sure')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('delete_playlist_confirmation', { name: playlist.name })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button onClick={handleDelete} disabled={isDeleting} variant="destructive">
              {isDeleting ? t('deleting') : t('delete')}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeletePlaylistAlert;