<template>
  <div class="the-page">
    <div class="search-area">
      <div class="header-container1">
        <h2>All Receipts</h2>
      </div>
      <div class="search-actions">
        <input
          v-model="searchQuery"
          placeholder="Search by receipt number, school code or payment mode"
          class="search-input"
        />
        <button class="action-btn" @click="exportToExcel">
          <span class="material-symbols-outlined">download</span>
          Export to Excel
        </button>
      </div>
    </div>

    <div class="table-container">
      <div class="students-controls">
        <label for="receiptsPerPage">Receipts per page:</label>
        <select
          id="receiptsPerPage"
          class="form-control"
          v-model="receiptsPerPage"
          @change="updateReceiptsPerPage"
        >
          <option v-for="option in receiptsPerPageOptions" :key="option" :value="option">
            {{ option }}
          </option>
        </select>
      </div>

      <!-- Desktop Table View -->
      <table class="students-table desktop-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Receipt No</th>
            <th>School Code</th>
            <th>Receipt Date</th>
            <th>Amount</th>
            <th>Payment Mode</th>
            <th>Reference</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="displayedReceipts.length === 0">
            <td colspan="9">No receipts found</td>
          </tr>
          <tr
            v-for="(receipt, index) in displayedReceipts"
            :key="receipt.receiptNo || receipt.receiptID || index"
            :class="[{ 'even-row': index % 2 !== 0 }, { 'row-reversed': receipt.deleted }]"
          >
            <td>{{ (currentPage - 1) * receiptsPerPage + index + 1 }}</td>
            <td>
              <span v-if="receipt.deleted" class="reversed-flag">[REVERSED]&nbsp;</span>
              {{ receipt.receiptNo }}
            </td>
            <td>{{ receipt.schoolCode }}</td>
            <td>{{ receipt.receiptDate }}</td>
            <td>KSh {{ formatNumber(receipt.amount) }}</td>
            <td>{{ receipt.paymentMode }}</td>
            <td>{{ receipt.paymentModeNo || '-' }}</td>
            <td>
              <div>
                <span v-if="receipt.deleted" class="status-reversed">REVERSED</span>
                <span v-else>{{ receipt.status || 'Paid' }}</span>
              </div>
              <div v-if="receipt.deleted && receipt.deleteReason" class="delete-reason">
                Reason: {{ receipt.deleteReason }}
              </div>
            </td>
            <td class="actions">
              <button
                class="receipt-print-btn"
                @click="printReceipt(receipt)"
                title="Print Receipt"
              >
                <span class="material-symbols-outlined">print</span>
                Print
              </button>
              <button
                class="receipt-delete-btn"
                @click="deleteReceipt(receipt)"
                :disabled="receipt.deleted"
              >
                {{ receipt.deleted ? 'Reversed' : 'Reverse' }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Mobile Card View -->
      <div class="mobile-cards" v-if="displayedReceipts.length > 0">
        <div v-for="(receipt, index) in displayedReceipts" :key="receipt.receiptNo || receipt.receiptID || index" class="receipt-card" :class="{ 'card-reversed': receipt.deleted }">
          <div class="card-header">
            <div class="card-number">{{ (currentPage - 1) * receiptsPerPage + index + 1 }}</div>
            <div class="card-header-text">
              <h3 class="card-title">
                <span v-if="receipt.deleted" class="reversed-flag">[REVERSED]&nbsp;</span>
                {{ receipt.receiptNo }}
              </h3>
              <div v-if="receipt.deleted && receipt.deleteReason" class="card-delete-reason">
                Reason: {{ receipt.deleteReason }}
              </div>
            </div>
          </div>
          
          <div class="card-body">
            <div class="card-row">
              <span class="card-label">School Code:</span>
              <span class="card-value">{{ receipt.schoolCode }}</span>
            </div>
            
            <div class="card-row">
              <span class="card-label">Receipt Date:</span>
              <span class="card-value">{{ receipt.receiptDate }}</span>
            </div>
            
            <div class="card-row">
              <span class="card-label">Amount:</span>
              <span class="card-value amount">KSh {{ formatNumber(receipt.amount) }}</span>
            </div>
            
            <div class="card-row">
              <span class="card-label">Payment Mode:</span>
              <span class="card-value">{{ receipt.paymentMode }}</span>
            </div>
            
            <div class="card-row">
              <span class="card-label">Reference:</span>
              <span class="card-value">{{ receipt.paymentModeNo || '-' }}</span>
            </div>
            
            <div class="card-row">
              <span class="card-label">Status:</span>
              <span class="card-value" :class="{ 'status-reversed': receipt.deleted }">
                <span v-if="receipt.deleted">REVERSED</span>
                <span v-else>{{ receipt.status || 'Paid' }}</span>
              </span>
            </div>
          </div>
          
          <div class="card-footer">
            <button @click="printReceipt(receipt)" class="card-action-btn print-btn" aria-label="Print Receipt">
              <span class="material-symbols-outlined">print</span> Print
            </button>
            <button @click="deleteReceipt(receipt)" class="card-action-btn delete-btn" :disabled="receipt.deleted" aria-label="Reverse Receipt">
              <span class="material-symbols-outlined">undo</span> {{ receipt.deleted ? 'Reversed' : 'Reverse' }}
            </button>
          </div>
        </div>
      </div>

      <div v-if="displayedReceipts.length === 0" class="no-data-message">
        No receipts found
      </div>

      <div class="pagination">
        <button @click="prevPage" :disabled="currentPage === 1">Previous</button>
        <span>{{ currentPage }} / {{ totalPages }}</span>
        <button @click="nextPage" :disabled="currentPage === totalPages">Next</button>
      </div>
    </div>

    <!-- Print Receipt Window -->
    <div v-if="showPrintView" class="print-receipt-overlay" @click.self="closePrintView">
      <div class="print-receipt-container">
        <div class="print-receipt-header">
          <h3>Print Receipt</h3>
          <div class="print-actions">
            <button class="print-close-btn" @click="closePrintView">
              <span class="material-symbols-outlined">close</span>
            </button>
            <button class="print-btn" @click="executePrint">
              <span class="material-symbols-outlined">print</span>
              Print
            </button>
          </div>
        </div>
        <div class="print-receipt-content" id="receiptToPrint">
          <div class="receipt-header">
            <h1>RECEIPT</h1>
            <div class="receipt-company-info">
              <div class="company-name">SAMIS FINANCE ADMIN</div>
              <div class="company-details">Payment Receipt</div>
            </div>
          </div>
          <div class="receipt-body">
            <div class="receipt-row">
              <div class="receipt-label">Receipt Number:</div>
              <div class="receipt-value">{{ receiptToPrint?.receiptNo || 'N/A' }}</div>
            </div>
            <div class="receipt-row">
              <div class="receipt-label">Date:</div>
              <div class="receipt-value">{{ receiptToPrint?.receiptDate || 'N/A' }}</div>
            </div>
            <div class="receipt-row">
              <div class="receipt-label">School Code:</div>
              <div class="receipt-value">{{ receiptToPrint?.schoolCode || 'N/A' }}</div>
            </div>
            <div class="receipt-divider"></div>
            <div class="receipt-row">
              <div class="receipt-label">Amount Paid:</div>
              <div class="receipt-value amount">KSh {{ formatNumber(receiptToPrint?.amount || 0) }}</div>
            </div>
            <div class="receipt-row">
              <div class="receipt-label">Payment Method:</div>
              <div class="receipt-value">{{ receiptToPrint?.paymentMode || 'N/A' }}</div>
            </div>
            <div class="receipt-row" v-if="receiptToPrint?.paymentModeNo">
              <div class="receipt-label">Reference Number:</div>
              <div class="receipt-value">{{ receiptToPrint.paymentModeNo }}</div>
            </div>
            <div class="receipt-row">
              <div class="receipt-label">Status:</div>
              <div class="receipt-value" :class="{ 'status-reversed-print': receiptToPrint?.deleted }">
                {{ receiptToPrint?.deleted ? 'REVERSED' : (receiptToPrint?.status || 'Paid') }}
              </div>
            </div>
            <div v-if="receiptToPrint?.deleted && receiptToPrint?.deleteReason" class="receipt-reversal-note">
              <div class="receipt-label">Reversal Reason:</div>
              <div class="receipt-value">{{ receiptToPrint.deleteReason }}</div>
            </div>
          </div>
          <div class="receipt-footer">
            <div class="receipt-footer-text">Thank you for your payment</div>
            <div class="receipt-footer-date">Printed on: {{ new Date().toLocaleString() }}</div>
          </div>
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
            Are you sure you want to reverse receipt <strong>{{ receiptToDelete?.receiptNo || 'this receipt' }}</strong>?
          </p>
          <div class="delete-receipt-preview" v-if="receiptToDelete">
            <div class="preview-row">
              <strong>Receipt Number:</strong> {{ receiptToDelete.receiptNo }}
            </div>
            <div class="preview-row" v-if="receiptToDelete.schoolCode">
              <strong>School Code:</strong> {{ receiptToDelete.schoolCode }}
            </div>
            <div class="preview-row" v-if="receiptToDelete.amount">
              <strong>Amount:</strong> KSh {{ formatNumber(receiptToDelete.amount) }}
            </div>
            <div class="preview-row" v-if="receiptToDelete.receiptDate">
              <strong>Date:</strong> {{ receiptToDelete.receiptDate }}
            </div>
          </div>
          <p class="delete-warning-note">
            <i class="fas fa-exclamation-triangle"></i> This will undo the payment allocation on all related invoices.
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
          <button @click="cancelDelete" class="cancel-btn">Cancel</button>
          <button @click="confirmDelete" class="delete-confirm-btn" :disabled="!deleteReason.trim() || Loading">
            <span class="material-symbols-outlined">undo</span> Reverse Receipt
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

export default {
  name: 'Receipts',
  components: {
    footerCast,
    LoadingSpinner,
  },
  setup() {
    const toast = useToast();
    return { toast };
  },
  data() {
    return {
      receipts: [],
      searchQuery: '',
      Loading: false,
      currentPage: 1,
      receiptsPerPage: 15,
      receiptsPerPageOptions: [5, 15, 30, 50, 75, 100],
      showDeleteDialog: false,
      receiptToDelete: null,
      deleteReason: '',
      showPrintView: false,
      receiptToPrint: null,
    };
  },
  computed: {
    filteredReceipts() {
      const query = this.searchQuery.trim().toLowerCase();
      if (!query) return this.receipts;

      return this.receipts.filter((r) => {
        const receiptNo = (r.receiptNo || '').toString().toLowerCase();
        const schoolCode = (r.schoolCode || '').toString().toLowerCase();
        const mode = (r.paymentMode || '').toString().toLowerCase();
        return (
          receiptNo.includes(query) ||
          schoolCode.includes(query) ||
          mode.includes(query)
        );
      });
    },
    totalPages() {
      return Math.ceil(this.filteredReceipts.length / this.receiptsPerPage) || 1;
    },
    displayedReceipts() {
      const start = (this.currentPage - 1) * this.receiptsPerPage;
      const end = start + this.receiptsPerPage;
      return this.filteredReceipts.slice(start, end);
    },
  },
  methods: {
    formatNumber(num) {
      return new Intl.NumberFormat('en-KE', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(num || 0);
    },
    updateReceiptsPerPage() {
      this.currentPage = 1;
    },
    nextPage() {
      if (this.currentPage < this.totalPages) {
        this.currentPage += 1;
      }
    },
    prevPage() {
      if (this.currentPage > 1) {
        this.currentPage -= 1;
      }
    },
    async fetchReceipts() {
      this.Loading = true;
      const toast = useToast();
      try {
        const response = await axios.post('/receipts/list');
        if (response.data && Array.isArray(response.data)) {
          this.receipts = response.data.map((r) => ({
            receiptNo: r.receiptNo || r.receipt_number || r.id,
            receiptID: r.receiptID || r.id,
            schoolCode: r.schoolCode || '',
            receiptDate: r.receiptDate || r.receipt_date || '',
            amount: parseFloat(r.amount || 0),
            paymentMode: r.paymentMode || r.paymentMethod || '',
            paymentModeNo: r.paymentModeNo || r.paymentModeNO || r.paymentRef || '',
            status: r.status || 'Paid',
            deleted: !!r.deleted,
            deleteReason: r.deleteReason || r.reason || '',
          }));
        } else {
          this.receipts = [];
          toast.warning('Invalid response format from receipts API.');
        }
      } catch (error) {
        console.error('Error fetching receipts:', error);
        this.receipts = [];
        toast.error('Failed to fetch receipts. Please try again.');
      } finally {
        this.Loading = false;
      }
    },
    async deleteReceipt(receipt) {
      // open styled dialog
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
      const target = this.receiptToDelete;
      if (!target) return;

      const receiptNo = target.receiptNo;
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
        const response = await axios.post(`/receipts/delete/${receiptNo}`, {
          reason: this.deleteReason,
        });

        const updated = response?.data;
        this.receipts = this.receipts.map((r) => {
          if (r.receiptNo !== receiptNo) return r;
          if (updated) {
            return {
              ...r,
              deleted: !!updated.deleted,
              deleteReason: updated.deleteReason || this.deleteReason,
              status: updated.status || 'REVERSED',
            };
          }
          return {
            ...r,
            deleted: true,
            deleteReason: this.deleteReason,
            status: 'REVERSED',
          };
        });

        toast.success('Receipt reversed successfully.');
      } catch (error) {
        console.error('Error reversing receipt:', error);
        toast.error('Failed to reverse receipt. Please try again.');
      } finally {
        this.Loading = false;
        this.cancelDelete();
      }
    },
    printReceipt(receipt) {
      this.receiptToPrint = receipt;
      this.showPrintView = true;
    },
    closePrintView() {
      this.showPrintView = false;
      this.receiptToPrint = null;
    },
    executePrint() {
      // Create a new window for printing
      const printWindow = window.open('', '_blank');
      const printContent = document.getElementById('receiptToPrint').innerHTML;
      
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Receipt ${this.receiptToPrint?.receiptNo || ''}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: Arial, sans-serif;
              padding: 40px;
              background: #fff;
              color: #000;
            }
            .receipt-header {
              text-align: center;
              margin-bottom: 30px;
              padding-bottom: 20px;
              border-bottom: 3px solid #000;
            }
            .receipt-header h1 {
              font-size: 2.5rem;
              font-weight: bold;
              margin-bottom: 10px;
              letter-spacing: 3px;
            }
            .company-name {
              font-size: 1.2rem;
              font-weight: bold;
              margin-bottom: 5px;
            }
            .company-details {
              font-size: 0.9rem;
              color: #666;
            }
            .receipt-body {
              margin: 30px 0;
            }
            .receipt-row {
              display: flex;
              justify-content: space-between;
              padding: 12px 0;
              border-bottom: 1px solid #ddd;
            }
            .receipt-label {
              font-weight: 600;
              font-size: 1rem;
              color: #333;
            }
            .receipt-value {
              font-size: 1rem;
              text-align: right;
              color: #000;
            }
            .receipt-value.amount {
              font-size: 1.3rem;
              font-weight: bold;
              color: #000;
            }
            .receipt-divider {
              height: 2px;
              background: #000;
              margin: 20px 0;
            }
            .receipt-reversal-note {
              margin-top: 20px;
              padding: 15px;
              background: #ffecec;
              border-left: 4px solid #b91c1c;
            }
            .receipt-reversal-note .receipt-label {
              color: #b91c1c;
              margin-bottom: 5px;
            }
            .status-reversed-print {
              color: #b91c1c !important;
              font-weight: bold;
            }
            .receipt-footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 2px solid #000;
              text-align: center;
            }
            .receipt-footer-text {
              font-size: 1.1rem;
              font-weight: 600;
              margin-bottom: 10px;
            }
            .receipt-footer-date {
              font-size: 0.85rem;
              color: #666;
            }
            @media print {
              body {
                padding: 20px;
              }
              @page {
                size: A4;
                margin: 1cm;
              }
            }
          </style>
        </head>
        <body>
          ${printContent}
        </body>
        </html>
      `);
      
      printWindow.document.close();
      printWindow.focus();
      
      // Wait for content to load, then print
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    },
    exportToExcel() {
      const headers = [
        'Receipt ID',
        'Receipt No',
        'School Code',
        'Receipt Date',
        'Amount',
        'Payment Mode',
        'Reference',
        'Status',
        'Reversed',
        'Reversal Reason',
      ];
      const rows = this.filteredReceipts.map((r) => [
        r.receiptID || r.receiptNo || '',
        r.receiptNo || '',
        r.schoolCode || '',
        r.receiptDate || '',
        r.amount || 0,
        r.paymentMode || '',
        r.paymentModeNo || '',
        r.status || 'Paid',
        r.deleted ? 'Yes' : 'No',
        r.deleteReason || '',
      ]);

      const csvContent = [headers, ...rows]
        .map((row) =>
          row
            .map((item) => {
              const value = item ?? '';
              const str = value.toString().replace(/"/g, '""');
              return `"${str}"`;
            })
            .join(',')
        )
        .join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
      link.download = `all-receipts-${timestamp}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    },
  },
  mounted() {
    this.fetchReceipts();
  },
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

.search-actions {
  display: flex;
  gap: clamp(0.3rem, 1vw, 0.5rem);
  align-items: center;
  flex-wrap: wrap;
  flex: 1;
}

.search-input {
  padding: clamp(0.3rem, 1vw, 0.5rem);
  border-radius: 5px;
  border: 2px solid #2b7ab7;
  outline: none;
  font-size: clamp(0.85rem, 1.5vw, 1rem);
  flex: 1;
  min-width: 200px;
  max-width: 400px;
}

.search-input:focus {
  border-color: #1e6192;
  box-shadow: 0 0 0 2px rgba(43, 122, 183, 0.2);
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
  gap: 0.3rem;
  font-size: clamp(0.85rem, 1.5vw, 1rem);
  white-space: nowrap;
  transition: background-color 0.3s ease;
}

.action-btn:hover {
  background-color: #1e6192;
}

.action-btn .material-symbols-outlined {
  font-size: clamp(1rem, 2vw, 1.2rem);
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

/* Mobile Card View - Hidden by default */
.mobile-cards {
  display: none;
}

/* Card Styles */
.receipt-card {
  background: white;
  border: 1px solid #e1e4ea;
  border-radius: 8px;
  margin-bottom: 1rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: box-shadow 0.3s ease;
}

.receipt-card:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.receipt-card.card-reversed {
  background-color: #ffecec;
  border-color: #fecaca;
}

.card-header {
  background: linear-gradient(135deg, #2b7ab7 0%, #1e6192 100%);
  color: white;
  padding: 1rem;
  display: flex;
  align-items: flex-start;
  gap: 1rem;
}

.receipt-card.card-reversed .card-header {
  background: linear-gradient(135deg, #b91c1c 0%, #991b1b 100%);
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

.card-header-text {
  flex: 1;
  min-width: 0;
}

.card-title {
  font-size: clamp(1rem, 2vw, 1.2rem);
  font-weight: 600;
  margin: 0 0 0.5rem 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: normal;
  line-height: 1.3;
}

.card-delete-reason {
  font-size: clamp(0.75rem, 1vw, 0.85rem);
  color: rgba(255, 255, 255, 0.9);
  font-style: italic;
  margin-top: 0.25rem;
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

.card-value.amount {
  font-size: clamp(1rem, 1.5vw, 1.1rem);
  font-weight: 700;
  color: #2b7ab7;
}

.card-footer {
  padding: 1rem;
  background: #f9fafb;
  border-top: 1px solid #e1e4ea;
  display: flex;
  gap: 0.5rem;
}

.card-action-btn {
  flex: 1;
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

.card-action-btn.print-btn {
  background-color: #1a73e8;
  color: white;
}

.card-action-btn.print-btn:hover {
  background-color: #1557b0;
  transform: translateY(-1px);
}

.card-action-btn.delete-btn {
  background-color: #ef4444;
  color: white;
}

.card-action-btn.delete-btn:hover:not(:disabled) {
  background-color: #dc2626;
  transform: translateY(-1px);
}

.card-action-btn.delete-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  background-color: #9ca3af;
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

.even-row {
  background-color: #f7f9fc;
}

.row-reversed {
  background-color: #ffecec;
}

.reversed-flag {
  color: #b91c1c;
  font-weight: 600;
}

.status-reversed {
  color: #b91c1c;
  font-weight: 600;
}

.delete-reason {
  font-size: 0.75rem;
  color: #4b5563;
  font-style: italic;
  margin-top: 0.15rem;
}

.receipt-delete-btn {
  padding: 0.3rem 0.6rem;
  border-radius: 4px;
  border: 1px solid #dc2626;
  background-color: #ef4444;
  color: #fff;
  font-size: 0.8rem;
  cursor: pointer;
}

.receipt-delete-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  background-color: #9ca3af;
  border-color: #9ca3af;
}

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

/* Delete / Reverse Receipt Dialog Styles (matching Contacts delete modal) */
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

.modal-content {
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

.delete-receipt-preview {
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

/* Print Receipt Styles */
.print-receipt-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10003;
}

.print-receipt-container {
  background-color: #fff;
  border-radius: 8px;
  width: 100%;
  max-width: clamp(300px, 90vw, 600px);
  max-height: min(90vh, 800px);
  overflow-y: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.print-receipt-header {
  background-color: #4368b9;
  color: #fff;
  padding: clamp(0.75rem, 2vw, 1.25rem) clamp(1rem, 2vw, 1.5rem);
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-radius: 8px 8px 0 0;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.print-receipt-header h3 {
  margin: 0;
  color: gold;
  font-size: clamp(1rem, 2vw, 1.3rem);
}

.print-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.print-close-btn,
.print-btn {
  background: transparent;
  border: 1px solid gold;
  color: gold;
  padding: 0.4rem 0.8rem;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.9rem;
  transition: all 0.2s;
}

.print-close-btn:hover,
.print-btn:hover {
  background: gold;
  color: #4368b9;
}

.print-receipt-content {
  padding: 2rem;
  background: #fff;
  color: #000;
}

.receipt-header {
  text-align: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 3px solid #000;
}

.receipt-header h1 {
  font-size: 2.5rem;
  font-weight: bold;
  margin-bottom: 10px;
  letter-spacing: 3px;
  color: #000;
}

.receipt-company-info {
  margin-top: 15px;
}

.company-name {
  font-size: 1.2rem;
  font-weight: bold;
  margin-bottom: 5px;
  color: #000;
}

.company-details {
  font-size: 0.9rem;
  color: #666;
}

.receipt-body {
  margin: 30px 0;
}

.receipt-row {
  display: flex;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid #ddd;
}

.receipt-label {
  font-weight: 600;
  font-size: 1rem;
  color: #333;
}

.receipt-value {
  font-size: 1rem;
  text-align: right;
  color: #000;
}

.receipt-value.amount {
  font-size: 1.3rem;
  font-weight: bold;
  color: #000;
}

.receipt-divider {
  height: 2px;
  background: #000;
  margin: 20px 0;
}

.receipt-reversal-note {
  margin-top: 20px;
  padding: 15px;
  background: #ffecec;
  border-left: 4px solid #b91c1c;
  border-radius: 4px;
}

.receipt-reversal-note .receipt-label {
  color: #b91c1c;
  margin-bottom: 5px;
  display: block;
}

.status-reversed-print {
  color: #b91c1c !important;
  font-weight: bold;
}

.receipt-footer {
  margin-top: 40px;
  padding-top: 20px;
  border-top: 2px solid #000;
  text-align: center;
}

.receipt-footer-text {
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 10px;
  color: #000;
}

.receipt-footer-date {
  font-size: 0.85rem;
  color: #666;
}

.actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  flex-wrap: wrap;
}

.receipt-print-btn {
  padding: 0.3rem 0.6rem;
  border-radius: 4px;
  border: 1px solid #1a73e8;
  background-color: #1a73e8;
  color: #fff;
  font-size: 0.8rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.3rem;
  transition: all 0.2s;
}

.receipt-print-btn:hover {
  background-color: #1557b0;
  border-color: #1557b0;
}

.receipt-print-btn .material-symbols-outlined {
  font-size: 16px;
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
    width: 100%;
    flex-direction: column;
    align-items: stretch;
    gap: 0.5rem;
  }

  .search-input {
    width: 100%;
    max-width: 100%;
    margin-left: 0;
  }

  .action-btn {
    width: 100%;
    justify-content: center;
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

  /* Modal Responsive Styles */
  .modal-content,
  .print-receipt-container {
    width: 100%;
    max-width: min(90vw, 600px);
    max-height: min(90vh, 600px);
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

  .receipt-card {
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

  .action-btn {
    padding: clamp(0.4rem, 1.2vw, 0.5rem) clamp(0.6rem, 1.5vw, 0.8rem);
    font-size: clamp(0.8rem, 1.1vw, 0.9rem);
  }

  .pagination button {
    padding: clamp(0.3rem, 1vw, 0.4rem) clamp(0.5rem, 1.2vw, 0.7rem);
    font-size: clamp(0.75rem, 1vw, 0.85rem);
  }

  .modal-content,
  .print-receipt-container {
    width: 100%;
    padding: 1rem;
    border-radius: 0;
    max-height: 100vh;
  }

  .delete-receipt-preview {
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
}
</style>


