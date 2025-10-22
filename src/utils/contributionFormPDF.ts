import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ContributionFormData {
  memberId: string;
  regularAmount?: string;
  landFundAmount?: string;
  securityFundAmount?: string;
  teaFundAmount?: string;
  xmasSavingsAmount?: string;
  registrationFeeAmount?: string;
  fineAmount?: string;
  loanRepaymentAmount?: string;
  loanId?: string;
  fineId?: string;
  paymentMethod?: string;
  receiptNo?: string;
  notes?: string;
  contributionDate: string;
}

interface Member {
  id: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  member_number?: string; // Added member_number
}

interface Loan {
  id: string;
  principal: number;
  balance?: number;
  member_id: string;
  interest_paid: number;
}

interface Fine {
  id: string;
  amount: number;
  paid_amount: number;
  member_id: string;
  reason: string;
}

export const generateContributionFormPDF = (
  formData: ContributionFormData,
  selectedMember: Member | undefined,
  allLoans: Loan[],
  allFines: Fine[],
  totalAmount: number
) => {
  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.text('Contribution Form Draft', 14, 22);
  doc.setFontSize(11);
  doc.setTextColor(100);

  let y = 30;

  // Member Info
  if (selectedMember) {
    const memberName = selectedMember.full_name || `${selectedMember.first_name || ''} ${selectedMember.last_name || ''}`;
    doc.text(`Member: ${memberName} (Member No: ${selectedMember.member_number || 'N/A'})`, 14, y);
    y += 7;
  }
  doc.text(`Date: ${formData.contributionDate}`, 14, y);
  y += 7;
  doc.text(`Payment Method: ${formData.paymentMethod || 'N/A'}`, 14, y);
  y += 7;
  if (formData.receiptNo) {
    doc.text(`Receipt No: ${formData.receiptNo}`, 14, y);
    y += 7;
  }
  if (formData.notes) {
    doc.text(`Notes: ${formData.notes}`, 14, y);
    y += 7;
  }

  y += 10; // Spacer

  // Contribution Amounts and Other Payments
  const transactionRows = [];
  if (formData.regularAmount && +formData.regularAmount > 0) transactionRows.push(['Regular', `KES ${Number(formData.regularAmount).toLocaleString()}`]);
  if (formData.landFundAmount && +formData.landFundAmount > 0) transactionRows.push(['Land Fund', `KES ${Number(formData.landFundAmount).toLocaleString()}`]);
  if (formData.securityFundAmount && +formData.securityFundAmount > 0) transactionRows.push(['Security Fund', `KES ${Number(formData.securityFundAmount).toLocaleString()}`]);
  if (formData.teaFundAmount && +formData.teaFundAmount > 0) transactionRows.push(['Tea Fund', `KES ${Number(formData.teaFundAmount).toLocaleString()}`]);
  if (formData.xmasSavingsAmount && +formData.xmasSavingsAmount > 0) transactionRows.push(['Xmas Savings', `KES ${Number(formData.xmasSavingsAmount).toLocaleString()}`]);
  if (formData.registrationFeeAmount && +formData.registrationFeeAmount > 0) transactionRows.push(['Registration Fee', `KES ${Number(formData.registrationFeeAmount).toLocaleString()}`]);
  if (formData.fineId && formData.fineAmount && +formData.fineAmount > 0) {
    const selectedFine = allFines.find(f => f.id === formData.fineId);
    transactionRows.push([`Fine: ${selectedFine?.reason || 'Unknown'}`, `KES ${Number(formData.fineAmount).toLocaleString()}`]);
  }
  if (formData.loanId && formData.loanRepaymentAmount && +formData.loanRepaymentAmount > 0) {
    const selectedLoan = allLoans.find(l => l.id === formData.loanId);
    transactionRows.push([`Loan Repayment: #${selectedLoan?.id.slice(-4) || 'Unknown'}`, `KES ${Number(formData.loanRepaymentAmount).toLocaleString()}`]);
  }

  autoTable(doc, {
    startY: y,
    head: [['Type', 'Amount']],
    body: transactionRows,
    theme: 'grid',
    styles: { fontSize: 10, cellPadding: 2 },
    headStyles: { fillColor: [200, 200, 200], textColor: [0, 0, 0] },
    margin: { left: 14, right: 14 },
  });
  y = (doc as any).lastAutoTable.finalY + 10;

  // Total Amount
  doc.setFontSize(16);
  doc.text(`Total Amount: KES ${totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 14, y);

  doc.save(`Contribution_Draft_${selectedMember?.full_name || 'Unknown'}_${formData.contributionDate}.pdf`);
};