import express from 'express'
import bodyParser from 'body-parser'; 
import bcrypt from 'bcrypt'
import pool from './../dbconfig.js';
import { SALT_ROUNDS } from '../constants.js';

const router = express.Router()
router.use(bodyParser.urlencoded({ extended: false }));
router.use(express.json());

router.post('/create', async function(req, res)
{
    //admin creates franchise
    try
    {

        if (!req.session.admin)
        return res.status(401).send('Please login as the auction admin to continue.')

        const name = req.body.name
        const email = req.body.email
        const password = req.body.password
        const auction_id = req.body.auction_id

        if (!(name && email && password && auction_id))
        return res.status(400).send('Enter all the details.')

        const auction = (await pool.query('select * from auction where id = $1', [auction_id])).rows[0]
        
        if (!auction)
        return res.status(400).send(`the auction with id ${auction_id} does not exist.`)

        bcrypt.hash(password, SALT_ROUNDS, async function(err, hashed_password)
        {
            if (err)
            return res.status(500).send(err.message)
            
            try
            {
                let franchise = (await pool.query('insert into franchise (name, email, password, auction_id) values ($1, $2, $3, $4) returning *', [name, email, hashed_password, auction_id])).rows
                
                delete franchise[0].password
    
                return res.status(200).send(franchise)

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

router.post('/login', async function (req, res)
{

    //franchise logs in
    try
    {
        if (req.session.franchise || req.session.admin)
        return res.status(400).send('You are already logged in')

        const email = req.body.email
        const password = req.body.password

        let franchise = (await pool.query('select * from franchise where email = $1', [email])).rows[0]

        if (!franchise)
        return res.status(400).send('incorrect email')


        bcrypt.compare(password, franchise.password, function (err, result)
        {
            if (err)
            return res.status(500).send(err.message)

            if (!result)
            return res.status(401).send('incorrect password')

            delete franchise.password
            req.session.franchise = franchise
            return res.status(200).send(franchise)

        })
    }

    catch(err)
    {
        return res.status(400).send(err.message)
    }

})

router.post('/logout', function (req, res)
{

    //franchise logs out
    try
    {
        if (!req.session.franchise)
        return res.status(400).send('You are not logged in as franchise.')

        // req.session.franchise = undefined
        req.session.destroy(function (err)
        {
            if (err)
            return res.status(500).send('Cant log you out')
            
            else
            return res.status(200).send('Successfully logged out')
        })
        
    }

    catch(err)
    {
        return res.status(400).send(err.message)
    }

})

router.post('/approve/:player_id', async function(req, res)
{
    //franchise or auction admin after logging in, approves the player for the auction
    try
    {
        if (!req.session.franchise && !req.session.admin)
        return res.status(401).send('Unauthorized! Login as franchise or auction admin to continue')

        const player = (await pool.query('select * from player where id = $1 and auction_id = $2 and is_approved = $3', [req.params.player_id, req.session.franchise.auction_id, false])).rows[0]

        if (!player)
        return res.status(400).send(`Player does not exist.`)

        await pool.query('update player set is_approved = $1 where id = $2 and auction_id = $3', [true, req.params.player_id, req.session.franchise.auction_id])

        return res.status(200).send(`${player.name} is successfully approved for the auction`)
    }

    catch(err)
    {
        return res.status(400).send(err.message)
    }
})

router.post('/purchase-player/:player_id', async function (req, res)
{
    //when the franchise purchases player in the auction
    try
    {
        if (!req.session.franchise)
        return res.status(400).send('Unauthorized! Login as franchise to continue')

        const player = (await pool.query('select * from player where id = $1 and auction_id = $2 and is_approved = $3', [req.params.player_id, req.session.franchise.auction_id, true])).rows[0]

        if (!player)
        return res.status(400).send(`Player does not exist.`)

        const expenditure = req.body.expenditure
        const franchise_id = req.session.franchise.id
        const auction_id = req.session.franchise.auction_id
        let expense_record = (await pool.query('update FranchisePurse set total_expenditure = total_expenditure + $1 where franchise_id = $2 returning *', [expenditure, franchise_id])).rows[0]

        //when the franchise makes the first purchase there is no record in the table.
        if (!expense_record)
        expense_record = (await pool.query('insert into FranchisePurse (auction_id, franchise_id, total_expenditure) values ($1, $2, $3) returning *', [auction_id, franchise_id, expenditure])).rows[0]

        //now make record in the sold_players table
        const sold_player  = (await pool.query('insert into SoldPlayers (player_id, auction_id, franchise_id, sold_amount) values ($1, $2, $3, $4) returning *', [player.id, auction_id, franchise_id, expenditure])).rows[0]

        if (!expense_record || !sold_player)
        return res.status(500).send('Cant purchase player due to some technical issues')

        else
        return res.status(200).send(`${player.name} purchased successfully.`)
    }

    catch(err)
    {
        return res.status(400).send(err.message)
    }
})

router.get('/view-purse', async function (req, res)
{
    try
    {
        //when franchise views its balance
        if (!req.session.franchise)
        return res.status(401).send('Unauthorized! Login as franchise to continue')

        const franchise_id = req.session.franchise.id
        const auction_id = req.session.franchise.auction_id

        const auction = (await pool.query('select * from auction where id = $1', [auction_id])).rows[0]
        
        if (!auction)
        return res.status(500).send(`auction with id ${auction_id} does not exist`)

        const total_purse = auction.budget_per_team

        const franchise_purse = (await pool.query('select * from FranchisePurse where franchise_id = $1 ', [franchise_id])).rows[0]

        let total_expenditure = 0

        if (franchise_purse)
        total_expenditure = franchise_purse.total_expenditure

        const remaining_purse = total_purse - total_expenditure

        return res.status(200).json({total_purse: total_purse, total_expenditure: total_expenditure, remaining_purse: remaining_purse})
    }

    catch(err)
    {
        return res.status(400).send(err.message)
    }
})

router.get('/players', async function (req, res)
{
    try
    {
        const franchise_id = req.body.franchise_id
        if (!franchise_id)
        return res.status(400).send('Enter franchise id')

        const query = 'select player.name, player.category, player.base_price, soldplayers.sold_amount \
        from soldplayers \
        inner join player \
        on soldplayers.player_id = player.id \
        where franchise_id = $1\
        '
        const players = (await pool.query(query, [franchise_id])).rows

        if (players.length === 0)
        return res.status(404).send('No player found')

        else
        return res.status(200).send(players)

    }

    catch(err)
    {
        return res.status(400).send(err.message)
    }
})
export default router
