<!-- ConfirmModal.vue -->
<template>
  <div v-if="show" class="modal-overlay">
    <div class="modal-container">
      <!-- Cancel Icon -->
      <div v-if="showApplyOptions" class="cancel2" @click="onCancel">
        <i class="fas fa-times"></i>
      </div>

      <div class="modal-header">
        <!-- Icon Section -->
        <div class="modal-icon">
          <i class="fas fa-question-circle icon-style"></i>
        </div>
        <h2>{{ title }}</h2>
      </div>
      
      <div class="modal-body">
        <p>{{ message }}</p>
      </div>

      <div class="modal-footer">
        <!-- Conditionally Show New Buttons for "Apply Globally" and "Apply for this Exam Only" -->
        <button v-if="showApplyOptions" @click="onApplyGlobally" class="modal-btn cancel">Globally</button>
        <button v-if="showApplyOptions" @click="onApplyExamOnly" class="modal-btn confirm">This Exam</button>

        <!-- Existing Cancel and Confirm Buttons -->
        <button v-if="!showApplyOptions" @click="onCancel" class="modal-btn cancel">Cancel</button>
        <button v-if="!showApplyOptions" @click="onConfirm" class="modal-btn confirm">Confirm</button>
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
      default: 'Confirmation',
    },
    message: {
      type: String,
      default: 'Are you sure you want to proceed?',
    },
    showApplyOptions: {
      type: Boolean,
      default: false,
    },
  },
  methods: {
    onConfirm() {
      this.$emit('confirm');
    },
    onCancel() {
      this.$emit('cancel');
    },
    onApplyGlobally() {
      this.$emit('applyGlobally');
    },
    onApplyExamOnly() {
      this.$emit('applyExamOnly');
    },
  },
};
</script>

<style scoped>
/* Overlay styles to darken the background when the modal is active */
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
  z-index: 10002;
}

/* Modal container styled to match the form */
.modal-container {
  position: relative; /* Added to position the close icon */
  background-color: #4368b9;
  border-radius: 5px;
  padding: 20px;
  box-shadow: 0px 0px 5px gold;
  width: 90%;
  max-width: 400px;
  text-align: center;
}

/* Cancel Icon styling */
.cancel2 {
  position: absolute;
  top: 10px;
  right: 10px;
  cursor: pointer;
  color: gold;
  font-size: 1.3rem;
}

/* Modal icon */
.modal-icon {
  display: flex;
  justify-content: center;
  margin-bottom: 15px;
}

.icon-style {
  font-size: 60px;
  color: gold;
}

/* Modal header consistent with form title */
.modal-header h2 {
  color: gold;
  margin: 0 0 15px 0;
}

/* Modal body */
.modal-body {
  color: white;
  margin-bottom: 20px;
}

.modal-body p {
  font-size: larger;
}

/* Modal footer for action buttons */
.modal-footer {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
}

/* Button styles consistent with form */
.modal-btn {
  padding: 0.3rem 1rem;
  border: none;
  cursor: pointer;
  border-radius: 4px;
  font-size: medium;
}

.modal-btn.cancel {
  background-color: rgba(245, 56, 56, 1);
  border: 1px solid rgba(245, 56, 56, 1);
  color: black;
}

.modal-btn.cancel:hover {
  background-color: #4368b9;
  color: white;
}

.modal-btn.confirm {
  background-color: gold;
  border: 1px solid gold;
  color: black;
}

.modal-btn.confirm:hover {
  background-color: #4368b9;
  color: white;
}

</style>
