from pydantic import (
    BaseModel,
    field_validator,
)
from pydantic import Field
from pydantic import EmailStr
import re


class RegisterRequest(BaseModel):
    name: str = Field(
        min_length=2,
        max_length=100,
    )

    email: EmailStr

    password: str

    @field_validator("password")
    @classmethod
    def validate_password(
        cls,
        value: str,
    ):
        if len(value) < 6:
            raise ValueError(
                "Password must be at least 6 characters long"
            )

        if not re.search(
            r"[!@#$%^&*(),.?\":{}|<>]",
            value,
        ):
            raise ValueError(
                "Password must contain at least one special character"
            )

        return value


class RegisterResponse(BaseModel):
    message: str
    user_id: int


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str


class UserResponse(BaseModel):
    id: int
    name: str
    email: EmailStr