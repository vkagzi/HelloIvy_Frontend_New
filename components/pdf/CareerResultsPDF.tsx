import React from 'react';
import { Document, Page, View, Text, Image, Link, StyleSheet } from '@react-pdf/renderer';
import type { CareerRecommendation } from '@/lib/career-discovery-api';
import { LOGO_APP_BASE64 } from './logo-base64';

/* ── colour tokens ─────────────────────────────────────── */
const purple = '#7f12f3';
const blue = '#1a86f1';
const lightPurple = '#e9d5ff';
const lightBlue = '#dbeafe';
const teal = '#14cecf';
const tealBg = '#d0f5f5';
const green = '#40c795';
const gray = '#4b5563';
const grayLight = '#f3f4f6';

/* ── styles ─────────────────────────────────────────────── */
const s = StyleSheet.create({
  page: { padding: 30, fontFamily: 'Helvetica', fontSize: 9, color: '#1f2937' },
  pageNumber: { position: 'absolute', bottom: 16, left: 0, right: 0, textAlign: 'center', fontSize: 7, color: '#9ca3af' },

  /* summary page */
  summaryHeader: { backgroundColor: purple, borderRadius: 8, padding: 16, marginBottom: 14 },
  summaryTitle: { fontSize: 18, fontFamily: 'Helvetica-Bold', color: '#fff', textAlign: 'center' },
  summarySubtitle: { fontSize: 10, color: '#e9d5ff', textAlign: 'center', marginTop: 4 },
  statBox: { backgroundColor: lightPurple, borderRadius: 8, padding: 14, alignItems: 'center', marginTop: 10 },
  statNumber: { fontSize: 28, fontFamily: 'Helvetica-Bold', color: purple },
  statLabel: { fontSize: 10, color: purple, marginTop: 2 },

  /* career card */
  card: { borderRadius: 8, overflow: 'hidden', marginBottom: 0 },
  cardHeader: { padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardRank: { fontSize: 10, color: 'rgba(255,255,255,0.7)', fontFamily: 'Helvetica-Bold' },
  cardTitle: { fontSize: 14, fontFamily: 'Helvetica-Bold', color: '#fff', marginTop: 2 },
  cardSalary: { fontSize: 9, color: '#e9d5ff', marginTop: 2 },
  badge: { backgroundColor: '#fff', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontFamily: 'Helvetica-Bold', fontSize: 9 },
  cardBody: { padding: 14, backgroundColor: '#fff' },
  twoCol: { flexDirection: 'row', gap: 14 },
  col: { flex: 1 },

  /* sections */
  sectionTitle: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: '#1f2937', marginBottom: 4, marginTop: 8 },
  sectionText: { fontSize: 9, color: gray, lineHeight: 1.5 },

  /* chips / pills */
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 2 },
  chip: { backgroundColor: lightPurple, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  chipText: { fontSize: 8, color: purple },

  /* bullet list */
  bulletItem: { flexDirection: 'row', gap: 4, marginBottom: 3 },
  bullet: { fontSize: 9, color: purple, fontFamily: 'Helvetica-Bold' },
  bulletText: { fontSize: 9, color: gray, flex: 1, lineHeight: 1.4 },

  /* numbered steps */
  stepNum: { width: 16, height: 16, borderRadius: 8, backgroundColor: tealBg, alignItems: 'center', justifyContent: 'center' },
  stepNumText: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: green },
  stepText: { fontSize: 9, color: gray, flex: 1, lineHeight: 1.4 },

  /* pros / cons */
  prosBox: { backgroundColor: '#f0fdf4', borderRadius: 6, padding: 8, marginTop: 4 },
  consBox: { backgroundColor: '#fef2f2', borderRadius: 6, padding: 8, marginTop: 4 },
  prosTitle: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#166534', marginBottom: 3 },
  consTitle: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#991b1b', marginBottom: 3 },
  proItem: { fontSize: 8, color: '#15803d', marginBottom: 2 },
  conItem: { fontSize: 8, color: '#dc2626', marginBottom: 2 },

  /* disclaimer & footer */
  disclaimer: { marginTop: 14, padding: 10, backgroundColor: '#fdf4ff', borderRadius: 6, borderWidth: 0.5, borderColor: '#d8b4fe' },
  disclaimerText: { fontSize: 7, color: '#6b21a8', lineHeight: 1.5, textAlign: 'center', fontStyle: 'italic' },
  footer: { position: 'absolute', bottom: 26, left: 30, right: 30, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 },
  footerText: { fontSize: 7, color: '#9ca3af' },
  footerLink: { fontSize: 7, color: '#9ca3af', textDecoration: 'none' },
});

/* ── helpers ─────────────────────────────────────────────── */
function matchColor(pct: number) {
  if (pct >= 90) return '#059669';
  if (pct >= 80) return '#3b82f6';
  if (pct >= 70) return '#f59e0b';
  return '#6b7280';
}

/* ── component ──────────────────────────────────────────── */
export interface CareerResultsPDFProps {
  recommendations: CareerRecommendation[];
  studentName?: string;
}

const CareerResultsPDF: React.FC<CareerResultsPDFProps> = ({ recommendations, studentName }) => (
  <Document>
    {/* ===== Summary page ===== */}
    <Page size="A4" style={s.page}>
      <Image src={LOGO_APP_BASE64} style={{ width: 120, height: 25, marginBottom: 12 }} />
      <View style={s.summaryHeader}>
        <Text style={s.summaryTitle}>Career & Degree Selection Results</Text>
        {studentName && <Text style={s.summarySubtitle}>{studentName}</Text>}
      </View>
      <View style={s.statBox}>
        <Text style={s.statNumber}>{recommendations.length}</Text>
        <Text style={s.statLabel}>Career Matches</Text>
      </View>

      {/* Horizontal Bar Chart */}
      <View style={{ marginTop: 16, padding: 12, backgroundColor: '#fff', borderRadius: 8, border: '1 solid #e5e7eb' }}>
        <Text style={{ fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#1f2937', marginBottom: 10 }}>Match Overview</Text>
        {recommendations.map((career, index) => (
          <View key={index} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
            <Text style={{ width: 150, fontSize: 8, color: gray, textAlign: 'right', paddingRight: 8, overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {career.career_title}
            </Text>
            <View style={{ flex: 1, height: 14, backgroundColor: '#f3f4f6', borderRadius: 7, overflow: 'hidden' }}>
              <View style={{ width: `${career.match_percentage}%`, height: 14, borderRadius: 7, backgroundColor: purple }} />
            </View>
            <Text style={{ width: 32, fontSize: 8, fontFamily: 'Helvetica-Bold', color: matchColor(career.match_percentage), textAlign: 'right', paddingLeft: 4 }}>
              {career.match_percentage}%
            </Text>
          </View>
        ))}
      </View>

      <View style={s.disclaimer}>
        <Text style={s.disclaimerText}>This report is generated using AI based on your responses and is intended for career exploration purposes only; results may not be fully accurate or definitive.</Text>
      </View>

      <View style={s.footer} fixed>
        <Link src="https://helloivy.ai" style={s.footerLink}>helloivy.ai</Link>
        <Text style={s.footerText}>|</Text>
        <Text style={s.footerText}>partners@reachivy.com</Text>
      </View>

      <Text style={s.pageNumber} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} fixed />
    </Page>

    {/* ===== One page per career ===== */}
    {recommendations.map((career, index) => (
      <Page key={index} size="A4" style={s.page} wrap>
        <Image src={LOGO_APP_BASE64} style={{ width: 80, height: 16, marginBottom: 8 }} />
        <View style={s.card}>
          {/* Header */}
          <View wrap={false} style={[s.cardHeader, { backgroundColor: purple }]}>
            <View style={{ flex: 1 }}>
              <Text style={s.cardRank}>#{index + 1}</Text>
              <Text style={s.cardTitle}>{career.career_title}</Text>
              <Text style={s.cardSalary}>{career.salary_range}</Text>
            </View>
            <View style={[s.badge, { borderColor: matchColor(career.match_percentage), borderWidth: 1.5 }]}>
              <Text style={[s.badgeText, { color: matchColor(career.match_percentage) }]}>
                {career.match_percentage}% Match
              </Text>
            </View>
          </View>

          {/* Body — two columns */}
          <View style={s.cardBody}>
            <View style={s.twoCol}>
              {/* Left column */}
              <View style={s.col}>
                <View wrap={false}>
                  <Text style={s.sectionTitle}>Career Overview</Text>
                  <Text style={s.sectionText}>{career.description}</Text>
                </View>

                <View wrap={false}>
                  <Text style={s.sectionTitle}>Why This Career Fits You</Text>
                  <Text style={s.sectionText}>{career.why_recommended}</Text>
                </View>

                {career.day_in_life ? (
                  <View wrap={false}>
                    <Text style={s.sectionTitle}>A Day in the Life</Text>
                    <Text style={s.sectionText}>{career.day_in_life}</Text>
                  </View>
                ) : null}

                {career.alignment_points?.length > 0 ? (
                  <View wrap={false}>
                    <Text style={s.sectionTitle}>How This Matches Your Interests</Text>
                    {career.alignment_points.map((pt, i) => (
                      <View key={i} style={s.bulletItem}>
                        <Text style={s.bullet}>•</Text>
                        <Text style={s.bulletText}>{pt}</Text>
                      </View>
                    ))}
                  </View>
                ) : null}
              </View>

              {/* Right column */}
              <View style={s.col}>
                {career.required_skills?.length > 0 ? (
                  <View wrap={false}>
                    <Text style={s.sectionTitle}>Required Skills</Text>
                    <View style={s.chipRow}>
                      {career.required_skills.map((sk, i) => (
                        <View key={i} style={s.chip}>
                          <Text style={s.chipText}>{sk}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                ) : null}

                {career.related_subjects?.length > 0 ? (
                  <View wrap={false}>
                    <Text style={s.sectionTitle}>Related Subjects</Text>
                    <View style={s.chipRow}>
                      {career.related_subjects.map((subj, i) => (
                        <View key={i} style={[s.chip, { backgroundColor: lightBlue }]}>
                          <Text style={[s.chipText, { color: blue }]}>{subj}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                ) : null}

                {career.degrees?.length > 0 ? (
                  <View wrap={false}>
                    <Text style={s.sectionTitle}>Potential Degrees</Text>
                    <View style={s.chipRow}>
                      {career.degrees.map((deg, i) => (
                        <View key={i} style={[s.chip, { backgroundColor: '#fef3c7' }]}>
                          <Text style={[s.chipText, { color: '#92400e' }]}>{deg}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                ) : null}

                {career.next_steps?.length > 0 ? (
                  <View wrap={false}>
                    <Text style={s.sectionTitle}>Next Steps</Text>
                    {career.next_steps.map((step, i) => (
                      <View key={i} style={[s.bulletItem, { alignItems: 'flex-start' }]}>
                        <View style={s.stepNum}>
                          <Text style={s.stepNumText}>{i + 1}</Text>
                        </View>
                        <Text style={s.stepText}>{step}</Text>
                      </View>
                    ))}
                  </View>
                ) : null}

                {career.pros_and_cons && (career.pros_and_cons.pros?.length > 0 || career.pros_and_cons.cons?.length > 0) ? (
                  <View wrap={false}>
                    <Text style={s.sectionTitle}>Pros & Cons</Text>
                    {career.pros_and_cons.pros?.length > 0 && (
                      <View style={s.prosBox}>
                        <Text style={s.prosTitle}>Pros</Text>
                        {career.pros_and_cons.pros.map((p, i) => (
                          <Text key={i} style={s.proItem}>+ {p}</Text>
                        ))}
                      </View>
                    )}
                    {career.pros_and_cons.cons?.length > 0 && (
                      <View style={s.consBox}>
                        <Text style={s.consTitle}>Cons</Text>
                        {career.pros_and_cons.cons.map((c, i) => (
                          <Text key={i} style={s.conItem}>- {c}</Text>
                        ))}
                      </View>
                    )}
                  </View>
                ) : null}

                {career.work_life_balance ? (
                  <View wrap={false}>
                    <Text style={s.sectionTitle}>Work-Life Balance</Text>
                    <Text style={s.sectionText}>{career.work_life_balance}</Text>
                  </View>
                ) : null}
              </View>
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
    ))}
  </Document>
);

export default CareerResultsPDF;
