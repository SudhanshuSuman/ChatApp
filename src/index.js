const express = require('express')
const path = require('path')
const http = require('http')
const socketio = require('socket.io')
const Filter = require('bad-words')
const { generateMessage, generateLocationMessage } = require('./utils/messages')
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users')


const port = process.env.PORT || 3000
const publicDirPath = path.join(__dirname, '../public')


const app = express()
const server = http.createServer(app)
const io = socketio(server)


io.on('connection', (socket) => {
    console.log('new WebSocket connection...!!')

    socket.on('join', (queryStringData, cb) => {
        const { user, error } = addUser({ id: socket.id, ...queryStringData })
        if (error) {
            return cb(error)
        }

        socket.join(user.room)

        socket.emit('message', generateMessage('Chat App', `Welcome ${user.username}!\nYou have joined ${user.room}!`))
        socket.broadcast.to(user.room).emit('message', generateMessage('Chat App', `Pssh! ${user.username} has joined!`))
        io.to(user.room).emit('roomDetails', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })

        cb()
    })

    socket.on('sendMessage', (message, cb) => {
        const user = getUser(socket.id)
        const filter = new Filter()
        if(filter.isProfane(message)) {
            return cb('Profanity detected in your message!')
        }

        io.to(user.room).emit('message', generateMessage(user.username, message))

        cb()
    })

    socket.on('shareLocation', (coordinates, cb) => {
        const user = getUser(socket.id)
        if(!coordinates.latitude || !coordinates.longitude) {
            return cb('Unable to get location')
        }
        io.to(user.room).emit('locationMessage', generateLocationMessage(user.username, coordinates))
        cb()
    })

    socket.on('disconnect', () => {
        const user = removeUser(socket.id)
        if (user) {
            io.to(user.room).emit('message', generateMessage('Chat App', `${user.username} has left.`))
            io.to(user.room).emit('roomDetails', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }
    })
})


app.use(express.static(publicDirPath))


server.listen(port, () => {
    console.log('Server up on port: ' + port);
})
