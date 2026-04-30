import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || 're_123456789');

interface OrderEmailProps {
    customerName: string;
    customerEmail: string;
    orderNumber: string;
    items: {
        productName: string;
        quantity: number;
        size: string;
        color: string;
        priceINR: number;
    }[];
    total: number;
    shippingCost: number;
    paymentMethod: string;
    shippingAddress: {
        line1: string;
        city: string;
        state: string;
        postalCode: string;
    };
}

export const sendOrderConfirmationEmail = async (order: OrderEmailProps) => {
    try {
        const { customerName, customerEmail, orderNumber, items, total, shippingCost, paymentMethod, shippingAddress } = order;

        // Generate Items HTML
        const itemsHtml = items.map(item => `
        <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px dashed #e0e0e0;">
            <div>
                <strong style="color: #000;">${item.productName}</strong> <br/>
                <span style="font-size: 12px; color: #666;">${item.color} / ${item.size} x ${item.quantity}</span>
            </div>
            <div style="text-align: right;">
                ₹${item.priceINR * item.quantity}
            </div>
        </div>
    `).join('');

        // Format Payment Method
        const paymentMethodDisplay = paymentMethod === 'cod' ? 'Cash on Delivery' : 'Prepaid (Online)';

        // HTML Template
        const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f9f9f9; padding: 20px; color: #000; }
            .container { max-width: 600px; margin: 0 auto; background: #ffffff; padding: 40px; border: 1px solid #e0e0e0; }
            .header { text-align: center; margin-bottom: 30px; }
            .logo { font-size: 24px; font-weight: bold; letter-spacing: 2px; color: #000; text-decoration: none; }
            .title { font-size: 20px; font-weight: 300; margin-bottom: 10px; color: #000; }
            .subtitle { font-size: 14px; color: #666; font-style: italic; }
            .divider { height: 1px; background: #000; margin: 20px 0; }
            .order-details { margin-bottom: 30px; }
            .order-info { font-size: 14px; color: #666; margin-bottom: 20px; }
            .total-section { margin-top: 20px; padding-top: 20px; border-top: 1px solid #000; display: flex; justify-content: space-between; font-size: 18px; font-weight: bold; }
            .summary-row { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 14px; color: #333; }
            .shipping-section { margin-top: 30px; font-size: 12px; color: #666; border-top: 1px solid #e0e0e0; padding-top: 20px; }
            .footer { text-align: center; margin-top: 40px; font-size: 12px; color: #999; }
            .btn { display: inline-block; background: #000; color: #fff; padding: 12px 25px; text-decoration: none; font-size: 12px; letter-spacing: 1px; margin-top: 20px; }
            .badge { background: #eee; padding: 4px 8px; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; border-radius: 4px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <a href="${process.env.NEXT_PUBLIC_BASE_URL}" class="logo">DRIPNGRID</a>
            </div>
            
            <div style="text-align: center;">
                <h1 class="title">Thank You For Your Order</h1>
                <p class="subtitle">We have received your order and are getting it ready.</p>
                <div class="divider"></div>
            </div>

            <div class="order-details">
                <div class="order-info">
                    <p><strong>Order Number:</strong> ${orderNumber}</p>
                    <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
                    <p style="margin-top: 10px;"><span class="badge">${paymentMethodDisplay}</span></p>
                </div>
                
                <h3>Items Ordered</h3>
                ${itemsHtml}

                <div style="margin-top: 20px; border-top: 1px solid #eee; padding-top: 20px;">
                    <div class="summary-row">
                        <span>Subtotal</span>
                        <span>₹${total - shippingCost}</span>
                    </div>
                    <div class="summary-row">
                        <span>Shipping</span>
                        <span>${shippingCost === 0 ? 'Free' : '₹' + shippingCost}</span>
                    </div>
                </div>

                <div class="total-section">
                    <span>Total Amount</span>
                    <span>₹${total}</span>
                </div>
            </div>

            <div class="shipping-section">
                <strong>Shipping To:</strong><br/>
                ${customerName}<br/>
                ${shippingAddress.line1}<br/>
                ${shippingAddress.city}, ${shippingAddress.state}, ${shippingAddress.postalCode}<br/>
            </div>

            <div style="text-align: center;">
                <a href="${process.env.NEXT_PUBLIC_BASE_URL}/track-order?order=${orderNumber}" class="btn">TRACK YOUR ORDER</a>
            </div>

            <div class="footer">
                <p>&copy; ${new Date().getFullYear()} DRIPNGRID. All rights reserved.</p>
                <p>Have questions? Reply to this email or contact support@dripngrid.com</p>
            </div>
        </div>
    </body>
    </html>
    `;

        const data = await resend.emails.send({
            from: 'DRIPNGRID <orders@dripngrid.in>', // Verified domain
            to: [customerEmail],
            subject: `Order Confirmed - ${orderNumber}`,
            html: htmlContent,
        });

        console.log('Email sent:', data);
        return { success: true, data };
    } catch (error) {
        console.error('Error sending email:', error);
        return { success: false, error };
    }
};

// ── Admin Internal Email ──────────────────────────────────────────────────────
// Used by the Communications module for internal staff emails.
// NEVER hardcode API keys — always uses process.env.RESEND_API_KEY

export type AdminEmailFrom =
  | 'noreply'
  | 'support'
  | 'admin';

const FROM_ADDRESSES: Record<AdminEmailFrom, string> = {
  noreply: `DRIPNGRID <noreply@dripngrid.in>`,
  support: `DRIPNGRID Support <support@dripngrid.in>`,
  admin:   `DRIPNGRID Admin <admin@dripngrid.in>`,
};

export interface AdminEmailPayload {
  to: string;
  subject: string;
  html: string;
  from?: AdminEmailFrom;   // defaults to 'admin'
  replyTo?: string;        // optional reply-to address
}

/**
 * Sends an internal admin email via Resend.
 * Returns { success, messageId } or { success: false, error }.
 */
export async function sendAdminEmail(payload: AdminEmailPayload): Promise<
  { success: true; messageId?: string } | { success: false; error: unknown }
> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || apiKey.startsWith('re_123')) {
    console.warn('[sendAdminEmail] RESEND_API_KEY not configured — skipping send.');
    return { success: false, error: 'RESEND_API_KEY not configured' };
  }

  const sender = new Resend(apiKey);
  const fromAddress = FROM_ADDRESSES[payload.from || 'admin'];

  try {
    const result = await sender.emails.send({
      from: fromAddress,
      to: [payload.to],
      subject: payload.subject,
      html: payload.html,
      ...(payload.replyTo ? { reply_to: payload.replyTo } : {}),
    });
    return { success: true, messageId: result.data?.id };
  } catch (error) {
    console.error('[sendAdminEmail] Failed:', error);
    return { success: false, error };
  }
}


// ── Admin Access Email ────────────────────────────────────────────────────────
// Sent on new team member creation. Delivers ID + temp password.
// Plain-text password ONLY lives in this email — stored hashed in Sanity.

export interface AdminAccessEmailProps {
  name: string;
  userId: string;
  tempPassword: string;
  email: string;
}

function buildAccessEmailHtml({
  name,
  userId,
  tempPassword,
}: Omit<AdminAccessEmailProps, "email">): string {
  const loginUrl = `${process.env.NEXT_PUBLIC_BASE_URL || "https://dripngrid.in"}/admin/login`;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <title>DRIPNGRID - You're in</title>
  <style>
    :root {
      color-scheme: light dark;
      supported-color-schemes: light dark;
    }
    body { background-color: #f6f6f6; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; margin: 0; padding: 0; }
    .wrapper { background-color: #f6f6f6; padding: 48px 16px; }
    .card { max-width: 560px; width: 100%; margin: 0 auto; background-color: #ffffff; border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden; }
    .divider { width: 32px; height: 1px; background-color: #e0e0e0; margin: 18px auto 0; }
    .text-primary { color: #111111; }
    .text-secondary { color: #666666; }
    .cred-box { background-color: #fafafa; border: 1px solid #eaeaea; border-radius: 8px; overflow: hidden; }
    .cred-header { padding: 10px 20px; background-color: #f0f0f0; border-bottom: 1px solid #eaeaea; }
    .cred-label { font-size: 10px; font-weight: 600; letter-spacing: 0.12em; color: #666666; text-transform: uppercase; }
    .cred-title { font-size: 11px; font-weight: 600; color: #666666; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 6px; }
    .cred-value { font-size: 18px; font-weight: 700; color: #111111; font-family: monospace; letter-spacing: 0.05em; }
    .cred-divider { padding-top: 16px; border-top: 1px solid #eaeaea; }
    .note-box { font-size: 12px; color: #666666; line-height: 1.6; background-color: #fcfcfc; border: 1px solid #f0f0f0; border-radius: 6px; padding: 12px 14px; margin: 0; }
    .btn { display: inline-block; background-color: #111111; color: #ffffff !important; font-size: 12px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; text-decoration: none; padding: 14px 36px; border-radius: 6px; }
    
    @media (prefers-color-scheme: dark) {
      body, .wrapper { background-color: #0b0b0b !important; }
      .card { background-color: #111111 !important; border-color: #222222 !important; }
      .divider { background-color: #333333 !important; }
      .text-primary { color: #ffffff !important; }
      .text-secondary { color: #888888 !important; }
      .cred-box { background-color: #0f0f0f !important; border-color: #2a2a2a !important; }
      .cred-header { background-color: #161616 !important; border-bottom-color: #2a2a2a !important; }
      .cred-label, .cred-title { color: #555555 !important; }
      .cred-value { color: #ffffff !important; }
      .cred-divider { border-top-color: #222222 !important; }
      .note-box { color: #555555 !important; background-color: #141414 !important; border-color: #1f1f1f !important; }
      .btn { background-color: #ffffff !important; color: #000000 !important; }
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <table width="100%" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
      <tr>
        <td align="center">
          <table class="card" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding: 36px 40px 0; text-align: center;">
                <div class="text-primary" style="font-size: 13px; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase;">DRIPNGRID</div>
                <div class="divider"></div>
              </td>
            </tr>
            <tr>
              <td style="padding: 32px 40px 0; text-align: center;">
                <h1 class="text-primary" style="margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.02em; line-height: 1.2;">You're in.</h1>
                <p class="text-secondary" style="margin: 14px 0 0; font-size: 14px; line-height: 1.6;">
                  Hey ${name} — your access to the DRIPNGRID internal panel is ready.<br/>
                  Use the credentials below to sign in for the first time.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding: 32px 40px 0;">
                <table class="cred-box" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td class="cred-header">
                      <span class="cred-label">Your Credentials</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 20px;">
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="padding: 0 0 16px;">
                            <div class="cred-title">ID</div>
                            <div class="cred-value">${userId}</div>
                          </td>
                        </tr>
                        <tr>
                          <td class="cred-divider">
                            <div class="cred-title">Password</div>
                            <div class="cred-value">${tempPassword}</div>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding: 20px 40px 0;">
                <p class="note-box">
                  You will be asked to set a new password on first login. Keep these credentials confidential.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding: 28px 40px 0; text-align: center;">
                <a href="${loginUrl}" class="btn">Sign In</a>
              </td>
            </tr>
            <tr>
              <td style="padding: 36px 40px; text-align: center;">
                <div class="divider" style="margin: 0 auto 24px;"></div>
                <p class="text-secondary" style="margin: 0; font-size: 11px; line-height: 1.7;">
                  That’s it.<br/>
                  Jump in.<br/>
                  <br/>
                  — DRIPNGRID
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>`;
}

/**
 * Sends the admin access email to a newly created team member.
 * Must be called AFTER Sanity document creation (password is hashed in DB by then).
 */
export async function sendAdminAccessEmail({
  name,
  userId,
  tempPassword,
  email,
}: AdminAccessEmailProps): Promise<{ success: boolean; messageId?: string; error?: unknown }> {
  const html = buildAccessEmailHtml({ name, userId, tempPassword });
  const result = await sendAdminEmail({
    to: email,
    subject: `DRIPNGRID — Your Access Is Ready`,
    html,
    from: "noreply",
  });
  if (result.success && "messageId" in result) {
    return { success: true, messageId: result.messageId };
  }
  return { success: false, error: (result as any).error };
}
