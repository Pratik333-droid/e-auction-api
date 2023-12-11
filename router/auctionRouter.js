import express from 'express'
import bodyParser from 'body-parser'; 
import pool from './../dbconfig.js';

const router = express.Router()
router.use(bodyParser.urlencoded({ extended: false }));
router.use(express.json());

router.post('/create', async function(req, res)
{
    //admin creates auction
    try
    {
        if (!req.session.admin)
        return res.status(401).send('Unauthorized! Login as auction admin to continue.')

        const name = req.body.name
        const total_teams = req.body.total_teams
        const budget_per_team = req.body.budget_per_team
        const date_of_auction = new Date(req.body.date_of_auction)
        const admin_id = req.session.admin.id

        //see if any detail is missing
        if (!name || !total_teams || !budget_per_team || !date_of_auction || !admin_id)
        return res.status(400).send('Enter all the necessary details')

        //see if the admin exists
        const admin = (await pool.query('select * from AuctionAdmin where id = $1', [admin_id])).rows[0]

        if (!admin)
        return res.status(400).send(`admin with id ${admin_id} does not exist.`)

        //when the auction is created, record should be made in the auction table as well as the admincreatesauction table

        const auction = (await pool.query('insert into auction (name, total_teams, budget_per_team, date_of_auction, admin_id) values ($1, $2, $3, $4, $5) returning*', [name, total_teams, budget_per_team, date_of_auction, admin_id])).rows[0]

        await pool.query('insert into AdminCreatesAuction (auction_id, admin_id) values ($1, $2)', [auction.id, req.session.admin.id])

        return res.status(200).send(auction)
    }

    catch(err)
    {
        return res.status(400).send(err.message)
    }
})

router.post('/register', async function(req, res)
{

    //player registers for auction

    // name | email | category | base_price | created_at | auction_id | is_approved

    try
    {
        const name = req.body.name
        const email = req.body.email
        const category = req.body.category
        const base_price = req.body.base_price
        const auction_id = req.body.auction_id

        if (!name || !email || !category || !base_price || !auction_id)
        return res.status(400).send('Enter all the necessary details.')

        //see if the auction the player is trying to register actually exist.
        const auction = (await pool.query('select * from auction where id = $1', [auction_id])).rows[0]

        if (!auction)
        return res.status(400).send(`The auction with id ${auction_id} does not exist.`)

        const player = (await pool.query('insert into player (name, email, category, base_price, auction_id) values ($1, $2, $3, $4, $5) returning *', [name, email, category, base_price, auction_id])).rows[0]

        return res.status(200).send(player)

    }

    catch(err)
    {
        return res.status(400).send(err.message)
    }

})


export default router