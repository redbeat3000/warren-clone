import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

// Types for filtering
export interface ReportFilters {
  dateFrom?: string;
  dateTo?: string;
  transactionType?: string;
  fundType?: string;
  minAmount?: number;
  maxAmount?: number;
  memberIds?: string[];
  reportType: 'individual' | 'collective';
  moneyFlow?: 'in' | 'out' | 'all';
}

export interface TransactionData {
  id: string;
  timestamp: string;
  actionType: string;
  member: string;
  memberId?: string;
  amount: number;
  paymentMethod: string;
  referenceNumber: string;
  description: string;
  type: 'income' | 'expense' | 'loan' | 'contribution' | 'fine';
  fundType?: string;
  contributionType?: string;
}

export class AdvancedReportPDFGenerator {
  private doc: jsPDF;
  private pageHeight: number;
  private margin: number = 15;
  private currentY: number = 20;
  private pageWidth: number;

  constructor() {
    this.doc = new jsPDF();
    this.pageHeight = this.doc.internal.pageSize.height;
    this.pageWidth = this.doc.internal.pageSize.width;
  }

  private addPageHeader(title: string, subtitle?: string) {
    // Add decorative header
    this.doc.setFillColor(59, 130, 246);
    this.doc.rect(0, 0, this.pageWidth, 15, 'F');
    
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(16);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(title, this.margin, 10);
    
    if (subtitle) {
      this.doc.setFontSize(10);
      this.doc.text(subtitle, this.pageWidth - this.margin - 50, 10);
    }
    
    this.doc.setTextColor(0, 0, 0);
    this.currentY = 25;
  }

  private addFooter(pageNumber: number) {
    const footerY = this.pageHeight - 10;
    this.doc.setFontSize(8);
    this.doc.setTextColor(128, 128, 128);
    this.doc.text(
      `Generated on ${format(new Date(), 'PPpp')} | Page ${pageNumber}`,
      this.pageWidth / 2,
      footerY,
      { align: 'center' }
    );
  }

  private checkPageBreak(requiredSpace: number = 40) {
    if (this.currentY + requiredSpace > this.pageHeight - 20) {
      this.doc.addPage();
      this.currentY = this.margin;
      return true;
    }
    return false;
  }

  private addSectionTitle(title: string, color: [number, number, number] = [59, 130, 246]) {
    this.checkPageBreak(15);
    this.doc.setFillColor(...color);
    this.doc.rect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, 8, 'F');
    
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(title, this.margin + 2, this.currentY + 6);
    
    this.doc.setTextColor(0, 0, 0);
    this.currentY += 12;
  }

  private addFilterSummary(filters: ReportFilters) {
    this.addSectionTitle('Report Filters Applied', [52, 152, 219]);
    
    const filterData: string[][] = [];
    
    if (filters.dateFrom || filters.dateTo) {
      const dateRange = `${filters.dateFrom ? format(new Date(filters.dateFrom), 'PP') : 'Start'} to ${filters.dateTo ? format(new Date(filters.dateTo), 'PP') : 'End'}`;
      filterData.push(['Date Range', dateRange]);
    }
    
    if (filters.transactionType && filters.transactionType !== 'all') {
      filterData.push(['Transaction Type', filters.transactionType.replace(/_/g, ' ').toUpperCase()]);
    }
    
    if (filters.fundType && filters.fundType !== 'all') {
      filterData.push(['Fund Type', filters.fundType.replace(/_/g, ' ').toUpperCase()]);
    }
    
    if (filters.minAmount !== undefined || filters.maxAmount !== undefined) {
      const amountRange = `KES ${filters.minAmount?.toLocaleString() || '0'} - ${filters.maxAmount?.toLocaleString() || 'No Limit'}`;
      filterData.push(['Amount Range', amountRange]);
    }
    
    if (filters.moneyFlow && filters.moneyFlow !== 'all') {
      filterData.push(['Money Flow', filters.moneyFlow === 'in' ? 'Money In (Income)' : 'Money Out (Expenses)']);
    }
    
    filterData.push(['Report Type', filters.reportType === 'individual' ? 'Individual Member Report' : 'Collective Group Report']);
    
    if (filterData.length > 0) {
      autoTable(this.doc, {
        startY: this.currentY,
        head: [['Filter', 'Value']],
        body: filterData,
        theme: 'grid',
        headStyles: { fillColor: [52, 152, 219], fontSize: 10 },
        styles: { fontSize: 9 },
        margin: { left: this.margin, right: this.margin },
        columnStyles: {
          0: { cellWidth: 50, fontStyle: 'bold' },
          1: { cellWidth: 'auto' }
        }
      });
      
      this.currentY = (this.doc as any).lastAutoTable.finalY + 10;
    }
  }

  private calculateSummaryStats(transactions: TransactionData[], filters: ReportFilters) {
    const moneyIn = transactions.filter(t => 
      ['contribution', 'income', 'fine'].includes(t.type)
    );
    const moneyOut = transactions.filter(t => 
      ['expense', 'loan'].includes(t.type)
    );
    
    const totalMoneyIn = moneyIn.reduce((sum, t) => sum + t.amount, 0);
    const totalMoneyOut = moneyOut.reduce((sum, t) => sum + t.amount, 0);
    const netPosition = totalMoneyIn - totalMoneyOut;
    
    // Fund-specific breakdown
    const fundBreakdown: { [key: string]: number } = {};
    transactions.forEach(t => {
      const fund = t.contributionType || t.fundType || 'general';
      fundBreakdown[fund] = (fundBreakdown[fund] || 0) + t.amount;
    });
    
    return {
      totalTransactions: transactions.length,
      totalMoneyIn,
      totalMoneyOut,
      netPosition,
      moneyInCount: moneyIn.length,
      moneyOutCount: moneyOut.length,
      fundBreakdown,
      uniqueMembers: new Set(transactions.map(t => t.memberId).filter(Boolean)).size
    };
  }

  private addExecutiveSummary(transactions: TransactionData[], filters: ReportFilters) {
    this.addSectionTitle('Executive Summary', [39, 174, 96]);
    
    const stats = this.calculateSummaryStats(transactions, filters);
    
    const summaryData = [
      ['Total Transactions', stats.totalTransactions.toString()],
      ['Unique Members', stats.uniqueMembers.toString()],
      ['Total Money In', `KES ${stats.totalMoneyIn.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`],
      ['Total Money Out', `KES ${stats.totalMoneyOut.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`],
      ['Net Position', `KES ${stats.netPosition.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`]
    ];
    
    autoTable(this.doc, {
      startY: this.currentY,
      body: summaryData,
      theme: 'plain',
      styles: { fontSize: 11, cellPadding: 3 },
      margin: { left: this.margin, right: this.margin },
      columnStyles: {
        0: { cellWidth: 60, fontStyle: 'bold', textColor: [52, 73, 94] },
        1: { cellWidth: 'auto', fontStyle: 'bold', textColor: [39, 174, 96] }
      }
    });
    
    this.currentY = (this.doc as any).lastAutoTable.finalY + 10;
  }

  private addFundBreakdown(transactions: TransactionData[]) {
    this.checkPageBreak(60);
    this.addSectionTitle('Fund Type Breakdown', [142, 68, 173]);
    
    const fundStats: { [key: string]: { in: number; out: number; net: number; count: number } } = {};
    
    transactions.forEach(t => {
      const fund = t.contributionType || t.fundType || 'General Fund';
      if (!fundStats[fund]) {
        fundStats[fund] = { in: 0, out: 0, net: 0, count: 0 };
      }
      
      fundStats[fund].count++;
      if (['contribution', 'income', 'fine'].includes(t.type)) {
        fundStats[fund].in += t.amount;
      } else {
        fundStats[fund].out += t.amount;
      }
      fundStats[fund].net = fundStats[fund].in - fundStats[fund].out;
    });
    
    const fundData = Object.entries(fundStats).map(([fund, stats]) => [
      fund.replace(/_/g, ' ').toUpperCase(),
      stats.count.toString(),
      `KES ${stats.in.toLocaleString('en-KE', { minimumFractionDigits: 2 })}`,
      `KES ${stats.out.toLocaleString('en-KE', { minimumFractionDigits: 2 })}`,
      `KES ${stats.net.toLocaleString('en-KE', { minimumFractionDigits: 2 })}`
    ]);
    
    if (fundData.length > 0) {
      autoTable(this.doc, {
        startY: this.currentY,
        head: [['Fund Type', 'Transactions', 'Money In', 'Money Out', 'Net']],
        body: fundData,
        theme: 'striped',
        headStyles: { fillColor: [142, 68, 173], fontSize: 9 },
        styles: { fontSize: 8 },
        margin: { left: this.margin, right: this.margin },
        columnStyles: {
          0: { cellWidth: 50 },
          1: { cellWidth: 25, halign: 'center' },
          2: { cellWidth: 35, halign: 'right' },
          3: { cellWidth: 35, halign: 'right' },
          4: { cellWidth: 35, halign: 'right' }
        }
      });
      
      this.currentY = (this.doc as any).lastAutoTable.finalY + 10;
    }
  }

  private addMoneyInOutAnalysis(transactions: TransactionData[]) {
    this.checkPageBreak(60);
    this.addSectionTitle('Money In vs Money Out Analysis', [231, 76, 60]);
    
    const moneyIn = transactions.filter(t => ['contribution', 'income', 'fine'].includes(t.type));
    const moneyOut = transactions.filter(t => ['expense', 'loan'].includes(t.type));
    
    // Money In breakdown
    const moneyInByType: { [key: string]: number } = {};
    moneyIn.forEach(t => {
      const type = t.actionType.replace(/_/g, ' ');
      moneyInByType[type] = (moneyInByType[type] || 0) + t.amount;
    });
    
    const moneyInData = Object.entries(moneyInByType).map(([type, amount]) => [
      type,
      `KES ${amount.toLocaleString('en-KE', { minimumFractionDigits: 2 })}`,
      `${((amount / moneyIn.reduce((sum, t) => sum + t.amount, 0)) * 100).toFixed(2)}%`
    ]);
    
    if (moneyInData.length > 0) {
      this.doc.setFontSize(10);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text('💰 Money In (Income Sources)', this.margin, this.currentY);
      this.currentY += 5;
      
      autoTable(this.doc, {
        startY: this.currentY,
        head: [['Type', 'Amount', 'Percentage']],
        body: moneyInData,
        theme: 'grid',
        headStyles: { fillColor: [34, 197, 94], fontSize: 9 },
        styles: { fontSize: 8 },
        margin: { left: this.margin, right: this.margin },
        columnStyles: {
          0: { cellWidth: 70 },
          1: { cellWidth: 50, halign: 'right' },
          2: { cellWidth: 30, halign: 'center' }
        }
      });
      
      this.currentY = (this.doc as any).lastAutoTable.finalY + 10;
    }
    
    // Money Out breakdown
    const moneyOutByType: { [key: string]: number } = {};
    moneyOut.forEach(t => {
      const type = t.actionType.replace(/_/g, ' ');
      moneyOutByType[type] = (moneyOutByType[type] || 0) + t.amount;
    });
    
    const moneyOutData = Object.entries(moneyOutByType).map(([type, amount]) => [
      type,
      `KES ${amount.toLocaleString('en-KE', { minimumFractionDigits: 2 })}`,
      `${((amount / moneyOut.reduce((sum, t) => sum + t.amount, 0)) * 100).toFixed(2)}%`
    ]);
    
    if (moneyOutData.length > 0) {
      this.checkPageBreak(50);
      this.doc.setFontSize(10);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text('💸 Money Out (Expense Categories)', this.margin, this.currentY);
      this.currentY += 5;
      
      autoTable(this.doc, {
        startY: this.currentY,
        head: [['Type', 'Amount', 'Percentage']],
        body: moneyOutData,
        theme: 'grid',
        headStyles: { fillColor: [239, 68, 68], fontSize: 9 },
        styles: { fontSize: 8 },
        margin: { left: this.margin, right: this.margin },
        columnStyles: {
          0: { cellWidth: 70 },
          1: { cellWidth: 50, halign: 'right' },
          2: { cellWidth: 30, halign: 'center' }
        }
      });
      
      this.currentY = (this.doc as any).lastAutoTable.finalY + 10;
    }
  }

  private addIndividualMemberAnalysis(transactions: TransactionData[]) {
    this.checkPageBreak(60);
    this.addSectionTitle('Individual Member Analysis', [26, 188, 156]);
    
    const memberStats: { [key: string]: { name: string; in: number; out: number; count: number } } = {};
    
    transactions.forEach(t => {
      const memberId = t.memberId || t.member;
      if (!memberStats[memberId]) {
        memberStats[memberId] = { name: t.member, in: 0, out: 0, count: 0 };
      }
      
      memberStats[memberId].count++;
      if (['contribution', 'income', 'fine'].includes(t.type)) {
        memberStats[memberId].in += t.amount;
      } else {
        memberStats[memberId].out += t.amount;
      }
    });
    
    const memberData = Object.values(memberStats)
      .sort((a, b) => (b.in + b.out) - (a.in + a.out))
      .map(stats => [
        stats.name,
        stats.count.toString(),
        `KES ${stats.in.toLocaleString('en-KE', { minimumFractionDigits: 2 })}`,
        `KES ${stats.out.toLocaleString('en-KE', { minimumFractionDigits: 2 })}`,
        `KES ${(stats.in - stats.out).toLocaleString('en-KE', { minimumFractionDigits: 2 })}`
      ]);
    
    if (memberData.length > 0) {
      autoTable(this.doc, {
        startY: this.currentY,
        head: [['Member', 'Trans.', 'Money In', 'Money Out', 'Net']],
        body: memberData,
        theme: 'striped',
        headStyles: { fillColor: [26, 188, 156], fontSize: 9 },
        styles: { fontSize: 8 },
        margin: { left: this.margin, right: this.margin },
        columnStyles: {
          0: { cellWidth: 60 },
          1: { cellWidth: 20, halign: 'center' },
          2: { cellWidth: 35, halign: 'right' },
          3: { cellWidth: 35, halign: 'right' },
          4: { cellWidth: 30, halign: 'right' }
        }
      });
      
      this.currentY = (this.doc as any).lastAutoTable.finalY + 10;
    }
  }

  private addDetailedTransactionList(transactions: TransactionData[]) {
    this.checkPageBreak(60);
    this.addSectionTitle('Detailed Transaction List', [52, 73, 94]);
    
    const transactionData = transactions.map(t => [
      format(new Date(t.timestamp), 'dd/MM/yyyy'),
      t.referenceNumber,
      t.member.substring(0, 25),
      t.actionType.replace(/_/g, ' ').substring(0, 20),
      `KES ${t.amount.toLocaleString('en-KE', { minimumFractionDigits: 2 })}`,
      t.type === 'contribution' || t.type === 'income' || t.type === 'fine' ? 'IN' : 'OUT'
    ]);
    
    autoTable(this.doc, {
      startY: this.currentY,
      head: [['Date', 'Reference', 'Member', 'Type', 'Amount', 'Flow']],
      body: transactionData,
      theme: 'striped',
      headStyles: { fillColor: [52, 73, 94], fontSize: 8 },
      styles: { fontSize: 7 },
      margin: { left: this.margin, right: this.margin },
      columnStyles: {
        0: { cellWidth: 22 },
        1: { cellWidth: 28 },
        2: { cellWidth: 40 },
        3: { cellWidth: 35 },
        4: { cellWidth: 30, halign: 'right' },
        5: { cellWidth: 15, halign: 'center' }
      },
      didParseCell: (data) => {
        if (data.column.index === 5 && data.cell.section === 'body') {
          if (data.cell.text[0] === 'IN') {
            data.cell.styles.textColor = [34, 197, 94];
            data.cell.styles.fontStyle = 'bold';
          } else {
            data.cell.styles.textColor = [239, 68, 68];
            data.cell.styles.fontStyle = 'bold';
          }
        }
      }
    });
    
    this.currentY = (this.doc as any).lastAutoTable.finalY + 10;
  }

  public generateComprehensiveReport(
    transactions: TransactionData[],
    filters: ReportFilters,
    chamaName: string = 'Chama Management System'
  ): jsPDF {
    // Cover Page
    this.addPageHeader(chamaName, format(new Date(), 'PP'));
    
    this.currentY = 50;
    this.doc.setFontSize(24);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Financial Report', this.pageWidth / 2, this.currentY, { align: 'center' });
    
    this.currentY += 15;
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(
      filters.reportType === 'individual' ? 'Individual Member Report' : 'Collective Group Report',
      this.pageWidth / 2,
      this.currentY,
      { align: 'center' }
    );
    
    this.currentY += 30;
    
    // Add filter summary
    this.addFilterSummary(filters);
    
    // Add executive summary
    this.addExecutiveSummary(transactions, filters);
    
    // Add fund breakdown
    if (transactions.length > 0) {
      this.addFundBreakdown(transactions);
    }
    
    // Add money in/out analysis
    if (transactions.length > 0) {
      this.addMoneyInOutAnalysis(transactions);
    }
    
    // Add individual member analysis for collective reports
    if (filters.reportType === 'collective' && transactions.length > 0) {
      this.addIndividualMemberAnalysis(transactions);
    }
    
    // Add detailed transaction list
    if (transactions.length > 0) {
      this.addDetailedTransactionList(transactions);
    }
    
    // Add footer to all pages
    const pageCount = this.doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      this.doc.setPage(i);
      this.addFooter(i);
    }
    
    return this.doc;
  }

  public download(filename: string) {
    this.doc.save(`${filename}_${format(new Date(), 'yyyy-MM-dd_HHmmss')}.pdf`);
  }
}

// Export function for easy use
export const generateAdvancedFinancialReport = (
  transactions: TransactionData[],
  filters: ReportFilters,
  chamaName?: string
) => {
  const generator = new AdvancedReportPDFGenerator();
  generator.generateComprehensiveReport(transactions, filters, chamaName);
  
  const filename = filters.reportType === 'individual' 
    ? `Individual_Financial_Report` 
    : `Collective_Financial_Report`;
  
  generator.download(filename);
};
