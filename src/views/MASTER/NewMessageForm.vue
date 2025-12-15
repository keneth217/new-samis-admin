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
    async fetchSchools() {
      this.Loading = true;
      const toast = useToast();
      try {
        const response = await axios.post('/schools/list', {});
        
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

    async sendMessage() {
      const toast = useToast();

      if (!this.canSend) {
        toast.warning('Please select at least one school and fill in subject and message!');
        return;
      }

      // Build contacts list for /messages/sendbulk
      const contacts = this.selectedSchools
        .map(code => this.schools.find(s => s.schoolCode === code))
        .filter(Boolean)
        .map(school => ({
          contactName: school.schoolName || '',
          designation: school.principalName || '',
          email: school.email || '',
          phoneNo: school.principalPhoneNo || school.phoneNo || '',
          schoolCode: school.schoolCode,
        }));

      if (contacts.length === 0) {
        toast.error('No valid contacts found for selected schools.');
        return;
      }

      const payload = {
        message: `${this.subject.trim()}\n\n${this.messageBody.trim()}`,
        contacts,
      };

      this.Loading = true;

      try {
        const response = await axios.post('/messages/sendbulk', payload);

        if (response.status === 200 || response.status === 201) {
          toast.success(`Message sent successfully to ${this.selectedSchools.length} school(s)!`);
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
          toast.error('ERROR SENDING MESSAGE!');
        }
        console.error('Error sending message:', error);
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
</style>

