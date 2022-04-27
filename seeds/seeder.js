const mongoose = require('mongoose');
const Campground = require('../models/campground');
const { places, descriptors } = require('./seedHelpers');
const cities = require('./cities');

mongoose
   .connect('mongodb://localhost:27017/yelp-camp', {
      useNewUrlParser: true,
      useUnifiedTopology: true
   })
   .then(() => {
      console.log('Database is Connected!!');
   })
   .catch((err) => {
      console.log('OH NO ,MONGO CONNECTION ERROR', err);
   });

const sample = (arr) => arr[Math.floor(Math.random() * arr.length)];

const seedDB = async () => {
   await Campground.deleteMany({});
   for (let i = 0; i < 400; i++) {
      const rand1k = Math.floor(Math.random() * 1000);
      const price = Math.floor(Math.random() * 30) + 10;
      const camp = new Campground({
         owner: '624c67aba0e4a9d88b1ba1d8',
         title: `${sample(descriptors)} ${sample(places)}`,
         location: `${cities[rand1k].city},${cities[rand1k].state}`,
         description:
            'Lorem ipsum dolor sit amet consectetur adipisicing elit. Sed illum, sit sapiente in repellendus facilis deserunt minus, sequi aut quam voluptas tenetur nostrum amet. Neque id tempora dolorum distinctio atque.',
         price,
         geometry: {
            type: 'Point',
            coordinates: [cities[rand1k].longitude, cities[rand1k].latitude]
         },
         images: [
            {
               url: 'https://res.cloudinary.com/dgxj5cmcr/image/upload/v1649700416/YelpCamp/xxlsqvgdi3mzmdoja8j2.jpg',
               filename: 'YelpCamp/xxlsqvgdi3mzmdoja8j2'
            },
            {
               url: 'https://res.cloudinary.com/dgxj5cmcr/image/upload/v1649700446/YelpCamp/x4orna652x53dj0gt6uj.jpg',
               filename: 'YelpCamp/x4orna652x53dj0gt6uj'
            },
            {
               url: 'https://res.cloudinary.com/dgxj5cmcr/image/upload/v1649700507/YelpCamp/d8x8pqljmevyqodlpe84.jpg',
               filename: 'YelpCamp/d8x8pqljmevyqodlpe84'
            }
         ]
      });
      await camp.save();
   }
};

seedDB().then(() => {
   mongoose.connection.close();
});
