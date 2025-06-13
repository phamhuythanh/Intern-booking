<template>
  <div class="d-flex flex-column align-items-center justify-content-center vh-100 bg-light text-dark">
    <h1 class="display-1 text-danger mb-3">403 Access Denied</h1>
    <p class="lead mb-4">You do not have permission to access this page.</p>
    <button @click="goBack" class="btn btn-link">Back to previous</button>
  </div>
</template>

<script>
export default {
  name: 'Errors',
  
  methods: {
    goBack() {
      this.$router.go(-1);
    }
  }
}
</script>
