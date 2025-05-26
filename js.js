// Global variables
let uploadedPhotos = [];
let currentPhotoIndex = -1;

// DOM elements
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const photoGrid = document.getElementById('photoGrid');
const emptyState = document.getElementById('emptyState');
const photoModal = document.getElementById('photoModal');
const modalImage = document.getElementById('modalImage');
const modalClose = document.getElementById('modalClose');
const deleteBtn = document.getElementById('deleteBtn');
const confettiContainer = document.getElementById('confettiContainer');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    createConfetti();
    updatePhotoDisplay();
});

/**
 * Initialize all event listeners
 */
function initializeEventListeners() {
    // Upload area events
    uploadArea.addEventListener('click', () => fileInput.click());
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    uploadArea.addEventListener('drop', handleDrop);
    
    // File input event
    fileInput.addEventListener('change', handleFileSelect);
    
    // Modal events
    modalClose.addEventListener('click', closeModal);
    deleteBtn.addEventListener('click', deleteCurrentPhoto);
    photoModal.addEventListener('click', (e) => {
        if (e.target === photoModal) closeModal();
    });
    
    // Keyboard events
    document.addEventListener('keydown', handleKeydown);
}

/**
 * Handle drag over event
 */
function handleDragOver(e) {
    e.preventDefault();
    uploadArea.classList.add('drag-over');
}

/**
 * Handle drag leave event
 */
function handleDragLeave(e) {
    e.preventDefault();
    uploadArea.classList.remove('drag-over');
}

/**
 * Handle drop event
 */
function handleDrop(e) {
    e.preventDefault();
    uploadArea.classList.remove('drag-over');
    
    const files = Array.from(e.dataTransfer.files);
    processFiles(files);
}

/**
 * Handle file selection from input
 */
function handleFileSelect(e) {
    const files = Array.from(e.target.files);
    processFiles(files);
}

/**
 * Process selected files
 */
function processFiles(files) {
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length === 0) {
        showNotification('Please select valid image files (JPG, PNG, GIF)', 'error');
        return;
    }
    
    if (imageFiles.length > 10) {
        showNotification('Maximum 10 photos can be uploaded at once', 'warning');
        imageFiles.splice(10);
    }
    
    imageFiles.forEach(file => {
        if (file.size > 10 * 1024 * 1024) { // 10MB limit
            showNotification(`File ${file.name} is too large (max 10MB)`, 'error');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(e) {
            const photo = {
                id: generateId(),
                src: e.target.result,
                name: file.name,
                size: file.size,
                uploadDate: new Date()
            };
            
            uploadedPhotos.push(photo);
            updatePhotoDisplay();
            triggerCelebration();
        };
        reader.readAsDataURL(file);
    });
    
    // Reset file input
    fileInput.value = '';
}

/**
 * Generate unique ID
 */
function generateId() {
    return '_' + Math.random().toString(36).substr(2, 9);
}

/**
 * Update photo display
 */
function updatePhotoDisplay() {
    if (uploadedPhotos.length === 0) {
        photoGrid.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }
    
    photoGrid.style.display = 'grid';
    emptyState.style.display = 'none';
    
    photoGrid.innerHTML = '';
    
    uploadedPhotos.forEach((photo, index) => {
        const photoItem = createPhotoElement(photo, index);
        photoGrid.appendChild(photoItem);
    });
}

/**
 * Create photo element
 */
function createPhotoElement(photo, index) {
    const photoItem = document.createElement('div');
    photoItem.className = 'photo-item fade-in';
    photoItem.innerHTML = `
        <img src="${photo.src}" alt="${photo.name}" loading="lazy">
        <div class="photo-overlay">
            <div class="photo-info">
                <div>${photo.name}</div>
                <div>${formatFileSize(photo.size)}</div>
            </div>
        </div>
    `;
    
    photoItem.addEventListener('click', () => openModal(index));
    
    return photoItem;
}

/**
 * Format file size
 */
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Open photo modal
 */
function openModal(index) {
    currentPhotoIndex = index;
    const photo = uploadedPhotos[index];
    
    modalImage.src = photo.src;
    modalImage.alt = photo.name;
    photoModal.style.display = 'block';
    
    // Disable body scroll
    document.body.style.overflow = 'hidden';
}

/**
 * Close photo modal
 */
function closeModal() {
    photoModal.style.display = 'none';
    currentPhotoIndex = -1;
    
    // Enable body scroll
    document.body.style.overflow = 'auto';
}

/**
 * Delete current photo
 */
function deleteCurrentPhoto() {
    if (currentPhotoIndex === -1) return;
    
    if (confirm('Are you sure you want to delete this photo?')) {
        uploadedPhotos.splice(currentPhotoIndex, 1);
        updatePhotoDisplay();
        closeModal();
        showNotification('Photo deleted successfully', 'success');
    }
}

/**
 * Handle keyboard events
 */
function handleKeydown(e) {
    if (photoModal.style.display === 'block') {
        switch(e.key) {
            case 'Escape':
                closeModal();
                break;
            case 'ArrowLeft':
                navigatePhoto(-1);
                break;
            case 'ArrowRight':
                navigatePhoto(1);
                break;
            case 'Delete':
                deleteCurrentPhoto();
                break;
        }
    }
}

/**
 * Navigate between photos in modal
 */
function navigatePhoto(direction) {
    if (uploadedPhotos.length === 0) return;
    
    currentPhotoIndex += direction;
    
    if (currentPhotoIndex < 0) {
        currentPhotoIndex = uploadedPhotos.length - 1;
    } else if (currentPhotoIndex >= uploadedPhotos.length) {
        currentPhotoIndex = 0;
    }
    
    const photo = uploadedPhotos[currentPhotoIndex];
    modalImage.src = photo.src;
    modalImage.alt = photo.name;
}

/**
 * Show notification
 */
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        border-radius: 10px;
        color: white;
        font-weight: 600;
        z-index: 1001;
        animation: slideInRight 0.3s ease;
        max-width: 300px;
        word-wrap: break-word;
    `;
    
    // Set background color based on type
    switch(type) {
        case 'success':
            notification.style.background = 'hsl(120, 70%, 50%)';
            break;
        case 'error':
            notification.style.background = 'hsl(0, 70%, 50%)';
            break;
        case 'warning':
            notification.style.background = 'hsl(45, 70%, 50%)';
            break;
        default:
            notification.style.background = 'hsl(210, 70%, 50%)';
    }
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Auto remove after 4 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 4000);
}

/**
 * Create confetti animation
 */
function createConfetti() {
    const colors = [
        'hsl(330, 100%, 70%)',
        'hsl(280, 100%, 75%)',
        'hsl(200, 100%, 70%)',
        'hsl(30, 100%, 65%)',
        'hsl(55, 100%, 70%)'
    ];
    
    function createConfettiPiece() {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = Math.random() * 100 + '%';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.animationDuration = (Math.random() * 3 + 2) + 's';
        confetti.style.animationDelay = Math.random() * 2 + 's';
        
        confettiContainer.appendChild(confetti);
        
        // Remove confetti after animation
        setTimeout(() => {
            if (confetti.parentNode) {
                confetti.parentNode.removeChild(confetti);
            }
        }, 5000);
    }
    
    // Create initial confetti
    for (let i = 0; i < 20; i++) {
        setTimeout(createConfettiPiece, i * 100);
    }
    
    // Continue creating confetti periodically
    setInterval(() => {
        if (Math.random() < 0.3) { // 30% chance every interval
            createConfettiPiece();
        }
    }, 2000);
}

/**
 * Trigger celebration animation when photo is uploaded
 */
function triggerCelebration() {
    // Create burst of confetti
    for (let i = 0; i < 10; i++) {
        setTimeout(() => {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.left = Math.random() * 100 + '%';
            confetti.style.backgroundColor = [
                'hsl(330, 100%, 70%)',
                'hsl(280, 100%, 75%)',
                'hsl(200, 100%, 70%)',
                'hsl(30, 100%, 65%)',
                'hsl(55, 100%, 70%)'
            ][Math.floor(Math.random() * 5)];
            confetti.style.animationDuration = '2s';
            
            confettiContainer.appendChild(confetti);
            
            setTimeout(() => {
                if (confetti.parentNode) {
                    confetti.parentNode.removeChild(confetti);
                }
            }, 2000);
        }, i * 50);
    }
    
    showNotification('Photo added to your birthday gallery! 🎉', 'success');
}

// Add CSS animations for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);