<template>
  <div class="modal-backdrop" :class="{ 'active': isOpen }" @click.self="closeModal">
    <div class="modal" :class="{ 'active': isOpen }">
      <div class="modal-header">
        <h3 class="modal-title">Invite Professor</h3>
        <button class="modal-close" @click="closeModal" aria-label="Close modal">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <div class="modal-body">
        <!-- Invitation Form -->
        <div v-if="activeTab === 'invite'">
          <p class="modal-description">
            Enter the email address of the professor you want to invite.
            They will receive an invitation link to create their account.
          </p>
          <div class="email-note">
            <i class="fas fa-info-circle"></i>
            <span>
              Note: Email delivery requires proper configuration in the backend.
              If emails are not being received, you can copy and share the invitation link manually.
            </span>
          </div>

          <form @submit.prevent="sendInvitation" class="invitation-form">
            <div class="form-group">
              <label for="professorEmail" class="form-label">Email Address</label>
              <input
                type="email"
                id="professorEmail"
                v-model="email"
                class="form-control"
                placeholder="professor@example.com"
                required
                :disabled="isLoading"
              />
            </div>

            <div v-if="errorMessage" class="error-message">
              {{ errorMessage }}
            </div>

            <div v-if="successMessage" class="success-message">
              {{ successMessage }}
            </div>
          </form>
        </div>

        <!-- Pending Invitations -->
        <div v-if="activeTab === 'pending'">
          <p class="modal-description">
            Manage pending invitations for professors. These invitations are valid for 7 days.
          </p>

          <div v-if="isLoadingInvitations" class="loading-indicator">
            <i class="fas fa-spinner fa-spin"></i> Loading invitations...
          </div>

          <div v-else-if="pendingInvitations.length === 0" class="no-invitations">
            <i class="fas fa-envelope-open"></i>
            <p>No pending invitations</p>
          </div>

          <div v-else class="invitations-list">
            <div v-for="invitation in pendingInvitations" :key="invitation.token" class="invitation-item">
              <div class="invitation-details">
                <div class="invitation-email">
                  <i class="fas fa-envelope"></i>
                  <span>{{ invitation.email }}</span>
                </div>
                <div class="invitation-info">
                  <div class="invitation-expiry">
                    <i class="fas fa-clock"></i> Expires: {{ formatDate(invitation.fecha_expiracion) }}
                  </div>
                  <div class="invitation-status" :class="{ 'used': invitation.usado }">
                    <i class="fas" :class="invitation.usado ? 'fa-check-circle' : 'fa-hourglass-half'"></i>
                    {{ invitation.usado ? 'Used' : 'Pending' }}
                  </div>
                </div>
              </div>
              <div class="invitation-actions">
                <button
                  class="copy-link-btn"
                  @click="copyInvitationLink(invitation.token)"
                  title="Copy invitation link"
                >
                  <i class="fas fa-link"></i>
                </button>
                <button
                  class="resend-btn"
                  @click="resendInvitation(invitation)"
                  title="Resend invitation"
                  :disabled="invitation.usado"
                >
                  <i class="fas fa-paper-plane"></i>
                </button>
                <button
                  class="delete-btn"
                  @click="deleteInvitation(invitation.token)"
                  title="Delete invitation"
                >
                  <i class="fas fa-trash-alt"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Modal Footer with Tabs -->
      <div class="modal-footer">
        <div class="modal-tabs">
          <button
            class="tab-btn"
            :class="{ 'active': activeTab === 'invite' }"
            @click="activeTab = 'invite'"
          >
            <i class="fas fa-user-plus"></i> Invite
          </button>
          <button
            class="tab-btn"
            :class="{ 'active': activeTab === 'pending' }"
            @click="loadPendingInvitations"
          >
            <i class="fas fa-clock"></i> Pending
            <span v-if="pendingInvitations.length > 0" class="badge">{{ pendingInvitations.length }}</span>
          </button>
        </div>

        <div class="modal-actions">
          <button
            class="btn btn-secondary"
            @click="closeModal"
            :disabled="isLoading"
          >
            Close
          </button>
          <button
            v-if="activeTab === 'invite'"
            class="btn btn-primary"
            @click="sendInvitation"
            :disabled="!isValidEmail || isLoading"
          >
            <span v-if="isLoading">
              <i class="fas fa-spinner fa-spin"></i> Sending...
            </span>
            <span v-else>
              <i class="fas fa-paper-plane"></i> Send Invitation
            </span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import authStore from '@/stores/authStore';
import InvitationService from '@/services/invitationService';

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true
  },
  centerId: {
    type: String,
    required: true
  }
});

const emit = defineEmits(['close', 'invitation-sent']);

// State
const email = ref('');
const isLoading = ref(false);
const errorMessage = ref('');
const successMessage = ref('');
const activeTab = ref('invite');
const pendingInvitations = ref([]);
const isLoadingInvitations = ref(false);

// Reset form when modal opens
watch(() => props.isOpen, (newValue) => {
  if (newValue) {
    resetForm();
    // Load pending invitations when modal opens
    if (activeTab.value === 'pending') {
      loadPendingInvitations();
    }
  }
});

// Computed
const isValidEmail = computed(() => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.value);
});

// Methods
const resetForm = () => {
  email.value = '';
  errorMessage.value = '';
  successMessage.value = '';
  isLoading.value = false;
};

const closeModal = () => {
  if (!isLoading.value) {
    emit('close');
  }
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const loadPendingInvitations = async () => {
  activeTab.value = 'pending';

  try {
    isLoadingInvitations.value = true;

    // Get pending invitations from the service
    const invitations = await InvitationService.getActiveInvitations(props.centerId);
    pendingInvitations.value = invitations || [];

  } catch (error) {
    console.error('Error loading invitations:', error);
    // Show error in the UI
    pendingInvitations.value = [];
  } finally {
    isLoadingInvitations.value = false;
  }
};

const sendInvitation = async () => {
  if (!isValidEmail.value) {
    errorMessage.value = 'Please enter a valid email address';
    return;
  }

  try {
    isLoading.value = true;
    errorMessage.value = '';

    // Verificar que tenemos un centerId válido
    if (!props.centerId) {
      throw new Error('No center ID available. Please refresh the page and try again.');
    }

    console.log('Sending invitation with center ID:', props.centerId);

    // Create invitation via service
    await InvitationService.createInvitation({
      centroId: props.centerId,
      tipoRol: 'profesor',
      email: email.value
    });

    // Show success message
    successMessage.value = `Invitation sent to ${email.value}`;

    // Emit event to parent component
    emit('invitation-sent', { email: email.value });

    // Reset form
    email.value = '';

    // Refresh pending invitations
    await loadPendingInvitations();

  } catch (error) {
    console.error('Error sending invitation:', error);
    errorMessage.value = error.message || 'Failed to send invitation. Please try again.';
  } finally {
    isLoading.value = false;
  }
};

const copyInvitationLink = (token) => {
  const registrationUrl = InvitationService.getRegistrationUrl(token);

  navigator.clipboard.writeText(registrationUrl)
    .then(() => {
      alert('Invitation link copied to clipboard!');
    })
    .catch(err => {
      console.error('Failed to copy invitation link:', err);
      alert('Failed to copy invitation link. Please try again.');
    });
};

const resendInvitation = async (invitation) => {
  try {
    // Verificar que tenemos un centerId válido
    if (!props.centerId) {
      throw new Error('No center ID available. Please refresh the page and try again.');
    }

    console.log('Resending invitation with center ID:', props.centerId);

    // Delete the old invitation
    await InvitationService.deleteInvitation(invitation.token);

    // Create a new invitation for the same email
    await InvitationService.createInvitation({
      centroId: props.centerId,
      tipoRol: 'profesor',
      email: invitation.email
    });

    alert(`Invitation resent to ${invitation.email}`);

    // Refresh the list
    await loadPendingInvitations();

  } catch (error) {
    console.error('Error resending invitation:', error);
    alert(`Failed to resend invitation: ${error.message}`);
  }
};

const deleteInvitation = async (token) => {
  if (confirm('Are you sure you want to delete this invitation?')) {
    try {
      await InvitationService.deleteInvitation(token);

      // Refresh the list
      await loadPendingInvitations();

    } catch (error) {
      console.error('Error deleting invitation:', error);
      alert('Failed to delete invitation. Please try again.');
    }
  }
};
</script>

<style lang="scss" scoped>
.modal-description {
  margin-bottom: 1rem;
  color: var(--color-text-light);
}

.email-note {
  display: flex;
  align-items: flex-start;
  background-color: rgba(0, 113, 66, 0.1);
  border-radius: var(--border-radius-sm);
  padding: 0.75rem;
  margin-bottom: 1.5rem;
  font-size: 0.85rem;

  i {
    color: var(--color-forest-green);
    margin-right: 0.5rem;
    margin-top: 0.1rem;
  }

  span {
    color: var(--color-text-light);
    line-height: 1.4;
  }
}

.invitation-form {
  margin-bottom: 1rem;
}

.error-message {
  color: var(--color-error);
  margin-top: 0.5rem;
  font-size: 0.9rem;
}

.success-message {
  color: var(--color-success);
  margin-top: 0.5rem;
  font-size: 0.9rem;
}

// Modal tabs
.modal-footer {
  display: flex;
  flex-direction: column;
  padding-top: 0;

  .modal-tabs {
    display: flex;
    border-bottom: 1px solid var(--color-border);
    margin-bottom: var(--spacing-md);
    width: 100%;

    .tab-btn {
      background: none;
      border: none;
      color: var(--color-text-light);
      padding: var(--spacing-sm) var(--spacing-md);
      cursor: pointer;
      font-size: 0.9rem;
      position: relative;
      transition: color var(--transition-normal);

      &:hover {
        color: var(--color-text);
      }

      &.active {
        color: var(--color-forest-green);
        font-weight: var(--font-weight-medium);

        &::after {
          content: '';
          position: absolute;
          bottom: -1px;
          left: 0;
          right: 0;
          height: 2px;
          background-color: var(--color-forest-green);
        }
      }

      .badge {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        background-color: var(--color-forest-green);
        color: white;
        border-radius: 50%;
        width: 18px;
        height: 18px;
        font-size: 0.7rem;
        margin-left: 5px;
      }
    }
  }

  .modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: var(--spacing-sm);
  }
}

// Invitations list
.invitations-list {
  max-height: 300px;
  overflow-y: auto;

  .invitation-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--spacing-sm);
    border-radius: var(--border-radius-md);
    background-color: rgba(255, 255, 255, 0.05);
    margin-bottom: var(--spacing-sm);

    &:last-child {
      margin-bottom: 0;
    }

    .invitation-details {
      flex: 1;

      .invitation-email {
        font-weight: var(--font-weight-medium);
        margin-bottom: 0.5rem;
        display: flex;
        align-items: center;

        i {
          color: var(--color-forest-green);
          margin-right: 0.5rem;
          font-size: 0.9rem;
        }

        span {
          overflow: hidden;
          text-overflow: ellipsis;
        }
      }

      .invitation-info {
        display: flex;
        justify-content: space-between;
        font-size: 0.8rem;
        color: var(--color-text-light);

        .invitation-expiry {
          display: flex;
          align-items: center;

          i {
            margin-right: 0.25rem;
            font-size: 0.8rem;
          }
        }

        .invitation-status {
          display: flex;
          align-items: center;

          i {
            margin-right: 0.25rem;
            font-size: 0.8rem;
          }

          &.used {
            color: var(--color-success);
          }
        }
      }
    }

    .invitation-actions {
      display: flex;
      gap: 0.5rem;

      button {
        background: none;
        border: none;
        color: var(--color-text-light);
        padding: 0.25rem;
        border-radius: var(--border-radius-sm);
        cursor: pointer;
        transition: all var(--transition-normal);

        &:hover:not(:disabled) {
          background-color: rgba(255, 255, 255, 0.1);
        }

        &:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        &.copy-link-btn:hover {
          color: var(--color-info);
        }

        &.resend-btn:hover:not(:disabled) {
          color: var(--color-forest-green);
        }

        &.delete-btn:hover {
          color: var(--color-error);
        }
      }
    }
  }
}

// Loading and empty states
.loading-indicator {
  display: flex;
  justify-content: center;
  padding: var(--spacing-md);
  color: var(--color-text-light);
}

.no-invitations {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-xl);
  color: var(--color-text-light);

  i {
    font-size: 2rem;
    margin-bottom: var(--spacing-sm);
  }

  p {
    margin: 0;
  }
}
</style>
