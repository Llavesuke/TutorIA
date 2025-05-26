<template>
  <div class="tutor-card" :class="{ 'active': tutor.active, 'offline': !tutor.active }">
    <div class="tutor-image">
      <img v-if="tutor.imagen" :src="tutor.imagen" :alt="tutor.nombre" />
      <TutorImagePlaceholder
        v-else
        :tutorName="tutor.nombre"
        :tutorType="tutor.tipo"
      />
    </div>
    <div class="tutor-content">
      <div class="tutor-info">
        <h3 class="tutor-name">{{ tutor.nombre }}</h3>
        <div class="tutor-status">
          <span class="status-dot"></span>
          <span class="status-text">{{ tutor.active ? 'Active' : 'Offline' }}</span>
        </div>
        <p v-if="tutor.objetivo" class="tutor-objective">{{ tutor.objetivo }}</p>
        <div class="tutor-type">
          <span class="type-badge" :class="tutor.tipo">{{ getTutorTypeLabel(tutor.tipo) }}</span>
          <span v-if="tutor.grupo" class="group-badge">{{ tutor.grupo }}</span>
        </div>
      </div>
      <div class="tutor-actions">
        <button class="action-btn view-btn" @click="$emit('view', tutor)">
          <i class="fas fa-eye"></i> View
        </button>
        <button
          v-if="canEdit"
          class="action-btn edit-btn"
          @click="$emit('edit', tutor)"
        >
          <i class="fas fa-edit"></i> Edit
        </button>
        <button
          v-if="canDelete"
          class="action-btn delete-btn"
          @click="$emit('delete', tutor)"
        >
          <i class="fas fa-trash"></i> Delete
        </button>

        <!-- Active/Inactive toggle -->
        <div v-if="canEdit" class="status-toggle">
          <span class="toggle-label">{{ tutor.active ? 'Active' : 'Inactive' }}</span>
          <label class="switch">
            <input
              type="checkbox"
              :checked="tutor.active"
              @change="toggleStatus"
            >
            <span class="slider round"></span>
          </label>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import authStore from '@/stores/authStore';
import TutorImagePlaceholder from './TutorImagePlaceholder.vue';

const props = defineProps({
  tutor: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['view', 'edit', 'delete', 'toggle-status']);

// Computed properties
const userRole = computed(() => authStore.userRole.value);

const canEdit = computed(() => {
  return userRole.value === 'admin' || userRole.value === 'profesor';
});

const canDelete = computed(() => {
  return userRole.value === 'admin' || userRole.value === 'profesor';
});

// Methods
const getTutorTypeLabel = (type) => {
  switch (type) {
    case 'teorico':
      return 'Theoretical';
    case 'practico':
      return 'Practical';
    case 'evaluador':
      return 'Evaluator';
    case 'general':
      return 'General';
    default:
      return type;
  }
};

const toggleStatus = () => {
  // Create a copy of the tutor with the active status toggled
  const updatedTutor = {
    ...props.tutor,
    active: !props.tutor.active,
    activo: !props.tutor.active // Also update the backend field name
  };

  // Emit the event to the parent component
  emit('toggle-status', updatedTutor);
};
</script>

<style lang="scss" scoped>
.tutor-card {
  background-color: var(--color-dark-bg);
  border-radius: 12px;
  overflow: hidden;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 320px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.05);

  &:hover {
    transform: translateY(-8px);
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.3);
  }

  &.active {
    border-left: 4px solid var(--color-forest-green);

    .tutor-status {
      .status-dot {
        background-color: #4caf50;
      }
    }
  }

  &.offline {
    border-left: 4px solid #f44336;

    .tutor-status {
      .status-dot {
        background-color: #f44336;
      }
    }
  }

  .tutor-image {
    height: 160px;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;

    &::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 40px;
      background: linear-gradient(to top, rgba(23, 23, 23, 1), rgba(23, 23, 23, 0));
      z-index: 1;
    }

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  .tutor-content {
    display: flex;
    flex-direction: column;
    flex-grow: 1;
  }

  .tutor-info {
    padding: 1.2rem;
    flex-grow: 1;

    .tutor-name {
      font-size: 1.4rem;
      font-weight: var(--font-weight-bold);
      margin-bottom: 0.5rem;
      color: var(--color-cashmere);
      line-height: 1.2;
    }

    .tutor-status {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.8rem;

      .status-dot {
        width: 10px;
        height: 10px;
        border-radius: 50%;
      }

      .status-text {
        font-size: 0.9rem;
        color: var(--color-cashmere);
        opacity: 0.8;
      }
    }

    .tutor-objective {
      font-size: 0.9rem;
      color: var(--color-cashmere);
      opacity: 0.8;
      margin-bottom: 0.8rem;
      line-height: 1.4;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .tutor-type {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-top: 0.5rem;

      .type-badge, .group-badge {
        padding: 0.3rem 0.6rem;
        border-radius: 4px;
        font-size: 0.8rem;
        font-weight: var(--font-weight-medium);
        display: inline-block;
      }

      .type-badge {
        &.teorico {
          background-color: var(--color-forest-green);
          color: white;
        }

        &.practico {
          background-color: var(--color-purple);
          color: white;
        }

        &.evaluador {
          background-color: var(--color-orange);
          color: white;
        }

        &.general {
          background-color: #2c3e50;
          color: white;
        }
      }

      .group-badge {
        background-color: rgba(255, 255, 255, 0.1);
        color: var(--color-cashmere);
      }
    }
  }

  .tutor-actions {
    display: flex;
    flex-wrap: wrap;
    padding: 0.8rem 1.2rem;
    gap: 0.8rem;
    justify-content: flex-end;
    border-top: 1px solid rgba(255, 255, 255, 0.05);
    background-color: rgba(0, 0, 0, 0.2);

    .action-btn {
      padding: 0.5rem 1rem;
      border: none;
      border-radius: 6px;
      font-size: 0.9rem;
      font-weight: var(--font-weight-medium);
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      gap: 0.4rem;

      i {
        font-size: 0.9rem;
      }

      &.view-btn {
        background-color: var(--color-purple);
        color: white;

        &:hover {
          background-color: darken(#34307b, 5%);
          transform: translateY(-2px);
        }
      }

      &.edit-btn {
        background-color: var(--color-orange);
        color: white;

        &:hover {
          background-color: darken(#e6531d, 5%);
          transform: translateY(-2px);
        }
      }

      &.delete-btn {
        background-color: #f44336;
        color: white;

        &:hover {
          background-color: darken(#f44336, 5%);
          transform: translateY(-2px);
        }
      }
    }

    .status-toggle {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-top: 0.5rem;
      width: 100%;
      justify-content: flex-end;

      .toggle-label {
        font-size: 0.9rem;
        color: var(--color-cashmere);
      }

      /* The switch - the box around the slider */
      .switch {
        position: relative;
        display: inline-block;
        width: 50px;
        height: 24px;
      }

      /* Hide default HTML checkbox */
      .switch input {
        opacity: 0;
        width: 0;
        height: 0;
      }

      /* The slider */
      .slider {
        position: absolute;
        cursor: pointer;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: #ccc;
        transition: .4s;
      }

      .slider:before {
        position: absolute;
        content: "";
        height: 16px;
        width: 16px;
        left: 4px;
        bottom: 4px;
        background-color: white;
        transition: .4s;
      }

      input:checked + .slider {
        background-color: var(--color-forest-green);
      }

      input:focus + .slider {
        box-shadow: 0 0 1px var(--color-forest-green);
      }

      input:checked + .slider:before {
        transform: translateX(26px);
      }

      /* Rounded sliders */
      .slider.round {
        border-radius: 24px;
      }

      .slider.round:before {
        border-radius: 50%;
      }
    }
  }
}
</style>
