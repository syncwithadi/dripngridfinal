import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

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
