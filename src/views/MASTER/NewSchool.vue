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
    Registration Date
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
    school(newSchool) {
      if (newSchool) {
        this.editMode = true;
        Object.assign(this, newSchool);
        // Ensure county and subcounty are set properly when editing
        this.county = newSchool.county || '';
        this.subcounty = newSchool.subcounty || '';
        this.updateSubcounties(); // Update subcounties based on selected county
      } else {
        this.clearForm();
      }
    },
  },

  methods: {

    methods: {
  selectSchoolToEdit(school) {
    this.editMode = true;  // Set editMode to true when selecting a school to edit
    this.$emit('editSchool', school);  // Emit the school data to the parent or update the prop directly
  }
},


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

      if (!this.schoolName || !this.phoneNo || !this.email || !this.address || !this.principalName || !this.subcounty || !this.county) {
        toast.warning('ALL REQUIRED FIELDS MUST BE FILLED!');
        return;
      }

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

*{
  padding: 0;
  margin: 0;
  box-sizing: border-box;
}

.y{
  color: #2b7ab7;
  font-family: ui-monospace;
  font-weight:900;
}

.custom-select-container {
  margin-bottom: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.select-input {
  padding: 0.3rem;
  border-radius: 5px;
  border: 1px solid gold;
  outline: none;
  width: 100%;
  /* margin-top: -.5rem; */
  color: white;
}

.select-input::placeholder {
  color: white;
}

.dropdown {
  margin-top: 0.25rem;
  border: 1px solid gold;
  border-radius: 5px;
  max-height: 200px;
  overflow-y: auto;
  background-color: white;
  list-style: none;
  padding: 0;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);

}

.dropdown li {
  padding: 0.3rem;
  cursor: pointer;
}

.dropdown li:hover {
  background-color: #eee;
}

/* No results message */
.no-results {
  color: gray;
  font-size: 0.9rem;
  margin-top: 0.5rem;
  text-align: center;
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

.bio{
  margin-top: 1rem;
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
  font-size: .9rem;
}
 
.form-group label {
  position: absolute;
  top: 50%;
  left: 12px;
  background: #fff; /* Ensure label background matches the input */
  padding: 0 5px;
  transform: translateY(-50%);
  transition: all 0.3s ease;
  color: #4368b9; /* Label color */
  pointer-events: none; /* Prevent label from blocking interaction */
  opacity: 1; /* Make sure label is visible */
}

.form-group .filled {
  top: -10px;
  font-size: 12px;
  color: #4368b9;
}


/* When the select is focused or has a value, the label floats above */
.form-group select:focus + label,
.form-group select:not(:empty) + label {
  top: -10px;
  font-size: 12px;
  color: #4368b9;
  background: #fff; /* Ensure background stays consistent */
}
/* Optional: Style for the select dropdown */
.form-group select {
  padding-top: 18px; /* To ensure there's space for the floating label */
  padding-bottom: 6px;
}

.form-group textarea:focus + label,
.form-group textarea:not(:placeholder-shown) + label,
.form-group textarea:valid + label,
.form-group input:focus + label,
.form-group input:not(:placeholder-shown) + label,
.form-group input:valid + label,
.filled {
  top: -1px;
  left: 5px;
  color: gold;
  font-size: 1.05rem;
  font-weight: 700;
  background-color: #4368b9;
}


input[type="file"]::-webkit-file-upload-button {
  /* Custom styles for the "No file chosen" text */
  color: #333;
  background-color: gold;
  border: 1px solid gold;
  border-radius: 5px;
  padding: 0.2rem 1rem;
  cursor: pointer;
  font-size: 16px;
}

input[type="file"]::-webkit-file-upload-button:hover {
  /* Hover styles for the "No file chosen" text */
  background-color: #4368b9;
  color: white;
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

/* Responsive Styles */
@media only screen and (max-width: 767px) {
  .form-content {
    width: 95%;
    max-width: 100%;
    padding: 15px;
  }

  .cancel {
    top: 8px;
    right: 8px;
    font-size: 1.2rem;
  }

  .form-title h2 {
    font-size: 1.3rem;
  }

  .form-inputs {
    grid-template-columns: 1fr; /* Change to single column layout */
    gap: 0.9rem;
  }

  .form-group textarea:focus + label,
  .form-group textarea:not(:placeholder-shown) + label,
  .form-group textarea:valid + label,
  .form-group input:focus + label,
  .form-group input:not(:placeholder-shown) + label,
  .form-group input:valid + label,
  .filled {      
    font-size: .9rem;
    font-weight: 450;        
  }
  .bio {
    margin-top: 0.8rem;
  }

  .form-group label {
    font-size: 0.9rem;
  }

  .form-control {
    font-size: 0.9rem;
    padding: 6px;
  }

  

  
}
</style>
    