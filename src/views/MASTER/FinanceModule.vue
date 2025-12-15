 
<template>
    <div class="the-page">
      <div class="search-area">
        <!-- Header -->
        <div class="header-container1">
          <h2>MODULE</h2>
        </div>
        <input v-model="searchQuery" placeholder="Search by name or code" class="search-input" />
      </div>
  
      <!-- Action Buttons -->
      <div class="header-container">
        <div class="header-object1">
          <button @click="openForm" class="action-btn" aria-label="Add Finance Module">
            <span class="material-symbols-outlined">add_circle</span> Add Module
          </button>
  
          <!-- <button @click="openImport" class="action-btn" aria-label="Add School">
            <span class="material-symbols-outlined">move_to_inbox</span> Import Students
          </button> -->
        </div>
  
        <!-- <button class="action-btn" @click="viewGraduatedStudents" aria-label="View Graduated Students">
          <span class="material-symbols-outlined">visibility</span> Graduated Students
        </button> -->
      </div>
  
      <!-- Students Table -->
      <div class="table-container">
        <div class="students-controls">
          <label for="financemodulePerPage"> Modules per page:</label>
          <select class="form-control" v-model="modulesPerPage" @change="updatemodulesPerPage">
            <option v-for="option in modulesPerPageOptions" :key="option" :value="option">{{ option }}</option>
          </select>
        </div>
  
        
        <table class="students-table">
          <thead>
            <tr>
                <th>#</th>
            <th>Module Name</th>
            <th>Description</th>
            <th>Status</th>
            <th class="actions-header">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="displayedModules.length === 0">
              <td colspan="5">No module found</td>
            </tr>
            <tr
            v-for="(module, index) in displayedModules"
              :key="module.moduleName"
              :class="{ 'even-row': index % 2 !== 0 }"
            >
            <td>{{ (currentPage - 1) * modulesPerPage + index + 1 }}</td>
            <td>{{ module.moduleName }}</td>
            <td>{{ module.description }}</td>

              <td :class="{ 'text-success': module.activated === true, 'text-danger': module.activated !== true }">
                {{ module.activated === true ? 'ACTIVE' : 'EXPIRED' }}
              </td>
              <td class="actions">
                <button @click="viewModule(module)" class="manage-btn" aria-label="View Profile">
                  <span class="material-symbols-outlined">person</span> Details
                </button>
                <button @click="viewAnalysis(user)" class="class-list-btn" aria-label="View Analysis">
                  <span class="material-symbols-outlined">analytics</span> Edit
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
  
      <NewFinanceModule
        :modules="selectedModule"
        @closeForm="openForm" 
        @fetchModules="fetchModules" 
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
import NewFinanceModule from './NewFinanceModule.vue';
   
 export default {
   name: 'FinanceModule',
   components: {
     footerCast,
     LoadingSpinner,
     NewFinanceModule,
   },
   setup() {
     const toast = useToast();
     return { toast };
   },
   data() {
     return {
       selectedModule: null,
       show: false,
       searchQuery: '',
       modules: [],
       Loading: false,
       currentPage: 1,
       modulesPerPage: 15,
       modulesPerPageOptions: [5, 15, 30, 50, 75, 100],
     };
   },
   computed: {
     totalPages() {
       return Math.ceil(this.filteredModules.length / this.modulesPerPage);
     },
     displayedModules() {
       const startIndex = (this.currentPage - 1) * this.modulesPerPage;
       const endIndex = Math.min(startIndex + this.modulesPerPage, this.filteredModules.length);
       return this.filteredModules.slice(startIndex, endIndex);
     },
     filteredModules() {
       if (!this.searchQuery.trim()) return this.modules;
       return this.modules.filter(module => {
         return (
           module.moduleName.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
           module.description.toLowerCase().includes(this.searchQuery.toLowerCase())
         );
       });
     },
   },
   methods: {


    viewAnalysis(module) {
    console.log('Module passed to viewAnalysis:', module);  // Log the module received
    if (module) {
      this.selectedModule = module;
      this.moduleName = module.moduleName;
      this.description = module.description;
      this.editMode = true;
    } else {
      console.error('Module is undefined or missing properties');
    }
  },
     viewModule(module) {
       this.selectedModule = module;
       this.show = true;
     },
 
     openForm() {
       this.show = !this.show;
     },
 
     closeForm() {
       this.show = !this.show;
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
 
     updateModulesPerPage() {
       this.currentPage = 1;
     },
 
     async fetchModules() {
  this.Loading = true;
  const toast = useToast();
  this.modules = []; 

  try {
    
    const response = await axios.post('/modules/list');

     // Log the API response to ensure it is what you expect
     console.log('API Response:', response.data);

    if (response.data && Array.isArray(response.data)) {
      this.modules = response.data.map(module => ({
        moduleID: module.moduleID,
        moduleName: module.moduleName,
        description: module.description,
        defaultPrice: module.defaultPrice,
        isActive: module.isActive || true, 
      }));

      toast.success('Modules fetched successfully!');
    } else {
      toast.error('No modules found in the response.');
    }
  } catch (error) {
    console.error('Error fetching modules:', error);
    toast.error('Failed to fetch modules. Please try again.');
  } finally {
    this.Loading = false; 
  }
},
   },
   mounted() {
     this.fetchModules();
   }
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
    