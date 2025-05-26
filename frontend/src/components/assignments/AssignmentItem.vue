<template>
  <div class="assignment-item" :class="{ 'overdue': isOverdue, 'inactive': !isActive }">
    <div class="assignment-header">
      <h3 class="assignment-title">{{ assignment.titulo }}</h3>
      <div class="assignment-status">
        <span class="status-badge" :class="statusClass">{{ statusText }}</span>
      </div>
    </div>

    <div class="assignment-details">
      <p class="assignment-description">{{ assignment.descripcion }}</p>

      <div class="assignment-meta">
        <div class="meta-item">
          <i class="fas fa-calendar-alt"></i>
          <span>Due: {{ formattedDueDate }}</span>
        </div>
        <div class="meta-item">
          <i class="fas fa-star"></i>
          <span>{{ assignment.puntuacionMaxima || assignment.puntuacion_maxima }} points</span>
        </div>
        <div class="meta-item">
          <i class="fas fa-file-alt"></i>
          <span>
            Submit:
            <span v-if="assignment.permitirTexto || assignment.permitir_texto">Text</span>
            <span v-if="(assignment.permitirTexto || assignment.permitir_texto) &&
                       (assignment.permitirArchivos || assignment.permitir_archivos)"> & </span>
            <span v-if="assignment.permitirArchivos || assignment.permitir_archivos">Files</span>
          </span>
        </div>
      </div>
    </div>

    <div class="assignment-actions">
      <button class="action-btn view-btn" @click="$emit('view', assignment)">
        View Details
      </button>
      <button
        v-if="canSubmit"
        class="action-btn submit-btn"
        @click="$emit('submit', assignment)"
      >
        Submit
      </button>
      <button
        v-if="canEdit"
        class="action-btn edit-btn"
        @click="$emit('edit', assignment)"
      >
        Edit
      </button>
      <button
        v-if="canEdit"
        class="action-btn toggle-btn"
        @click="toggleStatus"
      >
        {{ isActive ? 'Deactivate' : 'Activate' }}
      </button>
      <button
        v-if="canDelete"
        class="action-btn delete-btn"
        @click="$emit('delete', assignment)"
      >
        Delete
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import authStore from '@/stores/authStore';

const props = defineProps({
  assignment: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['view', 'submit', 'edit', 'delete', 'toggle-status']);

// Computed properties
const formattedDueDate = computed(() => {
  // Handle both frontend (fechaEntrega) and backend (fecha_entrega) field names
  const dueDateStr = props.assignment.fechaEntrega || props.assignment.fecha_entrega;
  const dueDate = new Date(dueDateStr);
  return dueDate.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
});

const isOverdue = computed(() => {
  const now = new Date();
  // Handle both frontend (fechaEntrega) and backend (fecha_entrega) field names
  const dueDateStr = props.assignment.fechaEntrega || props.assignment.fecha_entrega;
  const dueDate = new Date(dueDateStr);
  return now > dueDate;
});

const isActive = computed(() => {
  // Handle both frontend (active) and backend (activo) field names
  return props.assignment.active !== undefined ? props.assignment.active :
         props.assignment.activo !== undefined ? props.assignment.activo : true;
});

const statusClass = computed(() => {
  if (!isActive.value) {
    return 'status-inactive';
  }

  if (isOverdue.value) {
    return 'status-overdue';
  }

  return 'status-active';
});

const statusText = computed(() => {
  if (!isActive.value) {
    return 'Inactive';
  }

  if (isOverdue.value) {
    return 'Overdue';
  }

  return 'Active';
});

const userRole = computed(() => authStore.userRole.value);

const canSubmit = computed(() => {
  return userRole.value === 'estudiante';
});

const canEdit = computed(() => {
  return userRole.value === 'admin' || userRole.value === 'profesor';
});

const canDelete = computed(() => {
  return userRole.value === 'admin' || userRole.value === 'profesor';
});

// Methods
const toggleStatus = () => {
  // Create a copy of the assignment with the active status toggled
  const updatedAssignment = {
    ...props.assignment,
    active: !isActive.value,
    activo: !isActive.value // Also update the backend field name
  };

  // Emit the event to the parent component
  emit('toggle-status', updatedAssignment);
};
</script>

<style lang="scss" scoped>
.assignment-item {
  background-color: var(--color-dark-bg);
  border-radius: 8px;
  padding: 1.5rem;
  color: var(--color-cashmere);
  transition: transform 0.3s ease, box-shadow 0.3s ease;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
  }

  &.overdue {
    border-left: 4px solid #f44336;
  }

  &.inactive {
    opacity: 0.7;
    border-left: 4px solid #757575;
  }

  .assignment-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;

    .assignment-title {
      font-size: 1.3rem;
      font-weight: var(--font-weight-bold);
      margin: 0;
    }

    .assignment-status {
      .status-badge {
        padding: 0.3rem 0.8rem;
        border-radius: 20px;
        font-size: 0.8rem;
        font-weight: var(--font-weight-medium);

        &.status-active {
          background-color: var(--color-forest-green);
          color: white;
        }

        &.status-overdue {
          background-color: #f44336;
          color: white;
        }

        &.status-inactive {
          background-color: #757575;
          color: white;
        }
      }
    }
  }

  .assignment-details {
    margin-bottom: 1.5rem;

    .assignment-description {
      margin-bottom: 1rem;
      line-height: 1.5;
      opacity: 0.9;
    }

    .assignment-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;

      .meta-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.9rem;
        opacity: 0.8;

        i {
          color: var(--color-orange);
        }
      }
    }
  }

  .assignment-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.8rem;

    .action-btn {
      padding: 0.5rem 1rem;
      border: none;
      border-radius: 4px;
      font-size: 0.9rem;
      cursor: pointer;
      transition: background-color 0.2s ease, transform 0.2s ease;

      &:hover {
        transform: translateY(-2px);
      }

      &.view-btn {
        background-color: var(--color-purple);
        color: white;

        &:hover {
          background-color: darken(#34307b, 5%);
        }
      }

      &.submit-btn {
        background-color: var(--color-forest-green);
        color: white;

        &:hover {
          background-color: darken(#007142, 5%);
        }
      }

      &.edit-btn {
        background-color: var(--color-orange);
        color: white;

        &:hover {
          background-color: darken(#e6531d, 5%);
        }
      }

      &.toggle-btn {
        background-color: var(--color-purple);
        color: white;

        &:hover {
          background-color: darken(#34307b, 5%);
        }
      }

      &.delete-btn {
        background-color: #f44336;
        color: white;

        &:hover {
          background-color: darken(#f44336, 5%);
        }
      }
    }
  }
}

@media (max-width: 768px) {
  .assignment-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .assignment-actions {
    justify-content: center;
  }
}
</style>
