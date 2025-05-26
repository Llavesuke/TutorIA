<template>
  <div class="modal-backdrop" :class="{ 'active': isOpen }" @click.self="closeModal">
    <div class="modal" :class="{ 'active': isOpen }">
      <div class="modal-header">
        <h3 class="modal-title">Submit Assignment</h3>
        <button class="modal-close" @click="closeModal" aria-label="Close modal">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <div class="modal-body">
        <!-- Assignment info -->
        <div class="assignment-info">
          <h4>{{ assignment.titulo }}</h4>
          <p class="assignment-description">{{ assignment.descripcion }}</p>
          <div class="assignment-meta">
            <span class="due-date">
              <i class="fas fa-calendar-alt"></i> Due: {{ formattedDueDate }}
            </span>
            <span class="points">
              <i class="fas fa-star"></i> {{ assignment.puntuacion_maxima || 100 }} points
            </span>
          </div>
        </div>

        <!-- Error message -->
        <div v-if="errorMessage" class="error-message">
          <i class="fas fa-exclamation-circle"></i> {{ errorMessage }}
        </div>

        <!-- Success message -->
        <div v-if="showSuccess" class="success-message">
          <i class="fas fa-check-circle"></i> Assignment submitted successfully!
        </div>

        <form @submit.prevent="submitAssignment" class="submission-form">
          <!-- Text response section (if allowed) -->
          <div v-if="assignment.permitir_texto || assignment.permitirTexto" class="form-group">
            <label for="textResponse" class="form-label">Your Response</label>
            <textarea
              id="textResponse"
              v-model="textResponse"
              class="form-control"
              placeholder="Type your response here..."
              rows="6"
              :disabled="isSubmitting"
            ></textarea>
          </div>

          <!-- File upload section (if allowed) -->
          <div v-if="assignment.permitir_archivos || assignment.permitirArchivos" class="form-group">
            <label class="form-label">Upload Files</label>
            <div class="file-upload-container">
              <div class="upload-files-btn" @click="triggerFileInput">
                <i class="fas fa-upload"></i>
                <span>Select Files</span>
                <input
                  type="file"
                  ref="fileInput"
                  @change="handleFileChange"
                  multiple
                  class="hidden-file-input"
                  :disabled="isSubmitting"
                />
              </div>
              <p class="upload-hint">Supported formats: PDF, DOC, DOCX, PPT, PPTX, TXT, JPG, PNG</p>
            </div>
          </div>

          <!-- Selected files preview -->
          <div v-if="selectedFiles.length > 0" class="selected-files-section">
            <label class="form-label">Selected Files</label>
            <div class="selected-files-container">
              <div
                v-for="(file, index) in selectedFiles"
                :key="index"
                class="selected-file-item"
              >
                <div class="file-icon">
                  <i :class="getFileIconClass(file)"></i>
                </div>
                <div class="file-info">
                  <span class="file-name">{{ file.name }}</span>
                  <span class="file-size">{{ formatFileSize(file.size) }}</span>
                </div>
                <button
                  type="button"
                  class="remove-file-btn"
                  @click="removeFile(index)"
                  :disabled="isSubmitting"
                >
                  <i class="fas fa-times"></i>
                </button>
              </div>
            </div>
          </div>

          <div class="form-actions">
            <button
              type="button"
              class="cancel-btn"
              @click="closeModal"
              :disabled="isSubmitting"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="submit-btn"
              :disabled="isSubmitting || !isFormValid"
            >
              <span v-if="isSubmitting">
                <i class="fas fa-spinner fa-spin"></i> Submitting...
              </span>
              <span v-else>Submit Assignment</span>
            </button>
          </div>
        </form>

        <!-- Loading indicator -->
        <div v-if="isSubmitting" class="loading-container">
          <div class="loading-spinner"></div>
          <p>Uploading files and submitting your assignment...</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import AssignmentService from '@/services/assignmentService';
import ApiService from '@/services/apiService';
import authStore from '@/stores/authStore';

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true
  },
  assignment: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['close', 'submission-created']);

// State
const textResponse = ref('');
const selectedFiles = ref([]);
const isSubmitting = ref(false);
const errorMessage = ref('');
const showSuccess = ref(false);
const fileInput = ref(null);

// Reset form when modal opens
watch(() => props.isOpen, (newValue) => {
  if (newValue) {
    resetForm();
  }
});

// Computed properties
const formattedDueDate = computed(() => {
  if (!props.assignment || !props.assignment.fecha_entrega) return '';

  const date = new Date(props.assignment.fecha_entrega);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
});

const isFormValid = computed(() => {
  const hasText = textResponse.value.trim() !== '';
  const hasFiles = selectedFiles.value.length > 0;

  // At least one of text or files must be provided
  return hasText || hasFiles;
});

// Methods
const resetForm = () => {
  textResponse.value = '';
  selectedFiles.value = [];
  errorMessage.value = '';
  showSuccess.value = false;
  isSubmitting.value = false;
};

const triggerFileInput = () => {
  fileInput.value.click();
};

const handleFileChange = (event) => {
  const files = event.target.files;
  if (files && files.length > 0) {
    // Add new files to the selectedFiles array
    for (let i = 0; i < files.length; i++) {
      selectedFiles.value.push(files[i]);
    }
  }
  // Reset the file input to allow selecting the same file again
  event.target.value = '';
};

const removeFile = (index) => {
  selectedFiles.value.splice(index, 1);
};

const getFileIconClass = (file) => {
  const extension = file.name.split('.').pop().toLowerCase();

  switch (extension) {
    case 'pdf':
      return 'fas fa-file-pdf';
    case 'doc':
    case 'docx':
      return 'fas fa-file-word';
    case 'ppt':
    case 'pptx':
      return 'fas fa-file-powerpoint';
    case 'txt':
      return 'fas fa-file-alt';
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
      return 'fas fa-file-image';
    default:
      return 'fas fa-file';
  }
};

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const submitAssignment = async () => {
  try {
    if (!isFormValid.value) {
      errorMessage.value = 'Please provide a text response or upload files';
      return;
    }

    isSubmitting.value = true;
    errorMessage.value = '';
    showSuccess.value = false;

    // Array para almacenar los resultados de las subidas
    const uploadedFileUrls = [];

    // Subir archivos a Cloudinary primero (si hay archivos seleccionados)
    if (selectedFiles.value.length > 0) {
      try {
        // Mostrar mensaje de carga
        const loadingMessage = document.createElement('div');
        loadingMessage.className = 'upload-progress-message';
        loadingMessage.innerHTML = `<i class="fas fa-cloud-upload-alt"></i> Uploading files (0/${selectedFiles.value.length})...`;
        document.body.appendChild(loadingMessage);

        // Subir cada archivo individualmente
        for (let i = 0; i < selectedFiles.value.length; i++) {
          const file = selectedFiles.value[i];

          // Actualizar mensaje de progreso
          loadingMessage.innerHTML = `<i class="fas fa-cloud-upload-alt"></i> Uploading files (${i+1}/${selectedFiles.value.length})...`;

          // Crear FormData para este archivo
          const formData = new FormData();
          formData.append('file', file);

          console.log(`Subiendo archivo ${i+1}/${selectedFiles.value.length}: ${file.name} (${file.type}, ${file.size} bytes)`);

          try {
            // Subir archivo a Cloudinary a través del backend
            const uploadResult = await ApiService.post('/api/uploads/assignment', formData, {
              headers: {
                'Content-Type': 'multipart/form-data',
                'Authorization': `Bearer ${authStore.token.value}`
              }
            });

            console.log(`Archivo ${i+1} subido exitosamente:`, uploadResult);

            if (uploadResult && uploadResult.url) {
              uploadedFileUrls.push({
                name: file.name,
                url: uploadResult.url,
                type: file.type,
                size: file.size
              });
            } else {
              throw new Error(`No se recibió URL para el archivo: ${file.name}`);
            }
          } catch (singleUploadError) {
            console.error(`Error al subir archivo ${i+1}:`, singleUploadError);
            // Continuamos con el siguiente archivo en lugar de abortar todo el proceso
          }
        }

        // Eliminar mensaje de progreso
        document.body.removeChild(loadingMessage);

        // Verificar si se subió al menos un archivo
        if (uploadedFileUrls.length === 0 && selectedFiles.value.length > 0) {
          throw new Error('No se pudo subir ningún archivo. Por favor, inténtelo de nuevo.');
        }

      } catch (uploadError) {
        console.error('Error general al subir archivos:', uploadError);
        errorMessage.value = uploadError.message || 'Error al subir archivos. Por favor, inténtelo de nuevo.';
        isSubmitting.value = false;
        return;
      }
    }

    console.log(`Se subieron ${uploadedFileUrls.length} archivos exitosamente:`, uploadedFileUrls);

    // Preparar datos para enviar la tarea
    const submissionData = {
      textoRespuesta: textResponse.value.trim(),
      archivosUrls: uploadedFileUrls.length > 0 ? uploadedFileUrls.map(file => ({
        name: file.name,
        url: file.url,
        type: file.type || 'unknown',
        size: file.size || 0
      })) : null
    };

    console.log('Enviando datos de submission:', JSON.stringify(submissionData));

    try {
      // Enviar la respuesta a la tarea
      const result = await AssignmentService.submitAssignmentResponse(props.assignment.id, submissionData);

      console.log('Tarea enviada exitosamente:', result);

      // Mostrar mensaje de éxito
      showSuccess.value = true;

      // Emitir evento al componente padre
      emit('submission-created', result);

      // Cerrar modal después de un breve retraso
      setTimeout(() => {
        closeModal();
      }, 2000);
    } catch (submissionError) {
      console.error('Error al enviar datos de la tarea:', submissionError);
      errorMessage.value = submissionError.message || 'Error al enviar la tarea. Por favor, inténtelo de nuevo.';
    }

  } catch (error) {
    console.error('Error general en submitAssignment:', error);
    errorMessage.value = error.message || 'Ocurrió un error inesperado. Por favor, inténtelo de nuevo.';
  } finally {
    isSubmitting.value = false;
  }
};

const closeModal = () => {
  if (!isSubmitting.value) {
    resetForm();
    emit('close');
  }
};
</script>

<style lang="scss" scoped>
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.3s ease, visibility 0.3s ease;

  &.active {
    opacity: 1;
    visibility: visible;
  }
}

.modal {
  background-color: #171717;
  border-radius: 12px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  transform: translateY(20px);
  opacity: 0;
  transition: transform 0.3s ease, opacity 0.3s ease;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
  color: #FEF0D1;

  &.active {
    transform: translateY(0);
    opacity: 1;
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);

  .modal-title {
    margin: 0;
    font-size: 1.5rem;
    color: #FEF0D1;
  }

  .modal-close {
    background: none;
    border: none;
    color: #FEF0D1;
    font-size: 1.2rem;
    cursor: pointer;
    transition: color 0.3s;

    &:hover {
      color: var(--color-orange);
    }
  }
}

.modal-body {
  padding: 1.5rem;
}

.assignment-info {
  margin-bottom: 1.5rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);

  h4 {
    margin-top: 0;
    margin-bottom: 0.5rem;
    font-size: 1.3rem;
    color: var(--color-orange);
  }

  .assignment-description {
    margin-bottom: 1rem;
    color: rgba(254, 240, 209, 0.8);
    font-size: 0.95rem;
  }

  .assignment-meta {
    display: flex;
    gap: 1.5rem;
    font-size: 0.9rem;
    color: rgba(254, 240, 209, 0.7);

    i {
      margin-right: 0.5rem;
    }
  }
}

.form-group {
  margin-bottom: 1.5rem;

  .form-label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
  }

  .form-control {
    width: 100%;
    padding: 0.8rem;
    background-color: rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 6px;
    color: #FEF0D1;
    font-size: 1rem;
    transition: border-color 0.3s;

    &:focus {
      outline: none;
      border-color: var(--color-orange);
    }
  }
}

.file-upload-container {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  .upload-files-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.8rem 1.5rem;
    background-color: rgba(52, 48, 123, 0.5);
    border: 1px solid rgba(52, 48, 123, 0.8);
    border-radius: 6px;
    color: #FEF0D1;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.3s;

    &:hover {
      background-color: rgba(52, 48, 123, 0.7);
    }

    .hidden-file-input {
      display: none;
    }
  }

  .upload-hint {
    font-size: 0.8rem;
    color: rgba(254, 240, 209, 0.6);
    margin: 0.5rem 0 0;
  }
}

.selected-files-section {
  margin-bottom: 1.5rem;
}

.selected-files-container {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-height: 200px;
  overflow-y: auto;
  padding: 0.5rem;
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 6px;
}

.selected-file-item {
  display: flex;
  align-items: center;
  padding: 0.5rem;
  background-color: rgba(0, 0, 0, 0.3);
  border-radius: 4px;
  transition: background-color 0.3s;

  &:hover {
    background-color: rgba(0, 0, 0, 0.4);
  }

  .file-icon {
    font-size: 1.2rem;
    width: 30px;
    text-align: center;
    color: var(--color-orange);
  }

  .file-info {
    flex: 1;
    margin-left: 0.5rem;
    overflow: hidden;

    .file-name {
      display: block;
      font-size: 0.9rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .file-size {
      display: block;
      font-size: 0.8rem;
      color: rgba(254, 240, 209, 0.6);
    }
  }

  .remove-file-btn {
    background: none;
    border: none;
    color: rgba(254, 240, 209, 0.6);
    cursor: pointer;
    transition: color 0.3s;
    padding: 0.3rem;

    &:hover {
      color: var(--color-orange);
    }
  }
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;

  .cancel-btn {
    padding: 0.8rem 1.5rem;
    background: none;
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 6px;
    color: #FEF0D1;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.3s;

    &:hover {
      background-color: rgba(255, 255, 255, 0.1);
    }
  }

  .submit-btn {
    padding: 0.9rem 1.8rem;
    background: linear-gradient(135deg, #e6531d 0%, #ff7043 100%);
    border: none;
    border-radius: 30px;
    color: white;
    font-size: 1.05rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.23, 1, 0.32, 1);
    box-shadow: 0 4px 12px rgba(230, 83, 29, 0.3);
    position: relative;
    overflow: hidden;

    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, #ff7043 0%, #e6531d 100%);
      opacity: 0;
      transition: opacity 0.3s ease;
    }

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(230, 83, 29, 0.4);

      &::before {
        opacity: 1;
      }
    }

    &:disabled {
      background: linear-gradient(135deg, rgba(230, 83, 29, 0.5) 0%, rgba(255, 112, 67, 0.5) 100%);
      cursor: not-allowed;
      transform: none;
      box-shadow: none;

      &::before {
        opacity: 0;
      }
    }

    span {
      position: relative;
      z-index: 1;
    }
  }
}

.error-message {
  padding: 1.2rem;
  background-color: rgba(244, 67, 54, 0.15);
  border: 1px solid rgba(244, 67, 54, 0.3);
  border-left: 4px solid #f44336;
  border-radius: 6px;
  margin-bottom: 1.5rem;
  color: #FEF0D1;
  font-weight: 500;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
  animation: errorPulse 2s infinite;

  @keyframes errorPulse {
    0% {
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
    }
    50% {
      box-shadow: 0 4px 15px rgba(244, 67, 54, 0.3);
    }
    100% {
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
    }
  }

  i {
    margin-right: 0.8rem;
    color: #f44336;
    font-size: 1.2rem;
  }
}

.success-message {
  padding: 1rem;
  background-color: rgba(0, 113, 66, 0.2);
  border-left: 3px solid #007142;
  border-radius: 4px;
  margin-bottom: 1.5rem;
  color: #FEF0D1;

  i {
    margin-right: 0.5rem;
    color: #007142;
  }
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem 0;

  .loading-spinner {
    border: 4px solid rgba(255, 255, 255, 0.1);
    border-radius: 50%;
    border-top: 4px solid var(--color-orange);
    width: 40px;
    height: 40px;
    animation: spin 1s linear infinite;
    margin-bottom: 1rem;
  }

  p {
    color: rgba(254, 240, 209, 0.8);
  }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

// Upload progress message
.upload-progress-message {
  position: fixed;
  top: 30px;
  left: 50%;
  transform: translateX(-50%);
  background-color: var(--color-purple);
  color: white;
  padding: 1rem 2rem;
  border-radius: 8px;
  box-shadow: 0 4px 15px rgba(52, 48, 123, 0.4);
  z-index: 1000;
  display: flex;
  align-items: center;
  gap: 0.8rem;
  font-weight: 500;
  animation: pulse 1.5s infinite;

  @keyframes pulse {
    0% {
      box-shadow: 0 4px 15px rgba(52, 48, 123, 0.4);
    }
    50% {
      box-shadow: 0 4px 20px rgba(52, 48, 123, 0.7);
    }
    100% {
      box-shadow: 0 4px 15px rgba(52, 48, 123, 0.4);
    }
  }

  i {
    font-size: 1.5rem;
  }
}

@media (max-width: 768px) {
  .modal {
    width: 95%;
  }
}
</style>
