import React from 'react';
import { Document, Page, View, Text, Image, Link, StyleSheet } from '@react-pdf/renderer';
import type { CollegeRecommendation } from '@/lib/college-selector-api';
import { LOGO_APP_BASE64 } from './logo-base64';

/* ── colour tokens ─────────────────────────────────────── */
const emerald = '#059669';
const green = '#22c55e';
const lightGreen = '#dcfce7';
const lightEmerald = '#d1fae5';
const gray = '#4b5563';

const fitColors: Record<string, { bg: string; text: string; label: string }> = {
  reach: { bg: '#fef2f2', text: '#dc2626', label: 'Reach' },
  match: { bg: '#f0fdf4', text: '#16a34a', label: 'Match' },
  safe: { bg: '#eff6ff', text: '#2563eb', label: 'Safe' },
};

/* ── styles ─────────────────────────────────────────────── */
const s = StyleSheet.create({
  page: { paddingTop: 30, paddingHorizontal: 30, paddingBottom: 55, fontFamily: 'Helvetica', fontSize: 9, color: '#1f2937' },
  pageNumber: { position: 'absolute', bottom: 16, left: 0, right: 0, textAlign: 'center', fontSize: 7, color: '#9ca3af' },

  /* summary page */
  summaryHeader: { backgroundColor: emerald, borderRadius: 8, padding: 16, marginBottom: 14 },
  summaryTitle: { fontSize: 18, fontFamily: 'Helvetica-Bold', color: '#fff', textAlign: 'center' },
  summarySubtitle: { fontSize: 10, color: lightGreen, textAlign: 'center', marginTop: 4 },

  statRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  statBox: { backgroundColor: lightEmerald, borderRadius: 8, padding: 14, alignItems: 'center', flex: 1 },
  statNumber: { fontSize: 28, fontFamily: 'Helvetica-Bold', color: emerald },
  statLabel: { fontSize: 10, color: emerald, marginTop: 2 },

  /* college card */
  card: { borderRadius: 8, overflow: 'hidden' },
  cardHeader: { padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardRank: { fontSize: 10, color: 'rgba(255,255,255,0.7)', fontFamily: 'Helvetica-Bold' },
  cardTitle: { fontSize: 14, fontFamily: 'Helvetica-Bold', color: '#fff', marginTop: 2 },
  cardLocation: { fontSize: 9, color: lightGreen, marginTop: 2 },
  badge: { backgroundColor: '#fff', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontFamily: 'Helvetica-Bold', fontSize: 9 },
  fitBadge: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3, marginTop: 4 },
  fitBadgeText: { fontSize: 8, fontFamily: 'Helvetica-Bold' },
  cardBody: { padding: 14, backgroundColor: '#fff' },
  twoCol: { flexDirection: 'row', gap: 14 },
  col: { flex: 1 },

  /* sections */
  sectionTitle: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: '#1f2937', marginBottom: 4, marginTop: 8 },
  sectionText: { fontSize: 9, color: gray, lineHeight: 1.5 },

  /* chips / pills */
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 2 },
  chip: { backgroundColor: lightGreen, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  chipText: { fontSize: 8, color: emerald },

  /* bullet list */
  bulletItem: { flexDirection: 'row', gap: 4, marginBottom: 3 },
  bullet: { fontSize: 9, color: emerald, fontFamily: 'Helvetica-Bold' },
  bulletText: { fontSize: 9, color: gray, flex: 1, lineHeight: 1.4 },

  /* detail grid */
  detailRow: { flexDirection: 'row', marginBottom: 3 },
  detailLabel: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: gray, width: 90 },
  detailValue: { fontSize: 8, color: '#1f2937', flex: 1 },

  /* fit reasoning box */
  fitBox: { borderRadius: 6, padding: 8, marginTop: 4 },
  fitBoxText: { fontSize: 8, lineHeight: 1.5 },

  /* disclaimer & footer */
  disclaimer: { marginTop: 14, padding: 10, backgroundColor: '#ecfdf5', borderRadius: 6, borderWidth: 0.5, borderColor: '#6ee7b7' },
  disclaimerText: { fontSize: 7, color: '#065f46', lineHeight: 1.5, textAlign: 'center', fontStyle: 'italic' },
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
export interface CollegeSelectorResultsPDFProps {
  recommendations: CollegeRecommendation[];
  studentName?: string;
}

const CollegeSelectorResultsPDF: React.FC<CollegeSelectorResultsPDFProps> = ({ recommendations, studentName }) => {
  const reachCount = recommendations.filter((r) => r.fit_category === 'reach').length;
  const matchCount = recommendations.filter((r) => r.fit_category === 'match').length;
  const safeCount = recommendations.filter((r) => r.fit_category === 'safe').length;

  return (
    <Document>
      {/* ===== Summary page ===== */}
      <Page size="A4" style={s.page} wrap>
        <Image src={LOGO_APP_BASE64} style={{ width: 120, height: 25, marginBottom: 12 }} />
        <View style={s.summaryHeader}>
          <Text style={s.summaryTitle}>College Selection Results</Text>
          {studentName && <Text style={s.summarySubtitle}>{studentName}</Text>}
        </View>

        <View style={s.statRow}>
          <View style={s.statBox}>
            <Text style={s.statNumber}>{recommendations.length}</Text>
            <Text style={s.statLabel}>Total Colleges</Text>
          </View>
          <View style={[s.statBox, { backgroundColor: '#fef2f2' }]}>
            <Text style={[s.statNumber, { color: '#dc2626' }]}>{reachCount}</Text>
            <Text style={[s.statLabel, { color: '#dc2626' }]}>Reach</Text>
          </View>
          <View style={[s.statBox, { backgroundColor: lightGreen }]}>
            <Text style={[s.statNumber, { color: '#16a34a' }]}>{matchCount}</Text>
            <Text style={[s.statLabel, { color: '#16a34a' }]}>Match</Text>
          </View>
          <View style={[s.statBox, { backgroundColor: '#eff6ff' }]}>
            <Text style={[s.statNumber, { color: '#2563eb' }]}>{safeCount}</Text>
            <Text style={[s.statLabel, { color: '#2563eb' }]}>Safe</Text>
          </View>
        </View>

        {/* Horizontal Bar Chart */}
        <View style={{ marginTop: 16, padding: 12, backgroundColor: '#fff', borderRadius: 8, border: '1 solid #e5e7eb' }}>
          <Text style={{ fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#1f2937', marginBottom: 10 }}>Match Overview</Text>
          {recommendations.map((rec, index) => (
            <View key={index} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
              <Text style={{ width: 150, fontSize: 8, color: gray, textAlign: 'right', paddingRight: 8 }}>
                {rec.university_name}
              </Text>
              <View style={{ flex: 1, height: 14, backgroundColor: '#f3f4f6', borderRadius: 7, overflow: 'hidden' }}>
                <View style={{ width: `${rec.match_percentage}%`, height: 14, borderRadius: 7, backgroundColor: emerald }} />
              </View>
              <Text style={{ width: 32, fontSize: 8, fontFamily: 'Helvetica-Bold', color: matchColor(rec.match_percentage), textAlign: 'right', paddingLeft: 4 }}>
                {rec.match_percentage}%
              </Text>
            </View>
          ))}
        </View>

        <View style={s.disclaimer}>
          <Text style={s.disclaimerText}>This report is generated using AI based on your responses and is intended for college exploration purposes only; results may not be fully accurate or definitive.</Text>
        </View>

        <View style={s.footer} fixed>
          <Link src="https://helloivy.ai" style={s.footerLink}>helloivy.ai</Link>
          <Text style={s.footerText}>|</Text>
          <Text style={s.footerText}>partners@reachivy.com</Text>
        </View>
        <Text style={s.pageNumber} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} fixed />
      </Page>

      {/* ===== One page per college ===== */}
      {recommendations.map((rec, index) => {
        const fit = fitColors[rec.fit_category] || fitColors.match;

        // Build sections with weight estimates for balanced column layout
        const sections: { weight: number; el: React.ReactNode }[] = [];

        // Description
        if (rec.description) {
          sections.push({
            weight: 2 + rec.description.length / 80,
            el: (
              <View wrap={false} key="description">
                <Text style={s.sectionTitle}>About This College</Text>
                <Text style={s.sectionText}>{rec.description}</Text>
              </View>
            ),
          });
        }

        // Fit Reasoning
        if (rec.fit_reasoning) {
          sections.push({
            weight: 2 + rec.fit_reasoning.length / 80,
            el: (
              <View wrap={false} key="fit-reasoning">
                <Text style={s.sectionTitle}>Why This Is a {fit.label}</Text>
                <View style={[s.fitBox, { backgroundColor: fit.bg }]}>
                  <Text style={[s.fitBoxText, { color: fit.text }]}>{rec.fit_reasoning}</Text>
                </View>
              </View>
            ),
          });
        }

        // Suggested Deadline
        if (rec.suggested_deadline) {
          sections.push({
            weight: 1.5,
            el: (
              <View wrap={false} key="suggested-deadline">
                <Text style={s.sectionTitle}>Suggested Deadline</Text>
                <View style={[s.fitBox, { backgroundColor: '#f3e8ff' }]}>
                  <Text style={[s.fitBoxText, { color: '#6b21a8' }]}>{rec.suggested_deadline}</Text>
                </View>
              </View>
            ),
          });
        }

        // Key Details
        const details = [
          { label: 'Degree & Major', value: rec.degree_and_major },
          { label: 'Type', value: rec.university_type },
          { label: 'Tuition Fees', value: rec.tuition_fees },
          { label: 'Cost of Living', value: rec.cost_of_living },
          { label: 'Acceptance Rate', value: rec.acceptance_rate },
          { label: 'Employment Rate', value: rec.employment_rate },
          { label: 'Language', value: rec.language },
          { label: 'Campus Type', value: rec.campus_type },
        ].filter((d) => d.value);

        if (details.length > 0) {
          sections.push({
            weight: 1 + details.length * 0.8,
            el: (
              <View wrap={false} key="details">
                <Text style={s.sectionTitle}>Key Details</Text>
                {details.map((d, i) => (
                  <View key={i} style={s.detailRow}>
                    <Text style={s.detailLabel}>{d.label}</Text>
                    <Text style={s.detailValue}>{d.value}</Text>
                  </View>
                ))}
              </View>
            ),
          });
        }

        // Academic Requirements
        if (rec.academic_requirements && Object.keys(rec.academic_requirements).length > 0) {
          sections.push({
            weight: 1 + Object.keys(rec.academic_requirements).length * 0.8,
            el: (
              <View wrap={false} key="academics">
                <Text style={s.sectionTitle}>Academic Requirements</Text>
                {Object.entries(rec.academic_requirements).map(([key, val], i) => (
                  <View key={i} style={s.detailRow}>
                    <Text style={s.detailLabel}>{key.toUpperCase()}</Text>
                    <Text style={s.detailValue}>{val}</Text>
                  </View>
                ))}
              </View>
            ),
          });
        }

        // Global Rankings
        if (rec.global_ranking && Object.keys(rec.global_ranking).length > 0) {
          sections.push({
            weight: 1 + Math.ceil(Object.keys(rec.global_ranking).length / 3),
            el: (
              <View wrap={false} key="rankings">
                <Text style={s.sectionTitle}>Global Rankings</Text>
                <View style={s.chipRow}>
                  {Object.entries(rec.global_ranking).map(([system, rank], i) => (
                    <View key={i} style={s.chip}>
                      <Text style={s.chipText}>{system}: {rank}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ),
          });
        }

        // Scholarships
        if (rec.scholarships && rec.scholarships.length > 0) {
          sections.push({
            weight: 1 + rec.scholarships.length * 1.2,
            el: (
              <View wrap={false} key="scholarships">
                <Text style={s.sectionTitle}>Scholarships</Text>
                {rec.scholarships.map((sch, i) => (
                  <View key={i} style={s.bulletItem}>
                    <Text style={s.bullet}>•</Text>
                    <Text style={s.bulletText}>{sch}</Text>
                  </View>
                ))}
              </View>
            ),
          });
        }

        // Tests Required
        if (rec.tests_required && rec.tests_required.length > 0) {
          sections.push({
            weight: 1 + Math.ceil(rec.tests_required.length / 4),
            el: (
              <View wrap={false} key="tests">
                <Text style={s.sectionTitle}>Tests Required</Text>
                <View style={s.chipRow}>
                  {rec.tests_required.map((t, i) => (
                    <View key={i} style={[s.chip, { backgroundColor: '#fef3c7' }]}>
                      <Text style={[s.chipText, { color: '#92400e' }]}>{t}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ),
          });
        }

        // Deadlines
        if (rec.deadlines && Object.keys(rec.deadlines).length > 0) {
          sections.push({
            weight: 1 + Object.keys(rec.deadlines).length * 0.8,
            el: (
              <View wrap={false} key="deadlines">
                <Text style={s.sectionTitle}>Application Deadlines</Text>
                {Object.entries(rec.deadlines).map(([round, date], i) => (
                  <View key={i} style={s.detailRow}>
                    <Text style={s.detailLabel}>{round}</Text>
                    <Text style={s.detailValue}>{date}</Text>
                  </View>
                ))}
              </View>
            ),
          });
        }

        // Additional Requirements
        if (rec.additional_requirements && rec.additional_requirements.length > 0) {
          sections.push({
            weight: 1 + rec.additional_requirements.length * 1.2,
            el: (
              <View wrap={false} key="addl-reqs">
                <Text style={s.sectionTitle}>Additional Requirements</Text>
                {rec.additional_requirements.map((req, i) => (
                  <View key={i} style={s.bulletItem}>
                    <Text style={s.bullet}>•</Text>
                    <Text style={s.bulletText}>{req}</Text>
                  </View>
                ))}
              </View>
            ),
          });
        }

        // Post-Study & Support
        const extraDetails = [
          { label: 'Work Visa', value: rec.post_study_work_visa },
          { label: 'Intl Support', value: rec.intl_student_support },
          { label: 'Application Fee', value: rec.application_fee },
        ].filter((d) => d.value);

        if (extraDetails.length > 0) {
          sections.push({
            weight: 1 + extraDetails.length * 0.8,
            el: (
              <View wrap={false} key="extra">
                <Text style={s.sectionTitle}>Additional Info</Text>
                {extraDetails.map((d, i) => (
                  <View key={i} style={s.detailRow}>
                    <Text style={s.detailLabel}>{d.label}</Text>
                    <Text style={s.detailValue}>{d.value}</Text>
                  </View>
                ))}
              </View>
            ),
          });
        }

        // Greedy partition into balanced columns
        const leftCol: React.ReactNode[] = [];
        const rightCol: React.ReactNode[] = [];
        let leftW = 0, rightW = 0;
        for (const sec of sections) {
          if (leftW <= rightW) {
            leftCol.push(sec.el);
            leftW += sec.weight;
          } else {
            rightCol.push(sec.el);
            rightW += sec.weight;
          }
        }

        return (
          <Page key={index} size="A4" style={s.page} wrap>
            <Image src={LOGO_APP_BASE64} style={{ width: 80, height: 16, marginBottom: 8 }} />
            <View style={s.card}>
              <View wrap={false} style={[s.cardHeader, { backgroundColor: emerald }]}>
                <View style={{ flex: 1 }}>
                  <Text style={s.cardRank}>#{index + 1}</Text>
                  <Text style={s.cardTitle}>{rec.university_name}</Text>
                  <Text style={s.cardLocation}>{rec.location}</Text>
                  <View style={[s.fitBadge, { backgroundColor: fit.bg }]}>
                    <Text style={[s.fitBadgeText, { color: fit.text }]}>{fit.label}</Text>
                  </View>
                </View>
                <View style={[s.badge, { borderColor: matchColor(rec.match_percentage), borderWidth: 1.5 }]}>
                  <Text style={[s.badgeText, { color: matchColor(rec.match_percentage) }]}>
                    {rec.match_percentage}% Match
                  </Text>
                </View>
              </View>
              <View style={s.cardBody}>
                <View style={s.twoCol}>
                  <View style={s.col}>{leftCol}</View>
                  <View style={s.col}>{rightCol}</View>
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
        );
      })}
    </Document>
  );
};

export default CollegeSelectorResultsPDF;
