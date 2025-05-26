<template>
  <div class="search-container" :class="{ 'active': isActive }">
    <div class="search-input-wrapper">
      <button 
        class="search-icon-btn" 
        @click="toggleSearch" 
        aria-label="Toggle search"
      >
        <i class="fas fa-search"></i>
      </button>
      
      <input
        ref="searchInput"
        type="text"
        class="search-input"
        placeholder="Search for students, tutors, or modules..."
        v-model="searchQuery"
        @focus="isActive = true"
        @blur="handleBlur"
        @keyup.enter="performSearch"
      />
      
      <button 
        v-if="isActive && searchQuery" 
        class="clear-btn" 
        @click="clearSearch" 
        aria-label="Clear search"
      >
        <i class="fas fa-times"></i>
      </button>
    </div>
    
    <div v-if="isActive && searchQuery && searchResults.length > 0" class="search-results">
      <div class="results-header">
        <span>Search Results</span>
        <button class="close-results-btn" @click="closeResults" aria-label="Close search results">
          <i class="fas fa-times"></i>
        </button>
      </div>
      
      <div class="results-list">
        <div 
          v-for="(result, index) in searchResults" 
          :key="index" 
          class="result-item"
          @click="selectResult(result)"
        >
          <div class="result-icon" :class="result.type">
            <i class="fas" :class="getIconClass(result.type)"></i>
          </div>
          <div class="result-content">
            <p class="result-title">{{ result.title }}</p>
            <span class="result-category">{{ result.category }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue';

const isActive = ref(false);
const searchQuery = ref('');
const searchInput = ref(null);
const searchResults = ref([]);

// Función para alternar la búsqueda
const toggleSearch = () => {
  isActive.value = !isActive.value;
  if (isActive.value) {
    nextTick(() => {
      searchInput.value.focus();
    });
  }
};

// Función para manejar el evento blur
const handleBlur = (event) => {
  // No desactivar si se hace clic en los resultados
  if (!event.relatedTarget || !event.relatedTarget.closest('.search-results')) {
    // Pequeño retraso para permitir clics en los resultados
    setTimeout(() => {
      if (!document.activeElement.closest('.search-container')) {
        isActive.value = false;
      }
    }, 100);
  }
};

// Función para limpiar la búsqueda
const clearSearch = () => {
  searchQuery.value = '';
  searchResults.value = [];
  searchInput.value.focus();
};

// Función para cerrar los resultados
const closeResults = () => {
  searchResults.value = [];
  searchQuery.value = '';
  isActive.value = false;
};

// Función para seleccionar un resultado
const selectResult = (result) => {
  console.log('Selected result:', result);
  // Aquí se podría navegar a la página del resultado
  closeResults();
};

// Función para realizar la búsqueda
const performSearch = () => {
  if (!searchQuery.value) {
    searchResults.value = [];
    return;
  }
  
  // Simulación de resultados de búsqueda
  setTimeout(() => {
    searchResults.value = [
      {
        type: 'student',
        title: 'Maria García',
        category: 'Student'
      },
      {
        type: 'tutor',
        title: 'Physics Tutor',
        category: 'Virtual Tutor'
      },
      {
        type: 'module',
        title: 'Introduction to Quantum Mechanics',
        category: 'Module'
      }
    ].filter(result => 
      result.title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      result.category.toLowerCase().includes(searchQuery.value.toLowerCase())
    );
  }, 300);
};

// Función para obtener la clase de icono según el tipo
const getIconClass = (type) => {
  switch (type) {
    case 'student':
      return 'fa-user-graduate';
    case 'tutor':
      return 'fa-robot';
    case 'module':
      return 'fa-book';
    default:
      return 'fa-search';
  }
};

// Observar cambios en la consulta de búsqueda
watch(searchQuery, (newValue) => {
  if (newValue) {
    performSearch();
  } else {
    searchResults.value = [];
  }
});
</script>

<style lang="scss" scoped>
.search-container {
  position: relative;
  width: 40px;
  height: 40px;
  transition: all 0.3s ease;
  
  &.active {
    width: 300px;
    
    .search-input {
      width: 100%;
      padding-left: 40px;
      padding-right: 40px;
      opacity: 1;
    }
    
    .search-icon-btn {
      color: #e6531d;
    }
  }
  
  .search-input-wrapper {
    position: relative;
    width: 100%;
    height: 100%;
  }
  
  .search-icon-btn {
    position: absolute;
    top: 0;
    left: 0;
    width: 40px;
    height: 40px;
    background: transparent;
    border: none;
    color: #fef0d1;
    font-size: 1rem;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    z-index: 2;
    transition: color 0.2s ease;
    
    &:hover {
      color: #e6531d;
    }
  }
  
  .search-input {
    position: absolute;
    top: 0;
    left: 0;
    width: 40px;
    height: 40px;
    background-color: rgba(255, 255, 255, 0.05);
    border: none;
    border-radius: 20px;
    padding: 0 40px;
    color: #fef0d1;
    font-size: 0.9rem;
    opacity: 0;
    transition: all 0.3s ease;
    
    &:focus {
      outline: none;
      box-shadow: 0 0 0 2px rgba(230, 83, 29, 0.3);
    }
    
    &::placeholder {
      color: rgba(254, 240, 209, 0.5);
    }
  }
  
  .clear-btn {
    position: absolute;
    top: 0;
    right: 0;
    width: 40px;
    height: 40px;
    background: transparent;
    border: none;
    color: rgba(254, 240, 209, 0.5);
    font-size: 0.8rem;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    z-index: 2;
    transition: color 0.2s ease;
    
    &:hover {
      color: #e6531d;
    }
  }
  
  .search-results {
    position: absolute;
    top: 45px;
    left: 0;
    width: 100%;
    background-color: #1e1e1e;
    border-radius: 8px;
    box-shadow: 0 5px 20px rgba(0, 0, 0, 0.3);
    z-index: 10;
    overflow: hidden;
    
    .results-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem 1rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      
      span {
        font-size: 0.9rem;
        font-weight: 500;
        color: rgba(254, 240, 209, 0.7);
      }
      
      .close-results-btn {
        background: transparent;
        border: none;
        color: rgba(254, 240, 209, 0.5);
        font-size: 0.8rem;
        cursor: pointer;
        padding: 0.25rem;
        transition: color 0.2s ease;
        
        &:hover {
          color: #e6531d;
        }
      }
    }
    
    .results-list {
      max-height: 300px;
      overflow-y: auto;
      
      .result-item {
        display: flex;
        align-items: center;
        padding: 0.75rem 1rem;
        cursor: pointer;
        transition: background-color 0.2s ease;
        
        &:hover {
          background-color: rgba(255, 255, 255, 0.05);
        }
        
        .result-icon {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 0.75rem;
          flex-shrink: 0;
          
          &.student {
            background-color: rgba(33, 150, 243, 0.1);
            color: #2196f3;
          }
          
          &.tutor {
            background-color: rgba(0, 113, 66, 0.1);
            color: #007142;
          }
          
          &.module {
            background-color: rgba(230, 83, 29, 0.1);
            color: #e6531d;
          }
        }
        
        .result-content {
          flex: 1;
          
          .result-title {
            margin: 0 0 0.25rem 0;
            font-size: 0.9rem;
            color: #fef0d1;
          }
          
          .result-category {
            font-size: 0.75rem;
            color: rgba(254, 240, 209, 0.5);
          }
        }
      }
    }
  }
}
</style>
