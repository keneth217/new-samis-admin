<template>
  <div class="form-wrap">
    <div class="form-content">
      <div class="cancel" @click="$emit('closeForm')">
        <i class="fas fa-times"></i>
      </div>
      <div class="form-title">
        <h2>{{ editMode ? 'EDIT CONTACT' : 'NEW CONTACT' }}</h2>
      </div>
      <hr />

      <div class="form-inputs">
        <div class="form-group">
          <input
            type="text"
            class="form-control"
            v-model="contactName"
            placeholder="Contact Name"
            required
          />
          <label for="contactName" :class="{ filled: contactName !== '' }">Contact Name*</label>
        </div>

        <div class="form-group">
          <input
            type="text"
            class="form-control"
            v-model="designation"
            placeholder="Designation"
            required
          />
          <label for="designation" :class="{ filled: designation !== '' }">Designation*</label>
        </div>

        <div class="form-group">
          <input
            type="email"
            class="form-control"
            v-model="email"
            placeholder="Email"
          />
          <label for="email" :class="{ filled: email !== '' }">Email</label>
        </div>

        <div class="form-group">
          <input
            type="text"
            class="form-control"
            v-model="phoneNo"
            placeholder="Phone Number"
            required
          />
          <label for="phoneNo" :class="{ filled: phoneNo !== '' }">Phone Number*</label>
        </div>

        <div class="form-group">
          <input
            type="text"
            class="form-control"
            v-model="schoolCode"
            placeholder="School Code"
            required
          />
          <label for="schoolCode" :class="{ filled: schoolCode !== '' }">School Code*</label>
        </div>
      </div>

      <hr />
      <div class="form-actions">
        <button @click="$emit('closeForm')">Close</button>
        <button @click="saveContact">{{ editMode ? 'Update' : 'Create' }}</button>
      </div>
    </div>
    <LoadingSpinner :isLoading="Loading" />
  </div>
</template>

<script>
import axios from '../../axios';
import { useToast } from 'vue-toastification';
import LoadingSpinner from '../../components/LoadingSpinner.vue';

export default {
  name: 'NewContactForm',
  components: { LoadingSpinner },
  props: {
    contact: {
      type: Object,
      default: null,
    },
  },
  data() {
    return {
      contactID: null,
      contactName: '',
      designation: '',
      email: '',
      phoneNo: '',
      schoolCode: '',
      editMode: false,
      Loading: false,
    };
  },
  watch: {
    contact: {
      immediate: true,
      handler(newContact) {
        if (newContact) {
          this.editMode = true;
          this.contactID = newContact.contactID || newContact.contactId || null;
          this.contactName = newContact.contactName || '';
          this.designation = newContact.designation || '';
          this.email = newContact.email || '';
          this.phoneNo = newContact.phoneNo || '';
          this.schoolCode = newContact.schoolCode || '';
        } else {
          this.editMode = false;
          this.clearForm();
        }
      },
    },
  },
  methods: {
    clearForm() {
      this.contactID = null;
      this.contactName = '';
      this.designation = '';
      this.email = '';
      this.phoneNo = '';
      this.schoolCode = '';
    },
    async saveContact() {
      const toast = useToast();

      if (!this.contactName || !this.designation || !this.phoneNo || !this.schoolCode) {
        toast.warning('Please fill all required fields (Contact Name, Designation, Phone, School Code).');
        return;
      }

      const payload = {
        contactName: this.contactName,
        designation: this.designation,
        email: this.email,
        phoneNo: this.phoneNo,
        schoolCode: this.schoolCode,
      };

      this.Loading = true;

      try {
        let response;
        if (this.editMode && this.contactID != null) {
          response = await axios.post(`/contacts/update/${this.contactID}`, payload);
        } else {
          response = await axios.post('/contacts/create', payload);
        }

        if (response.status === 200 || response.status === 201) {
          toast.success(`Contact ${this.editMode ? 'updated' : 'created'} successfully!`);
          this.$emit('fetchContacts');
          this.$emit('closeForm');
          this.clearForm();
        } else {
          toast.error(`Unexpected response status: ${response.status}`);
        }
      } catch (error) {
        if (error.response && error.response.data) {
          toast.error(`ERROR: ${error.response.data.message || 'An unexpected error occurred'}`);
        } else {
          toast.error('ERROR SAVING CONTACT!');
        }
        console.error('Error saving contact:', error);
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

.form-content {
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

.cancel {
  position: absolute;
  top: 10px;
  right: 10px;
  cursor: pointer;
  color: gold;
  font-size: 1.3rem;
}

.form-title {
  color: gold;
  text-align: center;
}

.form-inputs {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  padding-top: 10px;
}

.form-group {
  position: relative;
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

.form-control::placeholder {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.9rem;
}

label {
  position: absolute;
  top: 50%;
  left: 4px;
  background: #4368b9;
  padding: 0 5px;
  transform: translateY(-50%);
  transition: all 0.3s ease;
  color: gold;
}

label.filled {
  top: -1px;
  left: 5px;
  color: gold;
  font-size: 0.95rem;
  font-weight: 600;
}

.form-group input:focus + label,
.form-group input:not(:placeholder-shown) + label {
  top: -1px;
  left: 5px;
  color: gold;
  font-size: 0.95rem;
  font-weight: 600;
}

.form-actions {
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

hr {
  border: 1px solid gold;
  margin: 20px 0;
}

@media only screen and (max-width: 1024px) {
  .form-content {
    width: 85%;
    max-width: 550px;
  }
}

@media only screen and (max-width: 768px) {
  .form-content {
    width: 95%;
    max-width: 100%;
    padding: 15px;
    max-height: 95vh;
  }

  .form-inputs {
    grid-template-columns: 1fr;
    gap: 0.9rem;
  }

  .form-title h2 {
    font-size: 1.1rem;
  }
}

@media only screen and (max-width: 480px) {
  .form-wrap {
    padding: 0.5rem;
  }

  .form-content {
    width: 100%;
    padding: 12px;
    max-height: 100vh;
    border-radius: 0;
  }

  .form-title h2 {
    font-size: 1rem;
  }

  .form-inputs {
    gap: 0.75rem;
    padding-top: 5px;
  }

  .form-control {
    padding: 0.4rem;
    font-size: 0.9rem;
  }

  .form-actions {
    flex-direction: column;
    gap: 0.5rem;
  }

  .form-actions button {
    width: 100%;
    padding: 0.5rem;
  }

  .cancel {
    top: 5px;
    right: 5px;
    font-size: 1.2rem;
  }
}
</style>


