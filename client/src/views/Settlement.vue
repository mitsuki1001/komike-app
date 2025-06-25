<template>
  <div class="settlement-page">
    <h1>精算ページ</h1>

    <!-- フィルターセクション -->
    <div class="filter-group">
      <label>表示モード:</label>
      <select v-model="displayMode">
        <option value="actual">購入金額ベース</option>
        <option value="estimated">金額ベース</option>
      </select>

      <label>購入者で絞り込み:</label>
      <select v-model="selectedBuyer">
        <option value="">すべて</option>
        <option v-for="buyer in buyers" :key="buyer" :value="buyer">{{ buyer }}</option>
      </select>

      <label>登録者で絞り込み:</label>
      <select v-model="selectedRegistrant">
        <option value="">すべて</option>
        <option v-for="registrant in registrants" :key="registrant" :value="registrant">{{ registrant }}</option>
      </select>

      <label>日付で絞り込み:</label>
      <select v-model="selectedDay">
        <option value="">すべて</option>
        <option v-for="day in availableDays" :key="day" :value="day">{{ day }}</option>
      </select>
    </div>

    <!-- 一括精算表示 -->
    <div v-for="(registrantData, index) in filteredSettlements" :key="index" class="settlement-block">
      <h2>
        {{ registrantData.registrant }}（
        {{ displayMode === 'actual' ? '支払合計: ' + registrantData.actualTotal : '支払合計: ' + registrantData.estimatedTotal }}円）
      </h2>
      <ul>
        <li v-for="(payment, idx) in registrantData.payments" :key="idx">
          {{ registrantData.registrant }} → {{ payment.to }} に
          {{ displayMode === 'actual' ? payment.actualAmount : payment.amount }}円 支払い
        </li>
      </ul>
    </div>

    <!-- 個別精算 -->
    <div class="individual-section">
      <h2>個別精算計算</h2>

      <label>登録者（支払う人）:</label>
      <select v-model="individualRegistrant">
        <option value="">選択してください</option>
        <option v-for="r in registrants" :key="r" :value="r">{{ r }}</option>
      </select>

      <label>購入者（受け取る人）:</label>
      <select v-model="individualBuyer">
        <option value="">選択してください</option>
        <option v-for="b in buyers" :key="b" :value="b">{{ b }}</option>
      </select>

      <label>日付:</label>
      <select v-model="individualDay">
        <option value="">すべて</option>
        <option v-for="day in availableDays" :key="day" :value="day">{{ day }}</option>
      </select>

      <button @click="calculateIndividualPayment">計算</button>

      <div v-if="individualResult" class="result-block">
        <p>購入金額ベース: {{ individualResult.actualAmount }}円</p>
        <p>金額ベース: {{ individualResult.amount }}円</p>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

const baseURL = process.env.VUE_APP_API_BASE_URL

export default {
  name: 'SettlementPage',
  data() {
    return {
      settlements: [],
      buyers: [],
      registrants: [],
      selectedBuyer: '',
      selectedRegistrant: '',
      selectedDay: '',
      displayMode: 'actual',
      individualBuyer: '',
      individualRegistrant: '',
      individualDay: '',
      individualResult: null,
      availableDays: ['1日目', '2日目']
    };
  },
  computed: {
    filteredSettlements() {
      return this.settlements
        .filter(s =>
          (!this.selectedRegistrant || s.registrant === this.selectedRegistrant)
        )
        .map(s => ({
          ...s,
          payments: s.payments.filter(p =>
            (!this.selectedBuyer || p.to === this.selectedBuyer) &&
            (!this.selectedDay || p.day === this.selectedDay)
          )
        }))
        .filter(s => s.payments.length > 0);
    }
  },
  async created() {
    const [settlementRes, usersRes] = await Promise.all([
      axios.get(`${baseURL}/settlement`),
      axios.get(`${baseURL}/users`)
    ]);
    this.settlements = settlementRes.data;
    this.buyers = usersRes.data.buyers;
    this.registrants = usersRes.data.registrants;
  },
  methods: {
    async calculateIndividualPayment() {
      if (!this.individualBuyer || !this.individualRegistrant) return;

      const res = await axios.get(`${baseURL}/payment`, {
        params: {
          buyer: this.individualBuyer,
          registrant: this.individualRegistrant,
          day: this.individualDay
        }
      });
      this.individualResult = res.data;
    }
  }
};
</script>

<style scoped>
.settlement-page {
  padding: 16px;
  font-family: sans-serif;
}

.filter-group,
.individual-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 24px;
}

select,
button {
  padding: 8px;
  font-size: 1rem;
  width: 100%;
  box-sizing: border-box;
}

.settlement-block {
  margin-bottom: 20px;
}

.result-block {
  margin-top: 10px;
  background: #f0f0f0;
  padding: 10px;
  border-radius: 6px;
}

@media (max-width: 600px) {
  h1 {
    font-size: 1.5rem;
  }

  h2 {
    font-size: 1.2rem;
  }

  select,
  button {
    font-size: 1rem;
  }
}
</style>
