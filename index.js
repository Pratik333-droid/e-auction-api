import express from 'express'
import session from 'express-session'
import admin_router from './router/adminRouter.js'
import auction_router from './router/auctionRouter.js'
import franchise_router from './router/franchiseRouter.js'
import old_router from './routers.js'
import { PORT_NO } from './constants.js'

var app = express()

// app.set('view engine', 'ejs');

app.use(session(
    {
        secret: 'appunkasecret', 
        //this secret is a salt(probably) which is used to create hash that is used to sign the session id cookie
        //this prevents the cookie from being tampered with
        cookie:{sameSite: 'strict', maxAge: 24*60*60*1000},
        resave: false,
        saveUninitialized: true
    } 
))

app.use('/admin', admin_router)  
app.use('/auction', auction_router)  
app.use('/franchise', franchise_router)
app.use('/old_router', old_router)


app.use((err, req, res, next) => {
    console.error(err); // Log the error for debugging purposes
    
    // Send a generic error response to the client
    res.status(500).send(err);
  });

app.listen(PORT_NO)