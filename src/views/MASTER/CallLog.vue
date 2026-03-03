<template>
  <div class="call-log-page">
    <div class="form-title">
      <h2>Call Log</h2>
      <div class="actions">
        <button class="primary-btn" @click="refreshData" :disabled="loading">
          Refresh
        </button>
        <button class="primary-btn outline" @click="clearRecentsCache" :disabled="loading" title="Clear cached recents and reload from API">
          Clear cache
        </button>
      </div>
    </div>

    <!-- Call Ended Notification Banner -->
    <div v-if="showCallEndedNotification" class="call-ended-banner">
      <div class="call-ended-content">
        <span class="call-ended-icon">📴</span>
        <span class="call-ended-message">Call Ended: The recipient has terminated the call.</span>
        <button class="call-ended-close" @click="showCallEndedNotification = false">×</button>
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
            
            <!-- ALWAYS VISIBLE STATUS DISPLAY -->
            <div style="margin-top: 1rem; text-align: center;">
              <!-- Show duration when connected and in call - PHONE STYLE -->
              <div v-if="callStatus === 'connected' && isInCall" 
                   class="call-duration"
                   style="font-size: 2.2rem; color: #ffffff; font-weight: 300; letter-spacing: 4px; font-variant-numeric: tabular-nums; line-height: 1.3; text-shadow: 0 2px 6px rgba(0,0,0,0.5); margin-top: 0.5rem; display: block; min-height: 2.5rem;">
                <span style="display: inline-block;">{{ formatCallDuration(callDuration) }}</span>
              </div>
              <!-- Show status for all other states -->
              <div v-else 
                   class="call-status-text" 
                   :key="'status-' + callStatus"
                   style="font-size: 1.2rem; font-weight: 700; margin-top: 0.75rem;">
                <span v-if="callStatus === 'connecting'"  
                      class="status-connecting" 
                      style="color: #ff9800; animation: pulse 1.5s ease-in-out infinite;">CALLING...</span>
                <span v-else-if="callStatus === 'ringing'" 
                      class="status-ringing" 
                      style="color: #2196f3; animation: pulse 1.5s ease-in-out infinite;">RINGING...</span>
                <span v-else-if="callStatus === 'ended'" 
                      class="status-ended" 
                      style="color: #f44336; animation: pulse 1s ease-in-out infinite;">CALL ENDED</span>
                <span v-else-if="callStatus === 'connected' && !isInCall" 
                      class="status-connected" 
                      style="color: #4caf50;">CONNECTING...</span>
                <span v-else 
                      class="status-default" 
                      style="color: #999;">{{ callStatus ? callStatus.toUpperCase() : 'CALLING...' }}</span>
              </div>
            </div>
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
              :disabled="loading || !isInCall"
            >
              <span class="material-symbols-outlined">{{ isMuted ? 'mic_off' : 'mic' }}</span>
              <span class="control-label">{{ isMuted ? 'Unmute' : 'Mute' }}</span>
            </button>
            <button 
              class="control-btn keypad-btn" 
              @click="showKeypadInCall = true"
              :disabled="loading || !isInCall"
            >
              <span class="material-symbols-outlined">dialpad</span>
              <span class="control-label">Keypad</span>
            </button>
            <button 
              class="control-btn speaker-btn" 
              :class="{ active: isSpeakerOn }" 
              @click="handleSpeakerClick"
              :disabled="loading || !isInCall"
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
              :disabled="loading || !isInCall"
            >
              <span class="material-symbols-outlined">add_call</span>
              <span class="control-label">Add Call</span>
            </button>
            <button 
              class="control-btn hold-btn" 
              :class="{ active: isOnHold }" 
              @click="handleHold"
              :disabled="loading || !isInCall"
            >
              <span class="material-symbols-outlined">{{ isOnHold ? 'play_arrow' : 'pause' }}</span>
              <span class="control-label">{{ isOnHold ? 'Resume' : 'Hold' }}</span>
            </button>
            <button 
              class="control-btn audio-btn" 
              @click="handleSwitchAudio"
              :disabled="loading || !isInCall"
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
            :disabled="loading"
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
          <input 
            type="text" 
            class="dialed-number" 
            :value="dialedNumber" 
            placeholder="Enter Number"
            @paste="handlePaste"
            @input="handleNumberInput"
            :disabled="isInCall"
          />
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
              @click="handleBackspace"
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
          <!-- Load calls: single day and date range on same row (CallController API) -->
          <div class="recents-load-section">
            <div class="recents-load-row recents-load-main">
              <div class="recents-load-group">
                <span class="recents-load-label">Single day</span>
                <input v-model="recentsDateFilter" type="date" class="date-filter-input" aria-label="Pick a single day" />
                <button type="button" class="primary-btn small" @click="loadRecentsSingleDay" :disabled="loading">
                  Load this day
                </button>
              </div>
              <div class="recents-load-group">
                <span class="recents-load-label">Date range</span>
                <span class="recents-from-to">From</span>
                <input v-model="recentsStartDate" type="date" class="date-filter-input" aria-label="Start date" />
                <span class="recents-from-to">To</span>
                <input v-model="recentsEndDate" type="date" class="date-filter-input" aria-label="End date" />
                <button type="button" class="primary-btn small" @click="loadRecentsDateRange" :disabled="loading">
                  Load range
                </button>
              </div>
              <div class="recents-load-group">
                <button type="button" class="primary-btn small" @click="refreshData" :disabled="loading">
                  Refresh
                </button>
              </div>
            </div>
            <div class="recents-load-row recents-load-options">
              <label class="recents-filter-checkbox" title="Hide calls with 0:00 duration (e.g. missed/unanswered)">
                <input type="checkbox" v-model="hideZeroDuration" />
                <span>Hide 0:00 duration</span>
              </label>
            </div>
          </div>
          <div v-if="lastLoadedDateLabel" class="recents-date-label">
            Showing calls for: <strong>{{ lastLoadedDateLabel }}</strong>
          </div>
          <div v-if="groupedRecentsKeys.length === 0" class="empty-state">No recent calls.</div>
          <div v-else class="table-container">
            <div class="table-scroll-wrapper">
              <div v-for="day in groupedRecentsKeys" :key="day" class="group-block">
                <div class="group-title">{{ day }}</div>
                <table class="students-table desktop-table">
                  <thead>
                    <tr>
                      <th>Contact</th>
                      <th>Time</th>
                      <th>Type</th>
                      <th>Duration</th>
                      <th>Forwarded To</th>
                      <th class="actions-header">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="(call, idx) in groupedRecents[day]"
                      :key="idx"
                      :class="{ 'even-row': idx % 2 !== 0 }"
                    >
                      <td>{{ call.contactName || 'Unknown' }}</td>
                      <td>{{ formatRecentTime(call) }}</td>
                      <td>{{ call.type }}</td>
                      <td>{{ formatCallDuration(call.duration || 0) }}</td>
                      <td>{{ call.dialDestinationNumber || '—' }}</td>
                      <td class="actions">
                        <button
                          v-if="call.recordingUrl"
                          @click="toggleRecording(call)"
                          :class="['play-recording-btn', { active: isPlayingRecording(call) }]"
                          :aria-label="isPlayingRecording(call) ? 'Stop recording' : 'Play recording'"
                        >
                          <span class="material-symbols-outlined">
                            {{ isPlayingRecording(call) ? 'stop_circle' : 'play_circle' }}
                          </span>
                        </button>
                        <span v-else class="no-recording-hint" title="No recording available">—</span>
                        <button @click="callFromRecent(call)" class="manage-btn" aria-label="Call">
                          <span class="material-symbols-outlined">call</span>
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <!-- Mobile Card View (Recents) -->
            <div class="mobile-cards mobile-recents" v-if="groupedRecentsKeys.length > 0">
              <div v-for="day in groupedRecentsKeys" :key="day" class="group-block">
                <div class="group-title">{{ day }}</div>
                <div
                  v-for="(call, idx) in groupedRecents[day]"
                  :key="idx"
                  class="call-card"
                >
                  <div class="card-header">
                    <div class="card-number">{{ idx + 1 }}</div>
                    <h3 class="card-title">{{ call.contactName || 'Unknown' }}</h3>
                  </div>
                  <div class="card-body">
                    <div class="card-row">
                      <span class="card-label">Time:</span>
                      <span class="card-value">{{ formatRecentTime(call) }}</span>
                    </div>
                    <div class="card-row">
                      <span class="card-label">Type:</span>
                      <span class="card-value">{{ call.type }}</span>
                    </div>
                    <div class="card-row">
                      <span class="card-label">Duration:</span>
                      <span class="card-value">{{ formatCallDuration(call.duration || 0) }}</span>
                    </div>
                    <div class="card-row" v-if="call.dialDestinationNumber">
                      <span class="card-label">Forwarded To:</span>
                      <span class="card-value">{{ call.dialDestinationNumber }}</span>
                    </div>
                  </div>
                  <div class="card-footer">
                    <button
                      v-if="call.recordingUrl"
                      @click="toggleRecording(call)"
                      :class="['card-action-btn play-recording-btn', { active: isPlayingRecording(call) }]"
                      :aria-label="isPlayingRecording(call) ? 'Stop' : 'Play'"
                    >
                      <span class="material-symbols-outlined">
                        {{ isPlayingRecording(call) ? 'stop_circle' : 'play_circle' }}
                      </span>
                    </button>
                    <button @click="callFromRecent(call)" class="card-action-btn manage-btn" aria-label="Call">
                      <span class="material-symbols-outlined">call</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="tabValue === 'contacts'" class="list-pane">
          <div v-if="filteredContacts.length === 0" class="empty-state">No contacts found.</div>
          <div v-else class="table-container">
            <div class="table-scroll-wrapper">
              <table class="students-table desktop-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Phone</th>
                    <th class="actions-header">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(contact, idx) in filteredContacts"
                    :key="idx"
                    :class="{ 'even-row': idx % 2 !== 0 }"
                  >
                    <td>{{ contact.contactName || contact.fullname || 'Unknown' }}</td>
                    <td>{{ contact.phoneNo || contact.phone || 'N/A' }}</td>
                    <td class="actions">
                      <button @click="startFromContact(contact)" class="manage-btn" aria-label="Call">
                        <span class="material-symbols-outlined">call</span>
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <!-- Mobile Card View (Contacts) -->
            <div class="mobile-cards mobile-contacts">
              <div v-for="(contact, index) in filteredContacts" :key="index" class="call-card">
                <div class="card-header">
                  <div class="card-number">{{ index + 1 }}</div>
                  <h3 class="card-title">{{ contact.contactName || contact.fullname || 'Unknown' }}</h3>
                </div>
                <div class="card-body">
                  <div class="card-row">
                    <span class="card-label">Phone:</span>
                    <span class="card-value">{{ contact.phoneNo || contact.phone || 'N/A' }}</span>
                  </div>
                </div>
                <div class="card-footer">
                  <button @click="startFromContact(contact)" class="card-action-btn manage-btn" aria-label="Call">
                    <span class="material-symbols-outlined">call</span>
                  </button>
                </div>
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
import { useToast } from 'vue-toastification';
import { saveCallHistory, getGatewayCalls, getGatewayCallsByDate, getGatewayCallsByDateRange } from '../../services/callHistoryApi';

export default {
  name: 'CallLog',
  components: { LoadingSpinner },
  setup() {
    const toast = useToast();
    return { toast };
  },
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
      callStatus: 'idle', // 'idle', 'connecting', 'ringing', 'connected', 'ended'
      statusUpdateInterval: null, // Track polling interval for cleanup
      keypadKeys: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'],
      showCallEndedNotification: false,
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
      isInitializingClient: false, // Prevent concurrent client initialization
      returnToKeypadTimer: null, // Timer to return to keypad after call ends
      connectionTime: null, // Timestamp when connection was established (to prevent premature ending)
      callStartTime: null, // Track when call started for duration calculation
      currentCallReceiver: null, // Track receiver phone number for call history
      playingRecordingId: null, // sessionId or unique key of currently playing recording
      recordingAudio: null, // HTML5 Audio instance for playback
      recentsDateFilter: '', // yyyy-MM-dd for single date
      recentsStartDate: '',
      recentsEndDate: '',
      hideZeroDuration: false, // filter: hide calls with 0:00 duration
      lastLoadedDateLabel: '', // e.g. "19 Feb 2026" or "1 Feb – 19 Feb 2026" after Load by date
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
    filteredRecents() {
      if (!this.hideZeroDuration) return this.recents;
      return this.recents.filter((call) => (call.duration || 0) > 0);
    },
    groupedRecents() {
      return this.filteredRecents.reduce((acc, call) => {
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
    shouldShowDuration() {
      const shouldShow = this.callStatus === 'connected' && this.isInCall;
      console.log(`📊 shouldShowDuration check: callStatus=${this.callStatus}, isInCall=${this.isInCall}, result=${shouldShow}`);
      return shouldShow;
    },
    currentStatusDisplay() {
      // Always return a status to display
      if (this.callStatus === 'connected' && this.isInCall) {
        return 'DURATION';
      } else if (this.callStatus === 'ringing') {
        return 'RINGING';
      } else if (this.callStatus === 'connecting') {
        return 'CALLING';
      } else if (this.callStatus === 'ended') {
        return 'ENDED';
      } else {
        return this.callStatus ? this.callStatus.toUpperCase() : 'CALLING';
      }
    },
  },
  watch: {
    callStatus(newStatus, oldStatus) {
  console.log(`📊 Call Status Changed: ${oldStatus} → ${newStatus}`);
  
  // CRITICAL: Prevent status from being reset from 'ended' to 'ringing' or 'connected'
  // Allow 'ended' -> 'connecting' (new call) and 'ended' -> 'idle' (cleanup)
  if (oldStatus === 'ended' && (newStatus === 'ringing' || newStatus === 'connected')) {
    console.error(`❌ BLOCKED: Attempted to change status from 'ended' to '${newStatus}' - preventing reset!`);
    // Force it back to 'ended'
    this.$nextTick(() => {
      if (this.callStatus !== 'ended') {
        this.callStatus = 'ended';
        this.$forceUpdate();
        console.log(`✅ Status forced back to 'ended'`);
      }
    });
    return;
  }
  
  // When status becomes 'connected', ensure timer is running
  if (newStatus === 'connected' && this.isInCall && !this.callDurationTimer) {
    console.log('📊 Status changed to connected and isInCall is true - starting timer');
    this.startCallTimer();
  }
  
  // Force UI update when status changes
  this.$nextTick(() => {
    console.log(`✅ UI should now show: ${newStatus}`);
    // Force another update to ensure duration shows
    if (newStatus === 'connected' && this.isInCall) {
      this.$forceUpdate();
    }
  });
},
    isInCall(newValue, oldValue) {
      console.log(`📊 isInCall Changed: ${oldValue} → ${newValue}`);
      console.log(`📊 Current callStatus: ${this.callStatus}`);
      
      // When isInCall becomes true, ensure status is 'connected'
      if (newValue === true && this.callStatus !== 'connected' && this.callStatus !== 'ended') {
        console.log('📊 isInCall became true - updating status to connected');
        this.updateCallStatus('connected');
        // Record connection time to prevent premature ending
        this.connectionTime = Date.now();
        console.log('📊 Connection time recorded:', new Date(this.connectionTime).toISOString());
        // Always start timer when connection is established
        console.log('📊 Starting call timer via isInCall watcher...');
        this.startCallTimer();
      }
      
      // Also ensure timer is running if status is already connected
      if (newValue === true && this.callStatus === 'connected' && !this.callDurationTimer) {
        console.log('📊 isInCall is true and status is connected but timer not running - starting timer');
        // Record connection time if not already recorded
        if (!this.connectionTime) {
          this.connectionTime = Date.now();
          console.log('📊 Connection time recorded:', new Date(this.connectionTime).toISOString());
        }
        this.startCallTimer();
      }
      
      // When isInCall becomes false and call was actually connected, update to ended
      // CRITICAL: Only mark as ended if call was connected (not just ringing)
      // During ringing, isInCall should be false - that's normal!
      // SAFEGUARD: Prevent premature ending - require at least 2 seconds after connection
      if (newValue === false && oldValue === true && this.callStatus === 'connected') {
        const timeSinceConnection = this.connectionTime ? Date.now() - this.connectionTime : Infinity;
        const minConnectionTime = 2000; // 2 seconds minimum
        
        if (timeSinceConnection < minConnectionTime) {
          console.warn(`⚠️ isInCall became false too soon (${timeSinceConnection}ms) - ignoring (minimum ${minConnectionTime}ms)`);
          console.warn(`⚠️ This might be a false positive - keeping call connected`);
          // Force isInCall back to true to prevent premature ending
          this.$nextTick(() => {
            if (this.callStatus === 'connected') {
              this.isInCall = true;
              console.log('✅ Restored isInCall to true - call is still connected');
            }
          });
          return;
        }
        
        console.log('📊 isInCall became false after call was connected - updating status to ended');
        console.log(`📊 Call was connected for ${(timeSinceConnection / 1000).toFixed(1)} seconds`);
        console.log('📊 This means recipient hung up');
        this.updateCallStatus('ended');
        this.stopCallTimer();
        const wasConnected = this.connectionTime !== null;
        this.connectionTime = null; // Reset connection time
        
        // Android-style: After 4 seconds, automatically return to keypad
        if (wasConnected) {
          this.scheduleReturnToKeypad();
        }
      }
      // Don't mark as ended if status is 'ringing' - that's normal during ringing phase
      
      // Force UI update
      this.$forceUpdate();
    },
  },
  mounted() {
    this.loadRecents();
    this.fetchContacts();
    this.loadAfricastalkingScript();
    window.addEventListener('keydown', this.handleKeyPress);
    
    // Debug: Log status display state
    this.$nextTick(() => {
      console.log('🔍 Status Display Debug:', {
        tabValue: this.tabValue,
        callStatus: this.callStatus,
        isInCall: this.isInCall,
        shouldShowDuration: this.shouldShowDuration,
        callDuration: this.callDuration
      });
    });
  },
  beforeUnmount() {
    window.removeEventListener('keydown', this.handleKeyPress);
    this.stopCallTimer();
    this.stopRecording();
    // Clean up return to keypad timer
    if (this.returnToKeypadTimer) {
      clearTimeout(this.returnToKeypadTimer);
      this.returnToKeypadTimer = null;
    }
    // Clean up polling interval
    if (this.statusUpdateInterval) {
      clearInterval(this.statusUpdateInterval);
      this.statusUpdateInterval = null;
    }
    // Clean up client
    if (this.client) {
      try {
        if (typeof this.client.hangup === 'function') {
          this.client.hangup();
        }
        if (typeof this.client.logout === 'function') {
          this.client.logout();
        }
      } catch (err) {
        console.warn('Error cleaning up client on unmount:', err);
      }
    }
  },
  methods: {
    // Unified method to update call status with proper Vue reactivity
    updateCallStatus(newStatus) {
      // CRITICAL: Allow resetting from 'ended' to 'idle' or 'connecting' (new call starting)
      // Block other transitions from 'ended' to prevent accidental changes
      if (this.callStatus === 'ended' && newStatus !== 'ended' && newStatus !== 'idle' && newStatus !== 'connecting') {
        console.warn(`⚠️ Attempted to change status from 'ended' to '${newStatus}' - BLOCKED`);
        return;
      }
      
      // If we're resetting from 'ended' to start a new call, log it
      if (this.callStatus === 'ended' && (newStatus === 'idle' || newStatus === 'connecting')) {
        console.log(`✅ Resetting status from 'ended' to '${newStatus}' (new call starting)`);
      }
      
      // Don't update if status is already the same (unless it's a forced update)
      if (this.callStatus === newStatus) {
        console.log(`ℹ️ Status already set to: ${newStatus} - skipping update`);
        // Still force update to ensure UI is reactive
        this.$forceUpdate();
        return;
      }
      
      const oldStatus = this.callStatus;
      console.log(`🔄 Updating call status: ${oldStatus} → ${newStatus}`);
      this.callStatus = newStatus;
      
      // Force Vue reactivity update immediately
      this.$forceUpdate();
      
      // Use nextTick to ensure UI updates and verify
      this.$nextTick(() => {
        console.log(`✅ Call status updated to: ${newStatus} (verified)`);
        console.log(`📊 Current callStatus value: ${this.callStatus}`);
        // Verify the status was set correctly
        if (this.callStatus !== newStatus) {
          console.error(`❌ Status mismatch! Expected: ${newStatus}, Got: ${this.callStatus} - forcing again`);
          this.callStatus = newStatus;
          this.$forceUpdate();
        } else {
          console.log(`✅ Status verified: ${this.callStatus}`);
        }
      });
    },
    // Android-style: Comprehensive call state detection using multiple methods
    checkActualCallState() {
      let detectedState = {
        isConnected: false,
        isEnded: false,
        hasRemoteStream: false,
        hasWebRTCPeer: false,
        hasActiveTracks: false,
        clientValid: false
      };
      
      // Method 1: Check if client exists and is valid
      if (this.client) {
        detectedState.clientValid = true;
        try {
          const hasHangup = typeof this.client.hangup === 'function';
          const hasCall = typeof this.client.call === 'function';
          detectedState.clientValid = hasHangup && hasCall;
        } catch (err) {
          console.warn('⚠️ Error checking client state:', err);
        }
      }
      
      // Method 2: Check for WebRTC peer connections (most reliable)
      try {
        // Check if RTCPeerConnection exists in window
        if (window.RTCPeerConnection) {
          // Try to access peer connections through the client if possible
          // Note: Africastalking might store peer connections internally
          const peerConnections = [];
          
          // Check all possible ways to access peer connections
          if (this.client && this.client._peerConnection) {
            peerConnections.push(this.client._peerConnection);
          }
          if (this.client && this.client.peerConnection) {
            peerConnections.push(this.client.peerConnection);
          }
          
          for (const pc of peerConnections) {
            if (pc && pc.connectionState) {
              const state = pc.connectionState;
              if (state === 'connected' || state === 'connecting') {
                detectedState.hasWebRTCPeer = true;
                detectedState.isConnected = true;
                break;
              }
            }
          }
        }
      } catch (err) {
        // Ignore - WebRTC might not be accessible
      }
      
      // Method 3: Check for remote audio/video streams (primary detection)
      // This is CRITICAL - Africastalking creates audio elements when call connects
      try {
        // Check ALL audio and video elements in the entire document
        const audioElements = document.querySelectorAll('audio, video');
        let foundRemoteStream = false;
        let foundActiveTracks = false;
        
        // Also check if any elements were added to body recently
        const allElements = document.querySelectorAll('*');
        
        for (const el of audioElements) {
          // Method 3a: Check srcObject (modern WebRTC way)
          if (el.srcObject) {
            const stream = el.srcObject;
            if (stream instanceof MediaStream) {
              const tracks = stream.getTracks();
              
              // Check for ANY tracks (even if not live yet)
              if (tracks.length > 0) {
                foundActiveTracks = true;
                
                // Check for live tracks
                const liveTracks = tracks.filter(t => t.readyState === 'live');
                if (liveTracks.length > 0) {
                  // Check if tracks are enabled (not muted/disabled)
                  const enabledTracks = liveTracks.filter(t => t.enabled);
                  if (enabledTracks.length > 0) {
                    foundRemoteStream = true;
                    detectedState.isConnected = true;
                    console.log('📊 Found live enabled tracks:', enabledTracks.length);
                    break;
                  }
                } else {
                  // Even if not live, having tracks means stream exists
                  console.log('📊 Found tracks (not live yet):', tracks.length);
                }
              }
            }
          }
          
          // Method 3b: Check src attribute (legacy/blob URLs)
          // Africastalking uses blob URLs (polyblob:) for call streams
          // If blob URL exists and element is playing or has been playing, it's likely a call stream
          if (el.src && (el.src.startsWith('blob:') || el.src.startsWith('polyblob:') || el.src.startsWith('mediastream:') || el.src.includes('webrtc'))) {
            // If it has srcObject with MediaStream, that's strong evidence
            if (el.srcObject && el.srcObject instanceof MediaStream) {
              const stream = el.srcObject;
              const tracks = stream.getTracks();
              const liveTracks = tracks.filter(t => t.readyState === 'live' && t.enabled);
              if (liveTracks.length > 0) {
                foundRemoteStream = true;
                detectedState.isConnected = true;
                console.log('📊 Found stream via blob URL with live MediaStream:', el.src.substring(0, 50));
                break;
              }
            }
            // If no srcObject but blob URL exists and element is playing, it's likely connected
            // Ringtones are usually paused, call streams play
            try {
              if (!el.paused && el.currentTime > 0 && !el.ended) {
                foundRemoteStream = true;
                detectedState.isConnected = true;
                console.log('📊 Found playing blob URL audio element (likely call stream):', el.src.substring(0, 50));
                break;
              }
            } catch (err) {
              // Ignore errors checking play state
            }
          }
          
          // Method 3c: Check if element is playing AND has a MediaStream (not just autoplay)
          // This ensures it's an actual call stream, not a ringtone
          try {
            if (!el.paused && el.currentTime > 0 && !el.ended && el.srcObject) {
              // Only count as connected if it has a MediaStream with tracks
              const stream = el.srcObject;
              if (stream instanceof MediaStream) {
                const tracks = stream.getTracks();
                const liveTracks = tracks.filter(t => t.readyState === 'live' && t.enabled);
                if (liveTracks.length > 0) {
                  foundRemoteStream = true;
                  detectedState.isConnected = true;
                  console.log('📊 Found playing audio/video element with live MediaStream tracks');
                  break;
                }
              }
            }
          } catch (err) {
            // Some elements might throw errors - ignore
          }
          
          // REMOVED: Method 3d - Autoplay detection was too aggressive
          // Autoplay elements can be created for ringtones, not just call connections
          // We now only rely on actual MediaStreams with live tracks
        }
        
        // Method 3e: Check if there are ANY MediaStream objects in memory
        // This is a last resort - check if WebRTC created any streams
        try {
          // Check window for any stream references
          if (window.streams || window.remoteStream || window.localStream) {
            foundRemoteStream = true;
            detectedState.isConnected = true;
            console.log('📊 Found stream in window object');
          }
        } catch (err) {
          // Ignore
        }
        
        detectedState.hasRemoteStream = foundRemoteStream;
        detectedState.hasActiveTracks = foundActiveTracks;
        
        // Log if we found elements but no stream (for debugging - only occasionally)
        if (audioElements.length > 0 && !foundRemoteStream && !foundActiveTracks && Math.random() < 0.05) {
          console.log(`📊 Found ${audioElements.length} audio/video elements but no active stream detected`);
          // Log details of first element for debugging
          if (audioElements[0]) {
            const el = audioElements[0];
            console.log('📊 First element details:', {
              tagName: el.tagName,
              hasSrcObject: !!el.srcObject,
              src: el.src ? el.src.substring(0, 50) : 'none',
              paused: el.paused,
              currentTime: el.currentTime,
              autoplay: el.autoplay
            });
          }
        }
      } catch (err) {
        console.warn('⚠️ Error checking for remote streams:', err);
      }
      
      // Method 4: Check MediaStreamTrack.getSources/getUserMedia state
      try {
        // Check if there are any active media tracks in the system
        if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
          // This is indirect but can help confirm media is active
        }
      } catch (err) {
        // Ignore
      }
      
      return detectedState;
    },
    setTab(value) {
      this.tabValue = value;
    },
    async refreshData() {
      await this.fetchContacts();
      await this.loadRecents();
    },
    clearRecentsCache() {
      localStorage.removeItem('recentCalls');
      this.toast.success('Recents cache cleared. Reloading from API…');
      this.loadRecents();
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
    async loadRecents() {
      this.lastLoadedDateLabel = ''; // clear date filter label when loading "all" recents
      // Load from localStorage first (for immediate display); normalize times if callStartTime exists
      const stored = localStorage.getItem('recentCalls');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          this.recents = this.normalizeRecentsTimes(Array.isArray(parsed) ? parsed : []);
        } catch (_) {
          this.recents = [];
        }
      } else {
        this.recents = [];
      }

      // Fetch gateway calls via CallController: POST /api/calls/list
      let gatewayRecents = [];
      try {
        const gwRes = await getGatewayCalls();
        const gwData = Array.isArray(gwRes?.data) ? gwRes.data : gwRes?.data?.data || [];
        gatewayRecents = this.mapGatewayCallsToRecents(gwData);
      } catch (err) {
        console.warn('Could not load gateway calls:', err);
      }

      // Merge: gateway first (have recordings), then localStorage; dedupe by sessionId or contact+time+type
      const byKey = new Map();
      const add = (c) => {
        const key = c.sessionId || `${c.contactName || ''}_${c.time}_${c.type}`;
        if (!byKey.has(key)) byKey.set(key, { ...c, _sortTs: c._sortTs ?? 0 });
      };
      gatewayRecents.forEach(add);
      this.recents.forEach((c) => add({ ...c, _sortTs: c._sortTs ?? (c.day && c.time ? new Date(`${c.day} ${c.time}`).getTime() : 0) }));
      let merged = Array.from(byKey.values())
        .sort((a, b) => (b._sortTs || 0) - (a._sortTs || 0))
        .slice(0, 50)
        .map(({ _sortTs, ...r }) => r); // drop _sortTs before save
      merged = this.normalizeRecentsTimes(merged); // fix cached wrong AM/PM from callStartTime
      this.recents = merged;
      this.saveRecents();
    },
    saveRecents() {
      localStorage.setItem('recentCalls', JSON.stringify(this.recents));
    },
    /** POST /api/calls/listbydate/{date} – single day (inclusive) */
    async loadRecentsSingleDay() {
      const singleDate = (this.recentsDateFilter || '').trim();
      if (!singleDate) {
        this.toast.warning('Pick a date for "Single day" then click Load this day.');
        return;
      }
      this.loading = true;
      this.lastLoadedDateLabel = '';
      try {
        const gwRes = await getGatewayCallsByDate(singleDate);
        const gwData = this.normalizeGatewayResponse(gwRes);
        const gatewayRecents = this.mapGatewayCallsToRecents(gwData);
        this.lastLoadedDateLabel = this.formatDateLabel(singleDate);
        this.applyGatewayRecentsToRecents(gatewayRecents);
        this.toast.success(`Loaded ${this.recents.length} call(s) for ${this.lastLoadedDateLabel}.`);
      } catch (err) {
        console.error('Failed to load calls by date:', err);
        const msg = err.response?.data?.message || err.message || 'Check date (yyyy-MM-dd) and network.';
        this.toast.error(`Could not load calls: ${msg}`);
      } finally {
        this.loading = false;
      }
    },
    /** POST /api/calls/listbydaterange/{startDate}/{endDate} – range (inclusive) */
    async loadRecentsDateRange() {
      const startDate = (this.recentsStartDate || '').trim();
      const endDate = (this.recentsEndDate || '').trim();
      if (!startDate || !endDate) {
        this.toast.warning('Set both From and To dates, then click Load range.');
        return;
      }
      this.loading = true;
      this.lastLoadedDateLabel = '';
      try {
        const gwRes = await getGatewayCallsByDateRange(startDate, endDate);
        const gwData = this.normalizeGatewayResponse(gwRes);
        const gatewayRecents = this.mapGatewayCallsToRecents(gwData);
        this.lastLoadedDateLabel = `${this.formatDateLabel(startDate)} – ${this.formatDateLabel(endDate)}`;
        this.applyGatewayRecentsToRecents(gatewayRecents);
        this.toast.success(`Loaded ${this.recents.length} call(s) for ${this.lastLoadedDateLabel}.`);
      } catch (err) {
        console.error('Failed to load calls by date range:', err);
        const msg = err.response?.data?.message || err.message || 'Check dates (yyyy-MM-dd) and network.';
        this.toast.error(`Could not load calls: ${msg}`);
      } finally {
        this.loading = false;
      }
    },
    applyGatewayRecentsToRecents(gatewayRecents) {
      const byKey = new Map();
      const add = (c) => {
        const key = c.sessionId || `${c.contactName || ''}_${c.time}_${c.type}`;
        if (!byKey.has(key)) byKey.set(key, { ...c, _sortTs: c._sortTs ?? 0 });
      };
      gatewayRecents.forEach(add);
      let merged = Array.from(byKey.values())
        .sort((a, b) => (b._sortTs || 0) - (a._sortTs || 0))
        .slice(0, 100)
        .map(({ _sortTs, ...r }) => r);
      merged = this.normalizeRecentsTimes(merged); // fix cached wrong AM/PM from callStartTime
      this.recents = merged;
      this.saveRecents();
    },
    normalizeGatewayResponse(gwRes) {
      if (Array.isArray(gwRes?.data)) return gwRes.data;
      if (Array.isArray(gwRes?.data?.data)) return gwRes.data.data;
      if (Array.isArray(gwRes?.data?.content)) return gwRes.data.content;
      if (Array.isArray(gwRes?.data?.calls)) return gwRes.data.calls;
      return [];
    },
    formatDateLabel(yyyyMmDd) {
      if (!yyyyMmDd) return '';
      const d = new Date(yyyyMmDd + 'T12:00:00');
      if (isNaN(d.getTime())) return yyyyMmDd;
      return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    },
    /** Extract timestamp from call – API may use callStartTime, call_start_time, startTime, createdAt, timestamp, etc. */
    getCallTimestamp(call) {
      if (!call) return null;
      const keys = ['callStartTime', 'call_start_time', 'startTime', 'start_time', 'createdAt', 'created_at', 'timestamp', 'callDate', 'call_date', 'date'];
      for (const k of keys) {
        const v = call[k];
        if (v != null && v !== '') return v;
      }
      return null;
    },
    /** Parse API callStartTime for display. CallController returns "2026-03-03T10:31:52.000+00:00" – the time is Kenya (local) but marked +00:00. Strip Z or +00:00 so we parse as local: 10:31 → 10:31 AM, 12:26 → 12:26 PM. */
    parseCallTime(value) {
      if (value == null || value === '') return null;
      if (typeof value === 'number' && Number.isFinite(value)) {
        const d = new Date(value);
        return isNaN(d.getTime()) ? null : d;
      }
      const str = String(value).trim();
      if (!str) return null;
      let normalized = str;
      if (str.endsWith('Z') || str.endsWith('z')) {
        normalized = str.slice(0, -1);
      } else if (/[+-]00:?00$/.test(str)) {
        normalized = str.replace(/[+-]00:?00$/, '');
      } else if (/[+-]\d{2}:?\d{2}$/.test(str)) {
        const d = new Date(str);
        return isNaN(d.getTime()) ? null : d;
      }
      normalized = normalized.replace(/^(\d{4}-\d{2}-\d{2})\s+/, '$1T');
      const d = new Date(normalized);
      return isNaN(d.getTime()) ? null : d;
    },
    formatRecentTime(call) {
      if (!call) return '—';
      const ts = this.getCallTimestamp(call);
      if (ts) {
        const d = this.parseCallTime(ts);
        if (d) {
          return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
        }
      }
      return call.time || '—';
    },
    /** Recompute time and day from timestamp for all recents that have it – fixes cached wrong AM/PM from localStorage. */
    normalizeRecentsTimes(recents) {
      return recents.map((c) => {
        const ts = this.getCallTimestamp(c);
        if (!ts) return c;
        const d = this.parseCallTime(ts);
        if (!d) return c;
        return {
          ...c,
          time: d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
          day: d.toLocaleDateString('en-US', { weekday: 'long' }),
        };
      });
    },
    mapGatewayCallsToRecents(gwData) {
      return gwData.map((call) => {
        const ts = this.getCallTimestamp(call);
        const d = ts ? (this.parseCallTime(ts) || new Date()) : new Date();
        const rawDir = String(call.direction || '').trim().toLowerCase();
        const isInbound = rawDir === 'inbound';
        const isOutbound = rawDir === 'outbound' || rawDir === 'outgoing';
        const type = isInbound ? 'Incoming' : (isOutbound ? 'Outgoing' : (rawDir ? rawDir.charAt(0).toUpperCase() + rawDir.slice(1) : 'Outgoing'));
        const contact = isInbound ? (call.callerNumber || call.caller_number || 'Unknown') : (call.destinationNumber || call.destination_number || call.clientDialedNumber || 'Unknown');
        return {
          sessionId: call.sessionId,
          contactName: contact,
          time: d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
          day: d.toLocaleDateString('en-US', { weekday: 'long' }),
          type,
          duration: call.durationInSeconds || 0,
          recordingUrl: call.recordingUrl || null,
          receiverPhoneNo: isInbound ? call.destinationNumber : call.callerNumber,
          callerPhoneNo: call.callerNumber,
          dialDestinationNumber: call.dialDestinationNumber || call.dial_destination_number || '',
          callStartTime: ts || null, // store for normalizeRecentsTimes + formatRecentTime
          _sortTs: d.getTime(),
        };
      });
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
    async reloadAfricastalkingLibrary() {
      // Reload the Africastalking library to reset its internal state
      // This can help clear lingering WebSocket connections
      console.log('🔄 Reloading Africastalking library to reset internal state...');
      
      // Remove existing script
      const existingScript = document.querySelector('script[src*="africastalking"]');
      if (existingScript) {
        existingScript.remove();
      }
      
      // Clear the Africastalking object
      delete window.Africastalking;
      
      // Wait a moment
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Reload the script
      this.loadAfricastalkingScript();
      
      // Wait for it to load
      let waitCount = 0;
      while (!window.Africastalking && waitCount < 20) {
        await new Promise(resolve => setTimeout(resolve, 500));
        waitCount++;
      }
      
      if (window.Africastalking) {
        console.log('✅ Africastalking library reloaded successfully');
      } else {
        console.error('❌ Failed to reload Africastalking library');
        throw new Error('Failed to reload Africastalking library');
      }
    },
    async cleanupOldClient() {
      // CRITICAL: Stop any existing polling interval FIRST
      if (this.statusUpdateInterval) {
        console.log('🧹 Stopping existing polling interval in cleanupOldClient');
        clearInterval(this.statusUpdateInterval);
        this.statusUpdateInterval = null;
      }
      
      // CRITICAL: Stop any existing call timer
      this.stopCallTimer();
      
      // Properly clean up any existing client before creating a new one
      if (this.client) {
        console.log('🧹 Cleaning up previous client...');
        try {
          // Try to hangup any active call first
          if (this.isInCall && typeof this.client.hangup === 'function') {
            console.log('📴 Hanging up active call...');
            this.client.hangup();
            this.isInCall = false;
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
          // Try to logout/disconnect - this should close the WebSocket properly
          if (typeof this.client.logout === 'function') {
            console.log('🚪 Logging out client...');
            this.client.logout();
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        } catch (err) {
          console.warn('⚠️ Error cleaning up old client (may be normal):', err);
        }
        // Remove client reference
        this.client = null;
        // CRITICAL: Give WebSocket EXTRA time to fully close
        // Africastalking WebSocket can take 5-8 seconds to fully close
        // This prevents "WebSocket is already in CLOSING or CLOSED state" errors
        console.log('⏳ Waiting for WebSocket to fully close (7 seconds)...');
        await new Promise(resolve => setTimeout(resolve, 7000));
        console.log('✅ Old client cleaned up, WebSocket should be closed');
      } else {
        // Even if no client, wait a moment to ensure any lingering WebSockets are closed
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
      
      // Additional wait to ensure all WebSocket connections are fully closed
      console.log('⏳ Final wait to ensure WebSocket is completely closed (2 seconds)...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Try to find and close any lingering WebSocket connections
      // This is a workaround for Africastalking library's internal WebSocket management
      try {
        // Check if there are any WebSocket instances in the global scope
        // The Africastalking library might store WebSocket references internally
        if (window.WebSocket) {
          console.log('🔍 Checking for lingering WebSocket connections...');
          // Force garbage collection hint (browser may or may not honor this)
          if (window.gc) {
            window.gc();
          }
        }
      } catch (e) {
        // Ignore errors - this is just a cleanup attempt
      }
      
      // If we've had persistent WebSocket errors, try reloading the library
      // This resets the library's internal state and clears any lingering WebSocket connections
      const shouldReloadLibrary = this.client === null; // Only if we just cleaned up
      if (shouldReloadLibrary) {
        try {
          console.log('🔄 Reloading Africastalking library to clear internal WebSocket state...');
          await this.reloadAfricastalkingLibrary();
          // Wait a bit more after reload
          await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (err) {
          console.warn('⚠️ Failed to reload library, continuing anyway:', err);
        }
      }
      
      console.log('✅ Ready for new client creation');
    },
    async initializeClientWithToken() {
      // Prevent concurrent client initialization
      if (this.isInitializingClient) {
        console.warn('⚠️ Client initialization already in progress, waiting...');
        // Wait for current initialization to complete
        let waitCount = 0;
        while (this.isInitializingClient && waitCount < 10) {
          await new Promise(resolve => setTimeout(resolve, 500));
          waitCount++;
        }
        if (this.isInitializingClient) {
          throw new Error('Client initialization timeout - previous initialization is stuck');
        }
      }
      
      // Always create fresh client for each call
      const targetNumber = this.dialedNumber;
      if (!targetNumber) throw new Error('No number provided');
      
      // Set flag to prevent concurrent initialization
      this.isInitializingClient = true;
      
      try {
        // Clean up any existing client first
        await this.cleanupOldClient();
      
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
      let retryCount = 0;
      const maxRetries = 2;
      
      while (retryCount <= maxRetries) {
        try {
          // Wait a bit longer if retrying to ensure WebSocket is fully closed
          if (retryCount > 0) {
            console.log(`Retrying client creation (attempt ${retryCount + 1}/${maxRetries + 1})...`);
            // Additional cleanup before retry
            this.client = null;
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
          
          // Create client - WebSocket errors during creation indicate a stale connection
          // We need to wait longer for the previous WebSocket to fully close
          try {
            newClient = new window.Africastalking.Client(token, params);
            // If we get here, client was created (even if there were WebSocket warnings)
            // The WebSocket errors in console are from the library's internal handling
          } catch (createError) {
            const errorMsg = createError.message || createError.toString();
            // If it's a WebSocket error, the previous WebSocket is still closing
            if (errorMsg.includes('WebSocket') && (errorMsg.includes('CLOSED') || errorMsg.includes('CLOSING'))) {
              console.warn(`⚠️ WebSocket error during client creation (attempt ${retryCount + 1})`);
              console.warn('⚠️ Previous WebSocket may still be closing. Waiting longer...');
              
              // Wait longer for WebSocket to fully close
              await new Promise(resolve => setTimeout(resolve, 3000));
              
              // Try to create again
              if (retryCount < maxRetries) {
                retryCount++;
                console.log(`🔄 Retrying client creation (attempt ${retryCount + 1}/${maxRetries + 1})...`);
                continue;
              } else {
                throw new Error('Failed to create client after multiple retries - WebSocket may be stuck');
              }
            }
            throw createError;
          }
          
          // If client was created but WebSocket errors appeared in console,
          // wait longer for the WebSocket to initialize properly and any stale connections to clear
          console.log('⏳ Waiting for client to initialize and stale WebSockets to clear (2 seconds)...');
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          console.log('Client created:', newClient);
          console.log('Client initDone:', newClient.initDone);
          console.log('Client type:', typeof newClient);
          console.log('Client methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(newClient)));
          console.log('Client has on method:', typeof newClient.on === 'function');
          
          // If we got here, client was created successfully
          // WebSocket errors in console are often non-fatal warnings
          break;
        } catch (err) {
          const errorMsg = err.message || err.toString();
          console.error(`Error creating client (attempt ${retryCount + 1}):`, err);
          
          // If it's a WebSocket error and we haven't exceeded retries, try again
          if (errorMsg.includes('WebSocket') && retryCount < maxRetries) {
            retryCount++;
            console.log('WebSocket error detected, will retry after cleanup...');
            continue;
          } else {
            // If it's not a WebSocket error or we've exhausted retries, throw
            throw new Error(`Failed to create WebRTC client: ${errorMsg}`);
          }
        }
      }
      
      if (!newClient) {
        throw new Error('Failed to create WebRTC client after multiple attempts');
      }
      
      // Verify event listeners can be attached
      if (typeof newClient.on !== 'function') {
        throw new Error('WebRTC client does not support event listeners. The Africastalking library may not be loaded correctly.');
      }
      
      // Set up event listeners - connection happens when call() is invoked
      let isConnected = false;
      
      newClient.on('connecting', () => {
        console.log('✅ WebRTC: Connecting to Africastalking...');
        console.log('✅ This happens when call() is invoked - connection is starting!');
        this.updateCallStatus('connecting');
      });
      
      newClient.on('connected', () => {
        console.log('✅ WebRTC: Connected successfully! WebSocket is open.');
        console.log('✅ Connection established - call can now proceed!');
        isConnected = true;
        // Status will be updated to 'ringing' or 'connected' by other events
      });
      
      newClient.on('ringing', () => {
        console.log('📞 ========== RINGING EVENT FIRED ==========');
        console.log('📞 Call is ringing - recipient phone is ringing!');
        console.log('✅ SUCCESS: Call reached the recipient!');
        console.log('📞 Current status before update:', this.callStatus);
        this.updateCallStatus('ringing');
        console.log('📞 Status after update:', this.callStatus);
        console.log('📞 ==========================================');
      });
      
      newClient.on('callestablished', () => {
        console.log('✅ ========== CALL ESTABLISHED EVENT FIRED (initializeClientWithToken) ==========');
        console.log('✅ Call established successfully! Connection is live - recipient answered!');
        console.log('✅ Current status before update:', this.callStatus);
        console.log('✅ Current isInCall before update:', this.isInCall);
        
        // CRITICAL: Set isInCall to true FIRST, then update status
        // This ensures the watcher and polling can detect the change
        console.log('🔄 STEP 1: Setting isInCall to true');
        this.isInCall = true; // CRITICAL: Set to true when recipient answers
        
        // Force immediate update
        this.$forceUpdate();
        
        // Wait a moment for reactivity
        this.$nextTick(() => {
          console.log('🔄 STEP 2: Updating status to connected');
          this.updateCallStatus('connected');
          
          this.loading = false;
          this.isMuted = false;
          this.isOnHold = false;
          this.showKeypadInCall = false;
          
          console.log('✅ Status after update:', this.callStatus);
          console.log('✅ isInCall after update:', this.isInCall);
          
          // Initialize audio streams
          this.initializeCallAudio();
          
          // Start call duration timer immediately
          this.startCallTimer();
          console.log('✅ Call timer started - duration will now display');
          
          // Force UI update again to ensure duration shows
          this.$forceUpdate();
          
          // Verify after another tick
          this.$nextTick(() => {
            console.log('✅ Final verification - callStatus:', this.callStatus, 'isInCall:', this.isInCall, 'callDuration:', this.callDuration);
            // Force one more update to be sure
            if (this.callStatus !== 'connected') {
              console.error('❌ Status mismatch! Forcing to connected');
              this.callStatus = 'connected';
              this.$forceUpdate();
            }
          });
        });
        
        console.log('✅ Status set to connected, isInCall=true, UI should show call duration');
        console.log('✅ ===================================================');
      });
      
      newClient.on('callended', () => {
        console.log('📴 Call ended event received (from initializeClientWithToken)');
        console.log('📴 Call terminated - recipient ended the call');
        console.log('📴 Current isInCall state:', this.isInCall);
        console.log('📴 Current callStatus:', this.callStatus);
        
        const wasInCall = this.isInCall || this.callStatus === 'connected' || this.callStatus === 'ringing';
        
        // IMMEDIATELY stop polling to prevent status from being reset
        if (this.statusUpdateInterval) {
          console.log('🛑 Stopping status polling immediately');
          clearInterval(this.statusUpdateInterval);
          this.statusUpdateInterval = null;
        }
        
        // IMMEDIATELY stop call duration timer
        this.stopCallTimer();
        console.log('🛑 Call duration timer stopped');
        
        // CRITICAL: Set isInCall to false FIRST, then update status
        // This ensures the watcher and polling can detect the change
        console.log('🔄 STEP 1: Setting isInCall to false');
        this.isInCall = false; // Set to false so UI shows "CALL ENDED" status text
        
        // Force immediate update
        this.$forceUpdate();
        
        // Wait a moment for reactivity
        this.$nextTick(() => {
          console.log('🔄 STEP 2: Updating status to ended');
          this.updateCallStatus('ended');
          this.loading = false;
          
          console.log('✅ Status after update:', this.callStatus);
          console.log('✅ isInCall after update:', this.isInCall);
          
          // Force UI update again to ensure "CALL ENDED" shows
          this.$forceUpdate();
          
          // Verify after another tick
          this.$nextTick(() => {
            console.log('✅ Final verification - callStatus:', this.callStatus, 'isInCall:', this.isInCall);
            // Force one more update to be sure
            if (this.callStatus !== 'ended') {
              console.error('❌ Status mismatch! Forcing to ended');
              this.callStatus = 'ended';
              this.isInCall = false;
              this.$forceUpdate();
            }
          });
        });
        
        console.log('✅ Status set to ended, isInCall=false, UI should show "CALL ENDED"');
        
        this.$nextTick(() => {
          console.log('✅ Status updated to: ended (from initializeClientWithToken)');
        });
        
        // Show notification IMMEDIATELY before any cleanup - show if we were in a call
        if (wasInCall) {
          console.log('📴 Showing notifications: Recipient ended the call');
          
          // Show banner immediately
          this.showCallEndedNotification = true;
          // Auto-hide banner after 10 seconds
          setTimeout(() => {
            this.showCallEndedNotification = false;
          }, 10000);
          
          // Show alert immediately (can't be missed) - this will pop up right away
          alert('📴 Call Ended\n\nThe recipient has terminated the call.');
          
          // Show toast notification
          try {
            const toast = useToast();
            toast.error('📴 Call Ended: The recipient has terminated the call.', {
              timeout: 8000,
              position: 'top-center',
              closeOnClick: true,
              pauseOnFocusLoss: true,
              pauseOnHover: true
            });
            console.log('✅ Toast notification shown');
          } catch (error) {
            console.error('❌ Error showing toast:', error);
          }
          
          console.log('✅ All notifications triggered');
        } else {
          console.log('⚠️ Not showing notifications - was not in a call');
        }
        
        // Clean up call resources but KEEP status as 'ended'
        // Don't call terminateCall as it might reset the status
        console.log('📴 Cleaning up call resources while preserving ended status');
        this.cleanupCallAudio();
        this.stopCallTimer();
        // Keep status as 'ended' - don't reset it
        // Keep isInCall as false (already set above)
        // Don't change tab - keep showing the call ended status
      });
      
      newClient.on('disconnected', () => {
        console.log('⚠️ WebRTC: Disconnected event received');
        console.log('📴 Current isInCall state:', this.isInCall);
        console.log('📴 Current callStatus:', this.callStatus);
        
        // IMMEDIATELY stop polling to prevent status from being reset
        if (this.statusUpdateInterval) {
          console.log('🛑 Stopping status polling immediately');
          clearInterval(this.statusUpdateInterval);
          this.statusUpdateInterval = null;
        }
        
        // IMMEDIATELY stop call duration timer
        this.stopCallTimer();
        console.log('🛑 Call duration timer stopped');
        
        // Store state BEFORE any cleanup
        const wasInCall = this.isInCall || this.callStatus === 'connected' || this.callStatus === 'ringing';
        console.log('📴 wasInCall (determined from state):', wasInCall);
        
        isConnected = false;
        
        // Terminate the call when disconnected (if in call, will show notification)
        if (wasInCall) {
          console.log('📴 Call terminated - recipient may have ended the call');
          
          // Update status immediately - FORCE it to 'ended'
          console.log('🔄 FORCING status to "ended" and isInCall to false');
          this.updateCallStatus('ended');
          this.isInCall = false; // Set to false so UI shows "CALL ENDED" status text
          this.loading = false;
          console.log('✅ Status set to ended, isInCall=false, UI should show "CALL ENDED"');
          // Double-check it's set
          setTimeout(() => {
            if (this.callStatus !== 'ended') {
              console.error(`❌ Status was reset! Forcing it back to 'ended'`);
              this.updateCallStatus('ended');
              this.isInCall = false;
            }
          }, 100);
          
          // Show notification IMMEDIATELY
          console.log('📴 Showing notifications: Call disconnected');
          
          this.showCallEndedNotification = true;
          // Auto-hide banner after 10 seconds
          setTimeout(() => {
            this.showCallEndedNotification = false;
          }, 10000);
          
          // Show alert immediately (can't be missed) - this will pop up right away
          alert('📴 Call Disconnected\n\nThe call has been disconnected. The recipient may have ended the call.');
          
          try {
            const toast = useToast();
            toast.error('📴 Call Disconnected: The recipient may have ended the call.', {
              timeout: 8000,
              position: 'top-center',
              closeOnClick: true,
              pauseOnFocusLoss: true,
              pauseOnHover: true
            });
            console.log('✅ Toast notification shown');
          } catch (error) {
            console.error('❌ Error showing toast:', error);
          }
          
          console.log('✅ All notifications triggered');
          
          // Clean up call resources but KEEP status as 'ended'
          // Don't call terminateCall as it might reset the status
          console.log('📴 Cleaning up call resources while preserving ended status');
          this.cleanupCallAudio();
          // Status already set to 'ended' above - don't reset it
          // Keep isInCall as false (already set above)
          // Don't change tab - keep showing the call ended status
        } else {
          console.log('📴 Disconnected but not in call - ignoring');
        }
      });
      
      // Handle errors - WebSocket errors during ICE candidate sending are often non-fatal
      // The Africastalking library handles WebSocket reconnection internally
      let websocketErrorCount = 0;
      newClient.on('error', (e) => {
        const errorMsg = e?.message || e?.error || (typeof e === 'string' ? e : JSON.stringify(e));
        // WebSocket errors during ICE candidate sending are often non-fatal
        // These occur when the library tries to send ICE candidates but the WebSocket
        // is temporarily in a closing state - the library will reconnect automatically
        if (errorMsg.includes('WebSocket') && (errorMsg.includes('CLOSED') || errorMsg.includes('CLOSING'))) {
          websocketErrorCount++;
          // Only log first few to avoid console spam
          if (websocketErrorCount <= 2) {
            console.warn(`⚠️ WebSocket error during call setup (non-fatal, library will reconnect):`, errorMsg.substring(0, 100));
          }
          // Don't throw - these errors often don't prevent the call from working
          // The call may still connect successfully despite these errors
        } else if (errorMsg.includes('Cannot read properties') || errorMsg.includes('code')) {
          // This is the library's internal error when processing server messages
          console.warn('⚠️ Africastalking library internal error (may be non-fatal):', errorMsg);
          console.warn('⚠️ This could be due to unexpected server response format');
          console.warn('⚠️ Call may still work - monitoring for call events...');
        } else {
          console.error('❌ WebRTC error:', errorMsg);
        }
      });
      
      // Store client
      this.client = newClient;
      console.log('✅ Client created. Waiting for WebSocket connection...');
      
      // IMPORTANT: Africastalking client connects LAZILY when call() is invoked
      // It does NOT connect automatically upon creation
      // So we don't wait for connection here - we'll make the call and let it connect
      console.log('✅ Client created and event listeners set up.');
      console.log('ℹ️ Note: Africastalking client connects when call() is invoked, not on creation.');
      console.log('ℹ️ WebSocket connection will be established during the call process.');
      
      // Give a brief moment for client to initialize internally
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return newClient;
      } finally {
        // Always clear the flag, even if there was an error
        this.isInitializingClient = false;
      }
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
      
      // Note: Africastalking WebRTC may require HTTPS
      // HTTP connections (even localhost) are often blocked by the service
      const isLocalhost = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
      const isHttps = location.protocol === 'https:';
      
      if (!isHttps && isLocalhost) {
        // Just log a warning, don't block the user
        console.warn('⚠️ Running on localhost with HTTP - calls may not work');
        console.warn('⚠️ Africastalking WebRTC typically requires HTTPS');
      }
      
      console.log('Environment check:', {
        protocol: location.protocol,
        hostname: location.hostname,
        isHttps: isHttps,
        isLocalhost: isLocalhost,
        hasAfricastalking: !!window.Africastalking,
        hasMediaDevices: !!navigator.mediaDevices,
        warning: !isHttps && isLocalhost ? 'HTTP on localhost may cause WebSocket failures' : 'OK'
      });
      
      try {
        // CRITICAL: Clean up any existing polling interval from previous calls FIRST
        // Do this multiple times to ensure it's cleared
        if (this.statusUpdateInterval) {
          console.log('🧹 Cleaning up existing polling interval from previous call');
          clearInterval(this.statusUpdateInterval);
          this.statusUpdateInterval = null;
        }
        // Double-check - clear it again after a brief moment
        setTimeout(() => {
          if (this.statusUpdateInterval) {
            console.log('🧹 Force cleaning up polling interval (second attempt)');
            clearInterval(this.statusUpdateInterval);
            this.statusUpdateInterval = null;
          }
        }, 100);
        
        // CRITICAL: Stop any existing call timer
        this.stopCallTimer();
        
        // CRITICAL: Clear any pending return to keypad timer
        if (this.returnToKeypadTimer) {
          clearTimeout(this.returnToKeypadTimer);
          this.returnToKeypadTimer = null;
        }
        
        // CRITICAL: Clean up any existing client
        if (this.client) {
          try {
            if (typeof this.client.hangup === 'function') {
              this.client.hangup();
            }
          } catch (err) {
            console.warn('Error hanging up previous client:', err);
          }
          this.client = null;
        }
        
        this.loading = true;
        // Store the number for retry
        this.lastDialedNumber = this.dialedNumber;
        this.tabValue = 'inCall';
        
        // Track call start for history
        this.currentCallReceiver = this.dialedNumber;
        this.callStartTime = Date.now();
        
        // CRITICAL: Reset call state at the start of each call
        this.isInCall = false; // Start with false - will be true only when call is connected
        this.callDuration = 0; // Reset duration
        this.isMuted = false;
        this.isOnHold = false;
        this.showKeypadInCall = false;
        
        // CRITICAL: Reset status properly BEFORE setting up event listeners
        // This ensures status is correct when events fire immediately after client.call()
        if (this.callStatus === 'ended') {
          console.log('🔄 Resetting from ended status - setting to idle first');
          this.callStatus = 'idle'; // Direct assignment to ensure immediate reset
        }
        
        // Set status to connecting and force UI update immediately
        // This will now work because we allow 'connecting' from 'ended' in updateCallStatus
        this.updateCallStatus('connecting');
        console.log('📞 Call status set to: connecting (UI should show "CALLING...")');
        console.log('📞 Initial state - isInCall:', this.isInCall, 'callStatus:', this.callStatus);
        
        // Initialize WebRTC client and wait for it to be ready
        console.log('Initializing WebRTC client...');
        const client = await this.initializeClientWithToken();
        console.log('Client initialized and ready, preparing to make call...');
        console.log('Client state:', {
          initDone: client.initDone,
          hasCall: typeof client.call === 'function'
        });
        
        // Format the number
        const formatted = this.formatNumber(this.dialedNumber);
        console.log('Calling number:', formatted);
        
        // Set up call-specific event listeners BEFORE making the call
        // This ensures we catch all call events
        
        // Track connection status
        let connectionEstablished = false;
        let callRinging = false;
        let callEstablished = false;
        
        // Clean up any existing polling interval
        if (this.statusUpdateInterval) {
          clearInterval(this.statusUpdateInterval);
          this.statusUpdateInterval = null;
        }
        
        // Function to force status update (Android-style) - uses unified method
        const updateStatus = (newStatus) => {
          this.updateCallStatus(newStatus);
        };
        
        // Android-style polling: Simple and reliable
        // 1. CALLING → RINGING (after 2s fallback)
        // 2. RINGING → CONNECTED (when audio starts playing OR callestablished event fires)
        // 3. CONNECTED → ENDED (when callended event fires)
        const startStatusPolling = () => {
          // CRITICAL: Clean up any existing polling interval FIRST
          if (this.statusUpdateInterval) {
            console.log('🧹 Cleaning up existing polling interval before starting new one');
            clearInterval(this.statusUpdateInterval);
            this.statusUpdateInterval = null;
          }
          
          // Set up MutationObserver to watch for audio/video elements (Android-style detection)
          let mutationObserver = null;
          const audioPlayListeners = new Map(); // Track listeners to avoid duplicates
          
          // Function to add play listener to audio/video elements
          const addPlayListener = (el) => {
            if (audioPlayListeners.has(el)) return; // Already has listener
            
            const playHandler = () => {
              console.log('📊 ========== Android-style: AUDIO ELEMENT STARTED PLAYING ==========');
              console.log('📊 Audio element started playing - call is connected!');
              console.log('📊 Element details:', {
                src: el.src ? el.src.substring(0, 50) : 'none',
                hasSrcObject: !!el.srcObject,
                paused: el.paused,
                currentTime: el.currentTime
              });
              
              if (this.callStatus === 'ringing' && !this.isInCall) {
                console.log('📊 Updating to CONNECTED state (audio started playing)');
                this.isInCall = true;
                updateStatus('connected');
                if (this.callDuration === 0) {
                  this.startCallTimer();
                }
              }
            };
            
            el.addEventListener('play', playHandler);
            audioPlayListeners.set(el, playHandler);
            console.log('✅ Added play listener to audio/video element');
          };
          
          // Add listeners to existing audio/video elements
          document.querySelectorAll('audio, video').forEach(addPlayListener);
          
          try {
            mutationObserver = new MutationObserver((mutations) => {
              // Check if any new audio/video elements were added
              mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                  if (node.nodeType === 1) { // Element node
                    if (node.tagName === 'AUDIO' || node.tagName === 'VIDEO') {
                      console.log('📊 ========== Android-style: NEW AUDIO/VIDEO ELEMENT DETECTED ==========');
                      console.log('📊 Africastalking added audio/video element - adding play listener...');
                      
                      // Add play listener to detect when it starts playing
                      addPlayListener(node);
                      
                      // Also check for stream immediately
                      setTimeout(() => {
                        const actualState = this.checkActualCallState();
                        console.log('📊 MutationObserver detection state:', actualState);
                        
                        if (actualState.hasRemoteStream || actualState.hasActiveTracks || actualState.hasWebRTCPeer) {
                          console.log('📊 ✅ CONFIRMED: Remote stream detected via MutationObserver!');
                          if (this.callStatus === 'ringing' && !this.isInCall) {
                            console.log('📊 Updating to CONNECTED state');
                            this.isInCall = true;
                            updateStatus('connected');
                            if (this.callDuration === 0) {
                              this.startCallTimer();
                            }
                          }
                        } else {
                          console.log('📊 ⚠️ Audio/video element found but no stream detected yet - waiting for play event');
                        }
                      }, 200);
                    }
                  }
                });
              });
            });
            
            // Start observing the document body for new elements
            mutationObserver.observe(document.body, {
              childList: true,
              subtree: true
            });
            console.log('✅ MutationObserver started - watching for audio/video elements');
          } catch (err) {
            console.warn('⚠️ Could not set up MutationObserver:', err);
          }
          
          let pollCount = 0;
          const maxPolls = 600; // Poll for up to 5 minutes (0.5s intervals)
          let lastStatus = this.callStatus;
          let lastIsInCall = this.isInCall;
          let hasShownRinging = false;
          
          console.log('🔄 Starting Android-style status polling');
          console.log('🔄 Initial status:', this.callStatus, 'isInCall:', this.isInCall);
          
          this.statusUpdateInterval = setInterval(() => {
            pollCount++;
            
            // Android-style: Stop if call ended
            if (this.callStatus === 'ended') {
              this._connectionConfirmationCount = 0; // Reset confirmation counter
              if (mutationObserver) mutationObserver.disconnect();
              // Clean up play listeners
              if (audioPlayListeners) {
                audioPlayListeners.forEach((handler, el) => {
                  try {
                    el.removeEventListener('play', handler);
                  } catch (err) {
                    // Ignore errors
                  }
                });
                audioPlayListeners.clear();
              }
              clearInterval(this.statusUpdateInterval);
              this.statusUpdateInterval = null;
              return;
            }
            
            // Android-style: Stop if status is idle (call was reset)
            if (this.callStatus === 'idle' && !this.isInCall && pollCount > 2) {
              if (mutationObserver) mutationObserver.disconnect();
              clearInterval(this.statusUpdateInterval);
              this.statusUpdateInterval = null;
              return;
            }
            
            // Android-style: CALLING → RINGING (after 2 seconds if event didn't fire)
            if (this.callStatus === 'connecting' && pollCount > 4 && !hasShownRinging) {
              console.log('📊 Android-style: CALLING → RINGING (fallback after 2s)');
              updateStatus('ringing');
              hasShownRinging = true;
              return;
            }
            
            // Android-style: RINGING → CONNECTED (ONLY when isInCall becomes true)
            // This means recipient ACTUALLY answered - no time-based assumptions!
            if (this.isInCall && this.callStatus !== 'connected' && this.callStatus !== 'ended') {
              console.log('📊 ========== Android-style: RINGING → CONNECTED ==========');
              console.log('📊 Recipient answered! isInCall changed from', lastIsInCall, 'to', this.isInCall);
              updateStatus('connected');
              if (this.callDuration === 0) {
                this.startCallTimer();
              }
              lastIsInCall = this.isInCall;
              console.log('📊 ===================================================');
              return;
            }
            
            // Android-style: AGGRESSIVE detection - check if recipient answered
            // Start detecting immediately when ringing (no delay)
            // This ensures we catch the connection as soon as recipient answers
            if (this.callStatus === 'ringing' && !callEstablished && !this.isInCall) {
              // Log every 10 polls (5 seconds) for debugging
              if (pollCount % 10 === 0) {
                const audioElements = document.querySelectorAll('audio, video');
                console.log(`📊 Detection check #${pollCount} (${(pollCount * 0.5).toFixed(1)}s):`, {
                  audioElementsCount: audioElements.length,
                  isInCall: this.isInCall,
                  callEstablished: callEstablished,
                  status: this.callStatus
                });
                if (audioElements.length > 0) {
                  audioElements.forEach((el, idx) => {
                    console.log(`📊 Audio element #${idx}:`, {
                      src: el.src ? el.src.substring(0, 50) : 'none',
                      hasSrcObject: !!el.srcObject,
                      paused: el.paused,
                      currentTime: el.currentTime,
                      ended: el.ended
                    });
                  });
                }
              }
              
              try {
                const audioElements = document.querySelectorAll('audio, video');
                let foundConnection = false;
                let connectionReason = '';
                
                // Log detection attempt every 4 polls (2 seconds) for debugging
                if (pollCount % 4 === 0 && pollCount >= 4) {
                  console.log(`📊 🔍 Detection attempt #${pollCount} (${(pollCount * 0.5).toFixed(1)}s) - checking ${audioElements.length} audio/video elements`);
                }
                
                for (const el of audioElements) {
                  try {
                    // Android-style: ONLY detect connection when audio is ACTUALLY playing
                    // This is the most reliable indicator - if audio is playing, recipient answered
                    // We require BOTH conditions:
                    // 1. Audio element is playing (not paused, has currentTime > 0)
                    // 2. Has MediaStream with live tracks
                    // The 3-second confirmation period (below) ensures it's not a false positive
                    if (!el.paused && el.currentTime > 0 && !el.ended) {
                      if (el.srcObject && el.srcObject instanceof MediaStream) {
                        const tracks = el.srcObject.getTracks();
                        const liveTracks = tracks.filter(t => t.readyState === 'live' && t.enabled);
                        if (liveTracks.length > 0) {
                          // Audio is playing AND has live MediaStream tracks
                          // The confirmation period (3 seconds) will ensure it's continuous
                          foundConnection = true;
                          connectionReason = 'Playing audio with live MediaStream tracks';
                          console.log(`📊 ✅ Method 1 detected: Playing audio with ${liveTracks.length} live tracks`);
                          break;
                        } else {
                          if (pollCount % 4 === 0) {
                            console.log(`📊 ⚠️ Method 1: Audio playing but no live tracks (${tracks.length} total tracks)`);
                          }
                        }
                      } else {
                        if (pollCount % 4 === 0) {
                          console.log(`📊 ⚠️ Method 1: Audio playing but no MediaStream in srcObject`);
                        }
                      }
                    }
                    
                    // Method 2: Check for MediaStream with live tracks (even if not playing)
                    // AGGRESSIVE: Also detect if MediaStream has live tracks (recipient answered)
                    // This catches cases where audio element exists but isn't playing yet
                    // Start checking after 1 second of ringing (pollCount >= 2) for faster detection
                    if (pollCount >= 2 && el.srcObject && el.srcObject instanceof MediaStream) {
                      const tracks = el.srcObject.getTracks();
                      const liveTracks = tracks.filter(t => t.readyState === 'live' && t.enabled);
                      if (liveTracks.length > 0) {
                        // MediaStream has live tracks - recipient answered
                        foundConnection = true;
                        connectionReason = 'MediaStream with live tracks';
                        console.log(`📊 ✅ Method 2 detected: ${liveTracks.length} live tracks found (not playing yet)`);
                        break;
                      } else {
                        if (pollCount >= 2 && pollCount % 4 === 0 && tracks.length > 0) {
                          console.log(`📊 ⚠️ Method 2: MediaStream exists with ${tracks.length} tracks but none are live yet`);
                        }
                      }
                    } else if (pollCount >= 2 && pollCount % 4 === 0) {
                      if (!el.srcObject) {
                        console.log(`📊 ⚠️ Method 2: No srcObject on audio element`);
                      }
                    }
                    
                    // Method 3: Blob URL with MediaStream (strict - requires playing)
                    // After 10 seconds, check if blob URL is playing with MediaStream
                    if (pollCount >= 20 && el.src && (el.src.startsWith('blob:') || el.src.startsWith('polyblob:'))) {
                      if (!el.paused && el.currentTime > 0 && !el.ended) {
                        if (el.srcObject && el.srcObject instanceof MediaStream) {
                          const tracks = el.srcObject.getTracks();
                          const liveTracks = tracks.filter(t => t.readyState === 'live' && t.enabled);
                          if (liveTracks.length > 0) {
                            foundConnection = true;
                            connectionReason = `Playing blob URL audio with live MediaStream tracks after ${(pollCount * 0.5).toFixed(1)} seconds`;
                            break;
                          }
                        }
                      }
                    }
                    
                    // Method 4: ULTRA AGGRESSIVE FALLBACK - Blob URL exists (even without srcObject)
                    // Africastalking library creates audio element with blob URL when call is received
                    // This is the PRIMARY detection method since srcObject often isn't set
                    // Check IMMEDIATELY when ringing starts (pollCount >= 1 = 0.5 seconds)
                    // This ensures we catch the connection as soon as blob URL appears
                    if (pollCount >= 1) {
                      // Check if blob URL exists
                      if (el.src && (el.src.startsWith('blob:') || el.src.startsWith('polyblob:'))) {
                        // Blob URL exists - this indicates Africastalking has set up audio for the call
                        // If blob URL exists, recipient likely answered (even if srcObject isn't set yet)
                        foundConnection = true;
                        connectionReason = `Blob URL audio element exists after ${(pollCount * 0.5).toFixed(1)} seconds (recipient answered)`;
                        console.log(`📊 ✅ Method 4 detected: Blob URL exists (${el.src.substring(0, 30)}...) - assuming connection`);
                        console.log(`📊 Method 4 details: pollCount=${pollCount}, paused=${el.paused}, currentTime=${el.currentTime}, hasSrcObject=${!!el.srcObject}`);
                        break;
                      } else if (pollCount % 2 === 0) {
                        // Log every second if no blob URL found yet
                        console.log(`📊 Method 4 check: No blob URL found yet (pollCount=${pollCount}, src=${el.src ? el.src.substring(0, 30) : 'none'})`);
                      }
                    }
                  } catch (err) {
                    // Ignore errors
                  }
                }
                
                // If connection detected, mark as connected
                // AGGRESSIVE: Fast detection - immediate for playing audio, minimal confirmation for others
                if (foundConnection) {
                  // For playing audio (Method 1) - connect immediately (most reliable)
                  const isPlayingAudio = connectionReason.includes('Playing audio with live MediaStream tracks');
                  // For blob URL fallback (Method 4) - require 2 polls (1 second) confirmation (less reliable)
                  const isBlobUrlFallback = connectionReason.includes('Blob URL audio element exists after');
                  
                  if (isPlayingAudio) {
                    // Playing audio is the most reliable - connect immediately
                    console.log('📊 ========== ✅ CALL CONNECTED (Playing Audio) ==========');
                    console.log(`📊 Recipient answered! Reason: ${connectionReason}`);
                    this.isInCall = true;
                    this.connectionTime = Date.now(); // Record connection time
                    console.log('📊 Connection time recorded:', new Date(this.connectionTime).toISOString());
                    this._connectionConfirmationCount = 0;
                    updateStatus('connected');
                    this.startCallTimer();
                    lastIsInCall = this.isInCall;
                    console.log('📊 Duration timer started - should show in UI now');
                    console.log('📊 ===================================================');
                    return;
                  } else if (isBlobUrlFallback) {
                    // Blob URL fallback - if we've been ringing for 2+ seconds, connect immediately
                    // Otherwise require 1 poll (0.5 seconds) confirmation
                    const secondsRinging = pollCount * 0.5;
                    if (secondsRinging >= 2.0) {
                      // Been ringing for 2+ seconds and blob URL exists - connect immediately
                      console.log('📊 ========== ✅ CALL CONNECTED (Blob URL - Immediate) ==========');
                      console.log(`📊 Recipient answered! Reason: ${connectionReason}`);
                      console.log(`📊 Been ringing for ${secondsRinging.toFixed(1)}s - connecting immediately`);
                      this.isInCall = true;
                      this.connectionTime = Date.now(); // Record connection time to prevent premature ending
                      console.log('📊 Connection time recorded:', new Date(this.connectionTime).toISOString());
                      this._connectionConfirmationCount = 0;
                      updateStatus('connected');
                      this.startCallTimer();
                      lastIsInCall = this.isInCall;
                      console.log('📊 Duration timer started - should show in UI now');
                      console.log('📊 ===================================================');
                      return;
                    } else {
                      // Less than 2 seconds - require 1 poll (0.5 seconds) confirmation
                      if (!this._connectionConfirmationCount) {
                        // First detection - wait just 0.5 seconds for confirmation
                        this._connectionConfirmationCount = 1;
                        console.log(`📊 ✅ Connection detected: ${connectionReason} - confirming in next poll (0.5s)...`);
                        return;
                      } else {
                        // Confirmed - connection detected in 2 consecutive polls (0.5 seconds total)
                        console.log('📊 ========== ✅ CALL CONNECTED (Blob URL Fallback) ==========');
                        console.log(`📊 Recipient answered! Reason: ${connectionReason}`);
                        console.log(`📊 Connection confirmed in 2 polls (0.5 seconds)`);
                        this.isInCall = true;
                        this.connectionTime = Date.now(); // Record connection time
                        console.log('📊 Connection time recorded:', new Date(this.connectionTime).toISOString());
                        this._connectionConfirmationCount = 0;
                        updateStatus('connected');
                        this.startCallTimer();
                        lastIsInCall = this.isInCall;
                        console.log('📊 Duration timer started - should show in UI now');
                        console.log('📊 ===================================================');
                        return;
                      }
                    }
                  } else {
                    // For other detections (Method 2, Method 3), require just 1 poll (0.5 seconds) confirmation
                    if (!this._connectionConfirmationCount) {
                      // First detection - wait just 0.5 seconds for confirmation
                      this._connectionConfirmationCount = 1;
                      console.log(`📊 ✅ Connection detected: ${connectionReason} - confirming in next poll (0.5s)...`);
                      return;
                    } else {
                      // Confirmed - connection detected in 2 consecutive polls (0.5 seconds total)
                      console.log('📊 ========== ✅ CALL CONNECTED ==========');
                      console.log(`📊 Recipient answered! Reason: ${connectionReason}`);
                      console.log(`📊 Connection confirmed in 2 polls (0.5 seconds)`);
                      this.isInCall = true;
                      this.connectionTime = Date.now(); // Record connection time
                      console.log('📊 Connection time recorded:', new Date(this.connectionTime).toISOString());
                      this._connectionConfirmationCount = 0;
                      updateStatus('connected');
                      this.startCallTimer();
                      lastIsInCall = this.isInCall;
                      console.log('📊 Duration timer started - should show in UI now');
                      console.log('📊 ===================================================');
                      return;
                    }
                  }
                } else {
                  // Reset confirmation if connection not found
                  this._connectionConfirmationCount = 0;
                }
              } catch (err) {
                console.warn('⚠️ Error checking for connection:', err);
              }
            }
            
            // Android-style: Check if audio stopped playing (call ended)
            if (this.callStatus === 'connected' && this.isInCall && pollCount % 4 === 0) {
              // Simple check: Is audio still playing?
              try {
                const audioElements = document.querySelectorAll('audio, video');
                let audioStillPlaying = false;
                
                for (const el of audioElements) {
                  try {
                    if (!el.paused && el.currentTime > 0 && !el.ended) {
                      audioStillPlaying = true;
                      break;
                    }
                  } catch (err) {
                    // Ignore errors
                  }
                }
                
                // If audio stopped playing and we've been connected for a while, call might have ended
                // But only rely on callended event for this - don't auto-detect end
                // (This is just for logging/debugging)
              } catch (err) {
                // Ignore errors
              }
            }
            
            // Android-style: CONNECTED → ENDED (when isInCall becomes false)
            // This means recipient ACTUALLY hung up
            if (this.callStatus === 'connected' && !this.isInCall && lastIsInCall === true) {
              console.log('📴 ========== Android-style: CONNECTED → ENDED ==========');
              console.log('📴 Recipient hung up! isInCall changed from', lastIsInCall, 'to', this.isInCall);
              updateStatus('ended');
              this.stopCallTimer();
              if (mutationObserver) mutationObserver.disconnect();
              clearInterval(this.statusUpdateInterval);
              this.statusUpdateInterval = null;
              console.log('📴 ===================================================');
              return;
            }
            
            // Android-style: Remote stream detection is handled in the checkActualCallState() method above
            // This keeps the code clean and follows Android behavior exactly
            
            // Track state changes
            if (this.isInCall !== lastIsInCall) {
              console.log(`📊 Android-style: isInCall changed ${lastIsInCall} → ${this.isInCall}`);
              lastIsInCall = this.isInCall;
            }
            
            if (this.callStatus !== lastStatus) {
              console.log(`📊 Android-style: Status changed ${lastStatus} → ${this.callStatus}`);
              lastStatus = this.callStatus;
            }
            
            // Log every 20 polls (10 seconds) for debugging
            if (pollCount % 20 === 0) {
              console.log(`📊 Android polling #${pollCount} - status: ${this.callStatus}, isInCall: ${this.isInCall}, duration: ${this.callDuration}`);
            }
            
            if (pollCount >= maxPolls) {
              console.log('⏱️ Polling timeout - stopping');
              if (mutationObserver) mutationObserver.disconnect();
              clearInterval(this.statusUpdateInterval);
              this.statusUpdateInterval = null;
            }
          }, 500); // Poll every 500ms
        };
        
        // Monitor connection events
        console.log('🔧 Setting up event listeners on client...');
        console.log('🔧 Client type:', typeof client);
        console.log('🔧 Client has on method:', typeof client.on === 'function');
        
        client.on('connecting', () => {
          console.log('🔄 WebSocket: Connecting...');
          updateStatus('connecting');
        });
        
        client.on('connected', () => {
          console.log('✅ WebSocket: Connected successfully!');
          connectionEstablished = true;
          // Keep status as connecting until we get ringing or callestablished
          // Status will be updated to 'ringing' or 'connected' by other events
        });
        
        client.on('ringing', () => {
          console.log('📞 ========== RINGING EVENT FIRED (handleCall) ==========');
          console.log('📞 Call is ringing - recipient phone is ringing!');
          console.log('✅ SUCCESS: Call reached the recipient despite any library errors!');
          console.log('📞 Current status before update:', this.callStatus);
          callRinging = true;
          updateStatus('ringing');
          console.log('📞 Status after update:', this.callStatus);
          console.log('📞 ======================================================');
          // This event means the call reached the recipient's phone
        });
        
        console.log('✅ Event listeners attached to client');
        
        // CATCH-ALL: Listen for additional possible event names that might indicate call state
        // Some Africastalking library versions might use different event names
        const additionalEventNames = ['hangup', 'end', 'close', 'statechange'];
        additionalEventNames.forEach(eventName => {
          try {
            // Use once() instead of on() to avoid duplicate handlers
            const handler = (...args) => {
              console.log(`🎯 ADDITIONAL EVENT: '${eventName}' fired with args:`, args);
              // If it's a call end event, handle it
              if (eventName === 'end' || eventName === 'hangup' || eventName === 'close') {
                console.log(`📴 Detected possible call end through ${eventName} event`);
                // CRITICAL: Only end call if it was actually CONNECTED
                // Don't end during ringing - hangup events can fire for various reasons during ringing
                // (network issues, caller cancellation, etc.) but we should only mark as ended
                // if the recipient actually answered and then hung up
                if (this.callStatus === 'connected') {
                  console.log(`📴 Confirmed call end - call was connected, recipient hung up`);
                  if (this.statusUpdateInterval) {
                    clearInterval(this.statusUpdateInterval);
                    this.statusUpdateInterval = null;
                  }
                  this.stopCallTimer();
                  this.isInCall = false;
                  this.updateCallStatus('ended');
                } else if (this.callStatus === 'ringing') {
                  console.log(`📴 Hangup event during ringing - ignoring (call never connected)`);
                  // Don't mark as ended during ringing - the call never actually connected
                  // This could be a network issue, caller cancellation, or other non-recipient-hangup reason
                }
              }
            };
            // Try to attach listener - some events might not exist
            if (typeof client.on === 'function') {
              client.on(eventName, handler);
            }
          } catch (err) {
            // Some events might not be supported - that's okay, just log it
            console.log(`ℹ️ Event '${eventName}' not available:`, err.message);
          }
        });
        
        client.on('callfailed', (e) => {
          console.error('❌ Call failed:', e);
          const errorMsg = e?.message || e?.error || 'Unknown error';
          
          if (this.statusUpdateInterval) {
            clearInterval(this.statusUpdateInterval);
            this.statusUpdateInterval = null;
          }
          
          updateStatus('ended');
          this.showCallError(new Error(`Call failed: ${errorMsg}`));
          this.isInCall = false;
          this.tabValue = 'keypad';
          this.loading = false;
        });
        
        client.on('callestablished', () => {
          console.log('✅ ========== CALL ESTABLISHED EVENT FIRED ==========');
          console.log('✅ ========== THIS EVENT SHOULD FIRE WHEN RECIPIENT ANSWERS ==========');
          console.log('✅ Call established successfully! Connection is live - recipient answered!');
          console.log('✅ Current status before update:', this.callStatus);
          console.log('✅ Current isInCall before update:', this.isInCall);
          callEstablished = true;
          
          // CRITICAL: Set isInCall to true FIRST, then update status
          // This ensures the watcher and polling can detect the change
          console.log('🔄 STEP 1: Setting isInCall to true');
          this.isInCall = true;
          this.connectionTime = Date.now(); // Record connection time
          console.log('📊 Connection time recorded:', new Date(this.connectionTime).toISOString());
          
          // Force immediate update
          this.$forceUpdate();
          
          // Wait a moment for reactivity
          this.$nextTick(() => {
            console.log('🔄 STEP 2: Updating status to connected');
            this.updateCallStatus('connected');
            
            this.loading = false;
            this.isMuted = false;
            this.isOnHold = false;
            this.showKeypadInCall = false;
            
            console.log('✅ Status after update:', this.callStatus);
            console.log('✅ isInCall after update:', this.isInCall);
            
            // Initialize audio streams
            this.initializeCallAudio();
            
            // Start call duration timer immediately
            this.startCallTimer();
            console.log('✅ Call timer started - duration will now display');
            
            // Force UI update again to ensure duration shows
            this.$forceUpdate();
            
            // Verify after another tick
            this.$nextTick(() => {
              console.log('✅ Final verification - callStatus:', this.callStatus, 'isInCall:', this.isInCall, 'callDuration:', this.callDuration);
              // Force one more update to be sure
              if (this.callStatus !== 'connected') {
                console.error('❌ Status mismatch! Forcing to connected');
                this.callStatus = 'connected';
                this.$forceUpdate();
              }
            });
          });
          
          console.log('✅ Status set to connected, isInCall=true, UI should show call duration');
          console.log('✅ ===================================================');
        });
        
        client.on('callended', () => {
          console.log('📴 ========== CALL ENDED EVENT FIRED ==========');
          console.log('📴 ========== THIS EVENT SHOULD FIRE WHEN RECIPIENT HANGS UP ==========');
          console.log('📴 Call ended event received');
          console.log('📴 Call terminated - recipient ended the call');
          console.log('📴 Current isInCall state:', this.isInCall);
          console.log('📴 Current callStatus:', this.callStatus);
          
          // IMMEDIATELY stop polling to prevent status from being reset
          if (this.statusUpdateInterval) {
            console.log('🛑 Stopping status polling immediately');
            clearInterval(this.statusUpdateInterval);
            this.statusUpdateInterval = null;
          }
          
          // IMMEDIATELY stop call duration timer
          this.stopCallTimer();
          console.log('🛑 Call duration timer stopped');
          
          // CRITICAL: ALWAYS update to 'ended' regardless of current status
          // Call can end during ringing, connecting, or connected - all should show "CALL ENDED"
          console.log('🔄 FORCING status to "ended" - call has ended');
          this.isInCall = false;
          this.callStatus = 'ended'; // Direct assignment to bypass any protection
          this.loading = false;
          
          // Force immediate UI update
          this.$forceUpdate();
          
          // Verify and force again if needed
          this.$nextTick(() => {
            if (this.callStatus !== 'ended') {
              console.error('❌ Status was not set to ended! Forcing again');
              this.callStatus = 'ended';
              this.isInCall = false;
              this.$forceUpdate();
            }
            console.log('✅ Status confirmed as ended - UI should show "CALL ENDED"');
          });
          
          console.log('✅ Status set to ended, isInCall=false, UI should show "CALL ENDED"');
          console.log('📴 ===========================================');
          
          // Android-style: After 2 seconds, automatically return to keypad
          this.scheduleReturnToKeypad();
          
          // Set up a guard to prevent status from being reset for 5 seconds
          let statusGuardCount = 0;
          const statusGuard = setInterval(() => {
            statusGuardCount++;
            if (this.callStatus !== 'ended') {
              console.error(`❌ Status was reset to '${this.callStatus}'! Forcing it back to 'ended' (attempt ${statusGuardCount})`);
              this.updateCallStatus('ended');
              this.isInCall = false;
            }
            // Stop guarding after 5 seconds (10 checks)
            if (statusGuardCount >= 10) {
              clearInterval(statusGuard);
              console.log('✅ Status guard stopped after 5 seconds');
            }
          }, 500); // Check every 500ms
          
          // Double-check it's set immediately
          setTimeout(() => {
            if (this.callStatus !== 'ended') {
              console.error(`❌ Status was reset! Forcing it back to 'ended'`);
              this.updateCallStatus('ended');
              this.isInCall = false;
            }
          }, 100);
          
          // Show notification IMMEDIATELY before any cleanup - show if we were in a call
          if (wasInCall) {
            console.log('📴 Showing notifications: Recipient ended the call');
            
            // Show banner immediately
            this.showCallEndedNotification = true;
            // Auto-hide banner after 10 seconds
            setTimeout(() => {
              this.showCallEndedNotification = false;
            }, 10000);
            
            // Show alert immediately (can't be missed) - this will pop up right away
            alert('📴 Call Ended\n\nThe recipient has terminated the call.');
            
            // Show toast notification
            try {
              const toast = useToast();
              toast.error('📴 Call Ended: The recipient has terminated the call.', {
                timeout: 8000,
                position: 'top-center',
                closeOnClick: true,
                pauseOnFocusLoss: true,
                pauseOnHover: true
              });
              console.log('✅ Toast notification shown');
            } catch (error) {
              console.error('❌ Error showing toast:', error);
            }
            
            console.log('✅ All notifications triggered');
          } else {
            console.log('⚠️ Not showing notifications - was not in a call');
          }
          
          // Clean up call resources but KEEP status as 'ended'
          // Don't call terminateCall as it might reset the status
          console.log('📴 Cleaning up call resources while preserving ended status');
          this.cleanupCallAudio();
          this.stopCallTimer();
          // Keep status as 'ended' - don't reset it
          // Keep isInCall as false (already set above)
          // Don't change tab - keep showing the call ended status
        });
        
        // Also listen for disconnected event in case recipient hangs up
        client.on('disconnected', () => {
          console.log('📴 Disconnected event received');
          console.log('📴 Current isInCall state:', this.isInCall);
          console.log('📴 Current callStatus:', this.callStatus);
          
          // IMMEDIATELY stop polling to prevent status from being reset
          if (this.statusUpdateInterval) {
            console.log('🛑 Stopping status polling immediately');
            clearInterval(this.statusUpdateInterval);
            this.statusUpdateInterval = null;
          }
          
          // IMMEDIATELY stop call duration timer
          this.stopCallTimer();
          console.log('🛑 Call duration timer stopped');
          
          // CRITICAL: ALWAYS update to 'ended' when disconnected
          // Call can end during any state (ringing, connecting, connected) - all should show "CALL ENDED"
          console.log('📴 WebRTC disconnected - call has ended');
          
          // Store state BEFORE updating to 'ended' for notifications
          const wasCallActive = this.callStatus === 'ringing' || this.callStatus === 'connected' || this.isInCall;
          
          // Update status immediately - FORCE it to 'ended'
          console.log('🔄 FORCING status to "ended" and isInCall to false');
          this.isInCall = false;
          this.callStatus = 'ended'; // Direct assignment to bypass any protection
          this.loading = false;
          
          // Force immediate UI update
          this.$forceUpdate();
          
          console.log('✅ Status set to ended, isInCall=false, UI should show "CALL ENDED"');
          
          // Android-style: Show "CALL ENDED" for 2 seconds, then automatically return to keypad
          this.scheduleReturnToKeypad();
          
          // Double-check it's set
          this.$nextTick(() => {
            if (this.callStatus !== 'ended') {
              console.error(`❌ Status was reset! Forcing it back to 'ended'`);
              this.callStatus = 'ended';
              this.isInCall = false;
              this.$forceUpdate();
            }
          });
            
            // Show notification IMMEDIATELY before any cleanup
          // Show notifications if call was active (ringing or connected)
          if (wasCallActive) {
            console.log('📴 Showing notifications: Call disconnected');
            
            // Show banner immediately
            this.showCallEndedNotification = true;
            // Auto-hide banner after 10 seconds
            setTimeout(() => {
              this.showCallEndedNotification = false;
            }, 10000);
            
            // Show alert immediately (can't be missed) - this will pop up right away
            alert('📴 Call Disconnected\n\nThe call has been disconnected. The recipient may have ended the call.');
            
            // Show toast notification
            try {
              const toast = useToast();
              toast.error('📴 Call Disconnected: The recipient may have ended the call.', {
                timeout: 8000,
                position: 'top-center',
                closeOnClick: true,
                pauseOnFocusLoss: true,
                pauseOnHover: true
              });
              console.log('✅ Toast notification shown');
            } catch (error) {
              console.error('❌ Error showing toast:', error);
            }
            
            console.log('✅ All notifications triggered');
          }
          
          // Clean up call resources but KEEP status as 'ended'
          // Don't call terminateCall as it might reset the status
          console.log('📴 Cleaning up call resources while preserving ended status');
          this.cleanupCallAudio();
          // Status already set to 'ended' above - don't reset it
          // Keep isInCall as false (already set above)
          // Don't change tab - keep showing the call ended status
        });
        
        // Request microphone permission before making the call (non-blocking)
        // This ensures audio is ready when the call connects
        // Note: This is optional - the call will work without it, just won't be able to speak
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          console.log('Requesting microphone permission...');
          try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            console.log('✅ Microphone permission granted');
            // Store the stream for later use
            this.localStream = stream;
            // Stop the stream temporarily - will be used when call is established
            stream.getTracks().forEach(track => track.stop());
          } catch (micError) {
            // Handle different error types
            if (micError.name === 'NotFoundError' || micError.name === 'DevicesNotFoundError') {
              console.warn('⚠️ No microphone device found. Call will work but you won\'t be able to speak.');
            } else if (micError.name === 'NotAllowedError' || micError.name === 'PermissionDeniedError') {
              console.warn('⚠️ Microphone permission denied. Call will work but you won\'t be able to speak.');
            } else {
              console.warn('⚠️ Microphone access error:', micError.name, micError.message);
            }
            // Continue anyway - user can still make call but won't be able to speak
            // The call will work for listening, just not speaking
          }
        } else {
          console.warn('⚠️ getUserMedia not available. Audio may not work properly.');
        }
        
        // Make the call - Africastalking client connects when call() is invoked
        console.log('Initiating call to:', formatted);
        console.log('Client state before call:', {
          initDone: client.initDone,
          hasCall: typeof client.call === 'function',
          clientType: typeof client
        });
        
        // Explicitly set status to connecting
        this.updateCallStatus('connecting');
        
        // Brief wait to ensure client is ready
        await new Promise(resolve => setTimeout(resolve, 500));
        
        try {
          if (typeof client.call !== 'function') {
            throw new Error('Client does not have a call method');
          }
          
          // Make the call - this will:
          // 1. Establish WebSocket connection (if not already connected)
          // 2. Send call request to Africastalking servers
          // 3. Start ICE negotiation
          // WebSocket errors during this process are often non-fatal
          // Note: The library may throw internal errors (like "Cannot read properties of undefined")
          // These are often non-fatal and the call may still proceed
          console.log('📞 Invoking call() - this will establish WebSocket connection and send call request...');
          
          try {
            client.call(formatted);
            console.log('✅ call() invoked successfully');
            console.log('ℹ️ WebSocket connection is being established now...');
            console.log('ℹ️ If you see library errors, they may be non-fatal - monitor for call events');
            
            // Ensure status is still connecting after call is made
            updateStatus('connecting');
            
            // Start polling to check call state (fallback if events don't fire)
            startStatusPolling();
            console.log('✅ Status polling started - will check call state every 500ms');
          } catch (callInvokeError) {
            const errorMsg = callInvokeError.message || callInvokeError.toString();
            console.error('❌ Error invoking call():', callInvokeError);
            
            // Check if it's the library's internal error
            if (errorMsg.includes('Cannot read properties') || errorMsg.includes('code')) {
              console.warn('⚠️ This is an Africastalking library internal error');
              console.warn('⚠️ It may be non-fatal - the call might still work');
              console.warn('⚠️ Check for "ringing" or "callestablished" events');
              // Don't throw - let the call proceed and see if events fire
            } else {
              throw callInvokeError;
            }
          }
          
          // Give the call time to:
          // 1. Reach Africastalking servers
          // 2. Start ringing the recipient
          // 3. Establish connection if answered
          console.log('⏳ Waiting for call to connect (this may take 10-30 seconds)...');
          await new Promise(resolve => setTimeout(resolve, 3000));
          
          // Check if call was established or if we got a ringing event
          console.log('Call status after initiation:', {
            isInCall: this.isInCall,
            clientExists: !!this.client,
            loading: this.loading
          });
          
          // Monitor call progress - if no connection after 15 seconds, show detailed error
          setTimeout(() => {
            if (!callRinging && !callEstablished && !connectionEstablished && this.loading) {
              console.error('❌ CALL FAILED: WebSocket did not connect and call did not reach recipient');
              console.error('❌ Connection Status:', {
                webSocketConnected: connectionEstablished,
                callRinging: callRinging,
                callEstablished: callEstablished,
                isInCall: this.isInCall
              });
              
              // Show user-friendly error dialog
              this.showCallError(new Error(
                'Call failed: The call did not reach the recipient. ' +
                'WebSocket connection could not be established or the call was not completed.'
              ));
              this.isInCall = false;
              this.tabValue = 'keypad';
              this.loading = false;
            } else if (!callRinging && !callEstablished && connectionEstablished) {
              // WebSocket connected but call not ringing - wait a bit more
              console.warn('⚠️ WebSocket connected but call not ringing yet...');
              console.warn('⚠️ Waiting a bit longer...');
              
              // Give it 10 more seconds
              setTimeout(() => {
                if (!callRinging && !callEstablished && this.loading) {
                  console.error('❌ CALL FAILED: Call did not reach recipient');
                  this.showCallError(new Error(
                    'Call failed: The call did not reach the recipient. ' +
                    'The recipient phone may be off, unreachable, or the number may be incorrect.'
                  ));
                  this.isInCall = false;
                  this.tabValue = 'keypad';
                  this.loading = false;
                }
              }, 10000);
            }
          }, 15000);
          
        } catch (callError) {
          console.error('❌ Error initiating call:', callError);
          // Check if it's a WebSocket error - might be recoverable
          const errorMsg = callError.message || callError.toString();
          if (errorMsg.includes('WebSocket') && errorMsg.includes('CLOSED')) {
            // Try once more with a fresh client
            console.log('🔄 WebSocket error detected, retrying with fresh client...');
            this.client = null;
            await new Promise(resolve => setTimeout(resolve, 2000));
            const retryClient = await this.initializeClientWithToken();
            
            // Set up event listeners again for retry
            retryClient.on('ringing', () => {
              console.log('📞 Call is ringing (retry) - recipient phone is ringing!');
            });
            retryClient.on('callestablished', () => {
              console.log('✅ Call established (retry)!');
              this.isInCall = true;
              this.loading = false;
            });
            retryClient.on('callfailed', (e) => {
              console.error('❌ Call failed (retry):', e);
              this.showCallError(new Error(`Call failed: ${e?.message || 'Unknown error'}`));
              this.isInCall = false;
              this.tabValue = 'keypad';
              this.loading = false;
            });
            
            retryClient.call(formatted);
            console.log('✅ Retry call initiated');
          } else {
            throw new Error(`Failed to initiate call: ${errorMsg}`);
          }
        }
        // DON'T set isInCall = true here - it should only be true when call is actually connected
        // isInCall will be set to true when callestablished event fires or when polling detects connection
        this.isInCall = false; // Keep it false until call is actually connected
        const now = new Date();
        const newCall = {
          contactName: this.dialedNumber,
          time: now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
          type: 'Outgoing',
          day: now.toLocaleDateString('en-US', { weekday: 'long' }),
          callStartTime: now.toISOString(), // so normalizeRecentsTimes can fix if needed
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
      
      // Determine error type and provide appropriate message
      if (errorMsg.includes('timeout') || errorMsg.includes('no connecting event') || errorMsg.includes('WebSocket connection could not be established')) {
        this.errorTitle = 'Call Failed - Connection Timeout';
        this.errorMessage = 'The call did not reach the recipient. WebSocket connection could not be established.';
        this.errorDetails = [
          'The Africastalking WebRTC client did not connect within the expected time.',
          'The call request may not have reached the Africastalking servers.',
          'Network connection may be blocked or unstable.'
        ];
        this.errorSolutions = [
          'Check your internet connection and try again.',
          'Verify firewall settings are not blocking WebRTC connections.',
          'Check if Africastalking service is accessible from your network.',
          'Verify your Africastalking account configuration and API credentials.',
          'Check browser console (F12) for detailed error messages.'
        ];
        this.canRetry = true;
      } else if (errorMsg.includes('connection failed') || errorMsg.includes('unreachable')) {
        this.errorTitle = 'Connection Failed';
        this.errorMessage = 'Unable to connect to the WebRTC service.';
        this.errorDetails = [
          errorMsg
        ];
        this.errorSolutions = [
          'Check your network connection.',
          'Verify firewall settings are not blocking WebRTC connections.',
          'Check if Africastalking service is accessible.',
          'Try again in a few moments.'
        ];
        this.canRetry = true;
      } else if (errorMsg.includes('did not reach the recipient')) {
        this.errorTitle = 'Call Failed - Recipient Not Reached';
        this.errorMessage = errorMsg;
        this.errorDetails = [
          'The call was initiated but did not reach the recipient.',
          'Possible reasons: recipient phone is off, unreachable, or number is incorrect.'
        ];
        this.errorSolutions = [
          'Verify the phone number is correct and includes country code (e.g., +254...).',
          'Check if the recipient phone is turned on and has network coverage.',
          'Try calling again in a few moments.',
          'If the problem persists, contact support.'
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
    terminateCall(showAlert = true) {
      // This method is called when the recipient ends the call
      // or when the call is terminated for any reason
      // showAlert: if true, shows notification when recipient ends call (default: true)
      // If showAlert is false, caller manually ended - return to keypad immediately
      console.log('📴 Terminating call and cleaning up...');
      console.log('📴 terminateCall called with showAlert:', showAlert);
      console.log('📴 Current isInCall state:', this.isInCall);
      
      // If caller manually ended (showAlert=false), return to keypad immediately
      if (!showAlert) {
        console.log('📴 Caller manually ended call - returning to keypad immediately');
        // Clear any pending return-to-keypad timer (from recipient ending call)
        if (this.returnToKeypadTimer) {
          clearTimeout(this.returnToKeypadTimer);
          this.returnToKeypadTimer = null;
          console.log('📴 Cleared pending return-to-keypad timer');
        }
        this.tabValue = 'keypad';
      }
      
      // Clean up polling interval
      if (this.statusUpdateInterval) {
        clearInterval(this.statusUpdateInterval);
        this.statusUpdateInterval = null;
        console.log('✅ Status polling interval cleaned up');
      }
      
      // Store the call state BEFORE resetting it
      const wasInCall = this.isInCall;
      console.log('📴 wasInCall (stored state):', wasInCall);
      
      // Show notification BEFORE cleanup if recipient ended the call
      if (showAlert && wasInCall) {
        console.log('📴 Showing notification: Recipient ended the call');
        
        // Show visible banner notification (most visible)
        this.showCallEndedNotification = true;
        // Auto-hide after 10 seconds
        setTimeout(() => {
          this.showCallEndedNotification = false;
        }, 10000);
        
        // Show toast notification (backup)
        try {
          const toast = useToast();
          toast.error('📴 Call Ended: The recipient has terminated the call.', {
            timeout: 8000, // Longer timeout - 8 seconds
            position: 'top-center',
            closeOnClick: true,
            pauseOnFocusLoss: true,
            pauseOnHover: true,
            draggable: true,
            draggablePercent: 0.6,
            showCloseButtonOnHover: true,
            hideProgressBar: false,
            closeButton: 'button',
            icon: true,
            rtl: false
          });
          console.log('✅ Toast notification shown successfully');
        } catch (error) {
          console.error('❌ Error showing toast notification:', error);
        }
        
        // Also show alert as backup (always visible, can't be missed)
        setTimeout(() => {
          alert('📴 Call Ended\n\nThe recipient has terminated the call.');
        }, 300);
        
        console.log('✅ Banner, toast, and alert notifications all triggered');
      } else {
        console.log('📴 Notification NOT shown - showAlert:', showAlert, 'wasInCall:', wasInCall);
      }
      
      // Clean up audio
      this.cleanupCallAudio();
      
      // Stop call timer
      this.stopCallTimer();
      
      // Save call history to API
      if (this.currentCallReceiver && this.callStartTime) {
        const callDuration = Math.floor((Date.now() - this.callStartTime) / 1000);
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        const callerPhoneNo = localStorage.getItem('phoneNo') || userData.phoneNo || '';
        const callerName = localStorage.getItem('fullname') || userData.fullname || localStorage.getItem('username') || userData.username || '';
        
        // Find receiver name from contacts if available
        const receiverContact = this.contacts.find(c => 
          (c.phoneNo || c.phone) === this.currentCallReceiver
        );
        const receiverName = receiverContact ? (receiverContact.contactName || receiverContact.name || '') : '';
        
        const callHistoryData = {
          callerPhoneNo: callerPhoneNo,
          callerName: callerName,
          receiverPhoneNo: this.currentCallReceiver,
          receiverName: receiverName,
          callType: 'Outgoing',
          duration: callDuration,
          status: wasInCall ? 'completed' : 'failed',
          timestamp: new Date(this.callStartTime).toISOString(),
        };
        
        // Save to API (non-blocking)
        saveCallHistory(callHistoryData).then(() => {
          console.log('✅ Call history saved to API');
          // Reload recents to show updated history
          this.loadRecents();
        }).catch(err => {
          console.warn('Could not save call history to API:', err);
        });
      }
      
      // Reset call tracking
      this.currentCallReceiver = null;
      this.callStartTime = null;
      
      // Reset all call states
      this.isInCall = false;
      this.isMuted = false;
      this.isOnHold = false;
      this.isSpeakerOn = false;
      this.showKeypadInCall = false;
      this.loading = false;
      
      // CRITICAL: Preserve 'ended' status if it's already set (recipient ended the call)
      // Only change status if it's not already 'ended'
      if (this.callStatus === 'ended') {
        // Status is already 'ended' - don't change it
        console.log('📴 Status is already ended - preserving it');
        // Don't change tab - keep showing the call ended status
      } else if (wasInCall && (this.callStatus === 'connected' || this.callStatus === 'ringing')) {
        // Recipient ended the call - show "CALL ENDED"
        console.log('📴 Recipient ended the call - setting status to ended');
        this.updateCallStatus('ended');
        // Don't change tab - keep showing the call ended status
      } else {
        // User manually ended or call failed - reset to idle and go back to keypad
        console.log('📴 User ended call or call failed - resetting to idle');
        this.updateCallStatus('idle');
        this.tabValue = 'keypad';
      }
      
      // Clean up audio streams if any
      if (this.localStream) {
        this.localStream.getTracks().forEach(track => track.stop());
        this.localStream = null;
      }
    },
    handleEndCall() {
      // This method is called when the user manually ends the call
      // Clean up audio
      this.cleanupCallAudio();
      
      // Stop call timer
      this.stopCallTimer();
      
      // Try to hangup the call on our end
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
      
      // Use terminateCall to reset all states (don't show alert - user ended the call)
      this.terminateCall(false);
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
      if (this.isInCall) return; // Don't allow backspace during call
      if (this.dialedNumber && this.dialedNumber.length > 0) {
        this.dialedNumber = this.dialedNumber.slice(0, -1);
      }
    },
    handlePaste(event) {
      if (this.isInCall) {
        event.preventDefault();
        return;
      }
      
      // Get pasted text
      const pastedText = (event.clipboardData || window.clipboardData).getData('text');
      
      // Clean the pasted text - remove spaces, dashes, parentheses, and other non-digit characters except +
      let cleaned = pastedText.replace(/[\s\-\(\)\.]/g, '');
      
      // Only allow digits, +, and * #
      cleaned = cleaned.replace(/[^\d\+\*\#]/g, '');
      
      // If it starts with +, keep it, otherwise ensure proper format
      if (cleaned.startsWith('+')) {
        this.dialedNumber = cleaned;
      } else {
        // Remove any leading + if pasted number doesn't start with it
        this.dialedNumber = cleaned.replace(/^\+/, '');
      }
      
      event.preventDefault();
      console.log('📋 Pasted number:', pastedText, '→ Cleaned:', this.dialedNumber);
    },
    handleNumberInput(event) {
      if (this.isInCall) {
        event.preventDefault();
        return;
      }
      
      // Get the input value
      let value = event.target.value;
      
      // Clean the input - remove spaces, dashes, parentheses, and other non-digit characters except +, *, #
      value = value.replace(/[\s\-\(\)\.]/g, '');
      
      // Only allow digits, +, *, and #
      value = value.replace(/[^\d\+\*\#]/g, '');
      
      // Update the dialed number
      this.dialedNumber = value;
      
      // Ensure the input field shows the cleaned value (in case cleaning removed characters)
      if (event.target.value !== value) {
        event.target.value = value;
      }
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
      console.log('⏱️ Starting call timer...');
      console.log('⏱️ Current state - isInCall:', this.isInCall, 'callStatus:', this.callStatus);
      
      // Clear any existing timer
      if (this.callDurationTimer) {
        console.log('⏱️ Clearing existing timer');
        clearInterval(this.callDurationTimer);
        this.callDurationTimer = null;
      }
      
      // Reset duration to 0 and show immediately
      this.callDuration = 0;
      console.log('⏱️ Duration reset to 0 - should show "00:00" immediately');
      
      // Force immediate UI update to show "00:00"
      this.$forceUpdate();
      this.$nextTick(() => {
        this.$forceUpdate();
      });
      
      // Start timer - increment every second
      this.callDurationTimer = setInterval(() => {
        if (this.isInCall && !this.isOnHold && this.callStatus === 'connected') {
          this.callDuration++;
          const formatted = this.formatCallDuration(this.callDuration);
          console.log(`⏱️ Duration: ${this.callDuration}s (${formatted})`);
          this.$forceUpdate();
        } else {
          console.log('⏱️ Timer tick skipped - isInCall:', this.isInCall, 'isOnHold:', this.isOnHold, 'status:', this.callStatus);
        }
      }, 1000);
      
      console.log('⏱️ Call timer started - will increment every second');
      console.log('⏱️ Timer ID:', this.callDurationTimer);
      console.log('⏱️ Duration should now be visible in UI:', this.formatCallDuration(this.callDuration));
      
      // Verify conditions for duration display
      console.log('⏱️ Duration display conditions:', {
        callStatus: this.callStatus,
        isInCall: this.isInCall,
        callDuration: this.callDuration,
        shouldShow: this.callStatus === 'connected' && this.isInCall
      });
    },
    stopCallTimer() {
      if (this.callDurationTimer) {
        clearInterval(this.callDurationTimer);
        this.callDurationTimer = null;
      }
      this.callDuration = 0;
    },
    // Android-style: Schedule return to keypad after call ends
    // Shows "CALL ENDED" for 2 seconds, then returns to keypad
    scheduleReturnToKeypad() {
      // Clear any existing timer
      if (this.returnToKeypadTimer) {
        console.log('📴 Clearing existing return-to-keypad timer');
        clearTimeout(this.returnToKeypadTimer);
        this.returnToKeypadTimer = null;
      }
      
      // Ensure "CALL ENDED" status is visible
      console.log('📴 Call ended - showing "CALL ENDED" for 2 seconds, then returning to keypad');
      console.log('📴 Current tabValue:', this.tabValue);
      console.log('📴 Current callStatus:', this.callStatus);
      this.$forceUpdate();
      
      // Schedule return to keypad after 2 seconds
      console.log('📴 Setting timer to return to keypad in 2 seconds...');
      const timerId = setTimeout(() => {
        console.log('📴 ========== TIMER FIRED - RETURNING TO KEYPAD ==========');
        console.log('📴 Current tabValue before change:', this.tabValue);
        console.log('📴 Current callStatus:', this.callStatus);
        
        // Check if timer was cleared (defensive check)
        if (this.returnToKeypadTimer !== timerId) {
          console.warn('⚠️ Timer ID mismatch - timer may have been cleared');
        }
        
        // Force change to keypad - use Vue.set if needed for reactivity
        this.tabValue = 'keypad';
        this.returnToKeypadTimer = null;
        
        console.log('📴 tabValue after change:', this.tabValue);
        
        // Force multiple UI updates to ensure change is visible
        this.$forceUpdate();
        this.$nextTick(() => {
          // Double-check tabValue was set correctly
          if (this.tabValue !== 'keypad') {
            console.error('❌ tabValue was not set correctly! Forcing again...');
            this.tabValue = 'keypad';
          }
          this.$forceUpdate();
          console.log('📴 Final tabValue:', this.tabValue);
          console.log('📴 ===================================================');
        });
      }, 2000);
      
      this.returnToKeypadTimer = timerId;
      console.log('📴 Timer set with ID:', this.returnToKeypadTimer);
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
    getRecordingId(call) {
      return call.sessionId || `${call.contactName || ''}_${call.time}_${call.type}`;
    },
    isPlayingRecording(call) {
      return this.playingRecordingId === this.getRecordingId(call);
    },
    toggleRecording(call) {
      if (!call?.recordingUrl) return;
      const id = this.getRecordingId(call);
      if (this.playingRecordingId === id) {
        this.stopRecording();
        return;
      }
      this.stopRecording();
      this.playingRecordingId = id;
      const audio = new Audio(call.recordingUrl);
      this.recordingAudio = audio;
      audio.play().catch((err) => {
        console.error('Error playing recording:', err);
        this.toast.error('Could not play recording. The URL may be invalid or inaccessible.');
        this.playingRecordingId = null;
        this.recordingAudio = null;
      });
      audio.onended = () => {
        this.playingRecordingId = null;
        this.recordingAudio = null;
      };
      audio.onerror = () => {
        this.playingRecordingId = null;
        this.recordingAudio = null;
      };
    },
    stopRecording() {
      if (this.recordingAudio) {
        this.recordingAudio.pause();
        this.recordingAudio.currentTime = 0;
        this.recordingAudio = null;
      }
      this.playingRecordingId = null;
    },
    callFromRecent(call) {
      this.dialedNumber = call.receiverPhoneNo || call.contactName || '';
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

/* Call Ended Notification Banner */
.call-ended-banner {
  background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
  color: white;
  padding: 1rem;
  margin-bottom: 1rem;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(220, 53, 69, 0.3);
  animation: slideDown 0.3s ease-out;
  position: relative;
  z-index: 1000;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.call-ended-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.call-ended-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.call-ended-message {
  flex: 1;
  font-size: 1rem;
  font-weight: 600;
  text-align: center;
}

.call-ended-close {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  font-size: 1.5rem;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: background 0.2s ease;
}

.call-ended-close:hover {
  background: rgba(255, 255, 255, 0.3);
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
.primary-btn.outline {
  background: transparent;
  color: #1a73e8;
  border: 2px solid #1a73e8;
}
.primary-btn.outline:hover:not(:disabled) {
  background: rgba(26, 115, 232, 0.08);
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
  font-size: 2.2rem;
  color: #ffffff;
  font-weight: 300;
  font-variant-numeric: tabular-nums;
  margin-top: 0.5rem;
  text-align: center;
  letter-spacing: 4px;
  line-height: 1.3;
  text-shadow: 0 2px 6px rgba(0, 0, 0, 0.5);
  opacity: 1;
  display: block;
  min-height: 2.5rem;
  transition: opacity 0.1s ease;
}

.call-status-text {
  font-size: 1.1rem;
  color: #999;
  margin-top: 0.75rem;
  font-weight: 600;
  min-height: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.call-status-text .status-connecting {
  color: #ff9800;
  font-weight: 700;
  font-size: 1.2rem;
  animation: pulse 1.5s ease-in-out infinite;
  text-shadow: 0 0 10px rgba(255, 152, 0, 0.3);
}

.call-status-text .status-ringing {
  color: #2196f3;
  font-weight: 700;
  font-size: 1.2rem;
  animation: pulse 1.5s ease-in-out infinite;
  text-shadow: 0 0 10px rgba(33, 150, 243, 0.3);
}

.call-status-text .status-connected {
  color: #4caf50;
  font-weight: 700;
  font-size: 1.1rem;
}

.call-status-text .status-ended {
  color: #f44336;
  font-weight: 700;
  font-size: 1.2rem;
  animation: pulse 1s ease-in-out infinite;
}

.call-status-text .status-default {
  color: #999;
  font-weight: 600;
  font-size: 1.1rem;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.7;
    transform: scale(1.05);
  }
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
  gap: 0.3rem;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 50%;
  transition: all 0.2s ease;
  min-width: 60px;
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
  font-size: 24px;
  width: 24px;
  height: 24px;
  color: #333;
}

.control-btn.active .material-symbols-outlined {
  color: #1a73e8;
}

.control-btn.active {
  background: rgba(26, 115, 232, 0.1);
}

.control-label {
  font-size: 0.65rem;
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
  gap: 0.6rem;
  padding: 1rem;
  max-width: 360px;
  margin: 0 auto;
  align-content: start;
}

.keypad-btn-in-call {
  height: 64px;
  min-width: 90px;
  border-radius: 10px;
  border: 1px solid #d6d9e0;
  background: #f9fafc;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
  font-size: 1.2rem;
}

.keypad-btn-in-call:active {
  background: #e8eaf0;
  transform: scale(0.98);
}

.keypad-number {
  font-size: 1.2rem;
  font-weight: 400;
  color: #333;
  line-height: 1;
}

.keypad-letters {
  font-size: 0.5rem;
  color: #666;
  margin-top: 0.1rem;
  font-weight: 500;
  letter-spacing: 0.3px;
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
  width: 100%;
  border: none;
  background: transparent;
  text-align: center;
  outline: none;
  color: #333;
  padding: 0;
}

.dialed-number:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.dialed-number::placeholder {
  color: #999;
  font-weight: 400;
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
  min-height: 200px;
  display: block;
}

.recents-load-section {
  margin-bottom: 1rem;
}
.recents-load-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-bottom: 0.6rem;
}
.recents-load-row:last-child {
  margin-bottom: 0;
}
.recents-load-main {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem 1.5rem;
}
.recents-load-group {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex-wrap: wrap;
}
.recents-load-label {
  font-weight: 600;
  color: #333;
  min-width: 4.5rem;
}
.recents-from-to {
  font-size: 0.9rem;
  color: #555;
  margin: 0 0.1rem 0 0.2rem;
}
.recents-load-section .date-filter-input {
  padding: 0.4rem 0.6rem;
  border: 1px solid #d6d9e0;
  border-radius: 6px;
  font-size: 0.9rem;
}
.recents-load-section .primary-btn.small {
  padding: 0.4rem 0.8rem;
  font-size: 0.9rem;
}
.recents-filter-checkbox {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-size: 0.9rem;
  color: #333;
  user-select: none;
}
.recents-filter-checkbox input {
  width: 1rem;
  height: 1rem;
  accent-color: #1a73e8;
}
.recents-date-label {
  margin-bottom: 0.75rem;
  padding: 0.5rem 0.75rem;
  background: #e8f0fe;
  border-left: 4px solid #1a73e8;
  border-radius: 4px;
  font-size: 0.95rem;
  color: #1a73e8;
}
.recents-date-label strong {
  color: #1557b0;
}
.no-recording-hint {
  color: #9ca3af;
  font-size: 0.9rem;
  padding: 0 0.25rem;
}

/* Table container - matching AllSchools */
.list-pane .table-container {
  background-color: white;
  padding: clamp(0.5rem, 1.5vw, 1rem);
  border-radius: 8px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

/* Students table - matching AllSchools */
.list-pane .students-table {
  display: table !important;
  width: 100%;
  border-collapse: collapse;
  border-spacing: 0;
  border: 1px solid #ddd;
  font-size: clamp(0.8rem, 1.2vw, 1rem);
}
.list-pane .students-table th,
.list-pane .students-table td {
  white-space: nowrap;
  padding: 0.3rem 0.5rem;
  line-height: 1.2;
  text-align: left;
  border-bottom: 1px solid #ddd;
  vertical-align: middle;
  border: 1px solid #ddd;
}
.list-pane .students-table thead th {
  background-color: #f1f1f1;
  font-weight: 600;
  border-bottom: 2px solid #ddd;
  position: sticky;
  top: 0;
  z-index: 10;
}
.list-pane .students-table .even-row {
  background-color: #f7f9fc;
}
.list-pane .actions-header {
  text-align: center;
  padding: clamp(0.5rem, 1vw, 1rem);
}
.list-pane .actions {
  display: flex;
  justify-content: flex-start;
  gap: clamp(0.3rem, 1vw, 1rem);
  flex-wrap: nowrap;
  align-items: center;
}
.list-pane .manage-btn {
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
.list-pane .manage-btn:hover {
  background-color: #d1d5db;
  transform: translateY(-1px);
}
.list-pane .manage-btn .material-symbols-outlined {
  font-size: clamp(0.9rem, 1.5vw, 1rem);
}
.list-pane .play-recording-btn {
  background-color: #dcfce7;
  color: #16a34a;
  border: 1px solid #86efac;
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
.list-pane .play-recording-btn:hover {
  background-color: #bbf7d0;
  transform: translateY(-1px);
}
.list-pane .play-recording-btn.active {
  background-color: #fecaca;
  color: #dc2626;
  border-color: #fca5a5;
}
.list-pane .play-recording-btn.active:hover {
  background-color: #fca5a5;
}
.list-pane .play-recording-btn .material-symbols-outlined {
  font-size: clamp(0.9rem, 1.5vw, 1rem);
}

.empty-state {
  text-align: center;
  color: #6c7480;
  padding: 2rem 1rem;
  min-height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
}
.group-block + .group-block {
  margin-top: 0.75rem;
}
.group-title {
  font-weight: 700;
  margin-bottom: 0.35rem;
  font-size: clamp(0.9rem, 1.3vw, 1.1rem);
  color: #333;
}

/* Table scroll wrapper (desktop) */
.list-pane .table-scroll-wrapper {
  max-height: calc(100vh - 14rem);
  overflow-y: auto;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  border: 1px solid #ddd;
  border-radius: 4px;
}

/* Mobile Card View - hidden by default */
.list-pane .mobile-cards {
  display: none;
}

/* Card styles (matching AllSchools) */
.list-pane .call-card {
  background: white;
  border: 1px solid #e1e4ea;
  border-radius: 8px;
  margin-bottom: 1rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: box-shadow 0.3s ease;
}
.list-pane .call-card:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}
.list-pane .call-card .card-header {
  background: linear-gradient(135deg, #2b7ab7 0%, #1e6192 100%);
  color: white;
  padding: 1rem;
  display: flex;
  align-items: center;
  gap: 1rem;
}
.list-pane .call-card .card-number {
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
.list-pane .call-card .card-title {
  font-size: clamp(1rem, 2vw, 1.2rem);
  font-weight: 600;
  margin: 0;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.list-pane .call-card .card-body {
  padding: 0.75rem 1rem;
}
.list-pane .call-card .card-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid #f0f0f0;
  gap: 0.5rem;
}
.list-pane .call-card .card-row:last-child {
  border-bottom: none;
}
.list-pane .call-card .card-label {
  font-weight: 600;
  color: #666;
  font-size: clamp(0.85rem, 1.2vw, 0.95rem);
  flex-shrink: 0;
  min-width: 90px;
  text-align: left;
}
.list-pane .call-card .card-value {
  color: #333;
  font-size: clamp(0.85rem, 1.2vw, 0.95rem);
  text-align: right;
  flex: 1;
  word-break: break-word;
  font-weight: 500;
}
.list-pane .call-card .card-footer {
  padding: 1rem;
  background: #f9fafb;
  border-top: 1px solid #e1e4ea;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}
.list-pane .call-card .card-action-btn {
  flex: 1;
  min-width: 80px;
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
.list-pane .call-card .card-action-btn:hover {
  transform: translateY(-1px);
}
.list-pane .call-card .card-action-btn.manage-btn {
  background-color: #e0e7ff;
  color: #4f46e5;
  border: 1px solid #c7d2fe;
}
.list-pane .call-card .card-action-btn.manage-btn:hover {
  background-color: #d1d5db;
}
.list-pane .call-card .card-action-btn.play-recording-btn {
  background-color: #dcfce7;
  color: #16a34a;
  border: 1px solid #86efac;
}
.list-pane .call-card .card-action-btn.play-recording-btn:hover {
  background-color: #bbf7d0;
}
.list-pane .call-card .card-action-btn.play-recording-btn.active {
  background-color: #fecaca;
  color: #dc2626;
  border-color: #fca5a5;
}

@media (max-width: 768px) {
  .table-row {
    grid-template-columns: 1.5fr 1.2fr 1fr 1fr;
  }
  .search-container {
    width: 100%;
  }
  /* Hide desktop table, show mobile cards on mobile */
  .list-pane .desktop-table {
    display: none !important;
  }
  .list-pane .mobile-cards {
    display: block;
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
  
  /* Recents/Contacts table responsive */
  .list-pane .students-table th,
  .list-pane .students-table td {
    padding: clamp(0.5rem, 1vw, 0.75rem);
    font-size: clamp(0.85rem, 1.1vw, 0.95rem);
  }
}

@media (max-width: 1024px) {
  .list-pane .students-table th,
  .list-pane .students-table td {
    padding: clamp(0.6rem, 1vw, 0.9rem);
  }
}
</style>
