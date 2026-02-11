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
  budget?: number;
  notificationsEnabled?: boolean;
  energyAlertsEnabled?: boolean;
  highUsageThreshold?: number;
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

export interface DynamicTip {
  title: string;
  description: string;
  savings: string;
  savingsAmount: number;
  type: 'ac' | 'light' | 'wifi' | 'general' | 'fan' | 'tv';
}

export const generateDynamicTips = (devices: Device[], electricityRate: number = ELECTRICITY_RATE): DynamicTip[] => {
  const tips: DynamicTip[] = [];

  // 1. AC Savings
  const acs = devices.filter(d => d.type === 'ac');
  if (acs.length > 0) {
    const totalAcPower = acs.reduce((sum, d) => sum + d.powerRating, 0);
    // Suggest reducing usage by 1 hour/day or raising temp (approx 10% savings)
    // Conservative est: 1 hour less per day
    const dailySavingkWh = (totalAcPower * 1) / 1000;
    const monthlySaving = dailySavingkWh * 30 * electricityRate;

    tips.push({
      title: 'Optimize AC Usage',
      description: `Reducing usage of your ${acs.length} AC${acs.length > 1 ? 's' : ''} by just 1 hour/day can save significant energy.`,
      savings: `Save up to ${formatCurrency(monthlySaving)}/month`,
      savingsAmount: monthlySaving,
      type: 'ac'
    });
  }

  // 2. Lighting
  const lights = devices.filter(d => d.type === 'lights');
  if (lights.length > 0) {
    const totalLightPower = lights.reduce((sum, d) => sum + d.powerRating, 0);
    // Turn off when leaving room - assume 2 hours saved/day total
    const dailySavingkWh = (totalLightPower * 2) / 1000;
    const monthlySaving = dailySavingkWh * 30 * electricityRate;

    tips.push({
      title: 'Switch to LED & Turn Off',
      description: 'Turn off lights when leaving rooms and switch to energy-efficient LEDs.',
      savings: `Save up to ${formatCurrency(monthlySaving)}/month`,
      savingsAmount: monthlySaving,
      type: 'light'
    });
  }

  // 3. Fans
  const fans = devices.filter(d => d.type === 'fan');
  if (fans.length > 0) {
    const totalFanPower = fans.reduce((sum, d) => sum + d.powerRating, 0);
    // Reduce speed or turn off - assume 2 hours
    const dailySavingkWh = (totalFanPower * 2) / 1000;
    const monthlySaving = dailySavingkWh * 30 * electricityRate;

    tips.push({
      title: 'Use Fans Wisely',
      description: 'Use fans only when rooms are occupied. They cool people, not rooms.',
      savings: `Save up to ${formatCurrency(monthlySaving)}/month`,
      savingsAmount: monthlySaving,
      type: 'fan'
    });
  }

  // 4. Standby Power (General Phantom Load)
  // Assume 5-10% of total non-fridge energy is standby/wasted if not managed
  const capableOfStandby = devices.filter(d => d.type === 'tv' || d.type === 'other' || d.type === 'ac');

  if (capableOfStandby.length > 0) {
    // Let's assume standby is ~10W per device on average for 20 hours.
    const dailyStandbykWh = (capableOfStandby.length * 10 * 20) / 1000;
    const monthlySaving = dailyStandbykWh * 30 * electricityRate;

    tips.push({
      title: 'Unplug Idle Electronics',
      description: 'TVs, chargers, and microwaves consume power even when off. Unplug them.',
      savings: `Save up to ${formatCurrency(monthlySaving)}/month`,
      savingsAmount: monthlySaving,
      type: 'general'
    });
  }

  // 5. Fridge (Maintenance)
  const fridges = devices.filter(d => d.type === 'fridge');
  if (fridges.length > 0) {
    const totalFridgePower = fridges.reduce((sum, d) => sum + d.powerRating, 0);
    const monthlyConsumption = (totalFridgePower * 24 * 30) / 1000;
    const monthlySaving = monthlyConsumption * 0.10 * electricityRate;

    tips.push({
      title: 'Fridge Maintenance',
      description: 'Keep coils clean and defrost regularly to maintain efficiency.',
      savings: `Save up to ${formatCurrency(monthlySaving)}/month`,
      savingsAmount: monthlySaving,
      type: 'general'
    });
  }

  // If no tips (no devices), add a starter tip
  if (tips.length === 0) {
    tips.push({
      title: 'Add Devices',
      description: 'Add your home appliances to see personalized energy saving tips here.',
      savings: 'Save money',
      savingsAmount: 0,
      type: 'general'
    });
  }

  return tips.sort((a, b) => b.savingsAmount - a.savingsAmount);
};

export const generateHourlyUsage = (devices: Device[]) => {
  const hours = Array.from({ length: 24 }, (_, i) => i);

  return hours.map(hour => {
    let hourlyTotal = 0;

    devices.filter(d => d.isOn).forEach(device => {
      let isActive = false;

      // Simulate usage patterns
      if (device.type === 'fridge') {
        isActive = true; // Always on
      } else if (device.type === 'ac') {
        // Night time: 8PM - 6AM
        isActive = hour >= 20 || hour <= 6;
      } else if (device.type === 'lights') {
        // Evening: 6PM - 12AM
        isActive = hour >= 18;
      } else if (device.type === 'tv') {
        // Prime time: 6PM - 11PM
        isActive = hour >= 18 && hour <= 23;
      } else if (device.type === 'fan') {
        // Hot afternoons and night
        isActive = (hour >= 12 && hour <= 16) || (hour >= 20 || hour <= 6);
      } else {
        // Spread standard daily usage roughly
        isActive = hour >= 8 && hour <= 22;
      }

      if (isActive) {
        // Power (W) / 1000 = kW. For 1 hour, that's kWh.
        hourlyTotal += device.powerRating / 1000;
      }
    });

    // Format hour label
    const period = hour >= 12 ? 'pm' : 'am';
    const displayHour = hour % 12 || 12;
    const label = `${displayHour}${period}`;

    return {
      hour: label,
      usage: parseFloat(hourlyTotal.toFixed(2)),
      originalHour: hour // for sorting/filtering if needed
    };
    // Filter to just every 3 hours for cleaner chart labels if desired, or keep all
  }).filter((_, i) => i % 3 === 0);
};
