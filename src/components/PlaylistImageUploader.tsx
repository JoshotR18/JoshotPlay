import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { showLoading, showSuccess, showError, dismissToast } from '@/utils/toast';
import { getPathFromUrl } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

interface PlaylistImageUploaderProps {
  playlistId: string;
  currentCoverUrl: string | null | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImageUploaded: () => void;
}

const formSchema = z.object({
  coverArtFile: z.instanceof(FileList).refine(files => files?.length === 1, 'Cover art is required.'),
});

const PlaylistImageUploader = ({ playlistId, currentCoverUrl, open, onOpenChange, onImageUploaded }: PlaylistImageUploaderProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const { t } = useTranslation();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsUploading(true);
    const toastId = showLoading(t('uploading_cover'));

    try {
      // 1. Upload new image
      const coverArtFile = values.coverArtFile[0];
      const coverArtFilePath = `playlist-covers/${playlistId}/${Date.now()}-${coverArtFile.name.replace(/\s/g, '_')}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('musicfiles')
        .upload(coverArtFilePath, coverArtFile);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('musicfiles').getPublicUrl(uploadData.path);

      // 2. Update playlist record in DB
      const { error: updateError } = await supabase
        .from('playlists')
        .update({ cover_art_url: publicUrl })
        .eq('id', playlistId);
      if (updateError) throw updateError;

      // 3. Delete old image if it exists
      if (currentCoverUrl) {
        const oldPath = getPathFromUrl(currentCoverUrl);
        if (oldPath) {
          await supabase.storage.from('musicfiles').remove([oldPath]);
        }
      }

      dismissToast(toastId);
      showSuccess(t('playlist_cover_updated'));
      onImageUploaded();
      onOpenChange(false);
      form.reset();
    } catch (error: any) {
      dismissToast(toastId);
      showError(error.message || t('failed_to_upload_cover'));
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('change_playlist_cover')}</DialogTitle>
          <DialogDescription>{t('change_playlist_cover_desc')}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="coverArtFile"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('cover_image')}</FormLabel>
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
              <Button type="submit" disabled={isUploading}>
                {isUploading ? t('uploading') : t('upload')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default PlaylistImageUploader;