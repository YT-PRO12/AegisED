from pydantic import BaseModel,Field,ConfigDict
class Features(BaseModel):
    model_config=ConfigDict(extra='forbid',allow_inf_nan=False)
    age:int=Field(ge=18,le=89)
    heartRate:float=Field(ge=25,le=250)
    systolicBP:float=Field(ge=50,le=250)
    respiratoryRate:float=Field(ge=5,le=60)
    temperature:float=Field(ge=30,le=43)
    oxygenSaturation:float=Field(ge=50,le=100)
class Question(BaseModel):
    model_config=ConfigDict(extra='forbid')
    question:str=Field(min_length=3,max_length=500)
