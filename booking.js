const { MongoClient } = require('mongodb');

// MongoDB URI and Database
const uri = 'mongodb://localhost:27017';
const dbName = 'train_coach';

async function initializeSeats() {
    const client = new MongoClient(uri);
    try {
        await client.connect();
        const db = client.db(dbName);
        db.collection('seats')?.drop();
        const collection = db.collection('seats');
        
        const seats = [];
        for (let row = 0; row < 10; row++) {  // 10 rows of 7 seats
            for (let seatNumber = 1; seatNumber <= 7; seatNumber++) {
                seats.push({
                    seat_id: row * 7 + seatNumber,
                    row: row + 1,
                    seat_number: seatNumber,
                    status: 'available'
                });
            }
        }
        // Last row with 3 seats
        for (let seatNumber = 1; seatNumber <= 3; seatNumber++) {
            seats.push({
                seat_id: 70 + seatNumber,
                row: 11,
                seat_number: seatNumber,
                status: 'available'
            });
        }

        await collection.insertMany(seats);
        console.log('Seats initialized.');
    } finally {
        await client.close();
    }
}

async function bookSeats(numSeats) {
    if (numSeats > 7) {
        return 'You can only book up to 7 seats at a time.';
    }

    const client = new MongoClient(uri);
    try {
        await client.connect();
        const db = client.db(dbName);
        const collection = db.collection('seats');
        let bookedSeats = [];
        let found = false;

        // Try to book seats in one row first
        for (let row = 1; row <= 11; row++) {
            const seatsInRow = await collection.find({ row, status: 'available' }).sort({ seat_number: 1 }).toArray();
            if (seatsInRow.length >= numSeats) {
                bookedSeats = seatsInRow.slice(0, numSeats);
                const seatIds = bookedSeats.map(seat => seat.seat_id);
                await collection.updateMany(
                    { seat_id: { $in: seatIds } },
                    { $set: { status: 'booked' } }
                );
                found = true;
                break;
            }
        }

        // If not found in one row, try to book nearby seats
        if (!found) {
            const allAvailableSeats = await collection.find({ status: 'available' }).sort({ row: 1, seat_number: 1 }).toArray();
            bookedSeats = allAvailableSeats.slice(0, numSeats);
            const seatIds = bookedSeats.map(seat => seat.seat_id);
            await collection.updateMany(
                { seat_id: { $in: seatIds } },
                { $set: { status: 'booked' } }
            );
            found = true;
        }

        if (found) {
            return bookedSeats.map(seat => seat.seat_id);
        } else {
            return 'Not enough contiguous or nearby seats available.';
        }
    } finally {
        await client.close();
    }
}

async function displaySeats() {
    const client = new MongoClient(uri);
    try {
        await client.connect();
        const db = client.db(dbName);
        const collection = db.collection('seats');
        const seats = await collection.find({}).sort({ row: 1, seat_number: 1 }).toArray();

        console.log('Seat Layout:');
        let currentRow = 0;
        seats.forEach(seat => {
            if (seat.row !== currentRow) {
                console.log('');
                currentRow = seat.row;
            }
            process.stdout.write((seat.status === 'booked' ? 'X ' : 'O '));
        });
        console.log('');
    } finally {
        await client.close();
    }
}

// Example usage
 async function initTrainCoach() {
    await initializeSeats(); // Run this once to initialize the database
    console.log('Initial Seat Map:');
    await displaySeats();
    return "initialize Seats";
};

async function bookSeatsByInput(numSeats){    // numSeats : Example number of seats to book
    const bookedSeats = await bookSeats(numSeats);
    console.log('Booked Seats:', bookedSeats);
    console.log('Updated Seat Map:');
    await displaySeats();
    return bookedSeats;
}


module.exports = {
    initTrainCoach,
    bookSeatsByInput
  };