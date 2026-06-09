import { useAuthStore } from '@/stores/authStore';
import { useNavigate } from 'react-router-dom';
import { LogOut, FileText } from 'lucide-react';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-lg font-semibold text-brand hover:opacity-80 transition-opacity"
          >
            <FileText className="h-5 w-5" />
            CoDoc
          </button>
          {user && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">{user.username}</span>
              <button
                onClick={handleLogout}
                className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
