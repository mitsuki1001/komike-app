<template>
  <div>
    <h1>ユーザー登録</h1>

    <form @submit.prevent="register">
      <div>
        <label>ユーザー名</label>
        <input
          v-model="name"
          required
        />
      </div>

      <div>
        <label>パスワード</label>
        <input
          v-model="password"
          type="password"
          required
        />
      </div>

      <div>
        <label>パスワード確認</label>
        <input
          v-model="confirmPassword"
          type="password"
          required
        />
      </div>

      <button type="submit">
        登録
      </button>
    </form>

    <router-link to="/user-login">
      ログインへ
    </router-link>
  </div>
</template>

<script>
import axios from 'axios';

// const baseURL = 'http://localhost:3000';
const baseURL = process.env.VUE_APP_API_BASE_URL;

export default {
  name: 'UserRegister',

  data() {
    return {
      name: '',
      password: '',
      confirmPassword: ''
    };
  },

  methods: {
    async register() {

      if (this.password !== this.confirmPassword) {
        alert('パスワードが一致しません');
        return;
      }

      try {

        await axios.post(
          `${baseURL}/register`,
          {
            name: this.name,
            password: this.password
          }
        );

        alert('ユーザー登録が完了しました');

        this.$router.push('/user-login');

      } catch (error) {

        console.error(error);

        alert(
          error.response?.data?.message ||
          '登録に失敗しました'
        );

      }
    }
  }
};
</script>