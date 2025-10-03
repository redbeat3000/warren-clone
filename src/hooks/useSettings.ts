import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

export interface MemberManagementSettings {
  memberApprovalRequired: boolean;
  autoAssignMemberNumbers: boolean;
  memberNumberPrefix: string;
  maximumMembers: number;
}

export function useSettings() {
  const [settings, setSettings] = useState<MemberManagementSettings>({
    memberApprovalRequired: true,
    autoAssignMemberNumbers: true,
    memberNumberPrefix: 'CH',
    maximumMembers: 50
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('settings')
        .select('key, value')
        .in('key', [
          'member_approval_required',
          'auto_assign_member_numbers', 
          'member_number_prefix',
          'maximum_members'
        ]);

      if (error) {
        console.warn('Settings table error:', error);
        // Use default settings if table doesn't exist or has no data
        return;
      }

      if (!data || data.length === 0) {
        console.warn('No settings found in database, using defaults');
        return;
      }

      const settingsMap = data.reduce((acc: any, setting) => {
        acc[setting.key] = setting.value;
        return acc;
      }, {});

      setSettings({
        memberApprovalRequired: settingsMap?.member_approval_required === 'true' || settingsMap?.member_approval_required === true,
        autoAssignMemberNumbers: settingsMap?.auto_assign_member_numbers === 'true' || settingsMap?.auto_assign_member_numbers === true,
        memberNumberPrefix: JSON.parse(settingsMap?.member_number_prefix || '"CH"'),
        maximumMembers: parseInt(settingsMap?.maximum_members || '50')
      });
    } catch (error) {
      console.error('Error fetching settings:', error);
      // Don't show error toast, just use default settings
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (key: string, value: any) => {
    try {
      const { error } = await supabase
        .from('settings')
        .update({ 
          value: typeof value === 'string' ? value : JSON.stringify(value),
          updated_at: new Date().toISOString()
        })
        .eq('key', key);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Setting updated successfully'
      });
      
      // Refresh settings
      await fetchSettings();
    } catch (error) {
      console.error('Error updating setting:', error);
      toast({
        title: 'Error',
        description: 'Failed to update setting',
        variant: 'destructive'
      });
    }
  };

  const saveSettings = async (newSettings: MemberManagementSettings) => {
    try {
      setLoading(true);
      
      const updates = [
        { key: 'member_approval_required', value: newSettings.memberApprovalRequired.toString() },
        { key: 'auto_assign_member_numbers', value: newSettings.autoAssignMemberNumbers.toString() },
        { key: 'member_number_prefix', value: JSON.stringify(newSettings.memberNumberPrefix) },
        { key: 'maximum_members', value: newSettings.maximumMembers.toString() }
      ];

      for (const update of updates) {
        const { error } = await supabase
          .from('settings')
          .update({ 
            value: update.value,
            updated_at: new Date().toISOString()
          })
          .eq('key', update.key);

        if (error) throw error;
      }

      setSettings(newSettings);
      toast({
        title: 'Success',
        description: 'All settings saved successfully'
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to save settings',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return {
    settings,
    loading,
    updateSetting,
    saveSettings,
    refetch: fetchSettings
  };
}