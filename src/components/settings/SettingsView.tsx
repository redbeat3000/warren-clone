import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Cog6ToothIcon,
  BellIcon,
  ShieldCheckIcon,
  CurrencyDollarIcon,
  UsersIcon,
  DocumentTextIcon,
  DevicePhoneMobileIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { useSettings, MemberManagementSettings } from '@/hooks/useSettings';

export default function SettingsView() {
  const [activeTab, setActiveTab] = useState('general');
  const { settings, loading, saveSettings } = useSettings();
  const [localSettings, setLocalSettings] = useState<MemberManagementSettings>(settings);

  // Update local settings when settings change
  React.useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const settingsTabs = [
    { id: 'general', name: 'General', icon: Cog6ToothIcon },
    { id: 'financial', name: 'Financial', icon: CurrencyDollarIcon },
    { id: 'members', name: 'Members', icon: UsersIcon },
    { id: 'notifications', name: 'Notifications', icon: BellIcon },
    { id: 'security', name: 'Security', icon: ShieldCheckIcon }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-1">Manage your Chama settings and preferences</p>
        </div>
      </motion.div>

      {/* Settings Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Navigation */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-1"
        >
          <div className="card-elevated p-4">
            <nav className="space-y-2">
              {settingsTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-primary text-primary-foreground'
                      : 'text-foreground hover:bg-muted'
                  }`}
                >
                  <tab.icon className="h-5 w-5" />
                  <span>{tab.name}</span>
                </button>
              ))}
            </nav>
          </div>
        </motion.div>

        {/* Settings Content */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-3"
        >
          <div className="card-elevated p-6">
            {activeTab === 'general' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-4">General Settings</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Chama Name</label>
                      <input
                        type="text"
                        defaultValue="Harambee Investment Group"
                        className="w-full px-4 py-2 border border-input-border rounded-lg bg-input focus:outline-none focus:ring-2 focus:ring-accent-border"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Registration Number</label>
                      <input
                        type="text"
                        defaultValue="CHA/2023/001"
                        className="w-full px-4 py-2 border border-input-border rounded-lg bg-input focus:outline-none focus:ring-2 focus:ring-accent-border"
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Meeting Day</label>
                        <select className="w-full px-4 py-2 border border-input-border rounded-lg bg-input focus:outline-none focus:ring-2 focus:ring-accent-border">
                          <option>First Saturday</option>
                          <option>Second Saturday</option>
                          <option>Third Saturday</option>
                          <option>Last Saturday</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Meeting Time</label>
                        <input
                          type="time"
                          defaultValue="14:00"
                          className="w-full px-4 py-2 border border-input-border rounded-lg bg-input focus:outline-none focus:ring-2 focus:ring-accent-border"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Meeting Venue</label>
                      <input
                        type="text"
                        defaultValue="Community Hall, Westlands"
                        className="w-full px-4 py-2 border border-input-border rounded-lg bg-input focus:outline-none focus:ring-2 focus:ring-accent-border"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'financial' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-4">Financial Settings</h3>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Monthly Contribution Amount</label>
                        <input
                          type="number"
                          defaultValue="5000"
                          className="w-full px-4 py-2 border border-input-border rounded-lg bg-input focus:outline-none focus:ring-2 focus:ring-accent-border"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Registration Fee</label>
                        <input
                          type="number"
                          defaultValue="1000"
                          className="w-full px-4 py-2 border border-input-border rounded-lg bg-input focus:outline-none focus:ring-2 focus:ring-accent-border"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Default Interest Rate (%)</label>
                        <input
                          type="number"
                          step="0.1"
                          defaultValue="10"
                          className="w-full px-4 py-2 border border-input-border rounded-lg bg-input focus:outline-none focus:ring-2 focus:ring-accent-border"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Late Payment Penalty</label>
                        <input
                          type="number"
                          defaultValue="500"
                          className="w-full px-4 py-2 border border-input-border rounded-lg bg-input focus:outline-none focus:ring-2 focus:ring-accent-border"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Currency</label>
                      <select className="w-full px-4 py-2 border border-input-border rounded-lg bg-input focus:outline-none focus:ring-2 focus:ring-accent-border">
                        <option>KES - Kenyan Shilling</option>
                        <option>USD - US Dollar</option>
                        <option>EUR - Euro</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'members' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-4">Member Management</h3>
                  
                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                      <div>
                        <h4 className="font-medium text-foreground">Require Approval for New Members</h4>
                        <p className="text-sm text-muted-foreground">New member applications need chairman approval</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={localSettings.memberApprovalRequired}
                          onChange={(e) => setLocalSettings(prev => ({ ...prev, memberApprovalRequired: e.target.checked }))}
                          className="sr-only peer" 
                        />
                        <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                      </label>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                      <div>
                        <h4 className="font-medium text-foreground">Auto-assign Member Numbers</h4>
                        <p className="text-sm text-muted-foreground">Automatically generate sequential member numbers</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={localSettings.autoAssignMemberNumbers}
                          onChange={(e) => setLocalSettings(prev => ({ ...prev, autoAssignMemberNumbers: e.target.checked }))}
                          className="sr-only peer" 
                        />
                        <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                      </label>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Member Number Prefix</label>
                      <input
                        type="text"
                        value={localSettings.memberNumberPrefix}
                        onChange={(e) => setLocalSettings(prev => ({ ...prev, memberNumberPrefix: e.target.value }))}
                        className="w-full px-4 py-2 border border-input-border rounded-lg bg-input focus:outline-none focus:ring-2 focus:ring-accent-border"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Maximum Members</label>
                      <input
                        type="number"
                        value={localSettings.maximumMembers}
                        onChange={(e) => setLocalSettings(prev => ({ ...prev, maximumMembers: parseInt(e.target.value) || 50 }))}
                        className="w-full px-4 py-2 border border-input-border rounded-lg bg-input focus:outline-none focus:ring-2 focus:ring-accent-border"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-4">Notification Settings</h3>
                  
                  <div className="space-y-4">
                    {[
                      { name: 'Meeting Reminders', desc: 'Send reminders 24 hours before meetings' },
                      { name: 'Contribution Due Alerts', desc: 'Notify members when contributions are due' },
                      { name: 'Loan Payment Reminders', desc: 'Send loan repayment reminders' },
                      { name: 'Fine Notifications', desc: 'Alert members about fines and penalties' },
                      { name: 'Dividend Announcements', desc: 'Notify members about dividend distributions' }
                    ].map((notification, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                        <div>
                          <h4 className="font-medium text-foreground">{notification.name}</h4>
                          <p className="text-sm text-muted-foreground">{notification.desc}</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" defaultChecked className="sr-only peer" />
                          <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-4">Security & Privacy</h3>
                  
                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                      <div>
                        <h4 className="font-medium text-foreground">Two-Factor Authentication</h4>
                        <p className="text-sm text-muted-foreground">Add extra security to your account</p>
                      </div>
                      <button className="btn-primary text-sm">Enable 2FA</button>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                      <div>
                        <h4 className="font-medium text-foreground">Session Timeout</h4>
                        <p className="text-sm text-muted-foreground">Auto-logout after inactivity</p>
                      </div>
                      <select className="px-3 py-1 border border-input-border rounded bg-input text-sm">
                        <option>30 minutes</option>
                        <option>1 hour</option>
                        <option>2 hours</option>
                        <option>Never</option>
                      </select>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                      <div>
                        <h4 className="font-medium text-foreground">Data Backup</h4>
                        <p className="text-sm text-muted-foreground">Automatically backup data weekly</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" defaultChecked className="sr-only peer" />
                        <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                      </label>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-foreground mb-2">Change Password</h4>
                      <div className="grid grid-cols-1 gap-4">
                        <input
                          type="password"
                          placeholder="Current Password"
                          className="w-full px-4 py-2 border border-input-border rounded-lg bg-input focus:outline-none focus:ring-2 focus:ring-accent-border"
                        />
                        <input
                          type="password"
                          placeholder="New Password"
                          className="w-full px-4 py-2 border border-input-border rounded-lg bg-input focus:outline-none focus:ring-2 focus:ring-accent-border"
                        />
                        <input
                          type="password"
                          placeholder="Confirm New Password"
                          className="w-full px-4 py-2 border border-input-border rounded-lg bg-input focus:outline-none focus:ring-2 focus:ring-accent-border"
                        />
                        <button className="btn-primary w-fit">Update Password</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Save Button */}
            <div className="mt-8 flex justify-end">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="btn-primary"
                onClick={() => saveSettings(localSettings)}
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}