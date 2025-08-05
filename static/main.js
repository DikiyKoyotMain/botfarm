let playerId = null;
let playerData = null;
let gameObjects = [];
let isRotated = false;
let autoHarvestInterval = null;

// Инициализация Telegram Web App
let tg = window.Telegram.WebApp;
if (tg && tg.initData) {
    tg.ready();
    tg.expand();
}

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

// Опыт за покупки
const XP_REWARDS = {
    house: 10,
    windmill: 15,
    farm: 8,
    warehouse: 20,
    factory: 25,
    silo: 18,
    farmer: 5,
    miner: 8,
    driver: 12,
    worker: 6,
    truck: 30,
    harvester: 25,
    excavator: 35
};

function createPlayer() {
    const nameInput = document.getElementById("name");
    const name = nameInput.value;
    
    if (!name.trim()) {
        showNotification("Введите имя!");
        nameInput.focus();
        return;
    }
    
    // Показываем индикатор загрузки
    const button = document.querySelector('.login-button');
    const originalText = button.textContent;
    if (button) {
        button.textContent = "Создание...";
        button.disabled = true;
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
            document.getElementById("loginSection").style.display = "none";
            document.getElementById("topResources").style.display = "flex";
            document.getElementById("actionButtons").style.display = "flex";
            loadPlayerData();
            initializeGameWorld();
            startAutoHarvest();
            showNotification("Игрок создан успешно!");
        })
        .catch(error => {
            console.error("Error:", error);
            showNotification(error.message || "Ошибка создания игрока!");
        })
        .finally(() => {
            // Восстанавливаем кнопку
            if (button) {
                button.textContent = originalText;
                button.disabled = false;
            }
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
    // Обновляем ресурсы
    updateResources(data);
    
    // Обновляем игровые объекты на основе зданий
    updateGameObjects(data.buildings);
}

function updateResources(data) {
    // Обновляем количество ресурсов
    document.getElementById("goldCount").innerText = data.money || 1000;
    document.getElementById("bagsCount").innerText = Math.floor(data.money / 100) || 9;
    document.getElementById("bricksCount").innerText = Math.floor(data.money / 50) || 22;
    document.getElementById("barrelsCount").innerText = Math.floor(data.money / 80) || 12;
    document.getElementById("plantsCount").innerText = Math.floor(data.money / 200) || 4;
}

function updateGameObjects(buildings) {
    // Очищаем существующие здания
    gameObjects = gameObjects.filter(obj => obj.type !== 'building');
    document.querySelectorAll('.game-object.building').forEach(el => el.remove());
    
    // Добавляем здания из данных
    buildings.forEach((building, index) => {
        const x = 150 + (index * 100);
        const y = 150 + (index * 80);
        const icon = BUILDING_ICONS[building.type] || '🏠';
        addGameObject('building', x, y, icon, building.type);
    });
}

// Автоматический сбор урожая
function startAutoHarvest() {
    if (autoHarvestInterval) {
        clearInterval(autoHarvestInterval);
    }
    
    autoHarvestInterval = setInterval(() => {
        if (playerId) {
            autoHarvest();
        }
    }, 5000); // Каждые 5 секунд
}

function autoHarvest() {
    fetch(`/produce/?player_id=${playerId}`, { method: "POST" })
        .then(res => res.json())
        .then(data => {
            showNotification(`🌾 Автосбор урожая! +${data.income}$`);
            loadPlayerData();
        })
        .catch(error => {
            console.error("Error:", error);
        });
}

// Магазин
function openShop() {
    document.getElementById("shopModal").style.display = "block";
}

function closeShop() {
    document.getElementById("shopModal").style.display = "none";
}

function switchTab(tabName) {
    // Скрываем все табы
    document.querySelectorAll('.shop-items').forEach(tab => {
        tab.style.display = 'none';
    });
    
    // Убираем активный класс со всех кнопок
    document.querySelectorAll('.shop-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Показываем нужный таб
    document.getElementById(tabName + 'Tab').style.display = 'grid';
    
    // Добавляем активный класс к кнопке
    event.target.classList.add('active');
}

function buyItem(type, name, cost) {
    if (!playerId) return;
    
    // Проверяем, есть ли деньги
    if (playerData && playerData.money < cost) {
        showNotification("Недостаточно денег!");
        return;
    }
    
    // Определяем тип покупки
    let endpoint = '';
    let params = '';
    
    if (['house', 'windmill', 'farm', 'warehouse', 'factory', 'silo'].includes(type)) {
        endpoint = '/build/';
        params = `player_id=${playerId}&building_type=${type}`;
    } else if (['farmer', 'miner', 'driver', 'worker'].includes(type)) {
        endpoint = '/hire_worker/';
        params = `player_id=${playerId}&worker_type=${type}&name=${name}`;
    } else {
        endpoint = '/buy_vehicle/';
        params = `player_id=${playerId}&vehicle_type=${type}&name=${name}`;
    }
    
    fetch(`${endpoint}?${params}`, { method: "POST" })
        .then(res => res.json())
        .then(data => {
            // Добавляем опыт за покупку
            const xp = XP_REWARDS[type] || 5;
            showNotification(`✅ ${name} куплен! +${xp} опыта`);
            
            // Размещаем здание на поле если это здание
            if (['house', 'windmill', 'farm', 'warehouse', 'factory', 'silo'].includes(type)) {
                const x = 150 + (gameObjects.filter(obj => obj.type === 'building').length * 100);
                const y = 150 + (gameObjects.filter(obj => obj.type === 'building').length * 80);
                const icon = BUILDING_ICONS[type] || '🏠';
                addGameObject('building', x, y, icon, type);
            }
            
            closeShop();
            loadPlayerData();
        })
        .catch(error => {
            console.error("Error:", error);
            showNotification("Ошибка покупки!");
        });
}

function showResourceInfo(resourceType, resourceName) {
    let description = '';
    switch(resourceType) {
        case 'gold':
            description = 'Основная валюта игры. Зарабатывается автоматически.';
            break;
        case 'bags':
            description = 'Мешки с зерном. Используются для кормления животных.';
            break;
        case 'bricks':
            description = 'Строительные материалы. Нужны для постройки зданий.';
            break;
        case 'barrels':
            description = 'Бочки с топливом. Используются для техники.';
            break;
        case 'plants':
            description = 'Растения и семена. Основа для выращивания культур.';
            break;
    }
    
    showNotification(`${resourceName}: ${description}`);
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

// Закрытие магазина при клике вне его
window.onclick = function(event) {
    const shopModal = document.getElementById("shopModal");
    if (event.target === shopModal) {
        shopModal.style.display = "none";
    }
}

// Принудительная активация всех кнопок
document.addEventListener('DOMContentLoaded', function() {
    // Добавляем обработчики для всех кнопок
    const allButtons = document.querySelectorAll('button');
    allButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            // Вызываем onclick если он есть
            if (this.onclick) {
                this.onclick.call(this, e);
            }
        });
        
        // Добавляем обработчик для touch событий
        button.addEventListener('touchstart', function(e) {
            e.preventDefault();
            this.style.transform = 'scale(0.95)';
        });
        
        button.addEventListener('touchend', function(e) {
            e.preventDefault();
            this.style.transform = '';
            
            // Вызываем onclick если он есть
            if (this.onclick) {
                this.onclick.call(this, e);
            }
        });
    });
});

// Обработчик Enter для поля ввода имени
document.addEventListener('DOMContentLoaded', function() {
    const nameInput = document.getElementById("name");
    if (nameInput) {
        nameInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                createPlayer();
            }
        });
        
        // Фокус на поле ввода при загрузке
        nameInput.focus();
        
        // Принудительный фокус для Telegram Web App
        setTimeout(() => {
            nameInput.focus();
            nameInput.click();
        }, 100);
        
        // Обработчик для принудительного фокуса при клике
        nameInput.addEventListener('click', function() {
            this.focus();
        });
        
        // Специальная обработка для Telegram Web App
        if (tg && tg.initData) {
            // Принудительно включаем pointer-events для всех интерактивных элементов
            const interactiveElements = document.querySelectorAll('input, button, .action-btn, .shop-item, .login-button');
            interactiveElements.forEach(el => {
                el.style.pointerEvents = 'auto';
                el.style.touchAction = 'manipulation';
                el.style.webkitTapHighlightColor = 'transparent';
            });
            
            // Добавляем обработчики событий для кнопок
            document.querySelectorAll('button').forEach(button => {
                button.addEventListener('touchstart', function(e) {
                    e.preventDefault();
                    this.style.transform = 'scale(0.95)';
                });
                
                button.addEventListener('touchend', function(e) {
                    e.preventDefault();
                    this.style.transform = '';
                });
            });
        }
    }
});

// Автообновление данных каждые 10 секунд
setInterval(() => {
    if (playerId) {
        loadPlayerData();
    }
}, 10000); 