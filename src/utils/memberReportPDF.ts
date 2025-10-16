import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

export const generateMemberReportPDF = async (memberData: any, contributions: any[], loans: any[], loanRepayments: any[], fines: any[]) => {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(18);
  doc.text('Member Financial Report', 14, 20);
  
  doc.setFontSize(12);
  doc.text(`Generated: ${format(new Date(), 'PPP')}`, 14, 30);
  
  // Member Details
  doc.setFontSize(14);
  doc.text('Member Details', 14, 45);
  doc.setFontSize(10);
  doc.text(`Name: ${memberData.full_name}`, 14, 55);
  doc.text(`Member No: ${memberData.member_no}`, 14, 62);
  doc.text(`Email: ${memberData.email || 'N/A'}`, 14, 69);
  doc.text(`Phone: ${memberData.phone || 'N/A'}`, 14, 76);
  
  let yPos = 90;
  
  // Contributions Section
  doc.setFontSize(14);
  doc.text('Contribution History', 14, yPos);
  yPos += 5;
  
  if (contributions && contributions.length > 0) {
    autoTable(doc, {
      startY: yPos,
      head: [['Date', 'Type', 'Amount (KES)', 'Payment Method', 'Receipt No']],
      body: contributions.map(c => [
        format(new Date(c.contribution_date), 'PP'),
        c.contribution_type || 'regular',
        c.amount.toLocaleString(),
        c.payment_method || 'N/A',
        c.receipt_no || 'N/A'
      ]),
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246] },
    });
    yPos = (doc as any).lastAutoTable.finalY + 10;
  } else {
    doc.setFontSize(10);
    doc.text('No contributions recorded', 14, yPos + 5);
    yPos += 20;
  }
  
  // Loans Section
  if (yPos > 250) {
    doc.addPage();
    yPos = 20;
  }
  
  doc.setFontSize(14);
  doc.text('Loan History', 14, yPos);
  yPos += 5;
  
  if (loans && loans.length > 0) {
    loans.forEach((loan, index) => {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.setFontSize(12);
      doc.text(`Loan ${index + 1}`, 14, yPos);
      yPos += 7;
      
      doc.setFontSize(10);
      doc.text(`Amount: KES ${loan.principal.toLocaleString()}`, 14, yPos);
      doc.text(`Interest Rate: ${loan.interest_rate}%`, 100, yPos);
      yPos += 7;
      doc.text(`Issue Date: ${format(new Date(loan.issue_date), 'PP')}`, 14, yPos);
      doc.text(`Term: ${loan.term_months} months`, 100, yPos);
      yPos += 7;
      doc.text(`Status: ${loan.status}`, 14, yPos);
      doc.text(`Outstanding: KES ${(loan.principal - (loan.interest_paid || 0)).toLocaleString()}`, 100, yPos);
      yPos += 10;
      
      // Loan Repayments
      const loanRepaymentsForThisLoan = loanRepayments.filter(r => r.loan_id === loan.id);
      
      if (loanRepaymentsForThisLoan.length > 0) {
        if (yPos > 230) {
          doc.addPage();
          yPos = 20;
        }
        
        autoTable(doc, {
          startY: yPos,
          head: [['Date', 'Amount', 'Principal', 'Interest', 'Method']],
          body: loanRepaymentsForThisLoan.map(r => [
            format(new Date(r.payment_date), 'PP'),
            `KES ${r.amount.toLocaleString()}`,
            `KES ${(r.principal_portion || 0).toLocaleString()}`,
            `KES ${(r.interest_portion || 0).toLocaleString()}`,
            r.payment_method || 'N/A'
          ]),
          theme: 'grid',
          headStyles: { fillColor: [34, 197, 94] },
        });
        yPos = (doc as any).lastAutoTable.finalY + 10;
      }
    });
  } else {
    doc.setFontSize(10);
    doc.text('No loans recorded', 14, yPos + 5);
    yPos += 20;
  }
  
  // Fines Section
  if (yPos > 250) {
    doc.addPage();
    yPos = 20;
  }
  
  doc.setFontSize(14);
  doc.text('Fines & Penalties', 14, yPos);
  yPos += 5;
  
  if (fines && fines.length > 0) {
    autoTable(doc, {
      startY: yPos,
      head: [['Date', 'Reason', 'Amount (KES)', 'Paid (KES)', 'Status']],
      body: fines.map(f => [
        format(new Date(f.fine_date), 'PP'),
        f.reason || 'N/A',
        f.amount.toLocaleString(),
        (f.paid_amount || 0).toLocaleString(),
        f.status
      ]),
      theme: 'striped',
      headStyles: { fillColor: [239, 68, 68] },
    });
  } else {
    doc.setFontSize(10);
    doc.text('No fines recorded', 14, yPos + 5);
  }
  
  // Save PDF
  doc.save(`${memberData.member_no}_${memberData.full_name}_Report.pdf`);
};
