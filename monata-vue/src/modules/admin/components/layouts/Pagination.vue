<template>
  <div class="row mt-4 mb-4">
    <div class="col-sm-12 col-md-5 d-flex justify-content-center justify-content-md-start">
      <div class="dataTables_info" role="status" aria-live="polite">
        Showing {{ meta.from }} to {{ meta.to }} of {{ meta.total }} entries
      </div>
    </div>
    <div v-if="totalPages > 1" class="col-sm-12 col-md-7 d-flex justify-content-center justify-content-md-end">
      <div class="dataTables_paginate paging_simple_numbers">
        <ul class="pagination">
          <!-- Previous button -->
          <li class="paginate_button page-item" :class="{ disabled: currentPage <= 1 }">
            <a href="#" class="page-link" @click.prevent="changePage(currentPage - 1)">
              Previous
            </a>
          </li>

          <!-- Page numbers -->
          <template v-for="pageNum in displayedPages" :key="pageNum">
            <li class="paginate_button page-item" :class="{ active: pageNum === currentPage }">
              <a href="#" class="page-link" @click.prevent="changePage(pageNum)">
                {{ pageNum }}
              </a>
            </li>
          </template>

          <!-- Next button -->
          <li class="paginate_button page-item" :class="{ disabled: currentPage >= totalPages }">
            <a href="#" class="page-link" @click.prevent="changePage(currentPage + 1)">
              Next
            </a>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface PaginationMeta {
  from: number;
  to: number;
  total: number;
  per_page: number;
  current_page: number;
  last_page: number;
}

const props = defineProps({
  meta: {
    type: Object as () => PaginationMeta,
    required: true
  },
  currentPage: {
    type: Number,
    required: true
  }
});

const emit = defineEmits(['update:currentPage']);

const totalPages = computed(() => props.meta.last_page);

const displayedPages = computed(() => {
  const pages = [];
  const maxVisiblePages = 5;
  let startPage = Math.max(1, props.currentPage - Math.floor(maxVisiblePages / 2));
  let endPage = Math.min(totalPages.value, startPage + maxVisiblePages - 1);

  // Điều chỉnh startPage nếu endPage đã đạt đến totalPages
  if (endPage === totalPages.value) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  return pages;
});

const changePage = (page: number) => {
  if (page >= 1 && page <= totalPages.value) {
    emit('update:currentPage', page);
  }
};
</script>

<style scoped>
.pagination {
  margin-bottom: 0;
}

.page-link {
  cursor: pointer;
}

.page-item.disabled .page-link {
  cursor: not-allowed;
}

.dataTables_info {
  padding-top: 0.85em;
}
</style>
