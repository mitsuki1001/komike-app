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
      <p>優先度: {{ circle.priority_label }}</p>
      <p>金額: {{ circle.amount }}</p>
      <p>メモ: {{ circle.memo }}</p>
      <p>登録者: {{ circle.registrant }}</p>
      <p>購入者: {{ circle.buyer || '未入力' }}</p>
      <p>購入金額: {{ circle.actual_amount != null ? circle.actual_amount + '円' : '未入力' }}</p>

      <div v-if="circle.menu && circle.menu.length">
        <img
          :src="`data:image/png;base64,${circle.menu[currentImageIndex]}`"
          alt="Menu Image"
          style="max-width: 200px;"
          @click="openImageModal(circle.menu[currentImageIndex])"
        />
        <div>
          <button @click="prevImage" :disabled="currentImageIndex === 0">←</button>
          <button @click="nextImage" :disabled="currentImageIndex === circle.menu.length - 1">→</button>
        </div>
        <p>{{ currentImageIndex + 1 }} / {{ circle.menu.length }}</p>
      </div>

      <button @click="isEditing = true">編集</button>
      <button @click="completeCircle" style="margin-left: 10px;">完了</button>
    </div>

    <!-- モーダル表示 -->
    <div v-if="showImageModal" class="modal-overlay" @click="closeImageModal">
      <img :src="modalImageSrc" class="modal-image" />
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
        <label><input type="radio" value="南" v-model="form.area" required /> 南</label>
        <label>場所: <input v-model="form.place" required /></label><br />
        <label for="priority">優先度:</label>
        <select id="priority" v-model="form.priorityLabel" @change="updatePriorityValue">
          <option value="最優先">最優先</option>
          <option value="できれば">できれば</option>
          <option value="余裕があれば">余裕があれば</option>
          <option value="不要になった">不要になった</option>
        </select><br />
        <label>金額: <input v-model.number="form.amount" type="number" required /></label><br />
        <label>メモ: <textarea v-model="form.memo"></textarea></label><br />
        <label>登録者: <input v-model="form.registrant" required /></label><br />
        <label>購入者: <input v-model="form.buyer" /></label><br />
        <label>購入金額: <input v-model.number="form.actualAmount" type="number" required /></label><br />

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
        day: '',
        priorityLabel: '最優先',
        priorityValue: 10,
        buyer: '',
        actualAmount: null
      },
      priorityMap: {
        '最優先': 10,
        'できれば': 7,
        '余裕があれば': 4,
        '不要になった': 1
      },
      editableImages: [], // 編集用の既存画像
      newMenuFiles: [],
      showImageModal: false,
      modalImageSrc: ''
    };
  },
  created() {
    this.fetchCircle();
  },
  methods: {
    updatePriorityValue() {
      this.form.priorityValue = this.priorityMap[this.form.priorityLabel];
    },
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
          day: data.day,
          priorityLabel: data.priorityLabel || '最優先',
          priorityValue: data.priorityValue || 10,
          buyer: data.buyer || '',
          actualAmount: data.actualAmount || null
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
        formData.append('day', this.form.day);
        formData.append('priorityLabel', this.form.priorityLabel);
        formData.append('priorityValue', this.form.priorityValue);
        formData.append('buyer', this.form.buyer);
        formData.append('actualAmount', this.form.actualAmount);

        // ✅ 既存画像（Base64）を Blob に変換して追加
        this.editableImages.forEach((base64, index) => {
          const byteString = atob(base64);
          const arrayBuffer = new ArrayBuffer(byteString.length);
          const intArray = new Uint8Array(arrayBuffer);
          for (let i = 0; i < byteString.length; i++) {
            intArray[i] = byteString.charCodeAt(i);
          }
          const blob = new Blob([intArray], { type: 'image/png' });
          formData.append('menu', blob, `existing-${index}.png`);
        });

        // ✅ 新規画像ファイルも追加
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
        day: this.circle.day,
        buyer: this.circle.buyer || '',
        actualAmount: this.circle.actualAmount || null
      };
      this.editableImages = [...this.circle.menu];
      this.newMenuFiles = [];
    },
    prevImage() {
      if (this.currentImageIndex > 0) this.currentImageIndex--;
    },
    nextImage() {
      if (this.currentImageIndex < this.circle.menu.length - 1) this.currentImageIndex++;
    },
    openImageModal(src) {
      this.modalImageSrc = `data:image/png;base64,${src}`;
      this.showImageModal = true;
    },
    closeImageModal() {
      this.showImageModal = false;
      this.modalImageSrc = '';
    },
  }
};
// 完了更新
async completeCircle() {
  const id = this.$route.params.id;
  try {
    const response = await axios.put(`${baseURL}/circle/${id}/complete`);
    const updated = response.data;

    this.circle = updated;

    alert("完了にしました（購入金額を自動入力しました）");
  } catch (error) {
    console.error("完了更新エラー:", error);
    alert("完了処理に失敗しました");
  }
}
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

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

.modal-image {
  max-width: 90%;
  max-height: 90%;
  border-radius: 8px;
  box-shadow: 0 0 10px #000;
}

</style>
