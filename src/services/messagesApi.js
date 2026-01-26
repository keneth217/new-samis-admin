import axios from '../axios';

/**
 * Messages API Service
 * All endpoints for message management
 */

/**
 * Send Single Message
 * POST /api/messages/send
 * @param {Object} messageData - { messageID (optional), message, phoneNo, fullname (optional) }
 * @returns {Promise} Response with message details
 */
export const sendSingleMessage = async (messageData) => {
  const payload = {
    message: messageData.message,
    phoneNo: messageData.phoneNo,
    ...(messageData.messageID && { messageID: messageData.messageID }),
    ...(messageData.fullname && { fullname: messageData.fullname }),
  };
  return await axios.post('/messages/send', payload);
};

/**
 * Send Bulk Messages (List)
 * POST /api/messages/sendmany
 * @param {Array} messagesList - Array of { messageID (optional), message, phoneNo, fullname (optional) }
 * @returns {Promise} Response with array of message details
 */
export const sendManyMessages = async (messagesList) => {
  if (!Array.isArray(messagesList)) {
    throw new Error('messagesList must be an array');
  }
  const payload = messagesList.map(msg => ({
    message: msg.message,
    phoneNo: msg.phoneNo,
    ...(msg.messageID && { messageID: msg.messageID }),
    ...(msg.fullname && { fullname: msg.fullname }),
  }));
  return await axios.post('/messages/sendmany', payload);
};

/**
 * Send Bulk Messages (Contacts)
 * POST /api/messages/sendbulk
 * If only one contact, uses /messages/send endpoint for better reliability
 * @param {Object} bulkData - { message, contacts: [{ contactID (optional), contactName, phoneNo, designation, email, schoolCode }] }
 * @returns {Promise} Response with array of message details
 */
export const sendBulkMessages = async (bulkData) => {
  // Ensure contacts is an array
  if (!Array.isArray(bulkData.contacts)) {
    throw new Error('contacts must be an array');
  }

  if (bulkData.contacts.length === 0) {
    throw new Error('At least one contact is required');
  }

  // Always use the bulk endpoint to ensure schoolCode is included
  // The backend requires schoolCode for proper message processing
  // Build payload for bulk messages (works for 1+ contacts)
  // API expects: { message, contacts: [{ contactID?, contactName, phoneNo, designation, email, schoolCode }] }
  const payload = {
    message: String(bulkData.message || '').trim(),
    contacts: bulkData.contacts.map(contact => {
      // Build contact object matching API specification exactly
      // Field order matches API documentation: contactID?, contactName, phoneNo, designation, email, schoolCode
      const contactObj = {};
      
      // Add contactID first if provided (optional field)
      if (contact.contactID !== undefined && contact.contactID !== null) {
        contactObj.contactID = contact.contactID;
      }
      
      // Required fields in API documentation order
      contactObj.contactName = String(contact.contactName || '').trim();
      contactObj.phoneNo = String(contact.phoneNo || '').trim();
      contactObj.designation = String(contact.designation || '').trim();
      contactObj.email = String(contact.email || '').trim();
      contactObj.schoolCode = String(contact.schoolCode || '').trim();

      return contactObj;
    }),
  };

  // Validate payload before sending
  if (!payload.message || payload.message.length === 0) {
    throw new Error('Message cannot be empty');
  }

  // Validate each contact has required fields per API specification
  // Required: contactName, phoneNo, schoolCode
  // designation and email are included but can be empty strings
  payload.contacts.forEach((contact, index) => {
    if (!contact.contactName || contact.contactName.length === 0) {
      throw new Error(`Contact ${index + 1} is missing contactName`);
    }
    if (!contact.phoneNo || contact.phoneNo.length === 0) {
      throw new Error(`Contact ${index + 1} is missing phoneNo`);
    }
    if (!contact.schoolCode || contact.schoolCode.length === 0) {
      throw new Error(`Contact ${index + 1} is missing schoolCode`);
    }
    // designation and email are always included (may be empty strings)
  });

  console.log(`📤 Sending bulk message payload (${payload.contacts.length} contact${payload.contacts.length === 1 ? '' : 's'}):`, JSON.stringify(payload, null, 2));
  
  // Log request details for debugging
  console.log('📋 Request details:');
  console.log('  - Endpoint: /messages/sendbulk');
  console.log('  - Method: POST');
  console.log('  - Payload size:', JSON.stringify(payload).length, 'bytes');
  console.log('  - Contacts:', payload.contacts.map(c => ({
    contactName: c.contactName,
    phoneNo: c.phoneNo,
    schoolCode: c.schoolCode,
    hasDesignation: !!c.designation,
    hasEmail: !!c.email
  })));

  try {
    const response = await axios.post('/messages/sendbulk', payload);
    console.log('✅ Bulk message sent successfully:', response.status);
    return response;
  } catch (error) {
    // Enhanced error logging
    console.error('❌ Error sending bulk messages:');
    console.error('  - Error type:', error.constructor.name);
    console.error('  - Error message:', error.message);
    
    if (error.response) {
      console.error('  - Response status:', error.response.status);
      console.error('  - Response status text:', error.response.statusText);
      console.error('  - Response headers:', error.response.headers);
      console.error('  - Response data:', error.response.data);
      
      // Try to extract more detailed error information
      const errorData = error.response.data;
      if (errorData) {
        // Check for nested error messages
        if (typeof errorData === 'object') {
          const possibleErrorFields = ['message', 'error', 'exception', 'trace', 'details', 'cause', 'path', 'timestamp'];
          possibleErrorFields.forEach(field => {
            if (errorData[field]) {
              console.error(`  - ${field}:`, errorData[field]);
            }
          });
        }
      }
    } else if (error.request) {
      console.error('  - Request was made but no response received');
      console.error('  - Request:', error.request);
    } else {
      console.error('  - Error setting up request:', error.message);
    }
    
    // Re-throw the error so the calling code can handle it
    throw error;
  }
};

/**
 * Resend Message
 * POST /api/messages/resend/{messageID}
 * @param {number|string} messageID - The ID of the message to resend (can be Long or UUID)
 * @returns {Promise} Response with message details
 */
export const resendMessage = async (messageID) => {
  if (!messageID) {
    throw new Error('messageID is required');
  }
  
  // Ensure messageID is properly encoded in the URL
  const encodedMessageID = encodeURIComponent(String(messageID));
  
  console.log('📤 Resending message with ID:', messageID);
  console.log('📤 Encoded messageID:', encodedMessageID);
  
  try {
    const response = await axios.post(`/messages/resend/${encodedMessageID}`);
    console.log('✅ Resend response:', response);
    return response;
  } catch (error) {
    console.error('❌ Resend error:', error);
    console.error('❌ Error response:', error.response);
    console.error('❌ Error data:', error.response?.data);
    throw error;
  }
};

/**-
 * List All Messages
 * POST /api/messages/list
 * @returns {Promise} Response with array of all messages
 */
export const listMessages = async () => {
  return await axios.post('/messages/list');
};

/**
 * List Messages by Phone Number
 * POST /api/messages/listbyphone/{phoneNo}
 * @param {string} phoneNo - The phone number to filter messages by
 * @returns {Promise} Response with array of messages for that phone number
 */
export const listMessagesByPhone = async (phoneNo) => {
  if (!phoneNo) {
    throw new Error('phoneNo is required');
  }
  return await axios.post(`/messages/listbyphone/${phoneNo}`);
};

/**
 * Delete Message
 * POST /api/messages/delete/{messageid}
 * @param {number|string} messageid - The ID of the message to delete
 * @returns {Promise} Response with deleted message details
 */
export const deleteMessage = async (messageid) => {
  if (!messageid) {
    throw new Error('messageid is required');
  }
  return await axios.post(`/messages/delete/${messageid}`);
};

/**
 * Get Account Balance
 * POST /api/messages/balance
 * @returns {Promise} Response with account balance (number)
 */
export const getAccountBalance = async () => {
  return await axios.post('/messages/balance');
};

// Export all methods as default object
export default {
  sendSingleMessage,
  sendManyMessages,
  sendBulkMessages,
  resendMessage,
  listMessages,
  listMessagesByPhone,
  deleteMessage,
  getAccountBalance,
};

