import React from 'react';
import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer';
import { LOGO_APP_BASE64 } from './logo-base64';

export interface InvoiceLineItem {
  module: string;
  quantity: number;
  price: number;
}

export interface InvoiceData {
  orderId: number;
  orderDate: string;
  billingName: string;
  firstName: string;
  lastName: string;
  email: string;
  lineItems: InvoiceLineItem[];
  subtotal: number;
  discount: number;
  discountCode?: string | null;
  tax: number;
  taxRate: number;
  total: number;
  currency: string;
  transactionId?: string;
  status?: string;
  paymentMode?: string;
}

const maroon = '#8B0000';
const borderGray = '#bbb';
const labelBg = '#f5f0f0';

const s = StyleSheet.create({
  page: {
    paddingTop: 32, paddingBottom: 28, paddingHorizontal: 40,
    fontFamily: 'Helvetica', fontSize: 9, color: '#222',
  },

  // Header
  headerRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: 6,
  },
  logo: { width: 120, height: 32, objectFit: 'contain' },
  companyBlock: { alignItems: 'flex-end', maxWidth: 220 },
  companyName: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: maroon, marginBottom: 2 },
  companyLine: { fontSize: 6.5, color: '#555', textAlign: 'right', lineHeight: 1.4 },

  // Title
  titleBar: {
    backgroundColor: maroon, paddingVertical: 5, marginBottom: 12, marginTop: 8,
  },
  title: {
    fontSize: 14, fontFamily: 'Helvetica-Bold', textAlign: 'center',
    color: '#fff', letterSpacing: 1.5, textTransform: 'uppercase',
  },

  // Info grid
  infoTable: { borderWidth: 1, borderColor: borderGray, marginBottom: 14 },
  infoRow: { flexDirection: 'row', borderBottomWidth: 1, borderColor: borderGray, minHeight: 22 },
  infoRowLast: { flexDirection: 'row', minHeight: 22 },
  infoCellLabel: {
    width: '17%', paddingVertical: 5, paddingHorizontal: 6,
    borderRightWidth: 1, borderColor: borderGray,
    fontFamily: 'Helvetica-Bold', fontSize: 7.5, backgroundColor: labelBg,
    color: '#333',
  },
  infoCellValue: {
    width: '33%', paddingVertical: 5, paddingHorizontal: 6,
    borderRightWidth: 1, borderColor: borderGray, fontSize: 8, color: '#111',
  },
  infoCellValueLast: {
    width: '33%', paddingVertical: 5, paddingHorizontal: 6, fontSize: 8, color: '#111',
  },

  // Line items table
  tableHeader: {
    flexDirection: 'row', backgroundColor: maroon,
    paddingVertical: 6, paddingHorizontal: 8, marginTop: 2,
  },
  tableHeaderCell: { fontFamily: 'Helvetica-Bold', fontSize: 8, color: '#fff' },
  tableRow: {
    flexDirection: 'row', paddingVertical: 6, paddingHorizontal: 8,
    borderBottomWidth: 0.5, borderColor: '#ccc',
  },
  tableRowAlt: {
    flexDirection: 'row', paddingVertical: 6, paddingHorizontal: 8,
    borderBottomWidth: 0.5, borderColor: '#ccc', backgroundColor: '#fafafa',
  },
  tableCell: { fontSize: 8, color: '#222' },
  tableTotalRow: {
    flexDirection: 'row', paddingVertical: 6, paddingHorizontal: 8,
    borderTopWidth: 1.5, borderBottomWidth: 1.5, borderColor: borderGray,
    backgroundColor: labelBg,
  },

  // Summary
  summaryContainer: { marginTop: 10, alignItems: 'flex-end' },
  summaryRow: { flexDirection: 'row', paddingVertical: 3 },
  summaryLabel: {
    width: 180, textAlign: 'right', fontSize: 8.5, paddingRight: 14, color: '#444',
  },
  summaryValue: { width: 100, textAlign: 'right', fontSize: 8.5, color: '#222' },
  grandTotalRow: {
    flexDirection: 'row', paddingVertical: 5, marginTop: 3,
    borderTopWidth: 1.5, borderColor: maroon,
  },
  grandTotalLabel: {
    width: 180, textAlign: 'right', fontSize: 11, paddingRight: 14,
    fontFamily: 'Helvetica-Bold', color: maroon,
  },
  grandTotalValue: {
    width: 100, textAlign: 'right', fontSize: 11,
    fontFamily: 'Helvetica-Bold', color: maroon,
  },
  totalWords: {
    textAlign: 'right', fontSize: 7.5, color: '#666', marginTop: 3,
    fontFamily: 'Helvetica-Oblique',
  },

  // Payment terms
  termsBox: { marginTop: 18, borderWidth: 1, borderColor: maroon, borderRadius: 2 },
  termsHeader: { backgroundColor: maroon, paddingVertical: 5, paddingHorizontal: 8 },
  termsHeaderText: { color: '#fff', fontFamily: 'Helvetica-Bold', fontSize: 9 },
  termsBody: { flexDirection: 'row', padding: 10 },
  termsCol: { width: '50%', fontSize: 7, lineHeight: 1.7, color: '#333' },
  termsDivider: { width: 1, backgroundColor: '#ddd', marginHorizontal: 8 },
  termsColBold: {
    fontFamily: 'Helvetica-Bold', marginBottom: 4, fontSize: 7.5, color: '#222',
  },

  // Disclaimer
  disclaimer: {
    marginTop: 12, fontSize: 6.5, color: '#666', lineHeight: 1.5,
    borderTopWidth: 0.5, borderColor: '#ccc', paddingTop: 8,
  },

  // Footer
  footer: {
    position: 'absolute', bottom: 20, left: 40, right: 40,
    fontSize: 7, color: '#888', textAlign: 'center',
    borderTopWidth: 1, borderColor: maroon, paddingTop: 6,
  },
});

function formatINR(amount: number): string {
  return `Rs ${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function numberToWords(num: number): string {
  if (num === 0) return 'Zero rupees';
  const ones = [
    '', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine',
    'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen',
    'seventeen', 'eighteen', 'nineteen',
  ];
  const tens = [
    '', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety',
  ];

  function convert(n: number): string {
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
    if (n < 1000)
      return ones[Math.floor(n / 100)] + ' hundred' + (n % 100 ? ' and ' + convert(n % 100) : '');
    if (n < 100000)
      return convert(Math.floor(n / 1000)) + ' thousand' + (n % 1000 ? ' ' + convert(n % 1000) : '');
    if (n < 10000000)
      return convert(Math.floor(n / 100000)) + ' lakh' + (n % 100000 ? ' ' + convert(n % 100000) : '');
    return convert(Math.floor(n / 10000000)) + ' crore' + (n % 10000000 ? ' ' + convert(n % 10000000) : '');
  }

  const words = convert(Math.round(num));
  return words.charAt(0).toUpperCase() + words.slice(1) + ' rupees';
}

function formatModuleName(module: string): string {
  return module.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function InvoicePDF({ data }: { data: InvoiceData }) {
  const orderDate = new Date(data.orderDate).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  });

  const sessionsTotal = data.lineItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* Header */}
        <View style={s.headerRow}>
          <Image src={LOGO_APP_BASE64} style={s.logo} />
          <View style={s.companyBlock}>
            <Text style={s.companyName}>Reach Education Pvt. Ltd.</Text>
            <Text style={s.companyLine}>7th Floor, B Wing, Mittal Tower, Nariman Point</Text>
            <Text style={s.companyLine}>Mumbai, Maharashtra 400021, India</Text>
            <Text style={s.companyLine}>PAN: AAFCR7995F | GST: 27AAFCR7995F1ZS</Text>
          </View>
        </View>

        {/* Title */}
        <View style={s.titleBar}>
          <Text style={s.title}>Tax Invoice</Text>
        </View>

        {/* Info Grid */}
        <View style={s.infoTable}>
          <View style={s.infoRow}>
            <Text style={s.infoCellLabel}>Order ID:</Text>
            <Text style={s.infoCellValue}>{data.orderId}</Text>
            <Text style={s.infoCellLabel}>Order Date:</Text>
            <Text style={s.infoCellValueLast}>{orderDate}</Text>
          </View>
          <View style={s.infoRow}>
            <Text style={s.infoCellLabel}>Billing Name:</Text>
            <Text style={s.infoCellValue}>{data.billingName}</Text>
            <Text style={s.infoCellLabel}>GST Number:</Text>
            <Text style={s.infoCellValueLast}>-</Text>
          </View>
          <View style={s.infoRow}>
            <Text style={s.infoCellLabel}>First Name:</Text>
            <Text style={s.infoCellValue}>{data.firstName}</Text>
            <Text style={s.infoCellLabel}>Email:</Text>
            <Text style={s.infoCellValueLast}>{data.email}</Text>
          </View>
          <View style={s.infoRow}>
            <Text style={s.infoCellLabel}>Last Name:</Text>
            <Text style={s.infoCellValue}>{data.lastName}</Text>
            <Text style={s.infoCellLabel}>Txn ID:</Text>
            <Text style={s.infoCellValueLast}>{data.transactionId || '-'}</Text>
          </View>
          <View style={s.infoRowLast}>
            <Text style={s.infoCellLabel}>Payment Mode:</Text>
            <Text style={s.infoCellValue}>{data.paymentMode || '-'}</Text>
            <Text style={s.infoCellLabel}>Status:</Text>
            <Text style={s.infoCellValueLast}>{data.status ? data.status.charAt(0).toUpperCase() + data.status.slice(1) : '-'}</Text>
          </View>
        </View>

        {/* Line Items Table */}
        <View style={s.tableHeader}>
          <Text style={[s.tableHeaderCell, { width: '8%' }]}>S.No</Text>
          <Text style={[s.tableHeaderCell, { width: '42%' }]}>Services</Text>
          <Text style={[s.tableHeaderCell, { width: '18%', textAlign: 'right' }]}>Price</Text>
          <Text style={[s.tableHeaderCell, { width: '14%', textAlign: 'center' }]}>Quantity</Text>
          <Text style={[s.tableHeaderCell, { width: '18%', textAlign: 'right' }]}>Total</Text>
        </View>
        {data.lineItems.map((item, i) => (
          <View key={i} style={i % 2 === 1 ? s.tableRowAlt : s.tableRow}>
            <Text style={[s.tableCell, { width: '8%' }]}>{i + 1}</Text>
            <Text style={[s.tableCell, { width: '42%' }]}>{formatModuleName(item.module)}</Text>
            <Text style={[s.tableCell, { width: '18%', textAlign: 'right' }]}>
              {formatINR(item.price)}
            </Text>
            <Text style={[s.tableCell, { width: '14%', textAlign: 'center' }]}>
              {item.quantity}
            </Text>
            <Text style={[s.tableCell, { width: '18%', textAlign: 'right' }]}>
              {formatINR(item.price * item.quantity)}
            </Text>
          </View>
        ))}
        {/* Sessions Grand Total row */}
        <View style={s.tableTotalRow}>
          <Text style={[s.tableCell, { width: '8%' }]} />
          <Text style={[s.tableCell, { width: '42%', fontFamily: 'Helvetica-Bold' }]}>
            Sessions Grand Total
          </Text>
          <Text style={[s.tableCell, { width: '18%' }]} />
          <Text style={[s.tableCell, { width: '14%', textAlign: 'center', fontFamily: 'Helvetica-Bold' }]}>
            {sessionsTotal}
          </Text>
          <Text style={[s.tableCell, { width: '18%' }]} />
        </View>

        {/* Summary */}
        <View style={s.summaryContainer}>
          <View style={s.summaryRow}>
            <Text style={s.summaryLabel}>Sub-Total</Text>
            <Text style={s.summaryValue}>{formatINR(data.subtotal)}</Text>
          </View>
          <View style={s.summaryRow}>
            <Text style={s.summaryLabel}>
              Discount{data.discountCode ? ` (${data.discountCode})` : ''}
            </Text>
            <Text style={s.summaryValue}>{formatINR(data.discount)}</Text>
          </View>
          <View style={s.summaryRow}>
            <Text style={s.summaryLabel}>Addon ()</Text>
            <Text style={s.summaryValue}>{formatINR(0)}</Text>
          </View>
          <View style={s.summaryRow}>
            <Text style={s.summaryLabel}>+ IGST Rate ({data.taxRate}.00%)</Text>
            <Text style={s.summaryValue}>{formatINR(data.tax)}</Text>
          </View>
          <View style={s.grandTotalRow}>
            <Text style={s.grandTotalLabel}>Grand Total</Text>
            <Text style={s.grandTotalValue}>{formatINR(data.total)}</Text>
          </View>
          <Text style={s.totalWords}>{numberToWords(data.total)}</Text>
        </View>

        {/* Payment Terms */}
        <View style={s.termsBox}>
          <View style={s.termsHeader}>
            <Text style={s.termsHeaderText}>Payment Terms</Text>
          </View>
          <View style={s.termsBody}>
            <View style={s.termsCol}>
              <Text style={s.termsColBold}>Cash Or Cheque:</Text>
              <Text>Cash payment limit - Rs.25,000/-</Text>
              <Text>Reach Education Pvt. Ltd.</Text>
              <Text>Mittal Tower, B Wing, 7th floor, No. 71</Text>
              <Text>Nariman Point, Mumbai 400 021, India</Text>
              <Text>Pan card number - AAFCR7995F</Text>
              <Text>GST number - 27AAFCR7995F1ZS</Text>
              <Text>Service accounting code (SAC) - 999293</Text>
              <Text>Description of Service: Commercial Training</Text>
              <Text>and Coaching Services</Text>
            </View>
            <View style={s.termsDivider} />
            <View style={s.termsCol}>
              <Text style={s.termsColBold}>Bank Transfer:</Text>
              <Text>Beneficiary Name: Reach Education Pvt. Ltd</Text>
              <Text>Bank: HDFC</Text>
              <Text>City: Mumbai, India</Text>
              <Text>Account Type: Current</Text>
              <Text>Branch: Nariman Point</Text>
              <Text>Account #: 00012320009388</Text>
              <Text>Destination Bank: HDFC</Text>
              <Text>IFSC Code (Transfers from within India):</Text>
              <Text>HDFC0000001</Text>
              <Text>SWIFT Code (Transfers from outside India):</Text>
              <Text>HDFCINBB</Text>
            </View>
          </View>
        </View>

        {/* Disclaimer */}
        <View style={s.disclaimer}>
          <Text style={{ marginTop: 3 }}>
            We do not offer any refund/exchange of services. Application Services can be deferred
            for up to 1 year by paying an admin/deferral fee. All stand-alone services are valid
            for 3 months from the date of the purchase. All comprehensive packages are valid till
            31st March of the financial year they are purchased in. Note: Banks require 24 hours
            to add a new user as a beneficiary.
          </Text>
        </View>

        {/* Footer */}
        <Text style={s.footer}>
          ReachIvy™ - Registered Subsidiary of Reach Education. All Rights Reserved.
        </Text>
      </Page>
    </Document>
  );
}
