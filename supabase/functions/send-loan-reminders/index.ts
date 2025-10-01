import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Checking for loans requiring reminders...');

    // Get current date and dates for checking
    const today = new Date();
    const oneWeekFromNow = new Date(today);
    oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7);

    // Fetch active loans with due dates
    const { data: loans, error: loansError } = await supabase
      .from('loans')
      .select(`
        *,
        users!inner(id, first_name, last_name, email, phone),
        loan_repayments(amount)
      `)
      .eq('status', 'active')
      .not('due_date', 'is', null);

    if (loansError) {
      console.error('Error fetching loans:', loansError);
      throw loansError;
    }

    console.log(`Found ${loans?.length || 0} active loans`);

    const loansNeedingReminders = [];

    for (const loan of loans || []) {
      const dueDate = new Date(loan.due_date);
      const daysDiff = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      // Calculate outstanding balance
      const totalRepayments = loan.loan_repayments?.reduce(
        (sum: number, r: any) => sum + parseFloat(r.amount),
        0
      ) || 0;
      const principal = parseFloat(loan.principal);
      const interestRate = parseFloat(loan.interest_rate);
      const termMonths = loan.term_months;

      let totalInterest = 0;
      if (loan.interest_type === 'flat') {
        totalInterest = (principal * interestRate * termMonths) / (100 * 12);
      } else {
        const monthlyRate = interestRate / 100 / 12;
        const totalPayment = principal * (monthlyRate * Math.pow(1 + monthlyRate, termMonths)) / 
                           (Math.pow(1 + monthlyRate, termMonths) - 1);
        totalInterest = (totalPayment * termMonths) - principal;
      }

      const totalAmount = principal + totalInterest;
      const outstandingBalance = totalAmount - totalRepayments;

      // Send reminder if 7 days before due date or on due date
      if ((daysDiff === 7 || daysDiff === 0) && outstandingBalance > 0) {
        loansNeedingReminders.push({
          loan,
          daysDiff,
          outstandingBalance
        });
      }
    }

    console.log(`${loansNeedingReminders.length} loans need reminders`);

    // Send notifications (you can implement email/SMS/WhatsApp here)
    for (const { loan, daysDiff, outstandingBalance } of loansNeedingReminders) {
      const messageContent = daysDiff === 7
        ? `Reminder: Your loan payment of KES ${outstandingBalance.toLocaleString()} is due in 7 days (${new Date(loan.due_date).toLocaleDateString()}).`
        : `URGENT: Your loan payment of KES ${outstandingBalance.toLocaleString()} is due TODAY!`;

      // Log the notification (in production, send actual notification)
      console.log(`Notification to ${loan.users.first_name} ${loan.users.last_name}: ${messageContent}`);

      // Insert message record
      await supabase.from('messages').insert({
        member_id: loan.users.id,
        channel: 'sms',
        message_content: messageContent,
        status: 'sent',
        sent_at: new Date().toISOString()
      });

      // Update loan status to overdue if due date has passed
      if (daysDiff === 0) {
        await supabase
          .from('loans')
          .update({ status: 'overdue' })
          .eq('id', loan.id);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        reminders_sent: loansNeedingReminders.length 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Error in send-loan-reminders:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});