const user = JSON.parse(localStorage.getItem("user"));
const apiUrl = `http://157.66.24.154:8080/class/getBooking/${user.userId}`; 
// const apiUrl = `http://localhost:8080/class/getBooking/1`;

const classListDiv = document.getElementById("classList");
function getStatusBadgeColor(status) {
    switch (status) {
        case "Pending":
            return "warning"; // Vàng
        case "Approved":
            return "success"; // Xanh lá
        case "Rejected":
            return "danger"; // Đỏ
        case "Canceled":
            return "secondary"; // Xám
        default:
            return "dark"; // Mặc định
    }
}
function getStatus(status) {
    switch (status) {
        case "Pending":
            return "Đang xử lý"; // Vàng
        case "Approved":
            return "Đã hoàn thành"; // Xanh lá
        case "Rejected":
            return "Từ chối"; // Đỏ
        case "Canceled":
            return "Hủy"; // Xám
        default:
            return "Lỗi"; // Mặc định
    }
}
async function fetchClassList() {
    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error(`Lỗi: ${response.status}`);
        }

        const data = await response.json(); // Chuyển dữ liệu về JSON
        renderClassList(data.result);
    } catch (error) {
        classListDiv.innerHTML = `<p style="color: red;">Không thể tải dữ liệu: ${error.message}</p>`;
    }
}

// Tạo HTML từ JSON và hiển thị dữ liệu
function renderClassList(classData) {
    if (!classData || classData.length === 0 || classData === "Không có lớp học đăng ký") {
        classListDiv.innerHTML = "<p>Không có đăng ký lớp học nào.</p>";
        return;
    }

    const userRole = localStorage.getItem("role"); // Lấy role từ localStorage
    let html = "";

    classData.forEach((item) => {
        let statusColor = getStatusBadgeColor(item.status);
        let status = getStatus(item.status);

        html += `
                        <div class="card mb-3">
                            <div class="card-body">
                                <div class="d-flex flex-column flex-lg-row">
                                    <span class="avatar avatar-text rounded-3 me-4 mb-2">${item.subjectId.charAt(0)}</span>
                                    <div class="row flex-fill">
                                        <div class="col-sm-5">
                                            <h4 class="h5">${item.subjectId} - Lớp ${item.grade}</h4>
                                            <small>Đăng ký: ${new Date(item.registerAt).toLocaleString()}</small>
                                        </div>
                                        <div class="col-sm-4 py-2">
                                            <strong>Gia sư:</strong> ${item.tutorName} <br>
                                            <strong>Lịch học:</strong> ${item.preferredSchedule}
                                        </div>
                                        <div class="col-sm-3 text-lg-end">
                                            <div style="display:flex;">
                                                <p>Học phí: </p><span style="margin-left: 10px;margin-bottom: 10px;" class="badge bg-${item.paymentStatus === 'Đã hoàn thành' ? 'success' : 'warning'}">${item.paymentStatus}</span>
                                            </div>
                                            <div style="display:flex;">
                                                <p>Trạng thái: </p><span style="margin-left: 10px;margin-bottom: 10px;" class="badge bg-${statusColor}" id="status-${item.id}">${status}</span>
                                                </div>
                                                <!-- Chỉ hiển thị nút Cập nhật nếu là Tutor -->
                                                <div style="display: flex;">
                                                    ${userRole === "Tutor" && item.status === "Pending" ? `
                                                    <button type="button" class="btn btn-success  " onclick="updateStatus(${item.preferredSchedule})" data-toggle="modal" data-target="#updateModal">Duyệt</button>
                                                    <button type="button" class="btn btn-danger" style="margin-left: 10px;" onclick="rejectStatus(${item.id})">Từ chối</button>
                                                    ` : ""}
                                                    ${userRole === "Student" && item.paymentStatus === "Chưa hoàn thành" ? `
                                                        <button type="button" class="btn btn-success" onclick="getQr(${item.id})">Thanh toán</button>
                                                        ` : ""}
                                                </div>
                                                </div>
                                                <div class="col-md-5 col-xl-4 offset-xl-1" style="margin-left: 0;">
                                                    <div class="text-center">
                                                        <img id="qrImage${item.id}" style="width: 18vw;" src="" />
                                        
                                                    </div>
                                                </div>
                                        </div>
                                </div>
                            </div>
                        </div>
                    `;
    });

    classListDiv.innerHTML = html;
}
function updateStatus(preferredSchedule) {
    document.getElementById("newSchedule").value = preferredSchedule;
    fetchTutorClasses();
    $("#updateModal").modal("show");
}
async function getQr(id) {
    try {
        let response = await fetch(`http://157.66.24.154:8080/class/getPaymentQr/${id}`);
        
        if (!response.ok) {
            throw new Error(`Lỗi API: ${response.status} - ${response.statusText}`);
        }

        let data = await response.json();
        
        let qrImg = document.getElementById("qrImage"+id);
        qrImg.src = data.result;
        qrImg.style.display = "block";
        
    } catch (error) {
        console.error("Lỗi khi lấy dữ liệu:", error);
    }
}
// Hàm gọi API lấy danh sách lớp của Tutor
function fetchTutorClasses() {
    fetch(`/api/tutor/classes`)
        .then(response => response.json())
        .then(data => {
            const classSelect = document.getElementById("classSelect");
            classSelect.innerHTML = `<option value="">-- Chọn lớp --</option>`;
            data.result.forEach(classItem => {
                classSelect.innerHTML += `<option value="${classItem.id}">${classItem.subjectId} - Lớp ${classItem.grade}</option>`;
            });
            classSelect.innerHTML += `<option value="new">+ Tạo lớp mới</option>`;
        })
        .catch(error => console.error("Lỗi lấy danh sách lớp:", error));
}

function handleClassSelection() {
    let form = document.getElementById("newClassForm");
    let classSelect = document.getElementById("classSelect");

    // Nếu chọn lớp có sẵn, ẩn form tạo lớp mới
    if (classSelect.value !== "new") {
        form.style.display = "none";
    }
}

function showNewClassForm() {
    let form = document.getElementById("newClassForm");
    form.style.display = "block";  // Luôn mở form khi nhấn nút
}
// Gửi yêu cầu cập nhật lớp học
function submitUpdate() {
    const classId = document.getElementById("classSelect").value;

    if (classId === "new") {
        // Tạo lớp mới trước
        const newClass = {
            grade: document.getElementById("newGrade").value,
            preferredSchedule: document.getElementById("newSchedule").value
        };

        fetch(`/api/tutor/classes/create`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newClass)
        })
            .then(response => response.json())
            .then(data => {
                alert("Tạo lớp mới thành công!");
                $("#updateModal").modal("hide");
                location.reload();
            })
            .catch(error => console.error("Lỗi tạo lớp mới:", error));

    } else {
        // Nếu chọn lớp đã có sẵn, chỉ cần cập nhật lớp cho đăng ký
        updateClassRegistration(classId);
    }
}
// Hàm gửi API cập nhật trạng thái đăng ký lớp học
function updateClassRegistration(classId) {
    fetch(`/api/registrations/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registrationId: selectedRegistrationId, classId })
    })
        .then(response => response.json())
        .then(data => {
            alert("Cập nhật thành công!");
            $("#updateModal").modal("hide");
            location.reload();
        })
        .catch(error => console.error("Lỗi cập nhật đăng ký:", error));
}

fetchClassList();
