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
          <span class="material-symbols-outlined">send</span>
        </button>
        <button @click="refreshMessages" class="action-btn" aria-label="Refresh Messages" :disabled="Loading">
          <span class="material-symbols-outlined">refresh</span>
        </button>
        <button @click="showBalanceModal = true" class="action-btn balance-btn" aria-label="Check Balance">
          <span class="material-symbols-outlined">account_balance_wallet</span>
        </button>
      </div>
      <div class="header-object2" v-if="accountBalance !== null">
        <div class="balance-display">
          <span class="balance-label">SMS Balance:</span>
          <span class="balance-amount">{{ formatBalance(accountBalance) }}</span>
        </div>
      </div>
    </div>

    <!-- Messages Table -->
    <div class="table-container">
      <!-- Desktop Table View - Scrollable -->
      <Scrollable>
      <table class="students-table desktop-table">
        <thead>
          <tr>
            <th class="col-num">#</th>
            <th class="col-date">Date Sent</th>
            <th class="col-subject">Subject</th>
            <th class="col-recipients">Recipients</th>
            <th class="col-status">Status</th>
            <th class="actions-header">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="filteredMessages.length === 0">
            <td colspan="6">No messages found</td>
          </tr>
          <tr
            v-for="(message, index) in filteredMessages"
            :key="message.messageID"
            :class="{ 'even-row': index % 2 !== 0 }"
          >
            <td class="col-num">{{ index + 1 }}</td>
            <td class="col-date">{{ message.sentDate }}</td>
            <td class="col-subject">{{ message.subject }}</td>
            <td class="col-recipients">{{ message.recipientCount }} School(s)</td>
            <td class="col-status" :class="{ 'text-success': message.status === 'Sent', 'text-warning': message.status === 'Pending' }">
              {{ message.status }}
            </td>
            <td class="actions">
              <button @click="viewMessage(message)" class="manage-btn" aria-label="View Message">
                <span class="material-symbols-outlined">visibility</span>
              </button>
              <button @click="resendMessage(message)" class="class-list-btn" aria-label="Resend Message" :disabled="Loading">
                <span class="material-symbols-outlined">send</span>
              </button>
              <button @click="confirmDeleteMessage(message)" class="class-list-btn delete-btn" aria-label="Delete Message" :disabled="Loading">
                <span class="material-symbols-outlined">delete</span>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      </Scrollable>

      <!-- Mobile Card View -->
      <div class="mobile-cards" v-if="filteredMessages.length > 0">
        <div v-for="(message, index) in filteredMessages" :key="message.messageID" class="message-card">
          <div class="card-header">
            <div class="card-number">{{ index + 1 }}</div>
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
            <button @click="viewMessage(message)" class="card-action-btn manage-btn" aria-label="View Message">
              <span class="material-symbols-outlined">visibility</span>
            </button>
            <button @click="resendMessage(message)" class="card-action-btn class-list-btn" aria-label="Resend Message" :disabled="Loading">
              <span class="material-symbols-outlined">send</span>
            </button>
            <button @click="confirmDeleteMessage(message)" class="card-action-btn class-list-btn delete-btn" aria-label="Delete Message" :disabled="Loading">
              <span class="material-symbols-outlined">delete</span>
            </button>
          </div>
        </div>
      </div>

      <div v-if="filteredMessages.length === 0" class="no-data-message">
        No messages found
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
              <strong>Message ID:</strong>
              <span>{{ selectedMessageForView.messageID }}</span>
            </div>
            <div class="detail-row">
              <strong>Date Sent:</strong>
              <span>{{ selectedMessageForView.sentDate }}</span>
            </div>
            <div class="detail-row">
              <strong>Subject:</strong>
              <span>{{ selectedMessageForView.subject }}</span>
            </div>
            <div class="detail-row">
              <strong>Status:</strong>
              <span :class="{ 'text-success': selectedMessageForView.status === 'Sent', 'text-warning': selectedMessageForView.status === 'Pending' }">
                {{ selectedMessageForView.status }}
              </span>
            </div>
            <div class="detail-row" v-if="selectedMessageForView.phoneNo">
              <strong>Phone Number:</strong>
              <span>{{ selectedMessageForView.phoneNo }}</span>
            </div>
            <div class="detail-row">
              <strong>Recipients ({{ selectedMessageForView.recipients?.length || selectedMessageForView.recipientCount || 0 }}):</strong>
              <div class="recipients-list">
                <span v-for="recipient in selectedMessageForView.recipients" :key="recipient.schoolCode" class="recipient-badge">
                  {{ recipient.schoolName }} ({{ recipient.schoolCode }})
                </span>
                <span v-if="(!selectedMessageForView.recipients || selectedMessageForView.recipients.length === 0) && selectedMessageForView.phoneNo" class="recipient-badge">
                  {{ selectedMessageForView.phoneNo }}
                </span>
              </div>
            </div>
            <div class="detail-row">
              <strong>Message:</strong>
            </div>
            <div class="message-body">
              {{ selectedMessageForView.messageBody }}
            </div>
          </div>
          <div class="modal-actions">
            <button @click="resendMessageFromModal(selectedMessageForView)" class="modal-action-btn resend-btn" :disabled="Loading" aria-label="Resend Message">
              <span class="material-symbols-outlined">send</span>
            </button>
            <button @click="viewMessagesByPhone(selectedMessageForView.phoneNo)" class="modal-action-btn" v-if="selectedMessageForView.phoneNo" aria-label="View All Messages to this Number">
              <span class="material-symbols-outlined">history</span>
            </button>
            <button @click="confirmDeleteMessageFromModal(selectedMessageForView)" class="modal-action-btn delete-btn" :disabled="Loading" aria-label="Delete Message">
              <span class="material-symbols-outlined">delete</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Balance Modal -->
    <div class="modal-wrap" v-if="showBalanceModal" @click.self="showBalanceModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <h2>SMS Account Balance</h2>
          <button @click="showBalanceModal = false" class="close-btn">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <div class="balance-modal-content">
            <div class="balance-icon">
              <span class="material-symbols-outlined">account_balance_wallet</span>
            </div>
            <div class="balance-value" v-if="balanceLoading">
              <div class="loading-spinner-small"></div>
              <p>Loading balance...</p>
            </div>
            <div class="balance-value" v-else-if="accountBalance !== null">
              <h3>{{ formatBalance(accountBalance) }}</h3>
              <p class="balance-label-text">Available SMS Credits</p>
            </div>
            <div class="balance-value" v-else>
              <p class="error-text">Failed to load balance</p>
            </div>
            <button @click="fetchAccountBalance" class="refresh-balance-btn" :disabled="balanceLoading" aria-label="Refresh Balance">
              <span class="material-symbols-outlined">refresh</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteConfirm" class="modal-overlay" @click.self="showDeleteConfirm = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Confirm Delete Message</h3>
          <button @click="showDeleteConfirm = false" class="close-btn">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <p class="delete-warning-text">
            Are you sure you want to delete <strong>{{ messageToDelete?.subject || 'this message' }}</strong>?
          </p>
          <div class="delete-message-preview" v-if="messageToDelete">
            <div class="preview-row">
              <strong>Message ID:</strong> {{ messageToDelete.messageID }}
            </div>
            <div class="preview-row" v-if="messageToDelete.subject">
              <strong>Subject:</strong> {{ messageToDelete.subject }}
            </div>
            <div class="preview-row" v-if="messageToDelete.sentDate">
              <strong>Date Sent:</strong> {{ messageToDelete.sentDate }}
            </div>
            <div class="preview-row" v-if="messageToDelete.recipientCount !== undefined">
              <strong>Recipients:</strong> {{ messageToDelete.recipientCount }} School(s)
            </div>
            <div class="preview-row" v-if="messageToDelete.status">
              <strong>Status:</strong> {{ messageToDelete.status }}
            </div>
          </div>
          <p class="delete-warning-note">
            <i class="fas fa-exclamation-triangle"></i> This action will permanently delete the message. This cannot be undone.
          </p>
        </div>
        <div class="form-actions">
          <button @click="showDeleteConfirm = false" class="cancel-btn">Cancel</button>
          <button @click="deleteMessageConfirm" class="delete-confirm-btn" :disabled="Loading" aria-label="Delete Message">
            <span class="material-symbols-outlined">delete</span>
          </button>
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
import Scrollable from '../../components/Scrollable.vue';
import NewMessageForm from './NewMessageForm.vue';
import {
  listMessages,
  resendMessage as resendMessageApi,
  deleteMessage as deleteMessageApi,
  getAccountBalance,
  listMessagesByPhone,
} from '../../services/messagesApi';

export default {
  name: 'MessagesToSchools',
  components: {
    footerCast,
    LoadingSpinner,
    Scrollable: Scrollable,
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
      showBalanceModal: false,
      showDeleteConfirm: false,
      messageToDelete: null,
      searchQuery: '',
      messages: [],
      Loading: false,
      balanceLoading: false,
      accountBalance: null,
    };
  },
  computed: {
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
        const response = await listMessages();

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
            contact: message.contact || null,
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

    refreshMessages() {
      this.fetchMessages();
    },

    async fetchAccountBalance() {
      this.balanceLoading = true;
      const toast = useToast();
      try {
        const response = await getAccountBalance();
        this.accountBalance = response.data;
        if (!this.showBalanceModal) {
          toast.success(`SMS Balance: ${this.formatBalance(this.accountBalance)}`);
        }
      } catch (error) {
        console.error('Error fetching account balance:', error);
        this.accountBalance = null;
        toast.error('Failed to fetch account balance.');
      } finally {
        this.balanceLoading = false;
      }
    },

    formatBalance(balance) {
      if (balance === null || balance === undefined) return 'N/A';
      return typeof balance === 'number' ? balance.toFixed(2) : String(balance);
    },

    async resendMessage(message) {
      if (!message || !message.messageID) {
        const toast = useToast();
        toast.error('Invalid message. Cannot resend.');
        return;
      }

      const toast = useToast();
      this.Loading = true;
      try {
        console.log('🔄 Attempting to resend message:', message.messageID);
        console.log('📋 Full message object:', message);
        
        const response = await resendMessageApi(message.messageID);
        
        console.log('✅ Resend response received:', response);
        
        if (response.status === 200 || response.status === 201) {
          toast.success('Message resent successfully!');
          await this.fetchMessages(); // Refresh the list
        } else {
          toast.error(`Failed to resend message. Status: ${response.status}`);
        }
      } catch (error) {
        console.error('❌ Error resending message:', error);
        console.error('❌ Error details:', {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data,
          config: error.config,
        });
        
        let errorMsg = 'Failed to resend message.';
        
        if (error.response) {
          const status = error.response.status;
          const errorData = error.response.data;
          
          if (status === 400) {
            errorMsg = `Invalid request (400). `;
            if (errorData?.message) {
              errorMsg += errorData.message;
            } else if (typeof errorData === 'string') {
              errorMsg += errorData;
            } else {
              errorMsg += 'The message ID may be invalid or the message cannot be resent.';
            }
          } else if (status === 404) {
            errorMsg = 'Message not found. It may have been deleted.';
          } else if (status === 500) {
            errorMsg = 'Server error. The message may have already been sent or there was an issue with the SMS service.';
          } else {
            errorMsg = errorData?.message || errorData?.error || error.message || `Server returned status ${status}`;
          }
        } else {
          errorMsg = error.message || 'Network error occurred.';
        }
        
        toast.error(errorMsg, { timeout: 6000 });
      } finally {
        this.Loading = false;
      }
    },

    async resendMessageFromModal(message) {
      await this.resendMessage(message);
      this.closeViewModal();
    },

    confirmDeleteMessage(message) {
      this.messageToDelete = message;
      this.showDeleteConfirm = true;
    },

    confirmDeleteMessageFromModal(message) {
      this.showDeleteConfirm = true;
      this.messageToDelete = message;
      this.closeViewModal();
    },

    async deleteMessageConfirm() {
      if (!this.messageToDelete || !this.messageToDelete.messageID) {
        const toast = useToast();
        toast.error('Invalid message. Cannot delete.');
        return;
      }

      const toast = useToast();
      this.Loading = true;
      try {
        const response = await deleteMessageApi(this.messageToDelete.messageID);
        if (response.status === 200 || response.status === 201) {
          toast.success('Message deleted successfully!');
          this.showDeleteConfirm = false;
          this.messageToDelete = null;
          await this.fetchMessages(); // Refresh the list
        } else {
          toast.error('Failed to delete message.');
        }
      } catch (error) {
        console.error('Error deleting message:', error);
        const errorMsg = error.response?.data?.message || error.message || 'Failed to delete message.';
        toast.error(errorMsg);
      } finally {
        this.Loading = false;
      }
    },

    async viewMessagesByPhone(phoneNo) {
      if (!phoneNo) {
        const toast = useToast();
        toast.warning('Phone number not available for this message.');
        return;
      }

      const toast = useToast();
      this.Loading = true;
      try {
        const response = await listMessagesByPhone(phoneNo);
        if (response.data && Array.isArray(response.data)) {
          const messagesForPhone = response.data.map(message => ({
            messageID: message.messageID || message.id,
            subject: message.fullname || `Message to ${message.phoneNo || 'Unknown'}`,
            messageBody: message.message || '',
            sentDate: message.sentOn || message.sent_date || 'N/A',
            status: message.status || 'Pending',
            phoneNo: message.phoneNo || '',
          }));
          
          // Show messages in modal or filter the current view
          this.messages = messagesForPhone;
          toast.success(`Showing ${messagesForPhone.length} message(s) for ${phoneNo}`);
          this.closeViewModal();
        } else {
          toast.info('No messages found for this phone number.');
        }
      } catch (error) {
        console.error('Error fetching messages by phone:', error);
        toast.error('Failed to fetch messages for this phone number.');
      } finally {
        this.Loading = false;
      }
    },
  },
  mounted() {
    this.fetchMessages();
    this.fetchAccountBalance(); // Load balance on mount
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
  color: #333;
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

.search-actions {
  display: flex;
  gap: clamp(0.3rem, 1vw, 0.5rem);
  align-items: center;
  flex-wrap: wrap;
  flex: 1;
  min-width: 200px;
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
  gap: clamp(0.3rem, 1vw, 0.5rem);
  flex-wrap: wrap;
}

.header-object2 {
  display: flex;
  align-items: center;
}

.balance-display {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: clamp(0.4rem, 1vw, 0.6rem) clamp(0.75rem, 1.5vw, 1rem);
  background-color: #e3f2fd;
  border: 2px solid #4368b9;
  border-radius: 6px;
  font-weight: 600;
}

.balance-label {
  color: #4368b9;
  font-size: clamp(0.85rem, 1.2vw, 0.95rem);
}

.balance-amount {
  color: #2b4d8a;
  font-size: clamp(1rem, 1.5vw, 1.2rem);
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

.action-btn:hover:not(:disabled) {
  background-color: #2b4d8a;
}

.action-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.action-btn.balance-btn {
  background-color: #28a745;
}

.action-btn.balance-btn:hover:not(:disabled) {
  background-color: #218838;
}

.action-btn .material-symbols-outlined {
  margin-right: 0.3rem;
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

.students-table {
  display: table !important;
  width: 100%;
  border-collapse: collapse;
  border-spacing: 0;
  border: 1px solid #ddd;
  font-size: clamp(0.8rem, 1.2vw, 1rem);
}

.students-table th,
.students-table td {
  white-space: nowrap;
  padding: 0.3rem 0.5rem;
  line-height: 1.2;
  text-align: left;
  border-bottom: 1px solid #ddd;
  vertical-align: middle;
  border: 1px solid #ddd;
}

.students-table tbody tr {
  height: auto;
}

.students-table thead th {
  background-color: #f1f1f1;
  font-weight: 600;
  border-bottom: 2px solid #ddd;
  position: sticky;
  top: 0;
  z-index: 10;
}

/* Column widths - proportional to content */
.students-table th.col-num,
.students-table td.col-num {
  width: 1%;
  white-space: nowrap;
}

.students-table th.col-date,
.students-table td.col-date {
  width: 1%;
  white-space: nowrap;
}

.students-table th.col-subject,
.students-table td.col-subject {
  width: 1%;
  max-width: 200px;
  white-space: normal;
  word-break: break-word;
}

.students-table th.col-recipients,
.students-table td.col-recipients {
  width: 1%;
  white-space: nowrap;
}

.students-table th.col-status,
.students-table td.col-status {
  width: 1%;
  white-space: nowrap;
}

.students-table thead th.actions-header,
.students-table td.actions {
  width: 1%;
  max-width: 90px;
  min-width: 0;
  white-space: nowrap;
  padding: 0.15rem 0.25rem;
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
  flex-direction: column;
  gap: 0.5rem;
}

.card-action-btn {
  width: 100%;
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
  border: none;
}

.card-action-btn:hover {
  transform: translateY(-1px);
}

.card-action-btn.manage-btn {
  background-color: #e0e7ff;
  color: #4f46e5;
  border: 1px solid #c7d2fe;
}

.card-action-btn.manage-btn:hover:not(:disabled) {
  background-color: #d1d5db;
}

.card-action-btn.class-list-btn {
  background-color: #e0e7ff;
  color: #4f46e5;
  border: 1px solid #c7d2fe;
}

.card-action-btn.class-list-btn:hover:not(:disabled) {
  background-color: #d4d7ff;
}

.card-action-btn.class-list-btn.delete-btn {
  background-color: #dc3545;
  color: white;
  border: 1px solid #c82333;
}

.card-action-btn.class-list-btn.delete-btn:hover:not(:disabled) {
  background-color: #c82333;
}

.card-action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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
  padding: clamp(0.5rem, 1vw, 1rem);
  width: 1%;
  white-space: nowrap;
}

.actions {
  display: flex;
  justify-content: flex-start;
  gap: clamp(0.15rem, 0.5vw, 0.4rem);
  flex-wrap: nowrap;
  align-items: center;
  width: 1%;
}

.manage-btn,
.class-list-btn {
  background-color: #e0e7ff;
  color: #4f46e5;
  border: 1px solid #c7d2fe;
  padding: clamp(0.2rem, 0.5vw, 0.35rem) clamp(0.4rem, 0.9vw, 0.6rem);
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.15rem;
  font-size: clamp(0.65rem, 1vw, 0.8rem);
  transition: all 0.3s ease;
  white-space: nowrap;
}

.manage-btn .material-symbols-outlined,
.class-list-btn .material-symbols-outlined {
  font-size: 0.95rem;
}

.manage-btn:hover:not(:disabled) {
  background-color: #d1d5db;
  transform: translateY(-1px);
}

.class-list-btn:hover:not(:disabled) {
  background-color: #d4d7ff;
  transform: translateY(-1px);
}

.class-list-btn.delete-btn {
  background-color: #dc3545;
  color: white;
  border: 1px solid #c82333;
}

.class-list-btn.delete-btn:hover:not(:disabled) {
  background-color: #c82333;
}

.manage-btn:disabled,
.class-list-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.text-success {
  color: #2b7ab7 !important;
  font-weight: bold;
  font-style: italic;
}

.text-warning {
  color: #ffc107 !important;
  font-weight: 600;
}

.text-danger {
  color: red !important;
  font-weight: bold;
  font-style: italic;
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
  max-width: clamp(300px, 92vw, 520px);
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: clamp(1.25rem, 2.5vw, 1.75rem);
  border-bottom: none;
  background: linear-gradient(135deg, #4368b9 0%, #2b4d8a 100%);
  color: white;
  border-radius: 8px 8px 0 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.modal-header h2 {
  margin: 0;
  font-size: clamp(1.2rem, 2.2vw, 1.6rem);
  font-weight: 600;
  letter-spacing: 0.3px;
}

.close-btn {
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  font-size: clamp(1.1rem, 1.8vw, 1.4rem);
  cursor: pointer;
  padding: 0;
  width: clamp(32px, 4.5vw, 36px);
  height: clamp(32px, 4.5vw, 36px);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.25);
  border-color: rgba(255, 255, 255, 0.3);
  transform: rotate(90deg);
}

.modal-body {
  padding: clamp(1.5rem, 3vw, 2rem);
  background: linear-gradient(to bottom, #fafbfc 0%, #ffffff 100%);
}

.message-details {
  display: flex;
  flex-direction: column;
  gap: clamp(1rem, 2vw, 1.5rem);
}

.detail-row {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  gap: 1rem;
  padding: clamp(0.75rem, 1.5vw, 1rem);
  background-color: #ffffff;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease;
}

.detail-row:hover {
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
  border-color: #dee2e6;
}

.detail-row strong {
  color: #4368b9;
  font-size: clamp(0.85rem, 1.3vw, 0.95rem);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 600;
  min-width: 140px;
  flex-shrink: 0;
}

.detail-row > span,
.detail-row > div:not(.recipients-list) {
  color: #495057;
  font-size: clamp(0.9rem, 1.4vw, 1rem);
  flex: 1;
  line-height: 1.5;
}

.detail-row:has(.recipients-list) {
  flex-direction: column;
  align-items: stretch;
}

.detail-row:has(.recipients-list) strong {
  min-width: auto;
  margin-bottom: 0.5rem;
}

.recipients-list {
  display: flex;
  flex-wrap: wrap;
  gap: clamp(0.5rem, 1.2vw, 0.75rem);
  margin-top: 0.25rem;
  width: 100%;
}

.recipient-badge {
  background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
  color: #4368b9;
  padding: clamp(0.5rem, 1.2vw, 0.7rem) clamp(0.9rem, 1.8vw, 1.2rem);
  border-radius: 20px;
  font-size: clamp(0.85rem, 1.2vw, 0.95rem);
  font-weight: 500;
  border: 1px solid rgba(67, 104, 185, 0.3);
  box-shadow: 0 1px 3px rgba(67, 104, 185, 0.1);
  transition: all 0.2s ease;
}

.recipient-badge:hover {
  background: linear-gradient(135deg, #bbdefb 0%, #90caf9 100%);
  transform: translateY(-1px);
  box-shadow: 0 2px 5px rgba(67, 104, 185, 0.2);
}

.message-body {
  background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
  padding: clamp(1rem, 2vw, 1.5rem);
  border-radius: 8px;
  border: 1px solid #e9ecef;
  border-left: 4px solid #4368b9;
  margin-top: 0.5rem;
  white-space: pre-wrap;
  line-height: 1.8;
  font-size: clamp(0.9rem, 1.4vw, 1.05rem);
  color: #2c3e50;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  position: relative;
}

.message-body::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, #4368b9 0%, transparent 100%);
  border-radius: 8px 8px 0 0;
}

.modal-actions {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  margin-top: clamp(0.75rem, 2vw, 1rem);
  padding-top: clamp(0.75rem, 2vw, 1rem);
  border-top: 2px solid #e9ecef;
  flex-wrap: wrap;
  background-color: #f8f9fa;
  padding-left: 0;
  padding-right: 0;
  padding-bottom: clamp(1rem, 2vw, 1.5rem);
  border-radius: 0 0 8px 8px;
}

.modal-action-btn {
  padding: clamp(0.4rem, 1vw, 0.6rem) clamp(0.8rem, 2vw, 1.2rem);
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: clamp(0.85rem, 1.3vw, 1rem);
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: background-color 0.3s ease;
  justify-content: center;
  min-width: 0;
}

.modal-action-btn.resend-btn {
  background-color: #4368b9;
  color: white;
}

.modal-action-btn.resend-btn:hover:not(:disabled) {
  background-color: #2b4d8a;
}

.modal-action-btn.delete-btn {
  background-color: #dc3545;
  color: white;
}

.modal-action-btn.delete-btn:hover:not(:disabled) {
  background-color: #c82333;
}

.modal-action-btn:not(.resend-btn):not(.delete-btn) {
  background-color: #6c757d;
  color: white;
}

.modal-action-btn:not(.resend-btn):not(.delete-btn):hover {
  background-color: #5a6268;
}

.modal-action-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.modal-action-btn .material-symbols-outlined {
  font-size: 1.1rem;
}

.balance-modal-content {
  text-align: center;
  padding: 2rem 1rem;
}

.balance-icon {
  font-size: 4rem;
  color: #4368b9;
  margin-bottom: 1rem;
}

.balance-icon .material-symbols-outlined {
  font-size: 4rem;
}

.balance-value h3 {
  font-size: 2.5rem;
  color: #4368b9;
  margin: 1rem 0;
  font-weight: 700;
}

.balance-label-text {
  color: #666;
  font-size: 1rem;
  margin-top: 0.5rem;
}

.error-text {
  color: #dc3545;
  font-size: 1rem;
}

.refresh-balance-btn {
  margin-top: 1.5rem;
  padding: 0.75rem 1.5rem;
  background-color: #4368b9;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  transition: background-color 0.3s;
}

.refresh-balance-btn:hover:not(:disabled) {
  background-color: #2b4d8a;
}

.refresh-balance-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.loading-spinner-small {
  border: 3px solid #f3f3f3;
  border-top: 3px solid #4368b9;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 1rem auto;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Delete Confirmation Modal Styles (matching Contacts delete modal) */
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

.modal-overlay .modal-content {
  width: 100%;
  max-width: min(90vw, 500px);
  padding: clamp(1rem, 3vw, 2rem);
  max-height: min(90vh, 600px);
  overflow-y: auto;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.modal-overlay .modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: clamp(0.75rem, 2vw, 1rem);
  padding-bottom: clamp(0.5rem, 1.5vw, 0.75rem);
  border-bottom: 2px solid #e9ecef;
}

.modal-overlay .modal-header h3 {
  font-size: clamp(1.1rem, 2vw, 1.5rem);
  margin: 0;
  color: #333;
}

.modal-overlay .close-btn {
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

.modal-overlay .close-btn:hover {
  background-color: #f8f9fa;
  color: #dc3545;
}

.modal-overlay .modal-body {
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

.delete-message-preview {
  background-color: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  padding: 1rem;
  margin: 1rem 0;
}

.delete-message-preview .preview-row {
  padding: 0.5rem 0;
  border-bottom: 1px solid #e9ecef;
  font-size: clamp(0.9rem, 1.3vw, 1rem);
}

.delete-message-preview .preview-row:last-child {
  border-bottom: none;
}

.delete-message-preview .preview-row strong {
  color: #495057;
  margin-right: 0.5rem;
}

.delete-warning-note {
  background-color: #fff3cd;
  border: 1px solid #ffc107;
  border-radius: 4px;
  padding: 0.75rem;
  margin: 1rem 0;
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

.modal-overlay .form-actions {
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
  margin-top: clamp(0.75rem, 2vw, 1rem);
}

/* Delete modal buttons – previous colors, wider for better appeal */
.modal-overlay .cancel-btn {
  background-color: #ddd;
  color: #333;
  padding: 0.5rem 1.4rem;
  min-width: 100px;
  font-size: clamp(0.85rem, 1.3vw, 1rem);
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.modal-overlay .cancel-btn:hover {
  background-color: #bbb;
}

.modal-overlay .delete-confirm-btn {
  background-color: #dc3545;
  color: white;
  padding: 0.5rem 1.4rem;
  min-width: 110px;
  font-size: clamp(0.85rem, 1.3vw, 1rem);
  border: none;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: background-color 0.3s ease;
}

.modal-overlay .delete-confirm-btn:hover:not(:disabled) {
  background-color: #c82333;
}

.modal-overlay .delete-confirm-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.modal-overlay .delete-confirm-btn .material-symbols-outlined {
  font-size: 1.1rem;
}

@media only screen and (max-width: 480px) {
  .modal-overlay .modal-content {
    width: 95vw;
    padding: clamp(0.75rem, 3vw, 1.25rem);
    border-radius: 6px;
  }

  .delete-message-preview {
    padding: 0.75rem;
  }

  .delete-message-preview .preview-row {
    padding: 0.4rem 0;
    font-size: clamp(0.85rem, 1.2vw, 0.9rem);
  }

  .delete-warning-note {
    padding: 0.6rem;
    font-size: clamp(0.8rem, 1.1vw, 0.85rem);
  }
}

/* Responsive Breakpoints */
@media only screen and (max-width: 1400px) {
  .students-table th,
  .students-table td {
    padding: 0.3rem 0.5rem;
  }
}

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
  }

  .search-actions {
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

  .header-object2 {
    width: 100%;
    margin-top: 0.5rem;
  }

  .balance-display {
    width: 100%;
    justify-content: center;
  }

  .action-btn {
    width: 100%;
    justify-content: center;
  }

  .card-footer {
    flex-wrap: wrap;
  }

  .card-action-btn {
    flex: 1;
    min-width: 100px;
  }

  .modal-actions {
    flex-direction: column;
  }

  .modal-action-btn {
    width: 100%;
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

  .search-actions {
    flex-direction: column;
    width: 100%;
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

