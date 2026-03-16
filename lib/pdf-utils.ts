import { jsPDF } from 'jspdf';
import { TranscriptData, InterestScores, DomainRecommendation } from './domain-discovery-api';

/**
 * Data structure for the comprehensive domain results PDF
 */
export interface DomainResultsData {
  studentName: string;
  sessionId: string;
  startedAt?: string;
  completedAt?: string;
  // Student profile details
  dateOfBirth?: string;
  academicLevel?: string;
  gradeLevel?: string;
  location?: string;
  interestScores: InterestScores;
  interests: string[];
  strengths: string[];
  recommendations: DomainRecommendation[];
}

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
      
      doc.setFillColor(51, 119, 255); // Brand Blue #3377ff
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

// ================== Career Discovery PDF Functions ==================

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
 * Data structure for career recommendation in PDF
 */
export interface CareerRecommendationData {
  career_title: string;
  salary_range: string;
  match_percentage: number;
  required_skills: string[];
  next_steps: string[];
  description: string;
  why_recommended: string;
  alignment_points: string[];
  related_subjects: string[];
  day_in_life: string;
  pros_and_cons: { pros: string[]; cons: string[] };
  work_life_balance: string;
}

/**
 * Data structure for career results PDF
 */
export interface CareerResultsData {
  studentName: string;
  sessionId: string;
  startedAt?: string;
  completedAt?: string;
  dateOfBirth?: string;
  academicLevel?: string;
  gradeLevel?: string;
  location?: string;
  recommendations: CareerRecommendationData[];
}

/**
 * Generate a PDF transcript from career discovery conversation data
 */
export function generateCareerTranscriptPDF(transcript: CareerTranscriptData): Blob {
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

  const checkPageBreak = (heightNeeded: number) => {
    if (yPosition + heightNeeded > pageHeight - margin) {
      doc.addPage();
      yPosition = margin;
      return true;
    }
    return false;
  };

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
  doc.text('CAREER DISCOVERY SESSION TRANSCRIPT', pageWidth / 2, yPosition, {
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

  // Group messages into Q&A pairs
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
      checkPageBreak(20);
      
      if (phaseIndex > 0) {
        yPosition += 5;
      }
      
      // Phase header with purple color for career discovery
      doc.setFillColor(127, 18, 243); // Logo Purple #7f12f3
      doc.rect(margin, yPosition, contentWidth, 10, 'F');
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(255, 255, 255);
      doc.text(
        `PHASE: ${phase.toUpperCase()}`,
        margin + 5,
        yPosition + 7
      );
      doc.setTextColor(0, 0, 0);
      yPosition += 15;

      // Group messages into Q&A pairs (bot question followed by user response)
      let questionNumber = 0;
      for (let i = 0; i < messages.length; i++) {
        const msg = messages[i];
        
        if (msg.type === 'bot') {
          questionNumber++;
          checkPageBreak(40);

          // Question header
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(12);
          doc.text(`Question ${questionNumber}`, margin, yPosition);
          yPosition += 8;

          // Draw thin separator
          doc.setLineWidth(0.2);
          doc.line(margin, yPosition, pageWidth - margin, yPosition);
          yPosition += 6;

          // AI Coach question
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(10);
          doc.text('Career Coach:', margin, yPosition);
          yPosition += 6;

          doc.setFont('helvetica', 'normal');
          addWrappedText(msg.content || '', margin + 5, 10, contentWidth - 5);
          yPosition += 4;

          // Look for the next user response
          if (i + 1 < messages.length && messages[i + 1].type === 'user') {
            const userMsg = messages[i + 1];
            checkPageBreak(20);
            doc.setFont('helvetica', 'bold');
            doc.text('Student Response:', margin, yPosition);
            yPosition += 6;

            doc.setFont('helvetica', 'normal');
            addWrappedText(userMsg.content || '', margin + 5, 10, contentWidth - 5);
            yPosition += 10;
            i++; // Skip the user message since we've already processed it
          }
        }
      }
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

  return doc.output('blob');
}

/**
 * Generate a comprehensive PDF with career recommendations
 */
export function generateCareerResultsPDF(data: CareerResultsData): Blob {
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

  const checkPageBreak = (heightNeeded: number) => {
    if (yPosition + heightNeeded > pageHeight - margin) {
      doc.addPage();
      yPosition = margin;
      return true;
    }
    return false;
  };

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
  doc.setFontSize(20);
  doc.text('CAREER DISCOVERY RESULTS', pageWidth / 2, yPosition, {
    align: 'center',
  });
  yPosition += 12;

  // Format dates
  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const calculateDuration = () => {
    if (!data.startedAt || !data.completedAt) return null;
    const start = new Date(data.startedAt).getTime();
    const end = new Date(data.completedAt).getTime();
    const durationMs = end - start;
    return Math.ceil(durationMs / 60000);
  };

  const duration = calculateDuration();

  const formatDateOfBirth = (dateStr?: string) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Session metadata
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);

  const metadata = [
    `Student Name: ${sanitizeText(data.studentName || 'Student')}`,
    ...(data.dateOfBirth ? [`Date of Birth: ${formatDateOfBirth(data.dateOfBirth)}`] : []),
    ...(data.academicLevel ? [`Academic Level: ${data.academicLevel}`] : []),
    ...(data.gradeLevel ? [`Grade Level: ${data.gradeLevel}`] : []),
    ...(data.location ? [`Location: ${data.location}`] : []),
    `Session ID: ${data.sessionId}`,
    `Started: ${formatDateTime(data.startedAt)}`,
    `Completed: ${formatDateTime(data.completedAt)}`,
    ...(duration ? [`Duration: ${duration} minute${duration === 1 ? '' : 's'}`] : []),
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

  // ==================== Summary Section ====================
  if (data.recommendations.length > 0) {
    checkPageBreak(30);

    // Summary header
    doc.setFillColor(127, 18, 243); // Logo Purple #7f12f3
    doc.rect(margin, yPosition, contentWidth, 10, 'F');
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.text('CAREER RECOMMENDATIONS SUMMARY', margin + 5, yPosition + 7);
    doc.setTextColor(0, 0, 0);
    yPosition += 15;

    // Summary stats - only show total count
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Total Career Matches: ${data.recommendations.length}`, margin, yPosition);
    yPosition += 10;
  }

  // ==================== Career Recommendations Section ====================
  if (data.recommendations.length > 0) {
    checkPageBreak(20);

    // Each career recommendation
    data.recommendations.forEach((career, index) => {
      checkPageBreak(80);
      
      const cardStartY = yPosition;
      
      // Career rank and title on colored header
      doc.setFillColor(127, 18, 243); // Logo Purple #7f12f3
      doc.rect(margin, cardStartY, contentWidth, 12, 'F');
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(255, 255, 255);
      
      // Wrap career title if too long (leave space for badge)
      const titleMaxWidth = contentWidth - 45; // Leave space for badge
      const titleText = `#${index + 1} ${sanitizeText(career.career_title)}`;
      const titleLines = doc.splitTextToSize(titleText, titleMaxWidth);
      // Only show first line in header to avoid overflow
      if (titleLines[0]) {
        doc.text(titleLines[0], margin + 5, cardStartY + 8);
      }
      doc.setTextColor(0, 0, 0);
      
      // Match percentage badge - white background with colored ring
      const matchColor = career.match_percentage >= 90 ? [16, 185, 129] :  // Emerald
                         career.match_percentage >= 80 ? [59, 130, 246] :   // Blue
                         career.match_percentage >= 70 ? [251, 191, 36] :   // Amber
                         [107, 114, 128];                                    // Gray
      
      // White circle background for badge
      doc.setFillColor(255, 255, 255);
      doc.circle(pageWidth - margin - 17, cardStartY + 6, 6, 'F');
      
      // Colored ring
      doc.setDrawColor(matchColor[0], matchColor[1], matchColor[2]);
      doc.setLineWidth(0.8);
      doc.circle(pageWidth - margin - 17, cardStartY + 6, 6, 'S');
      
      // Match percentage text
      doc.setTextColor(matchColor[0], matchColor[1], matchColor[2]);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text(`${career.match_percentage}%`, pageWidth - margin - 17, cardStartY + 7, { align: 'center' });
      doc.setTextColor(0, 0, 0);
      
      // Reset line width
      doc.setLineWidth(0.5);
      
      yPosition = cardStartY + 16;
      
      // Track content start for background
      const contentStartY = yPosition;
      
      // Career card background - will be drawn after calculating actual height
      doc.setFillColor(235, 242, 255); // Brand light background #ebf2ff
      
      // Salary range
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(107, 114, 128);
      const salaryLabel = 'Salary Range: ';
      const salaryLabelWidth = doc.getTextWidth(salaryLabel);
      const salaryText = sanitizeText(career.salary_range);
      
      // Always put salary on same line if possible
      const availableWidth = contentWidth - 10 - salaryLabelWidth;
      doc.text(salaryLabel, margin + 5, yPosition);
      doc.setTextColor(0, 0, 0);
      
      if (availableWidth < 30) {
        // Not enough space, put on new line
        yPosition += 4;
        const salaryLines = doc.splitTextToSize(salaryText, contentWidth - 10);
        salaryLines.forEach((line: string, idx: number) => {
          doc.text(line, margin + 5, yPosition);
          if (idx < salaryLines.length - 1) yPosition += 4;
        });
      } else {
        const salaryLines = doc.splitTextToSize(salaryText, availableWidth);
        doc.text(salaryLines[0], margin + 5 + salaryLabelWidth, yPosition);
        for (let i = 1; i < salaryLines.length; i++) {
          yPosition += 4;
          doc.text(salaryLines[i], margin + 5, yPosition);
        }
      }
      yPosition += 6;
      
      // Description section with better spacing
      if (career.description) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        addWrappedText(sanitizeText(career.description), margin + 5, 9, contentWidth - 10, 4);
        yPosition += 2;
      }
      
      // Why recommended section
      if (career.why_recommended) {
        yPosition += 2;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        const whyLabel = 'Why Recommended:';
        const whyLabelLines = doc.splitTextToSize(whyLabel, contentWidth - 10);
        doc.text(whyLabelLines[0], margin + 5, yPosition);
        yPosition += 4;
        doc.setFont('helvetica', 'normal');
        addWrappedText(sanitizeText(career.why_recommended), margin + 5, 9, contentWidth - 10, 4);
        yPosition += 2;
      }
      
      // Day in the Life section
      if (career.day_in_life) {
        yPosition += 2;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.text('A Day in the Life:', margin + 5, yPosition);
        yPosition += 4;
        doc.setFont('helvetica', 'normal');
        addWrappedText(sanitizeText(career.day_in_life), margin + 5, 9, contentWidth - 10, 4);
        yPosition += 2;
      }
      
      // Pros and Cons section
      if (career.pros_and_cons && (career.pros_and_cons.pros?.length > 0 || career.pros_and_cons.cons?.length > 0)) {
        yPosition += 2;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.text('Pros & Cons:', margin + 5, yPosition);
        yPosition += 4;
        
        if (career.pros_and_cons.pros?.length > 0) {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(9);
          doc.setTextColor(22, 163, 74); // Green
          doc.text('Pros:', margin + 5, yPosition);
          doc.setTextColor(0, 0, 0);
          yPosition += 4;
          doc.setFont('helvetica', 'normal');
          career.pros_and_cons.pros.forEach((pro: string) => {
            checkPageBreak(4);
            const proText = sanitizeText(`+ ${pro}`);
            const proLines = doc.splitTextToSize(proText, contentWidth - 15);
            proLines.forEach((line: string) => {
              doc.text(line, margin + 8, yPosition);
              yPosition += 4;
            });
          });
          yPosition += 2;
        }
        
        if (career.pros_and_cons.cons?.length > 0) {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(9);
          doc.setTextColor(220, 38, 38); // Red
          doc.text('Cons:', margin + 5, yPosition);
          doc.setTextColor(0, 0, 0);
          yPosition += 4;
          doc.setFont('helvetica', 'normal');
          career.pros_and_cons.cons.forEach((con: string) => {
            checkPageBreak(4);
            const conText = sanitizeText(`- ${con}`);
            const conLines = doc.splitTextToSize(conText, contentWidth - 15);
            conLines.forEach((line: string) => {
              doc.text(line, margin + 8, yPosition);
              yPosition += 4;
            });
          });
          yPosition += 2;
        }
      }
      
      // Work-Life Balance section
      if (career.work_life_balance) {
        yPosition += 2;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.text('Work-Life Balance:', margin + 5, yPosition);
        yPosition += 4;
        doc.setFont('helvetica', 'normal');
        addWrappedText(sanitizeText(career.work_life_balance), margin + 5, 9, contentWidth - 10, 4);
        yPosition += 2;
      }
      
      // Required skills section
      if (career.required_skills && career.required_skills.length > 0) {
        yPosition += 2;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        const skillsLabel = 'Required Skills: ';
        const skillsLabelWidth = doc.getTextWidth(skillsLabel);
        const skillsText = sanitizeText(career.required_skills.join(', '));
        
        // If label + text would overflow, put on separate lines
        const availableWidth = contentWidth - 10 - skillsLabelWidth;
        if (availableWidth < 30 || skillsLabelWidth > (contentWidth - 10) * 0.4) {
          // Put label on its own line
          doc.text(skillsLabel, margin + 5, yPosition);
          yPosition += 4;
          doc.setFont('helvetica', 'normal');
          const skillsLines = doc.splitTextToSize(skillsText, contentWidth - 10);
          skillsLines.forEach((line: string) => {
            checkPageBreak(4);
            doc.text(line, margin + 5, yPosition);
            yPosition += 4;
          });
        } else {
          // Keep label and text on same line
          doc.text(skillsLabel, margin + 5, yPosition);
          doc.setFont('helvetica', 'normal');
          const skillsLines = doc.splitTextToSize(skillsText, availableWidth);
          doc.text(skillsLines[0], margin + 5 + skillsLabelWidth, yPosition);
          for (let i = 1; i < skillsLines.length; i++) {
            yPosition += 4;
            checkPageBreak(4);
            doc.text(skillsLines[i], margin + 5, yPosition);
          }
        }
        yPosition += 6;
      }
      
      // Next steps section with improved formatting
      if (career.next_steps && career.next_steps.length > 0) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        const nextStepsLabel = 'Next Steps:';
        const nextStepsLabelLines = doc.splitTextToSize(nextStepsLabel, contentWidth - 10);
        doc.text(nextStepsLabelLines[0], margin + 5, yPosition);
        yPosition += 4;
        doc.setFont('helvetica', 'normal');
        career.next_steps.forEach((step, idx) => {
          checkPageBreak(4.5);
          const stepText = `${idx + 1}. ${sanitizeText(step)}`;
          const stepLines = doc.splitTextToSize(stepText, contentWidth - 15);
          stepLines.forEach((line: string, lineIdx: number) => {
            doc.text(line, margin + (lineIdx === 0 ? 8 : 11), yPosition);
            yPosition += 4.5;
          });
        });
        yPosition += 2;
      }
      
      // Alignment points section
      if (career.alignment_points && career.alignment_points.length > 0) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        const alignmentLabel = 'How This Matches Your Interests:';
        const alignmentLabelLines = doc.splitTextToSize(alignmentLabel, contentWidth - 10);
        doc.text(alignmentLabelLines[0], margin + 5, yPosition);
        if (alignmentLabelLines.length > 1) {
          yPosition += 4;
          doc.text(alignmentLabelLines[1], margin + 5, yPosition);
        }
        yPosition += 4;
        doc.setFont('helvetica', 'normal');
        career.alignment_points.forEach((point) => {
          checkPageBreak(4);
          const bulletPoint = sanitizeText(`• ${point}`);
          const pointLines = doc.splitTextToSize(bulletPoint, contentWidth - 15);
          pointLines.forEach((line: string) => {
            doc.text(line, margin + 8, yPosition);
            yPosition += 4;
          });
        });
      }

      yPosition += 10;
    });
  }

  // Draw footer line
  checkPageBreak(15);
  doc.setLineWidth(0.5);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 8;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Generated by HelloIvy Career Discovery', pageWidth / 2, yPosition, {
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

  return doc.output('blob');
}

/**
 * Generate a comprehensive PDF with interest profile scores and domain recommendations
 */
export function generateDomainResultsPDF(data: DomainResultsData): Blob {
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
  doc.setFontSize(20);
  doc.text('DOMAIN DISCOVERY RESULTS', pageWidth / 2, yPosition, {
    align: 'center',
  });
  yPosition += 12;

  // Session metadata
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  
  // Format dates in human-readable format
  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };
  
  // Calculate duration in minutes (rounded up)
  const calculateDuration = () => {
    if (!data.startedAt || !data.completedAt) return null;
    const start = new Date(data.startedAt).getTime();
    const end = new Date(data.completedAt).getTime();
    const durationMs = end - start;
    return Math.ceil(durationMs / 60000); // Round up to minutes
  };
  
  const duration = calculateDuration();
  
  // Format date of birth in human-readable format  
  const formatDateOfBirth = (dateStr?: string) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };
  
  const metadata = [
    `Student Name: ${sanitizeText(data.studentName || 'Student')}`,
    ...(data.dateOfBirth ? [`Date of Birth: ${formatDateOfBirth(data.dateOfBirth)}`] : []),
    ...(data.academicLevel ? [`Academic Level: ${data.academicLevel}`] : []),
    ...(data.gradeLevel ? [`Grade Level: ${data.gradeLevel}`] : []),
    ...(data.location ? [`Location: ${data.location}`] : []),
    `Session ID: ${data.sessionId}`,
    `Started: ${formatDateTime(data.startedAt)}`,
    `Completed: ${formatDateTime(data.completedAt)}`,
    ...(duration ? [`Duration: ${duration} minute${duration === 1 ? '' : 's'}`] : []),
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

  // ==================== Interest Profile Section (DISABLED - RIASEC removed) ====================
  // The interest profile section has been disabled as RIASEC analysis is no longer included.
  // Keeping this comment for future reference if we need to re-enable it.

  // ==================== Interests & Strengths Section ====================
  if (data.interests.length > 0 || data.strengths.length > 0) {
    checkPageBreak(40);
    
    // Section header
    doc.setFillColor(51, 119, 255); // Brand Blue #3377ff
    doc.rect(margin, yPosition, contentWidth, 10, 'F');
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.text('YOUR INTERESTS & STRENGTHS', margin + 5, yPosition + 7);
    doc.setTextColor(0, 0, 0);
    yPosition += 15;

    // Interests
    if (data.interests.length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('Interests:', margin, yPosition);
      yPosition += 6;
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      const interestsText = data.interests.join(', ');
      addWrappedText(interestsText, margin, 10, contentWidth);
      yPosition += 5;
    }

    // Strengths
    if (data.strengths.length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('Strengths:', margin, yPosition);
      yPosition += 6;
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      const strengthsText = data.strengths.join(', ');
      addWrappedText(strengthsText, margin, 10, contentWidth);
      yPosition += 5;
    }
  }

  yPosition += 5;

  // ==================== Domain Recommendations Section ====================
  if (data.recommendations.length > 0) {
    checkPageBreak(20);
    
    // Section header
    doc.setFillColor(20, 206, 207); // Brand Teal #14cecf
    doc.rect(margin, yPosition, contentWidth, 10, 'F');
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.text('RECOMMENDED DOMAINS', margin + 5, yPosition + 7);
    doc.setTextColor(0, 0, 0);
    yPosition += 15;

    // Summary stats - only show total count
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Total Domains: ${data.recommendations.length}`, margin, yPosition);
    yPosition += 10;

    // Each domain recommendation
    data.recommendations.forEach((domain, index) => {
      checkPageBreak(70);
      
      // Calculate content height for this domain card
      let estimatedHeight = 68; // Increased base height
      
      // Estimate height for why_recommended text
      doc.setFontSize(9);
      const whyText = sanitizeText(domain.why_recommended || domain.description);
      const whyLines = doc.splitTextToSize(whyText, contentWidth - 10);
      estimatedHeight += whyLines.length * 4;
      
      // Add space for key interests, sub-domains, careers if present
      if (domain.key_interests && domain.key_interests.length > 0) {
        const interestsText = sanitizeText(domain.key_interests.slice(0, 5).join(', '));
        const interestsLines = doc.splitTextToSize(interestsText, contentWidth - 35);
        estimatedHeight += Math.max(interestsLines.length * 4, 6);
      }
      if (domain.sub_domains && domain.sub_domains.length > 0) {
        const subDomainsText = sanitizeText(domain.sub_domains.slice(0, 4).join(', '));
        const subDomainsLines = doc.splitTextToSize(subDomainsText, contentWidth - 30);
        estimatedHeight += Math.max(subDomainsLines.length * 4, 6);
      }
      if (domain.potential_careers && domain.potential_careers.length > 0) {
        const careersText = sanitizeText(domain.potential_careers.slice(0, 4).join(', '));
        const careersLines = doc.splitTextToSize(careersText, contentWidth - 20);
        estimatedHeight += Math.max(careersLines.length * 4, 6);
      }
      
      // Domain card background
      doc.setFillColor(235, 242, 255); // Brand blue-50 #ebf2ff
      doc.rect(margin, yPosition, contentWidth, estimatedHeight, 'F');
      
      // Domain header with colored strip
      doc.setFillColor(51, 119, 255); // Brand Blue #3377ff
      doc.rect(margin, yPosition, contentWidth, 12, 'F');
      
      // Domain rank and title
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(255, 255, 255);
      
      // Wrap domain title if too long (leave space for badge)
      const domainTitleMaxWidth = contentWidth - 45; // Leave space for badge
      const domainTitleText = `#${index + 1} ${sanitizeText(domain.domain_title)}`;
      const domainTitleLines = doc.splitTextToSize(domainTitleText, domainTitleMaxWidth);
      // Only show first line in header to avoid overflow
      if (domainTitleLines[0]) {
        doc.text(domainTitleLines[0], margin + 5, yPosition + 8);
      }
      doc.setTextColor(0, 0, 0);
      
      // Match percentage badge - white background with colored ring
      const matchColor = domain.match_percentage >= 90 ? [16, 185, 129] :  // Emerald
                         domain.match_percentage >= 80 ? [59, 130, 246] :   // Blue
                         domain.match_percentage >= 70 ? [251, 191, 36] :   // Amber
                         [107, 114, 128];                                    // Gray
      
      // White circle background for badge
      doc.setFillColor(255, 255, 255);
      doc.circle(pageWidth - margin - 17, yPosition + 6, 6, 'F');
      
      // Colored ring
      doc.setDrawColor(matchColor[0], matchColor[1], matchColor[2]);
      doc.setLineWidth(0.8);
      doc.circle(pageWidth - margin - 17, yPosition + 6, 6, 'S');
      
      // Match percentage text
      doc.setTextColor(matchColor[0], matchColor[1], matchColor[2]);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text(`${domain.match_percentage}%`, pageWidth - margin - 17, yPosition + 7, { align: 'center' });
      doc.setTextColor(0, 0, 0);
      
      // Reset line width
      doc.setLineWidth(0.5);
      
      yPosition += 16;
      
      // Category
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(107, 114, 128);
      const categoryLabel = 'Category: ';
      const categoryLabelWidth = doc.getTextWidth(categoryLabel);
      const categoryText = sanitizeText(domain.category);
      
      // Always put category on same line if possible
      const availableWidth = contentWidth - 10 - categoryLabelWidth;
      doc.text(categoryLabel, margin + 5, yPosition);
      doc.setTextColor(0, 0, 0);
      
      if (availableWidth < 30) {
        // Not enough space, put on new line
        yPosition += 4;
        const categoryLines = doc.splitTextToSize(categoryText, contentWidth - 10);
        categoryLines.forEach((line: string, idx: number) => {
          doc.text(line, margin + 5, yPosition);
          if (idx < categoryLines.length - 1) yPosition += 4;
        });
      } else {
        const categoryLines = doc.splitTextToSize(categoryText, availableWidth);
        doc.text(categoryLines[0], margin + 5 + categoryLabelWidth, yPosition);
        for (let i = 1; i < categoryLines.length; i++) {
          yPosition += 4;
          doc.text(categoryLines[i], margin + 5, yPosition);
        }
      }
      yPosition += 6;
      
      // Why recommended
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      addWrappedText(sanitizeText(domain.why_recommended || domain.description), margin + 5, 9, contentWidth - 10, 4);
      
      // Key interests
      if (domain.key_interests && domain.key_interests.length > 0) {
        yPosition += 2;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        const keyInterestsLabel = 'Key Interests: ';
        const interestsLabelWidth = doc.getTextWidth(keyInterestsLabel);
        const interestsText = sanitizeText(domain.key_interests.slice(0, 5).join(', '));
        
        // If label + text would overflow, put on separate lines
        const availableWidth = contentWidth - 10 - interestsLabelWidth;
        if (availableWidth < 30 || interestsLabelWidth > (contentWidth - 10) * 0.4) {
          doc.text(keyInterestsLabel, margin + 5, yPosition);
          yPosition += 4;
          doc.setFont('helvetica', 'normal');
          const interestsLines = doc.splitTextToSize(interestsText, contentWidth - 10);
          interestsLines.forEach((line: string) => {
            checkPageBreak(4);
            doc.text(line, margin + 5, yPosition);
            yPosition += 4;
          });
        } else {
          doc.text(keyInterestsLabel, margin + 5, yPosition);
          doc.setFont('helvetica', 'normal');
          const interestsLines = doc.splitTextToSize(interestsText, availableWidth);
          doc.text(interestsLines[0], margin + 5 + interestsLabelWidth, yPosition);
          for (let i = 1; i < interestsLines.length; i++) {
            yPosition += 4;
            checkPageBreak(4);
            doc.text(interestsLines[i], margin + 5, yPosition);
          }
        }
        yPosition += 6;
      }
      
      // Sub-domains
      if (domain.sub_domains && domain.sub_domains.length > 0) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        const subDomainsLabel = 'Sub-domains: ';
        const subDomainsLabelWidth = doc.getTextWidth(subDomainsLabel);
        const subDomainsText = sanitizeText(domain.sub_domains.slice(0, 4).join(', '));
        
        // If label + text would overflow, put on separate lines
        const availableWidth = contentWidth - 10 - subDomainsLabelWidth;
        if (availableWidth < 30 || subDomainsLabelWidth > (contentWidth - 10) * 0.4) {
          doc.text(subDomainsLabel, margin + 5, yPosition);
          yPosition += 4;
          doc.setFont('helvetica', 'normal');
          const subDomainsLines = doc.splitTextToSize(subDomainsText, contentWidth - 10);
          subDomainsLines.forEach((line: string) => {
            checkPageBreak(4);
            doc.text(line, margin + 5, yPosition);
            yPosition += 4;
          });
        } else {
          doc.text(subDomainsLabel, margin + 5, yPosition);
          doc.setFont('helvetica', 'normal');
          const subDomainsLines = doc.splitTextToSize(subDomainsText, availableWidth);
          doc.text(subDomainsLines[0], margin + 5 + subDomainsLabelWidth, yPosition);
          for (let i = 1; i < subDomainsLines.length; i++) {
            yPosition += 4;
            checkPageBreak(4);
            doc.text(subDomainsLines[i], margin + 5, yPosition);
          }
        }
        yPosition += 6;
      }
      
      // Potential careers
      if (domain.potential_careers && domain.potential_careers.length > 0) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        const careersLabel = 'Careers: ';
        const careersLabelWidth = doc.getTextWidth(careersLabel);
        const careersText = sanitizeText(domain.potential_careers.slice(0, 4).join(', '));
        
        // If label + text would overflow, put on separate lines
        const availableWidth = contentWidth - 10 - careersLabelWidth;
        if (availableWidth < 30 || careersLabelWidth > (contentWidth - 10) * 0.4) {
          doc.text(careersLabel, margin + 5, yPosition);
          yPosition += 4;
          doc.setFont('helvetica', 'normal');
          const careersLines = doc.splitTextToSize(careersText, contentWidth - 10);
          careersLines.forEach((line: string) => {
            checkPageBreak(4);
            doc.text(line, margin + 5, yPosition);
            yPosition += 4;
          });
        } else {
          doc.text(careersLabel, margin + 5, yPosition);
          doc.setFont('helvetica', 'normal');
          const careersLines = doc.splitTextToSize(careersText, availableWidth);
          doc.text(careersLines[0], margin + 5 + careersLabelWidth, yPosition);
          for (let i = 1; i < careersLines.length; i++) {
            yPosition += 4;
            checkPageBreak(4);
            doc.text(careersLines[i], margin + 5, yPosition);
          }
        }
        yPosition += 6;
      }

      yPosition += 10;
    });
  }

  // Draw footer line
  checkPageBreak(15);
  doc.setLineWidth(0.5);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 8;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Generated by HelloIvy Domain Discovery', pageWidth / 2, yPosition, {
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
