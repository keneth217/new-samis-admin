<template>
  <div class="form-wrap">
    <div class="form-content">
      <div class="cancel" @click="$emit('closeForm')">
        <i class="fas fa-times"></i>
      </div>
      <div class="form-title">
        <h2>{{ editMode ? 'EDIT EMPLOYEE' : 'NEW EMPLOYEE' }}</h2>
      </div>
      <hr />

      <div class="form-inputs">
        <!-- Employee ID -->
        <div class="form-group">
          <input 
            type="text" 
            class="form-control" 
            v-model="employeeID" 
            placeholder="Employee ID" 
            required 
          />
          <label for="employeeID" :class="{ filled: employeeID !== '' }">Employee ID*</label>
        </div>

        <!-- Full Name -->
        <div class="form-group">
          <input 
            type="text" 
            class="form-control" 
            v-model="fullName" 
            placeholder="Full Name" 
            required 
          />
          <label for="fullName" :class="{ filled: fullName !== '' }">Full Name*</label>
        </div>

        <!-- Department/Category -->
        <div class="form-group">
          <select class="form-control" v-model="department" required>
            <option value="" disabled>Select Department*</option>
            <option value="Office">Office</option>
            <option value="Marketers">Marketers</option>
            <option value="Installers">Installers</option>
          </select>
          <label for="department" :class="{ filled: department !== '' }">Department*</label>
        </div>

        <!-- Position/Job Title -->
        <div class="form-group">
          <input 
            type="text" 
            class="form-control" 
            v-model="position" 
            placeholder="Position/Job Title" 
          />
          <label for="position" :class="{ filled: position !== '' }">Position/Job Title</label>
        </div>

        <!-- Phone Number -->
        <div class="form-group">
          <input 
            type="tel" 
            class="form-control" 
            v-model="phoneNumber" 
            placeholder="Phone Number" 
            required 
          />
          <label for="phoneNumber" :class="{ filled: phoneNumber !== '' }">Phone Number*</label>
        </div>

        <!-- Email -->
        <div class="form-group">
          <input 
            type="email" 
            class="form-control" 
            v-model="email" 
            placeholder="Email Address" 
          />
          <label for="email" :class="{ filled: email !== '' }">Email Address</label>
        </div>

        <!-- Address -->
        <div class="form-group">
          <textarea
            class="form-control"
            v-model="address"
            placeholder="Address"
            rows="2"
          ></textarea>
          <label for="address" :class="{ filled: address !== '' }">Address</label>
        </div>

        <!-- Date Hired -->
        <div class="form-group">
          <input 
            type="date" 
            class="form-control" 
            v-model="dateHired" 
            placeholder="Date Hired" 
          />
          <label for="dateHired" :class="{ filled: dateHired !== '' }">Date Hired</label>
        </div>

        <!-- Status -->
        <div class="form-group">
          <select class="form-control" v-model="status" required>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
          <label for="status" :class="{ filled: status !== '' }">Status*</label>
        </div>
      </div>
      <hr />
      <div class="form-actions">
        <button @click="$emit('closeForm')">Close</button>
        <button @click="saveEmployee">{{ editMode ? 'Update' : 'Create' }}</button>
      </div>
    </div>
    <LoadingSpinner :isLoading="Loading" />
  </div>
</template>

<script>
import axios from 'axios';
import { useToast } from 'vue-toastification';
import LoadingSpinner from '../../components/LoadingSpinner.vue';

export default {
  name: 'NewEmployeeForm',
  components: { LoadingSpinner },
  props: {
    employee: {
      type: Object,
      default: null,
    },
  },
  data() {
    return {
      employeeID: '',
      fullName: '',
      department: '',
      position: '',
      phoneNumber: '',
      email: '',
      address: '',
      dateHired: '',
      status: 'Active',
      Loading: false,
      editMode: false,
    };
  },
  watch: {
    employee: {
      immediate: true,
      handler(newEmployee) {
        if (newEmployee) {
          this.editMode = true;
          this.employeeID = newEmployee.employeeID || '';
          this.fullName = newEmployee.fullName || '';
          this.department = newEmployee.department || '';
          this.position = newEmployee.position || '';
          this.phoneNumber = newEmployee.phoneNumber || '';
          this.email = newEmployee.email || '';
          this.address = newEmployee.address || '';
          this.dateHired = newEmployee.dateHired || '';
          this.status = newEmployee.status || 'Active';
        } else {
          this.editMode = false;
          this.clearForm();
        }
      },
    },
  },
  methods: {
    clearForm() {
      this.employeeID = '';
      this.fullName = '';
      this.department = '';
      this.position = '';
      this.phoneNumber = '';
      this.email = '';
      this.address = '';
      this.dateHired = '';
      this.status = 'Active';
    },

    async saveEmployee() {
      const toast = useToast();

      if (!this.employeeID || !this.fullName || !this.department || !this.phoneNumber) {
        toast.warning('Please fill all required fields!');
        return;
      }

      const payload = {
        employeeID: this.employeeID,
        fullName: this.fullName,
        department: this.department,
        position: this.position,
        phoneNumber: this.phoneNumber,
        email: this.email,
        address: this.address,
        dateHired: this.dateHired,
        status: this.status,
      };

      this.Loading = true;

      try {
        let response;
        if (this.editMode && this.employee?.employeeID) {
          response = await axios.put(`/api/employees/update/${this.employee.employeeID}`, payload);
        } else {
          response = await axios.post('/api/employees/create', payload);
        }

        if (response.status === 200 || response.status === 201) {
          toast.success(`Employee ${this.editMode ? 'updated' : 'created'} successfully!`);
          this.$emit('fetchEmployees');
          this.$emit('closeForm');
          this.clearForm();
        } else {
          toast.error(`Unexpected response status: ${response.status}`);
        }
      } catch (error) {
        if (error.response && error.response.data) {
          toast.error(`ERROR: ${error.response.data.message || 'An unexpected error occurred'}`);
        } else {
          toast.error(`ERROR ${this.editMode ? 'UPDATING' : 'CREATING'} EMPLOYEE!`);
        }
        console.error('Error saving employee:', error);
      } finally {
        this.Loading = false;
      }
    },
  },
};
</script>

<style scoped>
* {
  padding: 0;
  margin: 0;
  box-sizing: border-box;
}

.form-wrap {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10000;
}

.form-content {
  background-color: #4368b9;
  border-radius: 5px;
  padding: 2rem;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0px 0px 5px gold;
  position: relative;
}

.cancel {
  position: absolute;
  top: 10px;
  right: 10px;
  cursor: pointer;
  color: gold;
  font-size: 1.5rem;
}

.form-title h2 {
  color: gold;
  margin-bottom: 1rem;
  text-align: center;
}

hr {
  border: 1px solid gold;
  margin: 1rem 0;
}

.form-inputs {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  position: relative;
  display: flex;
  flex-direction: column;
}

.form-control {
  padding: 0.6rem;
  border: 1px solid gold;
  border-radius: 4px;
  background-color: #fff;
  color: #000;
  font-size: 1rem;
  outline: none;
}

.form-control:focus {
  border-color: #fff;
  box-shadow: 0 0 5px rgba(255, 215, 0, 0.5);
}

.form-control:disabled {
  background-color: #e0e0e0;
  cursor: not-allowed;
}

textarea.form-control {
  resize: vertical;
  min-height: 60px;
}

label {
  position: absolute;
  left: 0.6rem;
  top: 0.6rem;
  color: #666;
  font-size: 0.9rem;
  pointer-events: none;
  transition: all 0.3s ease;
  background-color: #fff;
  padding: 0 0.3rem;
}

label.filled {
  top: -0.6rem;
  left: 0.3rem;
  font-size: 0.75rem;
  color: gold;
  background-color: #4368b9;
}

.form-control:focus + label,
.form-control:not(:placeholder-shown) + label {
  top: -0.6rem;
  left: 0.3rem;
  font-size: 0.75rem;
  color: gold;
  background-color: #4368b9;
}

.form-actions {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  margin-top: 1rem;
}

.form-actions button {
  flex: 1;
  padding: 0.6rem 1rem;
  border: 1px solid gold;
  border-radius: 4px;
  background-color: gold;
  color: #000;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.form-actions button:hover {
  background-color: #4368b9;
  color: gold;
  border-color: gold;
}

.form-actions button:first-child {
  background-color: rgba(245, 56, 56, 1);
  border-color: rgba(245, 56, 56, 1);
  color: white;
}

.form-actions button:first-child:hover {
  background-color: #4368b9;
  color: gold;
  border-color: gold;
}

/* Responsive Design */
@media only screen and (max-width: 767px) {
  .form-content {
    width: 95%;
    padding: 1.5rem;
    max-height: 95vh;
  }

  .form-title h2 {
    font-size: 1.2rem;
  }
}
</style>

