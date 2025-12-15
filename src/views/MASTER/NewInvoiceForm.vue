<template>
  <div class="form-wrap">
    <div class="form-content">
      <div class="cancel" @click="$emit('closeForm')">
        <i class="fas fa-times"></i>
      </div>
      <div class="form-title">
        <h2>{{ viewMode ? 'VIEW INVOICE' : (editMode ? 'EDIT INVOICE' : 'NEW INVOICE') }}</h2>
      </div>
      <hr />

      <div class="form-inputs">
        <!-- School Selection -->
        <div class="form-group">
          <!-- View Mode: Show as plain text -->
          <div v-if="viewMode" class="view-mode-text-display">
            <div class="view-label">School Name:</div>
            <div class="view-value">{{ invoice?.schoolName || schoolName || 'N/A' }}</div>
          </div>
          <!-- Edit/Create Mode: Show dropdown -->
          <select 
            v-else
            class="form-control" 
            v-model="schoolCode" 
            required
            :disabled="editMode"
            id="schoolCode"
          >
            <option value="" disabled>{{ schools.length > 0 ? 'Select School*' : 'Loading schools...' }}</option>
            <option v-for="school in schools" :key="school.schoolCode" :value="school.schoolCode">
              {{ school.schoolName }} ({{ school.schoolCode }})
            </option>
            <option v-if="schools.length === 0 && !Loading" value="" disabled>No schools available</option>
          </select>
          <label v-if="!viewMode" for="schoolCode" :class="{ filled: schoolCode !== '' }">School*</label>
        </div>
        
        <!-- School Code Display (in view mode only) -->
        <div class="form-group" v-if="viewMode">
          <div class="view-mode-text-display">
            <div class="view-label">School Code:</div>
            <div class="view-value school-code-text">{{ invoice?.schoolCode || schoolCode || 'N/A' }}</div>
          </div>
        </div>

        <!-- Invoice Number (read-only, server generated) -->
        <div class="form-group">
          <div class="view-mode-text-display">
            <div class="view-label">Invoice Number</div>
            <div class="view-value">
              {{ invoiceNo || 'Will be generated automatically after saving' }}
            </div>
          </div>
        </div>

        <!-- Invoice Date -->
        <div class="form-group">
          <input 
            type="date" 
            class="form-control" 
            v-model="invoiceDate" 
            placeholder="Invoice Date" 
            required 
            :disabled="viewMode"
          />
          <label for="invoiceDate" :class="{ filled: invoiceDate !== '' }">Invoice Date*</label>
        </div>

        <!-- Due Date -->
        <div class="form-group">
          <input 
            type="date" 
            class="form-control" 
            v-model="dueDate" 
            placeholder="Due Date" 
            required 
            :disabled="viewMode"
          />
          <label for="dueDate" :class="{ filled: dueDate !== '' }">Due Date*</label>
        </div>

        <!-- Invoice Type -->
        <div class="form-group">
          <!-- View Mode: Show as plain text -->
          <div v-if="viewMode" class="view-mode-text-display">
            <div class="view-label">Invoice Type:</div>
            <div class="view-value">{{ invoiceType || invoice?.invoiceType || 'N/A' }}</div>
          </div>
          <!-- Edit/Create Mode: Show dropdown -->
          <select v-else class="form-control" v-model="invoiceType" required>
            <option value="TUITION">TUITION</option>
            <option value="FEES">FEES</option>
            <option value="SUBSCRIPTION">SUBSCRIPTION</option>
            <option value="OTHER">OTHER</option>
          </select>
          <label v-if="!viewMode" for="invoiceType" :class="{ filled: invoiceType !== '' }">Invoice Type*</label>
        </div>

        <!-- Description -->
        <div class="form-group">
          <textarea
            class="form-control"
            v-model="description"
            placeholder="Description"
            rows="3"
            :disabled="viewMode"
          ></textarea>
          <label for="description" :class="{ filled: description !== '' }">Description*</label>
        </div>

        <!-- Amount -->
        <div class="form-group">
          <input 
            type="number" 
            class="form-control" 
            v-model="amount" 
            placeholder="Amount" 
            step="0.01"
            min="0"
            required 
            :disabled="viewMode"
          />
          <label for="amount" :class="{ filled: amount !== '' }">Amount (KSh)*</label>
        </div>

        <!-- Discount -->
        <div class="form-group">
          <input 
            type="number" 
            class="form-control" 
            v-model="discount" 
            placeholder="Discount" 
            step="0.01"
            min="0"
            :disabled="viewMode"
          />
          <label for="discount" :class="{ filled: discount !== '' }">Discount (KSh)</label>
        </div>

        <!-- Status -->
        <div class="form-group">
          <!-- View Mode: Show as plain text -->
          <div v-if="viewMode" class="view-mode-text-display">
            <div class="view-label">Status:</div>
            <div class="view-value status-text" :class="getStatusClass(status)">
              {{ status || invoice?.status || 'N/A' }}
            </div>
          </div>
          <!-- Edit/Create Mode: Show dropdown -->
          <select v-else class="form-control" v-model="status" required>
            <option value="PENDING">PENDING</option>
            <option value="PAID">PAID</option>
            <option value="PARTIALLY_PAID">PARTIALLY PAID</option>
            <option value="OVERDUE">OVERDUE</option>
          </select>
          <label v-if="!viewMode" for="status" :class="{ filled: status !== '' }">Status*</label>
        </div>
      </div>
      <hr />
      <div class="form-actions">
        <button @click="$emit('closeForm')">{{ viewMode ? 'Close' : 'Close' }}</button>
        <button @click="saveInvoice" v-if="!viewMode">{{ editMode ? 'Update' : 'Create' }}</button>
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
  name: 'NewInvoiceForm',
  components: { LoadingSpinner },
  props: {
    invoice: {
      type: Object,
      default: null,
    },
    viewMode: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      schoolCode: '',
        invoiceNo: '',
      invoiceNumber: '',
      invoiceDate: '',
      dueDate: '',
      invoiceType: 'TUITION',
      description: '',
      amount: '',
      discount: 0,
      status: 'PENDING',
      schools: [],
      Loading: false,
      editMode: false,
      schoolName: '',
    };
  },
  computed: {
    schoolDisplayText() {
      if (this.viewMode) {
        // In view mode, always show from invoice prop first, then fallback to data
        const invoiceObj = this.invoice || {};
        const name = String(invoiceObj.schoolName || this.schoolName || '').trim();
        const code = String(invoiceObj.schoolCode || this.schoolCode || '').trim();
        
        // Return formatted string
        if (name && code && name !== 'N/A' && code !== 'N/A') {
          return `${name} (${code})`;
        } else if (name && name !== 'N/A') {
          return name;
        } else if (code && code !== 'N/A') {
          return code;
        }
        // Fallback - show what we have
        return name || code || '';
      }
      // Not in view mode, return empty
      return '';
    },
  },
  watch: {
    invoice: {
      immediate: true,
      handler(newInvoice) {
        if (newInvoice) {
          // Only set editMode if not in viewMode
          this.editMode = !this.viewMode && true;
          this.invoiceNo = newInvoice.invoiceNo || newInvoice.invoiceNumber || '';
          this.schoolCode = newInvoice.schoolCode || '';
          this.schoolName = newInvoice.schoolName || '';
          this.invoiceNumber = newInvoice.invoiceNumber || newInvoice.invoiceNo || '';
          this.invoiceDate = newInvoice.invoiceDate || '';
          this.dueDate = newInvoice.dueDate || '';
          this.invoiceType = newInvoice.invoiceType || 'TUITION';
          this.description = newInvoice.description || '';
          this.amount = newInvoice.amount || '';
          this.discount = newInvoice.discount || 0;
          this.status = newInvoice.status || 'PENDING';
        } else {
          this.editMode = false;
          this.clearForm();
        }
      },
    },
  },
  methods: {
    getStatusClass(status) {
      const stat = (status || this.invoice?.status || '').toUpperCase();
      if (stat === 'PAID') return 'status-paid';
      if (stat === 'PARTIALLY_PAID' || stat === 'PARTIALLY PAID') return 'status-partial';
      if (stat === 'OVERDUE') return 'status-overdue';
      if (stat === 'PENDING') return 'status-pending';
      return '';
    },

    async fetchSchools() {
      this.Loading = true;
      const toast = useToast();
      try {
        const response = await axios.post('/schools/list', {});
        
        console.log('Schools API Response:', response.data);
        
        if (response.data && Array.isArray(response.data)) {
          // Map the response data to ensure we have schoolCode and schoolName
          const mappedSchools = response.data.map(school => ({
            schoolCode: school.schoolCode || school.school_code || '',
            schoolName: school.schoolName || school.school_name || 'N/A',
            deleted: school.deleted || false,
          }));
          
          // Filter out deleted schools and invalid entries (only filter if deleted is explicitly true)
          this.schools = mappedSchools.filter(school => {
            const isValid = school.schoolCode && school.schoolCode.trim() !== '';
            const isNotDeleted = school.deleted !== true;
            return isValid && isNotDeleted;
          });
          
          console.log('Mapped schools:', mappedSchools);
          console.log('Filtered schools (final):', this.schools);
          
          if (this.schools.length > 0) {
            toast.success(`Loaded ${this.schools.length} school(s)`);
          } else {
            toast.warning('No active schools found.');
          }
        } else {
          console.warn('Unexpected response format:', response.data);
          toast.warning('No schools found in the response.');
          this.schools = [];
        }
      } catch (error) {
        console.error('Error fetching schools:', error);
        console.error('Error details:', error.response?.data || error.message);
        toast.error('Failed to fetch schools. Please try again.');
        this.schools = [];
      } finally {
        this.Loading = false;
      }
    },

    clearForm() {
      this.schoolCode = '';
      this.schoolName = '';
      this.invoiceNo = '';
      this.invoiceNumber = '';
      this.invoiceDate = '';
      this.dueDate = '';
      this.invoiceType = 'TUITION';
      this.description = '';
      this.amount = '';
      this.discount = 0;
      this.status = 'PENDING';
    },

    async saveInvoice() {
      const toast = useToast();

      if (!this.schoolCode || !this.invoiceDate || !this.invoiceType || !this.description || !this.amount) {
        toast.warning('Please fill all required fields!');
        return;
      }

      const amountValue = parseFloat(this.amount) || 0;
      const discountValue = parseFloat(this.discount) || 0;
      const balance = amountValue - discountValue;

      if (this.editMode && !this.invoiceNo) {
        toast.warning('Missing invoice number. Please reopen the invoice and try again.');
        return;
      }

      // Build InvoiceDAO payload according to API specification
      // Note: invoiceNumber is NOT in the request body - it's only used in URL for updates
      const payload = {
        invoiceType: this.invoiceType,
        invoiceDate: this.invoiceDate,
        amount: amountValue,
        status: this.status,
        paid: 0.0,
        balance: balance,
        discount: discountValue,
        deleted: false,
        schoolCode: this.schoolCode,
        invoiceDetails: [
          {
            detailID: null,
            description: this.description,
            amount: amountValue,
            discount: discountValue,
            paid: 0.0,
            balance: balance,
            status: this.status,
            deleted: false
          }
        ]
      };

      this.Loading = true;

      try {
        let response;
        if (this.editMode && this.invoiceNo) {
          // Update: POST /invoices/update/{invoiceNo}
          response = await axios.post(`/invoices/update/${this.invoiceNo}`, payload);
        } else {
          // Create: POST /invoices/create
          response = await axios.post('/invoices/create', payload);
        }

        if (response.status === 200 || response.status === 201) {
          toast.success(`Invoice ${this.editMode ? 'updated' : 'created'} successfully!`);
          this.$emit('fetchInvoices');
          this.$emit('closeForm');
          this.clearForm();
        } else {
          toast.error(`Unexpected response status: ${response.status}`);
        }
      } catch (error) {
        if (error.response && error.response.data) {
          toast.error(`ERROR: ${error.response.data.message || 'An unexpected error occurred'}`);
        } else {
          toast.error(`ERROR ${this.editMode ? 'UPDATING' : 'CREATING'} INVOICE!`);
        }
        console.error('Error saving invoice:', error);
      } finally {
        this.Loading = false;
      }
    },
  },
  mounted() {
    this.fetchSchools();
    // Invoice number is auto-generated by watch handler when form opens
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
  max-width: 600px;
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
}

.form-control {
  padding: 0.6rem;
  padding-top: 0.8rem;
  border: 1px solid gold;
  border-radius: 4px;
  background-color: #fff;
  color: #000;
  font-size: 1rem;
  outline: none;
}

.form-control[readonly] {
  padding-top: 0.8rem;
}

.form-control:focus {
  border-color: #fff;
  box-shadow: 0 0 5px rgba(255, 215, 0, 0.5);
}

.form-control:disabled,
.form-control[readonly] {
  background-color: #e0e0e0;
  cursor: not-allowed;
  color: #000 !important;
  opacity: 1;
  -webkit-text-fill-color: #000 !important;
}

.form-control[readonly] {
  background-color: #f5f5f5 !important;
  cursor: default;
  color: #000 !important;
  opacity: 1 !important;
  -webkit-text-fill-color: #000 !important;
}

.view-mode-input {
  background-color: #f5f5f5 !important;
  color: #000 !important;
  padding-top: 0.8rem !important;
  padding-left: 0.6rem !important;
  font-weight: 500 !important;
  opacity: 1 !important;
  -webkit-text-fill-color: #000 !important;
}

.school-code-display {
  color: #2b7ab7 !important;
  font-weight: 600 !important;
  -webkit-text-fill-color: #2b7ab7 !important;
}

textarea.form-control {
  resize: vertical;
  min-height: 80px;
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

.invoice-number-hint {
  display: block;
  margin-top: 0.25rem;
  font-size: 0.75rem;
  color: #fff;
  font-style: italic;
}

/* View Mode Text Display */
.view-mode-text-display {
  padding: 0.8rem 0.6rem;
  background-color: #f5f5f5;
  border: 1px solid gold;
  border-radius: 4px;
  min-height: 2.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.view-label {
  font-size: 0.75rem;
  color: gold;
  font-weight: 600;
  text-transform: uppercase;
}

.view-value {
  font-size: 1rem;
  color: #000;
  font-weight: 500;
  padding-top: 0.25rem;
}

.school-code-text {
  color: #2b7ab7 !important;
  font-weight: 700;
  font-size: 1.1rem;
}

.status-text {
  font-weight: 600;
  font-size: 1rem;
}

.status-paid {
  color: #28a745 !important;
}

.status-partial {
  color: #ffc107 !important;
}

.status-overdue {
  color: #dc3545 !important;
}

.status-pending {
  color: #17a2b8 !important;
}

.form-control:focus + label,
.form-control:not(:placeholder-shown) + label {
  top: -0.6rem;
  left: 0.3rem;
  font-size: 0.75rem;
  color: gold;
  background-color: #4368b9;
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
}

.form-actions button:hover {
  background-color: #4368b9;
  color: gold;
  border-color: gold;
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
}
</style>

