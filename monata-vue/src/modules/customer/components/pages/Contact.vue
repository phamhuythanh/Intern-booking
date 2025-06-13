<template>
    <header class="hero" :style="{ backgroundImage: `url(${heroImage})` }">
    <div class="hero-content">
      <h3>{{ title }}</h3>
      <p>{{ description }}</p>
    </div>
  </header>
    <section class="contact-section">
        <div class="container">
            <div class="d-none d-sm-block mb-5 pb-4">
                <div id="map" style="height: 480px; position: relative; overflow: hidden;">
                    <iframe v-show="!mapError"
                        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3723.791311446155!2d105.7692875!3d21.0374662!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x313454b7e7c379cd%3A0x6130fa573351b263!2z4bqgIFZp4buHdCBCdWlsZGluZw!5e0!3m2!1svi!2s!4v1716981300000!5m2!1svi!2s"
                        style="width: 100%; height: 100%; border: 0" :allowfullscreen="true" loading="lazy"
                        referrerpolicy="no-referrer-when-downgrade" @error="handleMapError" />
                    <div v-show="mapError" class="gm-err-container"
                        style="height: 100%; width: 100%; position: absolute; top: 0; left: 0; background-color: rgb(229, 227, 223)">
                        <div class="gm-err-content">
                            <div class="gm-err-icon">
                                <img src="https://maps.gstatic.com/mapfiles/api-3/images/icon_error.png"
                                    alt="Error icon" draggable="false" style="user-select: none" />
                            </div>
                            <div class="gm-err-title">Oops! Something went wrong.</div>
                            <div class="gm-err-message">This page didn't load Google Maps correctly. See the JavaScript
                                console for technical details.</div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="row">
                <div class="col-12">
                    <h2 class="contact-title">Get in Touch</h2>
                </div>
                <div class="col-lg-8">
                    <form class="form-contact contact_form" @submit.prevent="submitForm" id="contactForm">
                        <div class="row">
                            <template v-if="!(authStore.type === 'user')">
                                <div class="col-sm-6">
                                    <div class="form-group">
                                        <input v-model="formData.guest_name" class="form-control"
                                            :class="{ 'is-invalid': errors.guest_name }" name="guest_name" type="text"
                                            placeholder="Enter your name">
                                        <div class="invalid-feedback" v-if="errors.guest_name">{{ errors.guest_name }}
                                        </div>
                                    </div>
                                </div>
                                <div class="col-sm-6">
                                    <div class="form-group">
                                        <input v-model="formData.guest_email" class="form-control"
                                            :class="{ 'is-invalid': errors.guest_email }" name="guest_email"
                                            type="email" placeholder="Email">
                                        <div class="invalid-feedback" v-if="errors.guest_email">{{ errors.guest_email }}
                                        </div>
                                    </div>
                                </div>
                            </template>
                            <div class="col-12">
                                <div class="form-group">
                                    <input v-model="formData.title" class="form-control"
                                        :class="{ 'is-invalid': errors.title }" name="title" type="text"
                                        placeholder="Enter title">
                                    <div class="invalid-feedback" v-if="errors.title">{{ errors.title }}</div>
                                </div>
                            </div>
                            <div class="col-12">
                                <div class="form-group">
                                    <textarea v-model="formData.content" class="form-control w-100"
                                        :class="{ 'is-invalid': errors.content }" name="content" cols="30" rows="9"
                                        placeholder="Enter Message"></textarea>
                                    <div class="invalid-feedback" v-if="errors.content">{{ errors.content }}</div>
                                </div>
                            </div>
                        </div>
                        <div class="form-group mt-3">
                            <button type="submit" class="btn btn-outline-primary" :disabled="isSubmitting">
                                {{ isSubmitting ? 'Sending...' : 'Send' }}
                            </button>
                        </div>
                    </form>
                </div>
                <div class="col-lg-3 offset-lg-1">
                    <div class="media contact-info">
                        <span class="contact-info__icon">
                            <HouseIcon />
                        </span>
                        <div class="media-body">
                            <h3>Buttonwood, California.</h3>
                            <p>Rosemead, CA 91770</p>
                        </div>
                    </div>
                    <div class="media contact-info">
                        <span class="contact-info__icon">
                            <PhoneIcon />
                        </span>
                        <div class="media-body">
                            <h3>+1 253 565 2365</h3>
                            <p>Mon to Fri 9am to 6pm</p>
                        </div>
                    </div>
                    <div class="media contact-info">
                        <span class="contact-info__icon">
                            <MailIcon />
                        </span>
                        <div class="media-body">
                            <h3>support@colorlib.com</h3>
                            <p>Send us your query anytime!</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import type { Contact } from "../../../admin/stores/model/Contact.model"
import { HouseIcon, PhoneIcon, MailIcon } from 'lucide-vue-next'
import { csrf, api } from '../../lib/axios'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const mapError = ref(false)

const handleMapError = () => {
    mapError.value = true
}

const sendContact = async (data: Partial<Contact>) => {
    await csrf.get('/sanctum/csrf-cookie')
    const response = await api.post('/contacts/send-contact', data)
    return response.data.data
}

interface ContactForm {
    guest_name?: string
    guest_email?: string
    title: string
    content: string
    user_id?: number
}

interface FormErrors {
    guest_name?: string
    guest_email?: string
    title?: string
    content?: string
}

interface ApiError {
    message: string
    errors?: {
        [key: string]: string[]
    }
}

const formData = reactive<ContactForm>({
    guest_name: '',
    guest_email: '',
    title: '',
    content: ''
})

const errors = reactive<FormErrors>({})
const isSubmitting = ref(false)

const handleApiErrors = (error: any) => {
    // Reset errors
    Object.keys(errors).forEach(key => {
        errors[key as keyof FormErrors] = ''
    })

    if (error.response?.data) {
        const apiError = error.response.data as ApiError

        if (apiError.errors) {
            Object.entries(apiError.errors).forEach(([field, messages]) => {
                const fieldName = field.split('_').map((word, index) => {
                    if (index === 0) return word;
                    return word.charAt(0).toUpperCase() + word.slice(1);
                }).join('');
                
                if (fieldName in errors) {
                    errors[fieldName as keyof FormErrors] = messages[0];
                }
            });
        } else if (apiError.message) {
            errors.title = apiError.message;
        }
    } else {
        errors.title = 'An error occurred while sending the message. Please try again later!';
    }
}

const submitForm = async () => {
    Object.keys(errors).forEach(key => {
        errors[key as keyof FormErrors] = ''
    });

    try {
        isSubmitting.value = true;

        if (!formData.title.trim()) {
            errors.title = 'Title is required';
            return;
        }
        if (!formData.content.trim()) {
            errors.content = 'Content is required';
            return;
        }
        if (authStore.type !== "user") {
            if (!formData.guest_name?.trim()) {
                errors.guest_name = 'Name is required';
                return;
            }
            if (!formData.guest_email?.trim()) {
                errors.guest_email = 'Email is required';
                return;
            }
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(formData.guest_email)) {
                errors.guest_email = 'Please enter a valid email address';
                return;
            }
        }

        const dataToSend: ContactForm = {
            title: formData.title.trim(),
            content: formData.content.trim()
        }

        if (authStore.type === "user") {
            try {
                const response = await api.get('/profile')
                dataToSend.user_id = response.data.data.id
            } catch (error: any) {
                console.error('Failed to fetch user information:', error.response?.data)
                errors.title = 'Unable to retrieve user information';
                return;
            }
        } else {
            dataToSend.guest_name = formData.guest_name?.trim()
            dataToSend.guest_email = formData.guest_email?.trim()
        }

        const response = await sendContact(dataToSend)

        formData.guest_name = ''
        formData.guest_email = ''
        formData.title = ''
        formData.content = ''
        Object.keys(errors).forEach(key => {
            errors[key as keyof FormErrors] = ''
        })

        alert('Message sent successfully!')

    } catch (error: any) {
        console.error('Error detail:', error.response?.data)
        handleApiErrors(error)
    } finally {
        isSubmitting.value = false
    }
}

const props = defineProps({
  bgClass: {
    type: String,
    default: '1'
  },
  title: {
    type: String,
    default: 'Get in Touch'
  },
  description: {
    type: String,
    default: ''
  }
})

const heroImage = new URL('@/modules/customer/assets/img/slide/contact.png', import.meta.url).href
</script>

<style scoped>
.hero {
  background-size: cover;
  background-position: center;
  height: 50vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: white;
  text-align: center;
}

.hero-content {
  z-index: 5;
}

.hero-content h3 {
  font-size: 60px;
  margin-bottom: 15px;
}

@media (max-width: 767px) {
  .hero-content h3 {
    font-size: 40px;
  }
}

@media (min-width: 768px) and (max-width: 991px) {
  .hero-content h3 {
    font-size: 40px;
  }
}

.hero-content p {
  font-size: 1.5rem;
}

/* Các kiểu dáng khác */
.nav-booking {
  cursor: pointer;
}

.is-invalid {
    border-color: #dc3545;
}

.invalid-feedback {
    color: #dc3545;
    font-size: 0.875rem;
    margin-top: 0.25rem;
}

.gm-err-container {
    display: flex;
    align-items: center;
    justify-content: center;
}

.gm-err-content {
    text-align: center;
    padding: 20px;
}

.gm-err-icon {
    margin-bottom: 10px;
}

.gm-err-title {
    font-size: 18px;
    font-weight: bold;
    margin-bottom: 10px;
}

.gm-err-message {
    font-size: 14px;
    color: #666;
}
</style>
