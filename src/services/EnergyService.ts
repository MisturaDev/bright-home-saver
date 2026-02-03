import { supabase } from '@/lib/supabase';
import { Device, calculateDailyEnergy, calculateDailyCost, ELECTRICITY_RATE } from '@/lib/energy-data';
import { subDays, startOfDay, format, isSameDay } from 'date-fns';

export interface UsageLog {
    id: string;
    user_id: string;
    device_id?: string;
    energy_kwh: number;
    cost: number;
    timestamp: string;
    created_at: string;
}

export interface DailyUsage {
    date: string;
    energy: number;
    cost: number;
}

export const EnergyService = {
    /**
     * Fetch daily usage aggregates for a date range
     */
    async getDailyUsage(userId: string, activeUserId: string, days: number = 7): Promise<DailyUsage[]> {
        const startDate = subDays(new Date(), days);

        // Safety check: ensure we only fetch for the authenticated user
        if (userId !== activeUserId) throw new Error("Unauthorized");

        const { data, error } = await supabase
            .from('usage_logs')
            .select('timestamp, energy_kwh, cost')
            .eq('user_id', userId)
            .gte('timestamp', startDate.toISOString())
            .order('timestamp', { ascending: true });

        if (error) {
            console.error('Error fetching usage logs:', error);
            throw error;
        }

        // Aggregate by day
        const dailyMap = new Map<string, DailyUsage>();

        // Initialize with 0s for the last N days to ensure continuous chart
        for (let i = 0; i <= days; i++) {
            const d = subDays(new Date(), days - i);
            const dateKey = format(d, 'yyyy-MM-dd');
            dailyMap.set(dateKey, { date: dateKey, energy: 0, cost: 0 });
        }

        data?.forEach((log) => {
            const dateKey = format(new Date(log.timestamp), 'yyyy-MM-dd');
            const existing = dailyMap.get(dateKey);
            if (existing) {
                existing.energy += Number(log.energy_kwh);
                existing.cost += Number(log.cost);
            }
        });

        return Array.from(dailyMap.values());
    },

    /**
     * Get hourly usage for a specific date
     */
    async getHourlyUsage(userId: string, date: Date = new Date()): Promise<{ hour: string; usage: number; originalHour: number }[]> {
        const start = startOfDay(date);
        const end = new Date(start);
        end.setHours(23, 59, 59, 999);

        const { data, error } = await supabase
            .from('usage_logs')
            .select('timestamp, energy_kwh')
            .eq('user_id', userId)
            .gte('timestamp', start.toISOString())
            .lte('timestamp', end.toISOString());

        if (error) {
            console.error('Error fetching hourly usage:', error);
            return [];
        }

        // Initialize 24 hours
        const hourlyMap = new Map<number, number>();
        for (let i = 0; i < 24; i++) {
            hourlyMap.set(i, 0);
        }

        data?.forEach(log => {
            const hour = new Date(log.timestamp).getHours();
            const current = hourlyMap.get(hour) || 0;
            hourlyMap.set(hour, current + Number(log.energy_kwh));
        });

        return Array.from(hourlyMap.entries()).map(([hour, usage]) => {
            const period = hour >= 12 ? 'pm' : 'am';
            const displayHour = hour % 12 || 12;
            const label = `${displayHour}${period}`;

            return {
                hour: label,
                usage: parseFloat(usage.toFixed(2)),
                originalHour: hour
            };
        });
    },

    /**
     * Get total cost and energy for the current month
     */
    async getCurrentMonthTotal(userId: string): Promise<{ energy: number; cost: number }> {
        const start = startOfDay(new Date());
        start.setDate(1); // 1st of current month

        const { data, error } = await supabase
            .from('usage_logs')
            .select('energy_kwh, cost')
            .eq('user_id', userId)
            .gte('timestamp', start.toISOString());

        if (error) {
            console.error('Error fetching month total:', error);
            return { energy: 0, cost: 0 };
        }

        const total = data.reduce(
            (acc, curr) => ({
                energy: acc.energy + Number(curr.energy_kwh),
                cost: acc.cost + Number(curr.cost),
            }),
            { energy: 0, cost: 0 }
        );

        return total;
    },

    /**
     * Log usage for a specific device (or general)
     */
    async logUsage(userId: string, deviceId: string | null, energy: number, cost: number, timestamp: Date = new Date()) {
        const { error } = await supabase.from('usage_logs').insert({
            user_id: userId,
            device_id: deviceId,
            energy_kwh: energy,
            cost: cost,
            timestamp: timestamp.toISOString(),
        });

        if (error) throw error;
    },

    /**
     * Backfill historical data for the last 30 days based on current devices
     * This is a "One-Time" or "Demo" action.
     */
    async generateHistoricalData(userId: string, devices: Device[], electricityRate?: number) {
        console.log("Generating historical data...");

        // DELETE RECENT data (last 30 days) to allow regeneration/overwriting
        const thirtyDaysAgo = subDays(new Date(), 30);
        const { error: deleteError } = await supabase
            .from('usage_logs')
            .delete()
            .eq('user_id', userId)
            .gte('timestamp', thirtyDaysAgo.toISOString());

        if (deleteError) {
            console.error("Error clearing old data:", deleteError);
            // We can choose to throw or proceed, but proceeding might double-count. 
            // Throwing is safer.
            throw deleteError;
        }

        console.log("Cleared recent data. Generating new...");

        const logs = [];
        const now = new Date();

        // Use provided devices or fallback to virtual devices for testing
        let targetDevices = devices;
        if (!targetDevices || targetDevices.length === 0) {
            console.log("No devices found, using Virtual Home devices for simulation.");
            targetDevices = [
                { id: 'virtual-fridge', name: 'Virtual Fridge', type: 'fridge', powerRating: 150, dailyUsageHours: 24, isOn: true },
                { id: 'virtual-ac', name: 'Virtual AC', type: 'ac', powerRating: 1500, dailyUsageHours: 6, isOn: true },
                { id: 'virtual-tv', name: 'Virtual TV', type: 'tv', powerRating: 200, dailyUsageHours: 4, isOn: false },
                { id: 'virtual-lights', name: 'Virtual Lights', type: 'light', powerRating: 60, dailyUsageHours: 8, isOn: true }
            ] as Device[]; // Cast to Device[] to satisfy type if needed, though structure matches
        }

        // Use provided rate or fallback to default
        const rateToUse = electricityRate || ELECTRICITY_RATE;

        for (let i = 0; i < 30; i++) {
            const date = subDays(now, i);

            // Add some randomness to make the chart look real
            const randomFactor = 0.8 + Math.random() * 0.4; // 0.8 to 1.2

            for (const device of targetDevices) {
                // approximate daily usage
                const dailyEnergy = calculateDailyEnergy(device) * randomFactor;
                const dailyCost = calculateDailyCost(device, rateToUse) * randomFactor;

                // If it's a virtual device, we use a null device_id or handled gracefully by DB?
                // The DB might require a valid device ID if foreign key exists. 
                // However, the original code allowed null or random IDs. 
                // Let's check Schema... "device_id uuid references devices" usually implies it must exist or be null.
                // Safest to use NULL for virtual devices if they aren't in DB.
                const deviceId = device.id.startsWith('virtual-') ? null : device.id;

                logs.push({
                    user_id: userId,
                    device_id: deviceId,
                    energy_kwh: dailyEnergy,
                    cost: dailyCost,
                    timestamp: date.toISOString(),
                });
            }
        }

        // Insert in batches
        const { error } = await supabase.from('usage_logs').insert(logs);

        if (error) {
            console.error("Error generating history:", error);
            throw error;
        }

        return true;
    }
};
