<template>
  <div class="dashboard" :class="{ 'sidebar-collapsed': !isSidebarOpen }">
    <Sidebar :initialState="isSidebarOpen" @toggleSidebar="toggleSidebar" />
    <div class="content">
      <RouterView />
    </div>
  </div>
</template>

<script>
import Sidebar from './components/Sidebar.vue'

export default {
  components: { Sidebar },
  data() {
    return {
      isSidebarOpen: localStorage.getItem('sidebarOpen') === 'true' || false,
    };
  },
  methods: {
    toggleSidebar() {
      this.isSidebarOpen = !this.isSidebarOpen;
      localStorage.setItem('sidebarOpen', this.isSidebarOpen);
    }
  }
}
</script>

<style scoped>
*{
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}
.dashboard {
  display: flex;
  height: 100vh;
  /* width: 100vh; */
}

.content {
  background-color: white;
  flex: 1;
  margin-left: 250px; /* Adjusted to account for the sidebar width */
  padding: 20px; 
  /* Optional: adds some padding for better content display */
  transition: margin-left 0.3s ease;
  /* right: 0; */
}

.dashboard.sidebar-collapsed .content {
  margin-left: 80px; /* Adjusted for the collapsed sidebar width */
}

@media (max-width: 768px) {
  .dashboard {
    flex-direction: column;
  }

  .content {
    margin-left: 0; /* Reset margin for smaller screens */
    padding-top: 30px; /* Add top padding to account for the fixed header */
  }

  .dashboard.sidebar-collapsed .content {
    margin-left: 0; /* Reset margin for smaller screens */
  }
}
</style>