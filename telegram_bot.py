import logging
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import Application, CommandHandler, CallbackQueryHandler, MessageHandler, filters, ContextTypes
from db import init_db, get_db
from models import Player, Building, Worker, Vehicle
from sqlalchemy.orm import Session
from db import SessionLocal
import asyncio
from datetime import datetime, timedelta

# Настройка логирования
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

# Константы игры
BUILDING_COSTS = {
    "farm": 200,
    "warehouse": 300,
    "refinery": 500,
    "mine": 400
}

WORKER_COSTS = {
    "farmer": 100,
    "miner": 150,
    "driver": 200,
    "worker": 120
}

VEHICLE_COSTS = {
    "truck": 800,
    "harvester": 600,
    "excavator": 1000
}

# Иконки для разных типов
ICONS = {
    "farm": "🌾",
    "warehouse": "🏠", 
    "refinery": "⛽",
    "mine": "⛏️",
    "farmer": "👨‍🌾",
    "miner": "⛏️",
    "driver": "🚛",
    "worker": "👷",
    "truck": "🚛",
    "harvester": "🌾",
    "excavator": "⛏️"
}

class TelegramGameBot:
    def __init__(self, token: str):
        self.token = token
        self.application = Application.builder().token(token).build()
        self.setup_handlers()
        init_db()
    
    def setup_handlers(self):
        """Настройка обработчиков команд"""
        self.application.add_handler(CommandHandler("start", self.start_command))
        self.application.add_handler(CommandHandler("profile", self.profile_command))
        self.application.add_handler(CommandHandler("build", self.build_command))
        self.application.add_handler(CommandHandler("hire", self.hire_command))
        self.application.add_handler(CommandHandler("buy", self.buy_command))
        self.application.add_handler(CommandHandler("produce", self.produce_command))
        self.application.add_handler(CommandHandler("upgrade", self.upgrade_command))
        self.application.add_handler(CommandHandler("help", self.help_command))
        
        # Обработчики для inline кнопок
        self.application.add_handler(CallbackQueryHandler(self.button_callback))
        
        # Обработчик текстовых сообщений для создания игрока
        self.application.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, self.handle_text))
    
    async def start_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Обработчик команды /start"""
        user_id = update.effective_user.id
        username = update.effective_user.username or update.effective_user.first_name
        
        with SessionLocal() as db:
            # Проверяем, существует ли игрок
            player = db.query(Player).filter(Player.name == str(user_id)).first()
            
            if not player:
                # Создаем нового игрока
                player = Player(name=str(user_id), money=1000, level=1)
                db.add(player)
                
                # Создаем начальную ферму
                farm = Building(player_id=player.id, building_type="farm", level=1)
                
                # Создаем начального фермера
                farmer = Worker(player_id=player.id, worker_type="farmer", name="Фермер Иван")
                
                # Создаем начальный грузовик
                truck = Vehicle(player_id=player.id, vehicle_type="truck", name="Грузовик №1")
                
                db.add_all([farm, farmer, truck])
                db.commit()
                
                welcome_text = f"""
🎮 Добро пожаловать в Фермерскую Игру!

👤 Игрок: {username}
💰 Деньги: {player.money}$
⭐ Уровень: {player.level}

🏗️ У вас есть:
🌾 Ферма (уровень 1)
👨‍🌾 Фермер Иван
🚛 Грузовик №1

Используйте команды:
/profile - посмотреть профиль
/build - построить здание
/hire - нанять работника
/buy - купить технику
/produce - собрать урожай
/upgrade - улучшить уровень
/help - справка
                """
            else:
                welcome_text = f"""
🎮 С возвращением в Фермерскую Игру!

👤 Игрок: {username}
💰 Деньги: {player.money}$
⭐ Уровень: {player.level}

Используйте команды:
/profile - посмотреть профиль
/build - построить здание
/hire - нанять работника
/buy - купить технику
/produce - собрать урожай
/upgrade - улучшить уровень
/help - справка
                """
        
        # Создаем кнопку для открытия Mini App
        keyboard = [
            [InlineKeyboardButton("🎮 Открыть игру", web_app={"url": "https://localhost:8000"})]
        ]
        reply_markup = InlineKeyboardMarkup(keyboard)
        
        await update.message.reply_text(welcome_text, reply_markup=reply_markup)
    
    async def profile_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Показать профиль игрока"""
        user_id = update.effective_user.id
        
        with SessionLocal() as db:
            player = db.query(Player).filter(Player.name == str(user_id)).first()
            if not player:
                await update.message.reply_text("❌ Игрок не найден. Используйте /start для начала игры.")
                return
            
            buildings = db.query(Building).filter(Building.player_id == player.id).all()
            workers = db.query(Worker).filter(Worker.player_id == player.id).all()
            vehicles = db.query(Vehicle).filter(Vehicle.player_id == player.id).all()
            
            # Формируем текст профиля
            profile_text = f"""
👤 **ПРОФИЛЬ ИГРОКА**

💰 Деньги: {player.money}$
⭐ Уровень: {player.level}
📈 Доход: {player.level * 10}$ за сбор

🏗️ **ЗДАНИЯ** ({len(buildings)}):
"""
            
            for building in buildings:
                status = "✅ Работает" if building.is_working else "❌ Остановлен"
                profile_text += f"{ICONS.get(building.building_type, '🏠')} {building.building_type.title()} (уровень {building.level})\n"
                profile_text += f"   Здоровье: {building.health}% | {status}\n\n"
            
            profile_text += f"👷 **РАБОТНИКИ** ({len(workers)}):\n"
            for worker in workers:
                status = "✅ Работает" if worker.is_working else "❌ Отдыхает"
                profile_text += f"{ICONS.get(worker.worker_type, '👷')} {worker.name}\n"
                profile_text += f"   Тип: {worker.worker_type} | Уровень: {worker.level} | Эффективность: {worker.efficiency}\n"
                profile_text += f"   {status}\n\n"
            
            profile_text += f"🚛 **ТЕХНИКА** ({len(vehicles)}):\n"
            for vehicle in vehicles:
                status = "✅ Работает" if vehicle.is_working else "❌ Остановлен"
                profile_text += f"{ICONS.get(vehicle.vehicle_type, '🚛')} {vehicle.name}\n"
                profile_text += f"   Тип: {vehicle.vehicle_type} | Расход топлива: {vehicle.fuel_consumption}\n"
                profile_text += f"   Вместимость: {vehicle.capacity} | {status}\n\n"
            
            await update.message.reply_text(profile_text, parse_mode='Markdown')
    
    async def build_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Показать меню строительства"""
        keyboard = [
            [InlineKeyboardButton(f"{ICONS['farm']} Ферма ({BUILDING_COSTS['farm']}$)", callback_data="build_farm")],
            [InlineKeyboardButton(f"{ICONS['warehouse']} Склад ({BUILDING_COSTS['warehouse']}$)", callback_data="build_warehouse")],
            [InlineKeyboardButton(f"{ICONS['refinery']} Завод ({BUILDING_COSTS['refinery']}$)", callback_data="build_refinery")],
            [InlineKeyboardButton(f"{ICONS['mine']} Шахта ({BUILDING_COSTS['mine']}$)", callback_data="build_mine")]
        ]
        reply_markup = InlineKeyboardMarkup(keyboard)
        
        await update.message.reply_text(
            "🏗️ **СТРОИТЕЛЬСТВО**\n\nВыберите здание для постройки:",
            reply_markup=reply_markup,
            parse_mode='Markdown'
        )
    
    async def hire_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Показать меню найма работников"""
        keyboard = [
            [InlineKeyboardButton(f"{ICONS['farmer']} Фермер ({WORKER_COSTS['farmer']}$)", callback_data="hire_farmer")],
            [InlineKeyboardButton(f"{ICONS['miner']} Шахтер ({WORKER_COSTS['miner']}$)", callback_data="hire_miner")],
            [InlineKeyboardButton(f"{ICONS['driver']} Водитель ({WORKER_COSTS['driver']}$)", callback_data="hire_driver")],
            [InlineKeyboardButton(f"{ICONS['worker']} Рабочий ({WORKER_COSTS['worker']}$)", callback_data="hire_worker")]
        ]
        reply_markup = InlineKeyboardMarkup(keyboard)
        
        await update.message.reply_text(
            "👷 **НАЕМ РАБОТНИКОВ**\n\nВыберите работника для найма:",
            reply_markup=reply_markup,
            parse_mode='Markdown'
        )
    
    async def buy_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Показать меню покупки техники"""
        keyboard = [
            [InlineKeyboardButton(f"{ICONS['truck']} Грузовик ({VEHICLE_COSTS['truck']}$)", callback_data="buy_truck")],
            [InlineKeyboardButton(f"{ICONS['harvester']} Комбайн ({VEHICLE_COSTS['harvester']}$)", callback_data="buy_harvester")],
            [InlineKeyboardButton(f"{ICONS['excavator']} Экскаватор ({VEHICLE_COSTS['excavator']}$)", callback_data="buy_excavator")]
        ]
        reply_markup = InlineKeyboardMarkup(keyboard)
        
        await update.message.reply_text(
            "🚛 **ПОКУПКА ТЕХНИКИ**\n\nВыберите технику для покупки:",
            reply_markup=reply_markup,
            parse_mode='Markdown'
        )
    
    async def produce_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Собрать урожай"""
        user_id = update.effective_user.id
        
        with SessionLocal() as db:
            player = db.query(Player).filter(Player.name == str(user_id)).first()
            if not player:
                await update.message.reply_text("❌ Игрок не найден. Используйте /start для начала игры.")
                return
            
            # Собираем урожай
            income = player.level * 10
            player.money += income
            db.commit()
            
            await update.message.reply_text(f"🌾 **Урожай собран!**\n\n💰 Получено: +{income}$\n💵 Баланс: {player.money}$", parse_mode='Markdown')
    
    async def upgrade_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Улучшить уровень"""
        user_id = update.effective_user.id
        
        with SessionLocal() as db:
            player = db.query(Player).filter(Player.name == str(user_id)).first()
            if not player:
                await update.message.reply_text("❌ Игрок не найден. Используйте /start для начала игры.")
                return
            
            cost = player.level * 200
            if player.money < cost:
                await update.message.reply_text(f"❌ **Недостаточно денег!**\n\n💰 Нужно: {cost}$\n💵 У вас: {player.money}$", parse_mode='Markdown')
                return
            
            player.money -= cost
            player.level += 1
            db.commit()
            
            await update.message.reply_text(f"⭐ **Уровень повышен!**\n\n🎉 Новый уровень: {player.level}\n💰 Потрачено: {cost}$\n💵 Баланс: {player.money}$", parse_mode='Markdown')
    
    async def help_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Показать справку"""
        help_text = """
🎮 **СПРАВКА ПО ИГРЕ**

**Основные команды:**
/start - Начать игру
/profile - Посмотреть профиль
/produce - Собрать урожай (+10$ × уровень)
/upgrade - Улучшить уровень (стоимость: уровень × 200$)

**Строительство и развитие:**
/build - Построить здание
/hire - Нанять работника
/buy - Купить технику

**Иконки:**
🌾 Ферма/Комбайн
🏠 Склад
⛽ Завод
⛏️ Шахта/Шахтер/Экскаватор
👨‍🌾 Фермер
🚛 Водитель/Грузовик
👷 Рабочий

**Советы:**
• Регулярно собирайте урожай командой /produce
• Улучшайте уровень для увеличения дохода
• Стройте здания для автоматизации
• Нанимайте работников для эффективности
• Покупайте технику для транспортировки
        """
        await update.message.reply_text(help_text, parse_mode='Markdown')
    
    async def handle_text(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Обработчик текстовых сообщений"""
        # Пока просто игнорируем текстовые сообщения
        pass
    
    async def button_callback(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Обработчик нажатий на inline кнопки"""
        query = update.callback_query
        await query.answer()
        
        user_id = update.effective_user.id
        data = query.data
        
        with SessionLocal() as db:
            player = db.query(Player).filter(Player.name == str(user_id)).first()
            if not player:
                await query.edit_message_text("❌ Игрок не найден. Используйте /start для начала игры.")
                return
            
            if data.startswith("build_"):
                building_type = data.split("_")[1]
                cost = BUILDING_COSTS.get(building_type, 300)
                
                if player.money < cost:
                    await query.edit_message_text(f"❌ **Недостаточно денег!**\n\n💰 Нужно: {cost}$\n💵 У вас: {player.money}$", parse_mode='Markdown')
                    return
                
                building = Building(player_id=player.id, building_type=building_type)
                player.money -= cost
                db.add(building)
                db.commit()
                
                await query.edit_message_text(f"🏗️ **{building_type.title()} построен!**\n\n💰 Потрачено: {cost}$\n💵 Баланс: {player.money}$", parse_mode='Markdown')
            
            elif data.startswith("hire_"):
                worker_type = data.split("_")[1]
                cost = WORKER_COSTS.get(worker_type, 150)
                
                if player.money < cost:
                    await query.edit_message_text(f"❌ **Недостаточно денег!**\n\n💰 Нужно: {cost}$\n💵 У вас: {player.money}$", parse_mode='Markdown')
                    return
                
                # Генерируем имя работника
                worker_names = {
                    "farmer": ["Фермер Иван", "Фермер Петр", "Фермер Сергей"],
                    "miner": ["Шахтер Алексей", "Шахтер Дмитрий", "Шахтер Михаил"],
                    "driver": ["Водитель Андрей", "Водитель Николай", "Водитель Владимир"],
                    "worker": ["Рабочий Артем", "Рабочий Игорь", "Рабочий Константин"]
                }
                
                import random
                name = random.choice(worker_names.get(worker_type, ["Работник"]))
                
                worker = Worker(player_id=player.id, worker_type=worker_type, name=name)
                player.money -= cost
                db.add(worker)
                db.commit()
                
                await query.edit_message_text(f"👷 **{worker_type.title()} нанят!**\n\n👤 Имя: {name}\n💰 Потрачено: {cost}$\n💵 Баланс: {player.money}$", parse_mode='Markdown')
            
            elif data.startswith("buy_"):
                vehicle_type = data.split("_")[1]
                cost = VEHICLE_COSTS.get(vehicle_type, 500)
                
                if player.money < cost:
                    await query.edit_message_text(f"❌ **Недостаточно денег!**\n\n💰 Нужно: {cost}$\n💵 У вас: {player.money}$", parse_mode='Markdown')
                    return
                
                # Генерируем название техники
                vehicle_names = {
                    "truck": ["Грузовик №1", "Грузовик №2", "Грузовик №3"],
                    "harvester": ["Комбайн Урожай", "Комбайн Поле", "Комбайн Зерно"],
                    "excavator": ["Экскаватор Силач", "Экскаватор Копач", "Экскаватор Землекоп"]
                }
                
                import random
                name = random.choice(vehicle_names.get(vehicle_type, ["Техника"]))
                
                vehicle = Vehicle(player_id=player.id, vehicle_type=vehicle_type, name=name)
                player.money -= cost
                db.add(vehicle)
                db.commit()
                
                await query.edit_message_text(f"🚛 **{vehicle_type.title()} куплен!**\n\n🚛 Название: {name}\n💰 Потрачено: {cost}$\n💵 Баланс: {player.money}$", parse_mode='Markdown')
    
    def run(self):
        """Запуск бота"""
        print("🤖 Запуск Telegram бота...")
        self.application.run_polling(allowed_updates=Update.ALL_TYPES)

if __name__ == "__main__":
    from config import BOT_TOKEN
    
    if BOT_TOKEN == "YOUR_BOT_TOKEN_HERE":
        print("❌ Ошибка: Не указан токен бота!")
        print("📝 Инструкция:")
        print("1. Получите токен у @BotFather в Telegram")
        print("2. Откройте файл config.py")
        print("3. Замените 'YOUR_BOT_TOKEN_HERE' на ваш токен")
        exit(1)
    
    bot = TelegramGameBot(BOT_TOKEN)
    bot.run() 