import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  PlusIcon,
  ChatBubbleLeftRightIcon,
  DevicePhoneMobileIcon,
  EnvelopeIcon,
  EyeIcon,
  PaperAirplaneIcon
} from '@heroicons/react/24/outline';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import SendMessageForm from './SendMessageForm';
import { supabase } from '@/integrations/supabase/client';

// Sample messages data
const sampleMessages = [
  {
    id: '1',
    title: 'Monthly Meeting Reminder',
    type: 'SMS',
    recipients: 'All Members',
    recipientCount: 5,
    content: 'Reminder: Monthly meeting tomorrow at 2 PM. Venue: Community Hall. Please confirm attendance.',
    sentDate: '2024-01-14',
    status: 'sent',
    deliveryRate: 100
  },
  {
    id: '2',
    title: 'Contribution Due Notice',
    type: 'WhatsApp',
    recipients: 'Grace Akinyi, Peter Mwangi',
    recipientCount: 2,
    content: 'Your monthly contribution of KES 5,000 is due. Please make payment by end of week.',
    sentDate: '2024-01-10',
    status: 'sent',
    deliveryRate: 100
  }
];

export default function MessagesView() {
  const [activeTab, setActiveTab] = useState('messages');
  const [isNewMessageOpen, setIsNewMessageOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMessages();
    
    // Set up real-time subscription
    const channel = supabase
      .channel('messages-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages'
        },
        () => {
          fetchMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*, users!inner(first_name, last_name)')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedMessages = (data || []).map((message: any) => ({
        id: message.id,
        title: `Message to ${message.users.first_name}`,
        type: message.channel.toUpperCase(),
        recipients: `${message.users.first_name} ${message.users.last_name}`,
        recipientCount: 1,
        content: message.message_content,
        sentDate: message.sent_at || message.created_at,
        status: message.status,
        deliveryRate: message.status === 'sent' ? 100 : 0
      }));

      setMessages(formattedMessages);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const activeMessages = messages.length > 0 ? messages : sampleMessages;
  const totalSent = activeMessages.filter(msg => msg.status === 'sent').length;
  const totalDrafts = activeMessages.filter(msg => msg.status === 'draft').length;
  const totalRecipients = activeMessages.reduce((sum, msg) => sum + msg.recipientCount, 0);
  const averageDelivery = activeMessages.length > 0 
    ? Math.round(activeMessages.reduce((sum, msg) => sum + msg.deliveryRate, 0) / activeMessages.length)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-foreground">Messages & Notifications</h1>
          <p className="text-muted-foreground mt-1">Send SMS, WhatsApp, and email communications to members</p>
        </div>
        <Dialog open={isNewMessageOpen} onOpenChange={setIsNewMessageOpen}>
          <DialogTrigger asChild>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="btn-primary flex items-center space-x-2"
            >
              <PlusIcon className="h-5 w-5" />
              <span>New Message</span>
            </motion.button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <SendMessageForm 
              onSuccess={() => setRefreshKey(prev => prev + 1)} 
              onClose={() => setIsNewMessageOpen(false)} 
            />
          </DialogContent>
        </Dialog>
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
              <p className="text-sm font-medium text-muted-foreground">Messages Sent</p>
              <p className="text-2xl font-bold text-foreground mt-2">{totalSent}</p>
            </div>
            <div className="h-12 w-12 bg-success/10 rounded-lg flex items-center justify-center">
              <PaperAirplaneIcon className="h-6 w-6 text-success" />
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
              <p className="text-sm font-medium text-muted-foreground">Draft Messages</p>
              <p className="text-2xl font-bold text-foreground mt-2">{totalDrafts}</p>
            </div>
            <div className="h-12 w-12 bg-warning/10 rounded-lg flex items-center justify-center">
              <ChatBubbleLeftRightIcon className="h-6 w-6 text-warning" />
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
              <p className="text-sm font-medium text-muted-foreground">Total Recipients</p>
              <p className="text-2xl font-bold text-foreground mt-2">{totalRecipients}</p>
            </div>
            <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <DevicePhoneMobileIcon className="h-6 w-6 text-primary" />
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
              <p className="text-sm font-medium text-muted-foreground">Delivery Rate</p>
              <p className="text-2xl font-bold text-foreground mt-2">{averageDelivery}%</p>
            </div>
            <div className="h-12 w-12 bg-accent/10 rounded-lg flex items-center justify-center">
              <EnvelopeIcon className="h-6 w-6 text-accent" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Message History Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="card-elevated overflow-hidden"
      >
        <div className="p-6 border-b border-border">
          <h3 className="text-lg font-semibold text-foreground">Recent Messages</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/30">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Recipients
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Sent Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {activeMessages.map((message, index) => (
                <motion.tr
                  key={message.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                  className="hover:bg-muted/20 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-foreground">{message.title}</div>
                    <div className="text-sm text-muted-foreground truncate max-w-xs">
                      {message.content}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      message.type === 'SMS' ? 'bg-primary/10 text-primary' :
                      message.type === 'WhatsApp' ? 'bg-success/10 text-success' :
                      'bg-accent/10 text-accent'
                    }`}>
                      {message.type}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-foreground">{message.recipients}</div>
                    <div className="text-sm text-muted-foreground">{message.recipientCount} recipients</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-foreground">{new Date(message.sentDate).toLocaleDateString()}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      message.status === 'sent' ? 'status-active' : 'status-pending'
                    }`}>
                      {message.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <button className="p-1 hover:bg-secondary rounded transition-colors">
                        <EyeIcon className="h-4 w-4 text-muted-foreground" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}