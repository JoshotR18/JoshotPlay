import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Song, Playlist } from '@/types';
import SongRow from '@/components/SongRow';
import PlaylistCard from '@/components/PlaylistCard';
import { Skeleton } from '@/components/ui/skeleton';

interface SearchResults {
  songs: Song[];
  playlists: Playlist[];
}

const fetchSearchResults = async (query: string): Promise<SearchResults> => {
  const songQuery = supabase
    .from('songs')
    .select('*')
    .or(`title.ilike.%${query}%,artist.ilike.%${query}%`)
    .limit(20);

  const playlistQuery = supabase
    .from('playlists')
    .select('*')
    .ilike('name', `%${query}%`)
    .limit(10);

  const [songRes, playlistRes] = await Promise.all([songQuery, playlistQuery]);

  if (songRes.error) throw new Error(`Song search failed: ${songRes.error.message}`);
  if (playlistRes.error) throw new Error(`Playlist search failed: ${playlistRes.error.message}`);

  return {
    songs: songRes.data || [],
    playlists: playlistRes.data || [],
  };
};

const SearchPage = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';

  const { data, isLoading, error } = useQuery<SearchResults, Error>({
    queryKey: ['search', query],
    queryFn: () => fetchSearchResults(query),
    enabled: !!query,
  });

  if (!query) {
    return <div className="text-center text-muted-foreground">Please enter a search term to begin.</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-4">Search Results for "{query}"</h1>
      
      {isLoading ? (
        <div className="space-y-8">
          <div>
            <Skeleton className="h-8 w-32 mb-4" />
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-48 w-full" />)}
            </div>
          </div>
          <div>
            <Skeleton className="h-8 w-32 mb-4" />
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          </div>
        </div>
      ) : error ? (
        <p className="text-destructive">Error: {error.message}</p>
      ) : (
        <div className="space-y-8">
          {data?.playlists && data.playlists.length > 0 && (
            <div>
              <h2 className="text-2xl font-semibold mb-4">Playlists</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {data.playlists.map(playlist => (
                  <PlaylistCard key={playlist.id} playlist={playlist} />
                ))}
              </div>
            </div>
          )}

          {data?.songs && data.songs.length > 0 && (
            <div>
              <h2 className="text-2xl font-semibold mb-4">Songs</h2>
              <div className="space-y-1">
                {data.songs.map((song, index) => (
                  <SongRow key={song.id} song={song} allSongs={data.songs} index={index} />
                ))}
              </div>
            </div>
          )}

          {data?.playlists?.length === 0 && data?.songs?.length === 0 && (
            <p className="text-center text-muted-foreground mt-8">No results found for "{query}".</p>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchPage;