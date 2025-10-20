import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  DocumentTextIcon,
  ChartBarIcon,
  CalendarDaysIcon,
  ArrowDownTrayIcon,
  EyeIcon,
  PrinterIcon
} from '@heroicons/react/24/outline';
import { useFinancialData } from '@/hooks/useFinancialData';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// Sample reports data
const availableReports = [
  {
    id: '1',
    name: 'Monthly Financial Statement',
    description: 'Comprehensive financial overview including contributions, loans, and expenses',
    category: 'Financial',
    frequency: 'Monthly',
    lastGenerated: '2024-01-31',
    format: 'PDF',
    icon: ChartBarIcon
  },
  {
    id: '2',
    name: 'Member Contribution Summary',
    description: 'Individual member contribution history and totals',
    category: 'Members',
    frequency: 'On-demand',
    lastGenerated: '2024-01-28',
    format: 'Excel',
    icon: DocumentTextIcon
  },
  {
    id: '3',
    name: 'Loan Portfolio Report',
    description: 'Active loans, repayment schedules, and overdue accounts',
    category: 'Loans',
    frequency: 'Weekly',
    lastGenerated: '2024-01-29',
    format: 'PDF',
    icon: ChartBarIcon
  },
  {
    id: '4',
    name: 'Cash Flow Statement',
    description: 'Money in and out, including all transactions and balances',
    category: 'Financial',
    frequency: 'Monthly',
    lastGenerated: '2024-01-30',
    format: 'PDF',
    icon: DocumentTextIcon
  },
  {
    id: '5',
    name: 'Dividend Distribution Report',
    description: 'Dividend calculations and member allocations',
    category: 'Dividends',
    frequency: 'Quarterly',
    lastGenerated: '2024-01-15',
    format: 'Excel',
    icon: ChartBarIcon
  },
  {
    id: '6',
    name: 'Fines & Penalties Report',
    description: 'Outstanding fines, payment history, and penalty tracking',
    category: 'Fines',
    frequency: 'On-demand',
    lastGenerated: '2024-01-25',
    format: 'PDF',
    icon: DocumentTextIcon
  }
];

const reportCategories = ['All', 'Financial', 'Members', 'Loans', 'Dividends', 'Fines'];

export default function ReportsView() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const { summary, loading, exportToPDF, generateReport } = useFinancialData();

  const filteredReports = availableReports.filter(report => 
    selectedCategory === 'All' || report.category === selectedCategory
  );

  const handleGenerateReport = async (reportId: string) => {
    if (!summary) return;

    try {
      const { supabase } = await import('@/integrations/supabase/client');
      const selectedDate = new Date(selectedMonth);
      const startDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1).toISOString();
      const endDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0, 23, 59, 59).toISOString();

      switch (reportId) {
        case '1': // Monthly Financial Statement
          const financialData = [
            { metric: 'Total Contributions', amount: summary.totalContributions },
            { metric: 'Total Loans', amount: summary.totalLoans },
            { metric: 'Total Expenses', amount: summary.totalExpenses },
            { metric: 'Available Cash', amount: summary.availableCash }
          ];
          exportToPDF(financialData, `financial-statement-${selectedMonth}`);
          break;
        
        case '2': // Member Contribution Summary
          const { data: contributions } = await supabase
            .from('contributions')
            .select('*, users!inner(first_name, last_name, member_no)')
            .gte('contribution_date', startDate)
            .lte('contribution_date', endDate);
          
          if (contributions) {
            const { generateContributionsPDF } = await import('@/utils/pdfGenerator');
            const formattedContribs = contributions.map((c: any) => ({
              receiptNo: c.receipt_no || 'N/A',
              memberName: `${c.users.first_name} ${c.users.last_name}`,
              memberNo: c.users.member_no,
              amount: parseFloat(c.amount),
              date: c.contribution_date,
              paymentMethod: c.payment_method || 'Cash',
              status: 'Paid'
            }));
            generateContributionsPDF(formattedContribs);
          }
          break;
          
        case '3': // Loan Portfolio Report
          const { data: loans } = await supabase
            .from('loans')
            .select('*, users!inner(first_name, last_name, member_no)')
            .gte('issue_date', startDate)
            .lte('issue_date', endDate);
          
          if (loans) {
            const { generateLoansReportPDF } = await import('@/utils/pdfGenerator');
            const formattedLoans = loans.map((l: any) => ({
              loanNo: `L${l.id.slice(0, 8)}`,
              memberName: `${l.users.first_name} ${l.users.last_name}`,
              principal: parseFloat(l.principal),
              balance: parseFloat(l.principal), // TODO: Calculate actual balance
              interestRate: l.interest_rate,
              term: l.term_months,
              status: l.status
            }));
            generateLoansReportPDF(formattedLoans);
          }
          break;
          
        case '4': // Cash Flow Statement
          exportToPDF(summary.memberBalances, `cash-flow-${selectedMonth}`);
          break;
          
        case '5': // Dividend Distribution Report
          const { data: dividends } = await supabase
            .from('dividends')
            .select('*')
            .gte('created_at', startDate)
            .lte('created_at', endDate);
          
          if (dividends && dividends.length > 0) {
            const { generateDividendsReportPDF } = await import('@/utils/pdfGenerator');
            const formattedDividends = dividends.map((d: any) => ({
              year: new Date(d.created_at).getFullYear(),
              period: d.period,
              totalAmount: parseFloat(d.allocation_amount || 0),
              perShare: 0,
              shares: 0,
              dateDistributed: d.payout_date,
              status: d.payout_date ? 'distributed' : 'calculated'
            }));
            generateDividendsReportPDF(formattedDividends, []);
          }
          break;
          
        case '6': // Fines & Penalties Report
          const { data: fines } = await supabase
            .from('fines')
            .select('*, users!inner(first_name, last_name, member_no)')
            .gte('fine_date', startDate)
            .lte('fine_date', endDate);
          
          if (fines) {
            const { generateFinesReportPDF } = await import('@/utils/pdfGenerator');
            const formattedFines = fines.map((f: any) => ({
              fineNo: `F${f.id.slice(0, 8)}`,
              memberName: `${f.users.first_name} ${f.users.last_name}`,
              reason: f.reason || 'N/A',
              amount: parseFloat(f.amount),
              dueDate: f.fine_date,
              status: f.status
            }));
            generateFinesReportPDF(formattedFines);
          }
          break;
      }
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Error generating report. Please try again.');
    }
  };

  const recentReports = availableReports
    .sort((a, b) => new Date(b.lastGenerated).getTime() - new Date(a.lastGenerated).getTime())
    .slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-foreground">Reports & Analytics</h1>
          <p className="text-muted-foreground mt-1">Generate comprehensive reports for Kamandoto SHG</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="btn-primary flex items-center space-x-2"
        >
          <DocumentTextIcon className="h-5 w-5" />
          <span>Custom Report</span>
        </motion.button>
      </motion.div>

      {/* Live Financial Data */}
      {summary && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="card-elevated p-6"
        >
          <h3 className="text-lg font-semibold text-foreground mb-4">Live Financial Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Total Contributions</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-green-600">KES {summary.totalContributions.toLocaleString()}</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Active Loans</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-blue-600">KES {summary.totalLoans.toLocaleString()}</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Total Expenses</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-red-600">KES {summary.totalExpenses.toLocaleString()}</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Available Cash</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-primary">KES {summary.availableCash.toLocaleString()}</p>
              </CardContent>
            </Card>
          </div>
          
          <div className="flex justify-end space-x-2 mt-4">
            <Button onClick={() => handleGenerateReport('financial-summary')} variant="outline">
              Export Financial Summary (PDF)
            </Button>
            <Button onClick={() => handleGenerateReport('member-balances')}>
              Export Member Balances (PDF)
            </Button>
          </div>
        </motion.div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card-elevated p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Available Reports</p>
              <p className="text-2xl font-bold text-foreground mt-2">{availableReports.length}</p>
            </div>
            <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <DocumentTextIcon className="h-6 w-6 text-primary" />
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
              <p className="text-sm font-medium text-muted-foreground">This Month</p>
              <p className="text-2xl font-bold text-foreground mt-2">12</p>
              <p className="text-sm text-success mt-1">Reports generated</p>
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
              <p className="text-sm font-medium text-muted-foreground">Automated</p>
              <p className="text-2xl font-bold text-foreground mt-2">4</p>
              <p className="text-sm text-accent mt-1">Scheduled reports</p>
            </div>
            <div className="h-12 w-12 bg-accent/10 rounded-lg flex items-center justify-center">
              <ChartBarIcon className="h-6 w-6 text-accent" />
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
              <p className="text-sm font-medium text-muted-foreground">Downloads</p>
              <p className="text-2xl font-bold text-foreground mt-2">47</p>
              <p className="text-sm text-muted-foreground mt-1">This month</p>
            </div>
            <div className="h-12 w-12 bg-warning/10 rounded-lg flex items-center justify-center">
              <ArrowDownTrayIcon className="h-6 w-6 text-warning" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Recent Reports */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="card-elevated p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-foreground">Recently Generated</h3>
          <button className="text-primary hover:text-primary-hover text-sm font-medium">
            View All
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {recentReports.map((report, index) => (
            <motion.div
              key={report.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 + index * 0.1 }}
              className="p-4 bg-muted/30 rounded-lg border hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-foreground">{report.name}</h4>
                  <p className="text-sm text-muted-foreground mt-1">{report.category}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Generated: {new Date(report.lastGenerated).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <button className="p-1 hover:bg-secondary rounded transition-colors">
                    <EyeIcon className="h-4 w-4 text-muted-foreground" />
                  </button>
                  <button className="p-1 hover:bg-secondary rounded transition-colors">
                    <ArrowDownTrayIcon className="h-4 w-4 text-muted-foreground" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Category Filters & Month Selection */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="space-y-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-foreground">Filter by category:</span>
            {reportCategories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  selectedCategory === category
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground hover:bg-muted'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
          
          <div className="flex items-center space-x-2">
            <CalendarDaysIcon className="h-5 w-5 text-muted-foreground" />
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              max={new Date().toISOString().slice(0, 7)}
              className="px-3 py-2 border border-input-border rounded-lg bg-input text-sm focus:outline-none focus:ring-2 focus:ring-accent-border"
            />
            <span className="text-sm text-muted-foreground">Report Period</span>
          </div>
        </div>
      </motion.div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredReports.map((report, index) => (
          <motion.div
            key={report.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 + index * 0.1 }}
            className="card-elevated p-6 hover:shadow-lg transition-all duration-200"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <report.icon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-foreground">{report.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{report.description}</p>
                </div>
              </div>
            </div>
            
            <div className="mt-4 flex items-center justify-between text-sm">
              <div>
                <span className="text-muted-foreground">Frequency: </span>
                <span className="text-foreground font-medium">{report.frequency}</span>
              </div>
              <div className="text-right">
                <span className="text-muted-foreground">Format: </span>
                <span className="text-foreground font-medium">{report.format}</span>
              </div>
            </div>
            
            <div className="mt-4 text-xs text-muted-foreground">
              Last generated: {new Date(report.lastGenerated).toLocaleDateString()}
            </div>
            
            <div className="mt-4 flex items-center space-x-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="btn-primary flex-1 text-sm"
                onClick={() => handleGenerateReport(report.id)}
              >
                Generate
              </motion.button>
              <button className="p-2 hover:bg-secondary rounded-lg transition-colors">
                <EyeIcon className="h-4 w-4 text-muted-foreground" />
              </button>
              <button 
                className="p-2 hover:bg-secondary rounded-lg transition-colors"
                onClick={() => handleGenerateReport('print-report')}
                title="Print Report"
              >
                <PrinterIcon className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}