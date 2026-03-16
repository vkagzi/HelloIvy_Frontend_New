import React from 'react';
import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';
import type { DomainRecommendation } from '@/lib/domain-discovery-api';

/* ── colour tokens ─────────────────────────────────────── */
const brandBlue = '#3377ff';
const teal = '#14cecf';
const lightBlue = '#ebf2ff';
const lightTeal = '#e8fafa';
const chipBlue = '#d6e4ff';
const chipTeal = '#d0f5f5';
const gray = '#4b5563';

/* ── styles ─────────────────────────────────────────────── */
const s = StyleSheet.create({
  page: { padding: 30, fontFamily: 'Helvetica', fontSize: 9, color: '#1f2937' },
  pageNumber: { position: 'absolute', bottom: 16, left: 0, right: 0, textAlign: 'center', fontSize: 7, color: '#9ca3af' },

  /* summary page */
  summaryHeader: { backgroundColor: brandBlue, borderRadius: 8, padding: 16, marginBottom: 14 },
  summaryTitle: { fontSize: 18, fontFamily: 'Helvetica-Bold', color: '#fff', textAlign: 'center' },
  summarySubtitle: { fontSize: 10, color: chipBlue, textAlign: 'center', marginTop: 4 },

  interestsBox: { backgroundColor: lightBlue, borderRadius: 8, padding: 10, flex: 1 },
  strengthsBox: { backgroundColor: lightTeal, borderRadius: 8, padding: 10, flex: 1 },
  summaryLabel: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: '#1f2937', marginBottom: 6 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  chipBlue: { backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  chipBlueText: { fontSize: 8, color: brandBlue },
  chipTeal: { backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  chipTealText: { fontSize: 8, color: '#0fa5a5' },

  statBox: { backgroundColor: lightBlue, borderRadius: 8, padding: 14, alignItems: 'center', marginTop: 12 },
  statNumber: { fontSize: 28, fontFamily: 'Helvetica-Bold', color: brandBlue },
  statLabel: { fontSize: 10, color: brandBlue, marginTop: 2 },

  twoColSummary: { flexDirection: 'row', gap: 10, marginTop: 10 },

  /* domain card */
  card: { borderRadius: 8, overflow: 'hidden' },
  cardHeader: { padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardRank: { fontSize: 10, color: 'rgba(255,255,255,0.7)', fontFamily: 'Helvetica-Bold' },
  cardTitle: { fontSize: 14, fontFamily: 'Helvetica-Bold', color: '#fff', marginTop: 2 },
  cardCategory: { fontSize: 9, color: chipBlue, marginTop: 2 },
  badge: { backgroundColor: '#fff', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontFamily: 'Helvetica-Bold', fontSize: 9 },
  cardBody: { padding: 14, backgroundColor: '#fff' },
  twoCol: { flexDirection: 'row', gap: 14 },
  col: { flex: 1 },

  sectionTitle: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: '#1f2937', marginBottom: 4, marginTop: 8 },
  sectionText: { fontSize: 9, color: gray, lineHeight: 1.5 },

  bulletItem: { flexDirection: 'row', gap: 4, marginBottom: 3 },
  bullet: { fontSize: 9, color: brandBlue, fontFamily: 'Helvetica-Bold' },
  bulletText: { fontSize: 9, color: gray, flex: 1, lineHeight: 1.4 },

  stepNum: { width: 16, height: 16, borderRadius: 8, backgroundColor: chipBlue, alignItems: 'center', justifyContent: 'center' },
  stepNumText: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: '#40c795' },
  stepText: { fontSize: 9, color: gray, flex: 1, lineHeight: 1.4 },

  chip: { backgroundColor: chipBlue, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  chipText: { fontSize: 8, color: brandBlue },
  chipPurple: { backgroundColor: '#f3e8ff', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  chipPurpleText: { fontSize: 8, color: '#7f12f3' },
});

/* ── helpers ─────────────────────────────────────────────── */
function matchColor(pct: number) {
  if (pct >= 90) return '#059669';
  if (pct >= 80) return '#3b82f6';
  if (pct >= 70) return '#f59e0b';
  return '#6b7280';
}

/* ── component ──────────────────────────────────────────── */
export interface DomainResultsPDFProps {
  recommendations: DomainRecommendation[];
  interests: string[];
  strengths: string[];
  studentName?: string;
}

const DomainResultsPDF: React.FC<DomainResultsPDFProps> = ({
  recommendations,
  interests,
  strengths,
  studentName,
}) => (
  <Document>
    {/* ===== Summary page ===== */}
    <Page size="A4" style={s.page}>
      <View style={s.summaryHeader}>
        <Text style={s.summaryTitle}>Domain Discovery Results</Text>
        {studentName && <Text style={s.summarySubtitle}>{studentName}</Text>}
      </View>

      {(interests.length > 0 || strengths.length > 0) && (
        <View style={s.twoColSummary}>
          {interests.length > 0 && (
            <View style={s.interestsBox}>
              <Text style={s.summaryLabel}>Your Interests</Text>
              <View style={s.chipRow}>
                {interests.map((item, i) => (
                  <View key={i} style={s.chipBlue}>
                    <Text style={s.chipBlueText}>{item}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
          {strengths.length > 0 && (
            <View style={s.strengthsBox}>
              <Text style={s.summaryLabel}>Your Strengths</Text>
              <View style={s.chipRow}>
                {strengths.map((item, i) => (
                  <View key={i} style={s.chipTeal}>
                    <Text style={s.chipTealText}>{item}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      )}

      <View style={s.statBox}>
        <Text style={s.statNumber}>{recommendations.length}</Text>
        <Text style={s.statLabel}>Domain Matches</Text>
      </View>
      <Text style={s.pageNumber} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} fixed />
    </Page>

    {/* ===== One page per domain ===== */}
    {recommendations.map((domain, index) => (
      <Page key={index} size="A4" style={s.page} wrap>
        <View style={s.card}>
          {/* Header */}
          <View style={[s.cardHeader, { backgroundColor: brandBlue }]}>
            <View style={{ flex: 1 }}>
              <Text style={s.cardRank}>#{index + 1}</Text>
              <Text style={s.cardTitle}>{domain.domain_title}</Text>
              <Text style={s.cardCategory}>{domain.category}</Text>
            </View>
            <View style={[s.badge, { borderColor: matchColor(domain.match_percentage), borderWidth: 1.5 }]}>
              <Text style={[s.badgeText, { color: matchColor(domain.match_percentage) }]}>
                {domain.match_percentage}% Match
              </Text>
            </View>
          </View>

          {/* Body — two columns */}
          <View style={s.cardBody}>
            <View style={s.twoCol}>
              {/* Left column */}
              <View style={s.col}>
                <Text style={s.sectionTitle}>Why This Domain Fits You</Text>
                <Text style={s.sectionText}>{domain.why_recommended || domain.description}</Text>

                {domain.key_interests?.length > 0 ? (
                  <>
                    <Text style={s.sectionTitle}>Key Interests</Text>
                    <View style={s.chipRow}>
                      {domain.key_interests.map((item, i) => (
                        <View key={i} style={s.chip}>
                          <Text style={s.chipText}>{item}</Text>
                        </View>
                      ))}
                    </View>
                  </>
                ) : null}

                {domain.related_subjects?.length > 0 ? (
                  <>
                    <Text style={s.sectionTitle}>Related Subjects</Text>
                    <View style={s.chipRow}>
                      {domain.related_subjects.map((item, i) => (
                        <View key={i} style={s.chip}>
                          <Text style={s.chipText}>{item}</Text>
                        </View>
                      ))}
                    </View>
                  </>
                ) : null}

                {domain.sub_domains?.length > 0 ? (
                  <>
                    <Text style={s.sectionTitle}>Sub-domains</Text>
                    {domain.sub_domains.map((sd, i) => (
                      <View key={i} style={s.bulletItem}>
                        <Text style={s.bullet}>•</Text>
                        <Text style={s.bulletText}>{sd}</Text>
                      </View>
                    ))}
                  </>
                ) : null}
              </View>

              {/* Right column */}
              <View style={s.col}>
                {domain.exploration_activities?.length > 0 ? (
                  <>
                    <Text style={s.sectionTitle}>Exploration Activities</Text>
                    {domain.exploration_activities.map((act, i) => (
                      <View key={i} style={[s.bulletItem, { alignItems: 'flex-start' }]}>
                        <View style={s.stepNum}>
                          <Text style={s.stepNumText}>{i + 1}</Text>
                        </View>
                        <Text style={s.stepText}>{act}</Text>
                      </View>
                    ))}
                  </>
                ) : null}

                {domain.potential_careers?.length > 0 ? (
                  <>
                    <Text style={s.sectionTitle}>Potential Career Paths</Text>
                    <View style={s.chipRow}>
                      {domain.potential_careers.map((c, i) => (
                        <View key={i} style={s.chipPurple}>
                          <Text style={s.chipPurpleText}>{c}</Text>
                        </View>
                      ))}
                    </View>
                  </>
                ) : null}
              </View>
            </View>
          </View>
        </View>
        <Text style={s.pageNumber} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} fixed />
      </Page>
    ))}
  </Document>
);

export default DomainResultsPDF;
