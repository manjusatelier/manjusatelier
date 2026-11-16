export const getPromotionalTemplate = (title, content, couponCode, discountPercentage) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 10px; overflow: hidden;">
      <div style="background-color: #f8f5f0; padding: 20px; text-align: center;">
        <h1 style="color: #4a3b32; margin: 0; font-size: 24px;">Manju's Atelier</h1>
      </div>
      
      <div style="padding: 30px; background-color: #ffffff;">
        <h2 style="color: #4a3b32; margin-top: 0;">${title}</h2>
        <p style="color: #666666; line-height: 1.6;">${content}</p>
        
        ${couponCode ? `
        <div style="margin: 30px 0; padding: 20px; background-color: #fcf9f2; border: 2px dashed #c19b6c; text-align: center; border-radius: 8px;">
          <p style="margin: 0; color: #4a3b32; font-weight: bold; text-transform: uppercase;">Use Code at Checkout</p>
          <p style="margin: 10px 0 0; font-size: 28px; font-weight: 800; color: #c19b6c; letter-spacing: 2px;">${couponCode}</p>
          ${discountPercentage ? `<p style="margin: 10px 0 0; color: #666666; font-size: 14px;">For ${discountPercentage}% OFF</p>` : ''}
        </div>
        ` : ''}
        
        <div style="text-align: center; margin-top: 30px;">
          <a href="${process.env.CLIENT_URL || 'https://manjusatelier.in'}" style="display: inline-block; background-color: #c19b6c; color: #ffffff; text-decoration: none; padding: 12px 30px; border-radius: 50px; font-weight: bold; font-size: 16px;">Shop Now</a>
        </div>
      </div>
      
      <div style="background-color: #f8f5f0; padding: 20px; text-align: center; border-top: 1px solid #e0e0e0;">
        <p style="color: #999999; font-size: 12px; margin: 0;">
          You are receiving this email because you opted in to promotional emails from Manju's Atelier.
        </p>
        <p style="color: #999999; font-size: 12px; margin: 10px 0 0;">
          <a href="${process.env.CLIENT_URL || 'https://manjusatelier.in'}/account?tab=settings" style="color: #c19b6c; text-decoration: underline;">Unsubscribe or update preferences</a>
        </p>
      </div>
    </div>
  `;
};

export const getOrderReceivedTemplate = (order) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 10px; overflow: hidden;">
    <div style="background-color: #f8f5f0; padding: 20px; text-align: center;">
      <h1 style="color: #4a3b32; margin: 0; font-size: 24px;">Manju's Atelier</h1>
    </div>
    <div style="padding: 30px; background-color: #ffffff;">
      <h2 style="color: #4a3b32; margin-top: 0;">Yay! We got your order! 🎉</h2>
      <p style="color: #666666; line-height: 1.6;">Thank you for your order (<strong>#${order.customOrderId}</strong>). We have received your order details.</p>
      <p style="color: #666666; line-height: 1.6;">If you haven't already, please complete your UPI payment and submit the UTR number on your account page so we can process your order.</p>
      <div style="text-align: center; margin-top: 30px;">
        <a href="${process.env.CLIENT_URL || 'https://manjusatelier.in'}/account?tab=orders" style="display: inline-block; background-color: #c19b6c; color: #ffffff; text-decoration: none; padding: 12px 30px; border-radius: 50px; font-weight: bold; font-size: 16px;">View Order</a>
      </div>
    </div>
  </div>
`;

export const getPaymentVerifiedTemplate = (order) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 10px; overflow: hidden;">
    <div style="background-color: #f8f5f0; padding: 20px; text-align: center;">
      <h1 style="color: #4a3b32; margin: 0; font-size: 24px;">Manju's Atelier</h1>
    </div>
    <div style="padding: 30px; background-color: #ffffff;">
      <h2 style="color: #4a3b32; margin-top: 0;">Order Confirmed! 🎉</h2>
      <p style="color: #666666; line-height: 1.6;">Thank you for your purchase! Your payment for order <strong>#${order.customOrderId}</strong> has been successfully received and your order is confirmed.</p>
      <p style="color: #666666; line-height: 1.6;">Our artisans are now lovingly preparing your items. We will notify you as soon as your package has shipped.</p>
      
      <div style="margin: 25px 0; padding: 15px; background-color: #fcf9f2; border-left: 4px solid #c19b6c; border-radius: 4px;">
        <p style="margin: 0; color: #4a3b32; font-size: 14px; line-height: 1.5;">
          <strong>✨ Customisable Products:</strong> For customisable products in your order, our team will contact you directly to confirm all customisation details and specifications before crafting begins.
        </p>
      </div>

      <div style="text-align: center; margin-top: 30px;">
        <a href="${process.env.CLIENT_URL || 'https://manjusatelier.in'}/account?tab=orders" style="display: inline-block; background-color: #c19b6c; color: #ffffff; text-decoration: none; padding: 12px 30px; border-radius: 50px; font-weight: bold; font-size: 16px;">View Order Status</a>
      </div>
    </div>
  </div>
`;

export const getOrderShippedTemplate = (order) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 10px; overflow: hidden;">
    <div style="background-color: #f8f5f0; padding: 20px; text-align: center;">
      <h1 style="color: #4a3b32; margin: 0; font-size: 24px;">Manju's Atelier</h1>
    </div>
    <div style="padding: 30px; background-color: #ffffff;">
      <h2 style="color: #4a3b32; margin-top: 0;">Wow! Your Order Has Shipped!! 🚚✨</h2>
      <p style="color: #666666; line-height: 1.6;">Great news! Your order <strong>#${order.customOrderId}</strong> has been dispatched and is making its way to you right now.</p>
      <p style="color: #666666; line-height: 1.6;">We can't wait for you to receive it! You can track the status of your delivery directly on your account dashboard.</p>
      <div style="text-align: center; margin-top: 30px;">
        <a href="${process.env.CLIENT_URL || 'https://manjusatelier.in'}/order/${order.customOrderId}" style="display: inline-block; background-color: #c19b6c; color: #ffffff; text-decoration: none; padding: 12px 30px; border-radius: 50px; font-weight: bold; font-size: 16px;">Track Order</a>
      </div>
    </div>
  </div>
`;

export const getOrderDeliveredTemplate = (order) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 10px; overflow: hidden;">
    <div style="background-color: #f8f5f0; padding: 20px; text-align: center;">
      <h1 style="color: #4a3b32; margin: 0; font-size: 24px;">Manju's Atelier</h1>
    </div>
    <div style="padding: 30px; background-color: #ffffff;">
      <h2 style="color: #4a3b32; margin-top: 0;">It's Here! Your package has arrived! 🎁</h2>
      <p style="color: #666666; line-height: 1.6;">Hooray! Your order <strong>#${order.customOrderId}</strong> has been successfully delivered.</p>
      <p style="color: #666666; line-height: 1.6;">We hope you love your handmade items! If you have a moment, we'd love it if you could leave a review.</p>
      <div style="text-align: center; margin-top: 30px;">
        <a href="${process.env.CLIENT_URL || 'https://manjusatelier.in'}/account?tab=orders" style="display: inline-block; background-color: #c19b6c; color: #ffffff; text-decoration: none; padding: 12px 30px; border-radius: 50px; font-weight: bold; font-size: 16px;">View Order</a>
      </div>
    </div>
  </div>
`;

export const getOrderCancelledTemplate = (order) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 10px; overflow: hidden;">
    <div style="background-color: #f8f5f0; padding: 20px; text-align: center;">
      <h1 style="color: #4a3b32; margin: 0; font-size: 24px;">Manju's Atelier</h1>
    </div>
    <div style="padding: 30px; background-color: #ffffff;">
      <h2 style="color: #4a3b32; margin-top: 0;">Order Cancelled 😔</h2>
      <p style="color: #666666; line-height: 1.6;">We're sorry, but your order <strong>#${order.customOrderId}</strong> has been cancelled.</p>
      <p style="color: #666666; line-height: 1.6;">If this was a mistake, or if you have any questions about this cancellation, please don't hesitate to reach out to us.</p>
      <div style="text-align: center; margin-top: 30px;">
        <a href="${process.env.CLIENT_URL || 'https://manjusatelier.in'}/shop" style="display: inline-block; background-color: #c19b6c; color: #ffffff; text-decoration: none; padding: 12px 30px; border-radius: 50px; font-weight: bold; font-size: 16px;">Continue Shopping</a>
      </div>
    </div>
  </div>
`;

export const getAbandonedCartTemplate = (userName, discountCode) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 10px; overflow: hidden;">
    <div style="background-color: #f8f5f0; padding: 20px; text-align: center;">
      <h1 style="color: #4a3b32; margin: 0; font-size: 24px;">Manju's Atelier</h1>
    </div>
    <div style="padding: 30px; background-color: #ffffff;">
      <h2 style="color: #4a3b32; margin-top: 0;">Did you forget something, ${userName}?</h2>
      <p style="color: #666666; line-height: 1.6;">We noticed you left some beautiful handmade items in your cart. They are still waiting for you!</p>
      
      <div style="margin: 30px 0; padding: 20px; background-color: #fcf9f2; border: 2px dashed #c19b6c; text-align: center; border-radius: 8px;">
        <p style="margin: 0; color: #4a3b32; font-weight: bold; text-transform: uppercase;">Use this code to get 5% off!</p>
        <p style="margin: 10px 0 0; font-size: 28px; font-weight: 800; color: #c19b6c; letter-spacing: 2px;">${discountCode}</p>
      </div>
      
      <div style="text-align: center; margin-top: 30px;">
        <a href="${process.env.CLIENT_URL || 'https://manjusatelier.in'}/cart" style="display: inline-block; background-color: #c19b6c; color: #ffffff; text-decoration: none; padding: 12px 30px; border-radius: 50px; font-weight: bold; font-size: 16px;">Return to Cart</a>
      </div>
    </div>
  </div>
`;

export const getBulkOrderReplyTemplate = (name) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 10px; overflow: hidden;">
    <div style="background-color: #f8f5f0; padding: 20px; text-align: center;">
      <h1 style="color: #4a3b32; margin: 0; font-size: 24px;">Manju's Atelier</h1>
    </div>
    <div style="padding: 30px; background-color: #ffffff;">
      <h2 style="color: #4a3b32; margin-top: 0;">Thank you for your bulk order inquiry, ${name}!</h2>
      <p style="color: #666666; line-height: 1.6;">We have received your bulk order request and are excited to work with you.</p>
      <p style="color: #666666; line-height: 1.6;">Our team will review your details and get back to you shortly.</p>
      <p style="color: #666666; line-height: 1.6;">For immediate assistance, please feel free to reach out to us:</p>
      <ul style="color: #666666; line-height: 1.6;">
        <li>Email: queries@manjusatelier.in</li>
        <li>WhatsApp: +91 93100 92966</li>
      </ul>
      <p style="color: #666666; line-height: 1.6; margin-top: 20px;">We look forward to fulfilling your request!</p>
    </div>
  </div>
`;

export const getAdminNewOrderAlertTemplate = (order) => {
  const customerName = order.shippingAddress?.fullName || order.user?.name || 'Customer';
  const phone = order.shippingAddress?.phone || '';
  const cleanPhone = phone.replace(/\D/g, '');
  const waNumber = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
  const waText = encodeURIComponent(`Hi ${customerName}, this is Manju's Atelier regarding your order #${order.customOrderId}.`);
  const clientUrl = process.env.CLIENT_URL || 'https://manjusatelier.in';

  const itemsHtml = (order.items || [])
    .map(
      (item) => `
      <tr style="border-bottom: 1px solid #eeeeee;">
        <td style="padding: 10px 0; color: #333333; font-size: 14px;">${item.name || 'Handmade Item'}</td>
        <td style="padding: 10px 0; text-align: center; color: #666666; font-size: 14px;">×${item.quantity || 1}</td>
        <td style="padding: 10px 0; text-align: right; color: #333333; font-weight: bold; font-size: 14px;">₹${(item.price || 0) * (item.quantity || 1)}</td>
      </tr>
    `
    )
    .join('');

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 10px; overflow: hidden;">
      <div style="background-color: #4a3b32; padding: 22px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 20px; letter-spacing: 1px;">🛍️ New Order Confirmed!</h1>
        <p style="color: #d8c2aa; margin: 6px 0 0; font-size: 14px;">Order #${order.customOrderId}</p>
      </div>
      <div style="padding: 26px; background-color: #ffffff;">
        <div style="background-color: #fcf9f4; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
          <p style="margin: 0; font-size: 15px; color: #4a3b32;"><strong>Customer:</strong> ${customerName}</p>
          <p style="margin: 6px 0 0; font-size: 14px; color: #666666;"><strong>Phone:</strong> ${phone || 'Not provided'}</p>
          <p style="margin: 6px 0 0; font-size: 14px; color: #666666;"><strong>Delivery To:</strong> ${[order.shippingAddress?.addressLine1, order.shippingAddress?.city, order.shippingAddress?.state, order.shippingAddress?.pincode].filter(Boolean).join(', ')}</p>
          <p style="margin: 6px 0 0; font-size: 14px; color: #666666;"><strong>Payment:</strong> ${order.paymentMethod || 'Online'} (${order.paymentStatus || 'SUCCESSFUL'})</p>
        </div>

        <h3 style="color: #4a3b32; font-size: 15px; margin: 0 0 10px; border-bottom: 2px solid #f0eae1; padding-bottom: 6px;">Order Summary</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          ${itemsHtml}
          <tr>
            <td colspan="2" style="padding: 12px 0; text-align: right; color: #4a3b32; font-weight: bold; font-size: 16px;">Total Received:</td>
            <td style="padding: 12px 0; text-align: right; color: #4a3b32; font-weight: bold; font-size: 18px;">₹${order.total || 0}</td>
          </tr>
        </table>

        <div style="text-align: center; margin-top: 24px;">
          <a href="${clientUrl}/admin/orders" style="display: inline-block; background-color: #4a3b32; color: #ffffff; text-decoration: none; padding: 11px 24px; border-radius: 50px; font-weight: bold; font-size: 14px; margin-right: 8px;">View in Admin Portal</a>
          ${waNumber ? `<a href="https://wa.me/${waNumber}?text=${waText}" style="display: inline-block; background-color: #25D366; color: #ffffff; text-decoration: none; padding: 11px 24px; border-radius: 50px; font-weight: bold; font-size: 14px;">Chat on WhatsApp</a>` : ''}
        </div>
      </div>
    </div>
  `;
};

export const getAdminAgingOrdersAlertTemplate = (orders) => {
  const clientUrl = process.env.CLIENT_URL || 'https://manjusatelier.in';
  const rows = (orders || [])
    .map((o) => {
      const elapsedHours = Math.round((Date.now() - new Date(o.createdAt).getTime()) / (1000 * 60 * 60));
      const customer = o.shippingAddress?.fullName || o.user?.name || 'Customer';
      return `
        <tr style="border-bottom: 1px solid #eeeeee;">
          <td style="padding: 10px; color: #4a3b32; font-weight: bold;">#${o.customOrderId || o._id}</td>
          <td style="padding: 10px; color: #555555;">${customer}</td>
          <td style="padding: 10px; text-align: center; color: #c0392b; font-weight: bold;">${elapsedHours} hrs</td>
          <td style="padding: 10px; text-align: right; font-weight: bold; color: #333333;">₹${o.total || 0}</td>
        </tr>
      `;
    })
    .join('');

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 10px; overflow: hidden;">
      <div style="background-color: #d97706; padding: 22px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 20px;">⚠️ Action Required: Delayed Orders Alert</h1>
        <p style="color: #fef3c7; margin: 6px 0 0; font-size: 14px;">${orders.length} order(s) confirmed > 24 hours ago pending dispatch</p>
      </div>
      <div style="padding: 26px; background-color: #ffffff;">
        <p style="color: #666666; font-size: 14px; line-height: 1.6; margin-top: 0;">
          The following order(s) have been verified and confirmed for more than 24 hours but have not yet been marked as shipped. Please review packaging and courier dispatch:
        </p>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px;">
          <thead>
            <tr style="background-color: #f8f5f0; border-bottom: 2px solid #e0e0e0;">
              <th style="padding: 10px; text-align: left; color: #4a3b32;">Order</th>
              <th style="padding: 10px; text-align: left; color: #4a3b32;">Customer</th>
              <th style="padding: 10px; text-align: center; color: #4a3b32;">Age</th>
              <th style="padding: 10px; text-align: right; color: #4a3b32;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
        <div style="text-align: center; margin-top: 24px;">
          <a href="${clientUrl}/admin/orders?status=aging" style="display: inline-block; background-color: #d97706; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 50px; font-weight: bold; font-size: 14px;">Open Delayed Orders in Admin</a>
        </div>
      </div>
    </div>
  `;
};
