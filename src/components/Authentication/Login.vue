<template>    
  <div class="page-wrap">
    <div class="form-content">
      <div class="member-title">
        <h2>Welcome Back!</h2>
      </div>
      <hr />
      <div class="form-inputs">
        <!-- <div class="form-group">
          <input
            type="text"
            class="x"
            id="phoneNo"
            placeholder=" "
            v-model="loginData.tenantId"
          />
          <label for="phoneNo">School ID</label>
        </div> -->

        <div class="form-group">
          <input
            type="text"
            class="x"
            id="phoneNo"
            placeholder=" "
            v-model="loginData.phoneNo"
          />
          <label for="phoneNo">Phone number</label>
        </div>

        <div class="form-group">
          <input
            :type="passwordFieldType"
            class="x"
            id="password"
            placeholder=" "
            v-model="loginData.password"
          />
          <label for="password">Password</label>
          <span @click="togglePasswordVisibility" class="toggle-password">
            <i :class="passwordFieldType === 'password' ? 'fa fa-eye' : 'fa fa-eye-slash'"></i>
          </span>
        </div>
        <div class="form-group form-options">
          <div class="remember-me">
            <input type="checkbox" id="rememberMe" v-model="rememberMe" />
            <label class="y" for="rememberMe">Remember me</label>
          </div>
          <div class="forgot-password">
            <a href="#" class="forgot-password-link" @click.prevent="showForgotModal = true">Forgot your password?</a>
          </div>
        </div>
      </div>
      <hr />
      <div class="btn-register">
        <button @click="loginNow">Log In</button>
      </div>

      <LoadingSpinner :isLoading="Loading" />

      <!-- Forgot password modal -->
      <div v-if="showForgotModal" class="modal-overlay" @click.self="showForgotModal = false">
        <div class="modal-content">
          <h3>Forgot password</h3>
          <p class="modal-hint">Enter your phone number and we’ll send instructions to reset your password.</p>
          <div class="form-group">
            <input
              type="text"
              class="x"
              v-model="forgotPhoneNo"
              placeholder=" "
            />
            <label>Phone number</label>
          </div>
          <div class="modal-actions">
            <button type="button" class="btn-cancel" @click="showForgotModal = false">Cancel</button>
            <button type="button" class="btn-submit" @click="submitForgotPassword" :disabled="forgotLoading">
              {{ forgotLoading ? 'Sending…' : 'Send instructions' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import { ref, watch, toRefs } from 'vue';
import { useAuthStore } from '../../Stores/useAuthStore'; 
import LoadingSpinner from '../LoadingSpinner.vue'
import { useToast } from 'vue-toastification';
import { useRouter } from 'vue-router';
import axios from '../../axios';

export default {
  components: { LoadingSpinner },
  data() {
    return {
      showSpinner: false,
      show: false,
      popMessage: "",
      popBorderColor: "gold",
      loginData: {
        phoneNo: '',
        password: '',
        tenantId: ''
      },
      passwordFieldType: 'password',
      rememberMe: localStorage.getItem('rememberMePreference') !== 'false',
      Loading: false,
      showForgotModal: false,
      forgotPhoneNo: '',
      forgotLoading: false,
    };
  },
  setup() {
    const authStore = useAuthStore(); 
    const router = useRouter();
    const toast = useToast();
    const { successMessage, isAuthenticated } = toRefs(authStore);

    watch(successMessage, (newValue) => {
      if (newValue) {
        toast.success(newValue);
      }
    });

    return { authStore, successMessage, isAuthenticated, router, toast };
  },
  methods: {      
    async loginNow() {
      const phoneNo = (this.loginData.phoneNo || '').trim();
      const password = (this.loginData.password || '').trim();
      if (!phoneNo || !password) {
        this.toast.error("ALL FIELDS REQUIRED!!");
        return;
      }

      const data = { phoneNo, password, rememberMe: this.rememberMe };

      try {
        this.Loading = true;
        await this.authStore.login(data);
        localStorage.setItem('rememberMePreference', this.rememberMe ? 'true' : 'false');

        // If login is successful, retrieve and display the success message
        const successMsg = this.authStore.successMessage;
        console.log("Login successful, displaying success message:", successMsg);
        this.toast.success(successMsg);

        // Redirect based on user type
        // if (isMasterAdmin) {
        //   this.router.push('/allSchools'); // Redirect to Master Admin dashboard
        // } else {
          this.router.push('/'); // Redirect to dashboard
        // }
      } catch (err) {
        // Extract error message properly
        let errorMessage = "AN ERROR OCCURRED!!";
        
        if (err) {
          if (typeof err === 'string') {
            errorMessage = err;
          } else if (err.message) {
            errorMessage = err.message;
          } else if (err.response && err.response.data) {
            const errorData = err.response.data;
            if (typeof errorData === 'string') {
              errorMessage = errorData;
            } else if (errorData.message) {
              errorMessage = errorData.message;
            } else if (errorData.error) {
              errorMessage = errorData.error;
            } else {
              errorMessage = JSON.stringify(errorData);
            }
          } else {
            errorMessage = String(err);
          }
        }
        
        console.error("Login error:", errorMessage);
        console.error("Full error object:", err);
        
        // Show error message (split by newlines if it contains them)
        const displayMessage = errorMessage.split('\n')[0]; // Show first line only in toast
        this.toast.error(displayMessage);
      } finally {
        this.Loading = false;
      }
    },

    logout() {
      localStorage.clear();
      this.router.push('/login');
    },
    togglePasswordVisibility() {
      this.passwordFieldType = this.passwordFieldType === 'password' ? 'text' : 'password';
    },
    async submitForgotPassword() {
      const phoneNo = (this.forgotPhoneNo || '').trim();
      if (!phoneNo) {
        this.toast.error('Please enter your phone number.');
        return;
      }
      this.forgotLoading = true;
      try {
        await axios.post('/auth/forgot-password', { phoneNo });
        this.toast.success('If an account exists for this number, you will receive instructions by SMS.');
        this.showForgotModal = false;
        this.forgotPhoneNo = '';
      } catch (err) {
        const status = err.response?.status;
        const msg = err.response?.data?.message || err.response?.data?.error;
        if (status === 404 || status === 501 || err.code === 'ERR_NETWORK') {
          this.toast.warning('Password reset may not be available. Please contact your administrator.');
        } else {
          this.toast.error(msg || 'Something went wrong. Please try again or contact support.');
        }
      } finally {
        this.forgotLoading = false;
      }
    },
  }
}
</script>

  
  <style scoped>
  * {
    padding: 0;
    margin: 0;
    box-sizing: border-box;
    font-family: 'Arial', sans-serif;
  }
  
  .page-wrap {
    position: fixed;
    width: 100%;
    height: 100%;
    left: 0;
    top: 0;
    background: linear-gradient(135deg, rgba(67, 104, 185, 0.8), rgba(30, 55, 120, 0.8)), 
                radial-gradient(circle at 30% 30%, rgba(255, 215, 0, 0.3) 0%, rgba(255, 215, 0, 0) 50%), 
                radial-gradient(circle at 70% 70%, rgba(255, 223, 50, 0.25) 0%, rgba(255, 223, 50, 0) 40%);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1007;
}

@keyframes shimmer {
    0% { opacity: 0.3; transform: scale(1); }
    50% { opacity: 0.5; transform: scale(1.05); }
    100% { opacity: 0.3; transform: scale(1); }
}

.page-wrap::after {
    content: "";
    position: absolute;
    width: 100%;
    height: 100%;
    background: radial-gradient(circle at 50% 50%, rgba(255, 215, 0, 0.2) 0%, rgba(255, 215, 0, 0) 50%);
    animation: shimmer 1.5s infinite ease-in-out;
    
    z-index: 1;
}

/* Ensures content stays above the shimmer effect */
.page-wrap > * {
    z-index: 2;
}

.form-content {
    background-color: #4368b9;
    border-radius: 10px;
    padding: 40px;
    box-shadow: 0 0px 5px gold;
    width: 100%;
    max-width: 400px;
    text-align: center;
}

  
  .member-title {
    color: #fff;
    margin-bottom: 20px;
  }
  
  .form-inputs {
    margin-top: 20px;
  }
  
  .form-group {
    position: relative;
    margin-bottom: 1.5rem;
  }
  
  .x {
    width: 100%;
    padding: 7px;
    font-size: 16px;
    border: 1px solid gold;
    border-radius: 5px;
    background: transparent;
    color: #fff;
  }
  
  .x:focus {
    outline: none;
    border-color: gold;
  }
  
  .x:focus + label,
  .x:not(:placeholder-shown) + label {
    top: -10px;
    left: 5px;
    font-size: 14px;
    color: gold;
    padding: 0 5px;
  }
  
  label {
    position: absolute;
    top: calc(100% - 34px);
    left: 0;
    margin-left: .5rem;
    font-size: 16px;
    color: #fff;
    background: #4368b9;
    transition: all 0.3s ease;
    pointer-events: none;
    padding: 0 5px;
  }
  
  button {
    background-color: gold;
    color: #4368b9;
    padding: 8px;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    font-size: 16px;
    font-weight: 600;
    transition: background-color 0.3s ease;
    width: 100%;
  }
  
  button:hover {
    background-color: #38B2AC;
  }
  
  .toggle-password {
    position: absolute;
    top: 50%;
    right: 10px;
    transform: translateY(-50%);
    background: none;
    border: none;
    color: gold;
    cursor: pointer;
    font-size: 18px;
  }
  
  .btn-register {
    margin-top: 20px;
  }
  
  hr {
    border: 1px solid gold;
    margin: 20px 0;
  }
  
  .form-options {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
  }
  
  .y {
    margin-top: .8rem;
    margin-left: .8rem;
  }
  
  .forgot-password {
    flex: 1;
  }
  
  .forgot-password {
    text-align: right;
  }
  
  .forgot-password-link {
    color: gold;
    text-decoration: none;
  }
  
  .forgot-password-link:hover {
    text-decoration: underline;
  }
  
  @media only screen and (max-width: 767px) {
    .form-content {
      width: 90%;
      padding: 20px;
    }
    .form-group {
      margin-bottom: 1rem;
    }
    .form-options {
      flex-direction: column;
      align-items: flex-start;
    }
    .remember-me {
      margin-bottom: 1rem;
    }
    .toggle-password {
      right: 5px;
    }
  
    .forgot-password{
      margin-top: -.5rem;
    }
    .y {
      margin-top: -1rem;
      margin-left: 1.1rem;
    }
  }

  /* Forgot password modal */
  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1010;
  }
  .modal-content {
    background: #4368b9;
    border-radius: 10px;
    padding: 24px;
    max-width: 380px;
    width: 90%;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    border: 1px solid gold;
  }
  .modal-content h3 {
    color: #fff;
    margin-bottom: 8px;
  }
  .modal-hint {
    color: rgba(255, 255, 255, 0.9);
    font-size: 14px;
    margin-bottom: 16px;
  }
  .modal-actions {
    display: flex;
    gap: 12px;
    margin-top: 20px;
    justify-content: flex-end;
  }
  .btn-cancel {
    background: transparent;
    color: #fff;
    border: 1px solid gold;
    padding: 8px 16px;
    border-radius: 5px;
    cursor: pointer;
  }
  .btn-cancel:hover {
    background: rgba(255, 255, 255, 0.1);
  }
  .btn-submit {
    background: gold;
    color: #4368b9;
    border: none;
    padding: 8px 16px;
    border-radius: 5px;
    cursor: pointer;
    font-weight: 600;
  }
  .btn-submit:hover:not(:disabled) {
    background: #e6c200;
  }
  .btn-submit:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
  </style>