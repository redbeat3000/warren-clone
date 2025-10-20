import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  UsersIcon, 
  BanknotesIcon, 
  CurrencyDollarIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ExclamationTriangleIcon,
  CogIcon
} from '@heroicons/react/24/outline';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useSupabaseQuery, useSupabaseStats } from '@/hooks/useSupabaseQuery';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';



interface StatCardProps {
  stat: {
    name: string;
    value: string;
    change: string;
    changeType: string;
    icon: any;
  };
  index: number;
}

function StatCard({ stat, index }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="card-elevated p-6 hover:shadow-lg transition-all duration-200"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{stat.name}</p>
          <p className="text-2xl font-bold text-foreground mt-2">{stat.value}</p>
          <div className="flex items-center mt-2">
            <ArrowTrendingUpIcon className="h-4 w-4 text-success mr-1" />
            <span className="text-sm text-success font-medium">{stat.change}</span>
          </div>
        </div>
        <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
          <stat.icon className="h-6 w-6 text-primary" />
        </div>
      </div>
    </motion.div>
  );
}

export default function DashboardOverview() {
  const stats = useSupabaseStats();
  const { authUser, isAdmin } = useAuth();
  const [showAllActivity, setShowAllActivity] = useState(false);
  
  const { data: contributions, loading: contributionsLoading } = useSupabaseQuery(
    'contributions', 
    'amount, contribution_date', 
    []
  );
  const { data: loans } = useSupabaseQuery('loans', 'status, issue_date, principal', []);
  const { data: loanInterest } = useSupabaseQuery('loan_repayments', 'interest_portion', []);
  const { data: fines } = useSupabaseQuery('fines', 'paid_amount', []);
  const { data: allContributions } = useSupabaseQuery('contributions', 'amount, contribution_type', []);
  const { data: recentActivity } = useSupabaseQuery(
    'contributions', 
    '*, users!inner(first_name, last_name)', 
    []
  );

  // Sample data for demonstration when database is empty
  const sampleContributions = [
    { amount: 5000, contribution_date: '2024-01-15' },
    { amount: 4500, contribution_date: '2024-02-15' },
    { amount: 5500, contribution_date: '2024-03-15' },
    { amount: 5200, contribution_date: '2024-04-15' },
    { amount: 4800, contribution_date: '2024-05-15' },
    { amount: 5300, contribution_date: '2024-06-15' }
  ];

  // Calculate Available Cash: Loan Interest + Registration Fees + Fines (not principal or expenses)
  const availableCashCalculated = React.useMemo(() => {
    const totalLoanInterest = (loanInterest || []).reduce((sum, r: any) => sum + parseFloat(r.interest_portion || 0), 0);
    const totalFines = (fines || []).reduce((sum, f: any) => sum + parseFloat(f.paid_amount || 0), 0);
    const registrationFees = (allContributions || []).filter((c: any) => c.contribution_type === 'registration_fee');
    const totalRegFees = registrationFees.reduce((sum, c: any) => sum + parseFloat(c.amount || 0), 0);
    return totalLoanInterest + totalFines + totalRegFees;
  }, [loanInterest, fines, allContributions]);

  const sampleLoans = [
    { status: 'active', issue_date: '2023-11-01', principal: 50000 },
    { status: 'active', issue_date: '2023-12-15', principal: 30000 },
    { status: 'overdue', issue_date: '2024-01-01', principal: 25000 },
    { status: 'pending', issue_date: '2024-01-15', principal: 40000 }
  ];

  const sampleActivity = [
    { 
      amount: 5000, 
      contribution_date: '2024-01-15',
      users: { first_name: 'Alice', last_name: 'Wanjiku' }
    },
    { 
      amount: 5000, 
      contribution_date: '2024-01-14',
      users: { first_name: 'John', last_name: 'Kamau' }
    },
    { 
      amount: 5000, 
      contribution_date: '2024-01-13',
      users: { first_name: 'Mary', last_name: 'Njoki' }
    }
  ];

  // Use sample data when database is empty
  const activeContributions = contributions.length > 0 ? contributions : sampleContributions;
  const activeLoans = loans.length > 0 ? loans : sampleLoans;
  const activeActivity = recentActivity.length > 0 ? recentActivity : sampleActivity;

  // Process monthly contributions
  const monthlyContributions = React.useMemo(() => {
    if (!activeContributions.length) return [];
    
    const monthlyData: { [key: string]: number } = {};
    activeContributions.forEach((c: any) => {
      const month = new Date(c.contribution_date).toLocaleDateString('en', { month: 'short' });
      monthlyData[month] = (monthlyData[month] || 0) + parseFloat(c.amount || 0);
    });
    
    return Object.entries(monthlyData).map(([month, amount]) => ({ month, amount }));
  }, [activeContributions]);

  // Process loans over time for line chart
  const loansOverTime = React.useMemo(() => {
    if (!activeLoans.length) return [];
    
    const monthlyData: { [key: string]: number } = {};
    activeLoans.forEach((loan: any) => {
      const month = new Date(loan.issue_date).toLocaleDateString('en', { month: 'short', year: '2-digit' });
      monthlyData[month] = (monthlyData[month] || 0) + 1;
    });
    
    return Object.entries(monthlyData).map(([month, count]) => ({ month, count }));
  }, [activeLoans]);

  // Process loan distribution
  const loanDistribution = React.useMemo(() => {
    const statusCounts = activeLoans.reduce((acc: any, loan: any) => {
      acc[loan.status] = (acc[loan.status] || 0) + 1;
      return acc;
    }, {});
    
    return [
      { name: 'Active', value: statusCounts.active || 0, color: '#22C55E' },
      { name: 'Overdue', value: statusCounts.overdue || 0, color: '#EF4444' },
      { name: 'Pending', value: statusCounts.pending || 0, color: '#F59E0B' },
    ];
  }, [activeLoans]);

  const dashboardStats = [
    {
      name: 'Total Members',
      value: stats.totalMembers.toString(),
      change: '+5',
      changeType: 'increase',
      icon: UsersIcon,
    },
    {
      name: 'Active Loans',
      value: stats.activeLoans.toString(),
      change: '+2',
      changeType: 'increase',
      icon: BanknotesIcon,
    },
    {
      name: 'Available Cash',
      value: `KES ${availableCashCalculated.toLocaleString()}`,
      change: '+12%',
      changeType: 'increase',
      icon: CurrencyDollarIcon,
    },
    {
      name: 'Total Contributions',
      value: `KES ${stats.totalContributions.toLocaleString()}`,
      change: '+3%',
      changeType: 'increase',
      icon: ChartBarIcon,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back! Here's what's happening with Kamandoto SHG.
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => window.dispatchEvent(new CustomEvent('navigate-to-section', { detail: 'settings' }))}
          className="btn-primary flex items-center gap-2"
        >
          <CogIcon className="h-4 w-4" />
          Settings
        </motion.button>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {dashboardStats.map((stat, index) => (
          <StatCard key={stat.name} stat={stat} index={index} />
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Monthly Contributions Trend */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="card-elevated p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-foreground">Monthly Contributions</h3>
            <div className="flex items-center space-x-2">
              <div className="h-3 w-3 bg-primary rounded-full"></div>
              <span className="text-sm text-muted-foreground">Contributions</span>
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyContributions}>
                <defs>
                  <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22C55E" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#22C55E" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="month" stroke="#6B7280" />
                <YAxis stroke="#6B7280" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="#22C55E" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorAmount)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Loans Issued Over Time */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
          className="card-elevated p-6"
        >
          <h3 className="text-lg font-semibold text-foreground mb-6">Loans Issued Over Time</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={loansOverTime}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="month" stroke="#6B7280" />
                <YAxis stroke="#6B7280" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#3B82F6" 
                  strokeWidth={3}
                  dot={{ fill: '#3B82F6', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="card-elevated p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-foreground">Recent Activity</h3>
          <Dialog open={showAllActivity} onOpenChange={setShowAllActivity}>
            <DialogTrigger asChild>
              <button className="text-primary hover:text-primary-hover text-sm font-medium">
                View All
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>All Recent Activity</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                {activeActivity.map((activity: any, index: number) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center justify-between py-3 border-b border-border last:border-0"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="h-2 w-2 rounded-full bg-success"></div>
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {activity.users?.first_name} {activity.users?.last_name}
                        </p>
                        <p className="text-xs text-muted-foreground">Contribution</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-foreground">KES {parseFloat(activity.amount || 0).toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(activity.contribution_date).toLocaleDateString()}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <div className="space-y-4">
          {activeActivity.slice(0, 3).map((activity: any, index: number) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 + index * 0.1 }}
              className="flex items-center justify-between py-3 border-b border-border last:border-0"
            >
              <div className="flex items-center space-x-3">
                <div className="h-2 w-2 rounded-full bg-success"></div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {activity.users?.first_name} {activity.users?.last_name}
                  </p>
                  <p className="text-xs text-muted-foreground">Contribution</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-foreground">KES {parseFloat(activity.amount || 0).toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(activity.contribution_date).toLocaleDateString()}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}