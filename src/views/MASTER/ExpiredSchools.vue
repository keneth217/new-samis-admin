<template>
  <div class="the-page">
    <!-- Search Area -->
    <div class="search-area">
      <div class="header-container1">
        <h2>Expired Schools</h2>
      </div>
      <div class="search-actions">
        <input
          v-model="searchQuery"
          placeholder="Search by name or code"
          class="search-input"
          @input="fetchSchools"
        />
        <button class="action-btn" @click="exportToExcel">
          <span class="material-symbols-outlined">download</span>
          Export to Excel
        </button>
        <button class="action-btn pdf-action-btn" @click="exportToPdf" :disabled="pdfLoading">
          <span v-if="pdfLoading" class="pdf-loading">...</span>
          <span v-else class="material-symbols-outlined">picture_as_pdf</span>
          View as PDF
        </button>
      </div>
    </div>

    <!-- Schools Table -->
    <div class="table-container">
      <!-- Activation Form Overlay -->
      <div v-if="showActivationForm" class="activation-form-wrap">
        <div class="activation-form-content">
          <div class="activation-cancel" @click="closeActivationForm">
            <i class="fas fa-times"></i>
          </div>
          <div class="activation-form-title">
            <h2>Activate School: {{ selectedSchool.schoolCode }}</h2>
          </div>
          <hr />
          <form @submit.prevent="submitActivationForm">
            <div class="activation-form-inputs">
              <div class="activation-form-group">
                <input 
                  type="text" 
                  class="activation-form-control" 
                  v-model="activationForm.schoolCode" 
                  id="activationSchoolCode" 
                  placeholder="School Code"
                  disabled 
                />
                <label for="activationSchoolCode" :class="{ filled: activationForm.schoolCode !== '' }">School Code</label>
              </div>

              <div class="activation-form-group">
                <input 
                  type="text" 
                  class="activation-form-control" 
                  v-model="activationForm.moduleName" 
                  id="activationModuleName" 
                  placeholder="Module Name"
                  required 
                />
                <label for="activationModuleName" :class="{ filled: activationForm.moduleName !== '' }">Module Name*</label>
              </div>

              <div class="activation-form-group">
                <input 
                  v-model="activationForm.expiryDate" 
                  type="date" 
                  id="activationExpiryDate" 
                  class="activation-form-control"
                  required 
                />
                <label for="activationExpiryDate" :class="{ filled: activationForm.expiryDate !== '' }">Expiry Date*</label>
              </div>
            </div>
            <hr />
            <div class="activation-form-actions">
              <button type="button" @click="closeActivationForm">Close</button>
              <button type="submit">Activate</button>
            </div>
          </form>
        </div>
      </div>

      
    <!-- Activation Modal -->
    <div v-if="showActivationModal" class="modal-overlay">
      <div class="modal-content">
        <h3>Activate New Module</h3>
        <form @submit.prevent="submitActivation">
          <label for="moduleName">Module Name:</label>
          <input v-model="activationData.moduleName" id="moduleName" required />

          <label for="expiryDate">Expiry Date:</label>
          <input v-model="activationData.expiryDate" type="date" id="expiryDate" required />

          <label for="maintenanceFee">Maintenance Fee:</label>
          <input v-model="activationData.maintenanceFee" type="number" id="maintenanceFee" required />

          <label for="sellingPrice">Selling Price:</label>
          <input v-model="activationData.sellingPrice" type="number" id="sellingPrice" required />

          <button type="submit" class="submit-btn">Activate</button>
          <button @click="closeActivationModal" class="cancel-btn">Cancel</button>
        </form>
      </div>
    </div>

      <div class="students-controls">
        <label for="schoolsPerPage">Schools per page:</label>
        <select class="form-control" v-model="schoolsPerPage" @change="updateSchoolsPerPage">
          <option v-for="option in schoolsPerPageOptions" :key="option" :value="option">{{ option }}</option>
        </select>
      </div>

      <!-- Desktop Table View -->
      <Scrollable>
      <table class="students-table desktop-table">
        <thead>
          <tr>
            <th>#</th>
            <th>School Code</th>
            <th>School Name</th>
            <th>Module Name</th>
            <th>Selling Price</th>
            <th>Maintenance Fee</th>
            <th>Expiry Date</th>
            <th>Installation Date</th>
            <th class="actions-header">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="filteredSchools.length === 0">
            <td colspan="9">No schools found</td>
          </tr>
          <tr v-for="(school, index) in filteredSchools" :key="school.schoolID || index" 
              :class="{ 'even-row': index % 2 !== 0 }">
            <td>{{ index + 1 }}</td>
            <td>{{ school.schoolCode }}</td>
            <td>{{ school.schoolName }}</td>
            <td>{{ school.moduleName }}</td>
            <td>{{ school.sellingPrice }}</td>
            <td>{{ school.maintenanceFee }}</td>
            <td>{{ school.expiryDate }}</td>
            <td>{{ school.installationDate }}</td>
            <td class="actions">
              <button @click="fetchActivationStatus(school)" class="manage-btn" aria-label="Activate School">
                <span class="material-symbols-outlined">check_circle</span>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      </Scrollable>

      <!-- Mobile Card View -->
      <div class="mobile-cards" v-if="filteredSchools.length > 0">
        <div v-for="(school, index) in filteredSchools" :key="school.schoolID || index" class="school-card">
          <div class="card-header">
            <div class="card-number">{{ index + 1 }}</div>
            <h3 class="card-title">{{ school.schoolName }}</h3>
          </div>
          
          <div class="card-body">
            <div class="card-row">
              <span class="card-label">School Code:</span>
              <span class="card-value">{{ school.schoolCode }}</span>
            </div>
            
            <div class="card-row">
              <span class="card-label">Module Name:</span>
              <span class="card-value">{{ school.moduleName || '-' }}</span>
            </div>
            
            <div class="card-row">
              <span class="card-label">Selling Price:</span>
              <span class="card-value">{{ school.sellingPrice || '-' }}</span>
            </div>
            
            <div class="card-row">
              <span class="card-label">Maintenance Fee:</span>
              <span class="card-value">{{ school.maintenanceFee || '-' }}</span>
            </div>
            
            <div class="card-row">
              <span class="card-label">Expiry Date:</span>
              <span class="card-value">{{ school.expiryDate || '-' }}</span>
            </div>
            
            <div class="card-row">
              <span class="card-label">Installation Date:</span>
              <span class="card-value">{{ school.installationDate || '-' }}</span>
            </div>
          </div>
          
          <div class="card-footer">
            <button @click="fetchActivationStatus(school)" class="card-action-btn" aria-label="Activate School">
              <span class="material-symbols-outlined">check_circle</span> ACTIVATE
            </button>
          </div>
        </div>
      </div>

      <div v-if="filteredSchools.length === 0" class="no-data-message">
        No schools found
      </div>
    </div>

    <LoadingSpinner :isLoading="Loading" />
    <footerCast />
  </div>
</template>


<script>
import footerCast from '../../components/footer.vue';
import Scrollable from '../../components/Scrollable.vue';
import axios from '../../axios';
import { useToast } from 'vue-toastification';
import LoadingSpinner from '../../components/LoadingSpinner.vue';
import jsPDF from 'jspdf';
import { normalizeRegisteredById, normalizeRegisteredByName } from '../../utils/schoolRegisteredBy.js';

export default {
  components: {
    footerCast,
    LoadingSpinner,
    Scrollable,
  },
  setup() {
    const toast = useToast();
    return { toast };
  },
  data() {
    return {
      searchQuery: '',
      schools: [],
      Loading: false,
      currentPage: 1,
      schoolsPerPage: 15,
      schoolsPerPageOptions: [5, 15, 30, 50, 75, 100],
      showActivationForm: false,
      activationForm: {
        schoolCode: '',
        moduleName: '',
        expiryDate: '',
        maintenanceFee: '',
        sellingPrice: '',
        marketerID: '',
        handledByID: '',
        installationDate: '', // Optional
      },
      /** Preserved from row when opening activation — API merge must not override registrant for payload */
      activationRegistrant: null, // { id } — school row only, for registeredByID on activate
      selectedSchool: null,
      pdfLoading: false,
    };
  },
  computed: {
    filteredSchools() {
      if (!this.searchQuery.trim()) {
        return this.schools;
      }
      const query = this.searchQuery.toLowerCase();
      return this.schools.filter(
        school =>
          (school.schoolName || '').toLowerCase().includes(query) ||
          (school.schoolCode || '').toString().toLowerCase().includes(query)
      );
    },
    totalPages() {
      return Math.ceil(this.filteredSchools.length / this.schoolsPerPage) || 1;
    },
    paginatedSchools() {
      const start = (this.currentPage - 1) * this.schoolsPerPage;
      const end = start + this.schoolsPerPage;
      return this.filteredSchools.slice(start, end);
    },
  },
  methods: {
    formatDateForInput(dateValue) {
      if (!dateValue || dateValue === 'N/A') return '';
      const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
      if (isNaN(date.getTime())) return '';
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    },

    // Fetch the activation status of the school
    async fetchActivationStatus(school) {
      try {
        this.Loading = true;

        this.activationRegistrant = { id: normalizeRegisteredById(school) };

        // Preload form from selected row so user sees all selected data immediately.
        this.activationForm = {
          schoolCode: school.schoolCode || '',
          moduleName: school.moduleName || '',
          expiryDate: this.formatDateForInput(school.expiryDate),
          maintenanceFee: school.maintenanceFee ?? '',
          sellingPrice: school.sellingPrice ?? '',
          marketerID: school.marketerID ?? '',
          handledByID: school.handledByID ?? '',
          installationDate: this.formatDateForInput(school.installationDate),
        };

        this.selectedSchool = school;
        this.showActivationForm = true;

        const response = await axios.post('/activations/status', {
          schoolCode: school.schoolCode,
          // Pass the actual module associated with the school
          moduleName: school.moduleName || '', // Use the school's module name or empty string if not available
        });

        const activationData = response.data;

        // Populate the activation form with the correct data, including the correct module name
        this.activationForm = {
          schoolCode: activationData.schoolCode || this.activationForm.schoolCode,
          moduleName: activationData.moduleName || this.activationForm.moduleName,
          expiryDate: this.formatDateForInput(activationData.expiryDate) || this.activationForm.expiryDate,
          maintenanceFee: activationData.maintenanceFee ?? this.activationForm.maintenanceFee,
          sellingPrice: activationData.sellingPrice ?? this.activationForm.sellingPrice,
          marketerID: activationData.marketerID ?? this.activationForm.marketerID,
          handledByID: activationData.handledByID ?? this.activationForm.handledByID,
          installationDate: this.formatDateForInput(activationData.installationDate) || this.activationForm.installationDate,
        };

      } catch (error) {
        console.error('Error fetching activation status:', error);
        this.toast.warning('Could not refresh activation details from server. Showing selected row data.');
      } finally {
        this.Loading = false;
      }
    },


    // Submit the activation form
    async submitActivationForm() {
      this.Loading = true;
      try {
        // Validate mandatory fields
        if (!this.activationForm.moduleName || !this.activationForm.expiryDate) {
          this.toast.error('Please enter module name and expiry date.');
          this.Loading = false;
          return;
        }

        // Prepare payload matching API structure exactly
        // All optional fields (marketerID, handledByID, registeredByID, installationDate) can be null
        const payload = {
          schoolCode: this.activationForm.schoolCode,
          moduleName: this.activationForm.moduleName,
          expiryDate: this.activationForm.expiryDate,
          maintenanceFee: this.activationForm.maintenanceFee ? parseFloat(this.activationForm.maintenanceFee) : null,
          sellingPrice: this.activationForm.sellingPrice ? parseFloat(this.activationForm.sellingPrice) : null,
          marketerID: this.activationForm.marketerID && !isNaN(parseInt(this.activationForm.marketerID)) ? parseInt(this.activationForm.marketerID) : null,
          handledByID: this.activationForm.handledByID && !isNaN(parseInt(this.activationForm.handledByID)) ? parseInt(this.activationForm.handledByID) : null,
          registeredByID: this.resolveExpiredActivationRegisteredById(),
          installationDate: this.activationForm.installationDate || null,
        };

        const response = await axios.post('/activations/activate', payload);
        if (response.data && response.data.activationID) {
          this.toast.success('School activated successfully!');
          this.fetchSchools(); // Refresh the expired schools list
          this.closeActivationForm();
        } else {
          this.toast.error('Failed to activate school.');
        }
      } catch (error) {
        console.error('Error activating school:', error);
        if (error.response) {
          this.toast.error(`Error: ${error.response.data.message || 'An error occurred while activating the school.'}`);
        } else {
          this.toast.error('An error occurred while activating the school.');
        }
      } finally {
        this.Loading = false;
      }
    },

    // Close the activation form
    closeActivationForm() {
      this.showActivationForm = false;
      this.selectedSchool = null;
      this.activationRegistrant = null;
      this.activationForm = {
        schoolCode: '',
        moduleName: '',
        expiryDate: '',
        maintenanceFee: '',
        sellingPrice: '',
        marketerID: '',
        handledByID: '',
        installationDate: '',
      };
    },

    resolveExpiredActivationRegisteredById() {
      const raw = this.activationRegistrant?.id;
      if (raw == null || raw === '') return null;
      const n = parseInt(String(raw), 10);
      return Number.isNaN(n) ? null : n;
    },

   // Fetch expired schools by checking their expiryDate
   async fetchSchools() {
      this.Loading = true;
      try {
        const response = await axios.post('/activations/expired');
        this.schools = response.data
          .filter((school) => {
            const expiryDate = new Date(school.expiryDate);
            return expiryDate < new Date();
          })
          .map((school) => ({
            ...school,
            registeredByID: normalizeRegisteredById(school) ?? school.registeredByID ?? null,
            registeredByName:
              normalizeRegisteredByName(school) || school.registeredByName || 'N/A',
          }));
        this.toast.success(this.schools.length > 0
          ? `Expired schools have been fetched successfully! (${this.schools.length} school${this.schools.length === 1 ? '' : 's'})`
          : 'Expired schools have been fetched successfully! No expired schools found.');
      } catch (error) {
        console.error('Error fetching expired schools:', error);
        this.toast.error('Failed to load expired schools.');
      } finally {
        this.Loading = false;
      }
    },

    exportToExcel() {
      // Export current displayed (filtered) expired schools as CSV
      const headers = [
        'Activation ID',
        'School Code',
        'School Name',
        'Module Name',
        'Installation Date',
        'Expiry Date',
        'Registered By',
        'Marketer Name',
        'Selling Price',
        'Maintenance Fee',
        'Last Login',
        'Students',
        'Receipts',
        'Vouchers',
      ];

      const rows = this.filteredSchools.map((school) => [
        school.activationID || 'N/A',
        school.schoolCode || 'N/A',
        school.schoolName || 'N/A',
        school.moduleName || 'N/A',
        school.installationDate || 'N/A',
        school.expiryDate || 'N/A',
        school.registeredByName || 'N/A',
        school.marketerName || 'N/A',
        school.sellingPrice || 0,
        school.maintenanceFee || 0,
        school.lastLogin || 'N/A',
        school.students || 'N/A',
        school.receipts || 'N/A',
        school.vouchers || 'N/A',
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
      link.download = `expired-schools-${timestamp}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    },

    formatDateForPdf(dateValue) {
      if (!dateValue || dateValue === 'N/A' || dateValue === '') return '';
      const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
      if (isNaN(date.getTime())) return String(dateValue);
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    },

    exportToPdf() {
      if (this.filteredSchools.length === 0) {
        (this.toast || useToast()).info('No schools to export.');
        return;
      }
      this.pdfLoading = true;
      try {
        const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
        const pageW = doc.internal.pageSize.getWidth();
        const pageH = doc.internal.pageSize.getHeight();
        const margin = 10;
        const rowHeight = 7;
        const headerHeight = 10;

        const cols = ['#', 'School Code', 'School Name', 'Module Name', 'Selling Price', 'Maint Fee', 'Expiry Date', 'Install Date'];
        const colWidths = [8, 22, 48, 26, 22, 20, 26, 26];
        const totalColWidth = colWidths.reduce((a, b) => a + b, 0);
        const scale = (pageW - margin * 2) / totalColWidth;
        const scaledWidths = colWidths.map(w => Math.max(w * scale, 5));

        const wrapText = (text, maxWidth) => {
          if (!text || text === 'N/A') return text ?? 'N/A';
          const str = String(text);
          if (doc.getTextWidth(str) <= maxWidth) return str;
          const lines = doc.splitTextToSize(str, maxWidth);
          return lines.length > 1 ? (lines[0] || str) + '...' : (lines[0] || str);
        };

        let y = margin;
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('Expired Schools', margin, y);
        y += 10;
        doc.setFontSize(8);
        doc.setFont(undefined, 'normal');

        const drawTableHeader = () => {
          doc.setFillColor(241, 241, 241);
          doc.rect(margin, y, pageW - margin * 2, headerHeight, 'F');
          doc.setDrawColor(221, 221, 221);
          let x = margin;
          cols.forEach((h, i) => {
            doc.rect(x, y, scaledWidths[i], headerHeight);
            doc.setFont(undefined, 'bold');
            doc.text(h, x + 2, y + headerHeight / 2 + 1.5);
            doc.setFont(undefined, 'normal');
            x += scaledWidths[i];
          });
          y += headerHeight;
        };

        const drawRow = (row, isAlt) => {
          if (y + rowHeight > pageH - margin) {
            doc.addPage('a4', 'l');
            y = margin;
            drawTableHeader();
          }
          if (isAlt) doc.setFillColor(247, 249, 252);
          else doc.setFillColor(255, 255, 255);
          let x = margin;
          row.forEach((cell, i) => {
            doc.rect(x, y, scaledWidths[i], rowHeight);
            const text = wrapText(cell, scaledWidths[i] - 3);
            doc.text(text, x + 2, y + rowHeight / 2 + 1.5);
            x += scaledWidths[i];
          });
          doc.setDrawColor(221, 221, 221);
          let lineX = margin;
          scaledWidths.forEach(w => {
            doc.rect(lineX, y, w, rowHeight);
            lineX += w;
          });
          y += rowHeight;
        };

        drawTableHeader();
        this.filteredSchools.forEach((school, index) => {
          drawRow(
            [
              String(index + 1),
              school.schoolCode || '',
              school.schoolName || '',
              school.moduleName || '',
              String(school.sellingPrice ?? ''),
              String(school.maintenanceFee ?? ''),
              this.formatDateForPdf(school.expiryDate) || 'N/A',
              this.formatDateForPdf(school.installationDate) || 'N/A',
            ],
            index % 2 !== 0
          );
        });

        const blob = doc.output('blob');
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank', 'noopener');
        const link = document.createElement('a');
        link.href = url;
        link.download = `expired-schools-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.pdf`;
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 500);
        (this.toast || useToast()).success('PDF generated. Opened in new tab and downloaded.');
      } catch (err) {
        console.error('PDF export error:', err);
        (this.toast || useToast()).error('Failed to generate PDF. Please try again.');
      } finally {
        this.pdfLoading = false;
      }
    },
  },
  // Fetch expired schools when the component is mounted
  mounted() {
    this.fetchSchools();
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
}

.action-btn:hover {
  background-color: #1e6192;
}

.action-btn .material-symbols-outlined {
  margin-right: 0.3rem;
  font-size: clamp(1rem, 2vw, 1.2rem);
}

.pdf-action-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.pdf-action-btn .pdf-loading {
  margin-right: 0.3rem;
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
  position: relative;
}

.table-scroll-wrapper {
  max-height: calc(100vh - 14rem);
  overflow-y: auto;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  border: 1px solid #ddd;
  border-radius: 4px;
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
}

.card-action-btn {
  width: 100%;
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

.card-action-btn:hover {
  background-color: #d1d5db;
  transform: translateY(-1px);
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

.actions .material-symbols-outlined {
  font-size: clamp(0.9rem, 1.5vw, 1rem);
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



/* Activation Form Styles - match "Add Module" modal look */
.activation-form-wrap {
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

.activation-form-content {
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

.activation-cancel {
  position: absolute;
  top: 10px;
  right: 10px;
  cursor: pointer;
  color: gold;
  font-size: 1.3rem;
}

.activation-form-title {
  color: gold;
  text-align: center;
}

.activation-form-title h2 {
  margin: 0;
  font-size: 1.5rem;
}

.activation-form-inputs {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  padding-top: 10px;
}

.activation-form-group {
  position: relative;
  grid-column: span 1;
}

.activation-form-group:first-child {
  grid-column: span 2;
}

.activation-form-control {
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

.activation-form-control:disabled {
  background-color: rgba(67, 104, 185, 0.7);
  cursor: not-allowed;
  opacity: 0.7;
}

.activation-form-control::placeholder {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.9rem;
}

.activation-form-group label {
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

.activation-form-group label.filled {
  top: -1px;
  left: 5px;
  color: gold;
  font-size: 0.95rem;
  font-weight: 600;
}

.activation-form-group input:focus + label,
.activation-form-group input:not(:placeholder-shown) + label,
.activation-form-group input:disabled + label.filled,
.activation-form-group select:focus + label,
.activation-form-group select:not([value=""]) + label {
  top: -1px;
  left: 5px;
  color: gold;
  font-size: 0.95rem;
  font-weight: 600;
}

.activation-form-control option {
  background-color: #4368b9;
  color: white;
  padding: 0.5rem;
}

.activation-form-actions {
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
  margin-top: 0;
}

.activation-form-actions button {
  padding: 0.3rem 1rem;
  border: none;
  cursor: pointer;
  border-radius: 4px;
  font-size: medium;
}

.activation-form-actions button:first-child {
  background: rgba(245, 56, 56, 1);
  border: 1px solid rgba(245, 56, 56, 1);
  color: black;
}

.activation-form-actions button:first-child:hover {
  background-color: #4368b9;
  color: white;
}

.activation-form-actions button:last-child {
  background: gold;
  border: 1px solid gold;
  color: black;
}

.activation-form-actions button:last-child:hover {
  background-color: #4368b9;
  color: white;
}

.activation-form-content hr {
  border: 1px solid gold;
  margin: 20px 0;
}

@media only screen and (max-width: 1024px) {
  .activation-form-content {
    width: 85%;
    max-width: 600px;
  }
}

@media only screen and (max-width: 768px) {
  .activation-form-content {
    width: 95%;
    max-width: 100%;
    padding: 15px;
    max-height: 95vh;
  }

  .activation-form-inputs {
    grid-template-columns: 1fr;
    gap: 0.9rem;
  }

  .activation-form-group {
    grid-column: span 1;
  }

  .activation-form-title h2 {
    font-size: 1.1rem;
  }
}

@media only screen and (max-width: 480px) {
  .activation-form-wrap {
    padding: 0.5rem;
  }

  .activation-form-content {
    width: 100%;
    padding: 12px;
    max-height: 100vh;
    border-radius: 0;
  }

  .activation-form-title h2 {
    font-size: 1rem;
    margin-bottom: 0.5rem;
  }

  .activation-form-inputs {
    gap: 0.75rem;
    padding-top: 5px;
  }

  .activation-form-control {
    padding: 0.4rem;
    font-size: 0.9rem;
  }

  .activation-form-actions {
    flex-direction: column;
    gap: 0.5rem;
  }

  .activation-form-actions button {
    width: 100%;
    padding: 0.5rem;
  }

  .activation-cancel {
    top: 5px;
    right: 5px;
    font-size: 1.2rem;
  }
}

/* Modal Styles */
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
}

.modal-content {
  background-color: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  width: 90%;
  max-width: 500px;
}

.modal-content h3 {
  margin-bottom: 1rem;
}

.modal-content label {
  display: block;
  margin-bottom: 0.5rem;
}

.modal-content input {
  width: 100%;
  padding: 0.5rem;
  margin-bottom: 1rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.submit-btn, .cancel-btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.submit-btn {
  background-color: #2b7ab7;
  color: white;
  margin-right: 0.5rem;
}

.cancel-btn {
  background-color: #ddd;
  color: #333;
}

.submit-btn:hover {
  background-color: #1e6192;
}

.cancel-btn:hover {
  background-color: #ccc;
}

/* Responsive Breakpoints */
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

  /* Modal Responsive Styles */
  .modal-overlay {
    padding: 1rem;
  }

  .modal-content {
    width: 100%;
    max-width: min(90vw, 500px);
    padding: clamp(1rem, 3vw, 2rem);
    max-height: min(90vh, 600px);
    overflow-y: auto;
  }

  .activation-form {
    width: 95%;
    padding: clamp(1rem, 3vw, 1.5rem);
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
  .class-list-btn {
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
  .class-list-btn {
    font-size: 0.7rem;
    padding: 0.3rem 0.4rem;
  }

  .action-btn {
    font-size: 0.75rem;
    padding: 0.35rem 0.5rem;
  }
}
</style>
  