from sqlalchemy import Column, Integer, String, DateTime, Boolean, Float, ForeignKey, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime

Base = declarative_base()

class Player(Base):
    __tablename__ = "players"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True)
    money = Column(Integer, default=1000)
    level = Column(Integer, default=1)
    
    # Связи
    buildings = relationship("Building", back_populates="player")
    workers = relationship("Worker", back_populates="player")
    vehicles = relationship("Vehicle", back_populates="player")

class Building(Base):
    __tablename__ = "buildings"
    
    id = Column(Integer, primary_key=True, index=True)
    player_id = Column(Integer, ForeignKey("players.id"))
    building_type = Column(String)
    level = Column(Integer, default=1)
    health = Column(Integer, default=100)
    is_working = Column(Boolean, default=True)
    
    player = relationship("Player", back_populates="buildings")

class Worker(Base):
    __tablename__ = "workers"
    
    id = Column(Integer, primary_key=True, index=True)
    player_id = Column(Integer, ForeignKey("players.id"))
    worker_type = Column(String)
    name = Column(String)
    level = Column(Integer, default=1)
    efficiency = Column(Float, default=1.0)
    is_working = Column(Boolean, default=True)
    
    player = relationship("Player", back_populates="workers")

class Vehicle(Base):
    __tablename__ = "vehicles"
    
    id = Column(Integer, primary_key=True, index=True)
    player_id = Column(Integer, ForeignKey("players.id"))
    vehicle_type = Column(String)
    name = Column(String)
    fuel_consumption = Column(Float, default=1.0)
    capacity = Column(Integer, default=100)
    is_working = Column(Boolean, default=True)
    
    player = relationship("Player", back_populates="vehicles")

class GameSession(Base):
    __tablename__ = "sessions"
    id = Column(Integer, primary_key=True)
    start_time = Column(DateTime, default=datetime.utcnow)
    end_time = Column(DateTime)
    is_active = Column(Boolean, default=True)
    winner_id = Column(Integer, ForeignKey("players.id"), nullable=True)
    total_players = Column(Integer, default=0)
