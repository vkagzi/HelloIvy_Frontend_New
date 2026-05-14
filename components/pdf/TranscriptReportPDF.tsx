import React from 'react';
import { Document, Page, View, Text, Image, Link, StyleSheet } from '@react-pdf/renderer';

type PDFStyle = Record<string, string | number>;
import { LOGO_APP_BASE64 } from './logo-base64';

/* ── theme presets ──────────────────────────────────────── */
const themes = {
  domain: {
    brand: '#3377ff',
    brandLight: '#ebf2ff',
    chipBg: '#d6e4ff',
    accent: '#14cecf',
    accentLight: '#d0f5f5',
    disclaimerBg: '#fef9e7',
    disclaimerBorder: '#f5d063',
    disclaimerText: '#92700c',
    coachLabel: 'AI Coach',
    title: 'Stream & Subject Selection Session Transcript',
  },
  career: {
    brand: '#7f12f3',
    brandLight: '#f3e8ff',
    chipBg: '#e9d5ff',
    accent: '#14cecf',
    accentLight: '#d0f5f5',
    disclaimerBg: '#fdf4ff',
    disclaimerBorder: '#d8b4fe',
    disclaimerText: '#6b21a8',
    coachLabel: 'Career Coach',
    title: 'Career & Degree Selection Session Transcript',
  },
  college: {
    brand: '#059669',
    brandLight: '#d1fae5',
    chipBg: '#a7f3d0',
    accent: '#14cecf',
    accentLight: '#d0f5f5',
    disclaimerBg: '#ecfdf5',
    disclaimerBorder: '#6ee7b7',
    disclaimerText: '#065f46',
    coachLabel: 'College Advisor',
    title: 'College Selection Session Transcript',
  },
} as const;

const gray = '#4b5563';
const darkText = '#1f2937';

/** Replace emoji characters with text equivalents for PDF font compatibility. */
function sanitizeForPDF(text: string): string {
  return text
    .replace(/⭐+/g, (m) => `${m.length}/5`)
    .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
    .trim();
}

/* ── markdown-to-PDF primitives ─────────────────────────── */

/** Render inline markdown (bold, italic, bold-italic, inline code) as Text spans. */
function renderInline(text: string, baseStyle: PDFStyle): React.ReactNode[] {
  const safe = sanitizeForPDF(text);
  // Match: ***bold-italic***, **bold**, *italic*, `code`
  const parts = safe.split(/(\*{3}[^*]+\*{3}|\*{2}[^*]+\*{2}|\*[^*]+\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (/^\*{3}(.+)\*{3}$/.test(part)) {
      return <Text key={i} style={[baseStyle, { fontFamily: 'Helvetica-BoldOblique' }]}>{part.slice(3, -3)}</Text>;
    }
    if (/^\*{2}(.+)\*{2}$/.test(part)) {
      return <Text key={i} style={[baseStyle, { fontFamily: 'Helvetica-Bold' }]}>{part.slice(2, -2)}</Text>;
    }
    if (/^\*(.+)\*$/.test(part)) {
      return <Text key={i} style={[baseStyle, { fontStyle: 'italic' }]}>{part.slice(1, -1)}</Text>;
    }
    if (/^`(.+)`$/.test(part)) {
      return <Text key={i} style={[baseStyle, { fontFamily: 'Courier', backgroundColor: '#f3f4f6', fontSize: 8 }]}>{part.slice(1, -1)}</Text>;
    }
    return <Text key={i} style={baseStyle}>{part}</Text>;
  });
}

/** Parse markdown string into react-pdf View/Text elements. */
function renderMarkdownPDF(markdown: string, brandColor: string): React.ReactNode {
  const lines = markdown.split('\n');
  const elements: React.ReactNode[] = [];
  let i = 0;

  const baseText = { fontSize: 9, color: gray, lineHeight: 1.5 } as const;

  while (i < lines.length) {
    const line = lines[i];

    // Skip empty lines
    if (line.trim() === '') {
      i++;
      continue;
    }

    // Headings
    const headingMatch = line.match(/^(#{1,4})\s+(.+)/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const sizes = [14, 12, 11, 10];
      elements.push(
        <Text key={i} style={{ fontSize: sizes[level - 1] || 10, fontFamily: 'Helvetica-Bold', color: darkText, marginTop: level <= 2 ? 6 : 4, marginBottom: 3 }}>
          {headingMatch[2].replace(/\*{1,3}/g, '')}
        </Text>
      );
      i++;
      continue;
    }

    // Horizontal rule
    if (/^[-*_]{3,}\s*$/.test(line.trim())) {
      elements.push(<View key={i} style={{ height: 0.5, backgroundColor: '#e5e7eb', marginVertical: 4 }} />);
      i++;
      continue;
    }

    // Table: collect all table rows
    if (line.trim().startsWith('|')) {
      const tableRows: string[][] = [];
      let hasHeader = false;
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        const row = lines[i].trim();
        // Skip separator rows (|---|---|)
        if (/^\|[\s:|-]+\|$/.test(row)) {
          hasHeader = true;
          i++;
          continue;
        }
        const cells = row.split('|').filter(Boolean).map((c) => c.trim());
        tableRows.push(cells);
        i++;
      }
      if (tableRows.length > 0) {
        const headerRow = hasHeader ? tableRows[0] : null;
        const bodyRows = hasHeader ? tableRows.slice(1) : tableRows;
        const colCount = (headerRow || bodyRows[0] || []).length;
        elements.push(
          <View key={`table-${i}`} style={{ marginVertical: 4, borderRadius: 4, overflow: 'hidden', border: '0.5 solid #d1d5db' }}>
            {headerRow && (
              <View style={{ flexDirection: 'row', backgroundColor: brandColor }}>
                {headerRow.map((cell, ci) => (
                  <Text key={ci} style={{ flex: 1, fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#fff', paddingHorizontal: 6, paddingVertical: 4 }}>
                    {cell}
                  </Text>
                ))}
              </View>
            )}
            {bodyRows.map((row, ri) => (
              <View key={ri} style={{ flexDirection: 'row', backgroundColor: ri % 2 === 0 ? '#fff' : '#f9fafb', borderTop: '0.5 solid #e5e7eb' }}>
                {Array.from({ length: colCount }, (_, ci) => (
                  <Text key={ci} style={{ flex: 1, fontSize: 8, color: gray, paddingHorizontal: 6, paddingVertical: 3 }}>
                    {sanitizeForPDF((row[ci] || '').replace(/\*{1,3}/g, ''))}
                  </Text>
                ))}
              </View>
            ))}
          </View>
        );
      }
      continue;
    }

    // Unordered list item
    const ulMatch = line.match(/^\s*[-*+]\s+(.+)/);
    if (ulMatch) {
      elements.push(
        <View key={i} style={{ flexDirection: 'row', gap: 4, marginBottom: 2, paddingLeft: 8 }}>
          <Text style={[baseText, { color: brandColor, fontFamily: 'Helvetica-Bold' }]}>•</Text>
          <Text style={[baseText, { flex: 1 }]}>{renderInline(ulMatch[1], baseText)}</Text>
        </View>
      );
      i++;
      continue;
    }

    // Ordered list item
    const olMatch = line.match(/^\s*(\d+)[.)]\s+(.+)/);
    if (olMatch) {
      elements.push(
        <View key={i} style={{ flexDirection: 'row', gap: 4, marginBottom: 2, paddingLeft: 8 }}>
          <Text style={[baseText, { color: brandColor, fontFamily: 'Helvetica-Bold', width: 14 }]}>{olMatch[1]}.</Text>
          <Text style={[baseText, { flex: 1 }]}>{renderInline(olMatch[2], baseText)}</Text>
        </View>
      );
      i++;
      continue;
    }

    // Blockquote
    if (line.trimStart().startsWith('>')) {
      const quoteText = line.replace(/^>\s*/, '');
      elements.push(
        <View key={i} style={{ flexDirection: 'row', gap: 4, marginVertical: 2 }}>
          <View style={{ width: 2, backgroundColor: brandColor, borderRadius: 1 }} />
          <Text style={[baseText, { flex: 1, fontStyle: 'italic', color: '#6b7280' }]}>{quoteText}</Text>
        </View>
      );
      i++;
      continue;
    }

    // Regular paragraph
    elements.push(
      <Text key={i} style={[baseText, { marginBottom: 2 }]}>{renderInline(line, baseText)}</Text>
    );
    i++;
  }

  return <View>{elements}</View>;
}

/* ── shared styles ──────────────────────────────────────── */
const s = StyleSheet.create({
  page: { padding: 30, fontFamily: 'Helvetica', fontSize: 9, color: darkText },
  pageNumber: { position: 'absolute', bottom: 16, left: 0, right: 0, textAlign: 'center', fontSize: 7, color: '#9ca3af' },
  footer: { position: 'absolute', bottom: 26, left: 30, right: 30, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 },
  footerText: { fontSize: 7, color: '#9ca3af' },
  footerLink: { fontSize: 7, color: '#9ca3af', textDecoration: 'none' },

  /* header banner */
  headerBanner: { borderRadius: 8, padding: 16, marginBottom: 14 },
  headerTitle: { fontSize: 18, fontFamily: 'Helvetica-Bold', color: '#fff', textAlign: 'center' },
  headerSubtitle: { fontSize: 10, color: 'rgba(255,255,255,0.7)', textAlign: 'center', marginTop: 4 },

  /* meta card */
  metaCard: { borderRadius: 8, padding: 12, marginBottom: 14 },
  metaName: { fontSize: 12, fontFamily: 'Helvetica-Bold', color: darkText, marginBottom: 4 },
  metaRow: { flexDirection: 'row', gap: 20, marginTop: 2 },
  metaLabel: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: gray },
  metaValue: { fontSize: 8, color: gray },

  /* stat box */
  statBox: { borderRadius: 8, padding: 14, alignItems: 'center', marginBottom: 14 },
  statNumber: { fontSize: 28, fontFamily: 'Helvetica-Bold' },
  statLabel: { fontSize: 10, marginTop: 2 },

  /* phase header */
  phaseHeader: { borderRadius: 6, paddingHorizontal: 10, paddingVertical: 6, marginTop: 10, marginBottom: 8 },
  phaseText: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#fff' },

  /* question block */
  questionBadge: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start', marginBottom: 6 },
  questionBadgeText: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#fff' },

  /* message blocks */
  messageBlock: { marginBottom: 4 },
  accentBar: { width: 2, borderRadius: 1 },
  messageRow: { flexDirection: 'row', gap: 6 },
  messageContent: { flex: 1, paddingVertical: 2 },
  senderLabel: { fontSize: 9, fontFamily: 'Helvetica-Bold', marginBottom: 2 },
  messageText: { fontSize: 9, color: gray, lineHeight: 1.5 },

  /* divider */
  divider: { height: 0.5, backgroundColor: '#e5e7eb', marginVertical: 8 },

  /* disclaimer */
  disclaimer: { marginTop: 14, padding: 10, borderRadius: 6, borderWidth: 0.5 },
  disclaimerText: { fontSize: 7, lineHeight: 1.5, textAlign: 'center', fontStyle: 'italic' },
});

/* ── types ──────────────────────────────────────────────── */
export interface TranscriptQA {
  questionNumber: number;
  phase: string;
  botQuestion: string;
  studentResponse: string;
}

export interface TranscriptReportPDFProps {
  variant: 'domain' | 'career' | 'college';
  studentName?: string;
  sessionId: string;
  startedAt?: string;
  completedAt?: string;
  totalQuestions: number;
  messages: TranscriptQA[];
  concludingMessage?: string | null;
}

/* ── component ──────────────────────────────────────────── */
const TranscriptReportPDF: React.FC<TranscriptReportPDFProps> = ({
  variant,
  studentName,
  sessionId,
  startedAt,
  completedAt,
  totalQuestions,
  messages,
  concludingMessage,
}) => {
  const t = themes[variant];

  // Group messages by phase
  const phases: Record<string, TranscriptQA[]> = {};
  messages.forEach((m) => {
    const key = m.phase || 'general';
    if (!phases[key]) phases[key] = [];
    phases[key].push(m);
  });

  return (
    <Document>
      {/* ===== Cover / summary page ===== */}
      <Page size="A4" style={s.page}>
        <Image src={LOGO_APP_BASE64} style={{ width: 120, height: 25, marginBottom: 12 }} />

        <View style={[s.headerBanner, { backgroundColor: t.brand }]}>
          <Text style={s.headerTitle}>{t.title}</Text>
          <Text style={s.headerSubtitle}>{studentName || 'Student'}</Text>
        </View>

        {/* Meta card */}
        <View style={[s.metaCard, { backgroundColor: t.brandLight }]}>
          <Text style={s.metaName}>{studentName || 'Student'}</Text>
          <View style={s.metaRow}>
            <View>
              <Text style={s.metaLabel}>Session</Text>
              <Text style={s.metaValue}>{sessionId}</Text>
            </View>
            <View>
              <Text style={s.metaLabel}>Started</Text>
              <Text style={s.metaValue}>{startedAt || 'N/A'}</Text>
            </View>
            <View>
              <Text style={s.metaLabel}>Completed</Text>
              <Text style={s.metaValue}>{completedAt || 'In Progress'}</Text>
            </View>
          </View>
        </View>

        {/* Stat box */}
        <View style={[s.statBox, { backgroundColor: t.brandLight }]}>
          <Text style={[s.statNumber, { color: t.brand }]}>{totalQuestions}</Text>
          <Text style={[s.statLabel, { color: t.brand }]}>Total Questions</Text>
        </View>

        {/* Disclaimer */}
        <View style={[s.disclaimer, { backgroundColor: t.disclaimerBg, borderColor: t.disclaimerBorder }]}>
          <Text style={[s.disclaimerText, { color: t.disclaimerText }]}>
            This transcript is generated using AI and is intended for reference purposes only. Responses may not be fully accurate or definitive.
          </Text>
        </View>

        <View style={s.footer} fixed>
          <Link src="https://helloivy.ai" style={s.footerLink}>helloivy.ai</Link>
          <Text style={s.footerText}>|</Text>
          <Text style={s.footerText}>partners@reachivy.com</Text>
        </View>
        <Text style={s.pageNumber} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} fixed />
      </Page>

      {/* ===== Conversation pages (one per phase) ===== */}
      {Object.entries(phases).map(([phase, qaList]) => (
        <Page key={phase} size="A4" style={s.page} wrap>
          <Image src={LOGO_APP_BASE64} style={{ width: 80, height: 16, marginBottom: 8 }} />

          {/* Phase header */}
          <View style={[s.phaseHeader, { backgroundColor: t.brand }]}>
            <Text style={s.phaseText}>{phase.toUpperCase()}</Text>
          </View>

          {/* Q&A pairs */}
          {qaList.map((qa, idx) => (
            <View key={idx} wrap={false} style={{ marginBottom: 4 }}>
              {/* Question badge */}
              <View style={[s.questionBadge, { backgroundColor: t.brand }]}>
                <Text style={s.questionBadgeText}>Question {qa.questionNumber}</Text>
              </View>

              {/* Coach message */}
              <View style={[s.messageBlock, s.messageRow]}>
                <View style={[s.accentBar, { backgroundColor: t.brand }]} />
                <View style={s.messageContent}>
                  <Text style={[s.senderLabel, { color: t.brand }]}>{t.coachLabel}</Text>
                  {renderMarkdownPDF(qa.botQuestion, t.brand)}
                </View>
              </View>

              {/* Student response — only render when present */}
              {qa.studentResponse ? (
                <View style={[s.messageBlock, s.messageRow]}>
                  <View style={[s.accentBar, { backgroundColor: t.accent }]} />
                  <View style={s.messageContent}>
                    <Text style={[s.senderLabel, { color: t.accent }]}>Student Response</Text>
                    {renderMarkdownPDF(qa.studentResponse, t.accent)}
                  </View>
                </View>
              ) : null}

              {idx < qaList.length - 1 && <View style={s.divider} />}
            </View>
          ))}

          <View style={s.footer} fixed>
            <Link src="https://helloivy.ai" style={s.footerLink}>helloivy.ai</Link>
            <Text style={s.footerText}>|</Text>
            <Text style={s.footerText}>partners@reachivy.com</Text>
          </View>
          <Text style={s.pageNumber} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} fixed />
        </Page>
      ))}

      {/* ===== Concluding message page ===== */}
      {concludingMessage && (
        <Page size="A4" style={s.page} wrap>
          <Image src={LOGO_APP_BASE64} style={{ width: 80, height: 16, marginBottom: 8 }} />

          <View style={[s.phaseHeader, { backgroundColor: '#22c55e' }]}>
            <Text style={s.phaseText}>SESSION COMPLETE</Text>
          </View>

          <View wrap={false} style={{ marginBottom: 4 }}>
            <View style={[s.messageBlock, s.messageRow]}>
              <View style={[s.accentBar, { backgroundColor: '#22c55e' }]} />
              <View style={s.messageContent}>
                <Text style={[s.senderLabel, { color: '#22c55e' }]}>{t.coachLabel}</Text>
                {renderMarkdownPDF(concludingMessage, '#22c55e')}
              </View>
            </View>
          </View>

          <View style={s.footer} fixed>
            <Link src="https://helloivy.ai" style={s.footerLink}>helloivy.ai</Link>
            <Text style={s.footerText}>|</Text>
            <Text style={s.footerText}>partners@reachivy.com</Text>
          </View>
          <Text style={s.pageNumber} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} fixed />
        </Page>
      )}
    </Document>
  );
};

export default TranscriptReportPDF;
