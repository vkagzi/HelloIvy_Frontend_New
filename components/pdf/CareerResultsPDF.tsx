import React from 'react';
import { Document, Page, View, Text, Image, Link, StyleSheet } from '@react-pdf/renderer';
import type { CareerRecommendation } from '@/lib/career-discovery-api';
import { LOGO_APP_BASE64 } from './logo-base64';

/* ── colour tokens ─────────────────────────────────────── */
const purple   = '#7f12f3';
const blue     = '#1a86f1';
const lightPurple = '#e9d5ff';
const tealBg   = '#d0f5f5';
const green    = '#40c795';
const gray     = '#4b5563';
const gray100  = '#f3f4f6';
const gray200  = '#e5e7eb';
const amber    = '#d97706';

/* ── styles ─────────────────────────────────────────────── */
const s = StyleSheet.create({
  page: { padding: 30, fontFamily: 'Helvetica', fontSize: 9, color: '#1f2937' },
  pageNumber: {
    position: 'absolute', bottom: 16, left: 0, right: 0,
    textAlign: 'center', fontSize: 7, color: '#9ca3af',
  },

  /* summary page */
  summaryHeader: { backgroundColor: purple, borderRadius: 8, padding: 16, marginBottom: 14 },
  summaryTitle: { fontSize: 18, fontFamily: 'Helvetica-Bold', color: '#fff', textAlign: 'center' },
  summarySubtitle: { fontSize: 10, color: lightPurple, textAlign: 'center', marginTop: 4 },
  statBox: { backgroundColor: lightPurple, borderRadius: 8, padding: 14, alignItems: 'center', marginTop: 10 },
  statNumber: { fontSize: 28, fontFamily: 'Helvetica-Bold', color: purple },
  statLabel: { fontSize: 10, color: purple, marginTop: 2 },

  /* career card header */
  card: { borderRadius: 8, overflow: 'hidden', marginBottom: 0 },
  cardHeader: { padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardRank: { fontSize: 10, color: 'rgba(255,255,255,0.7)', fontFamily: 'Helvetica-Bold' },
  cardTitle: { fontSize: 14, fontFamily: 'Helvetica-Bold', color: '#fff', marginTop: 2 },
  badge: { backgroundColor: '#fff', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontFamily: 'Helvetica-Bold', fontSize: 9 },

  /* feasibility + skill gaps strip */
  strip: {
    flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: gray200,
    backgroundColor: gray100, paddingHorizontal: 12, paddingVertical: 8,
  },
  stripLeft: { flex: 1 },
  stripRight: { flex: 1, borderLeftWidth: 1, borderLeftColor: gray200, paddingLeft: 10 },
  stripLabel: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 },

  feasBadge: { borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2, marginBottom: 3, alignSelf: 'flex-start' },
  feasText: { fontSize: 7, fontFamily: 'Helvetica-Bold' },
  feasReason: { fontSize: 7.5, color: gray, lineHeight: 1.4 },

  gapNumCircle: { width: 13, height: 13, borderRadius: 7, backgroundColor: lightPurple, alignItems: 'center', justifyContent: 'center', marginRight: 4, marginTop: 0.5 },
  gapNumText: { fontSize: 6, fontFamily: 'Helvetica-Bold', color: purple },
  gapText: { fontSize: 7.5, color: gray, flex: 1, lineHeight: 1.4 },

  /* card body */
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
  disclaimer: {
    marginTop: 14, padding: 10, backgroundColor: '#fdf4ff',
    borderRadius: 6, borderWidth: 0.5, borderColor: '#d8b4fe',
  },
  disclaimerText: { fontSize: 7, color: '#6b21a8', lineHeight: 1.5, textAlign: 'center', fontStyle: 'italic' },
  footer: {
    position: 'absolute', bottom: 26, left: 30, right: 30,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6,
  },
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

function feasBgColor(level: string) {
  if (level === 'High')   return { bg: '#d1fae5', text: '#065f46' };
  if (level === 'Medium') return { bg: '#fef3c7', text: '#92400e' };
  return                         { bg: '#fee2e2', text: '#991b1b' };
}

function feasDot(level: string) {
  if (level === 'High')   return '● High';
  if (level === 'Medium') return '● Medium';
  return '● Low';
}

/* ── Footer / page-number ─────────────────────────────────── */
const PageFooter = () => (
  <>
    <View style={s.footer} fixed>
      <Link src="https://helloivy.ai" style={s.footerLink}>helloivy.ai</Link>
      <Text style={s.footerText}>|</Text>
      <Text style={s.footerText}>partners@reachivy.com</Text>
    </View>
    <Text
      style={s.pageNumber}
      render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
      fixed
    />
  </>
);

/* ── component ──────────────────────────────────────────── */
export interface CareerResultsPDFProps {
  recommendations: CareerRecommendation[];
  studentName?: string;
}

const CareerResultsPDF: React.FC<CareerResultsPDFProps> = ({ recommendations, studentName }) => (
  <Document>

    {/* ===== Summary / cover page ===== */}
    <Page size="A4" style={s.page} wrap={false}>
      <Image src={LOGO_APP_BASE64} style={{ width: 120, height: 25, marginBottom: 12 }} />

      <View style={s.summaryHeader}>
        <Text style={s.summaryTitle}>Career &amp; Degree Selection Results</Text>
        {studentName && <Text style={s.summarySubtitle}>{studentName}</Text>}
      </View>

      <View style={s.statBox}>
        <Text style={s.statNumber}>{recommendations.length}</Text>
        <Text style={s.statLabel}>Career Matches</Text>
      </View>

      {/* Horizontal bar chart */}
      <View style={{ marginTop: 16, padding: 12, backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: gray200 }}>
        <Text style={{ fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#1f2937', marginBottom: 10 }}>
          Match Overview
        </Text>
        {recommendations.map((career, idx) => (
          <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
            <Text style={{ width: 150, fontSize: 8, color: gray, textAlign: 'right', paddingRight: 8 }}>
              {career.career_title}
            </Text>
            <View style={{ flex: 1, height: 14, backgroundColor: gray100, borderRadius: 7, overflow: 'hidden' }}>
              <View style={{ width: `${career.match_percentage}%`, height: 14, borderRadius: 7, backgroundColor: purple }} />
            </View>
            <Text style={{ width: 32, fontSize: 8, fontFamily: 'Helvetica-Bold', color: matchColor(career.match_percentage), textAlign: 'right', paddingLeft: 4 }}>
              {career.match_percentage}%
            </Text>
          </View>
        ))}
      </View>

      <View style={s.disclaimer}>
        <Text style={s.disclaimerText}>
          This report is generated using AI based on your responses and is intended for career exploration purposes only; results may not be fully accurate or definitive.
        </Text>
      </View>

      <PageFooter />
    </Page>

    {/* ===== One page per career ===== */}
    {recommendations.map((career, index) => {
      const hasFeasibility = !!career.feasibility;
      const hasSkillGaps   = (career.skill_gaps?.length ?? 0) > 0;
      const showStrip      = hasFeasibility || hasSkillGaps;

      // Build section list (same order as web UI)
      const sections: { weight: number; el: React.ReactNode }[] = [];

      sections.push({
        weight: 2 + (career.description?.length || 0) / 80,
        el: (
          <View wrap={false} key="overview">
            <Text style={s.sectionTitle}>Career Overview</Text>
            <Text style={s.sectionText}>{career.description}</Text>
          </View>
        ),
      });

      sections.push({
        weight: 2 + (career.why_recommended?.length || 0) / 80,
        el: (
          <View wrap={false} key="why">
            <Text style={s.sectionTitle}>Why This Career Fits You</Text>
            <Text style={s.sectionText}>{career.why_recommended}</Text>
          </View>
        ),
      });

      if (career.day_in_life) {
        sections.push({
          weight: 2 + career.day_in_life.length / 80,
          el: (
            <View wrap={false} key="dayinlife">
              <Text style={s.sectionTitle}>A Day in the Life</Text>
              <Text style={s.sectionText}>{career.day_in_life}</Text>
            </View>
          ),
        });
      }

      if (career.alignment_points?.length > 0) {
        sections.push({
          weight: 1 + career.alignment_points.length * 1.5,
          el: (
            <View wrap={false} key="alignment">
              <Text style={s.sectionTitle}>How This Matches Your Interests</Text>
              {career.alignment_points.map((pt, i) => (
                <View key={i} style={s.bulletItem}>
                  <Text style={s.bullet}>•</Text>
                  <Text style={s.bulletText}>{pt}</Text>
                </View>
              ))}
            </View>
          ),
        });
      }

      if (career.required_skills?.length > 0) {
        sections.push({
          weight: 1 + Math.ceil(career.required_skills.length / 4),
          el: (
            <View wrap={false} key="skills">
              <Text style={s.sectionTitle}>Required Skills</Text>
              <View style={s.chipRow}>
                {career.required_skills.map((sk, i) => (
                  <View key={i} style={s.chip}>
                    <Text style={s.chipText}>{sk}</Text>
                  </View>
                ))}
              </View>
            </View>
          ),
        });
      }

      if (career.degrees?.length > 0) {
        sections.push({
          weight: 1 + career.degrees.length * 3,
          el: (
            <View wrap={false} key="degrees">
              <Text style={s.sectionTitle}>Potential Degrees</Text>
              {career.degrees.map((deg, i) => {
                if (typeof deg === 'string') {
                  return (
                    <View key={i} style={[s.chip, { backgroundColor: '#fef3c7', marginBottom: 3 }]}>
                      <Text style={[s.chipText, { color: '#92400e' }]}>{deg}</Text>
                    </View>
                  );
                }
                const pathwayLabel = String(deg.pathway?.rank || '');
                const pathwayColor = {
                  'Core Path': '#059669',
                  'Alternate Path': '#2563eb',
                  'Differentiated Path': '#7c3aed',
                }[pathwayLabel] || gray;
                const stars = Array.from({ length: 5 }, (_, si) =>
                  si < (deg.fit_score || 0) ? '*' : ' '
                ).join('');
                return (
                  <View key={i} style={{ marginBottom: 4, padding: 4, backgroundColor: '#f9fafb', borderRadius: 4 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#111827' }}>
                        {String(deg.degree || '')}
                      </Text>
                      <Text style={{ fontSize: 7, color: pathwayColor, fontFamily: 'Helvetica-Bold' }}>
                        {pathwayLabel}
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 4, marginTop: 1 }}>
                      <Text style={{ fontSize: 8, color: amber }}>{stars}</Text>
                      <Text style={{ fontSize: 7, color: gray }}>{String(deg.fit_reason || '')}</Text>
                    </View>
                    {deg.pathway?.label ? (
                      <Text style={{ fontSize: 7, color: '#374151', marginTop: 1 }}>
                        {String(deg.pathway.label)}: {String(deg.pathway.why || '')}
                      </Text>
                    ) : null}
                    {deg.decision_filter?.condition ? (
                      <Text style={{ fontSize: 7, color: '#9ca3af', marginTop: 1, fontStyle: 'italic' }}>
                        If {String(deg.decision_filter.condition)}
                      </Text>
                    ) : null}
                  </View>
                );
              })}
            </View>
          ),
        });
      }

      if (career.next_steps?.length > 0) {
        sections.push({
          weight: 1 + career.next_steps.length * 1.5,
          el: (
            <View wrap={false} key="steps">
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
          ),
        });
      }

      if (career.pros_and_cons && (career.pros_and_cons.pros?.length > 0 || career.pros_and_cons.cons?.length > 0)) {
        sections.push({
          weight: 1 + (career.pros_and_cons.pros?.length || 0) * 1.2 + (career.pros_and_cons.cons?.length || 0) * 1.2,
          el: (
            <View wrap={false} key="proscons">
              <Text style={s.sectionTitle}>Pros &amp; Cons</Text>
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
          ),
        });
      }

      if (career.work_life_balance) {
        sections.push({
          weight: 2 + (career.work_life_balance.length || 0) / 80,
          el: (
            <View wrap={false} key="wlb">
              <Text style={s.sectionTitle}>Work-Life Balance</Text>
              <Text style={s.sectionText}>{career.work_life_balance}</Text>
            </View>
          ),
        });
      }

      // Greedy balanced two-column partition (same as before)
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
            {/* ── Card header (purple gradient simulation) ── */}
            <View wrap={false} style={[s.cardHeader, { backgroundColor: purple }]}>
              <View style={{ flex: 1 }}>
                <Text style={s.cardRank}>#{index + 1}</Text>
                <Text style={s.cardTitle}>{career.career_title}</Text>
              </View>
              <View style={[s.badge, { borderColor: matchColor(career.match_percentage), borderWidth: 1.5 }]}>
                <Text style={[s.badgeText, { color: matchColor(career.match_percentage) }]}>
                  {career.match_percentage}% Match
                </Text>
              </View>
            </View>

            {/* ── Feasibility + Skill Gaps strip (mirrors web UI) ── */}
            {showStrip && (
              <View style={s.strip} wrap={false}>

                {/* Feasibility */}
                {hasFeasibility && (
                  <View style={[s.stripLeft, !hasSkillGaps ? { flex: 1 } : {}]}>
                    <Text style={s.stripLabel}>Feasibility</Text>
                    {(() => {
                      const col = feasBgColor(career.feasibility!.level);
                      return (
                        <>
                          <View style={[s.feasBadge, { backgroundColor: col.bg }]}>
                            <Text style={[s.feasText, { color: col.text }]}>
                              {feasDot(career.feasibility!.level)}
                            </Text>
                          </View>
                          <Text style={s.feasReason}>{career.feasibility!.reason}</Text>
                        </>
                      );
                    })()}
                  </View>
                )}

                {/* Skill Gaps */}
                {hasSkillGaps && (
                  <View style={[s.stripRight, !hasFeasibility ? { borderLeftWidth: 0, paddingLeft: 0 } : {}]}>
                    <Text style={s.stripLabel}>⚡ Top Skill Gaps</Text>
                    {career.skill_gaps!.slice(0, 5).map((gap, gi) => (
                      <View key={gi} style={[s.bulletItem, { marginBottom: 2 }]}>
                        <View style={s.gapNumCircle}>
                          <Text style={s.gapNumText}>{gi + 1}</Text>
                        </View>
                        <Text style={s.gapText}>{gap}</Text>
                      </View>
                    ))}
                  </View>
                )}

              </View>
            )}

            {/* ── Card body — two-column layout ── */}
            <View style={s.cardBody}>
              <View style={s.twoCol}>
                <View style={s.col}>{leftCol}</View>
                <View style={s.col}>{rightCol}</View>
              </View>
            </View>
          </View>

          <PageFooter />
        </Page>
      );
    })}
  </Document>
);

export default CareerResultsPDF;
