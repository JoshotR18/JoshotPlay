import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Song } from '@/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreHorizontal } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import EditSongDialog from './EditSongDialog';
import DeleteSongAlert from './DeleteSongAlert';
import { showSuccess } from '@/utils/toast';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const fetchSongs = async (): Promise<Song[]> => {
  const { data, error } = await supabase.from('songs').select('*').order('title', { ascending: true });
  if (error) throw new Error(error.message);
  return data;
};

const ManageSongsTab = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const { data: songs, isLoading, error } = useQuery<Song[], Error>({
    queryKey: ['all-songs'],
    queryFn: fetchSongs,
  });

  useEffect(() => {
    const channel = supabase.channel('songs-manage-realtime-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'songs' }, () => {
        queryClient.invalidateQueries({ queryKey: ['all-songs'] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);

  const handleEdit = (song: Song) => {
    setSelectedSong(song);
    setIsEditDialogOpen(true);
  };

  const handleDelete = (song: Song) => {
    setSelectedSong(song);
    setIsDeleteDialogOpen(true);
  };

  const onSongUpdated = () => {
    showSuccess(t('song_updated_successfully'));
    queryClient.invalidateQueries({ queryKey: ['all-songs'] });
  };

  const onSongDeleted = () => {
    showSuccess(t('song_deleted_successfully'));
    queryClient.invalidateQueries({ queryKey: ['all-songs'] });
  };

  if (error) return <p className="text-destructive">Error: {error.message}</p>;

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[80px]">{t('cover')}</TableHead>
            <TableHead>{t('title')}</TableHead>
            <TableHead>{t('artist')}</TableHead>
            <TableHead className="text-right">{t('actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-12 w-12 rounded" /></TableCell>
                <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
              </TableRow>
            ))
          ) : songs && songs.length > 0 ? (
            songs.map((song) => (
              <TableRow key={song.id}>
                <TableCell>
                  <img src={song.cover_art_url || '/placeholder.svg'} alt={song.title} className="h-12 w-12 object-cover rounded" />
                </TableCell>
                <TableCell className="font-medium">{song.title}</TableCell>
                <TableCell>
                  {song.artist ? (
                    <Link to={`/artist/${encodeURIComponent(song.artist)}`} className="hover:underline">
                      {song.artist}
                    </Link>
                  ) : (
                    <span className="text-muted-foreground">N/A</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">{t('open_menu')}</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(song)}>{t('edit')}</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDelete(song)} className="text-destructive">{t('delete')}</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={4} className="text-center">{t('no_songs_in_library')}</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {selectedSong && (
        <>
          <EditSongDialog
            song={selectedSong}
            open={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
            onSongUpdated={onSongUpdated}
          />
          <DeleteSongAlert
            song={selectedSong}
            open={isDeleteDialogOpen}
            onOpenChange={setIsDeleteDialogOpen}
            onSongDeleted={onSongDeleted}
          />
        </>
      )}
    </div>
  );
};

export default ManageSongsTab;