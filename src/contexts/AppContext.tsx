import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Device, Notification, User } from '@/lib/energy-data';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { NotificationService } from '@/services/NotificationService';
import { EnergyService } from '@/services/EnergyService';


interface AppContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  devices: Device[];
  setDevices: React.Dispatch<React.SetStateAction<Device[]>>;
  addDevice: (device: Omit<Device, 'id'>) => Promise<boolean>;
  updateDevice: (id: string, updates: Partial<Device>) => Promise<boolean>;
  deleteDevice: (id: string) => Promise<boolean>;
  notifications: Notification[];
  markNotificationRead: (id: string) => void;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ error: any }>;
  signup: (name: string, email: string, password: string) => Promise<{ error: any }>;
  logout: () => Promise<void>;

  updateElectricityRate: (rate: number) => Promise<boolean>;
  updateBudget: (budget: number) => Promise<boolean>;
  isLoading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [devices, setDevices] = useState<Device[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);


  // Initialize Auth
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata.name || session.user.email?.split('@')[0] || 'User',
          electricityRate: session.user.user_metadata.electricity_rate,
          budget: session.user.user_metadata.budget,
        });
        fetchDevices(session.user.id);
      } else {
        setUser(null);
        setDevices([]);
      }
      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata.name || session.user.email?.split('@')[0] || 'User',
          electricityRate: session.user.user_metadata.electricity_rate,
          budget: session.user.user_metadata.budget,
        });
        fetchDevices(session.user.id);
      } else {
        setUser(null);
        setDevices([]);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch notifications and run checks when user or key data changes
  useEffect(() => {
    if (user) {
      refreshNotifications();
      // Run checks
      runNotificationChecks();
    } else {
      setNotifications([]);
    }
  }, [user?.id, user?.budget, user?.electricityRate]); // Re-run if user identity or settings change

  const runNotificationChecks = async () => {
    if (!user) return;
    try {
      // 1. Check Budget
      const monthTotal = await EnergyService.getCurrentMonthTotal(user.id);
      if (user.budget) {
        await NotificationService.checkBudget(user.id, monthTotal.cost, user.budget);
      }

      // 2. Check High Usage
      // Check today's usage against a threshold
      const todayUsage = await EnergyService.getDailyUsage(user.id, user.id, 1);
      if (todayUsage.length > 0) {
        // Check if today's usage > 20kWh (default)
        await NotificationService.checkUsageHigh(user.id, todayUsage[todayUsage.length - 1].energy);
      }


      // Refresh after checks in case new ones were created
      refreshNotifications();

    } catch (e) {
      console.error("Error running notification checks", e);
    }
  };

  const refreshNotifications = async () => {
    if (!user) return;
    const data = await NotificationService.getNotifications(user.id);
    setNotifications(data);
  };


  const fetchDevices = async (userId: string) => {
    const { data, error } = await supabase
      .from('devices')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching devices:', error);
      toast.error('Failed to load devices');
      return;
    }

    if (data) {
      const formattedDevices: Device[] = data.map((d: any) => ({
        id: d.id,
        name: d.name,
        type: d.type,
        powerRating: d.power_rating,
        dailyUsageHours: d.daily_usage_hours,
        isOn: d.is_on,
      }));
      setDevices(formattedDevices);
    }
  };

  const addDevice = async (device: Omit<Device, 'id'>): Promise<boolean> => {
    if (!user) return false;

    try {
      const { data, error } = await supabase
        .from('devices')
        .insert([
          {
            user_id: user.id,
            name: device.name,
            type: device.type,
            power_rating: device.powerRating,
            daily_usage_hours: device.dailyUsageHours,
            is_on: device.isOn,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      if (data) {
        const newDevice: Device = {
          id: data.id,
          name: data.name,
          type: data.type,
          powerRating: data.power_rating,
          dailyUsageHours: data.daily_usage_hours,
          isOn: data.is_on,
        };
        setDevices(prev => [...prev, newDevice]);



        return true;
      }
      return false;
    } catch (error: any) {
      console.error('Error adding device:', error);
      toast.error(error.message || 'Failed to add device');
      return false;
    }
  };

  const updateDevice = async (id: string, updates: Partial<Device>): Promise<boolean> => {
    try {
      // Map frontend camelCase to DB snake_case
      const dbUpdates: Record<string, any> = {};
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.type !== undefined) dbUpdates.type = updates.type;
      if (updates.powerRating !== undefined) dbUpdates.power_rating = updates.powerRating;
      if (updates.dailyUsageHours !== undefined) dbUpdates.daily_usage_hours = updates.dailyUsageHours;
      if (updates.isOn !== undefined) dbUpdates.is_on = updates.isOn;

      const { error } = await supabase
        .from('devices')
        .update(dbUpdates)
        .eq('id', id);

      if (error) throw error;

      setDevices(prev => prev.map(d => (d.id === id ? { ...d, ...updates } : d)));
      return true;
    } catch (error: any) {
      console.error('Error updating device:', error);
      toast.error('Failed to update device');
      return false;
    }
  };

  const deleteDevice = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('devices')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setDevices(prev => prev.filter(d => d.id !== id));
      return true;
    } catch (error: any) {
      console.error('Error deleting device:', error);
      toast.error('Failed to delete device');
      return false;
    }
  };

  const markNotificationRead = async (id: string) => {
    // Optimistic update
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)));
    await NotificationService.markAsRead(id);
  };

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signup = async (name: string, email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
        },
      },
    });
    return { error };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setDevices([]);
  };

  const updateElectricityRate = async (rate: number): Promise<boolean> => {
    try {
      const { data, error } = await supabase.auth.updateUser({
        data: { electricity_rate: rate }
      });

      if (error) throw error;

      if (data.user) {
        setUser(prev => prev ? { ...prev, electricityRate: rate } : null);
        toast.success('Electricity rate updated');
        return true;
      }
      return false;
    } catch (error: any) {
      console.error('Error updating rate:', error);
      toast.error('Failed to update electricity rate');
      return false;
    }
  };

  const updateBudget = async (budget: number): Promise<boolean> => {
    try {
      const { data, error } = await supabase.auth.updateUser({
        data: { budget: budget }
      });

      if (error) throw error;

      if (data.user) {
        setUser(prev => prev ? { ...prev, budget: budget } : null);
        toast.success('Monthly budget updated');
        return true;
      }
      return false;
    } catch (error: any) {
      console.error('Error updating budget:', error);
      toast.error('Failed to update budget');
      return false;
    }
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
        updateElectricityRate,
        updateBudget,
        isLoading,
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
