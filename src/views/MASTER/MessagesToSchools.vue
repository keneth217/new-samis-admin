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

      <!-- Desktop Table View -->
      <table class="students-table desktop-table">
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

      <!-- Mobile Card View -->
      <div class="mobile-cards" v-if="displayedMessages.length > 0">
        <div v-for="(message, index) in displayedMessages" :key="message.messageID" class="message-card">
          <div class="card-header">
            <div class="card-number">{{ (currentPage - 1) * messagesPerPage + index + 1 }}</div>
            <h3 class="card-title">{{ message.subject }}</h3>
          </div>
          
          <div class="card-body">
            <div class="card-row">
              <span class="card-label">Date Sent:</span>
              <span class="card-value">{{ message.sentDate }}</span>
            </div>
            
            <div class="card-row">
              <span class="card-label">Recipients:</span>
              <span class="card-value">{{ message.recipientCount }} School(s)</span>
            </div>
            
            <div class="card-row">
              <span class="card-label">Status:</span>
              <span class="card-value" :class="{ 'text-success': message.status === 'Sent', 'text-warning': message.status === 'Pending' }">
                {{ message.status }}
              </span>
            </div>
          </div>
          
          <div class="card-footer">
            <button @click="viewMessage(message)" class="card-action-btn" aria-label="View Message">
              <span class="material-symbols-outlined">visibility</span> View
            </button>
          </div>
        </div>
      </div>

      <div v-if="displayedMessages.length === 0" class="no-data-message">
        No messages found
      </div>
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
import axios from '../../axios';
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
      try {
        const response = await axios.post('/messages/list');

        if (response.data && Array.isArray(response.data)) {
          this.messages = response.data.map(message => ({
            messageID: message.messageID || message.id,
            subject: message.fullname || `Message to ${message.phoneNo || 'Unknown'}`,
            messageBody: message.message || '',
            sentDate: message.sentOn || message.sent_date || 'N/A',
            status: message.status || 'Pending',
            recipientCount: 1,
            recipients: [
              {
                schoolName: message.fullname || 'Unknown',
                schoolCode: '',
              },
            ],
            phoneNo: message.phoneNo || '',
          }));

          if (this.messages.length > 0) {
            toast.success('Messages fetched successfully!');
          } else {
            toast.info('No messages found.');
          }
        } else {
          this.messages = [];
          toast.error('No messages found in the response.');
        }
      } catch (error) {
        console.error('Error fetching messages:', error);
        toast.error('Failed to fetch messages. Please try again.');
      } finally {
        this.Loading = false;
      }
    },
  },
  mounted() {
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
  padding: clamp(0.5rem, 2vw, 1rem);
  background-color: #f4f6fa;
  width: 100%;
  min-height: calc(100vh - 4.5rem);
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

.header-container1 {
  width: 100%;
  overflow: visible;
  word-wrap: break-word;
  overflow-wrap: break-word;
  padding-left: 0;
  margin-left: 0;
  position: relative;
  margin-bottom: 0;
}

.header-container1 h2 {
  color: #4368b9;
  font-size: clamp(1.1rem, 2.5vw, 1.5rem);
  font-weight: 600;
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
  gap: clamp(0.5rem, 1.5vw, 1rem);
  flex-wrap: wrap;
}

.action-btn {
  background-color: #4368b9;
  color: white;
  border: none;
  padding: clamp(0.6rem, 1.2vw, 0.9rem) clamp(1rem, 2vw, 1.5rem);
  border-radius: 4px;
  cursor: pointer;
  font-size: clamp(0.9rem, 1.5vw, 1rem);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: background-color 0.3s;
  white-space: nowrap;
}

.action-btn:hover {
  background-color: #2b4d8a;
}

.action-btn .material-symbols-outlined {
  font-size: clamp(1rem, 2vw, 1.2rem);
}

.table-container {
  background-color: white;
  border-radius: 8px;
  padding: clamp(0.75rem, 1.5vw, 1.5rem);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.students-controls {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: clamp(0.5rem, 1.5vw, 1rem);
  margin-bottom: clamp(0.5rem, 1.5vw, 1rem);
  flex-wrap: wrap;
}

.students-controls label {
  font-weight: 500;
  font-size: clamp(0.9rem, 1.3vw, 1rem);
  white-space: nowrap;
}

.form-control {
  padding: clamp(0.4rem, 1vw, 0.6rem);
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: clamp(0.9rem, 1.3vw, 1rem);
  min-width: 100px;
}

.form-control:focus {
  border-color: #4368b9;
  box-shadow: 0 0 0 2px rgba(67, 104, 185, 0.2);
  outline: none;
}

.students-table {
  display: table !important;
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 1rem;
  font-size: clamp(0.8rem, 1.2vw, 1rem);
  border: 1px solid #ddd;
}

.students-table thead {
  background-color: #4368b9;
  color: white;
}

.students-table th {
  padding: clamp(0.75rem, 1.5vw, 1rem);
  text-align: left;
  font-weight: 600;
  border: 1px solid rgba(255, 255, 255, 0.2);
  position: sticky;
  top: 0;
  z-index: 10;
}

.students-table td {
  padding: clamp(0.75rem, 1.5vw, 1rem);
  border-bottom: 1px solid #ddd;
  border: 1px solid #ddd;
  word-break: break-word;
}

.students-table tbody tr:hover {
  background-color: #f9f9f9;
}

.students-table tbody tr.even-row {
  background-color: #f7f9fc;
}

/* Mobile Card View - Hidden by default */
.mobile-cards {
  display: none;
}

/* Card Styles */
.message-card {
  background: white;
  border: 1px solid #e1e4ea;
  border-radius: 8px;
  margin-bottom: 1rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: box-shadow 0.3s ease;
}

.message-card:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.card-header {
  background: linear-gradient(135deg, #4368b9 0%, #2b4d8a 100%);
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
  white-space: normal;
  line-height: 1.3;
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
  background-color: #28a745;
  color: white;
  border: none;
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

.card-action-btn:hover {
  background-color: #218838;
  transform: translateY(-1px);
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

.actions-header {
  text-align: center;
  padding: clamp(0.75rem, 1.5vw, 1rem);
}

.actions {
  display: flex;
  gap: clamp(0.3rem, 1vw, 0.5rem);
  justify-content: center;
  flex-wrap: wrap;
}

.manage-btn {
  background-color: #28a745;
  color: white;
  border: none;
  padding: clamp(0.4rem, 1vw, 0.6rem) clamp(0.75rem, 1.5vw, 1rem);
  border-radius: 4px;
  cursor: pointer;
  font-size: clamp(0.8rem, 1.2vw, 0.9rem);
  display: flex;
  align-items: center;
  gap: 0.25rem;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.manage-btn:hover {
  background-color: #218838;
  transform: translateY(-1px);
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: clamp(0.5rem, 1.5vw, 1rem);
  margin-top: clamp(0.5rem, 1.5vw, 1rem);
  flex-wrap: wrap;
}

.pagination button {
  padding: clamp(0.4rem, 1vw, 0.6rem) clamp(0.75rem, 1.5vw, 1rem);
  border: 2px solid #4368b9;
  background-color: white;
  color: #4368b9;
  border-radius: 4px;
  cursor: pointer;
  font-size: clamp(0.8rem, 1.2vw, 1rem);
  transition: all 0.3s ease;
  min-width: 80px;
}

.pagination button:hover:not(:disabled) {
  background-color: #4368b9;
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

.text-success {
  color: #28a745 !important;
  font-weight: 600;
}

.text-warning {
  color: #ffc107 !important;
  font-weight: 600;
}

.text-danger {
  color: #dc3545 !important;
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
  padding: 1rem;
}

.modal-content {
  background-color: white;
  border-radius: 8px;
  width: 100%;
  max-width: clamp(300px, 90vw, 800px);
  max-height: min(90vh, 800px);
  overflow-y: auto;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.message-modal {
  max-width: clamp(300px, 95vw, 900px);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: clamp(1rem, 2vw, 1.5rem);
  border-bottom: 1px solid #ddd;
  background-color: #4368b9;
  color: white;
  border-radius: 8px 8px 0 0;
}

.modal-header h2 {
  margin: 0;
  font-size: clamp(1.1rem, 2vw, 1.5rem);
}

.close-btn {
  background: none;
  border: none;
  color: white;
  font-size: clamp(1.2rem, 2vw, 1.5rem);
  cursor: pointer;
  padding: 0;
  width: clamp(28px, 4vw, 30px);
  height: clamp(28px, 4vw, 30px);
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
  padding: clamp(1rem, 2vw, 1.5rem);
}

.message-details {
  display: flex;
  flex-direction: column;
  gap: clamp(0.75rem, 1.5vw, 1rem);
}

.detail-row {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding-bottom: clamp(0.75rem, 1.5vw, 1rem);
  border-bottom: 1px solid #eee;
}

.detail-row:last-of-type {
  border-bottom: none;
}

.detail-row strong {
  color: #4368b9;
  font-size: clamp(0.8rem, 1.2vw, 0.9rem);
  text-transform: uppercase;
}

.recipients-list {
  display: flex;
  flex-wrap: wrap;
  gap: clamp(0.4rem, 1vw, 0.5rem);
  margin-top: 0.5rem;
}

.recipient-badge {
  background-color: #e3f2fd;
  color: #4368b9;
  padding: clamp(0.4rem, 1vw, 0.6rem) clamp(0.75rem, 1.5vw, 1rem);
  border-radius: 20px;
  font-size: clamp(0.8rem, 1.2vw, 0.9rem);
  border: 1px solid #4368b9;
}

.message-body {
  background-color: #f9f9f9;
  padding: clamp(0.75rem, 1.5vw, 1rem);
  border-radius: 4px;
  border-left: 4px solid #4368b9;
  margin-top: 0.5rem;
  white-space: pre-wrap;
  line-height: 1.6;
  font-size: clamp(0.85rem, 1.3vw, 1rem);
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

  /* Modal Responsive Styles */
  .modal-wrap {
    padding: 1rem;
  }

  .modal-content {
    width: 100%;
    max-width: min(90vw, 800px);
    padding: clamp(1rem, 3vw, 1.5rem);
    max-height: min(90vh, 600px);
    overflow-y: auto;
  }

  .modal-header h2 {
    font-size: clamp(1rem, 2vw, 1.3rem);
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

  .message-card {
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

  .manage-btn {
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

  .manage-btn {
    font-size: 0.7rem;
    padding: 0.3rem 0.4rem;
  }

  .action-btn {
    font-size: 0.75rem;
    padding: 0.35rem 0.5rem;
  }
}
</style>

