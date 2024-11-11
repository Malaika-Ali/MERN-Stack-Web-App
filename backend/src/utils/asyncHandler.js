// promises wala code
const asyncHandler=(requestHandler)=>{
    return (req,res,next)=>{
    Promise.resolve(requestHandler(req,res, next)).catch((err)=>next(err))  
      }
}



// higher order function jismn ek function fn as parameter use horaha hai aur is function k andar ek aur function call horaha hai bus us nested function se pehle k curly braces hata diye hain const asyncHandler=()=>{()=>{}}
    // 2. try catch wala code

// const asyncHandler=(fn)=> async (req,res, next)=>{
//     try {
//         await fn(req,res,next)
//     } catch (error) {
//         res.status(error.code || 500).json({
//             success : false,
//             message: error.message
//         })
//     }
// }

export {asyncHandler}