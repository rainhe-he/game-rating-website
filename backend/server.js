const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDatabase, addGame, getAllGames, addRating } = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// 数据库初始化
initDatabase();

// API路由
// 获取所有游戏
app.get('/api/games', async (req, res) => {
    try {
        const games = await getAllGames();
        res.json(games);
    } catch (error) {
        console.error('获取游戏列表时出错:', error);
        res.status(500).json({ error: '服务器内部错误' });
    }
});

// 添加新游戏
app.post('/api/games', async (req, res) => {
    try {
        const { name, link, description, image } = req.body;
        
        if (!name || !link || !image) {
            return res.status(400).json({ error: '缺少必填字段' });
        }
        
        const gameId = await addGame(name, link, description, image);
        res.status(201).json({ id: gameId, message: '游戏添加成功' });
    } catch (error) {
        console.error('添加游戏时出错:', error);
        res.status(500).json({ error: '服务器内部错误' });
    }
});

// 为游戏评分
app.post('/api/games/:id/rate', async (req, res) => {
    try {
        const gameId = parseInt(req.params.id);
        const { music, art, gameplay } = req.body;
        
        if (!gameId || gameId <= 0) {
            return res.status(400).json({ error: '无效的游戏ID' });
        }
        
        // 验证评分范围 (1-5)
        const validRating = (rating) => rating >= 1 && rating <= 5;
        
        if ((music && !validRating(music)) || 
            (art && !validRating(art)) || 
            (gameplay && !validRating(gameplay))) {
            return res.status(400).json({ error: '评分必须在1-5之间' });
        }
        
        await addRating(gameId, music || 0, art || 0, gameplay || 0);
        res.json({ message: '评分提交成功' });
    } catch (error) {
        console.error('提交评分时出错:', error);
        res.status(500).json({ error: '服务器内部错误' });
    }
});

// 前端路由
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
    console.log(`API地址: http://localhost:${PORT}/api/games`);
});