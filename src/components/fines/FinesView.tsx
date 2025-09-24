import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  PlusIcon,
  ExclamationTriangleIcon,
  CalendarDaysIcon,
  CurrencyDollarIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import AddFineForm from './AddFineForm';
import { supabase } from '@/integrations/supabase/client';

// Sample fines data
const sampleFines = [
  {
    id: '1',
    fineNo: 'FN001',
    memberName: 'Grace Akinyi',
    memberNo: 'CH005',
    reason: 'Late contribution payment',
    amount: 500,
    dueDate: '2024-01-20',
    status: 'pending',
    dateIssued: '2024-01-10'
  },
  {
    id: '2',
    fineNo: 'FN002',
    memberName: 'Peter Mwangi',
    memberNo: 'CH004',
    reason: 'Missed meeting attendance',
    amount: 300,
    dueDate: '2024-01-15',
    status: 'paid',
    dateIssued: '2024-01-05'
  },
  {
    id: '3',
    fineNo: 'FN003',
    memberName: 'Mary Njoki',
    memberNo: 'CH003',
    reason: 'Late loan repayment',
    amount: 1000,
    dueDate: '2024-01-25',
    status: 'overdue',
    dateIssued: '2024-01-08'
  }
];

export default function FinesView() {
  const [filter, setFilter] = useState('all');
  const [isAddFineOpen, setIsAddFineOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [fines, setFines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFines();
    
    // Set up real-time subscription
    const channel = supabase
      .channel('fines-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'fines'
        },
        () => {
          fetchFines();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchFines = async () => {
    try {
      const { data, error } = await supabase
        .from('fines')
        .select('*, users!inner(first_name, last_name, member_no)')
        .order('fine_date', { ascending: false });

      if (error) throw error;

      const formattedFines = (data || []).map((fine: any) => ({
        id: fine.id,
        fineNo: `FN${fine.id.slice(-3)}`,
        memberName: `${fine.users.first_name} ${fine.users.last_name}`,
        memberNo: fine.users.member_no || 'N/A',
        reason: fine.reason,
        amount: fine.amount,
        dueDate: fine.fine_date,
        status: fine.status,
        dateIssued: fine.created_at
      }));

      setFines(formattedFines);
    } catch (error) {
      console.error('Error fetching fines:', error);
    } finally {
      setLoading(false);
    }
  };

  const activeFines = fines.length > 0 ? fines : sampleFines;
  const totalFines = activeFines.reduce((sum, fine) => sum + fine.amount, 0);
  const paidFines = activeFines.filter(fine => fine.status === 'paid').length;
  const pendingFines = activeFines.filter(fine => fine.status === 'pending').length;
  const overdueFines = activeFines.filter(fine => fine.status === 'overdue').length;

  const filteredFines = activeFines.filter(fine => 
    filter === 'all' || fine.status === filter
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-foreground">Fines & Penalties</h1>
          <p className="text-muted-foreground mt-1">Manage member fines and penalty tracking</p>
        </div>
        <Dialog open={isAddFineOpen} onOpenChange={setIsAddFineOpen}>
          <DialogTrigger asChild>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="btn-primary flex items-center space-x-2"
            >
              <PlusIcon className="h-5 w-5" />
              <span>Issue Fine</span>
            </motion.button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <AddFineForm 
              onSuccess={() => setRefreshKey(prev => prev + 1)} 
              onClose={() => setIsAddFineOpen(false)} 
            />
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card-elevated p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Fines</p>
              <p className="text-2xl font-bold text-foreground mt-2">KES {totalFines.toLocaleString()}</p>
            </div>
            <div className="h-12 w-12 bg-warning/10 rounded-lg flex items-center justify-center">
              <CurrencyDollarIcon className="h-6 w-6 text-warning" />
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
              <p className="text-sm font-medium text-muted-foreground">Paid</p>
              <p className="text-2xl font-bold text-success mt-2">{paidFines}</p>
            </div>
            <div className="h-12 w-12 bg-success/10 rounded-lg flex items-center justify-center">
              <CalendarDaysIcon className="h-6 w-6 text-success" />
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
              <p className="text-sm font-medium text-muted-foreground">Pending</p>
              <p className="text-2xl font-bold text-warning mt-2">{pendingFines}</p>
            </div>
            <div className="h-12 w-12 bg-warning/10 rounded-lg flex items-center justify-center">
              <ExclamationTriangleIcon className="h-6 w-6 text-warning" />
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
              <p className="text-sm font-medium text-muted-foreground">Overdue</p>
              <p className="text-2xl font-bold text-destructive mt-2">{overdueFines}</p>
            </div>
            <div className="h-12 w-12 bg-destructive/10 rounded-lg flex items-center justify-center">
              <ExclamationTriangleIcon className="h-6 w-6 text-destructive" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="flex items-center space-x-4"
      >
        <span className="text-sm font-medium text-foreground">Filter by status:</span>
        {['all', 'pending', 'paid', 'overdue'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              filter === status
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-muted'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </motion.div>

      {/* Fines Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="card-elevated overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/30">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Fine No.
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Member
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Reason
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Due Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredFines.map((fine, index) => (
                <motion.tr
                  key={fine.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 + index * 0.1 }}
                  className="hover:bg-muted/20 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-foreground">{fine.fineNo}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-foreground">{fine.memberName}</div>
                      <div className="text-sm text-muted-foreground">{fine.memberNo}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-foreground">{fine.reason}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-foreground">KES {fine.amount.toLocaleString()}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-foreground">{new Date(fine.dueDate).toLocaleDateString()}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      fine.status === 'paid' 
                        ? 'status-active' 
                        : fine.status === 'pending'
                        ? 'status-pending'
                        : 'status-overdue'
                    }`}>
                      {fine.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <button className="p-1 hover:bg-secondary rounded transition-colors">
                        <EyeIcon className="h-4 w-4 text-muted-foreground" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}