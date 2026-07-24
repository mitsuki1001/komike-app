<template>
  <div>
    <h1>登録済み サークル 一覧</h1>

    <!-- 進捗バー  -->
    <div class="progress-wrapper">
      <div class="progress-label">完了数：{{ filteredCompletedCount }} / {{ filteredCircles.length }}</div>
      <div class="progress-container">
        <div class="progress-bar" :style="{ width: filteredProgressPercentage + '%' }"></div>
      </div>
    </div>

    <!-- 🔍 検索ボックス -->
    <input
      type="text"
      v-model="searchQuery"
      placeholder="サークル名・場所・登録者で検索"
      class="search-box"
      @focus="showSuggestions = true"
      @blur="hideSuggestionsWithDelay"
    />
    <ul v-if="showSuggestions && searchHistory.length" class="suggestions-list">
      <li v-for="query in searchHistory" :key="query" @mousedown.prevent="applySearch(query)">
        {{ query }}
      </li>
    </ul>

    <!-- 📅 フィルター -->
    <div class="filter-group">
      <label>
        日付:
        <select v-model="selectedDay">
          <option value="">すべて</option>
          <option value="1日目">1日目</option>
          <option value="2日目">2日目</option>
        </select>
      </label>

      <label>
        エリア:
        <select v-model="selectedArea">
          <option value="">すべて</option>
          <option value="東">東</option>
          <option value="西">西</option>
          <option value="南">南</option>
        </select>
      </label>

      <label>
        優先度:
        <select v-model="selectedPriority">
          <option value="">すべて</option>
          <option value="最優先">最優先</option>
          <option value="できれば">できれば</option>
          <option value="余裕があれば">余裕があれば</option>
          <option value="不要になった">不要になった</option>
        </select>
      </label>

      <label>
        完了状態:
        <select v-model="selectedCompletion">
          <option value="">すべて</option>
          <option value="completed">完了</option>
          <option value="incomplete">未完了</option>
        </select>
      </label>
    </div>

    <!-- 📋 一覧 -->
    <ul>
      <li v-for="circle in filteredCircles" :key="circle.id" :class="{ completed: circle.completed }">
        <div class="circle-row">
          <div @click="circle.expanded = !circle.expanded" class="summary">
            <router-link
              :to="{ name: 'CircleDetail', params: { id: circle.id } }"
              class="circle-name-link">
              {{ circle.name }}
            </router-link>
             - {{ circle.area }} {{ circle.place }}
            <span :class="['priority-label', circle.priority_label]">{{ circle.priority_label }}</span>
            <span v-if="circle.completed" class="completed-label">✅ 完了</span>
          </div>

          <div v-if="circle.expanded" class="details">
            <span>金額: {{ circle.amount }}円</span>
            <span>登録者: {{ circle.registrant }}</span>
            <span>日付: {{ circle.day }}</span>
            <div class="action-buttons">
              <!-- ボタン類 -->
              <button @click="deleteCircle(circle.id)">削除</button>
              <button v-if="!circle.completed" @click="markComplete(circle.id)">完了</button>
              <button v-if="!circle.completed" @click="markSoldOut(circle.id)">完売</button>
              <button v-else @click="unmarkComplete(circle.id)">取消</button>
              <button @click="goToMap(circle)">マップ</button>
            </div>
          </div>
        </div>
      </li>
    </ul>
  </div>
</template>

<script>
import axios from 'axios';

// const baseURL = 'http://localhost:3000'
const baseURL = process.env.VUE_APP_API_BASE_URL


export default {
  name: 'CirclesList',
  data() {
    return {
      circles: [],
      searchQuery: '',
      selectedDay: '',
      selectedArea: '',
      selectedPriority: '',
      selectedCompletion: '',
      searchHistory: [],
      showSuggestions: false
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
        const area = circle.area || '';
        const priorityLabel = circle.priority_label || '';
        const matchesQuery =
          name.toLowerCase().includes(query) ||
          place.toLowerCase().includes(query) ||
          registrant.toLowerCase().includes(query);
        const matchesDay = this.selectedDay === '' || day === this.selectedDay;
        const matchesArea = this.selectedArea === '' || area === this.selectedArea;
        const matchesPriority = this.selectedPriority === '' || priorityLabel === this.selectedPriority;
        const matchesCompletion =
          this.selectedCompletion === '' ||
          (this.selectedCompletion === 'completed' && circle.completed) ||
          (this.selectedCompletion === 'incomplete' && !circle.completed);
        return matchesQuery && matchesDay && matchesArea && matchesPriority && matchesCompletion;
      });
    },
    filteredCompletedCount() {
      return this.filteredCircles.filter(c => c.completed).length;
    },
    filteredProgressPercentage() {
      return this.filteredCircles.length === 0
      ? 0
      : Math.round((this.filteredCompletedCount / this.filteredCircles.length) * 100);
    }
  },
  methods: {
    async fetchCircles() {
      try {
        const response = await axios.get(
          `${baseURL}/circles`,
          {
            params: {
              isAdmin: localStorage.getItem('isAdmin')
            }
          }
        );
        this.circles = response.data;
      } catch (error) {
        console.error(
          '一覧取得エラー:',
          error
        );
      }
    },
    async deleteCircle(id) {
      if (!confirm('本当に削除しますか？')) return;
      try {
        await axios.delete(`${baseURL}/circle/${id}`);
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
        await axios.put(`${baseURL}/circle/${id}/complete`,{buyer: localStorage.getItem('userName')});
        this.fetchCircles();
        alert('完了状態にしました。');
      } catch (error) {
        console.error('完了更新エラー:', error);
        alert('更新に失敗しました。');
      }
    },
    async markSoldOut(id) {
      if (!confirm('このサークルを完売状態にしますか？')) return;
      try {
        await axios.put(`${baseURL}/circle/${id}/soldout`,{buyer: localStorage.getItem('userName')});
        this.fetchCircles();
        alert('完売状態にしました。');
      } catch (error) {
        console.error('完売更新エラー:', error);
        alert('完売更新に失敗しました。');
      }
    },
    async unmarkComplete(id) {
      if (!confirm('このサークルの完了状態を取り消しますか？')) return;
      try {
        await axios.put(`${baseURL}/circle/${id}/uncomplete`);
        this.fetchCircles();
        alert('完了状態を取り消しました。');
      } catch (error) {
        console.error('完了取消エラー:', error);
        alert('取消に失敗しました。');
      }
    },
    goToMap(circle) {
      this.$router.push({
        name: 'VenueMap',
        query: {
          id: circle.id,
          place: circle.place,
          day: circle.day
        }
      });
    },
    applySearch(query) {
      this.searchQuery = query;
      this.showSuggestions = false;
    },
    hideSuggestionsWithDelay() {
      // blur の直後にクリックがある場合に備えて少し遅らせる
      setTimeout(() => {
        this.showSuggestions = false;
      }, 100);
    },
    updateSearchHistory(query) {
      if (!query) return;
      if (!this.searchHistory.includes(query)) {
        this.searchHistory.unshift(query);
        if (this.searchHistory.length > 10) this.searchHistory.pop();
        localStorage.setItem('searchHistory', JSON.stringify(this.searchHistory));
      }
    }
  },
  created() {
    this.fetchCircles();

    // 検索条件の復元
    this.searchQuery = localStorage.getItem('searchQuery') || '';
    this.selectedDay = localStorage.getItem('selectedDay') || '';
    this.selectedArea = localStorage.getItem('selectedArea') || '';
    this.selectedPriority = localStorage.getItem('selectedPriority') || '';
    this.selectedCompletion = localStorage.getItem('selectedCompletion') || '';

    // 履歴の読み込み
    const history = localStorage.getItem('searchHistory');
    this.searchHistory = history ? JSON.parse(history) : [];
  },
  watch: {
    searchQuery(newVal) {
      localStorage.setItem('searchQuery', newVal);
      this.updateSearchHistory(newVal);
    },
    selectedDay(newVal) {
      localStorage.setItem('selectedDay', newVal);
    },
    selectedArea(newVal) {
      localStorage.setItem('selectedArea', newVal);
    },
    selectedPriority(newVal) {
      localStorage.setItem('selectedPriority', newVal);
    },
    selectedCompletion(newVal) {
      localStorage.setItem('selectedCompletion', newVal);
    }
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

.filter-group label {
  display: flex;
  flex-direction: column;
  margin-bottom: 0.5rem;
}

.filter-group {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr;
  gap: 10px;
}

.filter-row {
  margin-bottom: 0.5rem;
}
.filter-row button {
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
  margin-bottom: 1rem;
}

.circle-row {
  display: flex;
  flex-direction: column;
  padding: 1rem;
  border: 1px solid #ccc;
  border-radius: 8px;
  background-color: #fff;
}

.circle-row span {
  margin-bottom: 0.5rem;
  font-size: 0.95rem;
  word-break: break-word;
}

.action-buttons {
  display: flex;
  flex-direction: row;
  gap: 12px;
  justify-content: space-between;
  margin-top: 0.5rem;
}
.action-buttons button {
  flex: 1;
  padding: 10px;
  font-size: 1rem;
  min-width: 100px;
}

.action-buttons button,
.action-buttons a {
  width: 50%;
  padding: 5px;
  font-size: 1rem;
}

.completed {
  background-color: #f0f0f0;
  
}


.completed-label {
  color: green;
  font-weight: bold;
  margin-left: 10px;
}

li.completed .circle-row {
  background-color: #f0f0f0;
}

.details span {
  display: block;
  margin-bottom: 0.4rem;
}

@media (min-width: 601px) {
  .circle-row {
    display: flex;
    flex-direction: column;
    padding: 1rem;
    border: 1px solid #ccc;
    border-radius: 8px;
    margin-bottom: 1rem;
    background-color: #fff;
  }

  .circle-row span {
    flex: 1;
    text-align: center;
    margin-bottom: 0;
  }

  .action-buttons {
    flex-direction: row;
    gap: 5px;
  }

  .action-buttons button,
  .action-buttons a {
    width: auto;
  }
}

.progress-wrapper {
  margin-bottom: 1rem;
}

.progress-label {
  font-weight: bold;
  margin-bottom: 4px;
  text-align: center;
}

.progress-container {
  background-color: #eee;
  border-radius: 5px;
  height: 10px;
  overflow: hidden;
  position: relative;
}

.progress-bar {
  background-color: #4caf50;
  height: 100%;
  transition: width 0.3s ease;
}

.suggestions-list {
  position: absolute;
  background: white;
  border: 1px solid #ccc;
  width: 100%;
  z-index: 10;
  list-style: none;
  padding: 0;
  margin: 0;
}

.suggestions-list li {
  padding: 8px;
  cursor: pointer;
}

.suggestions-list li:hover {
  background-color: #f0f0f0;
}

.admin-label {
  color: red;
  font-weight: bold;
  margin-left: 10px;
}

.soldout-label {
  color: #d32f2f;
  font-weight: bold;
  margin-left: 10px;
}

</style>
