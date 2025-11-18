<template>
  <div class="the-page">
    <!-- Search Area -->
    <div class="search-area">
      <div class="header-container1">
        <h2>Expired Schools</h2>
      </div>
      <input v-model="searchQuery" placeholder="Search by name or code" class="search-input" @input="fetchSchools" />
    </div>

    <!-- Schools Table -->
    <div class="table-container">
      <!-- Activation Form Overlay -->
      <div v-if="showActivationForm" class="activation-form-overlay">
        <div class="activation-form">
          <h3>Activate School: {{ selectedSchool.schoolCode }}</h3>
          <form @submit.prevent="submitActivationForm">
            <div class="form-group">
              <label>School Code</label>
              <input  class="form-control" v-model="activationForm.schoolCode" type="text" required />
            </div>
            <div class="form-group">
              <label>Module Name</label>
              <input class="form-control" v-model="activationForm.moduleName" type="text" required />
            </div>
            <div class="form-group">
              <label>Expiry Date</label>
              <input class="form-control" v-model="activationForm.expiryDate" type="date" required />
            </div>
            <div class="form-group">
              <label>Maintenance Fee</label>
              <input class="form-control" v-model="activationForm.maintenanceFee" type="number" required />
            </div>
            <div class="form-group">
              <label>Selling Price</label>
              <input class="form-control" v-model="activationForm.sellingPrice" type="number" required />
            </div>
            <div class="form-actions">
              <button type="button" @click="closeActivationForm" class="cancel-btn">Cancel</button>
              <button type="submit" class="submit-btn">Activate</button>
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

      <!-- Schools List Table -->
      <table class="students-table">
        <thead>
          <tr>
            <th>#</th>
            <th>School Code</th>
            <th>School Name</th>
            <th>moduleName</th>
            <th>sellingPrice</th>
            <th>maintenanceFee</th>
            <th>expiryDate</th>
            <th>installationDate</th>

            <th>Actions</th>
           
          </tr>
        </thead>
        <tbody>
          <tr v-if="displayedSchools.length === 0">
            <td colspan="6">No schools found</td>
          </tr>
          <tr v-for="(school, index) in displayedSchools" :key="school.schoolID">
            <td>{{ (currentPage - 1) * schoolsPerPage + index + 1 }}</td>
            <td>{{ school.schoolCode }}</td>
            <td>{{ school.schoolName }}</td>
            <td>{{ school.moduleName}}</td>
            <td>{{ school.sellingPrice }}</td>
            <td>{{ school.maintenanceFee }}</td>
            <td>{{ school.expiryDate }}</td>
            <td>{{ school.installationDate }}</td>

            <td>
              <button @click="fetchActivationStatus(school)" class="manage-btn">ACTIVATE</button>
            </td>
            <!-- <td :class="{ 'text-success': school.activated, 'text-danger': !school.activated }">
              {{ school.activated ? 'ACTIVE' : '' }}
            </td> -->
           
          </tr>
        </tbody>
      </table>
    </div>

    <LoadingSpinner :isLoading="Loading" />
    <footerCast />
  </div>
</template>


<script>
import footerCast from '../../components/footer.vue';
import axios from 'axios';
import { useToast } from 'vue-toastification';
import LoadingSpinner from '../../components/LoadingSpinner.vue';

export default {
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
      searchQuery: '',
      schools: [],
      Loading: false,
      currentPage: 1,
      schoolsPerPage: 15,
      showActivationForm: false,
      activationForm: {
        schoolCode: '',
        moduleName: '',
        expiryDate: '',
        maintenanceFee: '',
        sellingPrice: '',
      },
      selectedSchool: null,
    };
  },
  computed: {
    displayedSchools() {
      if (!this.searchQuery.trim()) {
        return this.schools;
      }
      return this.schools.filter(
        school =>
          school.schoolName.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
          school.schoolCode.toLowerCase().includes(this.searchQuery.toLowerCase())
      );
    },
  },
  methods: {
// Fetch the activation status of the school
async fetchActivationStatus(school) {
  try {
    this.Loading = true;
    const response = await axios.post('/api/activations/status', {
      schoolCode: school.schoolCode,
      // Pass the actual module associated with the school
      moduleName: school.moduleName || '', // Use the school’s module name or empty string if not available
    });

    const activationData = response.data;

    // Populate the activation form with the correct data, including the correct module name
    this.activationForm = {
      schoolCode: activationData.schoolCode || '',
      moduleName: activationData.moduleName || '', // Make sure the module name is set correctly
      expiryDate: activationData.expiryDate || '',
      maintenanceFee: activationData.maintenanceFee || '',
      sellingPrice: activationData.sellingPrice || '',
    };

    // Assign the selected school and show the activation form
    this.selectedSchool = school;
    this.showActivationForm = true;
  } catch (error) {
    console.error('Error fetching activation status:', error);
    this.toast.error('Failed to retrieve activation status');
  } finally {
    this.Loading = false;
  }
},


    // Submit the activation form
    async submitActivationForm() {
      try {
        const payload = { ...this.activationForm };

        const response = await axios.post('/api/activations/activate', payload);
        if (response.data && response.data.activationID) {
          this.toast.success('School activated successfully!');
          this.fetchSchools(); // Refresh the expired schools list
          this.closeActivationForm();
        } else {
          this.toast.error('Failed to activate school.');
        }
      } catch (error) {
        console.error('Error activating school:', error);
        this.toast.error('An error occurred while activating the school.');
      }
    },

    // Close the activation form
    closeActivationForm() {
      this.showActivationForm = false;
      this.selectedSchool = null;
      this.activationForm = {
        schoolCode: '',
        moduleName: '',
        expiryDate: '',
        maintenanceFee: '',
        sellingPrice: '',
      };
    },

   // Fetch expired schools by checking their expiryDate
   async fetchSchools() {
      this.Loading = true;
      try {
        const response = await axios.post('/api/activations/expired');
        this.schools = response.data.filter(school => {
          const expiryDate = new Date(school.expiryDate);
          return expiryDate < new Date(); // Only expired schools
        });
      } catch (error) {
        console.error('Error fetching expired schools:', error);
        this.toast.error('Failed to load expired schools.');
      } finally {
        this.Loading = false;
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
    color: gold;
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
  
  .table-container {
    background-color: white;
    padding: 1rem;
    border-radius: 8px;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
    position: relative; /* Add this line */
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

  
  .activation-form-overlay {
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

.activation-form {
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

.activation-form h3 {
  margin-bottom: 15px;
  text-align: center;
}

.form-group {
  position: relative;
}

.form-group label {
 color: gold;
  outline: none;
  padding: 4px;
margin-bottom: 4px;
  width: 100%;
  box-sizing: border-box;
  background-color: #4368b9;

}

.form-group input {
  width: 100%;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.form-actions {
  display: flex;
  justify-content: space-between;
  margin-top: 10px;
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

.cancel-btn {
  background: #ccc;
  color: black;
  border: none;
  padding: 10px 15px;
  border-radius: 4px;
  cursor: pointer;
}

.submit-btn {
  background: #007bff;
  color: white;
  border: none;
  padding: 10px 15px;
  border-radius: 4px;
  cursor: pointer;
}

.cancel-btn:hover {
  background: #b3b3b3;
}

.submit-btn:hover {
  background: #0056b3;
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

    .activation-form-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
}

.activation-form {
  background: rgb(77, 64, 189);
  padding: 20px;
  border-radius: 8px;
  width: 400px;
  box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.2);
}

.activation-form h3 {
  margin-bottom: 15px;
  text-align: center;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  font-weight: bold;
  margin-bottom: 5px;
}

.form-group input {
  width: 100%;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.form-actions {
  display: flex;
  justify-content: space-between;
  margin-top: 20px;
}

.cancel-btn {
  background: #ccc;
  color: black;
  border: none;
  padding: 10px 15px;
  border-radius: 4px;
  cursor: pointer;
}

.submit-btn {
  background: #007bff;
  color: white;
  border: none;
  padding: 10px 15px;
  border-radius: 4px;
  cursor: pointer;
}

.cancel-btn:hover {
  background: #b3b3b3;
}

.submit-btn:hover {
  background: #0056b3;
}
    .pagination button {
      padding: 2.5px 10px;
    }
  }
  </style>
  