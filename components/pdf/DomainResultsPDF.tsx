import React from 'react';
import { Document, Page, View, Text, Image, Link, StyleSheet } from '@react-pdf/renderer';
import type { DomainRecommendation } from '@/lib/domain-discovery-api';
import { LOGO_APP_BASE64 } from './logo-base64';

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
  page: { paddingTop: 30, paddingHorizontal: 30, paddingBottom: 55, fontFamily: 'Helvetica', fontSize: 9, color: '#1f2937' },
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

  /* disclaimer & footer */
  disclaimer: { marginTop: 14, padding: 10, backgroundColor: '#fef9e7', borderRadius: 6, borderWidth: 0.5, borderColor: '#f5d063' },
  disclaimerText: { fontSize: 7, color: '#92700c', lineHeight: 1.5, textAlign: 'center', fontStyle: 'italic' },
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
    <Page size="A4" style={s.page} wrap={false}>
      <Image src={LOGO_APP_BASE64} style={{ width: 120, height: 25, marginBottom: 12 }} />
      <View style={s.summaryHeader}>
        <Text style={s.summaryTitle}>Stream & Subject Selection Results</Text>
        {studentName && <Text style={s.summarySubtitle}>{studentName}</Text>}
      </View>

      <View style={s.statBox}>
        <Text style={s.statNumber}>{recommendations.length}</Text>
        <Text style={s.statLabel}>Domain Matches</Text>
      </View>
      <Text style={s.pageNumber} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} fixed />

      {/* Horizontal Bar Chart */}
      <View style={{ marginTop: 16, padding: 12, backgroundColor: '#fff', borderRadius: 8, border: '1 solid #e5e7eb' }}>
        <Text style={{ fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#1f2937', marginBottom: 10 }}>Match Overview</Text>
        {recommendations.map((domain, index) => (
          <View key={index} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
            <Text style={{ width: 150, fontSize: 8, color: gray, textAlign: 'right', paddingRight: 8 }}>
              {domain.domain_title}
            </Text>
            <View style={{ flex: 1, height: 14, backgroundColor: '#f3f4f6', borderRadius: 7, overflow: 'hidden' }}>
              <View style={{ width: `${domain.match_percentage}%`, height: 14, borderRadius: 7, backgroundColor: brandBlue }} />
            </View>
            <Text style={{ width: 32, fontSize: 8, fontFamily: 'Helvetica-Bold', color: matchColor(domain.match_percentage), textAlign: 'right', paddingLeft: 4 }}>
              {domain.match_percentage}%
            </Text>
          </View>
        ))}
      </View>


      {interests.length > 0 && (
        <View style={{ marginTop: 10, backgroundColor: lightBlue, borderRadius: 8, padding: 10 }} wrap={false}>
          <Text style={s.summaryLabel}>Your Interests</Text>
          <View style={s.chipRow}>
            {interests.map((item, i) => (
              <View key={i} style={s.chipBlue}>
                <Text style={s.chipBlueText}>{typeof item === 'string' ? item : (item && typeof item === 'object' && 'subject' in item ? (item as any).subject : String(item))}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      <View style={s.disclaimer}>
        <Text style={s.disclaimerText}>This report is generated using AI based on your responses and is intended for career exploration purposes only; results may not be fully accurate or definitive.</Text>
      </View>

      <View style={s.footer} fixed>
        <Link src="https://helloivy.ai" style={s.footerLink}>helloivy.ai</Link>
        <Text style={s.footerText}>|</Text>
        <Text style={s.footerText}>partners@reachivy.com</Text>
      </View>

    </Page>

    {/* ===== One page per domain ===== */}
    {recommendations.map((domain, index) => {
      // Build sections with weight estimates for balanced column layout
      const sections: { weight: number; el: React.ReactNode }[] = [];

      sections.push({
        weight: 2 + ((domain.why_recommended || domain.description)?.length || 0) / 80,
        el: (
          <View wrap={false} key="why">
            <Text style={s.sectionTitle}>Why This Domain Fits You</Text>
            <Text style={s.sectionText}>{domain.why_recommended || domain.description}</Text>
          </View>
        ),
      });

      if (domain.key_interests?.length > 0) {
        sections.push({
          weight: 1 + Math.ceil(domain.key_interests.length / 4),
          el: (
            <View wrap={false} key="interests">
              <Text style={s.sectionTitle}>Key Interests</Text>
              <View style={s.chipRow}>
                {domain.key_interests.map((item, i) => (
                  <View key={i} style={s.chip}>
                    <Text style={s.chipText}>{item}</Text>
                  </View>
                ))}
              </View>
            </View>
          ),
        });
      }

      if (domain.sub_domains?.length > 0) {
        sections.push({
          weight: 1 + domain.sub_domains.length * 1.2,
          el: (
            <View wrap={false} key="subdomains">
              <Text style={s.sectionTitle}>Sub-domains</Text>
              {domain.sub_domains.map((sd, i) => (
                <View key={i} style={s.bulletItem}>
                  <Text style={s.bullet}>•</Text>
                  <Text style={s.bulletText}>{sd}</Text>
                </View>
              ))}
            </View>
          ),
        });
      }

      if (domain.exploration_activities?.length > 0) {
        sections.push({
          weight: 1 + domain.exploration_activities.length * 1.5,
          el: (
            <View wrap={false} key="activities">
              <Text style={s.sectionTitle}>Exploration Activities</Text>
              {domain.exploration_activities.map((act, i) => (
                <View key={i} style={[s.bulletItem, { alignItems: 'flex-start' }]}>
                  <View style={s.stepNum}>
                    <Text style={s.stepNumText}>{i + 1}</Text>
                  </View>
                  <Text style={s.stepText}>{act}</Text>
                </View>
              ))}
            </View>
          ),
        });
      }



      if (domain.potential_careers?.length > 0) {
        sections.push({
          weight: 1 + Math.ceil(domain.potential_careers.length / 3),
          el: (
            <View wrap={false} key="careers">
              <Text style={s.sectionTitle}>Potential Career Paths</Text>
              <View style={s.chipRow}>
                {domain.potential_careers.map((c, i) => (
                  <View key={i} style={s.chipPurple}>
                    <Text style={s.chipPurpleText}>{c}</Text>
                  </View>
                ))}
              </View>
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
        <Page key={index} size="A4" style={s.page} wrap={false}>
          <Image src={LOGO_APP_BASE64} style={{ width: 80, height: 16, marginBottom: 8 }} />
          <View style={s.card}>
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

export default DomainResultsPDF;
