import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Device, User, Notification, defaultDevices, defaultNotifications } from '@/lib/energy-data';

interface AppContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  devices: Device[];
  setDevices: React.Dispatch<React.SetStateAction<Device[]>>;
  addDevice: (device: Omit<Device, 'id'>) => void;
  updateDevice: (id: string, updates: Partial<Device>) => void;
  deleteDevice: (id: string) => void;
  notifications: Notification[];
  markNotificationRead: (id: string) => void;
  isAuthenticated: boolean;
  login: (email: string, password: string) => boolean;
  signup: (name: string, email: string, password: string) => boolean;
  logout: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [devices, setDevices] = useState<Device[]>(defaultDevices);
  const [notifications, setNotifications] = useState<Notification[]>(defaultNotifications);

  const addDevice = (device: Omit<Device, 'id'>) => {
    const newDevice: Device = {
      ...device,
      id: Date.now().toString(),
    };
    setDevices(prev => [...prev, newDevice]);
  };

  const updateDevice = (id: string, updates: Partial<Device>) => {
    setDevices(prev => prev.map(d => (d.id === id ? { ...d, ...updates } : d)));
  };

  const deleteDevice = (id: string) => {
    setDevices(prev => prev.filter(d => d.id !== id));
  };

  const markNotificationRead = (id: string) => {
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)));
  };

  const login = (email: string, password: string): boolean => {
    // Simulated login - accepts any valid email format
    if (email && password.length >= 4) {
      setUser({
        id: '1',
        name: email.split('@')[0],
        email,
      });
      return true;
    }
    return false;
  };

  const signup = (name: string, email: string, password: string): boolean => {
    // Simulated signup
    if (name && email && password.length >= 4) {
      setUser({
        id: '1',
        name,
        email,
      });
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AppContext.Provider
      value={{
        user,
        setUser,
        devices,
        setDevices,
        addDevice,
        updateDevice,
        deleteDevice,
        notifications,
        markNotificationRead,
        isAuthenticated: !!user,
        login,
        signup,
        logout,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
