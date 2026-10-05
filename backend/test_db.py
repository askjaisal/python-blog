from sqlalchemy import select
from app.db.database import SessionLocal
from app.models import User

db = SessionLocal()

# user = User(
#     username="jaisal",
#     email="askjaisal@gmail.com",
#     password_hash="temp-pass"
# )

# db.add(user)
# db.commit()

# print("User created:", user.id)

# db.close()

## ---------------------------##

# statement = select(User)

# result = db.execute(statement)

# users = result.scalars().all()

# for user in users:
#     print(user.id, user.username, user.email)

# db.close()

## ---------------------------##

# statement = select(User).where(User.id == 1)

# result = db.execute(statement)

# user = result.scalar_one()

# user.username = "Updated name"

# db.commit()

# print(user.id, user.username)

# db.close()

## ---------------------------##

statement = select(User).where(User.id == 1)

result = db.execute(statement)

user = result.scalar_one()

db.delete(user)

db.commit()

print("USER DELETED")

db.close()