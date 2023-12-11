import express from 'express';
import bodyParser from 'body-parser'; 
import bcrypt from 'bcrypt';
import pool from './../dbconfig.js';
import { SALT_ROUNDS } from '../constants.js';

const router = express.Router()
router.use(bodyParser.urlencoded({ extended: false }));
router.use(express.json());

router.post('/create', async function(req, res)
{
    //create admin
    try 
    {
        const name = req.body.name
        const email = req.body.email
        const password = req.body.password

        if (!name || !email || !password)
        return res.status(400).send('Enter all the details.')

        bcrypt.hash(password, SALT_ROUNDS, async function (err, hashed_password)
        {
            if (err)
            return res.status(500).send(err.message)

            try
            {
                let admin = await pool.query('insert into auctionadmin (name, email, password) values($1, $2, $3) returning*', [name, email, hashed_password])
                admin = admin.rows[0]
                delete admin.password
    
                return res.status(200).send(admin)

            }

            catch(err)
            {
                return res.status(400).send(err.message)
            }
        })

    }
    catch(err)
    {
        return res.status(400).send(err.message)
    }


})

router.post('/login', async function(req, res)
{
    //login
    if (req.session.admin || req.session.franchise)
    return res.status(400).send('Please logout to login again from another account.')

    try
    {
        const email = req.body.email
        const password = req.body.password

        let admin = (await pool.query('select * from AuctionAdmin where email = $1', [email])).rows[0]
        
        if (!admin)
        return res.status(400).send('invalid email.')
    
        const hashed_password = admin.password
        
        bcrypt.compare(password, hashed_password, function (err, result)
        {
            if (err)
            return res.status(500).send(err.message)
            

            if (result)
            {
                delete admin.password
                req.session.admin = admin
                return res.status(200).send(req.session.admin)
            }

            else if (!result)
            return res.status(400).send('Incorrect password')
        })

    }
    catch(err)
    {
        return res.status(400).send(err.message)
    }

})

router.post('/logout', async function(req, res)
{

    //logout
    try
    {
        if (!req.session.admin)
        return res.status(400).send('You are already logged out')


        req.session.destroy(function (err)
        {
            if (err)
            return res.status(500).send('Cant log you out')
            
            else
            {
                return res.status(200).send('Successfully logged out')

            }
        })
    }
    catch(err)
    {
        return res.status(400).send(err.message)
    }
})

export default router