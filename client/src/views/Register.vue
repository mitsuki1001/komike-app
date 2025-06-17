<template>
  <div>
    <h1>サークル 登録フォーム</h1>
    <form @submit.prevent="addCircle">
      <div>
        <label>日付:</label>
        <div class="day-radio-group">
          <label><input type="radio" value="1日目" v-model="form.day" required /> 1日目</label>
          <label><input type="radio" value="2日目" v-model="form.day" required /> 2日目</label>
        </div>
      </div>
      <div>
        <label for="name">サークル名:</label>
        <input id="name" v-model="form.name" type="text" required />
      </div>
      <div>
        <label>エリア:</label>
        <div class="area-radio-group">
          <label><input type="radio" value="東" v-model="form.area" required /> 東</label>
          <label><input type="radio" value="西" v-model="form.area" required /> 西</label>
          <label><input type="radio" value="南" v-model="form.area" required /> 南</label> 
        </div>
      </div>
      <div>
        <label for="place">場所:</label>
        <input id="place" v-model="form.place" type="text" required />
      </div>
      <div>
        <label for="amount">金額:</label>
        <input id="amount" v-model.number="form.amount" type="number" required />
      </div>
      <div>
        <label for="memo">メモ:</label>
        <textarea id="memo" v-model="form.memo"></textarea>
      </div>
      <div>
        <label for="registrant">登録者:</label>
        <input id="registrant" v-model="form.registrant" type="text" required />
      </div>
      <div>
        <label for="menu">お品書き (画像複数可):</label>
        <input id="menu" type="file" @change="handleFileChange" accept="image/*" multiple />
      </div>
      <button type="submit">登録</button>
    </form>
  </div>
</template>

<script>
import axios from 'axios';

const baseURL = process.env.VUE_APP_API_BASE_URL

export default {
  name: 'RegisterForm',
  data() {
    return {
      form: {
        name: '',
        place: '',
        amount: null,
        memo: '',
        registrant: '',
        area: '',
        day:''
      },
      menuFiles: []
    };
  },
  methods: {
    handleFileChange(event) {
      this.menuFiles = Array.from(event.target.files);
    },
    async addCircle() {
      try {
        const formData = new FormData();
        formData.append('day', this.form.day); // ← 追加
        formData.append('name', this.form.name);
        formData.append('area', this.form.area);
        formData.append('place', this.form.place);
        formData.append('amount', this.form.amount);
        formData.append('memo', this.form.memo);
        formData.append('registrant', this.form.registrant);
        this.menuFiles.forEach(file => {
          formData.append('menu', file);
        });

        const response = await axios.post(`${baseURL}/circle', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });

        console.log('登録成功:', response.data);
        alert('登録が完了しました。');
        this.form = { name: '', place: '', amount: null, memo: '' };
        this.menuFiles = [];
      } catch (error) {
        console.error('登録エラー:', error);
        alert('登録に失敗しました。');
      }
    }
  }
};
</script>

<style scoped>
label {
  display: block;
  margin: 5px 0;
}
input,
textarea {
  margin-bottom: 10px;
  padding: 5px;
  width: 300px;
}
button {
  padding: 5px 10px;
  font-size: 1rem;
}

.area-radio-group {
  display: flex;
  justify-content: flex-start;
  gap: 20px;
  margin-bottom: 10px;
  flex-wrap: wrap;
  padding-left: 0;
  margin-left: 0;
}

.area-radio-group label {
  display: inline-flex;
  align-items: center;
  white-space: nowrap;
  width: 80px;
}
.day-radio-group {
  display: flex;
  gap: 20px;
  margin-bottom: 10px;
}
.day-radio-group label {
  display: inline-flex;
  align-items: center;
  white-space: nowrap;
  width: 100px;
}


</style>
