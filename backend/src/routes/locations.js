const express = require('express');
const router = express.Router();
const Location = require('../models/Location');

// Create location
router.post('/', async (req, res, next) => {
  try {
    const location = await Location.create(req.body);
    res.status(201).json({ success: true, data: location });
  } catch (err) {
    next(err);
  }
});

// List locations
router.get('/', async (req, res, next) => {
  try {
    const { type, city } = req.query;
    const query = {};
    if (type) {query.type = type;}
    if (city) {query['address.city'] = city;}
    const locations = await Location.find(query).limit(200).lean();
    res.json({ success: true, data: locations });
  } catch (err) {
    next(err);
  }
});

// Get by id
router.get('/:id', async (req, res, next) => {
  try {
    const location = await Location.findById(req.params.id);
    if (!location) {return res.status(404).json({ success: false, message: 'Not found' });}
    res.json({ success: true, data: location });
  } catch (err) {
    next(err);
  }
});

// Update
router.put('/:id', async (req, res, next) => {
  try {
    const location = await Location.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!location) {return res.status(404).json({ success: false, message: 'Not found' });}
    res.json({ success: true, data: location });
  } catch (err) {
    next(err);
  }
});

// Delete
router.delete('/:id', async (req, res, next) => {
  try {
    const location = await Location.findByIdAndDelete(req.params.id);
    if (!location) {return res.status(404).json({ success: false, message: 'Not found' });}
    res.json({ success: true, data: null });
  } catch (err) {
    next(err);
  }
});

// Nearby search
router.get('/nearby/search', async (req, res, next) => {
  try {
    const { lat, lng, radius = 2 } = req.query; // radius in km
    if (!lat || !lng) {return res.status(400).json({ success: false, message: 'lat and lng required' });}
    const meters = Number(radius) * 1000;
    const locations = await Location.find({
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates: [Number(lng), Number(lat)] },
          $maxDistance: meters
        }
      }
    }).limit(200).lean();
    res.json({ success: true, data: locations });
  } catch (err) {
    next(err);
  }
});

module.exports = router;


