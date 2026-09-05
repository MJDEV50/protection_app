const io = require('socket.io-client');

const userSocket = io('http://localhost:3000');
const guardianSocket = io('http://localhost:3000');

// User connects
userSocket.on('connect', () => {
  console.log('✓ User connected');
  userSocket.emit('user:join', 'user-123');
});

userSocket.on('user:joined', (data) => {
  console.log('✓ User joined:', data);
  
  // Start safe walk after 1 second
  setTimeout(() => {
    console.log('🚶 Starting safe walk...');
    userSocket.emit('safe-walk:start', {
      userId: 'user-123',
      sessionId: 'walk-789',
      destinationLat: 40.7250,
      destinationLng: -74.0100,
    });
  }, 1000);
});

// Guardian connects
guardianSocket.on('connect', () => {
  console.log('✓ Guardian connected');
  guardianSocket.emit('user:join', 'guardian-456');
  
  // Join walk after 2 seconds
  setTimeout(() => {
    console.log('👁️ Guardian joining safe walk...');
    guardianSocket.emit('alert:watch', {
      sessionId: 'walk-789',
      guardianId: 'guardian-456',
    });
  }, 2000);
});

// Listen for safe walk start
guardianSocket.on('safe-walk:started', (data) => {
  console.log('🚶 Guardian saw safe walk start:', data);
});

// Simulate location updates during walk
setTimeout(() => {
  console.log('📍 User at point 1...');
  userSocket.emit('walk:location', {
    userId: 'user-123',
    sessionId: 'walk-789',
    latitude: 40.7130,
    longitude: -74.0070,
  });
}, 3000);

setTimeout(() => {
  console.log('📍 User at point 2...');
  userSocket.emit('walk:location', {
    userId: 'user-123',
    sessionId: 'walk-789',
    latitude: 40.7180,
    longitude: -74.0080,
  });
}, 4000);

setTimeout(() => {
  console.log('📍 User at point 3 (destination)...');
  userSocket.emit('walk:location', {
    userId: 'user-123',
    sessionId: 'walk-789',
    latitude: 40.7250,
    longitude: -74.0100,
  });
}, 5000);

// Guardian receives location updates
guardianSocket.on('walk:location', (data) => {
  console.log('📍 Guardian sees location:', data);
});

// End safe walk
setTimeout(() => {
  console.log('✅ User ending safe walk...');
  userSocket.emit('safe-walk:end', {
    userId: 'user-123',
    sessionId: 'walk-789',
  });
}, 6000);

// Guardian sees walk end
guardianSocket.on('safe-walk:ended', (data) => {
  console.log('✅ Guardian saw safe walk end:', data);
});

setTimeout(() => {
  console.log('✅ Test complete');
  process.exit(0);
}, 7000);
