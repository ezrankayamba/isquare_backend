"use strict";

const fs = require("fs");
const mysql = require("mysql2");

let rawdata = fs.readFileSync("config/config.json");
let environment = "development";
let dbConfig = JSON.parse(rawdata)[environment];
dbConfig["user"] = dbConfig.username;
delete dbConfig["username"];
delete dbConfig["dialect"];

const pool = mysql
  .createPool({
    connectionLimit: 100, //important
    ...dbConfig,
  })
  .promise();

const dbInsert = async (table, params) => {
  let columns = params.keys();
  let values = Object.values(params);
  let sql = `INSERT INTO ${table} (??) values (??)`;
  return await pool.query(sql, [columns, values]);
};
const dbSelect = async (sql, params) => {
  let res = await pool.query(sql, params);
  return res[0];
};

const dbUpdate = async (sql, params) => {
  return await pool.query(sql, params);
};
const dbDelete = async (sql, params) => {
  return await pool.query(sql, params);
};

module.exports = {
  dbInsert,
  dbSelect,
  dbUpdate,
  dbDelete,
};
