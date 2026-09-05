const io = require('socket.io-client');

const userSocket = io('http://localhost:3000');
const guardianSocket = io('http://localhost:3000');

// User connects and joins
userSocket.on('connect', () => {
  console.log('✓ User connected');
  userSocket.emit('user:join', 'user-123');
});

userSocket.on('user:joined', (data) => {
  console.log('✓ User joined:', data);
  
  // Simulate SOS trigger
  setTimeout(() => {
    console.log('🚨 Triggering SOS...');
    userSocket.emit('alert:trigger', {
      userId: 'user-123',
      alertId: 'alert-456',
      latitude: 40.7128,
      longitude: -74.0060,
    });
  }, 1000);
});

// Guardian connects and watches alert
guardianSocket.on('connect', () => {
  console.log('✓ Guardian connected');
  guardianSocket.emit('user:join', 'guardian-789');
  
  setTimeout(() => {
    console.log('👁️ Guardian watching alert...');
    guardianSocket.emit('alert:watch', {
      alertId: 'alert-456',
      guardianId: 'guardian-789',
    });
  }, 2000);
});

// Guardian receives alert trigger
guardianSocket.on('alert:triggered', (data) => {
  console.log('🚨 Guardian saw SOS:', data);
});

// Guardian receives real-time location updates
guardianSocket.on('location:update', (data) => {
  console.log('📍 Location update:', data);
});

// Listen for alerts
userSocket.on('alert:triggered', (data) => {
  console.log('Alert triggered event:', data);
});

// Simulate user sending location updates
setTimeout(() => {
  console.log('📍 User sending location 1...');
  userSocket.emit('location:send', {
    userId: 'user-123',
    alertId: 'alert-456',
    latitude: 40.7130,
    longitude: -74.0065,
    accuracy: 10,
  });
}, 3000);

setTimeout(() => {
  console.log('📍 User sending location 2...');
  userSocket.emit('location:send', {
    userId: 'user-123',
    alertId: 'alert-456',
    latitude: 40.7135,
    longitude: -74.0070,
    accuracy: 8,
  });
}, 4000);

setTimeout(() => {
  console.log('📍 User sending location 3...');
  userSocket.emit('location:send', {
    userId: 'user-123',
    alertId: 'alert-456',
    latitude: 40.7140,
    longitude: -74.0075,
    accuracy: 5,
  });
}, 5000);

setTimeout(() => {
  console.log('✅ Test complete');
  process.exit(0);
}, 6000);
