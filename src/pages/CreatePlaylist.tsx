import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useAuth } from '@/contexts/AuthContext';
import { showLoading, showSuccess, showError, dismissToast } from '@/utils/toast';
import { useNavigate } from 'react-router-dom';

const formSchema = z.object({
  name: z.string().min(1, 'Playlist name is required'),
  description: z.string().optional(),
});

const CreatePlaylistPage = () => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user) {
      showError('You must be logged in to create a playlist.');
      return;
    }

    setIsSubmitting(true);
    const toastId = showLoading('Creating playlist...');

    try {
      const { data: playlistData, error: insertError } = await supabase.from('playlists').insert({
        user_id: user.id,
        name: values.name,
        description: values.description,
      }).select().single();

      if (insertError) throw insertError;

      dismissToast(toastId);
      showSuccess('Playlist created successfully!');
      navigate(`/playlist/${playlistData.id}`);
    } catch (error: any) {
      dismissToast(toastId);
      showError(error.message || 'Failed to create playlist.');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Create New Playlist</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Playlist Name</FormLabel>
                  <FormControl>
                    <Input placeholder="My Awesome Playlist" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="A short description of your playlist" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Playlist'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default CreatePlaylistPage;