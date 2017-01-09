
ErrorCodes = {
    BAD_DOMAIN: 401,
    TIMEOUT : 402,
    createError : (code, msg) => {return {errCode : code, errMsg: msg}}   
}


module.exports = ErrorCodes;