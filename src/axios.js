import axios from "axios";
// import { useAuthStore } from "./Stores/useAuthSwtore";
import { useAuthStore } from "./Stores/useAuthStore";

axios.defaults.baseURL = "https://officeapi.samis.co.ke/";
// axios.defaults.baseURL = "https://ww.analyticsapi.samis.co.ke";

axios.interceptors.request.use(
  (config) => {
    const authStore = useAuthStore();
    const token = authStore.token;
   

    if (token) {
      config.headers.Authorization = `Bearer ${token}`; // Fixed template literal
    }

    

    return config;
  },
  (error) => {
    // Handle request errors
    return Promise.reject(error);
  }
);

export default axios;
