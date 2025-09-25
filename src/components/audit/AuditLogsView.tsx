import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ShieldCheckIcon,
  UserIcon,
  ClockIcon,
  EyeIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

interface AuditLog {
  id: string;
  action: string;
  actor_id: string | null;
  meta: any;
  created_at: string;
  actor_name?: string;
}

const actionLabels: Record<string, string> = {
  user_role_change: 'User Role Changed',
  seed_database: 'Database Seeded',
  member_created: 'Member Created',
  member_updated: 'Member Updated',
  loan_created: 'Loan Created',
  contribution_added: 'Contribution Added',
  expense_created: 'Expense Created',
  fine_issued: 'Fine Issued'
};

const actionColors: Record<string, string> = {
  user_role_change: 'bg-blue-100 text-blue-800',
  seed_database: 'bg-gray-100 text-gray-800',
  member_created: 'bg-green-100 text-green-800',
  member_updated: 'bg-yellow-100 text-yellow-800',
  loan_created: 'bg-purple-100 text-purple-800',
  contribution_added: 'bg-emerald-100 text-emerald-800',
  expense_created: 'bg-red-100 text-red-800',
  fine_issued: 'bg-orange-100 text-orange-800'
};

export default function AuditLogsView() {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAction, setSelectedAction] = useState('all');

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const fetchAuditLogs = async () => {
    try {
      const { data: logs, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get actor names for logs that have actor_id
      const logsWithActors = await Promise.all(
        (logs || []).map(async (log) => {
          if (log.actor_id) {
            const { data: user } = await supabase
              .from('users')
              .select('first_name, last_name')
              .eq('id', log.actor_id)
              .single();
            
            return {
              ...log,
              actor_name: user ? `${user.first_name} ${user.last_name}` : 'Unknown User'
            };
          }
          return {
            ...log,
            actor_name: 'System'
          };
        })
      );

      setAuditLogs(logsWithActors);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = 
      (actionLabels[log.action] || log.action).toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.actor_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      JSON.stringify(log.meta).toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesAction = selectedAction === 'all' || log.action === selectedAction;
    
    return matchesSearch && matchesAction;
  });

  const uniqueActions = [...new Set(auditLogs.map(log => log.action))];
  const totalActions = auditLogs.length;
  const todayActions = auditLogs.filter(log => 
    new Date(log.created_at).toDateString() === new Date().toDateString()
  ).length;
  const uniqueActors = new Set(auditLogs.map(log => log.actor_id).filter(Boolean)).size;

  const formatMetaData = (meta: any) => {
    if (!meta || typeof meta !== 'object') return 'No details';
    
    const entries = Object.entries(meta);
    if (entries.length === 0) return 'No details';
    
    return entries.slice(0, 3).map(([key, value]) => (
      <div key={key} className="text-sm">
        <span className="font-medium">{key.replace(/_/g, ' ')}:</span> {String(value)}
      </div>
    ));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-foreground">Audit Trail</h1>
          <p className="text-muted-foreground mt-1">Track all system activities and member actions</p>
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
              <p className="text-sm font-medium text-muted-foreground">Total Actions</p>
              <p className="text-2xl font-bold text-foreground mt-2">{totalActions}</p>
            </div>
            <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <ShieldCheckIcon className="h-6 w-6 text-primary" />
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
              <p className="text-sm font-medium text-muted-foreground">Today's Actions</p>
              <p className="text-2xl font-bold text-foreground mt-2">{todayActions}</p>
            </div>
            <div className="h-12 w-12 bg-success/10 rounded-lg flex items-center justify-center">
              <ClockIcon className="h-6 w-6 text-success" />
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
              <p className="text-sm font-medium text-muted-foreground">Active Users</p>
              <p className="text-2xl font-bold text-foreground mt-2">{uniqueActors}</p>
            </div>
            <div className="h-12 w-12 bg-accent/10 rounded-lg flex items-center justify-center">
              <UserIcon className="h-6 w-6 text-accent" />
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
              <p className="text-sm font-medium text-muted-foreground">Action Types</p>
              <p className="text-2xl font-bold text-foreground mt-2">{uniqueActions.length}</p>
            </div>
            <div className="h-12 w-12 bg-warning/10 rounded-lg flex items-center justify-center">
              <EyeIcon className="h-6 w-6 text-warning" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="flex flex-col lg:flex-row gap-4"
      >
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search audit logs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedAction('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              selectedAction === 'all'
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-muted'
            }`}
          >
            All Actions
          </button>
          {uniqueActions.slice(0, 4).map((action) => (
            <button
              key={action}
              onClick={() => setSelectedAction(action)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                selectedAction === action
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground hover:bg-muted'
              }`}
            >
              {actionLabels[action] || action}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Audit Logs List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="card-elevated overflow-hidden"
      >
        <div className="p-6 border-b border-border">
          <h3 className="text-lg font-semibold text-foreground">Recent Activity</h3>
        </div>
        <div className="divide-y divide-border">
          {filteredLogs.map((log, index) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 + index * 0.05 }}
              className="p-6 hover:bg-muted/20 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <ShieldCheckIcon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="text-sm font-medium text-foreground">
                        {actionLabels[log.action] || log.action}
                      </h4>
                      <Badge variant="outline" className={actionColors[log.action] || 'bg-gray-100 text-gray-800'}>
                        {log.action}
                      </Badge>
                    </div>
                    <div className="space-y-1 mb-3">
                      {formatMetaData(log.meta)}
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <span className="flex items-center space-x-1">
                        <UserIcon className="h-4 w-4" />
                        <span>{log.actor_name}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <ClockIcon className="h-4 w-4" />
                        <span>{new Date(log.created_at).toLocaleString()}</span>
                      </span>
                    </div>
                  </div>
                </div>
                <button className="p-2 hover:bg-secondary rounded-lg transition-colors">
                  <EyeIcon className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {filteredLogs.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <ShieldCheckIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No audit logs found</h3>
          <p className="text-muted-foreground">
            {searchTerm ? 'Try adjusting your search terms' : 'System activity will appear here'}
          </p>
        </motion.div>
      )}
    </div>
  );
}