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

        const response = await fetch("http://157.66.24.154:8080/users/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password })
        });

        if (response.ok) {
            const data = await response.json();
            localStorage.setItem("user", JSON.stringify({ username: data.username, userId: data.userID }));
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
                if (data.role === "Admin") {
                    window.location.href = "Admin-Page.html";
                } else {
                    location.reload();
                }
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
        const response = await fetch("http://157.66.24.154:8080/users/profile", { credentials: "include" });
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

        const response = await fetch("http://157.66.24.154:8080/users/forgot-password?email=" + email, {
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

        const response = await fetch("http://157.66.24.154:8080/users/reset-password", {
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
    const registerForm = document.querySelector("#registerForm");
    const loginRegisterTabs = new bootstrap.Tab(document.querySelector("#login-tab"));

    registerForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        // Lấy dữ liệu từ form
        const fullname = document.getElementById("registerName").value;
        const phoneNumber = document.getElementById("registerPhone").value;
        const email = document.getElementById("registerEmail").value;
        const password = document.getElementById("registerPassword").value;
        const username = document.getElementById("username").value;
        const role = document.getElementById("registerRole").value;

        // Kiểm tra mật khẩu có khớp không
        if (password.length < 6) {
            Swal.fire({
                title: "Lỗi!",
                text: "Mật khẩu phải có ít nhất 6 ký tự!",
                icon: "error",
                confirmButtonText: "Thử lại"
            });
            return;
        }

        // Tạo đối tượng dữ liệu gửi đi
        let requestBody = {
            username: username,
            fullname: fullname,
            phoneNumber: phoneNumber,
            email: email,
            password: password,
            role: role
        };

        // Nếu role là Tutor, thêm thông tin Tutor
        if (role === "Tutor") {
            requestBody.gender = document.getElementById("gender").value === "1";
            requestBody.dateOfBirth = document.getElementById("dateOfBirth").value;
            requestBody.address = document.getElementById("address").value;
            requestBody.qualification = document.getElementById("qualification").value;
            requestBody.experience = document.getElementById("experience").value;
            requestBody.bio = document.getElementById("bio").value;
        }

        // Nếu role là Student, thêm thông tin Student
        if (role === "Student") {
            requestBody.parentName = document.getElementById("parentName").value;
            requestBody.grade = document.getElementById("grade").value;
            requestBody.address = document.getElementById("addressStudent").value;
            requestBody.notes = document.getElementById("notes").value;
        }

        // Kiểm tra log dữ liệu gửi đi
        console.log("Dữ liệu gửi lên:", JSON.stringify(requestBody, null, 2));

        // Gửi request đến backend
        const response = await fetch("http://157.66.24.154:8080/users/register", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(requestBody),
        });

        const result = await response.text();
        if (response.ok) {
            Swal.fire({
                title: "Đăng ký thành công!",
                text: "Bây giờ bạn có thể đăng nhập.",
                icon: "success",
                confirmButtonText: "Đăng nhập ngay"
            }).then(() => {
                registerForm.reset();
                loginRegisterTabs.show();
            });
        } else {
            Swal.fire({
                title: "Lỗi!",
                text: result,
                icon: "error",
                confirmButtonText: "Thử lại"
            });
        }
    });
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
