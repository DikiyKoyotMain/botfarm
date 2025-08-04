from fastapi import FastAPI, Request, Depends, Form, HTTPException
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from db import init_db, get_db, SessionLocal
from models import Player, Building, Worker, Vehicle
from sqlalchemy.orm import Session
import logging

# Отключаем логирование
logging.disable(logging.CRITICAL)

app = FastAPI(debug=False)
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

# Инициализируем базу данных при запуске
init_db()

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

@app.get("/", response_class=HTMLResponse)
def read_root(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

@app.post("/create_player/")
def create_player(name: str = Form(...), db: Session = Depends(get_db)):
    try:
        # Убеждаемся, что база данных инициализирована
        init_db()
        
        if not name or not name.strip():
            raise HTTPException(status_code=400, detail="Имя не может быть пустым")
        
        existing_player = db.query(Player).filter(Player.name == name.strip()).first()
        if existing_player:
            raise HTTPException(status_code=400, detail="Игрок с таким именем уже существует")
        
        # Создаем игрока
        player = Player(name=name.strip())
        db.add(player)
        db.commit()
        db.refresh(player)
        
        # Создаем начальную ферму
        farm = Building(player_id=player.id, building_type="farm", level=1)
        
        # Создаем начального фермера
        farmer = Worker(player_id=player.id, worker_type="farmer", name="Фермер Иван")
        
        # Создаем начальный грузовик
        truck = Vehicle(player_id=player.id, vehicle_type="truck", name="Грузовик №1")
        
        db.add_all([farm, farmer, truck])
        db.commit()
        
        return {"msg": "Player created", "id": player.id}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Ошибка создания игрока: {str(e)}")

@app.get("/player/{player_id}")
def get_player(player_id: int, db: Session = Depends(get_db)):
    player = db.query(Player).filter(Player.id == player_id).first()
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    
    buildings = db.query(Building).filter(Building.player_id == player_id).all()
    workers = db.query(Worker).filter(Worker.player_id == player_id).all()
    vehicles = db.query(Vehicle).filter(Vehicle.player_id == player_id).all()
    
    return {
        "id": player.id,
        "name": player.name,
        "money": player.money,
        "level": player.level,
        "buildings": [{"id": b.id, "type": b.building_type, "level": b.level, "health": b.health, "is_working": b.is_working} for b in buildings],
        "workers": [{"id": w.id, "type": w.worker_type, "name": w.name, "level": w.level, "efficiency": w.efficiency, "is_working": w.is_working} for w in workers],
        "vehicles": [{"id": v.id, "type": v.vehicle_type, "name": v.name, "fuel_consumption": v.fuel_consumption, "capacity": v.capacity, "is_working": v.is_working} for v in vehicles]
    }

@app.post("/build/")
def build_building(player_id: int, building_type: str, db: Session = Depends(get_db)):
    player = db.query(Player).filter(Player.id == player_id).first()
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    
    cost = BUILDING_COSTS.get(building_type, 300)
    if player.money < cost:
        raise HTTPException(status_code=400, detail="Недостаточно денег")
    
    building = Building(player_id=player_id, building_type=building_type)
    player.money -= cost
    db.add(building)
    db.commit()
    
    return {"msg": f"{building_type} построен", "building_id": building.id, "money": player.money}

@app.post("/hire_worker/")
def hire_worker(player_id: int, worker_type: str, name: str, db: Session = Depends(get_db)):
    player = db.query(Player).filter(Player.id == player_id).first()
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    
    cost = WORKER_COSTS.get(worker_type, 150)
    if player.money < cost:
        raise HTTPException(status_code=400, detail="Недостаточно денег")
    
    worker = Worker(player_id=player_id, worker_type=worker_type, name=name)
    player.money -= cost
    db.add(worker)
    db.commit()
    
    return {"msg": f"{worker_type} нанят", "worker_id": worker.id, "money": player.money}

@app.post("/buy_vehicle/")
def buy_vehicle(player_id: int, vehicle_type: str, name: str, db: Session = Depends(get_db)):
    player = db.query(Player).filter(Player.id == player_id).first()
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    
    cost = VEHICLE_COSTS.get(vehicle_type, 500)
    if player.money < cost:
        raise HTTPException(status_code=400, detail="Недостаточно денег")
    
    vehicle = Vehicle(player_id=player_id, vehicle_type=vehicle_type, name=name)
    player.money -= cost
    db.add(vehicle)
    db.commit()
    
    return {"msg": f"{vehicle_type} куплен", "vehicle_id": vehicle.id, "money": player.money}

@app.post("/produce/")
def produce(player_id: int, db: Session = Depends(get_db)):
    player = db.query(Player).filter(Player.id == player_id).first()
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    
    # Простое производство
    income = player.level * 10
    player.money += income
    db.commit()
    
    return {"money": player.money, "income": income}

@app.post("/upgrade/")
def upgrade(player_id: int, db: Session = Depends(get_db)):
    player = db.query(Player).filter(Player.id == player_id).first()
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    
    cost = player.level * 200
    if player.money < cost:
        raise HTTPException(status_code=400, detail="Недостаточно денег")
    
    player.money -= cost
    player.level += 1
    db.commit()
    
    return {"level": player.level, "money": player.money}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 