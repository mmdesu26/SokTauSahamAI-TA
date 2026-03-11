from app import create_app, db, bcrypt
from app.models import User

app = create_app()

def create_admin_account():
    with app.app_context():
        db.create_all()
        print("Tabel dicek/dibuat: users")

        admin_username = "admin"
        admin = User.query.filter_by(username=admin_username).first()

        if not admin:
            hashed_password = bcrypt.generate_password_hash("admin123").decode("utf-8")
            admin_user = User(
                username=admin_username,
                name="Administrator",
                password_hash=hashed_password
            )
            db.session.add(admin_user)
            db.session.commit()
            print("Admin default berhasil dibuat: username 'admin', password 'admin123'")
        else:
            print("Admin default sudah ada.")

if __name__ == "__main__":
    create_admin_account()
    app.run(debug=True)