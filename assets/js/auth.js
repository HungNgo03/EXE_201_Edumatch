document.addEventListener("DOMContentLoaded", function () {
    const authButton = document.getElementById("authButton");
    const userDropdown = document.getElementById("userDropdown");
    const userDropdownButton = document.getElementById("userDropdownButton");
    const logoutButton = document.getElementById("logoutButton");
    const loginModal = new bootstrap.Modal(document.getElementById("loginModal"));

    // Kiểm tra session trong localStorage
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
            localStorage.setItem("user", JSON.stringify({ username: data.username, userId : data.userID }));
            localStorage.setItem("userID", data.userID);
            localStorage.setItem("role", data.role);// Lưu session vào localStorage
            localStorage.setItem("fullname", data.fullname);
            localStorage.setItem("email", data.email);
            localStorage.setItem("phoneNumber", data.phoneNumber);
            authButton.classList.add("d-none");
            userDropdownButton.textContent = data.username;
            userDropdown.classList.remove("d-none");
            loginModal.hide();

            // Hiển thị thông báo đăng nhập thành công
            Swal.fire({
                title: "Thành công!",
                text: "Đăng nhập thành công!",
                icon: "success",
                confirmButtonText: "OK"
            }).then(() => {
                location.reload();
            });
        } else {
            Swal.fire({
                title: "Lỗi!",
                text: "Đăng nhập thất bại. Vui lòng kiểm tra lại!",
                icon: "error",
                confirmButtonText: "Thử lại"
            });
        }
    });

    // Xử lý đăng xuất
    logoutButton.addEventListener("click", function () {
        localStorage.removeItem("user"); // Xóa session khỏi localStorage
        localStorage.clear();

        userDropdown.classList.add("d-none");
        authButton.classList.remove("d-none");

        Swal.fire({
            title: "Đã đăng xuất!",
            text: "Bạn đã đăng xuất thành công.",
            icon: "success",
            confirmButtonText: "OK"
        });
    });


    // Kiểm tra session từ server nếu cần
    async function checkSession() {
        const response = await fetch("http://localhost:8080/users/profile", { credentials: "include" });
        if (response.ok) {
            const data = await response.json();
            localStorage.setItem("user", JSON.stringify({ username: data.username }));
            localStorage.setItem("userID", userData.id);// Đảm bảo lưu vào localStorage

            authButton.classList.add("d-none");
            userDropdownButton.textContent = data.username;
            userDropdown.classList.remove("d-none");
        }
    }

    checkSession(); // Kiểm tra session khi tải trang
});
document.addEventListener("DOMContentLoaded", function () {
    const forgotEmail = document.getElementById("forgotEmail");
    const sendOtpBtn = document.getElementById("sendOtpBtn");
    const otpSection = document.getElementById("otpSection");
    const otpCode = document.getElementById("otpCode");
    const newPassword = document.getElementById("newPassword");
    const resetPasswordBtn = document.getElementById("resetPasswordBtn");

    sendOtpBtn.addEventListener("click", async function () {
        const email = forgotEmail.value;
        if (!email) {
            Swal.fire("Lỗi!", "Vui lòng nhập email", "error");
            return;
        }

        const response = await fetch("http://localhost:8080/users/forgot-password?email=" + email, {
            method: "POST"
        });

        if (response.ok) {
            Swal.fire("Thành công!", "OTP đã gửi đến email của bạn", "success");
            otpSection.style.display = "block";
        } else {
            Swal.fire("Lỗi!", await response.text(), "error");
        }
    });

    resetPasswordBtn.addEventListener("click", async function () {
        const email = forgotEmail.value;
        const otp = otpCode.value;
        const password = newPassword.value;

        const response = await fetch("http://localhost:8080/users/reset-password", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({ email, otp, newPassword: password })
        });

        if (response.ok) {
            Swal.fire("Thành công!", "Mật khẩu đã được đặt lại", "success").then(() => {
                location.reload();
            });
        } else {
            Swal.fire("Lỗi!", await response.text(), "error");
        }
    });
});
document.addEventListener("DOMContentLoaded", function () {
    const roleSelect = document.getElementById("registerRole");
    const tutorFields = document.getElementById("tutorFields");
    const studentFields = document.getElementById("studentFields");

    roleSelect.addEventListener("change", function () {
        tutorFields.style.display = "none";
        studentFields.style.display = "none";

        if (roleSelect.value === "Tutor") {
            tutorFields.style.display = "block";
        } else if (roleSelect.value === "Student") {
            studentFields.style.display = "block";
        }
    });
});
document.addEventListener("DOMContentLoaded", function () {
    const scheduleLink = document.getElementById("scheduleLink");

    if (scheduleLink) {
        scheduleLink.addEventListener("click", function (event) {
            const user = JSON.parse(localStorage.getItem("user"));

            if (!user) {
                event.preventDefault();

                Swal.fire({
                    icon: 'warning',
                    title: 'Bạn cần đăng nhập để xem Thời Khóa Biểu!',
                    showConfirmButton: true
                });

                const loginModal = new bootstrap.Modal(document.getElementById('loginModal'));
                loginModal.show();
            }
        });
    }
});
document.addEventListener("DOMContentLoaded", function () {
    console.log("auth.js đã được load!");

    const loginModalElement = document.getElementById("loginModal");
    if (loginModalElement) {
        const loginModal = new bootstrap.Modal(loginModalElement);
        console.log("Login modal đã được khởi tạo");
    } else {
        console.warn("Không tìm thấy loginModal trong DOM");
    }
});
