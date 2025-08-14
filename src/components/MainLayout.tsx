import { Outlet } from 'react-router-dom';
import MusicPlayer from './MusicPlayer';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';
import Sidebar from './Sidebar';
import Header from './Header';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';

const MainLayout = () => {
  const { currentSong } = useMusicPlayer();

  return (
    <div className="h-screen w-screen flex flex-col bg-background text-foreground">
      <ResizablePanelGroup direction="horizontal" className="flex-grow">
        <ResizablePanel defaultSize={20} minSize={15} maxSize={30} className="hidden md:block">
          <Sidebar />
        </ResizablePanel>
        <ResizableHandle withHandle className="hidden md:flex" />
        <ResizablePanel defaultSize={80}>
          <div className="h-full flex flex-col">
            <Header />
            <main className="flex-grow overflow-y-auto p-6" style={{ paddingBottom: currentSong ? '120px' : '0' }}>
              <Outlet />
            </main>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
      <MusicPlayer />
    </div>
  );
};

export default MainLayout;