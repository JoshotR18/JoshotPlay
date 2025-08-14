import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Song } from '../types';
import { Skeleton } from '@/components/ui/skeleton';
import { useInView } from 'react-intersection-observer';
import { useEffect } from 'react';
import SongRow from '@/components/SongRow';
import { Card, CardContent } from '@/components/ui/card';
import { useTranslation } from 'react-i18next';

const PAGE_SIZE = 20;

const fetchSongs = async ({ pageParam }: { pageParam: unknown }): Promise<Song[]> => {
  const rangeStart = typeof pageParam === 'number' ? pageParam : 0;
  const { data, error } = await supabase
    .from('songs')
    .select('*')
    .order('created_at', { ascending: false })
    .range(rangeStart, rangeStart + PAGE_SIZE - 1);

  if (error) {
    throw new Error(error.message);
  }
  return data as Song[];
};

const Index = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery({
    queryKey: ['songs-infinite'],
    queryFn: fetchSongs,
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < PAGE_SIZE) {
        return undefined; // No more pages
      }
      return allPages.length * PAGE_SIZE;
    },
  });

  useEffect(() => {
    const channel = supabase.channel('songs-realtime-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'songs' }, () => {
        queryClient.invalidateQueries({ queryKey: ['songs-infinite'] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const { ref, inView } = useInView();

  useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, fetchNextPage]);

  const allSongs = data?.pages.flatMap(page => page) ?? [];

  return (
    <>
      <h1 className="text-3xl font-bold">{t('all_songs')}</h1>
      <p className="text-muted-foreground mb-6">{t('explore_library')}</p>
      
      <Card>
        <CardContent className="p-2">
          <div className="space-y-1">
            {isLoading ? (
              Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="flex items-center p-2">
                  <Skeleton className="h-12 w-12 rounded mr-4" />
                  <div className="flex-grow space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </div>
              ))
            ) : error ? (
              <p className="text-destructive p-4 text-center">Error: {error.message}</p>
            ) : allSongs.length > 0 ? (
              allSongs.map((song, index) => (
                <SongRow key={song.id} song={song} allSongs={allSongs} index={index} />
              ))
            ) : (
              <p className="text-center text-muted-foreground p-4">{t('no_songs_found')}</p>
            )}

            <div ref={ref} className="h-10 flex items-center justify-center">
              {isFetchingNextPage && <p>{t('loading_more')}</p>}
              {!hasNextPage && allSongs.length > 0 && <p className="text-muted-foreground">{t('end_of_list')}</p>}
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
};

export default Index;