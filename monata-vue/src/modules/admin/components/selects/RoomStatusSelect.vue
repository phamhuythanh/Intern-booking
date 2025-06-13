<script setup>
  defineProps({
    modelValue: [String, Number]
  });
  defineEmits(['update:modelValue']);
</script>

<template>
  <select class="form-select" :value="modelValue" @change="$emit('update:modelValue', $event.target.value)" placeholder="Select status">
    <option value="">--All status--</option>
    <option value="1">Active</option>
    <option value="2">Booked</option>
    <option value="3">Occupied</option>
    <option value="4">Cleaning</option>
    <option value="5">Inactive</option>
  </select>
</template>
