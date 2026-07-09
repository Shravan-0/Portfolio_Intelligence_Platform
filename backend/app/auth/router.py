from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
)

from sqlalchemy.orm import Session

from app.database.connection import (
    get_db,
)

from .schemas import (
    RegisterRequest,
    RegisterResponse,
)

from .service import (
    register_user,
)
from .schemas import (
    LoginRequest,
    TokenResponse,
)
from .service import (
    login_user,
)


from .security import (
    oauth2_scheme,
    verify_token,
)
from .schemas import (
    UserResponse,
)
from .service import (
    get_current_user,
)

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


@router.post(
    "/register",
    response_model=RegisterResponse,
)
def register(
    request: RegisterRequest,
    db: Session = Depends(get_db),
):
    try:
        return register_user(
            db,
            request,
        )

    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e),
        )
    
@router.post(
    "/login",
    response_model=TokenResponse,
)
def login(
    request: LoginRequest,
    db: Session = Depends(get_db),
):
    try:
        return login_user(
            db,
            request,
        )

    except ValueError as e:
        raise HTTPException(
            status_code=401,
            detail=str(e),
        )
    
from fastapi import Header


@router.get(
    "/me",
    response_model=UserResponse,
)
def me(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
):
    payload = verify_token(token)

    return get_current_user(
        db,
        payload["sub"],
    )

   