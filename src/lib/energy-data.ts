export interface Device {
  id: string;
  name: string;
  type: 'ac' | 'fridge' | 'tv' | 'fan' | 'lights' | 'other';
  powerRating: number; // watts
  dailyUsageHours: number;
  isOn: boolean;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'warning' | 'info' | 'success';
  timestamp: Date;
  read: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  electricityRate?: number;
}

export const ELECTRICITY_RATE = 70; // Default fallback

export const calculateDailyEnergy = (device: Device): number => {
  return (device.powerRating * device.dailyUsageHours) / 1000; // kWh
};

export const calculateDailyCost = (device: Device, rate: number = ELECTRICITY_RATE): number => {
  return calculateDailyEnergy(device) * rate;
};

export const formatCurrency = (amount: number): string => {
  return `₦${amount.toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};

export const formatEnergy = (kwh: number): string => {
  return `${kwh.toFixed(2)} kWh`;
};

export const getDeviceIcon = (type: Device['type']): string => {
  const icons: Record<Device['type'], string> = {
    ac: '❄️',
    fridge: '🧊',
    tv: '📺',
    fan: '🌀',
    lights: '💡',
    other: '🔌',
  };
  return icons[type];
};

export const defaultDevices: Device[] = [
  { id: '1', name: 'Living Room AC', type: 'ac', powerRating: 1500, dailyUsageHours: 6, isOn: true },
  { id: '2', name: 'Kitchen Fridge', type: 'fridge', powerRating: 150, dailyUsageHours: 24, isOn: true },
  { id: '3', name: 'Smart TV', type: 'tv', powerRating: 100, dailyUsageHours: 4, isOn: false },
  { id: '4', name: 'Ceiling Fan', type: 'fan', powerRating: 75, dailyUsageHours: 8, isOn: true },
  { id: '5', name: 'Bedroom Lights', type: 'lights', powerRating: 60, dailyUsageHours: 5, isOn: false },
];

export const defaultNotifications: Notification[] = [
  {
    id: '1',
    title: 'High Energy Alert',
    message: 'AC has been running for 3 hours — estimated ₦350 used',
    type: 'warning',
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
    read: false,
  },
  {
    id: '2',
    title: 'Daily Summary',
    message: 'Yesterday you used 12.5 kWh, saving ₦150 compared to last week',
    type: 'success',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
    read: false,
  },
  {
    id: '3',
    title: 'Peak Hours Reminder',
    message: 'Energy rates are higher between 6 PM - 10 PM. Consider reducing usage.',
    type: 'info',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5),
    read: true,
  },
];

export const energyTips = [
  {
    title: 'Switch to LED Bulbs',
    description: 'LED bulbs use up to 75% less energy than incandescent bulbs and last 25 times longer.',
    savings: 'Save up to ₦2,000/month',
  },
  {
    title: 'Optimize AC Usage',
    description: 'Set your AC to 24°C instead of 18°C. Each degree lower can increase energy use by 6%.',
    savings: 'Save up to ₦3,500/month',
  },
  {
    title: 'Unplug Idle Devices',
    description: 'Standby power can account for 5-10% of your electricity bill. Unplug chargers and appliances when not in use.',
    savings: 'Save up to ₦800/month',
  },
  {
    title: 'Use Natural Light',
    description: 'Open curtains during the day to reduce the need for artificial lighting.',
    savings: 'Save up to ₦500/month',
  },
  {
    title: 'Regular Maintenance',
    description: 'Clean AC filters monthly and defrost your fridge regularly for optimal efficiency.',
    savings: 'Save up to ₦1,200/month',
  },
];

export const hourlyUsageData = [
  { hour: '12am', usage: 0.8 },
  { hour: '3am', usage: 0.6 },
  { hour: '6am', usage: 1.2 },
  { hour: '9am', usage: 2.1 },
  { hour: '12pm', usage: 2.8 },
  { hour: '3pm', usage: 3.2 },
  { hour: '6pm', usage: 3.5 },
  { hour: '9pm', usage: 2.4 },
];
