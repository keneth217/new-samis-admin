<template>
        <!-- Footer -->
    <footer class="footer">
      <p>© {{currentYear}} Samis. All Rights Reserved.</p>
    </footer>
</template>

<script>

export default{
    data(){
        return{
          currentYear: new Date().getFullYear(),
            
        }
    }
}

</script>

<style scoped>
*{
    padding: 0;
    margin: 0;
    box-sizing: border-box;
}

.footer {
  margin-top: 2rem;
  text-align: center;
  color: #4368b9;
  font-size: 0.9rem;
  padding-top: 1rem;
  border-top: 1px solid #eaeaea;
}
</style>