<template>
  <div class="the-page">
    <div class="search-area">
      <!-- Header -->
      <div class="header-container1">
        <h2>All Schools</h2>
      </div>
      <div class="search-actions">
        <input
          v-model="searchQuery"
          placeholder="Search by name or code"
          class="search-input"
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

    <!-- Action Buttons -->
    <div class="header-container">
      <div class="header-object1">
        <button @click="openForm" class="action-btn" aria-label="Add School">
          <span class="material-symbols-outlined">add_circle</span> Add School
        </button>
      </div>
    </div>

    <!-- Schools Table -->
    <div class="table-container">
      <!-- Desktop Table View - Scrollable -->
      <div class="table-scroll-wrapper">
        <table class="students-table desktop-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Sch Name</th>
            <th>Sch Code</th>
            <th>Principal Contact</th>
            <th>Phone No</th>
            <th>County</th>
            <th>Registered On</th>
            <th>Status</th>
            <th class="actions-header">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="filteredSchools.length === 0">
            <td colspan="9">No schools found</td>
          </tr>
          <tr v-for="(school, index) in filteredSchools" :key="school.schoolCode" :class="{ 'even-row': index % 2 !== 0 }">
            <td>{{ index + 1 }}</td>
            <td>{{ school.schoolName }}</td>
            <td>{{ school.schoolCode }}</td>
            <td>{{ school.principalPhoneNo }}</td>
            <td>{{ school.phoneNo || 'N/A' }}</td>
            <td>{{ school.county }}</td>
            <td>{{ school.registeredOn || 'N/A' }}</td>
            <td :class="{ 'text-success': !school.deleted, 'text-danger': school.deleted }">
              {{ school.deleted ? 'DELETED' : 'ACTIVE' }}
            </td>
            <td class="actions">
              <button @click="viewSchool(school)" class="manage-btn" aria-label="View Profile">
                <span class="material-symbols-outlined">person</span>
              </button>
              <button @click="confirmDeleteSchool(school)" class="class-list-btn" aria-label="Delete School">
                <span class="material-symbols-outlined">delete</span>
              </button>
              <button @click="openActivationModal(school)" class="activate-btn" aria-label="Add Module">
                <span class="material-symbols-outlined">add</span>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      </div>

      <!-- Mobile Card View -->
      <div class="mobile-cards" v-if="filteredSchools.length > 0">
        <div v-for="(school, index) in filteredSchools" :key="school.schoolCode" class="school-card">
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
              <span class="card-label">Principal Contact:</span>
              <span class="card-value">{{ school.principalPhoneNo }}</span>
            </div>
            
            <div class="card-row">
              <span class="card-label">Phone No:</span>
              <span class="card-value">{{ school.phoneNo || 'N/A' }}</span>
            </div>
            
            <div class="card-row">
              <span class="card-label">County:</span>
              <span class="card-value">{{ school.county }}</span>
            </div>
            
            <div class="card-row">
              <span class="card-label">Registered On:</span>
              <span class="card-value">{{ school.registeredOn || 'N/A' }}</span>
            </div>
            
            <div class="card-row">
              <span class="card-label">Status:</span>
              <span class="card-value" :class="{ 'text-success': !school.deleted, 'text-danger': school.deleted }">
                {{ school.deleted ? 'DELETED' : 'ACTIVE' }}
              </span>
            </div>
          </div>
          
          <div class="card-footer">
            <button @click="viewSchool(school)" class="card-action-btn manage-btn" aria-label="View Profile">
              <span class="material-symbols-outlined">person</span>
            </button>
            <button @click="confirmDeleteSchool(school)" class="card-action-btn class-list-btn" aria-label="Delete School">
              <span class="material-symbols-outlined">delete</span>
            </button>
            <button @click="openActivationModal(school)" class="card-action-btn activate-btn" aria-label="Add Module">
              <span class="material-symbols-outlined">add</span>
            </button>
          </div>
        </div>
      </div>

      <div v-if="filteredSchools.length === 0" class="no-data-message">
        No schools found
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteConfirm" class="modal-overlay" @click.self="cancelDeleteSchool">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Confirm Delete School</h3>
          <button @click="cancelDeleteSchool" class="close-btn">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <p class="delete-warning-text">
            Are you sure you want to delete <strong>{{ schoolToDelete?.schoolName || schoolToDelete?.schoolCode }}</strong>?
          </p>
          <div class="delete-school-preview" v-if="schoolToDelete">
            <div class="preview-row">
              <strong>School Code:</strong> {{ schoolToDelete.schoolCode }}
            </div>
            <div class="preview-row">
              <strong>School Name:</strong> {{ schoolToDelete.schoolName }}
            </div>
            <div class="preview-row" v-if="schoolToDelete.principalName">
              <strong>Principal:</strong> {{ schoolToDelete.principalName }}
            </div>
            <div class="preview-row" v-if="schoolToDelete.county">
              <strong>County:</strong> {{ schoolToDelete.county }}
            </div>
          </div>
          <p class="delete-warning-note">
            <i class="fas fa-exclamation-triangle"></i> This action will soft delete the school. The school will be marked as deleted but not permanently removed from the system.
          </p>
        </div>
        <div class="form-actions">
          <button @click="cancelDeleteSchool" class="cancel-btn">Cancel</button>
          <button @click="deleteSchoolConfirm" class="delete-confirm-btn" :disabled="Loading">
            <span class="material-symbols-outlined">delete</span> Delete School
          </button>
        </div>
      </div>
    </div>

    <!-- Activation Modal -->
    <div v-if="showActivationModal" class="activation-form-wrap">
      <div class="activation-form-content">
        <div class="activation-cancel" @click="closeActivationModal">
          <i class="fas fa-times"></i>
        </div>
        <div class="activation-form-title">
          <h2>Activate New Module</h2>
        </div>
        <hr />
        <div class="activation-form-inputs">
          <div class="activation-form-group">
            <input 
              type="text" 
              class="activation-form-control" 
              v-model="activationData.schoolCode" 
              id="activationSchoolCode" 
              placeholder="School Code"
              disabled 
            />
            <label for="activationSchoolCode" :class="{ filled: activationData.schoolCode !== '' }">School Code</label>
          </div>

          <div class="activation-form-group">
            <select 
              id="activationModuleSelect"
              v-model="activationData.moduleName"
              class="activation-form-control"
              required
            >
              <option value="" disabled>Select Module*</option>
              <option 
                v-for="module in modules" 
                :key="module.id" 
                :value="module.name"
              >
                {{ module.name }}
              </option>
            </select>
            <label for="activationModuleSelect" :class="{ filled: activationData.moduleName !== '' && activationData.moduleName !== null }">Select Module*</label>
          </div>

          <div class="activation-form-group">
            <input 
              v-model="activationData.expiryDate" 
              type="date" 
              id="activationExpiryDate" 
              class="activation-form-control"
              required 
            />
            <label for="activationExpiryDate" :class="{ filled: activationData.expiryDate !== '' }">Expiry Date*</label>
          </div>

          <div class="activation-form-group">
            <input 
              v-model="activationData.maintenanceFee" 
              type="number" 
              id="activationMaintenanceFee" 
              class="activation-form-control"
              placeholder="Maintenance Fee"
              step="0.01"
              required
            />
            <label for="activationMaintenanceFee" :class="{ filled: activationData.maintenanceFee !== '' && activationData.maintenanceFee !== null }">Maintenance Fee*</label>
          </div>

          <div class="activation-form-group">
            <input 
              v-model="activationData.sellingPrice" 
              type="number" 
              id="activationSellingPrice" 
              class="activation-form-control"
              placeholder="Selling Price"
              step="0.01"
              required
            />
            <label for="activationSellingPrice" :class="{ filled: activationData.sellingPrice !== '' && activationData.sellingPrice !== null }">Selling Price*</label>
          </div>

          <div class="activation-form-group">
            <input 
              v-model="activationData.marketerID" 
              type="number" 
              id="activationMarketerID" 
              class="activation-form-control"
              placeholder="Marketer ID (Optional)"
            />
            <label for="activationMarketerID" :class="{ filled: activationData.marketerID !== '' && activationData.marketerID !== null }">Marketer ID (Optional)</label>
          </div>

          <div class="activation-form-group">
            <input 
              v-model="activationData.handledByID" 
              type="number" 
              id="activationHandledByID" 
              class="activation-form-control"
              placeholder="Handled By ID (Optional)"
            />
            <label for="activationHandledByID" :class="{ filled: activationData.handledByID !== '' && activationData.handledByID !== null }">Handled By ID (Optional)</label>
          </div>

          <div class="activation-form-group">
            <select 
              id="activationRegisteredBySelect"
              v-model="activationData.registeredByID"
              class="activation-form-control"
            >
              <option value="">Select Registered By (Optional)</option>
              <option 
                v-for="user in users" 
                :key="user.id || user.userID" 
                :value="user.id || user.userID || user.idNumber"
              >
                {{ user.fullname || user.username }}
              </option>
            </select>
            <label for="activationRegisteredBySelect" :class="{ filled: activationData.registeredByID !== '' && activationData.registeredByID !== null }">Select Registered By (Optional)</label>
          </div>

          <div class="activation-form-group">
            <input 
              v-model="activationData.installationDate" 
              type="date" 
              id="activationInstallationDate" 
              class="activation-form-control"
            />
            <label for="activationInstallationDate" :class="{ filled: activationData.installationDate !== '' }">Installation Date (Optional)</label>
          </div>
        </div>
        <hr />
        <div class="activation-form-actions">
          <button type="button" @click="closeActivationModal">Close</button>
          <button type="button" @click="submitActivation">Activate</button>
        </div>
      </div>
    </div>

    <NewSchool :school="selectedSchool" @closeForm="closeForm" @fetchSchools="fetchSchools" v-if="show" />
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
import NewSchool from './NewSchool.vue';
import jsPDF from 'jspdf';

export default {
  components: {
    footerCast,
    NewSchool,
    LoadingSpinner,
  },
  setup() {
    const toast = useToast();
    


    return { toast };
  },
  data() {
    return {
      selectedSchool: null,
      show: false,
      searchQuery: '',
      schools: [],
      modules: [], // Empty initially, will be populated from the API
      Loading: false,
      showActivationModal: false,
      showDeleteConfirm: false,
      schoolToDelete: null,
      users: [], // Store users list for mapping registeredByID to names
      activationData: {
        schoolCode: "",
        moduleName: "", // Selected module name
        expiryDate: "",
        maintenanceFee: "",
        sellingPrice: "",
        marketerID: "",
        handledByID: "",
        registeredByID: "", // Optional
        installationDate: "", // Optional
      },
      pdfLoading: false,
    };
  },
  computed: {
    filteredSchools() {
      if (!this.searchQuery.trim()) return this.schools;
      return this.schools.filter(school => {
        return (
          school.schoolName.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
          school.schoolCode.toLowerCase().includes(this.searchQuery.toLowerCase())
        );
      });
    },
  },
  methods: {
    viewSchool(school) {
      this.selectedSchool = school;
      this.show = true;
    },
    formatDateForExcel(dateValue) {
      if (!dateValue || dateValue === 'N/A' || dateValue === '') {
        return '';
      }
      
      // Try to parse the date
      let date;
      if (dateValue instanceof Date) {
        date = dateValue;
      } else if (typeof dateValue === 'string') {
        date = new Date(dateValue);
      } else {
        return dateValue.toString();
      }
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return dateValue.toString();
      }
      
      // Format as YYYY-MM-DD for Excel (Excel recognizes this format)
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    },
    exportToExcel() {
      // Export currently filtered rows (ignores pagination) as CSV
      const headers = [
        'School Name',
        'School Code',
        'School Level',
        'Principal Name',
        'Principal Phone',
        'Bursar Phone',
        'Dean Phone',
        'Email',
        'Phone No',
        'County',
        'Subcounty',
        'Address',
        'Registered On',
        'Registered By',
        'Marketer',
        'School Motto',
        'Students',
        'Status',
      ];
      const rows = this.filteredSchools.map((school) => [
        school.schoolName || '',
        school.schoolCode || '',
        school.schoolLevel || '',
        school.principalName || '',
        school.principalPhoneNo || '',
        school.bursarPhoneNo || '',
        school.deanPhoneNo || '',
        school.email || '',
        school.phoneNo || '',
        school.county || '',
        school.subcounty || '',
        school.address || '',
        this.formatDateForExcel(school.registeredOn),
        school.registeredByName || 'N/A',
        school.marketerName || 'N/A',
        school.schoolMotto || '',
        school.students || '',
        school.deleted ? 'DELETED' : 'ACTIVE',
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
      link.download = `all-schools-${timestamp}.csv`;
      link.click();
      URL.revokeObjectURL(url);
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

        const cols = ['#', 'Sch Name', 'Sch Code', 'Principal Contact', 'Phone No', 'County', 'Registered On', 'Status'];
        const colWidths = [8, 45, 25, 32, 28, 25, 28, 18];
        const totalColWidth = colWidths.reduce((a, b) => a + b, 0);
        const scale = (pageW - margin * 2) / totalColWidth;
        const scaledWidths = colWidths.map(w => Math.max(w * scale, 5));

        const wrapText = (text, maxWidth) => {
          if (!text || text === 'N/A') return text || 'N/A';
          const str = String(text);
          if (doc.getTextWidth(str) <= maxWidth) return str;
          let line = '';
          const words = str.split(/\s+/);
          for (const word of words) {
            const test = line ? line + ' ' + word : word;
            if (doc.getTextWidth(test) <= maxWidth) line = line ? line + ' ' + word : word;
            else {
              if (line) return line + '...';
              return doc.splitTextToSize(str, maxWidth)[0]?.replace(/.$/, '...') || str.slice(0, 5) + '...';
            }
          }
          return line;
        };

        let y = margin;
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('All Schools', margin, y);
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
          const registeredOn = this.formatDateForExcel(school.registeredOn) || 'N/A';
          const status = school.deleted ? 'DELETED' : 'ACTIVE';
          drawRow(
            [
              String(index + 1),
              school.schoolName || '',
              school.schoolCode || '',
              school.principalPhoneNo || '',
              school.phoneNo || 'N/A',
              school.county || '',
              registeredOn,
              status,
            ],
            index % 2 !== 0
          );
        });

        const blob = doc.output('blob');
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank', 'noopener');
        const link = document.createElement('a');
        link.href = url;
        link.download = `all-schools-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.pdf`;
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
    openForm() {
      this.show = true;
    },
    closeForm() {
      this.show = false;
      this.selectedSchool = null;
    },
    async fetchUsers() {
      try {
        const response = await axios.post('/auth/list_users', {});
        console.log('👥 Users API Response (raw):', response.data);
        console.log('👥 First user sample:', response.data?.[0]);
        console.log('👥 First user keys:', response.data?.[0] ? Object.keys(response.data[0]) : 'No users');
        
        // API returns: userID, username, fullname, phoneNo, email, usertype, role
        // Store users for mapping - API returns userID (not id)
        this.users = response.data.map((user, index) => {
          const userId = user.userID; // API spec says userID
          console.log(`👤 User ${index} - ID field:`, {
            userID: user.userID,
            allKeys: Object.keys(user),
          });
          
          return {
            id: userId,
            idString: userId ? String(userId) : null,
            idNumber: userId ? Number(userId) : null,
            fullname: user.fullname || '',
            username: user.username || '',
          };
        });
        
        console.log('✅ Mapped users with IDs:', this.users);
      } catch (error) {
        console.error('❌ Error fetching users:', error);
        // Don't show error toast - users fetch is optional for mapping
      }
    },
    async fetchSchools() {
  this.Loading = true;
  const toast = useToast();
  try {
    // Fetch users first to get the mapping
    await this.fetchUsers();
    
    // Create a map of user ID to fullname (try both string and number keys)
    const userMap = new Map();
    this.users.forEach(user => {
      if (user.id !== null && user.id !== undefined) {
        // Add both string and number keys to handle type mismatches
        userMap.set(String(user.id), user.fullname);
        userMap.set(Number(user.id), user.fullname);
        userMap.set(user.id, user.fullname);
      }
    });
    console.log('🗺️ User ID to Name Map (size:', userMap.size, '):', Array.from(userMap.entries()).slice(0, 5));
    
    const response = await axios.post('/schools/list', {});
    
    console.log('📋 Schools API Response (first 2):', response.data?.slice(0, 2));
    if (response.data && response.data.length > 0) {
      const firstSchool = response.data[0];
      console.log('📋 First school ALL FIELDS:', firstSchool);
      console.log('📋 First school keys:', Object.keys(firstSchool));
      console.log('📋 First school - registeredBy fields:', {
        registeredByName: firstSchool.registeredByName,
        registeredByID: firstSchool.registeredByID,
        registeredBy: firstSchool.registeredBy,
        registeredById: firstSchool.registeredById,
        registered_by_id: firstSchool.registered_by_id,
        registered_by_name: firstSchool.registered_by_name,
        registered_by: firstSchool.registered_by,
      });
    }
    
    const mapped = (response.data || []).map(school => {
      // Map registeredByID and registeredByName from API response
      const registeredByID = school.registeredByID || null;
      let registeredByName = school.registeredByName || null;
      
      // If we have a registeredByID but no name, try to map it from users list
      if (!registeredByName && registeredByID !== null && registeredByID !== undefined && registeredByID !== '') {
        registeredByName = userMap.get(registeredByID) || 
                         userMap.get(String(registeredByID)) || 
                         userMap.get(Number(registeredByID)) ||
                         null;
      }
      
      // Map marketerID and marketerName from API response
      const marketerID = school.marketerID || null;
      let marketerName = school.marketerName || null;
      
      // If we have a marketerID but no name, try to map it from users list
      if (!marketerName && marketerID !== null && marketerID !== undefined && marketerID !== '') {
        marketerName = userMap.get(marketerID) || 
                      userMap.get(String(marketerID)) || 
                      userMap.get(Number(marketerID)) ||
                      null;
      }
      
      return {
        // Core fields
        schoolCode: school.schoolCode || '',
        schoolName: school.schoolName || '',
        schoolLevel: school.schoolLevel || '',
        
        // Contact information
        email: school.email || '',
        phoneNo: school.phoneNo || '',
        address: school.address || '',
        
        // Principal information
        principalName: school.principalName || '',
        principalPhoneNo: school.principalPhoneNo || '',
        
        // Additional contact information (from new API)
        bursarPhoneNo: school.bursarPhoneNo || '',
        deanPhoneNo: school.deanPhoneNo || '',
        
        // Location information
        county: school.county || '',
        subcounty: school.subcounty || '',
        
        // Registration information
        registeredByID: registeredByID,
        registeredByName: registeredByName || 'N/A',
        registeredOn: school.registeredOn || null,
        
        // Marketer information (from new API)
        marketerID: marketerID,
        marketerName: marketerName || null,
        
        // Additional fields
        schoolMotto: school.schoolMotto || '',
        deleted: school.deleted || false,
        
        // Module information (if present)
        modules: school.modules || (school.moduleName ? [school.moduleName] : []),
        moduleName: school.moduleName || (school.modules ? school.modules.join(', ') : ''),
        
        // Additional fields that might be present
        students: school.students || null,
      };
    });

    // Avoid duplicates by schoolCode (e.g. if API returns same school twice after update)
    const byCode = new Map();
    mapped.forEach(s => {
      const code = s.schoolCode || '';
      if (!byCode.has(code)) byCode.set(code, s);
    });
    this.schools = Array.from(byCode.values());
    
    console.log('✅ Final mapped schools (first 3):', this.schools.slice(0, 3));
  } catch (error) {
    console.error('Error fetching all schools:', error);
    toast.error('Failed to fetch schools. Please try again.');
  } finally {
    this.Loading = false;
  }
},






    async fetchModules() {
  try {
    const response = await axios.post('/modules/list');  // Fetch modules from API
    console.log("Fetched Modules:", response.data);  // Check the response here

    // Map over the response to get the module names
    this.modules = response.data.map(module => ({
      id: module.moduleID,    // Use the moduleID as a unique key
      name: module.moduleName // Display the moduleName in the dropdown
    }));

  } catch (error) {
    console.error('Error fetching modules:', error);
  }


    },
    confirmDeleteSchool(school) {
      this.schoolToDelete = school;
      this.showDeleteConfirm = true;
    },

    cancelDeleteSchool() {
      this.showDeleteConfirm = false;
      this.schoolToDelete = null;
    },

    async deleteSchoolConfirm() {
      if (!this.schoolToDelete || !this.schoolToDelete.schoolCode) {
        const toast = useToast();
        toast.error('Invalid school. Cannot delete.');
        return;
      }

      const schoolCode = this.schoolToDelete.schoolCode;
      const toast = useToast();
      this.Loading = true;

      try {
        console.log('🗑️ Deleting school:', schoolCode);
        
        // Use the correct endpoint format: POST /api/schools/delete/{schoolcode}
        const response = await axios.post(
          `/schools/delete/${encodeURIComponent(schoolCode)}`,
          {},
          {
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        console.log('✅ School deleted successfully:', response.data);

        if (response.data) {
          // Update the school in the list to mark it as deleted
          const schoolIndex = this.schools.findIndex(s => s.schoolCode === schoolCode);
          if (schoolIndex !== -1) {
            this.schools[schoolIndex].deleted = true;
          }
          
          toast.success(`School "${this.schoolToDelete.schoolName || schoolCode}" deleted successfully!`);
        } else {
          // Response is null - school doesn't exist
          toast.warning(`School "${schoolCode}" not found. It may have already been deleted.`);
          // Remove from list if it doesn't exist
          this.schools = this.schools.filter(school => school.schoolCode !== schoolCode);
        }

        this.cancelDeleteSchool();
        // Optionally refresh the list
        // await this.fetchSchools();
      } catch (error) {
        console.error('❌ Error deleting school:', error);
        console.error('❌ Error details:', {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data,
          config: error.config,
        });

        let errorMessage = 'Failed to delete school. Please try again.';

        if (error.response) {
          const status = error.response.status;
          const errorData = error.response.data;

          if (status === 400) {
            errorMessage = errorData?.message || 'Invalid request. The school code may be invalid.';
          } else if (status === 404) {
            errorMessage = 'School not found. It may have already been deleted.';
            // Remove from list if not found
            this.schools = this.schools.filter(school => school.schoolCode !== schoolCode);
          } else if (status === 500) {
            errorMessage = 'Server error. Please try again later.';
          } else {
            errorMessage = errorData?.message || `Server returned status ${status}`;
          }
        } else if (error.request) {
          errorMessage = 'No response from server. Please check your connection.';
        } else {
          errorMessage = error.message || 'An unexpected error occurred.';
        }

        toast.error(errorMessage, { timeout: 6000 });
      } finally {
        this.Loading = false;
      }
    },

    async openActivationModal(school) {
      console.log("Modal opened for school:", school.schoolCode);
      this.activationData.schoolCode = school.schoolCode; // Set the school code
      this.showActivationModal = true;
      // Fetch modules and users when the modal opens
      this.fetchModules();
      // Fetch users if not already fetched
      if (this.users.length === 0) {
        await this.fetchUsers();
      }
      
      // Auto-populate handledByID with logged-in user's ID if not set
      // This ensures we know who handled the activation even if API doesn't return it
      if (!this.activationData.handledByID) {
        const loggedInUserId = localStorage.getItem('userId') || localStorage.getItem('userID');
        if (loggedInUserId) {
          this.activationData.handledByID = parseInt(loggedInUserId);
          console.log('Auto-populated handledByID with logged-in user:', loggedInUserId);
        }
      }
    },

    closeActivationModal() {
      this.showActivationModal = false;
      this.activationData = {
        schoolCode: "",
        moduleName: "", // Reset the module selection
        expiryDate: "",
        maintenanceFee: "",
        sellingPrice: "",
        marketerID: "",
        handledByID: "",
        registeredByID: "",
        installationDate: "",
      };
    },
    async submitActivation() {
      const toast = useToast();
      this.Loading = true;

      // Validate required fields according to API documentation
      if (!this.activationData.schoolCode) {
        toast.error("School Code is required.");
        this.Loading = false;
        return;
      }

      if (!this.activationData.moduleName) {
        toast.error("Please select a module.");
        this.Loading = false;
        return;
      }

      if (!this.activationData.expiryDate) {
        toast.error("Expiry Date is required.");
        this.Loading = false;
        return;
      }

      // Validate maintenanceFee and sellingPrice are required (as per API)
      if (!this.activationData.maintenanceFee || isNaN(parseFloat(this.activationData.maintenanceFee))) {
        toast.error("Please enter a valid Maintenance Fee.");
        this.Loading = false;
        return;
      }

      if (!this.activationData.sellingPrice || isNaN(parseFloat(this.activationData.sellingPrice))) {
        toast.error("Please enter a valid Selling Price.");
        this.Loading = false;
        return;
      }

      try {
        console.log('Submitting activation data:', this.activationData);

        // Get logged-in user ID as fallback for handledByID
        const loggedInUserId = localStorage.getItem('userId') || localStorage.getItem('userID');
        let handledByID = this.activationData.handledByID;
        
        // Convert to number if it's a string (from dropdown)
        if (handledByID && typeof handledByID === 'string') {
          handledByID = handledByID.trim() === '' ? null : parseInt(handledByID);
        }
        
        // If handledByID is not provided or invalid, use logged-in user's ID
        if (!handledByID || isNaN(handledByID)) {
          if (loggedInUserId) {
            handledByID = parseInt(loggedInUserId);
            console.log('✅ Using logged-in user ID for handledByID:', handledByID);
          } else {
            handledByID = null;
            console.warn('⚠️ No handledByID provided and no logged-in user ID found');
          }
        } else {
          handledByID = parseInt(handledByID);
        }

        // Look up handler name from users list (for display even if API doesn't return it)
        let handledByName = null;
        if (handledByID) {
          const handlerUser = this.users.find(u => {
            const userId = u.id || u.userID || u.idNumber;
            const userIdNum = userId ? parseInt(userId) : null;
            return userIdNum === handledByID || userId === handledByID;
          });
          if (handlerUser) {
            handledByName = handlerUser.fullname || handlerUser.username || null;
            console.log('✅ Found handler name:', handledByName, 'for ID:', handledByID);
          } else {
            console.warn('⚠️ Handler user not found in users list for ID:', handledByID);
          }
        }

        // Prepare payload matching API structure exactly as per documentation
        // Required: schoolCode, moduleName, expiryDate, maintenanceFee, sellingPrice
        // Optional: marketerID, registeredByID, handledByID, installationDate
        const payload = {
          schoolCode: this.activationData.schoolCode,
          moduleName: this.activationData.moduleName,
          expiryDate: this.activationData.expiryDate,
          maintenanceFee: parseFloat(this.activationData.maintenanceFee),
          sellingPrice: parseFloat(this.activationData.sellingPrice),
        };

        // Add optional fields only if they have values
        if (this.activationData.marketerID && !isNaN(parseInt(this.activationData.marketerID))) {
          payload.marketerID = parseInt(this.activationData.marketerID);
        }

        if (this.activationData.registeredByID && !isNaN(parseInt(this.activationData.registeredByID))) {
          payload.registeredByID = parseInt(this.activationData.registeredByID);
        }

        // Always include handledByID (either from form or logged-in user)
        if (handledByID) {
          payload.handledByID = handledByID;
        }

        if (this.activationData.installationDate) {
          payload.installationDate = this.activationData.installationDate;
        }

        console.log('Activation payload:', payload);

        // Call the API endpoint as per documentation: POST /api/activations/activate
        const response = await axios.post('/activations/activate', payload);

        // Handle response according to actual API response structure
        // Actual response includes: activationID, moduleName, schoolName, schoolCode, installationDate, 
        // expiryDate, registeredByID, registeredByName, marketerID, marketerName, sellingPrice, 
        // maintenanceFee, lastLogin, students, receipts, vouchers
        // Note: handledByID and handledByName are not in actual response (despite being in docs)
        if (response.status === 200 && response.data) {
          const activationResponse = response.data;
          
          console.log('✅ Activation successful! Full response:', activationResponse);
          
          // Display success message with activation details
          const schoolDisplayName = activationResponse.schoolName || activationResponse.schoolCode;
          toast.success(`Module "${activationResponse.moduleName}" activated successfully for ${schoolDisplayName}!`);
          
          // Get handler information (API doesn't return it, but we sent it and looked it up)
          // Use the handledByID and handledByName we determined earlier
          const finalHandledByID = handledByID || null;
          const finalHandledByName = handledByName || null;
          
          // Log handler information for debugging
          console.log('👤 Handler Information Captured:', {
            handledByID: finalHandledByID,
            handledByName: finalHandledByName,
            note: 'This information is stored locally since API response does not include it',
            willBeStoredInSchool: true
          });
          
          // Log the response matching actual API structure + handler info we added
          console.log('📋 Activation Response (Actual API Format + Handler Info):', {
            activationID: activationResponse.activationID,
            schoolCode: activationResponse.schoolCode,
            schoolName: activationResponse.schoolName,
            moduleName: activationResponse.moduleName,
            expiryDate: activationResponse.expiryDate,
            maintenanceFee: activationResponse.maintenanceFee,
            sellingPrice: activationResponse.sellingPrice,
            installationDate: activationResponse.installationDate,
            marketerID: activationResponse.marketerID,
            marketerName: activationResponse.marketerName,
            registeredByID: activationResponse.registeredByID,
            registeredByName: activationResponse.registeredByName,
            // Handler info (not in API response, but we looked it up and will display it)
            handledByID: finalHandledByID,
            handledByName: finalHandledByName,
            lastLogin: activationResponse.lastLogin,
            students: activationResponse.students,
            receipts: activationResponse.receipts,
            vouchers: activationResponse.vouchers,
          });

          // Format expiryDate if it's in ISO format (remove timezone info for display)
          // Actual format: "2026-07-15T00:00:00.000+00:00" -> "2026-07-15"
          let formattedExpiryDate = activationResponse.expiryDate;
          if (formattedExpiryDate && typeof formattedExpiryDate === 'string' && formattedExpiryDate.includes('T')) {
            formattedExpiryDate = formattedExpiryDate.split('T')[0];
          }
          
          // Format installationDate if needed (should already be in YYYY-MM-DD format)
          let formattedInstallationDate = activationResponse.installationDate;
          if (formattedInstallationDate && typeof formattedInstallationDate === 'string' && formattedInstallationDate.includes('T')) {
            formattedInstallationDate = formattedInstallationDate.split('T')[0];
          }

          // Update the existing school entry in the list
          const schoolIndex = this.schools.findIndex(s => s.schoolCode === activationResponse.schoolCode);
          if (schoolIndex !== -1) {
            // Initialize modules array if it doesn't exist
            if (!this.schools[schoolIndex].modules) {
              if (this.schools[schoolIndex].moduleName) {
                const existingModule = this.schools[schoolIndex].moduleName;
                this.schools[schoolIndex].modules = existingModule.includes(',') 
                  ? existingModule.split(',').map(m => m.trim()).filter(m => m)
                  : [existingModule];
              } else {
                this.schools[schoolIndex].modules = [];
              }
            }
            
            // Add the new module to the array if it's not already there
            const newModuleName = activationResponse.moduleName;
            if (newModuleName && !this.schools[schoolIndex].modules.includes(newModuleName)) {
              this.schools[schoolIndex].modules.push(newModuleName);
            }
            
            // Update the school entry with activation response data (matching actual API response structure)
            // Include handler information even though API doesn't return it
            const updatedModules = this.schools[schoolIndex].modules;
            this.schools[schoolIndex] = {
              ...this.schools[schoolIndex],
              // Core activation fields (from actual API response)
              activationID: activationResponse.activationID,
              schoolCode: activationResponse.schoolCode,
              schoolName: activationResponse.schoolName || this.schools[schoolIndex].schoolName,
              moduleName: updatedModules.length > 0 ? updatedModules.join(', ') : '',
              modules: updatedModules,
              
              // Date fields (formatted for display)
              installationDate: formattedInstallationDate || activationResponse.installationDate || null,
              expiryDate: formattedExpiryDate || activationResponse.expiryDate || null,
              
              // Financial fields
              maintenanceFee: activationResponse.maintenanceFee !== null && activationResponse.maintenanceFee !== undefined 
                ? parseFloat(activationResponse.maintenanceFee) : null,
              sellingPrice: activationResponse.sellingPrice !== null && activationResponse.sellingPrice !== undefined 
                ? parseFloat(activationResponse.sellingPrice) : null,
              
              // User/Personnel fields (can be null in actual response)
              registeredByID: activationResponse.registeredByID !== null && activationResponse.registeredByID !== undefined 
                ? activationResponse.registeredByID : null,
              registeredByName: activationResponse.registeredByName || null,
              marketerID: activationResponse.marketerID !== null && activationResponse.marketerID !== undefined 
                ? activationResponse.marketerID : null,
              marketerName: activationResponse.marketerName || null,
              
              // Handler information (not in API response, but we looked it up and sent it)
              handledByID: finalHandledByID,
              handledByName: finalHandledByName,
              
              // Additional fields from actual response (not in docs but present)
              lastLogin: activationResponse.lastLogin || null,
              students: activationResponse.students !== null && activationResponse.students !== undefined 
                ? activationResponse.students : null,
              receipts: activationResponse.receipts !== null && activationResponse.receipts !== undefined 
                ? activationResponse.receipts : null,
              vouchers: activationResponse.vouchers !== null && activationResponse.vouchers !== undefined 
                ? activationResponse.vouchers : null,
            };
          } else {
            // If school not found in list, add it with activation data
            console.log('⚠️ School not found in list, adding new entry');
            this.schools.push({
              // Core fields
              activationID: activationResponse.activationID,
              schoolCode: activationResponse.schoolCode,
              schoolName: activationResponse.schoolName || null,
              moduleName: activationResponse.moduleName || '',
              modules: activationResponse.moduleName ? [activationResponse.moduleName] : [],
              
              // Date fields (formatted)
              installationDate: formattedInstallationDate || activationResponse.installationDate || null,
              expiryDate: formattedExpiryDate || activationResponse.expiryDate || null,
              
              // Financial fields
              maintenanceFee: activationResponse.maintenanceFee !== null && activationResponse.maintenanceFee !== undefined 
                ? parseFloat(activationResponse.maintenanceFee) : null,
              sellingPrice: activationResponse.sellingPrice !== null && activationResponse.sellingPrice !== undefined 
                ? parseFloat(activationResponse.sellingPrice) : null,
              
              // User/Personnel fields
              registeredByID: activationResponse.registeredByID !== null && activationResponse.registeredByID !== undefined 
                ? activationResponse.registeredByID : null,
              registeredByName: activationResponse.registeredByName || null,
              marketerID: activationResponse.marketerID !== null && activationResponse.marketerID !== undefined 
                ? activationResponse.marketerID : null,
              marketerName: activationResponse.marketerName || null,
              
              // Handler information (not in API response, but we looked it up and sent it)
              handledByID: finalHandledByID,
              handledByName: finalHandledByName,
              
              // Additional fields from actual response
              lastLogin: activationResponse.lastLogin || null,
              students: activationResponse.students !== null && activationResponse.students !== undefined 
                ? activationResponse.students : null,
              receipts: activationResponse.receipts !== null && activationResponse.receipts !== undefined 
                ? activationResponse.receipts : null,
              vouchers: activationResponse.vouchers !== null && activationResponse.vouchers !== undefined 
                ? activationResponse.vouchers : null,
            });
          }

          // Refresh the schools list to get updated data
          await this.fetchSchools();

          this.closeActivationModal(); // Close the modal
        } else {
          toast.error("Failed to activate module. Invalid response from server.");
        }
      } catch (error) {
        console.error("Activation error:", error);

        // Handle errors according to API documentation
        // API returns 500 Internal Server Error if module or school is not set
        if (error.response) {
          const status = error.response.status;
          const errorData = error.response.data;
          
          console.error("Backend error response:", {
            status: status,
            data: errorData
          });

          if (status === 500) {
            // 500 Internal Server Error - module or school is not set
            toast.error("Activation failed: Module or school is not set. Please verify the school code and module name.");
          } else if (status === 400) {
            // Bad Request - validation error
            toast.error(`Validation error: ${errorData.message || 'Invalid request data'}`);
          } else if (status === 404) {
            // Not Found
            toast.error("Resource not found. Please check the school code and module name.");
          } else {
            // Other server errors
            toast.error(`Server error: ${errorData.message || `Error ${status} occurred`}`);
          }
        } else if (error.request) {
          // Network error - no response received
          console.error("Network error:", error.message);
          toast.error("Network error: Unable to reach the server. Please check your connection.");
        } else {
          // Request setup error
          console.error("Request setup error:", error.message);
          toast.error(`Error: ${error.message || 'An unexpected error occurred'}`);
        }
      } finally {
        this.Loading = false;
      }
    },


  },
  mounted() {
    this.fetchSchools();
  },
};
</script>
    
  <style scoped>

  .activate-btn {
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

  .activate-btn:hover {
    background-color: #d4d7ff;
    transform: translateY(-1px);
  }


  /* Activation Modal Styles - Matching NewSchool.vue */
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
    margin-top: 1rem;
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

  @media only screen and (max-width: 480px) {
    .modal-content {
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
  border-bottom: 1px solid #ddd;
  vertical-align: middle;
  border: 1px solid #ddd;
}

  .students-table tbody tr {
    height: auto;
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
    flex-wrap: nowrap;  
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
    color: #333;
    display: inline-block;
    white-space: nowrap;
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

/* Delete Confirmation Modal Styles (matching other delete dialogs) */
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

.delete-school-preview {
  background-color: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  padding: 1rem;
  margin: 1rem 0;
}

.delete-school-preview .preview-row {
  padding: 0.5rem 0;
  border-bottom: 1px solid #e9ecef;
  font-size: clamp(0.9rem, 1.3vw, 1rem);
}

.delete-school-preview .preview-row:last-child {
  border-bottom: none;
}

.delete-school-preview .preview-row strong {
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

@media only screen and (max-width: 480px) {
  .modal-overlay .modal-content {
    width: 95vw;
    padding: clamp(0.75rem, 3vw, 1.25rem);
    border-radius: 6px;
  }

  .delete-school-preview {
    padding: 0.75rem;
  }

  .delete-school-preview .preview-row {
    padding: 0.4rem 0;
    font-size: clamp(0.85rem, 1.2vw, 0.9rem);
  }

  .delete-warning-note {
    padding: 0.6rem;
    font-size: clamp(0.8rem, 1.1vw, 0.85rem);
  }
}
</style>
    