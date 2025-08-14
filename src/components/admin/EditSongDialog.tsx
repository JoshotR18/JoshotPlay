import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Song } from '@/types';
import { showError } from '@/utils/toast';
import { getPathFromUrl, sanitizeFileName } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

interface EditSongDialogProps {
  song: Song;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSongUpdated: () => void;
}

const formSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  artist: z.string().optional(),
  coverArtFile: z.instanceof(FileList).optional(),
});

const EditSongDialog = ({ song, open, onOpenChange, onSongUpdated }: EditSongDialogProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { t } = useTranslation();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  useEffect(() => {
    if (song) {
      form.reset({
        title: song.title,
        artist: song.artist || '',
      });
    }
  }, [song, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    try {
      let newCoverArtUrl = song.cover_art_url;

      if (values.coverArtFile && values.coverArtFile.length > 0) {
        const coverArtFile = values.coverArtFile[0];
        const sanitizedFileName = sanitizeFileName(coverArtFile.name);
        const coverArtFilePath = `covers/${song.id}/${Date.now()}-${sanitizedFileName}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('musicfiles')
          .upload(coverArtFilePath, coverArtFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage.from('musicfiles').getPublicUrl(uploadData.path);
        newCoverArtUrl = publicUrl;

        if (song.cover_art_url) {
          const oldPath = getPathFromUrl(song.cover_art_url);
          if (oldPath) {
            await supabase.storage.from('musicfiles').remove([oldPath]);
          }
        }
      }

      const { error } = await supabase
        .from('songs')
        .update({
          title: values.title,
          artist: values.artist,
          cover_art_url: newCoverArtUrl,
        })
        .eq('id', song.id);

      if (error) throw error;

      onSongUpdated();
      onOpenChange(false);
    } catch (error: any) {
      showError(error.message || t('failed_to_update_song'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('edit_song')}</DialogTitle>
          <DialogDescription>{t('edit_song_description')}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('title')}</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="artist"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('artist')}</FormLabel>
                  <FormControl><Input {...field} value={field.value ?? ''} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="coverArtFile"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('cover_art')}</FormLabel>
                  <FormControl>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => field.onChange(e.target.files)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{t('cancel')}</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? t('saving') : t('save_changes')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default EditSongDialog;