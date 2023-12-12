import express from 'express'
import session from 'cookie-session'
import admin_router from './router/adminRouter.js'
import auction_router from './router/auctionRouter.js'
import franchise_router from './router/franchiseRouter.js'
import user_router from './router/userRouter.js'

import { PORT_NO } from './constants.js'

var app = express()

app.use(session({
    name: 'appunKaSession',
    keys: ['key1', 'key2']
  }))

app.use('/admin', admin_router)  
app.use('/auction', auction_router)  
app.use('/franchise', franchise_router)
app.use('/user', user_router)

app.post('*', function (req, res)
{
    return res.status(404).send('Endpoint doesnot exist')
})

app.use((err, req, res, next) => {
    console.error(err); // Log the error for debugging purposes
    
    // Send a generic error response to the client
    res.status(500).send(err.message);
  });

app.listen(PORT_NO)