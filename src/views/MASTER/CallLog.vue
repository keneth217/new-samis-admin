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
        <!-- Android-style Call Header -->
        <div class="in-call-header">
          <div class="call-status" v-if="isOnHold">
            <span class="hold-indicator">⏸ On Hold</span>
          </div>
          <div class="caller-info">
            <div class="caller-name">{{ currentContactDisplay }}</div>
            <div class="call-duration" v-if="callDuration > 0">{{ formatCallDuration(callDuration) }}</div>
            <div class="call-status-text" v-else>Connecting...</div>
          </div>
        </div>

        <!-- Keypad Overlay (Android style - appears on top when toggled) -->
        <div v-if="showKeypadInCall" class="keypad-overlay-in-call">
          <div class="keypad-header-in-call">
            <button class="close-keypad-btn" @click="showKeypadInCall = false">
              <span class="material-symbols-outlined">close</span>
            </button>
            <div class="keypad-title-in-call">Dialpad</div>
          </div>
          <div class="keypad-grid-in-call">
            <button 
              v-for="key in keypadKeys" 
              :key="key" 
              class="keypad-btn-in-call" 
              @click="handleDTMFTone(key)"
            >
              <span class="keypad-number">{{ key }}</span>
              <span class="keypad-letters" v-if="getKeypadLetters(key)">{{ getKeypadLetters(key) }}</span>
            </button>
          </div>
        </div>

        <!-- Android-style Control Buttons (shown when keypad is hidden) -->
        <div v-if="!showKeypadInCall" class="in-call-controls">
          <!-- Primary Controls Row -->
          <div class="control-row primary-controls">
            <button 
              class="control-btn mute-btn" 
              :class="{ active: isMuted }" 
              @click="handleMuteClick"
              :disabled="loading && !isInCall"
            >
              <span class="material-symbols-outlined">{{ isMuted ? 'mic_off' : 'mic' }}</span>
              <span class="control-label">{{ isMuted ? 'Unmute' : 'Mute' }}</span>
            </button>
            <button 
              class="control-btn keypad-btn" 
              @click="showKeypadInCall = true"
              :disabled="loading && !isInCall"
            >
              <span class="material-symbols-outlined">dialpad</span>
              <span class="control-label">Keypad</span>
            </button>
            <button 
              class="control-btn speaker-btn" 
              :class="{ active: isSpeakerOn }" 
              @click="handleSpeakerClick"
              :disabled="loading && !isInCall"
            >
              <span class="material-symbols-outlined">{{ isSpeakerOn ? 'volume_up' : 'phone' }}</span>
              <span class="control-label">{{ isSpeakerOn ? 'Speaker' : 'Earpiece' }}</span>
            </button>
          </div>

          <!-- Secondary Controls Row -->
          <div class="control-row secondary-controls">
            <button 
              class="control-btn add-call-btn" 
              @click="handleAddCall"
              :disabled="loading && !isInCall"
            >
              <span class="material-symbols-outlined">add_call</span>
              <span class="control-label">Add Call</span>
            </button>
            <button 
              class="control-btn hold-btn" 
              :class="{ active: isOnHold }" 
              @click="handleHold"
              :disabled="loading && !isInCall"
            >
              <span class="material-symbols-outlined">{{ isOnHold ? 'play_arrow' : 'pause' }}</span>
              <span class="control-label">{{ isOnHold ? 'Resume' : 'Hold' }}</span>
            </button>
            <button 
              class="control-btn audio-btn" 
              @click="handleSwitchAudio"
              :disabled="loading && !isInCall"
            >
              <span class="material-symbols-outlined">settings_voice</span>
              <span class="control-label">Audio</span>
            </button>
          </div>
        </div>

        <!-- Android-style End Call Button (Always visible) -->
        <div class="end-call-container">
          <button 
            class="end-call-btn-android" 
            @click="handleEndCall" 
            :disabled="loading && !isInCall"
          >
            <span class="material-symbols-outlined">call_end</span>
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
            <button 
              v-for="key in keypadKeys" 
              :key="key" 
              class="keypad-btn" 
              @click="isInCall ? handleDTMFTone(key) : handleKeypadClick(key)"
            >
              {{ key }}
            </button>
            <button 
              class="keypad-btn" 
              @click="isInCall ? null : handleBackspace"
              :disabled="isInCall"
            >
              ⌫
            </button>
          </div>
          <div class="call-btn-row" v-if="!isInCall">
            <button class="call-btn" :disabled="!dialedNumber" @click="handleCall">
              <span class="material-symbols-outlined">call</span>
              Call
            </button>
          </div>
          <div v-if="isInCall" class="dtmf-hint">
            <p>During call: Keypad sends DTMF tones</p>
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
    <LoadingSpinner :isLoading="loading && !isInCall" />
    
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
      isSpeakerOn: false,
      isOnHold: false,
      showKeypadInCall: false,
      client: null,
      loading: false,
      keypadKeys: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'],
      showErrorDialog: false,
      errorTitle: '',
      errorMessage: '',
      errorDetails: [],
      errorSolutions: [],
      canRetry: false,
      lastDialedNumber: '',
      localStream: null,
      remoteStream: null,
      audioContext: null,
      audioInput: null,
      audioOutput: null,
      callDuration: 0,
      callDurationTimer: null,
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
    this.stopCallTimer();
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
          this.isMuted = false;
          this.isOnHold = false;
          this.showKeypadInCall = false;
          // Initialize audio streams
          this.initializeCallAudio();
          // Start call duration timer
          this.startCallTimer();
        });
        
        client.on('callended', () => {
          console.log('Call ended');
          this.isInCall = false;
          this.tabValue = 'keypad';
          this.loading = false;
          this.showKeypadInCall = false;
          this.stopCallTimer();
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
    initializeCallAudio() {
      // Get user media for microphone control
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
          this.localStream = stream;
          const audioTracks = stream.getAudioTracks();
          if (audioTracks.length > 0) {
            this.audioInput = audioTracks[0].getSettings().deviceId;
          }
        })
        .catch(err => {
          console.warn('Could not access microphone:', err);
        });
    },
    cleanupCallAudio() {
      // Clean up audio streams
      if (this.localStream) {
        this.localStream.getTracks().forEach(track => track.stop());
        this.localStream = null;
      }
      if (this.remoteStream) {
        this.remoteStream.getTracks().forEach(track => track.stop());
        this.remoteStream = null;
      }
      if (this.audioContext) {
        this.audioContext.close().catch(() => {});
        this.audioContext = null;
      }
    },
    handleEndCall() {
      // Clean up audio
      this.cleanupCallAudio();
      
      // Stop call timer
      this.stopCallTimer();
      
      if (this.client) {
        try {
          if (typeof this.client.hangup === 'function') {
            this.client.hangup();
          } else if (typeof this.client.end === 'function') {
            this.client.end();
          }
        } catch (err) {
          console.warn('Hangup error:', err);
        }
      }
      this.isInCall = false;
      this.isMuted = false;
      this.isOnHold = false;
      this.isSpeakerOn = false;
      this.showKeypadInCall = false;
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
    async handleMuteClick() {
      if (!this.client || !this.isInCall) return;
      
      try {
        // Get user media stream
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const audioTracks = stream.getAudioTracks();
        
        if (audioTracks.length > 0) {
          this.isMuted = !this.isMuted;
          audioTracks.forEach(track => {
            track.enabled = !this.isMuted;
          });
          console.log(this.isMuted ? '✅ Microphone muted' : '✅ Microphone unmuted');
          
          // Try to mute via client if method exists
          if (typeof this.client.mute === 'function') {
            this.client.mute(this.isMuted);
          }
        }
      } catch (err) {
        console.error('Error toggling mute:', err);
        // Fallback: just toggle the state
        this.isMuted = !this.isMuted;
        // Try client mute method if available
        if (this.client && typeof this.client.mute === 'function') {
          try {
            this.client.mute(this.isMuted);
          } catch (e) {
            console.warn('Client mute method failed:', e);
          }
        }
      }
    },
    async handleSpeakerClick() {
      this.isSpeakerOn = !this.isSpeakerOn;
      
      try {
        // Control speaker output by setting audio element's volume and ensuring it plays
        const audioElements = document.querySelectorAll('audio, video');
        audioElements.forEach(element => {
          if (element.srcObject) {
            element.volume = this.isSpeakerOn ? 1.0 : 0.0;
            // Ensure audio plays to speaker
            if (this.isSpeakerOn) {
              element.setSinkId && element.setSinkId('').catch(() => {});
            }
          }
        });
        
        // Try to set audio output device if supported
        if ('setSinkId' in HTMLAudioElement.prototype) {
          try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const speakers = devices.filter(device => device.kind === 'audiooutput');
            if (speakers.length > 0) {
              // Use default speaker when speaker is on
              // Note: Browser may require user gesture to change audio output
            }
          } catch (err) {
            console.warn('Could not set audio output device:', err);
          }
        }
        
        console.log(this.isSpeakerOn ? '✅ Speaker on' : '✅ Speaker off');
      } catch (err) {
        console.error('Error toggling speaker:', err);
      }
    },
    handleAddCall() {
      // Store current call and allow user to dial another number
      // This is a simplified version - full conference call would require more backend support
      console.log('Add call feature - Opening keypad for new call');
      this.tabValue = 'keypad';
      // Note: To fully implement conference, you'd need to:
      // 1. Hold current call
      // 2. Initiate new call
      // 3. Merge calls using backend conference API
      alert('Add Call feature: Please dial the new number. Full conference call requires backend conference API support.');
    },
    async handleHold() {
      if (!this.client || !this.isInCall) return;
      
      try {
        this.isOnHold = !this.isOnHold;
        
        // Pause/resume call timer when on hold
        if (this.isOnHold) {
          // Timer already pauses when isOnHold is true (see startCallTimer)
          console.log('⏸ Call paused - timer will not increment');
        } else {
          console.log('▶️ Call resumed - timer continues');
        }
        
        // Pause/resume audio tracks
        if (this.localStream) {
          const audioTracks = this.localStream.getAudioTracks();
          audioTracks.forEach(track => {
            track.enabled = !this.isOnHold;
          });
        }
        
        if (this.remoteStream) {
          const audioTracks = this.remoteStream.getAudioTracks();
          audioTracks.forEach(track => {
            track.enabled = !this.isOnHold;
          });
        }
        
        // Try client hold method if available
        if (typeof this.client.hold === 'function') {
          this.client.hold(this.isOnHold);
        } else if (typeof this.client.pause === 'function') {
          this.client.pause(this.isOnHold);
        }
        
        console.log(this.isOnHold ? '✅ Call on hold' : '✅ Call resumed');
      } catch (err) {
        console.error('Error toggling hold:', err);
        this.isOnHold = !this.isOnHold;
      }
    },
    async handleSwitchAudio() {
      // Switch between available audio devices
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioInputs = devices.filter(device => device.kind === 'audioinput');
        
        if (audioInputs.length <= 1) {
          alert('Only one audio input device available.');
          return;
        }
        
        // Get current device
        const currentDevice = this.audioInput;
        const currentIndex = audioInputs.findIndex(d => d.deviceId === currentDevice);
        const nextIndex = (currentIndex + 1) % audioInputs.length;
        const nextDevice = audioInputs[nextIndex];
        
        // Switch to next device
        try {
          const newStream = await navigator.mediaDevices.getUserMedia({
            audio: { deviceId: { exact: nextDevice.deviceId } }
          });
          
          // Replace tracks in existing stream
          if (this.localStream) {
            const oldTracks = this.localStream.getAudioTracks();
            const newTracks = newStream.getAudioTracks();
            
            oldTracks.forEach(oldTrack => {
              this.localStream.removeTrack(oldTrack);
              oldTrack.stop();
            });
            
            newTracks.forEach(newTrack => {
              this.localStream.addTrack(newTrack);
            });
          }
          
          this.audioInput = nextDevice.deviceId;
          console.log('✅ Switched to audio device:', nextDevice.label || nextDevice.deviceId);
          alert(`Switched to: ${nextDevice.label || 'Audio Device'}`);
        } catch (err) {
          console.error('Error switching audio device:', err);
          alert('Failed to switch audio device. Please check permissions.');
        }
      } catch (err) {
        console.error('Error enumerating audio devices:', err);
        alert('Could not access audio devices.');
      }
    },
    getKeypadLetters(key) {
      const letters = {
        '2': 'ABC', '3': 'DEF', '4': 'GHI', '5': 'JKL',
        '6': 'MNO', '7': 'PQRS', '8': 'TUV', '9': 'WXYZ'
      };
      return letters[key] || '';
    },
    formatCallDuration(seconds) {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    },
    startCallTimer() {
      this.callDuration = 0;
      if (this.callDurationTimer) {
        clearInterval(this.callDurationTimer);
      }
      this.callDurationTimer = setInterval(() => {
        if (this.isInCall && !this.isOnHold) {
          this.callDuration++;
        }
      }, 1000);
    },
    stopCallTimer() {
      if (this.callDurationTimer) {
        clearInterval(this.callDurationTimer);
        this.callDurationTimer = null;
      }
      this.callDuration = 0;
    },
    async handleDTMFTone(digit) {
      // Send DTMF tone during active call
      if (!this.client || !this.isInCall) {
        console.warn('Cannot send DTMF: No active call');
        return;
      }
      
      try {
        // Try client DTMF method if available
        if (typeof this.client.dtmf === 'function') {
          this.client.dtmf(digit);
          console.log('✅ Sent DTMF tone:', digit);
        } else if (typeof this.client.sendDTMF === 'function') {
          this.client.sendDTMF(digit);
          console.log('✅ Sent DTMF tone:', digit);
        } else {
          // Fallback: Use Web Audio API to generate DTMF tone
          this.playDTMFTone(digit);
          console.log('✅ Played DTMF tone (local):', digit);
        }
      } catch (err) {
        console.error('Error sending DTMF tone:', err);
        // Fallback to local playback
        this.playDTMFTone(digit);
      }
    },
    playDTMFTone(digit) {
      // Generate DTMF tone using Web Audio API as fallback
      try {
        if (!this.audioContext) {
          this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        
        const dtmfFrequencies = {
          '1': [697, 1209], '2': [697, 1336], '3': [697, 1477],
          '4': [770, 1209], '5': [770, 1336], '6': [770, 1477],
          '7': [852, 1209], '8': [852, 1336], '9': [852, 1477],
          '*': [941, 1209], '0': [941, 1336], '#': [941, 1477]
        };
        
        const frequencies = dtmfFrequencies[digit];
        if (!frequencies) return;
        
        const oscillator1 = this.audioContext.createOscillator();
        const oscillator2 = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator1.type = 'sine';
        oscillator1.frequency.value = frequencies[0];
        
        oscillator2.type = 'sine';
        oscillator2.frequency.value = frequencies[1];
        
        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
        
        oscillator1.connect(gainNode);
        oscillator2.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator1.start(this.audioContext.currentTime);
        oscillator2.start(this.audioContext.currentTime);
        oscillator1.stop(this.audioContext.currentTime + 0.1);
        oscillator2.stop(this.audioContext.currentTime + 0.1);
      } catch (err) {
        console.error('Error playing DTMF tone:', err);
      }
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
/* Android-style In-Call Interface */
.in-call {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 500px;
  position: relative;
}

.in-call-header {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 2rem 1rem;
  text-align: center;
}

.call-status {
  margin-bottom: 1rem;
}

.hold-indicator {
  display: inline-block;
  padding: 0.4rem 1rem;
  background: rgba(255, 193, 7, 0.2);
  color: #ff9800;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 600;
}

.caller-info {
  margin-top: 1rem;
}

.caller-name {
  font-size: 1.8rem;
  font-weight: 400;
  color: #333;
  margin-bottom: 0.5rem;
}

.call-duration {
  font-size: 1rem;
  color: #666;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
}

.call-status-text {
  font-size: 0.95rem;
  color: #999;
  margin-top: 0.5rem;
}

/* Android-style Control Buttons */
.in-call-controls {
  padding: 1rem;
}

.control-row {
  display: flex;
  justify-content: center;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.control-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0.75rem;
  border-radius: 50%;
  transition: all 0.2s ease;
  min-width: 70px;
}

.control-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  pointer-events: none;
}

.control-btn:not(:disabled):active {
  transform: scale(0.95);
}

.control-btn .material-symbols-outlined {
  font-size: 32px;
  width: 32px;
  height: 32px;
  color: #333;
}

.control-btn.active .material-symbols-outlined {
  color: #1a73e8;
}

.control-btn.active {
  background: rgba(26, 115, 232, 0.1);
}

.control-label {
  font-size: 0.75rem;
  color: #666;
  font-weight: 500;
  text-transform: capitalize;
}

.control-btn.active .control-label {
  color: #1a73e8;
  font-weight: 600;
}

/* Android-style End Call Button */
.end-call-container {
  padding: 1.5rem;
  display: flex;
  justify-content: center;
  margin-top: auto;
}

.end-call-btn-android {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: #d93025;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(217, 48, 37, 0.4);
  transition: all 0.2s ease;
}

.end-call-btn-android:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

.end-call-btn-android:not(:disabled):active {
  transform: scale(0.95);
  box-shadow: 0 1px 4px rgba(217, 48, 37, 0.3);
}

.end-call-btn-android .material-symbols-outlined {
  font-size: 36px;
  color: #fff;
}

/* Keypad Overlay (Android style) */
.keypad-overlay-in-call {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #fff;
  z-index: 10;
  display: flex;
  flex-direction: column;
  border-radius: 10px;
}

.keypad-header-in-call {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  border-bottom: 1px solid #e1e4ea;
}

.close-keypad-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background 0.2s;
}

.close-keypad-btn:hover {
  background: #f5f5f5;
}

.close-keypad-btn .material-symbols-outlined {
  font-size: 24px;
  color: #666;
}

.keypad-title-in-call {
  font-size: 1.1rem;
  font-weight: 600;
  color: #333;
}

.keypad-grid-in-call {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  padding: 1.5rem;
  align-content: start;
}

.keypad-btn-in-call {
  aspect-ratio: 1;
  border-radius: 50%;
  border: 1px solid #e1e4ea;
  background: #fff;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
  padding: 1rem;
}

.keypad-btn-in-call:active {
  background: #f5f5f5;
  transform: scale(0.95);
}

.keypad-number {
  font-size: 1.8rem;
  font-weight: 400;
  color: #333;
  line-height: 1;
}

.keypad-letters {
  font-size: 0.65rem;
  color: #666;
  margin-top: 0.2rem;
  font-weight: 500;
  letter-spacing: 0.5px;
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

