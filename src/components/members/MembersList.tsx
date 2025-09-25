import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  MagnifyingGlassIcon,
  PlusIcon,
  UserCircleIcon,
  PhoneIcon,
  EnvelopeIcon,
  EyeIcon,
  PencilIcon,
  ClockIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import AddMemberForm from './AddMemberForm';
import MemberDetailsDialog from './MemberDetailsDialog';
import EditMemberDialog from './EditMemberDialog';
import PendingMembersDialog from './PendingMembersDialog';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

// Sample member data
const sampleMembers = [
  {
    id: '1',
    memberNo: 'CH001',
    firstName: 'Alice',
    lastName: 'Wanjiku',
    phone: '+254701234567',
    email: 'alice.wanjiku@email.com',
    joinDate: '2023-01-15',
    status: 'active',
    role: 'chairperson',
    totalContributions: 45000,
    activeLoans: 1
  },
  {
    id: '2',
    memberNo: 'CH002',
    firstName: 'John',
    lastName: 'Kamau',
    phone: '+254702345678',
    email: 'john.kamau@email.com',
    joinDate: '2023-01-20',
    status: 'active',
    role: 'treasurer',
    totalContributions: 42000,
    activeLoans: 0
  },
  {
    id: '3',
    memberNo: 'CH003',
    firstName: 'Mary',
    lastName: 'Njoki',
    phone: '+254703456789',
    email: 'mary.njoki@email.com',
    joinDate: '2023-02-01',
    status: 'active',
    role: 'secretary',
    totalContributions: 38000,
    activeLoans: 1
  },
  {
    id: '4',
    memberNo: 'CH004',
    firstName: 'Peter',
    lastName: 'Mwangi',
    phone: '+254704567890',
    email: 'peter.mwangi@email.com',
    joinDate: '2023-02-15',
    status: 'active',
    role: 'member',
    totalContributions: 35000,
    activeLoans: 2
  },
  {
    id: '5',
    memberNo: 'CH005',
    firstName: 'Grace',
    lastName: 'Akinyi',
    phone: '+254705678901',
    email: 'grace.akinyi@email.com',
    joinDate: '2023-03-01',
    status: 'inactive',
    role: 'member',
    totalContributions: 15000,
    activeLoans: 0
  }
];

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

interface MemberCardProps {
  member: Member;
  index: number;
  onViewMember: (member: Member) => void;
  onEditMember: (member: Member) => void;
  onDownloadReport: (member: Member) => void;
}

function MemberCard({ member, index, onViewMember, onEditMember, onDownloadReport }: MemberCardProps) {
  const statusColors = {
    active: 'status-active',
    inactive: 'status-inactive',
    pending: 'status-pending'
  };

  const roleColors = {
    chairperson: 'bg-accent text-accent-foreground',
    treasurer: 'bg-primary text-primary-foreground',
    secretary: 'bg-success text-success-foreground',
    member: 'bg-secondary text-secondary-foreground'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="card-elevated p-6 hover:shadow-lg transition-all duration-200"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-4">
          <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center">
            <UserCircleIcon className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              {member.firstName} {member.lastName}
            </h3>
            <p className="text-sm text-muted-foreground">Member #{member.memberNo}</p>
            <div className="flex items-center space-x-2 mt-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[member.status as keyof typeof statusColors]}`}>
                {member.status}
              </span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${roleColors[member.role as keyof typeof roleColors]}`}>
                {member.role}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onViewMember(member)}
            className="p-2 hover:bg-secondary rounded-lg transition-colors"
            title="View Member Details"
          >
            <EyeIcon className="h-4 w-4 text-muted-foreground" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onEditMember(member)}
            className="p-2 hover:bg-secondary rounded-lg transition-colors"
            title="Edit Member"
          >
            <PencilIcon className="h-4 w-4 text-muted-foreground" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onDownloadReport(member)}
            className="p-2 hover:bg-secondary rounded-lg transition-colors"
            title="Download Member Report"
          >
            <ArrowDownTrayIcon className="h-4 w-4 text-muted-foreground" />
          </motion.button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-muted-foreground">Contact</p>
          <div className="flex items-center space-x-2 mt-1">
            <PhoneIcon className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-foreground">{member.phone}</span>
          </div>
          <div className="flex items-center space-x-2 mt-1">
            <EnvelopeIcon className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-foreground">{member.email}</span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Summary</p>
          <p className="text-sm text-foreground mt-1">
            Contributions: <span className="font-medium">KES {member.totalContributions.toLocaleString()}</span>
          </p>
          <p className="text-sm text-foreground mt-1">
            Active Loans: <span className="font-medium">{member.activeLoans}</span>
          </p>
        </div>
      </div>
    </motion.div>
  );
}

export default function MembersList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [isPendingMembersOpen, setIsPendingMembersOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [isMemberDetailsOpen, setIsMemberDetailsOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [isEditMemberOpen, setIsEditMemberOpen] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const { authUser } = useAuth();

  const isAdmin = authUser?.role && ['chairperson', 'treasurer', 'secretary'].includes(authUser.role);

  useEffect(() => {
    fetchMembers();
    
    // Set up real-time subscription
    const channel = supabase
      .channel('members-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'users'
        },
        () => {
          fetchMembers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('first_name');

      if (error) throw error;

      const formattedMembers: Member[] = (data || []).map((user: any) => ({
        id: user.id,
        memberNo: user.member_no || 'N/A',
        firstName: user.first_name,
        lastName: user.last_name,
        phone: user.phone || 'N/A',
        email: user.email || 'N/A',
        joinDate: user.join_date || user.created_at,
        status: user.status,
        role: user.role,
        totalContributions: 0, // Will be calculated from contributions table
        activeLoans: 0 // Will be calculated from loans table
      }));

      setMembers(formattedMembers);
    } catch (error) {
      console.error('Error fetching members:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewMember = (member: Member) => {
    setSelectedMember(member);
    setIsMemberDetailsOpen(true);
  };

  const handleEditMember = (member: Member) => {
    setEditingMember(member);
    setIsEditMemberOpen(true);
  };

  const handleDownloadReport = async (member: Member) => {
    try {
      // Fetch member's data from all relevant tables
      const [contributionsRes, finesRes, loansRes, meetingAttendanceRes] = await Promise.all([
        supabase
          .from('contributions')
          .select('*')
          .eq('member_id', member.id)
          .order('contribution_date', { ascending: false }),
        supabase
          .from('fines')
          .select('*')
          .eq('member_id', member.id)
          .order('fine_date', { ascending: false }),
        supabase
          .from('loans')
          .select('*')
          .eq('member_id', member.id)
          .order('issue_date', { ascending: false }),
        supabase
          .from('meeting_attendance')
          .select('*, meetings(title, meeting_date)')
          .eq('member_id', member.id)
          .order('created_at', { ascending: false })
      ]);

      const contributions = contributionsRes.data || [];
      const fines = finesRes.data || [];
      const loans = loansRes.data || [];
      const meetingAttendance = meetingAttendanceRes.data || [];

      // Calculate totals
      const totalContributions = contributions.reduce((sum, c) => sum + parseFloat(c.amount?.toString() || '0'), 0);
      const totalFines = fines.reduce((sum, f) => sum + parseFloat(f.amount?.toString() || '0'), 0);
      const totalLoans = loans.reduce((sum, l) => sum + parseFloat(l.principal?.toString() || '0'), 0);
      const meetingsAttended = meetingAttendance.filter(a => a.status === 'present').length;
      const totalMeetings = meetingAttendance.length;

      // Create CSV content
      let csvContent = `Member Report - ${member.firstName} ${member.lastName} (${member.memberNo})\n\n`;
      
      // Summary section
      csvContent += `SUMMARY\n`;
      csvContent += `Member Number,${member.memberNo}\n`;
      csvContent += `Name,"${member.firstName} ${member.lastName}"\n`;
      csvContent += `Email,${member.email}\n`;
      csvContent += `Phone,${member.phone}\n`;
      csvContent += `Status,${member.status}\n`;
      csvContent += `Role,${member.role}\n`;
      csvContent += `Join Date,${member.joinDate}\n`;
      csvContent += `Total Contributions,"KES ${totalContributions.toLocaleString()}"\n`;
      csvContent += `Total Fines,"KES ${totalFines.toLocaleString()}"\n`;
      csvContent += `Total Loans,"KES ${totalLoans.toLocaleString()}"\n`;
      csvContent += `Meetings Attended,${meetingsAttended}/${totalMeetings}\n\n`;

      // Contributions section
      csvContent += `CONTRIBUTIONS\n`;
      csvContent += `Date,Amount,Payment Method,Receipt No,Notes\n`;
      contributions.forEach(c => {
        const amount = parseFloat(c.amount?.toString() || '0');
        csvContent += `${c.contribution_date},"KES ${amount.toLocaleString()}",${c.payment_method || 'N/A'},${c.receipt_no || 'N/A'},"${c.notes || 'N/A'}"\n`;
      });
      csvContent += `\n`;

      // Fines section
      csvContent += `FINES\n`;
      csvContent += `Date,Amount,Reason,Status\n`;
      fines.forEach(f => {
        const amount = parseFloat(f.amount?.toString() || '0');
        csvContent += `${f.fine_date},"KES ${amount.toLocaleString()}","${f.reason || 'N/A'}",${f.status}\n`;
      });
      csvContent += `\n`;

      // Loans section
      csvContent += `LOANS\n`;
      csvContent += `Issue Date,Principal,Interest Rate,Term (Months),Due Date,Status,Interest Type,Notes\n`;
      loans.forEach(l => {
        const principal = parseFloat(l.principal?.toString() || '0');
        csvContent += `${l.issue_date},"KES ${principal.toLocaleString()}",${l.interest_rate}%,${l.term_months},${l.due_date || 'N/A'},${l.status},${l.interest_type},"${l.notes || 'N/A'}"\n`;
      });
      csvContent += `\n`;

      // Meeting attendance section
      csvContent += `MEETING ATTENDANCE\n`;
      csvContent += `Meeting,Date,Status,Notes\n`;
      meetingAttendance.forEach(a => {
        const meeting = (a as any).meetings;
        csvContent += `"${meeting?.title || 'N/A'}",${meeting?.meeting_date || 'N/A'},${a.status},"${a.notes || 'N/A'}"\n`;
      });

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${member.firstName}_${member.lastName}_Report_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (error) {
      console.error('Error generating member report:', error);
      alert('Error generating report. Please try again.');
    }
  };

  const activeMembers = members.length > 0 ? members : sampleMembers;
  const filteredMembers = activeMembers.filter(member => {
    const matchesSearch = `${member.firstName} ${member.lastName} ${member.memberNo}`.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || member.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-foreground">Members</h1>
          <p className="text-muted-foreground mt-1">Manage your Chama members and their information</p>
        </div>
        <div className="flex items-center space-x-3">
          {/* Pending Approvals Button - Only for Admins */}
          {isAdmin && pendingCount > 0 && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsPendingMembersOpen(true)}
              className="btn-secondary flex items-center space-x-2 relative"
            >
              <ClockIcon className="h-5 w-5" />
              <span>Pending Approvals</span>
              <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {pendingCount}
              </div>
            </motion.button>
          )}
          
          {/* Add Member Button */}
          <Dialog open={isAddMemberOpen} onOpenChange={setIsAddMemberOpen}>
            <DialogTrigger asChild>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="btn-primary flex items-center space-x-2"
              >
                <PlusIcon className="h-5 w-5" />
                <span>Add Member</span>
              </motion.button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <AddMemberForm 
                onSuccess={() => setRefreshKey(prev => prev + 1)} 
                onClose={() => setIsAddMemberOpen(false)} 
              />
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col sm:flex-row gap-4"
      >
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search members..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-input-border rounded-lg bg-input focus:outline-none focus:ring-2 focus:ring-accent-border focus:border-transparent"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-input-border rounded-lg bg-input focus:outline-none focus:ring-2 focus:ring-accent-border focus:border-transparent"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="pending">Pending</option>
        </select>
      </motion.div>

      {/* Stats Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 sm:grid-cols-4 gap-4"
      >
        <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
          <p className="text-2xl font-bold text-primary">{activeMembers.length}</p>
          <p className="text-sm text-muted-foreground">Total Members</p>
        </div>
        <div className="bg-success/10 rounded-lg p-4 border border-success/20">
          <p className="text-2xl font-bold text-success">{activeMembers.filter(m => m.status === 'active').length}</p>
          <p className="text-sm text-muted-foreground">Active Members</p>
        </div>
        <div className="bg-warning/10 rounded-lg p-4 border border-warning/20">
          <p className="text-2xl font-bold text-warning">{activeMembers.filter(m => m.activeLoans > 0).length}</p>
          <p className="text-sm text-muted-foreground">With Loans</p>
        </div>
        <div className="bg-accent/10 rounded-lg p-4 border border-accent/20">
          <p className="text-2xl font-bold text-accent">
            KES {activeMembers.reduce((sum, m) => sum + m.totalContributions, 0).toLocaleString()}
          </p>
          <p className="text-sm text-muted-foreground">Total Contributions</p>
        </div>
      </motion.div>

      {/* Members Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredMembers.map((member, index) => (
          <MemberCard 
            key={member.id} 
            member={member} 
            index={index}
            onViewMember={handleViewMember}
            onEditMember={handleEditMember}
            onDownloadReport={handleDownloadReport}
          />
        ))}
      </div>

      {filteredMembers.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <p className="text-muted-foreground">No members found matching your criteria.</p>
        </motion.div>
      )}

      <MemberDetailsDialog 
        member={selectedMember}
        open={isMemberDetailsOpen}
        onClose={() => setIsMemberDetailsOpen(false)}
      />

      <EditMemberDialog 
        member={editingMember}
        open={isEditMemberOpen}
        onClose={() => setIsEditMemberOpen(false)}
        onSuccess={() => {
          fetchMembers();
          setRefreshKey(prev => prev + 1);
        }}
      />

      {/* Pending Members Dialog */}
      <PendingMembersDialog
        open={isPendingMembersOpen}
        onClose={() => setIsPendingMembersOpen(false)}
        onMemberApproved={() => {
          fetchMembers();
          setRefreshKey(prev => prev + 1);
        }}
      />
    </div>
  );
}