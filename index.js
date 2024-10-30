const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs-extra');
const fileUpload = require('express-fileupload');
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config()


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@organicproductcommerce.9mqjv.mongodb.net/?retryWrites=true&w=majority&appName=OrganicProductCommerce`;



const app = express();
app.use(bodyParser.json());
app.use(cors());
// app.use(express.static('doctors'));
app.use('/doctors', express.static('doctors'));
app.use(fileUpload());


const port = 5000;

app.get('/', (req, res) => {
    res.send('Hello World!')
})


const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {

        await client.connect();

        const appointmentCollection = client.db("doctorsPortal").collection("appointments");

        const doctorCollection = client.db("doctorsPortal").collection("doctors");




        app.post('/addAppointment', (req, res) => {
            const appointment = req.body;

            // Ensure the date is normalized to UTC before storing it
            appointment.date = new Date(appointment.date);  // This should already be in UTC from the client

            appointment.created = new Date(appointment.created);

            appointmentCollection.insertOne(appointment)
                .then(result => {
                    if (result.acknowledged) {
                        res.send(true);
                    } else {
                        res.send(false);
                    }
                })
                .catch(err => {
                    console.error('Error inserting appointment:', err);
                    res.status(500).send({ error: 'An error occurred while adding the appointment' });
                });
        });



        app.get('/appointments', (req, res) => {
            appointmentCollection.find({}).toArray()
                .then(documents => {
                    res.send(documents);
                })
        })



        // app.post('/addAppointmentsByDate', (req, res) => {
        //     const { date } = req.body;
        //     const queryDate = new Date(date);

        //     // Set start of the day (00:00:00) and end of the day (23:59:59) in UTC
        //     const startOfDay = new Date(queryDate.setUTCHours(0, 0, 0, 0));
        //     const endOfDay = new Date(queryDate.setUTCHours(23, 59, 59, 999));

        //     // Find documents where the date is within the start and end of the day
        //     appointmentCollection.find({
        //         date: {
        //             $gte: startOfDay,
        //             $lte: endOfDay
        //         }
        //     }).toArray()
        //     .then(documents => {
        //         res.send(documents);
        //     })
        //     .catch(err => {
        //         console.error('Error fetching appointments:', err);
        //         res.status(500).send({ error: 'An error occurred while fetching appointments' });
        //     });
        // });



        app.post('/addAppointmentsByDate', async (req, res) => {
            const { date } = req.body;
            const queryDate = new Date(date);
            const email = req.body.email;

            const startOfDay = new Date(queryDate.setUTCHours(0, 0, 0, 0));
            const endOfDay = new Date(queryDate.setUTCHours(23, 59, 59, 999));


            try {
                const doctors = await doctorCollection.find({ email: email }).toArray();

                const filter = {
                    date: {
                        $gte: startOfDay,
                        $lte: endOfDay
                    }
                }
                if (doctors.length === 0) {
                    filter.email = email;
                }

                appointmentCollection.find(filter).toArray()
                    .then(documents => {
                        res.send(documents);
                    })
                    .catch(err => {
                        console.error('Error fetching appointments:', err);
                        res.status(500).send({ error: 'An error occurred while fetching appointments' });
                    });
            }

            catch {

            }




        });


        // backend ar folder a move kore file ar path ar maddome website a dekhanor jonno use hy
        /** app.post('/addADoctor', (req, res) => {
             const file = req.files.file;
             const name = req.body.name;
             const email = req.body.email;
             console.log(name, email, file);
             file.mv(`${__dirname}/doctors/${file.name}`, err => {
                 if (err) {
                     console.log(err);
                     return res.status(500).send({ msg: 'Failed to upload Image' })
                 }
                 doctorCollection.insertOne({ name, email, img: file.name })
                     .then(result => {
                         res.send(result.insertedCount > 0)
                     })
                 // return res.send({name: file.name, path: `/${file.name}`})
             })
         }) */


        // direct mongodb te image store korvo
        /**app.post('/addADoctor', (req, res) => {
            const file = req.files.file;
            const name = req.body.name;
            const email = req.body.email;
            const filePath = `${__dirname}/doctors/${file.name}`;

            file.mv(filePath, err => {
                if (err) {
                    console.log(err);
                    return res.status(500).send({ msg: 'Failed to upload Image' })
                }

                const newImg = fs.readFileSync(filePath);
                const encImg = newImg.toString('base64');


                const image = {
                    contentype: req.files.file.mimetype,
                    size: req.files.file.size,
                    img: Buffer(encImg , 'base64')
                }

                doctorCollection.insertOne({ name, email, image })
                    .then(result => {
                        fs.remove(filePath, error => {
                            if(error){
                                // console.log(error);
                                return res.status(500).send({ msg: 'Failed to upload Image' })
                            }
                            res.send(result.insertedCount > 0)
                        })
                    })
                // return res.send({name: file.name, path: `/${file.name}`})
            })
        }) */




        // heroku te image send korle fileSystem(fs) use korvo na
        app.post('/addADoctor', (req, res) => {
            const file = req.files.file;
            const name = req.body.name;
            const email = req.body.email;

            const newImg = file.data;
            const encImg = newImg.toString('base64');


            const image = {
                contentype: file.mimetype,
                size: file.size,
                img: Buffer.from(encImg, 'base64')
            }

            doctorCollection.insertOne({ name, email, image })
                .then(result => {
                    res.send(result.insertedCount > 0)
                })
        })


        


        app.get('/doctors', async (req, res) => {
            try {
                const documents = await doctorCollection.find({}).toArray();
                res.send(documents);
                console.log(documents);
            }

            catch {

            }


        })


        // chatGPT code

        /**app.post('/addADoctor', async (req, res) => {
            try {
                const file = req.files.file;
                const name = req.body.name;
                const email = req.body.email;
        
                // Basic validation
                if (!file || !name || !email) {
                    return res.status(400).send({ msg: 'All fields are required' });
                }
        
                // Validate file type and size (optional)
                const allowedTypes = ['image/jpeg', 'image/png'];
                if (!allowedTypes.includes(file.mimetype)) {
                    return res.status(400).send({ msg: 'Invalid file type. Only JPG and PNG are allowed.' });
                }
                if (file.size > 5 * 1024 * 1024) { // Limit to 5 MB
                    return res.status(400).send({ msg: 'File size should be less than 5MB' });
                }
        
                // Move the file
                await file.mv(`${__dirname}/doctors/${file.name}`);
        
                // Insert into the database
                const result = await doctorCollection.insertOne({ name, email, img: file.name });
        
                // Send response
                if (result.insertedCount > 0) {
                    return res.status(201).send({ msg: 'Doctor added successfully' });
                } else {
                    return res.status(500).send({ msg: 'Failed to add doctor' });
                }
            } catch (err) {
                console.error(err);
                return res.status(500).send({ msg: 'Server error occurred' });
            }
        }); */


        /**app.get('/doctors', async (req, res) => {
    try {
        const documents = await doctorCollection.find({}).toArray(); // Use await to get documents
        res.status(200).send({ 
            success: true, 
            message: 'Doctors retrieved successfully', 
            data: documents 
        });
    } catch (error) {
        console.error('Error retrieving doctors:', error); // Log the error for debugging
        res.status(500).send({ 
            success: false, 
            message: 'Failed to retrieve doctors', 
            error: error.message 
        });
    }
}); */


        app.post('/isDoctor', async (req, res) => {
            try {
                const email = req.body.email;
                const doctors = await doctorCollection.find({ email: email }).toArray();
                res.send(doctors.length > 0);
            }
            catch {

            }
        })


    }

    finally {

    }

}
run().catch(console.dir);

app.listen(process.env.PORT || port)



