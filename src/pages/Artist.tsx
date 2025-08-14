import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Song } from '@/types';
import SongRow from '@/components/SongRow';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const fetchArtistSongs = async (artistName: string): Promise<{ songs: Song[], artistCover: string | null }> => {
  const { data, error } = await supabase
    .from('songs')
    .select('*')
    .eq('artist', artistName)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }
  
  const artistCover = data.length > 0 ? data[0].cover_art_url : null;

  return { songs: data as Song[], artistCover };
};

const ArtistPage = () => {
  const { artistName } = useParams<{ artistName: string }>();
  const decodedArtistName = decodeURIComponent(artistName || '');

  const { data, isLoading, error } = useQuery<{ songs: Song[], artistCover: string | null }, Error>({
    queryKey: ['artist', decodedArtistName],
    queryFn: () => fetchArtistSongs(decodedArtistName),
    enabled: !!decodedArtistName,
  });

  const allSongs = data?.songs ?? [];

  if (isLoading) {
    return (
      <div>
        <div className="flex items-end gap-4 mb-8">
          <Skeleton className="h-32 w-32 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-12 w-64" />
          </div>
        </div>
        <Card>
          <CardContent className="p-2">
            <div className="space-y-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center p-2">
                  <Skeleton className="h-12 w-12 rounded mr-4" />
                  <div className="flex-grow space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return <p className="text-destructive">Error: {error.message}</p>;
  }

  return (
    <div>
      <div className="flex items-end gap-6 mb-8">
        <img 
          src={data?.artistCover || '/placeholder.svg'} 
          alt={decodedArtistName} 
          className="h-32 w-32 rounded-lg object-cover shadow-lg"
        />
        <div>
          <p className="text-sm font-bold uppercase">Artist</p>
          <h1 className="text-5xl font-bold">{decodedArtistName}</h1>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Top Songs</CardTitle>
        </CardHeader>
        <CardContent className="p-2">
          <div className="space-y-1">
            {allSongs.length > 0 ? (
              allSongs.map((song, index) => (
                <SongRow key={song.id} song={song} allSongs={allSongs} index={index} />
              ))
            ) : (
              <p className="text-center text-muted-foreground p-4">No songs found for this artist.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ArtistPage;