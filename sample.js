const express = require("express");
const path = require("path");
const bcrypt = require("bcrypt")
const jwt = require('jsonwebtoken')

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express()
app.use(express.json())

let db = null;

const Pathname=path.join(__dirname,"userdetails1.db")

const instalizerDb = async () => {
    try{
        db = await open({
            filename: Pathname,
            driver:sqlite3.Database
        });
        app.listen(3005,console.log("Server starts at http//localhoost:3005"))
    }catch(e){
        console.log(e.message)
        process.exit(1)
    }
    
}

instalizerDb()

// Get Players
const authentication = async (request,response,next)=>{
  let jwtToken;
  
  const authheader = request.headers["authorization"];
  if (authheader !== undefined){
    jwtToken = authheader.split(" ")[1]
  }
  if (jwtToken === undefined){
    response.status=400;
    response.send("invalid jwt Token")
  }else{
    jwt.verify(jwtToken,"MY_SECRET_TOKEN", async (error,playload)=>{
      if (error){
        response.status=400;
        response.send("invalid jwt Token")
      }else{
        next();
      }
    })
  }
  

}

app.get('/players/', async (request,response)=>{
    const quary = `
      SELECT * FROM cricket_team;
    `
    const dbResponse = await db.all(quary)
    response.send(dbResponse)
})

//Get Users

app.get('/user/',async (request,response)=>{
    const quary = `
        SELECT * FROM users
    `
    const dbResponse = await db.all(quary)
    response.send(dbResponse)
})

//Add Player

app.post('/players', async (request,response)=>{
    const {playerName,jerseyNumber,role}=request.body

    const quary = `
    INSERT INTO 
        cricket_team (player_name,jersy_number,role)
    VALUES(
        '${playerName}',
        ${jerseyNumber},
        '${role}'
    );`;
    const dbResponse = await db.run(quary)
    const id = dbResponse.lastId
    response.send({id})
})

//Get  Player Data

app.get('/players/:id',authentication, async (request,response)=>{
    const {id} = request.params;
    const quary = `
        SELECT 
            *
        FROM
            cricket_team
        WHERE
            id = ${id}; 

    `;
    const player = await db.get(quary)
    response.send(player)
})

//Update Player Details

app.put('/players/:id', async (request, response) => {
    const { id } = request.params;
    const playerDetails = request.body;
    const {
        playerName,
        jerseyNumber,
      role
    } = playerDetails;
    const updatePlayerQuery = `
      UPDATE
        cricket_team
      SET
        player_name = "${playerName}",
        jersy_number = ${jerseyNumber},
        role = "${role}"
      WHERE
        id = ${id};`;
    const a=await db.run(updatePlayerQuery);
    response.send("Player Details Updated Sucessesfully")
  });

//DELETE Player

app.delete("/players/:id/", async (request, response) => {
    const { id } = request.params;
    const deletePlayerQuery = `
      DELETE FROM
        cricket_team
      WHERE
        id = ${id};`;
    await db.run(deletePlayerQuery);
    response.send("Player Deleted Successfully");
  });
  app.post("/registration", async (request, response) => {
    const { username, name, password, gender, location } = request.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const selectUserQuery = `SELECT * FROM register WHERE username = '${username}'`;
    const dbUser = await db.get(selectUserQuery);
    console.log(dbUser)
    if (dbUser === undefined) {
      const createUserQuery = `
        INSERT INTO 
          register (username, name, password, gender, location) 
        VALUES 
          (
            '${username}', 
            '${name}',
            '${hashedPassword}', 
            '${gender}',
            '${location}'
          )`;
      const dbResponse = await db.run(createUserQuery);
      const newUserId = dbResponse.lastID;
      response.send(`Created new user with ${newUserId}`);
    } else {
      response.status = 400;
      response.send("User already exists");
    }
  });

  app.post('/login', async (request,response)=>{
    const {username,password} = request.body
    const getUserQuary = `SELECT * FROM register WHERE username='${username}'`
    const dbUser = await db.get(getUserQuary)
    if (dbUser === undefined){
      response.status=400;
      response.send("User does not exits")
    }else {
      const isPasswordMatch = await bcrypt.compare(password,dbUser.password)
      if (isPasswordMatch === true) {
        const payload = {
          username:username
        }
        const jwtToken = jwt.sign(payload,"MY_SECRET_TOKEN")
        response.send(jwtToken)

      }else {
        response.status = 400
        response.send("incorrect Passord")
      }
    }
  })