let playerId = null;
let playerData = null;
let gameObjects = [];
let isRotated = false;

// Инициализация Telegram Web App
let tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

// Иконки для разных типов зданий
const BUILDING_ICONS = {
    house: "🏠",
    windmill: "🌪️",
    farm: "🌾",
    warehouse: "🏭",
    factory: "🏭",
    silo: "🗼",
    mine: "⛏️",
    refinery: "⛽"
};

// Иконки для работников
const WORKER_ICONS = {
    farmer: "👨‍🌾",
    miner: "⛏️",
    driver: "🚛",
    worker: "👷"
};

// Иконки для техники
const VEHICLE_ICONS = {
    truck: "🚛",
    harvester: "🌾",
    excavator: "⛏️"
};

// Цвета для зданий
const BUILDING_COLORS = {
    house: "#e74c3c",
    windmill: "#f39c12",
    farm: "#27ae60",
    warehouse: "#3498db",
    factory: "#9b59b6",
    silo: "#34495e",
    mine: "#8b4513",
    refinery: "#e67e22"
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
            document.getElementById("topPanel").style.display = "flex";
            document.getElementById("resourcesPanel").style.display = "block";
            document.getElementById("actionsPanel").style.display = "block";
            document.getElementById("bottomPanel").style.display = "flex";
            loadPlayerData();
            initializeGameWorld();
            showNotification("Игрок создан успешно!");
        })
        .catch(error => {
            console.error("Error:", error);
            showNotification(error.message || "Ошибка создания игрока!");
        });
}

function initializeGameWorld() {
    const gameWorld = document.getElementById("gameWorld");
    
    // Добавляем начальные объекты
    addGameObject('tree', 100, 150, '🌳');
    addGameObject('tree', 300, 200, '🌳');
    addGameObject('tree', 500, 100, '🌳');
    addGameObject('water', 200, 300, '💧');
    addGameObject('water', 400, 250, '💧');
    
    // Добавляем начальную ферму
    addGameObject('building', 250, 200, '🌾', 'farm');
}

function addGameObject(type, x, y, icon, buildingType = null) {
    const gameWorld = document.getElementById("gameWorld");
    const obj = document.createElement("div");
    
    obj.className = `game-object ${type}`;
    obj.style.left = x + 'px';
    obj.style.top = y + 'px';
    obj.innerHTML = icon;
    
    if (buildingType) {
        obj.style.background = BUILDING_COLORS[buildingType] || "#667eea";
        obj.dataset.buildingType = buildingType;
    }
    
    if (type === 'building') {
        obj.classList.add('floating');
    }
    
    gameWorld.appendChild(obj);
    gameObjects.push({ element: obj, type, x, y, buildingType });
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
    document.getElementById("money").innerText = `$${data.money.toLocaleString()}`;
    document.getElementById("level").innerText = data.level;
    
    // Обновляем ресурсы
    updateResources(data);
    
    // Обновляем игровые объекты на основе зданий
    updateGameObjects(data.buildings);
}

function updateResources(data) {
    // Здесь можно добавить логику обновления ресурсов
    // Пока используем статические значения
}

function updateGameObjects(buildings) {
    // Очищаем существующие здания
    gameObjects = gameObjects.filter(obj => obj.type !== 'building');
    document.querySelectorAll('.game-object.building').forEach(el => el.remove());
    
    // Добавляем здания из данных
    buildings.forEach((building, index) => {
        const x = 200 + (index * 80);
        const y = 150 + (index * 60);
        const icon = BUILDING_ICONS[building.type] || '🏠';
        addGameObject('building', x, y, icon, building.type);
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

function rotateView() {
    const gameWorld = document.getElementById("gameWorld");
    isRotated = !isRotated;
    
    if (isRotated) {
        gameWorld.style.transform = "perspective(1000px) rotateX(45deg) rotateY(45deg) scale(0.8)";
    } else {
        gameWorld.style.transform = "perspective(1000px) rotateX(45deg) scale(0.8)";
    }
    
    showNotification("Вид изменен!");
}

function removeObject() {
    if (gameObjects.length > 0) {
        const lastObject = gameObjects.pop();
        lastObject.element.remove();
        showNotification("Объект удален!");
    } else {
        showNotification("Нет объектов для удаления!");
    }
}

function toggleSound() {
    showNotification("Звук переключен!");
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

// Обновление таймера каждую секунду
setInterval(() => {
    if (playerId) {
        updateTimer();
    }
}, 1000);

function updateTimer() {
    const now = new Date();
    const hours = String(23 - now.getHours()).padStart(2, '0');
    const minutes = String(59 - now.getMinutes()).padStart(2, '0');
    const seconds = String(59 - now.getSeconds()).padStart(2, '0');
    document.getElementById("timer").innerText = `${hours}:${minutes}:${seconds}`;
} 