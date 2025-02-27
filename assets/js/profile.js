document.addEventListener("DOMContentLoaded", async function () {
    const userId = localStorage.getItem("userID"); // Lấy userID sau khi đăng nhập
    const fullname = localStorage.getItem("fullname");
    const email = localStorage.getItem("email");
    const phoneNumber = localStorage.getItem("phoneNumber");
    if (!userId) {
        alert("Bạn chưa đăng nhập!");
        window.location.href = "index.html"; // Chuyển về trang login nếu chưa đăng nhập
        return;
    }

    try {
        const response = await fetch(`http://157.66.24.154:8080/users/profile/${userId}`);
        if (!response.ok) {
            throw new Error("Không thể lấy thông tin người dùng");
        }

        const userData = await response.json();
        console.log("Thông tin người dùng:", userData);

        // Sửa lại cách hiển thị dữ liệu từ API
        document.getElementById("profileName").textContent = fullname;
        document.getElementById("profileEmail").textContent = email;
        document.getElementById("profilePhone").textContent = phoneNumber;

        if (localStorage.getItem("role") === "Tutor") {  // Kiểm tra role
            document.getElementById("extraInfo").innerHTML = `
                <p>Giới tính: ${userData.gender ? "Nam" : "Nữ"}</p>
                <p>Ngày sinh: ${userData.dateOfBirth}</p>
                <p>Địa chỉ: ${userData.address}</p>
                <p>Chuyên môn: ${userData.qualification}</p>
                <p>Kinh nghiệm: ${userData.experience} năm</p>
                <p>Tiểu sử: ${userData.bio}</p>
            `;
        } else if (localStorage.getItem("role") === "Student") {
            document.getElementById("extraInfo").innerHTML = `
                <p>Tên phụ huynh: ${userData.parentName}</p>
                <p>Địa chỉ: ${userData.address}</p>
                <p>Lớp: ${userData.grade}</p>
                <p>Ghi chú: ${userData.notes}</p>
            `;
        }
    } catch (error) {
        console.error(error);
        alert("Lỗi khi tải thông tin!");
    }
});
