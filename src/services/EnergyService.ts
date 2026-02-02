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
    async generateHistoricalData(userId: string, devices: Device[]) {
        console.log("Generating historical data...");

        // Check if data already exists to avoid double-seeding
        const { count } = await supabase
            .from('usage_logs')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId);

        if (count && count > 0) {
            console.log("Data already exists, skipping generation.");
            return false;
        }

        const logs = [];
        const now = new Date();

        for (let i = 0; i < 30; i++) {
            const date = subDays(now, i);

            // Add some randomness to make the chart look real
            const randomFactor = 0.8 + Math.random() * 0.4; // 0.8 to 1.2

            for (const device of devices) {
                // approximate daily usage
                const dailyEnergy = calculateDailyEnergy(device) * randomFactor;
                const dailyCost = calculateDailyCost(device) * randomFactor;

                logs.push({
                    user_id: userId,
                    device_id: device.id, // Ensure this matches a real device ID if possible, or null
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
