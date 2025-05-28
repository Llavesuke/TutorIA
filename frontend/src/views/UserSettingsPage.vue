<template>
  <div class="settings-page">
    <!-- Background -->
    <MinimalistDashboardBackground />

    <!-- Header based on user role -->
    <ProfessorHeader v-if="userRole === 'admin' || userRole === 'profesor'" />

    <!-- Main content -->
    <main class="settings-main">
      <div class="container">
        <!-- Back button for students -->
        <div v-if="userRole === 'estudiante'" class="back-button">
          <button @click="goBack" class="back-link">
            <div class="back-icon">
              <i class="fas fa-arrow-left"></i>
            </div>
            <span>Back to Home</span>
          </button>
        </div>

        <div class="settings-header">
          <h1 class="page-title">User Settings</h1>
          <button @click="handleLogout" class="logout-btn">
            <i class="fas fa-sign-out-alt"></i> Logout
          </button>
        </div>

        <div class="settings-content">
          <!-- Profile section -->
          <section class="settings-section profile-section">
            <div class="section-header">
              <div class="title-with-icon">
                <h2 class="section-title">Profile Information</h2>
                <div class="section-icon"><i class="fas fa-user-circle"></i></div>
              </div>
            </div>

            <div class="profile-content">
              <!-- Profile picture -->
              <div class="profile-picture-container">
                <div class="profile-picture">
                  <img v-if="userAvatar" :src="userAvatar" :alt="userName" class="avatar-image">
                  <div v-else class="default-avatar">
                    <span>{{ userInitials }}</span>
                  </div>
                </div>
                <div class="profile-picture-actions">
                  <label for="profile-picture-upload" class="upload-btn">
                    <i class="fas fa-camera"></i> Change Picture
                  </label>
                  <input
                    type="file"
                    id="profile-picture-upload"
                    accept="image/*"
                    @change="handleProfilePictureUpload"
                    class="file-input"
                  >
                </div>
              </div>

              <!-- Profile details -->
              <div class="profile-details">
                <div class="profile-field">
                  <label>Username</label>
                  <p>{{ userName }}</p>
                </div>

                <div class="profile-field">
                  <label>Full Name</label>
                  <p>{{ userFullName }}</p>
                </div>

                <div class="profile-field">
                  <label>Role</label>
                  <p>{{ formatRole(userRole) }}</p>
                </div>

                <div class="profile-field" v-if="userRole === 'estudiante'">
                  <label>Grade</label>
                  <p>{{ userGrade || 'Not specified' }}</p>
                </div>

                <div class="profile-field" v-if="userRole === 'estudiante'">
                  <label>Class</label>
                  <p>{{ userClass || 'Not specified' }}</p>
                </div>

                <div class="profile-field">
                  <label>Email</label>
                  <div v-if="userEmail" class="email-field">
                    <!-- Show email with verification status -->
                    <div v-if="isEmailVerified || userRole !== 'estudiante'" class="email-display">
                      <p>{{ userEmail }}</p>
                      <span v-if="!isEmailVerified" class="email-status unverified">Unverified</span>
                      <span v-else class="email-status verified">Verified</span>
                    </div>

                    <!-- Allow email change for unverified student emails -->
                    <div v-else class="email-change-section">
                      <div class="current-email">
                        <p>{{ userEmail }}</p>
                        <span class="email-status unverified">Unverified</span>
                        <button @click="resendVerificationEmail" class="resend-btn" :disabled="isResendingEmail">
                          <i class="fas fa-paper-plane"></i>
                          {{ isResendingEmail ? 'Sending...' : 'Resend' }}
                        </button>
                      </div>

                      <div class="change-email">
                        <input
                          type="email"
                          v-model="newEmail"
                          placeholder="Enter new email address"
                          class="email-input"
                        >
                        <button
                          @click="changeEmail"
                          class="change-email-btn"
                          :disabled="!isValidEmail || isUpdatingEmail"
                        >
                          <i class="fas fa-edit"></i>
                          {{ isUpdatingEmail ? 'Updating...' : 'Change' }}
                        </button>
                      </div>
                    </div>
                  </div>
                  <div v-else-if="userRole === 'estudiante'" class="email-field">
                    <input
                      type="email"
                      v-model="newEmail"
                      placeholder="Add your email address"
                      class="email-input"
                    >
                    <button
                      @click="addEmail"
                      class="add-email-btn"
                      :disabled="!isValidEmail || isUpdatingEmail"
                    >
                      <i class="fas fa-plus"></i> Add
                    </button>
                  </div>
                  <p v-else>No email address</p>
                </div>
              </div>
            </div>
          </section>

          <!-- Password section -->
          <section class="settings-section password-section">
            <div class="section-header">
              <div class="title-with-icon">
                <h2 class="section-title">Change Password</h2>
                <div class="section-icon"><i class="fas fa-key"></i></div>
              </div>
            </div>

            <form @submit.prevent="changePassword" class="password-form">
              <div class="form-group">
                <label for="current-password">Current Password</label>
                <div class="password-input-container">
                  <input
                    :type="showCurrentPassword ? 'text' : 'password'"
                    id="current-password"
                    v-model="currentPassword"
                    required
                  >
                  <button
                    type="button"
                    class="toggle-password-btn"
                    @click="showCurrentPassword = !showCurrentPassword"
                  >
                    <i :class="showCurrentPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
                  </button>
                </div>
              </div>

              <div class="form-group">
                <label for="new-password">New Password</label>
                <div class="password-input-container">
                  <input
                    :type="showNewPassword ? 'text' : 'password'"
                    id="new-password"
                    v-model="newPassword"
                    required
                  >
                  <button
                    type="button"
                    class="toggle-password-btn"
                    @click="showNewPassword = !showNewPassword"
                  >
                    <i :class="showNewPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
                  </button>
                </div>
              </div>

              <div class="form-group">
                <label for="confirm-password">Confirm New Password</label>
                <div class="password-input-container">
                  <input
                    :type="showConfirmPassword ? 'text' : 'password'"
                    id="confirm-password"
                    v-model="confirmPassword"
                    required
                  >
                  <button
                    type="button"
                    class="toggle-password-btn"
                    @click="showConfirmPassword = !showConfirmPassword"
                  >
                    <i :class="showConfirmPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
                  </button>
                </div>
              </div>

              <div v-if="passwordError" class="error-message">
                {{ passwordError }}
              </div>

              <button
                type="submit"
                class="change-password-btn"
                :disabled="isChangingPassword || !isPasswordFormValid"
              >
                <i class="fas fa-key"></i> Change Password
              </button>
            </form>
          </section>
        </div>
      </div>
    </main>

    <!-- Footer -->
    <ProfessorFooter v-if="userRole === 'admin' || userRole === 'profesor'" />

    <!-- Logout Confirmation Modal -->
    <div v-if="showLogoutModal" class="modal-overlay" @click="closeLogoutModal">
      <div class="logout-modal" @click.stop>
        <div class="modal-header">
          <div class="modal-icon">
            <i class="fas fa-sign-out-alt"></i>
          </div>
          <h3>Confirm Logout</h3>
        </div>

        <div class="modal-body">
          <p>Are you sure you want to log out? You will need to sign in again to access your account.</p>
        </div>

        <div class="modal-actions">
          <button @click="closeLogoutModal" class="cancel-btn">
            <i class="fas fa-times"></i>
            Cancel
          </button>
          <button @click="confirmLogout" class="confirm-btn">
            <i class="fas fa-sign-out-alt"></i>
            Logout
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import MinimalistDashboardBackground from '@/components/MinimalistDashboardBackground.vue';
import ProfessorHeader from '@/components/dashboard/ProfessorHeader.vue';
import StudentHeader from '@/components/dashboard/StudentHeader.vue';
import ProfessorFooter from '@/components/dashboard/ProfessorFooter.vue';
import authStore from '@/stores/authStore';
import UserService from '@/services/userService';
import UploadService from '@/services/uploadService';
import gsap from 'gsap';

// Router
const router = useRouter();

// State
const currentPassword = ref('');
const newPassword = ref('');
const confirmPassword = ref('');
const passwordError = ref('');
const isChangingPassword = ref(false);
const showCurrentPassword = ref(false);
const showNewPassword = ref(false);
const showConfirmPassword = ref(false);
const newEmail = ref('');
const isUpdatingEmail = ref(false);
const isResendingEmail = ref(false);
const showLogoutModal = ref(false);

// Computed properties
const userRole = computed(() => {
  return authStore.userRole.value;
});

const userName = computed(() => {
  const user = authStore.user.value;
  return user?.nombre_usuario || '';
});

const userFullName = computed(() => {
  const user = authStore.user.value;
  return user?.nombre_real || '';
});

const userEmail = computed(() => {
  const user = authStore.user.value;
  return user?.email || '';
});

const isEmailVerified = computed(() => {
  const user = authStore.user.value;
  return user?.email_verificado || false;
});

const userAvatar = computed(() => {
  const user = authStore.user.value;
  return user?.foto_perfil || null;
});

const userInitials = computed(() => {
  if (!userFullName.value) return '?';
  return userFullName.value
    .split(' ')
    .map(part => part.charAt(0))
    .join('')
    .toUpperCase()
    .substring(0, 2);
});

const userGrade = computed(() => {
  const user = authStore.user.value;
  return user?.curso || '';
});

const userClass = computed(() => {
  const user = authStore.user.value;
  return user?.clase || '';
});

const isValidEmail = computed(() => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(newEmail.value);
});

const isPasswordFormValid = computed(() => {
  return (
    currentPassword.value.length > 0 &&
    newPassword.value.length >= 6 &&
    newPassword.value === confirmPassword.value
  );
});

// Methods
const formatRole = (role) => {
  if (!role) return 'Unknown';

  switch (role) {
    case 'admin':
      return 'Administrator';
    case 'profesor':
      return 'Professor';
    case 'estudiante':
      return 'Student';
    default:
      return role.charAt(0).toUpperCase() + role.slice(1);
  }
};

const handleProfilePictureUpload = async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  // Validate file type
  if (!file.type.startsWith('image/')) {
    console.error('Please select an image file');
    return;
  }

  try {
    // Upload the profile picture
    const result = await UploadService.uploadProfilePicture(file);

    if (result && result.user) {
      // Update the user in the auth store
      authStore.setUser({
        ...authStore.user.value,
        foto_perfil: result.user.foto_perfil
      });

      console.log('Profile picture updated successfully');
    }
  } catch (error) {
    console.error('Error uploading profile picture:', error);
  }
};

const changePassword = async () => {
  try {
    passwordError.value = '';
    isChangingPassword.value = true;

    // Validate passwords
    if (newPassword.value !== confirmPassword.value) {
      passwordError.value = 'New passwords do not match';
      return;
    }

    if (newPassword.value.length < 6) {
      passwordError.value = 'Password must be at least 6 characters long';
      return;
    }

    // Call API to change password
    await UserService.changePassword(currentPassword.value, newPassword.value);

    // Clear form
    currentPassword.value = '';
    newPassword.value = '';
    confirmPassword.value = '';

    console.log('Password changed successfully');
  } catch (error) {
    console.error('Error changing password:', error);
    passwordError.value = error.message || 'Failed to change password';
  } finally {
    isChangingPassword.value = false;
  }
};

const addEmail = async () => {
  if (!isValidEmail.value) return;

  try {
    isUpdatingEmail.value = true;

    // Call API to add email
    const result = await UserService.updateUserEmail(newEmail.value);

    if (result) {
      // Update the user in the auth store
      await authStore.setUser({
        ...authStore.user.value,
        email: newEmail.value,
        email_verificado: false // New email needs verification
      });

      // Send verification email
      await sendVerificationEmail(newEmail.value);

      newEmail.value = '';
      console.log('Email added successfully. Verification email sent.');
    }
  } catch (error) {
    console.error('Error adding email:', error);
    console.error('Failed to add email');
  } finally {
    isUpdatingEmail.value = false;
  }
};

const changeEmail = async () => {
  if (!isValidEmail.value) return;

  try {
    isUpdatingEmail.value = true;

    // Call API to update email
    const result = await UserService.updateUserEmail(newEmail.value);

    if (result) {
      // Update the user in the auth store
      await authStore.setUser({
        ...authStore.user.value,
        email: newEmail.value,
        email_verificado: false
      });

      // Send verification email
      await sendVerificationEmail(newEmail.value);

      newEmail.value = '';
      console.log('Email updated successfully. Verification email sent.');
    }
  } catch (error) {
    console.error('Error updating email:', error);
    console.error('Failed to update email');
  } finally {
    isUpdatingEmail.value = false;
  }
};

const resendVerificationEmail = async () => {
  if (!userEmail.value) return;

  try {
    isResendingEmail.value = true;
    await sendVerificationEmail(userEmail.value);
    console.log('Verification email sent successfully');
  } catch (error) {
    console.error('Error resending verification email:', error);
    console.error('Failed to send verification email');
  } finally {
    isResendingEmail.value = false;
  }
};

const sendVerificationEmail = async (email) => {
  try {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/auth/send-verification-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authStore.token.value}`
      },
      body: JSON.stringify({ email })
    });

    if (!response.ok) {
      throw new Error('Failed to send verification email');
    }

    return await response.json();
  } catch (error) {
    console.error('Error sending verification email:', error);
    throw error;
  }
};

const goBack = () => {
  router.push('/student/home');
};

const handleLogout = () => {
  showLogoutModal.value = true;

  // Add GSAP animation for modal entrance
  setTimeout(() => {
    gsap.to('.modal-overlay', {
      opacity: 1,
      duration: 0.3,
      ease: 'power2.out'
    });

    gsap.to('.logout-modal', {
      y: 0,
      scale: 1,
      opacity: 1,
      duration: 0.5,
      ease: 'elastic.out(1, 0.6)',
      delay: 0.1
    });

    gsap.to('.modal-icon', {
      scale: 1,
      rotation: 0,
      opacity: 1,
      duration: 0.8,
      ease: 'elastic.out(1, 0.5)',
      delay: 0.3
    });
  }, 10);
};

const closeLogoutModal = () => {
  // Animate modal exit
  gsap.to('.logout-modal', {
    y: -30,
    scale: 0.9,
    opacity: 0,
    duration: 0.3,
    ease: 'power2.in'
  });

  gsap.to('.modal-overlay', {
    opacity: 0,
    duration: 0.2,
    ease: 'power2.in',
    delay: 0.1,
    onComplete: () => {
      showLogoutModal.value = false;
    }
  });
};

const confirmLogout = async () => {
  try {
    // Animate modal exit first
    gsap.to('.logout-modal', {
      y: -30,
      scale: 0.9,
      opacity: 0,
      duration: 0.3,
      ease: 'power2.in'
    });

    gsap.to('.modal-overlay', {
      opacity: 0,
      duration: 0.2,
      ease: 'power2.in',
      delay: 0.1,
      onComplete: async () => {
        showLogoutModal.value = false;

        // Call logout method from authStore
        const result = await authStore.logout();

        if (result.success) {
          showNotification('Logged out successfully', 'success');

          // Redirect to login page
          setTimeout(() => {
            router.push('/login');
          }, 1000);
        } else {
          showNotification('Failed to log out', 'error');
        }
      }
    });
  } catch (error) {
    console.error('Error during logout:', error);
    showNotification('An error occurred during logout', 'error');
  }
};

const showNotification = (message, type = 'info') => {
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.innerHTML = `
    <div class="notification-content">
      <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
      <span>${message}</span>
    </div>
  `;

  // Add to DOM
  document.body.appendChild(notification);

  // Animate in
  gsap.fromTo(notification,
    { y: -50, opacity: 0 },
    { y: 0, opacity: 1, duration: 0.3, ease: 'power2.out' }
  );

  // Remove after delay
  setTimeout(() => {
    gsap.to(notification, {
      y: -50, opacity: 0, duration: 0.3, ease: 'power2.in',
      onComplete: () => {
        document.body.removeChild(notification);
      }
    });
  }, 3000);
};

// Lifecycle hooks
onMounted(() => {
  // Wait for DOM to be ready, then add GSAP animations
  setTimeout(() => {
    // Animate back button
    gsap.to('.back-button', {
      y: 0,
      opacity: 1,
      duration: 0.8,
      ease: 'power2.out'
    });

    // Animate settings header
    gsap.to('.settings-header', {
      y: 0,
      opacity: 1,
      duration: 1,
      ease: 'power2.out',
      delay: 0.2
    });

    // Animate settings sections
    gsap.to('.settings-section', {
      y: 0,
      opacity: 1,
      stagger: 0.3,
      duration: 1.2,
      ease: 'power3.out',
      delay: 0.4
    });

    // Animate profile picture
    gsap.to('.profile-picture', {
      scale: 1,
      rotation: 0,
      opacity: 1,
      duration: 1.5,
      ease: 'elastic.out(1, 0.5)',
      delay: 0.8
    });

    // Animate profile fields
    gsap.to('.profile-field', {
      x: 0,
      opacity: 1,
      stagger: 0.1,
      duration: 0.8,
      ease: 'power2.out',
      delay: 1
    });
  }, 100);
});

// Watch for changes in email verification status
watch(() => authStore.user.value?.email_verificado, (newValue, oldValue) => {
  if (oldValue === false && newValue === true) {
    // Email was just verified
    console.log('Email verified successfully!');
  }
});
</script>

<style lang="scss" scoped>
@import './UserSettingsPage.scss';
</style>
