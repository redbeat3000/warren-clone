import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  PlusIcon,
  ChartBarIcon,
  CalendarDaysIcon,
  CurrencyDollarIcon,
  EyeIcon,
  CalculatorIcon,
  DocumentArrowDownIcon
} from '@heroicons/react/24/outline';

// Sample dividends data
const sampleDividends = [
  {
    id: '1',
    year: 2023,
    period: 'Annual',
    totalAmount: 180000,
    perShare: 45,
    shares: 4000,
    dateCalculated: '2023-12-31',
    dateDistributed: '2024-01-15',
    status: 'distributed'
  },
  {
    id: '2',
    year: 2024,
    period: 'Q1',
    totalAmount: 35000,
    perShare: 8.75,
    shares: 4000,
    dateCalculated: '2024-03-31',
    dateDistributed: '2024-04-10',
    status: 'distributed'
  },
  {
    id: '3',
    year: 2024,
    period: 'Q2',
    totalAmount: 42000,
    perShare: 10.50,
    shares: 4000,
    dateCalculated: '2024-06-30',
    dateDistributed: null,
    status: 'calculated'
  }
];

// Sample member dividends breakdown
const memberDividends = [
  {
    memberName: 'Alice Wanjiku',
    memberNo: 'CH001',
    shares: 1000,
    q1Dividend: 8750,
    q2Dividend: 10500,
    totalDividend: 19250
  },
  {
    memberName: 'John Kamau',
    memberNo: 'CH002',
    shares: 800,
    q1Dividend: 7000,
    q2Dividend: 8400,
    totalDividend: 15400
  },
  {
    memberName: 'Mary Njoki',
    memberNo: 'CH003',
    shares: 900,
    q1Dividend: 7875,
    q2Dividend: 9450,
    totalDividend: 17325
  },
  {
    memberName: 'Peter Mwangi',
    memberNo: 'CH004',
    shares: 700,
    q1Dividend: 6125,
    q2Dividend: 7350,
    totalDividend: 13475
  },
  {
    memberName: 'Grace Akinyi',
    memberNo: 'CH005',
    shares: 600,
    q1Dividend: 5250,
    q2Dividend: 6300,
    totalDividend: 11550
  }
];

export default function DividendsView() {
  const [activeTab, setActiveTab] = useState('overview');

  const totalDistributed = sampleDividends
    .filter(div => div.status === 'distributed')
    .reduce((sum, div) => sum + div.totalAmount, 0);
  
  const pendingDistribution = sampleDividends
    .filter(div => div.status === 'calculated')
    .reduce((sum, div) => sum + div.totalAmount, 0);

  const currentYearTotal = sampleDividends
    .filter(div => div.year === 2024)
    .reduce((sum, div) => sum + div.totalAmount, 0);

  const handleExportDividends = async () => {
    const { generateDividendsReportPDF } = await import('@/utils/pdfGenerator');
    generateDividendsReportPDF(sampleDividends, memberDividends);
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
          <h1 className="text-3xl font-bold text-foreground">Dividends</h1>
          <p className="text-muted-foreground mt-1">Calculate and distribute member dividends</p>
        </div>
        <div className="flex items-center space-x-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="btn-secondary flex items-center space-x-2"
            onClick={handleExportDividends}
          >
            <DocumentArrowDownIcon className="h-5 w-5" />
            <span>Export PDF</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="btn-secondary flex items-center space-x-2"
          >
            <CalculatorIcon className="h-5 w-5" />
            <span>Calculate Dividends</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="btn-primary flex items-center space-x-2"
          >
            <PlusIcon className="h-5 w-5" />
            <span>New Distribution</span>
          </motion.button>
        </div>
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
              <p className="text-sm font-medium text-muted-foreground">Total Distributed</p>
              <p className="text-2xl font-bold text-foreground mt-2">KES {totalDistributed.toLocaleString()}</p>
            </div>
            <div className="h-12 w-12 bg-success/10 rounded-lg flex items-center justify-center">
              <ChartBarIcon className="h-6 w-6 text-success" />
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
              <p className="text-sm font-medium text-muted-foreground">Pending Distribution</p>
              <p className="text-2xl font-bold text-warning mt-2">KES {pendingDistribution.toLocaleString()}</p>
            </div>
            <div className="h-12 w-12 bg-warning/10 rounded-lg flex items-center justify-center">
              <CurrencyDollarIcon className="h-6 w-6 text-warning" />
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
              <p className="text-sm font-medium text-muted-foreground">Current Year</p>
              <p className="text-2xl font-bold text-primary mt-2">KES {currentYearTotal.toLocaleString()}</p>
            </div>
            <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <CalendarDaysIcon className="h-6 w-6 text-primary" />
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
              <p className="text-sm font-medium text-muted-foreground">Average Per Share</p>
              <p className="text-2xl font-bold text-accent mt-2">KES 19.25</p>
            </div>
            <div className="h-12 w-12 bg-accent/10 rounded-lg flex items-center justify-center">
              <CalculatorIcon className="h-6 w-6 text-accent" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="border-b border-border"
      >
        <nav className="flex space-x-8">
          {[
            { id: 'overview', name: 'Dividend History' },
            { id: 'members', name: 'Member Breakdown' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.name}
            </button>
          ))}
        </nav>
      </motion.div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
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
                    Period
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Total Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Per Share
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Total Shares
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Distribution Date
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
                {sampleDividends.map((dividend, index) => (
                  <motion.tr
                    key={dividend.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 + index * 0.1 }}
                    className="hover:bg-muted/20 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-foreground">{dividend.year} {dividend.period}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-foreground">KES {dividend.totalAmount.toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-foreground">KES {dividend.perShare}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-foreground">{dividend.shares.toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-foreground">
                        {dividend.dateDistributed ? new Date(dividend.dateDistributed).toLocaleDateString() : 'Pending'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        dividend.status === 'distributed' 
                          ? 'status-active' 
                          : 'status-pending'
                      }`}>
                        {dividend.status}
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
      )}

      {activeTab === 'members' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="card-elevated overflow-hidden"
        >
          <div className="p-6 border-b border-border">
            <h3 className="text-lg font-semibold text-foreground">2024 Dividend Breakdown by Member</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/30">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Member
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Shares
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Q1 Dividend
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Q2 Dividend
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Total 2024
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {memberDividends.map((member, index) => (
                  <motion.tr
                    key={member.memberNo}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 + index * 0.1 }}
                    className="hover:bg-muted/20 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-foreground">{member.memberName}</div>
                        <div className="text-sm text-muted-foreground">{member.memberNo}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-foreground">{member.shares}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-foreground">KES {member.q1Dividend.toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-foreground">KES {member.q2Dividend.toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-primary">KES {member.totalDividend.toLocaleString()}</div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </div>
  );
}