import React from 'react';
import { motion } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { UserCircleIcon, PhoneIcon, EnvelopeIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { supabase } from '@/integrations/supabase/client';
import { generateMemberReportPDF } from '@/utils/memberReportPDF';
import { useToast } from '@/hooks/use-toast';

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

  const handleDownloadReport = async () => {
    try {
      // Fetch all member data
      const [contributions, fines, loans, repayments, dividends] = await Promise.all([
        supabase.from('contributions').select('*').eq('member_id', member.id),
        supabase.from('fines').select('*').eq('member_id', member.id),
        supabase.from('loans').select('*, loan_repayments(*)').eq('member_id', member.id),
        supabase.from('loan_repayments').select('*').eq('member_id', member.id),
        supabase.from('dividends').select('*').eq('member_id', member.id)
      ]);

      // Group contributions by type
      const contributionsByType = (contributions.data || []).reduce((acc: any, c: any) => {
        const type = c.contribution_type || 'savings';
        if (!acc[type]) acc[type] = 0;
        acc[type] += parseFloat(c.amount);
        return acc;
      }, {});

      const memberData = {
        ...member,
        firstName: member.firstName || '',
        lastName: member.lastName || '',
        memberNo: member.memberNo || 'N/A',
        email: member.email || 'N/A',
        phone: member.phone || 'N/A',
        status: member.status || 'active',
        role: member.role || 'member',
        joinDate: member.joinDate || new Date().toISOString()
      };

      const financialData = {
        contributions: contributionsByType,
        totalContributions: member.totalContributions || 0,
        fines: fines.data || [],
        loans: loans.data || [],
        repayments: repayments.data || [],
        dividends: dividends.data || []
      };

      generateMemberReportPDF(memberData, financialData);
    } catch (error) {
      console.error('Error generating member report:', error);
    }
  };

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
        <div className="flex items-center justify-between">
          <DialogTitle>Member Details</DialogTitle>
          <Button onClick={handleDownloadReport} size="sm" variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Download Report
          </Button>
        </div>
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

          <div className="mt-6 flex justify-end">
            <Button onClick={handleDownloadReport} className="w-full">
              <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
              Download Details (PDF)
            </Button>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}