from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import Base
import logging

# Отключаем логирование SQLAlchemy
logging.getLogger('sqlalchemy.engine').setLevel(logging.CRITICAL)
logging.getLogger('sqlalchemy.pool').setLevel(logging.CRITICAL)

SQLALCHEMY_DATABASE_URL = "sqlite:///./game.db"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, 
    connect_args={"check_same_thread": False}, 
    echo=False,
    echo_pool=False,
    pool_pre_ping=False
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def init_db():
    Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
