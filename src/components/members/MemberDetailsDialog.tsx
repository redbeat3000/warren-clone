import React from 'react';
import { motion } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { UserCircleIcon, PhoneIcon, EnvelopeIcon } from '@heroicons/react/24/outline';

interface Member {
  id: string;
  memberNo: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  joinDate: string;
  status: string;
  role: string;
  totalContributions: number;
  activeLoans: number;
}

interface MemberDetailsDialogProps {
  member: Member | null;
  open: boolean;
  onClose: () => void;
}

export default function MemberDetailsDialog({ member, open, onClose }: MemberDetailsDialogProps) {
  if (!member) return null;

  const statusColors = {
    active: 'bg-success text-success-foreground',
    inactive: 'bg-secondary text-secondary-foreground',
    pending: 'bg-warning text-warning-foreground'
  };

  const roleColors = {
    chairperson: 'bg-accent text-accent-foreground',
    treasurer: 'bg-primary text-primary-foreground',
    secretary: 'bg-success text-success-foreground',
    member: 'bg-secondary text-secondary-foreground'
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Member Details</DialogTitle>
        </DialogHeader>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Profile Section */}
          <div className="flex items-center space-x-4">
            <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center">
              <UserCircleIcon className="h-10 w-10 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-foreground">
                {member.firstName} {member.lastName}
              </h3>
              <p className="text-sm text-muted-foreground">Member #{member.memberNo}</p>
              <div className="flex items-center space-x-2 mt-2">
                <Badge className={statusColors[member.status as keyof typeof statusColors]}>
                  {member.status}
                </Badge>
                <Badge className={roleColors[member.role as keyof typeof roleColors]}>
                  {member.role}
                </Badge>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-3">
            <h4 className="font-medium text-foreground">Contact Information</h4>
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <PhoneIcon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-foreground">{member.phone}</span>
              </div>
              <div className="flex items-center space-x-3">
                <EnvelopeIcon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-foreground">{member.email}</span>
              </div>
            </div>
          </div>

          {/* Financial Summary */}
          <div className="space-y-3">
            <h4 className="font-medium text-foreground">Financial Summary</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-muted/30 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">Total Contributions</p>
                <p className="text-lg font-semibold text-foreground">
                  KES {member.totalContributions.toLocaleString()}
                </p>
              </div>
              <div className="bg-muted/30 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">Active Loans</p>
                <p className="text-lg font-semibold text-foreground">
                  {member.activeLoans}
                </p>
              </div>
            </div>
          </div>

          {/* Membership Details */}
          <div className="space-y-3">
            <h4 className="font-medium text-foreground">Membership Details</h4>
            <div className="bg-muted/30 rounded-lg p-3">
              <p className="text-xs text-muted-foreground">Join Date</p>
              <p className="text-sm text-foreground">
                {new Date(member.joinDate).toLocaleDateString()}
              </p>
            </div>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}