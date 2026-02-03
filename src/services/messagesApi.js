import axios from '../axios';

/**
 * Messages API Service (MessageController)
 * Base URL: /api/messages
 * Handles SMS: single send, bulk send (list or contacts), resend, list, delete, balance.
 */

/**
 * Send Single Message
 * POST /api/messages/send
 * @param {Object} messageData - { messageID (optional), message, phoneNo, fullname (optional) }
 * @returns {Promise<{ messageID, message, phoneNo, fullname, sentOn, status, contact }>}
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
 * Request body aligns with MessageController: { message, contacts } where each contact has:
 *   contactID? (optional), contactName, phoneNo, designation, email, schoolCode
 * Message may contain newlines (e.g. "TEST\n\nTEST"). All contact fields required except contactID.
 * @param {Object} bulkData - { message: string, contacts: Array<{ contactID?, contactName, phoneNo, designation?, email?, schoolCode }> }
 * @returns {Promise<Array<{ messageID, message, phoneNo, fullname, sentOn, status, contact }>>}
 */
export const sendBulkMessages = async (bulkData) => {
  if (!Array.isArray(bulkData.contacts)) {
    throw new Error('contacts must be an array');
  }
  if (bulkData.contacts.length === 0) {
    throw new Error('At least one contact is required');
  }

  // Preserve message as-is (including newlines); only trim leading/trailing whitespace
  const message = typeof bulkData.message === 'string' ? bulkData.message.trim() : String(bulkData.message || '').trim();

  // Build request body exactly as MessageController POST /api/messages/sendbulk expects
  const payload = {
    message,
    contacts: bulkData.contacts.map(contact => {
      const contactObj = {
        contactName: String(contact.contactName || '').trim(),
        phoneNo: String(contact.phoneNo || '').trim(),
        designation: String(contact.designation || '').trim(),
        email: String(contact.email || '').trim(),
        schoolCode: String(contact.schoolCode || '').trim(),
      };
      if (contact.contactID !== undefined && contact.contactID !== null) {
        contactObj.contactID = contact.contactID;
      }
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

/**
 * List All Messages
 * POST /api/messages/list
 * @returns {Promise<Array<{ messageID, message, phoneNo, fullname, sentOn, status, contact }>>}
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

