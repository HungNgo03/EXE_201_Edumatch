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
    let selectedReceiverFullname = null;
    let unreadMessages = new Map();

    joinChatBtn.addEventListener("click", function () {
        const user = JSON.parse(localStorage.getItem("user"));
        if (!user) {
            Swal.fire("Lỗi!", "Bạn cần đăng nhập để tham gia chat!", "error");
            return;
        }
        connect(user.username);
        chatContainer.classList.remove("d-none");
        joinChatBtn.classList.add("d-none");
        leaveChatBtn.classList.remove("d-none");
        refreshUserList(user.username);
    });

    function connect(username) {
        const socket = new SockJS("http://157.66.24.154:8080/chat-websocket");
        stompClient = new StompJs.Client({
            webSocketFactory: () => socket,
        });

        stompClient.onConnect = function (frame) {
            stompClient.subscribe("/user/" + username + "/queue/private", function (message) {
                const msg = JSON.parse(message.body);
                showMessage(msg, username === msg.receiver);
                if (msg.sender !== username && msg.sender !== selectedReceiver) {
                    const count = unreadMessages.get(msg.sender) || 0;
                    unreadMessages.set(msg.sender, count + 1);
                    updateUserItem(msg.sender);
                }
            });

            stompClient.subscribe("/topic/public", function (message) {
                const msg = JSON.parse(message.body);
                if (msg.type === "JOIN" || msg.type === "LEAVE") {
                    refreshUserList(username);
                }
            });

            stompClient.subscribe("/topic/online", function (message) {
                const onlineUsers = JSON.parse(message.body);
                refreshUserList(username, onlineUsers);
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
            showMessage(chatMessage, false);
            stompClient.publish({
                destination: "/app/chat.sendPrivateMessage/" + selectedReceiver,
                body: JSON.stringify(chatMessage)
            });
            messageInput.value = "";
            updateUserItem(selectedReceiver);
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
        selectedReceiverFullname = null;
        messageHeader.textContent = "Chọn người để chat";
        unreadMessages.clear();
    }

    function showMessage(message, playSound = false) {
        const user = JSON.parse(localStorage.getItem("user"));

        if ((message.sender === user.username || message.receiver === user.username) &&
            (message.sender === selectedReceiver || message.receiver === selectedReceiver)) {
            const messageElement = document.createElement("div");
            messageElement.classList.add("message");
            messageElement.classList.add(message.sender === user.username ? "sent" : "received");
            if (message.receiver === user.username && message.sender !== user.username) {
                messageElement.classList.add("unread");
            }
            messageElement.innerHTML = `<div class="message-content">${message.content}</div>`;
            messageArea.appendChild(messageElement);
            messageArea.scrollTop = messageArea.scrollHeight;

            if (playSound) {
                playNotificationSound();
            }
        }
    }

    async function fetchChattedUsers(username) {
        try {
            const response = await fetch(`http://157.66.24.154:8080/chat/chatted-users?username=${username}`);
            const users = await response.json();
            // Loại bỏ trùng lặp ở phía client (dự phòng)
            const uniqueUsers = [];
            const seenUsernames = new Set();
            for (const user of users) {
                if (!seenUsernames.has(user.username)) {
                    seenUsernames.add(user.username);
                    uniqueUsers.push(user);
                }
            }
            return uniqueUsers;
        } catch (error) {
            console.error("Error fetching chatted users:", error);
            return [];
        }
    }

    async function refreshUserList(username, onlineUsers = []) {
        const userListUl = userList.querySelector("ul");
        userListUl.innerHTML = "";
        const users = await fetchChattedUsers(username);
        users.forEach(user => {
            const li = createUserItem(user, onlineUsers);
            userListUl.appendChild(li);
        });
    }

    function createUserItem(user, onlineUsers) {
        const li = document.createElement("li");
        li.textContent = user.fullname;
        li.dataset.username = user.username;
        const unreadCount = unreadMessages.get(user.username) || 0;
        if (unreadCount > 0) {
            const badge = document.createElement("span");
            badge.classList.add("unread-badge");
            badge.textContent = unreadCount;
            li.appendChild(badge);
        }
        if (onlineUsers.includes(user.username)) {
            li.classList.add("online");
        }
        if (user.username === selectedReceiver) {
            li.classList.add("active");
        }
        li.addEventListener("click", function () {
            selectedReceiver = user.username;
            selectedReceiverFullname = user.fullname;
            messageHeader.textContent = "Chat với " + user.fullname;
            userList.querySelectorAll("li").forEach(item => item.classList.remove("active"));
            li.classList.add("active");
            unreadMessages.set(user.username, 0);
            updateUserItem(user.username);
            loadChatHistory(user.username);
            messageArea.querySelectorAll(".message.unread").forEach(msg => msg.classList.remove("unread"));
        });
        return li;
    }

    function updateUserItem(username) {
        const items = userList.querySelectorAll("li");
        items.forEach(li => {
            if (li.dataset.username === username) {
                const unreadCount = unreadMessages.get(username) || 0;
                const badge = li.querySelector(".unread-badge");
                if (unreadCount > 0) {
                    if (!badge) {
                        const newBadge = document.createElement("span");
                        newBadge.classList.add("unread-badge");
                        newBadge.textContent = unreadCount;
                        li.appendChild(newBadge);
                    } else {
                        badge.textContent = unreadCount;
                    }
                } else if (badge) {
                    badge.remove();
                }
            }
        });
    }

    async function loadChatHistory(receiver) {
        const user = JSON.parse(localStorage.getItem("user"));
        try {
            const response = await fetch(`http://157.66.24.154:8080/chat/history?sender=${user.username}&receiver=${receiver}`);
            const history = await response.json();
            messageArea.innerHTML = "";
            history.forEach(msg => showMessage(msg, false));
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