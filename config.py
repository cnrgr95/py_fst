"""
PostgreSQL veritabanı konfigürasyon dosyası
"""
import os
from dotenv import load_dotenv

# .env dosyasını yükle
load_dotenv()

class Config:
    """Ana konfigürasyon sınıfı"""
    
    # Flask konfigürasyonu
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'your-secret-key-here-change-in-production'
    
    # PostgreSQL veritabanı konfigürasyonu
    DB_HOST = os.environ.get('DB_HOST') or 'localhost'
    DB_PORT = os.environ.get('DB_PORT') or '5432'
    DB_NAME = os.environ.get('DB_NAME') or 'py_fst'
    DB_USER = os.environ.get('DB_USER') or 'postgres'
    DB_PASSWORD = os.environ.get('DB_PASSWORD') or '123456789'
    
    # Veritabanı URL'si
    DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
    
    # Uygulama konfigürasyonu
    DEBUG = os.environ.get('FLASK_DEBUG', 'True').lower() == 'true'
    HOST = os.environ.get('FLASK_HOST') or '0.0.0.0'
    PORT = int(os.environ.get('FLASK_PORT') or 5000)
    
    # Session konfigürasyonu
    PERMANENT_SESSION_LIFETIME = 86400 * 30  # 30 gün
    
    @staticmethod
    def get_db_config():
        """Veritabanı bağlantı parametrelerini döndürür"""
        return {
            'host': Config.DB_HOST,
            'port': Config.DB_PORT,
            'database': Config.DB_NAME,
            'user': Config.DB_USER,
            'password': Config.DB_PASSWORD
        }

class DevelopmentConfig(Config):
    """Geliştirme ortamı konfigürasyonu"""
    DEBUG = True

class ProductionConfig(Config):
    """Üretim ortamı konfigürasyonu"""
    DEBUG = False

class TestingConfig(Config):
    """Test ortamı konfigürasyonu"""
    TESTING = True
    DB_NAME = os.environ.get('TEST_DB_NAME') or 'test_postgres'

# Konfigürasyon mapping
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
}
