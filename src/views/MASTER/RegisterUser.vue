

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
  
        
        <!-- Desktop Table View -->
        <table class="students-table desktop-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Full Name</th>
              <th>Username</th>
              <th>Email</th>
              <th>Phone No</th>
              <th>User Type</th>
              <th>Status</th>
              <th class="actions-header">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="displayedUsers.length === 0">
              <td colspan="8">No User found</td>
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
                <button @click="viewUser(user)" class="manage-btn" aria-label="View Profile">
                  <span class="material-symbols-outlined">person</span> Details
                </button>
                <button @click="viewUser(user)" class="class-list-btn" aria-label="Edit User">
                  <span class="material-symbols-outlined">edit</span> Edit
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Mobile Card View -->
        <div class="mobile-cards" v-if="displayedUsers.length > 0">
          <div v-for="(user, index) in displayedUsers" :key="user.username" class="user-card">
            <div class="card-header">
              <div class="card-number">{{ (currentPage - 1) * usersPerPage + index + 1 }}</div>
              <h3 class="card-title">{{ user.fullname }}</h3>
            </div>
            
            <div class="card-body">
              <div class="card-row">
                <span class="card-label">Username:</span>
                <span class="card-value">{{ user.username }}</span>
              </div>
              
              <div class="card-row">
                <span class="card-label">Email:</span>
                <span class="card-value">{{ user.email || '-' }}</span>
              </div>
              
              <div class="card-row">
                <span class="card-label">Phone No:</span>
                <span class="card-value">{{ user.phoneNo || '-' }}</span>
              </div>
              
              <div class="card-row">
                <span class="card-label">User Type:</span>
                <span class="card-value">{{ user.usertype || '-' }}</span>
              </div>
              
              <div class="card-row">
                <span class="card-label">Status:</span>
                <span class="card-value" :class="{ 'text-success': user.activated === true, 'text-danger': user.activated !== true }">
                  {{ user.activated === true ? 'ACTIVE' : 'EXPIRED' }}
                </span>
              </div>
            </div>
            
            <div class="card-footer">
              <button @click="viewUser(user)" class="card-action-btn" aria-label="View Profile">
                <span class="material-symbols-outlined">person</span> Details
              </button>
              <button @click="viewUser(user)" class="card-action-btn edit-btn" aria-label="Edit User">
                <span class="material-symbols-outlined">edit</span> Edit
              </button>
            </div>
          </div>
        </div>

        <div v-if="displayedUsers.length === 0" class="no-data-message">
          No User found
        </div>
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
        const response = await axios.post('/auth/list_users');
        // API returns: userID, username, fullname, phoneNo, email, usertype, role
        this.users = response.data.map(user => ({
          userID: user.userID, // API returns userID (not id)
          phoneNo: user.phoneNo,
          username: user.username,
          fullname: user.fullname,
          email: user.email,
          usertype: user.usertype,
          role: user.role,
          // Note: station and activated are not in API spec, but keeping for backward compatibility
          station: user.station || '',
          activated: user.activated !== undefined ? user.activated : true,
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
  gap: 0.3rem;
}

.action-btn:hover {
  background-color: #1e6192;
}

.action-btn .material-symbols-outlined {
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

.search-input {
  padding: clamp(0.3rem, 1vw, 0.5rem);
  border-radius: 5px;
  border: 2px solid #2b7ab7;
  outline: none;
  font-size: clamp(0.85rem, 1.5vw, 1rem);
  flex: 1;
  min-width: 150px;
  max-width: 400px;
  margin-left: 1rem;
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
.user-card {
  background: white;
  border: 1px solid #e1e4ea;
  border-radius: 8px;
  margin-bottom: 1rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: box-shadow 0.3s ease;
}

.user-card:hover {
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
  gap: 0.5rem;
}

.card-action-btn {
  flex: 1;
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

.card-action-btn.edit-btn {
  background-color: #dbeafe;
  color: #1e40af;
  border-color: #93c5fd;
}

.card-action-btn:hover {
  background-color: #d1d5db;
  transform: translateY(-1px);
}

.card-action-btn.edit-btn:hover {
  background-color: #bfdbfe;
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

  .user-card {
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
    