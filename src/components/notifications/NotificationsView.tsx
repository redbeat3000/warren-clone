import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BellIcon,
  DevicePhoneMobileIcon,
  EnvelopeIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';

interface Notification {
  id: string;
  type: 'reminder' | 'alert' | 'info' | 'warning';
  title: string;
  message: string;
  channel: 'email' | 'sms' | 'push' | 'system';
  recipient: string;
  status: 'sent' | 'failed' | 'pending';
  created_at: string;
  scheduled_for?: string;
}

const sampleNotifications: Notification[] = [
  {
    id: '1',
    type: 'reminder',
    title: 'Monthly Report Generation Reminder',
    message: 'End of month approaching in 3 days. Please generate monthly reports.',
    channel: 'email',
    recipient: 'Administrators',
    status: 'sent',
    created_at: '2024-02-27',
    scheduled_for: '2024-02-28'
  },
  {
    id: '2',
    type: 'reminder',
    title: 'Monthly Report Generation Reminder',
    message: 'End of month approaching in 2 days. Please generate monthly reports.',
    channel: 'push',
    recipient: 'Administrators',
    status: 'pending',
    created_at: '2024-02-28',
    scheduled_for: '2024-02-29'
  }
];

const notificationTypes = [
  { id: 'all', name: 'All Notifications' },
  { id: 'reminder', name: 'Reminders' },
  { id: 'alert', name: 'Alerts' },
  { id: 'info', name: 'Information' },
  { id: 'warning', name: 'Warnings' }
];

const automationSettings = [
  {
    id: 'report_generation_reminder',
    name: 'Monthly Report Generation Reminder',
    description: 'Remind administrators to generate monthly reports before month end',
    enabled: true,
    schedule: '2-3 days before end of month'
  }
];

export default function NotificationsView() {
  const [activeTab, setActiveTab] = useState('notifications');
  const [selectedType, setSelectedType] = useState('all');
  const [notifications] = useState<Notification[]>(sampleNotifications);
  const [settings, setSettings] = useState(automationSettings);

  const filteredNotifications = notifications.filter(notification => 
    selectedType === 'all' || notification.type === selectedType
  );

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'reminder': return ClockIcon;
      case 'alert': return ExclamationTriangleIcon;
      case 'info': return InformationCircleIcon;
      case 'warning': return XCircleIcon;
      default: return BellIcon;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email': return EnvelopeIcon;
      case 'sms': return DevicePhoneMobileIcon;
      case 'push': return BellIcon;
      default: return InformationCircleIcon;
    }
  };

  const toggleSetting = (settingId: string) => {
    setSettings(prev => 
      prev.map(setting => 
        setting.id === settingId 
          ? { ...setting, enabled: !setting.enabled }
          : setting
      )
    );
  };

  const sentCount = notifications.filter(n => n.status === 'sent').length;
  const pendingCount = notifications.filter(n => n.status === 'pending').length;
  const failedCount = notifications.filter(n => n.status === 'failed').length;
  const enabledAutomations = settings.filter(s => s.enabled).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-foreground">Notifications & Automation</h1>
          <p className="text-muted-foreground mt-1">Monthly report generation reminders</p>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card-elevated p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Sent Today</p>
              <p className="text-2xl font-bold text-foreground mt-2">{sentCount}</p>
            </div>
            <div className="h-12 w-12 bg-success/10 rounded-lg flex items-center justify-center">
              <CheckCircleIcon className="h-6 w-6 text-success" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card-elevated p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Pending</p>
              <p className="text-2xl font-bold text-foreground mt-2">{pendingCount}</p>
            </div>
            <div className="h-12 w-12 bg-warning/10 rounded-lg flex items-center justify-center">
              <ClockIcon className="h-6 w-6 text-warning" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card-elevated p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Failed</p>
              <p className="text-2xl font-bold text-foreground mt-2">{failedCount}</p>
            </div>
            <div className="h-12 w-12 bg-destructive/10 rounded-lg flex items-center justify-center">
              <XCircleIcon className="h-6 w-6 text-destructive" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card-elevated p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Automations</p>
              <p className="text-2xl font-bold text-foreground mt-2">{enabledAutomations}</p>
              <p className="text-sm text-success mt-1">Active</p>
            </div>
            <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <BellIcon className="h-6 w-6 text-primary" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="flex items-center space-x-4 border-b border-border"
      >
        <button
          onClick={() => setActiveTab('notifications')}
          className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
            activeTab === 'notifications'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Recent Notifications
        </button>
        <button
          onClick={() => setActiveTab('automation')}
          className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
            activeTab === 'automation'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Automation Settings
        </button>
      </motion.div>

      {activeTab === 'notifications' && (
        <>
          {/* Notification Type Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-wrap gap-2"
          >
            {notificationTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => setSelectedType(type.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  selectedType === type.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground hover:bg-muted'
                }`}
              >
                {type.name}
              </button>
            ))}
          </motion.div>

          {/* Notifications List */}
          <div className="space-y-4">
            {filteredNotifications.map((notification, index) => {
              const Icon = getNotificationIcon(notification.type);
              const ChannelIcon = getChannelIcon(notification.channel);
              
              return (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 + index * 0.1 }}
                  className="card-elevated p-6"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="text-sm font-medium text-foreground">{notification.title}</h4>
                          <Badge variant="outline" className={getStatusColor(notification.status)}>
                            {notification.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">{notification.message}</p>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <span className="flex items-center space-x-1">
                            <ChannelIcon className="h-4 w-4" />
                            <span className="capitalize">{notification.channel}</span>
                          </span>
                          <span>To: {notification.recipient}</span>
                          <span>{new Date(notification.created_at).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </>
      )}

      {activeTab === 'automation' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="space-y-6"
        >
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4">Automated Notifications</h3>
            <p className="text-muted-foreground mb-6">Configure automatic notifications for various Chama activities</p>
          </div>

          <div className="space-y-4">
            {settings.map((setting, index) => (
              <motion.div
                key={setting.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 + index * 0.1 }}
                className="flex items-center justify-between p-6 card-elevated"
              >
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-foreground">{setting.name}</h4>
                  <p className="text-sm text-muted-foreground mt-1">{setting.description}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Schedule: {setting.schedule}
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <Badge variant={setting.enabled ? 'default' : 'secondary'}>
                    {setting.enabled ? 'Active' : 'Inactive'}
                  </Badge>
                  <Switch
                    checked={setting.enabled}
                    onCheckedChange={() => toggleSetting(setting.id)}
                  />
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}
            className="flex justify-end pt-6 border-t border-border"
          >
            <Button className="btn-primary">
              Save Automation Settings
            </Button>
          </motion.div>
        </motion.div>
      )}

      {filteredNotifications.length === 0 && activeTab === 'notifications' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <BellIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No notifications found</h3>
          <p className="text-muted-foreground">Notifications and alerts will appear here</p>
        </motion.div>
      )}
    </div>
  );
}