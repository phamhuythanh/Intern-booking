<template>
  <div class="modal fade" :id="modalId" tabindex="-1" aria-labelledby="roomFormModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-lg">
      <div class="modal-content">
        <form @submit.prevent="submitForm">
          <div class="modal-header bg-primary text-white">
            <h5 class="modal-title" id="roomFormModalLabel">{{ modalTitle }}</h5>
          </div>

          <div class="modal-body modal-body-scrollable">
            <div class="mb-3 row">
              <div class="col-md-6">
                <label for="name" class="form-label">Name:</label>
                <input type="text" class="form-control" id="name" v-model="room.name">
                <div v-if="validationErrors.name" class="invalid-feedback d-block">
                  {{ validationErrors.name[0] }}
                </div>
              </div>
              <div class="col-md-6">
                <label for="room_type" class="form-label">Type:</label>
                <select class="form-select" id="room_type" v-model="room.room_type">
                  <option v-for="type in roomTypes" :key="type.id" :value="type.id">{{ type.name }}
                  </option>
                </select>
                <div v-if="validationErrors.room_type_id" class="invalid-feedback d-block">
                  {{ validationErrors.room_type_id[0] }}
                </div>
              </div>
            </div>

            <div class="mb-3">
              <label for="description" class="form-label">Description:</label>
              <editor api-key="mw4qmrce6512eg9eejrdl3izr2a7k6j1doyvp0f6btppb20q" :init="tinyMceConfig"
                v-model="room.description" />
              <div v-if="validationErrors.description" class="invalid-feedback d-block">
                {{ validationErrors.description[0] }}
              </div>
            </div>

            <div class="mb-3">
              <label for="thumbnail" class="form-label">Thumbnail:</label>
              <input type="file" class="form-control" id="thumbnail" @change="handleThumbnailChange" accept="image/*">
              <div v-if="thumbnailPreview" class="mt-2">
                <img :src="thumbnailPreview" alt="Thumbnail Preview" class="thumbnail-preview-img">
              </div>
              <div v-if="validationErrors.thumbnail" class="invalid-feedback d-block">
                {{ validationErrors.thumbnail[0] }}
              </div>
            </div>

            <div class="mb-3">
              <label for="images" class="form-label">Add Room Images (Select Multiple):</label>
              <input type="file" class="form-control" id="images" @change="addImages" accept="image/*" multiple>
              <div v-if="validationErrors.images" class="invalid-feedback d-block">
                {{ validationErrors.images[0] }}
              </div>
            </div>

            <div v-if="room.images.length > 0" class="mb-3">
              <label class="form-label">Selected Images:</label>
              <div class="d-flex flex-wrap">
                <div v-for="(image, index) in room.images" :key="index" class="position-relative m-2 image-container">
                  <img :src="image.preview" alt="Image Preview" class="img-thumbnail image-display">
                  <button type="button" class="btn-close btn-close-white btn-sm position-absolute top-0 end-0"
                    aria-label="Remove" @click="removeImage(index)"></button>
                </div>
              </div>
            </div>

          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal" @click="resetForm">Close</button>
            <button type="submit" class="btn btn-primary">Save</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Modal } from 'bootstrap'
import { api } from '@/modules/admin/lib/axios'
import { useToast } from 'vue-toastification'
import Editor from '@tinymce/tinymce-vue';

const toast = useToast();

const emit = defineEmits(['room-created', 'room-updated'])

const props = defineProps({
  modalId: {
    type: String,
    required: true
  },
  modalTitle: {
    type: String,
    default: 'New Room'
  },
  initialRoomData: {
    type: Object,
    default: () => ({
      name: '',
      room_type: '',
      description: '',
      thumbnail: null,
      images: []
    })
  },
  roomTypesApiUrl: {
    type: String,
    required: false
  }
})

const room = ref({ ...props.initialRoomData })
const thumbnailPreview = ref(props.initialRoomData.thumbnail)
const roomTypes = ref([])
const loadingRoomTypes = ref(false)
const errorRoomTypes = ref(null)
const validationErrors = ref({})

const tinyMceConfig = {
  height: 300,
  menubar: false,

  plugins: [
    'advlist', 'autolink', 'lists', 'link', 'charmap', 'preview',
    'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
    'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount'
  ],

  toolbar:
    'undo redo | formatselect | ' +
    'bold italic backcolor | alignleft aligncenter ' +
    'alignright alignjustify | bullist numlist outdent indent | ' +
    'removeformat | link code fullscreen help',

  content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }',
};

onMounted(async () => {
  await fetchRoomTypes()
})

const fetchRoomTypes = async () => {
  loadingRoomTypes.value = true
  errorRoomTypes.value = null

  try {
    const response = await api.get('/room-types')
    roomTypes.value = response.data.data
  } catch (error) {
    console.error('Error fetching room types:', error)
    errorRoomTypes.value = 'Can not fetch room types.'
  } finally {
    loadingRoomTypes.value = false
  }
}

const handleThumbnailChange = (event) => {
  const file = event.target.files[0]
  room.value.thumbnail = file
  thumbnailPreview.value = file ? URL.createObjectURL(file) : null
}

const addImages = (event) => {
  const files = event.target.files
  if (files && files.length > 0) {
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      if (file.type.startsWith('image/')) {
        room.value.images.push({
          file: file,
          preview: URL.createObjectURL(file)
        })
      } else {
        console.warn('File is not an image:', file);
        toast.warning(`File "${file.name}" is not an image and was skipped.`);
      }
    }
  }
}

const removeImage = (index) => {
  room.value.images.splice(index, 1)
}

const resetForm = () => {
  room.value = { ...props.initialRoomData }
  thumbnailPreview.value = props.initialRoomData.thumbnail
  validationErrors.value = {}

  const thumbnailInput = document.getElementById('thumbnail');
  if (thumbnailInput) thumbnailInput.value = '';
  const imagesInput = document.getElementById('images');
  if (imagesInput) imagesInput.value = '';
  room.value.images = [];
}

const submitForm = async () => {
  validationErrors.value = {}
  const formData = new FormData()

  formData.append('name', room.value.name)
  formData.append('room_type_id', room.value.room_type)
  formData.append('description', room.value.description)
  formData.append('status', room.value.status)

  if (room.value.thumbnail) {
    formData.append('thumbnail', room.value.thumbnail)
  }

  room.value.images.forEach((imageObj, index) => {
    formData.append(`images[${index}]`, imageObj.file)
  })

  try {

    const response = await api.post('/rooms', formData, {
      headers: {

        'Content-Type': 'multipart/form-data'
      }
    })

    emit('room-created', response.data)
    resetForm()

    const modalElement = document.getElementById(props.modalId)
    const modal = Modal.getInstance(modalElement)

    if (modal) {
      modal.hide()
    }

    toast.success('Room created successfully!')
  } catch (error) {

    if (error.response && error.response.status === 422) {

      validationErrors.value = error.response.data.errors
      toast.error('Validation Error: Please check your input.')
    } else {

      toast.error('Failed to create room!')
      console.error('Error sending data:', error)
    }
  }
}
</script>

<style scoped>
.btn-close {
  background-color: rgba(255, 255, 255, 0.7);
  border-radius: 50%;
  opacity: 0.8;
}

.btn-close:hover {
  opacity: 1;
}

.thumbnail-preview-img {
  max-width: 100px;
  max-height: 100px;
  object-fit: cover;
  border: 1px solid #ddd;
  padding: 2px;
  border-radius: 4px;
}

.image-container {
  width: 100px;
  height: 100px;
  margin: 5px;
  position: relative;
  border: 1px solid #eee;
  border-radius: 4px;
  overflow: hidden;
}

.image-display {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-container .btn-close {
  position: absolute;
  top: 5px;
  right: 5px;
  z-index: 10;
  width: 20px;
  height: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 0.75rem;
}

.tox .tox-tinymce {
  border: 1px solid #ced4da;
  border-radius: 0.25rem;
}

.modal-body-scrollable {
  max-height: calc(100vh - 200px);
  overflow-y: scroll;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.modal-body-scrollable::-webkit-scrollbar {
  display: none;
}
</style>
