import { defineStore } from "pinia";
import { ref } from "vue";
import axios from "../axios";



export const useAuthStore = defineStore("auth", () => {
  
  // localStorage.setItem('token', token);
  // localStorage.setItem('username', username);
  // localStorage.setItem('phoneNo', phoneNo);
  // localStorage.setItem('accountNo', accountNo);
  // localStorage.setItem('roles', JSON.stringify(roles));


  const isAuthenticated = ref(!!localStorage.getItem("token"));
  const successMessage = ref("");
  const token = ref(localStorage.getItem("token") || "");
  // const phoneNo = ref(localStorage.getItem("phoneNo1") || "");
  const accountNo = ref(localStorage.getItem("accountNo") || "");
  const username = ref(localStorage.getItem("username") || "");
  const roles = ref(JSON.parse(localStorage.getItem("roles") || "[]"));


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
  function setschoolID(id) {
    schoolID.value = id;
    localStorage.setItem("schoolID", id);
  }

  function setSchoolDetails(details) {
    shoolDetails.value = details;
    localStorage.setItem("shoolDetails", JSON.stringify(details));
  }

  function clearSchoolDetails() {
    shoolDetails.value = {};
    localStorage.removeItem("shoolDetails");
  }

  function logout() {
    return new Promise((resolve) => {
      setTimeout(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("authToken"); // Also remove authToken
        // localStorage.removeItem("phoneNo1");
        localStorage.removeItem("accountNo");
        localStorage.removeItem("username");
        localStorage.removeItem("roles");
        localStorage.removeItem("phoneNo");
        localStorage.removeItem("fullname");
        localStorage.removeItem("userId");
        localStorage.removeItem("user");
        localStorage.removeItem("schoolCode");
        // localStorage.removeItem("schoolID");
        // localStorage.removeItem("isMasterAdmin"); 
        // clearSchoolDetails();

        token.value = "";
        // phoneNo1.value = "";
        accountNo.value = "";
        username.value = "";
        roles.value = [];
        // schoolID.value = "";
        


        // Clear axios default headers to prevent old token from being sent on next login
        // Clear both the imported axios instance and any default headers
        if (axios && axios.defaults && axios.defaults.headers) {
          delete axios.defaults.headers.common.Authorization;
        }
        
        setAuthenticated(false);
        console.log("Logout completed - all tokens and axios headers cleared");
        resolve();
      }, 2000); // Simulate delay
    });
  }

  async function login({ phoneNo, password}) {
    try {
      // const headers = {
      //   "X-Tenant": schoolID,
      // };
  
      const response = await axios.post(
        "/auth/signin",
        { phoneNo: (phoneNo || '').trim(), password: (password || '').trim() },
        // { headers }
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

      // Store the received values (not the ref variables)
      localStorage.setItem('token', receivedToken);
      localStorage.setItem('authToken', receivedToken); // Also store as authToken for axios interceptor
      localStorage.setItem('username', receivedUsername || '');
      localStorage.setItem('fullname', receivedFullname || '');
      localStorage.setItem('phoneNo', receivedPhoneNo || '');
      localStorage.setItem('userId', receivedUserId?.toString() || '');
      localStorage.setItem('roles', JSON.stringify(receivedRoles));

      // localStorage.setItem("token", receivedToken);
      // localStorage.setItem("userId", receivedUserId);
      // localStorage.setItem("teacherId", receivedTeacherId);
      // localStorage.setItem("username", receivedUsername);
      // localStorage.setItem("roles", JSON.stringify(receivedRoles));
      // localStorage.setItem("isMasterAdmin", isMaster); // Store Master Admin state

      // if (isMaster) {
      //   // If Master Admin, clear school-specific data
      //   const schoolID = 'MASTER';
      //   setschoolID(schoolID);
       
      //   localStorage.removeItem("shoolDetails");
       
      //   shoolDetails.value = {};
      // } else {
        // setschoolID(schoolID);
        // setSchoolDetails({
        //   schoolName: receivedSchool.schoolName,
        //   schoolAddress: receivedSchool.schoolAddress,
        //   schoolPhoneNo: receivedSchool.schoolPhoneNo,
        //   schoolEmail: receivedSchool.schoolEmail,
        //   schoolType: receivedSchool.schoolType,
        //   schoolGender: receivedSchool.schoolGender,
        //   schoolEnrollment: receivedSchool.schoolEnrollment,
        //   county: receivedSchool.county,
        //   subCounty: receivedSchool.subCounty,
        //   ward: receivedSchool.ward,
        //   schoolMotto: receivedSchool.schoolMotto,
        //   mission: receivedSchool.mission,
        //   vision: receivedSchool.vision,
        //   owner: receivedSchool.owner,
        //   phoneNo: receivedSchool.phoneNo,
        //   email: receivedSchool.email,
        //   location: receivedSchool.location,
        //   description: receivedSchool.description,
        //   slogan: receivedSchool.slogan,
        // });
      // }
  
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