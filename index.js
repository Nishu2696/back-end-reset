const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const cors = require("cors");
const port = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(cors());

const mongodb = require('mongodb');
const mongoClient = mongodb.MongoClient;
//const dbURL = "mongodb://localhost:27017";
const dbURL = `mongodb+srv://Nishu2696:Goku1996!@cluster0-fsljb.mongodb.net/<dbname>?retryWrites=true&w=majority`;

const bcrypt = require("bcryptjs");

const nodemailer = require("nodemailer");

require("dotenv").config();

const exphbs = require("express-handlebars");
app.engine("handlebars", exphbs());
app.set("view engine", "handlebars");

app.listen(port, (req, res) => {
    res.send("hello");
    console.log("hello");
    console.log("listening in port " + port)
});

//creating an API for registration
app.post("/register", (req, res) => {
    //connecting to the mongo
    mongoClient.connect(dbURL, (err, client) => {
        if (err) throw err;
        //connecting to the database
        let db = client.db("Registration");
        //using the collection from that particular database
        db.collection("users").findOne({ email: req.body.email }, (err, data) => {
            if (err) throw err;
            if (data) {//if email already exists dont allow to create a new one
                res.status(400).json({
                    msg: "E-mail already exist"
                });
            }
            else {
                //if the email doesnt exist creating a new registration
                //use of bcrypt for encrypting the password
                bcrypt.genSalt(10, (err, salt) => {
                    console.log("salt", salt);
                    //converting the user password with hashed password
                    bcrypt.hash(req.body.password, salt, function (err, hash) {
                        console.log("hash", hash);
                        req.body.password = hash;//storing the hashed password and replacing it with the original password
                        db.collection("users").insertOne(req.body, (err, data) => {// saving the stored password and email to the database
                            if (err) throw err;
                            client.close();
                            res.status(200).json(data);
                        });
                    });
                });
            }
        })
    });
});

app.post("/login", (req, res) => {
    mongoClient.connect(dbURL, (err, client) => {
        if (err) throw err;
        let db = client.db("Registration");
        db.collection("users").findOne({ email: req.body.email }, (err, data) => {
            if (err) throw err;
            if (data) {
                bcrypt.compare(req.body.password, data.password, (err, result) => {
                    //console.log(result);
                    if (err) throw err;
                    if (result) {
                        res.status(200).json({
                            msg: "Success"
                        });
                    }
                    else {
                        res.status(401).json({
                            msg: "Unauthorized / Wrong Password"
                        });
                    }
                });

            }
            else {
                res.status(401).json({
                    msg: "Invalid E-mail"
                });
            }
        })
        /*db.collection("users").findOne({ email: req.body.email, password: req.body.password }, (err, data) => {
            if (err) throw err;
            client.close();
        })*/
    });
});

app.post("/changepassword", (req, res) => {

    let random = Math.floor(Math.random() * 90000) + 10000;

    if(! req.body.email){
        res.status(400).json({
            msg: "E-mail Id needed"
        });
    }

    // let transporter = nodemailer.createTransport({
    //     service: 'gmail',
    //     auth: {
    //         /*user: process.env.EMAIL || 'abc@gmail.com', // TODO: your gmail account
    //         pass: process.env.PASSWORD || '1234' // TODO: your gmail password*/
    //         user: "marcnishaanth2696@gmail.com", // generated ethereal user
    //         pass: "", // generated ethereal password
    //     }
    // });

    // // Step 2
    // let mailOptions = {
    //     from: 'marcnishaanth2696@gmail.com', // TODO: email sender
    //     to: 'nishaanth2696@gmail.com', // TODO: email receiver
    //     subject: 'Nodemailer - Test',
    //     text: random
    // };

    // // Step 3
    // transporter.sendMail(mailOptions, (err, data) => {
    //     if (err) {
    //         return log('Error occurs');
    //     }
    //     return log('Email sent!!!');
    // });



    let sent_to = req.body.email;
    console.log("name_1", sent_to);


    mongoClient.connect(dbURL, (err, client) => {
        if(err) throw err;
        let db = client.db("Registration");
        db.collection("users").findOne({ email: req.body.email }, (err, data) => {
            if(err) throw err;
            if(data){
                //create reusable transporter object using the default SMTP transport
                let transporter = nodemailer.createTransport({
                    //host: "smtp.ethereal.email",
                    //port: 587,
                    //secure: false, // true for 465, false for other ports
                    service: "gmail",
                    auth: {
                        user: process.env.EMAIL, // generated ethereal user
                        pass: process.env.PASSWORD, // generated ethereal password
                    },
                    /*tls: {
                        rejectUnauthorized: false
                    }*/
                });
            
                // send mail with defined transport object
                let info = transporter.sendMail({
                    from: '"Nodemailer Contact" <marcnishaanth2696@gmail.com>', // sender address
                    to: `"${sent_to}", nishaanth2696@gmail.com`, // list of receivers
                    subject: "Hello ✔", // Subject line
                    text: "Hello world?", // plain text body
                    html: `<b>"${random}"</b>`, // html body
                });
            
                console.log("Message sent: %s", info.messageId);
                // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>
            
                // Preview only available when sending through an Ethereal account
                console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
                // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou..
            }
            client.close();
        });

    })

});

app.post("/interchangepassword", (req, res) => {
    mongoClient.connect(dbURL, (err, client) => {
        if (err) throw err;
        let db = client.db("Registration");
        db.collection("users").findOne({ email: req.body.email }, (err, data) => {
            if(err) throw err;
            if(data){
                bcrypt.genSalt(10, (err, salt) => {
                    bcrypt.hash(req.body.password, salt, function (err, hash) {
                        req.body.password = hash;
                        db.collection("users").updateOne({ email: req.body.email }, { $set: { password : req.body.password } }, (err, data) => {
                            if (err) throw err;
                            client.close();
                            res.status(200).json(data);
                        });
                    });
                });
                // db.collection("users").updateOne({ email: req.body.email }, { $set: { password : req.body.password } }, (err, data) => {
                //     if (err) throw err;
                //     //if the email doesnt exist creating a new registration
                //     //use of bcrypt for encrypting the password
                //     bcrypt.genSalt(10, (err, salt) => {
                //         console.log("salt", salt);
                //         //converting the user password with hashed password
                //         bcrypt.hash(req.body.password, salt, function (err, hash) {
                //             console.log("hash", hash);
                //             req.body.password = hash;//storing the hashed password and replacing it with the original password
                //             db.collection("users").insertOne(req.body, (err, data) => {// saving the stored password and email to the database
                //                 if (err) throw err;
                //                 client.close();
                //                 res.status(200).json(data);
                //             });
                //         });
                //     });
        
                // });
            }
            else{
                res.status(401).json({
                    msg: "Invalid E-mail"
                });
            }
        });
    });
});