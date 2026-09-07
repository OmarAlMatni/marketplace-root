const { validateEnv } = require('./config/env');
validateEnv(); // Crash immediately if required env vars are missing.

const path = require('path');
const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const { Server } = require('socket.io');

const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const chatRoutes = require('./routes/chatRoutes');
const webhookRoutes = require('./routes/webhookRoutes');
const adminRoutes = require('./routes/adminRoutes');
const { generalLimiter } = require('./middlewares/rateLimiter');
const { errorHandler, notFound } = require('./middlewares/errorHandler');
const { registerChatSocket } = require('./sockets/chatSocket');
const notificationRoutes = require('./routes/notificationRoutes');
const { setSocketServer } = require('./services/notificationService');

const app = express();
const server = http.createServer(app);

// Two frontends now talk to this API: the storefront (CLIENT_ORIGIN) and
// the separate staff-only admin portal (ADMIN_CLIENT_ORIGIN). Both are
// allowed through CORS; anything else is rejected.
const allowedOrigins = [
  process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  process.env.ADMIN_CLIENT_ORIGIN || 'http://localhost:5174',
];
const corsOptions = {
  origin(origin, callback) {
    // Allow non-browser requests (no Origin header, e.g. curl/Postman) too.
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`Origin ${origin} is not allowed by CORS.`));
    }
  },
};

const io = new Server(server, { cors: corsOptions });

// crossOriginResourcePolicy relaxed so the frontend (different origin in
// dev) can load product images served from /uploads below.
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors(corsOptions));
app.use(generalLimiter);

// IMPORTANT: the Stripe webhook route needs the raw body, so it's mounted
// BEFORE express.json() strips/parses the body into an object.
app.use('/api/webhooks', webhookRoutes);

app.use(express.json());

// Serves uploaded product images (see config/upload.js) at /uploads/<file>.
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);

app.use(notFound);
app.use(errorHandler);

registerChatSocket(io);
setSocketServer(io);

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`🚀 Marketplace API listening on port ${PORT}`);
  console.log(`   Socket.io ready for P2P chat connections`);
});