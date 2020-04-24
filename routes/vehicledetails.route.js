const express = require('express');
const router = express.Router();

// Require the controllers WHICH WE DID NOT CREATE YET!!
const vehicledetails_controller = require('../controllers/vehicledetails.controller');


// a simple test url to check that all of our files are communicating correctly.
router.get('/test', vehicledetails_controller.test);
router.post('/insertVehicleDetails', vehicledetails_controller.insert_vehicle_details);
//router.get('/:id', vehicledetails_controller.vehicle_details);
router.get('/getAllVehicleDetails', vehicledetails_controller.get_all_vehicle_details);
router.get('/getVehicleDetailsByVin', vehicledetails_controller.get_vehicle_details_by_vin);
router.get('/vehicleDetails', vehicledetails_controller.vehicle_details_view);
router.get('/login', vehicledetails_controller.login_view);
router.post('/loginpost', vehicledetails_controller.login_post);
router.post('/vehicleListingResult', vehicledetails_controller.vehicleListingResult);
router.get('/vehicleInfo', vehicledetails_controller.vehicleInfo);

router.get('/', vehicledetails_controller.login_view);

module.exports = router;