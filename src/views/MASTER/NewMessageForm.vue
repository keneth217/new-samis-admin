<template>
  <div class="form-wrap" @click.self="$emit('closeForm')">
    <div class="form-content">
      <button type="button" class="cancel" @click="$emit('closeForm')" aria-label="Close">
        <i class="fas fa-times"></i>
      </button>
      <div class="form-header">
        <h2 class="form-title">Send Message to Schools</h2>
        <p class="form-subtitle">Select schools, add subject and message, then send.</p>
        <!-- Balance Display -->
        <div class="balance-info" v-if="smsBalance !== null">
          <span class="balance-label">SMS Balance:</span>
          <span class="balance-value" :class="{ 'balance-low': smsBalance < 5, 'balance-insufficient': smsBalance < selectedSchools.length }">
            {{ formatBalance(smsBalance) }}
          </span>
          <button type="button" @click="checkBalance" class="refresh-balance-btn-small" :disabled="checkingBalance" title="Refresh Balance">
            <span class="material-symbols-outlined">refresh</span>
          </button>
        </div>
        <div class="balance-warning" v-if="smsBalance !== null && smsBalance < selectedSchools.length">
          <span class="material-symbols-outlined">warning</span>
          Your balance ({{ formatBalance(smsBalance) }}) is less than selected schools ({{ selectedSchools.length }}).
        </div>
      </div>
      <div class="form-divider"></div>

      <div class="form-inputs">
        <!-- Recipients Selection -->
        <div class="form-group schools-form-group">
          <label class="section-label">Select schools to send message</label>
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

            <!-- Schools List - Table -->
            <div v-else class="schools-table-wrap">
              <div class="schools-table-info">{{ filteredSchools.length }} school(s) available</div>
              <div class="schools-table-scroll">
                <table class="schools-table">
                  <thead>
                    <tr>
                      <th class="col-select">
                        <input
                          type="checkbox"
                          :checked="selectAllChecked"
                          @change="toggleSelectAll"
                          class="select-all-checkbox"
                          aria-label="Select all"
                        />
                      </th>
                      <th class="col-name">School Name</th>
                      <th class="col-code">School Code</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="(school, index) in filteredSchools"
                      :key="school.schoolCode || index"
                      :class="{ 'row-selected': selectedSchools.includes(school.schoolCode) }"
                      @click="toggleSchoolRow(school.schoolCode)"
                    >
                      <td class="col-select">
                        <input
                          type="checkbox"
                          :value="school.schoolCode"
                          v-model="selectedSchools"
                          class="row-checkbox"
                          :aria-label="'Select ' + (school.schoolName || school.schoolCode)"
                          @click.stop
                        />
                      </td>
                      <td class="col-name">{{ school.schoolName || 'Unknown School' }}</td>
                      <td class="col-code">{{ school.schoolCode || 'N/A' }}</td>
                    </tr>
                  </tbody>
                </table>
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
            <h3 class="preview-title"><span class="material-symbols-outlined">preview</span> Message Preview</h3>
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

      <div class="form-divider"></div>
      <div class="form-actions">
        <button type="button" class="btn-cancel" @click="$emit('closeForm')">Cancel</button>
        <button type="button" class="btn-send" @click="sendMessage" :disabled="!canSend">
          <span class="material-symbols-outlined">send</span>
          Send Message
        </button>
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
        const filteredCodes = this.filteredSchools.map(school => school.schoolCode);
        filteredCodes.forEach(code => {
          if (!this.selectedSchools.includes(code)) {
            this.selectedSchools.push(code);
          }
        });
      } else {
        const filteredCodes = this.filteredSchools.map(school => school.schoolCode);
        this.selectedSchools = this.selectedSchools.filter(code => !filteredCodes.includes(code));
      }
    },

    toggleSchoolRow(schoolCode) {
      const idx = this.selectedSchools.indexOf(schoolCode);
      if (idx === -1) {
        this.selectedSchools.push(schoolCode);
      } else {
        this.selectedSchools.splice(idx, 1);
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
        console.error('Send message failed:', error.response?.status, error.response?.data, error.serverMessage || error.message);

        // Handle different error types
        if (error.response) {
          const status = error.response.status;
          const errorData = error.response.data;
          const isSingleMessage = finalContacts.length === 1;
          
          let errorMessage = `Failed to send ${isSingleMessage ? 'message' : 'bulk messages'}. `;
          
          if (status === 500) {
            errorMessage += `Server error (500) - ${isSingleMessage ? 'Single' : 'Bulk'} message failed.\n\n`;
            if (error.serverMessage) {
              errorMessage += `${error.serverMessage}\n\n`;
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
  height: 100%;
  min-height: 100vh;
  background-color: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(4px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10000;
  padding: 1rem;
}

.form-content {
  background: linear-gradient(180deg, #4368b9 0%, #2b4d8a 100%);
  border-radius: 12px;
  padding: 0;
  width: 100%;
  max-width: 720px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(255, 215, 0, 0.15);
  position: relative;
}

.form-content::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, gold, #ffd700, gold);
  border-radius: 12px 12px 0 0;
}

.cancel {
  position: absolute;
  top: 1rem;
  right: 1rem;
  width: 40px;
  height: 40px;
  border: none;
  background: rgba(255, 255, 255, 0.12);
  color: gold;
  font-size: 1.25rem;
  cursor: pointer;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.25s ease;
  z-index: 5;
}

.cancel:hover {
  background: rgba(255, 215, 0, 0.25);
  color: #fff;
  transform: scale(1.05);
}

.form-header {
  padding: 1.5rem 1.5rem 1rem;
  padding-right: 3rem;
}

.form-title {
  color: #fff;
  margin: 0 0 0.25rem 0;
  font-size: clamp(1.25rem, 2.5vw, 1.5rem);
  font-weight: 700;
  letter-spacing: 0.02em;
  text-align: center;
}

.form-subtitle {
  color: rgba(255, 255, 255, 0.85);
  font-size: 0.9rem;
  text-align: center;
  margin: 0 0 1rem 0;
}

.form-divider {
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255, 215, 0, 0.4), transparent);
  margin: 0 1rem;
}

.form-inputs {
  flex: 1;
  overflow-y: auto;
  padding: 1rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  position: relative;
  display: flex;
  flex-direction: column;
  margin-bottom: 0;
}

.section-label {
  color: rgba(255, 255, 255, 0.95);
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
  font-weight: 600;
  display: block;
  letter-spacing: 0.02em;
}

/* Schools Selection Styles */
.schools-form-group {
  margin-bottom: 0.5rem;
}

.schools-selection-container {
  background-color: #ffffff;
  border: 2px solid rgba(255, 215, 0, 0.6);
  border-radius: 8px;
  padding: 0.5rem 0.75rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

/* Search Container */
.search-container {
  position: relative;
  margin-bottom: 0.4rem;
  width: 100%;
}

.search-input {
  width: 100%;
  padding: 0.4rem 0.5rem 0.4rem 2rem;
  border: 1px solid rgba(255, 215, 0, 0.7);
  border-radius: 5px;
  background: #fff;
  color: #000;
  font-size: 0.875rem;
  transition: border-color 0.2s ease;
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

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Status Boxes */
.status-box {
  padding: 1.5rem;
  text-align: center;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
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

/* Schools list - table */
.schools-table-wrap {
  margin-bottom: 0.5rem;
  background: #fff;
  border: 1px solid #4368b9;
  border-radius: 6px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.schools-table-info {
  padding: 0.35rem 0.6rem;
  font-size: 0.8rem;
  color: #2b4d8a;
  background: #e8eef7;
  border-bottom: 1px solid #d0dcee;
  font-weight: 600;
}

.schools-table-scroll {
  max-height: 200px;
  overflow-y: auto;
  overflow-x: auto;
}

.schools-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
  table-layout: fixed;
}

.schools-table thead {
  position: sticky;
  top: 0;
  z-index: 1;
  background: #4368b9;
  color: #fff;
}

.schools-table th {
  padding: 0.4rem 0.5rem;
  text-align: left;
  font-weight: 600;
  border-bottom: 1px solid rgba(255, 255, 255, 0.25);
  white-space: nowrap;
}

.schools-table th.col-select {
  width: 2.5rem;
  min-width: 2.5rem;
  text-align: center;
  padding: 0.35rem;
}

.schools-table th.col-name {
  width: auto;
}

.schools-table th.col-code {
  width: 7rem;
  min-width: 7rem;
  text-align: center;
}

.schools-table tbody tr {
  border-bottom: 1px solid #e0e4ea;
  cursor: pointer;
  transition: background 0.15s ease;
}

.schools-table tbody tr:hover {
  background: #f0f4fb;
}

.schools-table tbody tr.row-selected {
  background: #e3f2fd;
  border-left: 3px solid #4368b9;
}

.schools-table td {
  padding: 0.35rem 0.5rem;
  vertical-align: middle;
  border-bottom: 1px solid #eee;
}

.schools-table td.col-select {
  text-align: center;
  padding: 0.3rem 0.4rem;
}

.schools-table td.col-name {
  font-weight: 500;
  color: #333;
  word-break: break-word;
}

.schools-table td.col-code {
  text-align: center;
  font-weight: 600;
  color: #4368b9;
  font-size: 0.8rem;
  white-space: nowrap;
}

.select-all-checkbox,
.row-checkbox {
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: #4368b9;
  margin: 0;
  vertical-align: middle;
}

.select-all-checkbox {
  accent-color: #fff;
}

.no-schools-message {
  padding: 1.25rem 0.5rem;
  text-align: center;
  color: #666;
  font-size: 0.9rem;
}

.schools-table-scroll::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.schools-table-scroll::-webkit-scrollbar-track {
  background: #f0f0f0;
  border-radius: 4px;
}

.schools-table-scroll::-webkit-scrollbar-thumb {
  background: #4368b9;
  border-radius: 4px;
}

.schools-table-scroll::-webkit-scrollbar-thumb:hover {
  background: #2b4d8a;
}

/* Selection Counter */
.selection-counter {
  padding: 0.4rem 0.75rem;
  background: linear-gradient(135deg, #fff8e1 0%, #ffecb3 100%);
  border: 1px solid rgba(255, 193, 7, 0.6);
  border-radius: 6px;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  font-size: 0.875rem;
  margin-top: 0.4rem;
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

/* Section labels only (not floating labels) */
.form-group > .section-label {
  position: static;
  background: transparent;
  padding: 0;
}

/* Preview Section */
.preview-section {
  background-color: rgba(255, 255, 255, 0.98);
  border: 2px solid rgba(255, 215, 0, 0.5);
  border-radius: 10px;
  padding: 1.25rem;
  margin-top: 0.25rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.preview-title {
  color: #2b4d8a;
  margin-bottom: 1rem;
  font-size: 1.05rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.preview-title .material-symbols-outlined {
  font-size: 1.25rem;
  color: #4368b9;
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
  justify-content: center;
  gap: 1rem;
  padding: 1.25rem 1.5rem;
  background: rgba(0, 0, 0, 0.1);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  flex-shrink: 0;
}

.form-actions .btn-cancel,
.form-actions .btn-send {
  min-width: 120px;
  padding: 0.6rem 1.5rem;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  border: 2px solid transparent;
}

.form-actions .btn-cancel {
  background-color: rgba(255, 255, 255, 0.2);
  color: #fff;
  border-color: rgba(255, 255, 255, 0.35);
}

.form-actions .btn-cancel:hover {
  background-color: rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.5);
  transform: translateY(-1px);
}

.form-actions .btn-send {
  background: linear-gradient(135deg, gold 0%, #ffc107 100%);
  color: #1a237e;
  border-color: gold;
  box-shadow: 0 2px 8px rgba(255, 215, 0, 0.35);
}

.form-actions .btn-send:hover:not(:disabled) {
  background: linear-gradient(135deg, #ffd700 0%, #ffb300 100%);
  color: #0d1442;
  transform: translateY(-1px);
  box-shadow: 0 4px 14px rgba(255, 215, 0, 0.45);
}

.form-actions .btn-send:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.form-actions .btn-send .material-symbols-outlined {
  font-size: 1.2rem;
}

/* Responsive Design */
@media only screen and (max-width: 767px) {
  .form-wrap {
    padding: 0.5rem;
    align-items: flex-start;
  }

  .form-content {
    width: 100%;
    max-width: 100%;
    max-height: 95vh;
    border-radius: 10px;
  }

  .form-header {
    padding: 1.25rem 1rem 0.75rem;
    padding-right: 2.75rem;
  }

  .form-title {
    font-size: 1.2rem;
  }

  .form-subtitle {
    font-size: 0.85rem;
  }

  .form-inputs {
    padding: 0.75rem 1rem;
    gap: 0.75rem;
  }

  .form-actions {
    padding: 1rem;
    flex-wrap: wrap;
  }

  .form-actions .btn-cancel,
  .form-actions .btn-send {
    min-width: 100px;
    padding: 0.55rem 1.2rem;
    font-size: 0.9rem;
  }
}

/* Balance Display Styles */
.balance-info {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin-top: 0.75rem;
  padding: 0.6rem 1rem;
  background-color: rgba(255, 255, 255, 0.12);
  border-radius: 8px;
  font-size: 0.9rem;
  border: 1px solid rgba(255, 255, 255, 0.15);
  justify-content: center;
  flex-wrap: wrap;
}

.balance-label {
  color: rgba(255, 215, 0, 0.95);
  font-weight: 600;
}

.balance-value {
  color: #fff;
  font-weight: 700;
  font-size: 1.05rem;
}

.balance-value.balance-low {
  color: #ffc107;
}

.balance-value.balance-insufficient {
  color: #ff8a80;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.75; }
}

.refresh-balance-btn-small {
  background: rgba(255, 215, 0, 0.15);
  border: 1px solid gold;
  color: gold;
  padding: 0.3rem 0.6rem;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.25s ease;
  font-size: 0.85rem;
}

.refresh-balance-btn-small:hover:not(:disabled) {
  background: gold;
  color: #2b4d8a;
  transform: scale(1.05);
}

.refresh-balance-btn-small:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.refresh-balance-btn-small .material-symbols-outlined {
  font-size: 1rem;
}

.balance-warning {
  margin-top: 0.75rem;
  padding: 0.6rem 1rem;
  background-color: rgba(255, 193, 7, 0.18);
  border: 1px solid rgba(255, 193, 7, 0.6);
  border-radius: 8px;
  color: #ffeb3b;
  font-size: 0.85rem;
  font-weight: 600;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.balance-warning .material-symbols-outlined {
  font-size: 1.2rem;
  flex-shrink: 0;
}
</style>

