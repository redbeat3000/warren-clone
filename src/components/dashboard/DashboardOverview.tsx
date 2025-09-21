import React from 'react';
import { motion } from 'framer-motion';
import { 
  UsersIcon, 
  BanknotesIcon, 
  CurrencyDollarIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

// Sample data - will be replaced with real data from API
const monthlyContributions = [
  { month: 'Jan', amount: 45000 },
  { month: 'Feb', amount: 52000 },
  { month: 'Mar', amount: 48000 },
  { month: 'Apr', amount: 61000 },
  { month: 'May', amount: 58000 },
  { month: 'Jun', amount: 67000 },
];

const loanDistribution = [
  { name: 'Active', value: 12, color: '#22C55E' },
  { name: 'Overdue', value: 3, color: '#EF4444' },
  { name: 'Pending', value: 2, color: '#F59E0B' },
];

const stats = [
  {
    name: 'Total Members',
    value: '127',
    change: '+5',
    changeType: 'increase',
    icon: UsersIcon,
  },
  {
    name: 'Active Loans',
    value: '17',
    change: '+2',
    changeType: 'increase',
    icon: BanknotesIcon,
  },
  {
    name: 'Available Cash',
    value: 'KES 245,000',
    change: '+12%',
    changeType: 'increase',
    icon: CurrencyDollarIcon,
  },
  {
    name: 'Monthly Target',
    value: '87%',
    change: '+3%',
    changeType: 'increase',
    icon: ChartBarIcon,
  },
];

interface StatCardProps {
  stat: typeof stats[0];
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
          <p className="text-muted-foreground mt-1">Welcome back! Here's what's happening with your Chama.</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="btn-primary"
        >
          Quick Actions
        </motion.button>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
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

        {/* Loan Distribution */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
          className="card-elevated p-6"
        >
          <h3 className="text-lg font-semibold text-foreground mb-6">Loan Status Distribution</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={loanDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {loanDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center space-x-6 mt-4">
            {loanDistribution.map((item) => (
              <div key={item.name} className="flex items-center space-x-2">
                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                <span className="text-sm text-muted-foreground">{item.name} ({item.value})</span>
              </div>
            ))}
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
          <button className="text-primary hover:text-primary-hover text-sm font-medium">
            View All
          </button>
        </div>
        <div className="space-y-4">
          {[
            { type: 'contribution', member: 'Alice Wanjiku', amount: 'KES 5,000', time: '2 hours ago' },
            { type: 'loan', member: 'John Kamau', amount: 'KES 15,000', time: '4 hours ago' },
            { type: 'payment', member: 'Mary Njoki', amount: 'KES 2,500', time: '1 day ago' },
          ].map((activity, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 + index * 0.1 }}
              className="flex items-center justify-between py-3 border-b border-border last:border-0"
            >
              <div className="flex items-center space-x-3">
                <div className={`h-2 w-2 rounded-full ${
                  activity.type === 'contribution' ? 'bg-success' :
                  activity.type === 'loan' ? 'bg-warning' : 'bg-primary'
                }`}></div>
                <div>
                  <p className="text-sm font-medium text-foreground">{activity.member}</p>
                  <p className="text-xs text-muted-foreground capitalize">{activity.type}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-foreground">{activity.amount}</p>
                <p className="text-xs text-muted-foreground">{activity.time}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}