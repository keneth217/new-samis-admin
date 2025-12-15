<template>
    <div>
      <!-- Debugging: Show received props -->
      <p>✅ School Code Prop: {{ schoolCode || '❌ MISSING' }}</p>
      <p>✅ Module Name Prop: {{ moduleName || 'DEFAULT_MODULE' }}</p>
  
      <!-- Button to trigger activation status check -->
      <button @click="checkActivationStatus" class="status-btn">
        <span class="material-symbols-outlined">info</span> Status
      </button>
  
      <!-- Modal to display activation status -->
      <div v-if="activationStatus" class="activation-status-modal">
        <div class="modal-content">
          <h3>Activation Status</h3>
          <p>School Code: {{ activationStatus.schoolCode || 'N/A' }}</p>
          <p>Module Name: {{ activationStatus.moduleName || 'N/A' }}</p>
          <p>Expiry Date: {{ activationStatus.expiryDate || 'Unknown' }}</p>
          <p>Maintenance Fee: {{ activationStatus.maintenanceFee || 'N/A' }}</p>
          <p>Selling Price: {{ activationStatus.sellingPrice || 'N/A' }}</p>
          <button @click="closeModal" class="close-btn">Close</button>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  import { defineComponent, ref, onMounted } from "vue";
  import axios from "../../axios";
  import { useToast } from "vue-toastification";
  
  export default defineComponent({
    props: {
      schoolCode: {
        type: String,
        required: true,
      },
      moduleName: {
        type: String,
        required: true,
      },
    },
    setup(props) {
      const toast = useToast();
      const activationStatus = ref(null);
  
      // Debugging: Log received props
      onMounted(() => {
        console.log("📌 Props Received:", props);
      });
  
      const checkActivationStatus = async () => {
        try {
          console.log("🔍 Checking activation status for:", props.schoolCode, props.moduleName);
          const response = await axios.post("/activations/status", {
            schoolCode: props.schoolCode,
            moduleName: props.moduleName,
          });
  
          if (response.data) {
            activationStatus.value = response.data; // Update activation status
            console.log("✅ Activation Status Fetched:", response.data);
          } else {
            toast.error("Failed to fetch activation status.");
          }
        } catch (error) {
          console.error("❌ Error fetching activation status:", error);
          toast.error("An error occurred while fetching activation status.");
        }
      };
  
      const closeModal = () => {
        activationStatus.value = null; // Close the modal
      };
  
      return { activationStatus, checkActivationStatus, closeModal };
    },
  });
  </script>
  
  <style scoped>
  /* Button Styles */
  .status-btn {
    background-color: #2b7ab7;
    color: white;
    padding: 8px 16px;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 1rem;
    font-weight: 600;
    transition: background-color 0.3s ease;
  }
  
  .status-btn:hover {
    background-color: #1e6192;
  }
  
  /* Modal Styles */
  .activation-status-modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 3000;
  }
  
  .modal-content {
    background: white;
    padding: 25px;
    border-radius: 10px;
    width: 450px;
    max-width: 90%;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  }
  
  .modal-content h3 {
    margin-bottom: 20px;
    font-size: 1.5rem;
    color: #2b7ab7;
    text-align: center;
  }
  
  .modal-content p {
    margin-bottom: 10px;
    font-size: 1rem;
    color: #333;
  }
  
  .close-btn {
    background: #ddd;
    color: #333;
    padding: 8px 16px;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 1rem;
    font-weight: 600;
    transition: background-color 0.3s ease;
  }
  
  .close-btn:hover {
    background: #ccc;
  }
  </style>
  