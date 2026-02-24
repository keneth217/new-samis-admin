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
            <!-- Edit/Create Mode: Dropdown -->
            <select
              v-else
              class="form-control"
              v-model="schoolCode"
              required
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
              <div class="view-value school-code-text">
                {{ invoice?.schoolCode || schoolCode || 'N/A' }}
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
  
          <!-- Invoice Number (read-only, server generated) -->
          <div class="form-group">
            <div class="view-mode-text-display">
              <div class="view-label">Invoice Number</div>
              <div class="view-value">
                {{ invoiceNo || 'Will be generated automatically after saving' }}
              </div>
            </div>
          </div>
  
          <!-- Description -->
          <div class="form-group">
            <textarea
              class="form-control"
              v-model="description"
              placeholder="Description"
              rows="2"
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
      selectedSchoolName() {
        const s = this.schools.find(sch => sch.schoolCode === this.schoolCode);
        return s ? (s.schoolName || '') : (this.schoolName || '');
      },
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
    background-color: rgba(17, 167, 167, 0.5);
    width: 100%;
    height: 100%;
    position: fixed;
    top: 0;
    left: 0;
    z-index: 1001;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .form-content {
    background-color: #4368b9;
    border-radius: 5px;
    padding: 20px;
    box-shadow: 0px 0px 5px gold;
    width: 90%;
    max-width: 500px;
    max-height: 90%;
    overflow-y: auto;
    position: relative;
  }
  
  .cancel {
    position: absolute;
    top: 10px;
    right: 10px;
    cursor: pointer;
    color: gold;
    font-size: 1.3rem;
  }
  
  .form-title {
    color: gold;
    text-align: center;
  }
  
  .form-inputs {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.65rem;
    padding-top: 6px;
  }
  
  .form-group {
    position: relative;
  }
  
  .form-control {
    border: 1px solid gold;
    outline: none;
    padding: 0.3rem;
    border-radius: 4px;
    font-size: 1rem;
    width: 100%;
    box-sizing: border-box;
    background-color: #4368b9;
    color: white;
  }
  
  .form-control::placeholder {
    color: rgba(255, 255, 255, 0.7);
    font-size: 0.9rem;
  }
  
  .form-control:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  textarea.form-control {
    resize: vertical;
    min-height: 80px;
  }
  
  label {
    position: absolute;
    top: 50%;
    left: 4px;
    background: #4368b9;
    padding: 0 5px;
    transform: translateY(-50%);
    transition: all 0.3s ease;
    color: gold;
    pointer-events: none;
  }
  
  label.filled {
    top: -1px;
    left: 5px;
    color: gold;
    font-size: 0.95rem;
    font-weight: 600;
  }
  
  .form-group input:focus + label,
  .form-group input:not(:placeholder-shown) + label {
    top: -1px;
    left: 5px;
    color: gold;
    font-size: 0.95rem;
    font-weight: 600;
  }
  
  .form-group select:focus + label,
  .form-group select:not([value=""]) + label {
    top: -1px;
    left: 5px;
    color: gold;
    font-size: 0.95rem;
    font-weight: 600;
  }
  
  .form-group textarea:focus + label,
  .form-group textarea:not(:placeholder-shown) + label {
    top: -1px;
    left: 5px;
    color: gold;
    font-size: 0.95rem;
    font-weight: 600;
  }
  
  /* View Mode Text Display - Keep these styles for invoice view mode */
  .view-mode-text-display {
    padding: 0.8rem 0.6rem;
    background-color: rgba(255, 255, 255, 0.1);
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
    color: white;
    font-weight: 500;
    padding-top: 0.25rem;
  }
  
  .selected-school-reflect {
    margin-top: 0.35rem;
    padding: 0.25rem 0.5rem;
    font-size: 0.85rem;
    background: rgba(255, 215, 0, 0.15);
    border-radius: 4px;
    border: 1px solid rgba(255, 215, 0, 0.4);
    line-height: 1.3;
    color: rgba(255, 255, 255, 0.95);
  }
  .selected-school-reflect .reflect-label {
    color: gold;
    font-weight: 600;
  }
  .selected-school-reflect .reflect-value {
    color: white;
    font-weight: 700;
  }
  .selected-school-reflect .reflect-name {
    color: rgba(255, 255, 255, 0.9);
  }
  
  .school-code-text {
    color: gold !important;
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
  
  .form-actions {
    display: flex;
    justify-content: space-between;
  }
  
  .form-actions button {
    padding: 0.3rem 1rem;
    border: none;
    cursor: pointer;
    border-radius: 4px;
  }
  
  .form-actions button:first-child {
    font-size: medium;
    background: rgba(245, 56, 56, 1);
    border: 1px solid rgba(245, 56, 56, 1);
    color: black;
  }
  
  .form-actions button:first-child:hover {
    background-color: #4368b9;
    color: white;
  }
  
  .form-actions button:last-child {
    font-size: medium;
    background: gold;
    border: 1px solid gold;
    color: black;
  }
  
  .form-actions button:last-child:hover {
    background-color: #4368b9;
    color: white;
  }
  
  hr {
    border: 1px solid gold;
    margin: 20px 0;
  }
  
  @media only screen and (max-width: 767px) {
    .form-content {
      width: 95%;
      max-width: 100%;
      padding: 15px;
    }
  
    .form-inputs {
      grid-template-columns: 1fr;
      gap: 0.9rem;
    }
  }
  </style>
  