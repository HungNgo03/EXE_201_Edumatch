// Mock user data
let users = []

// DOM Elements
const userTableBody = document.getElementById("user-table-body")
const searchInput = document.getElementById("search-input")
const menuToggle = document.getElementById("menu-toggle")
const sidebar = document.querySelector(".sidebar")

// Modals
const editUserModal = document.getElementById("edit-user-modal")
const deleteUserModal = document.getElementById("delete-user-modal")

// Edit User Form
const editUserForm = document.getElementById("edit-user-form")
const editCloseBtn = document.getElementById("edit-close-btn")
const editCancelBtn = document.getElementById("edit-cancel-btn")
const editUserId = document.getElementById("edit-user-id")
const editName = document.getElementById("edit-name")
const editEmail = document.getElementById("edit-email")
const editRole = document.getElementById("edit-role")
const editStatus = document.getElementById("edit-status")

// Delete User Modal
const deleteCloseBtn = document.getElementById("delete-close-btn")
const deleteCancelBtn = document.getElementById("delete-cancel-btn")
const confirmDeleteBtn = document.getElementById("confirm-delete-btn")
const deleteUserName = document.getElementById("delete-user-name")

let currentUserId = null

// API base URL
const API_BASE_URL = 'http://157.66.24.154:8080'

// Initialize the application
function init() {
  fetchUsers()
  setupEventListeners()
}

// Fetch users from API
async function fetchUsers() {
  try {
    const response = await fetch(`${API_BASE_URL}/Admin/getAllStudents`)
    const data = await response.json()

    if (data.status === 200) {
      users = data.result.map(item => ({
        id: item.id,
        username: item.username,
        fullname: item.fullname,
        email: item.email,
        phoneNumber: item.phoneNumber || 'N/A',
        role: item.role,
        status: 'Active', // Assuming all returned students are active
        createdAt: item.createdAt || new Date().toISOString()
      }))
      renderUsers(users)
    } else {
      console.error("Failed to fetch students:", data.message)
      showError("Failed to load students data")
    }
  } catch (error) {
    console.error("Error fetching students:", error)
    showError("Error connecting to server")
  }
}

// Show error notification
function showError(message) {
  Swal.fire({
    icon: 'error',
    title: 'Error',
    text: message,
  })
}

// Render users table
function renderUsers(usersToRender) {
  userTableBody.innerHTML = ""

  if (usersToRender.length === 0) {
    const emptyRow = document.createElement("tr")
    emptyRow.innerHTML = `
      <td colspan="7" style="text-align: center; padding: 1rem;">Không tìm thấy học sinh</td>
    `
    userTableBody.appendChild(emptyRow)
    return
  }

  usersToRender.forEach((user) => {
    const row = document.createElement("tr")

    // Format date
    const createdDate = new Date(user.createdAt)
    const formattedDate = createdDate.toLocaleDateString('vi-VN')

    // Determine badge class based on status
    row.innerHTML = `
      <td>${user.username}</td>
      <td>${user.fullname}</td>
      <td>${user.email}</td>
      <td>${user.phoneNumber}</td>
      <td>${user.role}</td>
      <td>${formattedDate}</td>
      <td>
        <button class="action-btn delete" data-id="${user.id}" data-name="${user.fullname}">
          <i class="fas fa-trash"></i>
        </button>
      </td>
    `

    userTableBody.appendChild(row)
  })

  // Add event listeners to the delete buttons
  document.querySelectorAll(".action-btn.delete").forEach((btn) => {
    btn.addEventListener("click", () => openDeleteModal(
      Number.parseInt(btn.dataset.id),
      btn.dataset.name
    ))
  })
}

// Filter users based on search input
function filterUsers() {
  const searchTerm = searchInput.value.toLowerCase()
  const filteredUsers = users.filter(
    (user) => 
      user.username.toLowerCase().includes(searchTerm) || 
      user.fullname.toLowerCase().includes(searchTerm) || 
      user.email.toLowerCase().includes(searchTerm)
  )
  renderUsers(filteredUsers)
}

// Setup event listeners
function setupEventListeners() {
  // Search input
  searchInput.addEventListener("input", filterUsers)

  // Menu toggle for mobile
  menuToggle.addEventListener("click", () => {
    sidebar.classList.toggle("active")
  })

  // Delete modal close buttons
  if (deleteCloseBtn) {
    deleteCloseBtn.addEventListener("click", () => {
      deleteUserModal.classList.remove("active")
    })
  }

  if (deleteCancelBtn) {
    deleteCancelBtn.addEventListener("click", () => {
      deleteUserModal.classList.remove("active")
    })
  }

  // Confirm delete button
  if (confirmDeleteBtn) {
    confirmDeleteBtn.addEventListener("click", deleteUser)
  }

  // Close modals when clicking outside
  window.addEventListener("click", (e) => {
    if (deleteUserModal && e.target === deleteUserModal) {
      deleteUserModal.classList.remove("active")
    }
  })

  // Add logout functionality
  const logoutBtn = document.querySelector(".logout-btn")
  if (logoutBtn) {
    logoutBtn.addEventListener("click", handleLogout)
  }
}

// Handle logout
function handleLogout() {
  // Clear user data from localStorage
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  localStorage.removeItem('userData')
  
  // Show logout success message
  Swal.fire({
    icon: 'success',
    title: 'Đã đăng xuất thành công!',
    text: 'Đang chuyển hướng đến trang đăng nhập...',
    timer: 1500,
    showConfirmButton: false
  }).then(() => {
    // Redirect to login page
    window.location.href = 'index.html'
  })
}

// Open delete user modal
function openDeleteModal(userId, userName) {
  if (!deleteUserModal) return
  
  currentUserId = userId
  
  if (deleteUserName) {
    deleteUserName.textContent = userName
  }

  deleteUserModal.classList.add("active")
}

// Delete user
async function deleteUser() {
  try {
    // Call API to delete user
    const response = await fetch(`${API_BASE_URL}/Admin/students/${currentUserId}`, {
      method: 'DELETE'
    })
    
    const data = await response.json()
    
    if (data.status === 200) {
      // Remove user from local array
      users = users.filter((user) => user.id !== currentUserId)
      renderUsers(users)
      
      Swal.fire({
        icon: 'success',
        title: 'Thành công',
        text: 'Đã xóa học sinh thành công!'
      })
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Lỗi',
        text: data.message || 'Không thể xóa học sinh'
      })
    }
  } catch (error) {
    console.error("Error deleting user:", error)
    Swal.fire({
      icon: 'error',
      title: 'Lỗi',
      text: 'Đã xảy ra lỗi khi kết nối với máy chủ'
    })
  }
  
  if (deleteUserModal) {
    deleteUserModal.classList.remove("active")
  }
}

// Initialize the application when the DOM is loaded
document.addEventListener("DOMContentLoaded", init)

