<template>
  <div v-if="isOpen" class="modal-overlay" @click="closeModal">
    <div class="modal-container" @click.stop>
      <div class="modal-header">
        <h2>{{ selectedOption ? 'Select Location' : 'Create New' }}</h2>
        <button class="close-btn" @click="closeModal" aria-label="Close modal">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <div class="modal-body">
        <!-- Step 1: Select what to create -->
        <div v-if="!selectedOption" class="step-content">
          <p class="modal-description">What would you like to create?</p>

          <div class="options-grid">
            <div class="option-card tutor-option" @click="selectOption('tutor')">
              <div class="option-icon">
                <i class="fas fa-robot"></i>
              </div>
              <h3>Virtual Tutor</h3>
              <p>Create an AI tutor for your students</p>
            </div>

            <div class="option-card unit-option" @click="selectOption('unit')">
              <div class="option-icon">
                <i class="fas fa-book"></i>
              </div>
              <h3>Unit</h3>
              <p>Add a new unit to a module</p>
            </div>

            <div class="option-card assignment-option" @click="selectOption('assignment')">
              <div class="option-icon">
                <i class="fas fa-tasks"></i>
              </div>
              <h3>Assignment</h3>
              <p>Create a new assignment for students</p>
            </div>
          </div>
        </div>

        <!-- Step 2: Select module/unit -->
        <div v-else class="step-content">
          <div class="step-header">
            <button class="back-btn" @click="goBack">
              <i class="fas fa-arrow-left"></i>
            </button>
            <p class="modal-description">
              {{ getStepDescription() }}
            </p>
          </div>

          <!-- Loading state -->
          <div v-if="isLoadingData" class="loading-state">
            <div class="loading-spinner"></div>
            <p>Loading your modules and units...</p>
          </div>

          <!-- No data state -->
          <div v-else-if="availableModules.length === 0" class="no-data-state">
            <div class="no-data-icon">
              <i class="fas fa-exclamation-triangle"></i>
            </div>
            <h3>{{ getNoDataTitle() }}</h3>
            <p>{{ getNoDataMessage() }}</p>
          </div>

          <!-- No units available for tutors/assignments -->
          <div v-else-if="(selectedOption === 'tutor' || selectedOption === 'assignment') && !hasAvailableUnits" class="no-data-state">
            <div class="no-data-icon">
              <i class="fas fa-info-circle"></i>
            </div>
            <h3>No units available</h3>
            <p>You need to create units in your modules before adding {{ selectedOption === 'tutor' ? 'virtual tutors' : 'assignments' }}.</p>
            <div class="no-data-actions">
              <button class="create-unit-btn" @click="switchToUnitCreation">
                <i class="fas fa-plus"></i> Create Unit First
              </button>
            </div>
          </div>

          <!-- Module/Unit selection -->
          <div v-else class="selection-content">
            <!-- For units: show modules -->
            <div v-if="selectedOption === 'unit'" class="modules-list">
              <div
                v-for="module in availableModules"
                :key="module.id"
                class="selection-item module-item"
                @click="createUnit(module.id)"
              >
                <div class="item-icon">
                  <i class="fas fa-book-open"></i>
                </div>
                <div class="item-content">
                  <h4>{{ module.name }}</h4>
                  <p>{{ module.displayName }}</p>
                  <span class="item-count">{{ module.units.length }} units</span>
                </div>
                <div class="item-arrow">
                  <i class="fas fa-plus"></i>
                </div>
              </div>
            </div>

            <!-- For tutors/assignments: show units -->
            <div v-else class="units-list">
              <div
                v-for="module in availableModules"
                :key="module.id"
                class="module-group"
              >
                <h4 class="module-group-title">{{ module.displayName }}</h4>
                <div
                  v-for="unit in module.units"
                  :key="unit.id"
                  class="selection-item unit-item"
                  @click="createInUnit(unit.id, unit.nombre, module.name)"
                >
                  <div class="item-icon">
                    <i class="fas fa-layer-group"></i>
                  </div>
                  <div class="item-content">
                    <h4>{{ unit.nombre }}</h4>
                    <p>Unit {{ unit.orden }} in {{ module.name }}</p>
                  </div>
                  <div class="item-arrow">
                    <i class="fas fa-plus"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Sub-modals -->
  <AddTutorModal
    :isOpen="showTutorModal"
    :unitId="selectedUnitData?.id || selectedUnitId"
    :currentGroup="selectedUnitData?.currentGroup || currentGroup"
    @close="closeTutorModal"
    @tutor-created="onTutorCreated"
  />

  <AddUnitModal
    :isOpen="showUnitModal"
    :moduleId="selectedModuleData?.id || selectedModuleId"
    :currentUnitsCount="selectedModuleData?.units?.length || currentUnitsCount"
    @close="closeUnitModal"
    @unit-created="onUnitCreated"
  />

  <AddAssignmentModal
    :isOpen="showAssignmentModal"
    :unitId="selectedUnitData?.id || selectedUnitId"
    @close="closeAssignmentModal"
    @assignment-created="onAssignmentCreated"
  />
</template>

<script setup>
import { ref, watch, onMounted, computed } from 'vue';
import { gsap } from 'gsap';
import AddTutorModal from './AddTutorModal.vue';
import AddUnitModal from './AddUnitModal.vue';
import AddAssignmentModal from './AddAssignmentModal.vue';
import ProfessorUnitsService from '@/services/professorUnitsService.js';

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true
  },
  selectedUnitId: {
    type: String,
    default: ''
  },
  selectedModuleId: {
    type: String,
    default: ''
  },
  currentGroup: {
    type: String,
    default: ''
  },
  currentUnitsCount: {
    type: Number,
    default: 0
  }
});

const emit = defineEmits(['close', 'tutor-created', 'unit-created', 'assignment-created']);

// State for sub-modals
const showTutorModal = ref(false);
const showUnitModal = ref(false);
const showAssignmentModal = ref(false);

// State for selection flow
const selectedOption = ref(null);
const isLoadingData = ref(false);
const availableModules = ref([]);
const selectedUnitData = ref(null);
const selectedModuleData = ref(null);

// Computed property to check if there are available units
const hasAvailableUnits = computed(() => {
  return availableModules.value.some(module => module.units && module.units.length > 0);
});

// Watch for modal opening to add animations
watch(() => props.isOpen, (newValue) => {
  if (newValue) {
    // Add GSAP animations when modal opens
    setTimeout(() => {
      const modalContainer = document.querySelector('.modal-container');

      if (modalContainer) {
        console.log('Animating modal container...');

        // Set initial states and animate with fallback
        gsap.set(modalContainer, { scale: 0.9, opacity: 0 });
        gsap.to(modalContainer, {
          scale: 1,
          opacity: 1,
          duration: 0.3,
          ease: 'back.out(1.2)',
          onComplete: () => {
            console.log('Modal container animation completed');
            // Ensure modal is visible after animation
            gsap.set(modalContainer, { opacity: 1, scale: 1 });
          }
        });

        // Animate initial option cards
        setTimeout(() => {
          animateOptionCards();
        }, 100);

        // Fallback: ensure modal is visible after 1 second
        setTimeout(() => {
          if (gsap.getProperty(modalContainer, 'opacity') < 1) {
            console.log('Applying fallback visibility for modal container');
            gsap.set(modalContainer, { opacity: 1, scale: 1 });
          }
        }, 1000);
      }
    }, 50);
  }
});

// Watch for selectedOption changes to animate content
watch(selectedOption, (newValue, oldValue) => {
  if (newValue === null && oldValue !== null) {
    // Going back to options - animate option cards
    setTimeout(() => {
      animateOptionCards();
    }, 50);
  }
});

// Helper function to animate option cards
const animateOptionCards = () => {
  setTimeout(() => {
    const optionCards = document.querySelectorAll('.option-card');
    console.log('Animating option cards:', optionCards.length);

    if (optionCards.length > 0) {
      gsap.set(optionCards, { y: 20, opacity: 0 });
      gsap.to(optionCards, {
        y: 0,
        opacity: 1,
        duration: 0.4,
        stagger: 0.08,
        ease: 'power2.out',
        onComplete: () => {
          console.log('Option cards animation completed');
          // Ensure cards are visible after animation but preserve transforms
          optionCards.forEach(card => {
            gsap.set(card, { opacity: 1 });
          });
        }
      });

      // Fallback: ensure cards are visible after 1 second
      setTimeout(() => {
        optionCards.forEach(card => {
          if (gsap.getProperty(card, 'opacity') < 1) {
            console.log('Applying fallback visibility for option card');
            gsap.set(card, { opacity: 1, y: 0 });
          }
        });
      }, 1000);
    }
  }, 50);
};

// Helper function to animate selection items
const animateSelectionItems = () => {
  setTimeout(() => {
    const selectionItems = document.querySelectorAll('.selection-item');
    console.log('Animating selection items:', selectionItems.length);

    if (selectionItems.length > 0) {
      gsap.set(selectionItems, { y: 20, opacity: 0 });
      gsap.to(selectionItems, {
        y: 0,
        opacity: 1,
        duration: 0.4,
        stagger: 0.05,
        ease: 'power2.out',
        onComplete: () => {
          console.log('Selection items animation completed');
          // Ensure items are visible after animation but preserve transforms
          selectionItems.forEach(item => {
            gsap.set(item, { opacity: 1 });
          });
        }
      });

      // Fallback: ensure items are visible after 1 second
      setTimeout(() => {
        selectionItems.forEach(item => {
          if (gsap.getProperty(item, 'opacity') < 1) {
            console.log('Applying fallback visibility for selection item');
            gsap.set(item, { opacity: 1, y: 0 });
          }
        });
      }, 1000);
    }
  }, 50);
};

// Load professor's modules and units
const loadProfessorData = async () => {
  try {
    isLoadingData.value = true;
    const data = await ProfessorUnitsService.getProfessorModulesAndUnits();
    availableModules.value = ProfessorUnitsService.formatForSelection(data);
    console.log('Loaded professor data:', availableModules.value);
  } catch (error) {
    console.error('Error loading professor data:', error);
    availableModules.value = [];
  } finally {
    isLoadingData.value = false;
  }
};

const selectOption = async (option) => {
  selectedOption.value = option;
  await loadProfessorData();

  // Trigger animations for selection items after data loads
  setTimeout(() => {
    animateSelectionItems();
  }, 50);
};

const goBack = () => {
  selectedOption.value = null;
  selectedUnitData.value = null;
  selectedModuleData.value = null;
  availableModules.value = [];

  // The watcher will handle the animation when selectedOption becomes null
};

const getStepDescription = () => {
  switch (selectedOption.value) {
    case 'tutor':
      return 'Select the unit where you want to create the virtual tutor:';
    case 'unit':
      return 'Select the module where you want to add a new unit:';
    case 'assignment':
      return 'Select the unit where you want to create the assignment:';
    default:
      return '';
  }
};

const getNoDataTitle = () => {
  switch (selectedOption.value) {
    case 'tutor':
      return 'No modules with units available';
    case 'unit':
      return 'No modules available';
    case 'assignment':
      return 'No modules with units available';
    default:
      return 'No modules available';
  }
};

const getNoDataMessage = () => {
  switch (selectedOption.value) {
    case 'tutor':
      return 'You need to be assigned to modules with existing units before creating virtual tutors.';
    case 'unit':
      return 'You need to be assigned to modules before creating units.';
    case 'assignment':
      return 'You need to be assigned to modules with existing units before creating assignments.';
    default:
      return 'You need to be assigned to modules before creating content.';
  }
};

const switchToUnitCreation = () => {
  selectedOption.value = 'unit';
};

const createUnit = (moduleId) => {
  console.log('Creating unit for moduleId:', moduleId);
  console.log('Available modules:', availableModules.value);

  const module = availableModules.value.find(m => m.id === moduleId);
  console.log('Found module:', module);

  if (!module) {
    console.error('Module not found for ID:', moduleId);
    return;
  }

  selectedModuleData.value = {
    id: module.id,
    name: module.name,
    course: module.course,
    class: module.class,
    units: module.units || []
  };

  console.log('Selected module data:', selectedModuleData.value);
  closeModal(false, true); // Preserve module data

  setTimeout(() => {
    showUnitModal.value = true;
  }, 100); // Reduced delay for smoother transition
};

const createInUnit = (unitId, unitName, moduleName) => {
  // Store the selected option before closing modal
  const optionType = selectedOption.value;

  // Find the module data to get the complete module information
  const moduleData = availableModules.value.find(module =>
    module.units && module.units.some(unit => unit.id === unitId)
  );

  // Build the currentGroup like in UnitDetailPage.vue
  let currentGroup = '';
  if (moduleData && moduleData.course) {
    currentGroup = `${moduleData.course}${moduleData.class ? ' ' + moduleData.class : ''}`;
  }

  // Set the unit data with complete information
  selectedUnitData.value = {
    id: unitId,
    name: unitName,
    moduleName,
    currentGroup
  };

  // Close the selection modal but preserve unit data
  closeModal(true);

  // Open the appropriate creation modal after a short delay
  setTimeout(() => {
    if (optionType === 'tutor') {
      showTutorModal.value = true;
    } else if (optionType === 'assignment') {
      showAssignmentModal.value = true;
    }
  }, 100); // Reduced delay for smoother transition
};

const closeModal = (preserveUnitData = false, preserveModuleData = false) => {
  selectedOption.value = null;
  if (!preserveUnitData) {
    selectedUnitData.value = null;
  }
  if (!preserveModuleData) {
    selectedModuleData.value = null;
  }
  availableModules.value = [];
  emit('close');
};

// Sub-modal handlers
const closeTutorModal = () => {
  showTutorModal.value = false;
  selectedUnitData.value = null; // Reset unit data when closing
};

const closeUnitModal = () => {
  showUnitModal.value = false;
  selectedModuleData.value = null; // Reset module data when closing
};

const closeAssignmentModal = () => {
  showAssignmentModal.value = false;
  selectedUnitData.value = null; // Reset unit data when closing
};

const onTutorCreated = (tutor) => {
  showTutorModal.value = false;
  selectedUnitData.value = null; // Reset unit data after creation
  emit('tutor-created', tutor);
};

const onUnitCreated = (unit) => {
  showUnitModal.value = false;
  selectedModuleData.value = null; // Reset module data after creation
  emit('unit-created', unit);
};

const onAssignmentCreated = (assignment) => {
  showAssignmentModal.value = false;
  selectedUnitData.value = null; // Reset unit data after creation
  emit('assignment-created', assignment);
};
</script>

<style lang="scss" scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  backdrop-filter: blur(5px);
}

.modal-container {
  background-color: #171717;
  border-radius: 16px;
  padding: 2rem;
  max-width: 600px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(254, 240, 209, 0.1);

  // Prevent initial flash but keep accessible
  opacity: 0;
  transform: scale(0.9);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;

  h2 {
    color: #FEF0D1;
    font-family: 'Poppins', sans-serif;
    font-weight: 700;
    font-size: 1.8rem;
    margin: 0;
  }

  .close-btn {
    background: none;
    border: none;
    color: #FEF0D1;
    font-size: 1.5rem;
    cursor: pointer;
    padding: 0.5rem;
    border-radius: 8px;
    transition: all 0.3s ease;

    &:hover {
      background-color: rgba(254, 240, 209, 0.1);
      transform: scale(1.1);
    }
  }
}

.modal-body {
  .modal-description {
    color: rgba(254, 240, 209, 0.8);
    font-size: 1.1rem;
    margin-bottom: 2rem;
    text-align: center;
  }

  .step-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 2rem;

    .back-btn {
      background: rgba(254, 240, 209, 0.1);
      border: 2px solid rgba(254, 240, 209, 0.2);
      color: #FEF0D1;
      padding: 0.75rem;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;

      &:hover {
        background: rgba(254, 240, 209, 0.2);
        border-color: #e6531d;
        transform: translateX(-3px);
      }

      i {
        font-size: 1.2rem;
      }
    }

    .modal-description {
      margin: 0;
      text-align: left;
      flex: 1;
    }
  }

  .loading-state, .no-data-state {
    text-align: center;
    padding: 3rem 1rem;
    color: #FEF0D1;

    .loading-spinner {
      width: 50px;
      height: 50px;
      border: 4px solid rgba(254, 240, 209, 0.2);
      border-top: 4px solid #e6531d;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 1rem;
    }

    .no-data-icon {
      font-size: 3rem;
      color: #e6531d;
      margin-bottom: 1rem;
    }

    h3 {
      font-size: 1.3rem;
      font-weight: 600;
      margin-bottom: 0.5rem;
    }

    p {
      color: rgba(254, 240, 209, 0.8);
      margin: 0 0 1.5rem 0;
    }

    .no-data-actions {
      margin-top: 1.5rem;

      .create-unit-btn {
        background-color: #007142;
        color: #FEF0D1;
        border: none;
        padding: 0.75rem 1.5rem;
        border-radius: 8px;
        font-weight: 600;
        font-size: 0.9rem;
        cursor: pointer;
        transition: all 0.3s ease;
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;

        &:hover {
          background-color: darken(#007142, 10%);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 113, 66, 0.3);
        }

        i {
          font-size: 0.8rem;
        }
      }
    }
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .options-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: 1.5rem;
  }

  // Prevent initial flash for animated elements but keep accessible
  .option-card, .selection-item {
    opacity: 0;
    transform: translateY(20px);
  }

  .option-card {
    background-color: rgba(254, 240, 209, 0.05);
    border: 2px solid transparent;
    border-radius: 12px;
    padding: 2rem 1.5rem;
    text-align: center;
    cursor: pointer;
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;

    &:hover {
      transform: translateY(-5px);
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
    }

    &.tutor-option {
      border-color: #007142;

      &:hover {
        background-color: rgba(0, 113, 66, 0.1);
        border-color: #007142;
      }

      .option-icon {
        color: #007142;
      }
    }

    &.unit-option {
      border-color: #34307b;

      &:hover {
        background-color: rgba(52, 48, 123, 0.1);
        border-color: #34307b;
      }

      .option-icon {
        color: #34307b;
      }
    }

    &.assignment-option {
      border-color: #e6531d;

      &:hover {
        background-color: rgba(230, 83, 29, 0.1);
        border-color: #e6531d;
      }

      .option-icon {
        color: #e6531d;
      }
    }

    .option-icon {
      font-size: 2.5rem;
      margin-bottom: 1rem;
      display: block;
    }

    h3 {
      color: #FEF0D1;
      font-family: 'Poppins', sans-serif;
      font-weight: 600;
      font-size: 1.2rem;
      margin: 0 0 0.5rem 0;
    }

    p {
      color: rgba(254, 240, 209, 0.7);
      font-size: 0.9rem;
      margin: 0;
      line-height: 1.4;
    }
  }

  .selection-content {
    .modules-list, .units-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .module-group {
      margin-bottom: 2rem;

      .module-group-title {
        color: #e6531d;
        font-size: 1.1rem;
        font-weight: 600;
        margin-bottom: 1rem;
        padding-bottom: 0.5rem;
        border-bottom: 2px solid rgba(230, 83, 29, 0.3);
      }
    }

    .selection-item {
      background: rgba(254, 240, 209, 0.05);
      border: 2px solid rgba(254, 240, 209, 0.1);
      border-radius: 12px;
      padding: 1.5rem;
      cursor: pointer;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      gap: 1rem;

      &:hover {
        background: rgba(254, 240, 209, 0.1);
        border-color: #e6531d;
        transform: translateX(5px);
      }

      .item-icon {
        width: 50px;
        height: 50px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.5rem;
        color: white;
      }

      &.module-item .item-icon {
        background: linear-gradient(135deg, #34307b, #2a2560);
      }

      &.unit-item .item-icon {
        background: linear-gradient(135deg, #007142, #005a35);
      }

      .item-content {
        flex: 1;

        h4 {
          color: #FEF0D1;
          font-size: 1.2rem;
          font-weight: 600;
          margin: 0 0 0.25rem 0;
        }

        p {
          color: rgba(254, 240, 209, 0.8);
          font-size: 0.9rem;
          margin: 0 0 0.5rem 0;
        }

        .item-count {
          color: rgba(254, 240, 209, 0.6);
          font-size: 0.8rem;
          background: rgba(0, 0, 0, 0.2);
          padding: 0.25rem 0.5rem;
          border-radius: 12px;
        }
      }

      .item-arrow {
        color: rgba(254, 240, 209, 0.5);
        font-size: 1.2rem;
        transition: all 0.3s ease;
      }

      &:hover .item-arrow {
        color: #e6531d;
        transform: translateX(3px);
      }
    }
  }
}

@media (max-width: 768px) {
  .modal-container {
    padding: 1.5rem;
    margin: 1rem;
  }

  .options-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .option-card {
    padding: 1.5rem 1rem;
  }
}
</style>
