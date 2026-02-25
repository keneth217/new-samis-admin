<template>
  <div class="no-access">
    <div class="no-access-card">
      <span class="material-symbols-outlined icon">block</span>
      <h1>Access denied</h1>
      <p>You don't have permission to view this page.</p>
      <router-link to="/" class="btn-home">Go to Dashboard</router-link>
    </div>
  </div>
</template>

<script>
export default {
  name: 'NoAccess',
};
</script>

<style scoped>
.no-access {
  min-height: 60vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}
.no-access-card {
  text-align: center;
  max-width: 400px;
}
.icon {
  font-size: 4rem;
  color: #c62828;
  display: block;
  margin-bottom: 1rem;
}
h1 {
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
  color: #333;
}
p {
  color: #666;
  margin-bottom: 1.5rem;
}
.btn-home {
  display: inline-block;
  padding: 0.6rem 1.2rem;
  background: #1976d2;
  color: #fff;
  text-decoration: none;
  border-radius: 6px;
  font-weight: 500;
}
.btn-home:hover {
  background: #1565c0;
}
</style>
