<template>
  <div class="the-page">
    <div class="search-area">
      <!-- Header -->
      <div class="header-container1">
        <h2>Invoices & School</h2>
      </div>
      <input v-model="searchQuery" placeholder="Search by invoice number, school name or code" class="search-input" />
    </div>

    <!-- Action Buttons -->
    <div class="header-container">
      <div class="header-object1">
        <button @click="openForm" class="action-btn" aria-label="Create Invoice">
          <span class="material-symbols-outlined">add_circle</span> Create Invoice
        </button>
      </div>
    </div>

    <!-- Invoices Table -->
    <div class="table-container">
      <div class="students-controls">
        <label for="invoicesPerPage">Invoices per page:</label>
        <select class="form-control" v-model="invoicesPerPage" @change="updateInvoicesPerPage">
          <option v-for="option in invoicesPerPageOptions" :key="option" :value="option">{{ option }}</option>
        </select>

        <label for="schoolFilter">Filter by school:</label>
        <select
          id="schoolFilter"
          class="form-control"
          v-model="selectedSchoolCode"
          @change="onSchoolFilterChange"
        >
          <option value="">All Schools</option>
          <option
            v-for="school in schools"
            :key="school.schoolCode || school.school_code"
            :value="school.schoolCode || school.school_code"
          >
            {{ school.schoolName || school.school_name }} ({{ school.schoolCode || school.school_code }})
          </option>
        </select>
      </div>

      <table class="students-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Invoice Number</th>
            <th>School Name</th>
            <th>School Code</th>
            <th>Invoice Date</th>
            <th>Due Date</th>
            <th>Amount</th>
            <th>Paid</th>
            <th>Balance</th>
            <th>Status</th>
            <th>Receipts</th>
            <th class="actions-header">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="displayedInvoices.length === 0">
            <td colspan="12">No invoices found</td>
          </tr>
          <tr
            v-for="(invoice, index) in displayedInvoices"
            :key="invoice.invoiceNo || invoice.invoiceID || index"
            :class="{ 'even-row': index % 2 !== 0 }"
          >
            <td>{{ (currentPage - 1) * invoicesPerPage + index + 1 }}</td>
            <td>{{ invoice.invoiceNumber || invoice.invoiceNo }}</td>
            <td>{{ invoice.schoolName }}</td>
            <td>{{ invoice.schoolCode }}</td>
            <td>{{ invoice.invoiceDate }}</td>
            <td>{{ invoice.dueDate }}</td>
            <td>KSh {{ formatNumber(invoice.amount) }}</td>
            <td>
              <span class="paid-amount">KSh {{ formatNumber(invoice.totalPaid || 0) }}</span>
            </td>
            <td>
              <span :class="getBalanceClass(invoice)">KSh {{ formatNumber((invoice.amount || 0) - (invoice.totalPaid || 0)) }}</span>
            </td>
            <td :class="{ 'text-success': invoice.status === 'Paid', 'text-warning': invoice.status === 'Partially Paid', 'text-danger': invoice.status === 'Overdue', 'text-warning': invoice.status === 'Pending' }">
              {{ invoice.status }}
            </td>
            <td>
              <span v-if="invoice.receiptCount > 0" class="receipt-count-badge">{{ invoice.receiptCount }} Receipt(s)</span>
              <span v-else class="no-receipts">No receipts</span>
            </td>
            <td class="actions">
              <button @click="viewInvoice(invoice)" class="manage-btn" aria-label="View Invoice">
                <span class="material-symbols-outlined">visibility</span> View
              </button>
              <button @click="recordPayment(invoice)" class="payment-btn" aria-label="Record Payment" v-if="invoice.status !== 'Paid'">
                <span class="material-symbols-outlined">payment</span> Record Payment
              </button>
              <button
                @click="viewReceiptsForInvoice(invoice)"
                class="receipts-view-btn"
                v-if="invoice.receiptCount > 0"
                aria-label="View Receipts"
              >
                <span class="material-symbols-outlined">receipt</span> View Receipts
              </button>
              <button
                @click="deleteInvoice(invoice)"
                class="class-list-btn"
                aria-label="Delete Invoice"
              >
                <span class="material-symbols-outlined">delete</span> Delete
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      <div class="pagination">
        <button @click="prevPage" :disabled="currentPage === 1">Previous</button>
        <span>{{ currentPage }} / {{ totalPages }}</span>
        <button @click="nextPage" :disabled="currentPage === totalPages">Next</button>
      </div>
    </div>

    <!-- Invoice Form Modal -->
    <NewInvoiceForm
      :invoice="selectedInvoice"
      :viewMode="isViewMode"
      @closeForm="openForm" 
      @fetchInvoices="fetchInvoices" 
      v-if="showForm" 
    />

    <!-- Receipt Form Modal for Recording Payment -->
    <NewReceiptForm
      :invoice="selectedInvoiceForPayment"
      :receipt="selectedReceipt"
      @closeForm="closePaymentForm" 
      @fetchInvoices="fetchInvoices" 
      v-if="showPaymentForm" 
    />

    <!-- Receipts List Modal -->
    <div class="modal-wrap" v-if="showReceiptsModal" @click.self="closeReceiptsModal">
      <div class="modal-content">
        <div class="modal-header">
          <h2>
            Receipts for School:
            {{ selectedInvoiceForReceipts?.schoolName }}
            ({{ selectedInvoiceForReceipts?.schoolCode }})
          </h2>
          <button @click="closeReceiptsModal" class="close-btn">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <div v-if="receiptsList.length === 0" class="no-receipts-message">
            No receipts found for this invoice.
          </div>
          <table class="receipts-table" v-else>
            <thead>
              <tr>
                <th>Receipt Number</th>
                <th>Date</th>
                <th>Amount</th>
                <th>Payment Method</th>
                <th>Reference</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="receipt in receiptsList" :key="receipt.receiptID || receipt.receiptNo">
                <td>{{ receipt.receiptNumber }}</td>
                <td>{{ receipt.receiptDate }}</td>
                <td>KSh {{ formatNumber(receipt.amount) }}</td>
                <td>{{ receipt.paymentMethod }}</td>
                <td>{{ receipt.referenceNumber || '-' }}</td>
                <td class="receipt-actions">
                  <button
                    class="receipt-edit-btn"
                    @click="editReceipt(receipt)"
                  >
                    Edit
                  </button>
                  <button
                    class="receipt-delete-btn"
                    @click="deleteReceipt(receipt)"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td colspan="2"><strong>Total Receipts (this school):</strong></td>
                <td>
                  <strong>
                    KSh
                    {{ formatNumber(receiptsList.reduce((sum, r) => sum + (r.amount || 0), 0)) }}
                  </strong>
                </td>
                <td colspan="3"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>

    <!-- Delete / Reverse Receipt Dialog -->
    <div v-if="showDeleteDialog" class="delete-modal-overlay" @click.self="cancelDelete">
      <div class="delete-modal-content">
        <h3>Reverse Receipt</h3>
        <p class="delete-modal-text">
          You are about to <strong>REVERSE</strong> receipt
          <strong>{{ receiptToDelete?.receiptNumber || receiptToDelete?.receiptNo }}</strong>.
          This will undo the payment allocation on all related invoices.
        </p>
        <p class="delete-modal-text">
          Please provide a clear reason for this reversal. This reason will be stored for audit purposes.
        </p>
        <textarea
          v-model="deleteReason"
          class="delete-modal-textarea"
          placeholder="Type the reversal reason here..."
          rows="3"
        ></textarea>
        <div class="delete-modal-actions">
          <button class="delete-cancel-btn" @click="cancelDelete">Cancel</button>
          <button class="delete-confirm-btn" @click="confirmDelete" :disabled="!deleteReason.trim()">
            Reverse Receipt
          </button>
        </div>
      </div>
    </div>

    <!-- Delete Invoice Dialog -->
    <div v-if="showInvoiceDeleteDialog" class="delete-modal-overlay" @click.self="cancelInvoiceDelete">
      <div class="delete-modal-content">
        <h3>Delete Invoice</h3>
        <p class="delete-modal-text">
          You are about to <strong>DELETE</strong> invoice
          <strong>{{ invoiceToDelete?.invoiceNumber || invoiceToDelete?.invoiceNo }}</strong>.
          This will soft delete the invoice and all its details, and will update the school status.
        </p>
        <p class="delete-modal-text">
          Please provide a reason for deleting this invoice. This will be stored for audit tracking.
        </p>
        <textarea
          v-model="invoiceDeleteReason"
          class="delete-modal-textarea"
          placeholder="Type the delete reason here..."
          rows="3"
        ></textarea>
        <div class="delete-modal-actions">
          <button class="delete-cancel-btn" @click="cancelInvoiceDelete">Cancel</button>
          <button
            class="delete-confirm-btn"
            @click="confirmInvoiceDelete"
            :disabled="!invoiceDeleteReason.trim()"
          >
            Delete Invoice
          </button>
        </div>
      </div>
    </div>

    <LoadingSpinner :isLoading="Loading" />
    <!-- Footer -->
    <footerCast />
  </div>
</template>

<script>
import footerCast from '../../components/footer.vue';
import axios from '../../axios';
import { useToast } from 'vue-toastification';
import LoadingSpinner from '../../components/LoadingSpinner.vue';
import NewInvoiceForm from './NewInvoiceForm.vue';
import NewReceiptForm from './NewReceiptForm.vue';

export default {
  name: 'InvoicesSchool',
  components: {
    footerCast,
    LoadingSpinner,
    NewInvoiceForm,
    NewReceiptForm,
  },
  setup() {
    const toast = useToast();
    return { toast };
  },
  data() {
    return {
      selectedInvoice: null,
      selectedInvoiceForPayment: null,
      selectedInvoiceForReceipts: null,
      selectedReceipt: null,
      showForm: false,
      showPaymentForm: false,
      showReceiptsModal: false,
      receiptsList: [],
      searchQuery: '',
      invoices: [],
      schools: [],
      Loading: false,
      currentPage: 1,
      invoicesPerPage: 15,
      invoicesPerPageOptions: [5, 15, 30, 50, 75, 100],
      isViewMode: false,
      selectedSchoolCode: '',
      showDeleteDialog: false,
      receiptToDelete: null,
      deleteReason: '',
      showInvoiceDeleteDialog: false,
      invoiceToDelete: null,
      invoiceDeleteReason: '',
    };
  },
  computed: {
    totalPages() {
      return Math.ceil(this.filteredInvoices.length / this.invoicesPerPage);
    },
    displayedInvoices() {
      const startIndex = (this.currentPage - 1) * this.invoicesPerPage;
      const endIndex = Math.min(startIndex + this.invoicesPerPage, this.filteredInvoices.length);
      return this.filteredInvoices.slice(startIndex, endIndex);
    },
    filteredInvoices() {
      if (!this.searchQuery.trim()) return this.invoices;
      const query = this.searchQuery.toLowerCase();
      return this.invoices.filter(invoice => {
        return (
          (invoice.invoiceNumber && invoice.invoiceNumber.toLowerCase().includes(query)) ||
          (invoice.schoolName && invoice.schoolName.toLowerCase().includes(query)) ||
          (invoice.schoolCode && invoice.schoolCode.toString().toLowerCase().includes(query))
        );
      });
    },
  },
  methods: {
    formatStatus(status) {
      const normalized = (status || '').toString().replace(/_/g, ' ').toLowerCase();
      return normalized.replace(/\b\w/g, char => char.toUpperCase());
    },

    formatNumber(num) {
      return new Intl.NumberFormat('en-KE', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(num || 0);
    },

    getBalanceClass(invoice) {
      const balance = (invoice.amount || 0) - (invoice.totalPaid || 0);
      if (balance === 0) return 'balance-paid';
      if (balance > 0) return 'balance-remaining';
      return 'balance-overpaid';
    },

    viewInvoice(invoice) {
      this.selectedInvoice = invoice;
      this.isViewMode = true;
      this.showForm = true;
    },

    editInvoice(invoice) {
      this.selectedInvoice = invoice;
      this.isViewMode = false;
      this.showForm = true;
    },

    recordPayment(invoice) {
      this.selectedInvoiceForPayment = invoice;
      this.showPaymentForm = true;
    },

    closePaymentForm() {
      this.showPaymentForm = false;
      this.selectedInvoiceForPayment = null;
    },

    async viewReceiptsForInvoice(invoice) {
      this.selectedInvoiceForReceipts = invoice;
      this.showReceiptsModal = true;
      await this.fetchReceiptsForSchool(invoice.schoolCode);
    },

    closeReceiptsModal() {
      this.showReceiptsModal = false;
      this.selectedInvoiceForReceipts = null;
      this.receiptsList = [];
    },

    async fetchReceiptsForSchool(schoolCode) {
      this.Loading = true;
      try {
        // List receipts for a specific school
        const response = await axios.post(`/receipts/school/${schoolCode}`);
        if (response.data && Array.isArray(response.data)) {
          this.receiptsList = response.data
            .filter((receipt) => !receipt.deleted)
            .map((receipt) => ({
              receiptID: receipt.receiptID || receipt.id || receipt.receipt_id,
              receiptNo: receipt.receiptNo || receipt.receipt_number || receipt.receiptID,
              receiptNumber: receipt.receiptNo || receipt.receipt_number || 'N/A',
              receiptDate: receipt.receiptDate || receipt.receipt_date || 'N/A',
              amount: parseFloat(receipt.amount || 0),
              paymentMethod: receipt.paymentMode || receipt.paymentMethod || receipt.payment_mode || 'Cash',
              referenceNumber: receipt.paymentModeNo || receipt.referenceNumber || receipt.reference_number || '',
              description: receipt.description || '',
              status: receipt.status || 'Paid',
            }));
        } else {
          this.receiptsList = [];
        }
      } catch (error) {
        console.error('Error fetching receipts:', error);
        this.receiptsList = [];
      } finally {
        this.Loading = false;
      }
    },

    editReceipt(receipt) {
      // Open the receipt form in edit mode using the selected invoice's school info
      this.selectedReceipt = {
        receiptNo: receipt.receiptNo || receipt.receiptNumber,
        receiptDate: receipt.receiptDate,
        amount: receipt.amount,
        paymentMethod: receipt.paymentMethod,
        referenceNumber: receipt.referenceNumber,
        description: receipt.description,
      };
      this.selectedInvoiceForPayment = this.selectedInvoiceForReceipts;
      this.showPaymentForm = true;
    },

    deleteReceipt(receipt) {
      // Open styled dialog and store the target receipt
      this.receiptToDelete = receipt;
      this.deleteReason = '';
      this.showDeleteDialog = true;
    },

    cancelDelete() {
      this.showDeleteDialog = false;
      this.receiptToDelete = null;
      this.deleteReason = '';
    },

    async confirmDelete() {
      const toast = useToast();
      const receipt = this.receiptToDelete;
      if (!receipt) return;

      const receiptNo = receipt.receiptNo || receipt.receiptNumber;
      if (!receiptNo) {
        toast.error('Missing receipt number. Please try again.');
        return;
      }

      if (!this.deleteReason.trim()) {
        toast.warning('Reversal reason is required.');
        return;
      }

      this.Loading = true;
      try {
        await axios.post(`/receipts/delete/${receiptNo}`, { reason: this.deleteReason });
        this.receiptsList = this.receiptsList.filter(
          (r) => (r.receiptNo || r.receiptNumber) !== receiptNo
        );
        toast.success('Receipt reversed successfully.');
        await this.fetchInvoices();
      } catch (error) {
        console.error('Error deleting receipt:', error);
        toast.error('Failed to reverse receipt. Please try again.');
      } finally {
        this.Loading = false;
        this.cancelDelete();
      }
    },


    openForm() {
      if (this.showForm && this.selectedInvoice) {
        this.selectedInvoice = null;
        this.isViewMode = false;
      }
      this.showForm = !this.showForm;
    },

    closeForm() {
      this.showForm = false;
      this.selectedInvoice = null;
    },

    nextPage() {
      if (this.currentPage < this.totalPages) {
        this.currentPage++;
      }
    },

    prevPage() {
      if (this.currentPage > 1) {
        this.currentPage--;
      }
    },

    updateInvoicesPerPage() {
      this.currentPage = 1;
    },

    async fetchSchools() {
      try {
        // Use the schools list endpoint - baseURL is already set in axios.js
        const response = await axios.post('/schools/list');
        if (response.data && Array.isArray(response.data)) {
          this.schools = response.data;
        }
      } catch (error) {
        console.error('Error fetching schools:', error);
      }
    },
    async fetchInvoices() {
      this.Loading = true;
      const toast = useToast();
      
      try {
        // Use the invoice list endpoint - baseURL is already set in axios.js
        const response = await axios.post('/invoices/list');
        
        console.log('API Response:', response.data);

        if (response.data && Array.isArray(response.data)) {
          this.invoices = response.data
            .filter(invoice => !invoice.deleted) // Filter out soft-deleted invoices
            .map(invoice => ({
              invoiceNo: invoice.invoiceNo || invoice.invoice_number || invoice.invoiceID || invoice.id,
              invoiceID: invoice.invoiceID || invoice.id || invoice.invoiceNo,
              invoiceNumber: invoice.invoiceNo || invoice.invoiceNumber || invoice.invoice_number || 'N/A',
              schoolName: invoice.schoolName || invoice.school_name || 'N/A',
              schoolCode: invoice.schoolCode || invoice.school_code || 'N/A',
              invoiceDate: invoice.invoiceDate || invoice.invoice_date || 'N/A',
              dueDate: invoice.dueDate || invoice.due_date || 'N/A',
              amount: parseFloat(invoice.amount || 0),
              status: this.formatStatus(invoice.status || 'PENDING'),
              description: invoice.description || '',
              items: invoice.invoiceDetails || invoice.items || [],
              totalPaid: parseFloat(invoice.paid || 0),
              balance: parseFloat(invoice.balance || 0),
              invoiceType: invoice.invoiceType || invoice.invoice_type || '',
              receiptCount: invoice.receiptCount || invoice.receipt_count || 0
            }));

          if (this.invoices.length > 0) {
            toast.success(`${this.invoices.length} invoice(s) fetched successfully!`);
          } else {
            toast.info('No invoices found.');
          }
        } else {
          this.invoices = [];
          toast.warning('Invalid response format from API.');
        }
      } catch (error) {
        console.error('Error fetching invoices:', error);
        this.invoices = [];
        toast.error('Failed to fetch invoices. Please try again.');
      } finally {
        this.Loading = false;
      }
    },

    async deleteInvoice(invoice) {
      // Open styled delete dialog for invoices
      this.invoiceToDelete = invoice;
      this.invoiceDeleteReason = '';
      this.showInvoiceDeleteDialog = true;
    },

    cancelInvoiceDelete() {
      this.showInvoiceDeleteDialog = false;
      this.invoiceToDelete = null;
      this.invoiceDeleteReason = '';
    },

    async confirmInvoiceDelete() {
      const toast = useToast();
      const target = this.invoiceToDelete;
      if (!target) return;

      const invoiceNo = target.invoiceNo || target.invoiceID;
      if (!invoiceNo) {
        toast.error('Missing invoice number. Please reopen the page and try again.');
        return;
      }

      if (!this.invoiceDeleteReason.trim()) {
        toast.warning('Delete reason is required.');
        return;
      }

      this.Loading = true;
      try {
        await axios.post(`/invoices/delete/${invoiceNo}`, {
          reason: this.invoiceDeleteReason,
        });
        this.invoices = this.invoices.filter(
          (inv) => (inv.invoiceNo || inv.invoiceID) !== invoiceNo
        );
        toast.success('Invoice deleted successfully.');
      } catch (error) {
        console.error('Error deleting invoice:', error);
        toast.error('Failed to delete invoice. Please try again.');
      } finally {
        this.Loading = false;
        this.cancelInvoiceDelete();
      }
    },

    async fetchInvoicesBySchool(schoolCode) {
      this.Loading = true;
      const toast = useToast();
      try {
        const response = await axios.post(`/invoices/school/${schoolCode}`);

        if (response.data && Array.isArray(response.data)) {
          this.invoices = response.data
            .filter(invoice => !invoice.deleted)
            .map(invoice => ({
              invoiceNo: invoice.invoiceNo || invoice.invoice_number || invoice.invoiceID || invoice.id,
              invoiceID: invoice.invoiceID || invoice.id || invoice.invoiceNo,
              invoiceNumber: invoice.invoiceNo || invoice.invoiceNumber || invoice.invoice_number || 'N/A',
              schoolName: invoice.schoolName || invoice.school_name || 'N/A',
              schoolCode: invoice.schoolCode || invoice.school_code || 'N/A',
              invoiceDate: invoice.invoiceDate || invoice.invoice_date || 'N/A',
              dueDate: invoice.dueDate || invoice.due_date || 'N/A',
              amount: parseFloat(invoice.amount || 0),
              status: this.formatStatus(invoice.status || 'PENDING'),
              description: invoice.description || '',
              items: invoice.invoiceDetails || invoice.items || [],
              totalPaid: parseFloat(invoice.paid || 0),
              balance: parseFloat(invoice.balance || 0),
              invoiceType: invoice.invoiceType || invoice.invoice_type || '',
              receiptCount: invoice.receiptCount || invoice.receipt_count || 0
            }));

          if (this.invoices.length > 0) {
            toast.success(`${this.invoices.length} invoice(s) for school ${schoolCode} fetched successfully!`);
          } else {
            toast.info(`No invoices found for school ${schoolCode}.`);
          }
        } else {
          this.invoices = [];
          toast.warning('Invalid response format from API.');
        }
      } catch (error) {
        console.error('Error fetching invoices by school:', error);
        this.invoices = [];
        toast.error('Failed to fetch invoices for this school. Please try again.');
      } finally {
        this.Loading = false;
      }
    },

    onSchoolFilterChange() {
      this.currentPage = 1;
      if (!this.selectedSchoolCode) {
        this.fetchInvoices();
      } else {
        this.fetchInvoicesBySchool(this.selectedSchoolCode);
      }
    },
  },
  mounted() {
    // Fetch invoices and schools from API
    this.fetchInvoices();
    this.fetchSchools();
  }
};
</script>

<style scoped>
* {
  padding: 0;
  margin: 0;
  box-sizing: border-box;
}

.the-page {
  margin-top: 4.5rem;
  padding: 1rem;
  background-color: #f4f6fa;
}

.header-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.header-object1 {
  display: flex;
  gap: 0.5rem;
}

.header-container1 h2 {
  font-size: 1.5rem;
  color: #333;
  padding-bottom: 0.5rem;
}

.action-btn {
  background-color: #2b7ab7;
  color: #fff;
  padding: 0.4rem 0.8rem;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.3rem;
}

.action-btn:hover {
  background-color: #1e6192;
}

.action-btn .material-symbols-outlined {
  margin-right: 0.3rem;
}

.search-area {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.search-input {
  padding: 0.3rem;
  border-radius: 5px;
  border: 2px solid #2b7ab7;
  outline: none;
  margin-left: 1rem;
}

.table-container {
  background-color: white;
  padding: 1rem;
  border-radius: 8px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.students-controls {
  margin-bottom: 0.5rem;
  display: flex;
  gap: 0.3rem;
  align-items: center;
}

.students-controls label {
  color: #2b7ab7;
  font-size: large;
}

.form-control {
  border: 1px solid #2b7ab7;
  outline: none;
  padding: 3px;
  border-radius: 4px;
  font-size: 1rem;
}

.students-table {
  width: 100%;
  border-collapse: collapse;
  border-spacing: 0;
  border: 1px solid #ddd;
}

.students-table th,
.students-table td {
  padding: 1rem;
  text-align: left;
  border-bottom: 1px solid #ddd;
  vertical-align: middle;
  border: 1px solid #ddd;
}

.students-table thead th {
  background-color: #f1f1f1;
  font-weight: 600;
  border-bottom: 2px solid #ddd;
}

.even-row {
  background-color: #f7f9fc;
}

.text-success {
  color: #2b7ab7 !important;
  font-weight: bold;
  font-style: italic;
}

.text-danger {
  color: red !important;
  font-weight: bold;
  font-style: italic;
}

.text-warning {
  color: orange !important;
  font-weight: bold;
  font-style: italic;
}

.actions-header {
  text-align: left;
  padding-left: 1rem;
}

.actions {
  display: flex;
  justify-content: flex-start;
  gap: 0.5rem;
  padding-left: 1rem;
}

.manage-btn,
.class-list-btn {
  background-color: #e0e7ff;
  color: #4f46e5;
  border: 1px solid #c7d2fe;
  padding: 0.4rem 0.8rem;
  border-radius: 5px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.9rem;
  transition: background-color 0.3s ease;
}

.manage-btn:hover {
  background-color: #d1d5db;
}

.class-list-btn:hover {
  background-color: #d4d7ff;
}

.payment-btn {
  background-color: #10b981;
  color: #fff;
  border: 1px solid #059669;
  padding: 0.4rem 0.8rem;
  border-radius: 5px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.9rem;
  transition: background-color 0.3s ease;
}

.payment-btn:hover {
  background-color: #059669;
}

.receipt-count-badge {
  background-color: #e0f2f1;
  color: #00695c;
  padding: 0.3rem 0.6rem;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 500;
}

.no-receipts {
  color: #999;
  font-style: italic;
  font-size: 0.85rem;
}

.receipts-view-btn {
  background-color: #3b82f6;
  color: #fff;
  border: 1px solid #2563eb;
  padding: 0.4rem 0.8rem;
  border-radius: 5px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.9rem;
  transition: background-color 0.3s ease;
}

.receipts-view-btn:hover {
  background-color: #2563eb;
}

.actions .material-symbols-outlined {
  font-size: 1rem;
}

/* Receipts Modal Styles */
.modal-wrap {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10001;
}

.modal-content {
  background-color: white;
  border-radius: 8px;
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 2px solid #e5e7eb;
  background-color: #4368b9;
  color: gold;
  border-radius: 8px 8px 0 0;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.3rem;
}

.close-btn {
  background: none;
  border: none;
  color: gold;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  color: #fff;
}

.modal-body {
  padding: 1.5rem;
  overflow-y: auto;
}

.no-receipts-message {
  text-align: center;
  padding: 2rem;
  color: #666;
  font-style: italic;
}

.receipts-table {
  width: 100%;
  border-collapse: collapse;
}

.receipts-table th {
  background-color: #f3f4f6;
  padding: 0.75rem;
  text-align: left;
  font-weight: 600;
  border-bottom: 2px solid #e5e7eb;
}

.receipts-table td {
  padding: 0.75rem;
  border-bottom: 1px solid #e5e7eb;
}

.receipts-table tbody tr:hover {
  background-color: #f9fafb;
}

.receipts-table tfoot {
  background-color: #f3f4f6;
  font-weight: bold;
}

.receipts-table tfoot td {
  border-top: 2px solid #e5e7eb;
}

/* Delete / Reverse dialog styles */
.delete-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10002;
}

.delete-modal-content {
  background-color: #4368b9;
  border-radius: 8px;
  padding: 1.5rem;
  width: 90%;
  max-width: 480px;
  box-shadow: 0px 0px 5px gold;
  color: #fff;
}

.delete-modal-content h3 {
  margin: 0 0 0.75rem 0;
  color: gold;
  text-align: center;
}

.delete-modal-text {
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
}

.delete-modal-textarea {
  width: 100%;
  border-radius: 4px;
  border: 1px solid gold;
  padding: 0.5rem;
  font-size: 0.9rem;
  background-color: #4368b9;
  color: #fff;
  resize: vertical;
}

.delete-modal-textarea::placeholder {
  color: rgba(255, 255, 255, 0.7);
}

.delete-modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 1rem;
}

.delete-cancel-btn,
.delete-confirm-btn {
  padding: 0.4rem 0.9rem;
  border-radius: 4px;
  border: 1px solid transparent;
  font-size: 0.85rem;
  cursor: pointer;
}

.delete-cancel-btn {
  background-color: #e5e7eb;
  color: #111827;
  border-color: #d1d5db;
}

.delete-confirm-btn {
  background-color: #f97316;
  border-color: #ea580c;
  color: #111827;
  font-weight: 600;
}

.delete-confirm-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.pagination {
  margin-top: 10px;
  text-align: center;
}

.pagination button {
  margin: 0 5px;
  padding: 5px 10px;
  cursor: pointer;
  border: 2px solid #2b7ab7;
  color: #2b7ab7;
  border-radius: 5px;
  background: white;
}

.pagination button:hover:not(:disabled) {
  background-color: #2b7ab7;
  color: white;
}

.pagination button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination span {
  font-weight: bold;
  margin: 0 10px;
}

/* Responsive Design */
@media only screen and (max-width: 767px) {
  .the-page {
    padding: 0.5rem;
    margin-top: 2.5rem;
    margin-left: 2.1rem;
    width: 93.5%;
  }

  .header-container {
    flex-direction: column;
    gap: 0.4rem;
    align-items: flex-start;
  }

  .header-object1 {
    gap: 0.2rem;
  }

  .action-btn {
    width: 100%;
    justify-content: center;
    padding: 0.5rem;
    font-size: 0.9rem;
  }

  .header-container1 h2 {
    font-size: 1.2rem;
    text-align: center;
  }

  .search-area {
    flex-direction: column;
    gap: 0.5rem;
    align-items: flex-start;
  }

  .search-input {
    width: 100%;
    margin-left: 0;
  }

  .table-container {
    padding: 0.5rem;
    width: 103%;
    margin-left: -0.3rem;
    overflow-x: auto;
  }

  .students-table {
    min-width: 800px;
  }

  .students-table th,
  .students-table td {
    padding: 0.5rem;
    font-size: 0.9rem;
    white-space: normal;
    word-break: break-word;
  }

  .actions {
    flex-direction: column;
    gap: 0.25rem;
    padding-left: 0;
  }

  .manage-btn,
  .class-list-btn,
  .payment-btn {
    width: 100%;
    justify-content: center;
    padding: 0.3rem 0.5rem;
    font-size: 0.8rem;
  }

  .pagination button {
    padding: 2.5px 10px;
  }
}
</style>

