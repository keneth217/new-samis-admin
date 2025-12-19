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
    
    <!-- Error Dialog -->
    <div v-if="showErrorDialog" class="error-dialog-overlay" @click.self="closeErrorDialog">
      <div class="error-dialog">
        <div class="error-dialog-header">
          <h3>❌ Call Failed</h3>
          <button class="error-dialog-close" @click="closeErrorDialog">×</button>
        </div>
        <div class="error-dialog-body">
          <div class="error-icon">⚠️</div>
          <div class="error-title">{{ errorTitle }}</div>
          <div class="error-message">{{ errorMessage }}</div>
          <div class="error-details" v-if="errorDetails">
            <strong>Details:</strong>
            <ul>
              <li v-for="(detail, idx) in errorDetails" :key="idx">{{ detail }}</li>
            </ul>
          </div>
          <div class="error-solutions" v-if="errorSolutions">
            <strong>Possible Solutions:</strong>
            <ul>
              <li v-for="(solution, idx) in errorSolutions" :key="idx">{{ solution }}</li>
            </ul>
          </div>
        </div>
        <div class="error-dialog-footer">
          <button class="error-dialog-btn" @click="closeErrorDialog">Close</button>
          <button class="error-dialog-btn primary" @click="retryCall" v-if="canRetry">Try Again</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from '../../axios';
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
      keypadKeys: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#', '+'],
      showErrorDialog: false,
      errorTitle: '',
      errorMessage: '',
      errorDetails: [],
      errorSolutions: [],
      canRetry: false,
      lastDialedNumber: '',
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
        const res = await axios.post('/contacts/list');
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
      // Always create fresh client for each call
      const targetNumber = this.dialedNumber;
      if (!targetNumber) throw new Error('No number provided');
      
      // Get WebRTC token from API (no phoneNumber needed - API uses hardcoded values)
      console.log('Fetching WebRTC token from API...');
      const tokenResponse = await axios.post('/calls/token');
      const token = tokenResponse.data?.token;
      if (!token) throw new Error('No token returned from API');
      
      console.log('Token received:', token.substring(0, 20) + '...');
      console.log('Token data:', tokenResponse.data);
      
      // Initialize client with token
      const params = { 
        sounds: { 
          dialing: '/sounds/dial.mp3', 
          ringing: '/sounds/ring.mp3' 
        } 
      };
      
      console.log('Creating Africastalking WebRTC client...');
      console.log('Africastalking object:', window.Africastalking);
      console.log('Client constructor:', window.Africastalking?.Client);
      
      if (!window.Africastalking || !window.Africastalking.Client) {
        throw new Error('Africastalking library not properly loaded. Please refresh the page.');
      }
      
      let newClient;
      try {
        newClient = new window.Africastalking.Client(token, params);
        console.log('Client created:', newClient);
        console.log('Client type:', typeof newClient);
        console.log('Client methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(newClient)));
        console.log('Client has on method:', typeof newClient.on === 'function');
        console.log('Client has connect method:', typeof newClient.connect === 'function');
      } catch (err) {
        console.error('Error creating client:', err);
        throw new Error(`Failed to create WebRTC client: ${err.message}`);
      }
      
      // Wait for connection before returning - THIS IS CRITICAL
      return new Promise((resolve, reject) => {
        let resolved = false;
        let connectionStarted = false;
        
        const cleanup = () => {
          clearTimeout(timeout);
          if (connectTimeout) clearTimeout(connectTimeout);
        };
        
        const timeout = setTimeout(() => {
          if (!resolved) {
            cleanup();
            console.error('Client state check:', {
              hasOn: typeof newClient.on === 'function',
              hasConnect: typeof newClient.connect === 'function',
              connectionStarted,
              clientType: typeof newClient
            });
            
            if (!connectionStarted) {
              console.error('❌ Connection timeout - no connecting event received');
              console.error('This usually means:');
              console.error('1. The client is not auto-connecting');
              console.error('2. WebRTC service is blocked from localhost');
              console.error('3. Network/firewall issues');
              reject(new Error('WebRTC connection timeout. The Africastalking service may be unreachable from localhost. This could be due to:\n\n1. Network/firewall blocking WebRTC connections\n2. Africastalking service not accessible from your network\n3. Try using HTTPS or deploying to production\n\nCheck browser console for more details.'));
            } else {
              console.error('❌ Connection timeout - started but did not complete');
              reject(new Error('WebRTC connection started but did not complete within 20 seconds. Check network/firewall settings.'));
            }
          }
        }, 20000); // 20 second timeout
        
        let connectTimeout;
        
        // Verify event listeners can be attached
        if (typeof newClient.on !== 'function') {
          cleanup();
          reject(new Error('WebRTC client does not support event listeners. The Africastalking library may not be loaded correctly.'));
          return;
        }
        
        // Listen for connecting event
        newClient.on('connecting', () => {
          if (!connectionStarted) {
            connectionStarted = true;
            console.log('✅ WebRTC: Connecting to Africastalking...');
            // Set a timeout for the actual connection after connecting starts
            connectTimeout = setTimeout(() => {
              if (!resolved) {
                cleanup();
                reject(new Error('Connection started but did not complete. The Africastalking WebRTC service may be blocked or unreachable.'));
              }
            }, 15000);
          }
        });
        
        // Listen for connected event
        newClient.on('connected', () => {
          if (!resolved) {
            resolved = true;
            cleanup();
            console.log('✅ WebRTC: Connected successfully! Ready to make calls.');
            this.client = newClient;
            resolve(newClient);
          }
        });
        
        // Listen for disconnected
        newClient.on('disconnected', () => {
          console.log('⚠️ WebRTC: Disconnected');
          this.isInCall = false;
        });
        
        // Listen for errors
        newClient.on('error', (e) => {
          if (!resolved) {
            resolved = true;
            cleanup();
            console.error('❌ WebRTC connection error:', e);
            const errorMsg = e?.message || e?.error || (typeof e === 'string' ? e : JSON.stringify(e));
            reject(new Error(`WebRTC connection failed: ${errorMsg}\n\nPossible causes:\n- Africastalking service unreachable\n- Network/firewall blocking WebRTC\n- Invalid token or configuration`));
          }
        });
        
        // Try to manually trigger connection if method exists
        // Some Africastalking clients need explicit connection
        if (typeof newClient.connect === 'function') {
          console.log('Attempting to manually connect client...');
          try {
            newClient.connect();
            // Give it a moment to start
            setTimeout(() => {
              if (!connectionStarted && !resolved) {
                console.warn('⚠️ Manual connect() called but no connecting event yet. Client may auto-connect later.');
              }
            }, 1000);
          } catch (err) {
            console.warn('Note: client.connect() threw error (may be normal):', err);
          }
        } else {
          console.log('Client does not have explicit connect() method - waiting for auto-connect...');
          // Some clients auto-connect immediately, give it a moment
          setTimeout(() => {
            if (!connectionStarted && !resolved) {
              console.warn('⚠️ No auto-connect detected. This may indicate:');
              console.warn('1. WebRTC service is blocked from localhost');
              console.warn('2. Client needs explicit connection trigger');
              console.warn('3. Network connectivity issues');
            }
          }, 2000);
        }
      });
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
        alert('Africastalking library not loaded yet. Please wait a moment and try again.');
        return;
      }
      
      // Check if user is authenticated
      const authToken = localStorage.getItem('authToken');
      if (!authToken) {
        alert('Please log in to make calls.');
        return;
      }
      
      // Check if we're on HTTPS or localhost (WebRTC requires secure context)
      if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
        console.warn('WebRTC may require HTTPS. Current protocol:', location.protocol);
      }
      
      console.log('Environment check:', {
        protocol: location.protocol,
        hostname: location.hostname,
        hasAfricastalking: !!window.Africastalking,
        hasMediaDevices: !!navigator.mediaDevices
      });
      
      try {
        this.loading = true;
        // Store the number for retry
        this.lastDialedNumber = this.dialedNumber;
        // Force a fresh client each call to avoid using a closed WebSocket
        this.client = null;
        this.tabValue = 'inCall';
        
        // Wait for client to connect (this is critical!)
        console.log('Initializing WebRTC client and waiting for connection...');
        const client = await this.initializeClientWithToken();
        console.log('Client connected, preparing to make call...');
        
        // Format the number
        const formatted = this.formatNumber(this.dialedNumber);
        console.log('Calling number:', formatted);
        
        // Set up event listeners BEFORE making the call
        client.on('error', (e) => {
          console.error('Call error:', e);
          this.isInCall = false;
          this.tabValue = 'keypad';
          this.loading = false;
        });
        
        client.on('callfailed', (e) => {
          console.error('Call failed:', e);
          const errorMsg = e?.message || e?.error || 'Unknown error';
          this.showCallError(new Error(`Call failed: ${errorMsg}`));
          this.isInCall = false;
          this.tabValue = 'keypad';
          this.loading = false;
        });
        
        client.on('callestablished', () => {
          console.log('✅ Call established successfully! Connection is live.');
          this.isInCall = true;
          this.loading = false;
        });
        
        client.on('callended', () => {
          console.log('Call ended');
          this.isInCall = false;
          this.tabValue = 'keypad';
          this.loading = false;
        });
        
        // NOW make the call - client is guaranteed to be connected
        console.log('Initiating call to:', formatted);
        client.call(formatted);
        this.isInCall = true; // Set optimistically
        const newCall = {
          contactName: this.dialedNumber,
          time: new Date().toLocaleTimeString(),
          type: 'Outgoing',
          day: new Date().toLocaleDateString('en-US', { weekday: 'long' }),
        };
        this.recents = [newCall, ...this.recents];
        this.saveRecents();
      } catch (err) {
        console.error('Call failed', err);
        this.showCallError(err);
        this.isInCall = false;
        this.tabValue = 'keypad';
      } finally {
        this.loading = false;
      }
    },
    showCallError(err) {
      const errorMsg = err.message || err.response?.data?.message || 'Failed to place the call.';
      const isLocalhost = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
      const isHttps = location.protocol === 'https:';
      
      // Determine error type and provide appropriate message
      if (errorMsg.includes('timeout') || errorMsg.includes('no connecting event')) {
        this.errorTitle = 'Connection Timeout - Localhost Limitation';
        this.errorMessage = isLocalhost 
          ? '⚠️ WebRTC calls typically DO NOT work on localhost. This is expected behavior.'
          : 'The WebRTC service could not be reached.';
        this.errorDetails = [
          'The Africastalking WebRTC client did not connect within 20 seconds.',
          isLocalhost 
            ? '⚠️ IMPORTANT: You are running on localhost. Africastalking WebRTC services are typically blocked from localhost due to network security restrictions.'
            : 'Network connection may be blocked.',
          `Protocol: ${location.protocol}`,
          `Hostname: ${location.hostname}`,
          isLocalhost ? 'This is a known limitation - WebRTC requires a public-facing server.' : ''
        ];
        this.errorSolutions = [
          isLocalhost 
            ? '✅ SOLUTION: Deploy your application to a production server with HTTPS (e.g., Vercel, Netlify, AWS, or your own server).'
            : 'Check your internet connection and firewall settings.',
          isLocalhost
            ? 'Alternative: Use a tunneling service like ngrok to expose localhost (https://ngrok.com) - but production deployment is recommended.'
            : '',
          isHttps 
            ? '' 
            : 'WebRTC typically requires HTTPS. Consider using HTTPS or deploying to production.',
          isLocalhost
            ? 'Note: Once deployed to production with HTTPS, calls should work normally.'
            : 'Verify that Africastalking service is accessible from your network.',
          'Check browser console (F12) for detailed error messages and debugging info.'
        ];
        this.canRetry = false; // Don't allow retry on localhost - it won't work
      } else if (errorMsg.includes('connection failed') || errorMsg.includes('unreachable')) {
        this.errorTitle = 'Connection Failed';
        this.errorMessage = 'Unable to connect to the WebRTC service.';
        this.errorDetails = [
          errorMsg,
          isLocalhost ? 'Running on localhost may cause connection issues.' : ''
        ];
        this.errorSolutions = [
          'Check your network connection.',
          isLocalhost ? 'Consider testing on a deployed server instead of localhost.' : '',
          'Verify firewall settings are not blocking WebRTC connections.',
          'Check if Africastalking service is accessible.'
        ];
        this.canRetry = true;
      } else {
        this.errorTitle = 'Call Failed';
        this.errorMessage = errorMsg;
        this.errorDetails = [
          'An unexpected error occurred while attempting to make the call.'
        ];
        this.errorSolutions = [
          'Please check the phone number and try again.',
          'Verify you have a stable internet connection.',
          'If the problem persists, contact support.'
        ];
        this.canRetry = true;
      }
      
      // Filter out empty solutions
      this.errorSolutions = this.errorSolutions.filter(s => s.trim() !== '');
      this.errorDetails = this.errorDetails.filter(d => d.trim() !== '');
      
      this.showErrorDialog = true;
    },
    closeErrorDialog() {
      this.showErrorDialog = false;
      this.errorTitle = '';
      this.errorMessage = '';
      this.errorDetails = [];
      this.errorSolutions = [];
      this.canRetry = false;
    },
    retryCall() {
      this.closeErrorDialog();
      if (this.lastDialedNumber) {
        this.dialedNumber = this.lastDialedNumber;
        this.handleCall();
      }
    },
    handleEndCall() {
      if (this.client) {
        try {
          this.client.hangup();
        } catch (err) {
          console.warn('Hangup after closed WS', err);
        }
      }
      this.isInCall = false;
      this.tabValue = 'keypad';
      this.dialedNumber = '';
      this.client = null;
    },
    handleKeypadClick(key) {
      if (key === '+') {
        // Only one leading plus; normalize if user taps it
        if (this.dialedNumber.startsWith('+')) return;
        this.dialedNumber = `+${this.dialedNumber.replace(/^\+?/, '')}`;
        return;
      }
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

/* Error Dialog Styles */
.error-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10000;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.error-dialog {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  max-width: 600px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.error-dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 2px solid #e1e4ea;
  background: #f8f9fa;
  border-radius: 12px 12px 0 0;
}

.error-dialog-header h3 {
  margin: 0;
  color: #d93025;
  font-size: 1.3rem;
  font-weight: 700;
}

.error-dialog-close {
  background: transparent;
  border: none;
  font-size: 2rem;
  color: #6c7480;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s;
}

.error-dialog-close:hover {
  background: #e1e4ea;
  color: #d93025;
}

.error-dialog-body {
  padding: 2rem;
}

.error-icon {
  font-size: 4rem;
  text-align: center;
  margin-bottom: 1rem;
}

.error-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #d93025;
  margin-bottom: 1rem;
  text-align: center;
}

.error-message {
  font-size: 1.1rem;
  color: #333;
  margin-bottom: 1.5rem;
  text-align: center;
  line-height: 1.6;
}

.error-details,
.error-solutions {
  margin-top: 1.5rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #1a73e8;
}

.error-details strong,
.error-solutions strong {
  color: #1a73e8;
  display: block;
  margin-bottom: 0.75rem;
  font-size: 1rem;
}

.error-details ul,
.error-solutions ul {
  margin: 0.5rem 0 0 0;
  padding-left: 1.5rem;
}

.error-details li,
.error-solutions li {
  margin: 0.5rem 0;
  color: #555;
  line-height: 1.6;
}

.error-dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding: 1.5rem;
  border-top: 2px solid #e1e4ea;
  background: #f8f9fa;
  border-radius: 0 0 12px 12px;
}

.error-dialog-btn {
  padding: 0.75rem 1.5rem;
  border: 2px solid #d6d9e0;
  border-radius: 6px;
  background: #fff;
  color: #333;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.error-dialog-btn:hover {
  background: #f6f7fb;
  border-color: #1a73e8;
  color: #1a73e8;
}

.error-dialog-btn.primary {
  background: #1a73e8;
  color: #fff;
  border-color: #1a73e8;
}

.error-dialog-btn.primary:hover {
  background: #1557b0;
  border-color: #1557b0;
}

@media (max-width: 768px) {
  .error-dialog {
    width: 95%;
    max-height: 90vh;
  }
  
  .error-dialog-body {
    padding: 1.5rem;
  }
  
  .error-dialog-footer {
    flex-direction: column;
  }
  
  .error-dialog-btn {
    width: 100%;
  }
}
</style>

