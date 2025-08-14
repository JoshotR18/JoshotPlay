import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Playlist } from '../types';
import { Music } from 'lucide-react';

interface PlaylistCardProps {
  playlist: Playlist;
}

const PlaylistCard = ({ playlist }: PlaylistCardProps) => {
  return (
    <Link to={`/playlist/${playlist.id}`}>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow">
        <CardContent className="p-0">
          <div className="w-full h-48 bg-muted flex items-center justify-center">
            {playlist.cover_art_url ? (
              <img src={playlist.cover_art_url} alt={playlist.name} className="w-full h-full object-cover" />
            ) : (
              <Music className="w-16 h-16 text-muted-foreground" />
            )}
          </div>
          <div className="p-4">
            <h3 className="font-semibold truncate">{playlist.name}</h3>
            <p className="text-sm text-muted-foreground truncate">{playlist.description || 'No description'}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default PlaylistCard;