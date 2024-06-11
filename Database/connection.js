const mongoose = require('mongoose');
const MachineStatusSchema = require('./Models/machineStatus');
const OperationsLogSchema = require('./Models/operationsLog');
const OperationsListSchema = require('./Models/operationsList');
const DbNameSchema = require('./Models/machineStatus');

let dbNameConnection;
const connections = {}

function start()
{
  const connection = mongoose.createConnection(process.env.DB_URL);
  dbNameConnection = connection.model(
    'DbName',
    DbNameSchema,
    'DbName'
  );
  console.log('Connection Stabilished');
}

function fillConnections(dbNames)
{
  JSON.parse(dbNames).forEach(db => {
    connections[db.accessCode] = {connection: addConnection(db.dbName), accessCode: db.accessCode};
  });
}

async function getDbNames()
{
  return await dbNameConnection.find();
}

function addConnection(dbName) {
  const dbUrl = process.env.DB_URL.replace('adm', dbName);

  const connection = mongoose.createConnection(dbUrl);

  const machineStatusConnection = connection.model(
    'MachineStatus',
    MachineStatusSchema,
    'MachineStatus'
  );

  const operationsLogConnection = connection.model(
    'OperationsLog',
    OperationsLogSchema,
    'OperationsLog'
  );

  const operationsListConnection = connection.model(
    'OperationsList',
    OperationsListSchema,
    'OperationsList'
  );

  
  output = { machineStatus: machineStatusConnection, operationsLog: operationsLogConnection, operationsList: operationsListConnection };

  setInterval(async () => {
    const machineStatus = await machineStatusConnection.findOne();

    if (machineStatus.connected == false) return;

    const lstDate = new Date(machineStatus.updatedAt)
    const curDate = new Date();

    const diff = (curDate - lstDate) / 1000

    if (diff > 45)
    {
      await machineStatusConnection.findOneAndUpdate({}, {
        connected: false,
    }, {upsert: true});
    }

  }, 10000);

  return output;
}

start();
getDbNames().then((dbNames) => fillConnections(JSON.stringify(dbNames)));
module.exports = {addConnection, connections, dbNameConnection};
