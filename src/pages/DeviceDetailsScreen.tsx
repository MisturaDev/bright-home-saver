import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useApp } from '@/contexts/AppContext';
import { calculateDailyEnergy, calculateDailyCost, formatCurrency, formatEnergy, getDeviceIcon, ELECTRICITY_RATE } from '@/lib/energy-data';
import { ArrowLeft, Trash2, Edit2, Power, Zap, Clock, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import BottomNav from '@/components/BottomNav';

const DeviceDetailsScreen = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { devices, updateDevice, deleteDevice } = useApp();

  const device = devices.find(d => d.id === id);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(device?.name || '');
  const [editPower, setEditPower] = useState(device?.powerRating.toString() || '');
  const [editHours, setEditHours] = useState(device?.dailyUsageHours.toString() || '');

  if (!device) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Device not found</p>
      </div>
    );
  }

  const dailyEnergy = calculateDailyEnergy(device);
  const dailyCost = calculateDailyCost(device);
  const monthlyCost = dailyCost * 30;

  const handleSave = async () => {
    const success = await updateDevice(device.id, {
      name: editName,
      powerRating: parseFloat(editPower),
      dailyUsageHours: parseFloat(editHours),
    });

    if (success) {
      setIsEditing(false);
      toast.success('Device updated successfully!');
    }
  };

  const handleDelete = async () => {
    const success = await deleteDevice(device.id);
    if (success) {
      toast.success('Device deleted');
      navigate('/add-device');
    }
  };

  const handleToggle = async (checked: boolean) => {
    const success = await updateDevice(device.id, { isOn: checked });
    if (success) {
      toast.success(checked ? 'Device turned on' : 'Device turned off');
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="bg-gradient-primary px-6 pt-8 pb-16 rounded-b-3xl">
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => navigate(-1)}>
            <ArrowLeft className="w-6 h-6 text-primary-foreground" />
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="w-10 h-10 bg-primary-foreground/20 rounded-full flex items-center justify-center"
            >
              <Edit2 className="w-5 h-5 text-primary-foreground" />
            </button>
            <button
              onClick={handleDelete}
              className="w-10 h-10 bg-destructive/20 rounded-full flex items-center justify-center"
            >
              <Trash2 className="w-5 h-5 text-primary-foreground" />
            </button>
          </div>
        </div>

        <div className="text-center">
          <div className="w-20 h-20 bg-primary-foreground/20 rounded-2xl flex items-center justify-center text-4xl mx-auto mb-4">
            {getDeviceIcon(device.type)}
          </div>
          <h1 className="text-2xl font-bold text-primary-foreground mb-2">{device.name}</h1>
          <div className="flex items-center justify-center gap-2">
            <span className={`w-3 h-3 rounded-full ${device.isOn ? 'bg-success' : 'bg-muted'}`} />
            <span className="text-primary-foreground/80">{device.isOn ? 'Active' : 'Inactive'}</span>
          </div>
        </div>
      </div>

      <div className="px-6 -mt-8 space-y-4">
        {/* Power Toggle */}
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Power className="w-5 h-5 text-primary" />
              <span className="font-medium text-foreground">Power</span>
            </div>
            <Switch checked={device.isOn} onCheckedChange={handleToggle} />
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4">
              <Zap className="w-5 h-5 text-primary mb-2" />
              <p className="text-xs text-muted-foreground">Daily Usage</p>
              <p className="text-xl font-bold text-foreground">{formatEnergy(dailyEnergy)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <Clock className="w-5 h-5 text-primary mb-2" />
              <p className="text-xs text-muted-foreground">Hours/Day</p>
              <p className="text-xl font-bold text-foreground">{device.dailyUsageHours}h</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <DollarSign className="w-5 h-5 text-accent mb-2" />
              <p className="text-xs text-muted-foreground">Daily Cost</p>
              <p className="text-xl font-bold text-foreground">{formatCurrency(dailyCost)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <DollarSign className="w-5 h-5 text-accent mb-2" />
              <p className="text-xs text-muted-foreground">Monthly Est.</p>
              <p className="text-xl font-bold text-foreground">{formatCurrency(monthlyCost)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Device Info / Edit Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Device Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isEditing ? (
              <>
                <div>
                  <label className="text-sm text-muted-foreground">Device Name</label>
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Power Rating (Watts)</label>
                  <Input
                    type="number"
                    value={editPower}
                    onChange={(e) => setEditPower(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Daily Usage (Hours)</label>
                  <Input
                    type="number"
                    value={editHours}
                    onChange={(e) => setEditHours(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div className="flex gap-3">
                  <Button variant="secondary" className="flex-1" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                  <Button className="flex-1" onClick={handleSave}>
                    Save Changes
                  </Button>
                </div>
              </>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground">Power Rating</span>
                  <span className="font-medium text-foreground">{device.powerRating} W</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground">Rate</span>
                  <span className="font-medium text-foreground">₦{ELECTRICITY_RATE}/kWh</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-muted-foreground">Type</span>
                  <span className="font-medium text-foreground capitalize">{device.type}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <BottomNav />
    </div>
  );
};

export default DeviceDetailsScreen;
