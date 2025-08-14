import { cn } from "@/lib/utils";

interface PlayingIndicatorProps {
  className?: string;
}

const PlayingIndicator = ({ className }: PlayingIndicatorProps) => {
  return (
    <div className={cn("flex items-end justify-center gap-px h-4 w-4", className)}>
      <span className="w-0.5 h-1/2 bg-primary animate-wave" style={{ animationDelay: '0.1s' }} />
      <span className="w-0.5 h-full bg-primary animate-wave" style={{ animationDelay: '0.2s' }} />
      <span className="w-0.5 h-1/3 bg-primary animate-wave" style={{ animationDelay: '0.3s' }} />
      <span className="w-0.5 h-3/4 bg-primary animate-wave" style={{ animationDelay: '0.4s' }} />
    </div>
  );
};

export default PlayingIndicator;