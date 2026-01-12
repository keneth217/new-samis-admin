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

      <!-- Desktop Table View -->
      <table class="students-table desktop-table">
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

      <!-- Mobile Card View -->
      <div class="mobile-cards" v-if="displayedInvoices.length > 0">
        <div v-for="(invoice, index) in displayedInvoices" :key="invoice.invoiceNo || invoice.invoiceID || index" class="invoice-card">
          <div class="card-header">
            <div class="card-number">{{ (currentPage - 1) * invoicesPerPage + index + 1 }}</div>
            <h3 class="card-title">{{ invoice.schoolName }}</h3>
          </div>
          
          <div class="card-body">
            <div class="card-row">
              <span class="card-label">Invoice Number:</span>
              <span class="card-value">{{ invoice.invoiceNumber || invoice.invoiceNo }}</span>
            </div>
            
            <div class="card-row">
              <span class="card-label">School Code:</span>
              <span class="card-value">{{ invoice.schoolCode }}</span>
            </div>
            
            <div class="card-row">
              <span class="card-label">Invoice Date:</span>
              <span class="card-value">{{ invoice.invoiceDate }}</span>
            </div>
            
            <div class="card-row">
              <span class="card-label">Due Date:</span>
              <span class="card-value">{{ invoice.dueDate }}</span>
            </div>
            
            <div class="card-row">
              <span class="card-label">Amount:</span>
              <span class="card-value">KSh {{ formatNumber(invoice.amount) }}</span>
            </div>
            
            <div class="card-row">
              <span class="card-label">Paid:</span>
              <span class="card-value paid-amount">KSh {{ formatNumber(invoice.totalPaid || 0) }}</span>
            </div>
            
            <div class="card-row">
              <span class="card-label">Balance:</span>
              <span class="card-value" :class="getBalanceClass(invoice)">KSh {{ formatNumber((invoice.amount || 0) - (invoice.totalPaid || 0)) }}</span>
            </div>
            
            <div class="card-row">
              <span class="card-label">Status:</span>
              <span class="card-value" :class="{ 'text-success': invoice.status === 'Paid', 'text-warning': invoice.status === 'Partially Paid', 'text-danger': invoice.status === 'Overdue', 'text-warning': invoice.status === 'Pending' }">
                {{ invoice.status }}
              </span>
            </div>
            
            <div class="card-row">
              <span class="card-label">Receipts:</span>
              <span class="card-value">
                <span v-if="invoice.receiptCount > 0" class="receipt-count-badge">{{ invoice.receiptCount }} Receipt(s)</span>
                <span v-else class="no-receipts">No receipts</span>
              </span>
            </div>
          </div>
          
          <div class="card-footer">
            <button @click="viewInvoice(invoice)" class="card-action-btn" aria-label="View Invoice">
              <span class="material-symbols-outlined">visibility</span> View
            </button>
            <button @click="recordPayment(invoice)" class="card-action-btn payment-btn" aria-label="Record Payment" v-if="invoice.status !== 'Paid'">
              <span class="material-symbols-outlined">payment</span> Payment
            </button>
            <button @click="viewReceiptsForInvoice(invoice)" class="card-action-btn receipts-btn" v-if="invoice.receiptCount > 0" aria-label="View Receipts">
              <span class="material-symbols-outlined">receipt</span> Receipts
            </button>
            <button @click="deleteInvoice(invoice)" class="card-action-btn delete-btn" aria-label="Delete Invoice">
              <span class="material-symbols-outlined">delete</span> Delete
            </button>
          </div>
        </div>
      </div>

      <div v-if="displayedInvoices.length === 0" class="no-data-message">
        No invoices found
      </div>
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
    <div v-if="showDeleteDialog" class="modal-overlay" @click.self="cancelDelete">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Reverse Receipt</h3>
          <button @click="cancelDelete" class="close-btn">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <p class="delete-warning-text">
            Are you sure you want to reverse receipt
            <strong>{{ receiptToDelete?.receiptNumber || receiptToDelete?.receiptNo || 'this receipt' }}</strong>?
          </p>

          <div class="delete-preview" v-if="receiptToDelete">
            <div class="preview-row">
              <strong>Receipt Number:</strong> {{ receiptToDelete.receiptNumber || receiptToDelete.receiptNo }}
            </div>
            <div class="preview-row" v-if="receiptToDelete.invoiceNumber">
              <strong>Invoice:</strong> {{ receiptToDelete.invoiceNumber }}
            </div>
            <div class="preview-row" v-if="receiptToDelete.amount">
              <strong>Amount:</strong> KSh {{ formatNumber(receiptToDelete.amount) }}
            </div>
            <div class="preview-row" v-if="receiptToDelete.paymentMode">
              <strong>Payment Mode:</strong> {{ receiptToDelete.paymentMode }}
            </div>
          </div>

          <p class="delete-warning-note">
            <i class="fas fa-exclamation-triangle"></i>
            This will undo the payment allocation on all related invoices.
          </p>

          <div class="reason-input-group">
            <label for="deleteReason">Reversal Reason <span class="required">*</span></label>
            <textarea
              id="deleteReason"
              v-model="deleteReason"
              class="reason-textarea"
              placeholder="Type the reversal reason here..."
              rows="3"
            ></textarea>
            <p class="reason-help-text">This reason will be stored for audit purposes.</p>
          </div>
        </div>
        <div class="form-actions">
          <button class="cancel-btn" @click="cancelDelete">Cancel</button>
          <button class="delete-confirm-btn" @click="confirmDelete" :disabled="!deleteReason.trim()">
            <span class="material-symbols-outlined">undo</span> Reverse Receipt
          </button>
        </div>
      </div>
    </div>

    <!-- Delete Invoice Dialog -->
    <div v-if="showInvoiceDeleteDialog" class="modal-overlay" @click.self="cancelInvoiceDelete">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Delete Invoice</h3>
          <button @click="cancelInvoiceDelete" class="close-btn">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <p class="delete-warning-text">
            Are you sure you want to delete
            <strong>{{ invoiceToDelete?.invoiceNumber || invoiceToDelete?.invoiceNo || 'this invoice' }}</strong>?
          </p>

          <div class="delete-preview" v-if="invoiceToDelete">
            <div class="preview-row">
              <strong>Invoice:</strong> {{ invoiceToDelete.invoiceNumber || invoiceToDelete.invoiceNo }}
            </div>
            <div class="preview-row" v-if="invoiceToDelete.schoolCode">
              <strong>School Code:</strong> {{ invoiceToDelete.schoolCode }}
            </div>
            <div class="preview-row" v-if="invoiceToDelete.amount">
              <strong>Amount:</strong> KSh {{ formatNumber(invoiceToDelete.amount) }}
            </div>
            <div class="preview-row" v-if="invoiceToDelete.status">
              <strong>Status:</strong> {{ invoiceToDelete.status }}
            </div>
          </div>

          <p class="delete-warning-note">
            <i class="fas fa-exclamation-triangle"></i>
            This will soft delete the invoice and all its details, and will update the school status.
          </p>

          <div class="reason-input-group">
            <label for="invoiceDeleteReason">Delete Reason <span class="required">*</span></label>
            <textarea
              id="invoiceDeleteReason"
              v-model="invoiceDeleteReason"
              class="reason-textarea"
              placeholder="Type the delete reason here..."
              rows="3"
            ></textarea>
            <p class="reason-help-text">This reason will be stored for audit tracking.</p>
          </div>
        </div>
        <div class="form-actions">
          <button class="cancel-btn" @click="cancelInvoiceDelete">Cancel</button>
          <button
            class="delete-confirm-btn"
            @click="confirmInvoiceDelete"
            :disabled="!invoiceDeleteReason.trim()"
          >
            <span class="material-symbols-outlined">delete</span> Delete Invoice
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
  padding: clamp(0.5rem, 2vw, 1rem);
  background-color: #f4f6fa;
  width: 100%;
  min-height: calc(100vh - 4.5rem);
}

.header-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: clamp(0.5rem, 1.5vw, 1rem);
  flex-wrap: wrap;
  gap: 0.5rem;
}

.header-object1 {
  display: flex;
  gap: clamp(0.3rem, 1vw, 0.5rem);
  flex-wrap: wrap;
}

.header-container1 {
  width: 100%;
  overflow: visible;
  word-wrap: break-word;
  overflow-wrap: break-word;
  padding-left: 0;
  margin-left: 0;
  position: relative;
}

.header-container1 h2 {
  font-size: clamp(1.1rem, 2.5vw, 1.5rem);
  color: #333;
  padding: 0 0 0.5rem 0;
  margin: 0;
  word-wrap: break-word;
  overflow-wrap: break-word;
  white-space: normal;
  line-height: 1.3;
  overflow: visible;
  width: 100%;
  box-sizing: border-box;
  text-indent: 0;
  padding-left: 0;
  margin-left: 0;
}

.action-btn {
  background-color: #2b7ab7;
  color: #fff;
  padding: clamp(0.4rem, 1vw, 0.6rem) clamp(0.8rem, 2vw, 1rem);
  border: none;
  border-radius: 5px;
  cursor: pointer;
  display: flex;
  align-items: center;
  font-size: clamp(0.85rem, 1.5vw, 1rem);
  white-space: nowrap;
  transition: background-color 0.3s ease;
  gap: 0.3rem;
}

.action-btn:hover {
  background-color: #1e6192;
}

.action-btn .material-symbols-outlined {
  font-size: clamp(1rem, 2vw, 1.2rem);
}

.search-area {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: clamp(0.5rem, 1.5vw, 1rem);
  flex-wrap: wrap;
  gap: 0.5rem;
  width: 100%;
  overflow: visible;
}

.search-input {
  padding: clamp(0.3rem, 1vw, 0.5rem);
  border-radius: 5px;
  border: 2px solid #2b7ab7;
  outline: none;
  font-size: clamp(0.85rem, 1.5vw, 1rem);
  flex: 1;
  min-width: 150px;
  max-width: 400px;
  margin-left: 1rem;
}

.search-input:focus {
  border-color: #1e6192;
  box-shadow: 0 0 0 2px rgba(43, 122, 183, 0.2);
}

.table-container {
  background-color: white;
  padding: clamp(0.5rem, 1.5vw, 1rem);
  border-radius: 8px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.students-table {
  display: table !important;
  width: 100%;
  border-collapse: collapse;
  border-spacing: 0;
  border: 1px solid #ddd;
  font-size: clamp(0.8rem, 1.2vw, 1rem);
}

/* Mobile Card View - Hidden by default */
.mobile-cards {
  display: none;
}

/* Card Styles */
.invoice-card {
  background: white;
  border: 1px solid #e1e4ea;
  border-radius: 8px;
  margin-bottom: 1rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: box-shadow 0.3s ease;
}

.invoice-card:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.card-header {
  background: linear-gradient(135deg, #2b7ab7 0%, #1e6192 100%);
  color: white;
  padding: 1rem;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.card-number {
  background: rgba(255, 255, 255, 0.2);
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 0.9rem;
  flex-shrink: 0;
}

.card-title {
  font-size: clamp(1rem, 2vw, 1.2rem);
  font-weight: 600;
  margin: 0;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-body {
  padding: 0.75rem 1rem;
}

.card-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid #f0f0f0;
  gap: 0.5rem;
}

.card-row:last-child {
  border-bottom: none;
}

.card-label {
  font-weight: 600;
  color: #666;
  font-size: clamp(0.85rem, 1.2vw, 0.95rem);
  flex-shrink: 0;
  min-width: 130px;
  text-align: left;
}

.card-value {
  color: #333;
  font-size: clamp(0.85rem, 1.2vw, 0.95rem);
  text-align: right;
  flex: 1;
  word-break: break-word;
  font-weight: 500;
}

.card-footer {
  padding: 1rem;
  background: #f9fafb;
  border-top: 1px solid #e1e4ea;
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.card-action-btn {
  flex: 1;
  min-width: 120px;
  background-color: #e0e7ff;
  color: #4f46e5;
  border: 1px solid #c7d2fe;
  padding: 0.75rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-size: clamp(0.85rem, 1.2vw, 0.95rem);
  transition: all 0.3s ease;
  font-weight: 500;
}

.card-action-btn.payment-btn {
  background-color: #10b981;
  color: #fff;
  border-color: #059669;
}

.card-action-btn.receipts-btn {
  background-color: #3b82f6;
  color: #fff;
  border-color: #2563eb;
}

.card-action-btn.delete-btn {
  background-color: #fee2e2;
  color: #dc2626;
  border-color: #fecaca;
}

.card-action-btn:hover {
  background-color: #d1d5db;
  transform: translateY(-1px);
}

.card-action-btn.payment-btn:hover {
  background-color: #059669;
}

.card-action-btn.receipts-btn:hover {
  background-color: #2563eb;
}

.card-action-btn.delete-btn:hover {
  background-color: #fecaca;
}

.card-action-btn .material-symbols-outlined {
  font-size: 1.2rem;
}

.no-data-message {
  text-align: center;
  padding: 2rem;
  color: #666;
  font-size: clamp(0.9rem, 1.3vw, 1.1rem);
}

.students-controls {
  margin-bottom: clamp(0.3rem, 1vw, 0.5rem);
  display: flex;
  gap: clamp(0.3rem, 1vw, 0.5rem);
  align-items: center;
  flex-wrap: wrap;
}

.students-controls label {
  color: #2b7ab7;
  font-size: clamp(0.9rem, 1.5vw, 1.1rem);
  white-space: nowrap;
}

.form-control {
  border: 1px solid #2b7ab7;
  outline: none;
  padding: clamp(0.25rem, 0.8vw, 0.4rem);
  border-radius: 4px;
  font-size: clamp(0.9rem, 1.3vw, 1rem);
  min-width: 100px;
}

.form-control:focus {
  border-color: #1e6192;
  box-shadow: 0 0 0 2px rgba(43, 122, 183, 0.2);
}

.students-table th,
.students-table td {
  padding: clamp(0.5rem, 1.5vw, 1rem);
  text-align: left;
  border-bottom: 1px solid #ddd;
  vertical-align: middle;
  border: 1px solid #ddd;
  word-break: break-word;
}

.students-table thead th {
  background-color: #f1f1f1;
  font-weight: 600;
  border-bottom: 2px solid #ddd;
  position: sticky;
  top: 0;
  z-index: 10;
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

.balance-paid {
  color: #2b7ab7;
  font-weight: 600;
}

.balance-remaining {
  color: orange;
  font-weight: 600;
}

.balance-overpaid {
  color: red;
  font-weight: 600;
}

.paid-amount {
  color: #10b981;
  font-weight: 600;
}

.actions-header {
  text-align: center;
  padding: clamp(0.5rem, 1vw, 1rem);
}

.actions {
  display: flex;
  justify-content: flex-start;
  gap: clamp(0.3rem, 1vw, 1rem);
  flex-wrap: wrap;
  align-items: center;
}

.manage-btn,
.class-list-btn {
  background-color: #e0e7ff;
  color: #4f46e5;
  border: 1px solid #c7d2fe;
  padding: clamp(0.3rem, 1vw, 0.5rem) clamp(0.6rem, 1.5vw, 0.9rem);
  border-radius: 5px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: clamp(0.75rem, 1.2vw, 0.9rem);
  transition: all 0.3s ease;
  white-space: nowrap;
}

.manage-btn:hover {
  background-color: #d1d5db;
  transform: translateY(-1px);
}

.class-list-btn:hover {
  background-color: #d4d7ff;
  transform: translateY(-1px);
}

.payment-btn {
  background-color: #10b981;
  color: #fff;
  border: 1px solid #059669;
  padding: clamp(0.3rem, 1vw, 0.5rem) clamp(0.6rem, 1.5vw, 0.9rem);
  border-radius: 5px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: clamp(0.75rem, 1.2vw, 0.9rem);
  transition: all 0.3s ease;
  white-space: nowrap;
}

.payment-btn:hover {
  background-color: #059669;
  transform: translateY(-1px);
}

.receipt-count-badge {
  background-color: #e0f2f1;
  color: #00695c;
  padding: 0.3rem 0.6rem;
  border-radius: 12px;
  font-size: clamp(0.75rem, 1vw, 0.85rem);
  font-weight: 500;
}

.no-receipts {
  color: #999;
  font-style: italic;
  font-size: clamp(0.75rem, 1vw, 0.85rem);
}

.receipts-view-btn {
  background-color: #3b82f6;
  color: #fff;
  border: 1px solid #2563eb;
  padding: clamp(0.3rem, 1vw, 0.5rem) clamp(0.6rem, 1.5vw, 0.9rem);
  border-radius: 5px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: clamp(0.75rem, 1.2vw, 0.9rem);
  transition: all 0.3s ease;
  white-space: nowrap;
}

.receipts-view-btn:hover {
  background-color: #2563eb;
  transform: translateY(-1px);
}

.actions .material-symbols-outlined {
  font-size: clamp(0.9rem, 1.5vw, 1rem);
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

/* Pagination styles */
.pagination {
  margin-top: clamp(0.5rem, 1.5vw, 1rem);
  text-align: center;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.pagination button {
  margin: 0;
  padding: clamp(0.3rem, 1vw, 0.5rem) clamp(0.6rem, 1.5vw, 1rem);
  cursor: pointer;
  border: 2px solid #2b7ab7;
  color: #2b7ab7;
  border-radius: 5px;
  background: white;
  font-size: clamp(0.8rem, 1.2vw, 1rem);
  transition: all 0.3s ease;
  min-width: 80px;
}

.pagination button:hover:not(:disabled) {
  background-color: #2b7ab7;
  color: white;
  transform: translateY(-1px);
}

.pagination button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination span {
  font-weight: bold;
  font-size: clamp(0.9rem, 1.3vw, 1.1rem);
  padding: 0 0.5rem;
}

/* Responsive Breakpoints */
@media only screen and (max-width: 1400px) {
  .students-table th,
  .students-table td {
    padding: clamp(0.6rem, 1vw, 0.9rem);
  }
}

@media only screen and (max-width: 1024px) {
  .the-page {
    margin-top: clamp(3rem, 8vw, 4.5rem);
  }

  .students-table th,
  .students-table td {
    padding: clamp(0.5rem, 1vw, 0.75rem);
    font-size: clamp(0.85rem, 1.1vw, 0.95rem);
  }

  .search-input {
    max-width: 100%;
    width: 100%;
  }
}

@media only screen and (max-width: 768px) {
  .the-page {
    padding: clamp(0.4rem, 2vw, 0.8rem);
    padding-left: clamp(0.5rem, 2.5vw, 0.8rem);
    margin-top: clamp(2.5rem, 7vw, 3.5rem);
    overflow-x: visible;
  }

  .header-container {
    flex-direction: column;
    align-items: stretch;
  }

  .header-object1 {
    width: 100%;
  }

  .action-btn {
    width: 100%;
    justify-content: center;
  }

  .header-container1 {
    width: 100%;
    padding: 0;
    margin: 0;
    padding-left: 0;
    margin-left: 0;
    overflow: visible;
    position: relative;
  }

  .header-container1 h2 {
    text-align: left;
    font-size: clamp(1rem, 3.5vw, 1.3rem);
    word-wrap: break-word;
    overflow-wrap: break-word;
    white-space: normal;
    line-height: 1.4;
    width: 100%;
    padding: 0 0 0.5rem 0;
    margin: 0;
    padding-left: 0;
    margin-left: 0;
    overflow: visible;
    text-indent: 0;
    box-sizing: border-box;
  }

  .search-area {
    flex-direction: column;
    align-items: stretch;
  }

  .search-input {
    width: 100%;
    margin-left: 0;
  }

  .table-container {
    padding: clamp(0.4rem, 1.5vw, 0.8rem);
    border-radius: 6px;
  }

  /* Hide desktop table on mobile */
  .desktop-table {
    display: none !important;
  }

  /* Show mobile cards on small screens */
  .mobile-cards {
    display: block;
  }

  .card-header {
    padding: clamp(0.75rem, 2vw, 1rem);
  }

  .card-body {
    padding: clamp(0.6rem, 2vw, 0.85rem) clamp(0.75rem, 2vw, 1rem);
  }

  .card-row {
    padding: clamp(0.4rem, 1.2vw, 0.55rem) 0;
    flex-direction: row;
    align-items: center;
    gap: 0.5rem;
  }

  .card-label {
    min-width: 110px;
    font-size: clamp(0.8rem, 1.1vw, 0.9rem);
    text-align: left;
  }

  .card-value {
    text-align: right;
    font-size: clamp(0.85rem, 1.2vw, 0.95rem);
  }

  .card-footer {
    padding: clamp(0.75rem, 2vw, 1rem);
    flex-direction: column;
  }

  .card-action-btn {
    width: 100%;
  }

  .pagination {
    flex-direction: column;
    gap: 0.5rem;
    margin-top: 1rem;
  }

  .pagination button {
    width: 100%;
    max-width: 150px;
  }

  .students-controls {
    flex-direction: column;
    align-items: stretch;
  }

  .students-controls label {
    width: 100%;
  }

  .form-control {
    width: 100%;
  }

  /* Modal Responsive Styles */
  .modal-wrap {
    padding: 1rem;
  }

  .modal-content {
    width: 100%;
    max-width: min(90vw, 800px);
    padding: clamp(1rem, 3vw, 1.5rem);
    max-height: min(90vh, 600px);
    overflow-y: auto;
  }

  .modal-header h2 {
    font-size: clamp(1rem, 2vw, 1.3rem);
  }
}

@media only screen and (max-width: 480px) {
  .the-page {
    padding: clamp(0.25rem, 1.5vw, 0.5rem);
    padding-left: clamp(0.5rem, 2vw, 0.75rem);
    margin-top: clamp(2rem, 6vw, 3rem);
    overflow-x: visible;
  }

  .header-container1 {
    width: 100%;
    padding: 0;
    margin: 0;
    padding-left: 0;
    margin-left: 0;
    overflow: visible;
    position: relative;
    min-width: 0;
  }

  .header-container1 h2 {
    font-size: clamp(0.95rem, 4.5vw, 1.2rem);
    word-wrap: break-word;
    overflow-wrap: break-word;
    white-space: normal;
    line-height: 1.4;
    width: auto;
    max-width: 100%;
    padding: 0 0 0.5rem 0;
    margin: 0;
    padding-left: 0;
    margin-left: 0;
    overflow: visible;
    text-align: left;
    text-indent: 0;
    box-sizing: border-box;
    min-width: 0;
    display: block;
  }

  /* Hide desktop table completely on small screens */
  .desktop-table {
    display: none !important;
  }

  /* Enhanced card styles for very small screens */
  .mobile-cards {
    display: block;
  }

  .invoice-card {
    margin-bottom: 0.75rem;
    border-radius: 6px;
  }

  .card-header {
    padding: 0.75rem;
    flex-wrap: wrap;
  }

  .card-number {
    width: 28px;
    height: 28px;
    font-size: 0.85rem;
  }

  .card-title {
    font-size: clamp(0.95rem, 3vw, 1.1rem);
    white-space: normal;
    line-height: 1.3;
  }

  .card-body {
    padding: 0.6rem 0.75rem;
  }

  .card-row {
    padding: 0.45rem 0;
    gap: 0.4rem;
    flex-direction: row;
    align-items: center;
  }

  .card-label {
    font-size: clamp(0.8rem, 2vw, 0.85rem);
    font-weight: 600;
    min-width: 100px;
    text-align: left;
  }

  .card-value {
    font-size: clamp(0.85rem, 2vw, 0.9rem);
    text-align: right;
  }

  .card-footer {
    padding: 0.75rem;
  }

  .card-action-btn {
    padding: 0.65rem 0.85rem;
    font-size: clamp(0.8rem, 2vw, 0.9rem);
  }

  .manage-btn,
  .class-list-btn,
  .payment-btn,
  .receipts-view-btn {
    padding: clamp(0.3rem, 1vw, 0.4rem) clamp(0.5rem, 1.5vw, 0.7rem);
    font-size: clamp(0.7rem, 1vw, 0.8rem);
  }

  .action-btn {
    padding: clamp(0.4rem, 1.2vw, 0.5rem) clamp(0.6rem, 1.5vw, 0.8rem);
    font-size: clamp(0.8rem, 1.1vw, 0.9rem);
  }

  .pagination button {
    padding: clamp(0.3rem, 1vw, 0.4rem) clamp(0.5rem, 1.2vw, 0.7rem);
    font-size: clamp(0.75rem, 1vw, 0.85rem);
  }

  .actions-header {
    padding: clamp(0.3rem, 1vw, 0.5rem);
  }
}

@media only screen and (max-width: 360px) {
  /* Ensure cards are shown on very small screens */
  .desktop-table {
    display: none !important;
  }

  .mobile-cards {
    display: block;
  }

  .card-header {
    padding: 0.6rem;
  }

  .card-body {
    padding: 0.5rem 0.6rem;
  }

  .card-row {
    padding: 0.4rem 0;
    flex-direction: row;
    align-items: center;
  }

  .card-label {
    font-size: 0.75rem;
    min-width: 95px;
    text-align: left;
  }

  .card-value {
    font-size: 0.8rem;
    text-align: right;
  }

  .card-action-btn {
    font-size: 0.8rem;
    padding: 0.6rem 0.75rem;
  }

  .manage-btn,
  .class-list-btn,
  .payment-btn,
  .receipts-view-btn {
    font-size: 0.7rem;
    padding: 0.3rem 0.4rem;
  }

  .action-btn {
    font-size: 0.75rem;
    padding: 0.35rem 0.5rem;
  }
}

/* Delete Confirmation Modal Styles (matching Contacts/Receipts delete modal) */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-overlay .modal-content {
  width: 100%;
  max-width: min(90vw, 500px);
  padding: clamp(1rem, 3vw, 2rem);
  max-height: min(90vh, 700px);
  overflow-y: auto;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.modal-overlay .modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: clamp(0.75rem, 2vw, 1rem);
  padding-bottom: clamp(0.5rem, 1.5vw, 0.75rem);
  border-bottom: 2px solid #e9ecef;
}

.modal-overlay .modal-header h3 {
  font-size: clamp(1.1rem, 2vw, 1.5rem);
  margin: 0;
  color: #333;
}

.modal-overlay .close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #6c757d;
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.modal-overlay .close-btn:hover {
  background-color: #f8f9fa;
  color: #dc3545;
}

.modal-overlay .modal-body {
  margin-bottom: clamp(0.75rem, 2vw, 1rem);
}

.delete-warning-text {
  font-size: clamp(1rem, 1.5vw, 1.2rem);
  margin-bottom: 1rem;
  color: #333;
  line-height: 1.5;
}

.delete-warning-text strong {
  color: #dc3545;
}

.delete-preview {
  background-color: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  padding: 1rem;
  margin: 1rem 0;
}

.preview-row {
  padding: 0.5rem 0;
  border-bottom: 1px solid #e9ecef;
  font-size: clamp(0.9rem, 1.3vw, 1rem);
}

.preview-row:last-child {
  border-bottom: none;
}

.preview-row strong {
  color: #495057;
  margin-right: 0.5rem;
}

.delete-warning-note {
  background-color: #fff3cd;
  border: 1px solid #ffc107;
  border-radius: 4px;
  padding: 0.75rem;
  margin: 1rem 0;
  font-size: clamp(0.85rem, 1.2vw, 0.95rem);
  color: #856404;
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
}

.delete-warning-note i {
  color: #ffc107;
  font-size: 1.1rem;
  margin-top: 0.1rem;
  flex-shrink: 0;
}

.reason-input-group {
  margin-top: 1rem;
}

.reason-input-group label {
  display: block;
  font-weight: 600;
  color: #333;
  margin-bottom: 0.5rem;
  font-size: clamp(0.9rem, 1.3vw, 1rem);
}

.reason-input-group .required {
  color: #dc3545;
}

.reason-textarea {
  width: 100%;
  border: 1px solid #ced4da;
  border-radius: 4px;
  padding: 0.75rem;
  font-size: clamp(0.9rem, 1.2vw, 1rem);
  font-family: inherit;
  resize: vertical;
  min-height: 80px;
  transition: border-color 0.3s ease;
  box-sizing: border-box;
}

.reason-textarea:focus {
  outline: none;
  border-color: #2b7ab7;
  box-shadow: 0 0 0 2px rgba(43, 122, 183, 0.2);
}

.reason-textarea::placeholder {
  color: #6c757d;
}

.reason-help-text {
  margin-top: 0.5rem;
  font-size: clamp(0.8rem, 1.1vw, 0.9rem);
  color: #6c757d;
  font-style: italic;
}

.form-actions {
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
  margin-top: clamp(0.75rem, 2vw, 1rem);
}

.cancel-btn {
  background-color: #ddd;
  color: #333;
  padding: clamp(0.4rem, 1vw, 0.6rem) clamp(0.8rem, 2vw, 1.2rem);
  font-size: clamp(0.85rem, 1.3vw, 1rem);
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.cancel-btn:hover {
  background-color: #bbb;
}

.delete-confirm-btn {
  background-color: #dc3545;
  color: white;
  padding: clamp(0.4rem, 1vw, 0.6rem) clamp(0.8rem, 2vw, 1.2rem);
  font-size: clamp(0.85rem, 1.3vw, 1rem);
  border: none;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: background-color 0.3s ease;
}

.delete-confirm-btn:hover:not(:disabled) {
  background-color: #c82333;
}

.delete-confirm-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.delete-confirm-btn .material-symbols-outlined {
  font-size: 1.1rem;
}

@media only screen and (max-width: 480px) {
  .modal-overlay .modal-content {
    width: 95vw;
    padding: clamp(0.75rem, 3vw, 1.25rem);
    border-radius: 6px;
  }

  .delete-preview {
    padding: 0.75rem;
  }

  .preview-row {
    padding: 0.4rem 0;
    font-size: clamp(0.85rem, 1.2vw, 0.9rem);
  }

  .delete-warning-note {
    padding: 0.6rem;
    font-size: clamp(0.8rem, 1.1vw, 0.85rem);
  }
}
</style>

