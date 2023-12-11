import express from "express"

const router = express.Router()

router.get('/', function(req, res)
{
    if (req.session.admin)
    return res.status(200).send(req.session.admin)

    else if (req.session.franchise)
    return res.status(200).send(req.session.franchise)

    else
    return res.status(401).send('Unauthorized!')

})

export default router