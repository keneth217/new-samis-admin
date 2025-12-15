<template>
  <div class="form-wrap">
    <div class="form-content">
      <div class="cancel" @click="$emit('closeForm')">
        <i class="fas fa-times"></i>
      </div>
      <div class="form-title">
        <h2>{{ editMode ? 'EDIT RECEIPT' : 'RECORD PAYMENT' }}</h2>
      </div>
      <hr />

      <div class="form-inputs">
        <!-- Invoice Info (always shown - form only used from invoice page) -->
        <div class="form-group">
          <input 
            type="text" 
            class="form-control" 
            :value="invoice ? invoice.invoiceNumber : ''" 
            disabled
          />
          <label :class="{ filled: true }">Invoice Number</label>
        </div>

        <div class="form-group" v-if="invoice">
          <input 
            type="text" 
            class="form-control" 
            :value="invoice.schoolName || ''" 
            disabled
          />
          <label :class="{ filled: true }">School Name</label>
        </div>

        <!-- Invoice Total Amount -->
        <div class="form-group" v-if="invoice">
          <input 
            type="text" 
            class="form-control" 
            :value="'KSh ' + formatNumber(invoice.amount || 0)" 
            disabled
          />
          <label :class="{ filled: true }">Invoice Total Amount</label>
        </div>

        <!-- Receipt Number (read-only, server generated) -->
        <div class="form-group">
          <input 
            type="text" 
            class="form-control" 
            :value="receiptNo || 'Will be generated automatically after saving'" 
            readonly
            disabled
          />
          <label :class="{ filled: !!receiptNo }">Receipt Number</label>
        </div>

        <!-- Receipt Date -->
        <div class="form-group">
          <input 
            type="date" 
            class="form-control" 
            v-model="receiptDate" 
            placeholder="Receipt Date" 
            required 
          />
          <label for="receiptDate" :class="{ filled: receiptDate !== '' }">Receipt Date*</label>
        </div>

        <!-- Amount -->
        <div class="form-group">
          <input 
            type="number" 
            class="form-control" 
            v-model="amount" 
            placeholder="Enter payment amount (can be partial)" 
            step="0.01"
            :max="invoice ? (invoice.amount - (invoice.totalPaid || 0)) : undefined"
            min="0"
            required 
          />
          <label for="amount" :class="{ filled: amount !== '' }">Amount Paid (KSh)*</label>
          <small class="payment-hint" v-if="invoice">
            Maximum: KSh {{ formatNumber(invoice.amount || 0) }}
            <span v-if="invoice.totalPaid > 0"> | Already Paid: KSh {{ formatNumber(invoice.totalPaid || 0) }}</span>
          </small>
        </div>

        <!-- Payment Method -->
        <div class="form-group">
          <select class="form-control" v-model="paymentMethod" required>
            <option value="" disabled>Select Payment Method*</option>
            <option value="Cash">Cash</option>
            <option value="Bank Transfer">Bank Transfer</option>
            <option value="Mobile Money">Mobile Money</option>
            <option value="Cheque">Cheque</option>
            <option value="Credit Card">Credit Card</option>
            <option value="Other">Other</option>
          </select>
          <label for="paymentMethod" :class="{ filled: paymentMethod !== '' }">Payment Method*</label>
        </div>

        <!-- Reference Number -->
        <div class="form-group">
          <input 
            type="text" 
            class="form-control" 
            v-model="referenceNumber" 
            placeholder="Reference Number (if applicable)" 
          />
          <label for="referenceNumber" :class="{ filled: referenceNumber !== '' }">Reference Number</label>
        </div>

        <!-- Description/Notes -->
        <div class="form-group">
          <textarea
            class="form-control"
            v-model="description"
            placeholder="Additional notes or description"
            rows="2"
          ></textarea>
          <label for="description" :class="{ filled: description !== '' }">Description/Notes</label>
        </div>
      </div>
      <hr />
      <div class="form-actions">
        <button @click="$emit('closeForm')">Close</button>
        <button @click="saveReceipt">{{ editMode ? 'Update' : 'Record Payment' }}</button>
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
  name: 'NewReceiptForm',
  components: { LoadingSpinner },
  props: {
    receipt: {
      type: Object,
      default: null,
    },
    invoice: {
      type: Object,
      default: null,
    },
  },
  data() {
    return {
      receiptNo: '',
      receiptDate: '',
      amount: '',
      paymentMethod: '',
      referenceNumber: '',
      description: '',
      Loading: false,
      editMode: false,
    };
  },
  watch: {
    invoice: {
      immediate: true,
      handler(newInvoice) {
        if (newInvoice) {
          // Calculate remaining balance
          const invoiceAmount = parseFloat(newInvoice.amount || 0);
          const alreadyPaid = parseFloat(newInvoice.totalPaid || 0);
          const remaining = invoiceAmount - alreadyPaid;
          
          // Pre-fill with remaining balance (if partial payment) or full amount
          this.amount = remaining > 0 ? remaining : invoiceAmount;
          
          // Auto-set receipt date to today
          if (!this.receiptDate) {
            this.receiptDate = new Date().toISOString().split('T')[0];
          }
        }
      },
    },
    receipt: {
      immediate: true,
      handler(newReceipt) {
        if (newReceipt) {
          this.editMode = true;
          this.receiptNo = newReceipt.receiptNo || newReceipt.receiptNumber || '';
          this.receiptDate = newReceipt.receiptDate || '';
          this.amount = newReceipt.amount || '';
          this.paymentMethod = newReceipt.paymentMethod || '';
          this.referenceNumber = newReceipt.referenceNumber || '';
          this.description = newReceipt.description || '';
        } else {
          this.editMode = false;
          this.clearForm();
        }
      },
    },
  },
  methods: {
    formatNumber(num) {
      return new Intl.NumberFormat('en-KE', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(num || 0);
    },


    clearForm() {
      this.receiptNo = '';
      this.receiptDate = '';
      this.amount = '';
      this.paymentMethod = '';
      this.referenceNumber = '';
      this.description = '';
    },

    async saveReceipt() {
      const toast = useToast();

      if (!this.invoice || !this.invoice.schoolCode) {
        toast.error('Invoice / school information is missing!');
        return;
      }

      const missingFields = [];
      if (!String(this.receiptDate || '').trim()) {
        missingFields.push('Receipt Date');
      }
      if (this.amount === '' || this.amount === null) {
        missingFields.push('Amount');
      }
      if (!this.paymentMethod) {
        missingFields.push('Payment Method');
      }

      if (missingFields.length > 0) {
        toast.warning(`Please fill: ${missingFields.join(', ')}`);
        return;
      }

      // Validate payment amount
      const paymentAmount = parseFloat(this.amount);
      const invoiceAmount = parseFloat(this.invoice.amount || 0);
      const alreadyPaid = parseFloat(this.invoice.totalPaid || 0);
      const remaining = invoiceAmount - alreadyPaid;

      if (paymentAmount <= 0) {
        toast.warning('Payment amount must be greater than zero!');
        return;
      }

      if (paymentAmount > remaining) {
        toast.warning(`Payment amount (KSh ${this.formatNumber(paymentAmount)}) exceeds remaining balance (KSh ${this.formatNumber(remaining)})!`);
        return;
      }

      // Map UI payment method to API paymentMode values
      let apiPaymentMode = this.paymentMethod;
      switch (this.paymentMethod) {
        case 'Mobile Money':
          apiPaymentMode = 'M-PESA';
          break;
        case 'Bank Transfer':
          apiPaymentMode = 'BANK';
          break;
        case 'Cash':
          apiPaymentMode = 'CASH';
          break;
        default:
          // leave as-is for other types like CHEQUE, Credit Card, Other
          break;
      }

      const payload = {
        amount: paymentAmount,
        paymentMode: apiPaymentMode,
        paymentModeNo: this.referenceNumber || '',
        receiptDate: this.invoice?.receiptDate || this.receiptDate,
        schoolCode: this.invoice.schoolCode,
        status: 'Paid',
      };

      this.Loading = true;

      try {
        let response;
        if (this.editMode && this.receiptNo) {
          // Update existing receipt
          response = await axios.post(`/receipts/update/${this.receiptNo}`, payload);
        } else {
          // Create new receipt - backend auto-generates receipt details and updates invoices
          response = await axios.post('/receipts/create', payload);
        }

        if (response.status === 200 || response.status === 201) {
          toast.success(`Receipt ${this.editMode ? 'updated' : 'created'} successfully! Payment recorded.`);
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
          toast.error(`ERROR ${this.editMode ? 'UPDATING' : 'CREATING'} RECEIPT!`);
        }
        console.error('Error saving receipt:', error);
      } finally {
        this.Loading = false;
      }
    },
  },
  mounted() {
    // Auto-set receipt date to today if not set
    if (!this.receiptDate) {
      this.receiptDate = new Date().toISOString().split('T')[0];
    }
    
    // Require invoice to be passed as prop
    if (!this.invoice) {
      const toast = useToast();
      toast.error('Invoice is required to create receipt!');
      this.$emit('closeForm');
    }
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

.form-control:disabled {
  background-color: #e0e0e0;
  cursor: not-allowed;
}

textarea.form-control {
  resize: vertical;
  min-height: 60px;
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

.payment-hint {
  display: block;
  margin-top: 0.25rem;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.9);
  font-style: italic;
}

.form-control:focus + label,
.form-control:not(:placeholder-shown) + label {
  top: -0.6rem;
  left: 0.3rem;
  font-size: 0.75rem;
  color: gold;
  background-color: #4368b9;
}

.payment-hint {
  display: block;
  margin-top: 0.5rem;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.9);
  font-style: italic;
  padding: 0.3rem;
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
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

