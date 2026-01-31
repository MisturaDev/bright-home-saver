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
     * Check budget status and create notification if needed.
     * Prevents duplicates by checking if a similar notification was created today.
     */
    async checkBudget(userId: string, currentCost: number, budget: number) {
        if (budget <= 0) return;

        const percentage = (currentCost / budget) * 100;
        let title = '';
        let message = '';
        let type: 'warning' | 'error' = 'warning';

        if (percentage >= 100) {
            title = 'Budget Exceeded';
            message = `You have exceeded your monthly budget of ₦${budget.toLocaleString()}.`;
            type = 'error';
        } else if (percentage >= 80) {
            title = 'Budget Alert';
            message = `You have used ${percentage.toFixed(0)}% of your monthly budget.`;
            type = 'warning';
        } else {
            return;
        }

        // Deduplication: Check if we already alerted about this today
        const startOfToday = startOfDay(new Date()).toISOString();
        const { data } = await supabase
            .from('notifications')
            .select('created_at, title')
            .eq('user_id', userId)
            .eq('title', title)
            .gte('created_at', startOfToday);

        if (data && data.length > 0) {
            // Already notified today
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

            // Deduplication
            const startOfToday = startOfDay(new Date()).toISOString();
            const { data } = await supabase
                .from('notifications')
                .select('created_at, title')
                .eq('user_id', userId)
                .eq('title', title)
                .gte('created_at', startOfToday);

            if (data && data.length > 0) {
                return;
            }

            await this.createNotification(userId, title, message, 'warning');
        }
    }
};
