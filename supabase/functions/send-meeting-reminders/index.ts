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

    // Send reminders for each meeting
    for (const meeting of meetings) {
      console.log(`Processing meeting: ${meeting.title}`);
      
      const meetingDate = new Date(meeting.meeting_date);
      const meetingTime = meeting.meeting_time || '14:00';
      
      const emailPromises = members.map(async (member) => {
        try {
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

          console.log(`Email sent to ${member.email}:`, emailResponse);
          return { success: true, email: member.email };
        } catch (error: any) {
          console.error(`Failed to send email to ${member.email}:`, error);
          return { success: false, email: member.email, error: error.message };
        }
      });

      const results = await Promise.all(emailPromises);
      const successCount = results.filter(r => r.success).length;
      totalSent += successCount;
      
      console.log(`Meeting "${meeting.title}": ${successCount}/${members.length} emails sent`);
    }

    // Log the activity
    const { error: logError } = await supabase
      .from('audit_logs')
      .insert({
        action: 'meeting_reminders_sent',
        meta: {
          meetings_count: meetings.length,
          emails_sent: totalSent,
          members_count: members.length
        }
      });

    if (logError) {
      console.error("Error logging activity:", logError);
    }

    return new Response(
      JSON.stringify({ 
        message: `Meeting reminders sent successfully`,
        meetings_processed: meetings.length,
        emails_sent: totalSent,
        members_notified: members.length
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