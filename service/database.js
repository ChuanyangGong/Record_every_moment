const sqlite3 = require("sqlite3").verbose();

const connectDb = (dbPath) => {
    return new sqlite3.Database(dbPath);
};

exports.connectDb = connectDb
