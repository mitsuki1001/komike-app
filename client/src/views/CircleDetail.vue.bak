<template>
  <div>
    <h1>サークル 詳細</h1>

    <!-- 表示モード -->
    <div v-if="!isEditing && circle">
      <p>ID: {{ circle.id }}</p>
      <p><strong>日付:</strong> {{ circle.day }}</p>
      <p>サークル名: {{ circle.name }}</p>
      <p>エリア: {{ circle.area }}</p>
      <p>場所: {{ circle.place }}</p>
      <p>金額: {{ circle.amount }}</p>
      <p>メモ: {{ circle.memo }}</p>
      <p>登録者: {{ circle.registrant }}</p>

      <div v-if="circle.menu && circle.menu.length">
        <img
          :src="`data:image/png;base64,${circle.menu[currentImageIndex]}`"
          alt="Menu Image"
          style="max-width: 200px;"
        />
        <div>
          <button @click="prevImage" :disabled="currentImageIndex === 0">←</button>
          <button @click="nextImage" :disabled="currentImageIndex === circle.menu.length - 1">→</button>
        </div>
        <p>{{ currentImageIndex + 1 }} / {{ circle.menu.length }}</p>
      </div>

      <button @click="isEditing = true">編集</button>
    </div>

    <!-- 編集モード -->
    <div v-else-if="isEditing">
      <form @submit.prevent="updateCircle">
        <label>Name: <input v-model="form.name" required /></label><br />
        <label>日付:</label>
        <label><input type="radio" value="1日目" v-model="form.day" required /> 1日目</label>
        <label><input type="radio" value="2日目" v-model="form.day" required /> 2日目</label>
        <label>エリア:</label>
        <label><input type="radio" value="東" v-model="form.area" required /> 東</label>
        <label><input type="radio" value="西" v-model="form.area" required /> 西</label>
        <label>Place: <input v-model="form.place" required /></label><br />
        <label>Amount: <input v-model.number="form.amount" type="number" required /></label><br />
        <label>Memo: <textarea v-model="form.memo"></textarea></label><br />
        <label>登録者: <input v-model="form.registrant" required /></label><br />

        <div>
          <p>既存画像（削除可能）:</p>
          <div v-for="(img, index) in editableImages" :key="index" style="margin-bottom: 10px;">
            <img :src="`data:image/png;base64,${img}`" style="max-width: 150px;" />
            <button type="button" @click="removeImage(index)">削除</button>
          </div>
        </div>

        <label>画像を追加:
          <input type="file" @change="handleFileChange" accept="image/*" multiple />
        </label><br />

        <button type="submit">保存</button>
        <button type="button" @click="cancelEdit">キャンセル</button>
      </form>
    </div>

    <router-link to="/circles">一覧に戻る</router-link>
  </div>
</template>

<script>
import axios from 'axios';

const baseURL = process.env.VUE_APP_API_BASE_URL

export default {
  name: 'CircleDetail',
  data() {
    return {
      circle: null,
      currentImageIndex: 0,
      isEditing: false,
      form: {
        name: '',
        place: '',
        amount: null,
        memo: '',
        registrant: '',
        area: '',
        day: ''
      },
      editableImages: [], // 編集用の既存画像
      newMenuFiles: []
    };
  },
  created() {
    this.fetchCircle();
  },
  methods: {
    async fetchCircle() {
      const id = this.$route.params.id;
      try {
        const response = await axios.get(`${baseURL}/circle/${id}`);
        const data = response.data;
        if (typeof data.menu === 'string') {
          data.menu = JSON.parse(data.menu);
        }
        this.circle = data;
        this.form = {
          name: data.name,
          place: data.place,
          amount: data.amount,
          memo: data.memo,
          registrant: data.registrant,
          area: data.area,
          day: data.day
        };
        this.editableImages = [...data.menu];
      } catch (error) {
        console.error('詳細取得エラー:', error);
      }
    },
    handleFileChange(event) {
      this.newMenuFiles = Array.from(event.target.files);
    },
    removeImage(index) {
      this.editableImages.splice(index, 1);
    },
    async updateCircle() {
      const id = this.$route.params.id;
      try {
        const formData = new FormData();
        formData.append('name', this.form.name);
        formData.append('area', this.form.area); 
        formData.append('place', this.form.place);
        formData.append('amount', this.form.amount);
        formData.append('memo', this.form.memo);
        formData.append('registrant', this.form.registrant);
        formData.append('existingMenu', JSON.stringify(this.editableImages));
        formData.append('day', this.form.day); // ← 追加
        this.newMenuFiles.forEach(file => {
          formData.append('menu', file);
        });

        const response = await axios.put(`${baseURL}/circle/${id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        const updated = response.data;
        if (typeof updated.menu === 'string') {
          updated.menu = JSON.parse(updated.menu);
        }
        this.circle = updated;
        this.isEditing = false;
        this.newMenuFiles = [];
        this.editableImages = [...updated.menu];
        alert('更新が完了しました。');
      } catch (error) {
        console.error('更新エラー:', error);
        alert('更新に失敗しました。');
      }
    },
    cancelEdit() {
      this.isEditing = false;
      this.form = {
        name: this.circle.name,
        place: this.circle.place,
        amount: this.circle.amount,
        memo: this.circle.memo,
        registrant: this.circle.registrant,
        area: this.circle.area,
        day: this.circle.day
      };
      this.editableImages = [...this.circle.menu];
      this.newMenuFiles = [];
    },
    prevImage() {
      if (this.currentImageIndex > 0) this.currentImageIndex--;
    },
    nextImage() {
      if (this.currentImageIndex < this.circle.menu.length - 1) this.currentImageIndex++;
    }
  }
};
</script>

<style scoped>
p {
  margin: 5px 0;
}
form label {
  display: block;
  margin: 8px 0;
}
button {
  margin: 5px;
}
</style>
