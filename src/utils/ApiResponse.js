class ApiResponse extends{
    constructor(status,message="",data=null){
        this.status = status;
        this.data = data;
        this.success = status < 400;
    }
}{}