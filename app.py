from flask import Flask, render_template, request, redirect, url_for, session, jsonify, flash
from flask_bcrypt import Bcrypt
from flask_wtf.csrf import CSRFProtect
from flask_talisman import Talisman
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import psycopg2
import psycopg2.extras
import json
import os
import logging
from datetime import datetime
from config import Config

app = Flask(__name__)

# Yetki sistemi yardımcı fonksiyonları
def get_user_permissions(user_id):
    """Kullanıcının tüm yetkilerini getirir"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT DISTINCT p.name, p.module
            FROM permissions p
            LEFT JOIN user_permissions up ON p.id = up.permission_id AND up.user_id = %s
            LEFT JOIN user_roles ur ON ur.user_id = %s
            LEFT JOIN role_permissions rp ON ur.role_id = rp.role_id AND rp.permission_id = p.id
            WHERE up.user_id IS NOT NULL OR rp.role_id IS NOT NULL
        """, (user_id, user_id))
        
        permissions = cursor.fetchall()
        return [{'name': perm[0], 'module': perm[1]} for perm in permissions]
        
    except Exception as e:
        app.logger.error(f"Yetki getirme hatası: {e}")
        return []
    finally:
        if conn:
            cursor.close()
            conn.close()

def has_permission(user_id, permission_name):
    """Kullanıcının belirli bir yetkisi var mı kontrol eder"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT COUNT(*) FROM (
                SELECT 1 FROM user_permissions up
                JOIN permissions p ON up.permission_id = p.id
                WHERE up.user_id = %s AND p.name = %s
                UNION
                SELECT 1 FROM user_roles ur
                JOIN role_permissions rp ON ur.role_id = rp.role_id
                JOIN permissions p ON rp.permission_id = p.id
                WHERE ur.user_id = %s AND p.name = %s
            ) as user_perms
        """, (user_id, permission_name, user_id, permission_name))
        
        count = cursor.fetchone()[0]
        return count > 0
        
    except Exception as e:
        app.logger.error(f"Yetki kontrol hatası: {e}")
        return False
    finally:
        if conn:
            cursor.close()
            conn.close()

def get_user_roles(user_id):
    """Kullanıcının rollerini getirir"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT r.name, r.description
            FROM roles r
            JOIN user_roles ur ON r.id = ur.role_id
            WHERE ur.user_id = %s
        """, (user_id,))
        
        roles = cursor.fetchall()
        return [{'name': role[0], 'description': role[1]} for role in roles]
        
    except Exception as e:
        app.logger.error(f"Rol getirme hatası: {e}")
        return []
    finally:
        if conn:
            cursor.close()
            conn.close()

def get_all_permissions():
    """Tüm yetkileri getirir"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT id, name, description, module
            FROM permissions
            ORDER BY module, name
        """)
        
        permissions = cursor.fetchall()
        return [{'id': perm[0], 'name': perm[1], 'description': perm[2], 'module': perm[3]} for perm in permissions]
        
    except Exception as e:
        app.logger.error(f"Tüm yetkileri getirme hatası: {e}")
        return []
    finally:
        if conn:
            cursor.close()
            conn.close()

def get_all_roles():
    """Tüm rolleri getirir"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT id, name, description
            FROM roles
            ORDER BY name
        """)
        
        roles = cursor.fetchall()
        return [{'id': role[0], 'name': role[1], 'description': role[2]} for role in roles]
        
    except Exception as e:
        app.logger.error(f"Tüm rolleri getirme hatası: {e}")
        return []
    finally:
        if conn:
            cursor.close()
            conn.close()

def assign_permission_to_user(user_id, permission_id):
    """Kullanıcıya yetki atar"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT INTO user_permissions (user_id, permission_id, granted_by)
            VALUES (%s, %s, %s)
            ON CONFLICT (user_id, permission_id) DO NOTHING
        """, (user_id, permission_id, session.get('user_id')))
        
        conn.commit()
        return True
        
    except Exception as e:
        app.logger.error(f"Yetki atama hatası: {e}")
        return False
    finally:
        if conn:
            cursor.close()
            conn.close()

def remove_permission_from_user(user_id, permission_id):
    """Kullanıcıdan yetki kaldırır"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            DELETE FROM user_permissions
            WHERE user_id = %s AND permission_id = %s
        """, (user_id, permission_id))
        
        conn.commit()
        return True
        
    except Exception as e:
        app.logger.error(f"Yetki kaldırma hatası: {e}")
        return False
    finally:
        if conn:
            cursor.close()
            conn.close()

def assign_role_to_user(user_id, role_id):
    """Kullanıcıya rol atar"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT INTO user_roles (user_id, role_id, assigned_by)
            VALUES (%s, %s, %s)
            ON CONFLICT (user_id, role_id) DO NOTHING
        """, (user_id, role_id, session.get('user_id')))
        
        conn.commit()
        return True
        
    except Exception as e:
        app.logger.error(f"Rol atama hatası: {e}")
        return False
    finally:
        if conn:
            cursor.close()
            conn.close()

def remove_role_from_user(user_id, role_id):
    """Kullanıcıdan rol kaldırır"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            DELETE FROM user_roles
            WHERE user_id = %s AND role_id = %s
        """, (user_id, role_id))
        
        conn.commit()
        return True
        
    except Exception as e:
        app.logger.error(f"Rol kaldırma hatası: {e}")
        return False
    finally:
        if conn:
            cursor.close()
            conn.close()

def get_sidebar_menu_items(user_id):
    """Kullanıcının yetkilerine göre sidebar menü öğelerini getirir"""
    menu_items = []
    
    # Dashboard - herkese açık
    menu_items.append({
        'name': 'dashboard',
        'title': 'Dashboard',
        'icon': 'fas fa-tachometer-alt',
        'url': url_for('dashboard'),
        'always_visible': True
    })
    
    # Kullanıcı yönetimi - user_view yetkisi gerekli
    if has_permission(user_id, 'user_view'):
        menu_items.append({
            'name': 'users',
            'title': 'User Management',
            'icon': 'fas fa-users',
            'url': url_for('users'),
            'always_visible': False
        })
    
    # Tur yönetimi - tour_view yetkisi gerekli
    if has_permission(user_id, 'tour_view'):
        menu_items.append({
            'name': 'tours',
            'title': 'Tour Management',
            'icon': 'fas fa-route',
            'url': '#',
            'always_visible': False
        })
    
    # Maliyet yönetimi - cost_view yetkisi gerekli
    if has_permission(user_id, 'cost_view'):
        menu_items.append({
            'name': 'costs',
            'title': 'Cost Management',
            'icon': 'fas fa-calculator',
            'url': '#',
            'always_visible': False
        })
    
    # Raporlar - report_view yetkisi gerekli
    if has_permission(user_id, 'report_view'):
        menu_items.append({
            'name': 'reports',
            'title': 'Reports',
            'icon': 'fas fa-chart-bar',
            'url': '#',
            'always_visible': False
        })
    
    # Ayarlar - settings_view yetkisi gerekli
    if has_permission(user_id, 'settings_view'):
        menu_items.append({
            'name': 'settings',
            'title': 'Settings',
            'icon': 'fas fa-cog',
            'url': '#',
            'always_visible': False
        })
    
    # Support - herkese açık
    menu_items.append({
        'name': 'support',
        'title': 'Support',
        'icon': 'fas fa-question-circle',
        'url': '#',
        'always_visible': True
    })
    
    return menu_items
app.secret_key = Config.SECRET_KEY
app.permanent_session_lifetime = Config.PERMANENT_SESSION_LIFETIME

# Cache kontrolü - geliştirme için
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0

# Güvenlik konfigürasyonu
app.config.update(
    SESSION_COOKIE_SECURE=Config.SESSION_COOKIE_SECURE,
    SESSION_COOKIE_HTTPONLY=Config.SESSION_COOKIE_HTTPONLY,
    SESSION_COOKIE_SAMESITE=Config.SESSION_COOKIE_SAMESITE,
    REMEMBER_COOKIE_SECURE=Config.REMEMBER_COOKIE_SECURE,
    REMEMBER_COOKIE_HTTPONLY=Config.REMEMBER_COOKIE_HTTPONLY,
)

# CSRF koruması
csrf = CSRFProtect(app)

# Rate limiting
limiter = Limiter(
    get_remote_address,
    app=app,
    default_limits=[Config.RATELIMIT_DEFAULT],
    storage_uri=Config.RATELIMIT_STORAGE_URL
)

# Güvenlik başlıkları (CSP)
csp = {
    'default-src': ["'self'"],
    'script-src': ["'self'", "cdn.jsdelivr.net", "cdnjs.cloudflare.com"],
    'style-src': ["'self'", "cdn.jsdelivr.net", "cdnjs.cloudflare.com", "'unsafe-inline'"],
    'img-src': ["'self'", "data:"],
    'font-src': ["'self'", "cdnjs.cloudflare.com", "fonts.gstatic.com", "fonts.googleapis.com"],
}

# Template context'e fonksiyonları ekle
@app.context_processor
def inject_permissions():
    """Template'lerde kullanılabilir fonksiyonları ekler"""
    return {
        'has_permission': has_permission,
        'get_user_permissions': get_user_permissions,
        'get_user_roles': get_user_roles
    }

# Geçici olarak Talisman tamamen devre dışı (geliştirme için)
# Talisman(app, content_security_policy=csp, force_https=False)
# Talisman(app, force_https=False)

bcrypt = Bcrypt(app)

# Logging konfigürasyonu
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s %(levelname)s %(name)s %(message)s'
)

def get_db_connection():
    """PostgreSQL veritabanı bağlantısı oluşturur"""
    try:
        conn = psycopg2.connect(
            host=Config.DB_HOST,
            port=Config.DB_PORT,
            database=Config.DB_NAME,
            user=Config.DB_USER,
            password=Config.DB_PASSWORD,
            connect_timeout=5
        )
        return conn
    except psycopg2.Error as e:
        app.logger.error(f"PostgreSQL bağlantı hatası: {e}")
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

@app.context_processor
def inject_translations():
    """Tüm template'lere çevirileri enjekte eder"""
    lang = session.get('language', 'en')
    return dict(translations=load_translations(lang))

@app.route('/')
def index():
    """Ana sayfa - giriş durumuna göre yönlendir"""
    if 'user_id' in session:
        return redirect(url_for('dashboard'))
    else:
        return redirect(url_for('login'))

@app.route('/login', methods=['GET', 'POST'])
@limiter.limit("5 per minute")
def login():
    """Login sayfası"""
    # Eğer kullanıcı zaten giriş yapmışsa dashboard'a yönlendir
    if session.get('user_id'):
        return redirect(url_for('dashboard'))
    
    if request.method == 'POST':
        username = (request.form.get('username') or '').strip()
        password = request.form.get('password') or ''
        
        if not username or not password:
            flash('Kullanıcı adı ve şifre gereklidir!', 'error')
            return render_template('login.html')
        
        # Veritabanından kullanıcıyı kontrol et
        conn = get_db_connection()
        if not conn:
            flash('Sistem hatası (veritabanı).', 'error')
            return render_template('login.html')
        
        try:
            cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
            cur.execute("""
                SELECT id, username, email, password, full_name, is_active, language
                FROM users 
                WHERE username = %s AND is_active = TRUE
            """, (username,))
            
            user = cur.fetchone()
            
            if not user or not bcrypt.check_password_hash(user['password'], password):
                app.logger.warning(f"Failed login attempt for username: {username} from IP: {request.remote_addr}")
                flash('Kullanıcı adı veya şifre hatalı.', 'error')
                return render_template('login.html')
            
            # Başarılı giriş
            session.clear()
            session['user_id'] = user['id']
            session['username'] = user['username']
            session['full_name'] = user['full_name']
            session['language'] = user.get('language', 'en')
            
            # Beni Hatırla özelliği
            remember_me = request.form.get('remember_me')
            if remember_me:
                session.permanent = True
            
            # Son giriş zamanını güncelle
            cur.execute("UPDATE users SET last_login = NOW() WHERE id = %s", (user['id'],))
            conn.commit()
            
            app.logger.info(f"Successful login for user: {username} from IP: {request.remote_addr}")
            return redirect(url_for('dashboard'))
                
        except Exception as e:
            app.logger.error(f"Login error for username {username}: {e}")
            flash('Giriş sırasında hata oluştu!', 'error')
        finally:
            if conn:
                conn.close()
    
    return render_template('login.html')

@app.route('/logout')
def logout():
    """Çıkış yap"""
    if session.get('username'):
        app.logger.info(f"User logout: {session.get('username')} from IP: {request.remote_addr}")
    session.clear()
    return redirect(url_for('login'))

@app.route('/dashboard')
def dashboard():
    """Ana kontrol paneli"""
    if not session.get('user_id'):
        return redirect(url_for('login'))
    
    return render_template('dashboard.html')

@app.route('/users')
def users():
    """Kullanıcı yönetimi sayfası"""
    if not session.get('user_id'):
        return redirect(url_for('login'))
    
    # Veritabanından kullanıcıları getir
    conn = get_db_connection()
    if not conn:
        flash('Database connection error!', 'error')
        return render_template('definitions/user.html', users=[])
    
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("""
            SELECT id, username, email, full_name, is_active, created_at, last_login
            FROM users
            ORDER BY created_at DESC
        """)
        users = cur.fetchall()
        
        return render_template('definitions/user.html', users=users)
        
    except psycopg2.Error as e:
        app.logger.error(f"Users loading error: {e}")
        flash('Kullanıcılar yüklenirken hata oluştu!', 'error')
        return render_template('definitions/user.html', users=[])
    finally:
        if conn:
            conn.close()

@app.route('/change_language/<lang>')
def change_language(lang):
    """Dil değiştir"""
    if lang in ['en', 'tr']:
        session['language'] = lang
    
    # Giriş durumuna göre yönlendir
    if 'user_id' in session:
        return redirect(request.referrer or url_for('dashboard'))
    else:
        return redirect(request.referrer or url_for('login'))

@app.route('/user_permissions/<int:user_id>')
def user_permissions(user_id):
    """Kullanıcı yetki yönetimi sayfası"""
    if not session.get('user_id'):
        return redirect(url_for('login'))
    
    # Yetki kontrolü - sadece admin ve manager yetkisi olanlar
    if not has_permission(session.get('user_id'), 'user.edit'):
        flash('Bu sayfaya erişim yetkiniz yok!', 'error')
        return redirect(url_for('users'))
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        # Kullanıcı bilgilerini getir
        cursor.execute("""
            SELECT id, username, email, full_name, is_active, created_at, last_login
            FROM users WHERE id = %s
        """, (user_id,))
        user = cursor.fetchone()
        
        if not user:
            flash('Kullanıcı bulunamadı!', 'error')
            return redirect(url_for('users'))
        
        # Kullanıcının mevcut yetkilerini getir
        user_permissions = get_user_permissions(user_id)
        
        # Kullanıcının rollerini getir
        user_roles = get_user_roles(user_id)
        
        # Tüm yetkileri getir
        all_permissions = get_all_permissions()
        
        # Tüm rolleri getir
        all_roles = get_all_roles()
        
        # Modüllere göre yetkileri grupla
        permissions_by_module = {}
        for perm in all_permissions:
            module = perm['module']
            if module not in permissions_by_module:
                permissions_by_module[module] = []
            permissions_by_module[module].append(perm)
        
        return render_template('definitions/user_permissions.html',
                             user=user,
                             user_permissions=user_permissions,
                             user_roles=user_roles,
                             all_permissions=all_permissions,
                             all_roles=all_roles,
                             permissions_by_module=permissions_by_module)
        
    except Exception as e:
        app.logger.error(f"Kullanıcı yetki sayfası hatası: {e}")
        flash('Sayfa yüklenirken hata oluştu!', 'error')
        return redirect(url_for('users'))
    finally:
        if conn:
            cursor.close()
            conn.close()

@app.route('/assign_permission', methods=['POST'])
def assign_permission():
    """Kullanıcıya yetki atar"""
    if not session.get('user_id'):
        return jsonify({'success': False, 'message': 'Oturum açmanız gerekiyor!'})
    
    # Yetki kontrolü
    if not has_permission(session.get('user_id'), 'user.edit'):
        return jsonify({'success': False, 'message': 'Bu işlem için yetkiniz yok!'})
    
    try:
        user_id = request.json.get('user_id')
        permission_id = request.json.get('permission_id')
        
        if assign_permission_to_user(user_id, permission_id):
            return jsonify({'success': True, 'message': 'Yetki başarıyla atandı!'})
        else:
            return jsonify({'success': False, 'message': 'Yetki atanırken hata oluştu!'})
            
    except Exception as e:
        app.logger.error(f"Yetki atama hatası: {e}")
        return jsonify({'success': False, 'message': 'Yetki atanırken hata oluştu!'})

@app.route('/remove_permission', methods=['POST'])
def remove_permission():
    """Kullanıcıdan yetki kaldırır"""
    if not session.get('user_id'):
        return jsonify({'success': False, 'message': 'Oturum açmanız gerekiyor!'})
    
    # Yetki kontrolü
    if not has_permission(session.get('user_id'), 'user.edit'):
        return jsonify({'success': False, 'message': 'Bu işlem için yetkiniz yok!'})
    
    try:
        user_id = request.json.get('user_id')
        permission_id = request.json.get('permission_id')
        
        if remove_permission_from_user(user_id, permission_id):
            return jsonify({'success': True, 'message': 'Yetki başarıyla kaldırıldı!'})
        else:
            return jsonify({'success': False, 'message': 'Yetki kaldırılırken hata oluştu!'})
            
    except Exception as e:
        app.logger.error(f"Yetki kaldırma hatası: {e}")
        return jsonify({'success': False, 'message': 'Yetki kaldırılırken hata oluştu!'})

@app.route('/assign_role', methods=['POST'])
def assign_role():
    """Kullanıcıya rol atar"""
    if not session.get('user_id'):
        return jsonify({'success': False, 'message': 'Oturum açmanız gerekiyor!'})
    
    # Yetki kontrolü
    if not has_permission(session.get('user_id'), 'user.edit'):
        return jsonify({'success': False, 'message': 'Bu işlem için yetkiniz yok!'})
    
    try:
        user_id = request.json.get('user_id')
        role_id = request.json.get('role_id')
        
        if assign_role_to_user(user_id, role_id):
            return jsonify({'success': True, 'message': 'Rol başarıyla atandı!'})
        else:
            return jsonify({'success': False, 'message': 'Rol atanırken hata oluştu!'})
            
    except Exception as e:
        app.logger.error(f"Rol atama hatası: {e}")
        return jsonify({'success': False, 'message': 'Rol atanırken hata oluştu!'})

@app.route('/remove_role', methods=['POST'])
def remove_role():
    """Kullanıcıdan rol kaldırır"""
    if not session.get('user_id'):
        return jsonify({'success': False, 'message': 'Oturum açmanız gerekiyor!'})
    
    # Yetki kontrolü
    if not has_permission(session.get('user_id'), 'user.edit'):
        return jsonify({'success': False, 'message': 'Bu işlem için yetkiniz yok!'})
    
    try:
        user_id = request.json.get('user_id')
        role_id = request.json.get('role_id')
        
        if remove_role_from_user(user_id, role_id):
            return jsonify({'success': True, 'message': 'Rol başarıyla kaldırıldı!'})
        else:
            return jsonify({'success': False, 'message': 'Rol kaldırılırken hata oluştu!'})
            
    except Exception as e:
        app.logger.error(f"Rol kaldırma hatası: {e}")
        return jsonify({'success': False, 'message': 'Rol kaldırılırken hata oluştu!'})


# Hata sayfaları
@app.errorhandler(404)
def not_found(error):
    return render_template('error.html', 
                         error_code=404, 
                         error_message='Sayfa bulunamadı'), 404

@app.errorhandler(500)
def internal_error(error):
    return render_template('error.html', 
                         error_code=500, 
                         error_message='Sunucu hatası'), 500

@app.errorhandler(403)
def forbidden(error):
    return render_template('error.html', 
                         error_code=403, 
                         error_message='Erişim reddedildi'), 403

@app.errorhandler(429)
def rate_limit_exceeded(error):
    return render_template('error.html', 
                         error_code=429, 
                         error_message='Çok fazla istek gönderildi. Lütfen bekleyin.'), 429

if __name__ == '__main__':
    # Veritabanını başlat
    if init_database():
        print("PostgreSQL veritabanı başarıyla başlatıldı!")
    else:
        print("PostgreSQL veritabanı başlatma hatası!")
    
    app.run(debug=Config.DEBUG, host=Config.HOST, port=Config.PORT)
