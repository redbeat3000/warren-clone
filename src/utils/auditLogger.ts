import { supabase } from '@/integrations/supabase/client';

interface AuditLogData {
  action: string;
  meta?: Record<string, any>;
  actor_id?: string;
}

export const auditLogger = {
  // Log authentication events
  async logAuth(action: 'login' | 'logout' | 'signup', email?: string, meta?: Record<string, any>) {
    try {
      // Get current user ID if available
      const { data: { user } } = await supabase.auth.getUser();
      let userId = null;
      
      if (user) {
        const { data: userProfile } = await supabase
          .from('users')
          .select('id')
          .eq('auth_uid', user.id)
          .single();
        userId = userProfile?.id;
      }

      await supabase.from('audit_logs').insert({
        action: `auth_${action}`,
        actor_id: userId,
        meta: {
          email,
          timestamp: new Date().toISOString(),
          user_agent: navigator.userAgent,
          ip_address: 'client', // Client-side logging
          ...meta
        }
      });
    } catch (error) {
      console.error('Error logging auth event:', error);
    }
  },

  // Log data changes (CRUD operations)
  async logDataChange(
    action: 'create' | 'update' | 'delete', 
    table: string, 
    recordId?: string | number,
    changes?: Record<string, any>,
    oldValues?: Record<string, any>
  ) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      let userId = null;
      
      if (user) {
        const { data: userProfile } = await supabase
          .from('users')
          .select('id')
          .eq('auth_uid', user.id)
          .single();
        userId = userProfile?.id;
      }

      await supabase.from('audit_logs').insert({
        action: `${table}_${action}`,
        actor_id: userId,
        meta: {
          table,
          record_id: recordId,
          changes,
          old_values: oldValues,
          timestamp: new Date().toISOString(),
          ...changes
        }
      });
    } catch (error) {
      console.error('Error logging data change:', error);
    }
  },

  // Log system events
  async logSystemEvent(action: string, meta?: Record<string, any>) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      let userId = null;
      
      if (user) {
        const { data: userProfile } = await supabase
          .from('users')
          .select('id')
          .eq('auth_uid', user.id)
          .single();
        userId = userProfile?.id;
      }

      await supabase.from('audit_logs').insert({
        action: `system_${action}`,
        actor_id: userId,
        meta: {
          timestamp: new Date().toISOString(),
          ...meta
        }
      });
    } catch (error) {
      console.error('Error logging system event:', error);
    }
  }
};