import psycopg2
from config import get_db_connection

def create_permissions_tables():
    """Yetki sistemi için gerekli tabloları oluşturur"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Yetki tablosu
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS permissions (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) UNIQUE NOT NULL,
                description TEXT,
                module VARCHAR(50) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Kullanıcı yetkileri tablosu
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS user_permissions (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                permission_id INTEGER REFERENCES permissions(id) ON DELETE CASCADE,
                granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                granted_by INTEGER REFERENCES users(id),
                UNIQUE(user_id, permission_id)
            )
        """)
        
        # Rol tablosu
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS roles (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) UNIQUE NOT NULL,
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Rol yetkileri tablosu
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS role_permissions (
                id SERIAL PRIMARY KEY,
                role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
                permission_id INTEGER REFERENCES permissions(id) ON DELETE CASCADE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(role_id, permission_id)
            )
        """)
        
        # Kullanıcı rolleri tablosu
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS user_roles (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
                assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                assigned_by INTEGER REFERENCES users(id),
                UNIQUE(user_id, role_id)
            )
        """)
        
        conn.commit()
        print("Yetki sistemi tablolari olusturuldu!")
        
    except Exception as e:
        print(f"Hata: {e}")
    finally:
        if conn:
            cursor.close()
            conn.close()

def insert_default_permissions():
    """Varsayılan yetkileri ekler"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Varsayılan yetkiler
        permissions = [
            # User Management
            ('user_view', 'Kullanıcıları Görüntüleme', 'users'),
            ('user_create', 'Kullanıcı Oluşturma', 'users'),
            ('user_edit', 'Kullanıcı Düzenleme', 'users'),
            ('user_delete', 'Kullanıcı Silme', 'users'),
            
            # Tour Management
            ('tour_view', 'Turları Görüntüleme', 'tours'),
            ('tour_create', 'Tur Oluşturma', 'tours'),
            ('tour_edit', 'Tur Düzenleme', 'tours'),
            ('tour_delete', 'Tur Silme', 'tours'),
            
            # Cost Management
            ('cost_view', 'Maliyetleri Görüntüleme', 'costs'),
            ('cost_create', 'Maliyet Oluşturma', 'costs'),
            ('cost_edit', 'Maliyet Düzenleme', 'costs'),
            ('cost_delete', 'Maliyet Silme', 'costs'),
            
            # Reports
            ('report_view', 'Raporları Görüntüleme', 'reports'),
            ('report_export', 'Rapor Dışa Aktarma', 'reports'),
            
            # Settings
            ('settings_view', 'Ayarları Görüntüleme', 'settings'),
            ('settings_edit', 'Ayar Düzenleme', 'settings'),
            
            # System
            ('system_logs', 'Sistem Loglarını Görüntüleme', 'system'),
            ('system_backup', 'Sistem Yedekleme', 'system'),
        ]
        
        for perm in permissions:
            cursor.execute("""
                INSERT INTO permissions (name, description, module) 
                VALUES (%s, %s, %s) 
                ON CONFLICT (name) DO NOTHING
            """, perm)
        
        # Varsayılan roller
        roles = [
            ('admin', 'Sistem Yöneticisi - Tüm yetkilere sahip'),
            ('manager', 'Yönetici - Kullanıcı ve tur yönetimi'),
            ('user', 'Kullanıcı - Sadece görüntüleme yetkisi'),
            ('operator', 'Operatör - Tur ve maliyet yönetimi')
        ]
        
        for role in roles:
            cursor.execute("""
                INSERT INTO roles (name, description) 
                VALUES (%s, %s) 
                ON CONFLICT (name) DO NOTHING
            """, role)
        
        conn.commit()
        print("Varsayilan yetkiler ve roller eklendi!")
        
    except Exception as e:
        print(f"Hata: {e}")
    finally:
        if conn:
            cursor.close()
            conn.close()

def assign_role_permissions():
    """Rollere yetkileri atar"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Admin rolü - tüm yetkiler
        cursor.execute("SELECT id FROM roles WHERE name = 'admin'")
        admin_role_id = cursor.fetchone()[0]
        
        cursor.execute("SELECT id FROM permissions")
        all_permissions = cursor.fetchall()
        
        for perm_id in all_permissions:
            cursor.execute("""
                INSERT INTO role_permissions (role_id, permission_id) 
                VALUES (%s, %s) 
                ON CONFLICT (role_id, permission_id) DO NOTHING
            """, (admin_role_id, perm_id[0]))
        
        # Manager rolü - kullanıcı ve tur yönetimi
        cursor.execute("SELECT id FROM roles WHERE name = 'manager'")
        manager_role_id = cursor.fetchone()[0]
        
        manager_permissions = [
            'user_view', 'user_create', 'user_edit', 'user_delete',
            'tour_view', 'tour_create', 'tour_edit', 'tour_delete',
            'cost_view', 'cost_create', 'cost_edit', 'cost_delete',
            'report_view', 'report_export'
        ]
        
        for perm_name in manager_permissions:
            cursor.execute("SELECT id FROM permissions WHERE name = %s", (perm_name,))
            perm_id = cursor.fetchone()
            if perm_id:
                cursor.execute("""
                    INSERT INTO role_permissions (role_id, permission_id) 
                    VALUES (%s, %s) 
                    ON CONFLICT (role_id, permission_id) DO NOTHING
                """, (manager_role_id, perm_id[0]))
        
        # User rolü - sadece görüntüleme
        cursor.execute("SELECT id FROM roles WHERE name = 'user'")
        user_role_id = cursor.fetchone()[0]
        
        user_permissions = [
            'user_view', 'tour_view', 'cost_view', 'report_view'
        ]
        
        for perm_name in user_permissions:
            cursor.execute("SELECT id FROM permissions WHERE name = %s", (perm_name,))
            perm_id = cursor.fetchone()
            if perm_id:
                cursor.execute("""
                    INSERT INTO role_permissions (role_id, permission_id) 
                    VALUES (%s, %s) 
                    ON CONFLICT (role_id, permission_id) DO NOTHING
                """, (user_role_id, perm_id[0]))
        
        # Operator rolü - tur ve maliyet yönetimi
        cursor.execute("SELECT id FROM roles WHERE name = 'operator'")
        operator_role_id = cursor.fetchone()[0]
        
        operator_permissions = [
            'tour_view', 'tour_create', 'tour_edit', 'tour_delete',
            'cost_view', 'cost_create', 'cost_edit', 'cost_delete',
            'report_view', 'report_export'
        ]
        
        for perm_name in operator_permissions:
            cursor.execute("SELECT id FROM permissions WHERE name = %s", (perm_name,))
            perm_id = cursor.fetchone()
            if perm_id:
                cursor.execute("""
                    INSERT INTO role_permissions (role_id, permission_id) 
                    VALUES (%s, %s) 
                    ON CONFLICT (role_id, permission_id) DO NOTHING
                """, (operator_role_id, perm_id[0]))
        
        conn.commit()
        print("Rollere yetkiler atandi!")
        
    except Exception as e:
        print(f"Hata: {e}")
    finally:
        if conn:
            cursor.close()
            conn.close()

def assign_default_roles():
    """Mevcut kullanıcılara varsayılan roller atar"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Admin kullanıcısına admin rolü ata
        cursor.execute("SELECT id FROM users WHERE username = 'admin'")
        admin_user = cursor.fetchone()
        if admin_user:
            cursor.execute("SELECT id FROM roles WHERE name = 'admin'")
            admin_role = cursor.fetchone()
            if admin_role:
                cursor.execute("""
                    INSERT INTO user_roles (user_id, role_id) 
                    VALUES (%s, %s) 
                    ON CONFLICT (user_id, role_id) DO NOTHING
                """, (admin_user[0], admin_role[0]))
        
        # Diğer kullanıcılara user rolü ata
        cursor.execute("SELECT id FROM users WHERE username != 'admin'")
        other_users = cursor.fetchall()
        cursor.execute("SELECT id FROM roles WHERE name = 'user'")
        user_role = cursor.fetchone()
        
        if user_role:
            for user in other_users:
                cursor.execute("""
                    INSERT INTO user_roles (user_id, role_id) 
                    VALUES (%s, %s) 
                    ON CONFLICT (user_id, role_id) DO NOTHING
                """, (user[0], user_role[0]))
        
        conn.commit()
        print("Kullanicilara varsayilan roller atandi!")
        
    except Exception as e:
        print(f"Hata: {e}")
    finally:
        if conn:
            cursor.close()
            conn.close()

if __name__ == "__main__":
    print("Yetki sistemi kuruluyor...")
    create_permissions_tables()
    insert_default_permissions()
    assign_role_permissions()
    assign_default_roles()
    print("Yetki sistemi kurulumu tamamlandi!")
