from flask import Flask, render_template, request, redirect, url_for, session, jsonify, flash
from flask_bcrypt import Bcrypt
import psycopg2
import psycopg2.extras
import json
import os
from datetime import datetime
from config import Config

app = Flask(__name__)
app.secret_key = Config.SECRET_KEY
app.permanent_session_lifetime = Config.PERMANENT_SESSION_LIFETIME
bcrypt = Bcrypt(app)

def get_db_connection():
    """PostgreSQL veritabanı bağlantısı oluşturur"""
    try:
        conn = psycopg2.connect(
            host=Config.DB_HOST,
            port=Config.DB_PORT,
            database=Config.DB_NAME,
            user=Config.DB_USER,
            password=Config.DB_PASSWORD
        )
        # PostgreSQL için row factory ayarı
        conn.cursor_factory = psycopg2.extras.RealDictCursor
        return conn
    except psycopg2.Error as e:
        print(f"PostgreSQL bağlantı hatası: {e}")
        return None


def init_database():
    """PostgreSQL veritabanı tablolarını oluşturur"""
    conn = get_db_connection()
    if not conn:
        return False
    
    try:
        cur = conn.cursor()
        
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
        
        # Varsayılan admin kullanıcısı oluştur (şifre: admin123)
        admin_password = bcrypt.generate_password_hash('admin123').decode('utf-8')
        cur.execute("""
            INSERT INTO users (username, email, password, full_name, language) 
            VALUES (%s, %s, %s, %s, %s)
            ON CONFLICT (username) DO UPDATE SET
                email = EXCLUDED.email,
                password = EXCLUDED.password,
                full_name = EXCLUDED.full_name
        """, ('admin', 'admin@example.com', admin_password, 'Administrator', 'en'))
        
        # Test kullanıcısı oluştur (şifre: test123)
        test_password = bcrypt.generate_password_hash('test123').decode('utf-8')
        cur.execute("""
            INSERT INTO users (username, email, password, full_name, language) 
            VALUES (%s, %s, %s, %s, %s)
            ON CONFLICT (username) DO UPDATE SET
                email = EXCLUDED.email,
                password = EXCLUDED.password,
                full_name = EXCLUDED.full_name
        """, ('test', 'test@example.com', test_password, 'Test User', 'tr'))
        
        conn.commit()
        cur.close()
        conn.close()
        return True
    except psycopg2.Error as e:
        print(f"PostgreSQL başlatma hatası: {e}")
        return False


@app.route('/')
def index():
    """Ana sayfa - giriş durumuna göre yönlendir"""
    if 'user_id' in session:
        return redirect(url_for('dashboard'))
    else:
        return redirect(url_for('login'))

@app.route('/login', methods=['GET', 'POST'])
def login():
    """Login sayfası"""
    # Eğer kullanıcı zaten giriş yapmışsa dashboard'a yönlendir
    if 'user_id' in session:
        return redirect(url_for('dashboard'))
    
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        
        if not username or not password:
            flash('Username and password are required!', 'error')
            return render_template('login.html')
        
        # Veritabanından kullanıcıyı kontrol et
        conn = get_db_connection()
        if not conn:
            flash('Database connection error!', 'error')
            return render_template('login.html')
        
        try:
            cur = conn.cursor()
            cur.execute("""
                SELECT id, username, email, password, full_name, is_active 
                FROM users 
                WHERE username = %s AND is_active = TRUE
            """, (username,))
            
            user = cur.fetchone()
            cur.close()
            conn.close()
            
            if user and bcrypt.check_password_hash(user['password'], password):
                session['user_id'] = user['id']
                session['username'] = user['username']
                session['full_name'] = user['full_name']
                
                # Beni Hatırla özelliği
                remember_me = request.form.get('remember_me')
                if remember_me:
                    session.permanent = True
                    app.permanent_session_lifetime = 86400 * 30  # 30 gün
                else:
                    session.permanent = False
                
                return redirect(url_for('dashboard'))
            else:
                flash('Invalid username or password!', 'error')
                
        except Exception as e:
            flash('Login error occurred!', 'error')
            print(f"Login hatası: {e}")
    
    return render_template('login.html')

@app.route('/logout')
def logout():
    """Çıkış yap"""
    session.clear()
    return redirect(url_for('login'))

@app.route('/dashboard')
def dashboard():
    """Ana kontrol paneli"""
    if 'user_id' not in session:
        return redirect(url_for('login'))
    
    return render_template('dashboard.html')


if __name__ == '__main__':
    # Veritabanını başlat
    if init_database():
        print("PostgreSQL veritabanı başarıyla başlatıldı!")
    else:
        print("PostgreSQL veritabanı başlatma hatası!")
    
    app.run(debug=Config.DEBUG, host=Config.HOST, port=Config.PORT)
