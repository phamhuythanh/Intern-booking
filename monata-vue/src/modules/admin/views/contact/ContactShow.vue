<template>
  <div v-if="isOpen" class="modal-overlay" @click="closeModal">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h5 class="modal-title">Contact Detail</h5>
        <button type="button" class="btn-close" @click="closeModal"></button>
      </div>
      <div class="modal-body">
        <div v-if="contact" class="contact-info">
          <div v-if="contact.user_id" class="row mb-3">
            <div class="col-md-4 fw-bold"> User ID:</div>
            <div class="col-md-8">{{ contact.user_id || 'Khách' }}</div>
          </div>
          <div v-else class="row mb-3">
            <div class="col-md-4 fw-bold">Guest Name:</div>
            <div class="col-md-8 mb-3">{{ contact.guest_name }}</div>
            <div class="col-md-4 fw-bold">Guest Email:</div>
            <div class="col-md-8">{{ contact.guest_email }}</div>
          </div>
          <div class="row mb-3">
            <div class="col-md-4 fw-bold">Status:</div>
            <div class="col-md-8">
              <span
                :class="['status-label badge', contact.status === ContactStatus.Response ? 'btn-success' : 'btn-warning']">
                {{ contact.status === ContactStatus.Response ? 'Response' : 'Unresponse' }}
              </span>
            </div>
          </div>
          <div class="row mb-3">
            <label class="form-label fw-bold">Title:</label>
            <textarea class="form-control" v-model="contact.title" disabled></textarea>
          </div>
          <div class="row mb-3">
            <label class="form-label fw-bold">Content:</label>
            <textarea class="form-control" v-model="contact.content" disabled></textarea>
          </div>
          <div v-if="contact.content_reply" class="row mb-3">
            <label class="form-label fw-bold">Content Reply:</label>
            <textarea class="form-control" v-model="contact.content_reply" disabled></textarea>
          </div>
          <div v-else-if="contact.status === ContactStatus.Unresponse" class="row mb-3">
            <button v-if="!isReplying" class="btn btn-primary btn-sm" @click="startReply">
              Reply
            </button>
            <div v-if="isReplying" class="reply-form">
              <label class="form-label fw-bold">Reply:</label>
              <textarea v-model="replyContent" class="form-control mb-2" :class="{ 'is-invalid': errors.content_reply }"
                placeholder="Enter your reply..."></textarea>
              <div v-if="errors.content_reply" class="invalid-feedback mb-2">
                {{ errors.content_reply[0] }}
              </div>
              <div class="d-flex gap-2">
                <button class="btn btn-success btn-sm" @click="handleReply" :disabled="isSubmitting">
                  {{ isSubmitting ? 'Sending...' : 'Send Reply' }}
                </button>
                <button class="btn btn-secondary btn-sm" @click="cancelReply" :disabled="isSubmitting">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="text-center">
          <p>Không tìm thấy thông tin liên hệ</p>
        </div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" @click="closeModal">Đóng</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits, ref, watch } from 'vue';
import { ContactStatus } from '../../stores/enum/Contact';
import type { Contact } from '../../stores/model/Contact.model';
import { sendMail } from '../../composables/contact/Contact.component';

const props = defineProps<{
  isOpen: boolean;
  contact: Contact | null;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'reply-sent', success: boolean): void;
}>();

const isReplying = ref(false);
const isSubmitting = ref(false);
const replyContent = ref('');
const errors = ref<Record<string, string[]>>({});

const closeModal = () => {
  emit('close');
};

const startReply = () => {
  Object.keys(errors.value).forEach(key => delete errors.value[key]);
  isReplying.value = true;
  replyContent.value = '';
};

const cancelReply = () => {
  Object.keys(errors.value).forEach(key => delete errors.value[key]);
  isReplying.value = false;
  replyContent.value = '';
};

const handleReply = async () => {
  if (!props.contact) return;

  Object.keys(errors.value).forEach(key => delete errors.value[key]);
  isSubmitting.value = true;

  try {
    console.log('Sending reply with data:', {
      content_reply: replyContent.value,
      contactId: props.contact.id
    });

    const response = await sendMail({ content_reply: replyContent.value }, props.contact.id);
    console.log('Reply response:', response);

    if (response) {
      emit('reply-sent', true);
      closeModal();
    }
  } catch (error: any) {
    console.log('Reply error details:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });

    if (error.response?.status === 422) {
      Object.assign(errors.value, error.response.data.errors);
      return;
    }
    console.error('Error sending reply:', error);
    alert('Có lỗi xảy ra khi gửi phản hồi');
  } finally {
    isSubmitting.value = false;
  }
};

watch(() => props.isOpen, (newValue) => {
  if (!newValue) {
    errors.value = {};
    isReplying.value = false;
    replyContent.value = '';
  }
});
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background-color: white;
  border-radius: 8px;
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  padding: 1rem;
  border-bottom: 1px solid #dee2e6;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-body {
  padding: 1rem;
}

.modal-footer {
  padding: 1rem;
  border-top: 1px solid #dee2e6;
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

.btn-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0.5rem;
}

.contact-info {
  padding: 1rem;
}

.reply-form {
  width: 100%;
}

.reply-form textarea {
  resize: vertical;
  min-height: 100px;
}

.status-label {
  padding: 0.5rem 1rem;
  font-weight: 600;
  border-radius: 0.5rem;
}
</style>
