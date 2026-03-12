import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface CVData {
  fullName: string;
  email: string;
  phone: string;
  city: string;
  github: string;
  skills: string[];
  projects: { title: string; status: string }[];
  totalPoints: number;
  level: number;
  streak: number;
}

export const generateCV = (data: CVData, isPremium: boolean = false) => {
  const doc = new jsPDF();

  if (isPremium) {
     // Premium Background Gradient Effect
     doc.setFillColor(240, 240, 255);
     doc.rect(0, 0, 210, 297, 'F');

     // Decorative accent for premium
     doc.setFillColor(60, 80, 255);
     doc.rect(0, 0, 10, 297, 'F');
  }
  const primaryColor = [0, 0, 0]; // Black for professional look

  // Header Background
  doc.setFillColor(245, 245, 245);
  doc.rect(0, 0, 210, 50, 'F');

  // Name & Contact
  doc.setFontSize(26);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text(data.fullName.toUpperCase(), 20, 25);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(`${data.email}  |  ${data.phone}  |  ${data.city}`, 20, 35);
  doc.setTextColor(0, 102, 204);
  doc.text(data.github, 20, 42);

  // Stats / Badges Section
  doc.setFillColor(0, 0, 0);
  doc.rect(20, 55, 170, 15, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(`RANK: LEVEL ${data.level}`, 30, 65);
  doc.text(`TOTAL XP: ${data.totalPoints}`, 80, 65);
  doc.text(`CONSISTENCY STREAK: ${data.streak} DAYS`, 130, 65);

  // Summary
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(14);
  doc.text('PROFESSIONAL SUMMARY', 20, 85);
  doc.setDrawColor(200, 200, 200);
  doc.line(20, 88, 190, 88);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const summary = `Dedicated software engineering student at Pro Dev Portal, specializing in modern web technologies. Highly consistent learner with a strong focus on practical implementation and problem-solving. Currently mastering a full-stack curriculum with intensive deep work focus.`;
  doc.text(doc.splitTextToSize(summary, 170), 20, 95);

  // Skills
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('TECHNICAL SKILLS & PROFICIENCY', 20, 115);
  doc.line(20, 118, 190, 118);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  const skillsPerRow = 3;
  data.skills.forEach((skill, index) => {
     const x = 20 + (index % skillsPerRow) * 60;
     const y = 125 + Math.floor(index / skillsPerRow) * 8;
     doc.setFillColor(240, 240, 240);
     doc.rect(x, y - 5, 55, 6, 'F');
     doc.setTextColor(50, 50, 50);
     doc.text(skill, x + 5, y - 1);
  });

  const nextY = 125 + Math.ceil(data.skills.length / skillsPerRow) * 8 + 10;

  // Projects / Progress
  doc.setFontSize(14);
  doc.setTextColor(0,0,0);
  doc.setFont('helvetica', 'bold');
  doc.text('VERIFIED PROJECTS & MILESTONES', 20, nextY);
  doc.line(20, nextY + 3, 190, nextY + 3);

  autoTable(doc, {
    startY: nextY + 8,
    head: [['Project / Module Name', 'Verification Status']],
    body: data.projects.map(p => [p.title, p.status.toUpperCase()]),
    theme: 'grid',
    headStyles: { fillColor: [0, 0, 0] },
    styles: { fontSize: 9 },
  });

  // Footer
  const finalY = (doc as any).lastAutoTable.finalY + 20;
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text('Verified via Student Training Portal Authentication System', 105, finalY, { align: 'center' });

  doc.save(`CV_${data.fullName.replace(/\s+/g, '_')}.pdf`);
};
