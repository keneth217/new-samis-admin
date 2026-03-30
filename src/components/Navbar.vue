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

    <div class="user-identity" v-if="loggedInUsername || loggedInUsertype">
      <span class="identity-name">{{ loggedInUsername || 'Logged user' }}</span>
      <span class="identity-role">{{ loggedInUsertype || 'User' }}</span>
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
    loggedInUsername() {
      return localStorage.getItem('username') || sessionStorage.getItem('username') || '';
    },
    loggedInUsertype() {
      const raw = localStorage.getItem('roles') || sessionStorage.getItem('roles') || '[]';
      let roles = [];
      try {
        roles = JSON.parse(raw);
      } catch {
        roles = [];
      }
      const primary = Array.isArray(roles) && roles.length > 0 ? String(roles[0]) : '';
      const normalized = primary.replace(/^ROLE_/i, '').trim().toLowerCase();
      if (!normalized) return '';
      if (normalized === 'admin') return 'Admin';
      if (normalized === 'mod' || normalized === 'moderator') return 'Mod';
      if (normalized === 'user') return 'User';
      // Fallback: title-case any other role string
      return normalized
        .split(/[_\s-]+/g)
        .filter(Boolean)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
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

.user-identity {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-right: 0.75rem;
}

.identity-name {
  color: #1f3f8e;
  font-weight: 700;
  font-size: 0.9rem;
  max-width: 220px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.identity-role {
  background: #e8eeff;
  color: #2b4fa6;
  border: 1px solid #b8c8f2;
  border-radius: 999px;
  padding: 0.2rem 0.55rem;
  font-size: 0.75rem;
  font-weight: 700;
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
  .identity-name {
    max-width: 120px;
    font-size: 0.78rem;
  }
  .identity-role {
    font-size: 0.68rem;
    padding: 0.18rem 0.45rem;
  }
  .menu-toggle {
    margin-left: 10px !important; /* Always near the logo on small screens */
  }
}
</style>