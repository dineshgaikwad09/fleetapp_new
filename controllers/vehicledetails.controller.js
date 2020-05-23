const VehicleDetails = require('../models/vehicledetails.model');
const path = require('path');
const fs = require('fs');
const AWS = require('aws-sdk');
const multer = require('multer'); // file storing middleware
const querystring = require('querystring');  

// import individual service
//var S3 = require('aws-sdk/clients/s3');

//var credentials = new AWS.SharedIniFileCredentials({profile: 'default'});
//AWS.config.credentials = credentials;
AWS.config.getCredentials(function(err) {
    if (err) console.log(err.stack);
    // credentials not loaded
    else {
      console.log("Access key:", AWS.config.credentials.accessKeyId);
      console.log("Secret access key:", AWS.config.credentials.secretAccessKey);
    }
  });
const s3 = new AWS.S3();
var sess;

var storage = multer.diskStorage({ 
    destination: function (req, file, cb) { 
        // Uploads is the Upload_folder_name 
        cb(null, "uploads") 
    }, 
    filename: function (req, file, cb) { 
      cb(null, file.fieldname + "-" + Date.now()+".jpg") 
    } 
  });


       
// Define the maximum size for uploading 
// picture i.e. 1 MB. it is optional 
//const maxSize = 1 * 1000 * 1000; 
    
var upload = multer({  
    storage: storage, 
    //limits: { fileSize: maxSize }, 
    fileFilter: function (req, file, cb){ 
        // Set the filetypes, it is optional 
        var filetypes = /jpeg|jpg|png/; 
        var mimetype = filetypes.test(file.mimetype); 
        var extname = filetypes.test(path.extname(file.originalname).toLowerCase()); 
        if (mimetype && extname) { 
            return cb(null, true); 
        } 
        cb("Error: File upload only supports the " + "following filetypes - " + filetypes); 
      }  
// photo is the name of file attribute 
}).array("photo"); 

//Simple version, without validation or sanitation
exports.test = function (req, res) {
    res.send('Greetings from the Test controller!');
};

function deleteExistingFiles()
{
    var directory = path.join(path.normalize(__dirname +'/..')+"/uploads/");
    fs.readdir(directory, (err, files) => {
        if (err) throw err;
      
        for (const file of files) {
          fs.unlink(path.join(directory, file), err => {
            if (err) throw err;
          });
        }
      });
}


exports.insert_vehicle_details = function (req, res) {

    //var rr = updateRecord(req,res);

    deleteExistingFiles();
    
    upload(req,res,function(err) {   
                if(err) {   
                    // ERROR occured (here it can be occured due 
                    // to uploading image of size greater than 
                    // 1MB or uploading different file type) 
                    res.send(err) 
                } 
                else
                {
                    let vehicleDetails1 = new VehicleDetails(
                        {
                            makemodel: req.body.makemodel,
                            vin: req.body.vin,
                            type: req.body.type,
                            location: req.body.location,
                            cylinders: req.body.cylinders,
                            fueltype: req.body.fueltype,
                            miles: req.body.miles,
                            saledate: req.body.saledate,
                            saletype: req.body.saletype,
                            openrecall: req.body.openrecall,
                            }
                        );
    
                    VehicleDetails.findOneAndUpdate({vin: req.body.vin}, {$set:{makemodel: req.body.makemodel,
                        vin: req.body.vin,
                        type: req.body.type,
                        location: req.body.location,
                        cylinders: req.body.cylinders,
                        fueltype: req.body.fueltype,
                        miles: req.body.miles,
                        saledate: req.body.saledate,
                        saletype: req.body.saletype,
                        openrecall: req.body.openrecall}}, {new: true},function (err, updateResult) {
                        if (err) {
                            console.error("error ", err);
                            //return false;
                        }
                        else
                        {
                            if(updateResult!=null)
                                res.render('vehicleDetailsSuccess', {session:sess});
                            else
                            {
                                var folder = path.join(path.normalize(__dirname +'/..')+"/uploads/");
                                var awsFilePath = "";
                                fs.readdir(folder, function (err, files) {
                                    if (err) {
                                      console.error("Could not list the directory.", err);
                                      process.exit(1);
                                    }
                                    var itemsProcessed = 0;
                                    files.forEach(function (file, index) {
                                         const fileName1 = folder + path.join(file);
                                      // Make one pass and make the file complete
                                        fs.readFile(fileName1, (err, data) => {
                                            if (err) throw err;
                                            const params = {
                                                Bucket: 'fleet-photos', // pass your bucket name
                                                Key: file, // file will be saved as testBucket/contacts.csv
                                                Body: JSON.stringify(data, null, 2)
                                            };
                                            s3.upload(params, function(s3Err, data) {
                                                if (s3Err) throw s3Err
                                                console.log(`File uploaded successfully at ${data.Location}`)
                                                awsFilePath += file+',';
                                                itemsProcessed++;
            
                                                if(itemsProcessed === files.length) {
                                                    callback(req, res, awsFilePath);
                                                  }
                                            });
                                        });
                                        
                                    })
                                    function callback (req, res, awsFilePath) { 
                                        console.log('all done'); 
                                        let vehicleDetails = new VehicleDetails(
                                            {
                                                makemodel: req.body.makemodel,
                                                vin: req.body.vin,
                                                type: req.body.type,
                                                location: req.body.location,
                                                cylinders: req.body.cylinders,
                                                fueltype: req.body.fueltype,
                                                miles: req.body.miles,
                                                saledate: req.body.saledate,
                                                saletype: req.body.saletype,
                                                openrecall: req.body.openrecall,
                                                filename: awsFilePath
                                                }
                                            );
                        
                                            vehicleDetails.save(function (err) {
                                                if (err) {
                                                    //return next(err);
                                                    res.send('Error '+ err)
                                                }
                                                
                                                res.render('vehicleDetailsSuccess', {session:sess});
                                            })
                                    }                        
                                });   
                            }
                        }
                    });
                    
                }
            })
        
        };
//Get Sepecific Vehicle Details
exports.vehicle_details = function (req, res) {
    VehicleDetails.findById(req.params.id, function (err, vehicle) {
        if (err) {
            res.status(500).send({
                message: err.message || "Some error occurred while retrieving vehicles."
            });
        }
        res.send(vehicle);
    })
};

// Retrieve and return all vehicles from the database.
exports.get_all_vehicle_details = function (req, res) {
    VehicleDetails.find().
    then((allVehicles) => {
      return res.status(200).json({
        success: true,
        message: 'A list of all vehicles',
        Vehicles: allVehicles,
      });
    }).catch(err => {
        res.status(500).send({
            message: err.message || "Some error occurred while retrieving vehicles."
        });
    });
};

// Retrieve and return all vehicles from the database.
exports.get_vehicle_details_by_vin = function (req, res) {
    let objVin = req.query.vin;
    VehicleDetails.find({vin: objVin}, {  }).
    then((vehicle) => {
      return res.status(200).json({
        success: true,
        message: 'Vehicle Details',
        Vehicle: vehicle,
      });
    }).catch(err => {
        res.status(500).send({
            message: err.message || "Some error occurred while retrieving vehicles."
        });
    });
};

exports.vehicle_details_view = function (req, res) {
    console.log(path);
    res.render('vehicleDetails', {session:sess});
};

exports.login_view = function (req, res) {
    console.log(path);
    res.sendFile(path.join(path.normalize(__dirname +'/..')+'/public/login.html'));
};

var storage = multer.diskStorage({ 
    destination: function (req, file, cb) { 
        // Uploads is the Upload_folder_name 
        cb(null, "uploads") 
    }, 
    filename: function (req, file, cb) { 
      cb(null, file.fieldname + "-" + Date.now()+".jpg") 
    } 
  });


       
// Define the maximum size for uploading 
// picture i.e. 1 MB. it is optional 
//const maxSize = 1 * 1000 * 1000; 
    
var upload = multer({  
    storage: storage, 
    //limits: { fileSize: maxSize }, 
    fileFilter: function (req, file, cb){ 
        // Set the filetypes, it is optional 
        var filetypes = /jpeg|jpg|png/; 
        var mimetype = filetypes.test(file.mimetype); 
        var extname = filetypes.test(path.extname(file.originalname).toLowerCase()); 
        if (mimetype && extname) { 
            return cb(null, true); 
        } 
        cb("Error: File upload only supports the " + "following filetypes - " + filetypes); 
      }  
// photo is the name of file attribute 
}).array("photo"); 

//Simple version, without validation or sanitation
exports.test = function (req, res) {
    res.send('Greetings from the Test controller!');
};

function deleteExistingFiles()
{
    var directory = path.join(path.normalize(__dirname +'/..')+"/uploads/");
    fs.readdir(directory, (err, files) => {
        if (err) throw err;
      
        for (const file of files) {
          fs.unlink(path.join(directory, file), err => {
            if (err) throw err;
          });
        }
      });
}


function updateRecord(req, res)
{
    let vehicleDetails = new VehicleDetails(
        {
            makemodel: req.body.makemodel,
            vin: req.body.vin,
            type: req.body.type,
            location: req.body.location,
            cylinders: req.body.cylinders,
            fueltype: req.body.fueltype,
            miles: req.body.miles,
            saledate: req.body.saledate,
            saletype: req.body.saletype,
            openrecall: req.body.openrecall,
            //filename: awsFilePath
            }
        );
    VehicleDetails.findOneAndUpdate({vin: req.body.vin}, vehicleDetails, function (err, VehicleDetails) {
        if (err) {
            console.error("error ", err);
            return false;
        };
        return true;
    });
}

exports.insert_vehicle_details = function (req, res) {

    //var rr = updateRecord(req,res);

    deleteExistingFiles();
    
    upload(req,res,function(err) {   
                if(err) {   
                    // ERROR occured (here it can be occured due 
                    // to uploading image of size greater than 
                    // 1MB or uploading different file type) 
                    res.send(err) 
                } 
                else
                {
                    let vehicleDetails1 = new VehicleDetails(
                        {
                            makemodel: req.body.makemodel,
                            vin: req.body.vin,
                            type: req.body.type,
                            location: req.body.location,
                            cylinders: req.body.cylinders,
                            fueltype: req.body.fueltype,
                            miles: req.body.miles,
                            saledate: req.body.saledate,
                            saletype: req.body.saletype,
                            openrecall: req.body.openrecall,
                            }
                        );
    
                    VehicleDetails.findOneAndUpdate({vin: req.body.vin}, {$set:{makemodel: req.body.makemodel,
                        vin: req.body.vin,
                        type: req.body.type,
                        location: req.body.location,
                        cylinders: req.body.cylinders,
                        fueltype: req.body.fueltype,
                        miles: req.body.miles,
                        saledate: req.body.saledate,
                        saletype: req.body.saletype,
                        openrecall: req.body.openrecall}}, {new: true},function (err, updateResult) {
                        if (err) {
                            console.error("error ", err);
                            //return false;
                        }
                        else
                        {
                            if(updateResult!=null)
                                res.render('vehicleDetailsSuccess', {session:sess});
                            else
                            {
                                var folder = path.join(path.normalize(__dirname +'/..')+"/uploads/");
                                var awsFilePath = "";
                                fs.readdir(folder, function (err, files) {
                                    if (err) {
                                      console.error("Could not list the directory.", err);
                                      process.exit(1);
                                    }
                                    var itemsProcessed = 0;
                                    files.forEach(function (file, index) {
                                         const fileName1 = folder + path.join(file);
                                      // Make one pass and make the file complete
                                        // fs.readFile(fileName1, (err, data) => {
                                        //     if (err) throw err;
                                        //     const params = {
                                        //         Bucket: 'fleet-photos', // pass your bucket name
                                        //         Key: file, // file will be saved as testBucket/contacts.csv
                                        //         Body: JSON.stringify(data, null, 2)
                                        //     };
                                        //     s3.upload(params, function(s3Err, data) {
                                        //         if (s3Err) throw s3Err
                                        //         console.log(`File uploaded successfully at ${data.Location}`)
                                        //         awsFilePath += data.Location+',';
                                        //         itemsProcessed++;
            
                                        //         if(itemsProcessed === files.length) {
                                        //             callback(req, res, awsFilePath);
                                        //           }
                                        //     });
                                        // });

                                         // Read content from the file
                                        const fileContent = fs.readFileSync(fileName1);
                                            const params = {
                                                Bucket: 'fleet-photos', // pass your bucket name
                                                Key: file, // file will be saved as testBucket/contacts.csv
                                                Body: fileContent
                                            };
                                             s3.upload(params, function(s3Err, data) {
                                                if (s3Err) throw s3Err
                                                console.log(`File uploaded successfully at ${data.Location}`)
                                                awsFilePath += file+',';
                                                itemsProcessed++;
            
                                                if(itemsProcessed === files.length) {
                                                    callback(req, res, awsFilePath);
                                                  }
                                            });
                                    })
                                    function callback (req, res, awsFilePath) { 
                                        console.log('all done'); 
                                        let vehicleDetails = new VehicleDetails(
                                            {
                                                makemodel: req.body.makemodel,
                                                vin: req.body.vin,
                                                type: req.body.type,
                                                location: req.body.location,
                                                cylinders: req.body.cylinders,
                                                fueltype: req.body.fueltype,
                                                miles: req.body.miles,
                                                saledate: req.body.saledate,
                                                saletype: req.body.saletype,
                                                openrecall: req.body.openrecall,
                                                filename: awsFilePath
                                                }
                                            );
                        
                                            vehicleDetails.save(function (err) {
                                                if (err) {
                                                    //return next(err);
                                                    res.send('Error '+ err)
                                                }
                                                
                                                res.render('vehicleDetailsSuccess', {session:sess});
                                            })
                                    }                        
                                });   
                            }
                        }
                    });
                    
                }
            })
        
        };
//Get Sepecific Vehicle Details
exports.vehicle_details = function (req, res) {
    VehicleDetails.findById(req.params.id, function (err, vehicle) {
        if (err) {
            res.status(500).send({
                message: err.message || "Some error occurred while retrieving vehicles."
            });
        }
        res.send(vehicle);
    })
};

// Retrieve and return all vehicles from the database.
exports.get_all_vehicle_details = function (req, res) {
    VehicleDetails.find().
    then((allVehicles) => {
      return res.status(200).json({
        success: true,
        message: 'A list of all vehicles',
        Vehicles: allVehicles,
      });
    }).catch(err => {
        res.status(500).send({
            message: err.message || "Some error occurred while retrieving vehicles."
        });
    });
};

// Retrieve and return all vehicles from the database.
exports.get_vehicle_details_by_vin = function (req, res) {
    let objVin = req.query.vin;
    VehicleDetails.find({vin: objVin}, {  }).
    then((vehicle) => {
      return res.status(200).json({
        success: true,
        message: 'Vehicle Details',
        Vehicle: vehicle,
      });
    }).catch(err => {
        res.status(500).send({
            message: err.message || "Some error occurred while retrieving vehicles."
        });
    });
};

exports.vehicle_details_view = function (req, res) {
    console.log(path);
    res.render('vehicleDetails', {session:sess});
};


exports.login_view = function (req, res) {
    getImage('6AFFFI20707013K.jpg')
 .then((img)=>{
  let image="<img src='data:image/jpeg;base64," + encode(img.Body) + "'" + "/>";
  let startHTML="<html><body></body>";
  let endHTML="</body></html>";
  let html=startHTML + image + endHTML;
  res.send(html)
  }).catch((e)=>{
        res.send(e)
  })

    res.sendFile(path.join(path.normalize(__dirname +'/..')+'/public/login.html'));
};

exports.login_post = function (req, res) {
    sess=req.session;
    sess.email = req.body.username;
    if(req.body.username=="gsauser")
        res.render('vehicleDetails', {session:sess});
    else
        res.render('vehicleListing', {session:sess}); 
        //res.sendFile(path.join(path.normalize(__dirname +'/..')+'/public/vehicleListing.html'));
};

exports.vehicleListingResult = function (req, res) {
    //res.render('vehicleListingResult', {session:sess});
    
        VehicleDetails.find().
        then((allVehicles) => {
            res.render('vehicleListingResult', {session:sess, Vehicles:allVehicles});
        }).catch(err => {
            res.status(500).send({
                message: err.message || "Some error occurred while retrieving vehicles."
            });
        });
};

exports.vehicleInfo = function (req, res) {
    let objVin = req.query.vin;
    var result = VehicleDetails.findOne({vin: objVin}, {  })
    VehicleDetails.find({vin: objVin}, function (err, vehicle) {
        if (err) {
            res.status(500).send({
                message: err.message || "Some error occurred while retrieving vehicles."
            });
        }

        var itemsProcessed = 0;
        let vehiclesImageData =[];
        vehicle[0].filename.split(',').forEach(function (key, index) {
            getImage(key)
            .then((img)=>{
             vehiclesImageData.push(encode(img.Body));
             itemsProcessed++;
                if(itemsProcessed === vehicle[0].filename.split(',').length-1) {
                    res.render('vehicleInfo', {session:sess, Vehicle:vehicle, VehiclesImageData: vehiclesImageData});
                }
             }).catch((e)=>{
                console.error(e.message);
            })
            //res.render('vehicleInfo', {session:sess, Vehicle:vehicle, VehiclesImageData: vehiclesImageData});
        });
    })  
};

function getS3Object (req, res)
{
    var params = {
        Bucket: "fleet-photos", 
        Key: "6AFFFI20707013K.jpg"
       };

       s3.getSignedUrl('getObject', params, function (err, url) {
        console.log('The URL is', url);
      });
       s3.getObject(params, function(err, data) {
         if (err) console.log(err, err.stack); // an error occurred
         else     console.log(data);           // successful response
         /*
         data = {
          AcceptRanges: "bytes", 
          ContentLength: 3191, 
          ContentType: "image/jpeg", 
          ETag: "\"6805f2cfc46c0f04559748bb039d69ae\"", 
          LastModified: <Date Representation>, 
          Metadata: {
          }, 
          TagCount: 2, 
          VersionId: "null"
         }
         */
       });
};

function encode(data){
    let buf = Buffer.from(data);
    let base64 = buf.toString('base64');
    console.log(typeof(base64));
    return base64
    };

    async function getImage(key){
        const data =  s3.getObject(
          {
              Bucket: 'fleet-photos', 
              Key: key
            }
          
        ).promise();
        return data;
      }