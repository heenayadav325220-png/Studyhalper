import { jsPDF } from 'jspdf';

export interface ExportPdfOptions {
  messages: Array<{
    id: string;
    sender: 'user' | 'ai';
    text: string;
    timestamp: string;
    subject?: string;
    mode?: string;
    image?: string;
  }>;
  user: {
    name: string;
    schoolName?: string;
    className?: string;
    targetGoal?: string;
    xp?: number;
  };
  subject: string;
  tutorMode?: string;
}

/**
 * Strips raw HTML and normalizes markdown formatting for clean, structured PDF output
 */
function cleanMarkdownForPdf(md: string): string[] {
  if (!md) return [];

  // Replace common LaTeX expressions to readable text
  let text = md
    .replace(/\\\[([\s\S]*?)\\\]/g, '$1')
    .replace(/\\\(([\s\S]*?)\\\)/g, '$1')
    .replace(/\$\$(.*?)\$\$/g, '$1')
    .replace(/\$(.*?)\$/g, '$1')
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1 / $2)')
    .replace(/\\sqrt\{([^}]+)\}/g, '√($1)')
    .replace(/\\alpha/g, 'α')
    .replace(/\\beta/g, 'β')
    .replace(/\\theta/g, 'θ')
    .replace(/\\pi/g, 'π')
    .replace(/\\Delta/g, 'Δ')
    .replace(/\\times/g, '×')
    .replace(/\\div/g, '÷')
    .replace(/\\pm/g, '±')
    .replace(/\\le/g, '≤')
    .replace(/\\ge/g, '≥')
    .replace(/\\neq/g, '≠')
    .replace(/\\approx/g, '≈')
    .replace(/\\infty/g, '∞')
    .replace(/\\rightarrow/g, '→')
    .replace(/\\int/g, '∫')
    .replace(/\\sum/g, '∑')
    .replace(/\\lim/g, 'lim');

  // Break by lines
  const rawLines = text.split('\n');
  const processedLines: string[] = [];

  for (const rawLine of rawLines) {
    let line = rawLine.trimEnd();

    // Headers
    if (line.startsWith('### ')) {
      line = '▶ ' + line.replace(/^###\s+/, '').toUpperCase();
    } else if (line.startsWith('## ')) {
      line = '■ ' + line.replace(/^##\s+/, '').toUpperCase();
    } else if (line.startsWith('# ')) {
      line = '◆ ' + line.replace(/^#\s+/, '').toUpperCase();
    }

    // Bold / italic formatting cleanup
    line = line.replace(/\*\*([^*]+)\*\*/g, '$1');
    line = line.replace(/\*([^*]+)\*/g, '$1');
    line = line.replace(/`([^`]+)`/g, '$1');

    // Bullet points
    if (line.match(/^[-*]\s+/)) {
      line = '  • ' + line.replace(/^[-*]\s+/, '');
    }

    processedLines.push(line);
  }

  return processedLines;
}

export async function exportConversationToPdf({
  messages,
  user,
  subject,
  tutorMode = 'Standard',
}: ExportPdfOptions): Promise<void> {
  if (!messages || messages.length === 0) {
    throw new Error('No conversation messages to export.');
  }

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 297mm
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  let currentY = margin;

  const primaryColor: [number, number, number] = [79, 70, 229]; // Indigo-600 #4f46e5
  const darkSlate: [number, number, number] = [15, 23, 42]; // Slate-900 #0f172a
  const userBgColor: [number, number, number] = [238, 242, 255]; // Indigo-50 #eef2ff
  const aiBgColor: [number, number, number] = [248, 250, 252]; // Slate-50 #f8fafc
  const textDark: [number, number, number] = [30, 41, 59]; // Slate-800
  const textMuted: [number, number, number] = [100, 116, 139]; // Slate-500

  const addHeaderDecoration = () => {
    // Top banner color band
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, pageWidth, 5, 'F');
  };

  const addFooter = (pageNum: number, totalPages: number) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...textMuted);

    // Separator line
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(margin, pageHeight - 10, pageWidth - margin, pageHeight - 10);

    doc.text(
      'ASCEND AI STUDY BUDDY • Formatted Study Notes & Solutions',
      margin,
      pageHeight - 6
    );
    doc.text(
      `Page ${pageNum} of ${totalPages}`,
      pageWidth - margin,
      pageHeight - 6,
      { align: 'right' }
    );
  };

  const checkPageBreak = (neededHeight: number): boolean => {
    if (currentY + neededHeight > pageHeight - 16) {
      doc.addPage();
      currentY = margin + 4;
      addHeaderDecoration();
      return true;
    }
    return false;
  };

  addHeaderDecoration();

  // 1. MAIN TITLE
  doc.setFillColor(...darkSlate);
  doc.roundedRect(margin, currentY, contentWidth, 18, 3, 3, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text('STUDYHELPER — AI TUTOR STUDY GUIDE', margin + 6, currentY + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(199, 210, 254);
  doc.text(
    `Subject: ${subject.toUpperCase()}   •   Mode: ${tutorMode.toUpperCase()}   •   Generated: ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
    margin + 6,
    currentY + 14
  );

  currentY += 22;

  // 2. STUDENT METADATA CARD
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, currentY, contentWidth, 16, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...textDark);
  doc.text(`Student: ${user.name || 'Student'}`, margin + 4, currentY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...textMuted);
  const gradeText = user.className ? `Class / Grade: ${user.className}` : 'Grade: General';
  const schoolText = user.schoolName ? `School: ${user.schoolName}` : '';
  const goalText = user.targetGoal ? `Target Goal: ${user.targetGoal}` : '';
  doc.text(`${gradeText}  |  ${schoolText}  |  ${goalText}`, margin + 4, currentY + 11);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryColor);
  doc.text(`${messages.length} Exchanges Recorded`, pageWidth - margin - 4, currentY + 8.5, { align: 'right' });

  currentY += 21;

  // 3. CONVERSATION MESSAGES
  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    const isUser = msg.sender === 'user';
    const lines = cleanMarkdownForPdf(msg.text);

    // Calculate approximate height
    let estimatedHeight = 14; // header + padding
    const wrapWidth = contentWidth - 10;
    
    let totalWrappedLines = 0;
    const wrappedContent: string[][] = [];
    for (const rawLine of lines) {
      const wrapped = doc.splitTextToSize(rawLine || ' ', wrapWidth);
      wrappedContent.push(wrapped);
      totalWrappedLines += wrapped.length;
    }
    estimatedHeight += Math.max(1, totalWrappedLines) * 4.2;

    checkPageBreak(Math.min(estimatedHeight, 40));

    // Message Container Box
    const startY = currentY;
    
    if (isUser) {
      doc.setFillColor(...userBgColor);
      doc.setDrawColor(199, 210, 254);
    } else {
      doc.setFillColor(...aiBgColor);
      doc.setDrawColor(226, 232, 240);
    }
    doc.setLineWidth(0.4);

    // Header label
    const boxHeaderHeight = 7;
    doc.roundedRect(margin, startY, contentWidth, boxHeaderHeight + 2, 2, 2, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    if (isUser) {
      doc.setTextColor(67, 56, 202); // indigo-700
      doc.text(`Q${Math.floor(i / 2) + 1}. STUDENT QUESTION  •  ${msg.timestamp}`, margin + 4, startY + 5.5);
    } else {
      doc.setTextColor(15, 23, 42); // slate-900
      doc.text(`AI TUTOR SOLUTION & EXPLANATION  •  ${msg.subject || subject}`, margin + 4, startY + 5.5);
    }

    currentY += boxHeaderHeight + 2;

    // Body content printing
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...textDark);

    for (let lIdx = 0; lIdx < wrappedContent.length; lIdx++) {
      const lineGroup = wrappedContent[lIdx];
      const originalLine = lines[lIdx];
      const isHeaderLine = originalLine && (originalLine.startsWith('▶') || originalLine.startsWith('■') || originalLine.startsWith('◆'));

      if (isHeaderLine) {
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(67, 56, 202);
      } else {
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...textDark);
      }

      for (const textLine of lineGroup) {
        checkPageBreak(5);
        doc.text(textLine, margin + 4, currentY);
        currentY += 4.4;
      }
    }

    // Box outer border
    const boxHeight = currentY - startY + 2;
    doc.roundedRect(margin, startY, contentWidth, boxHeight, 2, 2, 'D');

    currentY += 5; // Gap between questions
  }

  // Add page numbers and footers to all pages
  const totalPages = doc.getNumberOfPages();
  for (let page = 1; page <= totalPages; page++) {
    doc.setPage(page);
    addFooter(page, totalPages);
  }

  // Save the generated PDF
  const sanitizedSubject = subject.toLowerCase().replace(/[^a-z0-9]/g, '_');
  const dateStr = new Date().toISOString().slice(0, 10);
  const filename = `Ascend_AI_Tutor_${sanitizedSubject}_${dateStr}.pdf`;
  doc.save(filename);
}
