const { createApp, ref, computed, onMounted } = Vue;

createApp({
    setup() {
        // 数据状态
        const games = ref([]);
        const newGame = ref({
            name: '',
            link: '',
            description: '',
            image: ''
        });
        
        const tempRatings = ref({}); // 临时存储用户评分
        const notification = ref({
            show: false,
            message: '',
            icon: ''
        });

        // 计算属性：表单是否有效
        const isFormValid = computed(() => {
            return newGame.value.name.trim() !== '' && 
                   newGame.value.link.trim() !== '' && 
                   newGame.value.image.trim() !== '';
        });

        // 方法：显示通知
        const showNotification = (message, icon = 'fas fa-check-circle') => {
            notification.value = {
                show: true,
                message,
                icon
            };
            
            setTimeout(() => {
                notification.value.show = false;
            }, 3000);
        };

        // 方法：处理图片加载错误
        const handleImageError = (event) => {
            event.target.src = 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80';
        };

        // 方法：设置评分
        const setRating = (gameId, category, value) => {
            if (!tempRatings.value[gameId]) {
                tempRatings.value[gameId] = { music: 0, art: 0, gameplay: 0 };
            }
            
            tempRatings.value[gameId][category] = 
                tempRatings.value[gameId][category] === value ? 0 : value;
        };

        // 方法：获取当前评分
        const getCurrentRating = (gameId, category) => {
            if (!tempRatings.value[gameId]) return 0;
            return tempRatings.value[gameId][category] || 0;
        };

        // 方法：检查是否有评分
        const hasRating = (gameId) => {
            if (!tempRatings.value[gameId]) return false;
            const ratings = tempRatings.value[gameId];
            return ratings.music > 0 || ratings.art > 0 || ratings.gameplay > 0;
        };

        // 方法：提交评分
        const submitRating = async (gameId) => {
            if (!hasRating(gameId)) {
                showNotification('请先选择评分', 'fas fa-exclamation-triangle');
                return;
            }
            
            try {
                const rating = tempRatings.value[gameId];
                const response = await fetch(`/api/games/${gameId}/rate`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(rating)
                });
                
                if (response.ok) {
                    showNotification('评分提交成功！', 'fas fa-check-circle');
                    tempRatings.value[gameId] = { music: 0, art: 0, gameplay: 0 };
                    loadGames(); // 重新加载游戏数据
                } else {
                    showNotification('评分提交失败，请重试', 'fas fa-times-circle');
                }
            } catch (error) {
                console.error('提交评分时出错:', error);
                showNotification('网络错误，请检查连接', 'fas fa-times-circle');
            }
        };

        // 方法：添加游戏
        const addGame = async () => {
            if (!isFormValid.value) {
                showNotification('请填写所有必填字段', 'fas fa-exclamation-triangle');
                return;
            }
            
            try {
                const response = await fetch('/api/games', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(newGame.value)
                });
                
                if (response.ok) {
                    showNotification('游戏添加成功！', 'fas fa-check-circle');
                    
                    // 清空表单
                    newGame.value = {
                        name: '',
                        link: '',
                        description: '',
                        image: ''
                    };
                    
                    loadGames(); // 重新加载游戏数据
                } else {
                    showNotification('游戏添加失败，请重试', 'fas fa-times-circle');
                }
            } catch (error) {
                console.error('添加游戏时出错:', error);
                showNotification('网络错误，请检查连接', 'fas fa-times-circle');
            }
        };

        // 方法：加载游戏数据
        const loadGames = async () => {
            try {
                const response = await fetch('/api/games');
                if (response.ok) {
                    const data = await response.json();
                    // 计算综合评分
                    games.value = data.map(game => ({
                        ...game,
                        overall: (game.avg_music + game.avg_art + game.avg_gameplay) / 3
                    }));
                }
            } catch (error) {
                console.error('加载游戏数据时出错:', error);
                // 如果API不可用，使用示例数据
                games.value = [
                    {
                        id: 1,
                        name: "示例游戏：星之轨迹",
                        link: "https://example.com",
                        description: "一款充满奇幻色彩的冒险游戏，拥有精美的画面和动人的音乐",
                        image: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80",
                        avg_music: 4.5,
                        avg_art: 4.8,
                        avg_gameplay: 4.2,
                        rating_count: 24,
                        overall: 4.5
                    },
                    {
                        id: 2,
                        name: "示例游戏：暗影之城",
                        link: "https://example.com",
                        description: "黑暗风格的解谜游戏，玩法创新，美术风格独特",
                        image: "https://images.unsplash.com/photo-1511512578047-dfb367046420?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80",
                        avg_music: 4.0,
                        avg_art: 4.5,
                        avg_gameplay: 4.7,
                        rating_count: 18,
                        overall: 4.4
                    }
                ];
            }
        };

        // 生命周期：组件挂载时加载游戏数据
        onMounted(() => {
            loadGames();
        });

        return {
            games,
            newGame,
            tempRatings,
            notification,
            isFormValid,
            handleImageError,
            setRating,
            getCurrentRating,
            hasRating,
            submitRating,
            addGame,
            showNotification
        };
    }
}).mount('#app');