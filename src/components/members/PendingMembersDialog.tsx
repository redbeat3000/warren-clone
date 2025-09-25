import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckIcon, XMarkIcon, UserIcon } from '@heroicons/react/24/outline';

interface PendingMember {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  role: string;
  created_at: string;
  member_no: string | null;
}

interface PendingMembersDialogProps {
  open: boolean;
  onClose: () => void;
  onMemberApproved?: () => void;
}

export default function PendingMembersDialog({ 
  open, 
  onClose, 
  onMemberApproved 
}: PendingMembersDialogProps) {
  const [pendingMembers, setPendingMembers] = useState<PendingMember[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchPendingMembers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('users')
        .select('id, first_name, last_name, email, phone, role, created_at, member_no')
        .eq('status', 'pending')
        .order('created_at', { ascending: true });

      if (error) throw error;
      setPendingMembers(data || []);
    } catch (error: any) {
      console.error('Error fetching pending members:', error);
      toast({
        title: 'Error',
        description: 'Failed to load pending members',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (memberId: string, approved: boolean) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ 
          status: approved ? 'active' : 'inactive',
          updated_at: new Date().toISOString()
        })
        .eq('id', memberId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: approved 
          ? 'Member approved successfully'
          : 'Member application rejected',
      });

      // Remove from pending list
      setPendingMembers(prev => prev.filter(m => m.id !== memberId));
      
      if (approved && onMemberApproved) {
        onMemberApproved();
      }
    } catch (error: any) {
      console.error('Error updating member status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update member status',
        variant: 'destructive'
      });
    }
  };

  useEffect(() => {
    if (open) {
      fetchPendingMembers();
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <UserIcon className="h-5 w-5" />
            <span>Pending Member Approvals</span>
            {pendingMembers.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {pendingMembers.length} pending
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="overflow-y-auto max-h-[60vh]">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : pendingMembers.length === 0 ? (
            <div className="text-center py-8">
              <UserIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No Pending Applications</h3>
              <p className="text-muted-foreground">All member applications have been processed.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <AnimatePresence mode="popLayout">
                {pendingMembers.map((member, index) => (
                  <motion.div
                    key={member.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="border border-muted">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback className="bg-primary text-primary-foreground">
                                {member.first_name.charAt(0)}{member.last_name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <CardTitle className="text-base">
                                {member.first_name} {member.last_name}
                              </CardTitle>
                              <p className="text-sm text-muted-foreground">
                                Applied {new Date(member.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                            {member.role}
                          </Badge>
                        </div>
                      </CardHeader>
                      
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                              Email
                            </label>
                            <p className="text-sm text-foreground mt-1">{member.email}</p>
                          </div>
                          <div>
                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                              Phone
                            </label>
                            <p className="text-sm text-foreground mt-1">
                              {member.phone || 'Not provided'}
                            </p>
                          </div>
                        </div>

                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleApproval(member.id, false)}
                            className="text-destructive hover:text-destructive-foreground hover:bg-destructive"
                          >
                            <XMarkIcon className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleApproval(member.id, true)}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            <CheckIcon className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}