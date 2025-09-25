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
    console.log("Starting meeting reminders process");

    // Get upcoming meetings (next 7 days)
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    const { data: meetings, error: meetingsError } = await supabase
      .from('meetings')
      .select('*')
      .eq('status', 'scheduled')
      .gte('meeting_date', new Date().toISOString().split('T')[0])
      .lte('meeting_date', nextWeek.toISOString().split('T')[0]);

    if (meetingsError) {
      console.error("Error fetching meetings:", meetingsError);
      throw meetingsError;
    }

    if (!meetings || meetings.length === 0) {
      console.log("No upcoming meetings found");
      return new Response(
        JSON.stringify({ message: "No upcoming meetings to send reminders for" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

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

    let totalSent = 0;
    const allResults = [];

    // Send reminders for each meeting
    for (const meeting of meetings) {
      console.log(`Processing meeting: ${meeting.title}`);
      
      const meetingDate = new Date(meeting.meeting_date);
      const meetingTime = meeting.meeting_time || '14:00';
      
      // Send emails sequentially to respect rate limits (max 2 per second)
      for (let i = 0; i < members.length; i++) {
        const member = members[i];
        try {
          console.log(`Sending meeting reminder to ${member.email} (${i + 1}/${members.length}) for "${meeting.title}"`);
          
          const emailResponse = await resend.emails.send({
            from: "Chama Management <onboarding@resend.dev>",
            to: [member.email],
            subject: `Reminder: ${meeting.title}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">Meeting Reminder</h2>
                <p>Dear ${member.first_name} ${member.last_name},</p>
                
                <p>This is a reminder about the upcoming meeting:</p>
                
                <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <h3 style="margin-top: 0; color: #2563eb;">${meeting.title}</h3>
                  <p><strong>Date:</strong> ${meetingDate.toLocaleDateString()}</p>
                  <p><strong>Time:</strong> ${meetingTime}</p>
                  <p><strong>Venue:</strong> ${meeting.venue}</p>
                  ${meeting.description ? `<p><strong>Description:</strong> ${meeting.description}</p>` : ''}
                  ${meeting.agenda ? `<p><strong>Agenda:</strong> ${meeting.agenda}</p>` : ''}
                </div>
                
                <p>Please make sure to attend on time. Your participation is important for the success of our Chama.</p>
                
                <p>Best regards,<br>Chama Management Team</p>
              </div>
            `,
          });

          console.log(`✅ Meeting reminder sent successfully to ${member.email}`);
          allResults.push({ success: true, email: member.email, meeting: meeting.title });
          totalSent++;
          
        } catch (error: any) {
          console.error(`❌ Failed to send reminder to ${member.email}:`, error);
          allResults.push({ 
            success: false, 
            email: member.email, 
            meeting: meeting.title,
            error: error.message,
            statusCode: error.statusCode || 'unknown'
          });
        }
        
        // Add delay to respect rate limits (600ms = max 2 requests per second)
        if (i < members.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 600));
        }
      }
      
      const meetingSuccessCount = allResults.filter(r => r.success && r.meeting === meeting.title).length;
      console.log(`Meeting "${meeting.title}": ${meetingSuccessCount}/${members.length} emails sent successfully`);
    }

    // Count failed emails and their reasons
    const failedResults = allResults.filter(r => !r.success);
    if (failedResults.length > 0) {
      console.log("Failed meeting reminder details:");
      failedResults.forEach(result => {
        console.log(`- ${result.email} (${result.meeting}): ${result.error} (Status: ${result.statusCode})`);
      });
    }

    // Log the activity
    const { error: logError } = await supabase
      .from('audit_logs')
      .insert({
        action: 'meeting_reminders_sent',
        meta: {
          meetings_count: meetings.length,
          emails_sent: totalSent,
          emails_failed: failedResults.length,
          members_count: members.length,
          failed_emails: failedResults.map(r => ({ email: r.email, meeting: r.meeting, error: r.error }))
        }
      });

    if (logError) {
      console.error("Error logging activity:", logError);
    }

    return new Response(
      JSON.stringify({ 
        message: totalSent === (meetings.length * members.length) 
          ? `Meeting reminders sent successfully to all members` 
          : `Meeting reminders sent: ${totalSent} successful, ${failedResults.length} failed`,
        meetings_processed: meetings.length,
        emails_sent: totalSent,
        emails_failed: failedResults.length,
        members_notified: members.length,
        failed_details: failedResults.length > 0 ? failedResults : undefined
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      }
    );

  } catch (error: any) {
    console.error("Error in send-meeting-reminders function:", error);
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