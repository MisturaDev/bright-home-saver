import { useRef, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useApp } from '@/contexts/AppContext';
import { ArrowLeft, User, Mail, Bell, Smartphone, LogOut, ChevronRight, Shield, Edit2, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import BottomNav from '@/components/BottomNav';

const ProfileScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, devices, updateElectricityRate, updateBudget, updateNotificationSettings } = useApp();
  const [rate, setRate] = useState(user?.electricityRate?.toString() || '70');
  const [budget, setBudget] = useState(user?.budget?.toString() || '0');
  const [threshold, setThreshold] = useState(user?.highUsageThreshold?.toString() || '20');
  const [isEditingRate, setIsEditingRate] = useState(false);
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [isEditingThreshold, setIsEditingThreshold] = useState(false);

  const budgetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (location.state?.focus === 'budget') {
      setIsEditingBudget(true);
      setTimeout(() => {
        budgetRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  }, [location.state]);

  // Update local state when user data loads
  useEffect(() => {
    if (user?.electricityRate) {
      setRate(user.electricityRate.toString());
    }
    if (user?.budget) {
      setBudget(user.budget.toString());
    }
    if (user?.highUsageThreshold) {
      setThreshold(user.highUsageThreshold.toString());
    }
  }, [user]);

  const handleUpdateRate = async () => {
    const newRate = parseFloat(rate);
    if (isNaN(newRate) || newRate <= 0) {
      toast.error('Please enter a valid rate');
      return;
    }

    const success = await updateElectricityRate(newRate);
    if (success) {
      setIsEditingRate(false);
    }
  };

  const handleUpdateBudget = async () => {
    const newBudget = parseFloat(budget);
    if (isNaN(newBudget) || newBudget < 0) {
      toast.error('Please enter a valid budget');
      return;
    }

    const success = await updateBudget(newBudget);
    if (success) {
      setIsEditingBudget(false);
    }
  };

  const handleUpdateThreshold = async () => {
    const newThreshold = parseFloat(threshold);
    if (isNaN(newThreshold) || newThreshold <= 0) {
      toast.error('Please enter a valid threshold');
      return;
    }

    const success = await updateNotificationSettings({ highUsageThreshold: newThreshold });
    if (success) {
      setIsEditingThreshold(false);
    }
  };

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/');
  };

  const toggleSetting = async (key: 'notificationsEnabled' | 'energyAlertsEnabled', currentValue: boolean) => {
    await updateNotificationSettings({ [key]: !currentValue });
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="bg-card border-b border-border px-6 py-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="w-6 h-6 text-foreground" />
          </button>
          <h1 className="text-xl font-bold text-foreground">Profile & Settings</h1>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* User Profile Card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-primary-foreground" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-foreground">{user?.name || 'User'}</h2>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="w-4 h-4" />
                  <span className="text-sm">{user?.email || 'user@example.com'}</span>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-border">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">{devices.length}</p>
                <p className="text-sm text-muted-foreground">Connected Devices</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-success">12%</p>
                <p className="text-sm text-muted-foreground">Energy Saved</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Electricity Rate Setting */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Electricity Rate</CardTitle>
          </CardHeader>
          <CardContent className="p-5 pt-0">
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <label className="text-sm text-muted-foreground mb-1.5 block">Tariff (₦/kWh)</label>
                <Input
                  type="number"
                  value={rate}
                  onChange={(e) => setRate(e.target.value)}
                  disabled={!isEditingRate}
                  className="bg-background"
                />
              </div>
              {isEditingRate ? (
                <div className="flex gap-2">
                  <Button variant="outline" size="icon" onClick={() => setIsEditingRate(false)}>
                    <X className="w-4 h-4" />
                  </Button>
                  <Button size="icon" onClick={handleUpdateRate}>
                    <Check className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <Button variant="outline" size="icon" onClick={() => setIsEditingRate(true)}>
                  <Edit2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Budget Setting */}
        <Card ref={budgetRef}>
          <CardHeader>
            <CardTitle className="text-base">Monthly Budget</CardTitle>
          </CardHeader>
          <CardContent className="p-5 pt-0">
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <label className="text-sm text-muted-foreground mb-1.5 block">Target (₦)</label>
                <Input
                  type="number"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  disabled={!isEditingBudget}
                  className="bg-background"
                />
              </div>
              {isEditingBudget ? (
                <div className="flex gap-2">
                  <Button variant="outline" size="icon" onClick={() => setIsEditingBudget(false)}>
                    <X className="w-4 h-4" />
                  </Button>
                  <Button size="icon" onClick={handleUpdateBudget}>
                    <Check className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <Button variant="outline" size="icon" onClick={() => setIsEditingBudget(true)}>
                  <Edit2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* High Usage Threshold */}
        {/* High Usage Threshold - Temporarily Disabled
        <Card>
          <CardHeader>
            <CardTitle className="text-base">High Usage Alert Threshold</CardTitle>
          </CardHeader>
          <CardContent className="p-5 pt-0">
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <label className="text-sm text-muted-foreground mb-1.5 block">Threshold (kWh)</label>
                <Input
                  type="number"
                  value={threshold}
                  onChange={(e) => setThreshold(e.target.value)}
                  disabled={!isEditingThreshold}
                  className="bg-background"
                />
              </div>
              {isEditingThreshold ? (
                <div className="flex gap-2">
                  <Button variant="outline" size="icon" onClick={() => setIsEditingThreshold(false)}>
                    <X className="w-4 h-4" />
                  </Button>
                  <Button size="icon" onClick={handleUpdateThreshold}>
                    <Check className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <Button variant="outline" size="icon" onClick={() => setIsEditingThreshold(true)}>
                  <Edit2 className="w-4 h-4" />
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Receive an alert when daily usage exceeds this amount.
            </p>
          </CardContent>
        </Card>
        */}

        {/* Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Settings</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-muted-foreground" />
                <span className="font-medium text-foreground">Push Notifications</span>
              </div>
              <Switch
                checked={user?.notificationsEnabled ?? true}
                onCheckedChange={() => toggleSetting('notificationsEnabled', user?.notificationsEnabled ?? true)}
              />
            </div>

            {/* Temporarily Disabled
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-muted-foreground" />
                <span className="font-medium text-foreground">Energy Alerts</span>
              </div>
              <Switch
                checked={user?.energyAlertsEnabled ?? true}
                onCheckedChange={() => toggleSetting('energyAlertsEnabled', user?.energyAlertsEnabled ?? true)}
              />
            </div>
            */}

            <div
              className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-secondary/50 transition-colors"
              onClick={() => navigate('/add-device')}
            >
              <div className="flex items-center gap-3">
                <Smartphone className="w-5 h-5 text-muted-foreground" />
                <span className="font-medium text-foreground">Manage Devices</span>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        {/* Logout Button */}
        <Button
          variant="outline"
          className="w-full border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
          onClick={handleLogout}
        >
          <LogOut className="w-5 h-5 mr-2" />
          Log Out
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          Smart Home Energy Saver v1.0.0
        </p>
      </div>

      <BottomNav />
    </div>
  );
};

export default ProfileScreen;
