if (process.env.NODE_ENV !== 'production') {
   require('dotenv').config();
}

const express = require('express');
const app = express();
const path = require('path');
const methodOverride = require('method-override');
const mongoose = require('mongoose');
const ejsMate = require('ejs-mate');
const session = require('express-session');
const flash = require('connect-flash');
const ExpressError = require('./utils/ExpressError');

const helmet = require('helmet');

const usersRouter = require('./routes/users');
const campgroundsRouter = require('./routes/campgrounds');
const reviewsRouter = require('./routes/reviews');

const MongoStore = require('connect-mongo');

const passport = require('passport');
const LocalStrategy = require('passport-local');
const User = require('./models/user');

const mongoSanitize = require('express-mongo-sanitize');

const dbUrl = process.env.DB_URL || 'mongodb://localhost:27017/yelp-camp';
mongoose
   .connect(dbUrl, {
      useNewUrlParser: true,
      useUnifiedTopology: true
   })
   .then(() => {
      console.log('Database is Connected!!');
   })
   .catch((err) => {
      console.log('OH NO ,MONGO CONNECTION ERROR', err);
   });

app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(methodOverride('_method'));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(mongoSanitize());

const secret = process.env.SECRET || 'thisshouldbeabettersecret!';
const store = new MongoStore({
   mongoUrl: dbUrl,
   secret,
   touchAfter: 24 * 60 * 60
});

store.on('error', (e) => {
   console.log('Session Store Error', e);
});

const sessionConfig = {
   store,
   name: 'Session',
   secret,
   resave: false,
   saveUninitialized: true,
   cookie: {
      httpOnly: true,
      // secure: true,
      expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
      maxAge: 1000 * 60 * 60 * 24 * 7
   }
};
app.use(session(sessionConfig));
app.use(flash());
app.use(
   helmet({
      crossOriginEmbedderPolicy: false
   })
);

const scriptSrcUrls = [
   'https://stackpath.bootstrapcdn.com/',
   'https://api.tiles.mapbox.com/',
   'https://api.mapbox.com/',
   'https://kit.fontawesome.com/',
   'https://cdnjs.cloudflare.com/',
   'https://cdn.jsdelivr.net',
   'https://api.mapbox.com/mapbox-gl-js/v2.7.0/mapbox-gl.js'
];
const styleSrcUrls = [
   'https://kit-free.fontawesome.com/',
   'https://stackpath.bootstrapcdn.com/',
   'https://api.mapbox.com/',
   'https://api.tiles.mapbox.com/',
   'https://fonts.googleapis.com/',
   'https://use.fontawesome.com/',
   'https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css',
   'https://api.mapbox.com/mapbox-gl-js/v2.7.0/mapbox-gl.css'
];
const connectSrcUrls = [
   'https://api.mapbox.com/',
   'https://a.tiles.mapbox.com/',
   'https://b.tiles.mapbox.com/',
   'https://events.mapbox.com/'
];
const fontSrcUrls = [];
app.use(
   helmet.contentSecurityPolicy({
      directives: {
         defaultSrc: [],
         connectSrc: ["'self'", ...connectSrcUrls],
         scriptSrc: ["'unsafe-inline'", "'self'", ...scriptSrcUrls],
         styleSrc: ["'self'", "'unsafe-inline'", ...styleSrcUrls],
         workerSrc: ["'self'", 'blob:'],
         objectSrc: [],
         imgSrc: [
            "'self'",
            'blob:',
            'data:',
            'https://res.cloudinary.com/dgxj5cmcr/', //SHOULD MATCH YOUR CLOUDINARY ACCOUNT!
            'https://images.unsplash.com/'
         ],
         fontSrc: ["'self'", ...fontSrcUrls]
      }
   })
);

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
   res.locals.currentUser = req.user;
   res.locals.success = req.flash('success');
   res.locals.error = req.flash('error');
   next();
});

app.use('/', usersRouter);
app.use('/campgrounds', campgroundsRouter);
app.use('/campgrounds/:id/reviews/', reviewsRouter);

app.get('/', (_req, res) => {
   res.render('home');
});

app.all('*', (_req, _res, next) => {
   next(new ExpressError('Page Not Found', 404));
});

app.use((err, req, res, next) => {
   const { statusCode = 500 } = err;
   if (!err.message) err.message = 'Oh NO , Something Went Wrong!';
   res.status(statusCode).render('error', { err });
});

app.listen(3000, () => {
   console.log('LISTENING ON PORT 3000!');
});
