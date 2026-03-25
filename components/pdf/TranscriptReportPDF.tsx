import React from 'react';
import { Document, Page, View, Text, Image, Link, StyleSheet } from '@react-pdf/renderer';
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
    title: 'Domain Discovery Session Transcript',
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
    title: 'Career Discovery Session Transcript',
  },
} as const;

const gray = '#4b5563';
const darkText = '#1f2937';

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
  variant: 'domain' | 'career';
  studentName?: string;
  sessionId: string;
  startedAt?: string;
  completedAt?: string;
  totalQuestions: number;
  messages: TranscriptQA[];
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
                  <Text style={s.messageText}>{qa.botQuestion}</Text>
                </View>
              </View>

              {/* Student response */}
              <View style={[s.messageBlock, s.messageRow]}>
                <View style={[s.accentBar, { backgroundColor: t.accent }]} />
                <View style={s.messageContent}>
                  <Text style={[s.senderLabel, { color: t.accent }]}>Student Response</Text>
                  <Text style={s.messageText}>{qa.studentResponse}</Text>
                </View>
              </View>

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
    </Document>
  );
};

export default TranscriptReportPDF;
