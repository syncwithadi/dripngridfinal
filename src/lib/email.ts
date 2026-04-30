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
  <title>DRIPNGRID - You're in</title>
</head>
<body style="margin:0;padding:0;background:#0b0b0b;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0b0b0b;padding:48px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#111111;border:1px solid #222222;border-radius:12px;overflow:hidden;">
        <tr><td style="padding:36px 40px 0;text-align:center;">
          <div style="font-size:13px;font-weight:700;letter-spacing:0.2em;color:#ffffff;text-transform:uppercase;">DRIPNGRID</div>
          <div style="width:32px;height:1px;background:#333;margin:18px auto 0;"></div>
        </td></tr>
        <tr><td style="padding:32px 40px 0;text-align:center;">
          <h1 style="margin:0;font-size:28px;font-weight:700;color:#ffffff;letter-spacing:-0.02em;line-height:1.2;">You're in.</h1>
          <p style="margin:14px 0 0;font-size:14px;color:#888888;line-height:1.6;">
            Hey ${name} — your access to the DRIPNGRID internal panel is ready.<br/>
            Use the credentials below to sign in for the first time.
          </p>
        </td></tr>
        <tr><td style="padding:32px 40px 0;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f0f;border:1px solid #2a2a2a;border-radius:8px;overflow:hidden;">
            <tr><td style="padding:10px 20px;background:#161616;border-bottom:1px solid #2a2a2a;">
              <span style="font-size:10px;font-weight:600;letter-spacing:0.12em;color:#555555;text-transform:uppercase;">Your Credentials</span>
            </td></tr>
            <tr><td style="padding:20px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr><td style="padding:0 0 16px;">
                  <div style="font-size:11px;font-weight:600;color:#555555;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:6px;">ID</div>
                  <div style="font-size:18px;font-weight:700;color:#ffffff;font-family:monospace;letter-spacing:0.05em;">${userId}</div>
                </td></tr>
                <tr><td style="padding-top:16px;border-top:1px solid #222;">
                  <div style="font-size:11px;font-weight:600;color:#555555;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:6px;">Password</div>
                  <div style="font-size:18px;font-weight:700;color:#ffffff;font-family:monospace;letter-spacing:0.05em;">${tempPassword}</div>
                </td></tr>
              </table>
            </td></tr>
          </table>
        </td></tr>
        <tr><td style="padding:20px 40px 0;">
          <p style="margin:0;font-size:12px;color:#555555;line-height:1.6;background:#141414;border:1px solid #1f1f1f;border-radius:6px;padding:12px 14px;">
            You will be asked to set a new password on first login. Keep these credentials confidential.
          </p>
        </td></tr>
        <tr><td style="padding:28px 40px 0;text-align:center;">
          <a href="${loginUrl}" style="display:inline-block;background:#ffffff;color:#000000;font-size:12px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;text-decoration:none;padding:14px 36px;border-radius:6px;">
            Sign In
          </a>
        </td></tr>
        <tr><td style="padding:36px 40px;text-align:center;">
          <div style="width:32px;height:1px;background:#222;margin:0 auto 24px;"></div>
          <p style="margin:0;font-size:11px;color:#444444;line-height:1.7;">
            Automated message from DRIPNGRID Internal Systems.<br/>
            Do not share or forward.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
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
