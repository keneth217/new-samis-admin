<template>
    <div class="error-message">{{ message }}</div>
  </template>
  
  <script>
  export default {
    props: ['message']
  };
  </script>
  
  <style scoped>
  .error-message {
    color: red;
    text-align: center;
    margin-top: 20px;
  }
  </style>
  