<template>
  <div class="the-page">
    <div class="search-area">
      <!-- Header -->
      <div class="header-container1">
        <h2>Employees</h2>
      </div>
      <input v-model="searchQuery" placeholder="Search by name, employee ID, department, or phone" class="search-input" />
    </div>

    <!-- Action Buttons -->
    <div class="header-container">
      <div class="header-object1">
        <button @click="openForm" class="action-btn" aria-label="Add Employee">
          <span class="material-symbols-outlined">add_circle</span> Add Employee
        </button>
      </div>
    </div>

    <!-- Employees Table -->
    <div class="table-container">
      <div class="students-controls">
        <label for="employeesPerPage">Employees per page:</label>
        <select class="form-control" v-model="employeesPerPage" @change="updateEmployeesPerPage">
          <option v-for="option in employeesPerPageOptions" :key="option" :value="option">{{ option }}</option>
        </select>
      </div>

      <table class="students-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Employee ID</th>
            <th>Full Name</th>
            <th>Department</th>
            <th>Phone Number</th>
            <th>Email</th>
            <th>Status</th>
            <th class="actions-header">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="displayedEmployees.length === 0">
            <td colspan="8">No employees found</td>
          </tr>
          <tr
            v-for="(employee, index) in displayedEmployees"
            :key="employee.employeeID"
            :class="{ 'even-row': index % 2 !== 0 }"
          >
            <td>{{ (currentPage - 1) * employeesPerPage + index + 1 }}</td>
            <td>{{ employee.employeeID }}</td>
            <td>{{ employee.fullName }}</td>
            <td>{{ employee.department }}</td>
            <td>{{ employee.phoneNumber }}</td>
            <td>{{ employee.email }}</td>
            <td :class="{ 'text-success': employee.status === 'Active', 'text-danger': employee.status === 'Inactive' }">
              {{ employee.status }}
            </td>
            <td class="actions">
              <button @click="viewEmployee(employee)" class="manage-btn" aria-label="View Employee">
                <span class="material-symbols-outlined">visibility</span> View
              </button>
              <button @click="editEmployee(employee)" class="class-list-btn" aria-label="Edit Employee">
                <span class="material-symbols-outlined">edit</span> Edit
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

    <!-- Employee Form Modal -->
    <NewEmployeeForm
      :employee="selectedEmployee"
      @closeForm="openForm" 
      @fetchEmployees="fetchEmployees" 
      v-if="showForm" 
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
import NewEmployeeForm from './NewEmployeeForm.vue';

export default {
  name: 'Employees',
  components: {
    footerCast,
    LoadingSpinner,
    NewEmployeeForm,
  },
  setup() {
    const toast = useToast();
    return { toast };
  },
  data() {
    return {
      selectedEmployee: null,
      showForm: false,
      searchQuery: '',
      employees: [],
      Loading: false,
      currentPage: 1,
      employeesPerPage: 15,
      employeesPerPageOptions: [5, 15, 30, 50, 75, 100],
    };
  },
  computed: {
    totalPages() {
      return Math.ceil(this.filteredEmployees.length / this.employeesPerPage);
    },
    displayedEmployees() {
      const startIndex = (this.currentPage - 1) * this.employeesPerPage;
      const endIndex = Math.min(startIndex + this.employeesPerPage, this.filteredEmployees.length);
      return this.filteredEmployees.slice(startIndex, endIndex);
    },
    filteredEmployees() {
      if (!this.searchQuery.trim()) return this.employees;
      const query = this.searchQuery.toLowerCase();
      return this.employees.filter(employee => {
        return (
          (employee.employeeID && employee.employeeID.toString().toLowerCase().includes(query)) ||
          (employee.fullName && employee.fullName.toLowerCase().includes(query)) ||
          (employee.department && employee.department.toLowerCase().includes(query)) ||
          (employee.phoneNumber && employee.phoneNumber.toString().toLowerCase().includes(query)) ||
          (employee.email && employee.email.toLowerCase().includes(query))
        );
      });
    },
  },
  methods: {
    viewEmployee(employee) {
      this.selectedEmployee = employee;
      this.showForm = true;
    },

    editEmployee(employee) {
      this.selectedEmployee = employee;
      this.showForm = true;
    },

    openForm() {
      if (this.showForm && this.selectedEmployee) {
        this.selectedEmployee = null;
      }
      this.showForm = !this.showForm;
    },

    closeForm() {
      this.showForm = false;
      this.selectedEmployee = null;
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

    updateEmployeesPerPage() {
      this.currentPage = 1;
    },

    async fetchEmployees() {
      this.Loading = true;
      const toast = useToast();
      this.employees = [];

      try {
        const response = await axios.post('/api/employees/list');

        if (response.data && Array.isArray(response.data)) {
          this.employees = response.data.map(employee => ({
            employeeID: employee.employeeID || employee.id || employee.employee_id || 'N/A',
            fullName: employee.fullName || employee.full_name || employee.name || 'N/A',
            department: employee.department || employee.dept || 'N/A',
            phoneNumber: employee.phoneNumber || employee.phone_number || employee.phone || 'N/A',
            email: employee.email || 'N/A',
            status: employee.status || 'Active',
            category: employee.category || employee.type || 'N/A', // office, marketers, installers
            dateHired: employee.dateHired || employee.date_hired || employee.hiredDate || '',
            address: employee.address || '',
            position: employee.position || employee.jobTitle || ''
          }));

          toast.success('Employees fetched successfully!');
        } else {
          toast.error('No employees found in the response.');
        }
      } catch (error) {
        console.error('Error fetching employees:', error);
        toast.error('Failed to fetch employees. Please try again.');
      } finally {
        this.Loading = false;
      }
    },
  },
  mounted() {
    this.fetchEmployees();
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

.header-object1 {
  display: flex;
  gap: 0.5rem;
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
  gap: 0.3rem;
}

.action-btn:hover {
  background-color: #1e6192;
}

.action-btn .material-symbols-outlined {
  margin-right: 0.3rem;
}

.search-area {
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
  margin-left: 1rem;
}

.table-container {
  background-color: white;
  padding: 1rem;
  border-radius: 8px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.students-controls {
  margin-bottom: 0.5rem;
  display: flex;
  gap: 0.3rem;
  align-items: center;
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

.students-table {
  width: 100%;
  border-collapse: collapse;
  border-spacing: 0;
  border: 1px solid #ddd;
}

.students-table th,
.students-table td {
  padding: 1rem;
  text-align: left;
  border-bottom: 1px solid #ddd;
  vertical-align: middle;
  border: 1px solid #ddd;
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
  background: white;
}

.pagination button:hover:not(:disabled) {
  background-color: #2b7ab7;
  color: white;
}

.pagination button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination span {
  font-weight: bold;
  margin: 0 10px;
}

/* Responsive Design */
@media only screen and (max-width: 767px) {
  .the-page {
    padding: 0.5rem;
    margin-top: 2.5rem;
    margin-left: 2.1rem;
    width: 93.5%;
  }

  .header-container {
    flex-direction: column;
    gap: 0.4rem;
    align-items: flex-start;
  }

  .header-object1 {
    gap: 0.2rem;
  }

  .action-btn {
    width: 100%;
    justify-content: center;
    padding: 0.5rem;
    font-size: 0.9rem;
  }

  .header-container1 h2 {
    font-size: 1.2rem;
    text-align: center;
  }

  .search-area {
    flex-direction: column;
    gap: 0.5rem;
    align-items: flex-start;
  }

  .search-input {
    width: 100%;
    margin-left: 0;
  }

  .table-container {
    padding: 0.5rem;
    width: 103%;
    margin-left: -0.3rem;
    overflow-x: auto;
  }

  .students-table {
    min-width: 800px;
  }

  .students-table th,
  .students-table td {
    padding: 0.5rem;
    font-size: 0.9rem;
    white-space: normal;
    word-break: break-word;
  }

  .actions {
    flex-direction: column;
    gap: 0.25rem;
    padding-left: 0;
  }

  .manage-btn,
  .class-list-btn {
    width: 100%;
    justify-content: center;
    padding: 0.3rem 0.5rem;
    font-size: 0.8rem;
  }

  .pagination button {
    padding: 2.5px 10px;
  }
}
</style>

