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
          <span class="material-symbols-outlined">add_circle</span>
        </button>
      </div>
    </div>

    <div class="table-container">
      <!-- Desktop Table View - Scrollable -->
      <Scrollable>
      <table class="students-table desktop-table">
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
          <tr v-if="filteredContacts.length === 0">
            <td colspan="7">No contacts found</td>
          </tr>
          <tr
            v-for="(contact, index) in filteredContacts"
            :key="contact.contactID || index"
            :class="{ 'even-row': index % 2 !== 0 }"
          >
            <td>{{ index + 1 }}</td>
            <td>{{ contact.contactName }}</td>
            <td>{{ contact.designation }}</td>
            <td>{{ contact.email || '-' }}</td>
            <td>{{ contact.phoneNo }}</td>
            <td>{{ contact.schoolCode }}</td>
            <td class="actions">
              <button @click="editContact(contact)" class="manage-btn" aria-label="Edit Contact">
                <span class="material-symbols-outlined">edit</span>
              </button>
              <button
                @click="confirmDeleteContact(contact)"
                class="class-list-btn"
                aria-label="Delete Contact"
                :disabled="Loading"
              >
                <span class="material-symbols-outlined">delete</span>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      </Scrollable>

      <!-- Mobile Card View -->
      <div class="mobile-cards" v-if="filteredContacts.length > 0">
        <div v-for="(contact, index) in filteredContacts" :key="contact.contactID || index" class="contact-card">
          <div class="card-header">
            <div class="card-number">{{ index + 1 }}</div>
            <h3 class="card-title">{{ contact.contactName }}</h3>
          </div>
          
          <div class="card-body">
            <div class="card-row">
              <span class="card-label">Designation:</span>
              <span class="card-value">{{ contact.designation || '-' }}</span>
            </div>
            
            <div class="card-row">
              <span class="card-label">Email:</span>
              <span class="card-value">{{ contact.email || '-' }}</span>
            </div>
            
            <div class="card-row">
              <span class="card-label">Phone:</span>
              <span class="card-value">{{ contact.phoneNo || '-' }}</span>
            </div>
            
            <div class="card-row">
              <span class="card-label">School Code:</span>
              <span class="card-value">{{ contact.schoolCode || '-' }}</span>
            </div>
          </div>
          
          <div class="card-footer">
            <button @click="editContact(contact)" class="card-action-btn" aria-label="Edit Contact">
              <span class="material-symbols-outlined">edit</span>
            </button>
            <button @click="confirmDeleteContact(contact)" class="card-action-btn delete-btn" aria-label="Delete Contact" :disabled="Loading">
              <span class="material-symbols-outlined">delete</span>
            </button>
          </div>
        </div>
      </div>

      <div v-if="filteredContacts.length === 0" class="no-data-message">
        No contacts found
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteConfirm" class="modal-overlay" @click.self="cancelDeleteContact">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Confirm Delete Contact</h3>
          <button @click="cancelDeleteContact" class="close-btn">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <p class="delete-warning-text">
            Are you sure you want to delete <strong>{{ contactToDelete?.contactName || 'this contact' }}</strong>?
          </p>
          <div class="delete-contact-preview" v-if="contactToDelete">
            <div class="preview-row">
              <strong>Contact Name:</strong> {{ contactToDelete.contactName }}
            </div>
            <div class="preview-row" v-if="contactToDelete.designation">
              <strong>Designation:</strong> {{ contactToDelete.designation }}
            </div>
            <div class="preview-row" v-if="contactToDelete.phoneNo">
              <strong>Phone:</strong> {{ contactToDelete.phoneNo }}
            </div>
            <div class="preview-row" v-if="contactToDelete.schoolCode">
              <strong>School Code:</strong> {{ contactToDelete.schoolCode }}
            </div>
          </div>
          <p class="delete-warning-note">
            <i class="fas fa-exclamation-triangle"></i> This action will soft delete the contact. The contact will be marked as deleted but not permanently removed from the system.
          </p>
        </div>
        <div class="form-actions">
          <button @click="cancelDeleteContact" class="cancel-btn">Cancel</button>
          <button @click="deleteContactConfirm" class="delete-confirm-btn" :disabled="Loading" aria-label="Delete Contact">
            <span class="material-symbols-outlined">delete</span>
          </button>
        </div>
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
import Scrollable from '../../components/Scrollable.vue';
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
    Scrollable,
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
      showDeleteConfirm: false,
      contactToDelete: null,
    };
  },
  computed: {
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
        toast.success(this.contacts.length > 0
          ? `Contacts have been fetched successfully! (${this.contacts.length} contact${this.contacts.length === 1 ? '' : 's'})`
          : 'Contacts have been fetched successfully! No contacts found.');
      } catch (error) {
        console.error('Error fetching contacts:', error);
        toast.error('Failed to fetch contacts. Please try again.');
      } finally {
        this.Loading = false;
      }
    },
    confirmDeleteContact(contact) {
      this.contactToDelete = contact;
      this.showDeleteConfirm = true;
    },

    cancelDeleteContact() {
      this.showDeleteConfirm = false;
      this.contactToDelete = null;
    },

    async deleteContactConfirm() {
      if (!this.contactToDelete) {
        const toast = useToast();
        toast.error('Invalid contact. Cannot delete.');
        return;
      }

      const contactID = this.contactToDelete.contactID || this.contactToDelete.contactId;
      if (!contactID) {
        const toast = useToast();
        toast.error('Missing contact ID. Cannot delete.');
        this.cancelDeleteContact();
        return;
      }

      const toast = useToast();
      this.Loading = true;

      try {
        console.log('🗑️ Deleting contact:', contactID);
        
        // Use the correct endpoint format: POST /api/contacts/delete/{contactid}
        const response = await axios.post(
          `/contacts/delete/${encodeURIComponent(contactID)}`,
          {},
          {
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        console.log('✅ Contact deleted successfully:', response.data);

        if (response.data) {
          // Update the contact in the list to mark it as deleted
          const contactIndex = this.contacts.findIndex(c => (c.contactID || c.contactId) === contactID);
          if (contactIndex !== -1) {
            this.contacts[contactIndex].deleted = true;
            // Remove from list since we filter out deleted contacts
            this.contacts = this.contacts.filter(c => (c.contactID || c.contactId) !== contactID);
          }
          
          toast.success(`Contact "${this.contactToDelete.contactName || contactID}" deleted successfully!`);
        } else {
          // Response is null - contact doesn't exist
          toast.warning(`Contact "${contactID}" not found. It may have already been deleted.`);
          // Remove from list if it doesn't exist
          this.contacts = this.contacts.filter(c => (c.contactID || c.contactId) !== contactID);
        }

        this.cancelDeleteContact();
      } catch (error) {
        console.error('❌ Error deleting contact:', error);
        console.error('❌ Error details:', {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data,
          config: error.config,
        });

        let errorMessage = 'Failed to delete contact. Please try again.';

        if (error.response) {
          const status = error.response.status;
          const errorData = error.response.data;

          if (status === 400) {
            errorMessage = errorData?.message || 'Invalid request. The contact ID may be invalid.';
          } else if (status === 404) {
            errorMessage = 'Contact not found. It may have already been deleted.';
            // Remove from list if not found
            this.contacts = this.contacts.filter(c => (c.contactID || c.contactId) !== contactID);
          } else if (status === 500) {
            errorMessage = 'Server error. Please try again later.';
          } else {
            errorMessage = errorData?.message || `Server returned status ${status}`;
          }
        } else if (error.request) {
          errorMessage = 'No response from server. Please check your connection.';
        } else {
          errorMessage = error.message || 'An unexpected error occurred.';
        }

        toast.error(errorMessage, { timeout: 6000 });
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
}

.action-btn:hover {
  background-color: #1e6192;
}

.action-btn .material-symbols-outlined {
  margin-right: 0.3rem;
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

.table-scroll-wrapper {
  max-height: calc(100vh - 14rem);
  overflow-y: auto;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  border: 1px solid #ddd;
  border-radius: 4px;
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
.contact-card {
  background: white;
  border: 1px solid #e1e4ea;
  border-radius: 8px;
  margin-bottom: 1rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: box-shadow 0.3s ease;
}

.contact-card:hover {
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

.card-action-btn.delete-btn {
  background-color: #fee2e2;
  color: #dc2626;
  border-color: #fecaca;
}

.card-action-btn:hover {
  background-color: #d1d5db;
  transform: translateY(-1px);
}

.card-action-btn.delete-btn:hover {
  background-color: #fecaca;
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

.students-table th,
.students-table td {
  white-space: nowrap;
  padding: 0.3rem 0.5rem;
  line-height: 1.2;
  text-align: left;
  border: 1px solid #ddd;
  vertical-align: middle;
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

/* Responsive Breakpoints */
@media only screen and (max-width: 1024px) {
  .the-page {
    margin-top: clamp(3rem, 8vw, 4.5rem);
  }

  .students-table th,
  .students-table td {
    padding: 0.3rem 0.45rem;
    font-size: clamp(0.85rem, 1.1vw, 0.95rem);
  }

  .search-input {
    max-width: 100%;
    width: 100%;
    margin-left: 0;
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
    flex-direction: column;
  }

  .card-action-btn {
    width: 100%;
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

  .contact-card {
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

/* Delete Confirmation Modal Styles */
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
  padding: 1rem;
}

.modal-content {
  width: 100%;
  max-width: min(90vw, 500px);
  padding: clamp(1rem, 3vw, 2rem);
  max-height: min(90vh, 600px);
  overflow-y: auto;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: clamp(0.75rem, 2vw, 1rem);
  padding-bottom: clamp(0.5rem, 1.5vw, 0.75rem);
  border-bottom: 2px solid #e9ecef;
}

.modal-header h3 {
  font-size: clamp(1.1rem, 2vw, 1.5rem);
  margin: 0;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #6c757d;
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.close-btn:hover {
  background-color: #f8f9fa;
  color: #dc3545;
}

.modal-body {
  margin-bottom: clamp(0.75rem, 2vw, 1rem);
}

.delete-warning-text {
  font-size: clamp(1rem, 1.5vw, 1.2rem);
  margin-bottom: 1rem;
  color: #333;
  line-height: 1.5;
}

.delete-warning-text strong {
  color: #dc3545;
}

.delete-contact-preview {
  background-color: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  padding: 1rem;
  margin: 1rem 0;
}

.preview-row {
  padding: 0.5rem 0;
  border-bottom: 1px solid #e9ecef;
  font-size: clamp(0.9rem, 1.3vw, 1rem);
}

.preview-row:last-child {
  border-bottom: none;
}

.preview-row strong {
  color: #495057;
  margin-right: 0.5rem;
}

.delete-warning-note {
  background-color: #fff3cd;
  border: 1px solid #ffc107;
  border-radius: 4px;
  padding: 0.75rem;
  margin-top: 1rem;
  font-size: clamp(0.85rem, 1.2vw, 0.95rem);
  color: #856404;
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
}

.delete-warning-note i {
  color: #ffc107;
  font-size: 1.1rem;
  margin-top: 0.1rem;
  flex-shrink: 0;
}

.form-actions {
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
  margin-top: clamp(0.75rem, 2vw, 1rem);
}

.cancel-btn {
  background-color: #ddd;
  color: #333;
  padding: clamp(0.4rem, 1vw, 0.6rem) clamp(0.8rem, 2vw, 1.2rem);
  font-size: clamp(0.85rem, 1.3vw, 1rem);
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.cancel-btn:hover {
  background-color: #bbb;
}

.delete-confirm-btn {
  background-color: #dc3545;
  color: white;
  padding: clamp(0.4rem, 1vw, 0.6rem) clamp(0.8rem, 2vw, 1.2rem);
  font-size: clamp(0.85rem, 1.3vw, 1rem);
  border: none;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: background-color 0.3s ease;
}

.delete-confirm-btn:hover:not(:disabled) {
  background-color: #c82333;
}

.delete-confirm-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.delete-confirm-btn .material-symbols-outlined {
  font-size: 1.1rem;
}

@media only screen and (max-width: 480px) {
  .modal-content {
    width: 95vw;
    padding: clamp(0.75rem, 3vw, 1.25rem);
    border-radius: 6px;
  }

  .delete-contact-preview {
    padding: 0.75rem;
  }

  .preview-row {
    padding: 0.4rem 0;
    font-size: clamp(0.85rem, 1.2vw, 0.9rem);
  }

  .delete-warning-note {
    padding: 0.6rem;
    font-size: clamp(0.8rem, 1.1vw, 0.85rem);
  }
}
</style>


