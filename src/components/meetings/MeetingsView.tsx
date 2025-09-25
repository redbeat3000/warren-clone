import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  PlusIcon,
  CalendarDaysIcon,
  UserGroupIcon,
  ClockIcon,
  DocumentTextIcon,
  EyeIcon,
  PencilIcon,
  DocumentArrowDownIcon
} from '@heroicons/react/24/outline';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import AddMeetingForm from './AddMeetingForm';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';

interface Meeting {
  id: string;
  title: string;
  date: string;
  time: string;
  venue: string;
  agenda: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  attendees_count: number;
  created_at: string;
}

const sampleMeetings: Meeting[] = [
  {
    id: '1',
    title: 'Monthly General Meeting',
    date: '2024-02-15',
    time: '14:00',
    venue: 'Community Hall, Westlands',
    agenda: 'Financial review, new loan applications, and member updates',
    status: 'scheduled',
    attendees_count: 5,
    created_at: '2024-01-20'
  },
  {
    id: '2',
    title: 'Emergency Meeting - Loan Policy',
    date: '2024-01-25',
    time: '16:00',
    venue: 'Online - Zoom',
    agenda: 'Review and update loan policy, discuss interest rates',
    status: 'completed',
    attendees_count: 4,
    created_at: '2024-01-22'
  }
];

export default function MeetingsView() {
  const [activeTab, setActiveTab] = useState('upcoming');
  const [isNewMeetingOpen, setIsNewMeetingOpen] = useState(false);
  const [meetings, setMeetings] = useState<Meeting[]>(sampleMeetings);
  const [loading, setLoading] = useState(false);

  const upcomingMeetings = meetings.filter(m => m.status === 'scheduled');
  const completedMeetings = meetings.filter(m => m.status === 'completed');
  const totalAttendees = meetings.reduce((sum, m) => sum + m.attendees_count, 0);
  const averageAttendance = meetings.length > 0 ? Math.round(totalAttendees / meetings.length) : 0;

  const handleExportMeetings = async () => {
    const { generateMeetingsReportPDF } = await import('@/utils/pdfGenerator');
    generateMeetingsReportPDF(meetings);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-foreground">Meetings & Events</h1>
          <p className="text-muted-foreground mt-1">Schedule and manage Chama meetings and events</p>
        </div>
        <div className="flex items-center space-x-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="btn-secondary flex items-center space-x-2"
            onClick={handleExportMeetings}
          >
            <DocumentArrowDownIcon className="h-5 w-5" />
            <span>Export PDF</span>
          </motion.button>
          <Dialog open={isNewMeetingOpen} onOpenChange={setIsNewMeetingOpen}>
            <DialogTrigger asChild>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="btn-primary flex items-center space-x-2"
              >
                <PlusIcon className="h-5 w-5" />
                <span>Schedule Meeting</span>
              </motion.button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <AddMeetingForm 
                onSuccess={() => {
                  setIsNewMeetingOpen(false);
                  // Refresh meetings
                }} 
                onClose={() => setIsNewMeetingOpen(false)} 
              />
            </DialogContent>
          </Dialog>
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
              <p className="text-sm font-medium text-muted-foreground">Upcoming Meetings</p>
              <p className="text-2xl font-bold text-foreground mt-2">{upcomingMeetings.length}</p>
            </div>
            <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <CalendarDaysIcon className="h-6 w-6 text-primary" />
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
              <p className="text-sm font-medium text-muted-foreground">Total Meetings</p>
              <p className="text-2xl font-bold text-foreground mt-2">{meetings.length}</p>
            </div>
            <div className="h-12 w-12 bg-success/10 rounded-lg flex items-center justify-center">
              <DocumentTextIcon className="h-6 w-6 text-success" />
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
              <p className="text-sm font-medium text-muted-foreground">Average Attendance</p>
              <p className="text-2xl font-bold text-foreground mt-2">{averageAttendance}</p>
            </div>
            <div className="h-12 w-12 bg-accent/10 rounded-lg flex items-center justify-center">
              <UserGroupIcon className="h-6 w-6 text-accent" />
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
              <p className="text-sm font-medium text-muted-foreground">This Month</p>
              <p className="text-2xl font-bold text-foreground mt-2">2</p>
              <p className="text-sm text-muted-foreground mt-1">Meetings held</p>
            </div>
            <div className="h-12 w-12 bg-warning/10 rounded-lg flex items-center justify-center">
              <ClockIcon className="h-6 w-6 text-warning" />
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
          onClick={() => setActiveTab('upcoming')}
          className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
            activeTab === 'upcoming'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Upcoming ({upcomingMeetings.length})
        </button>
        <button
          onClick={() => setActiveTab('completed')}
          className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
            activeTab === 'completed'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Completed ({completedMeetings.length})
        </button>
        <button
          onClick={() => setActiveTab('all')}
          className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
            activeTab === 'all'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          All Meetings ({meetings.length})
        </button>
      </motion.div>

      {/* Meetings List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {(activeTab === 'upcoming' ? upcomingMeetings : 
          activeTab === 'completed' ? completedMeetings : meetings).map((meeting, index) => (
          <motion.div
            key={meeting.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 + index * 0.1 }}
            className="card-elevated p-6 hover:shadow-lg transition-all duration-200"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-foreground">{meeting.title}</h3>
                <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
                  <span className="flex items-center space-x-1">
                    <CalendarDaysIcon className="h-4 w-4" />
                    <span>{new Date(meeting.date).toLocaleDateString()}</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <ClockIcon className="h-4 w-4" />
                    <span>{meeting.time}</span>
                  </span>
                </div>
              </div>
              <Badge 
                variant={meeting.status === 'scheduled' ? 'default' : 
                        meeting.status === 'completed' ? 'secondary' : 'destructive'}
              >
                {meeting.status}
              </Badge>
            </div>

            <div className="space-y-2 mb-4">
              <div>
                <span className="text-sm font-medium text-foreground">Venue: </span>
                <span className="text-sm text-muted-foreground">{meeting.venue}</span>
              </div>
              <div>
                <span className="text-sm font-medium text-foreground">Agenda: </span>
                <p className="text-sm text-muted-foreground">{meeting.agenda}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-foreground">Expected Attendees: </span>
                <span className="text-sm text-muted-foreground">{meeting.attendees_count} members</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-xs text-muted-foreground">
                Created: {new Date(meeting.created_at).toLocaleDateString()}
              </div>
              <div className="flex items-center space-x-2">
                <button className="p-2 hover:bg-secondary rounded-lg transition-colors">
                  <EyeIcon className="h-4 w-4 text-muted-foreground" />
                </button>
                <button className="p-2 hover:bg-secondary rounded-lg transition-colors">
                  <PencilIcon className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {meetings.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <CalendarDaysIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No meetings scheduled</h3>
          <p className="text-muted-foreground mb-4">Schedule your first Chama meeting to get started</p>
          <button
            onClick={() => setIsNewMeetingOpen(true)}
            className="btn-primary"
          >
            Schedule Meeting
          </button>
        </motion.div>
      )}
    </div>
  );
}