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
    DEBUG = os.environ.get('DEBUG', 'True').lower() == 'true'
    HOST = os.environ.get('APP_HOST') or '127.0.0.1'
    PORT = int(os.environ.get('APP_PORT') or 5000)
    
    # Session konfigürasyonu
    PERMANENT_SESSION_LIFETIME = int(os.environ.get('PERMANENT_SESSION_LIFETIME') or 3600)
    
    # Güvenlik konfigürasyonu
    SESSION_COOKIE_SECURE = os.environ.get('SESSION_COOKIE_SECURE', 'False').lower() == 'true'
    SESSION_COOKIE_HTTPONLY = os.environ.get('SESSION_COOKIE_HTTPONLY', 'True').lower() == 'true'
    SESSION_COOKIE_SAMESITE = os.environ.get('SESSION_COOKIE_SAMESITE') or 'Lax'
    REMEMBER_COOKIE_SECURE = os.environ.get('REMEMBER_COOKIE_SECURE', 'False').lower() == 'true'
    REMEMBER_COOKIE_HTTPONLY = os.environ.get('REMEMBER_COOKIE_HTTPONLY', 'True').lower() == 'true'
    
    # CSP Configuration
    CSP_DEFAULT_SRC = os.environ.get('CSP_DEFAULT_SRC') or "self"
    CSP_SCRIPT_SRC = os.environ.get('CSP_SCRIPT_SRC') or "self cdn.jsdelivr.net cdnjs.cloudflare.com"
    CSP_STYLE_SRC = os.environ.get('CSP_STYLE_SRC') or "self cdn.jsdelivr.net cdnjs.cloudflare.com 'unsafe-inline'"
    CSP_IMG_SRC = os.environ.get('CSP_IMG_SRC') or "self data:"
    CSP_FONT_SRC = os.environ.get('CSP_FONT_SRC') or "self cdnjs.cloudflare.com fonts.gstatic.com fonts.googleapis.com"
    
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

def get_db_connection():
    """Veritabanı bağlantısı oluşturur"""
    import psycopg2
    try:
        conn = psycopg2.connect(
            host=Config.DB_HOST,
            port=Config.DB_PORT,
            database=Config.DB_NAME,
            user=Config.DB_USER,
            password=Config.DB_PASSWORD,
            connect_timeout=10
        )
        return conn
    except Exception as e:
        print(f"PostgreSQL veritabanı bağlantı hatası: {e}")
        return None

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
