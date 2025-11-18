<template>
  <div class="navbar">
    <div class="navbar-content">
      <img src="../components//icons/samis.png" alt="Company Logo" class="logo">
      
      <div class="logo-container">
        <button :style="{ marginLeft: toggleButtonMargin }" class="menu-toggle" @click="toggleSidebar">
          <span class="material-symbols-outlined">menu</span>
        </button>

        <!-- <span class="company-name">{{ schoolName || '' }}</span> -->
      </div>
    </div>
  </div>
</template>

<script>
// import { useAuthStore } from '../Stores/useAuthStore';

export default {
  name: "Navbar",
  props: {
    isSidebarOpen: {
      type: Boolean,
      required: true,
    }
  },
  computed: {
    toggleButtonMargin() {
      return this.isSidebarOpen && !this.isSmallScreen ? `${this.sidebarWidth + 10}px` : '10px'; 
    },
    sidebarWidth() {
      return this.isSidebarOpen ? 150 : 0; // Sidebar width when open and closed
    },
    isSmallScreen() {
      return window.innerWidth <= 768;
    },
    // schoolName() {
    //   return this.authStore.shoolDetails.schoolName;
    // } 
  },

  setup() {
    // const authStore = useAuthStore();

    // return { authStore };
  },

  methods: {
    toggleSidebar() {
      this.$emit('toggleSidebar', !this.isSidebarOpen);
    }
  },
  mounted() {
    window.addEventListener('resize', this.handleResize);
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.handleResize);
  },
  methods: {
    handleResize() {
      this.$forceUpdate();
    },
    toggleSidebar() {
      this.$emit('toggleSidebar', !this.isSidebarOpen);
    }
  }
};
</script>

<style scoped>
.navbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: white;
  padding: 10px;
  position: fixed;
  width: 100%;
  top: 0;
  left: 0;
  z-index: 999;
  box-shadow: 0px 0px 5px #4368b9;
}

.navbar-content {
  display: flex;
  align-items: center;
}

.menu-toggle {
  background: none;
  border: none;
  color: #4368b9;
  cursor: pointer;
  transition: margin-left 0.3s ease; /* Smooth transition */
}

.menu-toggle:hover {
  color: rgba(0, 0, 0, 0.8);
}

.material-symbols-outlined {
  font-size: 2rem;
}

.logo-container {
  display: flex;
  align-items: center;
}

.logo {
  height: 60px;
  width: 60px;

}

.company-name {
  color: #4368b9;
  font-size: 1.5rem;
  font-weight: bold;
}

/* Styles for larger screens */
@media (min-width: 768px) {
  .logo{
    margin-left: 10px;
    margin-right: 10px;
  }
}

/* Styles for smaller screens */
@media (max-width: 767px) {
  .navbar {
    width: 100%;
    padding: 5px;
  }
  .company-name {
    display: none;
  }
  .logo {
    width: 50px;
    height: 50px;
  }
  .menu-toggle {
    margin-left: 10px !important; /* Always near the logo on small screens */
  }
}
</style>