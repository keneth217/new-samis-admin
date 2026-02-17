<template>
  <div class="invoices-page">
    <!-- Header with title and search -->
    <div class="page-header">
      <h1 class="page-title">Invoices & Schools</h1>


      <div class="search-wrapper">
 <div class="search-wrapper">
  <input
    v-model="searchQuery"
    type="text"
    placeholder="Search by invoice number, school name or code"
    class="search-input"
    aria-label="Search invoices"
  />
</div>
</div>
    </div>

    <!-- Summary Stats Cards -->
    <div class="stats-grid" v-if="invoices.length">
      <div class="stat-card">
        <div class="stat-icon">📄</div>
        <div class="stat-content">
          <span class="stat-label">Total Invoices</span>
          <span class="stat-value">{{ invoices.length }}</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">💰</div>
        <div class="stat-content">
          <span class="stat-label">Total Amount</span>
          <span class="stat-value">KSh {{ formatNumber(totalAmount) }}</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">✅</div>
        <div class="stat-content">
          <span class="stat-label">Paid Amount</span>
          <span class="stat-value">KSh {{ formatNumber(totalPaid) }}</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">⚖️</div>
        <div class="stat-content">
          <span class="stat-label">Balance</span>
          <span class="stat-value">KSh {{ formatNumber(totalBalance) }}</span>
        </div>
      </div>
    </div>

    <!-- Action Bar: Create Invoice + Filters -->
    <div class="action-bar">
      <button @click="openForm" class="btn btn-primary" aria-label="Create Invoice">
        <span class="material-symbols-outlined">add_circle</span>
        Create Invoice
      </button>

      <div class="filters">
        <div class="filter-group">
          <label for="invoicesPerPage" class="filter-label">Show:</label>
          <select
            id="invoicesPerPage"
            v-model="invoicesPerPage"
            @change="updateInvoicesPerPage"
            class="filter-select"
          >
            <option v-for="option in invoicesPerPageOptions" :key="option" :value="option">
              {{ option }}
            </option>
          </select>
        </div>

        <div class="filter-group">
          <label for="schoolFilter" class="filter-label">School:</label>

          <select
  id="schoolFilter"
  v-model="selectedSchoolCode"
  @change="onSchoolFilterChange"
  class="filter-select"
 style="width: 120px;"
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
      </div>
    </div>

    <!-- Invoices Table (Desktop) -->
    <div class="table-wrapper">
      <table class="invoices-table" v-if="displayedInvoices.length > 0">
        <thead>
          <tr>
            <th>#</th>
            <th>Invoice Number</th>
            <th>School Name</th>
            <th>Code</th>
            <th>Invoice Date</th>
            <th>Due Date</th>
            <th>Amount</th>
            <th>Paid</th>
            <th>Balance</th>
            <th>Status</th>
            <th>Receipts</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(invoice, index) in displayedInvoices"
            :key="invoice.invoiceNo || invoice.invoiceID || index"
          >
            <td>{{ (currentPage - 1) * invoicesPerPage + index + 1 }}</td>
            <td>{{ invoice.invoiceNumber || invoice.invoiceNo }}</td>
            <td>{{ invoice.schoolName }}</td>
            <td>{{ invoice.schoolCode }}</td>
            <td>{{ invoice.invoiceDate }}</td>
            <td>{{ invoice.dueDate }}</td>
            <td class="amount">KSh {{ formatNumber(invoice.amount) }}</td>
            <td class="paid">KSh {{ formatNumber(invoice.totalPaid || 0) }}</td>
            <td :class="['balance', getBalanceClass(invoice)]">
              KSh {{ formatNumber((invoice.amount || 0) - (invoice.totalPaid || 0)) }}
            </td>
            <td>
              <span :class="['status-badge', invoice.status.toLowerCase().replace(' ', '-')]">
                {{ invoice.status }}
              </span>
            </td>
            <td>
              <span v-if="invoice.receiptCount > 0" class="receipt-badge">
                {{ invoice.receiptCount }} Receipt(s)
              </span>
              <span v-else class="no-receipts">—</span>
            </td>
            <td class="actions-cell">
              <button
                @click="viewInvoice(invoice)"
                class="action-btn icon-btn"
                title="View Invoice"
                aria-label="View Invoice"
              >
                <span class="material-symbols-outlined">visibility</span>
              </button>
              <button
                v-if="invoice.status !== 'Paid'"
                @click="recordPayment(invoice)"
                class="action-btn payment-btn"
                title="Record Payment"
                aria-label="Record Payment"
              >
                <span class="material-symbols-outlined">payment</span>
              </button>
              <button
                v-if="invoice.receiptCount > 0"
                @click="viewReceiptsForInvoice(invoice)"
                class="action-btn receipts-btn"
                title="View Receipts"
                aria-label="View Receipts"
              >
                <span class="material-symbols-outlined">receipt</span>
              </button>
              <button
                @click="deleteInvoice(invoice)"
                class="action-btn delete-btn"
                title="Delete Invoice"
                aria-label="Delete Invoice"
              >
                <span class="material-symbols-outlined">delete</span>
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Mobile Cards -->
      <div v-else-if="displayedInvoices.length > 0" class="mobile-cards">
        <div
          v-for="(invoice, index) in displayedInvoices"
          :key="invoice.invoiceNo || invoice.invoiceID || index"
          class="invoice-card"
        >
          <div class="card-header">
            <div class="card-index">{{ (currentPage - 1) * invoicesPerPage + index + 1 }}</div>
            <h3 class="card-school">{{ invoice.schoolName }}</h3>
            <span :class="['status-badge', invoice.status.toLowerCase().replace(' ', '-')]">
              {{ invoice.status }}
            </span>
          </div>
          <div class="card-body">
            <div class="card-row">
              <span class="card-label">Invoice #:</span>
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
              <span class="card-value amount">KSh {{ formatNumber(invoice.amount) }}</span>
            </div>
            <div class="card-row">
              <span class="card-label">Paid:</span>
              <span class="card-value paid">KSh {{ formatNumber(invoice.totalPaid || 0) }}</span>
            </div>
            <div class="card-row">
              <span class="card-label">Balance:</span>
              <span :class="['card-value', getBalanceClass(invoice)]">
                KSh {{ formatNumber((invoice.amount || 0) - (invoice.totalPaid || 0)) }}
              </span>
            </div>
            <div class="card-row">
              <span class="card-label">Receipts:</span>
              <span class="card-value">
                <span v-if="invoice.receiptCount > 0" class="receipt-badge">
                  {{ invoice.receiptCount }} Receipt(s)
                </span>
                <span v-else class="no-receipts">—</span>
              </span>
            </div>
          </div>
          <div class="card-footer">
            <button @click="viewInvoice(invoice)" class="card-action icon-btn" title="View">
              <span class="material-symbols-outlined">visibility</span>
            </button>
            <button
              v-if="invoice.status !== 'Paid'"
              @click="recordPayment(invoice)"
              class="card-action payment-btn"
              title="Record Payment"
            >
              <span class="material-symbols-outlined">payment</span>
            </button>
            <button
              v-if="invoice.receiptCount > 0"
              @click="viewReceiptsForInvoice(invoice)"
              class="card-action receipts-btn"
              title="View Receipts"
            >
              <span class="material-symbols-outlined">receipt</span>
            </button>
            <button
              @click="deleteInvoice(invoice)"
              class="card-action delete-btn"
              title="Delete Invoice"
            >
              <span class="material-symbols-outlined">delete</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="empty-state">
        <span class="material-symbols-outlined empty-icon">receipt_long</span>
        <h3>No Invoices Found</h3>
        <p v-if="searchQuery || selectedSchoolCode">
          Try adjusting your search or filter.
        </p>
        <p v-else>
          Get started by creating your first invoice.
        </p>
        <button v-if="!searchQuery && !selectedSchoolCode" @click="openForm" class="btn btn-primary">
          <span class="material-symbols-outlined">add_circle</span>
          Create Invoice
        </button>
      </div>

      <!-- Pagination -->
      <div class="pagination" v-if="totalPages > 1">
        <button @click="prevPage" :disabled="currentPage === 1" class="pagination-btn">
          <span class="material-symbols-outlined">chevron_left</span>
          Previous
        </button>
        <span class="page-info">{{ currentPage }} / {{ totalPages }}</span>
        <button @click="nextPage" :disabled="currentPage === totalPages" class="pagination-btn">
          Next
          <span class="material-symbols-outlined">chevron_right</span>
        </button>
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

    <!-- Receipt Form Modal -->
    <NewReceiptForm
      :invoice="selectedInvoiceForPayment"
      :receipt="selectedReceipt"
      @closeForm="closePaymentForm"
      @fetchInvoices="fetchInvoices"
      v-if="showPaymentForm"
    />

    <!-- Receipts List Modal -->
    <div v-if="showReceiptsModal" class="modal-overlay" @click.self="closeReceiptsModal">
      <div class="modal-content">
        <div class="modal-header">
          <h2>
            Receipts for {{ selectedInvoiceForReceipts?.schoolName }}
            ({{ selectedInvoiceForReceipts?.schoolCode }})
          </h2>
          <button @click="closeReceiptsModal" class="modal-close" aria-label="Close">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>
        <div class="modal-body">
          <div v-if="receiptsList.length === 0" class="empty-state small">
            <span class="material-symbols-outlined empty-icon">receipt</span>
            <p>No receipts found for this invoice.</p>
          </div>
          <table v-else class="receipts-table">
            <thead>
              <tr>
                <th>Receipt Number</th>
                <th>Date</th>
                <th>Amount</th>
                <th>Method</th>
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
                <td class="actions-cell">
                  <button @click="editReceipt(receipt)" class="action-btn icon-btn" title="Edit">
                    <span class="material-symbols-outlined">edit</span>
                  </button>
                  <button @click="deleteReceipt(receipt)" class="action-btn delete-btn" title="Reverse">
                    <span class="material-symbols-outlined">undo</span>
                  </button>
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td colspan="2"><strong>Total</strong></td>
                <td colspan="4">
                  <strong>KSh {{ formatNumber(receiptsList.reduce((sum, r) => sum + (r.amount || 0), 0)) }}</strong>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>

    <!-- Delete Receipt Confirmation Modal -->
    <div v-if="showDeleteDialog" class="modal-overlay" @click.self="cancelDelete">
      <div class="modal-content confirm-modal">
        <div class="modal-header">
          <h3>Reverse Receipt</h3>
          <button @click="cancelDelete" class="modal-close" aria-label="Close">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>
        <div class="modal-body">
          <p class="confirm-text">
            Are you sure you want to reverse receipt
            <strong>{{ receiptToDelete?.receiptNumber || receiptToDelete?.receiptNo }}</strong>?
          </p>
          <div class="receipt-preview">
            <div class="preview-row">
              <span>Amount:</span>
              <span>KSh {{ formatNumber(receiptToDelete?.amount) }}</span>
            </div>
            <div class="preview-row" v-if="receiptToDelete?.paymentMethod">
              <span>Payment Method:</span>
              <span>{{ receiptToDelete.paymentMethod }}</span>
            </div>
          </div>
          <div class="warning-note">
            <span class="material-symbols-outlined">warning</span>
            <p>This will undo the payment allocation on all related invoices.</p>
          </div>
          <div class="form-group">
            <label for="deleteReason">Reversal Reason <span class="required">*</span></label>
            <textarea
              id="deleteReason"
              v-model="deleteReason"
              rows="3"
              placeholder="Type the reversal reason here..."
              class="form-control"
            ></textarea>
            <small class="help-text">This reason will be stored for audit purposes.</small>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="cancelDelete">Cancel</button>
          <button
            class="btn btn-danger"
            @click="confirmDelete"
            :disabled="!deleteReason.trim()"
          >
            <span class="material-symbols-outlined">undo</span>
            Reverse Receipt
          </button>
        </div>
      </div>
    </div>

    <!-- Delete Invoice Confirmation Modal -->
    <div v-if="showInvoiceDeleteDialog" class="modal-overlay" @click.self="cancelInvoiceDelete">
      <div class="modal-content confirm-modal">
        <div class="modal-header">
          <h3>Delete Invoice</h3>
          <button @click="cancelInvoiceDelete" class="modal-close" aria-label="Close">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>
        <div class="modal-body">
          <p class="confirm-text">
            Are you sure you want to delete
            <strong>{{ invoiceToDelete?.invoiceNumber || invoiceToDelete?.invoiceNo }}</strong>?
          </p>
          <div class="receipt-preview">
            <div class="preview-row">
              <span>School Code:</span>
              <span>{{ invoiceToDelete?.schoolCode }}</span>
            </div>
            <div class="preview-row">
              <span>Amount:</span>
              <span>KSh {{ formatNumber(invoiceToDelete?.amount) }}</span>
            </div>
            <div class="preview-row">
              <span>Status:</span>
              <span>{{ invoiceToDelete?.status }}</span>
            </div>
          </div>
          <div class="warning-note">
            <span class="material-symbols-outlined">warning</span>
            <p>This will soft delete the invoice and all its details, and will update the school status.</p>
          </div>
          <div class="form-group">
            <label for="invoiceDeleteReason">Delete Reason <span class="required">*</span></label>
            <textarea
              id="invoiceDeleteReason"
              v-model="invoiceDeleteReason"
              rows="3"
              placeholder="Type the delete reason here..."
              class="form-control"
            ></textarea>
            <small class="help-text">This reason will be stored for audit tracking.</small>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="cancelInvoiceDelete">Cancel</button>
          <button
            class="btn btn-danger"
            @click="confirmInvoiceDelete"
            :disabled="!invoiceDeleteReason.trim()"
          >
            <span class="material-symbols-outlined">delete</span>
            Delete Invoice
          </button>
        </div>
      </div>
    </div>

    <LoadingSpinner :isLoading="Loading" />
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
    // Summary stats
    totalAmount() {
      return this.invoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);
    },
    totalPaid() {
      return this.invoices.reduce((sum, inv) => sum + (inv.totalPaid || 0), 0);
    },
    totalBalance() {
      return this.totalAmount - this.totalPaid;
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
        maximumFractionDigits: 2,
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
        const response = await axios.post('/invoices/list');

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
              receiptCount: invoice.receiptCount || invoice.receipt_count || 0,
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
              receiptCount: invoice.receiptCount || invoice.receipt_count || 0,
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
    this.fetchInvoices();
    this.fetchSchools();
  },
};
</script>

<style scoped>
/* ===== Base Styles (from schools page) ===== */
* {
  padding: 0;
  margin: 0;
  box-sizing: border-box;
}

.invoices-page {
  margin-top: 4.5rem;
  padding: clamp(0.5rem, 2vw, 1rem);
  background-color: #f4f6fa;
  width: 100%;
  min-height: calc(100vh - 4.5rem);
}

/* ===== Header (from schools page, but search updated) ===== */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: clamp(0.5rem, 1.5vw, 1rem);
  flex-wrap: wrap;
  gap: 0.5rem;
  width: 100%;
  overflow: visible;
}

.page-title {
  font-size: clamp(1.1rem, 2.5vw, 1.5rem);
  color: #333;
  padding: 0 0 0.5rem 0;
  margin: 0;
  word-wrap: break-word;
  overflow-wrap: break-word;
  white-space: normal;
  line-height: 1.3;
  width: 100%;
  box-sizing: border-box;
}

/* ----- NEW SEARCH STYLES (from modern design) ----- */
.search-wrapper {
  position: relative;
  flex: 1;
  min-width: 200px;
}

.search-icon {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #9ca3af;
  font-size: 1.25rem;
}

.search-input {
  padding: clamp(0.3rem, 1vw, 0.5rem);
  border-radius: 5px;
  border: 2px solid #2b7ab7;
  outline: none;
  font-size: clamp(0.85rem, 1.5vw, 1rem);
  width: 100%;
  max-width: 400px;
  background: white;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.search-input:focus {
  border-color: #1e6192;
  box-shadow: 0 0 0 2px rgba(43, 122, 183, 0.2);
}

/* ===== Stats Cards (unchanged from schools page) ===== */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: white;
  border-radius: 5px;
  padding: 1.5rem;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: transform 0.2s, box-shadow 0.2s;
  border: 1px solid #e1e4ea;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.stat-icon {
  font-size: 2rem;
  width: 3rem;
  height: 3rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #e5f0f9 0%, #ffffff 100%);
  border-radius: 50%;
}

.stat-content {
  display: flex;
  flex-direction: column;
}

.stat-label {
  font-size: 0.875rem;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #333;
  line-height: 1.2;
}

/* ===== Action Bar (unchanged from schools page) ===== */
.action-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  border: none;
  border-radius: 5px;
  font-weight: 500;
  font-size: clamp(0.85rem, 1.5vw, 1rem);
  cursor: pointer;
  transition: all 0.2s;
  background: white;
  color: #333;
  border: 1px solid #2b7ab7;
}

.btn-primary {
  background-color: #2b7ab7;
  color: #fff;
  border: none;
}

.btn-primary:hover {
  background-color: #1e6192;
  transform: translateY(-1px);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.btn-secondary {
  background: white;
  border: 1px solid #ddd;
}

.btn-secondary:hover {
  background: #f3f4f6;
}

.btn-danger {
  background-color: #dc3545;
  color: white;
  border: none;
}

.btn-danger:hover:not(:disabled) {
  background-color: #c82333;
  transform: translateY(-1px);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.filters {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.filter-label {
  color: #2b7ab7;
  font-size: clamp(0.9rem, 1.5vw, 1.1rem);
  white-space: nowrap;
}

.filter-select {
  padding: 0.5rem 2rem 0.5rem 1rem;
  border: 1px solid #2b7ab7;
  border-radius: 4px;
  font-size: 0.9rem;
  background: white url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="%236b7280" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>') no-repeat right 0.75rem center;
  appearance: none;
  cursor: pointer;
  transition: border-color 0.2s;
  min-width: 130px;
}

.filter-select:focus {
  outline: none;
  border-color: #1e6192;
  box-shadow: 0 0 0 2px rgba(43, 122, 183, 0.2);
}

/* ===== TABLE STYLES (new modern design) ===== */
.table-wrapper {
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  padding: 1.5rem;
  overflow-x: auto;
}

.invoices-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.95rem;
}

.invoices-table th {
  text-align: left;
  padding: 1rem 1rem;
  background: #f9fafb;
  color: #4b5563;
  font-weight: 600;
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 2px solid #e5e7eb;
  white-space: nowrap;
}

.invoices-table td {
  padding: 1rem;
  border-bottom: 1px solid #e5e7eb;
  vertical-align: middle;
  white-space: nowrap;
}

.invoices-table tbody tr {
  transition: background-color 0.2s;
}

.invoices-table tbody tr:hover {
  background-color: #f9fafb;
}

.amount,
.paid,
.balance {
  font-family: 'Courier New', monospace;
  font-weight: 600;
}

.paid {
  color: #10b981;
}

.balance-paid {
  color: #10b981;
}

.balance-remaining {
  color: #f59e0b;
}

.balance-overpaid {
  color: #ef4444;
}

/* Status Badges */
.status-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.status-badge.paid {
  background: #d1fae5;
  color: #065f46;
}

.status-badge.partially-paid {
  background: #fef3c7;
  color: #92400e;
}

.status-badge.overdue {
  background: #fee2e2;
  color: #b91c1c;
}

.status-badge.pending {
  background: #f3f4f6;
  color: #4b5563;
}

.receipt-badge {
  background: #e5f0f9;
  color: #1e6192;
  padding: 0.25rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
}

.no-receipts {
  color: #9ca3af;
  font-size: 0.875rem;
}

/* Action Buttons inside table */
.actions-cell {
  display: flex;
  gap: 0.5rem;
  white-space: nowrap;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border: none;
  border-radius: 9999px;
  background: transparent;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover {
  background: #f3f4f6;
  color: #374151;
}

.action-btn.payment-btn {
  color: #10b981;
}

.action-btn.payment-btn:hover {
  background: #d1fae5;
  color: #065f46;
}

.action-btn.receipts-btn {
  color: #2b7ab7;
}

.action-btn.receipts-btn:hover {
  background: #e5f0f9;
  color: #1e6192;
}

.action-btn.delete-btn:hover {
  background: #fee2e2;
  color: #ef4444;
}

/* ===== Mobile Cards (unchanged from schools page) ===== */
.mobile-cards {
  display: none;
}

/* ===== Empty State (unchanged) ===== */
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.empty-state.small {
  padding: 2rem;
}

.empty-icon {
  font-size: 4rem;
  color: #d1d5db;
  margin-bottom: 1rem;
}

.empty-state h3 {
  font-size: 1.5rem;
  color: #374151;
  margin-bottom: 0.5rem;
}

.empty-state p {
  color: #6b7280;
  margin-bottom: 1.5rem;
}

/* ===== Pagination (unchanged from schools page) ===== */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 2rem;
}

.pagination-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.5rem 1rem;
  border: 2px solid #2b7ab7;
  background: white;
  border-radius: 5px;
  font-size: 0.9rem;
  color: #2b7ab7;
  cursor: pointer;
  transition: all 0.2s;
}

.pagination-btn:hover:not(:disabled) {
  background: #2b7ab7;
  color: white;
  border-color: #2b7ab7;
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  font-weight: 600;
  color: #333;
  font-size: clamp(0.9rem, 1.3vw, 1.1rem);
}

/* ===== MODALS (unchanged from schools page) ===== */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10001;
  padding: 1rem;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.modal-content {
  background: white;
  border-radius: 8px;
  width: 90%;
  max-width: 700px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  animation: slideUp 0.3s ease;
}

.confirm-modal {
  max-width: 500px;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 2px solid #e5e7eb;
  background: #4368b9;
  color: gold;
  border-radius: 8px 8px 0 0;
}

.modal-header h2,
.modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: gold;
}

.modal-close {
  background: none;
  border: none;
  color: gold;
  cursor: pointer;
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s;
}

.modal-close:hover {
  background: rgba(255, 255, 255, 0.2);
  color: white;
}

.modal-body {
  padding: 1.5rem;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1rem 1.5rem 1.5rem;
  border-top: 1px solid #e5e7eb;
}

/* Receipts Table inside modal */
.receipts-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

.receipts-table th {
  background: #f9fafb;
  padding: 0.75rem 1rem;
  text-align: left;
  font-weight: 600;
  color: #4b5563;
  border-bottom: 2px solid #e5e7eb;
}

.receipts-table td {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.receipts-table tbody tr:hover {
  background: #f9fafb;
}

.receipts-table tfoot td {
  background: #f9fafb;
  padding: 0.75rem 1rem;
  font-weight: 600;
  border-top: 2px solid #e5e7eb;
}

/* Delete confirmation preview */
.receipt-preview,
.delete-school-preview {
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  padding: 1rem;
  margin: 1rem 0;
}

.preview-row {
  display: flex;
  justify-content: space-between;
  padding: 0.25rem 0;
  border-bottom: 1px dashed #e9ecef;
}

.preview-row:last-child {
  border-bottom: none;
}

.preview-row strong,
.preview-row span:first-child {
  color: #495057;
  margin-right: 0.5rem;
}

.warning-note {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: #fff3cd;
  border: 1px solid #ffc107;
  border-radius: 4px;
  padding: 0.75rem 1rem;
  margin: 1rem 0;
  color: #856404;
}

.warning-note .material-symbols-outlined {
  color: #ffc107;
}

/* Form elements inside modals */
.form-group {
  margin-top: 1.5rem;
}

.form-group label {
  display: block;
  font-weight: 600;
  color: #333;
  margin-bottom: 0.5rem;
  font-size: 0.95rem;
}

.form-group .required {
  color: #dc3545;
}

.form-control {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e5e7eb;
  border-radius: 4px;
  font-size: 1rem;
  font-family: inherit;
  transition: border-color 0.2s;
  resize: vertical;
}

.form-control:focus {
  outline: none;
  border-color: #2b7ab7;
  box-shadow: 0 0 0 3px rgba(43, 122, 183, 0.2);
}

.help-text {
  display: block;
  margin-top: 0.25rem;
  font-size: 0.875rem;
  color: #6b7280;
}

/* Confirmation buttons */
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

/* ===== Mobile Card Styles (unchanged from schools page) ===== */
@media (max-width: 768px) {
  .desktop-table {
    display: none !important;
  }

  .mobile-cards {
    display: block;
  }

  .invoice-card {
    background: white;
    border: 1px solid #e1e4ea;
    border-radius: 8px;
    margin-bottom: 1rem;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    overflow: hidden;
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

  .card-index {
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

  .card-school {
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

  .card-action {
    flex: 1;
    min-width: 120px;
    background-color: #e0e7ff;
    color: #4f46e5;
    border: 1px solid #c7d2fe;
    padding: 0.75rem 1rem;
    border-radius: 5px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    font-size: clamp(0.85rem, 1.2vw, 0.95rem);
    transition: all 0.3s ease;
    font-weight: 500;
  }

  .card-action.payment-btn {
    background-color: #10b981;
    color: #fff;
    border-color: #059669;
  }

  .card-action.receipts-btn {
    background-color: #3b82f6;
    color: #fff;
    border-color: #2563eb;
  }

  .card-action.delete-btn {
    background-color: #fee2e2;
    color: #dc2626;
    border-color: #fecaca;
  }

  .card-action:hover {
    background-color: #d1d5db;
    transform: translateY(-1px);
  }
}

/* ===== Responsive Adjustments ===== */
@media (max-width: 1024px) {
  .invoices-page {
    padding: 1.5rem;
  }

  .page-title {
    font-size: 1.75rem;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .invoices-page {
    padding: 1rem;
  }

  .page-header {
    flex-direction: column;
    align-items: stretch;
  }

  .search-wrapper {
    min-width: auto;
  }

  .stats-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .action-bar {
    flex-direction: column;
    align-items: stretch;
  }

  .filters {
    flex-direction: column;
  }

  .filter-group {
    width: 100%;
  }

  .filter-select {
    width: 100%;
  }

  .card-footer {
    flex-direction: column;
  }

  .card-action {
    width: 100%;
  }

  .modal-content {
    width: 95%;
  }
}

@media (max-width: 360px) {
  .card-index {
    width: 28px;
    height: 28px;
    font-size: 0.85rem;
  }

  .card-school {
    font-size: 1rem;
  }

  .card-label {
    min-width: 95px;
    font-size: 0.8rem;
  }

  .card-value {
    font-size: 0.85rem;
  }
}
</style>