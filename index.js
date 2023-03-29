require('dotenv').config()
const express = require("express");
const path = require("path");
const axios = require('axios');

const app = express();
const port = process.env.PORT || "8000";

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");
app.use(express.static(path.join(__dirname, "public")));

const BASE_URL = 'https://api.tryfinch.com/'

const client_id = process.env.CLIENT_ID;
const client_secret = process.env.CLIENT_SECRET;
const redirect_uri = process.env.REDIRECT_URI;

async function getToken(id){
    return await axios.post(BASE_URL + 'auth/token', {
        client_id: client_id,
        client_secret: client_secret,
        code: id,
        redirect_uri: redirect_uri
    })
}

async function introspect(token){
    return await axios.get(BASE_URL + 'introspect/', {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Finch-API-Version': '2020-09-17'
        }
    })
}

async function getDirectory(token){
    return await axios.get(BASE_URL + 'employer/directory', {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Finch-API-Version': '2020-09-17'
        }
    })
}

async function getCompany(token){
    return await axios.get(BASE_URL + 'employer/company', {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Finch-API-Version': '2020-09-17'
        }
    })
}

async function getIndividual(token, id){
    return await axios.post(BASE_URL + 'employer/individual', {requests: [{individual_id: id}]}, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Finch-API-Version': '2020-09-17'
        }
    })
}

async function getEmployment(token, id){
    return await axios.post(BASE_URL + 'employer/employment', {requests: [{individual_id: id}]}, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Finch-API-Version': '2020-09-17'
        }
    })
}

app.get("/", async (req, res, next) => {
    try{
        if (req.query.code) {
            const access = await getToken(req.query.code);
            global.accessToken = access.data.access_token;
            const company = await introspect(global.accessToken);
            const company_id = company.data.company_id;
            res.render(`success`, {company_id: company_id});
        }  else {      
            res.render("index", { 
                "title": "Home", 
                "client_id": client_id,
                "redirect_uri": redirect_uri,
                "accessToken": global.accessToken || ""
            })
        }
    } 
    catch (error) {
        console.log(error)
        res.render("error", { title: "Error", error: error });
    }
});

app.get("/company/:id", async (req, res) => {
    try {
        const company = await getCompany(global.accessToken);
        res.render("company", { title: "Company", company: company.data})
    } catch (error) {
        res.render("error", { title: "Error", error: error });
    }
})

app.get("/directory", async (req, res) => {
    try {
        const directory = await getDirectory(global.accessToken);
        res.render("directory", { title: "Directory", directory: directory.data.individuals})
    } catch (error) {
        res.render("error", { title: "Error", error: error });
    }
})

app.get("/individual/:id", async (req, res) => {
    try {
        const individual = await getIndividual(global.accessToken, req.params.id);
        const employment = await getEmployment(global.accessToken, req.params.id);
        res.render("individual", { title: "Profile", individual: individual.data.responses, employment: employment.data.responses });
    } catch (error) {
        console.log(error)
        res.render("error", { title: "Error", error: error });
    }
});


//Server
app.listen(port, () => {
    console.log(`Listening to requests on http://localhost:${port}`);
});