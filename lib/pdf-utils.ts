import { jsPDF } from 'jspdf';
import { TranscriptData, RIASECScores, DomainRecommendation } from './domain-discovery-api';

/**
 * Data structure for the comprehensive domain results PDF
 */
export interface DomainResultsData {
  studentName: string;
  sessionId: string;
  completedAt?: string;
  riasecScores: RIASECScores;
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

/**
 * Generate a comprehensive PDF with RIASEC scores and domain recommendations
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
  
  const metadata = [
    `Student: ${sanitizeText(data.studentName || 'Student')}`,
    `Session ID: ${data.sessionId}`,
    `Date: ${data.completedAt ? new Date(data.completedAt).toLocaleDateString() : new Date().toLocaleDateString()}`,
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

  // ==================== RIASEC Profile Section ====================
  checkPageBreak(60);
  
  // Section header
  doc.setFillColor(16, 185, 129); // Teal color
  doc.rect(margin, yPosition, contentWidth, 10, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text('YOUR RIASEC PROFILE', margin + 5, yPosition + 7);
  doc.setTextColor(0, 0, 0);
  yPosition += 15;

  // RIASEC dimension descriptions
  const riasecDescriptions: Record<string, string> = {
    realistic: 'Practical, hands-on activities and working with tools/machinery',
    investigative: 'Research, analysis, and problem-solving',
    artistic: 'Creative expression and artistic activities',
    social: 'Helping, teaching, and working with people',
    enterprising: 'Leadership, persuasion, and business activities',
    conventional: 'Organization, data management, and structured tasks',
  };

  // Sort RIASEC scores by value (highest first)
  const sortedScores = Object.entries(data.riasecScores)
    .sort(([, a], [, b]) => b - a);

  // Draw RIASEC bars
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  
  sortedScores.forEach(([dimension, score]) => {
    checkPageBreak(18);
    
    // Dimension name
    doc.setFont('helvetica', 'bold');
    doc.text(`${dimension.charAt(0).toUpperCase() + dimension.slice(1)}`, margin, yPosition);
    
    // Score value
    doc.text(`${score}%`, pageWidth - margin - 15, yPosition);
    yPosition += 4;
    
    // Progress bar background
    doc.setFillColor(229, 231, 235); // Gray-200
    doc.rect(margin, yPosition, contentWidth - 20, 4, 'F');
    
    // Progress bar fill
    doc.setFillColor(20, 184, 166); // Teal-500
    const barWidth = ((score / 100) * (contentWidth - 20));
    doc.rect(margin, yPosition, barWidth, 4, 'F');
    yPosition += 6;
    
    // Description
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(107, 114, 128); // Gray-500
    doc.text(riasecDescriptions[dimension] || '', margin, yPosition);
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    yPosition += 8;
  });

  yPosition += 5;

  // ==================== Interests & Strengths Section ====================
  if (data.interests.length > 0 || data.strengths.length > 0) {
    checkPageBreak(40);
    
    // Section header
    doc.setFillColor(6, 182, 212); // Cyan color
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
    doc.setFillColor(139, 92, 246); // Purple color
    doc.rect(margin, yPosition, contentWidth, 10, 'F');
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.text('RECOMMENDED DOMAINS', margin + 5, yPosition + 7);
    doc.setTextColor(0, 0, 0);
    yPosition += 15;

    // Summary stats
    const avgMatch = Math.round(
      data.recommendations.reduce((sum, rec) => sum + rec.match_percentage, 0) / 
      data.recommendations.length
    );
    const highMatches = data.recommendations.filter(r => r.match_percentage >= 80).length;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Total Domains: ${data.recommendations.length} | Average Match: ${avgMatch}% | High Matches (80%+): ${highMatches}`, margin, yPosition);
    yPosition += 10;

    // Each domain recommendation
    data.recommendations.forEach((domain, index) => {
      checkPageBreak(70);
      
      // Domain card header
      doc.setFillColor(240, 253, 250); // Teal-50 background
      doc.rect(margin, yPosition, contentWidth, 50, 'F');
      
      // Domain rank and title
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text(`#${index + 1} ${sanitizeText(domain.domain_title)}`, margin + 5, yPosition + 8);
      
      // Match percentage badge
      const matchColor = domain.match_percentage >= 90 ? [34, 197, 94] : // Green
                         domain.match_percentage >= 80 ? [59, 130, 246] : // Blue
                         domain.match_percentage >= 70 ? [234, 179, 8] : // Yellow
                         [107, 114, 128]; // Gray
      doc.setFillColor(matchColor[0], matchColor[1], matchColor[2]);
      doc.roundedRect(pageWidth - margin - 30, yPosition + 3, 25, 8, 2, 2, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.text(`${domain.match_percentage}%`, pageWidth - margin - 17.5, yPosition + 8.5, { align: 'center' });
      doc.setTextColor(0, 0, 0);
      
      // Category
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(107, 114, 128);
      doc.text(`Category: ${sanitizeText(domain.category)}`, margin + 5, yPosition + 15);
      doc.setTextColor(0, 0, 0);
      
      // Why recommended
      doc.setFontSize(10);
      yPosition += 20;
      addWrappedText(sanitizeText(domain.why_recommended || domain.description), margin + 5, 9, contentWidth - 10);
      
      // Key interests
      if (domain.key_interests && domain.key_interests.length > 0) {
        yPosition += 3;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.text('Key Interests: ', margin + 5, yPosition);
        doc.setFont('helvetica', 'normal');
        const interestsX = margin + 5 + doc.getTextWidth('Key Interests: ');
        doc.text(sanitizeText(domain.key_interests.slice(0, 5).join(', ')), interestsX, yPosition);
        yPosition += 5;
      }
      
      // Sub-domains
      if (domain.sub_domains && domain.sub_domains.length > 0) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.text('Sub-domains: ', margin + 5, yPosition);
        doc.setFont('helvetica', 'normal');
        const subDomainsX = margin + 5 + doc.getTextWidth('Sub-domains: ');
        doc.text(sanitizeText(domain.sub_domains.slice(0, 4).join(', ')), subDomainsX, yPosition);
        yPosition += 5;
      }
      
      // Potential careers
      if (domain.potential_careers && domain.potential_careers.length > 0) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.text('Careers: ', margin + 5, yPosition);
        doc.setFont('helvetica', 'normal');
        const careersX = margin + 5 + doc.getTextWidth('Careers: ');
        doc.text(sanitizeText(domain.potential_careers.slice(0, 4).join(', ')), careersX, yPosition);
        yPosition += 5;
      }

      yPosition += 8;
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
