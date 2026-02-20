<template>
  <div class="scrollable" :style="{ maxHeight: maxHeight }">
    <slot />
  </div>
</template>

<script>
export default {
  name: 'Scrollable',
  props: {
    maxHeight: {
      type: String,
      default: 'calc(100vh - 14rem)',
    },
  },
};
</script>

<style scoped>
.scrollable {
  overflow-y: auto;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  border: 1px solid #ddd;
  border-radius: 4px;
  width: 100%;
}
</style>
