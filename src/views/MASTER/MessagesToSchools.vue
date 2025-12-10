<template>
  <div class="the-page">
    <div class="search-area">
      <!-- Header -->
      <div class="header-container1">
        <h2>Send Messages to Schools</h2>
      </div>
      <input v-model="searchQuery" placeholder="Search by school name or code" class="search-input" />
    </div>

    <!-- Action Buttons -->
    <div class="header-container">
      <div class="header-object1">
        <button @click="openMessageForm" class="action-btn" aria-label="Send Message">
          <span class="material-symbols-outlined">send</span> Send Message
        </button>
      </div>
    </div>

    <!-- Messages Table -->
    <div class="table-container">
      <div class="students-controls">
        <label for="messagesPerPage">Messages per page:</label>
        <select class="form-control" v-model="messagesPerPage" @change="updateMessagesPerPage">
          <option v-for="option in messagesPerPageOptions" :key="option" :value="option">{{ option }}</option>
        </select>
      </div>

      <table class="students-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Date Sent</th>
            <th>Subject</th>
            <th>Recipients</th>
            <th>Status</th>
            <th class="actions-header">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="displayedMessages.length === 0">
            <td colspan="6">No messages found</td>
          </tr>
          <tr
            v-for="(message, index) in displayedMessages"
            :key="message.messageID"
            :class="{ 'even-row': index % 2 !== 0 }"
          >
            <td>{{ (currentPage - 1) * messagesPerPage + index + 1 }}</td>
            <td>{{ message.sentDate }}</td>
            <td>{{ message.subject }}</td>
            <td>{{ message.recipientCount }} School(s)</td>
            <td :class="{ 'text-success': message.status === 'Sent', 'text-warning': message.status === 'Pending' }">
              {{ message.status }}
            </td>
            <td class="actions">
              <button @click="viewMessage(message)" class="manage-btn" aria-label="View Message">
                <span class="material-symbols-outlined">visibility</span> View
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

    <!-- Message Form Modal -->
    <NewMessageForm
      :message="selectedMessage"
      @closeForm="closeMessageForm" 
      @fetchMessages="fetchMessages" 
      v-if="showMessageForm" 
    />

    <!-- View Message Modal -->
    <div class="modal-wrap" v-if="showViewModal" @click.self="closeViewModal">
      <div class="modal-content message-modal">
        <div class="modal-header">
          <h2>Message Details</h2>
          <button @click="closeViewModal" class="close-btn">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body" v-if="selectedMessageForView">
          <div class="message-details">
            <div class="detail-row">
              <strong>Date Sent:</strong> {{ selectedMessageForView.sentDate }}
            </div>
            <div class="detail-row">
              <strong>Subject:</strong> {{ selectedMessageForView.subject }}
            </div>
            <div class="detail-row">
              <strong>Status:</strong> 
              <span :class="{ 'text-success': selectedMessageForView.status === 'Sent', 'text-warning': selectedMessageForView.status === 'Pending' }">
                {{ selectedMessageForView.status }}
              </span>
            </div>
            <div class="detail-row">
              <strong>Recipients ({{ selectedMessageForView.recipients?.length || 0 }}):</strong>
            </div>
            <div class="recipients-list">
              <span v-for="recipient in selectedMessageForView.recipients" :key="recipient.schoolCode" class="recipient-badge">
                {{ recipient.schoolName }} ({{ recipient.schoolCode }})
              </span>
            </div>
            <div class="detail-row">
              <strong>Message:</strong>
            </div>
            <div class="message-body">
              {{ selectedMessageForView.messageBody }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <footerCast />
    <LoadingSpinner :isLoading="Loading" />
  </div>
</template>

<script>
import axios from 'axios';
import { useToast } from 'vue-toastification';
import LoadingSpinner from '../../components/LoadingSpinner.vue';
import footerCast from '../../components/footer.vue';
import NewMessageForm from './NewMessageForm.vue';

export default {
  name: 'MessagesToSchools',
  components: {
    footerCast,
    LoadingSpinner,
    NewMessageForm,
  },
  setup() {
    const toast = useToast();
    return { toast };
  },
  data() {
    return {
      selectedMessage: null,
      selectedMessageForView: null,
      showMessageForm: false,
      showViewModal: false,
      searchQuery: '',
      messages: [],
      Loading: false,
      currentPage: 1,
      messagesPerPage: 15,
      messagesPerPageOptions: [5, 15, 30, 50, 75, 100],
    };
  },
  computed: {
    totalPages() {
      return Math.ceil(this.filteredMessages.length / this.messagesPerPage);
    },
    displayedMessages() {
      const startIndex = (this.currentPage - 1) * this.messagesPerPage;
      const endIndex = Math.min(startIndex + this.messagesPerPage, this.filteredMessages.length);
      return this.filteredMessages.slice(startIndex, endIndex);
    },
    filteredMessages() {
      if (!this.searchQuery.trim()) return this.messages;
      const query = this.searchQuery.toLowerCase();
      return this.messages.filter(message => {
        return (
          (message.subject && message.subject.toLowerCase().includes(query)) ||
          (message.messageBody && message.messageBody.toLowerCase().includes(query))
        );
      });
    },
  },
  methods: {
    openMessageForm() {
      this.selectedMessage = null;
      this.showMessageForm = true;
    },

    closeMessageForm() {
      this.showMessageForm = false;
      this.selectedMessage = null;
    },

    viewMessage(message) {
      this.selectedMessageForView = message;
      this.showViewModal = true;
    },

    closeViewModal() {
      this.showViewModal = false;
      this.selectedMessageForView = null;
    },

    updateMessagesPerPage() {
      this.currentPage = 1;
    },

    prevPage() {
      if (this.currentPage > 1) {
        this.currentPage--;
      }
    },

    nextPage() {
      if (this.currentPage < this.totalPages) {
        this.currentPage++;
      }
    },

    loadDummyMessages() {
      this.messages = [
        {
          messageID: 1,
          subject: 'Monthly Payment Reminder',
          messageBody: 'This is a reminder that your monthly subscription payment is due. Please make payment by the end of this month.',
          sentDate: '2024-01-15',
          status: 'Sent',
          recipientCount: 5,
          recipients: [
            { schoolName: 'St. Mary\'s High School', schoolCode: 'SCH001' },
            { schoolName: 'Nairobi Primary School', schoolCode: 'SCH002' },
            { schoolName: 'Kenya Academy', schoolCode: 'SCH003' },
          ]
        },
        {
          messageID: 2,
          subject: 'System Maintenance Notice',
          messageBody: 'We will be performing system maintenance on January 20th, 2024 from 10:00 PM to 12:00 AM. The system will be temporarily unavailable during this time.',
          sentDate: '2024-01-18',
          status: 'Sent',
          recipientCount: 10,
          recipients: [
            { schoolName: 'Green Valley School', schoolCode: 'SCH004' },
            { schoolName: 'Hillcrest Preparatory', schoolCode: 'SCH005' },
          ]
        },
        {
          messageID: 3,
          subject: 'New Feature Update',
          messageBody: 'We are excited to announce new features in our system. Check your dashboard for updates.',
          sentDate: '2024-01-20',
          status: 'Pending',
          recipientCount: 3,
          recipients: []
        }
      ];
      const toast = useToast();
      toast.success('Loaded dummy messages data for testing!');
    },

    async fetchMessages() {
      this.Loading = true;
      const toast = useToast();
      this.messages = [];

      try {
        const response = await axios.post('/api/messages/list');

        if (response.data && Array.isArray(response.data)) {
          this.messages = response.data.map(message => ({
            messageID: message.messageID || message.id,
            subject: message.subject || 'N/A',
            messageBody: message.messageBody || message.message_body || '',
            sentDate: message.sentDate || message.sent_date || 'N/A',
            status: message.status || 'Pending',
            recipientCount: message.recipientCount || message.recipient_count || 0,
            recipients: message.recipients || []
          }));

          toast.success('Messages fetched successfully!');
        } else {
          toast.error('No messages found in the response.');
          this.loadDummyMessages();
        }
      } catch (error) {
        console.error('Error fetching messages:', error);
        console.log('Loading dummy messages for testing...');
        this.loadDummyMessages();
      } finally {
        this.Loading = false;
      }
    },
  },
  mounted() {
    // Load dummy messages immediately for testing
    this.loadDummyMessages();
    
    // Also try to fetch from API (will fallback to dummy if fails)
    this.fetchMessages();
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
  background-color: #f5f5f5;
  min-height: calc(100vh - 4.5rem);
}

.search-area {
  margin-bottom: 1rem;
}

.header-container1 {
  margin-bottom: 1rem;
}

.header-container1 h2 {
  color: #4368b9;
  font-size: 1.8rem;
  font-weight: 600;
}

.search-input {
  width: 100%;
  max-width: 400px;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.header-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.header-object1 {
  display: flex;
  gap: 1rem;
}

.action-btn {
  background-color: #4368b9;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: background-color 0.3s;
}

.action-btn:hover {
  background-color: #2b4d8a;
}

.table-container {
  background-color: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.students-controls {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.students-controls label {
  font-weight: 500;
}

.form-control {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.students-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 1rem;
}

.students-table thead {
  background-color: #4368b9;
  color: white;
}

.students-table th {
  padding: 1rem;
  text-align: left;
  font-weight: 600;
}

.students-table td {
  padding: 1rem;
  border-bottom: 1px solid #ddd;
}

.students-table tbody tr:hover {
  background-color: #f9f9f9;
}

.students-table tbody tr.even-row {
  background-color: #f9f9f9;
}

.actions-header {
  text-align: center;
}

.actions {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
  flex-wrap: wrap;
}

.manage-btn {
  background-color: #28a745;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  transition: background-color 0.3s;
}

.manage-btn:hover {
  background-color: #218838;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 1rem;
}

.pagination button {
  padding: 0.5rem 1rem;
  border: 1px solid #ddd;
  background-color: white;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.pagination button:hover:not(:disabled) {
  background-color: #f0f0f0;
}

.pagination button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.text-success {
  color: #28a745;
  font-weight: 600;
}

.text-warning {
  color: #ffc107;
  font-weight: 600;
}

.text-danger {
  color: #dc3545;
  font-weight: 600;
}

/* Modal Styles */
.modal-wrap {
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

.modal-content {
  background-color: white;
  border-radius: 8px;
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.message-modal {
  max-width: 900px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #ddd;
  background-color: #4368b9;
  color: white;
  border-radius: 8px 8px 0 0;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.5rem;
}

.close-btn {
  background: none;
  border: none;
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.3s;
}

.close-btn:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

.modal-body {
  padding: 1.5rem;
}

.message-details {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.detail-row {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #eee;
}

.detail-row:last-of-type {
  border-bottom: none;
}

.detail-row strong {
  color: #4368b9;
  font-size: 0.9rem;
  text-transform: uppercase;
}

.recipients-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.recipient-badge {
  background-color: #e3f2fd;
  color: #4368b9;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.9rem;
  border: 1px solid #4368b9;
}

.message-body {
  background-color: #f9f9f9;
  padding: 1rem;
  border-radius: 4px;
  border-left: 4px solid #4368b9;
  margin-top: 0.5rem;
  white-space: pre-wrap;
  line-height: 1.6;
}

/* Responsive Design */
@media only screen and (max-width: 768px) {
  .the-page {
    padding: 0.5rem;
  }

  .table-container {
    padding: 1rem;
    overflow-x: auto;
  }

  .students-table {
    font-size: 0.9rem;
  }

  .students-table th,
  .students-table td {
    padding: 0.5rem;
  }

  .actions {
    flex-direction: column;
  }

  .modal-content {
    width: 95%;
    max-height: 95vh;
  }
}
</style>

