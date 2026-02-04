const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'games.db');
let db;

// 初始化数据库
function initDatabase() {
    db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
            console.error('数据库连接失败:', err);
        } else {
            console.log('已连接到SQLite数据库');
            createTables();
        }
    });
}

// 创建数据表
function createTables() {
    // 游戏表
    db.run(`CREATE TABLE IF NOT EXISTS games (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        link TEXT NOT NULL,
        description TEXT,
        image TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);
    
    // 评分表
    db.run(`CREATE TABLE IF NOT EXISTS ratings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        game_id INTEGER NOT NULL,
        music INTEGER CHECK(music >= 0 AND music <= 5),
        art INTEGER CHECK(art >= 0 AND art <= 5),
        gameplay INTEGER CHECK(gameplay >= 0 AND gameplay <= 5),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (game_id) REFERENCES games (id) ON DELETE CASCADE
    )`);
    
    // 创建索引以提高查询性能
    db.run('CREATE INDEX IF NOT EXISTS idx_ratings_game_id ON ratings(game_id)');
}

// 添加游戏
function addGame(name, link, description, image) {
    return new Promise((resolve, reject) => {
        const sql = `INSERT INTO games (name, link, description, image) VALUES (?, ?, ?, ?)`;
        db.run(sql, [name, link, description || '', image], function(err) {
            if (err) {
                reject(err);
            } else {
                resolve(this.lastID);
            }
        });
    });
}

// 添加评分
function addRating(gameId, music, art, gameplay) {
    return new Promise((resolve, reject) => {
        const sql = `INSERT INTO ratings (game_id, music, art, gameplay) VALUES (?, ?, ?, ?)`;
        db.run(sql, [gameId, music, art, gameplay], function(err) {
            if (err) {
                reject(err);
            } else {
                resolve(this.lastID);
            }
        });
    });
}

// 获取所有游戏及其评分统计
function getAllGames() {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT 
                g.id,
                g.name,
                g.link,
                g.description,
                g.image,
                COALESCE(AVG(r.music), 0) as avg_music,
                COALESCE(AVG(r.art), 0) as avg_art,
                COALESCE(AVG(r.gameplay), 0) as avg_gameplay,
                COUNT(r.id) as rating_count
            FROM games g
            LEFT JOIN ratings r ON g.id = r.game_id
            GROUP BY g.id
            ORDER BY g.created_at DESC
        `;
        
        db.all(sql, [], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

module.exports = {
    initDatabase,
    addGame,
    addRating,
    getAllGames
};