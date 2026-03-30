<template>
  <div v-if="authStore.isAuthenticated">
  
    <Navbar :isSidebarOpen="isSidebarOpen" @toggleSidebar="toggleSidebar" />
    <div class="sidebar" :class="{ open: isSidebarOpen, collapsed: !isSidebarOpen, 'mobile-bottom': isMobile, 'show-more': showMoreItems && isMobile }">
      <div class="menu-items">
        <!-- Expanded items container (hidden by default, shows above bottom nav when expanded) -->
        <div class="expanded-items" v-if="isMobile">
          <RouterLink
            v-if="canAccess('/Contacts')"
            to="/Contacts"
            :class="[
              'side-btn',
              {
                active:
                  isLinkActive('/Contacts') ||
                  isChildLinkActive(['/Contacts']),
              },
            ]"
            @click="closeExpandedSection"
          >
            <span class="material-symbols-outlined">contacts</span>
            <span class="link-container">CONTACTS</span>
            <span class="tooltip">CONTACTS</span>
          </RouterLink>

          <RouterLink
            v-if="canAccess('/activatedSchools')"
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
            @click="closeExpandedSection"
          >
            <span class="material-symbols-outlined">check_circle</span>
            <span class="link-container">ACTIVE SCHOOLS</span>
            <span class="tooltip">ACTIVE SCHOOLS</span>
          </RouterLink>

          <RouterLink
            v-if="canAccess('/expiredSchools')"
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
            @click="closeExpandedSection"
          >
            <span class="material-symbols-outlined">cancel</span>
            <span class="link-container">EXPIRED SCHOOLS</span>
            <span class="tooltip">EXPIRED SCHOOLS</span>
          </RouterLink>

          <!-- Financial Section -->
          <RouterLink
            v-if="canAccess('/InvoicesSchool')"
            to="/InvoicesSchool"
            :class="[
              'side-btn',
              {
                active:
                  isLinkActive('/InvoicesSchool') ||
                  isChildLinkActive(['/InvoicesSchool']),
              },
            ]"
            @click="closeExpandedSection"
          >
            <span class="material-symbols-outlined">receipt_long</span>
            <span class="link-container">INVOICES & SCHOOL</span>
            <span class="tooltip">INVOICES & SCHOOL</span>
          </RouterLink>

          <RouterLink
            v-if="canAccess('/Receipts')"
            to="/Receipts"
            :class="[
              'side-btn',
              {
                active:
                  isLinkActive('/Receipts') ||
                  isChildLinkActive(['/Receipts']),
              },
            ]"
            @click="closeExpandedSection"
          >
            <span class="material-symbols-outlined">receipt</span>
            <span class="link-container">RECEIPTS</span>
            <span class="tooltip">RECEIPTS</span>
          </RouterLink>

          <!-- Communication Section -->
          <RouterLink
            v-if="canAccess('/MessagesToSchools')"
            to="/MessagesToSchools"
            :class="[
              'side-btn',
              {
                active:
                  isLinkActive('/MessagesToSchools') ||
                  isChildLinkActive(['/MessagesToSchools']),
              },
            ]"
            @click="closeExpandedSection"
          >
            <span class="material-symbols-outlined">mail</span>
            <span class="link-container">MESSAGES</span>
            <span class="tooltip">MESSAGES</span>
          </RouterLink>

          <RouterLink
            v-if="canAccess('/CallLog')"
            to="/CallLog"
            :class="[
              'side-btn',
              {
                active:
                  isLinkActive('/CallLog') ||
                  isChildLinkActive(['/CallLog']),
              },
            ]"
            @click="closeExpandedSection"
          >
            <span class="material-symbols-outlined">call</span>
            <span class="link-container">CALL LOG</span>
            <span class="tooltip">CALL LOG</span>
          </RouterLink>
        </div>

        <!-- Desktop/Tablet view - all items in single column -->
        <template v-if="!isMobile">
          <!-- Overview -->
          <RouterLink
            v-if="canAccess('/')"
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
            v-if="canAccess('/FinanceModule')"
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
            v-if="canAccess('/RegisterUser')"
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
            v-if="canAccess('/allSchools')"
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
            v-if="canAccess('/Contacts')"
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
            v-if="canAccess('/activatedSchools')"
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
            v-if="canAccess('/expiredSchools')"
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

          <!-- Financial Section -->
          <RouterLink
            v-if="canAccess('/InvoicesSchool')"
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
            v-if="canAccess('/Receipts')"
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

          <!-- Communication Section -->
          <RouterLink
            v-if="canAccess('/MessagesToSchools')"
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
            v-if="canAccess('/CallLog')"
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
        </template>
      </div>

        <!-- Bottom row - Always visible default items -->
        <div class="bottom-nav-row" v-if="isMobile">
          <!-- Overview -->
          <RouterLink
            v-if="canAccess('/')"
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
            v-if="canAccess('/FinanceModule')"
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
            v-if="canAccess('/RegisterUser')"
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
            v-if="canAccess('/allSchools')"
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

          <!-- Show More/Less Button for Mobile -->
          <button 
            @click="showMoreItems = !showMoreItems"
            class="side-btn mobile-more-btn"
          >
            <span class="material-symbols-outlined">{{ showMoreItems ? 'expand_less' : 'expand_more' }}</span>
            <span class="link-container">{{ showMoreItems ? 'LESS' : 'MORE' }}</span>
          </button>
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
import { canAccessRoute } from '@/utils/permissions';
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
      showMoreItems: false, // For mobile bottom nav
      isMobile: false, // Track mobile state
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

    // Handle window resize for mobile detection
    this.checkMobile();
    window.addEventListener('resize', this.handleResize);
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.handleResize);
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
    canAccess(path) {
      const roles = this.authStore.roles || [];
      const privs = this.authStore.priviledges || [];
      return canAccessRoute(path, roles, privs);
    },
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
    closeExpandedSection() {
      // Close the expanded section on mobile when an item is clicked
      if (this.isMobile) {
        this.showMoreItems = false;
      }
      // Also close any dropdowns
      this.closeDropdowns();
    },

    isChildLinkActive(paths) {
      return paths.some((path) => this.$route.path.startsWith(path));
    },

    checkMobile() {
      this.isMobile = window.innerWidth <= 767;
    },
    handleResize() {
      this.checkMobile();
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

/* Ensure desktop behavior is maintained */
@media (min-width: 768px) {
  .sidebar.mobile-bottom {
    position: fixed;
    width: 250px;
    height: 100%;
    margin-top: 3.5rem;
    left: 0;
    top: 0;
    bottom: auto;
    right: auto;
    transform: none;
  }
  
  .sidebar.mobile-bottom .menu-items {
    flex-direction: column;
    flex-wrap: nowrap;
  }

  .sidebar.mobile-bottom .menu-items > * {
    flex: none;
    margin-top: 15px;
  }

  .sidebar.mobile-bottom .side-btn {
    flex-direction: row;
    padding: 10px;
    justify-content: flex-start;
    border-top: none;
    border-bottom: none;
    border-left: 4px solid transparent;
    min-height: auto;
  }

  .sidebar.mobile-bottom .side-btn.active {
    border-top: none;
    border-bottom: none;
    border-left: 4px solid gold;
    border-right: 4px solid gold;
  }

  .sidebar.mobile-bottom .side-btn:hover {
    border-left: 4px solid gold;
  }

  .sidebar.mobile-bottom .side-btn .material-symbols-outlined {
    margin-right: 10px;
    margin-bottom: 0;
    font-size: 2rem;
  }

  .sidebar.mobile-bottom .side-btn .link-container {
    display: block;
    font-size: 1rem;
    text-align: left;
  }

  .sidebar.mobile-bottom .mobile-hidden-item {
    display: flex !important;
  }

  .sidebar.mobile-bottom .mobile-more-btn {
    display: none;
  }

  .sidebar.mobile-bottom .logout-link {
    display: block;
    margin-bottom: 80px;
  }
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

/* Styles for smaller screens - Android Bottom Navigation */
@media only screen and (max-width: 767px) {
  .sidebar.mobile-bottom {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    width: 100%;
    height: auto;
    margin-top: 0;
    top: auto;
    transform: none;
    background-color: #4368b9;
    box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.2);
    border-top: 2px solid gold;
    z-index: 1000;
  }

  .sidebar.mobile-bottom .menu-items {
    display: flex;
    flex-direction: column;
    margin-top: 0;
    padding: 0;
    justify-content: flex-end;
    align-items: stretch;
    max-height: none;
    overflow: visible;
  }

  /* Container for default always-visible items */
  .sidebar.mobile-bottom .bottom-nav-row {
    display: flex;
    flex-direction: row;
    width: 100%;
    justify-content: space-around;
    align-items: center;
    padding: 8px 4px;
    background-color: #4368b9;
    border-top: 2px solid gold;
  }

  /* Hidden items container - shows above default items when expanded */
  .sidebar.mobile-bottom .expanded-items {
    display: none;
    flex-direction: column;
    width: 100%;
    background-color: #4368b9;
    max-height: calc(70vh - 70px);
    overflow-y: auto;
    padding-bottom: 8px;
  }

  .sidebar.mobile-bottom.show-more .expanded-items {
    display: flex;
    animation: slideUp 0.3s ease;
  }

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* Default visible items in bottom row - 5 items (4 nav + More button) = 20% each */
  .sidebar.mobile-bottom .bottom-nav-row > * {
    flex: 0 0 20%;
    min-width: 0;
  }

  /* Items in expanded section */
  .sidebar.mobile-bottom .expanded-items .side-btn {
    width: 100%;
    flex-direction: row;
    justify-content: flex-start;
    align-items: center;
    padding: 12px 16px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    border-left: none;
    border-right: none;
    border-bottom: none;
    min-height: 50px;
  }

  .sidebar.mobile-bottom .expanded-items .side-btn .material-symbols-outlined {
    margin-right: 12px;
    margin-bottom: 0;
    font-size: 1.5rem;
    flex-shrink: 0;
  }

  .sidebar.mobile-bottom .expanded-items .side-btn .link-container {
    display: block !important;
    visibility: visible !important;
    opacity: 1 !important;
    font-size: 0.95rem;
    text-align: left;
    color: white;
    font-weight: 500;
    white-space: nowrap;
    overflow: visible;
    text-overflow: unset;
    width: auto;
    flex: 1;
  }

  .sidebar.mobile-bottom .expanded-items .side-btn.active {
    border-left: 4px solid gold;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
  }

  /* Bottom nav row buttons */
  .sidebar.mobile-bottom .bottom-nav-row .side-btn {
    flex-direction: column;
    padding: 8px 4px;
    width: 100%;
    justify-content: center;
    align-items: center;
    border-left: none;
    border-right: none;
    border-top: 2px solid transparent;
    border-bottom: 2px solid transparent;
    min-height: 60px;
  }

  .sidebar.mobile-bottom .bottom-nav-row .side-btn.active {
    border-top: 2px solid gold;
    border-bottom: 2px solid gold;
    border-left: none;
    border-right: none;
    background-color: rgba(255, 255, 255, 0.15);
  }

  .sidebar.mobile-bottom .bottom-nav-row .side-btn:hover {
    background-color: rgba(255, 255, 255, 0.1);
    border-left: none;
  }

  .sidebar.mobile-bottom .bottom-nav-row .side-btn .material-symbols-outlined {
    font-size: 1.5rem;
    margin-right: 0;
    margin-bottom: 4px;
  }

  .sidebar.mobile-bottom .bottom-nav-row .side-btn .link-container {
    display: block;
    font-size: 0.65rem;
    text-align: center;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    width: 100%;
    line-height: 1.2;
  }

  .sidebar.mobile-bottom .side-btn .tooltip {
    display: none;
  }

  /* Adjust sidebar when expanded - grows upward */
  .sidebar.mobile-bottom.show-more {
    border-top-left-radius: 20px;
    border-top-right-radius: 20px;
  }

  .sidebar.mobile-bottom.show-more .menu-items {
    justify-content: flex-start;
  }

  /* Ensure bottom nav row always stays at bottom */
  .sidebar.mobile-bottom .bottom-nav-row {
    order: 999;
    position: relative;
    z-index: 10;
    margin-top: auto; /* Push to bottom */
  }

  /* Logout link positioning for mobile */
  .sidebar.mobile-bottom .logout-link {
    display: none; /* Hide logout from bottom nav, keep it accessible from menu if needed */
  }

  /* Adjust body padding to account for bottom nav */
  body {
    padding-bottom: 60px;
  }
}
</style>
