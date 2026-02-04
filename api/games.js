// api/games.js - Vercel Serverless Function
const { initDatabase, addGame, getAllGames, addRating } = require('../lib/database');

// 初始化数据库
initDatabase();

module.exports = async (req, res) => {
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // 处理预检请求
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { pathname } = new URL(req.url, `http://${req.headers.host}`);
  
  // 路由处理
  if (req.method === 'GET' && pathname === '/api/games') {
    try {
      const games = await getAllGames();
      res.setHeader('Content-Type', 'application/json');
      res.status(200).json(games);
    } catch (error) {
      console.error('获取游戏列表时出错:', error);
      res.status(500).json({ error: '服务器内部错误' });
    }
  } 
  else if (req.method === 'POST' && pathname === '/api/games') {
    try {
      const body = await getBody(req);
      const { name, link, description, image } = body;
      
      if (!name || !link || !image) {
        res.status(400).json({ error: '缺少必填字段' });
        return;
      }
      
      const gameId = await addGame(name, link, description, image);
      res.status(201).json({ id: gameId, message: '游戏添加成功' });
    } catch (error) {
      console.error('添加游戏时出错:', error);
      res.status(500).json({ error: '服务器内部错误' });
    }
  }
  else if (req.method === 'POST' && pathname.startsWith('/api/games/') && pathname.endsWith('/rate')) {
    try {
      const gameId = parseInt(pathname.split('/')[3]);
      const body = await getBody(req);
      const { music, art, gameplay } = body;
      
      if (!gameId || gameId <= 0) {
        res.status(400).json({ error: '无效的游戏ID' });
        return;
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
  }
  else {
    res.status(404).json({ error: '未找到资源' });
  }
};

// 辅助函数：解析请求体
function getBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}