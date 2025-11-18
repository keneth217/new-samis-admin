<template>
    <div class="form-wrap">
      <div class="form-content">
        <div class="cancel" @click="$emit('closeForm')">
          <i class="fas fa-times"></i>
        </div>
        <div class="form-title">
          <h2>{{ editMode ? 'EDIT FINANCE MODULE' : 'NEW FINANCE MODULE' }}</h2>
        </div>
        <div class="form-inputs">
          <!-- Module Name -->
          <div class="form-group">
            <input
              type="text"
              class="form-control"
              v-model="moduleName"
              placeholder="Module Name"
              required
            />
            <label for="moduleName" :class="{ filled: moduleName !== '' }">Module Name</label>
          </div>
  
          <!-- Description -->
          <div class="form-group">
            <textarea
              class="form-control"
              v-model="description"
              placeholder="Description"
              required
            ></textarea>
            <label for="description" :class="{ filled: description !== '' }">Description</label>
          </div>
        </div>
        <hr />
        <div class="form-actions">
          <button @click="$emit('closeForm')">Close</button>
          <button @click="saveModule">{{ editMode ? 'Update' : 'Create' }}</button>
        </div>
      </div>
      <LoadingSpinner :isLoading="Loading" />
    </div>
  </template>
<script>
import axios from 'axios';
import { useToast } from 'vue-toastification';
import LoadingSpinner from '../../components/LoadingSpinner.vue';

export default {
  name: 'FinanceModuleForm',
  components: { LoadingSpinner },
  props: {
    module: {
      type: Object,
      default: null,
    },
  },
  data() {
    return {
      moduleName: '',
      description: '',
      Loading: false,
      editMode: false,
      selectedModule: null, // The module being edited
    };
  },
  watch: {
    module: {
      immediate: true,
      handler(newModule) {
        if (newModule) {
          this.editMode = true;
          this.moduleName = newModule.moduleName || '';
          this.description = newModule.description || '';
        } else {
          this.editMode = false;
          this.clearForm();
        }
      },
    },
  },
  methods: {



    // viewAnalysis(module) {
    //   this.selectedModule = module;
    //   this.moduleName = module.moduleName;
    //   this.description = module.description;
    //   this.editMode = true;
    // },

    clearForm() {
      this.moduleName = '';
      this.description = '';
    },
    async saveModule() {
      const toast = useToast();

      if (!this.moduleName || !this.description) {
        toast.warning('Module Name and Description are required!');
        return;
      }

      const payload = {
        moduleName: this.moduleName,
        description: this.description,
      };

      this.Loading = true;

      try {
        const response = await axios.post('/api/modules/add', payload);

        if (response.status === 200 || response.status === 201) {
          toast.success('Finance Module created successfully!');
          this.$emit('fetchModules'); // Emit event to refresh the module list
          this.$emit('closeForm');
        } else {
          toast.error(`Unexpected response status: ${response.status}`);
        }
      } catch (error) {
        if (error.response && error.response.data) {
          toast.error(`ERROR: ${error.response.data.message || 'An unexpected error occurred'}`);
        } else {
          toast.error('ERROR SAVING MODULE!');
        }
        console.error('Error saving module:', error);
      } finally {
        this.Loading = false;
      }
    },
  },
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
  left: 4px;
  background: #4368b9;
  padding: 0 5px;
  transform: translateY(-50%);
  transition: all 0.3s ease;
  color: gold;
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
   