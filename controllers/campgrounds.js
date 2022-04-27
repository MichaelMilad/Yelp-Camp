const Campground = require('../models/campground');
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapBoxToken = process.env.MAPBOX_TOKEN;
const geocoder = mbxGeocoding({ accessToken: mapBoxToken });
const { cloudinary } = require('../cloudinary');

module.exports.index = async (req, res) => {
   const allCamps = await Campground.find();
   res.render('campgrounds/index', { allCamps });
};

module.exports.renderNewForm = (req, res) => {
   res.render('campgrounds/new');
};

module.exports.createCampground = async (req, res, next) => {
   const geoData = await geocoder
      .forwardGeocode({
         query: req.body.campground.location,
         limit: 1
      })
      .send();
   const newCamp = new Campground(req.body.campground);
   newCamp.geometry = geoData.body.features[0].geometry;
   newCamp.images = req.files.map((f) => ({
      url: f.path,
      filename: f.filename
   }));
   newCamp.owner = req.user._id;
   await newCamp.save();
   console.log(newCamp);
   req.flash('success', 'Successfully Created A New Campground');
   res.redirect(`/campgrounds/${newCamp._id}`);
};

module.exports.showCampground = async (req, res) => {
   const { id } = req.params;
   const showCamp = await Campground.findOne({ _id: id })
      .populate({
         path: 'reviews',
         populate: {
            path: 'owner'
         }
      })
      .populate('owner');
   if (!showCamp) {
      req.flash('error', 'The Campground you are looking for is NOT Available');
      return res.redirect('/campgrounds');
   }
   res.render('campgrounds/show', { showCamp });
};

module.exports.renderEditForm = async (req, res) => {
   const { id } = req.params;
   const camp = await Campground.findById(id);
   if (!camp) {
      req.flash('error', 'Cannot find Camp');
      return res.redirect('/campgrounds');
   }
   res.render('campgrounds/edit', { camp });
};

module.exports.updateCampground = async (req, res) => {
   const { id } = req.params;
   const camp = await Campground.findByIdAndUpdate(id, {
      ...req.body.camp
   });
   const imgs = req.files.map((f) => ({
      url: f.path,
      filename: f.filename
   }));
   camp.images.push(...imgs);
   await camp.save();
   if (req.body.deleteImages) {
      for (let filename of req.body.deleteImages) {
         await cloudinary.uploader.destroy(filename);
      }
      await camp.updateOne({
         $pull: { images: { filename: { $in: req.body.deleteImages } } }
      });
   }
   req.flash('success', 'Successfully Updated The Campground!');
   res.redirect(`/campgrounds/${camp._id}`);
};

module.exports.deleteCampground = async (req, res) => {
   const { id } = req.params;
   await Campground.findByIdAndDelete(id);
   req.flash('success', 'Successfully Deleted The Campground');
   res.redirect(`/campgrounds`);
};
