import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { useApp } from '@/contexts/AppContext';
import { ArrowLeft, AlertTriangle, Info, CheckCircle, Bell } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import BottomNav from '@/components/BottomNav';

const NotificationsScreen = () => {
  const navigate = useNavigate();
  const { notifications, markNotificationRead } = useApp();

  const getIcon = (type: 'warning' | 'info' | 'success') => {
    const icons = {
      warning: <AlertTriangle className="w-5 h-5 text-warning" />,
      info: <Info className="w-5 h-5 text-primary" />,
      success: <CheckCircle className="w-5 h-5 text-success" />,
    };
    return icons[type];
  };

  const getBgColor = (type: 'warning' | 'info' | 'success') => {
    const colors = {
      warning: 'bg-warning/10',
      info: 'bg-primary/10',
      success: 'bg-success/10',
    };
    return colors[type];
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="bg-card border-b border-border px-6 py-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="w-6 h-6 text-foreground" />
          </button>
          <h1 className="text-xl font-bold text-foreground">Notifications</h1>
        </div>
      </div>

      <div className="p-6">
        {notifications.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
              <Bell className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">No notifications yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <Card 
                key={notification.id}
                className={`cursor-pointer transition-all ${!notification.read ? 'ring-2 ring-primary/20' : ''}`}
                onClick={() => markNotificationRead(notification.id)}
              >
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${getBgColor(notification.type)}`}>
                      {getIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-foreground">{notification.title}</h3>
                        {!notification.read && (
                          <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-2" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default NotificationsScreen;
