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
            return "Đã duyệt"; // Xanh lá
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
                                            <strong>Học viên:</strong> ${item.stdName} <br>
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
                                                    <button type="button" class="btn btn-success" onclick="updateStatus('${item.preferredSchedule}',${item.id})" data-toggle="modal" data-target="#updateModal">Duyệt</button>
                                                    <button type="button" class="btn btn-danger" style="margin-left: 10px;" onclick="rejectStatus(${item.id})">Từ chối</button>
                                                    ` : ""}
                                                    ${userRole === "Student" && item.paymentStatus === "Chưa hoàn thành" && item.status ==="Approved"? `
                                                        <button type="button" class="btn btn-success" onclick="getQr(${item.id})">Thanh toán</button>
                                                        ` : ""}
                                                </div>
                                                </div>
                                                <div class="col-md-5 col-xl-4 offset-xl-1" style="margin-left: 0;">
                                                    <div class="text-center">
                                                    ${item.status ==="Approved" ?`
                                                        <img id="qrImage${item.id}" style="width: 18vw;" src="" />
                                                        <button onclick="checkPayment(${item.id})" style="display:none;" type="button" id="confirmPayment${item.id}" class="btn btn-warning">Xác nhận thanh toán</button>
                                                        `:``}
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
async function checkPayment(registerId) {
    try {
        let responsePayment = await fetch("http://157.66.24.154:8080/payment/checkPayment", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                registerId:registerId
            })
        });

        let paymentData = await responsePayment.json();

        if (paymentData.status === 200 && paymentData.result) {
            let qrImg = document.getElementById("qrImage"+registerId);
            qrImg.style.opacity = 0.11;  // Làm mờ QR code (hoặc bạn có thể thêm một lớp phủ mờ)
            Swal.fire({
                title: "Thanh toán thành công!",
                icon: "success",
                showConfirmButton: true
            }).then(() => {
                let confirmBtn = document.getElementById("confirmPayment" + registerId);
                if (confirmBtn) {
                    confirmBtn.disabled = true; // Tắt nút xác nhận thanh toán để tránh click lại
                }
                window.location.reload(); // Reload sau khi người dùng nhấn "OK"
            });            
        } else {
            Swal.fire({
                title: "Thanh toán ko thành công vui lòng thử lại!",
                icon: "warning",
                showConfirmButton: true
              })
        }
    } catch (error) {
        console.error("Lỗi khi xác nhận thanh toán:", error);
        alert("Lỗi kết nối khi thanh toán. Vui lòng thử lại!");
    }
};

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
        let confirmBtn = document.getElementById("confirmPayment"+id);
             confirmBtn.style.display = "inline-block"; 
    } catch (error) {
        console.error("Lỗi khi lấy dữ liệu:", error);
    }
}
// Hàm gọi API lấy danh sách lớp của Tutor
 async function fetchTutorClasses() {
    try {
        // 🟢 Gọi API lấy danh sách lớp học
        const response = await fetch(`http://localhost:8080/class/getClassList/${user.userId}`);
        const data = await response.json();

        if (data.status === 200) {
            const classSelect = document.getElementById("classSelect");
            
            // Xóa các option cũ (nếu có)
            classSelect.innerHTML = `<option value="">-- Chọn lớp --</option>`;

            // 🟢 Thêm danh sách lớp vào thẻ <select>
            data.result.forEach(cls => {
                let option = document.createElement("option");
                // option.value = cls.id;  // Giá trị của lớp học
                option.textContent = cls.className;  // Tên hiển thị của lớp học
                classSelect.appendChild(option);
            });
        }
    } catch (error) {
        console.error("Lỗi khi lấy danh sách lớp học:", error);
    }
}
async function updateStatus(preferredSchedule,registerId) {    
    document.getElementById("newSlot").value = preferredSchedule;
    document.getElementById("registerId").value = registerId;
    fetchTutorClasses();
    // $("#updateModal").modal("show");
}
function showNewClassForm() {
    let form = document.getElementById("newClassForm");
    let selectClass = document.getElementById("classSelect");
    let switchButton = document.getElementById("switchToExisting"); // Nút chọn lớp có sẵn
    selectClass.value = "new";
    selectClass.style.display = "none"; // Ẩn select
    form.style.display = "block";  // Hiển thị form tạo lớp mới
    switchButton.style.display = "inline-block"; // Hiện nút quay lại
    isCreateNewClass = true;
}

function switchToExistingClass() {
    let form = document.getElementById("newClassForm");
    let selectClass = document.getElementById("classSelect");
    let switchButton = document.getElementById("switchToExisting");

    form.style.display = "none"; // Ẩn form tạo lớp mới
    selectClass.style.display = "block"; // Hiện select để chọn lớp có sẵn
    switchButton.style.display = "none"; // Ẩn nút quay lại

    isCreateNewClass = false;
}

// Gửi yêu cầu cập nhật lớp học
function submitUpdate() {
    
    if (isCreateNewClass == true) {
        console.log("create new");
        
        // Tạo lớp mới trước
        const newClass = {
            startDate: document.getElementById("startDate").value,
            preferedSchedule: document.getElementById("newSlot").value,
            // registerId: document.getElementById("registerId").value
            registerId: 31
        };

        const response = fetch(`http://localhost:8080/class/createClass`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newClass)
        }).catch(error => console.error("Lỗi tạo lớp mới:", error));
        if (response.status === 200) {
            console.log("tao lop ok");
            
        }

    } else {
        console.log("class exist");
        
        // Nếu chọn lớp đã có sẵn, chỉ cần cập nhật lớp cho đăng ký
        updateClassRegistration();
    }
}
// Hàm gửi API cập nhật trạng thái đăng ký lớp học
function updateClassRegistration(classId,selectedRegistrationId) {
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
let isCreateNewClass = false;
fetchClassList();
