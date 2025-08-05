#!/usr/bin/env python3
"""
Скрипт для локального тестирования изометрической фермерской игры
"""

import uvicorn
from web_app import app

if __name__ == "__main__":
    print("🌾 Запуск изометрической фермерской игры...")
    print("📱 Откройте браузер и перейдите по адресу: http://localhost:8000")
    print("🎮 Игра будет выглядеть как на изображении с изометрической графикой!")
    
    uvicorn.run(
        app, 
        host="0.0.0.0", 
        port=8000,
        reload=True,
        log_level="info"
    ) 