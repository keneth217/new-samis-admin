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
            <th>Selling Price</th>
            <th>Maintenance Fee</th>
            <th class="actions-header">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="filteredSchools.length === 0">
            <td colspan="10">No schools found</td>
          </tr>
          <tr v-for="(school, index) in paginatedSchools" :key="school.activationID" 
              :class="{ 'even-row': index % 2 !== 0 }">
            <td>{{ (currentPage - 1) * schoolsPerPage + index + 1 }}</td>
            <td>{{ school.schoolName }}</td>
            <td>{{ school.schoolCode }}</td>
            <td>{{ school.moduleNameJoined || school.moduleName }}</td>
            <td>{{ school.installationDate }}</td>
            <td>{{ school.expiryDate }}</td>
            <td>{{ school.registeredByName }}</td>
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
              <span class="card-value">{{ school.moduleNameJoined || school.moduleName }}</span>
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
    <div v-if="showActivationModal" class="modal-overlay">
      <div class="modal-content">
        <h3>Activate New Module</h3>
        <form @submit.prevent="submitActivation">
          <label for="schoolCode">School Code:</label>
          <input v-model="activationData.schoolCode" id="schoolCode" disabled />

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
      activationData: {
        schoolCode: "",
        moduleName: "",
        expiryDate: "",
        maintenanceFee: "",
        sellingPrice: "",
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
    // Group activations by school so multiple modules share one row
    groupedSchools() {
      const map = new Map();
      this.schools.forEach(s => {
        const code = (s.schoolCode || '').toString().trim();
        if (!map.has(code)) {
          map.set(code, {
            ...s,
            modules: [],
          });
        }
        const entry = map.get(code);
        if (s.moduleName && !entry.modules.includes(s.moduleName)) {
          entry.modules.push(s.moduleName);
        }
      });
      return Array.from(map.values()).map(s => ({
        ...s,
        moduleNameJoined: s.modules.join(', '),
      }));
    },

    // Calculate the total number of pages
    totalPages() {
      return Math.ceil(this.filteredSchools.length / this.schoolsPerPage);
    },

    // Filter individual activations (no grouping so each module stays separate)
    filteredSchools() {
      const query = this.searchQuery.trim().toLowerCase();
      return this.groupedSchools.filter(school => {
        if (!query) return true;
        const nameMatch = (school.schoolName || '').toString().toLowerCase().includes(query);

        // For school codes, prefer exact match when the query is numeric to avoid partial matches (e.g., 1234 matching 123456)
        const normalizedCode = (school.schoolCode || '').toString().replace(/\s+/g, '').toLowerCase();
        const normalizedQuery = query.replace(/\s+/g, '');
        const queryIsNumeric = /^\d+$/.test(normalizedQuery);

        const codeMatch = queryIsNumeric
          ? normalizedCode === normalizedQuery
          : normalizedCode.includes(normalizedQuery);

        return nameMatch || codeMatch;
      });
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
              moduleName: school.moduleName || school.moduleNameJoined || '',
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
        'School Name',
        'School Code',
        'Module Name',
        'Installation Date',
        'Expiry Date',
        'Registered By',
        'Selling Price',
        'Maintenance Fee',
      ];
      const rows = this.filteredSchools.map(school => ([
        school.schoolName,
        school.schoolCode,
        school.moduleName,
        school.installationDate,
        school.expiryDate,
        school.registeredByName,
        school.sellingPrice,
        school.maintenanceFee,
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

    this.schools = payload.map(school => ({
      activationID: school.activationID || 'N/A',
      schoolName: school.schoolName || 'N/A',
      schoolCode: (school.schoolCode || 'N/A').toString().trim(),
      moduleName: school.moduleName || 'N/A',
      installationDate: school.installationDate || 'N/A',
      expiryDate: school.expiryDate || 'N/A',
      registeredByName: school.registeredByName || 'N/A',
      marketerName: school.marketerName || 'N/A',
      sellingPrice: school.sellingPrice || 0,
      maintenanceFee: school.maintenanceFee || 0,
      lastLogin: school.lastLogin || 'N/A',
      students: school.students || 'N/A',
      receipts: school.receipts || 'N/A',
      vouchers: school.vouchers || 'N/A',
    }));

    console.log("Schools Data:", this.schools);  // Log to check if data is populated
  } catch (error) {
    console.error("Error fetching schools:", error);
    toast.error("Failed to fetch schools.");
  } finally {
    this.Loading = false;
  }
},

    openActivationModal(school) {
      this.activationData.schoolCode = school.schoolCode; // Set the school code
      this.showActivationModal = true;
      console.log("Modal opened for school:", school.schoolCode); // Debugging
    },

    closeActivationModal() {
      this.showActivationModal = false;
      this.activationData = {
        schoolCode: "",
        moduleName: "",
        expiryDate: "",
        maintenanceFee: "",
        sellingPrice: "",
      }; // Reset form
    },
    async submitActivation() {
  const toast = useToast();
  this.Loading = true;

  // Ensure all fields are filled before proceeding
  if (!this.activationData.moduleName || !this.activationData.expiryDate || !this.activationData.maintenanceFee || !this.activationData.sellingPrice) {
    toast.error("All fields are required.");
    this.Loading = false;
    return;
  }

  try {
    console.log('Submitting activation data:', this.activationData); // Log the data for debuggingI WNAT THE MODULES OF ACTIVATED UNDER THE SAME SCHOOL CODE TO BE ONTHE SAME COLOMNAND ALSO WANT THE BORADERS ONTHE TABLE TO HAVETHE RAWS

    const config = {
      headers: {
        'Content-Type': 'application/json', // Ensure the content type is set correctly
      },
    };

    // Instead of 'payload', use 'this.activationData'
    const response = await axios.post('/activations/activate', this.activationData, config);

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
      console.error("Backend error:", error.response.data);  // Log backend error details
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

  .modal-content h3 {
    font-size: clamp(1.1rem, 2vw, 1.5rem);
    margin-bottom: clamp(0.75rem, 2vw, 1rem);
  }

  .modal-content label {
    font-size: clamp(0.9rem, 1.3vw, 1rem);
    margin-bottom: clamp(0.3rem, 1vw, 0.5rem);
  }

  .modal-content input {
    font-size: clamp(0.9rem, 1.3vw, 1rem);
    padding: clamp(0.4rem, 1vw, 0.6rem);
    margin-bottom: clamp(0.75rem, 1.5vw, 1rem);
  }

  .submit-btn, .cancel-btn {
    padding: clamp(0.4rem, 1vw, 0.6rem) clamp(0.8rem, 2vw, 1.2rem);
    font-size: clamp(0.85rem, 1.3vw, 1rem);
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

    .modal-content {
      width: 95vw;
      padding: clamp(0.75rem, 3vw, 1.25rem);
      border-radius: 6px;
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
  