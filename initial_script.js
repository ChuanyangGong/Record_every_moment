const fs = require('fs')
const path = require('path')
const { connectDb } = require('./service/database')

// initial database
const database_root = path.join(__dirname, '/database')
const data_path = path.join(database_root, 'data.db')
if (!fs.existsSync(database_root)) {
    fs.mkdirSync(database_root)
}

if (!fs.existsSync(data_path)){
    fs.writeFileSync(data_path, '')

    // 连接数据库
    const db = connectDb(data_path)
    db.serialize(() => {
        // 创建表
        let createTableSql = `
        CREATE TABLE task_record_tb (
            id             INTEGER PRIMARY KEY AUTOINCREMENT,
            startAt        DATATIME NOT NULL,
            endAt          DATATIME NOT NULL,
            duration       INTEGER NOT NULL,
            isDelete       TINYINT NOT NULL DEFAULT 0,
            description    VARCHAR(100)
        );`
        db.run(createTableSql)
        
        createTableSql = `
        CREATE TABLE time_slice_tb (
            id             INTEGER PRIMARY KEY AUTOINCREMENT,
            startAt        DATATIME NOT NULL,
            endAt          DATATIME NOT NULL,
            duration       INTEGER NOT NULL,
            task_record_id INTEGER NOT NULL,
            CONSTRAINT FK_ID_TASK_RECORD FOREIGN KEY(task_record_id) REFERENCES task_record_tb(id)
        );`
        db.run(createTableSql)
    })
}

/*
 * 查询、插入 demo
*/
// 插入一条测试数据
// let insertSql = `
// INSERT INTO task_record_tb (startAt, endAt, duration) values (:startAt, :endAt, :duration)
// `
// let val = {
//     ':startAt': '1972-10-8',
//     ':endAt': '1972-10-25',
//     ':duration': 1000
// }
// let runRes = await db.run(insertSql, val);
// console.log(runRes)

// 查询插入的数据
// let searchSql = `select * from task_record_tb;`
// let res = await db.all(searchSql)
// console.log(res)

// 插入数据
// insertSql = `
// INSERT INTO time_slice_tb (startAt, endAt, duration, task_record_id) values (:startAt, :endAt, :duration, :task_id)
// `
// val = {
//     ':startAt': '1972-10-8',
//     ':endAt': '1972-10-25',
//     ':duration': 1000,
//     ':task_id': 25
// }
// runRes = await db.run(insertSql, val);
// console.log(runRes)

// 查询插入的数据
// searchSql = `select * from time_slice_tb;`
// res = await db.all(searchSql)
// console.log(res)