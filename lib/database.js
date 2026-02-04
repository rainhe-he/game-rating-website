// lib/database.js - 使用内存数据库，因为Vercel Serverless Functions是无状态的
let games = [
    {
      id: 1,
      name: "示例游戏：星之轨迹",
      link: "https://example.com",
      description: "一款充满奇幻色彩的冒险游戏，拥有精美的画面和动人的音乐",
      image: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80",
      avg_music: 4.5,
      avg_art: 4.8,
      avg_gameplay: 4.2,
      rating_count: 24
    }
  ];
  
  let ratings = [];
  
  // 初始化内存数据库
  function initDatabase() {
    console.log('内存数据库已初始化');
    return Promise.resolve();
  }
  
  // 添加游戏
  function addGame(name, link, description, image) {
    return new Promise((resolve) => {
      const newId = games.length > 0 ? Math.max(...games.map(g => g.id)) + 1 : 1;
      const newGame = {
        id: newId,
        name,
        link,
        description: description || '',
        image,
        avg_music: 0,
        avg_art: 0,
        avg_gameplay: 0,
        rating_count: 0
      };
      games.push(newGame);
      resolve(newId);
    });
  }
  
  // 添加评分
  function addRating(gameId, music, art, gameplay) {
    return new Promise((resolve) => {
      // 添加评分记录
      ratings.push({
        id: ratings.length + 1,
        game_id: gameId,
        music: music || 0,
        art: art || 0,
        gameplay: gameplay || 0,
        created_at: new Date().toISOString()
      });
      
      // 计算该游戏的所有评分
      const gameRatings = ratings.filter(r => r.game_id === gameId);
      
      // 计算平均分
      const avg_music = gameRatings.reduce((sum, r) => sum + (r.music || 0), 0) / gameRatings.length;
      const avg_art = gameRatings.reduce((sum, r) => sum + (r.art || 0), 0) / gameRatings.length;
      const avg_gameplay = gameRatings.reduce((sum, r) => sum + (r.gameplay || 0), 0) / gameRatings.length;
      
      // 更新游戏信息
      const gameIndex = games.findIndex(g => g.id === gameId);
      if (gameIndex !== -1) {
        games[gameIndex] = {
          ...games[gameIndex],
          avg_music,
          avg_art,
          avg_gameplay,
          rating_count: gameRatings.length
        };
      }
      
      resolve(gameRatings.length);
    });
  }
  
  // 获取所有游戏
  function getAllGames() {
    return Promise.resolve(games.map(game => ({
      ...game,
      overall: (game.avg_music + game.avg_art + game.avg_gameplay) / 3
    })));
  }
  
  module.exports = {
    initDatabase,
    addGame,
    addRating,
    getAllGames
  };