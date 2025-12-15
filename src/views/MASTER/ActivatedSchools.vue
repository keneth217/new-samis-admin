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

    <!-- Students Table -->
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
    viewSchool(school) {
      this.selectedSchool = school;
      this.show = true;
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
    /* flex-grow: 1; */
    margin-left: 1rem;
  }
  
  .table-container {
    background-color: white;
    padding: 1rem;
    border-radius: 8px;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  }
  
  .students-table {
   display: table !important;
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
  text-align: center;  /* Center align the header text */
  padding-left: 1rem;
  display: flex;
  flex-direction: column; /* Stack items vertically */
  align-items: center;
  gap: 0.5rem; /* Add some space between header text and the buttons */
}
  
.actions {
  display: flex;
  justify-content: flex-start; /* Align the buttons horizontally */
  gap: 1rem; /* Add space between buttons */
  padding-left: 1rem;
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
  