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

  // If only one contact, use the single message endpoint for better reliability
  if (bulkData.contacts.length === 1) {
    const contact = bulkData.contacts[0];
    
    // Validate contact has required fields
    if (!contact.contactName || !contact.phoneNo || !contact.schoolCode) {
      throw new Error('Contact is missing required fields: contactName, phoneNo, or schoolCode');
    }

    const singlePayload = {
      message: String(bulkData.message || '').trim(),
      phoneNo: String(contact.phoneNo || '').trim(),
      fullname: String(contact.contactName || '').trim(),
      ...(contact.messageID && { messageID: contact.messageID }),
    };

    if (!singlePayload.message || singlePayload.message.length === 0) {
      throw new Error('Message cannot be empty');
    }

    console.log('📤 Sending single message (1 contact):', JSON.stringify(singlePayload, null, 2));
    
    try {
      const response = await axios.post('/messages/send', singlePayload);
      // Convert single response to array format to match bulk response
      return {
        ...response,
        data: Array.isArray(response.data) ? response.data : [response.data]
      };
    } catch (error) {
      console.error('❌ Single message send failed:', error);
      throw error;
    }
  }

  // Build payload for bulk messages (2+ contacts)
  const payload = {
    message: String(bulkData.message || '').trim(),
    contacts: bulkData.contacts.map(contact => {
      // Build contact object ensuring all required fields are present
      const contactObj = {
        contactName: String(contact.contactName || '').trim(),
        phoneNo: String(contact.phoneNo || '').trim(),
        schoolCode: String(contact.schoolCode || '').trim(),
      };

      // Add optional fields
      if (contact.designation !== undefined && contact.designation !== null) {
        contactObj.designation = String(contact.designation).trim();
      } else {
        contactObj.designation = '';
      }

      if (contact.email !== undefined && contact.email !== null) {
        contactObj.email = String(contact.email).trim();
      } else {
        contactObj.email = '';
      }

      // Add contactID only if provided
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

  // Validate each contact has required fields
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
  });

  console.log('📤 Sending bulk message payload (multiple contacts):', JSON.stringify(payload, null, 2));

  return await axios.post('/messages/sendbulk', payload);
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

