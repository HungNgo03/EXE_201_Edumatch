document.addEventListener("DOMContentLoaded", function () {
    let stompClient = null;
    const chatContainer = document.getElementById("chatContainer");
    const joinChatBtn = document.getElementById("joinChatBtn");
    const sendMessageBtn = document.getElementById("sendMessageBtn");
    const leaveChatBtn = document.getElementById("leaveChatBtn");
    const messageInput = document.getElementById("messageInput");
    const messageArea = document.getElementById("messageArea");
    const userList = document.getElementById("userList");
    const messageHeader = document.getElementById("messageHeader");
    let selectedReceiver = null;
    let unreadMessages = new Map(); // Lưu số lượng tin nhắn chưa đọc từ mỗi user (dành cho Admin)

    joinChatBtn.addEventListener("click", function () {
        const user = JSON.parse(localStorage.getItem("user"));
        if (!user) {
            Swal.fire("Lỗi!", "Bạn cần đăng nhập để tham gia chat!", "error");
            return;
        }
        connect(user.username);
        playNotificationSound();
        chatContainer.classList.remove("d-none");
        joinChatBtn.classList.add("d-none");
        leaveChatBtn.classList.remove("d-none");
        updateUserList(user.username);
    });

    function connect(username) {
        const socket = new SockJS("http://157.66.24.154:8080/chat-websocket");
        stompClient = new StompJs.Client({
            webSocketFactory: () => socket,
        });

        stompClient.onConnect = function (frame) {
            stompClient.subscribe("/user/" + username + "/queue/private", function (message) {
                const msg = JSON.parse(message.body);
                showMessage(msg);
                if (username === "admin" && msg.sender !== username && msg.sender !== selectedReceiver) {
                    const count = unreadMessages.get(msg.sender) || 0;
                    unreadMessages.set(msg.sender, count + 1);
                    updateUserList(username);
                }
            });

            stompClient.subscribe("/topic/public", function (message) {
                const msg = JSON.parse(message.body);
                if (msg.type === "JOIN" || msg.type === "LEAVE") {
                    updateUserList(username);
                }
            });

            stompClient.subscribe("/topic/online", function (message) {
                const onlineUsers = JSON.parse(message.body);
                updateUserList(username, onlineUsers);
            });

            stompClient.publish({
                destination: "/app/chat.addUser",
                body: JSON.stringify({
                    sender: username,
                    type: "JOIN"
                })
            });
        };

        stompClient.onStompError = function (error) {
            Swal.fire("Lỗi!", "Không thể kết nối đến server chat!", "error");
        };

        stompClient.activate();
    }

    sendMessageBtn.addEventListener("click", sendMessage);
    messageInput.addEventListener("keypress", function (e) {
        if (e.key === "Enter") sendMessage();
    });

    function sendMessage() {
        const user = JSON.parse(localStorage.getItem("user"));
        const messageContent = messageInput.value.trim();

        if (!selectedReceiver) {
            Swal.fire("Lỗi!", "Vui lòng chọn người nhận!", "error");
            return;
        }

        if (messageContent && stompClient && stompClient.connected) {
            const chatMessage = {
                sender: user.username,
                content: messageContent,
                receiver: selectedReceiver,
                type: "CHAT"
            };
            showMessage(chatMessage);
            stompClient.publish({
                destination: "/app/chat.sendPrivateMessage/" + selectedReceiver,
                body: JSON.stringify(chatMessage)
            });
            messageInput.value = "";
            updateUserList(user.username);
        }
    }

    leaveChatBtn.addEventListener("click", function () {
        disconnect();
    });

    window.addEventListener("beforeunload", function () {
        disconnect();
    });

    function disconnect() {
        const user = JSON.parse(localStorage.getItem("user"));
        if (stompClient && stompClient.connected) {
            stompClient.publish({
                destination: "/app/chat.removeUser",
                body: JSON.stringify({
                    sender: user.username,
                    type: "LEAVE"
                })
            });
            stompClient.deactivate();
        }
        chatContainer.classList.add("d-none");
        joinChatBtn.classList.remove("d-none");
        leaveChatBtn.classList.add("d-none");
        messageArea.innerHTML = "";
        userList.innerHTML = "";
        selectedReceiver = null;
        messageHeader.textContent = "Chọn người để chat";
        unreadMessages.clear();
    }

    function showMessage(message) {
        const user = JSON.parse(localStorage.getItem("user"));

        if ((message.sender === user.username || message.receiver === user.username) &&
            (message.sender === selectedReceiver || message.receiver === selectedReceiver)) {
            const messageElement = document.createElement("div");
            messageElement.classList.add("message");
            messageElement.classList.add(message.sender === user.username ? "sent" : "received");
            messageElement.innerHTML = `<div class="message-content">${message.content}</div>`;
            messageArea.appendChild(messageElement);
            messageArea.scrollTop = messageArea.scrollHeight;
        }

        if (user.username === "admin" && message.receiver === "admin" && message.type === "CHAT") {
            playNotificationSound();
            updateUserList(user.username);
        }
    }

    async function fetchChattedUsers(username) {
        try {
            const response = await fetch(`http://157.66.24.154:8080/chat/chatted-users?username=${username}`);
            const users = await response.json();
            return users;
        } catch (error) {
            console.error("Error fetching chatted users:", error);
            return [];
        }
    }

    function updateUserList(currentUser, onlineUsers = []) {
        userList.innerHTML = "";
        const user = JSON.parse(localStorage.getItem("user"));

        if (currentUser === "admin") {
            fetchChattedUsers(currentUser).then(chattedUsers => {
                chattedUsers.forEach(userItem => {
                    if (userItem !== "admin") {
                        const li = document.createElement("li");
                        li.textContent = userItem;
                        const unreadCount = unreadMessages.get(userItem) || 0;
                        if (unreadCount > 0) {
                            const badge = document.createElement("span");
                            badge.classList.add("unread-badge");
                            badge.textContent = unreadCount;
                            li.appendChild(badge);
                        }
                        if (onlineUsers.includes(userItem)) {
                            li.classList.add("online");
                        }
                        li.addEventListener("click", function () {
                            selectedReceiver = userItem;
                            messageHeader.textContent = "Chat với " + userItem;
                            userList.querySelectorAll("li").forEach(item => item.classList.remove("active"));
                            li.classList.add("active");
                            unreadMessages.set(userItem, 0);
                            updateUserList(currentUser, onlineUsers);
                            loadChatHistory(userItem);
                        });
                        userList.appendChild(li);
                    }
                });
            });
        } else {
            const li = document.createElement("li");
            li.textContent = "admin";
            li.classList.add("online");
            li.addEventListener("click", function () {
                selectedReceiver = "admin";
                messageHeader.textContent = "Chat với Admin";
                userList.querySelectorAll("li").forEach(item => item.classList.remove("active"));
                li.classList.add("active");
                loadChatHistory("admin");
            });
            userList.appendChild(li);
        }
    }

    async function loadChatHistory(receiver) {
        const user = JSON.parse(localStorage.getItem("user"));
        try {
            const response = await fetch(`http://157.66.24.154:8080/chat/history?sender=${user.username}&receiver=${receiver}`);
            const history = await response.json();
            messageArea.innerHTML = "";
            history.forEach(msg => showMessage(msg));
        } catch (error) {
            console.error("Error loading chat history:", error);
        }
    }

    function playNotificationSound() {
        const notificationSound = document.getElementById("notificationSound");
        notificationSound.play()
            .catch(error => {
                document.addEventListener("click", () => notificationSound.play(), { once: true });
            });
    }
});