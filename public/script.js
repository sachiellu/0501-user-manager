// 1. 獲取需要操作的 DOM 元素
const userForm = document.getElementById('user-form');
const nameInput = document.getElementById('name');
const emailInput = document.getElementById('email');
const userList = document.getElementById('user-list');
const errorMessage = document.getElementById('error-message');

// --- 函數定義 ---

// 2. 函數：獲取並顯示所有用戶
async function fetchAndDisplayUsers() {
    errorMessage.textContent = ''; // 清除舊的錯誤訊息
    userList.innerHTML = '<li>載入中...</li>'; // 顯示載入提示

    try {
        // 向後端 API 發送 GET 請求
        const response = await fetch('/api/users');

        if (!response.ok) {
            // 如果伺服器回應非 2xx 狀態碼
            throw new Error(`伺服器錯誤: ${response.status} ${response.statusText}`);
        }

        const users = await response.json(); // 解析回應的 JSON 資料

        // 清空現有列表
        userList.innerHTML = '';

        if (users.length === 0) {
            userList.innerHTML = '<li>目前沒有用戶</li>';
        } else {
            // 遍歷用戶資料，為每個用戶建立列表項 (li)
            users.forEach(user => {
                const li = document.createElement('li');
                li.innerHTML = `<span>ID:</span> ${user.id} | <span>姓名:</span> ${user.name} | <span>Email:</span> ${user.email}`;
                userList.appendChild(li); // 將 li 添加到 ul 中
            });
        }
    } catch (error) {
        console.error('獲取用戶列表失敗:', error);
        userList.innerHTML = '<li>載入用戶列表失敗</li>'; // 在列表區域顯示錯誤
        errorMessage.textContent = `無法載入用戶列表: ${error.message}`; // 在表單下方顯示錯誤
    }
}

// 3. 函數：處理表單提交 (新增用戶)
async function handleAddUser(event) {
    event.preventDefault(); // 防止表單的預設提交行為 (頁面重新載入)
    errorMessage.textContent = ''; // 清除舊的錯誤訊息

    const name = nameInput.value.trim(); // 獲取輸入值並去除頭尾空格
    const email = emailInput.value.trim();

    // 基本前端驗證 (雖然 HTML 有 required，但 JS 也做一次更好)
    if (!name || !email) {
        errorMessage.textContent = '姓名和 Email 為必填項';
        return;
    }

    try {
        // 向後端 API 發送 POST 請求
        const response = await fetch('/api/users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json', // 告訴伺服器我們發送的是 JSON
            },
            body: JSON.stringify({ name, email }), // 將 JavaScript 物件轉換為 JSON 字串
        });

        const result = await response.json(); // 解析回應的 JSON

        if (!response.ok) {
            // 如果後端回傳錯誤 (例如 400, 409, 500)
            // 後端應該在 result 中包含 { error: '錯誤訊息' }
            throw new Error(result.error || `伺服器錯誤: ${response.status}`);
        }

        // 新增成功
        console.log('用戶新增成功:', result);
        nameInput.value = ''; // 清空表單輸入欄位
        emailInput.value = '';
        await fetchAndDisplayUsers(); // 重新獲取並顯示用戶列表

    } catch (error) {
        console.error('新增用戶失敗:', error);
        errorMessage.textContent = `新增失敗: ${error.message}`; // 在表單下方顯示錯誤
    }
}

// --- 事件監聽器 ---

// 4. 為表單的 submit 事件添加監聽器
userForm.addEventListener('submit', handleAddUser);

// --- 初始載入 ---

// 5. 頁面載入完成後，立即獲取並顯示用戶列表
document.addEventListener('DOMContentLoaded', fetchAndDisplayUsers);