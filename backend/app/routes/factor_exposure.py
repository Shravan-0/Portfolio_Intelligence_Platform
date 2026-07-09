from fastapi import APIRouter, Depends

from sqlalchemy.orm import Session



from app.auth.dependencies import (

    get_current_user,

    get_owned_portfolio,

)

from app.database.connection import get_db

from app.models.user import User



from app.schemas.factor_exposure import (

    FactorExposureResponse,

    FactorExposureItem

)



from app.services.factor_exposure import (

    get_factor_exposure

)



router = APIRouter()





@router.get(

    "/factor-exposure/{portfolio_id}",

    response_model=FactorExposureResponse

)

def factor_exposure(

    portfolio_id: int,

    db: Session = Depends(get_db),

    current_user: User = Depends(get_current_user),

):

    get_owned_portfolio(db, portfolio_id, current_user)



    exposures = get_factor_exposure(

        portfolio_id,

        db

    )



    return FactorExposureResponse(

        exposures=[

            FactorExposureItem(

                factor=item["factor"],

                exposure=item["exposure"],

            )

            for item in exposures

        ]

    )

