// admin-site/src/services/webhookService.js
const ZAPIER_WEBHOOK_URL = 'https://hooks.zapier.com/hooks/catch/26725705/ux4gb6x/';

export const webhookService = {
  /**
   * Send listing data to Zapier webhook
   * @param {Object} listingData - The submitted listing data
   * @param {Object} sellerData - Seller information
   * @returns {Promise}
   */
  sendListingNotification: async (listingData, sellerData) => {
    try {
      // Prepare the data for Zapier
      const payload = {
        // Seller information
        seller_name: sellerData.sellerName,
        seller_email: sellerData.sellerEmail,
        seller_phone: sellerData.sellerPhone,
        user_type: sellerData.userType,
        location: sellerData.location,
        
        // Product information
        product_title: listingData.title,
        product_description: listingData.description,
        product_category: listingData.category,
        product_brand: listingData.brand,
        product_condition: listingData.condition,
        product_price: listingData.price,
        product_discount: listingData.discount,
        product_edition: listingData.edition,
        
        // Delivery & payment
        delivery_type: listingData.deliveryType,
        payment_method: listingData.paymentMethod,
        
        // Metadata
        tags: listingData.tags,
        image_count: listingData.imageUrls?.length || 0,
        confidence_score: listingData.confidence,
        
        // Timestamp
        submitted_at: new Date().toISOString(),
        
        // Customize your email subject and content
        email_subject: `🎉 Your UniMart listing "${listingData.title}" has been submitted!`,
        email_preview: `Thank you for listing with UniMart! Your item is now live.`
      };

      console.log('📤 Sending webhook notification to Zapier...');
      
      const response = await fetch(ZAPIER_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      
      if (data.status === 'success') {
        console.log('✅ Webhook sent successfully:', data);
        return { success: true, data };
      } else {
        console.warn('⚠️ Webhook responded but may not be configured correctly:', data);
        return { success: true, warning: true, data };
      }
      
    } catch (error) {
      console.error('❌ Webhook error:', error);
      // Don't throw - we don't want to break the listing submission if webhook fails
      return { success: false, error: error.message };
    }
  },

  /**
   * Test the webhook connection
   */
  testWebhook: async () => {
    try {
      const testPayload = {
        test: true,
        message: 'Test webhook connection',
        timestamp: new Date().toISOString(),
        email_subject: '🧪 UniMart Webhook Test',
        email_preview: 'This is a test to verify webhook connection.'
      };

      const response = await fetch(ZAPIER_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testPayload),
      });

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
};