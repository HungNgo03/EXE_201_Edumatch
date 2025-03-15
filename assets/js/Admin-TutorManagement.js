// DOM Elements
const userTableBody = document.getElementById("user-table-body");
const searchInput = document.getElementById("search-input");
const menuToggle = document.getElementById("menu-toggle");
const sidebar = document.querySelector(".sidebar");

// Modals
const editUserModal = document.getElementById("edit-user-modal");

// Edit User Form
const editUserForm = document.getElementById("edit-user-form");
const editUserId = document.getElementById("edit-user-id");
const editCloseBtn = document.getElementById("edit-close-btn");
const editCancelBtn = document.getElementById("edit-cancel-btn");
const editStatus = document.getElementById("edit-status");

let users = [];
let currentUserId = null;

// API base URL
const API_BASE_URL = 'http://157.66.24.154:8080';

function init() {
  fetchUsers();
  setupEventListeners();
}

async function fetchUsers() {
  try {
    const response = await fetch(`${API_BASE_URL}/Admin/getAllTutors`);
    const data = await response.json();

    if (data.status === 200) {
      users = data.result.map((item) => ({
        id: item.id,
        username: item.username,
        fullname: item.fullname,
        email: item.email,
        role: item.role,
        status: item.status,
        statusText: mapStatus(item.status),
        createdAt: item.createdAt || new Date().toISOString(),
        dateOfBirth: item.dateOfBirth
      }));
      renderUsers(users);
    } else {
      console.error("Failed to fetch users:", data.message);
    }
  } catch (error) {
    console.error("Error fetching users:", error);
  }
}

function mapStatus(status) {
  switch (parseInt(status)) {
    case 1:
      return "Chưa xác thực";
    case 2:
      return "Đã xác thực";
    default:
      return "Unknown";
  }
}

// Format date to local date string
function formatDate(dateString) {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleDateString('vi-VN');
}

// Render users table
function renderUsers(usersToRender) {
  userTableBody.innerHTML = "";

  if (usersToRender.length === 0) {
    const emptyRow = document.createElement("tr");
    emptyRow.innerHTML = `
      <td colspan="7" style="text-align: center; padding: 1rem;">Không tìm thấy gia sư</td>
    `;
    userTableBody.appendChild(emptyRow);
    return;
  }

  usersToRender.forEach((user) => {
    const row = document.createElement("tr");

    let badgeClass = "";
    switch (parseInt(user.status)) {
      case 2:
        badgeClass = "badge-success";
        break;
      case 1:
        badgeClass = "badge-warning";
        break;
      default:
        badgeClass = "badge-secondary";
        break;
    }

    row.innerHTML = `
      <td>${user.username}</td>
      <td>${user.fullname}</td>
      <td>${user.email}</td>
      <td>${user.role || 'Tutor'}</td>
      <td><span class="badge ${badgeClass}">${mapStatus(user.status)}</span></td>
      <td>${formatDate(user.createdAt)}</td>
      <td>
        <button class="action-btn edit-btn" data-id="${user.id}" data-status="${user.status}">
          <i class="fas fa-edit"></i>
        </button>
      </td>
    `;
    userTableBody.appendChild(row);
  });

  // Add event listeners to edit buttons
  document.querySelectorAll(".action-btn.edit-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      const tutorId = this.getAttribute("data-id");
      const status = this.getAttribute("data-status");
      openEditModal(tutorId, status);
    });
  });
}

// Filter users based on search input
function filterUsers() {
  const searchTerm = searchInput.value.toLowerCase();
  const filteredUsers = users.filter(
    (user) =>
      user.username.toLowerCase().includes(searchTerm) ||
      user.fullname.toLowerCase().includes(searchTerm) ||
      user.email.toLowerCase().includes(searchTerm)
  );
  renderUsers(filteredUsers);
}

// Setup event listeners
function setupEventListeners() {
  searchInput.addEventListener("input", filterUsers);

  menuToggle.addEventListener("click", () => {
    sidebar.classList.toggle("active");
  });

  editCloseBtn.addEventListener("click", () => {
    closeEditModal();
  });
  const logoutBtn = document.querySelector(".logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", handleLogout);
  }
  editCancelBtn.addEventListener("click", () => {
    closeEditModal();
  });

  editUserForm.addEventListener("submit", (e) => {
    e.preventDefault();
    updateUser();
  });

  // Close modal when clicking outside
  window.addEventListener("click", (e) => {
    if (e.target === editUserModal) {
      closeEditModal();
    }
  });
}
function handleLogout() {
  // Clear user data from localStorage
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('userData');

  // Show logout success message
  Swal.fire({
    icon: 'success',
    title: 'Đã đăng xuất thành công!',
    text: 'Đang chuyển hướng đến trang chủ...',
    timer: 1500,
    showConfirmButton: false
  }).then(() => {
    // Redirect to login page
    window.location.href = 'index.html';
  });
}
// Open edit modal
function openEditModal(tutorId, status) {
  currentUserId = tutorId;
  editUserId.value = tutorId;
  editStatus.value = status;
  editUserModal.style.display = "flex";
  console.log("Opening modal for tutor ID:", tutorId, "with status:", status);
}

// Close edit modal
function closeEditModal() {
  editUserModal.style.display = "none";
}
checkAdminAccess();

// Hàm kiểm tra quyền Admin
function checkAdminAccess() {
  // Lấy thông tin người dùng từ localStorage
  const userData = localStorage.getItem('user');

  // Nếu không có thông tin đăng nhập, chuyển hướng về trang đăng nhập
  if (!userData) {
    window.location.href = 'index.html'; // Chuyển đến trang đăng nhập
    return;
  }

  try {
    const user = localStorage.getItem('role');
    
    // Kiểm tra xem người dùng có vai trò Admin không
    if (!user || user !== 'Admin') {
        // Nếu không phải Admin, chuyển hướng về trang chủ hoặc trang lỗi
        window.location.href = 'unauthorized.html'; // hoặc trang chủ thông thường
        return;
    }

    // Nếu là Admin, tiếp tục hiển thị trang
    console.log('Admin access granted');

  } catch (error) {
    console.error('Error parsing user data:', error);
    // Nếu có lỗi, chuyển hướng về trang đăng nhập
    window.location.href = 'index.html';
  }
}
// Update user status
async function updateUser() {
  const tutorId = currentUserId;
  const newStatus = parseInt(editStatus.value);

  try {
    const response = await fetch(`${API_BASE_URL}/Admin/tutors/${tutorId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: newStatus }),
    });

    const data = await response.json();

    if (data.status === 200) {
      Swal.fire({
        icon: 'success',
        title: 'Cập nhật trạng thái thành công!',
        showConfirmButton: false,
        timer: 1500
      });

      // Update the status in our local data
      const userIndex = users.findIndex((user) => user.id === parseInt(tutorId));
      if (userIndex !== -1) {
        users[userIndex].status = newStatus;
        users[userIndex].statusText = mapStatus(newStatus);
      }

      renderUsers(users); // Re-render the table
      closeEditModal(); // Close the modal
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Lỗi ${data.message}',
        text: result.message,
        showConfirmButton: true
      });
    }
  } catch (error) {
    console.error("Error updating user status:", error);
    alert("Đã xảy ra lỗi khi cập nhật trạng thái gia sư!");
  }
}

document.addEventListener("DOMContentLoaded", init);
