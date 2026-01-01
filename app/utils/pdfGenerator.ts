import jsPDF from 'jspdf';

interface Criteria {
  feedback: string;
}

interface AnalysisData {
  criteria?: {
    alignment_with_topic?: Criteria;
    alignment_with_brainstorming?: Criteria;
    narrative_and_impact?: Criteria;
    language_and_structure?: Criteria;
    alignment_with_college_values?: Criteria;
  };
  summary?: string;
  suggestions?: {
    primary?: string[];
    alternative?: string[];
  };
  admissions_perspective?: {
    positive?: string;
    critical?: string;
  };
  paragraph_rewrites?: Array<{
    id: string;
    original_paragraph: string;
    rewritten_paragraph: string;
    improvements_made: string;
    location: string;
  }>;
  inline_suggestions?: Array<{
    original: string;
    suggested: string;
    reason: string;
    type: string;
  }>;
  detailed_feedback?: {
    annotations?: Array<{
      essay_line?: string;
      recommended_change?: string;
    }>;
  };
}

interface PDFReportData {
  essayTitle: string;
  essayContent: string;
  questionType: string;
  collegeDegree: string;
  wordCount: number;
  ragAnalysis?: AnalysisData;
  currentAnalysis?: AnalysisData;
}

export const generateEssayReport = (data: PDFReportData) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const maxWidth = pageWidth - 2 * margin;
  let yPosition = 20;

  // Helper function to check if we need a new page
  const checkNewPage = (spaceNeeded: number) => {
    if (yPosition + spaceNeeded > pageHeight - 20) {
      doc.addPage();
      yPosition = 20;
      return true;
    }
    return false;
  };

  // Helper function to wrap text
  const wrapText = (
    text: string,
    maxWidth: number,
    fontSize: number
  ): string[] => {
    doc.setFontSize(fontSize);
    return doc.splitTextToSize(text, maxWidth);
  };

  // Helper function to add section with background
  const addSection = (
    title: string,
    content: string,
    bgColor: string,
    textColor: string
  ) => {
    checkNewPage(30);

    // Draw background rectangle
    const rgb = hexToRgb(bgColor);
    doc.setFillColor(rgb.r, rgb.g, rgb.b);
    doc.rect(margin, yPosition, maxWidth, 8, 'F');

    // Add title
    doc.setTextColor(textColor);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(title, margin + 3, yPosition + 5.5);

    yPosition += 10;

    // Add content
    doc.setTextColor(60, 60, 60);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const lines = wrapText(content, maxWidth - 6, 10);

    lines.forEach((line) => {
      checkNewPage(6);
      doc.text(line, margin + 3, yPosition);
      yPosition += 5;
    });

    yPosition += 3;
  };

  // Helper function to convert hex to RGB
  const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
    if (hex === '#dcfce7') return { r: 220, g: 252, b: 231 };
    if (hex === '#fef3c7') return { r: 254, g: 243, b: 199 };
    if (hex === '#dbeafe') return { r: 219, g: 234, b: 254 };
    if (hex === '#f3f4f6') return { r: 243, g: 244, b: 246 };
    return { r: 240, g: 240, b: 240 };
  };

  // ===== HEADER WITH LOGO =====
  // HelloIvy branding
  doc.setFillColor(37, 99, 235); // Blue color
  doc.rect(0, 0, pageWidth, 35, 'F');

  // HelloIvy text logo (since we can't easily embed images)
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('HelloIvy', margin, 20);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Essay Evaluation Report', margin, 28);

  yPosition = 45;

  // ===== ESSAY INFORMATION =====
  doc.setTextColor(37, 99, 235);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Essay Information', margin, yPosition);
  yPosition += 8;

  doc.setDrawColor(37, 99, 235);
  doc.setLineWidth(0.5);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 8;

  // Essay details
  doc.setTextColor(60, 60, 60);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Title:', margin, yPosition);
  doc.setFont('helvetica', 'normal');
  const titleLines = wrapText(data.essayTitle, maxWidth - 30, 11);
  titleLines.forEach((line, idx) => {
    doc.text(line, margin + 30, yPosition + idx * 5);
  });
  yPosition += titleLines.length * 5 + 3;

  if (data.questionType) {
    checkNewPage(8);
    doc.setFont('helvetica', 'bold');
    doc.text('Question Type:', margin, yPosition);
    doc.setFont('helvetica', 'normal');
    const qtLines = wrapText(data.questionType, maxWidth - 30, 11);
    qtLines.forEach((line, idx) => {
      doc.text(line, margin + 30, yPosition + idx * 5);
    });
    yPosition += qtLines.length * 5 + 3;
  }

  if (data.collegeDegree) {
    checkNewPage(8);
    doc.setFont('helvetica', 'bold');
    doc.text('Target:', margin, yPosition);
    doc.setFont('helvetica', 'normal');
    const cdLines = wrapText(data.collegeDegree, maxWidth - 30, 11);
    cdLines.forEach((line, idx) => {
      doc.text(line, margin + 30, yPosition + idx * 5);
    });
    yPosition += cdLines.length * 5 + 3;
  }

  doc.setFont('helvetica', 'bold');
  doc.text('Word Count:', margin, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(data.wordCount.toString(), margin + 30, yPosition);
  yPosition += 10;

  // ===== ESSAY CONTENT =====
  checkNewPage(20);
  doc.setTextColor(37, 99, 235);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Essay Content', margin, yPosition);
  yPosition += 8;

  doc.setDrawColor(37, 99, 235);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 8;

  // Convert HTML to plain text
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = data.essayContent;
  const plainText = tempDiv.textContent || tempDiv.innerText || '';

  doc.setTextColor(60, 60, 60);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const essayLines = wrapText(plainText, maxWidth, 10);
  essayLines.forEach((line) => {
    checkNewPage(5);
    doc.text(line, margin, yPosition);
    yPosition += 5;
  });
  yPosition += 10;

  // ===== RAG ANALYSIS =====
  if (data.ragAnalysis) {
    checkNewPage(30);
    doc.setTextColor(37, 99, 235);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Evaluation Analysis', margin, yPosition);
    yPosition += 8;

    doc.setDrawColor(37, 99, 235);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 10;

    // Summary
    if (data.ragAnalysis.summary) {
      checkNewPage(20);
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(37, 99, 235);
      doc.text('Summary', margin, yPosition);
      yPosition += 7;

      doc.setTextColor(60, 60, 60);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const summaryLines = wrapText(data.ragAnalysis.summary, maxWidth, 10);
      summaryLines.forEach((line) => {
        checkNewPage(5);
        doc.text(line, margin, yPosition);
        yPosition += 5;
      });
      yPosition += 8;
    }

    // 5 Criteria Evaluation
    if (data.ragAnalysis.criteria) {
      checkNewPage(20);
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(37, 99, 235);
      doc.text('5-Criteria Evaluation', margin, yPosition);
      yPosition += 10;

      const criteriaLabels: { [key: string]: string } = {
        alignment_with_topic: 'Alignment with Topic',
        alignment_with_brainstorming: 'Alignment with Brainstorming',
        narrative_and_impact: 'Essay Narrative & Impact',
        language_and_structure: 'Language & Structure',
        alignment_with_college_values: 'Alignment with College Values',
      };

      Object.entries(data.ragAnalysis.criteria).forEach(([key, criteria]) => {
        if (criteria?.feedback) {
          checkNewPage(15);
          doc.setFillColor(243, 244, 246);
          doc.rect(margin, yPosition - 2, maxWidth, 6, 'F');

          doc.setTextColor(37, 99, 235);
          doc.setFontSize(11);
          doc.setFont('helvetica', 'bold');
          doc.text(criteriaLabels[key] || key, margin + 2, yPosition + 3);
          yPosition += 8;

          doc.setTextColor(60, 60, 60);
          doc.setFontSize(10);
          doc.setFont('helvetica', 'normal');
          const feedbackLines = wrapText(criteria.feedback, maxWidth - 4, 10);
          feedbackLines.forEach((line) => {
            checkNewPage(5);
            doc.text(line, margin + 2, yPosition);
            yPosition += 5;
          });
          yPosition += 5;
        }
      });
    }

    // Admissions Perspective
    if (data.ragAnalysis.admissions_perspective) {
      checkNewPage(30);
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(37, 99, 235);
      doc.text('Admissions Perspective', margin, yPosition);
      yPosition += 10;

      if (data.ragAnalysis.admissions_perspective.positive) {
        addSection(
          "What's Good",
          data.ragAnalysis.admissions_perspective.positive,
          '#dcfce7',
          '#166534'
        );
      }

      if (data.ragAnalysis.admissions_perspective.critical) {
        addSection(
          'Areas for Improvement',
          data.ragAnalysis.admissions_perspective.critical,
          '#fef3c7',
          '#92400e'
        );
      }
    }

    // Suggestions
    if (data.ragAnalysis.suggestions) {
      checkNewPage(20);
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(37, 99, 235);
      doc.text('Suggestions for Improvement', margin, yPosition);
      yPosition += 10;

      if (
        data.ragAnalysis.suggestions.primary &&
        data.ragAnalysis.suggestions.primary.length > 0
      ) {
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(37, 99, 235);
        doc.text('Primary Improvements:', margin, yPosition);
        yPosition += 6;

        data.ragAnalysis.suggestions.primary.forEach((suggestion, index) => {
          checkNewPage(10);
          doc.setTextColor(60, 60, 60);
          doc.setFontSize(10);
          doc.setFont('helvetica', 'normal');
          const suggestionLines = wrapText(
            `${index + 1}. ${suggestion}`,
            maxWidth - 5,
            10
          );
          suggestionLines.forEach((line) => {
            checkNewPage(5);
            doc.text(line, margin + 5, yPosition);
            yPosition += 5;
          });
          yPosition += 2;
        });
        yPosition += 5;
      }

      if (
        data.ragAnalysis.suggestions.alternative &&
        data.ragAnalysis.suggestions.alternative.length > 0
      ) {
        checkNewPage(15);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(37, 99, 235);
        doc.text('Alternative Approaches:', margin, yPosition);
        yPosition += 6;

        data.ragAnalysis.suggestions.alternative.forEach(
          (suggestion, index) => {
            checkNewPage(10);
            doc.setTextColor(60, 60, 60);
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            const suggestionLines = wrapText(
              `${index + 1}. ${suggestion}`,
              maxWidth - 5,
              10
            );
            suggestionLines.forEach((line) => {
              checkNewPage(5);
              doc.text(line, margin + 5, yPosition);
              yPosition += 5;
            });
            yPosition += 2;
          }
        );
        yPosition += 5;
      }
    }

    // Structure Annotations
    if (
      data.ragAnalysis.detailed_feedback?.annotations &&
      data.ragAnalysis.detailed_feedback.annotations.length > 0
    ) {
      checkNewPage(20);
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(37, 99, 235);
      doc.text('Detailed Annotations', margin, yPosition);
      yPosition += 10;

      data.ragAnalysis.detailed_feedback.annotations.forEach(
        (annotation, index) => {
          if (annotation.essay_line && annotation.recommended_change) {
            checkNewPage(20);

            doc.setFillColor(219, 234, 254);
            const boxHeight =
              5 +
              doc.splitTextToSize(annotation.essay_line, maxWidth - 8).length *
                5 +
              3 +
              doc.splitTextToSize(annotation.recommended_change, maxWidth - 8)
                .length *
                5 +
              5;

            if (yPosition + boxHeight > pageHeight - 20) {
              doc.addPage();
              yPosition = 20;
            }

            doc.rect(margin, yPosition, maxWidth, boxHeight, 'F');
            yPosition += 4;

            doc.setTextColor(30, 64, 175);
            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');
            doc.text('Essay Line:', margin + 3, yPosition);
            yPosition += 4;

            doc.setTextColor(60, 60, 60);
            doc.setFont('helvetica', 'italic');
            const essayLineLines = wrapText(
              `"${annotation.essay_line}"`,
              maxWidth - 8,
              9
            );
            essayLineLines.forEach((line) => {
              doc.text(line, margin + 3, yPosition);
              yPosition += 4;
            });
            yPosition += 2;

            doc.setTextColor(30, 64, 175);
            doc.setFont('helvetica', 'bold');
            doc.text('Recommendation:', margin + 3, yPosition);
            yPosition += 4;

            doc.setTextColor(60, 60, 60);
            doc.setFont('helvetica', 'normal');
            const recLines = wrapText(
              annotation.recommended_change,
              maxWidth - 8,
              9
            );
            recLines.forEach((line) => {
              doc.text(line, margin + 3, yPosition);
              yPosition += 4;
            });
            yPosition += 8;
          }
        }
      );
    }
  }

  // ===== PARAGRAPH REWRITES =====
  if (
    data.currentAnalysis?.paragraph_rewrites &&
    data.currentAnalysis.paragraph_rewrites.length > 0
  ) {
    checkNewPage(30);
    doc.setTextColor(37, 99, 235);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Suggested Paragraph Rewrites', margin, yPosition);
    yPosition += 8;

    doc.setDrawColor(37, 99, 235);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 10;

    data.currentAnalysis.paragraph_rewrites.forEach((rewrite, index) => {
      checkNewPage(40);

      // Section header with location
      doc.setFillColor(243, 244, 246);
      doc.rect(margin, yPosition - 2, maxWidth, 7, 'F');
      doc.setTextColor(37, 99, 235);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(
        `Paragraph ${index + 1}: ${rewrite.location}`,
        margin + 2,
        yPosition + 3
      );
      yPosition += 10;

      // Original paragraph
      doc.setTextColor(60, 60, 60);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Original:', margin, yPosition);
      yPosition += 5;

      doc.setFillColor(254, 243, 199); // Light yellow background
      const origLines = wrapText(rewrite.original_paragraph, maxWidth - 6, 9);
      const origHeight = origLines.length * 4 + 4;
      checkNewPage(origHeight);
      doc.rect(margin, yPosition - 2, maxWidth, origHeight, 'F');

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      origLines.forEach((line) => {
        doc.text(line, margin + 3, yPosition);
        yPosition += 4;
      });
      yPosition += 6;

      // Rewritten paragraph
      checkNewPage(15);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);
      doc.text('Suggested Rewrite:', margin, yPosition);
      yPosition += 5;

      doc.setFillColor(220, 252, 231); // Light green background
      const rewriteLines = wrapText(
        rewrite.rewritten_paragraph,
        maxWidth - 6,
        9
      );
      const rewriteHeight = rewriteLines.length * 4 + 4;
      checkNewPage(rewriteHeight);
      doc.rect(margin, yPosition - 2, maxWidth, rewriteHeight, 'F');

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      rewriteLines.forEach((line) => {
        doc.text(line, margin + 3, yPosition);
        yPosition += 4;
      });
      yPosition += 6;

      // Improvements made
      checkNewPage(10);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(22, 163, 74); // Green color
      doc.text('What was improved:', margin, yPosition);
      yPosition += 4;

      doc.setFont('helvetica', 'italic');
      doc.setTextColor(60, 60, 60);
      const improvLines = wrapText(rewrite.improvements_made, maxWidth - 3, 9);
      improvLines.forEach((line) => {
        checkNewPage(4);
        doc.text(line, margin + 3, yPosition);
        yPosition += 4;
      });

      yPosition += 8;
    });
  }

  // ===== INLINE SUGGESTIONS =====
  if (
    data.currentAnalysis?.inline_suggestions &&
    data.currentAnalysis.inline_suggestions.length > 0
  ) {
    checkNewPage(30);
    doc.setTextColor(37, 99, 235);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Inline Suggestions', margin, yPosition);
    yPosition += 8;

    doc.setDrawColor(37, 99, 235);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 10;

    data.currentAnalysis.inline_suggestions.forEach((suggestion, index) => {
      checkNewPage(25);

      // Suggestion number
      doc.setFillColor(37, 99, 235);
      doc.circle(margin + 3, yPosition - 1, 3, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text((index + 1).toString(), margin + 2, yPosition + 1);

      yPosition += 5;

      // Original text
      doc.setTextColor(60, 60, 60);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('Original:', margin, yPosition);
      yPosition += 4;

      doc.setFont('helvetica', 'normal');
      const origLines = wrapText(suggestion.original, maxWidth - 5, 9);
      origLines.forEach((line) => {
        checkNewPage(4);
        doc.text(line, margin + 5, yPosition);
        yPosition += 4;
      });
      yPosition += 2;

      // Suggested text
      doc.setFont('helvetica', 'bold');
      doc.text('Suggested:', margin, yPosition);
      yPosition += 4;

      doc.setFont('helvetica', 'normal');
      const suggLines = wrapText(suggestion.suggested, maxWidth - 5, 9);
      suggLines.forEach((line) => {
        checkNewPage(4);
        doc.text(line, margin + 5, yPosition);
        yPosition += 4;
      });
      yPosition += 2;

      // Reason
      doc.setFont('helvetica', 'bold');
      doc.text('Reason:', margin, yPosition);
      yPosition += 4;

      doc.setFont('helvetica', 'normal');
      const reasonLines = wrapText(suggestion.reason, maxWidth - 5, 9);
      reasonLines.forEach((line) => {
        checkNewPage(4);
        doc.text(line, margin + 5, yPosition);
        yPosition += 4;
      });

      yPosition += 6;
    });
  }

  // ===== FOOTER =====
  const totalPages = (doc as unknown as { internal: { pages: unknown[] } }).internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setTextColor(150, 150, 150);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `Generated by HelloIvy | Page ${i} of ${totalPages}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  }

  // Save the PDF
  const fileName = `HelloIvy_${data.essayTitle.replace(/[^a-z0-9]/gi, '_')}_Report.pdf`;
  doc.save(fileName);
};
