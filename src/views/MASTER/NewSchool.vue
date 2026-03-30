<template>
  <div class="form-wrap">
    <div class="form-content">
      <div class="cancel" @click="$emit('closeForm')">
        <i class="fas fa-times"></i>
      </div>
      <div class="form-title">
        <h2>{{ editMode ? 'EDIT SCHOOL' : 'NEW SCHOOL' }}</h2>
      </div>
      <hr />

      <div class="form-inputs">
        <!-- Required Fields -->
        <div class="form-group">
          <input type="text" class="form-control" v-model="schoolName" placeholder="School Name" />
          <label for="schoolName" :class="{ filled: schoolName !== '' }">School Name*</label>
        </div>
        <div class="form-group">
          <input 
            type="text" 
            class="form-control" 
            v-model="schoolCode" 
            placeholder="School Code" 
          />
          <label for="schoolCode" :class="{ filled: schoolCode !== '' }">School Code*</label>
        </div>
        <div class="form-group">
          <select class="form-control" v-model="schoolLevel">
            <option value="" disabled>Select School Level</option>
            <option value="Primary">Primary</option>
            <option value="Secondary">Secondary</option>
            <option value="Mixed">Mixed</option>
          </select>
          <label for="schoolLevel" :class="{ filled: schoolLevel !== '' }">School Level</label>
        </div>
        <div class="form-group">
          <input type="text" class="form-control" v-model="principalName" placeholder="Principal's Name" required />
          <label for="principalName" :class="{ filled: principalName !== '' }">Principal's Name*</label>
        </div>
        <div class="form-group">
          <input type="text" class="form-control" v-model="principalPhoneNo" placeholder="Principal's Phone" required />
          <label for="principalPhoneNo" :class="{ filled: principalPhoneNo !== '' }">Principal's Phone*</label>
        </div>
        <div class="form-group">
          <input type="text" class="form-control" v-model="bursarPhoneNo" placeholder="Bursar's Phone" />
          <label for="bursarPhoneNo" :class="{ filled: bursarPhoneNo !== '' }">Bursar's Phone</label>
        </div>
        <div class="form-group">
          <input type="text" class="form-control" v-model="deanPhoneNo" placeholder="Dean's Phone" />
          <label for="deanPhoneNo" :class="{ filled: deanPhoneNo !== '' }">Dean's Phone</label>
        </div>

        <!-- County Selection -->
        <div class="form-group">
          <select class="form-control" v-model="county" @change="updateSubcounties" id="county">
            <option value="" disabled>Select County</option>
            <option v-for="county in counties" :key="county" :value="county">{{ county }}</option>
          </select>
          <label for="county" :class="{ filled: county !== '' }">County</label>
        </div>

        <!-- Subcounty Selection (Dynamic) -->
        <div class="form-group">
          <select class="form-control" v-model="subcounty">
            <option value="" disabled>Select Subcounty</option>
            <option v-for="subcounty in subcountyOptions" :key="subcounty" :value="subcounty">{{ subcounty }}</option>
          </select>
          <label for="subcounty" :class="{ filled: subcounty !== '' }">Subcounty</label>
        </div>

        <div class="form-group">
          <input type="email" class="form-control" v-model="email" placeholder="School Email" required />
          <label for="email" :class="{ filled: email !== '' }">School Email*</label>
        </div>
        <div class="form-group">
          <input type="text" class="form-control" v-model="phoneNo" placeholder="Phone No" required />
          <label for="phoneNo" :class="{ filled: phoneNo !== '' }">Phone No*</label>
        </div>

        <div class="form-group">
          <input 
            type="text" 
            class="form-control" 
            v-model="address" 
            placeholder="Address" 
           
            id="address"
          />
          <label 
            for="address" 
            :class="{ filled: address !== '' }"
          >
            Address
          </label>
        </div>

        <!-- Registered By: username (highlighted) + full name, read-only; ID sent as registeredByID -->
        <div class="form-group">
          <input
            type="text"
            class="form-control registered-by-display"
            :value="registeredByDisplayText"
            id="registeredByName"
            readonly
            tabindex="-1"
          />
          <label
            for="registeredByName"
            :class="{ filled: registeredByDisplayText !== '' }"
          >
            Registered By
          </label>
        </div>

        <div class="form-group">
          <input 
            type="number" 
            class="form-control" 
            v-model="marketerID" 
            placeholder="Marketer ID" 
            id="marketerID"
          />
          <label 
            for="marketerID" 
            :class="{ filled: marketerID !== null && marketerID !== '' }"
          >
            Marketer ID
          </label>
        </div>

        <!-- School Motto -->
        <div class="form-group">
          <input type="text" class="form-control" v-model="schoolMotto" placeholder="School Motto" />
          <label for="schoolMotto" :class="{ filled: schoolMotto !== '' }">School Motto</label>
        </div>

        <!-- Status (Only in edit mode) -->
        <div v-if="editMode" class="form-group">
          <select v-model="deleted" class="form-control">
            <option :value="false">Active</option>
            <option :value="true">Inactive</option>
          </select>
          <label>Status</label>
        </div>
      </div>
      <hr />
      <div class="form-actions">
        <button @click="$emit('closeForm')">Close</button>

        <button v-if="!editMode" @click="saveSchool">Register</button>

        <button v-if="editMode" @click="updateSchool">Update </button>
      </div>
    </div>
    <LoadingSpinner :isLoading="Loading" />
  </div>
</template>

<script>
import axios from '../../axios';
import { useToast } from 'vue-toastification';
import LoadingSpinner from '../../components/LoadingSpinner.vue';
import { normalizeRegisteredById, normalizeRegisteredByName } from '../../utils/schoolRegisteredBy.js';

export default {
  name: 'submit',
  components: { LoadingSpinner },
  props: {
    school: {
      type: Object,
      default: null,
    },
  },
  data() {
    return {
      isMounted: true,
      // Required fields
      schoolName: '',
      schoolCode: '',
      schoolLevel: '',
      principalName: '',
      principalPhoneNo: '',
      county: '',
      subcounty: '',
      email: '',
      phoneNo: '',
      address: '',
      
      // Optional fields
      bursarPhoneNo: '',
      deanPhoneNo: '',
      registeredByID: null, // Store the logged-in user's ID
      registeredByName: '', // Display full name (read-only helper)
      registeredByUsername: '', // Login username for highlight (read-only)
      marketerID: '', // Empty string for select dropdown
      schoolMotto: '',
      
      deleted: false,
      editMode: false,
      counties: ['Mombasa', 'Kwale', 'Kilifi', 'Tana River', 'Lamu', 'Taita-Taveta',
        'Garissa', 'Wajir', 'Mandera', 'Marsabit', 'Isiolo', 'Meru',
        'Tharaka-Nithi', 'Embu', 'Kitui', 'Machakos', 'Makueni', 'Nyandarua',
        'Nyeri', 'Kirinyaga', 'Murang\'a', 'Kiambu', 'Turkana', 'West Pokot',
        'Samburu', 'Trans Nzoia', 'Uasin Gishu', 'Elgeyo-Marakwet', 'Nandi',
        'Baringo', 'Laikipia', 'Nakuru', 'Narok', 'Kajiado', 'Kericho', 'Bomet',
        'Kakamega', 'Vihiga', 'Bungoma', 'Busia', 'Siaya', 'Kisumu', 'Homa Bay',
        'Migori', 'Kisii', 'Nyamira', 'Nairobi City'
      ],
      subcountyOptions: [],
      users: [], // Store users list for registeredByID dropdown
      marketers: [], // Store marketers list for marketerID dropdown
      subcountyData: {
        Baringo: ['Baringo Central', 'Baringo North', 'Baringo South', 'Eldama Ravine', 'Mogotio', 'Tiaty'],
        Bomet: ['Bomet Central', 'Bomet East', 'Chepalungu', 'Konoin', 'Sotik'],
        Bungoma: ['Bumula', 'Kabuchai', 'Kanduyi', 'Kimilili', 'Mt. Elgon', 'Tongaren', 'Webuye East', 'Webuye West'],
        Busia: ['Budalang\'i', 'Butula', 'Funyula', 'Nambale', 'Teso North', 'Teso South'],
        "Elgeyo Marakwet": ['Keiyo North', 'Keiyo South', 'Marakwet East', 'Marakwet West'],
        Embu: ['Manyatta', 'Mbeere North', 'Mbeere South', 'Runyenjes'],
        Garissa: ['Balambala', 'Dadaab', 'Fafi', 'Garissa Township', 'Hulugho', 'Ijara', 'Lagdera'],
        "Homa Bay": ['Homa Bay Town', 'Kabondo Kasipul', 'Karachuonyo', 'Mbita', 'Ndhiwa', 'Rangwe', 'Suba North', 'Suba South'],
        Isiolo: ['Garbatulla', 'Isiolo', 'Merti'],
        Kajiado: ['Isinya', 'Kajiado Central', 'Kajiado East', 'Kajiado North', 'Kajiado South'],
        Kakamega: ['Butere', 'Ikolomani', 'Khwisero', 'Lugari', 'Lurambi', 'Malava', 'Mumias East', 'Mumias West', 'Navakholo', 'Shinyalu'],
        Kericho: ['Ainamoi', 'Belgut', 'Bureti', 'Kipkelion East', 'Kipkelion West', 'Soin Sigowet'],
        Kiambu: ['Thika Town', 'Ruiru', 'Githunguri', 'Kiambu Town', 'Juja', 'Gatundu North', 'Gatundu South', 'Limuru', 'Kabete', 'Kikuyu', 'Lari'],
        Kilifi: ['Ganze', 'Kaloleni', 'Kilifi North', 'Kilifi South', 'Magarini', 'Malindi', 'Rabai'],
        Kirinyaga: ['Gichugu', 'Kirinyaga Central', 'Kirinyaga East', 'Kirinyaga West'],
        Kisii: ['Bomachoge Borabu', 'Bomachoge Chache', 'Bobasi', 'Kitutu Chache North', 'Kitutu Chache South', 'Nyaribari Chache', 'Nyaribari Masaba', 'South Mugirango'],
        Kisumu: ['Kisumu East', 'Kisumu West', 'Kisumu Central', 'Muhoroni', 'Nyakach', 'Nyando', 'Seme'],
        Kitui: ['Kitui Central', 'Kitui East', 'Kitui Rural', 'Kitui South', 'Kitui West', 'Mumoni', 'Mutitu', 'Mutomo', 'Nzambani'],
        Kwale: ['Kinango', 'Lunga Lunga', 'Matuga', 'Msambweni'],
        Laikipia: ['Laikipia Central', 'Laikipia East', 'Laikipia North', 'Laikipia West'],
        Lamu: ['Lamu East', 'Lamu West'],
        Machakos: ['Machakos Town', 'Mavoko', 'Masinga', 'Yatta', 'Kangundo', 'Matungulu', 'Kathiani', 'Mwala'],
        Makueni: ['Kaiti', 'Kibwezi East', 'Kibwezi West', 'Makueni', 'Mbooni'],
        Mandera: ['Banisa', 'Lafey', 'Mandera East', 'Mandera North', 'Mandera South', 'Mandera West'],
        Marsabit: ['Laisamis', 'Moyale', 'North Horr', 'Saku'],
        Meru: ['Buuri', 'Central Imenti', 'Igembe Central', 'Igembe North', 'Igembe South', 'North Imenti', 'South Imenti', 'Tigania East', 'Tigania West'],
        Migori: ['Awendo', 'Kuria East', 'Kuria West', 'Migori', 'Nyatike', 'Rongo', 'Suna East', 'Suna West', 'Uriri'],
        Mombasa: ['Changamwe', 'Jomvu', 'Kisauni', 'Likoni', 'Mvita', 'Nyali'],
        Muranga: ['Gatanga', 'Kahuro', 'Kandara', 'Kangema', 'Kigumo', 'Kiharu', 'Mathioya', 'Murang\'a South'],
        Nairobi: ['Dagoretti North', 'Dagoretti South', 'Embakasi Central', 'Embakasi East', 'Embakasi North', 'Embakasi South', 'Embakasi West', 'Kamukunji', 'Kasarani', 'Kibra', 'Lang\'ata', 'Makadara', 'Mathare', 'Roysambu', 'Ruaraka', 'Starehe', 'Westlands'],
        Nakuru: ['Nakuru Town East', 'Nakuru Town West', 'Molo', 'Naivasha', 'Gilgil', 'Kuresoi North', 'Kuresoi South', 'Njoro', 'Rongai', 'Subukia'],
        Nandi: ['Aldai', 'Chesumei', 'Emgwen', 'Mosop', 'Nandi Hills', 'Tinderet'],
        Narok: ['Narok East', 'Narok North', 'Narok South', 'Narok West', 'Trans Mara East', 'Trans Mara West'],
        Nyamira: ['Borabu', 'Manga', 'Masaba North', 'Nyamira North', 'Nyamira South'],
        Nyandarua: ['Kinangop', 'Kipipiri', 'Ndaragwa', 'Ol Jorok', 'Ol Kalou'],
        Nyeri: ['Nyeri Town', 'Kieni East', 'Kieni West', 'Mathira East', 'Mathira West', 'Mukurweini', 'Othaya', 'Tetu'],
        Samburu: ['Samburu Central', 'Samburu East', 'Samburu North'],
        Siaya: ['Alego Usonga', 'Bondo', 'Gem', 'Rarieda', 'Ugenya', 'Ugunja'],
        "Taita Taveta": ['Mwatate', 'Taveta', 'Voi', 'Wundanyi'],
        "Tana River": ['Bura', 'Galole', 'Garsen'],
        "Tharaka Nithi": ['Chuka/Igambang\'ombe', 'Maara', 'Tharaka'],
        "Trans Nzoia": ['Cherang\'any', 'Endebess', 'Kiminini', 'Kwanza', 'Saboti'],
        Turkana: ['Loima', 'Turkana Central', 'Turkana East', 'Turkana North', 'Turkana South', 'Turkana West'],
        "Uasin Gishu": ['Ainabkoi', 'Kapseret', 'Kesses', 'Moiben', 'Soy', 'Turbo'],
        Vihiga: ['Emuhaya', 'Hamisi', 'Luanda', 'Sabatia', 'Vihiga'],
        Wajir: ['Buna', 'Eldas', 'Habaswein', 'Tarbaj', 'Wajir East', 'Wajir North', 'Wajir South', 'Wajir West'],
        "West Pokot": ['Kacheliba', 'Kapenguria', 'Pokot South', 'Sigor']
      },
      Loading: false,
    };
  },

  computed: {
    registeredByDisplayText() {
      const u = (this.registeredByUsername || '').trim();
      const n = (this.registeredByName || '').trim();
      if (!u && !n) return '';
      if (u && n && n.toLowerCase() !== u.toLowerCase()) return `@${u}  —  ${n}`;
      if (u) return `@${u}`;
      return n;
    },
  },

  watch: {
    school: {
      immediate: true,
      deep: true,
      handler(newSchool) {
        console.log('NewSchool watcher - received school prop:', newSchool);
        console.log('NewSchool watcher - newSchool type:', typeof newSchool);
        console.log('NewSchool watcher - newSchool keys:', newSchool ? Object.keys(newSchool) : 'null/undefined');
        
        if (newSchool && typeof newSchool === 'object' && Object.keys(newSchool).length > 0) {
          this.editMode = true;
          
          // Map all fields explicitly to ensure proper assignment
          // Handle null values properly - convert null to empty string for form display
          this.schoolName = newSchool.schoolName ? String(newSchool.schoolName).trim() : '';
          this.schoolCode = newSchool.schoolCode ? String(newSchool.schoolCode).trim() : '';
          // schoolLevel can be null in API response, convert to empty string for form
          this.schoolLevel = (newSchool.schoolLevel !== null && newSchool.schoolLevel !== undefined) ? String(newSchool.schoolLevel).trim() : '';
          this.principalName = newSchool.principalName ? String(newSchool.principalName).trim() : '';
          this.principalPhoneNo = newSchool.principalPhoneNo ? String(newSchool.principalPhoneNo).trim() : '';
          // Optional fields - handle null/undefined
          this.bursarPhoneNo = (newSchool.bursarPhoneNo !== null && newSchool.bursarPhoneNo !== undefined) ? String(newSchool.bursarPhoneNo).trim() : '';
          this.deanPhoneNo = (newSchool.deanPhoneNo !== null && newSchool.deanPhoneNo !== undefined) ? String(newSchool.deanPhoneNo).trim() : '';
          this.county = newSchool.county ? String(newSchool.county).trim() : '';
          this.subcounty = newSchool.subcounty ? String(newSchool.subcounty).trim() : '';
          this.email = newSchool.email ? String(newSchool.email).trim() : '';
          this.phoneNo = newSchool.phoneNo ? String(newSchool.phoneNo).trim() : '';
          this.address = newSchool.address ? String(newSchool.address).trim() : '';
          // Registrant from school row (API may use camelCase or snake_case)
          this.registeredByID = normalizeRegisteredById(newSchool);
          this.registeredByName = normalizeRegisteredByName(newSchool) || '';
          this.registeredByUsername = '';
          this.$nextTick(() => this.syncRegisteredByUsernameFromUsers());
          // Handle marketerID - convert to string for select dropdown
          this.marketerID = (newSchool.marketerID !== null && newSchool.marketerID !== undefined) ? String(newSchool.marketerID) : '';
          // Optional field - handle null/undefined
          this.schoolMotto = (newSchool.schoolMotto !== null && newSchool.schoolMotto !== undefined) ? String(newSchool.schoolMotto).trim() : '';
          this.deleted = newSchool.deleted || false;
          
          console.log('✅ Mapped fields in NewSchool:', {
            schoolName: this.schoolName,
            schoolCode: this.schoolCode,
            schoolLevel: this.schoolLevel,
            principalName: this.principalName,
            principalPhoneNo: this.principalPhoneNo,
            bursarPhoneNo: this.bursarPhoneNo,
            deanPhoneNo: this.deanPhoneNo,
            county: this.county,
            subcounty: this.subcounty,
            email: this.email,
            phoneNo: this.phoneNo,
            address: this.address,
            registeredByID: this.registeredByID,
            registeredByName: this.registeredByName,
            marketerID: this.marketerID,
            schoolMotto: this.schoolMotto,
            deleted: this.deleted
          });
          
          // Update subcounties based on selected county - use nextTick to ensure DOM is ready
          this.$nextTick(() => {
            if (this.county) {
              this.updateSubcounties();
            }
          });
        } else {
          console.log('❌ No school data - clearing form');
          this.editMode = false;
          this.clearForm();
        }
      },
    },
  },

  methods: {
    async fetchUsers() {
      try {
        const response = await axios.post('/auth/list_users', {});
        // Filter users - marketers are typically users with specific roles
        // For now, use all users for both dropdowns, but you can filter if needed
        this.users = response.data.map((user) => ({
          id: user.userID,
          userID: user.userID,
          idNumber: user.userID,
          fullname: user.fullname || '',
          username: user.username || '',
        }));
        // Marketers can be filtered by role if needed, for now use all users
        this.marketers = this.users;
      } catch (error) {
        console.error('Error fetching users:', error);
        // Don't show error toast - users fetch is optional
      }
    },

    syncRegisteredByUsernameFromUsers() {
      if (this.registeredByID == null || this.registeredByID === '' || !this.users.length) return;
      const found = this.users.find(
        (u) =>
          String(u.id ?? u.userID) === String(this.registeredByID) ||
          Number(u.id ?? u.userID) === Number(this.registeredByID)
      );
      if (found) {
        this.registeredByUsername = (found.username || '').trim();
        if (!this.registeredByName) {
          this.registeredByName = (found.fullname || found.username || '').trim();
        }
      }
    },

    updateSubcounties() {
      if (this.county) {
        this.subcountyOptions = this.subcountyData[this.county] || [];
        if (!this.subcountyOptions.includes(this.subcounty)) {
          this.subcounty = '';
        }
      }
    },

    async saveSchool() {
      const toast = useToast();

      // Only School Name and School Code are required - allow registration with partial data
      const schoolNameTrimmed = (this.schoolName || '').trim();
      const schoolCodeTrimmed = (this.schoolCode || '').trim();

      if (!schoolNameTrimmed || !schoolCodeTrimmed) {
        toast.warning('School Name and School Code are required');
        return;
      }

      // Prepare form data - send empty string for fields not filled
      const formData = {
        schoolCode: schoolCodeTrimmed,
        schoolName: schoolNameTrimmed,
        schoolLevel: (this.schoolLevel && this.schoolLevel.trim() !== '') ? this.schoolLevel.trim() : '',
        principalName: (this.principalName && this.principalName.trim() !== '') ? this.principalName.trim() : '',
        principalPhoneNo: (this.principalPhoneNo && this.principalPhoneNo.trim() !== '') ? this.principalPhoneNo.trim() : '',
        county: (this.county && this.county.trim() !== '') ? this.county.trim() : '',
        subcounty: (this.subcounty && this.subcounty.trim() !== '') ? this.subcounty.trim() : '',
        email: (this.email && this.email.trim() !== '') ? this.email.trim() : '',
        phoneNo: (this.phoneNo && this.phoneNo.trim() !== '') ? this.phoneNo.trim() : '',
        address: (this.address && this.address.trim() !== '') ? this.address.trim() : '',
      };

      // Always include optional fields (send empty string for strings, null for numbers if no value)
      // This ensures they appear in the API response
      formData.bursarPhoneNo = (this.bursarPhoneNo && this.bursarPhoneNo.trim() !== '') ? this.bursarPhoneNo.trim() : '';
      formData.deanPhoneNo = (this.deanPhoneNo && this.deanPhoneNo.trim() !== '') ? this.deanPhoneNo.trim() : '';
      formData.schoolMotto = (this.schoolMotto && this.schoolMotto.trim() !== '') ? this.schoolMotto.trim() : '';
      
      // Include registeredByID - always use the logged-in user's ID
      formData.registeredByID = this.registeredByID || null;
      
      // Include marketerID - send null if empty (numbers can be null)
      formData.marketerID = (this.marketerID && this.marketerID !== '') ? parseInt(this.marketerID) : null;

      console.log("🚀 Submitting form data:", JSON.stringify(formData, null, 2));

      try {
        this.Loading = true;
        
        // Use the exact API endpoint from documentation
        const response = await axios.post('/schools/create', formData);

        if (response.status === 200) {
          toast.success('School added successfully');
          this.$emit('fetchSchools');
          this.clearForm();
          this.$emit('closeForm');
        } else {
          throw new Error(`Server responded with status ${response.status}`);
        }
      } catch (error) {
        this.handleError(error, toast);
      } finally {
        this.Loading = false;
      }
    },

    async updateSchool() {
      const toast = useToast();

      // Only School Name and School Code required - allow update with partial data
      const schoolNameTrimmed = (this.schoolName || '').trim();
      const schoolCodeTrimmed = (this.schoolCode || '').trim();

      if (!schoolNameTrimmed || !schoolCodeTrimmed) {
        toast.warning('School Name and School Code are required');
        this.Loading = false;
        return;
      }

      try {
        this.Loading = true;
        // Prepare form data - send empty string/null for fields not filled
        const formData = {
          schoolCode: schoolCodeTrimmed,
          schoolName: schoolNameTrimmed,
          schoolLevel: (this.schoolLevel && this.schoolLevel.trim() !== '') ? this.schoolLevel.trim() : null,
          principalName: (this.principalName && this.principalName.trim() !== '') ? this.principalName.trim() : '',
          principalPhoneNo: (this.principalPhoneNo && this.principalPhoneNo.trim() !== '') ? this.principalPhoneNo.trim() : '',
          county: (this.county && this.county.trim() !== '') ? this.county.trim() : '',
          subcounty: (this.subcounty && this.subcounty.trim() !== '') ? this.subcounty.trim() : '',
          email: (this.email && this.email.trim() !== '') ? this.email.trim() : '',
          phoneNo: (this.phoneNo && this.phoneNo.trim() !== '') ? this.phoneNo.trim() : '',
          address: (this.address && this.address.trim() !== '') ? this.address.trim() : '',
        };

        // Always include optional fields explicitly
        // Send empty string for string fields, null for number fields if no value
        // This ensures they appear in the API response
        formData.bursarPhoneNo = (this.bursarPhoneNo && this.bursarPhoneNo.trim() !== '') ? this.bursarPhoneNo.trim() : '';
        formData.deanPhoneNo = (this.deanPhoneNo && this.deanPhoneNo.trim() !== '') ? this.deanPhoneNo.trim() : '';
        formData.schoolMotto = (this.schoolMotto && this.schoolMotto.trim() !== '') ? this.schoolMotto.trim() : '';
        
        // Include registeredByID - always use the logged-in user's ID (or existing value in edit mode)
        formData.registeredByID = this.registeredByID || this.school?.registeredByID || null;
        
        // Include marketerID - send null if empty (numbers can be null)
        if (this.marketerID && this.marketerID !== '') {
          formData.marketerID = parseInt(this.marketerID);
        } else {
          // If not set in form, use the existing value from the school object if available
          formData.marketerID = this.school?.marketerID || null;
        }

        console.log("🔄 Updating school with data:", JSON.stringify(formData, null, 2));
        console.log("📋 Form values before update:", {
          bursarPhoneNo: this.bursarPhoneNo,
          deanPhoneNo: this.deanPhoneNo,
          schoolMotto: this.schoolMotto,
          registeredByID: this.registeredByID,
          registeredByName: this.registeredByName,
          marketerID: this.marketerID,
          schoolObject: this.school
        });

        // Use the exact API endpoint from documentation
        let response = await axios.post(`/schools/update/${this.schoolCode}`, formData);

        console.log("✅ Update response:", JSON.stringify(response.data, null, 2));
        console.log("⚠️ Missing fields check:", {
          hasBursarPhoneNo: 'bursarPhoneNo' in (response.data || {}),
          hasDeanPhoneNo: 'deanPhoneNo' in (response.data || {}),
          hasMarketerID: 'marketerID' in (response.data || {}),
          hasMarketerName: 'marketerName' in (response.data || {}),
          hasSchoolMotto: 'schoolMotto' in (response.data || {})
        });
        
        // NOTE: If optional fields (bursarPhoneNo, deanPhoneNo, marketerID, marketerName, schoolMotto)
        // are missing from the response even though they were sent in the request, this is a BACKEND issue.
        // The backend API should return all fields as per the API documentation, even if they're null/empty.
        // The frontend is correctly sending these fields in the request payload.

        if (response.status === 200) {
          toast.success('School updated successfully');
          // Refresh the schools list to get updated data
          this.$emit('fetchSchools');
          this.$emit('closeForm');
          this.editMode = false;
        } else {
          toast.error(`Unexpected response status: ${response.status}`);
        }
      } catch (error) {
        this.handleError(error, toast);
      } finally {
        this.Loading = false;
      }
    },

    handleError(error, toast) {
      if (error.response && error.response.data) {
        const serverResponse = error.response.data;
        const status = error.response.status;
        
        if (status === 400) {
          // API returns: { "message": "Error: School code in use!" }
          if (serverResponse.message && serverResponse.message.includes('School code in use')) {
            toast.error('School code is already in use. Please use a different code.');
          } else {
            toast.error(serverResponse.message || 'Invalid request. Please check your input.');
          }
        } else if (status === 208) {
          toast.error(`Email has already been used: ${serverResponse.message}`);
        } else if (status === 500) {
          if (serverResponse.message && serverResponse.message.includes('Duplicate entry')) {
            if (serverResponse.message.includes('email')) {
              toast.error('School with the given email already exists!');
            } else {
              toast.error('A duplicate entry was detected. Please check your input.');
            }
          } else {
            toast.error(`Server error: ${serverResponse.message || 'An unexpected error occurred'}`);
          }
        } else {
          toast.error(`ERROR: ${serverResponse.message || 'An unexpected error occurred'}`);
        }
      } else if (error.request) {
        toast.error('No response from server. Please check your connection.');
      } else {
        toast.error(`ERROR: ${error.message || 'An unexpected error occurred'}`);
      }
      console.error('Error:', error);
    },

    clearForm() {
      this.schoolName = '';
      this.schoolCode = '';
      this.schoolLevel = '';
      this.principalName = '';
      this.principalPhoneNo = '';
      this.bursarPhoneNo = '';
      this.deanPhoneNo = '';
      this.county = '';
      this.subcounty = '';
      this.email = '';
      this.phoneNo = '';
      this.address = '';
      this.registeredByID = null;
      this.registeredByName = '';
      this.registeredByUsername = '';
      this.marketerID = ''; // Empty string for select dropdown
      this.schoolMotto = '';
      this.deleted = false;
      this.editMode = false;
    },
  },

  async mounted() {
    await this.fetchUsers();

    const isEdit =
      this.school &&
      typeof this.school === 'object' &&
      Object.keys(this.school).length > 0;

    if (!isEdit) {
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      const userId =
        userData.id ||
        userData.userId ||
        userData.userID ||
        localStorage.getItem('userId') ||
        localStorage.getItem('userID') ||
        sessionStorage.getItem('userId') ||
        sessionStorage.getItem('userID');
      const userFullname = (
        localStorage.getItem('fullname') ||
        sessionStorage.getItem('fullname') ||
        userData.fullname ||
        ''
      ).trim();
      const userUsername = (
        localStorage.getItem('username') ||
        sessionStorage.getItem('username') ||
        userData.username ||
        ''
      ).trim();

      if (userId !== null && userId !== undefined && String(userId).trim() !== '') {
        const parsed = parseInt(String(userId), 10);
        this.registeredByID = Number.isNaN(parsed) ? userId : parsed;
        this.registeredByUsername = userUsername;
        this.registeredByName = userFullname;

        if ((!this.registeredByUsername || !this.registeredByName) && this.users.length) {
          const found = this.users.find(
            (u) =>
              String(u.id ?? u.userID) === String(this.registeredByID) ||
              Number(u.id ?? u.userID) === Number(this.registeredByID)
          );
          if (found) {
            if (!this.registeredByUsername) this.registeredByUsername = (found.username || '').trim();
            if (!this.registeredByName) this.registeredByName = (found.fullname || found.username || '').trim();
          }
        }

        if (!this.registeredByUsername && !this.registeredByName) {
          this.registeredByName = `User #${this.registeredByID}`;
        }
      }
    } else {
      this.syncRegisteredByUsernameFromUsers();
    }

    if (this.school) {
      this.updateSubcounties();
    }
  },
};
</script>

<style scoped>
* {
  padding: 0;
  margin: 0;
  box-sizing: border-box;
}

.form-wrap {
  background-color: rgba(17, 167, 167, 0.5);
  width: 100%;
  height: 100%;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1001;
  display: flex;
  align-items: center;
  justify-content: center;
}

.form-content {
  background-color: #4368b9;
  border-radius: 5px;
  padding: 20px;
  box-shadow: 0px 0px 5px gold;
  width: 90%;
  max-width: 500px;
  max-height: 90%;
  overflow-y: auto;
  position: relative;
}

.cancel {
  position: absolute;
  top: 10px;
  right: 10px;
  cursor: pointer;
  color: gold;
  font-size: 1.3rem;
}

.form-title {
  color: gold;
  text-align: center;
}

.form-inputs {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  padding-top: 10px;
}

.form-group {
  position: relative;
}

.form-control {
  border: 1px solid gold;
  outline: none;
  padding: 0.3rem;
  border-radius: 4px;
  font-size: 1rem;
  width: 100%;
  box-sizing: border-box;
  background-color: #4368b9;
  color: white;
}

.form-control:disabled {
  background-color: #35548f;
  cursor: not-allowed;
  opacity: 0.7;
}

.form-control.registered-by-display {
  font-weight: 800;
  letter-spacing: 0.02em;
  color: #fff7c2;
  cursor: default;
}

.form-control[readonly] {
  background-color: rgba(67, 104, 185, 0.6);
  cursor: default;
  opacity: 0.9;
}

.form-control::placeholder {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.9rem;
}

.form-control option {
  background-color: #4368b9;
  color: white;
  padding: 0.5rem;
}

label {
  position: absolute;
  top: 50%;
  left: 4px;
  background: #4368b9;
  padding: 0 5px;
  transform: translateY(-50%);
  transition: all 0.3s ease;
  color: gold;
}

label.filled {
  top: -1px;
  left: 5px;
  color: gold;
  font-size: 0.95rem;
  font-weight: 600;
}

.form-group input:focus + label,
.form-group input:not(:placeholder-shown) + label {
  top: -1px;
  left: 5px;
  color: gold;
  font-size: 0.95rem;
  font-weight: 600;
}

.form-group select:focus + label,
.form-group select:not([value=""]) + label {
  top: -1px;
  left: 5px;
  color: gold;
  font-size: 0.95rem;
  font-weight: 600;
}

.form-actions {
  display: flex;
  justify-content: space-between;
}

.form-actions button {
  padding: 0.3rem 1rem;
  border: none;
  cursor: pointer;
  border-radius: 4px;
}

.form-actions button:first-child {
  font-size: medium;
  background: rgba(245, 56, 56, 1);
  border: 1px solid rgba(245, 56, 56, 1);
  color: black;
}

.form-actions button:first-child:hover {
  background-color: #4368b9;
  color: white;
}

.form-actions button:last-child {
  font-size: medium;
  background: gold;
  border: 1px solid gold;
  color: black;
}

.form-actions button:last-child:hover {
  background-color: #4368b9;
  color: white;
}

hr {
  border: 1px solid gold;
  margin: 20px 0;
}

@media only screen and (max-width: 1024px) {
  .form-content {
    width: 85%;
    max-width: 600px;
  }
}

@media only screen and (max-width: 768px) {
  .form-content {
    width: 95%;
    max-width: 100%;
    padding: 15px;
    max-height: 95vh;
  }

  .form-inputs {
    grid-template-columns: 1fr;
    gap: 0.9rem;
  }

  .form-title h2 {
    font-size: 1.1rem;
  }
}

@media only screen and (max-width: 480px) {
  .form-wrap {
    padding: 0.5rem;
  }

  .form-content {
    width: 100%;
    padding: 12px;
    max-height: 100vh;
    border-radius: 0;
  }

  .form-title h2 {
    font-size: 1rem;
    margin-bottom: 0.5rem;
  }

  .form-inputs {
    gap: 0.75rem;
    padding-top: 5px;
  }

  .form-control {
    padding: 0.4rem;
    font-size: 0.9rem;
  }

  .form-actions {
    flex-direction: column;
    gap: 0.5rem;
  }

  .form-actions button {
    width: 100%;
    padding: 0.5rem;
  }

  .cancel {
    top: 5px;
    right: 5px;
    font-size: 1.2rem;
  }
}
</style>