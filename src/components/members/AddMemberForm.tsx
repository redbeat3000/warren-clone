import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { auditLogger } from '@/utils/auditLogger';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useSettings } from '@/hooks/useSettings';

const memberSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50, 'First name must be less than 50 characters'),
  lastName: z.string().min(1, 'Last name is required').max(50, 'Last name must be less than 50 characters'),
  email: z.string().email('Invalid email address').max(255, 'Email must be less than 255 characters'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits').max(15, 'Phone number must be less than 15 digits'),
  nationalId: z.string().optional(),
  role: z.enum(['chairperson', 'treasurer', 'secretary', 'member']),
});

type MemberFormData = z.infer<typeof memberSchema>;

interface AddMemberFormProps {
  onSuccess: () => void;
  onClose: () => void;
}

export default function AddMemberForm({ onSuccess, onClose }: AddMemberFormProps) {
  const { toast } = useToast();
  const { settings, loading: settingsLoading } = useSettings();
  
  const form = useForm<MemberFormData>({
    resolver: zodResolver(memberSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      nationalId: '',
      role: 'member',
    },
  });

  const onSubmit = async (data: MemberFormData) => {
    try {
      // Check member count limit
      const { data: members, error: countError } = await supabase
        .from('users')
        .select('id', { count: 'exact' })
        .eq('status', 'active');

      if (countError) throw countError;

      const currentCount = members?.length || 0;
      if (currentCount >= settings.maximumMembers) {
        toast({
          title: 'Member Limit Reached',
          description: `Cannot add more members. Maximum limit of ${settings.maximumMembers} members has been reached.`,
          variant: 'destructive',
        });
        return;
      }

      // Check if trying to add another chairperson
      if (data.role === 'chairperson') {
        const { data: existingChairperson, error: checkError } = await supabase
          .from('users')
          .select('id')
          .eq('role', 'chairperson')
          .eq('status', 'active');

        if (checkError) throw checkError;

        if (existingChairperson && existingChairperson.length > 0) {
          toast({
            title: 'Error',
            description: 'Only one chairperson is allowed in the system',
            variant: 'destructive',
          });
          return;
        }
      }

      const { data: result, error } = await supabase
        .from('users')
        .insert({
          first_name: data.firstName,
          last_name: data.lastName,
          email: data.email,
          phone: data.phone,
          national_id: data.nationalId || null,
          role: data.role as any,
          status: settings.memberApprovalRequired && data.role !== 'chairperson' ? 'pending' : 'active',
        })
        .select()
        .single();

      if (error) throw error;

      // Log the member creation
      await auditLogger.logDataChange('create', 'users', result.id, {
        member_name: `${data.firstName} ${data.lastName}`,
        email: data.email,
        phone: data.phone,
        role: data.role,
        status: result.status,
        national_id: data.nationalId
      });

      const successMessage = settings.memberApprovalRequired && data.role !== 'chairperson'
        ? 'Member application submitted for approval! Status set to pending.'
        : 'Member added successfully';

      toast({
        title: 'Success',
        description: successMessage,
      });

      onSuccess();
      onClose();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add member',
        variant: 'destructive',
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-2xl font-bold text-foreground">Add New Member</h2>
        <p className="text-muted-foreground">Fill in the member details below</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter first name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Last Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter last name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="Enter email address" type="email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number</FormLabel>
                <FormControl>
                  <Input placeholder="Enter phone number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="nationalId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>National ID (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="Enter national ID" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Role</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="secretary">Secretary</SelectItem>
                    <SelectItem value="treasurer">Treasurer</SelectItem>
                    <SelectItem value="chairperson">Chairperson</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting || settingsLoading}>
              {form.formState.isSubmitting ? 'Adding...' : 'Add Member'}
            </Button>
          </div>
        </form>
      </Form>
    </motion.div>
  );
}