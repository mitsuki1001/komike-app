<template>
  <div>
    <h1>登録済み サークル 一覧</h1>

    <!-- 🔍 検索ボックス -->
    <input
      type="text"
      v-model="searchQuery"
      placeholder="サークル名・場所・登録者で検索"
      class="search-box"
    />

    <!-- 📅 日付フィルター -->
    <div class="day-filter-buttons">
      <button @click="selectedDay = ''">すべて</button>
      <button @click="selectedDay = '1日目'">1日目</button>
      <button @click="selectedDay = '2日目'">2日目</button>
    </div>
    
    <div class="area-filter-buttons">
      <button @click="selectedArea = ''">すべて</button>
      <button @click="selectedArea = '東'">東</button>
      <button @click="selectedArea = '西'">西</button>
      <button @click="selectedArea = '南'">南</button>
    </div>

    <!-- 🏷️ 凡例 -->
    <div class="circle-row legend">
      <span>サークル名</span>
      <span>エリア</span>
      <span>場所</span>
      <span>金額</span>
      <span>登録者</span>
      <span>日付</span>
      <span>操作</span>
    </div>

    <!-- 📋 一覧 -->
    <ul>
      <li
        v-for="circle in filteredCircles"
        :key="circle.id"
        :class="{ completed: circle.completed }"
      >
        <div class="circle-row">
          <span>{{ circle.name }}</span>
          <span>{{ circle.area }}</span>
          <span>{{ circle.place }}</span>
          <span>{{ circle.amount }}</span>
          <span>{{ circle.registrant }}</span>
          <span>{{ circle.day }}</span>
          <span>
            <router-link :to="{ name: 'CircleDetail', params: { id: circle.id } }">詳細</router-link>
            <button @click="deleteCircle(circle.id)">削除</button>
            <button v-if="!circle.completed" @click="markComplete(circle.id)">完了</button>
            <button v-else @click="unmarkComplete(circle.id)">取消</button>
          </span>
        </div>
      </li>
    </ul>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'CirclesList',
  data() {
    return {
      circles: [],
      searchQuery: '',
      selectedDay: '',
      selectedArea: '' 
    };
  },
  
  computed: {
    filteredCircles() {
      const query = this.searchQuery.toLowerCase();
      return this.circles.filter(circle => {
        const name = circle.name || '';
        const place = circle.place || '';
        const registrant = circle.registrant || '';
        const day = circle.day || '';
        const matchesQuery =
          name.toLowerCase().includes(query) ||
          place.toLowerCase().includes(query) ||
          registrant.toLowerCase().includes(query)

          const matchesDay = this.selectedDay === '' || day === this.selectedDay;

        return matchesQuery && matchesDay;
      });
    }
  },
  methods: {
    async fetchCircles() {
      try {
        const response = await axios.get('http://localhost:3000/circles');
        this.circles = response.data;
      } catch (error) {
        console.error('一覧取得エラー:', error);
      }
    },
    async deleteCircle(id) {
      if (!confirm('本当に削除しますか？')) return;
      try {
        await axios.delete(`http://localhost:3000/circle/${id}`);
        this.fetchCircles();
        alert('削除に成功しました。');
      } catch (error) {
        console.error('削除エラー:', error);
        alert('削除に失敗しました。');
      }
    },
    async markComplete(id) {
      if (!confirm('このサークルを完了状態にしますか？')) return;
      try {
        await axios.put(`http://localhost:3000/circle/${id}/complete`);
        this.fetchCircles();
        alert('完了状態にしました。');
      } catch (error) {
        console.error('完了更新エラー:', error);
        alert('更新に失敗しました。');
      }
    },
    async unmarkComplete(id) {
      if (!confirm('このサークルの完了状態を取り消しますか？')) return;
      try {
        await axios.put(`http://localhost:3000/circle/${id}/uncomplete`);
        this.fetchCircles();
        alert('完了状態を取り消しました。');
      } catch (error) {
        console.error('完了取消エラー:', error);
        alert('取消に失敗しました。');
      }
    }
  },
  created() {
    this.fetchCircles();
  }
};
</script>

<style scoped>
.search-box {
  margin-bottom: 1rem;
  padding: 0.5rem;
  width: 100%;
  max-width: 400px;
  font-size: 1rem;
}

.day-filter-buttons {
  margin-bottom: 1rem;
}
.day-filter-buttons button {
  margin-right: 10px;
  padding: 5px 10px;
  font-size: 1rem;
  cursor: pointer;
}

.area-filter-buttons {
  margin-bottom: 1rem;
}
.area-filter-buttons button {
  margin-right: 10px;
  padding: 5px 10px;
  font-size: 1rem;
  cursor: pointer;
}

ul {
  list-style-type: none;
  padding: 0;
}

li {
  margin-bottom: 0.5rem;
  border-bottom: 1px solid #ccc;
}

.circle-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem;
  flex-wrap: wrap;
}

.circle-row span {
  flex: 1;
  text-align: center;
}

.legend {
  font-weight: bold;
  border-bottom: 2px solid #333;
  background-color: #f0f0f0;
}

.completed {
  background-color: #eee;
}

button {
  margin-left: 5px;
}
</style>
