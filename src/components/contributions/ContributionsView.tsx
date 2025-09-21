import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  PlusIcon,
  CurrencyDollarIcon,
  CalendarDaysIcon,
  DocumentArrowDownIcon,
  EyeIcon,
  PrinterIcon
} from '@heroicons/react/24/outline';

// Sample contributions data
const sampleContributions = [
  {
    id: '1',
    receiptNo: 'REC001',
    memberName: 'Alice Wanjiku',
    memberNo: 'CH001',
    amount: 5000,
    date: '2024-01-15',
    paymentMethod: 'M-Pesa',
    status: 'confirmed'
  },
  {
    id: '2',
    receiptNo: 'REC002',
    memberName: 'John Kamau',
    memberNo: 'CH002',
    amount: 5000,
    date: '2024-01-15',
    paymentMethod: 'Bank Transfer',
    status: 'confirmed'
  },
  {
    id: '3',
    receiptNo: 'REC003',
    memberName: 'Mary Njoki',
    memberNo: 'CH003',
    amount: 5000,
    date: '2024-01-14',
    paymentMethod: 'Cash',
    status: 'pending'
  },
  {
    id: '4',
    receiptNo: 'REC004',
    memberName: 'Peter Mwangi',
    memberNo: 'CH004',
    amount: 7500,
    date: '2024-01-13',
    paymentMethod: 'M-Pesa',
    status: 'confirmed'
  }
];

export default function ContributionsView() {
  const [filter, setFilter] = useState('all');

  const totalContributions = sampleContributions.reduce((sum, contrib) => sum + contrib.amount, 0);
  const monthlyTarget = 50000;
  const targetProgress = (totalContributions / monthlyTarget) * 100;

  const filteredContributions = sampleContributions.filter(contrib => 
    filter === 'all' || contrib.status === filter
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
          <h1 className="text-3xl font-bold text-foreground">Contributions</h1>
          <p className="text-muted-foreground mt-1">Track member contributions and generate receipts</p>
        </div>
        <div className="flex items-center space-x-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="btn-secondary flex items-center space-x-2"
          >
            <DocumentArrowDownIcon className="h-5 w-5" />
            <span>Import CSV</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="btn-primary flex items-center space-x-2"
          >
            <PlusIcon className="h-5 w-5" />
            <span>Record Contribution</span>
          </motion.button>
        </div>
      </motion.div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card-elevated p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">This Month</p>
              <p className="text-2xl font-bold text-foreground mt-2">KES {totalContributions.toLocaleString()}</p>
              <div className="flex items-center mt-3">
                <div className="w-full bg-muted rounded-full h-2 mr-3">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(targetProgress, 100)}%` }}
                  ></div>
                </div>
                <span className="text-sm text-muted-foreground">{targetProgress.toFixed(0)}%</span>
              </div>
            </div>
            <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <CurrencyDollarIcon className="h-6 w-6 text-primary" />
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
              <p className="text-sm font-medium text-muted-foreground">Contributors</p>
              <p className="text-2xl font-bold text-foreground mt-2">{sampleContributions.length}</p>
              <p className="text-sm text-success mt-2">4 members contributed</p>
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
              <p className="text-sm font-medium text-muted-foreground">Average</p>
              <p className="text-2xl font-bold text-foreground mt-2">
                KES {Math.round(totalContributions / sampleContributions.length).toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground mt-2">Per contribution</p>
            </div>
            <div className="h-12 w-12 bg-accent/10 rounded-lg flex items-center justify-center">
              <CurrencyDollarIcon className="h-6 w-6 text-accent" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="flex items-center space-x-4"
      >
        <span className="text-sm font-medium text-foreground">Filter by status:</span>
        {['all', 'confirmed', 'pending'].map((status) => (
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

      {/* Contributions Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="card-elevated overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/30">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Receipt
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Member
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Method
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
              {filteredContributions.map((contribution, index) => (
                <motion.tr
                  key={contribution.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                  className="hover:bg-muted/20 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-foreground">{contribution.receiptNo}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-foreground">{contribution.memberName}</div>
                      <div className="text-sm text-muted-foreground">{contribution.memberNo}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-foreground">KES {contribution.amount.toLocaleString()}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-foreground">{new Date(contribution.date).toLocaleDateString()}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-foreground">{contribution.paymentMethod}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      contribution.status === 'confirmed' 
                        ? 'status-active' 
                        : 'status-pending'
                    }`}>
                      {contribution.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <button className="p-1 hover:bg-secondary rounded transition-colors">
                        <EyeIcon className="h-4 w-4 text-muted-foreground" />
                      </button>
                      <button className="p-1 hover:bg-secondary rounded transition-colors">
                        <PrinterIcon className="h-4 w-4 text-muted-foreground" />
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