document.addEventListener("DOMContentLoaded", function () {
    let stompClient = null;
    const chatContainer = document.getElementById("chatContainer");
    const joinChatBtn = document.getElementById("joinChatBtn");
    const sendMessageBtn = document.getElementById("sendMessageBtn");
    const leaveChatBtn = document.getElementById("leaveChatBtn");
    const messageInput = document.getElementById("messageInput");
    const messageArea = document.getElementById("messageArea");
    const onlineList = document.getElementById("onlineList");
    const messageHeader = document.getElementById("messageHeader");
    let selectedReceiver = null;

    joinChatBtn.addEventListener("click", function () {
        const user = JSON.parse(localStorage.getItem("user"));
        if (!user) {
            Swal.fire("Lỗi!", "Bạn cần đăng nhập để tham gia chat!", "error");
            return;
        }

        connect(user.username);
        playNotificationSound(); // Phát âm thanh khi tham gia chat
        chatContainer.classList.remove("d-none");
        joinChatBtn.classList.add("d-none");
        leaveChatBtn.classList.remove("d-none");
    });

    function connect(username) {
        console.log("User from localStorage: ", JSON.parse(localStorage.getItem("user")));
        const socket = new SockJS("http://157.66.24.154:8080/chat-websocket");
        stompClient = new StompJs.Client({
            webSocketFactory: () => socket,
            debug: function (str) {
                console.log("STOMP: " + str);
            }
        });

        stompClient.onConnect = function (frame) {
            console.log("Connected: " + frame);

            const privateSub = stompClient.subscribe("/user/" + username + "/queue/private", function (message) {
                console.log("Received private message from queue: ", message.body);
                const msg = JSON.parse(message.body);
                showMessage(msg);
            });
            console.log("Subscribed to /user/" + username + "/queue/private, sub ID: ", privateSub.id);

            stompClient.subscribe("/topic/public", function (message) {
                console.log("Public message: ", message.body);
                showMessage(JSON.parse(message.body));
            });

            stompClient.subscribe("/topic/online", function (message) {
                console.log("Online users: ", message.body);
                const onlineUsers = JSON.parse(message.body);
                updateOnlineList(onlineUsers);
            });

            console.log("Sending JOIN message...");
            stompClient.publish({
                destination: "/app/chat.addUser",
                body: JSON.stringify({
                    sender: username,
                    type: "JOIN"
                })
            });
        };

        stompClient.onStompError = function (error) {
            console.error("WebSocket connection error: ", error);
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
            // Hiển thị tin nhắn ngay cho người gửi
            showMessage(chatMessage);
            stompClient.publish({
                destination: "/app/chat.sendPrivateMessage/" + selectedReceiver,
                body: JSON.stringify(chatMessage)
            });
            messageInput.value = "";
            console.log("Sent private message to: " + selectedReceiver);
        } else {
            console.error("STOMP client not connected or no message content");
        }
    }

    leaveChatBtn.addEventListener("click", function () {
        const user = JSON.parse(localStorage.getItem("user"));
        if (stompClient) {
            stompClient.publish({
                destination: "/app/chat.removeUser",
                body: JSON.stringify({
                    sender: user.username,
                    type: "LEAVE"
                })
            });
            stompClient.deactivate();
            chatContainer.classList.add("d-none");
            joinChatBtn.classList.remove("d-none");
            leaveChatBtn.classList.add("d-none");
            messageArea.innerHTML = "";
            onlineList.innerHTML = "";
            selectedReceiver = null;
            messageHeader.textContent = "Chọn người để chat";
        }
    });

    function showMessage(message) {
        const user = JSON.parse(localStorage.getItem("user"));
        console.log("Showing message: ", message, "Current user: ", user.username);
        // Hiển thị tất cả tin nhắn liên quan đến người dùng hiện tại
        if (message.sender === user.username || message.receiver === user.username) {
            const messageElement = document.createElement("div");
            messageElement.classList.add("message");
            messageElement.classList.add(message.sender === user.username ? "sent" : "received");
            messageElement.innerHTML = `<div class="message-content">${message.content}</div>`;
            messageArea.appendChild(messageElement);
            messageArea.scrollTop = messageArea.scrollHeight;
        }
        // Phát âm thanh khi nhận tin nhắn private (type = CHAT) từ người khác
        if (message.receiver === user.username && message.type === "CHAT") {
            playNotificationSound();
        }
    }

    function updateOnlineList(onlineUsers) {
        onlineList.innerHTML = "";
        onlineUsers.forEach(user => {
            const li = document.createElement("li");
            li.textContent = user;
            li.addEventListener("click", function () {
                selectedReceiver = user;
                messageHeader.textContent = "Chat với " + user;
                onlineList.querySelectorAll("li").forEach(item => item.classList.remove("active"));
                li.classList.add("active");
                loadChatHistory(user);
            });
            onlineList.appendChild(li);
        });
    }

    async function loadChatHistory(receiver) {
        const user = JSON.parse(localStorage.getItem("user"));
        try {
            const response = await fetch(`http://157.66.24.154:8080/chat/history?sender=${user.username}&receiver=${receiver}`);
            const history = await response.json();
            messageArea.innerHTML = "";
            history.forEach(msg => showMessage(msg));
        } catch (error) {
            console.error("Error loading chat history: ", error);
        }
    }

    function playNotificationSound() {
        const notificationSound = document.getElementById("notificationSound");
        notificationSound.play()
            .then(() => console.log("Notification sound played successfully"))
            .catch(error => {
                console.error("Error playing notification sound: ", error);
                // Thử phát lại sau khi người dùng tương tác
                document.addEventListener("click", () => notificationSound.play(), { once: true });
            });
    }
});