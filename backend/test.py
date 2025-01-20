from typing import Annotated, Literal

from annotated_types import Gt

from pydantic import BaseModel


class Fruit(BaseModel):
    name: str  
    color: Literal['red', 'green']  
    weight: Annotated[float, Gt(0)]  
    bazam: dict[str, list[tuple[int, bool, float]]]  


print(
    Fruit(
        name='Apple',
        color='blue',
        weight=4.2,
        bazam={'foobar': [(1, True, 0.1)]},
    )
)
