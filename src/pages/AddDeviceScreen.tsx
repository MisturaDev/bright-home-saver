import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useApp } from '@/contexts/AppContext';
import { Device, getDeviceIcon, calculateDailyEnergy, calculateDailyCost, formatCurrency, formatEnergy } from '@/lib/energy-data';
import { ArrowLeft, Plus, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import BottomNav from '@/components/BottomNav';

const deviceTypes: { type: Device['type']; label: string }[] = [
  { type: 'ac', label: 'Air Conditioner' },
  { type: 'fridge', label: 'Refrigerator' },
  { type: 'tv', label: 'Television' },
  { type: 'fan', label: 'Fan' },
  { type: 'lights', label: 'Lights' },
  { type: 'other', label: 'Other' },
];

const AddDeviceScreen = () => {
  const navigate = useNavigate();
  const { devices, addDevice } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [selectedType, setSelectedType] = useState<Device['type']>('other');
  const [name, setName] = useState('');
  const [powerRating, setPowerRating] = useState('');
  const [dailyUsageHours, setDailyUsageHours] = useState('');

  const handleAddDevice = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !powerRating || !dailyUsageHours) {
      toast.error('Please fill in all fields');
      return;
    }

    addDevice({
      name,
      type: selectedType,
      powerRating: parseFloat(powerRating),
      dailyUsageHours: parseFloat(dailyUsageHours),
      isOn: true,
    });

    toast.success('Device added successfully!');
    setShowForm(false);
    setName('');
    setPowerRating('');
    setDailyUsageHours('');
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="bg-card border-b border-border px-6 py-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="w-6 h-6 text-foreground" />
          </button>
          <h1 className="text-xl font-bold text-foreground">Manage Devices</h1>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Add Device Button/Form */}
        {!showForm ? (
          <Button 
            onClick={() => setShowForm(true)} 
            className="w-full"
            variant="outline"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add New Device
          </Button>
        ) : (
          <Card className="animate-slide-up">
            <CardContent className="p-5">
              <h3 className="font-bold text-foreground mb-4">Add New Device</h3>
              <form onSubmit={handleAddDevice} className="space-y-4">
                {/* Device Type Selection */}
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Device Type</label>
                  <div className="grid grid-cols-3 gap-2">
                    {deviceTypes.map(({ type, label }) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setSelectedType(type)}
                        className={`p-3 rounded-xl border-2 transition-all ${
                          selectedType === type 
                            ? 'border-primary bg-primary/10' 
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <span className="text-2xl block mb-1">{getDeviceIcon(type)}</span>
                        <span className="text-xs text-foreground">{label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <Input
                  placeholder="Device Name (e.g., Living Room AC)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />

                <Input
                  type="number"
                  placeholder="Power Rating (Watts)"
                  value={powerRating}
                  onChange={(e) => setPowerRating(e.target.value)}
                  min="1"
                  required
                />

                <Input
                  type="number"
                  placeholder="Daily Usage (Hours)"
                  value={dailyUsageHours}
                  onChange={(e) => setDailyUsageHours(e.target.value)}
                  min="0.5"
                  max="24"
                  step="0.5"
                  required
                />

                <div className="flex gap-3">
                  <Button type="button" variant="secondary" className="flex-1" onClick={() => setShowForm(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1">
                    Add Device
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Existing Devices List */}
        <div>
          <h2 className="text-lg font-bold text-foreground mb-3">Your Devices ({devices.length})</h2>
          <div className="space-y-3">
            {devices.map((device) => (
              <Card 
                key={device.id}
                className="cursor-pointer hover:scale-[1.02] transition-transform"
                onClick={() => navigate(`/device/${device.id}`)}
              >
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-12 h-12 bg-secondary rounded-xl flex items-center justify-center text-2xl">
                    {getDeviceIcon(device.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground">{device.name}</h3>
                      {device.isOn && (
                        <span className="w-2 h-2 bg-success rounded-full animate-pulse" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {device.powerRating}W • {device.dailyUsageHours}h/day
                    </p>
                    <p className="text-xs text-primary font-medium">
                      {formatEnergy(calculateDailyEnergy(device))} • {formatCurrency(calculateDailyCost(device))}/day
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default AddDeviceScreen;
