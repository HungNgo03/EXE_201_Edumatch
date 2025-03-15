document.addEventListener('DOMContentLoaded', function() {
    // Toggle sidebar
    const menuToggle = document.getElementById('menu-toggle');
    const sidebar = document.querySelector('.sidebar');
    
    if (menuToggle) {
        menuToggle.addEventListener('click', function() {
            sidebar.classList.toggle('collapsed');
        });
    }
    
    // Logout functionality
    const logoutBtn = document.querySelector('.logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            // Clear session/localStorage
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            // Redirect to login
            window.location.href = 'index.html';
        });
    }

    // Post URL - replace with your actual Post base URL
    const Post_BASE_URL = 'http://localhost:8080/Post'; // Adjust this to your actual Post URL
    
    // Modal elements
    const confirmationModal = document.getElementById('confirmation-modal');
    const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
    const cancelDeleteBtn = document.getElementById('cancel-delete-btn');
    const confirmCloseBtn = document.getElementById('confirm-close-btn');
    
    let postIdToDelete = null;
    
    // Search functionality
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            filterPosts(this.value);
        });
    }
    
    // Load all posts when the page loads
    loadPosts();
    
    // Function to load all posts from the Post
    function loadPosts() {
        fetch(`${Post_BASE_URL}/getAllPost`)
            .then(response => response.json())
            .then(data => {
                if (data.status === 200) {
                    displayPosts(data.result); // Changed from data.data to data.result
                } else {
                    showAlert('Error', 'Failed to load posts', 'error');
                }
            })
            .catch(error => {
                console.error('Error loading posts:', error);
                showAlert('Error', 'Failed to load posts', 'error');
            });
    }
    
    // Function to display posts in the table
    function displayPosts(posts) {
        const tableBody = document.getElementById('posts-table-body');
        tableBody.innerHTML = '';
        
        if (posts && posts.length > 0) {
            posts.forEach(post => {
                const row = document.createElement('tr');
                row.dataset.postId = post.id;
                
                // Format date if it exists (using createdAt instead of createDate)
                const createdAt = post.createdAt ? new Date(post.createdAt).toLocaleDateString('vi-VN') : 'N/A';
                
                // Truncate content if it's too long
                const truncatedContent = post.content && post.content.length > 50 
                    ? post.content.substring(0, 47) + '...' 
                    : post.content || 'N/A';
                
                row.innerHTML = `
                    <td>${post.id || 'N/A'}</td>
                    <td>${post.title || 'N/A'}</td>
                    <td>${truncatedContent}</td>
                    <td>${post.username || 'N/A'}</td>
                    <td>${createdAt}</td>
                    <td>${post.rating || 0}</td>
                    <td>
                        <button class="action-btn delete-btn" data-id="${post.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                `;
                
                tableBody.appendChild(row);
            });
            
            // Add event listeners to delete buttons
            document.querySelectorAll('.delete-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    const postId = this.getAttribute('data-id');
                    openDeleteConfirmation(postId);
                });
            });
        } else {
            const row = document.createElement('tr');
            row.innerHTML = '<td colspan="7" class="no-data">Không có bài viết nào</td>';
            tableBody.appendChild(row);
        }
    }
    
    // Function to filter posts based on search term
    function filterPosts(searchTerm) {
        const rows = document.querySelectorAll('#posts-table-body tr');
        searchTerm = searchTerm.toLowerCase();
        
        rows.forEach(row => {
            const title = row.cells[1].textContent.toLowerCase();
            const content = row.cells[2].textContent.toLowerCase();
            const author = row.cells[3].textContent.toLowerCase();
            
            if (title.includes(searchTerm) || content.includes(searchTerm) || author.includes(searchTerm)) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    }
    
    // Function to open the delete confirmation modal
    function openDeleteConfirmation(postId) {
        postIdToDelete = postId;
        confirmationModal.style.display = 'block';
    }
    
    // Function to close the confirmation modal
    function closeConfirmationModal() {
        confirmationModal.style.display = 'none';
        postIdToDelete = null;
    }
    
    // Delete post function
    function deletePost(postId) {
        fetch(`${Post_BASE_URL}/deletePost/${postId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 200) {
                showAlert('Thành công', 'Xóa bài viết thành công', 'success');
                loadPosts(); // Reload posts after deletion
            } else {
                showAlert('Lỗi', data.message || 'Không thể xóa bài viết', 'error');
            }
        })
        .catch(error => {
            console.error('Error deleting post:', error);
            showAlert('Lỗi', 'Không thể xóa bài viết', 'error');
        })
        .finally(() => {
            closeConfirmationModal();
        });
    }
    
    // Event listeners for confirmation modal
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', function() {
            if (postIdToDelete) {
                deletePost(postIdToDelete);
            }
        });
    }
    
    if (cancelDeleteBtn) {
        cancelDeleteBtn.addEventListener('click', closeConfirmationModal);
    }
    
    if (confirmCloseBtn) {
        confirmCloseBtn.addEventListener('click', closeConfirmationModal);
    }
    
    // Function to show alert using SweetAlert2
    function showAlert(title, message, icon) {
        Swal.fire({
            title: title,
            text: message,
            icon: icon,
            confirmButtonText: 'OK'
        });
    }
});