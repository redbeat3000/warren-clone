import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

export const generateAllLoansReportPDF = async (loans: any[]) => {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(18);
  doc.text('All Loans Report', 14, 20);
  
  doc.setFontSize(12);
  doc.text(`Generated: ${format(new Date(), 'PPP')}`, 14, 30);
  doc.text(`Total Loans: ${loans.length}`, 14, 37);
  
  const totalPrincipal = loans.reduce((sum, loan) => sum + loan.principal, 0);
  const totalInterest = loans.reduce((sum, loan) => sum + (loan.total_interest_calculated || 0), 0);
  const totalPaid = loans.reduce((sum, loan) => sum + (loan.interest_paid || 0), 0);
  
  doc.text(`Total Principal Disbursed: KES ${totalPrincipal.toLocaleString()}`, 14, 44);
  doc.text(`Total Interest Expected: KES ${totalInterest.toLocaleString()}`, 14, 51);
  doc.text(`Total Paid: KES ${totalPaid.toLocaleString()}`, 14, 58);
  
  // Loans Table
  const tableData = loans.map(loan => {
    const outstanding = loan.principal - (loan.interest_paid || 0);
    return [
      loan.member?.member_no || 'N/A',
      loan.member?.full_name || 'Unknown',
      format(new Date(loan.issue_date), 'PP'),
      `KES ${loan.principal.toLocaleString()}`,
      `${loan.interest_rate}%`,
      `${loan.term_months} mo`,
      loan.status,
      `KES ${outstanding.toLocaleString()}`
    ];
  });
  
  autoTable(doc, {
    startY: 70,
    head: [['Member No', 'Member Name', 'Issue Date', 'Amount', 'Rate', 'Term', 'Status', 'Outstanding']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [59, 130, 246] },
    styles: { fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 20 },
      1: { cellWidth: 35 },
      2: { cellWidth: 25 },
      3: { cellWidth: 25 },
      4: { cellWidth: 15 },
      5: { cellWidth: 15 },
      6: { cellWidth: 20 },
      7: { cellWidth: 25 }
    }
  });
  
  // Save PDF
  doc.save(`All_Loans_Report_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
};
