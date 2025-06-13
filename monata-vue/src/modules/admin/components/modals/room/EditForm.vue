<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { Modal } from 'bootstrap'
import { api, csrf } from '@/modules/admin/lib/axios'
import { useToast } from 'vue-toastification'
import Editor from '@tinymce/tinymce-vue'

const toast = useToast();
const emit = defineEmits(['room-updated'])

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
      id: null,
      name: '',
      room_type: '',
      description: '',
      status: 1,
      thumbnail: null,
      images: [],
      existing_images: []
    })
  },
  roomTypesApiUrl: {
    type: String,
    required: true
  }
})

const room = ref({
  id: null,
  name: '',
  room_type: '',
  description: '',
  status: 1,
  thumbnail: null,
  images: [],
  existing_images: []
})

const thumbnailPreview = ref(null)
const roomTypes = ref([])
const loadingRoomTypes = ref(false)
const errorRoomTypes = ref(null)
const imagesToRemove = ref([])
const editModalElement = ref(null)
const validationErrors = ref({})

const resetFormContents = (sourceData) => {
  const data = sourceData || props.initialRoomData

  if (thumbnailPreview.value && thumbnailPreview.value.startsWith('blob:')) {
    URL.revokeObjectURL(thumbnailPreview.value)
  }

  room.value.images.forEach(imageObj => {
    if (imageObj.preview && imageObj.preview.startsWith('blob:')) {
      URL.revokeObjectURL(imageObj.preview)
    }
  })

  room.value.id = data.id || null
  room.value.name = data.name || ''

  let newRoomTypeValue = ''
  if (data.room_type !== null && data.room_type !== undefined) {
    if (typeof data.room_type === 'object' && Object.prototype.hasOwnProperty.call(data.room_type, 'id')) {
      newRoomTypeValue = data.room_type.id
    } else {
      newRoomTypeValue = data.room_type
    }
  }

  room.value.room_type = (newRoomTypeValue === null || newRoomTypeValue === undefined) ? '' : newRoomTypeValue
  room.value.description = data.description || ''
  room.value.status = data.status !== undefined ? data.status : 1
  room.value.thumbnail = null
  thumbnailPreview.value = data.thumbnail || null
  room.value.images = []
  room.value.existing_images = data.existing_images ? [...data.existing_images] : []
  imagesToRemove.value = []
  validationErrors.value = {}

  const thumbnailInput = document.getElementById('thumbnail')

  if (thumbnailInput) thumbnailInput.value = ''

  const imagesInput = document.getElementById('images')

  if (imagesInput) imagesInput.value = ''
}

onMounted(async () => {
  await fetchRoomTypes()
  editModalElement.value = document.getElementById(props.modalId)

  if (editModalElement.value) {
    editModalElement.value.addEventListener('hide.bs.modal', () => resetFormContents(props.initialRoomData))
  }

  resetFormContents(props.initialRoomData)
})

onUnmounted(() => {
  if (editModalElement.value) {
    editModalElement.value.removeEventListener('hide.bs.modal', () => resetFormContents(props.initialRoomData))
  }
  if (thumbnailPreview.value && thumbnailPreview.value.startsWith('blob:')) {
    URL.revokeObjectURL(thumbnailPreview.value)
  }

  room.value.images.forEach(imageObj => {
    if (imageObj.preview && imageObj.preview.startsWith('blob:')) {
      URL.revokeObjectURL(imageObj.preview)
    }
  })
})

watch(() => props.initialRoomData, (newData) => {
  if (newData) {
    resetFormContents(newData)
  }
}, { deep: true })

const fetchRoomTypes = async () => {
  loadingRoomTypes.value = true
  errorRoomTypes.value = null

  try {
    const response = await api.get('/room-types')
    roomTypes.value = response.data.data
  } catch (error) {
    console.error('Error loading room types:', error)
    errorRoomTypes.value = 'Cannot load room types.'
  } finally {
    loadingRoomTypes.value = false
  }
}

const handleThumbnailChange = (event) => {
  const file = event.target.files[0]

  if (thumbnailPreview.value && thumbnailPreview.value.startsWith('blob:')) {
    URL.revokeObjectURL(thumbnailPreview.value)
  }
  if (file) {
    room.value.thumbnail = file
    thumbnailPreview.value = URL.createObjectURL(file)
  } else {
    room.value.thumbnail = null
    thumbnailPreview.value = props.initialRoomData.thumbnail || null
  }
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
        console.warn('File is not an image:', file)
      }
    }
  }
}

const removeNewImage = (index) => {
  const imageToRemove = room.value.images[index]

  if (imageToRemove.preview && imageToRemove.preview.startsWith('blob:')) {
    URL.revokeObjectURL(imageToRemove.preview)
  }

  room.value.images.splice(index, 1)
}

const markImageForRemoval = (imageId) => {
  const index = imagesToRemove.value.indexOf(imageId)

  if (index === -1) {
    imagesToRemove.value.push(imageId)
  } else {
    imagesToRemove.value.splice(index, 1)
  }
}

const submitForm = async () => {
  const formData = new FormData()
  formData.append('name', room.value.name)
  formData.append('room_type_id', room.value.room_type)
  formData.append('description', room.value.description)
  formData.append('status', room.value.status)

  if (room.value.thumbnail instanceof File) {
    formData.append('thumbnail', room.value.thumbnail)
  }

  room.value.images.forEach(imageObj => {
    formData.append('images[]', imageObj.file)
  })

  imagesToRemove.value.forEach(imageId => {
    formData.append('images_to_remove[]', imageId)
  })

  try {
    validationErrors.value = {}
    let response;

    response = await api.post(`/rooms/${props.initialRoomData.id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })

    emit('room-updated', response.data)
    const modal = Modal.getInstance(document.getElementById(props.modalId))

    if (modal) {
      modal.hide()
    }

    toast.success('Room updated successfully!')
  } catch (error) {
    if (error.response && error.response.status === 422) {
      validationErrors.value = error.response.data.errors
    }

    console.error('Error sending data:', error)
    toast.error('Fail to update room!')
  }
};
</script>

<template>
  <div class="modal fade" :id="modalId" tabindex="-1" aria-labelledby="roomFormModalLabel" aria-hidden="true"
    data-bs-backdrop="static" data-bs-keyboard="false">
    <div class="modal-dialog modal-lg">
      <div class="modal-content">
        <form @submit.prevent="submitForm">
          <div class="modal-header bg-primary text-white">
            <h5 class="modal-title" id="roomFormModalLabel">{{ modalTitle }}</h5>
          </div>
          <div class="modal-body modal-body-scrollable">
            <div class="mb-3">
              <label for="name" class="form-label">Name:</label>
              <input type="text" class="form-control" id="name" v-model="room.name">
              <div v-if="validationErrors.name" class="text-danger mt-1">{{ validationErrors.name[0] }}</div>
            </div>

            <div class="mb-3 row">
              <div class="col-md-6">
                <label for="edit_room_type" class="form-label">Type:</label>
                <select class="form-select" id="edit_room_type" v-model="room.room_type">
                  <option disabled value="">Please select one</option>
                  <option v-for="type in roomTypes" :key="type.id" :value="type.id">{{ type.name }}
                  </option>
                </select>
                <div v-if="validationErrors.room_type_id" class="text-danger mt-1">{{ validationErrors.room_type_id[0]
                }}</div>
                <div v-if="loadingRoomTypes">Loading room types...</div>
                <div v-if="errorRoomTypes" class="text-danger">{{ errorRoomTypes }}</div>
              </div>
              <div class="col-md-6">
                <label for="edit_status" class="form-label">Status:</label>
                <select class="form-select" id="edit_status" v-model="room.status">
                  <option value="1">Active</option>
                  <option value="2">Inactive</option>
                </select>
                <div v-if="validationErrors.status" class="text-danger mt-1">{{ validationErrors.status[0] }}</div>
              </div>
            </div>

            <div class="mb-3">
              <label for="description" class="form-label">Description:</label>
              <editor api-key="mw4qmrce6512eg9eejrdl3izr2a7k6j1doyvp0f6btppb20q" :init="tinyMceConfig"
                v-model="room.description" />
              <div v-if="validationErrors.description" class="text-danger mt-1">{{ validationErrors.description[0] }}
              </div>
            </div>

            <div class="mb-3">
              <label for="thumbnail" class="form-label">Thumbnail:</label>
              <input type="file" class="form-control" id="thumbnail" @change="handleThumbnailChange" accept="image/*">
              <div v-if="validationErrors.thumbnail" class="text-danger mt-1">{{ validationErrors.thumbnail[0] }}</div>
              <div v-if="thumbnailPreview" class="mt-2">
                <img :src="thumbnailPreview" alt="Thumbnail Preview" class="thumbnail-preview-img">
              </div>
            </div>

            <div v-if="room.existing_images && room.existing_images.length > 0" class="mb-3">
              <label class="form-label">Current Images:</label>
              <div class="d-flex flex-wrap">
                <div v-for="image in room.existing_images.slice(1)" :key="image.id"
                  class="position-relative m-1 p-1 border rounded image-container"
                  :class="{ 'image-to-remove opacity-50 border-danger border-2': imagesToRemove.includes(image.id) }">
                  <img :src="image.image_path" :alt="'Existing Image ' + image.id" class="img-fluid image-display">
                  <button type="button" class="btn btn-sm btn-danger position-absolute top-0 end-0 m-1 action-button"
                    aria-label="Mark for Removal" @click="markImageForRemoval(image.id)">
                    &times;
                  </button>
                  <span v-if="imagesToRemove.includes(image.id)"
                    class="position-absolute bottom-0 start-50 translate-middle-x badge bg-danger to-remove-badge">To
                    Remove</span>
                </div>
              </div>
            </div>

            <div class="mb-3">
              <label for="images" class="form-label">Add More Room Images:</label>
              <input type="file" class="form-control" id="images" @change="addImages" accept="image/*" multiple>
              <div v-if="validationErrors.images" class="text-danger mt-1">{{ validationErrors.images[0] }}</div>
            </div>

            <div v-if="room.images.length > 0" class="mb-3">
              <label class="form-label">New Images to Upload:</label>
              <div class="d-flex flex-wrap">
                <div v-for="(image, index) in room.images" :key="'new_' + index"
                  class="position-relative m-1 p-1 border rounded image-container">
                  <img :src="image.preview" alt="New Image Preview" class="img-fluid image-display">
                  <button type="button" class="btn btn-sm btn-warning position-absolute top-0 end-0 m-1 action-button"
                    aria-label="Remove New Image" @click="removeNewImage(index)">&times;</button>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Close</button>
            <button type="submit" class="btn btn-primary">{{ props.initialRoomData.id ? 'Save Changes' :
              'Create Room' }}</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.thumbnail-preview-img {
  max-width: 100px;
  max-height: 100px;
  object-fit: cover;
}

.image-container {
  width: 100px;
  height: 100px;
}

.image-display {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.action-button {
  line-height: 0.5;
  padding: 0.25rem 0.4rem;
}

.to-remove-badge {
  font-size: 0.6rem;
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
