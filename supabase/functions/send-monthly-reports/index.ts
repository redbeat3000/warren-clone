import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting monthly reports generation");

    // Get current month data
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const monthName = now.toLocaleDateString('en', { month: 'long', year: 'numeric' });

    // Get monthly statistics
    const firstDayOfMonth = new Date(currentYear, currentMonth - 1, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth, 0);

    const startDate = firstDayOfMonth.toISOString().split('T')[0];
    const endDate = lastDayOfMonth.toISOString().split('T')[0];

    // Get contributions for the month
    const { data: contributions, error: contributionsError } = await supabase
      .from('contributions')
      .select('amount')
      .gte('contribution_date', startDate)
      .lte('contribution_date', endDate);

    if (contributionsError) {
      console.error("Error fetching contributions:", contributionsError);
      throw contributionsError;
    }

    const totalContributions = contributions?.reduce((sum, c) => sum + parseFloat(c.amount || '0'), 0) || 0;
    const contributionCount = contributions?.length || 0;

    // Get loans for the month
    const { data: loans, error: loansError } = await supabase
      .from('loans')
      .select('principal, status')
      .gte('issue_date', startDate)
      .lte('issue_date', endDate);

    if (loansError) {
      console.error("Error fetching loans:", loansError);
      throw loansError;
    }

    const totalLoansIssued = loans?.reduce((sum, l) => sum + parseFloat(l.principal || '0'), 0) || 0;
    const loansCount = loans?.length || 0;

    // Get expenses for the month
    const { data: expenses, error: expensesError } = await supabase
      .from('expenses')
      .select('amount')
      .gte('expense_date', startDate)
      .lte('expense_date', endDate);

    if (expensesError) {
      console.error("Error fetching expenses:", expensesError);
      throw expensesError;
    }

    const totalExpenses = expenses?.reduce((sum, e) => sum + parseFloat(e.amount || '0'), 0) || 0;
    const expensesCount = expenses?.length || 0;

    // Get all active members
    const { data: members, error: membersError } = await supabase
      .from('users')
      .select('email, first_name, last_name')
      .eq('status', 'active')
      .not('email', 'is', null);

    if (membersError) {
      console.error("Error fetching members:", membersError);
      throw membersError;
    }

    if (!members || members.length === 0) {
      return new Response(
        JSON.stringify({ message: "No active members found to send reports to" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    let totalSent = 0;

    // Send monthly report to each member
    const emailPromises = members.map(async (member) => {
      try {
        const emailResponse = await resend.emails.send({
          from: "Chama Management <onboarding@resend.dev>",
          to: [member.email],
          subject: `Monthly Financial Report - ${monthName}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">
                Monthly Financial Report - ${monthName}
              </h2>
              
              <p>Dear ${member.first_name} ${member.last_name},</p>
              
              <p>Here is your monthly financial summary for ${monthName}:</p>
              
              <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #2563eb; margin-top: 0;">Financial Summary</h3>
                
                <div style="display: grid; gap: 15px;">
                  <div style="background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #22c55e;">
                    <h4 style="margin: 0; color: #22c55e;">Contributions</h4>
                    <p style="margin: 5px 0 0 0; font-size: 18px; font-weight: bold;">
                      KES ${totalContributions.toLocaleString()}
                    </p>
                    <p style="margin: 0; color: #6b7280; font-size: 14px;">
                      ${contributionCount} contribution${contributionCount !== 1 ? 's' : ''}
                    </p>
                  </div>
                  
                  <div style="background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #3b82f6;">
                    <h4 style="margin: 0; color: #3b82f6;">Loans Issued</h4>
                    <p style="margin: 5px 0 0 0; font-size: 18px; font-weight: bold;">
                      KES ${totalLoansIssued.toLocaleString()}
                    </p>
                    <p style="margin: 0; color: #6b7280; font-size: 14px;">
                      ${loansCount} loan${loansCount !== 1 ? 's' : ''}
                    </p>
                  </div>
                  
                  <div style="background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #ef4444;">
                    <h4 style="margin: 0; color: #ef4444;">Expenses</h4>
                    <p style="margin: 5px 0 0 0; font-size: 18px; font-weight: bold;">
                      KES ${totalExpenses.toLocaleString()}
                    </p>
                    <p style="margin: 0; color: #6b7280; font-size: 14px;">
                      ${expensesCount} expense${expensesCount !== 1 ? 's' : ''}
                    </p>
                  </div>
                  
                  <div style="background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #8b5cf6;">
                    <h4 style="margin: 0; color: #8b5cf6;">Net Position</h4>
                    <p style="margin: 5px 0 0 0; font-size: 18px; font-weight: bold;">
                      KES ${(totalContributions - totalExpenses).toLocaleString()}
                    </p>
                    <p style="margin: 0; color: #6b7280; font-size: 14px;">
                      Contributions minus expenses
                    </p>
                  </div>
                </div>
              </div>
              
              <div style="background-color: #eff6ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h4 style="color: #2563eb; margin-top: 0;">Key Highlights</h4>
                <ul style="margin: 0; padding-left: 20px;">
                  <li>Total members contributed this month: ${contributionCount}</li>
                  <li>Average contribution: KES ${contributionCount > 0 ? Math.round(totalContributions / contributionCount).toLocaleString() : '0'}</li>
                  <li>New loans disbursed: ${loansCount}</li>
                  <li>Operating expenses: KES ${totalExpenses.toLocaleString()}</li>
                </ul>
              </div>
              
              <p>Thank you for being an active member of our Chama. If you have any questions about this report, please don't hesitate to contact the management team.</p>
              
              <p style="border-top: 1px solid #e5e7eb; padding-top: 15px; margin-top: 30px; color: #6b7280; font-size: 14px;">
                This report was generated automatically on ${new Date().toLocaleDateString()}.<br>
                Best regards,<br>
                Chama Management Team
              </p>
            </div>
          `,
        });

        console.log(`Monthly report sent to ${member.email}:`, emailResponse);
        return { success: true, email: member.email };
      } catch (error: any) {
        console.error(`Failed to send report to ${member.email}:`, error);
        return { success: false, email: member.email, error: error.message };
      }
    });

    const results = await Promise.all(emailPromises);
    totalSent = results.filter(r => r.success).length;

    console.log(`Monthly reports: ${totalSent}/${members.length} emails sent`);

    // Log the activity
    const { error: logError } = await supabase
      .from('audit_logs')
      .insert({
        action: 'monthly_reports_sent',
        meta: {
          month: monthName,
          total_contributions: totalContributions,
          total_loans: totalLoansIssued,
          total_expenses: totalExpenses,
          emails_sent: totalSent,
          members_count: members.length
        }
      });

    if (logError) {
      console.error("Error logging activity:", logError);
    }

    return new Response(
      JSON.stringify({ 
        message: `Monthly reports sent successfully for ${monthName}`,
        emails_sent: totalSent,
        members_notified: members.length,
        report_data: {
          total_contributions: totalContributions,
          total_loans: totalLoansIssued,
          total_expenses: totalExpenses,
          net_position: totalContributions - totalExpenses
        }
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      }
    );

  } catch (error: any) {
    console.error("Error in send-monthly-reports function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      }
    );
  }
};

serve(handler);