from flask import Flask, render_template, request, redirect, url_for, session, jsonify, flash
from flask_bcrypt import Bcrypt
import sqlite3
import json
import os
from datetime import datetime

app = Flask(__name__)
app.secret_key = 'your-secret-key-here'  # Production'da güvenli bir key kullanın
bcrypt = Bcrypt(app)

# Veritabanı konfigürasyonu
DB_PATH = 'cost_calculation.db'

def get_db_connection():
    """Veritabanı bağlantısı oluşturur"""
    try:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        return conn
    except Exception as e:
        print(f"Veritabanı bağlantı hatası: {e}")
        return None

def load_translations(lang='en'):
    """Çeviri dosyalarını yükler"""
    try:
        with open(f'translations/{lang}.json', 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        # Fallback olarak İngilizce yükle
        try:
            with open('translations/en.json', 'r', encoding='utf-8') as f:
                return json.load(f)
        except FileNotFoundError:
            return {}

def init_database():
    """Veritabanı tablolarını oluşturur"""
    conn = get_db_connection()
    if not conn:
        return False
    
    try:
        cur = conn.cursor()
        
        # Kullanıcılar tablosu
        cur.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                full_name TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                is_active BOOLEAN DEFAULT 1,
                last_login DATETIME,
                language TEXT DEFAULT 'en'
            )
        """)
        
        # Varsayılan admin kullanıcısı oluştur (şifre: admin123)
        admin_password = bcrypt.generate_password_hash('admin123').decode('utf-8')
        cur.execute("""
            INSERT OR IGNORE INTO users (username, email, password, full_name, language) 
            VALUES (?, ?, ?, ?, ?)
        """, ('admin', 'admin@example.com', admin_password, 'Administrator', 'en'))
        
        # Test kullanıcısı oluştur (şifre: test123)
        test_password = bcrypt.generate_password_hash('test123').decode('utf-8')
        cur.execute("""
            INSERT OR IGNORE INTO users (username, email, password, full_name, language) 
            VALUES (?, ?, ?, ?, ?)
        """, ('test', 'test@example.com', test_password, 'Test User', 'tr'))
        
        conn.commit()
        cur.close()
        conn.close()
        return True
    except Exception as e:
        print(f"Veritabanı başlatma hatası: {e}")
        return False

@app.context_processor
def inject_translations():
    """Tüm template'lere çevirileri enjekte eder"""
    lang = session.get('language', 'en')
    return dict(translations=load_translations(lang))

@app.route('/')
def index():
    """Ana sayfa - login sayfasına yönlendir"""
    return redirect(url_for('login'))

@app.route('/login', methods=['GET', 'POST'])
def login():
    """Login sayfası"""
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        
        if not username or not password:
            translations = load_translations(session.get('language', 'en'))
            flash(translations.get('username_password_required', 'Username and password are required!'), 'error')
            return render_template('login.html')
        
        # Veritabanından kullanıcıyı kontrol et
        conn = get_db_connection()
        if not conn:
            translations = load_translations(session.get('language', 'en'))
            flash(translations.get('database_error', 'Database connection error!'), 'error')
            return render_template('login.html')
        
        try:
            cur = conn.cursor()
            cur.execute("""
                SELECT id, username, email, password, full_name, is_active 
                FROM users 
                WHERE username = ? AND is_active = 1
            """, (username,))
            
            user = cur.fetchone()
            cur.close()
            conn.close()
            
            if user and bcrypt.check_password_hash(user['password'], password):
                session['user_id'] = user['id']
                session['username'] = user['username']
                session['full_name'] = user['full_name']
                session['language'] = session.get('language', 'en')
                
                # Beni Hatırla özelliği
                remember_me = request.form.get('remember_me')
                if remember_me:
                    session.permanent = True
                    app.permanent_session_lifetime = 86400 * 30  # 30 gün
                else:
                    session.permanent = False
                
                return redirect(url_for('dashboard'))
            else:
                translations = load_translations(session.get('language', 'en'))
                flash(translations.get('invalid_credentials', 'Invalid username or password!'), 'error')
                
        except Exception as e:
            translations = load_translations(session.get('language', 'en'))
            flash(translations.get('login_error', 'Login error occurred!'), 'error')
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

@app.route('/change_language/<lang>')
def change_language(lang):
    """Dil değiştir"""
    if lang in ['en', 'tr']:
        session['language'] = lang
    return redirect(request.referrer or url_for('login'))

if __name__ == '__main__':
    # Veritabanını başlat
    if init_database():
        print("Veritabanı başarıyla başlatıldı!")
    else:
        print("Veritabanı başlatma hatası!")
    
    app.run(debug=True, host='0.0.0.0', port=5000)
