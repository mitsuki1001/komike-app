<template>
  <div class="quiz-container">
    <h2>🎵 クイズに挑戦！（最大3回まで表示）</h2>

    <button @click="showNextLines" :disabled="displayCount >= maxDisplay || answerMode">
      {{ displayCount + 1 }} 回目の表示
    </button>
    <button @click="enterAnswerMode" :disabled="displayCount === 0 || answerMode">
      回答モードへ
    </button>

    <div v-if="maskedLines.length">
      <h3>表示された行：</h3>
      <div v-for="(lines, idx) in maskedLines" :key="idx" class="display-block">
        <h4>🕒 第 {{ idx + 1 }} 回目（{{ shownInfo[idx].start }}〜{{ shownInfo[idx].end }}行目）</h4>
        <ul class="no-bullets">
          <li v-for="(line, i) in lines" :key="i">{{ line }}</li>
        </ul>
      </div>
    </div>

    <div v-if="answerMode">
      <input
        v-model="userInput"
        placeholder="元のファイル名を入力（拡張子なし）"
        class="answer-input"
      />
      <button @click="checkAnswer">回答する</button>
      <p v-if="message" class="result-message">{{ message }}</p>

      <div v-if="showFullAnswer && maskedLines.length">
        <h3>表示された全文（答え）:</h3>
        <div v-for="(info, idx) in shownInfo" :key="idx" class="display-block">
          <h4>🕒 第 {{ idx + 1 }} 回目（{{ info.start }}〜{{ info.end }}行目）</h4>
          <ul class="no-bullets">
            <li v-for="(line, i) in allLines.slice(info.start - 1, info.end)" :key="i">
              {{ line }}
            </li>
          </ul>
        </div>
      </div>

      <p class="score-message">🎯 この回の得点: {{ score }}点</p>
      <button @click="startNewQuiz">🔄 新しい問題に進む</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';

const fileList = ref([]);
const selectedFile = ref('');
const correctAnswer = ref('');
const allLines = ref([]);
const maskedLines = ref([]); // 2次元配列に変更
const displayCount = ref(0);
const maxDisplay = 3;
const answerMode = ref(false);
const userInput = ref('');
const message = ref('');
const score = ref(0);
const shownInfo = ref([]);
const showFullAnswer = ref(false);

async function loadFileList() {
  const res = await axios.get('http://localhost:3000/quiz-files');
  fileList.value = res.data;
}

async function startNewQuiz() {
  answerMode.value = false;
  displayCount.value = 0;
  maskedLines.value = [];
  userInput.value = '';
  message.value = '';
  score.value = 0;
  shownInfo.value = [];
  showFullAnswer.value = false;

  if (fileList.value.length === 0) await loadFileList();

  selectedFile.value = fileList.value[Math.floor(Math.random() * fileList.value.length)];
  correctAnswer.value = selectedFile.value.replace('.txt', '');

  const res = await axios.get(`http://localhost:3000/quiz-files/${selectedFile.value}`);
  allLines.value = res.data.split('\n').filter(line => line.trim() !== '');
}

function showNextLines() {
  const totalLines = allLines.value.length;
  const numLines = Math.floor(Math.random() * 3) + 1;
  const start = Math.floor(Math.random() * (totalLines - numLines));
  const selected = allLines.value.slice(start, start + numLines);

  const masked = selected.map(line =>
    line.replaceAll(correctAnswer.value, '*****').replaceAll('・', '')
  );

  maskedLines.value.push(masked);
  shownInfo.value.push({ start: start + 1, end: start + numLines });
  displayCount.value++;
}

function enterAnswerMode() {
  answerMode.value = true;
}

function normalize(text) {
  return text.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
}

function evaluateAnswer(userAnswer, correctAnswer) {
  const trimmed = userAnswer.trim();
  if (!trimmed) {
    return { match: 'wrong', penalty: null };
  }

  if (trimmed.toLowerCase() === correctAnswer.toLowerCase()) {
    return { match: 'perfect', penalty: 0 };
  } else if (normalize(trimmed) === normalize(correctAnswer)) {
    return { match: 'partial', penalty: 1 };
  } else {
    return { match: 'wrong', penalty: null };
  }
}

function checkAnswer() {
  const result = evaluateAnswer(userInput.value, correctAnswer.value);
  const basePoint = Math.max(10 - (displayCount.value - 1) * 3, 0);

  if (result.match === 'perfect') {
    score.value = basePoint;
    message.value = `✅ 完全一致！正解は「${correctAnswer.value}」です。得点: ${score.value}点`;
  } else if (result.match === 'partial') {
    score.value = Math.max(basePoint - result.penalty, 0);
    message.value = `⚠ 部分一致 → 正解は「${correctAnswer.value}」です。得点: ${score.value}点`;
  } else {
    score.value = 0;
    message.value = `❌ 不正解です。正解は「${correctAnswer.value}」でした。得点: 0点`;
  }

  showFullAnswer.value = true;
}

onMounted(startNewQuiz);
</script>

<style scoped>
.quiz-container {
  max-width: 600px;
  margin: auto;
  padding: 1rem;
  font-family: sans-serif;
}
.answer-input {
  margin-top: 1rem;
  padding: 0.5rem;
  width: 100%;
}
.result-message {
  margin-top: 1rem;
  font-weight: bold;
}
.score-message {
  margin-top: 1rem;
  font-size: 1.1rem;
  font-weight: bold;
  color: #2c3e50;
}
.no-bullets {
  list-style-type: none;
  padding-left: 0;
}
.display-block {
  border: 1px solid #ccc;
  padding: 0.5rem;
  margin-bottom: 1rem;
  background-color: #f9f9f9;
}
.display-block h4 {
  margin: 0 0 0.5rem;
  font-weight: bold;
  color: #333;
}
</style>
