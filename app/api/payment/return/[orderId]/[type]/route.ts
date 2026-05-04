import { NextRequest, NextResponse } from 'next/server';

/**
 * HDFC Payment Return Handler
 *
 * After the user completes payment on HDFC's hosted page, HDFC redirects
 * the browser here.  The order_id and payment type are embedded in the URL
 * path (not query params — HDFC strips those).
 *
 * Flow:
 *   HDFC  →  GET /api/payment/return/{orderId}/{type}
 *         →  call Django verify endpoint (server-to-server)
 *         →  302 redirect to /payment/status?payment_id=X&status=Y&type=Z
 */

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

// Ensure the base URL always ends with /api for backend calls
function getApiBase(): string {
  const base = API_BASE_URL.replace(/\/+$/, '');
  return base.endsWith('/api') ? base : `${base}/api`;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string; type: string }> },
) {
  return handleReturn(request, params);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string; type: string }> },
) {
  return handleReturn(request, params);
}

async function handleReturn(
  request: NextRequest,
  params: Promise<{ orderId: string; type: string }>,
) {
  const { orderId, type: paymentType } = await params;
  const baseUrl = request.nextUrl.origin;

  // Default: redirect to status page in pending state
  let paymentId = '';
  let status = 'pending';
  let amount = '';
  let currency = '';
  // orderId is the HDFC order reference: "{paymentId}_{randomHex}"
  const orderIdForStatus = orderId;

  try {
    // Call Django's unauthenticated return-verify endpoint
    const verifyUrl = `${getApiBase()}/accounts/payment/return-verify/${orderId}/${paymentType}/`;
    const res = await fetch(verifyUrl, { cache: 'no-store' });

    if (res.ok) {
      const data = await res.json();
      paymentId = data.payment_id ? String(data.payment_id) : '';
      status = data.status || 'pending';
      amount = data.amount != null ? String(data.amount) : '';
      currency = data.currency || '';
    } else {
      // If verify failed, try to extract payment_id from orderId format: "{id}_{hex}"
      const parts = orderId.split('_');
      if (parts[0] && /^\d+$/.test(parts[0])) {
        paymentId = parts[0];
      }
    }
  } catch (err) {
    console.error('[PaymentReturn] Error calling verify endpoint:', err);
    // Best-effort: extract payment_id from orderId
    const parts = orderId.split('_');
    if (parts[0] && /^\d+$/.test(parts[0])) {
      paymentId = parts[0];
    }
  }

  // Redirect to the frontend status page with all context in query params.
  // This is OUR redirect (not HDFC's), so query params are preserved.
  const redirectUrl = new URL('/payment/status', baseUrl);
  if (paymentId) redirectUrl.searchParams.set('payment_id', paymentId);
  redirectUrl.searchParams.set('status', status);
  redirectUrl.searchParams.set('type', paymentType);
  if (amount) redirectUrl.searchParams.set('amount', amount);
  if (currency) redirectUrl.searchParams.set('currency', currency);
  // Pass order_id so the guest status page can verify without auth
  if (orderIdForStatus) redirectUrl.searchParams.set('order_id', orderIdForStatus);

  return NextResponse.redirect(redirectUrl);
}
