import {Router} from 'express'
import { loginUser, logoutUser, refreshAcccessToken, registerUser } from '../controllers/user.controller.js'
import { upload } from '../middlewares/multer.middleware.js'
import { verifyJWT } from '../middlewares/auth.middleware.js'

const router=Router()

router.route("/register").post(
    // This upload gives us many options as it is coming from multer
    // we choose fields here because it accepts files from different fields
    // Can't choose array here because it takes multipple files from same field
    upload.fields([
        {
            // The name of the field should match the data key with the Frontend
            name: "avatar",
            // This max count here tells that how many files are you going to accept from this field
            maxCount: 1
        },
        {
            // The name of the field should match the data key with the Frontend
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser
)


// Login Route
router.route('/login').post(loginUser)


// secured routes
router.route("/logout").post(verifyJWT,logoutUser)
router.route("/refresh-token").post(refreshAcccessToken)


export default router