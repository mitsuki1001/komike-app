<template>
  <div class="ocr-container">
    <h1>画像文字認識（OCR）</h1>

    <input type="file" @change="handleFileChange" accept="image/*" />
    <button @click="sendImageForOCR" :disabled="!selectedFile">OCR実行</button>

    <div v-if="loading">読み取り中...</div>
    <div v-if="recognizedText">
      <h2>認識されたテキスト:</h2>
      <pre>{{ recognizedText }}</pre>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

const baseURL = process.env.VUE_APP_API_BASE_URL

export default {
  name: 'OcrViewer',
  data() {
    return {
      selectedFile: null,
      recognizedText: '',
      loading: false
    };
  },
  methods: {
    handleFileChange(event) {
      this.selectedFile = event.target.files[0];
    },
    async sendImageForOCR() {
      if (!this.selectedFile) return;

      this.loading = true;
      this.recognizedText = '';

      const formData = new FormData();
      formData.append('image', this.selectedFile);

      try {
        const response = await axios.post(`${baseURL}/circle/ocr`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        this.recognizedText = response.data.text;
      } catch (error) {
        console.error('OCRエラー:', error);
        this.recognizedText = 'OCRに失敗しました。';
      } finally {
        this.loading = false;
      }
    }
  }
};
</script>

<style scoped>
.ocr-container {
  padding: 20px;
  max-width: 600px;
  margin: auto;
}
pre {
  background: #f4f4f4;
  padding: 10px;
  white-space: pre-wrap;
}
</style>
