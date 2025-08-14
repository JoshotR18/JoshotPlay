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
import { Song } from '@/types';
import { showError } from '@/utils/toast';
import { getPathFromUrl } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

interface DeleteSongAlertProps {
  song: Song;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSongDeleted: () => void;
}

const DeleteSongAlert = ({ song, open, onOpenChange, onSongDeleted }: DeleteSongAlertProps) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const { t } = useTranslation();

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      // 1. Delete files from storage
      const pathsToDelete: string[] = [];
      const songPath = getPathFromUrl(song.file_url);
      const coverPath = getPathFromUrl(song.cover_art_url || '');
      if (songPath) pathsToDelete.push(songPath);
      if (coverPath) pathsToDelete.push(coverPath);

      if (pathsToDelete.length > 0) {
        const { error: storageError } = await supabase.storage.from('musicfiles').remove(pathsToDelete);
        if (storageError) {
          // Log error but proceed to delete DB record
          console.error("Could not delete storage files:", storageError.message);
        }
      }

      // 2. Delete record from database
      const { error: dbError } = await supabase.from('songs').delete().eq('id', song.id);
      if (dbError) throw dbError;

      onSongDeleted();
      onOpenChange(false);
    } catch (error: any) {
      showError(error.message || t('failed_to_delete_song'));
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
            {t('delete_song_confirmation', { title: song.title })}
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

export default DeleteSongAlert;