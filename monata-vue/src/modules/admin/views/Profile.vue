<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { api } from '../lib/axios';
import { useToast } from 'vue-toastification'
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();
const toast = useToast()

// Interfaces
interface User {
    name: string;
    email: string;
    phone: string;
    createdAt: string;
    updatedAt: string;
}

// User profile state
const user = ref<User>({
    name: '',
    email: '',
    phone: '',
    createdAt: '',
    updatedAt: ''
});
const loading = ref(false);
const error = ref<string | null>(null);

// Profile edit form state
const showEditProfileForm = ref(false);
const editUser = ref<User>({
    name: '',
    email: '',
    phone: '',
    createdAt: '',
    updatedAt: ''
});
const isSubmittingProfile = ref(false);
const profileUpdateError = ref<string | null>(null);
const nameError = ref<string | null>(null);
const emailError = ref<string | null>(null);
const phoneError = ref<string | null>(null);

// Password change form state
const showChangePasswordForm = ref(false);
const currentPassword = ref('');
const newPassword = ref('');
const confirmPassword = ref('');
const isSubmittingPassword = ref(false);
const passwordChangeError = ref<string | null>(null);
const currentPasswordError = ref<string | null>(null);
const newPasswordError = ref<string | null>(null);
const confirmPasswordError = ref<string | null>(null);

// API calls
const fetchUserData = async (): Promise<void> => {
    loading.value = true;
    error.value = null;

    try {
        const response = await api.get('/profile');
        const userData = response.data.data;
        user.value = {
            name: userData.name || '',
            email: userData.email || '',
            phone: userData.phone || '',
            createdAt: userData.created_at || '',
            updatedAt: userData.updated_at || ''
        };
    } catch (err) {
        console.error('Error fetching user data:', err);
        error.value = 'Login to see your profile.';
    } finally {
        loading.value = false;
    }
};

// Profile form handlers
const toggleEditProfileForm = (): void => {
    showEditProfileForm.value = !showEditProfileForm.value;

    if (showEditProfileForm.value) {
        editUser.value = { ...user.value };

        if (showChangePasswordForm.value) {
            showChangePasswordForm.value = false;
            resetPasswordForm();
        }
    } else {
        resetProfileForm();
    }
};

const resetProfileForm = (): void => {
    editUser.value = {
        name: '',
        email: '',
        phone: '',
        createdAt: '',
        updatedAt: ''
    };
    profileUpdateError.value = null;
    nameError.value = null;
    emailError.value = null;
    phoneError.value = null;
};

const resetProfileErrors = (): void => {
    profileUpdateError.value = null;
    nameError.value = null;
    emailError.value = null;
    phoneError.value = null;
};

const handleUpdateProfile = async (): Promise<void> => {
    resetProfileErrors();
    isSubmittingProfile.value = true;

    try {
        const response = await api.put('/profile', {
            name: editUser.value.name,
            email: editUser.value.email,
            phone: editUser.value.phone
        });

        authStore.fetchAdmin();

        toast.success('Profile updated successfully!');

        user.value = {
            ...user.value,
            name: editUser.value.name,
            email: editUser.value.email,
            phone: editUser.value.phone,
            updatedAt: new Date().toISOString()
        };
        toggleEditProfileForm();

    } catch (err: any) {
        console.error('Error updating profile:', err);
        if (err.response) {
            if (err.response.status === 422) {
                profileUpdateError.value = err.response.data.message || 'Please correct the errors below.';
                const errors = err.response.data.errors;
                if (errors) {
                    if (errors.name) nameError.value = errors.name[0];
                    if (errors.email) emailError.value = errors.email[0];
                    if (errors.phone) phoneError.value = errors.phone[0];
                }
            } else {
                profileUpdateError.value = err.response.data || 'Failed to update profile. Please try again.';
            }
        } else {
            profileUpdateError.value = 'A network error occurred. Please try again.';
        }
    } finally {
        isSubmittingProfile.value = false;
    }
};

// Password form handlers
const resetPasswordForm = (): void => {
    currentPassword.value = '';
    newPassword.value = '';
    confirmPassword.value = '';
    passwordChangeError.value = null;
    currentPasswordError.value = null;
    newPasswordError.value = null;
    confirmPasswordError.value = null;
};

const toggleChangePasswordForm = (): void => {
    showChangePasswordForm.value = !showChangePasswordForm.value;

    if (showChangePasswordForm.value) {
        if (showEditProfileForm.value) {
            showEditProfileForm.value = false;
            resetProfileForm();
        }
    } else {
        resetPasswordForm();
    }
};

const resetErrors = (): void => {
    passwordChangeError.value = null;
    currentPasswordError.value = null;
    newPasswordError.value = null;
    confirmPasswordError.value = null;
};

const handleChangePassword = async (): Promise<void> => {
    resetErrors();
    isSubmittingPassword.value = true;

    try {
        await api.post('/change-password', {
            current_password: currentPassword.value,
            new_password: newPassword.value,
            new_password_confirmation: confirmPassword.value
        });

        toast.success("Change password successfully!")
        resetPasswordForm();
        showChangePasswordForm.value = false;
        toggleChangePasswordForm();

    } catch (err: any) {
        console.error('Error changing password:', err);
        if (err.response) {
            if (err.response.status === 422) {
                passwordChangeError.value = err.response.data.message || 'Please correct the errors below.';
                const errors = err.response.data.errors;
                if (errors) {
                    if (errors.current_password) currentPasswordError.value = errors.current_password[0];
                    if (errors.new_password) newPasswordError.value = errors.new_password[0];
                    if (errors.new_password_confirmation) confirmPasswordError.value = errors.new_password_confirmation[0];
                }
            } else if (err.response.status === 400) {
                currentPasswordError.value = 'Current password is incorrect.';
                passwordChangeError.value = err.response.data || 'Current password is incorrect.';
            } else {
                passwordChangeError.value = err.response.data || 'Failed to change password. Please try again.';
            }
        } else {
            passwordChangeError.value = 'A network error occurred. Please try again.';
        }
    } finally {
        isSubmittingPassword.value = false;
    }
};

// Lifecycle hooks
onMounted(() => {
    fetchUserData();
});
</script>

<template>
    <main class="bg-body-tertiary">
        <div class="py-5">
            <div v-if="loading" class="text-center">
                <div class="spinner-border" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
            </div>
            <div v-else-if="error" class="alert alert-danger" role="alert">
                {{ error }}
            </div>
            <div v-else class="row">
                <div class="col-lg-12">
                    <!-- Edit Profile Form -->
                    <div v-if="showEditProfileForm" class="card mb-4 shadow-sm">
                        <div class="card-body">
                            <h5 class="card-title">Edit Profile Information</h5>
                            <hr>
                            <form @submit.prevent="handleUpdateProfile" novalidate>
                                <div class="mb-3">
                                    <label for="name" class="form-label">Full Name</label>
                                    <input type="text" class="form-control" :class="{ 'is-invalid': nameError }"
                                        id="name" v-model="editUser.name" required>
                                    <div v-if="nameError" class="invalid-feedback">
                                        {{ nameError }}
                                    </div>
                                </div>
                                <div class="mb-3">
                                    <label for="email" class="form-label">Email</label>
                                    <input type="email" class="form-control" :class="{ 'is-invalid': emailError }"
                                        id="email" v-model="editUser.email" required>
                                    <div v-if="emailError" class="invalid-feedback">
                                        {{ emailError }}
                                    </div>
                                </div>
                                <div class="mb-3">
                                    <label for="phone" class="form-label">Phone</label>
                                    <input type="tel" class="form-control" :class="{ 'is-invalid': phoneError }"
                                        id="phone" v-model="editUser.phone" required>
                                    <div v-if="phoneError" class="invalid-feedback">
                                        {{ phoneError }}
                                    </div>
                                </div>
                                <div v-if="profileUpdateError && !nameError && !emailError && !phoneError"
                                    class="alert alert-danger mt-3" role="alert">
                                    {{ profileUpdateError }}
                                </div>
                                <div class="mt-3">
                                    <button type="submit" class="btn btn-primary me-2" :disabled="isSubmittingProfile">
                                        <span v-if="isSubmittingProfile" class="spinner-border spinner-border-sm"
                                            role="status" aria-hidden="true"></span>
                                        {{ isSubmittingProfile ? 'Updating...' : 'Update Profile' }}
                                    </button>
                                    <button type="button" @click="toggleEditProfileForm"
                                        class="btn btn-outline-secondary">
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>

                    <!-- Change Password Form -->
                    <div v-else-if="showChangePasswordForm" class="card mb-4 shadow-sm">
                        <div class="card-body">
                            <h5 class="card-title">Change Password</h5>
                            <hr>
                            <form @submit.prevent="handleChangePassword" novalidate>
                                <div class="mb-3">
                                    <label for="currentPassword" class="form-label">Current Password</label>
                                    <input type="password" class="form-control"
                                        :class="{ 'is-invalid': currentPasswordError }" id="currentPassword"
                                        v-model="currentPassword" required>
                                    <div v-if="currentPasswordError" class="invalid-feedback">
                                        {{ currentPasswordError }}
                                    </div>
                                </div>
                                <div class="mb-3">
                                    <label for="newPassword" class="form-label">New Password</label>
                                    <input type="password" class="form-control"
                                        :class="{ 'is-invalid': newPasswordError }" id="newPassword"
                                        v-model="newPassword" required>
                                    <div v-if="newPasswordError" class="invalid-feedback">
                                        {{ newPasswordError }}
                                    </div>
                                </div>
                                <div class="mb-3">
                                    <label for="confirmPassword" class="form-label">Confirm New Password</label>
                                    <input type="password" class="form-control"
                                        :class="{ 'is-invalid': confirmPasswordError }" id="confirmPassword"
                                        v-model="confirmPassword" required>
                                    <div v-if="confirmPasswordError" class="invalid-feedback">
                                        {{ confirmPasswordError }}
                                    </div>
                                </div>
                                <div v-if="passwordChangeError && !currentPasswordError && !newPasswordError && !confirmPasswordError"
                                    class="alert alert-danger mt-3" role="alert">
                                    {{ passwordChangeError }}
                                </div>
                                <div class="mt-3">
                                    <button type="submit" class="btn btn-primary me-2" :disabled="isSubmittingPassword">
                                        <span v-if="isSubmittingPassword" class="spinner-border spinner-border-sm"
                                            role="status" aria-hidden="true"></span>
                                        {{ isSubmittingPassword ? 'Submitting...' : 'Submit Change' }}
                                    </button>
                                    <button type="button" @click="toggleChangePasswordForm"
                                        class="btn btn-outline-secondary">
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>

                    <!-- Profile Details -->
                    <div v-else class="card mb-4 shadow-sm">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-center mb-4">
                                <h5 class="card-title mb-0">Profile Details</h5>
                                <div>
                                    <button type="button" class="btn btn-primary btn-sm me-1"
                                        @click="toggleEditProfileForm">
                                        Edit Profile
                                    </button>
                                    <button type="button" class="btn btn-outline-primary btn-sm"
                                        @click="toggleChangePasswordForm">
                                        Change Password
                                    </button>
                                </div>
                            </div>
                            <div class="row mb-3">
                                <div class="col-sm-3">
                                    <p class="mb-0">Full Name</p>
                                </div>
                                <div class="col-sm-9">
                                    <p class="text-muted mb-0">{{ user.name }}</p>
                                </div>
                            </div>
                            <div class="row mb-3">
                                <div class="col-sm-3">
                                    <p class="mb-0">Email</p>
                                </div>
                                <div class="col-sm-9">
                                    <p class="text-muted mb-0">{{ user.email }}</p>
                                </div>
                            </div>
                            <div class="row mb-3">
                                <div class="col-sm-3">
                                    <p class="mb-0">Phone</p>
                                </div>
                                <div class="col-sm-9">
                                    <p class="text-muted mb-0">{{ user.phone }}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </main>
</template>
