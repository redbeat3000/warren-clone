import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
    lastAutoTable: {
      finalY: number;
    };
  }
}

interface PDFOptions {
  title: string;
  subtitle?: string;
  filename: string;
}

export class PDFGenerator {
  private doc: jsPDF;
  private pageHeight: number;
  private margin: number = 20;
  private currentY: number = 30;

  constructor() {
    this.doc = new jsPDF();
    this.pageHeight = this.doc.internal.pageSize.height;
  }

  private addHeader(title: string, subtitle?: string) {
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

  private checkPageBreak(requiredSpace: number = 30) {
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

    this.doc.autoTable({
      startY: this.currentY,
      head: [['Field', 'Value']],
      body: memberInfo,
      theme: 'striped',
      headStyles: { fillColor: [41, 128, 185] },
      margin: { left: this.margin, right: this.margin }
    });

    this.currentY = this.doc.lastAutoTable.finalY + 20;
    this.checkPageBreak();

    // Financial Summary
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Financial Summary', this.margin, this.currentY);
    this.currentY += 10;

    const totalContributions = data.contributions.reduce((sum: number, c: any) => sum + parseFloat(c.amount?.toString() || '0'), 0);
    const totalFines = data.fines.reduce((sum: number, f: any) => sum + parseFloat(f.amount?.toString() || '0'), 0);
    const totalLoans = data.loans.reduce((sum: number, l: any) => sum + parseFloat(l.principal?.toString() || '0'), 0);
    const meetingsAttended = data.meetingAttendance.filter((a: any) => a.status === 'present').length;
    const totalMeetings = data.meetingAttendance.length;

    const financialSummary = [
      ['Total Contributions', `KES ${totalContributions.toLocaleString()}`],
      ['Total Fines', `KES ${totalFines.toLocaleString()}`],
      ['Total Loans', `KES ${totalLoans.toLocaleString()}`],
      ['Meetings Attended', `${meetingsAttended}/${totalMeetings}`]
    ];

    this.doc.autoTable({
      startY: this.currentY,
      head: [['Metric', 'Value']],
      body: financialSummary,
      theme: 'striped',
      headStyles: { fillColor: [39, 174, 96] },
      margin: { left: this.margin, right: this.margin }
    });

    this.currentY = this.doc.lastAutoTable.finalY + 20;
    this.checkPageBreak();

    // Contributions Section
    if (data.contributions.length > 0) {
      this.doc.setFontSize(14);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text('Contributions History', this.margin, this.currentY);
      this.currentY += 10;

      const contributionsData = data.contributions.map((c: any) => [
        c.contribution_date,
        `KES ${parseFloat(c.amount?.toString() || '0').toLocaleString()}`,
        c.payment_method || 'N/A',
        c.receipt_no || 'N/A',
        c.notes || 'N/A'
      ]);

      this.doc.autoTable({
        startY: this.currentY,
        head: [['Date', 'Amount', 'Method', 'Receipt No', 'Notes']],
        body: contributionsData,
        theme: 'striped',
        headStyles: { fillColor: [52, 152, 219] },
        margin: { left: this.margin, right: this.margin },
        styles: { fontSize: 8 }
      });

      this.currentY = this.doc.lastAutoTable.finalY + 20;
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

      this.doc.autoTable({
        startY: this.currentY,
        head: [['Date', 'Amount', 'Reason', 'Status']],
        body: finesData,
        theme: 'striped',
        headStyles: { fillColor: [231, 76, 60] },
        margin: { left: this.margin, right: this.margin }
      });

      this.currentY = this.doc.lastAutoTable.finalY + 20;
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

      this.doc.autoTable({
        startY: this.currentY,
        head: [['Issue Date', 'Principal', 'Rate', 'Term', 'Due Date', 'Status', 'Notes']],
        body: loansData,
        theme: 'striped',
        headStyles: { fillColor: [142, 68, 173] },
        margin: { left: this.margin, right: this.margin },
        styles: { fontSize: 8 }
      });

      this.currentY = this.doc.lastAutoTable.finalY + 20;
      this.checkPageBreak();
    }

    // Meeting Attendance Section
    if (data.meetingAttendance.length > 0) {
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

      this.doc.autoTable({
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

    this.doc.autoTable({
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

    this.doc.autoTable({
      startY: this.currentY,
      head: [['Metric', 'Value']],
      body: summaryData,
      theme: 'striped',
      headStyles: { fillColor: [39, 174, 96] },
      margin: { left: this.margin, right: this.margin }
    });

    this.currentY = this.doc.lastAutoTable.finalY + 20;

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

    this.doc.autoTable({
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