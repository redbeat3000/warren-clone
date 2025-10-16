import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { 
  PlusIcon,
  ChartBarIcon,
  CalendarDaysIcon,
  CurrencyDollarIcon,
  EyeIcon,
  CalculatorIcon,
  DocumentArrowDownIcon,
  ArrowTrendingUpIcon,
  BanknotesIcon,
  UserGroupIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import DividendCalculator from './DividendCalculator';
import DividendDistributionForm from './DividendDistributionForm';
export default function DividendsView() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [calculations, setCalculations] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [incomeExpenseData, setIncomeExpenseData] = useState({
    currentYearIncome: 0,
    currentYearExpenses: 0,
    currentYearNet: 0
  });
  const [loading, setLoading] = useState(true);
  const [showCalculator, setShowCalculator] = useState(false);
  const [selectedCalculation, setSelectedCalculation] = useState(null);

  useEffect(() => {
    fetchDividendData();
    fetchCurrentYearData();
  }, []);

  const fetchDividendData = async () => {
    try {
      setLoading(true);
      
      const [{ data: calcs }, { data: allocs }] = await Promise.all([
        supabase
          .from('dividends_fund_calculations')
          .select('*')
          .order('fiscal_year', { ascending: false }),
        supabase
          .from('dividend_allocations')
          .select('*, users(first_name, last_name, member_no), dividends_fund_calculations(fiscal_year, status)')
          .order('allocated_amount', { ascending: false })
      ]);

      setCalculations(calcs || []);
      setAllocations(allocs || []);
    } catch (error) {
      console.error('Error fetching dividend data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentYearData = async () => {
    const currentYear = new Date().getFullYear();
    
    try {
      const [{ data: incomeData }, { data: expenseData }] = await Promise.all([
        supabase
          .from('yearly_income_summary')
          .select('total_amount')
          .eq('fiscal_year', currentYear)
          .eq('affects_dividends', true),
        supabase
          .from('expenses')
          .select('amount')
          .eq('fiscal_year', currentYear)
          .eq('affects_dividends', true)
      ]);

      const totalIncome = incomeData?.reduce((sum, item) => sum + item.total_amount, 0) || 0;
      const totalExpenses = expenseData?.reduce((sum, expense) => sum + Number(expense.amount), 0) || 0;
      const netProfit = Math.max(0, totalIncome - totalExpenses);

      setIncomeExpenseData({
        currentYearIncome: totalIncome,
        currentYearExpenses: totalExpenses,
        currentYearNet: netProfit
      });
    } catch (error) {
      console.error('Error fetching current year data:', error);
    }
  };

  const totalDistributed = calculations
    .filter(c => c.status === 'distributed')
    .reduce((sum, c) => sum + Number(c.total_dividends_fund), 0);
  
  const pendingDistribution = calculations
    .filter(c => c.status === 'approved')
    .reduce((sum, c) => sum + Number(c.total_dividends_fund), 0);

  const currentYearCalc = calculations.find(c => c.fiscal_year === new Date().getFullYear());
  const currentYearTotal = currentYearCalc?.total_dividends_fund || 0;

  const handleExportDividends = async () => {
    try {
      const { generateDividendsReportPDF } = await import('@/utils/pdfGenerator');
      generateDividendsReportPDF(calculations, allocations);
    } catch (error) {
      console.error('Failed to export dividends report:', error);
    }
  };

  const handleCalculationComplete = () => {
    setShowCalculator(false);
    fetchDividendData();
    fetchCurrentYearData();
  };

  const handleDistributionComplete = () => {
    setSelectedCalculation(null);
    fetchDividendData();
    fetchCurrentYearData();
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      draft: { variant: 'secondary', label: 'Draft' },
      under_review: { variant: 'outline', label: 'Under Review' },
      approved: { variant: 'default', label: 'Approved' },
      distributed: { variant: 'success', label: 'Distributed' },
      cancelled: { variant: 'destructive', label: 'Cancelled' }
    };
    
    const config = statusConfig[status] || statusConfig.draft;
    return <Badge variant={config.variant}>{config.label}</Badge>;
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
          <h1 className="text-3xl font-bold text-foreground">Dividends & Profit Sharing</h1>
          <p className="text-muted-foreground mt-1">Calculate and distribute member dividends based on net profit</p>
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
            className="btn-primary flex items-center space-x-2"
            onClick={() => setShowCalculator(true)}
          >
            <CalculatorIcon className="h-5 w-5" />
            <span>Calculate Dividends</span>
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
              <p className="text-sm font-medium text-muted-foreground">Current Year Income</p>
              <p className="text-2xl font-bold text-green-600 mt-2">KES {incomeExpenseData.currentYearIncome.toLocaleString()}</p>
            </div>
            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
              <ArrowTrendingUpIcon className="h-6 w-6 text-green-600" />
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
              <p className="text-sm font-medium text-muted-foreground">Current Year Expenses</p>
              <p className="text-2xl font-bold text-red-600 mt-2">KES {incomeExpenseData.currentYearExpenses.toLocaleString()}</p>
            </div>
            <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center">
              <ChartBarIcon className="h-6 w-6 text-red-600" />
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
              <p className="text-sm font-medium text-muted-foreground">Available for Dividends</p>
              <p className="text-2xl font-bold text-primary mt-2">KES {incomeExpenseData.currentYearNet.toLocaleString()}</p>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <BanknotesIcon className="h-6 w-6 text-primary" />
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
              <p className="text-sm font-medium text-muted-foreground">Total Distributed</p>
              <p className="text-2xl font-bold text-purple-600 mt-2">KES {totalDistributed.toLocaleString()}</p>
            </div>
            <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <CurrencyDollarIcon className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Profit Calculation Breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-elevated p-6"
      >
        <h3 className="text-lg font-semibold mb-4">Profit Calculation Breakdown</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div className="p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">+ KES {incomeExpenseData.currentYearIncome.toLocaleString()}</div>
            <div className="text-sm text-green-700 mt-1">Total Income</div>
          </div>
          <div className="p-4 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">- KES {incomeExpenseData.currentYearExpenses.toLocaleString()}</div>
            <div className="text-sm text-red-700 mt-1">Total Expenses</div>
          </div>
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">= KES {incomeExpenseData.currentYearNet.toLocaleString()}</div>
            <div className="text-sm text-blue-700 mt-1">Net Profit Available</div>
          </div>
        </div>
      </motion.div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="calculations">Dividend Calculations</TabsTrigger>
          <TabsTrigger value="allocations">Member Allocations</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Recent Calculations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalculatorIcon className="h-5 w-5" />
                  Recent Dividend Calculations
                </CardTitle>
                <CardDescription>
                  Latest dividend calculations and their status
                </CardDescription>
              </CardHeader>
              <CardContent>
                {calculations.slice(0, 5).map((calc) => (
                  <div key={calc.id} className="flex items-center justify-between p-3 border-b last:border-b-0">
                    <div>
                      <div className="font-medium">FY {calc.fiscal_year}</div>
                      <div className="text-sm text-muted-foreground">
                        KES {calc.total_dividends_fund?.toLocaleString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(calc.status)}
                      {calc.status === 'approved' && (
                        <Button
                          size="sm"
                          onClick={() => setSelectedCalculation(calc)}
                        >
                          Distribute
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                {calculations.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No dividend calculations found
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Top Allocations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserGroupIcon className="h-5 w-5" />
                  Top Dividend Allocations
                </CardTitle>
                <CardDescription>
                  Members with highest dividend allocations
                </CardDescription>
              </CardHeader>
              <CardContent>
                {allocations.slice(0, 5).map((alloc) => (
                  <div key={alloc.id} className="flex items-center justify-between p-3 border-b last:border-b-0">
                    <div>
                      <div className="font-medium">
                        {alloc.users?.first_name} {alloc.users?.last_name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {alloc.users?.member_no} • FY {alloc.dividends_fund_calculations?.fiscal_year}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-green-600">
                        KES {alloc.allocated_amount?.toLocaleString()}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {(alloc.share_percentage * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                ))}
                {allocations.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No dividend allocations found
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Calculations Tab */}
        <TabsContent value="calculations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Dividend Calculations History</CardTitle>
              <CardDescription>
                Complete history of all dividend calculations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fiscal Year</TableHead>
                    <TableHead>Total Fund</TableHead>
                    <TableHead>Registration Fees</TableHead>
                    <TableHead>Loan Interest</TableHead>
                    <TableHead>Investment Profit</TableHead>
                    <TableHead>Expenses</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {calculations.map((calc) => (
                    <TableRow key={calc.id}>
                      <TableCell className="font-bold">FY {calc.fiscal_year}</TableCell>
                      <TableCell className="font-bold text-green-600">
                        KES {calc.total_dividends_fund?.toLocaleString()}
                      </TableCell>
                      <TableCell>KES {calc.registration_fees?.toLocaleString()}</TableCell>
                      <TableCell>KES {calc.loan_interest?.toLocaleString()}</TableCell>
                      <TableCell>KES {calc.investment_profits?.toLocaleString()}</TableCell>
                      <TableCell className="text-red-600">
                        KES {calc.relevant_expenses?.toLocaleString()}
                      </TableCell>
                      <TableCell>{getStatusBadge(calc.status)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              // View details logic
                            }}
                          >
                            <EyeIcon className="h-4 w-4" />
                          </Button>
                          {calc.status === 'approved' && (
                            <Button
                              size="sm"
                              onClick={() => setSelectedCalculation(calc)}
                            >
                              <CheckCircleIcon className="h-4 w-4 mr-1" />
                              Distribute
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {calculations.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No dividend calculations found
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Allocations Tab */}
        <TabsContent value="allocations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Member Dividend Allocations</CardTitle>
              <CardDescription>
                Detailed view of all member dividend allocations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Member No</TableHead>
                    <TableHead>Fiscal Year</TableHead>
                    <TableHead>Savings Share</TableHead>
                    <TableHead>Allocated Amount</TableHead>
                    <TableHead>Payout Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allocations.map((alloc) => (
                    <TableRow key={alloc.id}>
                      <TableCell>
                        {alloc.users?.first_name} {alloc.users?.last_name}
                      </TableCell>
                      <TableCell className="font-mono">
                        {alloc.users?.member_no}
                      </TableCell>
                      <TableCell>FY {alloc.dividends_fund_calculations?.fiscal_year}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {(alloc.share_percentage * 100).toFixed(2)}%
                        </Badge>
                      </TableCell>
                      <TableCell className="font-bold text-green-600">
                        KES {alloc.allocated_amount?.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant={alloc.payout_status === 'paid' ? 'default' : 'secondary'}>
                          {alloc.payout_status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {allocations.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No dividend allocations found
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dividend Calculator Modal */}
      {showCalculator && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <DividendCalculator onCalculationComplete={handleCalculationComplete} />
          </div>
        </div>
      )}

      {/* Dividend Distribution Form Modal */}
      {selectedCalculation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <DividendDistributionForm
              calculationId={selectedCalculation.id}
              fiscalYear={selectedCalculation.fiscal_year}
              totalDividendFund={selectedCalculation.total_dividends_fund}
              onDistributionComplete={handleDistributionComplete}
            />
          </div>
        </div>
      )}
    </div>
  );
}