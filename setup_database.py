#!/usr/bin/env python3
"""
PostgreSQL veritabanı kurulum scripti
Bu script veritabanı tablolarını oluşturur ve gerekli başlangıç verilerini ekler.
"""

import psycopg2
import psycopg2.extras
from flask_bcrypt import Bcrypt
import sys

# Veritabanı konfigürasyonu
DB_CONFIG = {
    'host': 'localhost',
    'database': 'py_fst',
    'user': 'postgres',
    'password': '123456789'
}

def create_connection():
    """Veritabanı bağlantısı oluşturur"""
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        print("Veritabani baglantisi basarili!")
        return conn
    except psycopg2.Error as e:
        print(f"Veritabani baglanti hatasi: {e}")
        return None

def create_tables(conn):
    """Veritabanı tablolarını oluşturur"""
    try:
        cur = conn.cursor()
        
        print("Tablolar olusturuluyor...")
        
        # Kullanıcılar tablosu
        cur.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                full_name VARCHAR(100) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                is_active BOOLEAN DEFAULT TRUE,
                last_login TIMESTAMP,
                language VARCHAR(5) DEFAULT 'en'
            )
        """)
        print("Users tablosu olusturuldu")
        
        # Projeler tablosu
        cur.execute("""
            CREATE TABLE IF NOT EXISTS projects (
                id SERIAL PRIMARY KEY,
                name VARCHAR(200) NOT NULL,
                description TEXT,
                start_date DATE,
                end_date DATE,
                budget DECIMAL(15,2),
                status VARCHAR(20) DEFAULT 'active',
                created_by INTEGER REFERENCES users(id),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        print("Projects tablosu olusturuldu")
        
        # Malzemeler tablosu
        cur.execute("""
            CREATE TABLE IF NOT EXISTS materials (
                id SERIAL PRIMARY KEY,
                name VARCHAR(200) NOT NULL,
                description TEXT,
                unit VARCHAR(50) NOT NULL,
                unit_price DECIMAL(10,2) NOT NULL,
                category VARCHAR(100),
                supplier VARCHAR(200),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        print("Materials tablosu olusturuldu")
        
        # İşçilik tablosu
        cur.execute("""
            CREATE TABLE IF NOT EXISTS labor (
                id SERIAL PRIMARY KEY,
                position VARCHAR(100) NOT NULL,
                hourly_rate DECIMAL(10,2) NOT NULL,
                daily_rate DECIMAL(10,2),
                description TEXT,
                category VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        print("Labor tablosu olusturuldu")
        
        # Ekipman tablosu
        cur.execute("""
            CREATE TABLE IF NOT EXISTS equipment (
                id SERIAL PRIMARY KEY,
                name VARCHAR(200) NOT NULL,
                description TEXT,
                daily_rate DECIMAL(10,2) NOT NULL,
                hourly_rate DECIMAL(10,2),
                category VARCHAR(100),
                supplier VARCHAR(200),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        print("Equipment tablosu olusturuldu")
        
        # Proje malzemeleri tablosu
        cur.execute("""
            CREATE TABLE IF NOT EXISTS project_materials (
                id SERIAL PRIMARY KEY,
                project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
                material_id INTEGER REFERENCES materials(id),
                quantity DECIMAL(10,2) NOT NULL,
                unit_price DECIMAL(10,2) NOT NULL,
                total_price DECIMAL(15,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        print("Project materials tablosu olusturuldu")
        
        # Proje işçiliği tablosu
        cur.execute("""
            CREATE TABLE IF NOT EXISTS project_labor (
                id SERIAL PRIMARY KEY,
                project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
                labor_id INTEGER REFERENCES labor(id),
                hours DECIMAL(8,2) NOT NULL,
                hourly_rate DECIMAL(10,2) NOT NULL,
                total_cost DECIMAL(15,2) GENERATED ALWAYS AS (hours * hourly_rate) STORED,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        print("Project labor tablosu olusturuldu")
        
        # Proje ekipmanları tablosu
        cur.execute("""
            CREATE TABLE IF NOT EXISTS project_equipment (
                id SERIAL PRIMARY KEY,
                project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
                equipment_id INTEGER REFERENCES equipment(id),
                days DECIMAL(8,2) NOT NULL,
                daily_rate DECIMAL(10,2) NOT NULL,
                total_cost DECIMAL(15,2) GENERATED ALWAYS AS (days * daily_rate) STORED,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        print("Project equipment tablosu olusturuldu")
        
        conn.commit()
        print("Tum tablolar basariyla olusturuldu!")
        return True
        
    except psycopg2.Error as e:
        print(f"Tablo olusturma hatasi: {e}")
        conn.rollback()
        return False
    finally:
        cur.close()

def create_default_data(conn):
    """Varsayılan verileri oluşturur"""
    try:
        cur = conn.cursor()
        bcrypt = Bcrypt()
        
        print("Varsayilan kullanicilar olusturuluyor...")
        
        # Admin kullanıcısı
        admin_password = bcrypt.generate_password_hash('admin123').decode('utf-8')
        cur.execute("""
            INSERT INTO users (username, email, password, full_name, language) 
            VALUES (%s, %s, %s, %s, %s)
            ON CONFLICT (username) DO UPDATE SET
                email = EXCLUDED.email,
                password = EXCLUDED.password,
                full_name = EXCLUDED.full_name
        """, ('admin', 'admin@example.com', admin_password, 'System Administrator', 'en'))
        
        # Test kullanıcısı
        test_password = bcrypt.generate_password_hash('test123').decode('utf-8')
        cur.execute("""
            INSERT INTO users (username, email, password, full_name, language) 
            VALUES (%s, %s, %s, %s, %s)
            ON CONFLICT (username) DO UPDATE SET
                email = EXCLUDED.email,
                password = EXCLUDED.password,
                full_name = EXCLUDED.full_name
        """, ('test', 'test@example.com', test_password, 'Test User', 'tr'))
        
        print("Varsayilan kullanicilar olusturuldu!")
        print("   Admin: admin / admin123")
        print("   Test: test / test123")
        
        print("Ornek malzemeler ekleniyor...")
        
        # Örnek malzemeler
        sample_materials = [
            ('Çimento', 'Portland çimento 42.5', 'kg', 0.85, 'İnşaat Malzemesi', 'Çimento A.Ş.'),
            ('Demir', 'Betonarme demiri 12mm', 'kg', 8.50, 'İnşaat Malzemesi', 'Demir Sanayi'),
            ('Tuğla', 'Kırmızı tuğla', 'adet', 2.25, 'İnşaat Malzemesi', 'Tuğla Fabrikası'),
            ('Kum', 'İnce kum', 'm³', 45.00, 'İnşaat Malzemesi', 'Kum Ocağı'),
            ('Çakıl', '16-32mm çakıl', 'm³', 65.00, 'İnşaat Malzemesi', 'Çakıl Ocağı')
        ]
        
        for material in sample_materials:
            cur.execute("""
                INSERT INTO materials (name, description, unit, unit_price, category, supplier)
                VALUES (%s, %s, %s, %s, %s, %s)
                ON CONFLICT DO NOTHING
            """, material)
        
        print("Ornek malzemeler eklendi!")
        
        print("Ornek iscilik verileri ekleniyor...")
        
        # Örnek işçilik
        sample_labor = [
            ('Usta', 85.00, 680.00, 'Deneyimli usta', 'İnşaat'),
            ('Kalfa', 65.00, 520.00, 'Deneyimli kalfa', 'İnşaat'),
            ('İşçi', 45.00, 360.00, 'Genel işçi', 'İnşaat'),
            ('Elektrikçi', 95.00, 760.00, 'Elektrik ustası', 'Elektrik'),
            ('Tesisatçı', 90.00, 720.00, 'Tesisat ustası', 'Tesisat')
        ]
        
        for labor in sample_labor:
            cur.execute("""
                INSERT INTO labor (position, hourly_rate, daily_rate, description, category)
                VALUES (%s, %s, %s, %s, %s)
                ON CONFLICT DO NOTHING
            """, labor)
        
        print("Ornek iscilik verileri eklendi!")
        
        print("Ornek ekipman verileri ekleniyor...")
        
        # Örnek ekipman
        sample_equipment = [
            ('Kazıcı', 'Ekskavatör', 850.00, 106.25, 'İnşaat Makinesi', 'Makine Kiralama'),
            ('Beton Mikseri', 'Beton karıştırıcı', 450.00, 56.25, 'İnşaat Makinesi', 'Makine Kiralama'),
            ('Vinç', 'Tower vinç', 1200.00, 150.00, 'İnşaat Makinesi', 'Vinç Kiralama'),
            ('Kompresör', 'Hava kompresörü', 180.00, 22.50, 'El Aleti', 'Alet Kiralama'),
            ('Jeneratör', 'Dizel jeneratör', 320.00, 40.00, 'Elektrik', 'Ekipman Kiralama')
        ]
        
        for equipment in sample_equipment:
            cur.execute("""
                INSERT INTO equipment (name, description, daily_rate, hourly_rate, category, supplier)
                VALUES (%s, %s, %s, %s, %s, %s)
                ON CONFLICT DO NOTHING
            """, equipment)
        
        print("Ornek ekipman verileri eklendi!")
        
        conn.commit()
        print("Tum ornek veriler basariyla eklendi!")
        return True
        
    except psycopg2.Error as e:
        print(f"Ornek veri ekleme hatasi: {e}")
        conn.rollback()
        return False
    finally:
        cur.close()

def main():
    """Ana fonksiyon"""
    print("PostgreSQL Veritabani Kurulum Scripti")
    print("=" * 50)
    
    # Veritabanı bağlantısı
    conn = create_connection()
    if not conn:
        print("Veritabani baglantisi kurulamadi!")
        sys.exit(1)
    
    try:
        # Tabloları oluştur
        if not create_tables(conn):
            print("Tablo olusturma basarisiz!")
            sys.exit(1)
        
        # Varsayılan verileri ekle
        if not create_default_data(conn):
            print("Ornek veri ekleme basarisiz!")
            sys.exit(1)
        
        print("\nVeritabani kurulumu tamamlandi!")
        print("=" * 50)
        print("Olusturulan tablolar:")
        print("   - users - Kullanici bilgileri")
        print("   - projects - Proje bilgileri")
        print("   - materials - Malzeme bilgileri")
        print("   - labor - Iscilik bilgileri")
        print("   - equipment - Ekipman bilgileri")
        print("   - project_materials - Proje malzemeleri")
        print("   - project_labor - Proje isciligi")
        print("   - project_equipment - Proje ekipmanlari")
        print("\nGiris bilgileri:")
        print("   - Admin: admin / admin123")
        print("   - Test: test / test123")
        print("\nUygulamayi baslatmak icin: python app.py")
        
    except Exception as e:
        print(f"Beklenmeyen hata: {e}")
        sys.exit(1)
    finally:
        conn.close()

if __name__ == '__main__':
    main()
