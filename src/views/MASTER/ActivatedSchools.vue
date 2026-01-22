<template>
  <div class="the-page">
    <div class="search-area">
      <!-- Header -->
      <div class="header-container1">
        <h2>Activated Schools</h2>
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
    </div>
    </div>

    <!-- Students Table (Desktop) -->
    <div class="table-container">
      <div class="students-controls">
        <label for="schoolsPerPage">Schools per page:</label>
        <select class="form-control" v-model="schoolsPerPage" @change="updateschoolsPerPage">
          <option v-for="option in schoolsPerPageOptions" :key="option" :value="option">{{ option }}</option>
        </select>
      </div>

      <!-- Desktop Table View -->
      <table class="students-table desktop-table">
        <thead>
          <tr>
            <th>#</th>
            <th>School Name</th>
            <th>School Code</th>
            <th>Module Name</th>
            <th>Installation Date</th>
            <th>Expiry Date</th>
            <th>Registered By</th>
            <th>Handled By</th>
            <th>Selling Price</th>
            <th>Maintenance Fee</th>
            <th class="actions-header">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="filteredSchools.length === 0">
            <td colspan="11">No schools found</td>
          </tr>
          <tr v-for="(school, index) in paginatedSchools" 
              :key="`${school.schoolCode}-${school.moduleName}-${school.activationID}-${index}`" 
              :class="{ 'even-row': index % 2 !== 0 }">
            <td>{{ (currentPage - 1) * schoolsPerPage + index + 1 }}</td>
            <td>{{ school.schoolName }}</td>
            <td>{{ school.schoolCode }}</td>
            <td>{{ school.moduleName }}</td>
            <td>{{ school.installationDate }}</td>
            <td>{{ school.expiryDate }}</td>
            <td>{{ school.registeredByName }}</td>
            <td>{{ school.handledByName || 'N/A' }}</td>
            <td>{{ school.sellingPrice }}</td>
            <td>{{ school.maintenanceFee }}</td>
            <td class="actions">
              <button @click="viewSchool(school)" class="manage-btn" aria-label="View Profile">
                <span class="material-symbols-outlined">person</span> Details
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Mobile Card View -->
      <div class="mobile-cards" v-if="paginatedSchools.length > 0">
        <div v-for="(school, index) in paginatedSchools" :key="school.activationID" class="school-card">
          <div class="card-header">
            <div class="card-number">{{ (currentPage - 1) * schoolsPerPage + index + 1 }}</div>
            <h3 class="card-title">{{ school.schoolName }}</h3>
          </div>
          
          <div class="card-body">
            <div class="card-row">
              <span class="card-label">School Code:</span>
              <span class="card-value">{{ school.schoolCode }}</span>
            </div>
            
            <div class="card-row">
              <span class="card-label">Module Name:</span>
              <span class="card-value">{{ school.moduleName }}</span>
            </div>
            
            <div class="card-row">
              <span class="card-label">Installation Date:</span>
              <span class="card-value">{{ school.installationDate }}</span>
            </div>
            
            <div class="card-row">
              <span class="card-label">Expiry Date:</span>
              <span class="card-value">{{ school.expiryDate }}</span>
            </div>
            
            <div class="card-row">
              <span class="card-label">Registered By:</span>
              <span class="card-value">{{ school.registeredByName }}</span>
            </div>
            
            <div class="card-row">
              <span class="card-label">Handled By:</span>
              <span class="card-value">{{ school.handledByName || 'N/A' }}</span>
            </div>
            
            <div class="card-row">
              <span class="card-label">Selling Price:</span>
              <span class="card-value">{{ school.sellingPrice }}</span>
            </div>
            
            <div class="card-row">
              <span class="card-label">Maintenance Fee:</span>
              <span class="card-value">{{ school.maintenanceFee }}</span>
            </div>
          </div>
          
          <div class="card-footer">
            <button @click="viewSchool(school)" class="card-action-btn" aria-label="View Profile">
              <span class="material-symbols-outlined">person</span> View Details
            </button>
          </div>
        </div>
      </div>

      <div v-if="filteredSchools.length === 0" class="no-data-message">
        No schools found
      </div>

      <div class="pagination">
        <button @click="prevPage" :disabled="currentPage === 1">Previous</button>
        <span>{{ currentPage }} / {{ totalPages }}</span>
        <button @click="nextPage" :disabled="currentPage === totalPages">Next</button>
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
        <form @submit.prevent="submitActivation">
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
              />
              <label for="activationMaintenanceFee" :class="{ filled: activationData.maintenanceFee !== '' && activationData.maintenanceFee !== null }">Maintenance Fee</label>
            </div>

            <div class="activation-form-group">
              <input 
                v-model="activationData.sellingPrice" 
                type="number" 
                id="activationSellingPrice" 
                class="activation-form-control"
                placeholder="Selling Price"
              />
              <label for="activationSellingPrice" :class="{ filled: activationData.sellingPrice !== '' && activationData.sellingPrice !== null }">Selling Price</label>
            </div>

            <div class="activation-form-group">
              <select 
                id="activationMarketerSelect"
                v-model="activationData.marketerID"
                class="activation-form-control"
                required
              >
                <option value="" disabled>Select Marketer*</option>
                <option 
                  v-for="user in users" 
                  :key="user.id" 
                  :value="user.id"
                >
                  {{ user.fullname || user.username }}
                </option>
              </select>
              <label for="activationMarketerSelect" :class="{ filled: activationData.marketerID !== '' && activationData.marketerID !== null }">Select Marketer*</label>
            </div>

            <div class="activation-form-group">
              <select 
                id="activationHandledBySelect"
                v-model="activationData.handledByID"
                class="activation-form-control"
                required
              >
                <option value="" disabled>Select Handled By*</option>
                <option 
                  v-for="user in users" 
                  :key="user.id" 
                  :value="user.id"
                >
                  {{ user.fullname || user.username }}
                </option>
              </select>
              <label for="activationHandledBySelect" :class="{ filled: activationData.handledByID !== '' && activationData.handledByID !== null }">Select Handled By*</label>
            </div>
          </div>
          <hr />
          <div class="activation-form-actions">
            <button type="button" @click="closeActivationModal">Close</button>
            <button type="submit">Activate</button>
          </div>
        </form>
      </div>
    </div>

    <NewSchool 
      :school="selectedSchool"
      @closeForm="closeForm" 
      @fetchSchools="fetchSchools" 
      v-if="show" 
    />

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
      Loading: false,

      currentPage: 1,
      schoolsPerPage: 15,
      schoolsPerPageOptions: [5, 15, 30, 50, 75, 100],

      showActivationModal: false,
      modules: [], // Store modules list
      users: [], // Store users list for marketer and handledBy
      activationData: {
        schoolCode: "",
        moduleName: "",
        expiryDate: "",
        maintenanceFee: "",
        sellingPrice: "",
        marketerID: "",
        handledByID: "",
      },
    };
  },
  watch: {
    // Reset pagination when the search changes so results start from page 1
    searchQuery() {
      this.currentPage = 1;
    },
  },
  computed: {
    // Calculate the total number of pages
    totalPages() {
      return Math.ceil(this.filteredSchools.length / this.schoolsPerPage);
    },

    // Filter individual activations - each module activation is a separate row
    filteredSchools() {
      const query = this.searchQuery.trim().toLowerCase();
      // Filter schools array directly - no grouping, each activation is a separate row
      const filtered = this.schools.filter(school => {
        // Skip invalid entries
        const code = (school.schoolCode || '').toString().trim();
        if (!code || code === 'N/A') {
          console.log('Skipping invalid school:', school);
          return false;
        }
        
        // If no search query, return all valid entries
        if (!query) return true;
        
        const nameMatch = (school.schoolName || '').toString().toLowerCase().includes(query);
        const moduleMatch = (school.moduleName || '').toString().toLowerCase().includes(query);

        // For school codes, prefer exact match when the query is numeric to avoid partial matches (e.g., 1234 matching 123456)
        const normalizedCode = (school.schoolCode || '').toString().replace(/\s+/g, '').toLowerCase();
        const normalizedQuery = query.replace(/\s+/g, '');
        const queryIsNumeric = /^\d+$/.test(normalizedQuery);

        const codeMatch = queryIsNumeric
          ? normalizedCode === normalizedQuery
          : normalizedCode.includes(normalizedQuery);

        return nameMatch || codeMatch || moduleMatch;
      });
      
      // Debug logging
      if (this.schools.length > 0) {
        console.log('Total schools fetched:', this.schools.length);
        console.log('Filtered schools count:', filtered.length);
        const financeModules = this.schools.filter(s => 
          (s.moduleName || '').toString().toLowerCase().includes('finance')
        );
        console.log('Finance modules found:', financeModules.length, financeModules);
        const academicModules = this.schools.filter(s => 
          (s.moduleName || '').toString().toLowerCase().includes('academic')
        );
        console.log('Academic modules found:', academicModules.length, academicModules);
      }
      
      return filtered;
    },

    // Paginate the filtered schools list
    paginatedSchools() {
      const start = (this.currentPage - 1) * this.schoolsPerPage;
      const end = start + this.schoolsPerPage;
      return this.filteredSchools.slice(start, end);
    }
  },

  
  methods: {
    async viewSchool(school) {
      this.Loading = true;
      const toast = useToast();
      try {
        // Fetch full school details using schoolCode
        const response = await axios.post('/schools/list', {});
        
        console.log('Full schools list response:', response.data);
        
        if (response.data && Array.isArray(response.data)) {
          // Find the school with matching schoolCode
          const schoolCodeToFind = (school.schoolCode || '').toString().trim();
          console.log('Looking for school code:', schoolCodeToFind);
          
          const fullSchoolData = response.data.find(s => {
            const code1 = (s.schoolCode || s.school_code || '').toString().trim();
            const code2 = schoolCodeToFind;
            console.log('Comparing:', code1, '===', code2, 'Match:', code1 === code2);
            return code1 === code2;
          });
          
          console.log('Found school data:', fullSchoolData);
          
          if (fullSchoolData) {
            // Create a properly mapped school object with all fields explicitly set
            // Log all available fields to see what's in the response
            console.log('All fields in fullSchoolData:', Object.keys(fullSchoolData));
            console.log('Principal name fields:', {
              principalName: fullSchoolData.principalName,
              principal_name: fullSchoolData.principal_name,
              principalName1: fullSchoolData.principalName1,
              principal: fullSchoolData.principal,
            });
            console.log('Principal phone fields:', {
              principalPhoneNo: fullSchoolData.principalPhoneNo,
              principal_phone_no: fullSchoolData.principal_phone_no,
              principalPhone: fullSchoolData.principalPhone,
              principalPhoneNumber: fullSchoolData.principalPhoneNumber,
              principal_phone: fullSchoolData.principal_phone,
            });
            
            this.selectedSchool = {
              schoolName: fullSchoolData.schoolName || fullSchoolData.school_name || school.schoolName || '',
              schoolCode: (fullSchoolData.schoolCode || fullSchoolData.school_code || school.schoolCode || '').toString().trim(),
              email: fullSchoolData.email || '',
              phoneNo: fullSchoolData.phoneNo || fullSchoolData.phone_no || fullSchoolData.phone || '',
              principalName: fullSchoolData.principalName || fullSchoolData.principal_name || fullSchoolData.principalName1 || fullSchoolData.principal || '',
              principalPhoneNo: fullSchoolData.principalPhoneNo || fullSchoolData.principal_phone_no || fullSchoolData.principalPhone || fullSchoolData.principalPhoneNumber || fullSchoolData.principal_phone || '',
              address: fullSchoolData.address || '',
              county: fullSchoolData.county || '',
              subcounty: fullSchoolData.subcounty || fullSchoolData.sub_county || '',
              schoolLevel: fullSchoolData.schoolLevel || fullSchoolData.school_level || '',
              // Preserve activation-specific data
              moduleName: school.moduleName || '',
              installationDate: school.installationDate || '',
              expiryDate: school.expiryDate || '',
              registeredByName: school.registeredByName || fullSchoolData.registeredByName || '',
              marketerName: school.marketerName || '',
              sellingPrice: school.sellingPrice || 0,
              maintenanceFee: school.maintenanceFee || 0,
            };
            
            console.log('Mapped selected school:', this.selectedSchool);
            this.show = true;
          } else {
            toast.warning('School details not found. Showing available data only.');
            this.selectedSchool = {
              schoolName: school.schoolName || '',
              schoolCode: (school.schoolCode || '').toString().trim(),
              email: '',
              phoneNo: '',
              principalName: '',
              principalPhoneNo: '',
              address: '',
              county: '',
              subcounty: '',
              schoolLevel: '',
            };
            this.show = true;
          }
        } else {
          toast.warning('Unable to fetch school details. Showing available data only.');
          this.selectedSchool = {
            schoolName: school.schoolName || '',
            schoolCode: (school.schoolCode || '').toString().trim(),
            email: '',
            phoneNo: '',
            principalName: '',
            principalPhoneNo: '',
            address: '',
            county: '',
            subcounty: '',
            schoolLevel: '',
          };
          this.show = true;
        }
      } catch (error) {
        console.error('Error fetching school details:', error);
        toast.warning('Failed to fetch full school details. Showing available data only.');
        this.selectedSchool = {
          schoolName: school.schoolName || '',
          schoolCode: (school.schoolCode || '').toString().trim(),
          email: '',
          phoneNo: '',
          principalName: '',
          principalPhoneNo: '',
          address: '',
          county: '',
          subcounty: '',
          schoolLevel: '',
        };
        this.show = true;
      } finally {
        this.Loading = false;
      }
    },
    exportToExcel() {
      // Export currently filtered rows (ignores pagination) as CSV
      const headers = [
        'Activation ID',
        'School Name',
        'School Code',
        'Module Name',
        'Installation Date',
        'Expiry Date',
        'Registered By',
        'Handled By',
        'Marketer Name',
        'Selling Price',
        'Maintenance Fee',
        'Last Login',
        'Students',
        'Receipts',
        'Vouchers',
      ];
      const rows = this.filteredSchools.map(school => ([
        school.activationID || 'N/A',
        school.schoolName || 'N/A',
        school.schoolCode || 'N/A',
        school.moduleName || 'N/A',
        school.installationDate || 'N/A',
        school.expiryDate || 'N/A',
        school.registeredByName || 'N/A',
        school.handledByName || 'N/A',
        school.marketerName || 'N/A',
        school.sellingPrice || 0,
        school.maintenanceFee || 0,
        school.lastLogin || 'N/A',
        school.students || 'N/A',
        school.receipts || 'N/A',
        school.vouchers || 'N/A',
      ]));

      const csvContent = [headers, ...rows]
        .map(row => row.map(item => {
          const value = item ?? '';
          const str = value.toString().replace(/"/g, '""');
          return `"${str}"`;
        }).join(','))
        .join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
      link.download = `activated-schools-${timestamp}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    },
    openForm() {
      this.show = true;
    },
    closeForm() {
      this.show = false;
      this.selectedSchool = null;
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
    updateschoolsPerPage() {
      this.currentPage = 1;
    },
    
    async fetchSchools() {
  this.Loading = true;
  const toast = useToast();
  try {
    const response = await axios.post('/activations/list', {});
    console.log("API Response:", response.data); // Log the response

    const payload = Array.isArray(response.data) ? response.data : [response.data];

    this.schools = payload.map(school => {
      const mapped = {
        activationID: school.activationID || 'N/A',
        schoolName: school.schoolName || 'N/A',
        schoolCode: (school.schoolCode || 'N/A').toString().trim(),
        moduleName: (school.moduleName || 'N/A').toString().trim(), // Ensure module name is trimmed
        installationDate: school.installationDate || 'N/A',
        expiryDate: school.expiryDate || 'N/A',
        registeredByName: school.registeredByName || 'N/A',
        handledByName: school.handledByName || 'N/A',
        marketerName: school.marketerName || 'N/A',
        sellingPrice: school.sellingPrice || 0,
        maintenanceFee: school.maintenanceFee || 0,
        lastLogin: school.lastLogin || 'N/A',
        students: school.students || 'N/A',
        receipts: school.receipts || 'N/A',
        vouchers: school.vouchers || 'N/A',
      };
      
      // Log each school being mapped
      if (mapped.schoolName.toLowerCase().includes('christ') || mapped.schoolName.toLowerCase().includes('king')) {
        console.log('Christ the King activation found:', mapped);
      }
      
      return mapped;
    });

    console.log("Schools Data (all activations):", this.schools);
    console.log("Total activations fetched:", this.schools.length);
    
    // Debug: Check for schools with same code but different modules
    const schoolCodes = {};
    this.schools.forEach(s => {
      const code = s.schoolCode;
      if (!schoolCodes[code]) {
        schoolCodes[code] = [];
      }
      schoolCodes[code].push({
        moduleName: s.moduleName,
        activationID: s.activationID,
        schoolName: s.schoolName
      });
    });
    console.log("Schools grouped by code (for debugging):", schoolCodes);
    
    // Specifically check for Christ the King
    const christTheKing = this.schools.filter(s => 
      s.schoolName.toLowerCase().includes('christ') && s.schoolName.toLowerCase().includes('king')
    );
    console.log("Christ the King activations:", christTheKing);
    
  } catch (error) {
    console.error("Error fetching schools:", error);
    toast.error("Failed to fetch schools.");
  } finally {
    this.Loading = false;
  }
},

    async fetchModules() {
      try {
        const response = await axios.post('/modules/list');
        console.log("Fetched Modules:", response.data);

        // Map over the response to get the module names
        this.modules = response.data.map(module => ({
          id: module.moduleID,
          name: module.moduleName
        }));
      } catch (error) {
        console.error('Error fetching modules:', error);
        this.toast.error('Failed to fetch modules.');
      }
    },

    async fetchUsers() {
      try {
        const response = await axios.post('/auth/list_users', {});
        console.log('Users API Response:', response.data);
        
        // Map users for dropdown
        this.users = response.data.map(user => ({
          id: user.userID,
          fullname: user.fullname || '',
          username: user.username || '',
        }));
        
        console.log('Mapped users:', this.users);
      } catch (error) {
        console.error('Error fetching users:', error);
        this.toast.error('Failed to fetch users.');
      }
    },

    async openActivationModal(school) {
      this.activationData.schoolCode = school.schoolCode; // Set the school code
      this.showActivationModal = true;
      // Fetch modules and users when modal opens
      await this.fetchModules();
      await this.fetchUsers();
      console.log("Modal opened for school:", school.schoolCode);
    },

    closeActivationModal() {
      this.showActivationModal = false;
      this.activationData = {
        schoolCode: "",
        moduleName: "",
        expiryDate: "",
        maintenanceFee: "",
        sellingPrice: "",
        marketerID: "",
        handledByID: "",
      }; // Reset form
    },
    async submitActivation() {
      const toast = useToast();
      this.Loading = true;

      // Validate required fields
      if (!this.activationData.moduleName || !this.activationData.expiryDate) {
        toast.error("Please select a module and expiry date.");
        this.Loading = false;
        return;
      }

      // Validate mandatory fields: marketerID and handledByID
      if (!this.activationData.marketerID || !this.activationData.handledByID) {
        toast.error("Marketer and Handled By are required fields.");
        this.Loading = false;
        return;
      }

      try {
        console.log('Submitting activation data:', this.activationData);

        const config = {
          headers: {
            'Content-Type': 'application/json',
          },
        };

        // Prepare payload with proper field names
        const payload = {
          schoolCode: this.activationData.schoolCode,
          moduleName: this.activationData.moduleName,
          expiryDate: this.activationData.expiryDate,
          maintenanceFee: this.activationData.maintenanceFee || null,
          sellingPrice: this.activationData.sellingPrice || null,
          marketerID: this.activationData.marketerID,
          handledByID: this.activationData.handledByID,
        };

        const response = await axios.post('/activations/activate', payload, config);

        if (response.data) {
          toast.success("Module activated successfully!");
          this.fetchSchools(); // Refresh the list of schools
          this.closeActivationModal(); // Close the modal
        } else {
          toast.error("Failed to activate module.");
        }
      } catch (error) {
        console.error("Activation error:", error);

        if (error.response) {
          console.error("Backend error:", error.response.data);
          toast.error(`Error: ${error.response.data.message || 'An error occurred'}`);
        } else {
          console.error("Network error:", error.message);
          toast.error("Network error: Unable to reach the backend.");
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
    padding: clamp(0.5rem, 1.5vw, 1rem);
    text-align: left;
    border: 1px solid #ddd;
    vertical-align: middle;
    word-break: break-word;
    line-height: 1.4;
    height: auto;
    min-height: 50px;
  }
  
  /* Prevent row numbers from wrapping vertically */
  .students-table tbody td:first-child,
  .students-table thead th:first-child {
    white-space: nowrap;
    text-align: center;
    min-width: 50px;
    width: 50px;
  }
  
  .students-table tbody tr {
    height: auto;
    min-height: 50px;
  }
  
  .students-table thead th {
    background-color: #f1f1f1;
    font-weight: 600;
    border: 1px solid #ddd;
    border-bottom: 2px solid #ddd;
    position: sticky;
    top: 0;
    z-index: 10;
    height: auto;
    min-height: 50px;
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


  /* Responsive Breakpoints */
  @media only screen and (max-width: 1400px) {
    .students-table th,
    .students-table td {
      padding: clamp(0.6rem, 1vw, 0.9rem);
      min-height: 50px;
    }
    
    .students-table tbody tr {
      min-height: 50px;
    }
    
    /* Keep row numbers horizontal */
    .students-table tbody td:first-child,
    .students-table thead th:first-child {
      white-space: nowrap;
      min-width: 50px;
      width: 50px;
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
      min-height: 50px;
    }
    
    .students-table tbody tr {
      min-height: 50px;
    }
    
    /* Keep row numbers horizontal */
    .students-table tbody td:first-child,
    .students-table thead th:first-child {
      white-space: nowrap;
      min-width: 50px;
      width: 50px;
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
  </style>
  