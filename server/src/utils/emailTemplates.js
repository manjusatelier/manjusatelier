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
      <h2 style="color: #4a3b32; margin-top: 0;">Woohoo! Payment Successful! 💸</h2>
      <p style="color: #666666; line-height: 1.6;">Great news! Your payment for order <strong>#${order.customOrderId}</strong> has been successfully verified.</p>
      <p style="color: #666666; line-height: 1.6;">We are now preparing your items for shipment. We will notify you as soon as they are dispatched.</p>
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
        <li>Phone: +91 93100 92966</li>
      </ul>
      <p style="color: #666666; line-height: 1.6; margin-top: 20px;">We look forward to fulfilling your request!</p>
    </div>
  </div>
`;
