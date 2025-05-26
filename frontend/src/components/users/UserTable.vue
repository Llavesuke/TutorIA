<template>
  <div class="user-table-container">
    <!-- Search and filters -->
    <div class="table-controls">
      <div class="search-container">
        <i class="fas fa-search search-icon"></i>
        <input
          type="text"
          :placeholder="`Search ${userType.toLowerCase()}`"
          v-model="searchQuery"
          class="search-input"
        />
      </div>

      <div class="filters">
        <div class="filter-dropdown">
          <select v-model="aiInteractionFilter">
            <option value="all">AI Interaction</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        <div class="filter-dropdown">
          <select v-model="statusFilter">
            <option value="all">Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        <!-- Filtro de Grade (solo visible para estudiantes) -->
        <div class="filter-dropdown" v-if="userType === 'Student'">
          <select v-model="gradeFilter">
            <option value="all">Grade</option>
            <option value="1º ESO">1º ESO</option>
            <option value="2º ESO">2º ESO</option>
            <option value="3º ESO">3º ESO</option>
            <option value="4º ESO">4º ESO</option>
            <option value="1º BACH">1º BACH</option>
            <option value="2º BACH">2º BACH</option>
          </select>
        </div>

        <!-- Filtro de Class (solo visible para estudiantes) -->
        <div class="filter-dropdown" v-if="userType === 'Student'">
          <select v-model="classFilter">
            <option value="all">Class</option>
            <option value="A">A</option>
            <option value="B">B</option>
            <option value="C">C</option>
            <option value="D">D</option>
          </select>
        </div>
      </div>

      <button class="add-user-btn" @click="$emit('add-user')">
        <i class="fas fa-plus"></i> Add {{ userType }}
      </button>
    </div>

    <!-- Table -->
    <div class="table-wrapper">
      <table class="user-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Last activity</th>
            <th>Date</th>
            <th v-if="userType === 'Student'">Grade</th>
            <th v-if="userType === 'Student'">Class</th>
            <th>AI Interaction</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in filteredUsers" :key="user.id">
            <td class="user-name">
              <div class="user-avatar" v-if="user.avatar">
                <img :src="user.avatar" :alt="user.name">
              </div>
              <div class="user-avatar default-avatar" v-else>
                <span>{{ getUserInitials(user.name) }}</span>
              </div>
              <span>{{ user.name }}</span>
            </td>
            <td>{{ user.lastActivity }}</td>
            <td>{{ formatDate(user.date) }}</td>
            <td v-if="userType === 'Student'" class="grade-cell">{{ user.curso || 'Not assigned' }}</td>
            <td v-if="userType === 'Student'" class="class-cell">
              <span v-if="user.clase" class="class-badge">{{ user.clase }}</span>
              <span v-else class="not-assigned">Not assigned</span>
            </td>
            <td>
              <span :class="['ai-interaction-badge', user.aiInteraction.toLowerCase()]">
                {{ user.aiInteraction }}
              </span>
            </td>
            <td>
              <span :class="['status-badge', user.status.toLowerCase()]">
                {{ user.status }}
              </span>
            </td>
            <td>
              <div class="action-buttons">
                <button class="delete-btn" @click="$emit('delete-user', user.id)" aria-label="Delete user">
                  <i class="fas fa-trash-alt"></i>
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="filteredUsers.length === 0">
            <td :colspan="userType === 'Student' ? 8 : 6" class="no-results">
              {{ noUsersMessage }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div class="pagination">
      <button
        class="pagination-btn"
        :disabled="currentPage === 1"
        @click="changePage(currentPage - 1)"
      >
        Previous
      </button>

      <div class="page-numbers">
        <button
          v-for="page in totalPages"
          :key="page"
          :class="['page-number', { active: currentPage === page }]"
          @click="changePage(page)"
        >
          {{ page }}
        </button>
      </div>

      <button
        class="pagination-btn"
        :disabled="currentPage === totalPages"
        @click="changePage(currentPage + 1)"
      >
        Next
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';

const props = defineProps({
  users: {
    type: Array,
    required: true
  },
  userType: {
    type: String,
    default: 'User'
  },
  itemsPerPage: {
    type: Number,
    default: 10
  }
});

const emit = defineEmits(['add-user', 'delete-user']);

// State
const searchQuery = ref('');
const aiInteractionFilter = ref('all');
const statusFilter = ref('all');
const gradeFilter = ref('all');
const classFilter = ref('all');
const currentPage = ref(1);

// Reset to page 1 when filters change
watch([searchQuery, aiInteractionFilter, statusFilter, gradeFilter, classFilter], () => {
  currentPage.value = 1;
});

// Filtered users
const filteredUsers = computed(() => {
  let result = [...props.users];

  // Apply search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(user =>
      user.name.toLowerCase().includes(query)
    );
  }

  // Apply AI interaction filter
  if (aiInteractionFilter.value !== 'all') {
    result = result.filter(user =>
      user.aiInteraction.toLowerCase() === aiInteractionFilter.value
    );
  }

  // Apply status filter
  if (statusFilter.value !== 'all') {
    result = result.filter(user =>
      user.status.toLowerCase() === statusFilter.value
    );
  }

  // Apply grade filter (solo para estudiantes)
  if (props.userType === 'Student' && gradeFilter.value !== 'all') {
    result = result.filter(user =>
      user.curso === gradeFilter.value
    );
  }

  // Apply class filter (solo para estudiantes)
  if (props.userType === 'Student' && classFilter.value !== 'all') {
    result = result.filter(user =>
      user.clase === classFilter.value
    );
  }

  return result;
});

// Pagination
const totalPages = computed(() => {
  return Math.ceil(filteredUsers.value.length / props.itemsPerPage);
});

const paginatedUsers = computed(() => {
  const start = (currentPage.value - 1) * props.itemsPerPage;
  const end = start + props.itemsPerPage;
  return filteredUsers.value.slice(start, end);
});

// Mensaje personalizado cuando no hay usuarios
const noUsersMessage = computed(() => {
  if (searchQuery.value || aiInteractionFilter.value !== 'all' || statusFilter.value !== 'all' ||
      (props.userType === 'Student' && (gradeFilter.value !== 'all' || classFilter.value !== 'all'))) {
    return `No ${props.userType.toLowerCase()}s found with the selected filters`;
  }

  return `No ${props.userType.toLowerCase()}s found in this educational center`;
});

// Methods
const changePage = (page) => {
  currentPage.value = page;
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString();
};

const getUserInitials = (name) => {
  return name
    .split(' ')
    .map(part => part.charAt(0))
    .join('')
    .toUpperCase();
};
</script>

<style lang="scss" scoped>
@use '@/assets/sass/components/_user_table.scss';
</style>
