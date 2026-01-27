import { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useApp } from '@/contexts/AppContext';
import { calculateDailyEnergy, calculateDailyCost, formatCurrency, formatEnergy, getDeviceIcon, generateHourlyUsage, ELECTRICITY_RATE } from '@/lib/energy-data';
import { EnergyService, DailyUsage } from '@/services/EnergyService';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from 'recharts';
import { Zap, TrendingUp, ChevronRight, BarChart3, Calendar, Database } from 'lucide-react';
import BottomNav from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const Dashboard = () => {
  const navigate = useNavigate();
  const { devices, user } = useApp();


  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month'>('today');
  const [historyData, setHistoryData] = useState<DailyUsage[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Today's simulated data
  const hourlyUsageData = generateHourlyUsage(devices); // useMemo removed to refresh on updates easily

  useEffect(() => {
    if (timeRange !== 'today' && user) {
      fetchHistory();
    }
  }, [timeRange, user]);

  const fetchHistory = async () => {
    if (!user) return;
    setIsLoadingHistory(true);
    try {
      const days = timeRange === 'week' ? 7 : 30;
      const data = await EnergyService.getDailyUsage(user.id, user.id, days);
      setHistoryData(data);
    } catch (error) {
      toast.error("Failed to load history");
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleGenerateData = async () => {
    if (!user) return;
    setIsGenerating(true);
    try {
      const success = await EnergyService.generateHistoricalData(user.id, devices);
      if (success) {
        toast.success("History generated! Switch to Week/Month view.");
        if (timeRange !== 'today') fetchHistory();
      } else {
        toast.info("Data already exists or no devices found.");
      }
    } catch (error) {
      toast.error("Failed to generate data");
    } finally {
      setIsGenerating(false);
    }
  };

  // Determine which data to show
  const chartData = timeRange === 'today' ? hourlyUsageData : historyData;
  const xKey = timeRange === 'today' ? 'hour' : 'date';
  const yKey = timeRange === 'today' ? 'usage' : 'energy';

  // Calculate totals
  const totalEnergy = devices.reduce((sum, d) => sum + calculateDailyEnergy(d), 0);
  const totalCost = devices.reduce((sum, d) => sum + calculateDailyCost(d, user?.electricityRate), 0);

  // Get top 3 consumers
  const topDevices = [...devices]
    .sort((a, b) => calculateDailyEnergy(b) - calculateDailyEnergy(a))
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="bg-gradient-primary px-6 pt-8 pb-12 rounded-b-3xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-primary-foreground/80 text-sm">Good morning</p>
            <h1 className="text-xl font-bold text-primary-foreground">{user?.name || 'User'}</h1>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="w-10 h-10 bg-primary-foreground/10 hover:bg-primary-foreground/20 text-primary-foreground rounded-full"
              onClick={handleGenerateData}
              disabled={isGenerating}
              title="Generate Demo History"
            >
              <Database className={`w-5 h-5 ${isGenerating ? 'animate-pulse' : ''}`} />
            </Button>
            <div className="w-10 h-10 bg-primary-foreground/20 rounded-full flex items-center justify-center">
              <Zap className="w-5 h-5 text-primary-foreground" />
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="border-0 bg-card/95 backdrop-blur-sm">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Today's Usage</p>
              <p className="text-2xl font-bold text-foreground">{formatEnergy(totalEnergy)}</p>
              <div className="flex items-center gap-1 mt-1">
                <TrendingUp className="w-3 h-3 text-success" />
                <span className="text-xs text-success">12% less than yesterday</span>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 bg-card/95 backdrop-blur-sm">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Estimated Cost</p>
              <p className="text-2xl font-bold text-foreground">{formatCurrency(totalCost)}</p>
              <p className="text-xs text-muted-foreground mt-1">@ ₦{user?.electricityRate || ELECTRICITY_RATE}/kWh</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="px-6 -mt-4 space-y-6">
        {/* Usage Chart */}
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Energy Overview</CardTitle>
            <div className="flex bg-secondary rounded-lg p-1 gap-1">
              <button
                onClick={() => setTimeRange('today')}
                className={`px-3 py-1 text-xs rounded-md transition-all ${timeRange === 'today' ? 'bg-background shadow-sm font-medium text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Today
              </button>
              <button
                onClick={() => setTimeRange('week')}
                className={`px-3 py-1 text-xs rounded-md transition-all ${timeRange === 'week' ? 'bg-background shadow-sm font-medium text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Week
              </button>
              <button
                onClick={() => setTimeRange('month')}
                className={`px-3 py-1 text-xs rounded-md transition-all ${timeRange === 'month' ? 'bg-background shadow-sm font-medium text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Month
              </button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorUsage" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(162, 63%, 41%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(162, 63%, 41%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey={xKey}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: 'hsl(160, 15%, 45%)' }}
                    tickFormatter={(val) => timeRange === 'today' ? val : val.slice(5)}
                  />
                  <YAxis hide />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(0, 0%, 100%)',
                      border: 'none',
                      borderRadius: '12px',
                      boxShadow: '0 8px 24px -8px rgba(0,0,0,0.15)',
                    }}
                    formatter={(value: number) => [`${value.toFixed(2)} kWh`, timeRange === 'today' ? 'Usage' : 'Energy']}
                    labelFormatter={(label) => timeRange === 'today' ? label : new Date(label).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                  />
                  <Area
                    type="monotone"
                    dataKey={yKey}
                    stroke="hsl(162, 63%, 41%)"
                    strokeWidth={2}
                    fill="url(#colorUsage)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Energy Consumers */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-foreground">Top Energy Consumers</h2>
            <button
              onClick={() => navigate('/add-device')}
              className="text-sm text-primary font-medium"
            >
              View All
            </button>
          </div>
          <div className="space-y-3">
            {topDevices.map((device, index) => (
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
                      {formatEnergy(calculateDailyEnergy(device))} • {formatCurrency(calculateDailyCost(device, user?.electricityRate))}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground bg-secondary px-2 py-1 rounded-lg">
                      #{index + 1}
                    </span>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </div>
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

export default Dashboard;
