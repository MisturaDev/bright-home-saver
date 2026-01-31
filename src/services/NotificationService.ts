import { supabase } from '@/lib/supabase';
import { Notification } from '@/lib/energy-data';
import { startOfDay, isSameDay } from 'date-fns';

export const NotificationService = {

    async getNotifications(userId: string): Promise<Notification[]> {
        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) {
            console.error('Error fetching notifications:', error);
            return [];
        }

        return data.map(n => ({
            id: n.id,
            title: n.title,
            message: n.message,
            type: n.type,
            timestamp: new Date(n.created_at),
            read: n.read,
        }));
    },

    async markAsRead(notificationId: string): Promise<boolean> {
        const { error } = await supabase
            .from('notifications')
            .update({ read: true })
            .eq('id', notificationId);

        if (error) {
            console.error('Error marking notification as read:', error);
            return false;
        }
        return true;
    },

    async createNotification(userId: string, title: string, message: string, type: 'warning' | 'info' | 'success' | 'error') {
        const { error } = await supabase
            .from('notifications')
            .insert({
                user_id: userId,
                title,
                message,
                type,
            });

        if (error) {
            console.error('Error creating notification:', error);
        }
    },

    /**
   * Helper to check if a notification of a specific title was sent recently.
   * If message is provided, it checks if the MOST RECENT notification has the same message.
   * If the message is different, it returns false (allow new notification).
   */
    async hasRecentNotification(userId: string, title: string, windowHours: number, matchMessage?: string): Promise<boolean> {
        const timeThreshold = new Date();
        timeThreshold.setHours(timeThreshold.getHours() - windowHours);

        const { data } = await supabase
            .from('notifications')
            .select('created_at, message')
            .eq('user_id', userId)
            .eq('title', title)
            .gte('created_at', timeThreshold.toISOString())
            .order('created_at', { ascending: false })
            .limit(1);

        if (data && data.length > 0) {
            if (matchMessage) {
                // If we want to check ensuring the message is the same (scrict dedupe)
                // If message is DIFFERENT, return false (don't debounce, treat as new)
                return data[0].message === matchMessage;
            }
            return true;
        }
        return false;
    },

    /**
     * Check budget status and create notification if needed.
     * Prevents duplicates with time windows, but allows if the budget status (message) changed.
     */
    async checkBudget(userId: string, currentCost: number, budget: number) {
        if (budget <= 0) return;

        const percentage = (currentCost / budget) * 100;
        let title = '';
        let message = '';
        let type: 'warning' | 'error' = 'warning';
        let windowHours = 24; // Default large window

        if (percentage >= 100) {
            title = 'Budget Exceeded';
            message = `You have exceeded your monthly budget of ₦${budget.toLocaleString()}.`;
            type = 'error';
            windowHours = 1; // Critical: Remind every hour if still true
        } else if (percentage >= 80) {
            title = 'Budget Alert';
            message = `You have used ${percentage.toFixed(0)}% of your monthly budget.`;
            type = 'warning';
            windowHours = 6; // Warning: Remind every 6 hours
        } else {
            return;
        }

        // Pass the message to be checked. If the previous alert had a different budget value,
        // this will return false, allowing the new alert to go through immediately.
        if (await this.hasRecentNotification(userId, title, windowHours, message)) {
            return;
        }

        await this.createNotification(userId, title, message, type);
    },

    /**
     * Check for unusual high usage compared to limit or history
     */
    async checkUsageHigh(userId: string, currentUsageKWh: number, thresholdKWh: number = 20) {
        if (currentUsageKWh > thresholdKWh) {
            const title = 'High Energy Usage';
            const message = `Your energy usage today (${currentUsageKWh.toFixed(1)} kWh) is higher than usual.`;

            // Remind every 3 hours if usage is still high (it likely will be for the rest of the day)
            // or if it keeps increasing, we might want to be smarter, but simple time window is good for now.
            if (await this.hasRecentNotification(userId, title, 3)) {
                return;
            }

            await this.createNotification(userId, title, message, 'warning');
        }
    }
};
