// src/components/income/IncomeDashboard.tsx
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, TrendingUp, FileText, Calculator } from 'lucide-react';

interface IncomeSummary {
  fiscal_year: number;
  category_name: string;
  total_amount: number;
  transaction_count: number;
  affects_dividends: boolean;
}

export default function IncomeDashboard() {
  const [incomeSummary, setIncomeSummary] = useState<IncomeSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [showIncomeForm, setShowIncomeForm] = useState(false);

  useEffect(() => {
    fetchIncomeSummary();
  }, []);

  const fetchIncomeSummary = async () => {
    try {
      const { data, error } = await supabase
        .from('yearly_income_summary')
        .select('*')
        .order('fiscal_year', { ascending: false })
        .order('total_amount', { ascending: false });

      if (error) throw error;
      setIncomeSummary(data || []);
    } catch (error) {
      console.error('Error fetching income summary:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalDividendIncome = incomeSummary
    .filter(item => item.affects_dividends)
    .reduce((sum, item) => sum + item.total_amount, 0);

  const totalNonDividendIncome = incomeSummary
    .filter(item => !item.affects_dividends)
    .reduce((sum, item) => sum + item.total_amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Income Management</h1>
          <p className="text-muted-foreground">
            Track all income sources and monitor dividend-eligible amounts
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowIncomeForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Record Income
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              KES {(totalDividendIncome + totalNonDividendIncome).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              All income sources
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dividend Income</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              KES {totalDividendIncome.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Available for dividend distribution
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Non-Dividend Income</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              KES {totalNonDividendIncome.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Operational and reserve funds
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Income Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Income Breakdown by Category</CardTitle>
          <CardDescription>
            Detailed view of all income sources and their dividend eligibility
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading income data...</div>
          ) : (
            <div className="space-y-4">
              {incomeSummary.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div>
                      <div className="font-medium">{item.category_name}</div>
                      <div className="text-sm text-muted-foreground">
                        {item.transaction_count} transactions in {item.fiscal_year}
                      </div>
                    </div>
                    {item.affects_dividends ? (
                      <Badge variant="default">Dividend Income</Badge>
                    ) : (
                      <Badge variant="secondary">Operational</Badge>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="font-bold">KES {item.total_amount.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">
                      {((item.total_amount / (totalDividendIncome + totalNonDividendIncome)) * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Income Recording Form */}
      {showIncomeForm && (
        <IncomeRecordingForm 
          onClose={() => setShowIncomeForm(false)}
          onSuccess={() => {
            setShowIncomeForm(false);
            fetchIncomeSummary();
          }}
        />
      )}
    </div>
  );
}