document.addEventListener('DOMContentLoaded', function() {
    // Kiểm tra quyền Admin trước khi hiển thị nội dung trang
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
});