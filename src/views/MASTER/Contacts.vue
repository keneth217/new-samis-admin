<template>
  <div class="the-page">
    <div class="search-area">
      <div class="header-container1">
        <h2>Contacts</h2>
      </div>
      <input
        v-model="searchQuery"
        placeholder="Search by name, phone or school code"
        class="search-input"
      />
    </div>

    <div class="header-container">
      <div class="header-object1">
        <button @click="openForm" class="action-btn" aria-label="Add Contact">
          <span class="material-symbols-outlined">add_circle</span> Add Contact
        </button>
      </div>
    </div>

    <div class="table-container">
      <div class="students-controls">
        <label for="contactsPerPage">Contacts per page:</label>
        <select class="form-control" v-model="contactsPerPage" @change="updateContactsPerPage">
          <option v-for="option in contactsPerPageOptions" :key="option" :value="option">
            {{ option }}
          </option>
        </select>
      </div>

      <table class="students-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Name</th>
            <th>Designation</th>
            <th>Email</th>
            <th>Phone</th>
            <th>School Code</th>
            <th class="actions-header">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="displayedContacts.length === 0">
            <td colspan="7">No contacts found</td>
          </tr>
          <tr
            v-for="(contact, index) in displayedContacts"
            :key="contact.contactID || index"
            :class="{ 'even-row': index % 2 !== 0 }"
          >
            <td>{{ (currentPage - 1) * contactsPerPage + index + 1 }}</td>
            <td>{{ contact.contactName }}</td>
            <td>{{ contact.designation }}</td>
            <td>{{ contact.email || '-' }}</td>
            <td>{{ contact.phoneNo }}</td>
            <td>{{ contact.schoolCode }}</td>
            <td class="actions">
              <button @click="editContact(contact)" class="manage-btn" aria-label="Edit Contact">
                <span class="material-symbols-outlined">edit</span> Edit
              </button>
              <button
                @click="deleteContact(contact)"
                class="class-list-btn"
                aria-label="Delete Contact"
              >
                <span class="material-symbols-outlined">delete</span> Delete
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

    <NewContact
      :contact="selectedContact"
      @closeForm="closeForm"
      @fetchContacts="fetchContacts"
      v-if="showForm"
    />

    <LoadingSpinner :isLoading="Loading" />
    <footerCast />
  </div>
</template>

<script>
import footerCast from '../../components/footer.vue';
import axios from '../../axios';
import { useToast } from 'vue-toastification';
import LoadingSpinner from '../../components/LoadingSpinner.vue';
import NewContact from './NewContact.vue';

export default {
  name: 'Contacts',
  components: {
    footerCast,
    LoadingSpinner,
    NewContact,
  },
  setup() {
    const toast = useToast();
    return { toast };
  },
  data() {
    return {
      contacts: [],
      selectedContact: null,
      showForm: false,
      searchQuery: '',
      Loading: false,
      currentPage: 1,
      contactsPerPage: 15,
      contactsPerPageOptions: [5, 15, 30, 50, 75, 100],
    };
  },
  computed: {
    totalPages() {
      return Math.ceil(this.filteredContacts.length / this.contactsPerPage) || 1;
    },
    displayedContacts() {
      const startIndex = (this.currentPage - 1) * this.contactsPerPage;
      const endIndex = Math.min(startIndex + this.contactsPerPage, this.filteredContacts.length);
      return this.filteredContacts.slice(startIndex, endIndex);
    },
    filteredContacts() {
      if (!this.searchQuery.trim()) return this.contacts;
      const query = this.searchQuery.toLowerCase();
      return this.contacts.filter((c) => {
        return (
          (c.contactName || '').toLowerCase().includes(query) ||
          (c.phoneNo || '').toLowerCase().includes(query) ||
          (c.schoolCode || '').toLowerCase().includes(query)
        );
      });
    },
  },
  methods: {
    openForm() {
      this.selectedContact = null;
      this.showForm = true;
    },
    closeForm() {
      this.showForm = false;
      this.selectedContact = null;
    },
    editContact(contact) {
      this.selectedContact = contact;
      this.showForm = true;
    },
    updateContactsPerPage() {
      this.currentPage = 1;
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
    async fetchContacts() {
      this.Loading = true;
      const toast = useToast();
      try {
        const response = await axios.post('/contacts/list');
        const data = Array.isArray(response.data) ? response.data : [];
        this.contacts = data
          .filter((c) => !c.deleted)
          .map((c) => ({
            contactID: c.contactID || c.contactId,
            contactName: c.contactName,
            designation: c.designation,
            email: c.email,
            phoneNo: c.phoneNo,
            schoolCode: c.schoolCode,
          }));
      } catch (error) {
        console.error('Error fetching contacts:', error);
        toast.error('Failed to fetch contacts. Please try again.');
      } finally {
        this.Loading = false;
      }
    },
    async deleteContact(contact) {
      const toast = useToast();
      if (!contact.contactID && !contact.contactId) {
        toast.error('Missing contact ID.');
        return;
      }
      if (!confirm(`Are you sure you want to delete contact ${contact.contactName}?`)) {
        return;
      }
      this.Loading = true;
      const id = contact.contactID || contact.contactId;
      try {
        await axios.post(`/contacts/delete/${id}`);
        this.contacts = this.contacts.filter((c) => (c.contactID || c.contactId) !== id);
        toast.success('Contact deleted successfully!');
      } catch (error) {
        console.error('Error deleting contact:', error);
        toast.error('Failed to delete contact. Please try again.');
      } finally {
        this.Loading = false;
      }
    },
  },
  mounted() {
    this.fetchContacts();
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
}

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
    min-width: 700px;
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
}
</style>


