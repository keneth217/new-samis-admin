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
      <div class="students-controls">
        <label for="schoolsPerPage">Schools per page:</label>
        <select class="form-control" v-model="schoolsPerPage" @change="updateschoolsPerPage">
          <option v-for="option in schoolsPerPageOptions" :key="option" :value="option">{{ option }}</option>
        </select>
      </div>

      <table class="students-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Sch Name</th>
            <th>Sch Code</th>
            <th>Principal Contact</th>
            <th>County</th>
            <th>Registered by</th>
            <th>Status</th>
            <th class="actions-header">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="displayedSchools.length === 0">
            <td colspan="8">No schools found</td>
          </tr>
          <tr v-for="(school, index) in displayedSchools" :key="school.schoolCode" :class="{ 'even-row': index % 2 !== 0 }">
            <td>{{ (currentPage - 1) * schoolsPerPage + index + 1 }}</td>
            <td>{{ school.schoolName }}</td>
            <td>{{ school.schoolCode }}</td>
            <td>{{ school.principalPhoneNo }}</td>
            <td>{{ school.county }}</td>
            <td>{{ school.registeredByName ?? '' }}</td>
            <td :class="{ 'text-success': !school.deleted, 'text-danger': school.deleted }">
              {{ school.deleted ? 'DELETED' : '' }}
            </td>
            <td class="actions">
              <button @click="viewSchool(school)" class="manage-btn" aria-label="View Profile">
                <span class="material-symbols-outlined">person</span> Details
              </button>
              <button @click="deleteSchool(school)" class="class-list-btn" aria-label="Delete School">
                <span class="material-symbols-outlined">delete</span> Delete
              </button>
              <!-- Add Module Button -->
              <button @click="openActivationModal(school)" class="activate-btn" aria-label="Add Module">
                <span class="material-symbols-outlined">add</span> Add Module
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      <!-- Pagination -->
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
<!-- Module Multi-Select Dropdown -->
<div class="form-group">
  <label   for="moduleSelect">Select Module(s):</label>
  <select 
    id="moduleSelect"
    v-model="activationData.moduleName"
   
    class="form-control"
  >
    <option 
      v-for="module in modules" 
      :key="module.id" 
      :value="module.name"
    >
      {{ module.name }}
    </option>
  </select>
</div>



<div class="form-group">
          <label for="expiryDate" >Expiry Date:</label>
          <input v-model="activationData.expiryDate" type="date" id="expiryDate" required />
        </div>
        <div class="form-group">
          <label for="maintenanceFee">Maintenance Fee:</label>
          <input v-model="activationData.maintenanceFee" type="number" id="maintenanceFee" required />
        </div>
        
<div class="form-group">
          <label for="sellingPrice">Selling Price:</label>
          <input v-model="activationData.sellingPrice" type="number" id="sellingPrice" required />
        </div>
        <div class="form-actions">
          <button type="submit" class="submit-btn">Activate</button>
          <button @click="closeActivationModal" class="cancel-btn">Cancel</button>
        </div>
        </form>
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
      currentPage: 1,
      schoolsPerPage: 15,
      schoolsPerPageOptions: [5, 15, 30, 50, 75, 100],
      showActivationModal: false,
      activationData: {
        schoolCode: "",
        moduleName: [], // This will hold selected module(s)
        expiryDate: "",
        maintenanceFee: "",
        sellingPrice: "",
      },
    };
  },
  computed: {
    totalPages() {
      return Math.ceil(this.filteredSchools.length / this.schoolsPerPage);
    },
    displayedSchools() {
      const startIndex = (this.currentPage - 1) * this.schoolsPerPage;
      const endIndex = Math.min(startIndex + this.schoolsPerPage, this.filteredSchools.length);
      return this.filteredSchools.slice(startIndex, endIndex);
    },
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
    exportToExcel() {
      // Export currently filtered rows (ignores pagination) as CSV
      const headers = [
        'School Name',
        'School Code',
        'Principal Name',
        'Principal Phone',
        'Email',
        'County',
        'Subcounty',
        'Registered By',
        'Registered On',
        'Students',
        'Phone',
        'Address',
        'Status',
      ];
      const rows = this.filteredSchools.map((school) => [
        school.schoolName,
        school.schoolCode,
        school.principalName,
        school.principalPhoneNo,
        school.email,
        school.county,
        school.subcounty,
        school.registeredByName,
        school.registeredOn,
        school.students,
        school.phoneNo,
        school.address,
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
        const response = await axios.post('/schools/list', {});
        this.schools = response.data.map(school => ({
          schoolCode: school.schoolCode,
          schoolName: school.schoolName,
          email:school.email,
          principalPhoneNo: school.principalPhoneNo,
          principalName:school.principalName,
          students:school.students,
          county: school.county,
          subcounty:school.subcounty,
          registeredByName: school.registeredByName,
          registeredOn: school.registeredOn,
          phoneNo:school.phoneNo,
          address:school.address,
          deleted: school.deleted,
        }));
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
    async deleteSchool(schoolCode) {
  if (!confirm(`Are you sure you want to delete school ${schoolCode}?`)) {
    return;
  }
  
  this.Loading = true;
  const toast = useToast();
  
  try {
    const response = await axios.post(
      '/schools/delete',
      { schoolCode },
      {
        headers: {
          'Content-Type': 'application/json',
          // 'Authorization': `Bearer ${yourToken}` // if needed
        },
        // withCredentials: true // if using cookies
      }
    );

    console.log(`School ${schoolCode} deleted successfully`, response.data);
    this.schools = this.schools.filter(school => school.schoolCode !== schoolCode);
    toast.success(`School ${schoolCode} deleted successfully!`);
  } catch (error) {
    console.error('Error deleting school:', error);
    let errorMessage = 'Failed to delete school. Please try again.';
    
    if (error.response) {
      // The request was made and the server responded with a status code
      errorMessage = error.response.data.message || errorMessage;
    } else if (error.request) {
      // The request was made but no response was received
      errorMessage = 'No response from server. Please check your connection.';
    }
    
    toast.error(errorMessage);
  } finally {
    this.Loading = false;
  }
},

    openActivationModal(school) {
  console.log("Modal opened for school:", school.schoolCode); // Check if the modal is opened correctly
  this.activationData.schoolCode = school.schoolCode; // Set the school code
  this.showActivationModal = true;
  this.fetchModules(); // Fetch modules when the modal opens
},

    closeActivationModal() {
      this.showActivationModal = false;
      this.activationData = {
        schoolCode: "",
        moduleName: [], // Reset the module selection array
        expiryDate: "",
        maintenanceFee: "",
        sellingPrice: "",
      };
    },
    async submitActivation() {
  const toast = useToast();
  this.Loading = true;

  // Ensure all fields are filled before proceeding
  if (!this.activationData.moduleName || !this.activationData.expiryDate || 
      !this.activationData.maintenanceFee || !this.activationData.sellingPrice) {
    toast.error("All fields are required.");
    this.Loading = false;
    return;
  }

  try {
    console.log('Submitting activation data:', this.activationData); // Log the data for debugging

    const config = {
      headers: {
        'Content-Type': 'application/json', // Ensure the content type is set correctly
      },
    };

    // Instead of 'payload', use 'this.activationData'
    const response = await axios.post('/activations/activate', this.activationData, config);

    if (response.data) {
      toast.success("Module activated successfully!");

      // Update the existing school entry instead of duplicating it
      const idx = this.schools.findIndex(s => s.schoolCode === response.data.schoolCode);
      if (idx !== -1) {
        this.schools[idx] = {
          ...this.schools[idx],
          activationID: response.data.activationID,
          moduleName: response.data.moduleName,
          installationDate: response.data.installationDate,
          expiryDate: response.data.expiryDate,
          registeredByName: response.data.registeredByName,
          marketerName: response.data.marketerName,
          sellingPrice: response.data.sellingPrice,
          maintenanceFee: response.data.maintenanceFee,
          lastLogin: response.data.lastLogin,
          students: response.data.students,
          receipts: response.data.receipts,
          vouchers: response.data.vouchers,
        };
      } else {
        // Fallback: if not found, append once
        this.schools.push({
          activationID: response.data.activationID,
          schoolName: response.data.schoolName,
          schoolCode: response.data.schoolCode,
          moduleName: response.data.moduleName,
          installationDate: response.data.installationDate,
          expiryDate: response.data.expiryDate,
          registeredByName: response.data.registeredByName,
          marketerName: response.data.marketerName,
          sellingPrice: response.data.sellingPrice,
          maintenanceFee: response.data.maintenanceFee,
          lastLogin: response.data.lastLogin,
          students: response.data.students,
          receipts: response.data.receipts,
          vouchers: response.data.vouchers,
        });
      }

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
}


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
  padding: 0.4rem 0.8rem;
  border-radius: 5px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.9rem;
  transition: background-color 0.3s ease;
}

.activate-btn:hover {
  background-color: #d4d7ff;
}


/* Modal Overlay (Dark background behind modal) */
.modal-overlay {
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

/* Modal Content Styling */
.modal-content {
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

.modal-content h3 {
  color: gold;
  text-align: center;
}

.modal-content label {
  color: gold;
   display: block;
  margin-bottom: 0.5rem; 
  margin-bottom: 4px;

}

/* Styling Inputs Inside Modal */
.modal-content input {

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

/* Buttons Styling */
.submit-btn, .cancel-btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.form-actions {
  margin-top: 8px;
  display: flex;
  justify-content: space-between;
}

.form-actions button {
  padding: 0.3rem 1rem;
  border: none;
  cursor: pointer;
  border-radius: 4px;
}
        
.form-actions button:first-child {
  font-size: medium;
  background: rgba(245, 56, 56, 1);
  border: 1px solid rgba(245, 56, 56, 1);
  color: black;
}

.form-actions button:first-child:hover {
  background-color: #4368b9;
  color: white;
}

.form-actions button:last-child {
  font-size: medium;
  background: gold;
  border: 1px solid gold;
  color: black;
}

.form-actions button:last-child:hover {
  background-color: #4368b9;
  color: white;
}

/* Styling for the Dropdown */
.modal-content select {
  width: 100%;
  padding: 0.5rem;
  margin-bottom: 1rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: white;
  color: #333;
  font-size: 1rem;
  box-sizing: border-box; /* Ensure padding doesn't affect width */
  height: auto;
}

/* Add Styles for the Select Dropdown to Expand */
.modal-content select:focus {
  border-color: #2b7ab7;
  outline: none;
}

.modal-content select option {
  padding: 0.5rem;
  background-color: white;
  color: #333;
}

/* Style for Multiselect Dropdown */
.modal-content select[multiple] {
  height: auto; /* Allow for multi-selection to show multiple options */
  min-height: 100px; /* Ensure the dropdown height is appropriate */
  padding: 0.5rem;
  border-radius: 4px;
}


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
  
    .header-object1{
      display: flex;
      gap: .5rem;
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
    }
  
    .action-btn:hover {
      background-color: #1e6192;
    }
    
    .action-btn .material-symbols-outlined {
      margin-right: 0.3rem;
    }
  
    .search-area{
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
      /* flex-grow: 1; */
      margin-left: 1rem;
    }
  
.search-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}
    
    .table-container {
      background-color: white;
      padding: 1rem;
      border-radius: 8px;
      box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
    }
    
    .students-table {
      width: 100%;
      border-collapse: collapse;
      border-spacing: 0;
      border: 1px solid #ddd; /* Add border around the entire table */

    }
    
    .students-table th,
    .students-table td {
      padding: 1rem;
      text-align: left;
      border-bottom: 1px solid #ddd;
      vertical-align: middle;
      border: 1px solid #ddd; /* Add border for each cell */
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
    
    .actions-header {
      text-align: left;
      padding-left: 1rem;
    }
    
    .actions {
      display: flex;
      justify-content: flex-start;
      gap: 0.5rem;
      padding-left: 1rem;
      margin-left: -0.5rem; /* Moves left */
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
    
    .actions .material-symbols-outlined {
      font-size: 1rem;
      
    }
  
    /* Pagination styles */
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
    }
  
    .pagination button:hover {
      background-color: #2b7ab7;
      color: white;
    }
    
    .pagination span {
      font-weight: bold;
    }
  
    .students-controls{
      margin-bottom: .5rem;
      display: flex;
      gap: .3rem;
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
      
  
    /* Styles for smaller screens */
    @media only screen and (max-width: 767px) {
      .the-page {
        padding: 0.5rem;
        margin-top: 2.5rem; 
        margin-left: 2.1rem;
        width: 93.5%;
      }
  
      .header-container {
        flex-direction: column; /* Stack action buttons vertically */
        gap: 0.4rem; /* Add gap between buttons */
        align-items: flex-start; /* Align buttons to the left */
      }
  
      .header-object1 {
        
        gap: 0.2rem; /* Add gap between buttons */
      }
  
      .action-btn {
        width: 100%; /* Make buttons full width */
        justify-content: center; /* Center button content */
        padding: 0.5rem; /* Adjust padding */
        font-size: 0.9rem; /* Reduce font size */
      }
  
      .header-container1 h2 {
        font-size: 1.2rem; /* Reduce font size for headers */
        text-align: center; /* Center-align header text */
      }
  
      .search-area {
        flex-direction: column; /* Stack search input and header vertically */
        gap: 0.5rem; /* Add gap between elements */
        align-items: flex-start; /* Align elements to the left */
      }
  
      .search-input {
        width: 100%; /* Make search input full width */
        margin-left: 0; /* Remove margin */
      }
  
      .table-container {
        padding: 0.5rem; /* Reduce padding for smaller screens */
        width: 103%;
        margin-left: -.3rem;
        overflow-x: auto; /* Enable horizontal scrolling for tables */
      }
  
      .students-table {
        min-width: 600px; /* Ensure table doesn't collapse */
      }
  
      .students-table th,
      


      .students-table td {
        padding: 0.5rem; /* Reduce padding for table cells */
        font-size: 0.9rem; /* Reduce font size for table content */
        white-space: normal; /* Allow text to wrap */
        word-break: break-word; /* Break long words to fit */
      }
  
      .actions {
        flex-direction: column; /* Stack action buttons vertically */
        gap: 0.25rem; /* Reduce gap between buttons */
        padding-left: 0; /* Remove left padding */
      }
  
      .manage-btn,
      .class-list-btn {
        width: 100%; /* Make buttons full width */
        justify-content: center; /* Center button content */
        padding: 0.3rem 0.5rem; /* Adjust padding */
        font-size: 0.8rem; /* Reduce font size */
      }
  
      .pagination button {
        padding: 2.5px 10px;
      }
    }
    </style>
    