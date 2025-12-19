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

      <table class="students-table">
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
            <td>
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

      <div class="pagination">
        <button @click="prevPage" :disabled="currentPage === 1">Previous</button>
        <span>{{ currentPage }} / {{ totalPages }}</span>
        <button @click="nextPage" :disabled="currentPage === totalPages">Next</button>
      </div>
    </div>

    <!-- Delete / Reverse Receipt Dialog -->
    <div v-if="showDeleteDialog" class="delete-modal-overlay" @click.self="cancelDelete">
      <div class="delete-modal-content">
        <h3>Reverse Receipt</h3>
        <p class="delete-modal-text">
          You are about to <strong>REVERSE</strong> receipt
          <strong>{{ receiptToDelete?.receiptNo }}</strong>.
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
    exportToExcel() {
      const headers = [
        'Receipt No',
        'School Code',
        'Receipt Date',
        'Amount',
        'Payment Mode',
        'Reference',
        'Status',
      ];
      const rows = this.filteredReceipts.map((r) => [
        r.receiptNo,
        r.schoolCode,
        r.receiptDate,
        r.amount,
        r.paymentMode,
        r.paymentModeNo || '',
        r.status || '',
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
  padding: 1rem;
  background-color: #f4f6fa;
}

.header-container1 h2 {
  font-size: 1.5rem;
  color: #333;
  padding-bottom: 0.5rem;
}

.search-area {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.search-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.search-input {
  padding: 0.3rem;
  border-radius: 5px;
  border: 2px solid #2b7ab7;
  outline: none;
  width: 400px;
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

/* Delete / Reverse dialog styles (match InvoicesSchool) */
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

@media only screen and (max-width: 767px) {
  .the-page {
    padding: 0.5rem;
    margin-top: 2.5rem;
    margin-left: 2.1rem;
    width: 93.5%;
  }

  .search-area {
    flex-direction: column;
    gap: 0.5rem;
    align-items: flex-start;
  }

  .search-input {
    width: 100%;
  }

  .table-container {
    padding: 0.5rem;
    width: 103%;
    margin-left: -0.3rem;
    overflow-x: auto;
  }

  .students-table {
    min-width: 700px;
  }

  .students-table th,
  .students-table td {
    padding: 0.5rem;
    font-size: 0.9rem;
    white-space: normal;
    word-break: break-word;
  }
}
</style>


