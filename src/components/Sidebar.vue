<template>
  <div v-if="authStore.isAuthenticated">
  
    <Navbar :isSidebarOpen="isSidebarOpen" @toggleSidebar="toggleSidebar" />
    <div class="sidebar" :class="{ open: isSidebarOpen, collapsed: !isSidebarOpen }">
      <div class="menu-items">
        <!-- Master buttons -->
        <!-- Overview -->
        <RouterLink
          to="/"
          :class="[
            'side-btn',
            {
              active:
                isLinkActive('/') ||
                isChildLinkActive([
                  '/DairyMembers',
                ]),
            },
          ]"
          @click="closeDropdowns"
        >
          <span class="material-symbols-outlined">dashboard</span>
          <span class="link-container">DASHBOARD</span>
          <span class="tooltip">DASHBOARD</span>
        </RouterLink>

        <!-- Configuration Section -->
        <RouterLink
          to="/FinanceModule"
          :class="[
            'side-btn',
            {
              active:
                isLinkActive('/FinanceModule') ||
                isChildLinkActive(['/FinanceModule']),
            },
          ]"
          @click="closeDropdowns"
        >
          <span class="material-symbols-outlined">account_balance</span>
          <span class="link-container">MODULE</span>
          <span class="tooltip">MODULE</span>
        </RouterLink>

        <!-- User Management Section -->
        <RouterLink
          to="/RegisterUser"
          :class="[
            'side-btn',
            {
              active:
                isLinkActive('/RegisterUser') ||
                isChildLinkActive(['/RegisterUser']),
            },
          ]"
          @click="closeDropdowns"
        >
          <span class="material-symbols-outlined">person_add</span>
          <span class="link-container">REGISTER USER</span>
          <span class="tooltip">REGISTER USER</span>
        </RouterLink>

        <!-- Schools Section -->
        <RouterLink
          to="/allSchools"
          :class="[
            'side-btn',
            {
              active:
                isLinkActive('/allSchools') ||
                isChildLinkActive([
                  '/allSchools',
                ]),
            },
          ]"
          @click="closeDropdowns"
        >
          <span class="material-symbols-outlined">groups_3</span>
          <span class="link-container">ALL SCHOOLS</span>
          <span class="tooltip">ALL SCHOOLS</span>
        </RouterLink>




        <RouterLink
          to="/Contacts"
          :class="[
            'side-btn',
            {
              active:
                isLinkActive('/Contacts') ||
                isChildLinkActive(['/Contacts']),
            },
          ]"
          @click="closeDropdowns"
        >
          <span class="material-symbols-outlined">contacts</span>
          <span class="link-container">CONTACTS</span>
          <span class="tooltip">CONTACTS</span>
        </RouterLink>

        <RouterLink
          to="/activatedSchools"
          :class="[
            'side-btn',
            {
              active:
                isLinkActive('/activatedSchools') ||
                isChildLinkActive([
                  '/activatedSchools',
                ]),
            },
          ]"
          @click="closeDropdowns"
        >
          <span class="material-symbols-outlined">check_circle</span>
          <span class="link-container">ACTIVE SCHOOLS</span>
          <span class="tooltip">ACTIVE SCHOOLS</span>
        </RouterLink>

        <RouterLink
          to="/expiredSchools"
          :class="[
            'side-btn',
            {
              active:
                isLinkActive('/expiredSchools') ||
                isChildLinkActive([
                  '/expiredSchools',
                ]),
            },
          ]"
          @click="closeDropdowns"
        >
          <span class="material-symbols-outlined">cancel</span>
          <span class="link-container">EXPIRED SCHOOLS</span>
          <span class="tooltip">EXPIRED SCHOOLS</span>
        </RouterLink>

        <!-- <RouterLink
          to="/Employees"
          :class="[
            'side-btn',
            {
              active:
                isLinkActive('/Employees') ||
                isChildLinkActive(['/Employees']),
            },
          ]"
          @click="closeDropdowns"
        >
          <span class="material-symbols-outlined">groups</span>
          <span class="link-container">EMPLOYEES</span>
          <span class="tooltip">EMPLOYEES</span>
        </RouterLink> -->

        <!-- Financial Section -->
        <RouterLink
          to="/InvoicesSchool"
          :class="[
            'side-btn',
            {
              active:
                isLinkActive('/InvoicesSchool') ||
                isChildLinkActive(['/InvoicesSchool']),
            },
          ]"
          @click="closeDropdowns"
        >
          <span class="material-symbols-outlined">receipt_long</span>
          <span class="link-container">INVOICES & SCHOOL</span>
          <span class="tooltip">INVOICES & SCHOOL</span>
        </RouterLink>

        <RouterLink
          to="/Receipts"
          :class="[
            'side-btn',
            {
              active:
                isLinkActive('/Receipts') ||
                isChildLinkActive(['/Receipts']),
            },
          ]"
          @click="closeDropdowns"
        >
          <span class="material-symbols-outlined">receipt</span>
          <span class="link-container">RECEIPTS</span>
          <span class="tooltip">RECEIPTS</span>
        </RouterLink>

        <!-- <RouterLink
          to="/ExpensesTracking"
          :class="[
            'side-btn',
            {
              active:
                isLinkActive('/ExpensesTracking') ||
                isChildLinkActive(['/ExpensesTracking']),
            },
          ]"
          @click="closeDropdowns"
        >
          <span class="material-symbols-outlined">payments</span>
          <span class="link-container">EXPENSES</span>
          <span class="tooltip">EXPENSES</span>
        </RouterLink> -->

        <!-- Communication Section -->
        <RouterLink
          to="/MessagesToSchools"
          :class="[
            'side-btn',
            {
              active:
                isLinkActive('/MessagesToSchools') ||
                isChildLinkActive(['/MessagesToSchools']),
            },
          ]"
          @click="closeDropdowns"
        >
          <span class="material-symbols-outlined">mail</span>
          <span class="link-container">MESSAGES</span>
          <span class="tooltip">MESSAGES</span>
        </RouterLink>

        <RouterLink
          to="/CallLog"
          :class="[
            'side-btn',
            {
              active:
                isLinkActive('/CallLog') ||
                isChildLinkActive(['/CallLog']),
            },
          ]"
          @click="closeDropdowns"
        >
          <span class="material-symbols-outlined">call</span>
          <span class="link-container">CALL LOG</span>
          <span class="tooltip">CALL LOG</span>
        </RouterLink>

       

        <!-- Configuration Section -->
        <!-- <RouterLink
          to="/FinanceModule"
          :class="[
            'side-btn',
            {
              active:
                isLinkActive('/FinanceModule') ||
                isChildLinkActive(['/FinanceModule']),
            },
          ]"
          @click="closeDropdowns"
        >
          <span class="material-symbols-outlined">account_balance</span>
          <span class="link-container">MODULE</span>
          <span class="tooltip">MODULE</span>
        </RouterLink> -->


      </div>
      <div class="logout-link">
        <!-- <RouterLink to="#" :class="['side-btn', { active: isLinkActive('#') }]" @click="closeDropdowns">
          <span class="material-symbols-outlined">door_open</span>
          <span class="link-container">LOGOUT</span>
          <span class="tooltip">LOGOUT</span>
        </RouterLink> -->

        <a href="#" @click="logout" :class="['side-btn', { active: isLinkActive('#') }]">
          <span class="material-symbols-outlined">door_open</span>
          <span class="link-container">LOGOUT</span>
          <span class="tooltip">LOGOUT</span>
		    </a>
      </div>
      
    </div>
    <LoadingSpinner :isLoading="Loading" />
  </div>
</template>

<script>
 import { ref, watch, toRefs } from 'vue';
import { RouterLink } from 'vue-router';
import Navbar from './Navbar.vue';
import { useAuthStore } from '../Stores/useAuthStore';
import LoadingSpinner from './LoadingSpinner.vue';

export default {
  props: {
    initialState: {
      type: Boolean,
      required: true,
    },
  },
  components: { RouterLink, Navbar, LoadingSpinner },
  data() {
    return {
      isSidebarOpen: this.initialState,
      isClassesDropdownOpen: false,
      isExamsDropdownOpen: false,
      Loading: false,
    };
  }, 

  mounted() {
    const sidebarState = localStorage.getItem('sidebarOpen');
    this.isSidebarOpen = sidebarState !== null ? JSON.parse(sidebarState) : this.initialState;

    // Restore dropdown states
    const classesDropdownState = localStorage.getItem('classesDropdownOpen');
    if (classesDropdownState !== null) {
      this.isClassesDropdownOpen = JSON.parse(classesDropdownState);
    }
    const examsDropdownState = localStorage.getItem('examsDropdownOpen');
    if (examsDropdownState !== null) {
      this.isExamsDropdownOpen = JSON.parse(examsDropdownState);
    }
  },
  computed: {
    isClassesSectionActive() {
      return (
        this.isClassesDropdownOpen ||
        this.isLinkActive('/classes') ||
        this.isChildLinkActive([
          '/manageClasses',
          '/myClasses',
          
        ])
      );
    },

    isExamsSectionActive() {
      return (
        this.isExamsDropdownOpen ||
        this.isLinkActive('/exams') ||
        this.isChildLinkActive(['/upcomingExams', '/examResults'])
      );
    },
  },

  setup(){
    const authStore = useAuthStore();

    return { authStore };
  },

  methods: {
    async logout() {
      this.Loading = true; // Show the spinner     
      try {
        await this.authStore.logout();
        this.refreshPage();
      } catch (error) {
        console.error("Logout failed", error);
      } finally {
        this.Loading = false; // Hide the spinner
      }
    },

    refreshPage() {
      window.location.reload();
    },

    toggleSidebar() {
      this.isSidebarOpen = !this.isSidebarOpen;
      this.$emit('toggleSidebar', this.isSidebarOpen);
      localStorage.setItem('sidebarOpen', this.isSidebarOpen);
    },
    isLinkActive(path) {
      return this.$route.path === path;
    },
    toggleClassesDropdown() {
        // Close the Exams dropdown if it's open
        if (this.isExamsDropdownOpen) {
            this.closeExamsDropdown();
        }
        this.isClassesDropdownOpen = !this.isClassesDropdownOpen;
        localStorage.setItem('classesDropdownOpen', this.isClassesDropdownOpen);
    },

    toggleExamsDropdown() {
        // Close the Classes dropdown if it's open
        if (this.isClassesDropdownOpen) {
            this.closeClassesDropdown();
        }
        this.isExamsDropdownOpen = !this.isExamsDropdownOpen;
        localStorage.setItem('examsDropdownOpen', this.isExamsDropdownOpen);
    },

    closeClassesDropdown() {
        this.isClassesDropdownOpen = false;
        localStorage.setItem('classesDropdownOpen', false);
    },
    closeExamsDropdown() {
        this.isExamsDropdownOpen = false;
        localStorage.setItem('examsDropdownOpen', false);
    },

    closeDropdowns(){
      this.closeClassesDropdown();
      this.closeExamsDropdown();
    },

    isChildLinkActive(paths) {
      return paths.some((path) => this.$route.path.startsWith(path));
    },
  },
};
</script>

<style scoped>
* {
  padding: 0;
  margin: 0;
  box-sizing: border-box;
}



.dropdown-icon {
  margin-left: auto;
  margin-right: 10px; /* Adjust right margin for spacing */
  font-size: 1.5rem;
  color: gold;
}

/* Hide the dropdown icon when the sidebar is collapsed */
.sidebar.collapsed .dropdown-icon {
  display: none; /* Hide the icon */
}

/* Ensure the dropdown icon is displayed when the sidebar is open */
.sidebar.open .dropdown-icon {
  display: inline-block;
}






.dropdown-menu {
  display: flex;
  flex-direction: column;
  /* margin-left: 50px; */
  transition: all 0.3s ease;
  background-color:  #4368b9;
  border-left: 4px solid gold;
  border-right: 4px solid gold;
}

.dropdown-btn {
  padding-left: 30px;

}
.link-container p{
  margin-left: 3.5rem;
}







.sidebar {
  position: fixed;
  width: 250px;
  height: 100%;
  background-color: #4368b9;
  text-align: center;
  margin-top: 3.5rem;
  transition: transform 0.3s ease, width 0.3s ease;
  left: 0;
  top: 0;
  overflow: visible; /* Allow tooltips to overflow */
  z-index: 500;
  display: flex;
  flex-direction: column;
}

.sidebar.collapsed {
  width: 80px;
}

.sidebar.open {
  transform: translateX(0);
}

.menu-items {
  display: flex;
  flex-direction: column;
  margin-top: 15px;
  flex-grow: 1;
}

.menu-items > * {
  margin-top: 15px;
}

.logout-link {
  margin-bottom: 80px;
}

.side-btn, .side-btn1 {
  display: flex;
  align-items: center;
  padding: 10px;
  color: white;
  text-decoration: none;
  transition: background-color 0.3s ease;
  position: relative;
}

.side-btn:hover {
  background-color: rgba(255, 255, 255, 0.2);
  color: gold;
  border-left: 4px solid gold;
}

.side-btn1{
  background-color: #4368b9;
  color: white;
}

.side-btn1:hover{
  background-color: rgba(255, 255, 255, 0.2);
  color: gold;
}

.tooltip {
  font-size: medium;
  text-align: left;
  position: absolute;
  left: 100%; /* Ensure tooltip is fully visible */
  top: 50%;
  transform: translateY(-50%);
  background-color: #786dc8;
  color: white;
  padding: 13.2px;
  width: 170px;
  opacity: 0;
  white-space: nowrap;
  pointer-events: none;
  transition: opacity 0.3s ease;
  z-index: 5000; /* Ensure tooltip is on top */
  border-right: 4px solid gold;
}
.tooltip:hover{
  color: red;
}
.sidebar.collapsed .side-btn:hover .tooltip {
  opacity: 1;
  z-index: 5000;
}

.sidebar:not(.collapsed) .tooltip {
  display: none;
}

.sidebar:not(.collapsed) .dropdown-icon{
  display: none;
}

.side-btn.active {
  background-color: rgba(255, 255, 255, 0.2);
  color: gold;
  font-weight: 500;
  border-left: 4px solid gold;
  border-right: 4px solid gold;
}

.side-btn1.active{
  background-color: rgba(255, 255, 255, 0.2);
  color: gold;
  font-weight: 500;
}

.side-btn .material-symbols-outlined {
  font-size: 2rem;
  margin-right: 10px;
  z-index: 990;
}

.sidebar.collapsed .side-btn .link-container {
  display: none;
}

.sidebar.collapsed .side-btn:hover .tooltip {
  opacity: 1;
  z-index: 5000;
  left: 100%; /* Adjusted for tooltip visibility */
}

@media (min-width: 768px) {
  .material-symbols-outlined {
    margin-left: 10px;
  }
}

@media (max-width: 768px) {
  .sidebar.collapsed {
    width: 48px;
  }
}

/* Styles for smaller screens */
@media only screen and (max-width: 767px) {
  .sidebar {
    width: 60px; /* Collapse sidebar further on small screens */
    z-index: 1000; /* Ensure sidebar is above other content */
  }

  .sidebar.open {
    width: 230px; /* Expand sidebar to full width when open */
  }

  /* .sidebar.collapsed .side-btn .material-symbols-outlined {
    margin-left: 0; 
  } */

  .sidebar.collapsed .side-btn:hover .tooltip {
    left: 44px; /* Adjust tooltip position for collapsed sidebar */
  }

  .menu-items {
    margin-top: 10px; /* Reduce margin for better spacing */
  }

  .side-btn, .side-btn1 {
    padding: 8px; /* Reduce padding for smaller screens */
  }

  .side-btn .material-symbols-outlined {
    font-size: 1.5rem; /* Reduce icon size for smaller screens */
    margin-right: 5px; /* Adjust spacing */
  }

  .dropdown-menu {
    margin-left: 0; /* Align dropdown menu with sidebar */
  }

  .dropdown-btn {
    padding-left: 20px; /* Adjust padding for dropdown items */
  }

  .link-container p {
    margin-left: 2rem; /* Adjust text alignment in dropdown */
  }

  .logout-link .side-btn {
    width: 100%; /* Ensure the logout button takes full width */
    
  }

  .tooltip {
    font-size: small; /* Reduce tooltip font size */
    padding: 8px; /* Adjust tooltip padding */
    width: 140px; /* Reduce tooltip width */
  }

  /* Hide dropdown icons when sidebar is collapsed */
  .sidebar.collapsed .dropdown-icon {
    display: none;
  }

  /* Ensure dropdown icons are visible when sidebar is open */
  .sidebar.open .dropdown-icon {
    display: inline-block;
  }
}
</style>
