document.addEventListener("DOMContentLoaded", async function () {
    const userId = localStorage.getItem("userID"); // Lấy userID sau khi đăng nhập

    if (!userId) {
        alert("Bạn chưa đăng nhập!");
        window.location.href = "index.html"; // Chuyển về trang login nếu chưa đăng nhập
        return;
    }

    try {
        const response = await fetch(`http://localhost:8080/users/profile/${userId}`);
        if (!response.ok) {
            throw new Error("Không thể lấy thông tin người dùng");
        }

        const userData = await response.json();
        console.log("Thông tin người dùng:", userData);

        // Sửa lại cách hiển thị dữ liệu từ API
        document.getElementById("profileName").textContent = userData.user.fullname;
        document.getElementById("profileEmail").textContent = userData.user.email;
        document.getElementById("profilePhone").textContent = userData.user.phoneNumber;

        if (userData.user.role === "Tutor") {  // Kiểm tra role từ userData.user
            document.getElementById("extraInfo").innerHTML = `
                <p>Địa chỉ: ${userData.address}</p>
                <p>Chuyên môn: ${userData.qualification}</p>
                <p>Kinh nghiệm: ${userData.experience} năm</p>
                <p>Tiểu sử: ${userData.bio}</p>
            `;
        } else if (userData.user.role === "Student") {
            document.getElementById("extraInfo").innerHTML = `
                <p>Lớp: ${userData.grade}</p>
                <p>Ghi chú: ${userData.notes}</p>
            `;
        }
    } catch (error) {
        console.error(error);
        alert("Lỗi khi tải thông tin!");
    }
});
