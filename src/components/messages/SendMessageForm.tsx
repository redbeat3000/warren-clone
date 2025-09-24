import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';

const messageSchema = z.object({
  channel: z.enum(['sms', 'whatsapp', 'email']),
  messageContent: z.string().min(1, 'Message content is required').max(1000, 'Message must be less than 1000 characters'),
  recipientType: z.enum(['all', 'selected']),
  selectedMembers: z.array(z.string()).optional(),
});

type MessageFormData = z.infer<typeof messageSchema>;

interface Member {
  id: string;
  first_name: string;
  last_name: string;
  full_name: string;
}

interface SendMessageFormProps {
  onSuccess: () => void;
  onClose: () => void;
}

export default function SendMessageForm({ onSuccess, onClose }: SendMessageFormProps) {
  const { toast } = useToast();
  const [members, setMembers] = useState<Member[]>([]);

  const form = useForm<MessageFormData>({
    resolver: zodResolver(messageSchema),
    defaultValues: {
      channel: 'sms',
      messageContent: '',
      recipientType: 'all',
      selectedMembers: [],
    },
  });

  const recipientType = form.watch('recipientType');

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, first_name, last_name, full_name')
        .eq('status', 'active')
        .order('first_name');

      if (error) throw error;
      setMembers(data || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to fetch members',
        variant: 'destructive',
      });
    }
  };

  const onSubmit = async (data: MessageFormData) => {
    try {
      // If sending to all members, get all member IDs
      const recipientIds = data.recipientType === 'all' 
        ? members.map(m => m.id)
        : data.selectedMembers || [];

      if (recipientIds.length === 0) {
        toast({
          title: 'Error',
          description: 'Please select at least one recipient',
          variant: 'destructive',
        });
        return;
      }

      // Insert messages for each recipient
      const messages = recipientIds.map(memberId => ({
        member_id: memberId,
        channel: data.channel as any,
        message_content: data.messageContent,
        status: 'queued' as any,
      }));

      const { error } = await supabase
        .from('messages')
        .insert(messages);

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Message queued for ${recipientIds.length} recipient(s)`,
      });

      onSuccess();
      onClose();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send message',
        variant: 'destructive',
      });
    }
  };

  const getMaxLength = () => {
    const channel = form.watch('channel');
    switch (channel) {
      case 'sms': return 160;
      case 'whatsapp': return 1000;
      case 'email': return 5000;
      default: return 1000;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-2xl font-bold text-foreground">Send Message</h2>
        <p className="text-muted-foreground">Send SMS, WhatsApp, or email to members</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="channel"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Message Channel</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select channel" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="sms">SMS</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="recipientType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Recipients</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select recipients" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="all">All Members</SelectItem>
                    <SelectItem value="selected">Selected Members</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {recipientType === 'selected' && (
            <FormField
              control={form.control}
              name="selectedMembers"
              render={() => (
                <FormItem>
                  <FormLabel>Select Members</FormLabel>
                  <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border rounded-md p-3">
                    {members.map((member) => (
                      <FormField
                        key={member.id}
                        control={form.control}
                        name="selectedMembers"
                        render={({ field }) => {
                          return (
                            <FormItem
                              key={member.id}
                              className="flex flex-row items-start space-x-3 space-y-0"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(member.id)}
                                  onCheckedChange={(checked) => {
                                    const current = field.value || [];
                                    return checked
                                      ? field.onChange([...current, member.id])
                                      : field.onChange(current.filter((value) => value !== member.id));
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="text-sm font-normal">
                                {member.full_name || `${member.first_name} ${member.last_name}`}
                              </FormLabel>
                            </FormItem>
                          );
                        }}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control}
            name="messageContent"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Message Content</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Enter your message..."
                    maxLength={getMaxLength()}
                    rows={4}
                    {...field}
                  />
                </FormControl>
                <div className="text-xs text-muted-foreground">
                  {field.value?.length || 0}/{getMaxLength()} characters
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? 'Sending...' : 'Send Message'}
            </Button>
          </div>
        </form>
      </Form>
    </motion.div>
  );
}