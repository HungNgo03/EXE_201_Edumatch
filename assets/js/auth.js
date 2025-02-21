document.addEventListener("DOMContentLoaded", function () {
    const authButton = document.getElementById("authButton");
    const userDropdown = document.getElementById("userDropdown");
    const userDropdownButton = document.getElementById("userDropdownButton");
    const logoutButton = document.getElementById("logoutButton");
    const loginModal = new bootstrap.Modal(document.getElementById("loginModal"));

    // Kiểm tra nếu có session trong localStorage
    const user = localStorage.getItem("user");

    if (user) {
        const userData = JSON.parse(user);
        authButton.classList.add("d-none");
        userDropdownButton.textContent = userData.username;
        userDropdown.classList.remove("d-none");
    }

    // Xử lý đăng nhập
    document.getElementById("loginForm").addEventListener("submit", async function (event) {
        event.preventDefault();
        const username = document.getElementById("loginUsername").value;
        const password = document.getElementById("loginPassword").value;

        const response = await fetch("http://localhost:8080/users/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password })
        });

        if (response.ok) {
            const data = await response.json();
            localStorage.setItem("user", JSON.stringify({ username: data.username })); // Lưu session vào localStorage
            authButton.classList.add("d-none");
            userDropdownButton.textContent = data.username;
            userDropdown.classList.remove("d-none");
            loginModal.hide();
            alert("Đăng nhập thành công!");
        } else {
            alert("Đăng nhập thất bại!");
        }
    });

    // Xử lý đăng xuất
    logoutButton.addEventListener("click", function () {
        localStorage.removeItem("user"); // Xóa session khỏi localStorage
        userDropdown.classList.add("d-none");
        authButton.classList.remove("d-none");
    });

    // Kiểm tra session từ server nếu cần
    async function checkSession() {
        const response = await fetch("http://localhost:8080/users/profile", { credentials: "include" });
        if (response.ok) {
            const data = await response.json();
            localStorage.setItem("user", JSON.stringify({ username: data.username })); // Đảm bảo lưu vào localStorage
            authButton.classList.add("d-none");
            userDropdownButton.textContent = data.username;
            userDropdown.classList.remove("d-none");
        }
    }

    checkSession(); // Kiểm tra session khi tải trang
});
