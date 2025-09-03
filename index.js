const express = require('express')
const path = require('path')
const { createServer } = require('node:http');
const { Server } = require('socket.io');
const port = process.env.PORT || 5006

const app = express();
const server = createServer(app);
const io = new Server(server);

var proxy = require('express-http-proxy');
app.use('/proxy', proxy('https://weather.ndc.nasa.gov'));
app.use('/js', proxy('https://weather.ndc.nasa.gov/js', {
  proxyReqPathResolver: function (req) {
    console.log(req.url);
    return ("/js" + req.url);

  }
}));

app.use('/goes', proxy('https://weather.ndc.nasa.gov/goes', {
  proxyReqPathResolver: function (req) {
    return ("/goes" + req.url);

  }
}));

let messages = [];
let drags = {};

io.on('connection', (socket) => {



  console.log('a user connected');
  socket.on('chat message', (msg) => {
    console.log('message: ' + msg);
    io.emit('chat message', msg);
    messages.push(msg);

  });

  socket.on('drag', (msg) => {
    console.log('message: ' + msg);
    socket.broadcast.emit('drag', msg);
    drags[msg.id] = msg;

  });

  socket.on('key input', (msg) => {
    console.log('message: ' + msg);
    socket.broadcast.emit('key input', msg);

  });

  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
  messages.forEach(msg => {
    socket.emit('chat message', msg);

  });

  Object.values(drags).forEach(msg => {
    socket.emit('drag', msg);
  })

});


app.use(express.static(path.join(__dirname, 'public')))
// app.set('views', path.join(__dirname, 'views'))
// app.set('view engine', 'ejs')

// app.get('/', (req, res) => {
//   console.log(`Rendering 'pages/index' for route '/'`)
//   res.render('pages/index')
// })
app.get('/projection', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'projection.html'))
})
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: gracefully shutting down')
  if (server) {
    server.close(() => {
      console.log('HTTP server closed')
    })
  }
})

server.listen(port, () => {
  console.log(`Listening on ${port}`)
})

