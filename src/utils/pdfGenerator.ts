import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface PDFOptions {
  title: string;
  subtitle?: string;
  filename: string;
}

export class PDFGenerator {
  public doc: jsPDF;
  public pageHeight: number;
  public margin: number = 20;
  public currentY: number = 30;

  constructor() {
    this.doc = new jsPDF();
    this.pageHeight = this.doc.internal.pageSize.height;
  }

  public addHeader(title: string, subtitle?: string) {
    // Add logo/header area
    this.doc.setFontSize(20);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(title, this.margin, this.currentY);
    
    if (subtitle) {
      this.currentY += 10;
      this.doc.setFontSize(12);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(subtitle, this.margin, this.currentY);
    }

    this.currentY += 20;
    
    // Add date
    this.doc.setFontSize(10);
    this.doc.text(`Generated on: ${new Date().toLocaleDateString()}`, this.margin, this.currentY);
    this.currentY += 20;
  }

  public checkPageBreak(requiredSpace: number = 30) {
    if (this.currentY + requiredSpace > this.pageHeight - this.margin) {
      this.doc.addPage();
      this.currentY = this.margin;
    }
  }

  generateMemberReport(member: any, data: any) {
    this.addHeader(
      `Member Report - ${member.firstName} ${member.lastName}`,
      `Member #${member.memberNo}`
    );

    // Member Details Section
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Member Information', this.margin, this.currentY);
    this.currentY += 10;

    const memberInfo = [
      ['Name', `${member.firstName} ${member.lastName}`],
      ['Member Number', member.memberNo],
      ['Email', member.email],
      ['Phone', member.phone],
      ['Status', member.status],
      ['Role', member.role],
      ['Join Date', member.joinDate]
    ];

    autoTable(this.doc, {
      startY: this.currentY,
      head: [['Field', 'Value']],
      body: memberInfo,
      theme: 'striped',
      headStyles: { fillColor: [41, 128, 185] },
      margin: { left: this.margin, right: this.margin }
    });

    this.currentY = (this.doc as any).lastAutoTable.finalY + 20;
    this.checkPageBreak();

    // Financial Summary
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Financial Summary', this.margin, this.currentY);
    this.currentY += 10;

    const totalContributions = data.contributions.reduce((sum: number, c: any) => sum + parseFloat(c.amount?.toString() || '0'), 0);
    const totalFines = data.fines.reduce((sum: number, f: any) => sum + parseFloat(f.amount?.toString() || '0'), 0);
    const totalLoans = data.loans.reduce((sum: number, l: any) => sum + parseFloat(l.principal?.toString() || '0'), 0);
    const totalDividends = data.dividends?.reduce((sum: number, d: any) => sum + parseFloat(d.allocation_amount?.toString() || '0'), 0) || 0;
    const meetingsAttended = data.meetingAttendance?.filter((a: any) => a.status === 'present').length || 0;
    const totalMeetings = data.meetingAttendance?.length || 0;

    const financialSummary = [
      ['Total Contributions', `KES ${totalContributions.toLocaleString()}`],
      ['Total Fines', `KES ${totalFines.toLocaleString()}`],
      ['Total Loans', `KES ${totalLoans.toLocaleString()}`],
      ['Total Dividends', `KES ${totalDividends.toLocaleString()}`],
      ['Meetings Attended', `${meetingsAttended}/${totalMeetings}`]
    ];

    autoTable(this.doc, {
      startY: this.currentY,
      head: [['Metric', 'Value']],
      body: financialSummary,
      theme: 'striped',
      headStyles: { fillColor: [39, 174, 96] },
      margin: { left: this.margin, right: this.margin }
    });

    this.currentY = (this.doc as any).lastAutoTable.finalY + 20;
    this.checkPageBreak();

    // Contributions Section
    if (data.contributions.length > 0) {
      this.doc.setFontSize(14);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text('Contributions History', this.margin, this.currentY);
      this.currentY += 10;

      const contributionsData = data.contributions.map((c: any) => [
        c.contribution_date,
        c.contribution_type || 'N/A',
        `KES ${parseFloat(c.amount?.toString() || '0').toLocaleString()}`,
        c.payment_method || 'N/A',
        c.receipt_no || 'N/A',
        c.notes || 'N/A'
      ]);

      autoTable(this.doc, {
        startY: this.currentY,
        head: [['Date', 'Type', 'Amount', 'Method', 'Receipt No', 'Notes']],
        body: contributionsData,
        theme: 'striped',
        headStyles: { fillColor: [52, 152, 219] },
        margin: { left: this.margin, right: this.margin },
        styles: { fontSize: 8 }
      });

      this.currentY = (this.doc as any).lastAutoTable.finalY + 20;
      this.checkPageBreak();
    }

    // Fines Section
    if (data.fines.length > 0) {
      this.doc.setFontSize(14);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text('Fines History', this.margin, this.currentY);
      this.currentY += 10;

      const finesData = data.fines.map((f: any) => [
        f.fine_date,
        `KES ${parseFloat(f.amount?.toString() || '0').toLocaleString()}`,
        f.reason || 'N/A',
        f.status
      ]);

      autoTable(this.doc, {
        startY: this.currentY,
        head: [['Date', 'Amount', 'Reason', 'Status']],
        body: finesData,
        theme: 'striped',
        headStyles: { fillColor: [231, 76, 60] },
        margin: { left: this.margin, right: this.margin }
      });

      this.currentY = (this.doc as any).lastAutoTable.finalY + 20;
      this.checkPageBreak();
    }

    // Loans Section
    if (data.loans.length > 0) {
      this.doc.setFontSize(14);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text('Loans History', this.margin, this.currentY);
      this.currentY += 10;

      const loansData = data.loans.map((l: any) => [
        l.issue_date,
        `KES ${parseFloat(l.principal?.toString() || '0').toLocaleString()}`,
        `${l.interest_rate}%`,
        l.term_months,
        l.due_date || 'N/A',
        l.status,
        l.notes || 'N/A'
      ]);

      autoTable(this.doc, {
        startY: this.currentY,
        head: [['Issue Date', 'Principal', 'Rate', 'Term', 'Due Date', 'Status', 'Notes']],
        body: loansData,
        theme: 'striped',
        headStyles: { fillColor: [142, 68, 173] },
        margin: { left: this.margin, right: this.margin },
        styles: { fontSize: 8 }
      });

      this.currentY = (this.doc as any).lastAutoTable.finalY + 20;
      this.checkPageBreak();
    }

    // Dividends Section
    if (data.dividends && data.dividends.length > 0) {
      this.doc.setFontSize(14);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text('Dividends History', this.margin, this.currentY);
      this.currentY += 10;

      const dividendsData = data.dividends.map((d: any) => [
        d.period,
        `KES ${parseFloat(d.allocation_amount?.toString() || '0').toLocaleString()}`,
        d.payout_date || 'Pending',
        d.created_at ? new Date(d.created_at).toLocaleDateString() : 'N/A'
      ]);

      autoTable(this.doc, {
        startY: this.currentY,
        head: [['Period', 'Amount', 'Payout Date', 'Recorded On']],
        body: dividendsData,
        theme: 'striped',
        headStyles: { fillColor: [155, 89, 182] },
        margin: { left: this.margin, right: this.margin }
      });

      this.currentY = (this.doc as any).lastAutoTable.finalY + 20;
      this.checkPageBreak();
    }

    // Meeting Attendance Section
    if (data.meetingAttendance && data.meetingAttendance.length > 0) {
      this.doc.setFontSize(14);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text('Meeting Attendance', this.margin, this.currentY);
      this.currentY += 10;

      const attendanceData = data.meetingAttendance.map((a: any) => [
        a.meetings?.title || 'N/A',
        a.meetings?.meeting_date || 'N/A',
        a.status,
        a.notes || 'N/A'
      ]);

      autoTable(this.doc, {
        startY: this.currentY,
        head: [['Meeting', 'Date', 'Status', 'Notes']],
        body: attendanceData,
        theme: 'striped',
        headStyles: { fillColor: [26, 188, 156] },
        margin: { left: this.margin, right: this.margin }
      });
    }

    return this.doc;
  }

  generateFinancialReport(data: any[], title: string) {
    this.addHeader(title, 'Financial Summary Report');

    if (data.length === 0) {
      this.doc.text('No data available', this.margin, this.currentY);
      return this.doc;
    }

    const headers = Object.keys(data[0]);
    const rows = data.map(item => 
      headers.map(header => {
        const value = item[header];
        if (typeof value === 'number' && header.toLowerCase().includes('amount')) {
          return `KES ${value.toLocaleString()}`;
        }
        return value?.toString() || 'N/A';
      })
    );

    autoTable(this.doc, {
      startY: this.currentY,
      head: [headers],
      body: rows,
      theme: 'striped',
      headStyles: { fillColor: [41, 128, 185] },
      margin: { left: this.margin, right: this.margin },
      styles: { fontSize: 10 }
    });

    return this.doc;
  }

  generateContributionReport(contributions: any[]) {
    this.addHeader('Contributions Report', 'Member Contributions Summary');

    if (contributions.length === 0) {
      this.doc.text('No contributions found', this.margin, this.currentY);
      return this.doc;
    }

    // Summary stats
    const totalAmount = contributions.reduce((sum, c) => sum + c.amount, 0);
    const uniqueMembers = new Set(contributions.map(c => c.memberNo)).size;
    
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Summary', this.margin, this.currentY);
    this.currentY += 10;

    const summaryData = [
      ['Total Contributions', `KES ${totalAmount.toLocaleString()}`],
      ['Number of Contributors', uniqueMembers.toString()],
      ['Average Contribution', `KES ${Math.round(totalAmount / contributions.length).toLocaleString()}`]
    ];

    autoTable(this.doc, {
      startY: this.currentY,
      head: [['Metric', 'Value']],
      body: summaryData,
      theme: 'striped',
      headStyles: { fillColor: [39, 174, 96] },
      margin: { left: this.margin, right: this.margin }
    });

    this.currentY = (this.doc as any).lastAutoTable.finalY + 20;

    // Detailed contributions
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Detailed Contributions', this.margin, this.currentY);
    this.currentY += 10;

    const contributionsData = contributions.map(c => [
      c.receiptNo,
      c.memberName,
      c.memberNo,
      `KES ${c.amount.toLocaleString()}`,
      new Date(c.date).toLocaleDateString(),
      c.paymentMethod,
      c.status
    ]);

    autoTable(this.doc, {
      startY: this.currentY,
      head: [['Receipt', 'Member', 'Member No', 'Amount', 'Date', 'Method', 'Status']],
      body: contributionsData,
      theme: 'striped',
      headStyles: { fillColor: [52, 152, 219] },
      margin: { left: this.margin, right: this.margin },
      styles: { fontSize: 8 }
    });

    return this.doc;
  }

  download(filename: string) {
    this.doc.save(`${filename}.pdf`);
  }

  print() {
    this.doc.autoPrint();
    window.open(this.doc.output('bloburl'), '_blank');
  }
}

export const generateMemberReportPDF = async (member: any, data: any) => {
  const generator = new PDFGenerator();
  const doc = generator.generateMemberReport(member, data);
  generator.download(`${member.firstName}_${member.lastName}_Report_${new Date().toISOString().split('T')[0]}`);
};

export const generateFinancialSummaryPDF = (data: any[], title: string, filename: string) => {
  const generator = new PDFGenerator();
  const doc = generator.generateFinancialReport(data, title);
  generator.download(filename);
};

export const generateContributionsPDF = (contributions: any[]) => {
  const generator = new PDFGenerator();
  const doc = generator.generateContributionReport(contributions);
  generator.download(`contributions_report_${new Date().toISOString().split('T')[0]}`);
};

export const printContributionsPDF = (contributions: any[]) => {
  const generator = new PDFGenerator();
  const doc = generator.generateContributionReport(contributions);
  generator.print();
};

export const generateLoansReportPDF = (loans: any[]) => {
  const generator = new PDFGenerator();
  generator.addHeader('Loans Report', 'Active Loans and Repayment Summary');
  
  if (loans.length === 0) {
    generator.doc.text('No loans found', generator.margin, generator.currentY);
    generator.download(`loans_report_${new Date().toISOString().split('T')[0]}`);
    return;
  }

  // Summary stats
  const totalLoaned = loans.reduce((sum, l) => sum + parseFloat(l.principal?.toString() || '0'), 0);
  const totalOutstanding = loans.reduce((sum, l) => sum + parseFloat(l.balance?.toString() || '0'), 0);
  const activeLoans = loans.filter(l => l.status === 'active').length;

  const summaryData = [
    ['Total Amount Loaned', `KES ${totalLoaned.toLocaleString()}`],
    ['Outstanding Balance', `KES ${totalOutstanding.toLocaleString()}`],
    ['Active Loans', activeLoans.toString()],
    ['Total Loans', loans.length.toString()]
  ];

  autoTable(generator.doc, {
    startY: generator.currentY,
    head: [['Metric', 'Value']],
    body: summaryData,
    theme: 'striped',
    headStyles: { fillColor: [39, 174, 96] },
    margin: { left: generator.margin, right: generator.margin }
  });

  generator.currentY = (generator.doc as any).lastAutoTable.finalY + 20;
  generator.checkPageBreak();

  // Detailed loans
  const loansData = loans.map(l => [
    l.loanNo || 'N/A',
    l.memberName || 'N/A',
    `KES ${parseFloat(l.principal?.toString() || '0').toLocaleString()}`,
    `KES ${parseFloat(l.balance?.toString() || '0').toLocaleString()}`,
    `${l.interestRate}%`,
    l.term ? `${l.term} months` : 'N/A',
    l.status || 'N/A'
  ]);

  autoTable(generator.doc, {
    startY: generator.currentY,
    head: [['Loan No', 'Member', 'Principal', 'Balance', 'Rate', 'Term', 'Status']],
    body: loansData,
    theme: 'striped',
    headStyles: { fillColor: [52, 152, 219] },
    margin: { left: generator.margin, right: generator.margin },
    styles: { fontSize: 8 }
  });

  generator.download(`loans_report_${new Date().toISOString().split('T')[0]}`);
};

export const generateExpensesReportPDF = (expenses: any[]) => {
  const generator = new PDFGenerator();
  generator.addHeader('Expenses Report', 'Operational Expenses Summary');
  
  if (expenses.length === 0) {
    generator.doc.text('No expenses found', generator.margin, generator.currentY);
    generator.download(`expenses_report_${new Date().toISOString().split('T')[0]}`);
    return;
  }

  // Summary stats and rest of implementation
  const totalExpenses = expenses.reduce((sum, e) => sum + parseFloat(e.amount?.toString() || '0'), 0);
  const approvedExpenses = expenses.filter(e => e.status === 'approved').length;
  const categories = [...new Set(expenses.map(e => e.category))];

  const summaryData = [
    ['Total Expenses', `KES ${totalExpenses.toLocaleString()}`],
    ['Approved Expenses', approvedExpenses.toString()],
    ['Total Categories', categories.length.toString()],
    ['Total Entries', expenses.length.toString()]
  ];

  autoTable(generator.doc, {
    startY: generator.currentY,
    head: [['Metric', 'Value']],
    body: summaryData,
    theme: 'striped',
    headStyles: { fillColor: [231, 76, 60] },
    margin: { left: generator.margin, right: generator.margin }
  });

  generator.currentY = (generator.doc as any).lastAutoTable.finalY + 20;
  generator.checkPageBreak();

  const expensesData = expenses.map(e => [
    e.expenseNo || 'N/A',
    e.category || 'N/A',
    e.description || 'N/A',
    `KES ${parseFloat(e.amount?.toString() || '0').toLocaleString()}`,
    new Date(e.date).toLocaleDateString(),
    e.status || 'N/A'
  ]);

  autoTable(generator.doc, {
    startY: generator.currentY,
    head: [['Expense No', 'Category', 'Description', 'Amount', 'Date', 'Status']],
    body: expensesData,
    theme: 'striped',
    headStyles: { fillColor: [231, 76, 60] },
    margin: { left: generator.margin, right: generator.margin },
    styles: { fontSize: 8 }
  });

  generator.download(`expenses_report_${new Date().toISOString().split('T')[0]}`);
};

export const generateFinesReportPDF = (fines: any[]) => {
  const generator = new PDFGenerator();
  generator.addHeader('Fines & Penalties Report', 'Member Fines Summary');
  
  if (fines.length === 0) {
    generator.doc.text('No fines found', generator.margin, generator.currentY);
    generator.download(`fines_report_${new Date().toISOString().split('T')[0]}`);
    return;
  }

  // 
  const totalFines = fines.reduce((sum, f) => sum + parseFloat(f.amount?.toString() || '0'), 0);
  const paidFines = fines.filter(f => f.status === 'paid').length;
  const overdueFines = fines.filter(f => f.status === 'overdue').length;

  const summaryData = [
    ['Total Fines Amount', `KES ${totalFines.toLocaleString()}`],
    ['Paid Fines', paidFines.toString()],
    ['Overdue Fines', overdueFines.toString()],
    ['Total Fines', fines.length.toString()]
  ];

  autoTable(generator.doc, {
    startY: generator.currentY,
    head: [['Metric', 'Value']],
    body: summaryData,
    theme: 'striped',
    headStyles: { fillColor: [255, 193, 7] },
    margin: { left: generator.margin, right: generator.margin }
  });

  generator.currentY = (generator.doc as any).lastAutoTable.finalY + 20;
  generator.checkPageBreak();

  const finesData = fines.map(f => [
    f.fineNo || 'N/A',
    f.memberName || 'N/A',
    f.reason || 'N/A',
    `KES ${parseFloat(f.amount?.toString() || '0').toLocaleString()}`,
    new Date(f.dueDate).toLocaleDateString(),
    f.status || 'N/A'
  ]);

  autoTable(generator.doc, {
    startY: generator.currentY,
    head: [['Fine No', 'Member', 'Reason', 'Amount', 'Due Date', 'Status']],
    body: finesData,
    theme: 'striped',
    headStyles: { fillColor: [255, 193, 7] },
    margin: { left: generator.margin, right: generator.margin },
    styles: { fontSize: 8 }
  });

  generator.download(`fines_report_${new Date().toISOString().split('T')[0]}`);
};

export const generateDividendsReportPDF = (dividends: any[], memberDividends: any[]) => {
  const generator = new PDFGenerator();
  generator.addHeader('Dividends Report', 'Member Dividends Distribution Summary');
  
  if (dividends.length === 0) {
    generator.doc.text('No dividends found', generator.margin, generator.currentY);
    generator.download(`dividends_report_${new Date().toISOString().split('T')[0]}`);
    return;
  }

  // 
  const totalDistributed = dividends.filter(d => d.status === 'distributed').reduce((sum, d) => sum + d.totalAmount, 0);
  const pendingDistribution = dividends.filter(d => d.status === 'calculated').reduce((sum, d) => sum + d.totalAmount, 0);

  const summaryData = [
    ['Total Distributed', `KES ${totalDistributed.toLocaleString()}`],
    ['Pending Distribution', `KES ${pendingDistribution.toLocaleString()}`],
    ['Distribution Periods', dividends.length.toString()],
    ['Total Members', memberDividends.length.toString()]
  ];

  autoTable(generator.doc, {
    startY: generator.currentY,
    head: [['Metric', 'Value']],
    body: summaryData,
    theme: 'striped',
    headStyles: { fillColor: [142, 68, 173] },
    margin: { left: generator.margin, right: generator.margin }
  });

  generator.currentY = (generator.doc as any).lastAutoTable.finalY + 20;
  generator.checkPageBreak();

  generator.doc.setFontSize(14);
  generator.doc.setFont('helvetica', 'bold');
  generator.doc.text('Dividend History', generator.margin, generator.currentY);
  generator.currentY += 10;

  const dividendsData = dividends.map(d => [
    `${d.year} ${d.period}`,
    `KES ${d.totalAmount.toLocaleString()}`,
    `KES ${d.perShare}`,
    d.shares.toLocaleString(),
    d.dateDistributed ? new Date(d.dateDistributed).toLocaleDateString() : 'Pending',
    d.status
  ]);

  autoTable(generator.doc, {
    startY: generator.currentY,
    head: [['Period', 'Total Amount', 'Per Share', 'Shares', 'Date Distributed', 'Status']],
    body: dividendsData,
    theme: 'striped',
    headStyles: { fillColor: [142, 68, 173] },
    margin: { left: generator.margin, right: generator.margin },
    styles: { fontSize: 9 }
  });

  generator.currentY = (generator.doc as any).lastAutoTable.finalY + 20;
  generator.checkPageBreak();

  if (memberDividends.length > 0) {
    generator.doc.setFontSize(14);
    generator.doc.setFont('helvetica', 'bold');
    generator.doc.text('Member Dividend Breakdown', generator.margin, generator.currentY);
    generator.currentY += 10;

    const memberData = memberDividends.map(m => [
      m.memberName,
      m.shares.toString(),
      `KES ${m.q1Dividend?.toLocaleString() || '0'}`,
      `KES ${m.q2Dividend?.toLocaleString() || '0'}`,
      `KES ${m.totalDividend?.toLocaleString() || '0'}`
    ]);

    autoTable(generator.doc, {
      startY: generator.currentY,
      head: [['Member', 'Shares', 'Q1 Dividend', 'Q2 Dividend', 'Total 2024']],
      body: memberData,
      theme: 'striped',
      headStyles: { fillColor: [142, 68, 173] },
      margin: { left: generator.margin, right: generator.margin },
      styles: { fontSize: 9 }
    });
  }

  generator.download(`dividends_report_${new Date().toISOString().split('T')[0]}`);
};

export const generateMeetingsReportPDF = (meetings: any[]) => {
  const generator = new PDFGenerator();
  generator.addHeader('Meetings Report', 'Chama Meetings and Events Summary');
  
  if (meetings.length === 0) {
    generator.doc.text('No meetings found', generator.margin, generator.currentY);
    generator.download(`meetings_report_${new Date().toISOString().split('T')[0]}`);
    return;
  }

  // 
  const upcomingMeetings = meetings.filter(m => m.status === 'scheduled').length;
  const completedMeetings = meetings.filter(m => m.status === 'completed').length;
  const totalAttendees = meetings.reduce((sum, m) => sum + (m.attendees_count || 0), 0);
  const averageAttendance = meetings.length > 0 ? Math.round(totalAttendees / meetings.length) : 0;

  const summaryData = [
    ['Total Meetings', meetings.length.toString()],
    ['Upcoming Meetings', upcomingMeetings.toString()],
    ['Completed Meetings', completedMeetings.toString()],
    ['Average Attendance', averageAttendance.toString()]
  ];

  autoTable(generator.doc, {
    startY: generator.currentY,
    head: [['Metric', 'Value']],
    body: summaryData,
    theme: 'striped',
    headStyles: { fillColor: [26, 188, 156] },
    margin: { left: generator.margin, right: generator.margin }
  });

  generator.currentY = (generator.doc as any).lastAutoTable.finalY + 20;
  generator.checkPageBreak();

  const meetingsData = meetings.map(m => [
    m.title || 'N/A',
    new Date(m.date).toLocaleDateString(),
    m.time || 'N/A',
    m.venue || 'N/A',
    (m.attendees_count || 0).toString(),
    m.status || 'N/A'
  ]);

  autoTable(generator.doc, {
    startY: generator.currentY,
    head: [['Title', 'Date', 'Time', 'Venue', 'Attendees', 'Status']],
    body: meetingsData,
    theme: 'striped',
    headStyles: { fillColor: [26, 188, 156] },
    margin: { left: generator.margin, right: generator.margin },
    styles: { fontSize: 8 }
  });

  generator.download(`meetings_report_${new Date().toISOString().split('T')[0]}`);
};

export const generateAuditLogsReportPDF = (auditLogs: any[]) => {
  const generator = new PDFGenerator();
  generator.addHeader('Audit Trail Report', 'System Activity and User Actions');
  
  if (auditLogs.length === 0) {
    generator.doc.text('No audit logs found', generator.margin, generator.currentY);
    generator.download(`audit_logs_report_${new Date().toISOString().split('T')[0]}`);
    return;
  }

  // 
  const uniqueActions = [...new Set(auditLogs.map(log => log.action))].length;
  const todayActions = auditLogs.filter(log => 
    new Date(log.created_at).toDateString() === new Date().toDateString()
  ).length;
  const uniqueActors = new Set(auditLogs.map(log => log.actor_id).filter(Boolean)).size;

  const summaryData = [
    ['Total Actions', auditLogs.length.toString()],
    ['Action Types', uniqueActions.toString()],
    ['Today\'s Actions', todayActions.toString()],
    ['Active Users', uniqueActors.toString()]
  ];

  autoTable(generator.doc, {
    startY: generator.currentY,
    head: [['Metric', 'Value']],
    body: summaryData,
    theme: 'striped',
    headStyles: { fillColor: [52, 73, 94] },
    margin: { left: generator.margin, right: generator.margin }
  });

  generator.currentY = (generator.doc as any).lastAutoTable.finalY + 20;
  generator.checkPageBreak();

  const recentLogs = auditLogs.slice(0, 50);
  const logsData = recentLogs.map(log => [
    log.action || 'N/A',
    log.actor_name || 'System',
    new Date(log.created_at).toLocaleDateString(),
    new Date(log.created_at).toLocaleTimeString(),
    log.meta ? JSON.stringify(log.meta).substring(0, 50) + '...' : 'No details'
  ]);

  autoTable(generator.doc, {
    startY: generator.currentY,
    head: [['Action', 'Actor', 'Date', 'Time', 'Details']],
    body: logsData,
    theme: 'striped',
    headStyles: { fillColor: [52, 73, 94] },
    margin: { left: generator.margin, right: generator.margin },
    styles: { fontSize: 7 }
  });

  generator.download(`audit_logs_report_${new Date().toISOString().split('T')[0]}`);
};
