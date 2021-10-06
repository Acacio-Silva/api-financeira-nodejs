const express  = require('express');
const {v4: uudiv4} = require('uuid')
const app = express();

app.use(express.json());
const customers = [];

//meddleware
function verifyIfExistAccountCPF(req, res, next){
    const {cpf} = req.headers;
    const customer = customers.find(customer => customer.cpf === cpf);
    if(!customer){
        return res.status(400).json({error : "customer not found!"});
    }

    req.customer = customer;
    return next();
}
function getBalance(statment){
const balance = statment.reduce((acumulador, operation)=>{
    if(operation.type === 'credit'){
        return acumulador + operation.amount;
    }
    else{
        return acumulador - operation.amount;
    }
}, 0)
return balance;
}

app.post("/account", (req, res)=>{
const {cpf, name} = req.body;

const customerAlreadyExists = customers.some(
 customer => customer.cpf === cpf
); 

if(customerAlreadyExists){
    return res.status(400).json({error :"Custumer already exists!"});
}


customers.push({
    cpf,
    name,
    id: uudiv4(),
    statment: []
});

return res.status(201).send();
});

app.get("/statement/",verifyIfExistAccountCPF, (req, res) => {
    const {customer} = req;
    return res.json(customer.statment);
});

app.post("/deposit", verifyIfExistAccountCPF, (req, res)=>{
const {description, amount} = req.body;

const {customer} = req;

const statmentOperation = {
    description,
    amount,
    create_at: new Date(),
    type:"credit"
    
}

customer.statment.push(statmentOperation);

return res.status(201).send();
});

app.post("/withdraw", verifyIfExistAccountCPF, (req, res)=>{
const {amount} = req.body;
const {customer} = req;
const balance = getBalance(customer.statment);

if(balance < amount){
    return res.status(400).json({error: "insufficient funds!"});
}
const statmentOperation = {
    amount,
    create_at: new Date(),
    type:"debit"
    
}
customer.statment.push(statmentOperation);
res.status(201).send();

});

app.get("/statement/date",verifyIfExistAccountCPF, (req, res) => {
    const {customer} = req;
    const {date} = req.query;

    const dateFormat = new Date(date + " 00:00");

    const statement = customer.statment.filter((statement => statement.create_at.toDateString() === new Date(dateFormat).toDateString()))
    return res.json(statement);
});

app.put("/account", verifyIfExistAccountCPF, (req, res)=>{
const {name} = req.body;
const {customer} = req;

customer.name = name;

res.status(201).send();
});

app.get("/account",verifyIfExistAccountCPF, (req, res)=>{
const {customer} = req;
return res.json(customer);
});

app.delete("/account", verifyIfExistAccountCPF, (req, res)=>{
    const {customer} = req;
    customers.splice(customer, 1);

    return res.status(200).json({customers});
});

app.get("/balance", verifyIfExistAccountCPF, (req, res)=>{
const {customer} = req;

const balance = getBalance(customer.statment);
return res.json("Seu saldo é de: " + balance);
});
app.listen(3333);
