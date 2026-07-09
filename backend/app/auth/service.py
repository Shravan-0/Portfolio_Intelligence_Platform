from sqlalchemy.orm import Session

from app.models.user import User

from .schemas import (
    RegisterRequest,
    RegisterResponse,
)
from .security import (
    hash_password,
)
from .security import (
    verify_password,
    create_access_token,
)
from .schemas import (
    LoginRequest,
    TokenResponse,
)

from .schemas import (
    UserResponse,
)
def register_user(
    db: Session,
    data: RegisterRequest,
) -> RegisterResponse:

    existing_user = (
        db.query(User)
        .filter(
            User.email == data.email
        )
        .first()
    )

    if existing_user:
        raise ValueError(
            "Email already registered"
        )

    user = User(
        name=data.name,
        email=data.email,
        password_hash=hash_password(
            data.password
        )
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return RegisterResponse(
        message="User registered successfully",
        user_id=user.id,
    )
    
def login_user(
    db: Session,
    data: LoginRequest,
) -> TokenResponse:

    user = (
        db.query(User)
        .filter(
            User.email == data.email
        )
        .first()
    )

    if not user:
       raise ValueError("Invalid email or password")

    if not verify_password(
        data.password,
        user.password_hash,
    ):
        raise ValueError("Invalid email or password")

    token = create_access_token(
        {
            "sub": user.email,
            "user_id": user.id,
        }
    )

    return TokenResponse(
        access_token=token,
        token_type="bearer",
    )

 
def get_current_user(
    db: Session,
    email: str,
) -> UserResponse:

    user = (
        db.query(User)
        .filter(
            User.email == email
        )
        .first()
    )

    if not user:
        raise ValueError(
            "User not found"
        )

    return UserResponse(
        id=user.id,
        name=user.name,
        email=user.email,
    )