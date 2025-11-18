import { defineStore } from "pinia";
import { ref } from "vue";
import axios from "axios";



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
        // localStorage.removeItem("phoneNo1");
        localStorage.removeItem("accountNo");
        localStorage.removeItem("username");
        localStorage.removeItem("roles");
        // localStorage.removeItem("schoolID");
        // localStorage.removeItem("isMasterAdmin"); 
        // clearSchoolDetails();

        token.value = "";
        // phoneNo1.value = "";
        accountNo.value = "";
        username.value = "";
        roles.value = [];
        // schoolID.value = "";
        


        setAuthenticated(false);
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
        "/api/auth/signin",
        { phoneNo, password },
        // { headers }
      );
  
      const receivedToken = response.data.token;
      // const receivedUserId = response.data.id;
      // const receivedPhoneNo= response.data.phoneNo;
      const receivedUsername = response.data.username;
      const receivedRoles = response.data.roles;
      const receivedAccountNo = response.data.accountNo;
      
  


      localStorage.setItem('token', token);
      localStorage.setItem('username', username);
      // localStorage.setItem('phoneNo1', phoneNo1);
      localStorage.setItem('accountNo', accountNo);
      localStorage.setItem('roles', JSON.stringify(roles));

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
      // phoneNo1.value = receivedPhoneNo;
      accountNo.value = receivedAccountNo;
      username.value = receivedUsername;
      roles.value = receivedRoles;
      

  
      setAuthenticated(true);
      setSuccessMessage("LOGIN SUCCESS");
      console.log("Login successful, token set:", receivedToken);

      // return isMaster; // Return whether the user is Master Admin
    } catch (error) {
      console.error("Login failed:", error);
      setSuccessMessage("");
    
      // Extract the error message directly from the response data
      const errorMessage = error.response && error.response.data 
        ? (typeof error.response.data === 'object' && error.response.data.message 
            ? error.response.data.message // Use the specific message field if it exists
            : error.response.data) // Fallback to the entire response data
        : "AN ERROR OCCURRED!!";
    
      // Throw the specific error message
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
      const response = await axios.post("/api/auth/signin/bycode", { passcode });

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