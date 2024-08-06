const http = require('http');
const readline = require('readline');
const booking = require('./booking'); // Import the booking module
const hostname = '127.0.0.1';
const port = 3000;
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
}); 


const server = http.createServer(async (req, res) => {

    // Use the imported initTrainCoach function
  const initialize = await booking.initTrainCoach();
  console.log('initialize', initialize);
  getUserInput();
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  res.end('Hello World\n');
});

async function getUserInput() {
    rl.question('Please input numbers of seats: ', async (answer) => {
        let bookedSeats = await booking.bookSeatsByInput(answer);
        if (bookedSeats !== 'Not enough contiguous or nearby seats available.') {
            getUserInput();
            console.log('bookedSeats----', bookedSeats);
        } else {
            console.log('bookedSeats----', bookedSeats);
            rl.close();
        }
    }); 
}


server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});
