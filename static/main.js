let playerId = null;
let playerData = null;

// Инициализация Telegram Web App
let tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

// Иконки для разных типов
const ICONS = {
    farm: "🌾",
    warehouse: "🏠",
    refinery: "⛽",
    mine: "⛏️",
    farmer: "👨‍🌾",
    miner: "⛏️",
    driver: "🚛",
    worker: "👷",
    truck: "🚛",
    harvester: "🌾",
    excavator: "⛏️"
};

function createPlayer() {
    const name = document.getElementById("name").value;
    if (!name.trim()) {
        showNotification("Введите имя!");
        return;
    }
    
    const formData = new FormData();
    formData.append('name', name.trim());
    
    fetch(`/create_player/`, { 
        method: "POST",
        body: formData
    })
        .then(res => {
            if (!res.ok) {
                return res.json().then(err => {
                    throw new Error(err.detail || 'Ошибка создания игрока');
                });
            }
            return res.json();
        })
        .then(data => {
            playerId = data.id;
            document.getElementById("playerName").innerText = name;
            document.getElementById("loginSection").style.display = "none";
            document.getElementById("gameSection").style.display = "block";
            loadPlayerData();
            showNotification("Игрок создан успешно!");
        })
        .catch(error => {
            console.error("Error:", error);
            showNotification(error.message || "Ошибка создания игрока!");
        });
}

function loadPlayerData() {
    if (!playerId) return;
    
    fetch(`/player/${playerId}`)
        .then(res => {
            if (!res.ok) {
                throw new Error('Игрок не найден');
            }
            return res.json();
        })
        .then(data => {
            playerData = data;
            updateUI(data);
        })
        .catch(error => {
            console.error("Error loading player data:", error);
            showNotification("Ошибка загрузки данных игрока: " + error.message);
        });
}

function updateUI(data) {
    document.getElementById("money").innerText = `$${data.money}`;
    document.getElementById("level").innerText = data.level;
    
    // Обновляем прогресс-бар
    const progressPercent = 50;
    document.getElementById("expBar").style.width = progressPercent + "%";
    
    // Обновляем здания
    updateBuildingsGrid(data.buildings);
    
    // Обновляем работников
    updateWorkersGrid(data.workers);
    
    // Обновляем машины
    updateVehiclesGrid(data.vehicles);
}

function updateBuildingsGrid(buildings) {
    const grid = document.getElementById("buildingsGrid");
    grid.innerHTML = "";
    
    buildings.forEach(building => {
        const card = document.createElement("div");
        card.className = "item-card";
        card.innerHTML = `
            <div class="item-name">${ICONS[building.type]} ${building.type}</div>
            <div class="item-stats">
                Уровень: ${building.level}<br>
                Здоровье: ${building.health}%<br>
                Статус: ${building.is_working ? "✅ Работает" : "❌ Остановлен"}
            </div>
        `;
        grid.appendChild(card);
    });
}

function updateWorkersGrid(workers) {
    const grid = document.getElementById("workersGrid");
    grid.innerHTML = "";
    
    workers.forEach(worker => {
        const card = document.createElement("div");
        card.className = "item-card";
        card.innerHTML = `
            <div class="item-name">${ICONS[worker.type]} ${worker.name}</div>
            <div class="item-stats">
                Тип: ${worker.type}<br>
                Уровень: ${worker.level}<br>
                Эффективность: ${worker.efficiency}<br>
                Статус: ${worker.is_working ? "✅ Работает" : "❌ Отдыхает"}
            </div>
        `;
        grid.appendChild(card);
    });
}

function updateVehiclesGrid(vehicles) {
    const grid = document.getElementById("vehiclesGrid");
    grid.innerHTML = "";
    
    vehicles.forEach(vehicle => {
        const card = document.createElement("div");
        card.className = "item-card";
        card.innerHTML = `
            <div class="item-name">${ICONS[vehicle.type]} ${vehicle.name}</div>
            <div class="item-stats">
                Тип: ${vehicle.type}<br>
                Расход топлива: ${vehicle.fuel_consumption}<br>
                Вместимость: ${vehicle.capacity}<br>
                Статус: ${vehicle.is_working ? "✅ Работает" : "❌ Остановлен"}
            </div>
        `;
        grid.appendChild(card);
    });
}

function produce() {
    fetch(`/produce/?player_id=${playerId}`, { method: "POST" })
        .then(res => res.json())
        .then(data => {
            showNotification(`🌾 Урожай собран! +${data.income}$`);
            loadPlayerData();
        })
        .catch(error => {
            console.error("Error:", error);
            showNotification("Ошибка сбора урожая!");
        });
}

function upgrade() {
    fetch(`/upgrade/?player_id=${playerId}`, { method: "POST" })
        .then(res => res.json())
        .then(data => {
            showNotification(`⭐ Уровень повышен! Новый уровень: ${data.level}`);
            loadPlayerData();
        })
        .catch(error => {
            console.error("Error:", error);
            showNotification("Ошибка улучшения!");
        });
}

function buildBuilding(buildingType) {
    fetch(`/build/?player_id=${playerId}&building_type=${buildingType}`, { method: "POST" })
        .then(res => res.json())
        .then(data => {
            showNotification(`🏗️ ${buildingType} построен!`);
            closeModal('buildModal');
            loadPlayerData();
        })
        .catch(error => {
            console.error("Error:", error);
            showNotification("Ошибка строительства!");
        });
}

function hireWorker(workerType) {
    const name = document.getElementById("workerName").value;
    if (!name.trim()) {
        showNotification("Введите имя работника!");
        return;
    }
    
    fetch(`/hire_worker/?player_id=${playerId}&worker_type=${workerType}&name=${encodeURIComponent(name)}`, { method: "POST" })
        .then(res => res.json())
        .then(data => {
            showNotification(`👷 ${workerType} нанят!`);
            document.getElementById("workerName").value = "";
            closeModal('workerModal');
            loadPlayerData();
        })
        .catch(error => {
            console.error("Error:", error);
            showNotification("Ошибка найма работника!");
        });
}

function buyVehicle(vehicleType) {
    const name = document.getElementById("vehicleName").value;
    if (!name.trim()) {
        showNotification("Введите название машины!");
        return;
    }
    
    fetch(`/buy_vehicle/?player_id=${playerId}&vehicle_type=${vehicleType}&name=${encodeURIComponent(name)}`, { method: "POST" })
        .then(res => res.json())
        .then(data => {
            showNotification(`🚛 ${vehicleType} куплен!`);
            document.getElementById("vehicleName").value = "";
            closeModal('vehicleModal');
            loadPlayerData();
        })
        .catch(error => {
            console.error("Error:", error);
            showNotification("Ошибка покупки машины!");
        });
}

function showBuildModal() {
    document.getElementById("buildModal").style.display = "block";
}

function showWorkerModal() {
    document.getElementById("workerModal").style.display = "block";
}

function showVehicleModal() {
    document.getElementById("vehicleModal").style.display = "block";
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = "none";
}

function showNotification(message) {
    const notification = document.createElement("div");
    notification.className = "notification";
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add("show");
    }, 100);
    
    setTimeout(() => {
        notification.classList.remove("show");
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// Закрытие модальных окон при клике вне их
window.onclick = function(event) {
    const modals = document.getElementsByClassName("modal");
    for (let modal of modals) {
        if (event.target === modal) {
            modal.style.display = "none";
        }
    }
}

// Автообновление данных каждые 10 секунд
setInterval(() => {
    if (playerId) {
        loadPlayerData();
    }
}, 10000); 