import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Playlist } from '@/types';
import { Button } from './ui/button';
import { Home, Library, Plus, Music } from 'lucide-react';
import { Skeleton } from './ui/skeleton';
import { ScrollArea } from './ui/scroll-area';
import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';

const fetchUserPlaylists = async (userId: string): Promise<Playlist[]> => {
  const { data, error } = await supabase
    .from('playlists')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data || [];
};

const Sidebar = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { data: playlists, isLoading } = useQuery<Playlist[], Error>({
    queryKey: ['user-playlists', user?.id],
    queryFn: () => fetchUserPlaylists(user!.id),
    enabled: !!user,
  });

  useEffect(() => {
    if (!user) return;

    const channel = supabase.channel(`user-playlists-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'playlists', filter: `user_id=eq.${user.id}` }, () => {
        queryClient.invalidateQueries({ queryKey: ['user-playlists', user.id] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  return (
    <div className="h-full flex flex-col gap-2 p-2 bg-background">
      <div className="bg-muted rounded-lg p-2 mt-4">
        <nav className="flex flex-col gap-1">
          <Button variant="ghost" className="w-full justify-start text-lg" asChild>
            <Link to="/">
              <Home className="mr-4 h-6 w-6" />
              {t('home')}
            </Link>
          </Button>
        </nav>
      </div>
      <div className="bg-muted rounded-lg p-2 flex-grow flex flex-col">
        <div className="flex items-center justify-between mb-2 px-2">
          <div className="flex items-center gap-3 text-muted-foreground font-semibold text-lg">
            <Library className="h-6 w-6" />
            {t('your_library')}
          </div>
          <Button variant="ghost" size="icon" asChild>
            <Link to="/create-playlist">
              <Plus className="h-5 w-5" />
              <span className="sr-only">{t('create_playlist')}</span>
            </Link>
          </Button>
        </div>
        <ScrollArea className="flex-grow">
          <div className="space-y-1 pr-2">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-2">
                  <Skeleton className="h-12 w-12 rounded" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
              ))
            ) : playlists && playlists.length > 0 ? (
              playlists.map((playlist) => (
                <Link
                  key={playlist.id}
                  to={`/playlist/${playlist.id}`}
                  className="flex items-center gap-3 p-2 rounded-md hover:bg-accent/50 transition-colors"
                >
                  {playlist.cover_art_url ? (
                    <img src={playlist.cover_art_url} alt={playlist.name} className="h-12 w-12 rounded object-cover" />
                  ) : (
                    <div className="h-12 w-12 rounded bg-accent flex items-center justify-center">
                      <Music className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                  <div>
                    <p className="font-semibold truncate">{playlist.name}</p>
                    <p className="text-sm text-muted-foreground">{t('playlist')}</p>
                  </div>
                </Link>
              ))
            ) : (
              <p className="text-sm text-muted-foreground p-2">Create your first playlist!</p>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

export default Sidebar;