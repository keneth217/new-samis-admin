<!-- ApplyChangesModal.vue -->
<template>
    <div v-if="show" class="modal-overlay">
      <div class="modal-container">
        <div class="modal-header">
          <h2><i class="icon-question-circle"></i> {{ title }}</h2>
        </div>
        <div class="modal-body">
          <p>{{ message }}</p>
        </div>
        <div class="modal-footer">
          <button @click="applyForThisExam" class="modal-btn cancel">{{ cancelText }}</button>
          <button @click="applyGlobally" class="modal-btn confirm">{{ confirmText }}</button>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    props: {
      show: {
        type: Boolean,
        required: true,
      },
      title: {
        type: String,
        default: 'Apply Changes',
      },
      message: {
        type: String,
        default: 'Do you want to apply these changes globally or just for this exam?',
      },
      confirmText: {
        type: String,
        default: 'Apply Globally',
      },
      cancelText: {
        type: String,
        default: 'Apply for This Exam',
      },
    },
    methods: {
      applyGlobally() {
        // Emit an event for applying changes globally
        this.$emit('apply-globally');
      },
      applyForThisExam() {
        // Emit an event for applying changes only for this exam
        this.$emit('apply-for-this-exam');
      },
    },
  };
  </script>
  
  <style scoped>
  /* Overlay styles to darken the background */
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1002;
  }
  
  /* Modal container styled to look clean and modern */
  .modal-container {
    background-color: #fff;
    border-radius: 8px;
    padding: 30px;
    box-shadow: 0px 4px 12px rgba(0, 0, 0, 0.1);
    width: 90%;
    max-width: 450px;
    text-align: center;
  }
  
  /* Modal header */
  .modal-header h2 {
    color: #2c3e50;
    font-size: 1.5rem;
    margin: 0 0 20px;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 8px;
  }
  
  .modal-header i {
    color: #3498db;
    font-size: 1.5rem;
  }
  
  /* Modal body */
  .modal-body {
    color: #2c3e50;
    margin-bottom: 20px;
  }
  
  .modal-body p {
    font-size: 1.125rem;
  }
  
  /* Modal footer for buttons */
  .modal-footer {
    display: flex;
    justify-content: space-between;
    gap: 1.5rem;
  }
  
  /* Button styles */
  .modal-btn {
    padding: 0.75rem 1.5rem;
    border: none;
    cursor: pointer;
    border-radius: 5px;
    font-size: 1rem;
    transition: background-color 0.3s;
  }
  
  .modal-btn.cancel {
    background-color: #7f8c8d;
    color: white;
  }
  
  .modal-btn.cancel:hover {
    background-color: #95a5a6;
  }
  
  .modal-btn.confirm {
    background-color: #3498db;
    color: white;
  }
  
  .modal-btn.confirm:hover {
    background-color: #2980b9;
  }
  </style>
  