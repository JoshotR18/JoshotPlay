import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useAuth } from '@/contexts/AuthContext';
import { showLoading, showSuccess, showError, dismissToast, showInfo } from '@/utils/toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ManageSongsTab from '../components/admin/ManageSongsTab';
import { useQueryClient } from '@tanstack/react-query';
import { sanitizeFileName } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

const formSchema = z.object({
  songFiles: z.instanceof(FileList)
    .refine((files) => files && files.length > 0, 'At least one song file is required.'),
});

const AddSongForm = () => {
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user) {
      showError(t('must_be_logged_in_upload'));
      return;
    }

    setIsUploading(true);
    const toastId = showLoading(t('uploading_songs_count', { count: values.songFiles.length }));

    try {
      const uploadPromises = Array.from(values.songFiles).map(async (songFile) => {
        const sanitizedFileName = sanitizeFileName(songFile.name);
        const songFilePath = `songs/${Date.now()}-${sanitizedFileName}`;
        const { data: songUploadData, error: songUploadError } = await supabase.storage
          .from('musicfiles')
          .upload(songFilePath, songFile);
        if (songUploadError) throw songUploadError;
        const { data: { publicUrl: songPublicUrl } } = supabase.storage.from('musicfiles').getPublicUrl(songUploadData.path);

        const fileName = songFile.name.substring(0, songFile.name.lastIndexOf('.')) || songFile.name;
        const parts = fileName.split(' - ');
        const artist = parts.length > 1 ? parts[0].trim() : undefined;
        const title = parts.length > 1 ? parts[1].trim() : fileName.trim();

        return {
          user_id: user.id,
          title,
          artist,
          file_url: songPublicUrl,
          cover_art_url: null,
        };
      });

      const songsToPotentiallyInsert = await Promise.all(uploadPromises);

      if (songsToPotentiallyInsert.length === 0) {
        dismissToast(toastId);
        return;
      }

      // Check for duplicates before inserting
      const filter = songsToPotentiallyInsert
        .map(song => `and(title.eq.${song.title},artist.eq.${song.artist || 'null'})`)
        .join(',');
      
      const { data: existingSongs, error: checkError } = await supabase
        .from('songs')
        .select('title, artist')
        .or(filter);

      if (checkError) throw checkError;

      const existingSet = new Set(
        existingSongs.map(s => `${s.title}|${s.artist || 'null'}`)
      );

      const newSongsToInsert = songsToPotentiallyInsert.filter(
        song => !existingSet.has(`${song.title}|${song.artist || 'null'}`)
      );

      const skippedCount = songsToPotentiallyInsert.length - newSongsToInsert.length;

      // Insert only the new songs
      if (newSongsToInsert.length > 0) {
        const { error: insertError } = await supabase.from('songs').insert(newSongsToInsert);
        if (insertError) throw insertError;
      }

      dismissToast(toastId);
      
      if (newSongsToInsert.length > 0) {
        showSuccess(t('songs_added_successfully', { count: newSongsToInsert.length }));
      }
      if (skippedCount > 0) {
        if (newSongsToInsert.length === 0) {
          showSuccess(t('all_songs_were_duplicates'));
        } else {
          showInfo(t('songs_skipped_duplicates', { count: skippedCount }));
        }
      }

      form.reset();
      queryClient.invalidateQueries({ queryKey: ['all-songs'] });
    } catch (error: any) {
      dismissToast(toastId);
      showError(error.message || t('failed_to_upload_songs'));
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="songFiles"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('select_song_files')}</FormLabel>
              <FormControl>
                <Input
                  type="file"
                  accept="audio/*"
                  multiple
                  onChange={(e) => field.onChange(e.target.files)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isUploading}>
          {isUploading ? t('uploading_songs_count', { count: form.getValues('songFiles')?.length || 0 }) : t('add_to_library')}
        </Button>
      </form>
    </Form>
  );
};

const AdminPage = () => {
  const { t } = useTranslation();
  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>{t('admin_panel')}</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="add">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="add">{t('add_song')}</TabsTrigger>
            <TabsTrigger value="manage">{t('manage_songs')}</TabsTrigger>
          </TabsList>
          <TabsContent value="add" className="pt-6">
            <AddSongForm />
          </TabsContent>
          <TabsContent value="manage" className="pt-6">
            <ManageSongsTab />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default AdminPage;