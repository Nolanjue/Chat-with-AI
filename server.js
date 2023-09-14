

import path from "path";
import OpenAI from "openai";
import http from "http";
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import formatMessage from "./utils/messages.js";
import cors from 'cors';
import bodyParser from 'body-parser'
import dotenv from 'dotenv';

import {
  userJoin,
  getCurrentUser,
  userLeave,
  getRoomUsers,
} from "./utils/users.js";

dotenv.config();

const app = express();

const server = createServer(app);

const io = new Server(server);
//note: frontend and backend communicate with io, using on-> when it receives it from the other side, using emit -> sends to the other side.

// Set static folder
app.use(express.static(new URL('client', import.meta.url).pathname));//allows you to connect to the frontend.

app.use(cors());
app.use(bodyParser.json());

const botName = "System";

// Run when client connects
io.on("connection", (socket) => {//note socket GIVES you an unique id to access, on connection

  socket.on("joinRoom", ({ username, room }) => {
    //getting the username and room from frontend qs
    //takes two parameters: a dictionary of two values 

    const user = userJoin(socket.id, username, room);
    //adds user to the list of dictionary(existing users), with value of a dictionary of the current user. 

    socket.join(user.room);//joins to the room by value(socket)
    if(user.room === 'AI Room'){
      socket.emit("message", formatMessage(botName, "This is an AI room, the AI responses will be determined by any message sent"));
    }
    // Welcome current user(socket.emit only emits to the person joining)
    socket.emit("message", formatMessage(botName, "Welcome to TextSocket!"));

    // Broadcast(to everyone except user) when a user connects
    socket.broadcast
      .to(user.room)
      .emit(
        "message",
        formatMessage(botName, `${user.username} has joined the chat`)
      );

    // Send users and room info(sends to frontend to display the data)(updates when user joins)
    io.to(user.room).emit("roomUsers", {
      room: user.room,
      users: getRoomUsers(user.room),
    });
  });

  // Listen for chatMessage(recieve data from frontend)
  socket.on("chatMessage", async (msg) => {
    const user = getCurrentUser(socket.id);//gets user via id,
    //need to call this  because JavaScript maintains a separate scope for each function, and variable inside iare limited to that function's scope.

    io.to(user.room).emit("message", formatMessage(user.username, msg));//emit to everyone

    const callAI = async()=>{
      try{
        const APIKey  = process.env.OPENAI_API_KEY;
        const openai = new OpenAI({ apikey: APIKey });//please note some apis may not work with commonjs.
        const prompt = msg;//calling the parameter message that was sent already.
        const response =  await openai.completions.create({
        model: 'text-davinci-003',
        prompt: prompt,
        max_tokens: 1024
      })
      
      /*response.then((response) => {//will send back response data from ai(when we call it)
        res.json({ message: response.response.choices[0].text });*/
      const AImessage = response.choices[0].text;
      io.to(user.room).emit('message', formatMessage('AI bot', AImessage));
  
      }catch(err) {
        console.log(err)
      }
    }
    if (user.room === 'AI Room') {
      setTimeout(callAI, 3000)//calls the callAI function after 3 seconds(stops and waits 3 seconds and then runs code.)
      }
  });

  


  // Runs when client disconnects
  socket.on("disconnect", () => {
    const user = userLeave(socket.id);

    if (user) {
      io.to(user.room).emit(
        "message",
        formatMessage(botName, `${user.username} has left the chat`)
      );

      // Send updated users and room info when user leaves
      io.to(user.room).emit("roomUsers", {
        room: user.room,
        users: getRoomUsers(user.room),
      });
    }
  });
});


const PORT = 3000;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

//frontend and backend are working, however data is being displayed in the backend(localhost3000)
//backend is the one that hosts frontend, frontend has no functionality.




/* Was used in application to test api call 
app.post('/message', async (req, res) => {
  try {
    const APIKey = process.env.OPENAI_API_KEY;
    const openai = new OpenAI({ apikey: APIKey });
    const prompt = 'Hello there! What\'s your name?';

    const response = await openai.completions.create({
      model: 'text-davinci-003',
      prompt: prompt,
      max_tokens: 1024,
    });

    // Send the response back to the client
    res.json({ message: response.choices[0].text });

  } catch (err) {
    console.error(err);
    res.json(err.response.data);
  }
});
*/
