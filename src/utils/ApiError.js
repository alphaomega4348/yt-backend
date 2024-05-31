class Api extends error{
    constructor(
        status, 
        message="Something went wrong",
        errors =[],
        stack=""){
        super(message);
        this.status = status;
        this.data=null;
        this.message = message;
        this.success = false;
        this.errors = errors;
        if(stack){
            this.stack = stack;
        }
        else{
            error.captureStackTrace(this, this.constructor);
        }
    }
}


export {ApiError}