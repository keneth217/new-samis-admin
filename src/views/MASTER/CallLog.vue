<template>
  <div class="call-log-page">
    <div class="form-title">
      <h2>Call Log</h2>
      <div class="actions">
        <button class="primary-btn" @click="refreshData" :disabled="loading">
          Refresh
        </button>
      </div>
    </div>

    <div class="tab-bar">
      <button
        v-for="tab in tabs"
        :key="tab.value"
        :class="['tab-btn', { active: tabValue === tab.value }]"
        @click="setTab(tab.value)"
      >
        {{ tab.label }}
      </button>
    </div>

    <div class="panel">
      <div v-if="tabValue === 'inCall'" class="in-call">
        <div class="in-call-header">
          <div class="call-title">In Call</div>
          <div class="call-target">
            {{ currentContactDisplay }}
          </div>
        </div>

        <div class="control-grid top-grid">
          <div class="control">
            <button class="icon-btn" @click="handleAddCall">
              <span class="material-symbols-outlined">add_call</span>
            </button>
            <div class="control-label">Add Call</div>
          </div>
          <div class="control">
            <button class="icon-btn" @click="handleHold">
              <span class="material-symbols-outlined">pause</span>
            </button>
            <div class="control-label">Hold</div>
          </div>
          <div class="control">
            <button class="icon-btn" @click="handleSwitchAudio">
              <span class="material-symbols-outlined">settings_voice</span>
            </button>
            <div class="control-label">Audio</div>
          </div>
        </div>

        <div class="control-grid">
          <div class="control">
            <button class="icon-btn" @click="handleSpeakerClick">
              <span class="material-symbols-outlined" :class="{ active: isSpeakerOn }">volume_up</span>
            </button>
            <div class="control-label">Speaker</div>
          </div>
          <div class="control">
            <button class="icon-btn" @click="handleMuteClick">
              <span class="material-symbols-outlined" :class="{ active: isMuted }">mic_off</span>
            </button>
            <div class="control-label">Mute</div>
          </div>
          <div class="control">
            <button class="icon-btn" @click="handleKeypad">
              <span class="material-symbols-outlined">dialpad</span>
            </button>
            <div class="control-label">Keypad</div>
          </div>
        </div>

        <div class="end-call-row">
          <button class="end-call-btn" @click="handleEndCall">
            <span class="material-symbols-outlined">call_end</span>
            End Call
          </button>
        </div>
      </div>

      <div v-else class="tab-content">
        <div class="tab-actions" v-if="tabValue !== 'keypad'">
          <div class="search-container">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search..."
              class="search-input"
              @input="handleSearchChange"
            />
            <span class="material-symbols-outlined search-icon">search</span>
          </div>
        </div>

        <div v-if="tabValue === 'keypad'" class="keypad-pane">
          <div class="dialed-number">{{ dialedNumber || 'Enter Number' }}</div>
          <div class="keypad-grid">
            <button v-for="key in keypadKeys" :key="key" class="keypad-btn" @click="handleKeypadClick(key)">
              {{ key }}
            </button>
            <button class="keypad-btn" @click="handleBackspace">⌫</button>
          </div>
          <div class="call-btn-row">
            <button class="call-btn" :disabled="!dialedNumber" @click="handleCall">
              <span class="material-symbols-outlined">call</span>
              Call
            </button>
          </div>
        </div>

        <div v-if="tabValue === 'recents'" class="list-pane">
          <div v-if="groupedRecentsKeys.length === 0" class="empty-state">No recent calls.</div>
          <div v-else>
            <div v-for="day in groupedRecentsKeys" :key="day" class="group-block">
              <div class="group-title">{{ day }}</div>
              <div class="table-list">
                <div class="table-row table-head">
                  <div class="col name">Contact</div>
                  <div class="col time">Time</div>
                  <div class="col type">Type</div>
                  <div class="col action">Action</div>
                </div>
                <div
                  v-for="(call, idx) in groupedRecents[day]"
                  :key="idx"
                  class="table-row"
                >
                  <div class="col name">{{ call.contactName || 'Unknown' }}</div>
                  <div class="col time">{{ call.time }}</div>
                  <div class="col type">{{ call.type }}</div>
                  <div class="col action">
                    <button class="link-btn" @click="callFromRecent(call)">Call</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="tabValue === 'contacts'" class="list-pane">
          <div v-if="filteredContacts.length === 0" class="empty-state">No contacts found.</div>
          <div class="table-list" v-else>
            <div class="table-row table-head">
              <div class="col name">Name</div>
              <div class="col number">Phone</div>
              <div class="col action">Action</div>
            </div>
            <div
              v-for="(contact, idx) in filteredContacts"
              :key="idx"
              class="table-row"
            >
              <div class="col name">{{ contact.contactName || contact.fullname || 'Unknown' }}</div>
              <div class="col number">{{ contact.phoneNo || contact.phone || 'N/A' }}</div>
              <div class="col action">
                <button class="link-btn" @click="startFromContact(contact)">Call</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <LoadingSpinner :isLoading="loading" />
  </div>
</template>

<script>
import axios from 'axios';
import LoadingSpinner from '../../components/LoadingSpinner.vue';

export default {
  name: 'CallLog',
  components: { LoadingSpinner },
  data() {
    return {
      tabs: [
        { label: 'Keypad', value: 'keypad' },
        { label: 'Recents', value: 'recents' },
        { label: 'Contacts', value: 'contacts' },
      ],
      tabValue: 'keypad',
      searchQuery: '',
      contacts: [],
      dialedNumber: '',
      recents: [],
      isInCall: false,
      isMuted: false,
      isSpeakerOn: true,
      client: null,
      loading: false,
      apiBase: import.meta.env.VITE_API_URL || '',
      keypadKeys: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'],
    };
  },
  computed: {
    filteredContacts() {
      if (!this.searchQuery) return this.contacts;
      const query = this.searchQuery.toLowerCase();
      return this.contacts.filter((c) => {
        const name = (c.contactName || c.fullname || '').toLowerCase();
        const phone = (c.phoneNo || c.phone || '').toLowerCase();
        return name.includes(query) || phone.includes(query);
      });
    },
    groupedRecents() {
      return this.recents.reduce((acc, call) => {
        const day = call.day || 'Unknown';
        if (!acc[day]) acc[day] = [];
        acc[day].push(call);
        return acc;
      }, {});
    },
    groupedRecentsKeys() {
      return Object.keys(this.groupedRecents);
    },
    currentContactDisplay() {
      return this.dialedNumber || 'Unknown Contact';
    },
  },
  mounted() {
    this.loadRecents();
    this.fetchContacts();
    this.loadAfricastalkingScript();
    window.addEventListener('keydown', this.handleKeyPress);
  },
  beforeUnmount() {
    window.removeEventListener('keydown', this.handleKeyPress);
  },
  methods: {
    setTab(value) {
      this.tabValue = value;
    },
    async refreshData() {
      await this.fetchContacts();
    },
    handleSearchChange() {
      // computed handles filtering
    },
    async fetchContacts() {
      this.loading = true;
      try {
        const res = await axios.post(`${this.apiBase}/api/contacts/list`);
        const fromApi = Array.isArray(res.data) ? res.data : res.data?.data || [];
        this.contacts = fromApi;
      } catch (err) {
        console.error('Error fetching contacts', err);
      } finally {
        this.loading = false;
      }
    },
    loadRecents() {
      const stored = localStorage.getItem('recentCalls');
      if (stored) {
        this.recents = JSON.parse(stored);
      }
    },
    saveRecents() {
      localStorage.setItem('recentCalls', JSON.stringify(this.recents));
    },
    loadAfricastalkingScript() {
      if (window.Africastalking) return;
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/africastalking-client@1.0.5/build/africastalking.js';
      script.async = true;
      script.onload = () => {
        console.log('Africastalking WebRTC library loaded.');
      };
      script.onerror = () => console.error('Failed to load Africastalking library.');
      document.body.appendChild(script);
    },
    async initializeClientWithToken() {
      if (this.client) return this.client;
      const targetNumber = this.dialedNumber;
      if (!targetNumber) throw new Error('No number provided');
      const tokenResponse = await axios.post(`${this.apiBase}/api/calls/token`, { phoneNumber: targetNumber });
      const token = tokenResponse.data?.token;
      if (!token) throw new Error('No token returned');
      const params = { sounds: { dialing: '/sounds/dial.mp3', ringing: '/sounds/ring.mp3' } };
      const newClient = new window.Africastalking.Client(token, params);
      newClient.on('connecting', () => console.log('Connecting...'));
      newClient.on('connected', () => console.log('Connected.'));
      newClient.on('disconnected', () => console.log('Disconnected.'));
      newClient.on('error', (e) => console.error('Africastalking error', e));
      this.client = newClient;
      return newClient;
    },
    formatNumber(num) {
      if (!num) return '';
      return num.startsWith('+') ? num : `+254${num.replace(/^0/, '')}`;
    },
    async handleCall() {
      if (!this.dialedNumber) {
        alert('Please enter a valid phone number.');
        return;
      }
      if (!window.Africastalking) {
        alert('Africastalking library not loaded yet.');
        return;
      }
      try {
        this.tabValue = 'inCall';
        const client = await this.initializeClientWithToken();
        const formatted = this.formatNumber(this.dialedNumber);
        client.call(formatted);
        this.isInCall = true;
        const newCall = {
          contactName: this.dialedNumber,
          time: new Date().toLocaleTimeString(),
          type: 'Outgoing',
          day: new Date().toLocaleDateString('en-US', { weekday: 'long' }),
        };
        this.recents = [newCall, ...this.recents];
        this.saveRecents();
        client.on('callestablished', () => {
          this.isInCall = true;
        });
        client.on('callended', () => {
          this.isInCall = false;
          this.tabValue = 'keypad';
        });
      } catch (err) {
        console.error('Call failed', err);
        alert('Failed to place the call.');
        this.isInCall = false;
        this.tabValue = 'keypad';
      }
    },
    handleEndCall() {
      if (this.client) {
        this.client.hangup();
      }
      this.isInCall = false;
      this.tabValue = 'keypad';
      this.dialedNumber = '';
    },
    handleKeypadClick(key) {
      this.dialedNumber = `${this.dialedNumber}${key}`;
    },
    handleBackspace() {
      this.dialedNumber = this.dialedNumber.slice(0, -1);
    },
    handleMuteClick() {
      this.isMuted = !this.isMuted;
      console.log(this.isMuted ? 'Microphone muted' : 'Microphone unmuted');
    },
    handleSpeakerClick() {
      this.isSpeakerOn = !this.isSpeakerOn;
      console.log(this.isSpeakerOn ? 'Speaker on' : 'Speaker off');
    },
    handleAddCall() {
      console.log('Add call clicked');
    },
    handleHold() {
      console.log('Hold clicked');
    },
    handleSwitchAudio() {
      console.log('Switch audio clicked');
    },
    handleKeypad() {
      this.tabValue = 'keypad';
    },
    handleKeyPress(event) {
      const { key } = event;
      if (this.isInCall) {
        if (key === 'Escape') this.handleEndCall();
        return;
      }
      if (/^\d$/.test(key)) {
        this.dialedNumber = `${this.dialedNumber}${key}`;
      } else if (key === 'Backspace') {
        this.handleBackspace();
      } else if (key === 'Enter') {
        this.handleCall();
      }
    },
    callFromRecent(call) {
      this.dialedNumber = call.contactName || '';
      this.handleCall();
    },
    startFromContact(contact) {
      this.dialedNumber = contact.phoneNo || contact.phone || '';
      this.handleCall();
    },
  },
};
</script>

<style scoped>
.call-log-page {
  background: #f5f7fb;
  padding: 1rem 1.5rem;
  min-height: 100vh;
}
.form-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}
.form-title h2 {
  font-size: 1.3rem;
  margin: 0;
}
.actions {
  display: flex;
  gap: 0.5rem;
}
.primary-btn {
  background: #1a73e8;
  color: #fff;
  border: none;
  padding: 0.5rem 0.9rem;
  border-radius: 6px;
  cursor: pointer;
}
.primary-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.tab-bar {
  display: flex;
  margin-bottom: 0.5rem;
  background: transparent;
  border-bottom: 2px solid #e1e4ea;
  position: relative;
}
.tab-btn {
  flex: 0 0 auto;
  padding: 0.75rem 1rem;
  background: transparent;
  border: none;
  border-bottom: 3px solid transparent;
  cursor: pointer;
  font-weight: 500;
  color: #6c7480;
  font-size: 0.95rem;
  transition: all 0.2s ease;
  position: relative;
  white-space: nowrap;
}
.tab-btn:hover {
  color: #1a73e8;
}
.tab-btn.active {
  color: #1a73e8;
  border-bottom-color: #1a73e8;
  font-weight: 600;
}
.panel {
  background: #fff;
  border: 1px solid #e1e4ea;
  border-radius: 10px;
  padding: 1rem;
  min-height: 420px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}
.in-call {
  text-align: center;
}
.in-call-header {
  margin-bottom: 1rem;
}
.call-title {
  font-size: 1.1rem;
  font-weight: 700;
}
.call-target {
  font-size: 1.2rem;
  color: #1a73e8;
  margin-top: 0.25rem;
}
.control-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin: 0.75rem 0;
}
.top-grid {
  margin-top: 0;
}
.control {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.icon-btn {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  border: 1px solid #d6d9e0;
  background: #f6f7fb;
  cursor: pointer;
}
.material-symbols-outlined.active {
  color: #1a73e8;
}
.control-label {
  margin-top: 0.35rem;
  font-size: 0.9rem;
}
.end-call-row {
  margin-top: 1.25rem;
}
.end-call-btn {
  background: #d93025;
  color: #fff;
  border: none;
  padding: 0.65rem 1.4rem;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  cursor: pointer;
}
.tab-actions {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 0.75rem;
}
.search-container {
  position: relative;
  width: 280px;
}
.search-input {
  width: 100%;
  padding: 0.55rem 2.5rem 0.55rem 0.75rem;
  border: 1px solid #d6d9e0;
  border-radius: 8px;
}
.search-icon {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: #6c7480;
}
.keypad-pane {
  text-align: center;
}
.dialed-number {
  font-size: 1.4rem;
  font-weight: 700;
  margin-bottom: 0.75rem;
}
.keypad-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.6rem;
  max-width: 320px;
  margin: 0 auto;
}
.keypad-btn {
  height: 64px;
  border-radius: 10px;
  border: 1px solid #d6d9e0;
  background: #f9fafc;
  font-size: 1.2rem;
  cursor: pointer;
}
.call-btn-row {
  margin-top: 1rem;
}
.call-btn {
  background: #1a73e8;
  color: #fff;
  border: none;
  padding: 0.6rem 1.6rem;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}
.call-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.list-pane {
  margin-top: 0.5rem;
}
.table-list {
  border: 1px solid #e1e4ea;
  border-radius: 8px;
  overflow: hidden;
}
.table-row {
  display: grid;
  grid-template-columns: 2fr 1.5fr 1fr 1fr;
  border-bottom: 1px solid #e1e4ea;
  padding: 0.65rem 0.75rem;
  align-items: center;
}
.table-row:last-child {
  border-bottom: none;
}
.table-head {
  background: #f6f7fb;
  font-weight: 700;
}
.col {
  font-size: 0.95rem;
}
.col.action {
  text-align: right;
}
.link-btn {
  border: none;
  background: transparent;
  color: #1a73e8;
  cursor: pointer;
  font-weight: 600;
}
.empty-state {
  text-align: center;
  color: #6c7480;
  padding: 1rem 0;
}
.group-block + .group-block {
  margin-top: 0.75rem;
}
.group-title {
  font-weight: 700;
  margin-bottom: 0.35rem;
}
@media (max-width: 768px) {
  .table-row {
    grid-template-columns: 1.5fr 1.2fr 1fr 1fr;
  }
  .search-container {
    width: 100%;
  }
}
</style>

