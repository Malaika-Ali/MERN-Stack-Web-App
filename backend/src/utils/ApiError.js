class ApiError extends Error{
    constructor(
        statusCode,
        message= "Something went wrong!",
        errors=[],
        stack=''
    ){
        super(message)
        this.statusCode=statusCode
        this.data=null
        this.message=message
        // kiunke yahan hum API error ko handle kar rahey hain response ko nahi toh success flag false hi jayega
        this.success=false
        this.errors=errors

        if (stack) {
            this.stack=stack
        }
        else{
            Error.captureStackTrace(this, this.constructor)
        }

    }
}

export {ApiError}