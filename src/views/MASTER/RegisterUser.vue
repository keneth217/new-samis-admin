

<template>
    <div class="the-page">
      <div class="search-area">
        <!-- Header -->
        <div class="header-container1">
          <h2>All Users</h2>
        </div>
        <input v-model="searchQuery" placeholder="Search by name or code" class="search-input" />
      </div>
  
      <!-- Action Buttons -->
      <div class="header-container">
        <div class="header-object1">
          <button @click="openForm" class="action-btn" aria-label="Add User">
            <span class="material-symbols-outlined">add_circle</span> Add User
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
          <label for="UsersPerPage">users per page:</label>
          <select class="form-control" v-model="usersPerPage" @change="updateusersPerPage">
            <option v-for="option in usersPerPageOptions" :key="option" :value="option">{{ option }}</option>
          </select>
        </div>
  
        
        <table class="students-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Full Name</th>
              <th>Username</th>
              <th>Email</th>
              <th>Phone No</th>
              <th>User Type</th>
              <th>status</th>
              <th class="actions-header">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="displayedUsers.length === 0">
              <td colspan="5">No User found</td>
            </tr>
            <tr
            v-for="(user, index) in displayedUsers"
              :key="user.username"
              :class="{ 'even-row': index % 2 !== 0 }"
            >
            <td>{{ (currentPage - 1) * usersPerPage + index + 1 }}</td>
              <td>{{ user.fullname }}</td>
              <td>{{ user.username }}</td>
              <td>{{ user.email }}</td>
              <td>{{ user.phoneNo }}</td>
              <td>{{ user.usertype }}</td>

              <td :class="{ 'text-success': user.activated === true, 'text-danger': user.activated !== true }">
                {{ user.activated === true ? 'ACTIVE' : 'EXPIRED' }}
              </td>
              <td class="actions">
                <button @click="viewuser(user)" class="manage-btn" aria-label="View Profile">
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
  
      <NewUser
      :user="selectedUser"
      @closeForm="closeForm" 
      @fetchUsers="fetchUsers" 
      v-if="show"
    />
  <NewUser
        :user="selectedUser"
        @closeForm="openForm" 
        @fetchUsers="fetchUser" 
        v-if="show" 
       />
  
  
      <LoadingSpinner :isLoading="Loading" />
      <!-- Footer -->
      <footerCast />
    </div>
  </template>

<script>
import footerCast from '../../components/footer.vue';
import axios from 'axios';
import { useToast } from 'vue-toastification';
import LoadingSpinner from '../../components/LoadingSpinner.vue';
import NewUser from './NewUser.vue';

export default {
  components: {
    footerCast,
    NewUser,
    LoadingSpinner,
  },
  setup() {
    const toast = useToast();
    return { toast };
  },
  data() {
    return {
      selectedUser: null,
      show: false,
      searchQuery: '',
      users: [],
      Loading: false,
      currentPage: 1,
      usersPerPage: 15,
      usersPerPageOptions: [5, 15, 30, 50, 75, 100],
    };
  },
  computed: {
    totalPages() {
      return Math.ceil(this.filteredUsers.length / this.usersPerPage);
    },
    displayedUsers() {
      const startIndex = (this.currentPage - 1) * this.usersPerPage;
      const endIndex = Math.min(startIndex + this.usersPerPage, this.filteredUsers.length);
      return this.filteredUsers.slice(startIndex, endIndex);
    },
    filteredUsers() {
      if (!this.searchQuery.trim()) return this.users;
      return this.users.filter(user => {
        return (
          user.fullname.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
          user.username.toLowerCase().includes(this.searchQuery.toLowerCase())
        );
      });
    },
  },
  methods: {
    viewUser(user) {
      this.selectedUser = user;  // Set the selected user before opening the form
      this.show = true;
    },

    openForm() {
      this.show = !this.show;
    },

    closeForm() {
      this.show = false;  // Close the form
      this.selectedUser = null;  // Reset the selected user when the form closes
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

    updateusersPerPage() {
      this.currentPage = 1;
    },

    async fetchUsers() {
      this.Loading = true;
      const toast = useToast();

      this.users = [];
      try {
        const response = await axios.post('/api/auth/list_users');
        this.users = response.data.map(user => ({
          phoneNo: user.phoneNo,
          username: user.username,
          fullname: user.fullname,
          email: user.email,
          usertype: user.usertype,
          station: user.station,
          role: user.role,
        }));
      } catch (error) {
        console.error('Error fetching all users:', error);
        toast.error('Failed to fetch users. Please try again.');
      } finally {
        this.Loading = false;
      }
    },
  },
  mounted() {
    this.fetchUsers();
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
    