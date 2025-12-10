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
            <option value="" disabled>Select School*</option>
            <option v-for="school in schools" :key="school.schoolCode" :value="school.schoolCode">
              {{ school.schoolName }} ({{ school.schoolCode }})
            </option>
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

        <!-- Invoice Number -->
        <div class="form-group">
          <input 
            type="text" 
            class="form-control" 
            v-model="invoiceNumber" 
            placeholder="Invoice Number" 
            required 
            :disabled="viewMode"
          />
          <label for="invoiceNumber" :class="{ filled: invoiceNumber !== '' }">Invoice Number*</label>
          <small class="invoice-number-hint" v-if="!editMode && !viewMode && invoiceNumber">
            Auto-generated (you can modify if needed)
          </small>
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

        <!-- Description -->
        <div class="form-group">
          <textarea
            class="form-control"
            v-model="description"
            placeholder="Description"
            rows="3"
            :disabled="viewMode"
          ></textarea>
          <label for="description" :class="{ filled: description !== '' }">Description</label>
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
            <option value="Pending">Pending</option>
            <option value="Paid">Paid</option>
            <option value="Partially Paid">Partially Paid</option>
            <option value="Overdue">Overdue</option>
            <option value="Cancelled">Cancelled</option>
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
import axios from 'axios';
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
      invoiceNumber: '',
      invoiceDate: '',
      dueDate: '',
      description: '',
      amount: '',
      status: 'Pending',
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
          this.schoolCode = newInvoice.schoolCode || '';
          this.schoolName = newInvoice.schoolName || '';
          this.invoiceNumber = newInvoice.invoiceNumber || '';
          this.invoiceDate = newInvoice.invoiceDate || '';
          this.dueDate = newInvoice.dueDate || '';
          this.description = newInvoice.description || '';
          this.amount = newInvoice.amount || '';
          this.status = newInvoice.status || 'Pending';
        } else {
          this.editMode = false;
          this.clearForm();
          // Generate invoice number when form is opened for new invoice
          if (!this.viewMode) {
            this.generateInvoiceNumber();
          }
        }
      },
    },
  },
  methods: {
    getStatusClass(status) {
      const stat = status || this.invoice?.status || '';
      if (stat === 'Paid') return 'status-paid';
      if (stat === 'Partially Paid') return 'status-partial';
      if (stat === 'Overdue') return 'status-overdue';
      if (stat === 'Pending') return 'status-pending';
      return '';
    },

    async fetchSchools() {
      try {
        const response = await axios.post('/api/schools/list');
        if (response.data && Array.isArray(response.data)) {
          this.schools = response.data;
        }
      } catch (error) {
        console.error('Error fetching schools:', error);
      }
    },

    async generateInvoiceNumber() {
      // Only generate for new invoices, not when editing
      if (this.editMode) {
        return;
      }

      try {
        // Fetch existing invoices to determine next number
        const response = await axios.post('/api/invoices/list');
        const currentYear = new Date().getFullYear();
        const prefix = `INV-${currentYear}-`;
        
        let maxNumber = 0;

        if (response.data && Array.isArray(response.data)) {
          // Filter invoices for current year and find the highest number
          const currentYearInvoices = response.data.filter(inv => {
            const invNumber = inv.invoiceNumber || inv.invoice_number || '';
            return invNumber.startsWith(prefix);
          });

          // Extract numbers from invoice numbers
          currentYearInvoices.forEach(inv => {
            const invNumber = inv.invoiceNumber || inv.invoice_number || '';
            if (invNumber.startsWith(prefix)) {
              const numberPart = invNumber.replace(prefix, '');
              const num = parseInt(numberPart, 10);
              if (!isNaN(num) && num > maxNumber) {
                maxNumber = num;
              }
            }
          });
        }

        // Generate next invoice number
        const nextNumber = maxNumber + 1;
        this.invoiceNumber = `${prefix}${nextNumber.toString().padStart(3, '0')}`;
      } catch (error) {
        console.error('Error generating invoice number:', error);
        // Fallback: Generate based on current date/time if API fails
        const currentYear = new Date().getFullYear();
        const timestamp = Date.now().toString().slice(-3);
        this.invoiceNumber = `INV-${currentYear}-${timestamp.padStart(3, '0')}`;
      }
    },

    clearForm() {
      this.schoolCode = '';
      this.schoolName = '';
      this.invoiceNumber = '';
      this.invoiceDate = '';
      this.dueDate = '';
      this.description = '';
      this.amount = '';
      this.status = 'Pending';
    },

    async saveInvoice() {
      const toast = useToast();

      if (!this.schoolCode || !this.invoiceNumber || !this.invoiceDate || !this.dueDate || !this.amount) {
        toast.warning('Please fill all required fields!');
        return;
      }

      const payload = {
        schoolCode: this.schoolCode,
        invoiceNumber: this.invoiceNumber,
        invoiceDate: this.invoiceDate,
        dueDate: this.dueDate,
        description: this.description,
        amount: parseFloat(this.amount),
        status: this.status,
      };

      this.Loading = true;

      try {
        let response;
        if (this.editMode && this.invoice?.invoiceID) {
          response = await axios.put(`/api/invoices/update/${this.invoice.invoiceID}`, payload);
        } else {
          response = await axios.post('/api/invoices/create', payload);
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

