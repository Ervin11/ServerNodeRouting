const express = require('express')
const app = express()
const db = require('sqlite')
const dateTime = require('node-datetime')
const bcrypt = require('bcrypt');
let alert = require('alert-node')
let methodOverride = require('method-override')

const PORT = process.env.PORT || 8080

let regex = new RegExp("[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+.[a-zA-Z]{2,6}");

//-----------------------------------------------------------------------------------------------------

// DATABASE 

db.open('todolist.db').then(() => {

  console.log('Database ready')

  return Promise.all([

    db.run("CREATE TABLE IF NOT EXISTS todos (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, message TEXT, completion TEXT, created_at TEXT, updated_at TEXT, user_id INTEGER, FOREIGN KEY (user_id) REFERENCES users(user_id))"),
    db.run("CREATE TABLE IF NOT EXISTS users (user_id INTEGER PRIMARY KEY AUTOINCREMENT, firstname TEXT, lastname TEXT, username TEXT, password TEXT, email TEXT, created_at TEXT, updated_at TEXT)")

  ])
})
.then(() => {
  console.log('Tables ready')
})
.catch(() => console.log('An error has occurred'))

//-----------------------------------------------------------------------------------------------------

// PARSING 

app.use(express.json())
app.use(express.urlencoded({
    extended: true
}))

//-----------------------------------------------------------------------------------------------------

// METHOD OVERRIDE

app.use(methodOverride('_method'))

//-----------------------------------------------------------------------------------------------------

// SETTING VIEW ENGINE AND VIEWS PATH

app.set('view engine', 'pug');
app.use(express.static(__dirname + '/views'));

//-----------------------------------------------------------------------------------------------------

// SERVER 

app.use((req, res, next) => {
    console.log('Server init')
    next()
})

//-----------------------------------------------------------------------------------------------------

// LISTEN ON PORT 8080

app.listen(PORT, () => {
 console.log('Server on port : ', PORT)
})

//-----------------------------------------------------------------------------------------------------

// REDIRECTS ON POST TODOS WHEN / 

app.all('/', (req, res, next) => {
    res.redirect(301, '/todos')
    next()
})

function isEmpty(obj) {
    for(var key in obj) {
        if(obj.hasOwnProperty(key))
            return false;
    }
    return true;
}

//-----------------------------------------------------------------------------------------------------

// GET ADD TODOS PAGE 

app.get('/todos/add', (req, res) => {
    
    db.all('SELECT * FROM users')
    .then((rows) => {
        
        res.render('edit.pug', {
            todo: rows,
            route: req.route
        })
                    
    })   
    .catch((err) => console.log(err))
    // res.render('edit.pug', { route: req.route })    
                  
})

// GET ADD USERS PAGE 

app.get('/users/add', (req, res) => {
    
    res.render('edit_users.pug', { route: req.route })    
                  
})

//-----------------------------------------------------------------------------------------------------

// GET ALL TODOS

app.get('/todos', (req, res) => {
            
    db.all('SELECT * FROM todos')
    .then((rows) => {
        
        res.format({
            
            'text/html': function(){
                res.render('index.pug', {
                    todo: rows
                })
              },

            'application/json': function(){
                res.json(rows);
              }
        })
                    
    })   
    .catch((err) => console.log(err))

})

//-----------------------------------------------------------------------------------------------------

// GET TODO BY ID

app.get('/todos/:todoId', (req, res) => {
            
    db.all(`SELECT * FROM todos WHERE '${req.params.todoId}'= id `)
    .then((rows) => {
        
        res.format({
        
            'text/html': function(){
                res.render('show.pug', {
                    todo: rows
                })
            },

            'application/json': function(){
                res.json(rows);
            }
        })                
    })   
    .catch((err) => console.log(err))

})

//-----------------------------------------------------------------------------------------------------

// POST NEW TODOS

app.post('/todos', (req, res) => {
    
    let dt = dateTime.create();
    let time = dt.format('d/m/Y');
    
    if (req.body.title !== "" && req.body.message !== "") {

        upperTitle = req.body.title.charAt(0).toUpperCase() + req.body.title.slice(1);
        

        return db.run(`INSERT INTO todos (title, message, completion, user_id, created_at, updated_at) 
                    VALUES ("${upperTitle}","${req.body.message}","${req.body.completion}", "${req.body.user}", "${time}", "Never")`)

        .then(() => {

            res.format({
            
                'text/html': function(){

                    res.redirect(301, '/todos')
                },

                'application/json': function(){
                    res.json({message : 'success'});
                }
            })  
        })
        .catch((err) => console.log(err))
    }

    else {
        
        res.format({
            
            'text/html': function(){
                alert("Erreur : Veuillez renseigner tous les champs")
                res.redirect(301, '/todos/add')
            }
        })  
    }
    
})

//-----------------------------------------------------------------------------------------------------

// UPDATE TODO

app.patch('/todos/:todoId', (req, res) => {

    let dt = dateTime.create();
    let time = dt.format('d/m/Y');
    
    return db.run(`UPDATE todos SET title = '${req.body.title}', message = '${req.body.message}', completion = '${req.body.completion}', updated_at = '${time}'
                   WHERE id = ${req.params.todoId}`)

    .then(() => {

        res.format({
        
            'text/html': function(){
                res.redirect(301, '/todos')
            },

            'application/json': function(){
                res.json({message : 'success'});
            }
        })

    })
    .catch((err) => console.log(err))
})

//-----------------------------------------------------------------------------------------------------

// DELETE TODOS BY ID

app.delete('/todos/:todoId', (req, res) => {

    return db.run(`DELETE FROM todos WHERE id = ${req.params.todoId}`)
    .then(() => {

        res.format({
        
            'text/html': function(){
                res.redirect(301, '/todos')
            },

            'application/json': function(){
                res.json({message : 'success'});
            }
        })
    })
    .catch((err) => console.log(err))

})

//-----------------------------------------------------------------------------------------------------

// GET EDIT PAGE BY ID

app.get('/todos/:todoId/edit', (req, res) => {
            
    db.all(`SELECT * FROM todos WHERE '${req.params.todoId}'= id `)
    .then((rows) => {
        
        res.render('edit.pug', {
            todo: rows,
            route: req.route.path
        })
                    
    })   
    .catch(() => console.log('An error has occured'))

})

//-----------------------------------------------------------------------------------------------------

// DELETE TODOS

// app.delete('/todos', (req, res) => {

//     console.log('Database ready')

//     return db.run(`DELETE FROM todos`)

//     .then(() => {
//         res.send('Todo deleted with success')
//         console.log('Updated deleted success')
//     })
//     .catch(() => console.log('An error has occured'))
    
// })

//-----------------------------------------------------------------------------------------------------

// USERS

// GET ALL USERS

app.get('/users', (req, res) => {
            
    db.all('SELECT * FROM users')
    .then((rows) => {
        
        res.format({
            
            'text/html': function(){
                res.render('index_users.pug', {
                    users: rows
                })
              },

            'application/json': function(){
                res.json(rows);
              }
        })
                    
    })   
    .catch((err) => console.log(err))

})

//-----------------------------------------------------------------------------------------------------

// GET USER BY ID

app.get('/users/:userId', (req, res) => {
            
    db.all(`SELECT * FROM users WHERE '${req.params.userId}'= user_id `)
    .then((rows) => {
        
        res.format({
        
            'text/html': function(){
                res.render('show_users.pug', {
                    users: rows
                })
            },

            'application/json': function(){
                res.json(rows);
            }
        })                
    })   
    .catch((err) => console.log(err))

})

//-----------------------------------------------------------------------------------------------------

// POST NEW USERS

app.post('/users', (req, res) => {
    
    let dt = dateTime.create();
    let time = dt.format('d/m/Y');

    let email = regex.test(req.body.email);

    if (req.body.firstname !== NaN && req.body.firstname !== "" && 
        req.body.lastname !== NaN && req.body.lastname !== "" &&
        req.body.username !== "" && req.body.password !== "" && 
        email == true) {

        upperFirstname = req.body.firstname.charAt(0).toUpperCase() + req.body.firstname.slice(1);
        upperLastname = req.body.lastname.charAt(0).toUpperCase() + req.body.lastname.slice(1);
        upperUsername = req.body.username.charAt(0).toUpperCase() + req.body.username.slice(1);
       
        let hashedPassword = bcrypt.hashSync(req.body.password, 10);

        return db.run(`INSERT INTO users (firstname, lastname, username, password, email, created_at, updated_at) 
                    VALUES ("${upperFirstname}", "${upperLastname}","${upperUsername}", "${hashedPassword}", "${req.body.email}", "${time}", "Never")`)

        .then(() => {

            res.format({
            
                'text/html': function(){

                    res.redirect(301, '/users')
                },

                'application/json': function(){
                    res.json({message : 'success'});
                }
            })  
        })
        .catch((err) => console.log(err))
    }

    else {
        
        res.format({
            
            'text/html': function(){
                alert("Erreur : Veuillez renseigner tous les champs ou des charactères valides")
                res.redirect(301, '/users/add')
            }
        })  
    }
    
})

//-----------------------------------------------------------------------------------------------------

// GET EDIT USER PAGE BY ID

app.get('/users/:userId/edit', (req, res) => {
            
    db.all(`SELECT * FROM users WHERE '${req.params.userId}'= user_id `)
    .then((rows) => {
        
        res.format({
        
            'text/html': function(){
                res.render('edit_users.pug', {
                    users: rows,
                    route: req.route.path
                })
            },

            'application/json': function(){
                res.send(rows);
            }
        })
                    
    })   
    .catch(() => console.log('An error has occured'))

})

//-----------------------------------------------------------------------------------------------------

// UPDATE USER

app.patch('/users/:userId', (req, res) => {

    let dt = dateTime.create();
    let time = dt.format('d/m/Y');
    
    let email = regex.test(req.body.email);

    if (req.body.firstname !== NaN && req.body.firstname !== "" && 
        req.body.lastname !== NaN && req.body.lastname !== "" &&
        req.body.username !== "" && req.body.password !== "" && 
        email == true) {

        return db.run(`UPDATE users SET firstname = '${req.body.firstname}', lastname = '${req.body.lastname}', username = '${req.body.username}', password = '${req.body.password}', email = '${req.body.email}', updated_at = '${time}'
                    WHERE user_id = ${req.params.userId}`)

        .then(() => {

            res.format({
            
                'text/html': function(){
                    res.redirect(301, '/users')
                },

                'application/json': function(){
                    res.json({message : 'success'});
                }
            })

        })
        .catch((err) => console.log(err))
    
    } else {

        res.format({
            
            'text/html': function(){
                alert("Erreur : Veuillez renseigner tous les champs ou des charactères valides")
                res.redirect(301, `/users/${req.params.userId}/edit`)
            }
        }) 
    }
})

//-----------------------------------------------------------------------------------------------------

// DELETE USER BY ID

app.delete('/users/:userId', (req, res) => {

    return db.run(`DELETE FROM users WHERE user_id = ${req.params.userId}`)
    .then(() => {

        res.format({
        
            'text/html': function(){
                res.redirect(301, '/todos')
            },

            'application/json': function(){
                res.json({message : 'success'});
            }
        })
    })
    .catch((err) => console.log(err))

})

//-----------------------------------------------------------------------------------------------------

// GET TODOS BY USER ID

app.get('/users/:userId/todos', (req, res) => {
    
    db.all(`SELECT * FROM todos WHERE user_id=${req.params.userId}`)
    .then((rows) => {
 
        res.format({
        
            'text/html': function(){
                
                res.render('index_todosByUser.pug', {
                    
                    todo: rows
                })
            },

            'application/json': function(){
                res.json({message : 'success'});
            }
        })
 
    })
    .catch((err) => console.log(err))

 })

//-----------------------------------------------------------------------------------------------------

// ERROR TREATMENT 404

app.use(function(req, res, next) {

    res.format({
        
        'text/html': function(){
            
            res.render('404.pug')
        },

        'application/json': function(){
            res.status(404).send({status: "404 not found"})
        }
    })

});
