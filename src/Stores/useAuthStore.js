import { defineStore } from "pinia";
import { ref } from "vue";
import axios from "../axios";



// Read auth data from either storage (session = this tab only, local = persistent)
function getStoredToken() {
  return localStorage.getItem("token") || sessionStorage.getItem("token") || "";
}
function getStoredJson(key, fallback) {
  const raw = localStorage.getItem(key) || sessionStorage.getItem(key);
  if (raw == null) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}
function getStoredString(key) {
  return localStorage.getItem(key) || sessionStorage.getItem(key) || "";
}

export const useAuthStore = defineStore("auth", () => {
  const successMessage = ref("");
  const token = ref(getStoredToken());
  const isAuthenticated = ref(!!token.value);
  const accountNo = ref(getStoredString("accountNo"));
  const username = ref(getStoredString("username"));
  const roles = ref(getStoredJson("roles", []));


  // const schoolID = ref(localStorage.getItem("schoolID") || "");
  const shoolDetails = ref(
    JSON.parse(localStorage.getItem("shoolDetails") || "{}")
  );


  function setAuthenticated(status) {
    isAuthenticated.value = status;
  }

  function setSuccessMessage(message) {
    successMessage.value = message;
    console.log("Set success message:", successMessage.value);
  }

  function setSchoolDetails(details) {
    shoolDetails.value = details;
    localStorage.setItem("shoolDetails", JSON.stringify(details));
  }

  function clearSchoolDetails() {
    shoolDetails.value = {};
    localStorage.removeItem("shoolDetails");
  }

  function clearAuthStorage() {
    const keys = ["token", "authToken", "accountNo", "username", "roles", "phoneNo", "fullname", "userId", "user", "schoolCode"];
    keys.forEach((key) => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });
  }

  function logout() {
    return new Promise((resolve) => {
      setTimeout(() => {
        clearAuthStorage();

        token.value = "";
        accountNo.value = "";
        username.value = "";
        roles.value = [];

        if (axios && axios.defaults && axios.defaults.headers) {
          delete axios.defaults.headers.common.Authorization;
        }

        setAuthenticated(false);
        console.log("Logout completed - all tokens and axios headers cleared");
        resolve();
      }, 2000); // Simulate delay
    });
  }

  async function login({ phoneNo, password, rememberMe = true }) {
    try {
      const response = await axios.post(
        "/auth/signin",
        { phoneNo: (phoneNo || '').trim(), password: (password || '').trim() },
      );

      const data = response.data;
      const receivedToken = data?.token;
      if (!receivedToken) {
        console.error("Signin returned 200 but no token. Response:", data);
        throw new Error("Invalid response from server (no token). Contact support.");
      }

      const receivedUserId = data?.id;
      const receivedPhoneNo = data?.phoneNo;
      const receivedUsername = data?.username;
      const receivedFullname = data?.fullname;
      const receivedRoles = Array.isArray(data?.roles) ? data.roles : [];

      // Use localStorage for "remember me" (persist across tabs/close), sessionStorage otherwise (this tab only)
      const storage = rememberMe ? localStorage : sessionStorage;
      storage.setItem('token', receivedToken);
      storage.setItem('authToken', receivedToken);
      storage.setItem('username', receivedUsername || '');
      storage.setItem('fullname', receivedFullname || '');
      storage.setItem('phoneNo', receivedPhoneNo || '');
      storage.setItem('userId', receivedUserId?.toString() || '');
      storage.setItem('roles', JSON.stringify(receivedRoles));
      // Keep accountNo in same storage for consistency (legacy)
      storage.setItem('accountNo', '');

      token.value = receivedToken;
      username.value = receivedUsername || '';
      roles.value = receivedRoles;
      // accountNo is not part of the API response, keeping it as empty or legacy
      accountNo.value = '';
      

  
      setAuthenticated(true);
      setSuccessMessage("LOGIN SUCCESS");
      console.log("Login successful, token set:", receivedToken);

      // return isMaster; // Return whether the user is Master Admin
    } catch (error) {
      console.error("Login failed:", error);
      setSuccessMessage("");

      if (error.response?.status === 401) {
        const raw =
          error.response?.data?.message || error.response?.data?.error;
        const rawStr = typeof raw === "string" ? raw : "";
        const generic = /^(Unauthorized|Bad credentials|Invalid credentials)$/i.test(rawStr?.trim());
        const msg = generic
          ? "Invalid phone number or password. If you were just added, use the password sent to your phone."
          : rawStr || "Invalid phone number or password. If you were just added, use the password sent to your phone.";
        throw new Error(msg);
      }
    
      // Handle network errors
      if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
        throw new Error("Network Error: Unable to connect to the server. Please check your internet connection and ensure the API server is running.");
      }
    
      // Handle 500 Internal Server Error – use server message if available
      if (error.response?.status === 500) {
        const serverMsg = error.serverMessage || error.response?.data;
        let errorMessage = "Server error (500). The login API is failing — fix this on the backend (officeapi.samis.co.ke).";
        if (serverMsg) {
          if (typeof serverMsg === "string") {
            errorMessage = serverMsg;
          } else if (serverMsg.message) {
            errorMessage = serverMsg.message;
          } else if (serverMsg.error) {
            errorMessage = serverMsg.error;
          } else {
            errorMessage = `Server error: ${JSON.stringify(serverMsg)}`;
          }
        }
        throw new Error(errorMessage);
      }
    
      // Extract the error message directly from the response data
      let errorMessage = "AN ERROR OCCURRED!!";
      
      if (error.response && error.response.data) {
        const errorData = error.response.data;
        if (typeof errorData === 'string') {
          errorMessage = errorData;
        } else if (typeof errorData === 'object') {
          if (errorData.message) {
            errorMessage = errorData.message;
          } else if (errorData.error) {
            errorMessage = errorData.error;
          } else {
            errorMessage = JSON.stringify(errorData);
          }
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
    
      // Throw the specific error message (always as a string)
      throw new Error(errorMessage);
    }
  }

  // Outlet Authentication
  const isOutletAuthenticated = ref(!!localStorage.getItem("outletToken"));
  const outletToken = ref(localStorage.getItem("outletToken") || "");
  const outletID = ref(localStorage.getItem("outletID") || ""); 
  const outletUserID = ref(localStorage.getItem("outletUserID") || "");
  const outletUsername = ref(localStorage.getItem("outletUsername") || ""); // Save Outlet Username
  const outletRoles = ref(JSON.parse(localStorage.getItem("outletRoles") || "[]")); // Save Outlet Roles

  async function loginOutlet({ passcode, outletID: id }) {
    try {
      const response = await axios.post("/auth/signin/bycode", { passcode });

      const receivedToken = response.data.token;
      const receivedoutletUserID = response.data.id;
      const receivedOutlet = response.data.outlet;
      const receivedUsername = response.data.username;
      const receivedRoles = response.data.roles;

      // Set outlet-specific data
      localStorage.setItem("outletToken", receivedToken);
      localStorage.setItem("outletID", id); 
      localStorage.setItem("outletUserID", receivedoutletUserID );
      localStorage.setItem("outletUsername", receivedUsername);
      localStorage.setItem("outletRoles", JSON.stringify(receivedRoles));

      outletToken.value = receivedToken;
      outletID.value = id; 
      outletUserID.value = receivedoutletUserID;
      outletUsername.value = receivedUsername;
      outletRoles.value = receivedRoles;

      isOutletAuthenticated.value = true;
      successMessage.value = "Outlet login successful!";
      console.log("Outlet login successful, token set:", receivedToken);
    } catch (error) {
      console.error("Outlet login failed:", error);
      successMessage.value = "Outlet login failed!";
      throw error;
    }
  }

  async function logoutOutlet() {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Clear outlet-specific state
        localStorage.removeItem("outletToken");
        localStorage.removeItem("outletID");
        localStorage.removeItem("outletUserID")
        localStorage.removeItem("outletUsername");
        localStorage.removeItem("outletRoles");

        outletToken.value = "";
        outletID.value = ""; 
        outletUserID.value = "";
        outletUsername.value = "";
        outletRoles.value = [];

        isOutletAuthenticated.value = false;
        successMessage.value = "Outlet logout successful!";
        resolve();
      }, 500); // Simulate delay
    });
  }

  return {
    // Main (School) Authentication
    isAuthenticated,
    setAuthenticated,
    logout,
    login,
    successMessage,
    setSuccessMessage,
    token,
    // phoneNo1,
    accountNo,
    username,
    roles,
    // schoolID,
    // setschoolID,
    // shoolDetails,
    // setSchoolDetails,
    // isMasterAdmin, // Export Master Admin state

    // Outlet Authentication
    isOutletAuthenticated,
    outletToken,
    outletID,
    outletUserID,
    outletUsername, // Export outletUsername
    outletRoles, // Export outletRoles

    loginOutlet,
    logoutOutlet,
  };
});