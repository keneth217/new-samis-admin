

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
            <span class="material-symbols-outlined">add_circle</span>
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
        <!-- Desktop Table View - Scrollable -->
        <Scrollable>
        <table class="students-table desktop-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Full Name</th>
              <th>Username</th>
              <th>Email</th>
              <th>Phone No</th>
              <th>User Type</th>
              <th>Privileges</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="filteredUsers.length === 0">
              <td colspan="8">No User found</td>
            </tr>
            <tr
            v-for="(user, index) in filteredUsers"
              :key="user.username"
              :class="{ 'even-row': index % 2 !== 0 }"
            >
            <td>{{ index + 1 }}</td>
              <td>{{ user.fullname }}</td>
              <td>{{ user.username }}</td>
              <td>{{ user.email }}</td>
              <td>{{ user.phoneNo }}</td>
              <td>{{ user.usertype }}</td>
              <td class="priv-cell" :title="formatPrivilegesTitle(user.priviledges)">
                {{ formatPrivileges(user.priviledges) }}
              </td>
              <td class="actions-cell">
                <button class="mini-btn" @click="openEdit(user)">Edit</button>
                <button class="mini-btn danger" @click="resetPassword(user)">Reset Password</button>
              </td>
            </tr>
          </tbody>
        </table>
        </Scrollable>

        <!-- Mobile Card View -->
        <div class="mobile-cards" v-if="filteredUsers.length > 0">
          <div v-for="(user, index) in filteredUsers" :key="user.username" class="user-card">
            <div class="card-header">
              <div class="card-number">{{ index + 1 }}</div>
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
                <span class="card-label">Privileges:</span>
                <span class="card-value">{{ formatPrivileges(user.priviledges) }}</span>
              </div>

              <div class="card-row card-actions">
                <button class="mini-btn" @click="openEdit(user)">Edit</button>
                <button class="mini-btn danger" @click="resetPassword(user)">Reset Password</button>
              </div>
            </div>
          </div>
        </div>

        <div v-if="filteredUsers.length === 0" class="no-data-message">
          No User found
        </div>
      </div>
  
      <NewUser
        :key="'new-user'"
        @closeForm="closeForm"
        @fetchUsers="fetchUsers"
        v-if="show"
      />
  
      <div v-if="showEdit" class="modal-overlay" @click.self="closeEdit">
        <div class="modal">
          <div class="modal-header">
            <h3>Edit User</h3>
            <button class="modal-x" @click="closeEdit">×</button>
          </div>

          <div class="modal-body">
            <div class="form-grid">
              <div class="form-group">
                <label>Full Name</label>
                <input v-model="editForm.fullname" class="form-control" type="text" />
              </div>
              <div class="form-group">
                <label>Username</label>
                <input v-model="editForm.username" class="form-control" type="text" />
              </div>
              <div class="form-group">
                <label>Email</label>
                <input v-model="editForm.email" class="form-control" type="email" />
              </div>
              <div class="form-group">
                <label>Phone No</label>
                <input v-model="editForm.phoneNo" class="form-control" type="text" />
              </div>
              <div class="form-group">
                <label>User Type</label>
                <select v-model="editForm.usertype" class="form-control">
                  <option value="admin">Admin</option>
                  <option value="mod">Moderator</option>
                  <option value="user">User</option>
                </select>
              </div>
            </div>

            <div class="priv-picker">
              <div class="priv-picker-head">
                <div class="priv-title">Privileges</div>
                <div class="priv-actions">
                  <button class="mini-btn" @click="applyDefaultsForType">Apply defaults</button>
                  <button class="mini-btn" @click="selectAllPrivs" v-if="isAdminType">Select all</button>
                  <button class="mini-btn" @click="clearPrivs">Clear</button>
                </div>
              </div>

              <div v-if="privilegeCatalog.length === 0" class="priv-empty">
                Privilege list not loaded (still okay to save other changes).
              </div>

              <div v-else class="priv-list">
                <label v-for="p in privilegeCatalog" :key="p" class="priv-item">
                  <input type="checkbox" :value="p" v-model="editForm.priviledges" />
                  <span>{{ p }}</span>
                </label>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button class="mini-btn" @click="closeEdit">Cancel</button>
            <button class="mini-btn primary" :disabled="savingEdit" @click="saveEdit">
              {{ savingEdit ? 'Saving…' : 'Save changes' }}
            </button>
          </div>
        </div>
      </div>

  
      <LoadingSpinner :isLoading="Loading" />
      <!-- Footer -->
      <footerCast />
    </div>
  </template>

<script>
import footerCast from '../../components/footer.vue';
import Scrollable from '../../components/Scrollable.vue';
import axios from '../../axios';
import { useToast } from 'vue-toastification';
import LoadingSpinner from '../../components/LoadingSpinner.vue';
import NewUser from './NewUser.vue';
import { fetchPrivilegeCatalog, privilegesForUsertype } from '../../utils/userPrivileges';

export default {
  components: {
    footerCast,
    NewUser,
    LoadingSpinner,
    Scrollable,
  },
  setup() {
    const toast = useToast();
    return { toast };
  },
  data() {
    return {
      show: false,
      searchQuery: '',
      users: [],
      Loading: false,
      showEdit: false,
      savingEdit: false,
      privilegeCatalog: [],
      editForm: {
        userID: '',
        fullname: '',
        username: '',
        email: '',
        phoneNo: '',
        usertype: 'user',
        priviledges: [],
      },
    };
  },
  computed: {
    filteredUsers() {
      if (!this.searchQuery.trim()) return this.users;
      const q = this.searchQuery.toLowerCase();
      return this.users.filter((user) => {
        const name = (user.fullname || '').toLowerCase();
        const uname = (user.username || '').toLowerCase();
        return name.includes(q) || uname.includes(q);
      });
    },
    isAdminType() {
      return String(this.editForm.usertype || '').trim().toLowerCase() === 'admin';
    },
  },
  methods: {
    formatRoles(roles) {
      if (!Array.isArray(roles) || roles.length === 0) return '-';
      return roles
        .map((r) => String(r).replace(/^ROLE_/i, '').toUpperCase())
        .join(', ');
    },

    formatPrivileges(list) {
      const arr = Array.isArray(list) ? list : [];
      if (arr.length === 0) return '-';
      const s = arr.map(String).join(', ');
      return s.length > 56 ? `${s.slice(0, 53)}…` : s;
    },

    formatPrivilegesTitle(list) {
      const arr = Array.isArray(list) ? list : [];
      return arr.length ? arr.map(String).join(', ') : '';
    },

    roleFromUsertype(usertype) {
      const type = String(usertype || '').trim().toLowerCase();
      if (type === 'admin') return ['admin'];
      if (type === 'mod') return ['mod'];
      return ['user'];
    },

    openForm() {
      this.show = true;
    },

    closeForm() {
      this.show = false;  // Close the form
    },

    openEdit(user) {
      const u = user || {};
      this.editForm = {
        userID: u.userID,
        fullname: u.fullname || '',
        username: u.username || '',
        email: u.email || '',
        phoneNo: u.phoneNo || '',
        usertype: (u.usertype || 'user').toString().trim().toLowerCase(),
        priviledges: Array.isArray(u.priviledges) ? [...u.priviledges] : [],
      };
      this.showEdit = true;
    },

    closeEdit() {
      this.showEdit = false;
      this.savingEdit = false;
    },

    applyDefaultsForType() {
      const type = String(this.editForm.usertype || '').trim().toLowerCase();
      this.editForm.priviledges = privilegesForUsertype(type, this.privilegeCatalog);
    },

    selectAllPrivs() {
      this.editForm.priviledges = [...this.privilegeCatalog];
    },

    clearPrivs() {
      this.editForm.priviledges = [];
    },

    async saveEdit() {
      const toast = useToast();
      if (!this.editForm.userID) {
        toast.error('Missing userID. Please refresh and try again.');
        return;
      }

      this.savingEdit = true;
      try {
        const usertypeNorm = String(this.editForm.usertype || 'user').trim().toLowerCase();
        const payload = {
          userID: this.editForm.userID,
          fullname: String(this.editForm.fullname || '').trim(),
          username: String(this.editForm.username || '').trim(),
          email: String(this.editForm.email || '').trim(),
          phoneNo: String(this.editForm.phoneNo || '').trim(),
          usertype: usertypeNorm,
          role: this.roleFromUsertype(usertypeNorm),
          priviledges: Array.isArray(this.editForm.priviledges)
            ? this.editForm.priviledges
            : [],
        };

        const res = await axios.post('/auth/update_user', payload);
        if (res.status === 200) {
          toast.success(res.data?.message || 'User updated successfully!');
        } else {
          toast.success('User updated successfully!');
        }
        this.closeEdit();
        await this.fetchUsers();
      } catch (error) {
        const serverResponse = error?.response?.data;
        const msg =
          typeof serverResponse === 'string'
            ? serverResponse
            : (serverResponse?.message || serverResponse?.error || 'Failed to update user.');
        toast.error(msg);
        console.error('Error updating user:', error);
      } finally {
        this.savingEdit = false;
      }
    },

    async resetPassword(user) {
      const toast = useToast();
      const userID = user?.userID;
      if (!userID) {
        toast.error('Missing userID.');
        return;
      }
      try {
        const res = await axios.post('/auth/reset_password', { userID });
        toast.success(res.data?.message || 'Password reset successfully. New password sent via SMS.');
      } catch (error) {
        const serverResponse = error?.response?.data;
        const msg =
          typeof serverResponse === 'string'
            ? serverResponse
            : (serverResponse?.message || serverResponse?.error || 'Failed to reset password.');
        toast.error(msg);
        console.error('Error resetting password:', error);
      }
    },

    async fetchUsers() {
      this.Loading = true;
      const toast = useToast();

      this.users = [];
      try {
        const response = await axios.post('/auth/list_users', {});
        // API returns: userID, username, fullname, phoneNo, email, usertype, role
        this.users = response.data.map(user => ({
          userID: user.userID, // API returns userID (not id)
          phoneNo: user.phoneNo,
          username: user.username,
          fullname: user.fullname,
          email: user.email,
          usertype: user.usertype,
          role: user.role,
          priviledges: Array.isArray(user.priviledges)
            ? user.priviledges
            : Array.isArray(user.privileges)
              ? user.privileges
              : [],
        }));
        toast.success(this.users.length > 0
          ? `Users have been fetched successfully! (${this.users.length} user${this.users.length === 1 ? '' : 's'})`
          : 'Users have been fetched successfully! No users found.');
      } catch (error) {
        console.error('Error fetching all users:', error);
        toast.error('Failed to fetch users. Please try again.');
      } finally {
        this.Loading = false;
      }
    },
  },
  async mounted() {
    this.privilegeCatalog = await fetchPrivilegeCatalog(axios);
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

.students-table th,
.students-table td {
  padding: 0.3rem 0.5rem;
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

.priv-cell {
  max-width: 340px;
}

.actions-cell {
  white-space: nowrap;
}

.mini-btn {
  border: 1px solid #cbd5e1;
  background: #fff;
  padding: 0.35rem 0.6rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
  margin-right: 0.35rem;
}

.mini-btn:hover {
  background: #f8fafc;
}

.mini-btn.primary {
  background: #2b7ab7;
  border-color: #2b7ab7;
  color: #fff;
}

.mini-btn.primary:hover {
  background: #1e6192;
}

.mini-btn.danger {
  border-color: #fecaca;
  background: #fff5f5;
  color: #b91c1c;
}

.mini-btn.danger:hover {
  background: #ffe4e6;
}

.card-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  z-index: 20000;
}

.modal {
  width: min(820px, 96vw);
  max-height: 92vh;
  overflow: auto;
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.9rem 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.modal-x {
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 1.4rem;
  line-height: 1;
}

.modal-body {
  padding: 1rem;
}

.modal-footer {
  padding: 0.9rem 1rem;
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  border-top: 1px solid #e5e7eb;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
}

.form-group label {
  display: block;
  font-size: 0.85rem;
  color: #374151;
  margin-bottom: 0.25rem;
}

.form-control {
  width: 100%;
  padding: 0.45rem 0.6rem;
  border-radius: 6px;
  border: 1px solid #cbd5e1;
  outline: none;
}

.form-control:focus {
  border-color: #2b7ab7;
  box-shadow: 0 0 0 2px rgba(43, 122, 183, 0.15);
}

.priv-picker {
  margin-top: 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
}

.priv-picker-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.6rem 0.75rem;
  background: #f8fafc;
  border-bottom: 1px solid #e5e7eb;
  gap: 0.75rem;
}

.priv-title {
  font-weight: 700;
  color: #111827;
}

.priv-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  justify-content: flex-end;
}

.priv-empty {
  padding: 0.75rem;
  color: #6b7280;
}

.priv-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.35rem 0.75rem;
  padding: 0.75rem;
  max-height: 280px;
  overflow: auto;
}

.priv-item {
  display: flex;
  gap: 0.5rem;
  align-items: flex-start;
  font-size: 0.9rem;
  color: #111827;
  line-height: 1.2;
}

@media only screen and (max-width: 640px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
  .priv-list {
    grid-template-columns: 1fr;
  }
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

  .action-btn {
    font-size: 0.75rem;
    padding: 0.35rem 0.5rem;
  }
}
</style>
    