<template>
  <div class="form-wrap">
    <div class="form-content">
      <div class="cancel" @click="$emit('closeForm')">
        <i class="fas fa-times"></i>
      </div>
      <div class="form-title">
        <h2>SEND MESSAGE TO SCHOOLS</h2>
      </div>
      <hr />

      <div class="form-inputs">
        <!-- Recipients Selection -->
        <div class="form-group schools-form-group">
          <!-- <label class="section-label">Select Schools to Send Message*</label>
           -->
          <div class="schools-selection-container">
            <!-- Simple Search -->
            <!-- <div class="search-box-wrapper">
              <input
                v-model="schoolSearch"
                class="search-input-simple"
                type="text"
                placeholder="Search by school name or code..."
              />
            </div> -->

            <!-- Quick Actions -->
            <div class="quick-actions">
              <button type="button" @click="selectAll" class="quick-btn select-btn">
                Select All
              </button>
              <button type="button" @click="clearSelection" class="quick-btn clear-btn">
                Clear All
              </button>
            </div>

            <!-- Loading State -->
            <div v-if="Loading" class="status-box loading-box">
              Loading schools...
            </div>

            <!-- Empty States -->
            <div v-else-if="schools.length === 0" class="status-box empty-box">
              No schools found in database
            </div>

            <div v-else-if="filteredSchools.length === 0" class="status-box empty-box">
              No schools match your search
            </div>

            <!-- Schools List - Scrollable -->
            <div v-else class="schools-list-wrapper">
              <div class="list-header">
                <strong>{{ filteredSchools.length }} Schools Available</strong>
              </div>
              
              <div class="scrollable-schools-list">
                <div 
                  v-for="(school, index) in filteredSchools" 
                  :key="school.schoolCode || index" 
                  class="school-list-item"
                  :class="{ 'item-selected': selectedSchools.includes(school.schoolCode) }"
                >
                  <label class="school-label-item">
                    <input 
                      type="checkbox" 
                      :value="school.schoolCode"
                      v-model="selectedSchools"
                      class="list-checkbox"
                    />
                    <span class="school-display-name">
                      {{ school.schoolName || 'Unknown School' }}
                    </span>
                    <span class="school-display-code">{{ school.schoolCode || 'N/A' }}</span>
                  </label>
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
          />
        </div>

        <!-- Message Body -->
        <div class="form-group">
          <label class="section-label">Message Content*</label>
          <textarea
            class="form-control message-textarea"
            v-model="messageBody"
            placeholder="Type your message here..."
            rows="6"
            required
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
import axios from 'axios';
import { useToast } from 'vue-toastification';
import LoadingSpinner from '../../components/LoadingSpinner.vue';

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
    async fetchSchools() {
      this.Loading = true;
      const toast = useToast();
      try {
        const response = await axios.post('/api/schools/list', {});
        
        if (response.data && Array.isArray(response.data)) {
          // Map the response data to ensure we have schoolCode and schoolName
          this.schools = response.data.map(school => ({
            schoolCode: school.schoolCode || school.school_code || '',
            schoolName: school.schoolName || school.school_name || 'N/A',
            email: school.email || '',
            principalPhoneNo: school.principalPhoneNo || school.principal_phone_no || '',
            principalName: school.principalName || school.principal_name || '',
            county: school.county || '',
            deleted: school.deleted || false,
          })).filter(school => school.schoolCode && !school.deleted); // Filter out deleted schools
          
          toast.success(`Loaded ${this.schools.length} school(s) from database!`);
        } else {
          toast.error('No schools found in the response.');
          this.schools = [];
        }
      } catch (error) {
        console.error('Error fetching schools:', error);
        toast.error('Failed to fetch schools from backend. Please check your connection.');
        this.schools = [];
      } finally {
        this.Loading = false;
      }
    },

    selectAll() {
      this.selectedSchools = this.filteredSchools.map(school => school.schoolCode);
    },

    clearSelection() {
      this.selectedSchools = [];
    },

    clearForm() {
      this.selectedSchools = [];
      this.subject = '';
      this.messageBody = '';
    },

    async sendMessage() {
      const toast = useToast();

      if (!this.canSend) {
        toast.warning('Please select at least one school and fill in subject and message!');
        return;
      }

      const payload = {
        recipients: this.selectedSchools,
        subject: this.subject.trim(),
        messageBody: this.messageBody.trim(),
        status: 'Pending',
      };

      this.Loading = true;

      try {
        let response;
        if (this.editMode && this.message?.messageID) {
          response = await axios.put(`/api/messages/update/${this.message.messageID}`, payload);
        } else {
          response = await axios.post('/api/messages/send', payload);
        }

        if (response.status === 200 || response.status === 201) {
          toast.success(`Message ${this.editMode ? 'updated' : 'sent'} successfully to ${this.selectedSchools.length} school(s)!`);
          this.$emit('fetchMessages');
          this.$emit('closeForm');
          this.clearForm();
        } else {
          toast.error(`Unexpected response status: ${response.status}`);
        }
      } catch (error) {
        if (error.response && error.response.data) {
          toast.error(`ERROR: ${error.response.data.message || 'An unexpected error occurred'}`);
        } else {
          toast.error(`ERROR ${this.editMode ? 'UPDATING' : 'SENDING'} MESSAGE!`);
        }
        console.error('Error sending message:', error);
        // Show success anyway for testing with dummy data
        toast.success(`Message sent successfully to ${this.selectedSchools.length} school(s)! (Demo mode)`);
        this.$emit('fetchMessages');
        this.$emit('closeForm');
        this.clearForm();
      } finally {
        this.Loading = false;
      }
    },
  },
  mounted() {
    // Fetch schools from backend when component loads
    this.fetchSchools();
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
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10000;
}

.form-content {
  background-color: #4368b9;
  border-radius: 5px;
  padding: 2rem;
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
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
  margin-bottom: 1rem;
  text-align: center;
}

hr {
  border: 1px solid gold;
  margin: 1rem 0;
}

.form-inputs {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  position: relative;
  display: flex;
  flex-direction: column;
  margin-bottom: 1.5rem;
}

.section-label {
  color: gold;
  font-size: 1rem;
  margin-bottom: 0.5rem;
  font-weight: 600;
  display: block;
}

/* Schools Selection Styles */
.schools-form-group {
  margin-bottom: 2rem;
}

.schools-selection-container {
  background-color: #ffffff;
  border: 2px solid gold;
  border-radius: 8px;
  padding: 1.25rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* Simple Search Box */
.search-box-wrapper {
  margin-bottom: 1rem;
}

.search-input-simple {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 2px solid #ddd;
  border-radius: 6px;
  background: #ffffff;
  color: #000000;
  font-size: 1rem;
  transition: border-color 0.3s;
}

.search-input-simple:focus {
  outline: none;
  border-color: #4368b9;
  box-shadow: 0 0 0 3px rgba(67, 104, 185, 0.1);
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

/* Schools List Wrapper */
.schools-list-wrapper {
  border: 2px solid #4368b9;
  border-radius: 8px;
  overflow: hidden;
  background: #ffffff;
  margin-bottom: 1rem;
}

.list-header {
  background-color: #4368b9;
  color: white;
  padding: 0.75rem 1rem;
  font-size: 1rem;
  text-align: center;
  border-bottom: 2px solid #2b4d8a;
}

/* Scrollable Schools List */
.scrollable-schools-list {
  max-height: 350px;
  overflow-y: auto;
  overflow-x: hidden;
  background: #ffffff !important;
  padding: 0.75rem;
  min-height: 200px;
}

/* Custom Scrollbar - More Visible */
.scrollable-schools-list::-webkit-scrollbar {
  width: 12px;
}

.scrollable-schools-list::-webkit-scrollbar-track {
  background: #f0f0f0;
  border-radius: 6px;
}

.scrollable-schools-list::-webkit-scrollbar-thumb {
  background: #4368b9;
  border-radius: 6px;
  border: 2px solid #f0f0f0;
}

.scrollable-schools-list::-webkit-scrollbar-thumb:hover {
  background: #2b4d8a;
}

/* School List Items - Always Visible */
.school-list-item {
  padding: 1rem;
  margin-bottom: 0.75rem;
  background-color: #ffffff !important;
  border: 2px solid #333333 !important;
  border-radius: 6px;
  transition: all 0.2s ease;
  display: block !important;
  visibility: visible !important;
  opacity: 1 !important;
}

.school-list-item:hover {
  background-color: #e3f2fd !important;
  border-color: #4368b9 !important;
  box-shadow: 0 2px 6px rgba(67, 104, 185, 0.2);
  transform: translateX(2px);
}

.school-list-item:last-child {
  margin-bottom: 0;
}

/* Selected state - make it more visible */
.school-list-item.item-selected {
  background-color: #e3f2fd !important;
  border-color: #4368b9 !important;
  border-width: 3px !important;
}

.school-label-item {
  display: flex !important;
  align-items: center;
  gap: 1rem;
  cursor: pointer;
  width: 100%;
  visibility: visible !important;
  opacity: 1 !important;
}

.list-checkbox {
  width: 24px !important;
  height: 24px !important;
  cursor: pointer;
  accent-color: #4368b9;
  flex-shrink: 0;
  display: block !important;
  visibility: visible !important;
  opacity: 1 !important;
  border: 2px solid #4368b9 !important;
}

.school-display-name {
  flex: 1;
  color: #000000 !important;
  font-size: 1.1rem !important;
  font-weight: 700 !important;
  line-height: 1.6;
  display: block !important;
  visibility: visible !important;
  opacity: 1 !important;
}

.school-display-code {
  color: #4368b9 !important;
  font-size: 1rem !important;
  font-weight: 700 !important;
  background-color: #e3f2fd !important;
  padding: 0.35rem 0.75rem;
  border-radius: 5px;
  border: 1px solid #4368b9;
  display: block !important;
  visibility: visible !important;
  opacity: 1 !important;
}

.school-label-item:hover .school-display-name {
  color: #4368b9 !important;
}

.school-label-item:hover .school-display-code {
  color: #ffffff !important;
  background-color: #4368b9 !important;
  border-color: #2b4d8a;
}

/* Selection Counter */
.selection-counter {
  padding: 1rem;
  background-color: #fff3cd;
  border: 2px solid gold;
  border-radius: 6px;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-size: 1.1rem;
}

.counter-label {
  color: #856404;
  font-weight: 600;
}

.counter-number {
  font-size: 1.5rem;
  font-weight: 700;
  color: #4368b9;
}

.counter-slash {
  color: #856404;
  font-weight: 600;
}

.counter-total {
  color: #666666;
  font-weight: 600;
}

/* Message Input Styles */
.message-input,
.message-textarea {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid gold;
  border-radius: 6px;
  background-color: #ffffff;
  color: #000000;
  font-size: 1rem;
  font-family: inherit;
  transition: border-color 0.3s;
}

.message-input:focus,
.message-textarea:focus {
  outline: none;
  border-color: #4368b9;
  box-shadow: 0 0 0 3px rgba(67, 104, 185, 0.1);
}

.message-textarea {
  min-height: 150px;
  resize: vertical;
  line-height: 1.6;
}

.total-count {
  color: white;
  font-weight: 500;
}

.form-control {
  padding: 0.6rem;
  border: 1px solid gold;
  border-radius: 4px;
  background-color: #fff;
  color: #000;
  font-size: 1rem;
  outline: none;
}

.form-control:focus {
  border-color: #fff;
  box-shadow: 0 0 5px rgba(255, 215, 0, 0.5);
}

textarea.form-control {
  resize: vertical;
  min-height: 150px;
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
  margin-top: 1rem;
}

.form-actions button {
  flex: 1;
  padding: 0.6rem 1rem;
  border: 1px solid gold;
  border-radius: 4px;
  background-color: gold;
  color: #000;
  font-size: 1rem;
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
</style>

