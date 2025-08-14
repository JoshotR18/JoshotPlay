import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import CreatePlaylistPage from "./pages/CreatePlaylist";
import PlaylistPage from "./pages/Playlist";
import AdminPage from "./pages/Admin";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import { MusicPlayerProvider } from "./contexts/MusicPlayerContext";
import MainLayout from "./components/MainLayout";
import { ThemeProvider } from "./components/ThemeProvider";
import SearchPage from "./pages/Search";
import ArtistPage from "./pages/Artist";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // Prevent refetching on window focus
      staleTime: 1000 * 60 * 5, // Data is considered fresh for 5 minutes
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <MusicPlayerProvider>
              <Routes>
                <Route path="/login" element={<Login />} />
                
                <Route element={<MainLayout />}>
                  <Route element={<ProtectedRoute allowedRoles={['admin', 'user']} />}>
                    <Route path="/" element={<Index />} />
                    <Route path="/create-playlist" element={<CreatePlaylistPage />} />
                    <Route path="/playlist/:playlistId" element={<PlaylistPage />} />
                    <Route path="/search" element={<SearchPage />} />
                    <Route path="/artist/:artistName" element={<ArtistPage />} />
                  </Route>
                  <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                    <Route path="/admin" element={<AdminPage />} />
                  </Route>
                </Route>

                <Route path="*" element={<NotFound />} />
              </Routes>
            </MusicPlayerProvider>
          </AuthProvider>
        </BrowserRouter>
      </ThemeProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;