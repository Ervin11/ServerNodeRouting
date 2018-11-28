const app = require('express')()
const express = require('express')
const db = require('sqlite')
const pug = require('pug')
var dateTime = require('node-datetime');

const PORT = process.env.PORT || 8080

db.open('todolist.db').then(() => {

  console.log('Database ready')

  return Promise.all([

    db.run("CREATE TABLE IF NOT EXISTS todos (message, completion, created_at, updated_at)")
    
  ])
})

.then(() => {
  console.log('tables ready')
})
.catch(() => console.log('An error occurred'))

app.use(express.json())
app.use(express.urlencoded({
    extended: true
}))

// Server 

app.use((req, res, next) => {
    console.log('Serveur init')
    next()
})

// Listen on port 8080

app.listen(PORT, () => {
 console.log('Serveur on port : ', PORT)
})

// Redirects on Post todos when /

app.all('/', (req, res, next) => {
    console.log('-> ALL *')
    res.redirect(301, '/todos')
    next()
})

// Post new todos and show them

app.post('/todos', (req, res) => {
    
    let dt = dateTime.create();
    let time = dt.format('H:M:S - d/m/Y');

    db.open('todolist.db').then(() => {
        
        console.log('Database ready')
        
        return Promise.all([
          
            db.run(`INSERT INTO todos (message,completion,created_at,updated_at) 
                  VALUES ("${req.body.message}","${req.body.completion}","${time}","${req.body.updated_at}")`)
        ])
      })

    .then(() => {
        res.send('New todo inserted with success')
        console.log('Inserted with success')
    })
    .catch(() => console.log('An error occurred'))
    
})

// Get todos and show them

app.get('/todos', (req, res) => {
        
    db.open('todolist.db').then(() => {
        
        console.log('Database ready')
        
        return Promise.all([
          
            db.all('SELECT * FROM todos').then((rows) => {
                        
                return Promise.all([       
                    res.send(rows)
                ])
            })
            
        ])
    })

    .then(() => {
        console.log('Get success')
    })
    .catch(() => console.log('An error occurred'))

})




