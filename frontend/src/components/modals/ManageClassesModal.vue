<template>
  <div class="modal-backdrop" :class="{ 'active': isOpen }" @click.self="closeModal">
    <div class="modal" :class="{ 'active': isOpen }">
      <div class="modal-header">
        <h3 class="modal-title">Manage Classes</h3>
        <button class="modal-close" @click="closeModal" aria-label="Close modal">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <div class="modal-body">
        <p class="modal-description">
          Create and manage classes for each grade in your educational center. Students can be assigned to specific classes.
        </p>

        <!-- Class creation form -->
        <div class="class-management-container">
          <div class="class-creation-section">
            <h4>Create New Class</h4>
            <form @submit.prevent="createClass" class="class-form">
              <div class="form-group">
                <label for="classGrade" class="form-label">Grade</label>
                <select
                  id="classGrade"
                  v-model="selectedGrade"
                  class="form-control"
                  required
                  :disabled="isLoading"
                >
                  <option value="" disabled selected>Select a grade</option>
                  <option value="1º ESO">1º ESO</option>
                  <option value="2º ESO">2º ESO</option>
                  <option value="3º ESO">3º ESO</option>
                  <option value="4º ESO">4º ESO</option>
                  <option value="1º BACH">1º BACH</option>
                  <option value="2º BACH">2º BACH</option>
                </select>
              </div>

              <div class="form-group">
                <label for="className" class="form-label">Class Name</label>
                <select
                  id="className"
                  v-model="className"
                  class="form-control"
                  required
                  :disabled="isLoading"
                >
                  <option value="" disabled selected>Select a class</option>
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                  <option value="D">D</option>
                </select>
              </div>

              <div class="form-actions">
                <button
                  type="submit"
                  class="btn btn-primary"
                  :disabled="!isFormValid || isLoading"
                >
                  <span v-if="isLoading">
                    <i class="fas fa-spinner fa-spin"></i> Creating...
                  </span>
                  <span v-else>
                    <i class="fas fa-plus"></i> Create Class
                  </span>
                </button>
              </div>

              <div v-if="errorMessage" class="error-message">
                {{ errorMessage }}
              </div>

              <div v-if="successMessage" class="success-message">
                {{ successMessage }}
              </div>
            </form>
          </div>

          <div class="class-info-section">
            <h4>What are Classes?</h4>
            <p>Classes are subdivisions within a grade. For example, within "2º ESO" you might have classes A, B, C, etc.</p>
            <p>Creating classes allows you to:</p>
            <ul>
              <li>Organize students into smaller groups</li>
              <li>Assign different modules and professors to specific classes</li>
              <li>Manage educational content more effectively</li>
            </ul>
            <p>Once you create classes, you can assign students to them when creating or editing student accounts.</p>
          </div>
        </div>

        <!-- Existing classes -->
        <div class="existing-classes">
          <h4>Existing Classes</h4>

          <div v-if="isLoadingClasses" class="loading-classes">
            <i class="fas fa-spinner fa-spin"></i> Loading classes...
          </div>

          <div v-else-if="classes.length === 0" class="no-classes">
            No classes found. Create your first class above.
          </div>

          <div v-else class="classes-list">
            <div v-for="(gradeClasses, grade) in groupedClasses" :key="grade" class="grade-group">
              <h5>{{ grade }}</h5>
              <div class="class-badges">
                <span
                  v-for="classItem in gradeClasses"
                  :key="`${grade}-${classItem}`"
                  class="class-badge"
                >
                  <span class="class-name">{{ grade }} {{ classItem }}</span>
                  <span class="class-students-count" v-if="getStudentCount(grade, classItem) > 0">
                    {{ getStudentCount(grade, classItem) }} students
                  </span>
                  <span class="class-students-count" v-else>
                    No students
                  </span>
                  <button
                    class="delete-class-btn"
                    @click="confirmDeleteClass(grade, classItem)"
                    aria-label="Delete class"
                    :disabled="getStudentCount(grade, classItem) > 0"
                    :title="getStudentCount(grade, classItem) > 0 ? 'Cannot delete class with students' : 'Delete class'"
                  >
                    <i class="fas fa-times"></i>
                  </button>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button
          class="btn btn-secondary"
          @click="closeModal"
          :disabled="isLoading"
        >
          Close
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import UserService from '@/services/userService';
import ClassService from '@/services/classService';

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true
  },
  centerId: {
    type: String,
    required: true
  },
  existingClasses: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['close', 'class-created']);

// State
const selectedGrade = ref('');
const className = ref('');
const isLoading = ref(false);
const isLoadingClasses = ref(false);
const errorMessage = ref('');
const successMessage = ref('');
const classes = ref([]);
const students = ref([]);

// Computed
const isFormValid = computed(() => {
  return selectedGrade.value !== '' && className.value !== '';
});

// Group classes by grade
const groupedClasses = computed(() => {
  const grouped = {};

  classes.value.forEach(classItem => {
    if (!grouped[classItem.grade]) {
      grouped[classItem.grade] = [];
    }
    grouped[classItem.grade].push(classItem.class);
  });

  return grouped;
});

// Methods
const fetchClasses = async () => {
  try {
    isLoadingClasses.value = true;
    errorMessage.value = '';

    // Fetch students from the API
    const fetchedStudents = await UserService.getUsersByRole('estudiante', props.centerId);
    students.value = fetchedStudents;

    console.log('Fetched students:', students.value);

    // Extract unique grade/class combinations from students
    const uniqueClasses = new Map();

    // First add existing classes from props if available
    if (props.existingClasses && props.existingClasses.length > 0) {
      props.existingClasses.forEach(c => {
        const key = `${c.grade}-${c.class}`;
        uniqueClasses.set(key, c);
      });
    }

    // Then add classes from students
    students.value.forEach(student => {
      if (student.curso && student.clase) {
        const key = `${student.curso}-${student.clase}`;
        uniqueClasses.set(key, { grade: student.curso, class: student.clase });
      }
    });

    // Convert map back to array
    classes.value = Array.from(uniqueClasses.values());

    console.log('Extracted classes:', classes.value);

  } catch (error) {
    console.error('Error fetching classes:', error);
    errorMessage.value = 'Failed to load classes. Please try again.';
  } finally {
    isLoadingClasses.value = false;
  }
};

const createClass = async () => {
  if (!isFormValid.value) {
    errorMessage.value = 'Please fill in all required fields';
    return;
  }

  try {
    isLoading.value = true;
    errorMessage.value = '';

    // In a real implementation, you would create a class in the database
    // For now, we'll just simulate success and refresh the list

    // Check if this class already exists
    const exists = classes.value.some(c =>
      c.grade === selectedGrade.value && c.class === className.value
    );

    if (exists) {
      errorMessage.value = `Class ${selectedGrade.value} ${className.value} already exists`;
      successMessage.value = '';
      return;
    }

    // Add to local list
    const newClass = {
      grade: selectedGrade.value,
      class: className.value
    };

    classes.value.push(newClass);

    // Show success message
    successMessage.value = `Class ${selectedGrade.value} ${className.value} created successfully!`;

    // Reset form
    selectedGrade.value = '';
    className.value = '';

    // Emit event to parent component
    emit('class-created', newClass);

  } catch (error) {
    console.error('Error creating class:', error);
    errorMessage.value = error.message || 'Failed to create class. Please try again.';
  } finally {
    isLoading.value = false;
  }
};

// Get the number of students in a class
const getStudentCount = (grade, classItem) => {
  return students.value.filter(student =>
    student.curso === grade && student.clase === classItem
  ).length;
};

const confirmDeleteClass = (grade, classItem) => {
  // Check if there are students in this class
  const studentCount = getStudentCount(grade, classItem);

  if (studentCount > 0) {
    alert(`Cannot delete class ${grade} ${classItem} because it has ${studentCount} students.`);
    return;
  }

  if (confirm(`Are you sure you want to delete class ${grade} ${classItem}?`)) {
    // In a real implementation, you would delete the class from the database
    // For now, we'll just remove it from the local list
    classes.value = classes.value.filter(c =>
      !(c.grade === grade && c.class === classItem)
    );
  }
};

const closeModal = () => {
  if (!isLoading.value) {
    emit('close');
  }
};

// Load classes when modal opens
watch(() => props.isOpen, (newValue) => {
  if (newValue) {
    fetchClasses();
  }
});

// Initial load
onMounted(() => {
  if (props.isOpen) {
    fetchClasses();
  }
});
</script>

<style lang="scss" scoped>
.modal-description {
  margin-bottom: 1.5rem;
  color: var(--color-text-light);
}

.class-management-container {
  display: flex;
  gap: 2rem;
  margin-bottom: 2rem;

  @media (max-width: 768px) {
    flex-direction: column;
  }
}

.class-creation-section {
  flex: 1;

  h4 {
    margin-bottom: 1rem;
    color: var(--color-cashmere);
  }
}

.class-info-section {
  flex: 1;
  background-color: rgba(0, 0, 0, 0.2);
  padding: 1.5rem;
  border-radius: 8px;

  h4 {
    margin-bottom: 1rem;
    color: var(--color-cashmere);
  }

  p {
    margin-bottom: 1rem;
    color: var(--color-text-light);
  }

  ul {
    margin-bottom: 1rem;
    padding-left: 1.5rem;

    li {
      margin-bottom: 0.5rem;
      color: var(--color-text-light);
    }
  }
}

.class-form {
  margin-bottom: 1.5rem;
}

.form-actions {
  margin-top: 1rem;
}

.error-message {
  color: var(--color-error);
  margin-top: 0.5rem;
  font-size: 0.9rem;
}

.success-message {
  color: var(--color-forest-green);
  margin-top: 0.5rem;
  font-size: 0.9rem;
  background-color: rgba(0, 113, 66, 0.1);
  padding: 0.5rem;
  border-radius: 4px;
}

.existing-classes {
  h4 {
    margin-bottom: 1rem;
    color: var(--color-cashmere);
  }
}

.loading-classes, .no-classes {
  color: var(--color-text-light);
  padding: 1rem 0;
  text-align: center;
}

.grade-group {
  margin-bottom: 1.5rem;

  h5 {
    margin-bottom: 0.5rem;
    color: var(--color-cashmere);
  }
}

.class-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.class-badge {
  background-color: var(--color-forest-green);
  color: white;
  padding: 0.5rem 0.75rem;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }
}

.class-name {
  font-weight: var(--font-weight-medium);
  font-size: 1rem;
}

.class-students-count {
  font-size: 0.8rem;
  opacity: 0.8;
  background-color: rgba(0, 0, 0, 0.2);
  padding: 0.2rem 0.5rem;
  border-radius: 12px;
}

.delete-class-btn {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  padding: 0;
  font-size: 0.8rem;
  margin-left: auto;

  &:hover:not(:disabled) {
    color: white;
  }

  &:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }
}
</style>
