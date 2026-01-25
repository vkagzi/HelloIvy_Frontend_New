import { jsPDF } from 'jspdf';
import { TranscriptData } from './domain-discovery-api';

/**
 * Remove emojis and problematic Unicode characters that jsPDF can't render
 */
function sanitizeText(text: string): string {
  // Remove emojis and other symbols that jsPDF can't handle
  return text
    .replace(/[\u{1F600}-\u{1F64F}]/gu, '') // Emoticons
    .replace(/[\u{1F300}-\u{1F5FF}]/gu, '') // Misc Symbols and Pictographs
    .replace(/[\u{1F680}-\u{1F6FF}]/gu, '') // Transport and Map
    .replace(/[\u{1F1E0}-\u{1F1FF}]/gu, '') // Flags
    .replace(/[\u{2600}-\u{26FF}]/gu, '')   // Misc symbols
    .replace(/[\u{2700}-\u{27BF}]/gu, '')   // Dingbats
    .replace(/[\u{1F900}-\u{1F9FF}]/gu, '') // Supplemental Symbols and Pictographs
    .replace(/[\u{1FA00}-\u{1FA6F}]/gu, '') // Chess Symbols
    .replace(/[\u{1FA70}-\u{1FAFF}]/gu, '') // Symbols and Pictographs Extended-A
    .replace(/[\u{FE00}-\u{FE0F}]/gu, '')   // Variation Selectors
    .replace(/[\u{200D}]/gu, '')            // Zero Width Joiner
    .trim();
}

/**
 * Generate a PDF transcript from conversation data
 */
export function generateTranscriptPDF(transcript: TranscriptData): Blob {
  // Create new PDF document (A4 size)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - 2 * margin;
  let yPosition = margin;

  // Helper function to add new page if needed
  const checkPageBreak = (heightNeeded: number) => {
    if (yPosition + heightNeeded > pageHeight - margin) {
      doc.addPage();
      yPosition = margin;
      return true;
    }
    return false;
  };

  // Helper function to draw text with wrapping
  const addWrappedText = (
    text: string,
    x: number,
    fontSize: number = 10,
    maxWidth: number = contentWidth,
    lineHeight: number = 5
  ) => {
    doc.setFontSize(fontSize);
    const sanitized = sanitizeText(text);
    const lines = doc.splitTextToSize(sanitized, maxWidth);
    
    for (const line of lines) {
      checkPageBreak(lineHeight);
      doc.text(line, x, yPosition);
      yPosition += lineHeight;
    }
  };

  // Draw header line
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.5);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 10;

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('DOMAIN DISCOVERY SESSION TRANSCRIPT', pageWidth / 2, yPosition, {
    align: 'center',
  });
  yPosition += 10;

  // Session metadata
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  
  const metadata = [
    `Student: ${sanitizeText(transcript.student_name || 'Student')}`,
    `Session ID: ${transcript.session_id}`,
    `Started: ${transcript.started_at || 'N/A'}`,
    `Completed: ${transcript.completed_at || 'In Progress'}`,
    `Total Questions: ${transcript.total_questions || 0}`,
  ];

  metadata.forEach((line) => {
    checkPageBreak(6);
    doc.text(line, margin, yPosition);
    yPosition += 6;
  });

  yPosition += 5;

  // Draw separator line
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 10;

  // Add conversation messages grouped by phase
  if (transcript.messages && transcript.messages.length > 0) {
    // Group messages by phase
    const messagesByPhase: { [key: string]: typeof transcript.messages } = {};
    transcript.messages.forEach((msg) => {
      const phase = msg.phase || 'general';
      if (!messagesByPhase[phase]) {
        messagesByPhase[phase] = [];
      }
      messagesByPhase[phase].push(msg);
    });

    // Render each phase group
    Object.entries(messagesByPhase).forEach(([phase, messages], phaseIndex) => {
      // Phase header
      checkPageBreak(20);
      
      if (phaseIndex > 0) {
        yPosition += 5;
      }
      
      doc.setFillColor(16, 185, 129); // Teal color
      doc.rect(margin, yPosition, contentWidth, 10, 'F');
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(255, 255, 255); // White text
      doc.text(
        `PHASE: ${phase.toUpperCase()}`,
        margin + 5,
        yPosition + 7
      );
      doc.setTextColor(0, 0, 0); // Reset to black
      yPosition += 15;

      // Render messages in this phase
      messages.forEach((msg, index) => {
        // Check if we need space for at least the question header
        checkPageBreak(40);

        // Question header
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        const questionHeader = `Question ${msg.question_number || index + 1}`;
        doc.text(questionHeader, margin, yPosition);
        yPosition += 8;

        // Draw thin separator
        doc.setLineWidth(0.2);
        doc.line(margin, yPosition, pageWidth - margin, yPosition);
        yPosition += 6;

        // AI Coach question
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text('AI Coach:', margin, yPosition);
        yPosition += 6;

        doc.setFont('helvetica', 'normal');
        addWrappedText(msg.bot_question || '', margin + 5, 10, contentWidth - 5);
        yPosition += 4;

        // Student response
        checkPageBreak(20);
        doc.setFont('helvetica', 'bold');
        doc.text('Student Response:', margin, yPosition);
        yPosition += 6;

        doc.setFont('helvetica', 'normal');
        addWrappedText(msg.student_response || '', margin + 5, 10, contentWidth - 5);
        yPosition += 10;
      });
    });
  }

  // Draw footer line
  checkPageBreak(15);
  doc.setLineWidth(0.5);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 8;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('End of Transcript', pageWidth / 2, yPosition, {
    align: 'center',
  });

  // Add page numbers
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(
      `Page ${i} of ${totalPages}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  }

  // Return PDF as blob
  return doc.output('blob');
}
