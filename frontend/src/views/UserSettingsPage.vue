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
.settings-page {
  min-height: 100vh;
  position: relative;
  display: flex;
  flex-direction: column;
}

.settings-main {
  flex: 1;
  padding: 2rem 0;
  z-index: 1;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1.5rem;
}

.back-button {
  margin-bottom: 3rem;
  opacity: 0;
  transform: translateY(-30px);

  .back-link {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    background-color: #34307b;
    color: #FEF0D1;
    border: none;
    padding: 1rem 1.75rem;
    border-radius: 50px;
    font-family: 'Poppins', sans-serif;
    font-weight: 600;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1);
    position: relative;
    overflow: hidden;
    box-shadow: 0 8px 25px rgba(52, 48, 123, 0.3);

    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background-color: #e6531d;
      transition: left 0.4s cubic-bezier(0.23, 1, 0.32, 1);
      z-index: 0;
    }

    &:hover {
      transform: translateY(-3px) scale(1.02);
      box-shadow: 0 12px 35px rgba(52, 48, 123, 0.4);

      &::before {
        left: 0;
      }

      .back-icon {
        transform: translateX(-3px) rotate(-5deg);
      }
    }

    .back-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      background: rgba(254, 240, 209, 0.2);
      border-radius: 50%;
      transition: all 0.3s ease;
      position: relative;
      z-index: 1;

      i {
        font-size: 1.1rem;
      }
    }

    span {
      position: relative;
      z-index: 1;
      letter-spacing: 0.5px;
    }
  }
}

.settings-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #34307b;
  opacity: 0;
  transform: translateY(-20px);
}

.page-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: #FEF0D1;
  margin: 0;
}

.logout-btn {
  background-color: #e6531d;
  color: #FEF0D1;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
  box-shadow: 0 4px 8px rgba(230, 83, 29, 0.3);

  &:hover {
    background-color: darken(#e6531d, 10%);
    transform: translateY(-2px);
    box-shadow: 0 6px 12px rgba(230, 83, 29, 0.4);
  }

  &:active {
    transform: translateY(0);
    box-shadow: 0 2px 4px rgba(230, 83, 29, 0.3);
  }

  i {
    font-size: 1.1rem;
  }
}

.settings-content {
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;

  @media (min-width: 992px) {
    grid-template-columns: 1fr 1fr;
  }
}

.settings-section {
  background-color: rgba(23, 23, 23, 0.95);
  border-radius: 16px;
  padding: 2.5rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  border: 1px solid rgba(254, 240, 209, 0.08);
  position: relative;
  transition: all 0.3s ease;
  opacity: 0;
  transform: translateY(50px);

  &:hover:not([style*="opacity: 0"]) {
    transform: translateY(-2px);
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.2);
  }

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 3px;
    background-color: #e6531d;
    border-radius: 16px 16px 0 0;
  }

  &.password-section::before {
    background-color: #007142;
  }
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.title-with-icon {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.section-title {
  font-family: 'Poppins', sans-serif;
  font-size: 1.6rem;
  font-weight: 700;
  color: #FEF0D1;
  margin: 0;
  letter-spacing: -0.02em;
}

.section-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(230, 83, 29, 0.1);
  color: #e6531d;
  font-size: 1.1rem;
  transition: all 0.3s ease;

  .password-section & {
    background-color: rgba(0, 113, 66, 0.1);
    color: #007142;
  }
}

.profile-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;

  @media (min-width: 768px) {
    flex-direction: row;
  }
}

.profile-picture-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  text-align: center;
}

.profile-picture {
  width: 150px;
  height: 150px;
  border-radius: 50%;
  overflow: hidden;
  border: 4px solid #e6531d;
  box-shadow: 0 0 20px rgba(230, 83, 29, 0.4);
  position: relative;
  transition: all 0.3s ease;
  opacity: 0;
  transform: scale(0) rotate(180deg);

  &:hover:not([style*="opacity: 0"]) {
    transform: scale(1.05);
    box-shadow: 0 0 25px rgba(230, 83, 29, 0.6);
  }

  .avatar-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: all 0.3s ease;

    &:hover {
      filter: brightness(1.1);
    }
  }

  .default-avatar {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #34307b;
    color: #FEF0D1;
    font-size: 3rem;
    font-weight: 700;
  }
}

.profile-picture-actions {
  margin-top: 1rem;
  width: 100%;
  display: flex;
  justify-content: center;

  .upload-btn {
    background-color: #007142;
    color: #FEF0D1;
    padding: 0.75rem 1.25rem;
    border-radius: 8px;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    transition: all 0.3s ease;
    font-weight: 600;
    box-shadow: 0 4px 8px rgba(0, 113, 66, 0.3);
    text-align: center;
    min-width: 160px;

    &:hover {
      background-color: darken(#007142, 5%);
      transform: translateY(-2px);
      box-shadow: 0 6px 12px rgba(0, 113, 66, 0.4);
    }

    &:active {
      transform: translateY(0);
      box-shadow: 0 2px 4px rgba(0, 113, 66, 0.3);
    }

    i {
      font-size: 1.1rem;
    }
  }

  .file-input {
    display: none;
  }
}

.profile-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.profile-field {
  margin-bottom: 1.25rem;
  position: relative;
  padding-left: 1rem;
  opacity: 0;
  transform: translateX(-30px);

  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 3px;
    background-color: #34307b;
    border-radius: 3px;
  }

  &:nth-child(2n)::before {
    background-color: #e6531d;
  }

  &:nth-child(3n)::before {
    background-color: #007142;
  }

  label {
    display: block;
    font-size: 0.9rem;
    color: #e6531d;
    margin-bottom: 0.25rem;
    font-weight: 600;
    letter-spacing: 0.5px;
  }

  p {
    font-size: 1.1rem;
    color: #FEF0D1;
    margin: 0;
    padding: 0.5rem 0;
    border-bottom: 1px dashed rgba(254, 240, 209, 0.2);
  }

  .email-field {
    display: flex;
    flex-direction: column;
    gap: 1rem;

    .email-display {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.5rem;

      p {
        margin-right: 0.5rem;
        border-bottom: none;
      }
    }

    .email-change-section {
      display: flex;
      flex-direction: column;
      gap: 1rem;

      .current-email {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 0.5rem;
        padding: 1rem;
        background-color: rgba(52, 48, 123, 0.1);
        border-radius: 8px;
        border: 1px solid rgba(52, 48, 123, 0.3);

        p {
          margin-right: 0.5rem;
          border-bottom: none;
        }

        .resend-btn {
          background-color: #007142;
          color: #FEF0D1;
          border: none;
          padding: 0.4rem 0.8rem;
          border-radius: 6px;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 0.3rem;

          &:hover:not(:disabled) {
            background-color: darken(#007142, 10%);
            transform: translateY(-1px);
          }

          &:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }
        }
      }

      .change-email {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 0.5rem;

        .email-input {
          flex: 1;
          min-width: 200px;
          padding: 0.75rem;
          border: 2px solid rgba(52, 48, 123, 0.3);
          border-radius: 8px;
          background-color: rgba(23, 23, 23, 0.8);
          color: #FEF0D1;
          font-size: 1rem;

          &:focus {
            outline: none;
            border-color: #34307b;
          }

          &::placeholder {
            color: rgba(254, 240, 209, 0.6);
          }
        }

        .change-email-btn {
          background-color: #e6531d;
          color: #FEF0D1;
          border: none;
          padding: 0.75rem 1rem;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 0.5rem;

          &:hover:not(:disabled) {
            background-color: darken(#e6531d, 10%);
            transform: translateY(-1px);
          }

          &:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }
        }
      }
    }

    .email-status {
      font-size: 0.8rem;
      padding: 0.3rem 0.6rem;
      border-radius: 20px;
      font-weight: 600;
      display: inline-block;
      margin-top: 0.25rem;

      &.verified {
        background-color: rgba(0, 113, 66, 0.3);
        color: #00ff9d;
        border: 1px solid rgba(0, 255, 157, 0.3);
      }

      &.unverified {
        background-color: rgba(230, 83, 29, 0.3);
        color: #ffaa8d;
        border: 1px solid rgba(255, 170, 141, 0.3);
      }
    }

    .email-input {
      flex: 1;
      background-color: rgba(23, 23, 23, 0.7);
      border: 2px solid rgba(52, 48, 123, 0.5);
      color: #FEF0D1;
      padding: 0.75rem 1rem;
      border-radius: 8px;
      font-size: 1rem;
      transition: all 0.3s ease;

      &:focus {
        outline: none;
        border-color: #e6531d;
        box-shadow: 0 0 0 3px rgba(230, 83, 29, 0.2);
      }

      &::placeholder {
        color: rgba(254, 240, 209, 0.5);
      }
    }

    .add-email-btn {
      background-color: #34307b;
      color: #FEF0D1;
      border: none;
      padding: 0.75rem 1.25rem;
      border-radius: 8px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      font-weight: 600;
      transition: all 0.3s ease;
      box-shadow: 0 4px 8px rgba(52, 48, 123, 0.3);

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      &:not(:disabled):hover {
        background-color: darken(#34307b, 5%);
        transform: translateY(-2px);
        box-shadow: 0 6px 12px rgba(52, 48, 123, 0.4);
      }

      &:not(:disabled):active {
        transform: translateY(0);
        box-shadow: 0 2px 4px rgba(52, 48, 123, 0.3);
      }

      i {
        font-size: 1rem;
      }
    }
  }
}

.password-form {
  display: flex;
  flex-direction: column;
  gap: 1.75rem;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    left: -20px;
    top: 0;
    bottom: 0;
    width: 4px;
    background: linear-gradient(to bottom, #e6531d, #007142, #34307b);
    border-radius: 4px;
    opacity: 0.7;
  }
}

.form-group {
  position: relative;

  label {
    display: block;
    font-size: 0.9rem;
    color: #e6531d;
    margin-bottom: 0.5rem;
    font-weight: 600;
    letter-spacing: 0.5px;
  }

  .password-input-container {
    position: relative;

    input {
      width: 100%;
      background-color: rgba(23, 23, 23, 0.7);
      border: 2px solid rgba(0, 113, 66, 0.5);
      color: #FEF0D1;
      padding: 0.85rem 1rem;
      border-radius: 8px;
      font-size: 1rem;
      transition: all 0.3s ease;

      &:focus {
        outline: none;
        border-color: #007142;
        box-shadow: 0 0 0 3px rgba(0, 113, 66, 0.2);
      }

      &::placeholder {
        color: rgba(254, 240, 209, 0.5);
      }
    }

    .toggle-password-btn {
      position: absolute;
      right: 12px;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      color: #FEF0D1;
      cursor: pointer;
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      transition: all 0.2s ease;

      &:hover {
        color: #e6531d;
        background-color: rgba(230, 83, 29, 0.1);
      }

      i {
        font-size: 1.1rem;
      }
    }
  }
}

.error-message {
  color: #ff6b6b;
  font-size: 0.9rem;
  margin-top: 0.5rem;
  padding: 0.5rem 0.75rem;
  background-color: rgba(255, 107, 107, 0.1);
  border-left: 3px solid #ff6b6b;
  border-radius: 0 4px 4px 0;
}

.change-password-btn {
  background: linear-gradient(135deg, #e6531d, darken(#e6531d, 15%));
  color: #FEF0D1;
  border: none;
  padding: 0.85rem 1.75rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  align-self: flex-start;
  transition: all 0.3s ease;
  box-shadow: 0 4px 10px rgba(230, 83, 29, 0.3);
  margin-top: 0.5rem;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &:not(:disabled):hover {
    background: linear-gradient(135deg, lighten(#e6531d, 5%), #e6531d);
    transform: translateY(-2px);
    box-shadow: 0 6px 14px rgba(230, 83, 29, 0.4);
  }

  &:not(:disabled):active {
    transform: translateY(0);
    box-shadow: 0 2px 6px rgba(230, 83, 29, 0.3);
  }

  i {
    font-size: 1.1rem;
  }
}

// Notification styles
:global(.notification) {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1000;
  max-width: 350px;

  .notification-content {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1.25rem;
    border-radius: 12px;
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.4);
    backdrop-filter: blur(10px);

    i {
      font-size: 1.5rem;
    }
  }

  &.success .notification-content {
    background: linear-gradient(135deg, rgba(0, 113, 66, 0.9), rgba(0, 113, 66, 0.8));
    color: #FEF0D1;
    border: 1px solid rgba(0, 255, 157, 0.3);
    border-left: 5px solid #00ff9d;

    i {
      color: #00ff9d;
      filter: drop-shadow(0 0 5px rgba(0, 255, 157, 0.5));
    }
  }

  &.error .notification-content {
    background: linear-gradient(135deg, rgba(230, 83, 29, 0.9), rgba(230, 83, 29, 0.8));
    color: #FEF0D1;
    border: 1px solid rgba(255, 107, 107, 0.3);
    border-left: 5px solid #ff6b6b;

    i {
      color: #ff6b6b;
      filter: drop-shadow(0 0 5px rgba(255, 107, 107, 0.5));
    }
  }

  &.info .notification-content {
    background: linear-gradient(135deg, rgba(52, 48, 123, 0.9), rgba(52, 48, 123, 0.8));
    color: #FEF0D1;
    border: 1px solid rgba(141, 134, 255, 0.3);
    border-left: 5px solid #8d86ff;

    i {
      color: #8d86ff;
      filter: drop-shadow(0 0 5px rgba(141, 134, 255, 0.5));
    }
  }
}

// Responsive adjustments
@media (max-width: 767px) {
  .settings-header {
    flex-direction: column;
    gap: 1rem;
    align-items: center;
    text-align: center;

    .logout-btn {
      margin-top: 0.5rem;
      width: 100%;
      max-width: 200px;
      justify-content: center;
    }
  }

  .page-title {
    font-size: 2rem;
  }

  .settings-section {
    padding: 1.5rem;
  }

  .section-header {
    flex-wrap: wrap;
  }

  .title-with-icon {
    width: 100%;

    .section-title {
      font-size: 1.3rem;
      margin-right: 0.5rem;
    }

    .section-icon {
      margin-left: 0;
      width: 32px;
      height: 32px;
      min-width: 32px;
      min-height: 32px;
      font-size: 1rem;
    }
  }

  .profile-picture {
    width: 120px;
    height: 120px;
  }

  .profile-field {
    .email-field {
      flex-direction: column;
      align-items: flex-start;

      p {
        width: 100%;
        word-break: break-all;
      }

      .email-status {
        margin-top: 0.5rem;
      }

      .email-input {
        width: 100%;
      }

      .add-email-btn {
        margin-top: 0.5rem;
        align-self: flex-end;
      }
    }
  }

  .form-group {
    .password-input-container {
      input {
        padding: 0.75rem 2.5rem 0.75rem 0.75rem;
      }
    }
  }
}

// Logout Modal Styles
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(5px);
  opacity: 0;
}

.logout-modal {
  background-color: rgba(23, 23, 23, 0.95);
  border-radius: 20px;
  padding: 2.5rem;
  max-width: 450px;
  width: 90%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(254, 240, 209, 0.1);
  position: relative;
  opacity: 0;
  transform: translateY(-50px) scale(0.8);

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 4px;
    background-color: #e6531d;
    border-radius: 20px 20px 0 0;
  }
}

.modal-header {
  text-align: center;
  margin-bottom: 2rem;

  .modal-icon {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    background-color: rgba(230, 83, 29, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 1.5rem;
    border: 2px solid rgba(230, 83, 29, 0.3);
    opacity: 0;
    transform: scale(0) rotate(-180deg);

    i {
      font-size: 2rem;
      color: #e6531d;
    }
  }

  h3 {
    font-family: 'Poppins', sans-serif;
    font-size: 1.8rem;
    font-weight: 700;
    color: #FEF0D1;
    margin: 0;
    letter-spacing: -0.02em;
  }
}

.modal-body {
  text-align: center;
  margin-bottom: 2.5rem;

  p {
    font-family: 'Poppins', sans-serif;
    font-size: 1.1rem;
    color: rgba(254, 240, 209, 0.8);
    line-height: 1.6;
    margin: 0;
    font-weight: 400;
  }
}

.modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;

  button {
    padding: 1rem 2rem;
    border: none;
    border-radius: 12px;
    font-family: 'Poppins', sans-serif;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    min-width: 120px;
    justify-content: center;

    i {
      font-size: 1rem;
    }
  }

  .cancel-btn {
    background-color: rgba(254, 240, 209, 0.1);
    color: #FEF0D1;
    border: 1px solid rgba(254, 240, 209, 0.2);

    &:hover {
      background-color: rgba(254, 240, 209, 0.2);
      transform: translateY(-2px);
      box-shadow: 0 4px 15px rgba(254, 240, 209, 0.1);
    }
  }

  .confirm-btn {
    background-color: #e6531d;
    color: #FEF0D1;

    &:hover {
      background-color: darken(#e6531d, 10%);
      transform: translateY(-2px);
      box-shadow: 0 4px 15px rgba(230, 83, 29, 0.4);
    }
  }
}



@media (max-width: 768px) {
  .logout-modal {
    padding: 2rem;
    margin: 1rem;
  }

  .modal-actions {
    flex-direction: column;

    button {
      width: 100%;
    }
  }
}
</style>
