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
          <input type="text" class="form-control" v-model="schoolName" placeholder="School Name" required />
          <label for="schoolName" :class="{ filled: schoolName !== '' }">School Name*</label>
        </div>
        <div class="form-group">
          <input type="text" class="form-control" v-model="schoolCode" placeholder="School Code" required />
          <label for="schoolCode" :class="{ filled: schoolCode !== '' }">School Code*</label>
        </div>
        <div class="form-group">
          <input type="email" class="form-control" v-model="email" placeholder="School Email" required />
          <label for="email" :class="{ filled: email !== '' }">School Email*</label>
        </div>
        <div class="form-group">
          <input type="text" class="form-control" v-model="phoneNo" placeholder="Phone No" required />
          <label for="phoneNo" :class="{ filled: phoneNo !== '' }">Phone No*</label>
        </div>

  <!-- County Selection -->
<div class="form-group">
  <select class="form-control" v-model="county" @change="updateSubcounties" required id="county">
    <option value="" disabled>Select County*</option>
    <option v-for="county in counties" :key="county" :value="county">{{ county }}</option>
  </select>
  <label for="county" :class="{ filled: county !== '' }">County*</label>
</div>

        <!-- Subcounty Selection (Dynamic) -->
        <div class="form-group">
          <select class="form-control" v-model="subcounty" required>
            <option value="" disabled>Select Subcounty*</option>
            <option v-for="subcounty in subcountyOptions" :key="subcounty" :value="subcounty">{{ subcounty }}</option>
          </select>
          <label for="subcounty" :class="{ filled: subcounty !== '' }">Subcounty*</label>
        </div>

        <!-- Optional Fields -->
        <!-- <div class="form-group">
  <input 
    type="text" 
    class="form-control" 
    v-model="registeredByName" 
    placeholder="Registered By Name" 
    id="registeredByName"
  />
  <label 
    for="registeredByName" 
    :class="{ filled: registeredByName !== '' }"
  >
    Registered By Name
  </label>
</div> -->
        <div class="form-group">
          <input type="text" class="form-control" v-model="principalName" placeholder="Principal's Name" />
          <label for="principalName" :class="{ filled: principalName !== '' }">Principal's Name</label>
        </div>
        <div class="form-group">
          <input type="text" class="form-control" v-model="principalPhoneNo" placeholder="Principal's Phone" />
          <label for="principalPhoneNo" :class="{ filled: principalPhoneNo !== '' }">Principal's Phone</label>
        </div>
        <div class="form-group">
  <input 
    type="text" 
    class="form-control" 
    v-model="address" 
    placeholder="address" 
    id="address"
  />
  <label 
    for="address" 
    :class="{ filled: registeredOn !== '' }"
  >
   Address
  </label>
</div>
<!-- <div class="form-group">
  <input 
    type="text" 
    class="form-control" 
    v-model="tenantID" 
    placeholder="Tenant ID" 
    id="tenantID"
  />
  <label 
    for="tenantID" 
    :class="{ filled: tenantID !== '' }"
  >
    Tenant ID
  </label>
</div> -->

        <div class="form-group">
          <select class="form-control" v-model="schoolLevel">
            <option value="" disabled>Select School Level</option>
            <option value="Primary">Primary</option>
            <option value="Secondary">Secondary</option>
            <option value="Mixed">Mixed</option>
          </select>
          <label for="schoolLevel" :class="{ filled: schoolLevel !== '' }">School Level</label>
        </div>





        <!-- <div v-if="editMode" class="form-group">
          <select v-model="deleted" class="form-control">
            <option :value="false">Active</option>
            <option :value="true">Inactive</option>
          </select>
          <label>Status</label>
        </div> -->
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
      isMounted: true,  // Track if the component is mounte
      schoolName: '',
      schoolCode: '',
      schoolLevel: '',
      address: '',
      email: '',
      phoneNo: '',
      principalName: '',
      principalPhoneNo: '',
      county: '', // Selected county
      subcounty: '', // Selected subcounty
      deleted: false,
      editMode: false,
      counties: ['Mombasa', 'Kwale', 'Kilifi', 'Tana River', 'Lamu', 'Taita-Taveta',
  'Garissa', 'Wajir', 'Mandera', 'Marsabit', 'Isiolo', 'Meru',
  'Tharaka-Nithi', 'Embu', 'Kitui', 'Machakos', 'Makueni', 'Nyandarua',
  'Nyeri', 'Kirinyaga', 'Murang’a', 'Kiambu', 'Turkana', 'West Pokot',
  'Samburu', 'Trans Nzoia', 'Uasin Gishu', 'Elgeyo-Marakwet', 'Nandi',
  'Baringo', 'Laikipia', 'Nakuru', 'Narok', 'Kajiado', 'Kericho', 'Bomet',
  'Kakamega', 'Vihiga', 'Bungoma', 'Busia', 'Siaya', 'Kisumu', 'Homa Bay',
  'Migori', 'Kisii', 'Nyamira', 'Nairobi City'], // Example counties
      subcountyOptions: [], // Available subcounties based on selected county
      subcountyData: { // Subcounties for each county with real names
        Baringo: ['Baringo Central', 'Baringo North', 'Baringo South', 'Eldama Ravine', 'Mogotio', 'Tiaty'],
  Bomet: ['Bomet Central', 'Bomet East', 'Chepalungu', 'Konoin', 'Sotik'],
  Bungoma: ['Bumula', 'Kabuchai', 'Kanduyi', 'Kimilili', 'Mt. Elgon', 'Tongaren', 'Webuye East', 'Webuye West'],
  Busia: ['Budalang’i', 'Butula', 'Funyula', 'Nambale', 'Teso North', 'Teso South'],
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
  Muranga: ['Gatanga', 'Kahuro', 'Kandara', 'Kangema', 'Kigumo', 'Kiharu', 'Mathioya', 'Murang’a South'],
  Nairobi: ['Dagoretti North', 'Dagoretti South', 'Embakasi Central', 'Embakasi East', 'Embakasi North', 'Embakasi South', 'Embakasi West', 'Kamukunji', 'Kasarani', 'Kibra', 'Lang’ata', 'Makadara', 'Mathare', 'Roysambu', 'Ruaraka', 'Starehe', 'Westlands'],
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
  "Tharaka Nithi": ['Chuka/Igambang’ombe', 'Maara', 'Tharaka'],
  "Trans Nzoia": ['Cherang’any', 'Endebess', 'Kiminini', 'Kwanza', 'Saboti'],
  Turkana: ['Loima', 'Turkana Central', 'Turkana East', 'Turkana North', 'Turkana South', 'Turkana West'],
  "Uasin Gishu": ['Ainabkoi', 'Kapseret', 'Kesses', 'Moiben', 'Soy', 'Turbo'],
  Vihiga: ['Emuhaya', 'Hamisi', 'Luanda', 'Sabatia', 'Vihiga'],
  Wajir: ['Buna', 'Eldas', 'Habaswein', 'Tarbaj', 'Wajir East', 'Wajir North', 'Wajir South', 'Wajir West'],
  "West Pokot": ['Kacheliba', 'Kapenguria', 'Pokot South', 'Sigor']
  
      },
      Loading: false,
    };
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
          this.schoolName = String(newSchool.schoolName || newSchool.school_name || '').trim();
          this.schoolCode = String(newSchool.schoolCode || newSchool.school_code || '').trim();
          this.email = String(newSchool.email || '').trim();
          this.phoneNo = String(newSchool.phoneNo || newSchool.phone_no || newSchool.phone || '').trim();
          // Try multiple variations for principal name
          this.principalName = String(
            newSchool.principalName || 
            newSchool.principal_name || 
            newSchool.principalName1 || 
            newSchool.principal || 
            ''
          ).trim();
          // Try multiple variations for principal phone
          this.principalPhoneNo = String(
            newSchool.principalPhoneNo || 
            newSchool.principal_phone_no || 
            newSchool.principalPhone || 
            newSchool.principalPhoneNumber || 
            newSchool.principal_phone || 
            ''
          ).trim();
          this.address = String(newSchool.address || '').trim();
          this.schoolLevel = String(newSchool.schoolLevel || newSchool.school_level || '').trim();
          this.county = String(newSchool.county || '').trim();
          this.subcounty = String(newSchool.subcounty || newSchool.sub_county || '').trim();
          
          console.log('Principal fields after mapping:', {
            principalName: this.principalName,
            principalPhoneNo: this.principalPhoneNo,
            'newSchool.principalName': newSchool.principalName,
            'newSchool.principal_phone_no': newSchool.principal_phone_no,
          });
          
          console.log('✅ Mapped fields in NewSchool:', {
            schoolName: this.schoolName,
            schoolCode: this.schoolCode,
            email: this.email,
            phoneNo: this.phoneNo,
            principalName: this.principalName,
            principalPhoneNo: this.principalPhoneNo,
            address: this.address,
            county: this.county,
            subcounty: this.subcounty,
            schoolLevel: this.schoolLevel,
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
    // Update subcounties based on selected county
    updateSubcounties() {
      if (this.county) {
        this.subcountyOptions = this.subcountyData[this.county] || [];
        this.subcounty = this.subcountyOptions.length ? this.subcountyOptions[0] : '';

      }
    },
    async saveSchool() {
      const toast = useToast();

      // Enhanced validation
      const requiredFields = {
        'School Name': this.schoolName,
        'Phone Number': this.phoneNo,

        // 'Email': this.email,
        // 'Address': this.address,
        // 'Principal Name': this.principalName,
        // 'Subcounty': this.subcounty,
        // 'County': this.county
      };

      const missingFields = Object.entries(requiredFields)
        .filter(([_, value]) => !value)
        .map(([name]) => name);

      if (missingFields.length > 0) {
        toast.warning(`Missing required fields: ${missingFields.join(', ')}`);
        return;
      }

      // Prepare form data with type conversion if needed
      const formData = {
        schoolCode: String(this.schoolCode || ''),
        schoolName: String(this.schoolName),
        schoolLevel: String(this.schoolLevel || ''),
        county: String(this.county),
        subcounty: String(this.subcounty),
        principalName: String(this.principalName),
        principalPhoneNo: String(this.principalPhoneNo || ''),
        email: String(this.email),
        phoneNo: String(this.phoneNo),
        address: String(this.address),
      };

      console.log("🚀 Submitting form data:", JSON.stringify(formData, null, 2));

      try {
        this.Loading = true;
        
        const response = await axios.post('/schools/create', formData, {
          // headers: {
          //   'Content-Type': 'application/json',
          //   // Add authorization if needed:
          //   // 'Authorization': `Bearer ${yourToken}`
          // },
          // validateStatus: (status) => status >= 200 && status < 500
        });

        if (response.status === 200 || response.status === 201) {
          toast.success('School added successfully');
          this.$emit('fetchSchools');
          this.clearForm();
          this.$emit('closeForm');
        } else {
          throw new Error(`Server responded with status ${response.status}`);
        }
      } catch (error) {
        // Enhanced error handling as shown above
      } finally {
        this.Loading = false;
      }
    },

// beforeDestroy() {
//     this.isMounted = false; 
//   },

    async updateSchool() {
      const toast = useToast();

      // No front-end required-field validation for updates – always attempt update
      try {
        this.Loading = true;
        const formData = {
          schoolCode: this.schoolCode,
          schoolName: this.schoolName,
          schoolLevel: this.schoolLevel,
          county: this.county,
          subcounty: this.subcounty,
          principalName: this.principalName,
          principalPhoneNo: this.principalPhoneNo,
          email: this.email,
          phoneNo: this.phoneNo,
          address: this.address,
        };

        let response = await axios.post(`/schools/update/${this.schoolCode}`, formData);

        if (response.status === 200) {
          toast.success('School updated successfully');
          this.$emit('fetchSchools');
          this.$emit('closeForm');
          this.editMode = false; // ✅ Reset edit mode after updating
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
        if (error.response.status === 208) {
          toast.error(`Email has already been used: ${serverResponse.message}`);
        } else if (error.response.status === 500 && serverResponse.message.includes('Duplicate entry') && serverResponse.message.includes('email')) {
          toast.error('School with the given email already exists!');
        } else {
          toast.error(`ERROR: ${serverResponse.message || 'An unexpected error occurred'}`);
        }
      } else {
        toast.error('ERROR PROCESSING REQUEST!');
      }
      console.error('Error:', error);
    },

    clearForm() {
      this.schoolName = '';
      this.schoolCode = '';
      this.schoolLevel = '';
      this.address = '';
      this.email = '';
      this.phoneNo = '';
      this.principalName = '';
      this.principalPhoneNo = '';
      this.county = ''; // Reset county here as well
      this.subcounty = '';
      this.deleted = false;
      this.editMode = false;
    },
  },

  mounted() {
    if (this.school) {
      this.editMode = true;
      Object.assign(this, this.school);
      this.county = this.school.county || '';
      this.updateSubcounties(); // Update subcounties after loading
    }


  },

  
  // beforeDestroy() {
  //   this.isMounted = false;  // Set the flag to false when the component is about to be destroyed
  // },

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

.form-control::placeholder {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.9rem;
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
    