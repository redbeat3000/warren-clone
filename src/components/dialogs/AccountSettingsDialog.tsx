import React from 'react';
import { motion } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { UserCircleIcon, CameraIcon } from '@heroicons/react/24/outline';

interface AccountSettingsDialogProps {
  open: boolean;
  onClose: () => void;
}

const accountSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 characters').optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(6, 'Password must be at least 6 characters').optional(),
  confirmPassword: z.string().optional(),
}).refine((data) => {
  if (data.newPassword && !data.currentPassword) {
    return false;
  }
  if (data.newPassword && data.newPassword !== data.confirmPassword) {
    return false;
  }
  return true;
}, {
  message: "Passwords don't match or current password is required",
  path: ["confirmPassword"],
});

type AccountFormData = z.infer<typeof accountSchema>;

export default function AccountSettingsDialog({ open, onClose }: AccountSettingsDialogProps) {
  const { toast } = useToast();
  const { authUser, signOut } = useAuth();
  
  const form = useForm<AccountFormData>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      firstName: authUser?.first_name || '',
      lastName: authUser?.last_name || '',
      email: authUser?.email || '',
      phone: '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  // Update form when authUser changes
  React.useEffect(() => {
    if (authUser) {
      form.reset({
        firstName: authUser.first_name,
        lastName: authUser.last_name,
        email: authUser.email || '',
        phone: '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    }
  }, [authUser, form]);

  const onSubmit = async (data: AccountFormData) => {
    if (!authUser) return;

    try {
      // Update profile information
      const { error: profileError } = await supabase
        .from('users')
        .update({
          first_name: data.firstName,
          last_name: data.lastName,
          phone: data.phone,
        })
        .eq('id', authUser.id);

      if (profileError) throw profileError;

      // Update email if changed
      if (data.email !== authUser.email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: data.email
        });
        if (emailError) throw emailError;
      }

      // Update password if provided
      if (data.newPassword && data.currentPassword) {
        const { error: passwordError } = await supabase.auth.updateUser({
          password: data.newPassword
        });
        if (passwordError) throw passwordError;
      }

      toast({
        title: "Success",
        description: "Account settings updated successfully",
      });
      
      // Reset password fields
      form.setValue('currentPassword', '');
      form.setValue('newPassword', '');
      form.setValue('confirmPassword', '');
      
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update account settings",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Account Settings</DialogTitle>
        </DialogHeader>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Profile Picture Section */}
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <div className="h-20 w-20 bg-primary/10 rounded-full flex items-center justify-center">
                <UserCircleIcon className="h-12 w-12 text-primary" />
              </div>
              <button className="absolute -bottom-1 -right-1 h-7 w-7 bg-primary text-primary-foreground rounded-full flex items-center justify-center hover:bg-primary/90 transition-colors">
                <CameraIcon className="h-4 w-4" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground">Click to change profile picture</p>
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
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="Enter email address" {...field} />
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

              <div className="border-t pt-4 space-y-4">
                <h4 className="font-medium text-foreground">Change Password</h4>
                
                <FormField
                  control={form.control}
                  name="currentPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Enter current password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Enter new password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm New Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Confirm new password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </Form>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}