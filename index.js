const express = require("express");
const path = require("path");
const axios = require('axios');

const app = express();
const port = process.env.PORT || "8000";

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");
app.use(express.static(path.join(__dirname, "public")));


const BASE_URL = 'http://finch-sandbox-se-interview.vercel.app/'

async function getToken(id){
    return await axios.post(BASE_URL + 'api/sandbox/create', {
        provider: id,
        products: ["company", "directory", "individual", "employment"]
    })
}

async function getDirectory(token){
    return await axios.get(BASE_URL + 'api/employer/directory', {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Finch-API-Version': '2020-09-17'
        }
    })
}

async function getCompany(token){
    return await axios.get(BASE_URL + 'api/employer/company', {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Finch-API-Version': '2020-09-17'
        }
    })
}

async function getIndividual(token, id){
    return await axios.post(BASE_URL + 'api/employer/individual', {requests: [{individual_id: id}]}, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Finch-API-Version': '2020-09-17'
        }
    })
}

async function getEmployment(token, id){
    return await axios.post(BASE_URL + 'api/employer/employment', {requests: [{individual_id: id}]}, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Finch-API-Version': '2020-09-17'
        }
    })
}

app.get("/", async (req, res, next) => {
    res.render("index", { 
        "title": "Home", 
        "providers": [{id: "gusto", name:"Gusto"}, {id: "bamboohr", name: "BambooHR"}, {id: "justworks", name: "Justworks"}, {id: "paychex_flex", name: "Paychex Flex"},{id:"workday", name:"Workday"}]});
});

app.get("/company/:id", async (req, res) => {
    try {
        const access = await getToken(req.params.id);
        global.accessToken = access.data.access_token
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