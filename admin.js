document.addEventListener('DOMContentLoaded', () => {
    // Инициализируем Telegram WebApp
    if (window.Telegram && Telegram.WebApp) {
        Telegram.WebApp.ready();
        const user = Telegram.WebApp.initDataUnsafe.user;
        if (user && user.id) {
            fetchAdminData(user.id);
        } else {
            document.body.innerHTML = '<h1>Error: Unable to get user ID. Please open this page through your Telegram bot.</h1>';
        }
    } else {
        document.body.innerHTML = '<h1>Error: This application must be run inside Telegram.</h1>';
        // Для отладки можно использовать фейковый ID
        // const fakeAdminId = 123456789; 
        // fetchAdminData(fakeAdminId);
    }
});

async function fetchAdminData(adminId) {
    try {
        // Запрашиваем оба типа данных, передавая ID админа
        const [connectionsRes, userDataRes] = await Promise.all([
            fetch(`/api/admin/connections?user_id=${adminId}`),
            fetch(`/api/admin/user_data?user_id=${adminId}`)
        ]);

        if (connectionsRes.status === 403 || userDataRes.status === 403) {
            document.body.innerHTML = '<h1>Access denied. This panel can only be viewed by the administrator.</h1>';
            return;
        }

        if (connectionsRes.ok) {
            const connections = await connectionsRes.json();
            renderConnections(connections);
        } else {
            console.error('Failed to load connections');
        }

        if (userDataRes.ok) {
            const userData = await userDataRes.json();
            renderUserData(userData);
        } else {
            console.error('Failed to load user data');
        }

    } catch (error) {
        console.error('Error fetching admin data:', error);
    }
}

function renderConnections(connections) {
    const tableBody = document.querySelector('#connections-table tbody');
    if (!connections || connections.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="3">No active connections.</td></tr>';
        return;
    }
    tableBody.innerHTML = connections.map(conn => `
        <tr>
            <td>${conn.user_id}</td>
            <td>${conn.username || 'N/A'}</td>
            <td>${conn.business_connection_id}</td>
        </tr>
    `).join('');
}

function renderUserData(userData) {
    const container = document.getElementById('user-data-container');
    if (Object.keys(userData).length === 0) {
        container.innerHTML = '<p>No user data.</p>';
        return;
    }
    container.innerHTML = Object.entries(userData).map(([userId, data]) => `
        <div class="user-card">
            <h3>User ID: ${userId}</h3>
            <p>Attempts made: ${data.attempts}</p>
            <h4>Prizes won:</h4>
            ${data.gifts.length > 0 ? `
                <ul class="admin-prize-list">
                    ${data.gifts.map(gift => `
                        <li>
                            <img src="${gift.img}" alt="${gift.name}">
                            <span>${gift.name} (${gift.starPrice}⭐)</span>
                            <small>Won: ${gift.date}</small>
                        </li>
                    `).join('')}
                </ul>
            ` : '<p>No prizes.</p>'}
        </div>
    `).join('');
} 