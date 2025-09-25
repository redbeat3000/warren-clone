import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Automation engine that runs in the background
export function useAutomationEngine() {
  const { toast } = useToast();

  useEffect(() => {
    // Check for automated tasks every minute
    const interval = setInterval(async () => {
      await runAutomatedTasks();
    }, 60000); // 1 minute

    // Run once on mount
    runAutomatedTasks();

    return () => clearInterval(interval);
  }, []);

  const runAutomatedTasks = async () => {
    try {
      // Check settings to see what automations are enabled
      const { data: settings } = await supabase
        .from('settings')
        .select('key, value')
        .in('key', [
          'contribution_reminders',
          'loan_payment_reminders', 
          'meeting_reminders',
          'overdue_alerts',
          'monthly_statements'
        ]);

      const settingsMap = settings?.reduce((acc: any, setting) => {
        acc[setting.key] = setting.value === 'true' || setting.value === true;
        return acc;
      }, {}) || {};

      // Run enabled automations
      if (settingsMap.contribution_reminders) {
        await checkContributionReminders();
      }

      if (settingsMap.loan_payment_reminders) {
        await checkLoanPaymentReminders();
      }

      if (settingsMap.meeting_reminders) {
        await checkMeetingReminders();
      }

      if (settingsMap.overdue_alerts) {
        await checkOverdueAlerts();
      }

      if (settingsMap.monthly_statements) {
        await generateMonthlyStatements();
      }

    } catch (error) {
      console.error('Automation engine error:', error);
    }
  };

  const checkContributionReminders = async () => {
    // Logic to check if contribution reminders need to be sent
    // This would typically check due dates and send notifications
    console.log('Checking contribution reminders...');
  };

  const checkLoanPaymentReminders = async () => {
    // Logic to check loan payment due dates
    try {
      const { data: loans } = await supabase
        .from('loans')
        .select(`
          *,
          users!inner(first_name, last_name, phone, email)
        `)
        .eq('status', 'active');

      // Check for loans with payments due in the next 7 days
      const upcomingPayments = loans?.filter(loan => {
        const dueDate = new Date(loan.due_date);
        const sevenDaysFromNow = new Date();
        sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
        return dueDate <= sevenDaysFromNow && dueDate > new Date();
      });

      if (upcomingPayments && upcomingPayments.length > 0) {
        console.log(`Found ${upcomingPayments.length} loans with upcoming payments`);
        // Here you would send notifications
      }
    } catch (error) {
      console.error('Error checking loan payment reminders:', error);
    }
  };

  const checkMeetingReminders = async () => {
    // Logic to check upcoming meetings and send reminders
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const { data: meetings } = await supabase
        .from('meetings')
        .select('*')
        .eq('status', 'scheduled')
        .eq('meeting_date', tomorrow.toISOString().split('T')[0]);

      if (meetings && meetings.length > 0) {
        console.log(`Found ${meetings.length} meetings tomorrow`);
        // Here you would send meeting reminders
      }
    } catch (error) {
      console.error('Error checking meeting reminders:', error);
    }
  };

  const checkOverdueAlerts = async () => {
    // Logic to check for overdue payments and send alerts
    console.log('Checking overdue alerts...');
  };

  const generateMonthlyStatements = async () => {
    // Logic to generate monthly statements on the last day of the month
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Check if tomorrow is the first day of next month
    if (tomorrow.getDate() === 1) {
      console.log('Generating monthly statements...');
      // Here you would generate and send monthly statements
    }
  };

  return {
    runAutomatedTasks
  };
}