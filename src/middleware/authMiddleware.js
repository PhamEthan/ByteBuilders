import jwt from 'jsonwebtoken'

function authMiddleware (req, res, next){
    const token = req.headers['authorization']
    //check if token exists
    if(!token) {return res.status(401).json({message: "No Token provided"})}

    //check if token is correct

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {return res.status(401).json({message: "Invalid Token"})}
        req.userId = decoded.id
        next()
    })
}

export default authMiddleware