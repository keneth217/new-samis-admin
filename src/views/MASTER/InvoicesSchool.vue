<template>
  <div class="the-page">
    <!-- Header with title and search (matches AllSchools) -->
    <div class="search-area">
      <div class="header-container1">
        <h2>Invoices & Schools</h2>
      </div>
      <div class="search-actions">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search by school name or code"
          class="search-input"
          aria-label="Search by school name or code"
        />
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

    <!-- Action Bar: Create Invoice + Filters (layout like AllSchools) -->
    <div class="header-container">
      <div class="header-object1">
        <button @click="openForm" class="action-btn" aria-label="Create Invoice">
          <span class="material-symbols-outlined">add_circle</span>
        </button>
      </div>
      <div class="filters">
        <div class="filter-group">
          <label for="schoolFilter" class="filter-label">School Code:</label>
          <select
            id="schoolFilter"
            v-model="selectedSchoolCode"
            @change="onSchoolFilterChange"
            class="filter-select"
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
        <div class="filter-group">
          <label for="invoiceNumberFilter" class="filter-label">Invoice Number:</label>
          <input
            id="invoiceNumberFilter"
            v-model.trim="invoiceNumberFilter"
            type="text"
            placeholder="Filter by invoice number"
            class="filter-input"
            aria-label="Filter by invoice number"
          />
        </div>
      </div>
    </div>

    <!-- Invoices Table -->
    <div class="table-container">
      <!-- Desktop Table View - Scrollable -->
      <Scrollable>
      <table class="students-table desktop-table">
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
            <th class="actions-header">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="filteredInvoices.length === 0">
            <td colspan="12">No invoices found</td>
          </tr>
          <tr
            v-for="(invoice, index) in filteredInvoices"
            :key="invoice.invoiceNo || invoice.invoiceID || index"
            :class="{ 'even-row': index % 2 !== 0 }"
          >
            <td>{{ index + 1 }}</td>
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
            <td class="actions">
              <button @click="printInvoice(invoice)" class="manage-btn" aria-label="Print Invoice">
                <span class="material-symbols-outlined">print</span>
              </button>
              <button
                v-if="invoice.status !== 'Paid'"
                @click="recordPayment(invoice)"
                class="payment-btn"
                aria-label="Record Payment"
              >
                <span class="material-symbols-outlined">payment</span>
              </button>
              <button
                v-if="invoice.receiptCount > 0"
                @click="viewReceiptsForInvoice(invoice)"
                class="receipts-btn"
                aria-label="View Receipts"
              >
                <span class="material-symbols-outlined">receipt</span>
              </button>
              <button
                @click="deleteInvoice(invoice)"
                class="delete-btn"
                aria-label="Delete Invoice"
              >
                <span class="material-symbols-outlined">delete</span>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      </Scrollable>

      <!-- Mobile Cards (shown on small screens via CSS, like AllSchools) -->
      <div class="mobile-cards" v-if="filteredInvoices.length > 0">
        <div
          v-for="(invoice, index) in filteredInvoices"
          :key="invoice.invoiceNo || invoice.invoiceID || index"
          class="school-card"
        >
          <div class="card-header">
            <div class="card-number">{{ index + 1 }}</div>
            <h3 class="card-title">{{ invoice.schoolName }}</h3>
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
              <span class="card-label">Status:</span>
              <span class="card-value">
                <span :class="['status-badge', invoice.status.toLowerCase().replace(' ', '-')]">
                  {{ invoice.status }}
                </span>
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
            <button @click="printInvoice(invoice)" class="card-action-btn manage-btn" aria-label="Print Invoice">
              <span class="material-symbols-outlined">print</span>
            </button>
            <button
              v-if="invoice.status !== 'Paid'"
              @click="recordPayment(invoice)"
              class="card-action-btn payment-btn"
              aria-label="Record Payment"
            >
              <span class="material-symbols-outlined">payment</span>
            </button>
            <button
              v-if="invoice.receiptCount > 0"
              @click="viewReceiptsForInvoice(invoice)"
              class="card-action-btn receipts-btn"
              aria-label="View Receipts"
            >
              <span class="material-symbols-outlined">receipt</span>
            </button>
            <button
              @click="deleteInvoice(invoice)"
              class="card-action-btn delete-btn"
              aria-label="Delete Invoice"
            >
              <span class="material-symbols-outlined">delete</span>
            </button>
          </div>
        </div>
      </div>

      <div v-if="filteredInvoices.length === 0" class="no-data-message">
        No invoices found
      </div>
    </div>

    <!-- Modals (unchanged) -->
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
    <!-- Receipts List Modal (styled like schools delete modal) -->
    <div v-if="showReceiptsModal" class="modal-overlay" @click.self="closeReceiptsModal">
      <div class="modal-content">
        <div class="modal-header">
          <h2>Receipts for {{ selectedInvoiceForReceipts?.schoolName }} ({{ selectedInvoiceForReceipts?.schoolCode }})</h2>
          <button @click="closeReceiptsModal" class="close-btn" aria-label="Close"><i class="fas fa-times"></i></button>
        </div>
        <div class="modal-body">
          <div v-if="receiptsList.length === 0" class="no-data-message">No receipts found for this invoice.</div>
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
                <td class="actions">
                  <button @click="editReceipt(receipt)" class="manage-btn" aria-label="Edit Receipt"><span class="material-symbols-outlined">edit</span></button>
                  <button @click="deleteReceipt(receipt)" class="delete-btn" aria-label="Reverse Receipt"><span class="material-symbols-outlined">undo</span></button>
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td colspan="2"><strong>Total</strong></td>
                <td colspan="4"><strong>KSh {{ formatNumber(receiptsList.reduce((sum, r) => sum + (r.amount || 0), 0)) }}</strong></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>

    <!-- Print Invoice (PDF in new tab + print dialog) -->
    <PrintInvoiceOverlay
      :open="showPrintView"
      :invoice="invoiceToPrint"
      @close="closePrintView"
    />

    <!-- Delete Receipt Confirmation Modal -->
    <div v-if="showDeleteDialog" class="modal-overlay" @click.self="cancelDelete">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Reverse Receipt</h3>
          <button @click="cancelDelete" class="close-btn"><i class="fas fa-times"></i></button>
        </div>
        <div class="modal-body">
          <p class="delete-warning-text">Are you sure you want to reverse receipt <strong>{{ receiptToDelete?.receiptNumber || receiptToDelete?.receiptNo }}</strong>?</p>
          <div class="delete-school-preview" v-if="receiptToDelete">
            <div class="preview-row"><strong>Amount:</strong> KSh {{ formatNumber(receiptToDelete?.amount) }}</div>
            <div class="preview-row" v-if="receiptToDelete?.paymentMethod"><strong>Payment Method:</strong> {{ receiptToDelete.paymentMethod }}</div>
          </div>
          <p class="delete-warning-note"><i class="fas fa-exclamation-triangle"></i> This will undo the payment allocation on all related invoices.</p>
          <div class="form-group">
            <label for="deleteReason">Reversal Reason <span class="required">*</span></label>
            <textarea id="deleteReason" v-model="deleteReason" rows="3" placeholder="Type the reversal reason here..." class="form-control"></textarea>
            <small class="help-text">This reason will be stored for audit purposes.</small>
          </div>
        </div>
        <div class="form-actions">
          <button class="cancel-btn" @click="cancelDelete">Cancel</button>
          <button class="delete-confirm-btn" @click="confirmDelete" :disabled="!deleteReason.trim()"><span class="material-symbols-outlined">undo</span> Reverse Receipt</button>
        </div>
      </div>
    </div>

    <!-- Delete Invoice Confirmation Modal -->
    <div v-if="showInvoiceDeleteDialog" class="modal-overlay" @click.self="cancelInvoiceDelete">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Delete Invoice</h3>
          <button @click="cancelInvoiceDelete" class="close-btn"><i class="fas fa-times"></i></button>
        </div>
        <div class="modal-body">
          <p class="delete-warning-text">Are you sure you want to delete <strong>{{ invoiceToDelete?.invoiceNumber || invoiceToDelete?.invoiceNo }}</strong>?</p>
          <div class="delete-school-preview" v-if="invoiceToDelete">
            <div class="preview-row"><strong>School Code:</strong> {{ invoiceToDelete?.schoolCode }}</div>
            <div class="preview-row"><strong>Amount:</strong> KSh {{ formatNumber(invoiceToDelete?.amount) }}</div>
            <div class="preview-row"><strong>Status:</strong> {{ invoiceToDelete?.status }}</div>
          </div>
          <p class="delete-warning-note"><i class="fas fa-exclamation-triangle"></i> This will soft delete the invoice and all its details, and will update the school status.</p>
          <div class="form-group">
            <label for="invoiceDeleteReason">Delete Reason <span class="required">*</span></label>
            <textarea id="invoiceDeleteReason" v-model="invoiceDeleteReason" rows="3" placeholder="Type the delete reason here..." class="form-control"></textarea>
            <small class="help-text">This reason will be stored for audit tracking.</small>
          </div>
        </div>
        <div class="form-actions">
          <button class="cancel-btn" @click="cancelInvoiceDelete">Cancel</button>
          <button class="delete-confirm-btn" @click="confirmInvoiceDelete" :disabled="!invoiceDeleteReason.trim()"><span class="material-symbols-outlined">delete</span> Delete Invoice</button>
        </div>
      </div>
    </div>

    <LoadingSpinner :isLoading="Loading" />
    <footerCast />
  </div>
</template>

<script>
import footerCast from '../../components/footer.vue';
import Scrollable from '../../components/Scrollable.vue';
import PrintInvoiceOverlay from '../../components/PrintInvoiceOverlay.vue';
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
    PrintInvoiceOverlay,
    Scrollable,
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
      invoiceNumberFilter: '',
      invoices: [],
      schools: [],
      Loading: false,
      isViewMode: false,
      selectedSchoolCode: '',
      showDeleteDialog: false,
      receiptToDelete: null,
      deleteReason: '',
      showInvoiceDeleteDialog: false,
      invoiceToDelete: null,
      invoiceDeleteReason: '',
      showPrintView: false,
      invoiceToPrint: null,
    };
  },
  computed: {
    filteredInvoices() {
      let list = this.invoices;
      // Filter by invoice number (dedicated filter)
      if (this.invoiceNumberFilter) {
        const invQuery = this.invoiceNumberFilter.toLowerCase();
        list = list.filter(invoice => {
          const invNo = (invoice.invoiceNumber || invoice.invoiceNo || '').toString().toLowerCase();
          return invNo.includes(invQuery);
        });
      }
      // Filter by school name or code (search box)
      if (this.searchQuery.trim()) {
        const query = this.searchQuery.toLowerCase();
        list = list.filter(invoice => {
          return (
            (invoice.schoolName && invoice.schoolName.toLowerCase().includes(query)) ||
            (invoice.schoolCode && invoice.schoolCode.toString().toLowerCase().includes(query))
          );
        });
      }
      return list;
    },
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
    printInvoice(invoice) {
      this.invoiceToPrint = invoice;
      this.showPrintView = true;
    },
    closePrintView() {
      this.showPrintView = false;
      this.invoiceToPrint = null;
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
/* ===== Base Styles (copied from AllSchools.vue) ===== */
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

/* ===== Header / Search Area ===== */
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

.search-actions {
  display: flex;
  gap: clamp(0.3rem, 1vw, 0.5rem);
  align-items: center;
  flex-wrap: wrap;
  flex: 1;
  min-width: 200px;
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
  background: white;
}

.search-input:focus {
  border-color: #1e6192;
  box-shadow: 0 0 0 2px rgba(43, 122, 183, 0.2);
}

/* ===== Stats Cards (invoice-specific) ===== */
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

/* ===== Action Bar (from schools) ===== */
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
  margin-right: 0.3rem;
  font-size: clamp(1rem, 2vw, 1.2rem);
}

.filters {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  align-items: center;
  margin-left: auto;
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
  min-width: 80px;
  max-width: 180px;
}

.filter-select:focus {
  outline: none;
  border-color: #1e6192;
  box-shadow: 0 0 0 2px rgba(43, 122, 183, 0.2);
}

.filter-input {
  padding: 0.5rem 1rem;
  border: 1px solid #2b7ab7;
  border-radius: 4px;
  font-size: 0.9rem;
  background: white;
  transition: border-color 0.2s;
  min-width: 120px;
  max-width: 200px;
}

.filter-input::placeholder {
  color: #9ca3af;
}

.filter-input:focus {
  outline: none;
  border-color: #1e6192;
  box-shadow: 0 0 0 2px rgba(43, 122, 183, 0.2);
}

/* ===== Table Container (matches schools) ===== */
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

.students-table th,
.students-table td {
  white-space: nowrap;
  padding: 0.3rem 0.5rem;
  line-height: 1.2;
  text-align: left;
  border: 1px solid #ddd;
  vertical-align: middle;
}

.students-table thead th {
  background-color: #f1f1f1;
  font-weight: 600;
  border-bottom: 2px solid #ddd;
  position: sticky;
  top: 0;
  z-index: 10;
}

.students-table tbody tr {
  height: auto;
}

.even-row {
  background-color: #f7f9fc;
}

/* ===== Invoice-specific table cell styles ===== */
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

/* Action Buttons (like schools, with custom colors) */
.actions {
  display: flex;
  justify-content: flex-start;
  gap: clamp(0.3rem, 1vw, 1rem);
  flex-wrap: wrap;
  align-items: center;
  flex-wrap: nowrap;
}

.actions-header {
  text-align: center;
  padding: clamp(0.5rem, 1vw, 1rem);
}

.manage-btn,
.class-list-btn,
.payment-btn,
.receipts-btn,
.delete-btn {
  background-color: #e0e7ff;
  color: #4f46e5;
  border: 1px solid #c7d2fe;
  padding: clamp(0.3rem, 1vw, 0.5rem) clamp(0.6rem, 1.5vw, 0.9rem);
  border-radius: 5px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: clamp(0.75rem, 1.2vw, 0.9rem);
  transition: all 0.3s ease;
  white-space: nowrap;
}

.manage-btn:hover,
.class-list-btn:hover,
.payment-btn:hover,
.receipts-btn:hover,
.delete-btn:hover {
  transform: translateY(-1px);
}

.manage-btn:hover,
.class-list-btn:hover {
  background-color: #d4d7ff;
}

.payment-btn {
  background-color: #10b981;
  color: #fff;
  border-color: #059669;
}

.payment-btn:hover {
  background-color: #059669;
}

.receipts-btn {
  background-color: #3b82f6;
  color: #fff;
  border-color: #2563eb;
}

.receipts-btn:hover {
  background-color: #2563eb;
}

.delete-btn {
  background-color: #dc3545;
  color: #fff;
  border-color: #b91c1c;
}

.delete-btn:hover {
  background-color: #b91c1c;
}

.actions .material-symbols-outlined {
  font-size: clamp(0.9rem, 1.5vw, 1rem);
}

/* ===== Mobile Cards (from schools) ===== */
.mobile-cards {
  display: none;
}

.school-card {
  background: white;
  border: 1px solid #e1e4ea;
  border-radius: 8px;
  margin-bottom: 1rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: box-shadow 0.3s ease;
}

.school-card:hover {
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
  flex-direction: column;
  gap: 0.5rem;
}

.card-action-btn {
  width: 100%;
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
  border: none;
}

.card-action-btn:hover {
  transform: translateY(-1px);
}

.card-action-btn .material-symbols-outlined {
  font-size: 1.2rem;
}

/* ===== Empty State ===== */
.no-data-message {
  text-align: center;
  padding: 2rem;
  color: #666;
  font-size: clamp(0.9rem, 1.3vw, 1.1rem);
}

/* ===== Pagination ===== */
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
  color: #333;
  display: inline-block;
  white-space: nowrap;
}

/* ===== Students Controls (per page) ===== */
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

/* ===== Modals (unchanged from schools) ===== */
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

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: clamp(0.75rem, 2vw, 1rem);
  padding-bottom: clamp(0.5rem, 1.5vw, 0.75rem);
  border-bottom: 2px solid #e9ecef;
}

.modal-header h2,
.modal-header h3 {
  font-size: clamp(1.1rem, 2vw, 1.5rem);
  margin: 0;
  color: #333;
}

.close-btn {
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

.close-btn:hover {
  background-color: #f8f9fa;
  color: #dc3545;
}

.modal-body {
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

.delete-school-preview {
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

/* Receipts table inside modal */
.receipts-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

.receipts-table th {
  background-color: #f1f1f1;
  padding: 0.75rem;
  text-align: left;
  font-weight: 600;
  border-bottom: 2px solid #ddd;
}

.receipts-table td {
  padding: 0.75rem;
  border-bottom: 1px solid #ddd;
}

.receipts-table tbody tr:hover {
  background-color: #f7f9fc;
}

.receipts-table tfoot td {
  background-color: #f1f1f1;
  padding: 0.75rem;
  font-weight: 600;
  border-top: 2px solid #ddd;
}

/* Invoice print styles moved to PrintInvoiceOverlay.vue */

/* ===== Responsive Breakpoints (copied from schools) ===== */
@media only screen and (max-width: 1400px) {
  .students-table th,
  .students-table td {
    padding: clamp(0.5rem, 1vw, 0.7rem);
  }
}

@media only screen and (max-width: 1024px) {
  .the-page {
    margin-top: clamp(3rem, 8vw, 4.5rem);
  }

  .students-table th,
  .students-table td {
    padding: 0.3rem 0.45rem;
    font-size: clamp(0.85rem, 1.1vw, 0.95rem);
  }

  .search-input {
    max-width: 100%;
    width: 100%;
  }

  .search-actions {
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

  .filters {
    width: 100%;
    margin-left: 0;
    flex-direction: row;
    flex-wrap: wrap;
    gap: 0.75rem;
  }

  .filter-group {
    flex: 1;
    min-width: 140px;
  }

  .filter-select,
  .filter-input {
    width: 100%;
    max-width: none;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  .stat-card {
    padding: 1rem;
  }

  .stat-value {
    font-size: 1.25rem;
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

  .search-actions {
    flex-direction: column;
    width: 100%;
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
}

@media only screen and (max-width: 480px) {
  .the-page {
    padding: clamp(0.25rem, 1.5vw, 0.5rem);
    padding-left: clamp(0.5rem, 2vw, 0.75rem);
    margin-top: clamp(2rem, 6vw, 3rem);
    overflow-x: visible;
  }

  .stats-grid {
    grid-template-columns: 1fr;
    gap: 0.75rem;
    margin-bottom: 1rem;
  }

  .stat-card {
    padding: 0.75rem 1rem;
  }

  .stat-icon {
    width: 2.5rem;
    height: 2.5rem;
    font-size: 1.5rem;
  }

  .stat-value {
    font-size: 1.1rem;
  }

  .stat-label {
    font-size: 0.75rem;
  }

  .filters {
    flex-direction: column;
    align-items: stretch;
  }

  .filter-group {
    min-width: 0;
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

  .mobile-cards {
    display: block;
  }

  .school-card {
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
  .receipts-btn,
  .delete-btn {
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

  .modal-overlay .modal-content {
    width: 95vw;
    padding: clamp(0.75rem, 3vw, 1.25rem);
    border-radius: 6px;
  }

  .delete-school-preview {
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

@media only screen and (max-width: 360px) {
  .desktop-table {
    display: none !important;
  }

  .mobile-cards {
    display: block;
  }

  .stats-grid {
    gap: 0.5rem;
    margin-bottom: 0.75rem;
  }

  .stat-card {
    padding: 0.6rem 0.75rem;
  }

  .stat-value {
    font-size: 1rem;
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
  .receipts-btn,
  .delete-btn {
    font-size: 0.7rem;
    padding: 0.3rem 0.4rem;
  }

  .action-btn {
    font-size: 0.75rem;
    padding: 0.35rem 0.5rem;
  }
}
</style>
