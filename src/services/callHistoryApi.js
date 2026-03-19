import axios from '../axios';

/**
 * Call History API Service
 * All endpoints for call history management.
 *
 * CallController (gateway calls) – Base: /api/calls
 * - POST /api/calls/token          → WebRTC capability token
 * - POST /api/calls/list          → List all gateway calls
 * - POST /api/calls/listbydate/{date}              → List by date (yyyy-MM-dd)
 * - POST /api/calls/listbydaterange/{start}/{end}  → List by date range
 * Gateway response fields: sessionId, direction, callerNumber, destinationNumber,
 * dialDestinationNumber, callStartTime, durationInSeconds, recordingUrl, etc.
 */

/**
 * Save Call History
 * POST /api/calls/history/save
 * @param {Object} callData - { callerPhoneNo, callerName, receiverPhoneNo, receiverName, callType, duration, status, timestamp }
 * @returns {Promise} Response with saved call history details
 */
export const saveCallHistory = async (callData) => {
  const payload = {
    callerPhoneNo: callData.callerPhoneNo,
    callerName: callData.callerName || '',
    receiverPhoneNo: callData.receiverPhoneNo,
    receiverName: callData.receiverName || '',
    callType: callData.callType || 'Outgoing', // 'Outgoing' or 'Incoming'
    duration: callData.duration || 0, // Duration in seconds
    status: callData.status || 'completed', // 'completed', 'missed', 'failed', 'cancelled'
    timestamp: callData.timestamp || new Date().toISOString(),
    ...(callData.callId && { callId: callData.callId }),
  };
  
  console.log('📞 Saving call history:', payload);
  
  try {
    const response = await axios.post('/calls/history/save', payload);
    console.log('✅ Call history saved successfully:', response.status);
    return response;
  } catch (error) {
    console.error('❌ Error saving call history:', error);
    // Don't throw - allow call to continue even if history save fails
    return null;
  }
};

/**
 * Retrieve Call History
 * POST /api/calls/history/list
 * @param {Object} filters - Optional filters { phoneNo, startDate, endDate, callType, limit }
 * @returns {Promise} Response with array of call history records
 */
export const getCallHistory = async (filters = {}) => {
  const payload = {
    ...(filters.phoneNo && { phoneNo: filters.phoneNo }),
    ...(filters.startDate && { startDate: filters.startDate }),
    ...(filters.endDate && { endDate: filters.endDate }),
    ...(filters.callType && { callType: filters.callType }),
    ...(filters.limit && { limit: filters.limit }),
  };
  
  try {
    const response = await axios.post('/calls/history/list', payload);
    return response;
  } catch (error) {
    console.error('❌ Error retrieving call history:', error);
    throw error;
  }
};

/**
 * Get Call History by Phone Number
 * POST /api/calls/history/listbyphone/{phoneNo}
 * @param {string} phoneNo - The phone number to filter call history by
 * @returns {Promise} Response with array of call history records for that phone number
 */
export const getCallHistoryByPhone = async (phoneNo) => {
  if (!phoneNo) {
    throw new Error('phoneNo is required');
  }
  
  try {
    const response = await axios.post(`/calls/history/listbyphone/${phoneNo}`);
    return response;
  } catch (error) {
    console.error('❌ Error retrieving call history by phone:', error);
    throw error;
  }
};

/**
 * List Gateway Calls (all)
 * POST /api/calls/list
 * @returns {Promise} Response with array of gateway call records (includes recordingUrl)
 */
export const getGatewayCalls = async () => {
  try {
    const response = await axios.post('/calls/list');
    return response;
  } catch (error) {
    console.error('❌ Error fetching gateway calls:', error);
    throw error;
  }
};

/**
 * List Gateway Calls by Date
 * Returns gateway calls on a specific date (inclusive for the entire day).
 * Endpoint: POST /api/calls/listbydate/{date}
 * @param {string} date - Path param, required. Date in yyyy-MM-dd format (e.g. 2026-02-19)
 * @returns {Promise} 200 OK with array of gateway call records (sessionId, direction, callerNumber,
 *   destinationNumber, dialDestinationNumber, callStartTime, durationInSeconds, recordingUrl, etc.)
 */
export const getGatewayCallsByDate = async (date) => {
  if (!date) throw new Error('date is required (yyyy-MM-dd)');
  const dateStr = String(date).trim();
  if (!dateStr) throw new Error('date is required (yyyy-MM-dd)');
  try {
    const response = await axios.post(`/calls/listbydate/${dateStr}`);
    return response;
  } catch (error) {
    console.error('❌ Error fetching gateway calls by date:', error);
    throw error;
  }
};

/**
 * List Gateway Calls by Date Range
 * POST /api/calls/listbydaterange/{startDate}/{endDate}
 * @param {string} startDate - Start date in yyyy-MM-dd format
 * @param {string} endDate - End date in yyyy-MM-dd format
 * @returns {Promise} Response with array of gateway call records
 */
export const getGatewayCallsByDateRange = async (startDate, endDate) => {
  if (!startDate || !endDate) throw new Error('startDate and endDate are required (yyyy-MM-dd)');
  try {
    const response = await axios.post(`/calls/listbydaterange/${startDate}/${endDate}`);
    return response;
  } catch (error) {
    console.error('❌ Error fetching gateway calls by date range:', error);
    throw error;
  }
};

/**
 * Delete Call History
 * POST /api/calls/history/delete/{callHistoryId}
 * @param {number|string} callHistoryId - The ID of the call history record to delete
 * @returns {Promise} Response with deleted call history details
 */
export const deleteCallHistory = async (callHistoryId) => {
  if (!callHistoryId) {
    throw new Error('callHistoryId is required');
  }
  
  try {
    const response = await axios.post(`/calls/history/delete/${callHistoryId}`);
    return response;
  } catch (error) {
    console.error('❌ Error deleting call history:', error);
    throw error;
  }
};

// Export all methods as default object
export default {
  saveCallHistory,
  getCallHistory,
  getCallHistoryByPhone,
  deleteCallHistory,
  getGatewayCalls,
  getGatewayCallsByDate,
  getGatewayCallsByDateRange,
};