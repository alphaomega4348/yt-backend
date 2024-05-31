class Api extends error{
    constructor(
        status, 
        message="Something went wrong",
        errors =[],
        statck=""){
        super(message);
        this.status = status;
        this.data=null;
        this.message = message;
        this.success = false;
        this.errors = errors;
        if(stack){
            this.stack = statck;
        }
        else{
            error.captureStackTrace(this, this.constructor);
        }
    }
}


export {ApiError}