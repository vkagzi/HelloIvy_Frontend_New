import { jsPDF } from 'jspdf';
import { TranscriptData } from './domain-discovery-api';
import { LOGO_APP_BASE64 } from '@/components/pdf/logo-base64';

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
 * Shared helper to build a professional transcript PDF.
 * Used by both domain discovery and Career & Degree Selection transcripts.
 */
function buildTranscriptPDF(options: {
  title: string;
  headerSubtitle: string;
  brandColor: { r: number; g: number; b: number };
  accentColor: { r: number; g: number; b: number };
  lightBg: { r: number; g: number; b: number };
  coachLabel: string;
  messages: Array<{ questionNumber: number; phase: string; botQuestion: string; studentResponse: string }>;
  studentName: string;
  sessionId: string;
  startedAt: string;
  completedAt: string;
  totalQuestions: number;
}): Blob {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - 2 * margin;

  // Layout constants
  const headerBarHeight = 32;
  const miniHeaderHeight = 16;
  const footerAreaHeight = 18;
  const contentTopFirst = headerBarHeight + 8;
  const contentTopSubsequent = miniHeaderHeight + 6;
  const contentBottom = pageHeight - footerAreaHeight;

  const gray = { r: 75, g: 85, b: 99 };
  const darkText = { r: 31, g: 41, b: 55 };
  const teal = { r: 20, g: 206, b: 207 };
  const lightGray = { r: 229, g: 231, b: 235 };
  const warningBg = { r: 254, g: 249, b: 231 };
  const warningBorder = { r: 245, g: 208, b: 99 };
  const warningText = { r: 146, g: 112, b: 12 };

  let yPosition = contentTopFirst;

  const checkPageBreak = (heightNeeded: number) => {
    if (yPosition + heightNeeded > contentBottom) {
      doc.addPage();
      yPosition = contentTopSubsequent;
      return true;
    }
    return false;
  };

  const resetTextColor = () => {
    doc.setTextColor(darkText.r, darkText.g, darkText.b);
  };

  // === FIRST PAGE HEADER ===
  doc.setFillColor(options.brandColor.r, options.brandColor.g, options.brandColor.b);
  doc.roundedRect(0, 0, pageWidth, headerBarHeight, 0, 0, 'F');
  // Logo
  doc.addImage(LOGO_APP_BASE64, 'PNG', margin, 6, 40, 8);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(options.headerSubtitle, margin, 24);
  resetTextColor();

  // === METADATA CARD ===
  const metaCardHeight = 36;
  doc.setFillColor(options.lightBg.r, options.lightBg.g, options.lightBg.b);
  doc.roundedRect(margin, yPosition, contentWidth, metaCardHeight, 3, 3, 'F');

  const metaX = margin + 8;
  let metaY = yPosition + 8;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  resetTextColor();
  doc.text(sanitizeText(options.studentName || 'Student'), metaX, metaY);
  metaY += 7;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(gray.r, gray.g, gray.b);

  const metaLines = [
    `Session: ${options.sessionId}`,
    `Started: ${options.startedAt}  |  Completed: ${options.completedAt}`,
    `Total Questions: ${options.totalQuestions}`,
  ];
  metaLines.forEach((line) => {
    doc.text(line, metaX, metaY);
    metaY += 5;
  });

  yPosition += metaCardHeight + 10;

  // === CONVERSATION ===
  if (options.messages.length > 0) {
    const messagesByPhase: { [key: string]: typeof options.messages } = {};
    options.messages.forEach((msg) => {
      const phase = msg.phase || 'general';
      if (!messagesByPhase[phase]) messagesByPhase[phase] = [];
      messagesByPhase[phase].push(msg);
    });

    Object.entries(messagesByPhase).forEach(([phase, messages], phaseIndex) => {
      checkPageBreak(20);
      if (phaseIndex > 0) yPosition += 6;

      // Phase header bar
      doc.setFillColor(options.brandColor.r, options.brandColor.g, options.brandColor.b);
      doc.roundedRect(margin, yPosition, contentWidth, 9, 3, 3, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(255, 255, 255);
      doc.text(phase.toUpperCase(), margin + 5, yPosition + 6.5);
      resetTextColor();
      yPosition += 14;

      messages.forEach((msg, index) => {
        checkPageBreak(30);

        // Question number badge
        const qNum = msg.questionNumber || index + 1;
        const badgeW = 28;
        doc.setFillColor(options.brandColor.r, options.brandColor.g, options.brandColor.b);
        doc.roundedRect(margin, yPosition, badgeW, 6, 2, 2, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(255, 255, 255);
        doc.text(`Question ${qNum}`, margin + 2, yPosition + 4.2);
        resetTextColor();
        yPosition += 10;

        // --- AI Coach block ---
        const accentX = margin;
        const textX = margin + 6;
        const textMaxW = contentWidth - 6;

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(options.brandColor.r, options.brandColor.g, options.brandColor.b);
        doc.text(options.coachLabel, textX, yPosition);
        // draw accent segment for label line
        doc.setFillColor(options.brandColor.r, options.brandColor.g, options.brandColor.b);
        doc.rect(accentX, yPosition - 4, 2, 5.5, 'F');
        yPosition += 5.5;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9.5);
        doc.setTextColor(gray.r, gray.g, gray.b);
        const qText = sanitizeText(msg.botQuestion || '');
        const qLines = doc.splitTextToSize(qText, textMaxW);
        for (const line of qLines) {
          checkPageBreak(5.5);
          doc.setFillColor(options.brandColor.r, options.brandColor.g, options.brandColor.b);
          doc.rect(accentX, yPosition - 3.8, 2, 5.5, 'F');
          doc.text(line, textX, yPosition);
          yPosition += 5.5;
        }

        yPosition += 4;

        // --- Student Response block ---
        checkPageBreak(12);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(teal.r, teal.g, teal.b);
        doc.text('Student Response', textX, yPosition);
        doc.setFillColor(teal.r, teal.g, teal.b);
        doc.rect(accentX, yPosition - 4, 2, 5.5, 'F');
        yPosition += 5.5;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9.5);
        doc.setTextColor(gray.r, gray.g, gray.b);
        const rText = sanitizeText(msg.studentResponse || '');
        const rLines = doc.splitTextToSize(rText, textMaxW);
        for (const line of rLines) {
          checkPageBreak(5.5);
          doc.setFillColor(teal.r, teal.g, teal.b);
          doc.rect(accentX, yPosition - 3.8, 2, 5.5, 'F');
          doc.text(line, textX, yPosition);
          yPosition += 5.5;
        }

        yPosition += 4;

        // Divider line between Q&A pairs
        doc.setDrawColor(lightGray.r, lightGray.g, lightGray.b);
        doc.setLineWidth(0.3);
        doc.line(margin, yPosition, pageWidth - margin, yPosition);
        yPosition += 7;
      });
    });
  }

  // === DISCLAIMER ===
  checkPageBreak(22);
  yPosition += 4;
  doc.setFillColor(warningBg.r, warningBg.g, warningBg.b);
  doc.roundedRect(margin, yPosition, contentWidth, 14, 3, 3, 'F');
  doc.setDrawColor(warningBorder.r, warningBorder.g, warningBorder.b);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, yPosition, contentWidth, 14, 3, 3, 'S');
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7);
  doc.setTextColor(warningText.r, warningText.g, warningText.b);
  doc.text(
    'This transcript is generated using AI and is intended for reference purposes only. Responses may not be fully accurate or definitive.',
    pageWidth / 2,
    yPosition + 8.5,
    { align: 'center' },
  );
  yPosition += 20;

  // === END MARKER ===
  checkPageBreak(10);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(gray.r, gray.g, gray.b);
  doc.text('End of Transcript', pageWidth / 2, yPosition, { align: 'center' });

  // === HEADERS & FOOTERS ON ALL PAGES ===
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    // Mini-header on pages after the first
    if (i > 1) {
      doc.setFillColor(options.brandColor.r, options.brandColor.g, options.brandColor.b);
      doc.roundedRect(0, 0, pageWidth, miniHeaderHeight, 0, 0, 'F');
      doc.addImage(LOGO_APP_BASE64, 'PNG', margin, 3, 32, 6.5);
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(options.title, pageWidth - margin, 10, { align: 'right' });
    }

    // Footer
    doc.setDrawColor(lightGray.r, lightGray.g, lightGray.b);
    doc.setLineWidth(0.3);
    doc.line(margin, pageHeight - footerAreaHeight + 2, pageWidth - margin, pageHeight - footerAreaHeight + 2);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(156, 163, 175);
    const footerY = pageHeight - 10;
    doc.textWithLink('helloivy.ai', margin, footerY, { url: 'https://helloivy.ai' });
    const siteWidth = doc.getTextWidth('helloivy.ai');
    doc.text(' | partners@reachivy.com', margin + siteWidth, footerY);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, footerY, { align: 'right' });
  }

  return doc.output('blob');
}

/**
 * Generate a PDF transcript from domain discovery conversation data
 */
export function generateTranscriptPDF(transcript: TranscriptData): Blob {
  return buildTranscriptPDF({
    title: 'Domain Discovery Transcript',
    headerSubtitle: 'Domain Discovery Session Transcript',
    brandColor: { r: 51, g: 119, b: 255 },      // #3377ff
    accentColor: { r: 51, g: 119, b: 255 },
    lightBg: { r: 235, g: 242, b: 255 },          // #ebf2ff
    coachLabel: 'AI Coach',
    studentName: transcript.student_name || 'Student',
    sessionId: transcript.session_id,
    startedAt: transcript.started_at || 'N/A',
    completedAt: transcript.completed_at || 'In Progress',
    totalQuestions: transcript.total_questions || 0,
    messages: (transcript.messages || []).map((msg, i) => ({
      questionNumber: msg.question_number || i + 1,
      phase: msg.phase || 'general',
      botQuestion: msg.bot_question || '',
      studentResponse: msg.student_response || '',
    })),
  });
}

// ================== Career & Degree Selection PDF Functions ==================

/**
 * Data structure for career transcript
 */
export interface CareerTranscriptMessage {
  message_id: string;
  type: 'bot' | 'user';
  content: string;
  step_number: number;
  phase: 'profile' | 'explorer';
  timestamp: string;
}

export interface CareerTranscriptData {
  session_id: string;
  student_name: string;
  started_at?: string;
  completed_at?: string;
  total_questions: number;
  messages: CareerTranscriptMessage[];
}

/**
 * Generate a PDF transcript from Career & Degree Selection conversation data
 */
export function generateCareerTranscriptPDF(transcript: CareerTranscriptData): Blob {
  // Pair bot messages with user responses
  const pairedMessages: Array<{ questionNumber: number; phase: string; botQuestion: string; studentResponse: string }> = [];
  const msgs = transcript.messages || [];
  let questionCount = 0;

  for (let i = 0; i < msgs.length; i++) {
    const msg = msgs[i];
    if (msg.type === 'bot') {
      questionCount++;
      let studentResponse = '';
      if (i + 1 < msgs.length && msgs[i + 1].type === 'user') {
        studentResponse = msgs[i + 1].content || '';
        i++; // skip paired user message
      }
      pairedMessages.push({
        questionNumber: questionCount,
        phase: msg.phase || 'general',
        botQuestion: msg.content || '',
        studentResponse,
      });
    }
  }

  return buildTranscriptPDF({
    title: 'Career & Degree Selection Transcript',
    headerSubtitle: 'Career & Degree Selection Session Transcript',
    brandColor: { r: 127, g: 18, b: 243 },        // #7f12f3
    accentColor: { r: 127, g: 18, b: 243 },
    lightBg: { r: 243, g: 232, b: 255 },            // #f3e8ff (light purple)
    coachLabel: 'Career Coach',
    studentName: transcript.student_name || 'Student',
    sessionId: transcript.session_id,
    startedAt: transcript.started_at || 'N/A',
    completedAt: transcript.completed_at || 'In Progress',
    totalQuestions: transcript.total_questions || 0,
    messages: pairedMessages,
  });
}
