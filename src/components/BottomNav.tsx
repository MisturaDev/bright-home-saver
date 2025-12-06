import { useNavigate, useLocation } from 'react-router-dom';
import { Home, PlusCircle, Bell, Lightbulb, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useApp } from '@/contexts/AppContext';

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { notifications } = useApp();
  
  const unreadCount = notifications.filter(n => !n.read).length;

  const navItems = [
    { icon: Home, label: 'Home', path: '/dashboard' },
    { icon: PlusCircle, label: 'Add', path: '/add-device' },
    { icon: Bell, label: 'Alerts', path: '/notifications', badge: unreadCount },
    { icon: Lightbulb, label: 'Tips', path: '/tips' },
    { icon: User, label: 'Profile', path: '/profile' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border shadow-elevated">
      <div className="flex items-center justify-around py-2 px-4 max-w-lg mx-auto">
        {navItems.map(({ icon: Icon, label, path, badge }) => {
          const isActive = location.pathname === path;
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={cn(
                "flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-200 relative min-w-[60px]",
                isActive 
                  ? "text-primary bg-primary/10" 
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              )}
            >
              <Icon className={cn("w-6 h-6", isActive && "animate-pulse-soft")} />
              <span className="text-xs font-medium">{label}</span>
              {badge && badge > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-xs font-bold rounded-full flex items-center justify-center">
                  {badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
