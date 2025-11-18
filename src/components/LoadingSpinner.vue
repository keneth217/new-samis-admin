<!-- LoadingSpinner.vue -->
<template>
  <div v-if="isLoading" class="loading-overlay">
    <div class="spinner"></div>
  </div>
</template>

<script>
export default {
  props: {
    isLoading: {
      type: Boolean,
      default: false
    }
  }
}
</script>

<style scoped>
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background: rgba(0, 0, 0, 0.4);
  z-index: 9999;
}

/* .spinner {
  border: 12px solid rgba(255, 255, 255, 0.3);
  border-top: 12px solid #fff;
  border-radius: 50%;
  width: 80px;
  height: 80px;
  animation: spin 1s linear infinite;
} */

.spinner {
  border: 12px solid transparent;
  border-top: 12px solid #ff8c00;
  border-bottom: 12px solid #ff4500;

  /* border-left: 12px solid gold; */
  /* border-right: 12px solid #4368b9; */

  border-radius: 50%;
  width: 80px;
  height: 80px;
  animation: spin 0.8s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
