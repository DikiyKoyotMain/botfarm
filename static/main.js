let playerId = null;
let playerData = null;
let gameObjects = [];
let isRotated = false;
let autoHarvestInterval = null;
let placementMode = false;
let selectedBuildingType = null;
let placementPreview = null;

// Новая система транспортировки ресурсов
let resources = {
    wheat: 0,
    cotton: 0,
    sugarcane: 0,
    wood: 0,
    milk: 0,
    eggs: 0,
    wool: 0
};

let warehouse = {
    wheat: 0,
    cotton: 0,
    sugarcane: 0,
    wood: 0,
    milk: 0,
    eggs: 0,
    wool: 0
};

let vehicle = {
    isAway: false,
    returnTime: null,
    cargo: {}
};

// Инициализация Telegram Web App
let tg = window.Telegram.WebApp;
if (tg && tg.initData) {
    tg.ready();
    tg.expand();
}

// Иконки для разных типов зданий
const BUILDING_ICONS = {
    // FARM
    cotton_field: "🌱",
    sugarcane_field: "🎋",
    wheat_field: "🌾",
    tree_farm: "🌳",
    well: "💧",
    farm_house: "🏠",
    salt_field: "🧂",
    lumberjack_house: "🪓",
    wood_shed: "🪵",
    silo: "🗼",
    storehouse: "🏪",
    wind_pump: "💨",
    wind_mill: "🌪️",
    farm_tractor: "🚜",
    bakery: "🥖",
    cakery: "🎂",
    logger_house: "🪓",
    
    // RANCH
    ranch_house: "🐄",
    feed_mill: "🌾",
    trough: "🥣",
    chicken_coop: "🐔",
    sheep_pen: "🐑",
    milk_barn: "🥛",
    atv: "🏎️",
    
    // TERRAIN
    dirt_road: "🛣️",
    pasture: "🌿",
    paved_road: "🛣️",
    pond: "🌊",
    
    // INDUSTRIAL
    oil_pump: "⛽",
    water_pump: "💧",
    water_tower: "🗼",
    warehouse: "🏭",
    water_facility: "🏭",
    wind_turbine: "💨",
    worker_house: "🏠",
    fuel_storage: "⛽",
    refinery: "🏭",
    iron_mine: "⛏️",
    lumber_mill: "🪵",
    power_plant: "⚡",
    forklift: "🚛",
    fabric_plant: "🧵",
    steel_mill: "🏭",
    nuclear_power: "☢️",
    
    // TRADE
    trade_depot: "📦",
    trade_pier: "🚢",
    neighbor_delivery: "🚚",
    freight_pier: "🚢"
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
    // FARM - Зеленые оттенки
    cotton_field: "#27ae60",
    sugarcane_field: "#2ecc71",
    wheat_field: "#16a085",
    tree_farm: "#27ae60",
    well: "#3498db",
    farm_house: "#e74c3c",
    salt_field: "#ecf0f1",
    lumberjack_house: "#8b4513",
    wood_shed: "#a0522d",
    silo: "#34495e",
    storehouse: "#95a5a6",
    wind_pump: "#3498db",
    wind_mill: "#f39c12",
    farm_tractor: "#e67e22",
    bakery: "#e74c3c",
    cakery: "#9b59b6",
    logger_house: "#8b4513",
    
    // RANCH - Коричневые оттенки
    ranch_house: "#8b4513",
    feed_mill: "#d35400",
    trough: "#a0522d",
    chicken_coop: "#f39c12",
    sheep_pen: "#95a5a6",
    milk_barn: "#ecf0f1",
    atv: "#e67e22",
    
    // TERRAIN - Серые оттенки
    dirt_road: "#95a5a6",
    pasture: "#27ae60",
    paved_road: "#7f8c8d",
    pond: "#3498db",
    
    // INDUSTRIAL - Синие оттенки
    oil_pump: "#2c3e50",
    water_pump: "#3498db",
    water_tower: "#2980b9",
    warehouse: "#34495e",
    water_facility: "#5dade2",
    wind_turbine: "#85c1e9",
    worker_house: "#85929e",
    fuel_storage: "#2c3e50",
    refinery: "#1a5276",
    iron_mine: "#7b7d7d",
    lumber_mill: "#8b4513",
    power_plant: "#f39c12",
    forklift: "#e67e22",
    fabric_plant: "#9b59b6",
    steel_mill: "#2c3e50",
    nuclear_power: "#e74c3c",
    
    // TRADE - Фиолетовые оттенки
    trade_depot: "#8e44ad",
    trade_pier: "#9b59b6",
    neighbor_delivery: "#a569bd",
    freight_pier: "#6c5ce7"
};

// Стоимость зданий
const BUILDING_COSTS = {
    // FARM
    cotton_field: 250,
    sugarcane_field: 250,
    wheat_field: 250,
    tree_farm: 500,
    well: 1250,
    farm_house: 1250,
    salt_field: 1250,
    lumberjack_house: 2500,
    wood_shed: 5000,
    silo: 10000,
    storehouse: 20000,
    wind_pump: 25000,
    wind_mill: 15000,
    farm_tractor: 175000,
    bakery: 200000,
    cakery: 250000,
    logger_house: 250000,
    
    // RANCH
    ranch_house: 1250,
    feed_mill: 5000,
    trough: 5000,
    chicken_coop: 30000,
    sheep_pen: 40000,
    milk_barn: 50000,
    atv: 50000,
    
    // TERRAIN
    dirt_road: 1000,
    pasture: 5000,
    paved_road: 10000,
    pond: 20000,
    
    // INDUSTRIAL
    oil_pump: 1250,
    water_pump: 5000,
    water_tower: 5000,
    warehouse: 10000,
    water_facility: 10000,
    wind_turbine: 2500,
    worker_house: 2500,
    fuel_storage: 15000,
    refinery: 15000,
    iron_mine: 25000,
    lumber_mill: 50000,
    power_plant: 100000,
    forklift: 125000,
    fabric_plant: 250000,
    steel_mill: 2000000,
    nuclear_power: 10000000,
    
    // TRADE
    trade_depot: 5000,
    trade_pier: 10000,
    neighbor_delivery: 15000,
    freight_pier: 250000
};

// Опыт за покупки
const XP_REWARDS = {
    // FARM
    cotton_field: 5,
    sugarcane_field: 5,
    wheat_field: 5,
    tree_farm: 8,
    well: 15,
    farm_house: 20,
    salt_field: 10,
    lumberjack_house: 25,
    wood_shed: 30,
    silo: 50,
    storehouse: 60,
    wind_pump: 80,
    wind_mill: 40,
    farm_tractor: 200,
    bakery: 250,
    cakery: 300,
    logger_house: 300,
    
    // RANCH
    ranch_house: 15,
    feed_mill: 30,
    trough: 25,
    chicken_coop: 100,
    sheep_pen: 150,
    milk_barn: 200,
    atv: 150,
    
    // TERRAIN
    dirt_road: 10,
    pasture: 20,
    paved_road: 40,
    pond: 60,
    
    // INDUSTRIAL
    oil_pump: 15,
    water_pump: 30,
    water_tower: 25,
    warehouse: 40,
    water_facility: 35,
    wind_turbine: 20,
    worker_house: 15,
    fuel_storage: 50,
    refinery: 100,
    iron_mine: 150,
    lumber_mill: 200,
    power_plant: 300,
    forklift: 250,
    fabric_plant: 400,
    steel_mill: 1000,
    nuclear_power: 5000,
    
    // TRADE
    trade_depot: 30,
    trade_pier: 50,
    neighbor_delivery: 40,
    freight_pier: 300,
    
    // Workers
    farmer: 5,
    lumberjack: 25,
    rancher: 5,
    industrial_worker: 15,
    faster_farmer: 50,
    faster_lumberjack: 50,
    faster_rancher: 50,
    faster_worker: 30
};

// Размеры зданий (сколько квадратов занимает)
const BUILDING_SIZES = {
    // FARM - 1x1 квадрат
    cotton_field: { width: 1, height: 1 },
    sugarcane_field: { width: 1, height: 1 },
    wheat_field: { width: 1, height: 1 },
    tree_farm: { width: 2, height: 2 }, // 4 квадрата
    well: { width: 1, height: 1 },
    farm_house: { width: 2, height: 2 }, // 4 квадрата
    salt_field: { width: 1, height: 1 },
    lumberjack_house: { width: 2, height: 2 }, // 4 квадрата
    wood_shed: { width: 2, height: 2 }, // 4 квадрата
    silo: { width: 1, height: 1 },
    storehouse: { width: 3, height: 2 }, // 6 квадратов
    wind_pump: { width: 1, height: 1 },
    wind_mill: { width: 2, height: 2 }, // 4 квадрата
    bakery: { width: 3, height: 2 }, // 6 квадратов
    cakery: { width: 3, height: 2 }, // 6 квадратов
    
    // RANCH
    ranch_house: { width: 2, height: 2 }, // 4 квадрата
    feed_mill: { width: 2, height: 2 }, // 4 квадрата
    trough: { width: 1, height: 1 },
    chicken_coop: { width: 2, height: 2 }, // 4 квадрата
    sheep_pen: { width: 3, height: 2 }, // 6 квадратов
    milk_barn: { width: 3, height: 2 }, // 6 квадратов
    
    // TERRAIN
    dirt_road: { width: 1, height: 1 },
    pasture: { width: 2, height: 2 }, // 4 квадрата
    paved_road: { width: 1, height: 1 },
    pond: { width: 2, height: 2 }, // 4 квадрата
    
    // INDUSTRIAL
    oil_pump: { width: 1, height: 1 },
    water_pump: { width: 1, height: 1 },
    water_tower: { width: 1, height: 1 },
    warehouse: { width: 3, height: 2 }, // 6 квадратов
    wind_turbine: { width: 1, height: 1 },
    worker_house: { width: 2, height: 2 }, // 4 квадрата
    refinery: { width: 3, height: 3 }, // 9 квадратов
    iron_mine: { width: 2, height: 2 }, // 4 квадрата
    lumber_mill: { width: 3, height: 2 }, // 6 квадратов
    power_plant: { width: 4, height: 3 }, // 12 квадратов
    fabric_plant: { width: 4, height: 3 }, // 12 квадратов
    
    // TRADE
    trade_depot: { width: 2, height: 2 }, // 4 квадрата
    trade_pier: { width: 3, height: 2 }, // 6 квадратов
    neighbor_delivery: { width: 2, height: 2 } // 4 квадрата
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
    addGameObject('building', 250, 200, '🌾', 'wheat_field');
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
    // Обновляем деньги
    document.getElementById("goldCount").innerText = data.money || 1000;
    
    // Обновляем новые ресурсы
    document.getElementById("bagsCount").innerText = resources.wheat || 0;
    document.getElementById("bricksCount").innerText = resources.cotton || 0;
    document.getElementById("barrelsCount").innerText = resources.wood || 0;
    document.getElementById("plantsCount").innerText = resources.milk || 0;
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
    if (!playerData) return;
    
    // Автоматическое производство ресурсов на полях
    // Пшеничные поля производят пшеницу
    const wheatFields = gameObjects.filter(obj => obj.buildingType === 'wheat_field').length;
    if (wheatFields > 0) {
        resources.wheat += wheatFields * 10; // 10 пшеницы за минуту на поле
    }
    
    // Хлопковые поля производят хлопок
    const cottonFields = gameObjects.filter(obj => obj.buildingType === 'cotton_field').length;
    if (cottonFields > 0) {
        resources.cotton += cottonFields * 8; // 8 хлопка за минуту на поле
    }
    
    // Сахарные поля производят сахар
    const sugarcaneFields = gameObjects.filter(obj => obj.buildingType === 'sugarcane_field').length;
    if (sugarcaneFields > 0) {
        resources.sugarcane += sugarcaneFields * 6; // 6 сахара за минуту на поле
    }
    
    // Лесные фермы производят дерево
    const treeFarms = gameObjects.filter(obj => obj.buildingType === 'tree_farm').length;
    if (treeFarms > 0) {
        resources.wood += treeFarms * 5; // 5 дерева за минуту на ферме
    }
    
    // Молочные фермы производят молоко
    const milkBarns = gameObjects.filter(obj => obj.buildingType === 'milk_barn').length;
    if (milkBarns > 0) {
        resources.milk += milkBarns * 3; // 3 молока за минуту на ферме
    }
    
    // Курятники производят яйца
    const chickenCoops = gameObjects.filter(obj => obj.buildingType === 'chicken_coop').length;
    if (chickenCoops > 0) {
        resources.eggs += chickenCoops * 4; // 4 яйца за минуту в курятнике
    }
    
    // Овчарни производят шерсть
    const sheepPens = gameObjects.filter(obj => obj.buildingType === 'sheep_pen').length;
    if (sheepPens > 0) {
        resources.wool += sheepPens * 2; // 2 шерсти за минуту в овчарне
    }
    
    // Показываем уведомление о производстве
    let totalProduced = 0;
    for (let resource in resources) {
        totalProduced += resources[resource];
    }
    
    if (totalProduced > 0) {
        showNotification(`🌾 Произведено товаров: ${totalProduced} единиц`);
    }
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

function buyItem(type, name, cost, customX = null, customY = null) {
    if (!playerId) return;
    
    // Проверяем, есть ли деньги
    if (playerData && playerData.money < cost) {
        showNotification("Недостаточно денег!");
        return;
    }
    
    // Определяем тип покупки
    let endpoint = '';
    let params = '';
    
    // Список всех зданий
    const allBuildings = [
        'cotton_field', 'sugarcane_field', 'wheat_field', 'tree_farm', 'well', 'farm_house', 
        'salt_field', 'lumberjack_house', 'wood_shed', 'silo', 'storehouse', 'wind_pump', 
        'wind_mill', 'bakery', 'cakery', 'ranch_house', 'feed_mill', 'trough', 'chicken_coop', 
        'sheep_pen', 'milk_barn', 'dirt_road', 'pasture', 'paved_road', 'pond', 'oil_pump', 
        'water_pump', 'water_tower', 'warehouse', 'wind_turbine', 'worker_house', 'refinery', 
        'iron_mine', 'lumber_mill', 'power_plant', 'fabric_plant', 'trade_depot', 'trade_pier', 
        'neighbor_delivery'
    ];
    
    // Список всех работников
    const allWorkers = [
        'farmer', 'lumberjack', 'rancher', 'industrial_worker', 'faster_farmer', 
        'faster_lumberjack', 'faster_rancher', 'faster_worker'
    ];
    
    // Список всей техники
    const allVehicles = ['farm_tractor', 'atv', 'forklift'];
    
    if (allBuildings.includes(type)) {
        endpoint = '/build/';
        params = `player_id=${playerId}&building_type=${type}`;
    } else if (allWorkers.includes(type)) {
        endpoint = '/hire_worker/';
        params = `player_id=${playerId}&worker_type=${type}&name=${name}`;
    } else if (allVehicles.includes(type)) {
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
            if (allBuildings.includes(type)) {
                let x, y;
                if (customX !== null && customY !== null) {
                    // Используем кастомные координаты для ручного размещения
                    x = customX;
                    y = customY;
                } else {
                    // Автоматическое размещение
                    x = 150 + (gameObjects.filter(obj => obj.type === 'building').length * 100);
                    y = 150 + (gameObjects.filter(obj => obj.type === 'building').length * 80);
                }
                const icon = BUILDING_ICONS[type] || '🏠';
                addGameObject('building', x, y, icon, type);
            }
            
            if (!placementMode) {
                closeShop();
            }
            loadPlayerData();
        })
        .catch(error => {
            console.error("Error:", error);
            showNotification("Ошибка покупки!");
        });
}

function showResourceInfo(resourceType, resourceName) {
    let description = '';
    let count = 0;
    
    switch(resourceType) {
        case 'gold':
            description = 'Основная валюта игры. Зарабатывается продажей товаров.';
            count = playerData ? playerData.money : 0;
            break;
        case 'wheat':
            description = 'Пшеница с полей. Производится пшеничными полями.';
            count = resources.wheat || 0;
            break;
        case 'cotton':
            description = 'Хлопок с полей. Производится хлопковыми полями.';
            count = resources.cotton || 0;
            break;
        case 'wood':
            description = 'Дерево с лесных ферм. Производится лесными фермами.';
            count = resources.wood || 0;
            break;
        case 'milk':
            description = 'Молоко с молочных ферм. Производится молочными фермами.';
            count = resources.milk || 0;
            break;
    }
    
    showNotification(`${resourceName}: ${description} (${count} единиц)`);
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

function startPlacement() {
    if (!playerData || !playerData.money) {
        showNotification("Нет денег для покупки!");
        return;
    }
    
    // Показываем меню выбора здания
    const buildingTypes = [
        // FARM
        { type: 'cotton_field', name: 'Хлопковое поле', cost: 250, icon: '🌱', size: '1x1' },
        { type: 'sugarcane_field', name: 'Сахарное поле', cost: 250, icon: '🎋', size: '1x1' },
        { type: 'wheat_field', name: 'Пшеничное поле', cost: 250, icon: '🌾', size: '1x1' },
        { type: 'tree_farm', name: 'Лесная ферма', cost: 500, icon: '🌳', size: '2x2' },
        { type: 'well', name: 'Колодец', cost: 1250, icon: '💧', size: '1x1' },
        { type: 'farm_house', name: 'Фермерский дом', cost: 1250, icon: '🏠', size: '2x2' },
        { type: 'salt_field', name: 'Соляное поле', cost: 1250, icon: '🧂', size: '1x1' },
        { type: 'lumberjack_house', name: 'Дом лесоруба', cost: 2500, icon: '🪓', size: '2x2' },
        { type: 'wood_shed', name: 'Дровяной сарай', cost: 5000, icon: '🪵', size: '2x2' },
        { type: 'silo', name: 'Силос', cost: 10000, icon: '🗼', size: '1x1' },
        { type: 'storehouse', name: 'Склад', cost: 20000, icon: '🏪', size: '3x2' },
        { type: 'wind_pump', name: 'Ветряной насос', cost: 25000, icon: '💨', size: '1x1' },
        { type: 'wind_mill', name: 'Ветряная мельница', cost: 15000, icon: '🌪️', size: '2x2' },
        { type: 'bakery', name: 'Пекарня', cost: 200000, icon: '🥖', size: '3x2' },
        { type: 'cakery', name: 'Кондитерская', cost: 250000, icon: '🎂', size: '3x2' },
        
        // RANCH
        { type: 'ranch_house', name: 'Ранчо', cost: 1250, icon: '🐄', size: '2x2' },
        { type: 'feed_mill', name: 'Кормовой завод', cost: 5000, icon: '🌾', size: '2x2' },
        { type: 'trough', name: 'Кормушка', cost: 5000, icon: '🥣', size: '1x1' },
        { type: 'chicken_coop', name: 'Курятник', cost: 30000, icon: '🐔', size: '2x2' },
        { type: 'sheep_pen', name: 'Овчарня', cost: 40000, icon: '🐑', size: '3x2' },
        { type: 'milk_barn', name: 'Молочная ферма', cost: 50000, icon: '🥛', size: '3x2' },
        
        // TERRAIN
        { type: 'dirt_road', name: 'Грунтовая дорога', cost: 1000, icon: '🛣️', size: '1x1' },
        { type: 'pasture', name: 'Пастбище', cost: 5000, icon: '🌿', size: '2x2' },
        { type: 'paved_road', name: 'Асфальтовая дорога', cost: 10000, icon: '🛣️', size: '1x1' },
        { type: 'pond', name: 'Пруд', cost: 20000, icon: '🌊', size: '2x2' },
        
        // INDUSTRIAL
        { type: 'oil_pump', name: 'Нефтяная вышка', cost: 1250, icon: '⛽', size: '1x1' },
        { type: 'water_pump', name: 'Водяной насос', cost: 5000, icon: '💧', size: '1x1' },
        { type: 'water_tower', name: 'Водонапорная башня', cost: 5000, icon: '🗼', size: '1x1' },
        { type: 'warehouse', name: 'Склад', cost: 10000, icon: '🏭', size: '3x2' },
        { type: 'wind_turbine', name: 'Ветряная турбина', cost: 2500, icon: '💨', size: '1x1' },
        { type: 'worker_house', name: 'Дом рабочего', cost: 2500, icon: '🏠', size: '2x2' },
        { type: 'refinery', name: 'Нефтеперерабатывающий завод', cost: 15000, icon: '🏭', size: '3x3' },
        { type: 'iron_mine', name: 'Железный рудник', cost: 25000, icon: '⛏️', size: '2x2' },
        { type: 'lumber_mill', name: 'Лесопилка', cost: 50000, icon: '🪵', size: '3x2' },
        { type: 'power_plant', name: 'Электростанция', cost: 100000, icon: '⚡', size: '4x3' },
        { type: 'fabric_plant', name: 'Текстильная фабрика', cost: 250000, icon: '🧵', size: '4x3' },
        
        // TRADE
        { type: 'trade_depot', name: 'Торговая база', cost: 5000, icon: '📦', size: '2x2' },
        { type: 'trade_pier', name: 'Торговый причал', cost: 10000, icon: '🚢', size: '3x2' },
        { type: 'neighbor_delivery', name: 'Доставка соседям', cost: 15000, icon: '🚚', size: '2x2' }
    ];
    
    let menu = "Выберите здание для размещения:\n\n";
    let index = 1;
    buildingTypes.forEach(building => {
        if (playerData.money >= building.cost) {
            menu += `${index}. ${building.icon} ${building.name} (${building.size}) - $${building.cost}\n`;
            index++;
        }
    });
    
    const choice = prompt(menu);
    if (!choice) return;
    
    const buildingIndex = parseInt(choice) - 1;
    if (buildingIndex >= 0 && buildingIndex < buildingTypes.length) {
        const building = buildingTypes[buildingIndex];
        if (playerData.money >= building.cost) {
            selectedBuildingType = building.type;
            placementMode = true;
            showNotification(`Режим размещения: ${building.name} (${building.size}). Кликните на поле для размещения.`);
            document.getElementById("gameWorld").classList.add("placement-mode");
            
            // Добавляем обработчик движения мыши для предварительного просмотра
            document.getElementById("gameWorld").addEventListener('mousemove', showPlacementPreview);
        } else {
            showNotification("Недостаточно денег!");
        }
    }
}

function placeBuilding(x, y) {
    if (!placementMode || !selectedBuildingType) return;
    
    const building = {
        type: selectedBuildingType,
        name: getBuildingName(selectedBuildingType),
        cost: BUILDING_COSTS[selectedBuildingType]
    };
    
    // Покупаем здание
    buyItem(selectedBuildingType, building.name, building.cost, x, y);
    
    // Выходим из режима размещения
    exitPlacementMode();
}

function getBuildingName(type) {
    const names = {
        // FARM
        cotton_field: 'Хлопковое поле',
        sugarcane_field: 'Сахарное поле',
        wheat_field: 'Пшеничное поле',
        tree_farm: 'Лесная ферма',
        well: 'Колодец',
        farm_house: 'Фермерский дом',
        salt_field: 'Соляное поле',
        lumberjack_house: 'Дом лесоруба',
        wood_shed: 'Дровяной сарай',
        silo: 'Силос',
        storehouse: 'Склад',
        wind_pump: 'Ветряной насос',
        wind_mill: 'Ветряная мельница',
        bakery: 'Пекарня',
        cakery: 'Кондитерская',
        
        // RANCH
        ranch_house: 'Ранчо',
        feed_mill: 'Кормовой завод',
        trough: 'Кормушка',
        chicken_coop: 'Курятник',
        sheep_pen: 'Овчарня',
        milk_barn: 'Молочная ферма',
        
        // TERRAIN
        dirt_road: 'Грунтовая дорога',
        pasture: 'Пастбище',
        paved_road: 'Асфальтовая дорога',
        pond: 'Пруд',
        
        // INDUSTRIAL
        oil_pump: 'Нефтяная вышка',
        water_pump: 'Водяной насос',
        water_tower: 'Водонапорная башня',
        warehouse: 'Склад',
        wind_turbine: 'Ветряная турбина',
        worker_house: 'Дом рабочего',
        refinery: 'Нефтеперерабатывающий завод',
        iron_mine: 'Железный рудник',
        lumber_mill: 'Лесопилка',
        power_plant: 'Электростанция',
        fabric_plant: 'Текстильная фабрика',
        
        // TRADE
        trade_depot: 'Торговая база',
        trade_pier: 'Торговый причал',
        neighbor_delivery: 'Доставка соседям'
    };
    return names[type] || type;
}

function showPlacementPreview(e) {
    if (!placementMode || !selectedBuildingType) return;
    
    const gameWorld = document.getElementById("gameWorld");
    const rect = gameWorld.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Получаем размеры здания
    const buildingSize = BUILDING_SIZES[selectedBuildingType] || { width: 1, height: 1 };
    const gridSize = 40; // Размер одного квадрата сетки
    
    // Удаляем старый предварительный просмотр
    if (placementPreview) {
        placementPreview.remove();
    }
    
    // Создаем новый предварительный просмотр
    placementPreview = document.createElement('div');
    placementPreview.className = 'placement-preview';
    placementPreview.style.left = x + 'px';
    placementPreview.style.top = y + 'px';
    placementPreview.style.width = (buildingSize.width * gridSize) + 'px';
    placementPreview.style.height = (buildingSize.height * gridSize) + 'px';
    placementPreview.style.border = '3px dashed #fff';
    placementPreview.style.background = 'rgba(255,255,255,0.2)';
    placementPreview.style.position = 'absolute';
    placementPreview.style.pointerEvents = 'none';
    placementPreview.style.zIndex = '5';
    
    // Добавляем текст с размером
    placementPreview.innerHTML = `
        <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); 
                    color: white; font-size: 12px; font-weight: bold; text-align: center;">
            ${BUILDING_ICONS[selectedBuildingType]}<br>
            ${buildingSize.width}x${buildingSize.height}
        </div>
    `;
    
    gameWorld.appendChild(placementPreview);
}

function exitPlacementMode() {
    placementMode = false;
    selectedBuildingType = null;
    document.getElementById("gameWorld").classList.remove("placement-mode");
    
    // Удаляем обработчик движения мыши
    document.getElementById("gameWorld").removeEventListener('mousemove', showPlacementPreview);
    
    // Удаляем предварительный просмотр
    if (placementPreview) {
        placementPreview.remove();
        placementPreview = null;
    }
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

// Новая система транспортировки ресурсов
function sellGoods() {
    if (vehicle.isAway) {
        showNotification("Машина уже в пути!");
        return;
    }
    
    // Проверяем, есть ли товары на складе
    let totalGoods = 0;
    for (let resource in warehouse) {
        totalGoods += warehouse[resource];
    }
    
    if (totalGoods === 0) {
        showNotification("Нет товаров для продажи!");
        return;
    }
    
    // Отправляем машину
    vehicle.isAway = true;
    vehicle.returnTime = Date.now() + 60000; // 1 минута
    vehicle.cargo = { ...warehouse };
    
    // Очищаем склад
    for (let resource in warehouse) {
        warehouse[resource] = 0;
    }
    
    showNotification("🚛 Машина отправлена с товарами! Вернется через 1 минуту.");
    
    // Запускаем таймер возвращения
    setTimeout(() => {
        vehicle.isAway = false;
        vehicle.returnTime = null;
        
        // Рассчитываем прибыль
        let profit = 0;
        for (let resource in vehicle.cargo) {
            profit += vehicle.cargo[resource] * 10; // $10 за единицу товара
        }
        
        if (playerData) {
            playerData.money += profit;
            showNotification(`💰 Машина вернулась! Прибыль: $${profit}`);
            loadPlayerData();
        }
        
        vehicle.cargo = {};
    }, 60000);
}

function transportToWarehouse() {
    // Фермеры транспортируют товары с полей на склад
    let transported = false;
    
    for (let resource in resources) {
        if (resources[resource] > 0) {
            warehouse[resource] += resources[resource];
            resources[resource] = 0;
            transported = true;
        }
    }
    
    if (transported) {
        showNotification("👨‍🌾 Фермеры доставили товары на склад!");
    } else {
        showNotification("Нет товаров для транспортировки!");
    }
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

// Обработчик кликов для размещения зданий
document.addEventListener('click', function(e) {
    if (placementMode && e.target.id === 'gameWorld') {
        const rect = e.target.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        placeBuilding(x, y);
    }
});

// Автообновление данных каждые 10 секунд
setInterval(() => {
    if (playerId) {
        loadPlayerData();
    }
}, 10000); 