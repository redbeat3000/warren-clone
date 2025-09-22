import React from 'react';
import { motion } from 'framer-motion';
import { UserCircleIcon } from '@heroicons/react/24/outline';

// Sample limited member data for non-admin users
const limitedMemberData = [
  {
    id: '1',
    memberNo: 'CH001',
    firstName: 'Alice',
    lastName: 'W.',
    role: 'chairperson',
    status: 'active',
    joinDate: '2023-01-15'
  },
  {
    id: '2', 
    memberNo: 'CH002',
    firstName: 'John',
    lastName: 'K.',
    role: 'treasurer', 
    status: 'active',
    joinDate: '2023-01-20'
  },
  {
    id: '3',
    memberNo: 'CH003', 
    firstName: 'Mary',
    lastName: 'N.',
    role: 'secretary',
    status: 'active',
    joinDate: '2023-02-01'
  },
  {
    id: '4',
    memberNo: 'CH004',
    firstName: 'Peter', 
    lastName: 'M.',
    role: 'member',
    status: 'active',
    joinDate: '2023-02-15'
  }
];

interface MemberCardProps {
  member: any;
  index: number;
}

function RestrictedMemberCard({ member, index }: MemberCardProps) {
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
      className="card-elevated p-4 hover:shadow-lg transition-all duration-200"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
            <UserCircleIcon className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground">
              {member.firstName} {member.lastName}
            </h3>
            <p className="text-sm text-muted-foreground">Member #{member.memberNo}</p>
          </div>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${roleColors[member.role as keyof typeof roleColors]}`}>
          {member.role}
        </span>
      </div>
      
      <div className="mt-3 pt-3 border-t border-border">
        <p className="text-xs text-muted-foreground">
          Joined: {new Date(member.joinDate).toLocaleDateString()}
        </p>
      </div>
    </motion.div>
  );
}

export default function RestrictedMembersView() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-foreground">Members Directory</h1>
          <p className="text-muted-foreground mt-1">View member information (limited access)</p>
        </div>
      </motion.div>

      {/* Stats Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 sm:grid-cols-3 gap-4"
      >
        <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
          <p className="text-2xl font-bold text-primary">{limitedMemberData.length}</p>
          <p className="text-sm text-muted-foreground">Total Members</p>
        </div>
        <div className="bg-success/10 rounded-lg p-4 border border-success/20">
          <p className="text-2xl font-bold text-success">{limitedMemberData.filter(m => m.status === 'active').length}</p>
          <p className="text-sm text-muted-foreground">Active Members</p>
        </div>
        <div className="bg-accent/10 rounded-lg p-4 border border-accent/20">
          <p className="text-2xl font-bold text-accent">3</p>
          <p className="text-sm text-muted-foreground">Leadership Roles</p>
        </div>
      </motion.div>

      {/* Members Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {limitedMemberData.map((member, index) => (
          <RestrictedMemberCard key={member.id} member={member} index={index} />
        ))}
      </div>

      {/* Info Note */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="bg-info/10 border border-info/20 rounded-lg p-4"
      >
        <p className="text-sm text-info text-center">
          <strong>Note:</strong> Contact information and financial details are only visible to administrators.
        </p>
      </motion.div>
    </div>
  );
}