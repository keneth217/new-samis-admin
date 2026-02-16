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
  // Validate required fields
  if (!messageData.message || typeof messageData.message !== 'string' || messageData.message.trim().length === 0) {
    throw new Error('Message is required and cannot be empty');
  }
  if (!messageData.phoneNo || typeof messageData.phoneNo !== 'string' || messageData.phoneNo.trim().length === 0) {
    throw new Error('Phone number is required');
  }

  // Format phone number - ensure it's a string and trim it
  let phoneNo = String(messageData.phoneNo).trim();
  
  // Validate phone number has at least 9 digits
  const digitsOnly = phoneNo.replace(/\D/g, '');
  if (digitsOnly.length < 9) {
    throw new Error(`Phone number must contain at least 9 digits (found ${digitsOnly.length})`);
  }

  const payload = {
    message: String(messageData.message).trim(),
    phoneNo: phoneNo, // Send as-is (E.164 format with + if present)
  };
  
  // Only include optional fields if they have values
  if (messageData.messageID) {
    payload.messageID = String(messageData.messageID).trim();
  }
  if (messageData.fullname && messageData.fullname.trim().length > 0) {
    payload.fullname = String(messageData.fullname).trim();
  }

  console.log('📤 Sending single message to /messages/send');
  console.log('📦 Payload:', JSON.stringify(payload, null, 2));
  console.log('📋 Payload details:', {
    messageLength: payload.message.length,
    phoneNo: payload.phoneNo,
    phoneNoLength: payload.phoneNo.length,
    phoneNoDigitsOnly: payload.phoneNo.replace(/\D/g, ''),
    phoneNoStartsWithPlus: payload.phoneNo.startsWith('+'),
    hasFullname: !!payload.fullname,
    fullnameValue: payload.fullname,
    hasMessageID: !!payload.messageID,
    messageIDValue: payload.messageID,
  });
  console.log('📋 Full payload object:', payload);
  console.log('📋 Payload keys:', Object.keys(payload));
  console.log('📋 Payload values:', Object.values(payload));

  try {
    const response = await axios.post('/messages/send', payload);
    console.log('✅ Single message sent successfully:', response.status);
    console.log('📥 Response data:', response.data);
    return response;
  } catch (error) {
    // If we get a 500 error and phone number starts with +, try without +
    if (error.response?.status === 500 && phoneNo.startsWith('+')) {
      console.warn('⚠️ First attempt failed with + sign, trying without + sign...');
      const phoneNoWithoutPlus = phoneNo.substring(1); // Remove leading +
      const retryPayload = {
        ...payload,
        phoneNo: phoneNoWithoutPlus,
      };
      
      console.log('🔄 Retry payload (without +):', JSON.stringify(retryPayload, null, 2));
      console.log('🔄 Retry phone number:', phoneNoWithoutPlus);
      
      try {
        const retryResponse = await axios.post('/messages/send', retryPayload);
        console.log('✅ Retry successful (without + sign):', retryResponse.status);
        console.log('📥 Retry response data:', retryResponse.data);
        return retryResponse;
      } catch (retryError) {
        console.error('❌ Retry also failed with status:', retryError.response?.status);
        console.error('❌ Retry error data:', retryError.response?.data);
        // Continue to original error handling below
      }
    }
    
    console.error('❌❌❌ ERROR SENDING SINGLE MESSAGE ❌❌❌');
    console.error('  - Error type:', error.constructor.name);
    console.error('  - Error message:', error.message);
    console.error('  - Full error object:', error);
    
    // Log the exact payload that failed
    console.error('\n📤 EXACT PAYLOAD THAT FAILED:');
    console.error(JSON.stringify(payload, null, 2));
    console.error('\n📋 Payload breakdown:');
    console.error('  - message:', payload.message);
    console.error('  - message type:', typeof payload.message);
    console.error('  - message length:', payload.message?.length);
    console.error('  - phoneNo:', payload.phoneNo);
    console.error('  - phoneNo type:', typeof payload.phoneNo);
    console.error('  - phoneNo length:', payload.phoneNo?.length);
    console.error('  - phoneNo (digits only):', payload.phoneNo?.replace(/\D/g, ''));
    if (payload.fullname) {
      console.error('  - fullname:', payload.fullname);
      console.error('  - fullname type:', typeof payload.fullname);
      console.error('  - fullname length:', payload.fullname?.length);
    }
    if (payload.messageID) {
      console.error('  - messageID:', payload.messageID);
      console.error('  - messageID type:', typeof payload.messageID);
    }
    
    if (error.response) {
      console.error('\n📥 SERVER RESPONSE:');
      console.error('  - Response status:', error.response.status);
      console.error('  - Response status text:', error.response.statusText);
      console.error('  - Response headers:', error.response.headers);
      console.error('  - Response data (raw):', error.response.data);
      console.error('  - Response data (stringified):', JSON.stringify(error.response.data, null, 2));
      
      // Check for common error patterns
      const errorData = error.response.data;
      if (errorData) {
        console.error('\n🔍 ERROR ANALYSIS:');
        if (typeof errorData === 'object') {
          console.error('  - Error object keys:', Object.keys(errorData));
          Object.keys(errorData).forEach(key => {
            console.error(`  - ${key}:`, errorData[key]);
          });
        }
      }
      
      // Attach server message for UI display
      if (error.response.status === 500) {
        let serverMessage = 'Internal Server Error';
        if (errorData) {
          if (typeof errorData === 'string') {
            serverMessage = errorData;
          } else if (errorData.message) {
            serverMessage = errorData.message;
          } else if (errorData.error) {
            serverMessage = typeof errorData.error === 'string' ? errorData.error : JSON.stringify(errorData.error);
          } else if (errorData.exception) {
            serverMessage = typeof errorData.exception === 'string' ? errorData.exception : JSON.stringify(errorData.exception);
          }
        }
        error.serverMessage = serverMessage;
        console.error('  - Server error message:', serverMessage);
        
        console.error('\n💡 TROUBLESHOOTING:');
        console.error('  The server returned a 500 error without detailed information.');
        console.error('  Possible causes:');
        console.error('  1. Phone number format issue (backend might expect different format)');
        console.error('  2. External SMS API (api.samis.co.ke) unavailable or failing');
        console.error('  3. Insufficient SMS balance');
        console.error('  4. Database constraint violation');
        console.error('  5. Backend validation failing silently');
        console.error('\n  Check server logs at officeapi.samis.co.ke for the actual exception/stack trace.');
      }
    } else if (error.request) {
      console.error('  - Request was made but no response received');
      console.error('  - Request:', error.request);
    }
    
    throw error;
  }
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
  if (messagesList.length === 0) {
    throw new Error('At least one message is required');
  }

  // Validate and build payload
  const payload = messagesList.map((msg, index) => {
    // Validate required fields
    if (!msg.message || typeof msg.message !== 'string' || msg.message.trim().length === 0) {
      throw new Error(`Message ${index + 1} is missing or empty`);
    }
    if (!msg.phoneNo || typeof msg.phoneNo !== 'string' || msg.phoneNo.trim().length === 0) {
      throw new Error(`Message ${index + 1} is missing phoneNo`);
    }

    const messageObj = {
      message: String(msg.message).trim(),
      phoneNo: String(msg.phoneNo).trim(),
    };

    // Only include optional fields if they have values
    if (msg.messageID) {
      messageObj.messageID = String(msg.messageID).trim();
    }
    if (msg.fullname && msg.fullname.trim().length > 0) {
      messageObj.fullname = String(msg.fullname).trim();
    }

    return messageObj;
  });

  console.log('📤 Sending bulk messages to /messages/sendmany');
  console.log('📦 Payload:', JSON.stringify(payload, null, 2));
  console.log('📋 Payload details:', {
    messagesCount: payload.length,
    firstMessage: payload[0] ? {
      messageLength: payload[0].message?.length,
      phoneNo: payload[0].phoneNo,
      hasFullname: !!payload[0].fullname,
    } : null,
  });

  try {
    const response = await axios.post('/messages/sendmany', payload);
    console.log('✅ Bulk messages sent successfully:', response.status);
    console.log('📥 Response data:', response.data);
    return response;
  } catch (error) {
    console.error('❌❌❌ ERROR SENDING BULK MESSAGES (sendmany) ❌❌❌');
    console.error('  - Error type:', error.constructor.name);
    console.error('  - Error message:', error.message);
    
    // Log the exact payload that failed
    console.error('\n📤 EXACT PAYLOAD THAT FAILED:');
    console.error(JSON.stringify(payload, null, 2));
    console.error('\n📋 Payload breakdown:');
    console.error('  - Messages count:', payload.length);
    payload.forEach((msg, idx) => {
      console.error(`\n  Message ${idx + 1}:`);
      console.error('    - message:', msg.message);
      console.error('    - message length:', msg.message?.length);
      console.error('    - phoneNo:', msg.phoneNo);
      console.error('    - phoneNo length:', msg.phoneNo?.length);
      console.error('    - fullname:', msg.fullname || '(not provided)');
    });
    
    if (error.response) {
      console.error('\n📥 SERVER RESPONSE:');
      console.error('  - Response status:', error.response.status);
      console.error('  - Response status text:', error.response.statusText);
      console.error('  - Response data (raw):', error.response.data);
      console.error('  - Response data (stringified):', JSON.stringify(error.response.data, null, 2));
      
      // Attach server message for UI display
      if (error.response.status === 500) {
        const errorData = error.response.data;
        let serverMessage = 'Internal Server Error';
        if (errorData) {
          if (typeof errorData === 'string') {
            serverMessage = errorData;
          } else if (errorData.message) {
            serverMessage = errorData.message;
          } else if (errorData.error) {
            serverMessage = typeof errorData.error === 'string' ? errorData.error : JSON.stringify(errorData.error);
          }
        }
        error.serverMessage = serverMessage;
        console.error('  - Server error message:', serverMessage);
        
        console.error('\n💡 TROUBLESHOOTING:');
        console.error('  Possible causes:');
        console.error('  1. External SMS API (api.samis.co.ke/samis/sms/SAMIS/sendbulk) unavailable');
        console.error('  2. Insufficient SMS balance');
        console.error('  3. Invalid phone number format');
        console.error('  4. Backend validation failing');
        console.error('\n  Check server logs at officeapi.samis.co.ke for the actual exception/stack trace.');
      }
    }
    
    throw error;
  }
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
  // API expects: { message: string, contacts: Array<{ contactID?, contactName, phoneNo, designation, email, schoolCode }> }
  // Note: designation and email are required fields but can be empty strings
  const payload = {
    message,
    contacts: bulkData.contacts.map(contact => {
      // Build contact object with ONLY the fields the API expects (no extra fields)
      // All fields are required by API, but designation and email can be empty strings
      const contactObj = {
        contactName: String(contact.contactName || '').trim(),
        phoneNo: String(contact.phoneNo || '').trim(),
        schoolCode: String(contact.schoolCode || '').trim(),
        // designation and email are required fields but can be empty
        designation: contact.designation ? String(contact.designation).trim() : '',
        email: contact.email ? String(contact.email).trim() : '',
      };
      
      // Only include contactID if it's provided and not null/undefined
      // Backend expects contactID to be a Long (number) if present
      if (contact.contactID !== undefined && contact.contactID !== null) {
        // Convert to number if it's a string representation of a number
        const contactID = typeof contact.contactID === 'string' 
          ? (contact.contactID.trim() === '' ? undefined : Number(contact.contactID))
          : contact.contactID;
        
        // Only add if it's a valid number
        if (!isNaN(contactID) && isFinite(contactID)) {
          contactObj.contactID = contactID;
        }
      }
      
      return contactObj;
    }),
  };

  // Validate payload before sending
  if (!payload.message || payload.message.length === 0) {
    throw new Error('Message cannot be empty');
  }

  // Validate payload structure matches API specification exactly
  if (!payload.contacts || !Array.isArray(payload.contacts)) {
    throw new Error('Payload must contain a contacts array');
  }

  if (payload.contacts.length === 0) {
    throw new Error('At least one contact is required');
  }

  // Validate each contact has required fields per API specification
  // Required: contactName, phoneNo, schoolCode
  // designation and email are included but can be empty strings
  const validationErrors = [];
  payload.contacts.forEach((contact, index) => {
    const contactErrors = [];
    
    // Validate contactName
    if (!contact.contactName || typeof contact.contactName !== 'string' || contact.contactName.trim().length === 0) {
      contactErrors.push('contactName is required and must be a non-empty string');
    }
    
    // Validate phoneNo
    if (!contact.phoneNo || typeof contact.phoneNo !== 'string' || contact.phoneNo.trim().length === 0) {
      contactErrors.push('phoneNo is required and must be a non-empty string');
    } else {
      // Basic phone number validation (should have at least 9 digits)
      const digitsOnly = contact.phoneNo.replace(/\D/g, '');
      if (digitsOnly.length < 9) {
        contactErrors.push(`phoneNo must contain at least 9 digits (found ${digitsOnly.length})`);
      }
    }
    
    // Validate schoolCode
    if (!contact.schoolCode || typeof contact.schoolCode !== 'string' || contact.schoolCode.trim().length === 0) {
      contactErrors.push('schoolCode is required and must be a non-empty string');
    }
    
    // Validate designation (optional but must be string if present)
    if (contact.designation !== undefined && contact.designation !== null && typeof contact.designation !== 'string') {
      contactErrors.push('designation must be a string if provided');
    }
    
    // Validate email (optional but must be string if present)
    if (contact.email !== undefined && contact.email !== null && typeof contact.email !== 'string') {
      contactErrors.push('email must be a string if provided');
    }
    
    if (contactErrors.length > 0) {
      validationErrors.push(`Contact ${index + 1} (${contact.contactName || 'unnamed'}): ${contactErrors.join('; ')}`);
    }
  });

  if (validationErrors.length > 0) {
    const errorMessage = 'Validation failed:\n' + validationErrors.join('\n');
    console.error('❌ Payload validation errors:', validationErrors);
    throw new Error(errorMessage);
  }

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
    // Final validation before sending
    console.log('🔍 Final payload validation before API call:');
    console.log('  - Message length:', payload.message?.length);
    console.log('  - Contacts count:', payload.contacts?.length);
    console.log('  - Payload keys:', Object.keys(payload));
    
    // Validate each contact one more time
    const contactIssues = [];
    payload.contacts.forEach((contact, idx) => {
      const issues = [];
      if (!contact.contactName || contact.contactName.trim().length === 0) issues.push('missing contactName');
      if (!contact.phoneNo || contact.phoneNo.trim().length === 0) issues.push('missing phoneNo');
      if (!contact.schoolCode || contact.schoolCode.trim().length === 0) issues.push('missing schoolCode');
      if (typeof contact.contactName !== 'string') issues.push('contactName not string');
      if (typeof contact.phoneNo !== 'string') issues.push('phoneNo not string');
      if (typeof contact.schoolCode !== 'string') issues.push('schoolCode not string');
      
      if (issues.length > 0) {
        contactIssues.push({ index: idx + 1, issues, contact });
        console.error(`  ⚠️ Contact ${idx + 1} has issues:`, issues, contact);
      }
    });
    
    if (contactIssues.length > 0) {
      throw new Error(`Validation failed: ${contactIssues.length} contact(s) have issues. Check console for details.`);
    }
    
    // Log the exact request that will be sent
    console.log('📡 Making POST request to /messages/sendbulk');
    console.log('📦 Request payload structure:', {
      hasMessage: !!payload.message,
      messageType: typeof payload.message,
      messageLength: payload.message?.length,
      hasContacts: Array.isArray(payload.contacts),
      contactsCount: payload.contacts?.length,
      firstContactKeys: payload.contacts?.[0] ? Object.keys(payload.contacts[0]) : null,
    });
    
    const response = await axios.post('/messages/sendbulk', payload);
    console.log('✅ Bulk message sent successfully:', response.status);
    console.log('📥 Response data:', response.data);
    return response;
  } catch (error) {
    // Enhanced error logging with payload details
    console.error('❌❌❌ ERROR SENDING BULK MESSAGES ❌❌❌');
    console.error('  - Error type:', error.constructor.name);
    console.error('  - Error message:', error.message);
    
    // Log the exact payload that was sent
    console.error('\n📤 EXACT PAYLOAD THAT WAS SENT:');
    console.error(JSON.stringify(payload, null, 2));
    console.error('\n📋 Payload breakdown:');
    console.error('  - Message:', payload.message);
    console.error('  - Message length:', payload.message?.length);
    console.error('  - Contacts count:', payload.contacts.length);
    payload.contacts.forEach((contact, idx) => {
      console.error(`\n  Contact ${idx + 1}:`);
      console.error('    Keys:', Object.keys(contact));
      console.error('    contactName:', contact.contactName, `(type: ${typeof contact.contactName}, length: ${contact.contactName?.length})`);
      console.error('    phoneNo:', contact.phoneNo, `(type: ${typeof contact.phoneNo}, length: ${contact.phoneNo?.length})`);
      console.error('    designation:', contact.designation, `(type: ${typeof contact.designation}, length: ${contact.designation?.length})`);
      console.error('    email:', contact.email, `(type: ${typeof contact.email}, length: ${contact.email?.length})`);
      console.error('    schoolCode:', contact.schoolCode, `(type: ${typeof contact.schoolCode}, length: ${contact.schoolCode?.length})`);
      console.error('    Full object:', JSON.stringify(contact, null, 2));
    });
    
    if (error.response) {
      console.error('\n📥 SERVER RESPONSE:');
      console.error('  - Response status:', error.response.status);
      console.error('  - Response status text:', error.response.statusText);
      console.error('  - Response headers:', error.response.headers);
      console.error('  - Response data (raw):', error.response.data);
      console.error('  - Response data (stringified):', JSON.stringify(error.response.data, null, 2));
      
      // Try to extract more detailed error information
      const errorData = error.response.data;
      if (errorData) {
        console.error('\n🔍 Error Data Analysis:');
        if (typeof errorData === 'string') {
          console.error('  - Error is a string:', errorData);
        } else if (typeof errorData === 'object') {
          console.error('  - Error is an object with keys:', Object.keys(errorData));
          const possibleErrorFields = ['message', 'error', 'exception', 'trace', 'details', 'cause', 'path', 'timestamp', 'status', 'statusCode'];
          possibleErrorFields.forEach(field => {
            if (errorData[field] !== undefined) {
              console.error(`  - ${field}:`, errorData[field]);
            }
          });
          
          // Check for nested error objects
          if (errorData.error) {
            console.error('  - Nested error object:', errorData.error);
          }
          if (errorData.exception) {
            console.error('  - Exception:', errorData.exception);
          }
          if (errorData.trace) {
            console.error('  - Stack trace:', errorData.trace);
          }
        }
      }
      
      // Attach server message to error for UI display
      if (error.response.status === 500) {
        let serverMessage = 'Internal Server Error';
        let detailedError = null;
        
        if (errorData) {
          if (typeof errorData === 'string') {
            serverMessage = errorData;
            detailedError = errorData;
          } else if (errorData.message) {
            serverMessage = errorData.message;
            detailedError = errorData.message;
          } else if (errorData.error) {
            serverMessage = typeof errorData.error === 'string' ? errorData.error : JSON.stringify(errorData.error);
            detailedError = errorData.error;
          } else if (errorData.exception) {
            serverMessage = typeof errorData.exception === 'string' ? errorData.exception : JSON.stringify(errorData.exception);
            detailedError = errorData.exception;
          } else {
            serverMessage = JSON.stringify(errorData);
            detailedError = errorData;
          }
        }
        
        error.serverMessage = serverMessage;
        error.detailedError = detailedError;
        error.errorData = errorData;
        
        console.error('\n💡 SERVER ERROR MESSAGE:', serverMessage);
        console.error('\n🔴 500 ERROR DIAGNOSIS:');
        console.error('  Since single messages work but bulk fails, possible causes:');
        console.error('  1. Backend validation failing on contacts array structure');
        console.error('  2. Database constraint violation when creating multiple contacts');
        console.error('  3. External SMS API (api.samis.co.ke/samis/sms/SAMIS/sendbulk) failing');
        console.error('  4. Invalid schoolCode values that don\'t exist in database');
        console.error('  5. Phone number format issue (backend might expect different format)');
        console.error('  6. Missing or null required fields in contact objects');
        console.error('\n  💡 SOLUTION: Check server logs at officeapi.samis.co.ke for the exact exception/stack trace');
        console.error('  💡 TEMPORARY WORKAROUND: Try sending to fewer schools at once (e.g., 1-5 at a time)');
      }
    } else if (error.request) {
      console.error('\n⚠️ REQUEST ERROR:');
      console.error('  - Request was made but no response received');
      console.error('  - Request:', error.request);
    } else {
      console.error('\n⚠️ SETUP ERROR:');
      console.error('  - Error setting up request:', error.message);
    }
    
    console.error('\n💡 TROUBLESHOOTING TIPS:');
    console.error('  1. Check server logs at officeapi.samis.co.ke for detailed error');
    console.error('  2. Verify all contacts have valid phoneNo, contactName, and schoolCode');
    console.error('  3. Check if external SMS API (api.samis.co.ke) is accessible');
    console.error('  4. Verify SMS account balance is sufficient');
    console.error('  5. Check if schoolCode values exist in database');
    
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

