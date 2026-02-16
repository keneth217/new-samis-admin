<template>
  <div class="form-wrap">
    <div class="form-content">
      <div class="cancel" @click="$emit('closeForm')">
        <i class="fas fa-times"></i>
      </div>
      <div class="form-title">
        <h2>SEND MESSAGE TO SCHOOLS</h2>
        <!-- Balance Display -->
        <div class="balance-info" v-if="smsBalance !== null">
          <span class="balance-label">SMS Balance:</span>
          <span class="balance-value" :class="{ 'balance-low': smsBalance < 5, 'balance-insufficient': smsBalance < selectedSchools.length }">
            {{ formatBalance(smsBalance) }}
          </span>
          <button @click="checkBalance" class="refresh-balance-btn-small" :disabled="checkingBalance" title="Refresh Balance">
            <span class="material-symbols-outlined">refresh</span>
          </button>
        </div>
        <div class="balance-warning" v-if="smsBalance !== null && smsBalance < selectedSchools.length">
          ⚠️ Warning: Your balance ({{ formatBalance(smsBalance) }}) is less than selected schools ({{ selectedSchools.length }})
        </div>
      </div>
      <hr />

      <div class="form-inputs">
        <!-- Recipients Selection -->
        <div class="form-group schools-form-group">
          <!-- <label class="section-label">Select Schools to Send Message*</label>
           -->
          <div class="schools-selection-container">
            <!-- Search Bar -->
            <div v-if="!Loading && schools.length > 0" class="search-container">
              <input
                v-model="schoolSearch"
                class="search-input"
                type="text"
                placeholder="Search by school name or code..."
              />
              <i class="fas fa-search search-icon"></i>
            </div>

            <!-- Loading State -->
            <div v-if="Loading" class="status-box loading-box">
              <span class="material-symbols-outlined" style="animation: spin 1s linear infinite;">sync</span>
              Loading schools...
            </div>

            <!-- Empty States -->
            <div v-else-if="schools.length === 0" class="status-box empty-box">
              No schools found in database
            </div>

            <div v-else-if="filteredSchools.length === 0" class="status-box empty-box">
              <strong>No schools match your search: "{{ schoolSearch }}"</strong>
              <div style="margin-top: 0.5rem; font-size: 0.9rem;">Total schools: {{ schools.length }}</div>
            </div>

            <!-- Schools List - Simple Scrollable -->
            <div v-else class="simple-schools-list">
              <div class="school-count-header">
                <div class="header-col-select" style="border-right: 1px solid rgba(255,255,255,0.3); padding-right: 1rem; display: flex; align-items: center; justify-content: center;">
                  <input 
                    type="checkbox" 
                    :checked="selectAllChecked"
                    @change="toggleSelectAll"
                    class="select-all-checkbox"
                  />
                </div>
                <div class="header-col-name" style="border-right: 1px solid rgba(255,255,255,0.3); padding-right: 1rem;"><strong>School Name</strong></div>
                <div class="header-col-code"><strong>School Code</strong></div>
              </div>
              <div class="school-count-info">
                <strong>{{ filteredSchools.length }} Schools Available</strong>
              </div>
              
              <div class="schools-list-inner">
                <template v-if="filteredSchools.length > 0">
                  <div 
                    v-for="(school, index) in filteredSchools" 
                    :key="school.schoolCode || index" 
                    class="simple-school-item"
                    :class="{ 'item-selected': selectedSchools.includes(school.schoolCode) }"
                  >
                    <label class="simple-school-label">
                      <div class="cell-checkbox" style="border-right: 1px solid #cccccc !important; padding-right: 1rem; display: flex; align-items: center; justify-content: center; min-width: 70px;">
                        <input 
                          type="checkbox" 
                          :value="school.schoolCode"
                          v-model="selectedSchools"
                          class="simple-checkbox"
                        />
                      </div>
                      <div class="cell-name" style="border-right: 1px solid #cccccc !important; padding-right: 1rem;">
                        <span class="simple-school-name">
                          {{ school.schoolName || 'Unknown School' }}
                        </span>
                      </div>
                      <div class="cell-code" style="min-width: 120px; text-align: center;">
                        <span class="simple-school-code">{{ school.schoolCode || 'N/A' }}</span>
                      </div>
                    </label>
                  </div>
                </template>
                <div v-else class="no-schools-message">
                  No schools to display
                </div>
              </div>
            </div>

            <!-- Selection Counter -->
            <div v-if="!Loading && schools.length > 0" class="selection-counter">
              <span class="counter-label">Selected:</span>
              <span class="counter-number">{{ selectedSchools.length }}</span>
              <span class="counter-slash">/</span>
              <span class="counter-total">{{ filteredSchools.length }}</span>
            </div>
          </div>
        </div>

        <!-- Subject -->
        <div class="form-group">
          <label class="section-label">Message Subject*</label>
          <input 
            type="text" 
            class="form-control message-input" 
            v-model="subject" 
            placeholder="Enter message subject..." 
            required
            autocomplete="off"
            spellcheck="true"
          />
        </div>

        <!-- Message Body -->
        <div class="form-group">
          <label class="section-label">Message Content*</label>
          <textarea
            class="form-control message-textarea"
            v-model="messageBody"
            placeholder="Type your message here..."
            rows="4"
            required
            autocomplete="off"
            spellcheck="true"
          ></textarea>
        </div>

        <!-- Message Preview -->
        <div class="form-group" v-if="(subject || messageBody) && selectedSchools.length > 0">
          <div class="preview-section">
            <h3 class="preview-title">📋 Message Preview</h3>
            <div class="preview-content">
              <div class="preview-row">
                <span class="preview-label">To:</span>
                <span class="preview-value">{{ selectedSchools.length }} school(s)</span>
              </div>
              <div class="preview-row">
                <span class="preview-label">Subject:</span>
                <span class="preview-value">{{ subject || '(No subject)' }}</span>
              </div>
              <div class="preview-row preview-message-row">
                <span class="preview-label">Message:</span>
                <div class="preview-message-text">{{ messageBody || '(No message)' }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <hr />
      <div class="form-actions">
        <button @click="$emit('closeForm')">Cancel</button>
        <button @click="sendMessage" :disabled="!canSend">Send Message</button>
      </div>
    </div>
    <LoadingSpinner :isLoading="Loading" />
  </div>
</template>

<script>
import axios from '../../axios';
import { useToast } from 'vue-toastification';
import LoadingSpinner from '../../components/LoadingSpinner.vue';
import { sendSingleMessage, sendBulkMessages, getAccountBalance } from '../../services/messagesApi';

export default {
  name: 'NewMessageForm',
  components: { LoadingSpinner },
  props: {
    message: {
      type: Object,
      default: null,
    },
  },
  data() {
    return {
      selectedSchools: [],
      subject: '',
      messageBody: '',
      schools: [],
      Loading: false,
      editMode: false,
      schoolSearch: '',
      smsBalance: null,
      checkingBalance: false,
    };
  },
  computed: {
    canSend() {
      return this.selectedSchools.length > 0 && 
             this.subject.trim() !== '' && 
             this.messageBody.trim() !== '';
    },
    filteredSchools() {
      if (!this.schoolSearch.trim()) return this.schools;
      const q = this.schoolSearch.toLowerCase();
      return this.schools.filter(s => {
        return (
          (s.schoolName && s.schoolName.toLowerCase().includes(q)) ||
          (s.schoolCode && s.schoolCode.toLowerCase().includes(q))
        );
      });
    },
    selectAllChecked() {
      if (this.filteredSchools.length === 0) return false;
      return this.filteredSchools.every(school => 
        this.selectedSchools.includes(school.schoolCode)
      );
    },
  },
  watch: {
    message: {
      immediate: true,
      handler(newMessage) {
        if (newMessage) {
          this.editMode = true;
          this.subject = newMessage.subject || '';
          this.messageBody = newMessage.messageBody || '';
          this.selectedSchools = (newMessage.recipients || []).map(r => r.schoolCode || r);
        } else {
          this.editMode = false;
          this.clearForm();
        }
      },
    },
  },
  methods: {
    async checkBalance() {
      this.checkingBalance = true;
      try {
        const response = await getAccountBalance();
        this.smsBalance = typeof response.data === 'number' ? response.data : parseFloat(response.data) || 0;
      } catch (error) {
        console.error('Error fetching balance:', error);
        this.smsBalance = null;
      } finally {
        this.checkingBalance = false;
      }
    },

    formatBalance(balance) {
      if (balance === null || balance === undefined) return 'Checking...';
      return typeof balance === 'number' ? balance.toFixed(2) : String(balance);
    },

    async fetchSchools() {
      console.log('🔄 fetchSchools() called');
      this.Loading = true;
      const toast = useToast();
      try {
        console.log('📡 Making API call to /schools/list...');
        const response = await axios.post('/schools/list', {});
        
        console.log('✅ API Response received:', response);
        console.log('📊 Response status:', response.status);
        console.log('📦 Response data:', response.data);
        console.log('📦 Is array?', Array.isArray(response.data));
        
        if (response.data && Array.isArray(response.data)) {
          console.log('📋 Total schools in response:', response.data.length);
          
          // Map the response data to ensure we have schoolCode and schoolName
          const mappedSchools = response.data.map(school => ({
            schoolCode: school.schoolCode || school.school_code || '',
            schoolName: school.schoolName || school.school_name || 'N/A',
            email: school.email || '',
            principalPhoneNo: school.principalPhoneNo || school.principal_phone_no || '',
            phoneNo: school.phoneNo || school.phone_no || '',
            principalName: school.principalName || school.principal_name || '',
            county: school.county || '',
            deleted: school.deleted || false,
          }));
          
          console.log('📋 Mapped schools:', mappedSchools);
          
          // Filter out deleted schools and schools without schoolCode
          this.schools = mappedSchools.filter(school => {
            const hasCode = school.schoolCode && school.schoolCode.trim() !== '';
            const notDeleted = !school.deleted;
            const include = hasCode && notDeleted;
            if (!include) {
              console.log('🚫 Filtered out school:', school);
            }
            return include;
          });
          
          console.log('✅ Final schools after filtering:', this.schools);
          console.log('📊 Total active schools:', this.schools.length);
          
          if (this.schools.length > 0) {
            toast.success(`✅ Loaded ${this.schools.length} school(s) from database!`);
          } else {
            toast.warning('⚠️ No active schools found. All schools may be deleted or have no school code.');
          }
        } else {
          console.error('❌ Response data is not an array:', response.data);
          toast.error('❌ Invalid response format from server. Expected array of schools.');
          this.schools = [];
        }
      } catch (error) {
        console.error('❌ Error fetching schools:', error);
        console.error('❌ Error details:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status,
          config: error.config,
        });
        const errorMsg = error.response?.data?.message || error.message || 'Unknown error';
        toast.error(`❌ Failed to fetch schools: ${errorMsg}`);
        this.schools = [];
      } finally {
        this.Loading = false;
        console.log('🏁 Finished loading schools. Final count:', this.schools.length);
      }
    },

    selectAll() {
      this.selectedSchools = this.filteredSchools.map(school => school.schoolCode);
    },

    clearSelection() {
      this.selectedSchools = [];
    },

    toggleSelectAll(event) {
      if (event.target.checked) {
        // Add all filtered schools that are not already selected
        const filteredCodes = this.filteredSchools.map(school => school.schoolCode);
        filteredCodes.forEach(code => {
          if (!this.selectedSchools.includes(code)) {
            this.selectedSchools.push(code);
          }
        });
      } else {
        // Remove all filtered schools from selection
        const filteredCodes = this.filteredSchools.map(school => school.schoolCode);
        this.selectedSchools = this.selectedSchools.filter(code => !filteredCodes.includes(code));
      }
    },

    clearForm() {
      this.selectedSchools = [];
      this.subject = '';
      this.messageBody = '';
    },

    // Helper method to clean and validate phone number
    // Backend appears to prefer E.164 (+254...) format; normalize everything to that.
    cleanPhoneNumber(phone) {
      if (!phone) return '';
      let cleaned = String(phone).trim();
      // Keep digits and leading +
      cleaned = cleaned.replace(/[^\d+]/g, '');

      // If already in +254 format and length looks correct, keep as-is
      if (/^\+254\d{9}$/.test(cleaned)) {
        return cleaned;
      }

      // If starts with 254 and has 9 remaining digits -> add +
      if (/^254\d{9}$/.test(cleaned)) {
        return `+${cleaned}`;
      }

      // If starts with 0 and has 9 following digits -> convert to +254
      if (/^0\d{9}$/.test(cleaned)) {
        return `+254${cleaned.substring(1)}`;
      }

      // If only 9 digits (missing leading 0), assume local and convert
      if (/^\d{9}$/.test(cleaned)) {
        return `+254${cleaned}`;
      }

      // Fallback: return original cleaned string
      return cleaned;
    },

    async sendMessage() {
      const toast = useToast();

      if (!this.canSend) {
        toast.warning('Please select at least one school and fill in subject and message!');
        return;
      }

      // Check balance before sending (non-blocking, just for info)
      try {
        const balanceResponse = await getAccountBalance();
        const balance = typeof balanceResponse.data === 'number' ? balanceResponse.data : parseFloat(balanceResponse.data) || 0;
        const recipientCount = this.selectedSchools.length;
        
        console.log(`📊 SMS Balance Check: ${balance}, Recipients: ${recipientCount}`);
        
        // Update UI balance
        this.smsBalance = balance;
        
        // Warn if balance is insufficient (non-blocking warning)
        if (balance < recipientCount) {
          toast.warning(
            `⚠️ Low Balance: ${balance.toFixed(2)} credits. Trying to send to ${recipientCount} school(s). Message may fail.`,
            { timeout: 6000 }
          );
        } else if (balance < 5) {
          toast.info(`SMS Balance: ${balance.toFixed(2)}. Consider topping up soon.`, { timeout: 4000 });
        }
      } catch (error) {
        console.warn('Could not check SMS balance:', error);
        // Don't block sending if balance check fails
      }

      // Build contacts list for /messages/sendbulk
      console.log('Selected school codes:', this.selectedSchools);
      console.log('Available schools count:', this.schools.length);
      
      const contacts = this.selectedSchools
        .map(code => {
          const school = this.schools.find(s => s.schoolCode === code);
          if (!school) {
            console.warn(`School not found for code: ${code}`);
            return null;
          }
          return school;
        })
        .filter(Boolean)
        .map(school => {
          console.log('Processing school:', { 
            schoolCode: school.schoolCode, 
            schoolName: school.schoolName,
            principalPhoneNo: school.principalPhoneNo,
            phoneNo: school.phoneNo
          });
          
          const phoneNo = this.cleanPhoneNumber(school.principalPhoneNo || school.phoneNo || '');
          
          // Only include contact if phone number is valid (at least 9 digits)
          if (!phoneNo || phoneNo.replace(/\D/g, '').length < 9) {
            console.warn(`Invalid phone number for school ${school.schoolCode}: ${phoneNo}`);
            return null;
          }

          // Ensure schoolCode is definitely available
          const schoolCodeValue = String(school.schoolCode || '').trim();
          if (!schoolCodeValue) {
            console.error('ERROR: schoolCode is empty for school:', school);
            return null;
          }
          
          const contact = {
            contactName: String(school.schoolName || '').trim() || 'Unknown',
            designation: String(school.principalName || '').trim() || '',
            email: String(school.email || '').trim() || '',
            phoneNo: String(phoneNo).trim(),
            schoolCode: schoolCodeValue,
          };
          
          console.log('Created contact with schoolCode:', schoolCodeValue, 'Full contact:', contact);
          
          return contact;
        })
        .filter(Boolean); // Remove any null entries
      
      console.log('Final contacts before validation:', contacts);

      if (contacts.length === 0) {
        toast.error('No valid contacts found with valid phone numbers for selected schools.');
        return;
      }

      // Validate all required fields are present
      const validContacts = contacts.filter(c => {
        return c.contactName && 
               c.phoneNo && 
               c.phoneNo.trim().length >= 9 && 
               c.schoolCode;
      });

      if (validContacts.length === 0) {
        toast.error('None of the selected schools have complete contact information. Please ensure schools have valid phone numbers, names, and codes.');
        return;
      }

      // Build message with subject and body
      const messageText = this.subject.trim() 
        ? `${this.subject.trim()}\n\n${this.messageBody.trim()}`
        : this.messageBody.trim();

      // Final validation: ensure each contact has all required fields as non-empty strings
      const finalContacts = validContacts.map(contact => {
        const finalContact = {
          contactName: (contact.contactName != null ? String(contact.contactName) : '').trim(),
          phoneNo: (contact.phoneNo != null ? String(contact.phoneNo) : '').trim(),
          designation: (contact.designation != null ? String(contact.designation) : '').trim(),
          email: (contact.email != null ? String(contact.email) : '').trim(),
          schoolCode: (contact.schoolCode != null ? String(contact.schoolCode) : '').trim(),
        };

        // Validate required fields
        if (!finalContact.contactName || finalContact.contactName.length === 0) {
          console.warn('Invalid contact (missing contactName):', finalContact);
          return null;
        }
        if (!finalContact.phoneNo || finalContact.phoneNo.length === 0) {
          console.warn('Invalid contact (missing phoneNo):', finalContact);
          return null;
        }
        if (!finalContact.schoolCode || finalContact.schoolCode.length === 0) {
          console.warn('Invalid contact (missing schoolCode):', finalContact);
          return null;
        }

        // Validate phone number has at least 9 digits
        const digitsOnly = finalContact.phoneNo.replace(/\D/g, '');
        if (digitsOnly.length < 9) {
          console.warn('Invalid contact (phone number too short):', finalContact);
          return null;
        }

        return finalContact;
      }).filter(Boolean);

      if (finalContacts.length === 0) {
        toast.error('No valid contacts after final validation. Please check contact information.');
        return;
      }

      this.Loading = true;

      try {
        // Route to appropriate endpoint based on number of contacts
        if (finalContacts.length === 1) {
          // Single school selected - use /messages/send endpoint
          const singleContact = finalContacts[0];
          console.log('📤 Sending SINGLE message to:', singleContact.contactName);
          console.log('📤 Using endpoint: /messages/send');
          
          // Format phone number - some backends prefer digits only (without +)
          // Try both formats: with + (E.164) and without (digits only)
          let phoneNo = singleContact.phoneNo;
          const phoneNoDigitsOnly = phoneNo.replace(/\D/g, '');
          
          console.log('📱 Phone number formatting:');
          console.log('  - Original:', phoneNo);
          console.log('  - Digits only:', phoneNoDigitsOnly);
          console.log('  - Has + sign:', phoneNo.startsWith('+'));
          
          // Use the phone number as-is (E.164 format with +)
          // If backend fails, we can try digits-only format
          const singlePayload = {
            message: messageText,
            phoneNo: phoneNo, // Keep E.164 format (+254...)
            fullname: singleContact.contactName,
          };
          
          console.log('📦 Single message payload:', JSON.stringify(singlePayload, null, 2));
          console.log('📋 Payload validation:');
          console.log('  - Message exists:', !!singlePayload.message);
          console.log('  - Message length:', singlePayload.message?.length);
          console.log('  - PhoneNo exists:', !!singlePayload.phoneNo);
          console.log('  - PhoneNo length:', singlePayload.phoneNo?.length);
          console.log('  - PhoneNo format:', singlePayload.phoneNo);
          console.log('  - Fullname exists:', !!singlePayload.fullname);
          console.log('  - Fullname length:', singlePayload.fullname?.length);
          
          const response = await sendSingleMessage(singlePayload);
          
          if (response.status === 200 || response.status === 201) {
            toast.success(`Message sent successfully to ${singleContact.contactName}!`);
            this.$emit('fetchMessages');
            this.$emit('closeForm');
            this.clearForm();
          } else {
            toast.error(`Unexpected response status: ${response.status}`);
          }
        } else {
          // Multiple schools selected - use /messages/sendbulk endpoint
          console.log(`📤 Sending BULK message to ${finalContacts.length} schools`);
          console.log('📤 Using endpoint: /messages/sendbulk');
          
          const bulkPayload = {
            message: messageText,
            contacts: finalContacts.map(contact => ({
              contactName: contact.contactName,
              phoneNo: contact.phoneNo,
              designation: contact.designation,
              email: contact.email,
              schoolCode: contact.schoolCode,
            })),
          };
          
          console.log('📦 Bulk message payload:', JSON.stringify(bulkPayload, null, 2));
          
          const response = await sendBulkMessages(bulkPayload);
          
          if (response.status === 200 || response.status === 201) {
            toast.success(`Message sent successfully to ${finalContacts.length} school(s)!`);
            this.$emit('fetchMessages');
            this.$emit('closeForm');
            this.clearForm();
          } else {
            toast.error(`Unexpected response status: ${response.status}`);
          }
        }
      } catch (error) {
        console.error('\n❌❌❌ ERROR SENDING MESSAGE ❌❌❌');
        console.error('Full error object:', error);
        console.error('Error response:', error.response);
        console.error('Error response status:', error.response?.status);
        console.error('Error response status text:', error.response?.statusText);
        console.error('Error response headers:', error.response?.headers);
        console.error('Error response data (raw):', error.response?.data);
        console.error('Error response data (stringified):', JSON.stringify(error.response?.data, null, 2));
        
        // Log the exact payload that failed
        if (finalContacts.length === 1) {
          console.error('\n📤 SINGLE MESSAGE PAYLOAD THAT FAILED:');
          console.error(JSON.stringify({
            message: messageText,
            phoneNo: finalContacts[0].phoneNo,
            fullname: finalContacts[0].contactName,
          }, null, 2));
        } else {
          console.error('\n📤 BULK MESSAGE PAYLOAD THAT FAILED:');
          console.error(JSON.stringify({
            message: messageText,
            contacts: finalContacts.map(c => ({
              contactName: c.contactName,
              phoneNo: c.phoneNo,
              designation: c.designation,
              email: c.email,
              schoolCode: c.schoolCode,
            })),
          }, null, 2));
        }
        
        // Handle different error types
        if (error.response) {
          const status = error.response.status;
          const errorData = error.response.data;
          const isSingleMessage = finalContacts.length === 1;
          
          let errorMessage = `Failed to send ${isSingleMessage ? 'message' : 'bulk messages'}. `;
          
          if (status === 500) {
            errorMessage += `Server error (500) - ${isSingleMessage ? 'Single' : 'Bulk'} Message Failed\n\n`;
            
            if (error.serverMessage && error.serverMessage !== 'Internal Server Error') {
              errorMessage += `Server Message: ${error.serverMessage}\n\n`;
            }
            
            const errorString = JSON.stringify(errorData || {}).toLowerCase();
            if (errorString.includes('balance') || errorString.includes('insufficient') || errorString.includes('fund') || errorString.includes('credit')) {
              errorMessage += '⚠️ INSUFFICIENT SMS BALANCE!\n';
              errorMessage += 'This error is likely caused by insufficient SMS credits in your account.\n';
              errorMessage += 'Please top up your SMS balance and try again.';
            } else {
              if (errorData) {
                const possibleErrorFields = ['message', 'error', 'exception', 'trace', 'details', 'cause', 'path'];
                let foundError = false;
                
                for (const field of possibleErrorFields) {
                  if (errorData[field]) {
                    if (typeof errorData[field] === 'string') {
                      errorMessage += `Server ${field}: ${errorData[field]}\n\n`;
                      foundError = true;
                      break;
                    } else if (typeof errorData[field] === 'object') {
                      errorMessage += `Server ${field}: ${JSON.stringify(errorData[field])}\n\n`;
                      foundError = true;
                      break;
                    }
                  }
                }
                
                if (!foundError) {
                  if (typeof errorData === 'string') {
                    errorMessage += `Server Response: ${errorData}\n\n`;
                  } else {
                    errorMessage += 'Server Response:\n' + JSON.stringify(errorData, null, 2) + '\n\n';
                  }
                }
              } else {
                errorMessage += 'No error details provided. The server encountered an internal error.\n\n';
              }
              
              if (!isSingleMessage) {
                errorMessage += '💡 TIP: Try sending to one school at a time (single messages work better).\n\n';
              }
              errorMessage += 'Possible causes:\n';
              errorMessage += '1. ⚠️ INSUFFICIENT SMS BALANCE (most common)\n';
              errorMessage += '2. ⚠️ Invalid phone number format\n';
              errorMessage += '3. ⚠️ School code doesn\'t exist in database\n';
              errorMessage += '4. ⚠️ Backend validation failed\n';
              errorMessage += '5. ⚠️ External SMS API unavailable\n\n';
              errorMessage += 'Check browser console (F12) for detailed error information.';
            }
          } else if (status === 400) {
            errorMessage += 'Invalid request (400).\n\n';
            if (errorData && errorData.message) {
              errorMessage += `Server Message: ${errorData.message}`;
            } else if (errorData && typeof errorData === 'string') {
              errorMessage += `Server Response: ${errorData}`;
            } else if (errorData) {
              errorMessage += `Server Response:\n${JSON.stringify(errorData, null, 2)}`;
            } else {
              errorMessage += 'Please check your message content and contact information.';
            }
          } else if (status === 401) {
            errorMessage += 'Authentication failed. Please log in again.';
          } else if (status === 403) {
            errorMessage += 'You do not have permission to send messages.';
          } else {
            const serverMsg = errorData?.message || errorData?.error || error.serverMessage || `Server returned status ${status}`;
            errorMessage += serverMsg;
          }
          
          toast.error(errorMessage, { timeout: 10000 });
        } else if (error.request) {
          toast.error('Network error: Unable to reach the server. Please check your internet connection.');
        } else {
          toast.error(`Error: ${error.message || 'An unexpected error occurred'}`);
        }
      } finally {
        this.Loading = false;
      }
    },
  },
  mounted() {
    // Fetch schools from backend when component loads
    this.fetchSchools();
    // Load balance on mount
    this.checkBalance();
  },
};
</script>

<style scoped>
* {
  padding: 0;
  margin: 0;
  box-sizing: border-box;
}

.form-wrap {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height:90%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10000;
}

.form-content {
  background-color: #4368b9;
  border-radius: 5px;
  padding: 1rem;
  width: 90%;
  max-width: 800px;
  max-height: 75vh;
  overflow-y: auto;
  box-shadow: 0px 0px 5px gold;
  position: relative;
}

.cancel {
  position: absolute;
  top: 10px;
  right: 10px;
  cursor: pointer;
  color: gold;
  font-size: 1.5rem;
}

.form-title h2 {
  color: gold;
  margin-bottom: 0.5rem;
  text-align: center;
  font-size: 1.3rem;
}

hr {
  border: 1px solid gold;
  margin: 0.5rem 0;
}

.form-inputs {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group {
  position: relative;
  display: flex;
  flex-direction: column;
  margin-bottom: 0.5rem;
}

.section-label {
  color: gold;
  font-size: 0.9rem;
  margin-bottom: 0.3rem;
  font-weight: 600;
  display: block;
}

/* Schools Selection Styles */
.schools-form-group {
  margin-bottom: 0.5rem;
}

.schools-selection-container {
  background-color: #ffffff;
  border: 2px solid gold;
  border-radius: 8px;
  padding: 0.75rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* Search Container */
.search-container {
  position: relative;
  margin-bottom: 0.5rem;
  width: 100%;
}

.search-input {
  width: 100%;
  padding: 0.5rem 0.75rem 0.5rem 2.25rem;
  border: 2px solid gold;
  border-radius: 6px;
  background: #ffffff;
  color: #000000;
  font-size: 0.9rem;
  transition: all 0.3s ease;
}

.search-input:focus {
  outline: none;
  border-color: #4368b9;
  box-shadow: 0 0 0 3px rgba(67, 104, 185, 0.1);
}

.search-icon {
  position: absolute;
  left: 0.875rem;
  top: 50%;
  transform: translateY(-50%);
  color: #4368b9;
  font-size: 1rem;
  pointer-events: none;
}

/* Quick Action Buttons */
.quick-actions {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.quick-btn {
  flex: 1;
  padding: 0.6rem;
  border: 2px solid gold;
  border-radius: 6px;
  background-color: gold;
  color: #4368b9;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 600;
}

.quick-btn:hover {
  background-color: #4368b9;
  color: gold;
  border-color: #4368b9;
}

/* Status Boxes */
.status-box {
  padding: 1.5rem;
  text-align: center;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 500;
  margin-bottom: 1rem;
}

.loading-box {
  background-color: #e3f2fd;
  color: #4368b9;
  border: 2px solid #4368b9;
}

.empty-box {
  background-color: #fff3cd;
  color: #856404;
  border: 2px solid #ffc107;
}

/* Simple Schools List - Clear Visibility */
.simple-schools-list {
  margin-bottom: 1rem;
  background-color: #ffffff;
  border: 2px solid #4368b9;
  border-radius: 4px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border-collapse: collapse;
}

.school-count-header {
  color: #ffffff !important;
  padding: 0.6rem 1rem;
  font-size: 0.95rem;
  text-align: left;
  margin-bottom: 0;
  font-weight: 600;
  background-color: #4368b9;
  border-bottom: 1px solid rgba(255,255,255,0.2);
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 1rem;
  align-items: center;
  border-left: 2px solid #4368b9;
  border-right: 2px solid #4368b9;
  border-top: 2px solid #4368b9;
}

.header-col-select {
  min-width: 70px;
  text-align: center;
}

.select-all-checkbox {
  width: 20px;
  height: 20px;
  cursor: pointer;
  accent-color: #ffffff;
  border: 2px solid #ffffff;
}

.header-col-name {
  flex: 1;
}

.header-col-code {
  min-width: 120px;
  text-align: center;
}

.school-count-info {
  color: #ffffff !important;
  padding: 0.4rem 1rem;
  font-size: 0.85rem;
  text-align: center;
  background-color: #2b4d8a;
  border-bottom: 2px solid #2b4d8a;
  border-left: 2px solid #4368b9;
  border-right: 2px solid #4368b9;
}

.schools-list-inner {
  max-height: 200px !important;
  overflow-y: auto !important;
  overflow-x: hidden !important;
  background-color: #ffffff !important;
  padding: 0 !important;
  margin: 0 !important;
  display: block !important;
  visibility: visible !important;
  border-left: 2px solid #4368b9 !important;
  border-right: 2px solid #4368b9 !important;
  border-bottom: 2px solid #4368b9 !important;
  border-top: none;
}

/* Simple School Item - Clear Visibility with Table Borders */
.simple-school-item {
  padding: 0.5rem 0.75rem !important;
  margin-bottom: 0 !important;
  margin-top: 0 !important;
  background-color: #ffffff !important;
  border-top: 1px solid #cccccc !important;
  border-bottom: 1px solid #cccccc !important;
  border-left: 1px solid #cccccc !important;
  border-right: 1px solid #cccccc !important;
  border-radius: 0;
  transition: all 0.2s ease;
  display: grid !important;
  grid-template-columns: auto 1fr auto;
  gap: 0.75rem;
  width: 100% !important;
  min-height: 40px !important;
  visibility: visible !important;
  opacity: 1 !important;
  position: relative !important;
}

.simple-school-item + .simple-school-item {
  border-top: 1px solid #cccccc !important;
}

.simple-school-item:hover {
  background-color: #f0f7ff;
  border-top: 1px solid #4368b9 !important;
  border-bottom: 1px solid #4368b9 !important;
  border-left: 2px solid #4368b9 !important;
  border-right: 2px solid #4368b9 !important;
}

/* Selected state */
.simple-school-item.item-selected {
  background-color: #e3f2fd;
  border-top: 1px solid #4368b9 !important;
  border-bottom: 1px solid #4368b9 !important;
  border-left: 2px solid #4368b9 !important;
  border-right: 2px solid #4368b9 !important;
}

.simple-school-label {
  display: grid !important;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 1rem;
  cursor: pointer;
  width: 100%;
  color: #000000 !important;
  visibility: visible !important;
  opacity: 1 !important;
}

.simple-checkbox {
  width: 22px !important;
  height: 22px !important;
  cursor: pointer !important;
  accent-color: #4368b9;
  flex-shrink: 0;
  border: 2px solid #4368b9 !important;
  margin: 0 !important;
  padding: 0 !important;
  pointer-events: auto !important;
  z-index: 10 !important;
  position: relative !important;
}

.simple-school-name {
  color: #000000 !important;
  font-size: 1.1rem !important;
  font-weight: 700 !important;
  line-height: 1.6 !important;
  display: block !important;
  visibility: visible !important;
  opacity: 1 !important;
  background-color: transparent !important;
}

.simple-school-code {
  color: #ffffff !important;
  font-size: 0.9rem !important;
  font-weight: 700 !important;
  background-color: #4368b9 !important;
  padding: 0.4rem 0.8rem;
  border-radius: 5px;
  white-space: nowrap;
  display: inline-block !important;
}

.simple-school-label:hover .simple-school-name {
  color: #4368b9;
}

.simple-school-item.item-selected .simple-school-name {
  color: #4368b9;
  font-weight: 700;
}

.simple-school-item.item-selected .simple-school-code {
  background-color: #2b4d8a;
}

.no-schools-message {
  padding: 2rem;
  text-align: center;
  color: #666666;
  font-size: 1rem;
}

/* Custom Scrollbar */
.schools-list-inner::-webkit-scrollbar {
  width: 10px;
}

.schools-list-inner::-webkit-scrollbar-track {
  background: #f0f0f0;
  border-radius: 4px;
}

.schools-list-inner::-webkit-scrollbar-thumb {
  background: #4368b9;
  border-radius: 4px;
  border: 2px solid #f0f0f0;
}

.schools-list-inner::-webkit-scrollbar-thumb:hover {
  background: #2b4d8a;
}

/* Selection Counter */
.selection-counter {
  padding: 0.5rem 1rem;
  background-color: #fff3cd;
  border: 2px solid gold;
  border-radius: 6px;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-size: 0.95rem;
}

.counter-label {
  color: #856404;
  font-weight: 600;
  font-size: 0.95rem;
}

.counter-number {
  font-size: 1.2rem;
  font-weight: 700;
  color: #4368b9;
}

.counter-slash {
  color: #856404;
  font-weight: 600;
  font-size: 0.95rem;
}

.counter-total {
  color: #666666;
  font-weight: 600;
  font-size: 0.95rem;
}

/* Message Input Styles */
.message-input,
.message-textarea {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 2px solid gold;
  border-radius: 6px;
  background-color: #ffffff !important;
  color: #000000 !important;
  font-size: 0.9rem;
  font-family: inherit;
  transition: border-color 0.3s;
  cursor: text !important;
  pointer-events: auto !important;
  -webkit-user-select: text !important;
  user-select: text !important;
  position: relative !important;
  z-index: 100 !important;
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
}

.message-input:disabled,
.message-textarea:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
  opacity: 0.6;
}

.message-input[readonly],
.message-textarea[readonly] {
  background-color: #f5f5f5;
  cursor: not-allowed;
}

.message-input:focus,
.message-textarea:focus {
  outline: none;
  border-color: #4368b9;
  box-shadow: 0 0 0 3px rgba(67, 104, 185, 0.1);
}

.message-textarea {
  min-height: 80px;
  resize: vertical;
  line-height: 1.5;
}

.total-count {
  color: white;
  font-weight: 500;
}

.form-control {
  padding: 0.5rem 0.6rem;
  border: 1px solid gold;
  border-radius: 4px;
  background-color: #fff;
  color: #000;
  font-size: 0.9rem;
  outline: none;
}

.form-control:focus {
  border-color: #fff;
  box-shadow: 0 0 5px rgba(255, 215, 0, 0.5);
}

textarea.form-control {
  resize: vertical;
  min-height: 80px;
  font-family: inherit;
}

label {
  position: absolute;
  left: 0.6rem;
  top: 0.6rem;
  color: #666;
  font-size: 0.9rem;
  pointer-events: none;
  transition: all 0.3s ease;
  background-color: #fff;
  padding: 0 0.3rem;
}

label.filled {
  top: -0.6rem;
  left: 0.3rem;
  font-size: 0.75rem;
  color: gold;
  background-color: #4368b9;
}

/* Preview Section */
.preview-section {
  background-color: rgba(255, 255, 255, 0.95);
  border: 2px solid gold;
  border-radius: 8px;
  padding: 1.25rem;
  margin-top: 0.5rem;
}

.preview-title {
  color: gold;
  margin-bottom: 1rem;
  font-size: 1.1rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.preview-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.preview-row {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #e0e0e0;
}

.preview-row:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.preview-label {
  color: #4368b9;
  font-weight: 700;
  font-size: 0.9rem;
  text-transform: uppercase;
}

.preview-value {
  color: #000000;
  font-weight: 500;
  font-size: 1rem;
}

.preview-message-row {
  gap: 0.5rem;
}

.preview-message-text {
  background-color: #f5f5f5;
  padding: 1rem;
  border-radius: 6px;
  border-left: 4px solid #4368b9;
  margin-top: 0.5rem;
  white-space: pre-wrap;
  line-height: 1.6;
  color: #000000;
  font-size: 0.95rem;
}

.form-actions {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  margin-top: 0.5rem;
}

.form-actions button {
  flex: 1;
  padding: 0.5rem 0.75rem;
  border: 1px solid gold;
  border-radius: 4px;
  background-color: gold;
  color: #000;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 600;
}

.form-actions button:hover:not(:disabled) {
  background-color: #4368b9;
  color: gold;
  border-color: gold;
}

.form-actions button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.form-actions button:first-child {
  background-color: rgba(245, 56, 56, 1);
  border-color: rgba(245, 56, 56, 1);
  color: white;
}

.form-actions button:first-child:hover {
  background-color: #4368b9;
  color: gold;
  border-color: gold;
}

/* Responsive Design */
@media only screen and (max-width: 767px) {
  .form-content {
    width: 95%;
    padding: 1.5rem;
    max-height: 95vh;
  }

  .form-title h2 {
    font-size: 1.2rem;
  }

  .schools-selection {
    max-height: 200px;
  }
}

/* Balance Display Styles */
.balance-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
  padding: 0.5rem;
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  font-size: 0.9rem;
}

.balance-label {
  color: gold;
  font-weight: 600;
}

.balance-value {
  color: white;
  font-weight: 700;
  font-size: 1rem;
}

.balance-value.balance-low {
  color: #ffc107;
}

.balance-value.balance-insufficient {
  color: #ff5252;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

.refresh-balance-btn-small {
  background: transparent;
  border: 1px solid gold;
  color: gold;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  font-size: 0.8rem;
}

.refresh-balance-btn-small:hover:not(:disabled) {
  background-color: gold;
  color: #4368b9;
}

.refresh-balance-btn-small:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.refresh-balance-btn-small .material-symbols-outlined {
  font-size: 1rem;
}

.balance-warning {
  margin-top: 0.5rem;
  padding: 0.5rem;
  background-color: rgba(255, 193, 7, 0.2);
  border: 1px solid #ffc107;
  border-radius: 4px;
  color: #ffc107;
  font-size: 0.85rem;
  font-weight: 600;
  text-align: center;
}
</style>

