async function fetchSchedule() {
    const urlParams = new URLSearchParams(window.location.search);
    const tutorId = urlParams.get('tutorId');
    try {
        let response = await fetch(`http://157.66.24.154:8080/tutor/avalability/getAvalabilityByTutorId/${tutorId}`); // Thay bằng API thực tế
        let data = await response.json();        
        if (data.status === 200) {
            processSchedule(data.result);
        } else {
            console.error("Lỗi API:", data.message);
        }
    } catch (error) {
        console.error("Lỗi khi lấy dữ liệu lịch trình:", error);
    }
}
function processSchedule(scheduleData) {
    const daysMapping = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];
    let scheduleMap = {}; // Nhóm dữ liệu theo ngày

    scheduleData.forEach(item => {
        if (item.status === "Available") {
            let dayName = daysMapping[item.dayOfWeek]; // Lấy thứ
            let start = item.startTime.slice(0, 5);
            let end = item.endTime.slice(0, 5);
            let timeRange = `${start} - ${end}`;

            // Nếu chưa có ngày này trong danh sách -> Thêm mới
            if (!scheduleMap[dayName]) {
                scheduleMap[dayName] = [];
            }

            // Thêm khung giờ vào ngày tương ứng
            scheduleMap[dayName].push(timeRange);
        }
    });

    updateScheduleTable(scheduleMap);
}
function updateScheduleTable(scheduleMap) {
    let tableBody = document.querySelector("#schedule-table tbody");
    tableBody.innerHTML = ""; // Xóa dữ liệu cũ

    Object.keys(scheduleMap).forEach(day => {
        let row = document.createElement("tr");

        // Cột ngày (Thứ)
        let dayCell = document.createElement("td");
        dayCell.textContent = day;
        row.appendChild(dayCell);

        // Cột danh sách khung giờ
        let timeCell = document.createElement("td");

        scheduleMap[day].forEach(time => {
            let timeDiv = document.createElement("div");
            timeDiv.className = "time-slot btn btn-primary m-1";
            timeDiv.textContent = time;

            // Toggle chọn giờ
            timeDiv.onclick = function () {
                timeDiv.classList.toggle("selected");
            };

            timeCell.appendChild(timeDiv);
        });

        row.appendChild(timeCell);
        tableBody.appendChild(row);
    });
}


fetchSchedule(); // Gọi API khi trang tải lên   
document.addEventListener('DOMContentLoaded', function () {
    const urlParams = new URLSearchParams(window.location.search);
    const tutorId = urlParams.get('tutorId');                    
    if (!tutorId) {
        alert("Không tìm thấy ID gia sư.");
        return;
    }
    // **Gọi API để lấy dữ liệu gia sư**
    fetch(`http://157.66.24.154:8080/api/tutor/getTutorDetail/${tutorId}`)
        .then(response => response.json())
        .then(data => {
            if (!data.result) {
                alert("Không tìm thấy thông tin gia sư.");
                return;
            }
            const tutor = data.result;              
            const imageUrl = tutor.image ? `assets/img/tutors/${tutor.image}` : 'assets/img/tutors/default.jpg';              
            document.getElementById("imageTutor").src = imageUrl;
            document.getElementById("tutor-name").textContent = tutor.fullname;
            document.getElementById("tutor-email").textContent = tutor.email;
            // document.getElementById("tutor-phone").textContent = tutor.phoneNumber;
            document.getElementById("tutor-address").textContent = tutor.address;
            document.getElementById("tutor-qualification").textContent = tutor.qualification;
            document.getElementById("tutor-experience").textContent = tutor.experience;
            document.getElementById("tutor-bio").textContent = tutor.bio;
            document.getElementById("tutor-subjects").textContent = tutor.subjects.join(", ");
            document.getElementById("tutor-fee").textContent = tutor.money_per_slot.toLocaleString("vi-VN") + " VND";    
            updateSubjects(tutor.subjects);
        })
        .catch(error => console.error('Lỗi khi lấy dữ liệu gia sư:', error));
});
function updateSubjects(subjects) {
    let subjectContainer = document.getElementById("subjects-list");
    subjectContainer.innerHTML = ""; // Xóa dữ liệu cũ

    subjects.forEach(subject => {
        let div = document.createElement("div");
        div.className = " btn btn-primary";
        div.textContent = subject;
        div.onclick = function () {
            // Chọn một môn duy nhất (bỏ class của môn khác)
            document.querySelectorAll("#subjects-list .btn").forEach(item => item.classList.remove("selected"));
            div.classList.add("selected");
        };
        subjectContainer.appendChild(div);
    });
}
function populateGradeSelect() {
    let gradeSelect = document.getElementById("grade-select");
    for (let i = 1; i <= 12; i++) {
        let option = document.createElement("option");
        option.value = i;
        option.textContent = `Lớp ${i}`;
        gradeSelect.appendChild(option);
    }
}
populateGradeSelect();
document.getElementById("registerButton").addEventListener("click", async function () {
    let selectedRows = document.querySelectorAll("#schedule-table .time-slot.selected");
    let selectedSubject = document.querySelector("#subjects-list .btn.selected")?.textContent;    
    let selectedGrade = document.getElementById("grade-select").value.trim();
    
    if (selectedRows.length === 0 || !selectedSubject || !selectedGrade) {
        alert("Vui lòng chọn Lịch học, Môn học và Lớp trước khi đăng ký!");
        return;
    }
    
    // Chuyển danh sách thời gian thành chuỗi gửi lên API
    let selectedSchedule = [];
    
    selectedRows.forEach(timeDiv => {
        let row = timeDiv.closest("tr"); // Lấy dòng cha của div giờ
        let day = row.cells[0].textContent; // Lấy ngày từ ô đầu tiên của hàng
        let time = timeDiv.textContent; // Lấy thời gian

        selectedSchedule.push(`${day}: ${time}`);
    });
    let scheduleString = selectedSchedule.join(", ");
    
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const tutorId = urlParams.get('tutorId');
        const user = JSON.parse(localStorage.getItem("user")); // Chuyển chuỗi JSON thành object
        let responseRegister = await fetch("http://157.66.24.154:8080/class/register", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                userName:user.username,
                tutorId:tutorId,
                subjectId:selectedSubject,
                grade: selectedGrade,
                preferredSchedule:scheduleString
            })
        });        
        let data = await responseRegister.json();

        if (data.status === 200 && data.result) {
            Swal.fire({
                title: "Đăng ký thành công!",
                text: "Bây giờ bạn có thể xem thông tin đăng ký.",
                icon: "success",
                confirmButtonText: "Xem"
              }).then(() => {
                window.location.href="/register-class-list.html";
              });
            // let qrImg = document.getElementById("qrImage");
            // qrImg.src = data.result.urlQr;
            // qrImg.style.display = "block"; // Hiển thị ảnh QR
            // let totalPrice = document.getElementById("totalPrice");
            // totalPrice.innerHTML = `<h4>Tổng tiền thanh toán (10 buổi):</h4><p>${data.result.totalPrice.toLocaleString("vi-VN")} VND / 10 Buổi</p>`;
            // let generateBtn = document.getElementById("generateQR");
            // let confirmBtn = document.getElementById("confirmPayment");
            //  // Chuyển nút "Tạo mã QR" thành "Xác nhận thanh toán"
            //  generateBtn.style.display = "none"; // Ẩn nút "Tạo mã QR"
            //  confirmBtn.style.display = "inline-block"; // Hiển thị nút "Xác nhận thanh toán"
 
            //  // Lưu registerId vào data attribute để sử dụng khi thanh toán
            //  confirmBtn.setAttribute("data-register-id", data.result.registerId);
        } else {
            Swal.fire({
                title: "Lỗi!",
                text: result,
                icon: "error",
                confirmButtonText: "Thử lại"
              });
        }
    } catch (error) {
        alert("Lỗi kết nối, vui lòng thử lại!");
    }
});
